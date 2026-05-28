require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const path = require("path");
const auth = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_DIST_PATH = path.resolve(__dirname, "..", "frontend", "dist");

app.use(cors());
app.use(express.json());

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cpss1",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: true };
}

const pool = mysql.createPool(poolConfig);
let dbAvailable = false;

async function initializeDatabase() {
  await pool.query("SELECT 1");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS simulations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      moduleType VARCHAR(100) NOT NULL,
      inputs JSON NOT NULL,
      results JSON NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "7d" }
  );
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function saveSimulation(userId, moduleType, inputs, results) {
  if (!dbAvailable) return;
  await pool.query(
    `INSERT INTO simulations (user_id, moduleType, inputs, results)
     VALUES (?, ?, CAST(? AS JSON), CAST(? AS JSON))`,
    [userId, moduleType, JSON.stringify(inputs), JSON.stringify(results)]
  );
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CPSS backend", dbAvailable });
});

app.post("/api/auth/register", async (req, res) => {
  if (!dbAvailable) {
    return res.status(503).json({ message: "Database is unavailable. Please try again later." });
  }
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );

    const user = { id: result.insertId, email };
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  if (!dbAvailable) {
    return res.status(503).json({ message: "Database is unavailable. Please try again later." });
  }
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await pool.query("SELECT id, email, password FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signToken({ id: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

function pasquillSigma(distance, stability) {
  const x = Math.max(distance, 1);
  const coeff = {
    A: { ay: 0.22, by: 0.5, az: 0.2, bz: 1.0 },
    B: { ay: 0.16, by: 0.5, az: 0.12, bz: 1.0 },
    C: { ay: 0.11, by: 0.5, az: 0.08, bz: 1.0 },
    D: { ay: 0.08, by: 0.5, az: 0.06, bz: 1.0 },
    E: { ay: 0.06, by: 0.5, az: 0.03, bz: 1.0 },
    F: { ay: 0.04, by: 0.5, az: 0.016, bz: 1.0 }
  };
  const c = coeff[String(stability || "D").toUpperCase()] || coeff.D;
  const sigmaY = c.ay * Math.pow(x, c.by);
  const sigmaZ = c.az * Math.pow(x, c.bz);
  return { sigmaY, sigmaZ };
}

app.post("/api/plume", auth, async (req, res) => {
  try {
    const inputs = {
      stackHeight: toNumber(req.body.stackHeight),
      emissionRate: toNumber(req.body.emissionRate),
      windSpeed: toNumber(req.body.windSpeed, 1),
      stability: (req.body.stability || "D").toUpperCase()
    };

    const points = [];
    for (let d = 100; d <= 5000; d += 100) {
      const { sigmaY, sigmaZ } = pasquillSigma(d, inputs.stability);
      const concentration =
        (inputs.emissionRate / (Math.PI * inputs.windSpeed * sigmaY * sigmaZ)) *
        Math.exp(-(Math.pow(inputs.stackHeight, 2) / (2 * Math.pow(sigmaZ, 2))));
      points.push({ distance: d, concentration });
    }

    const results = {
      maxConcentration: Math.max(...points.map((p) => p.concentration)),
      profile: points
    };

    await saveSimulation(req.user.id, "plume", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Plume simulation failed.", error: err.message });
  }
});

app.post("/api/heatexchanger", auth, async (req, res) => {
  try {
    const inputs = {
      th_in: toNumber(req.body.th_in),
      th_out: toNumber(req.body.th_out),
      tc_in: toNumber(req.body.tc_in),
      tc_out: toNumber(req.body.tc_out),
      u_val: toNumber(req.body.u_val),
      area: toNumber(req.body.area)
    };

    const dT1 = inputs.th_in - inputs.tc_out;
    const dT2 = inputs.th_out - inputs.tc_in;
    const lmtd =
      Math.abs(dT1 - dT2) < 1e-9 ? dT1 : (dT1 - dT2) / Math.log(Math.max(dT1, 1e-9) / Math.max(dT2, 1e-9));
    const heatDuty = inputs.u_val * inputs.area * lmtd;
    const effectiveness = clamp(((inputs.th_in - inputs.th_out) / Math.max(inputs.th_in - inputs.tc_in, 1e-9)) * 100, 0, 100);

    const results = { dT1, dT2, lmtd, heatDuty, effectiveness };
    await saveSimulation(req.user.id, "heatexchanger", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Heat exchanger simulation failed.", error: err.message });
  }
});

app.post("/api/pipeflow", auth, async (req, res) => {
  try {
    const inputs = {
      diameter: toNumber(req.body.diameter),
      length: toNumber(req.body.length),
      roughness: toNumber(req.body.roughness),
      velocity: toNumber(req.body.velocity),
      density: toNumber(req.body.density),
      viscosity: toNumber(req.body.viscosity)
    };

    const reynolds = (inputs.density * inputs.velocity * inputs.diameter) / Math.max(inputs.viscosity, 1e-12);
    const frictionFactor =
      reynolds < 2300
        ? 64 / Math.max(reynolds, 1e-9)
        : 0.25 /
          Math.pow(
            Math.log10(
              inputs.roughness / (3.7 * Math.max(inputs.diameter, 1e-12)) +
                5.74 / Math.pow(reynolds, 0.9)
            ),
            2
          );
    const pressureDrop =
      frictionFactor *
      (inputs.length / Math.max(inputs.diameter, 1e-12)) *
      ((inputs.density * Math.pow(inputs.velocity, 2)) / 2);
    const volumetricFlow = (Math.PI * Math.pow(inputs.diameter, 2) * inputs.velocity) / 4;
    const pumpPower = pressureDrop * volumetricFlow;

    const results = { reynolds, frictionFactor, pressureDrop, volumetricFlow, pumpPower };
    await saveSimulation(req.user.id, "pipeflow", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Pipe flow simulation failed.", error: err.message });
  }
});

app.post("/api/cstr", auth, async (req, res) => {
  try {
    const inputs = {
      flowRate: toNumber(req.body.flowRate),
      targetConversion: toNumber(req.body.targetConversion),
      rateConstant: toNumber(req.body.rateConstant)
    };
    const conversion = clamp(inputs.targetConversion, 1e-6, 0.999999);
    const volume = (inputs.flowRate * conversion) / (Math.max(inputs.rateConstant, 1e-12) * (1 - conversion));
    const residenceTime = volume / Math.max(inputs.flowRate, 1e-12);

    const results = { volume, residenceTime };
    await saveSimulation(req.user.id, "cstr", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "CSTR simulation failed.", error: err.message });
  }
});

app.post("/api/flash", auth, async (req, res) => {
  try {
    const inputs = {
      z: toNumber(req.body.z),
      alpha: toNumber(req.body.alpha),
      vaporFraction: toNumber(req.body.vaporFraction)
    };

    const x = inputs.z / (1 + inputs.vaporFraction * (inputs.alpha - 1));
    const y = (inputs.alpha * x) / (1 + (inputs.alpha - 1) * x);
    const results = { liquidMoleFraction: x, vaporMoleFraction: y };

    await saveSimulation(req.user.id, "flash", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Flash simulation failed.", error: err.message });
  }
});

app.post("/api/ergun", auth, async (req, res) => {
  try {
    const inputs = {
      L: toNumber(req.body.L),
      Dp: toNumber(req.body.Dp),
      epsilon: toNumber(req.body.epsilon),
      v: toNumber(req.body.v),
      rho: toNumber(req.body.rho),
      mu: toNumber(req.body.mu)
    };

    const eps = clamp(inputs.epsilon, 1e-6, 0.999999);
    const term1 = (150 * inputs.mu * inputs.v * Math.pow(1 - eps, 2)) / (Math.pow(inputs.Dp, 2) * Math.pow(eps, 3));
    const term2 = (1.75 * inputs.rho * Math.pow(inputs.v, 2) * (1 - eps)) / (inputs.Dp * Math.pow(eps, 3));
    const dP_dL = term1 + term2;
    const totalPressureDrop = dP_dL * inputs.L;

    const results = { dP_dL, totalPressureDrop };
    await saveSimulation(req.user.id, "ergun", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Ergun simulation failed.", error: err.message });
  }
});

app.post("/api/fenske", auth, async (req, res) => {
  try {
    const inputs = {
      alpha: toNumber(req.body.alpha),
      xD: toNumber(req.body.xD),
      xB: toNumber(req.body.xB)
    };

    const xD = clamp(inputs.xD, 1e-9, 1 - 1e-9);
    const xB = clamp(inputs.xB, 1e-9, 1 - 1e-9);
    const numerator = Math.log((xD / (1 - xD)) / (xB / (1 - xB)));
    const denominator = Math.log(Math.max(inputs.alpha, 1 + 1e-9));
    const nMin = numerator / denominator;
    const results = { nMin };

    await saveSimulation(req.user.id, "fenske", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Fenske simulation failed.", error: err.message });
  }
});

app.post("/api/pid", auth, async (req, res) => {
  try {
    const inputs = {
      Kp: toNumber(req.body.Kp),
      tau_p: toNumber(req.body.tau_p),
      theta: toNumber(req.body.theta)
    };

    const pi_Kc = (0.9 * inputs.tau_p) / (Math.max(inputs.Kp, 1e-12) * Math.max(inputs.theta, 1e-12));
    const pi_tauI = 3.3 * inputs.theta;
    const pid_Kc = (1.2 * inputs.tau_p) / (Math.max(inputs.Kp, 1e-12) * Math.max(inputs.theta, 1e-12));
    const pid_tauI = 2.0 * inputs.theta;
    const pid_tauD = 0.5 * inputs.theta;
    const results = {
      pi: { Kc: pi_Kc, tauI: pi_tauI },
      pid: { Kc: pid_Kc, tauI: pid_tauI, tauD: pid_tauD }
    };

    await saveSimulation(req.user.id, "pid", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "PID tuning failed.", error: err.message });
  }
});

app.post("/api/transferfunction", auth, async (req, res) => {
  try {
    const inputs = {
      processGain: toNumber(req.body.processGain, 2.0),
      tau1: toNumber(req.body.tau1, 4.0),
      tau2: toNumber(req.body.tau2, 1.5),
      deadTime: toNumber(req.body.deadTime, 0.8)
    };

    const tau1 = Math.max(inputs.tau1, 1e-9);
    const tau2 = Math.max(inputs.tau2, 1e-9);
    const deadTime = Math.max(inputs.deadTime, 0);
    const a = tau1 * tau2;
    const b = tau1 + tau2;
    const c = 1;
    const disc = b * b - 4 * a * c;
    let poles = [];
    if (disc >= 0) {
      poles = [
        { real: (-b + Math.sqrt(disc)) / (2 * a), imag: 0 },
        { real: (-b - Math.sqrt(disc)) / (2 * a), imag: 0 }
      ];
    } else {
      const real = -b / (2 * a);
      const imag = Math.sqrt(Math.abs(disc)) / (2 * a);
      poles = [{ real, imag }, { real, imag: -imag }];
    }
    const transferFunction = `${inputs.processGain} * exp(-${deadTime}s) / ((${tau1}s+1)(${tau2}s+1))`;
    const results = {
      modelType: deadTime > 0 ? "SOPDT with dead time" : "SOPDT",
      transferFunction,
      numerator: [inputs.processGain],
      denominator: [a, b, c],
      steadyGain: inputs.processGain,
      poles
    };

    await saveSimulation(req.user.id, "transferfunction", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Transfer function simulation failed.", error: err.message });
  }
});

app.post("/api/laplace", auth, async (req, res) => {
  try {
    const inputs = {
      signalType: String(req.body.signalType || "step").toLowerCase(),
      amplitude: toNumber(req.body.amplitude, 1.0),
      decay: toNumber(req.body.decay, 1.0),
      omega: toNumber(req.body.omega, 1.0),
      sValue: toNumber(req.body.sValue, 1.0),
      tValue: toNumber(req.body.tValue, 1.0)
    };

    const sValue = Math.max(inputs.sValue, 1e-9);
    const decay = Math.max(inputs.decay, 1e-9);
    const omega = Math.max(inputs.omega, 1e-9);
    const tValue = Math.max(inputs.tValue, 0);

    let laplaceExpression = "";
    let valueAtS = 0;
    let timeDomainSample = 0;

    if (inputs.signalType === "ramp") {
      laplaceExpression = `${inputs.amplitude}/s^2`;
      valueAtS = inputs.amplitude / (sValue * sValue);
      timeDomainSample = inputs.amplitude * tValue;
    } else if (inputs.signalType === "impulse") {
      laplaceExpression = `${inputs.amplitude}`;
      valueAtS = inputs.amplitude;
      timeDomainSample = tValue === 0 ? inputs.amplitude : 0;
    } else if (inputs.signalType === "exponential") {
      laplaceExpression = `${inputs.amplitude}/(s+${decay})`;
      valueAtS = inputs.amplitude / (sValue + decay);
      timeDomainSample = inputs.amplitude * Math.exp(-decay * tValue);
    } else if (inputs.signalType === "sine") {
      laplaceExpression = `${inputs.amplitude * omega}/(s^2+${omega * omega})`;
      valueAtS = (inputs.amplitude * omega) / (sValue * sValue + omega * omega);
      timeDomainSample = inputs.amplitude * Math.sin(omega * tValue);
    } else {
      laplaceExpression = `${inputs.amplitude}/s`;
      valueAtS = inputs.amplitude / sValue;
      timeDomainSample = inputs.amplitude;
    }

    const results = { signalType: inputs.signalType, laplaceExpression, valueAtS, timeDomainSample };
    await saveSimulation(req.user.id, "laplace", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Laplace transform simulation failed.", error: err.message });
  }
});

app.post("/api/dynamicresponse", auth, async (req, res) => {
  try {
    const inputs = {
      processGain: toNumber(req.body.processGain, 2.0),
      tau: toNumber(req.body.tau, 6.0),
      deadTime: toNumber(req.body.deadTime, 1.0),
      stepSize: toNumber(req.body.stepSize, 1.0),
      horizon: toNumber(req.body.horizon, 40)
    };

    const tau = Math.max(inputs.tau, 1e-9);
    const deadTime = Math.max(inputs.deadTime, 0);
    const horizon = Math.max(inputs.horizon, 1);

    const profile = [];
    const points = 80;
    for (let i = 0; i <= points; i++) {
      const t = (horizon * i) / points;
      const y = t < deadTime ? 0 : inputs.processGain * inputs.stepSize * (1 - Math.exp(-(t - deadTime) / tau));
      profile.push({ t, y });
    }

    const finalValue = inputs.processGain * inputs.stepSize;
    const riseTime90 = deadTime + 2.303 * tau;
    const settlingTime = deadTime + 4 * tau;
    const results = { finalValue, riseTime90, settlingTime, profile };

    await saveSimulation(req.user.id, "dynamicresponse", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Dynamic response simulation failed.", error: err.message });
  }
});

app.post("/api/firstorder", auth, async (req, res) => {
  try {
    const inputs = {
      processGain: toNumber(req.body.processGain, 1.6),
      tau: toNumber(req.body.tau, 5.0),
      stepSize: toNumber(req.body.stepSize, 1.0),
      horizon: toNumber(req.body.horizon, 30)
    };

    const tau = Math.max(inputs.tau, 1e-9);
    const horizon = Math.max(inputs.horizon, 1);
    const finalValue = inputs.processGain * inputs.stepSize;
    const y63 = 0.632 * finalValue;
    const riseTime1090 = 2.2 * tau;
    const settlingTime = 4 * tau;

    const profile = [];
    const points = 70;
    for (let i = 0; i <= points; i++) {
      const t = (horizon * i) / points;
      const y = finalValue * (1 - Math.exp(-t / tau));
      profile.push({ t, y });
    }

    const results = { finalValue, y63, riseTime1090, settlingTime, profile };
    await saveSimulation(req.user.id, "firstorder", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "First-order simulation failed.", error: err.message });
  }
});

app.post("/api/secondorder", auth, async (req, res) => {
  try {
    const inputs = {
      processGain: toNumber(req.body.processGain, 1.0),
      zeta: toNumber(req.body.zeta, 0.4),
      wn: toNumber(req.body.wn, 0.8),
      stepSize: toNumber(req.body.stepSize, 1.0),
      horizon: toNumber(req.body.horizon, 40)
    };

    const zeta = Math.max(inputs.zeta, 1e-6);
    const wn = Math.max(inputs.wn, 1e-6);
    const horizon = Math.max(inputs.horizon, 1);
    const finalValue = inputs.processGain * inputs.stepSize;

    let overshoot = 0;
    let peakTime = 0;
    let settlingTime = zeta > 0 ? 4 / (zeta * wn) : Infinity;
    let dampedFrequency = 0;

    const profile = [];
    const points = 100;
    for (let i = 0; i <= points; i++) {
      const t = (horizon * i) / points;
      let y = 0;
      if (zeta < 1) {
        const wd = wn * Math.sqrt(1 - zeta * zeta);
        const phi = Math.acos(zeta);
        y = finalValue * (1 - (1 / Math.sqrt(1 - zeta * zeta)) * Math.exp(-zeta * wn * t) * Math.sin(wd * t + phi));
        dampedFrequency = wd;
      } else if (Math.abs(zeta - 1) < 1e-6) {
        y = finalValue * (1 - Math.exp(-wn * t) * (1 + wn * t));
      } else {
        const root = Math.sqrt(zeta * zeta - 1);
        const r1 = -wn * (zeta - root);
        const r2 = -wn * (zeta + root);
        y = finalValue * (1 - ((r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)));
      }
      profile.push({ t, y });
    }

    if (zeta < 1) {
      overshoot = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) * 100;
      peakTime = Math.PI / Math.max(dampedFrequency, 1e-12);
    }

    const results = { finalValue, overshoot, peakTime, settlingTime, dampedFrequency, profile };
    await saveSimulation(req.user.id, "secondorder", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Second-order simulation failed.", error: err.message });
  }
});

app.post("/api/controllertuning", auth, async (req, res) => {
  try {
    const inputs = {
      processGain: toNumber(req.body.processGain, 1.5),
      tau: toNumber(req.body.tau, 8.0),
      theta: toNumber(req.body.theta, 1.2),
      ku: toNumber(req.body.ku, 2.4),
      pu: toNumber(req.body.pu, 4.0),
      lambda: toNumber(req.body.lambda, 5.0)
    };

    const processGain = Math.max(inputs.processGain, 1e-12);
    const tau = Math.max(inputs.tau, 1e-9);
    const theta = Math.max(inputs.theta, 1e-9);
    const ku = Math.max(inputs.ku, 1e-9);
    const pu = Math.max(inputs.pu, 1e-9);
    const lambda = Math.max(inputs.lambda, 1e-9);

    const znPI = { Kc: 0.45 * ku, Ti: pu / 1.2 };
    const znPID = { Kc: 0.6 * ku, Ti: pu / 2, Td: pu / 8 };
    const imcPI = { Kc: tau / (processGain * (lambda + theta)), Ti: tau + theta / 2 };
    const imcPID = {
      Kc: (tau + theta / 2) / (processGain * (lambda + theta / 2)),
      Ti: tau + theta / 2,
      Td: (tau * theta) / Math.max(2 * tau + theta, 1e-12)
    };

    const results = { znPI, znPID, imcPI, imcPID };
    await saveSimulation(req.user.id, "controllertuning", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Controller tuning simulation failed.", error: err.message });
  }
});

app.post("/api/stabilityanalysis", auth, async (req, res) => {
  try {
    const inputs = {
      a3: toNumber(req.body.a3, 1),
      a2: toNumber(req.body.a2, 6),
      a1: toNumber(req.body.a1, 11),
      a0: toNumber(req.body.a0, 6)
    };

    const positivity = inputs.a3 > 0 && inputs.a2 > 0 && inputs.a1 > 0 && inputs.a0 > 0;
    const marginTerm = inputs.a2 * inputs.a1 - inputs.a3 * inputs.a0;
    const stable = positivity && marginTerm > 0;
    const routhS1 = marginTerm / Math.max(inputs.a2, 1e-12);
    const results = { marginTerm, routhS1, stable, status: stable ? "Stable" : "Unstable" };

    await saveSimulation(req.user.id, "stabilityanalysis", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Stability analysis failed.", error: err.message });
  }
});

app.post("/api/rootlocus", auth, async (req, res) => {
  try {
    const inputs = {
      tau1: toNumber(req.body.tau1, 4.0),
      tau2: toNumber(req.body.tau2, 1.8),
      selectedK: toNumber(req.body.selectedK, 2.0),
      kMax: toNumber(req.body.kMax, 20)
    };

    const tau1 = Math.max(inputs.tau1, 1e-9);
    const tau2 = Math.max(inputs.tau2, 1e-9);
    const selectedK = Math.max(inputs.selectedK, 0);
    const kMax = Math.max(inputs.kMax, selectedK + 1e-9);

    const getRoots = (k) => {
      const a = tau1 * tau2;
      const b = tau1 + tau2;
      const c = 1 + k;
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        return [
          { real: (-b + Math.sqrt(disc)) / (2 * a), imag: 0 },
          { real: (-b - Math.sqrt(disc)) / (2 * a), imag: 0 }
        ];
      }
      const real = -b / (2 * a);
      const imag = Math.sqrt(Math.abs(disc)) / (2 * a);
      return [{ real, imag }, { real, imag: -imag }];
    };

    const locus = [];
    const points = 60;
    for (let i = 0; i <= points; i++) {
      const k = (kMax * i) / points;
      const roots = getRoots(k);
      locus.push({ k, real1: roots[0].real, imag1: roots[0].imag, real2: roots[1].real, imag2: roots[1].imag });
    }
    const selectedRoots = getRoots(selectedK);
    const results = { selectedRoots, locus };

    await saveSimulation(req.user.id, "rootlocus", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Root locus simulation failed.", error: err.message });
  }
});

app.post("/api/bodeplots", auth, async (req, res) => {
  try {
    const inputs = {
      processGain: toNumber(req.body.processGain, 2.0),
      tau1: toNumber(req.body.tau1, 4.0),
      tau2: toNumber(req.body.tau2, 1.5),
      wMin: toNumber(req.body.wMin, 0.01),
      wMax: toNumber(req.body.wMax, 10),
      points: toNumber(req.body.points, 40)
    };

    const processGain = Math.max(inputs.processGain, 1e-12);
    const tau1 = Math.max(inputs.tau1, 1e-9);
    const tau2 = Math.max(inputs.tau2, 1e-9);
    const wMin = Math.max(inputs.wMin, 1e-6);
    const wMax = Math.max(inputs.wMax, wMin * 1.01);
    const points = Math.max(Math.round(inputs.points), 10);

    const bode = [];
    for (let i = 0; i <= points; i++) {
      const ratio = i / points;
      const w = wMin * Math.pow(wMax / wMin, ratio);
      const magnitude =
        20 * Math.log10(processGain) -
        10 * Math.log10(1 + Math.pow(w * tau1, 2)) -
        10 * Math.log10(1 + Math.pow(w * tau2, 2));
      const phase = (-(Math.atan(w * tau1) + Math.atan(w * tau2)) * 180) / Math.PI;
      bode.push({ w, magnitude, phase });
    }

    let crossover = null;
    for (let i = 1; i < bode.length; i++) {
      if ((bode[i - 1].magnitude >= 0 && bode[i].magnitude <= 0) || (bode[i - 1].magnitude <= 0 && bode[i].magnitude >= 0)) {
        crossover = bode[i].w;
        break;
      }
    }

    const results = { crossover, bode };
    await saveSimulation(req.user.id, "bodeplots", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Bode plot simulation failed.", error: err.message });
  }
});

app.post("/api/frequencyresponse", auth, async (req, res) => {
  try {
    const inputs = {
      processGain: toNumber(req.body.processGain, 2.0),
      tau: toNumber(req.body.tau, 5.0),
      omega: toNumber(req.body.omega, 0.4),
      inputAmplitude: toNumber(req.body.inputAmplitude, 1.0)
    };

    const tau = Math.max(inputs.tau, 1e-9);
    const omega = Math.max(inputs.omega, 1e-9);
    const amplitudeRatio = inputs.processGain / Math.sqrt(1 + Math.pow(omega * tau, 2));
    const phaseLagDeg = (-Math.atan(omega * tau) * 180) / Math.PI;
    const outputAmplitude = amplitudeRatio * inputs.inputAmplitude;

    const sweep = [];
    for (let w = 0.01; w <= 10; w *= 1.22) {
      const ar = inputs.processGain / Math.sqrt(1 + Math.pow(w * tau, 2));
      const ph = (-Math.atan(w * tau) * 180) / Math.PI;
      sweep.push({ w, amplitudeRatio: ar, phaseLagDeg: ph });
    }

    const results = { amplitudeRatio, phaseLagDeg, outputAmplitude, sweep };
    await saveSimulation(req.user.id, "frequencyresponse", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Frequency response simulation failed.", error: err.message });
  }
});

app.post("/api/pidcalculations", auth, async (req, res) => {
  try {
    const inputs = {
      kc: toNumber(req.body.kc, 1.8),
      ti: toNumber(req.body.ti, 3.5),
      td: toNumber(req.body.td, 0.8),
      setPoint: toNumber(req.body.setPoint, 60),
      pv: toNumber(req.body.pv, 55),
      prevError: toNumber(req.body.prevError, 4.5),
      integral: toNumber(req.body.integral, 20),
      dt: toNumber(req.body.dt, 1),
      bias: toNumber(req.body.bias, 0),
      outputMin: toNumber(req.body.outputMin, 0),
      outputMax: toNumber(req.body.outputMax, 100)
    };

    const ti = Math.max(inputs.ti, 1e-9);
    const dt = Math.max(inputs.dt, 1e-9);
    const td = Math.max(inputs.td, 0);
    const error = inputs.setPoint - inputs.pv;
    const integralNew = inputs.integral + error * dt;
    const pTerm = inputs.kc * error;
    const iTerm = (inputs.kc / ti) * integralNew;
    const dTerm = inputs.kc * td * ((error - inputs.prevError) / dt);
    const rawOutput = inputs.bias + pTerm + iTerm + dTerm;
    const output = clamp(rawOutput, inputs.outputMin, inputs.outputMax);

    const results = { error, pTerm, iTerm, dTerm, rawOutput, output, integralNew };
    await saveSimulation(req.user.id, "pidcalculations", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "PID calculation simulation failed.", error: err.message });
  }
});

app.post("/api/hydrostatics", auth, async (req, res) => {
  try {
    const inputs = {
      fluidDensity: toNumber(req.body.fluidDensity, 1000),
      height: toNumber(req.body.height, 2),
      patm: toNumber(req.body.patm, 101325),
      plateWidth: toNumber(req.body.plateWidth, 1),
      plateHeight: toNumber(req.body.plateHeight, 2),
      plateDepthCentroid: toNumber(req.body.plateDepthCentroid, 3),
      manometerFluidDensity: toNumber(req.body.manometerFluidDensity, 13600),
      manometerDeflection: toNumber(req.body.manometerDeflection, 0.1),
      submergedVolume: toNumber(req.body.submergedVolume, 10),
      waterplaneI: toNumber(req.body.waterplaneI, 12),
      bgDistance: toNumber(req.body.bgDistance, 0.5)
    };

    const g = 9.81;
    const phydro = inputs.fluidDensity * g * inputs.height;
    const pabs = phydro + inputs.patm;
    const fhydro = inputs.fluidDensity * g * inputs.plateDepthCentroid * (inputs.plateWidth * inputs.plateHeight);
    const ycp = inputs.plateDepthCentroid + (inputs.plateHeight * inputs.plateHeight) / (12 * inputs.plateDepthCentroid);
    const manometerDeltaP = (inputs.manometerFluidDensity - inputs.fluidDensity) * g * inputs.manometerDeflection;
    
    const bm = inputs.waterplaneI / Math.max(inputs.submergedVolume, 1e-12);
    const gm = bm - inputs.bgDistance;
    const stability = gm > 0 ? "Stable" : "Unstable";

    const results = { phydro, pabs, fhydro, ycp, manometerDeltaP, bm, gm, stability };
    await saveSimulation(req.user.id, "hydrostatics", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Hydrostatics simulation failed.", error: err.message });
  }
});

app.post("/api/flowmeters", auth, async (req, res) => {
  try {
    const inputs = {
      pipeDiameter: toNumber(req.body.pipeDiameter, 0.1),
      throatDiameter: toNumber(req.body.throatDiameter, 0.05),
      fluidDensity: toNumber(req.body.fluidDensity, 1000),
      deltaP: toNumber(req.body.deltaP, 50000),
      dischargeCoeffVenturi: toNumber(req.body.dischargeCoeffVenturi, 0.98),
      dischargeCoeffOrifice: toNumber(req.body.dischargeCoeffOrifice, 0.61),
      dischargeCoeffPitot: toNumber(req.body.dischargeCoeffPitot, 1.0),
      rotameterFloatVolume: toNumber(req.body.rotameterFloatVolume, 1e-5),
      rotameterFloatDensity: toNumber(req.body.rotameterFloatDensity, 7800),
      rotameterFloatArea: toNumber(req.body.rotameterFloatArea, 1e-4),
      rotameterAnnularArea: toNumber(req.body.rotameterAnnularArea, 5e-5),
      rotameterDischargeCoeff: toNumber(req.body.rotameterDischargeCoeff, 0.6)
    };

    const beta = clamp(inputs.throatDiameter / Math.max(inputs.pipeDiameter, 1e-12), 0.01, 0.99);
    const a1 = (Math.PI * Math.pow(inputs.pipeDiameter, 2)) / 4;
    const a2 = (Math.PI * Math.pow(inputs.throatDiameter, 2)) / 4;

    const term1 = 1 - Math.pow(beta, 4);
    const sqrtTerm = Math.sqrt((2 * Math.max(inputs.deltaP, 0)) / (inputs.fluidDensity * Math.max(term1, 1e-12)));
    
    const qVenturi = inputs.dischargeCoeffVenturi * a2 * sqrtTerm;
    const qOrifice = inputs.dischargeCoeffOrifice * a2 * sqrtTerm;
    
    const vPitot = inputs.dischargeCoeffPitot * Math.sqrt((2 * Math.max(inputs.deltaP, 0)) / inputs.fluidDensity);
    
    const qRotameter = inputs.rotameterDischargeCoeff * inputs.rotameterAnnularArea * 
      Math.sqrt((2 * 9.81 * inputs.rotameterFloatVolume * Math.max(inputs.rotameterFloatDensity - inputs.fluidDensity, 0)) / 
      (Math.max(inputs.rotameterFloatArea, 1e-12) * inputs.fluidDensity));

    const results = { beta, qVenturi, qOrifice, vPitot, qRotameter };
    await saveSimulation(req.user.id, "flowmeters", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Flow meters simulation failed.", error: err.message });
  }
});

app.post("/api/pipehydraulics", auth, async (req, res) => {
  try {
    const inputs = {
      diameter: toNumber(req.body.diameter, 0.1),
      length: toNumber(req.body.length, 50),
      velocity: toNumber(req.body.velocity, 1.5),
      density: toNumber(req.body.density, 1000),
      viscosity: toNumber(req.body.viscosity, 0.001),
      roughness: toNumber(req.body.roughness, 0.000045)
    };

    const reynolds = (inputs.density * inputs.velocity * inputs.diameter) / Math.max(inputs.viscosity, 1e-12);
    const regime = reynolds < 2100 ? "Laminar" : (reynolds > 4000 ? "Turbulent" : "Transition");
    
    let fDarcy = 0;
    if (reynolds < 2100) {
      fDarcy = 64 / Math.max(reynolds, 1e-9);
    } else {
      fDarcy = 0.25 / Math.pow(Math.log10(inputs.roughness / (3.7 * Math.max(inputs.diameter, 1e-12)) + 5.74 / Math.pow(reynolds, 0.9)), 2);
    }

    const q = (Math.PI * Math.pow(inputs.diameter, 2) * inputs.velocity) / 4;
    const dpLaminar = (128 * inputs.viscosity * inputs.length * q) / (Math.PI * Math.pow(Math.max(inputs.diameter, 1e-12), 4));
    const dpDarcy = fDarcy * (inputs.length / Math.max(inputs.diameter, 1e-12)) * (inputs.density * Math.pow(inputs.velocity, 2) / 2);

    const results = { reynolds, regime, fDarcy, dpLaminar, dpDarcy };
    await saveSimulation(req.user.id, "pipehydraulics", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Pipe hydraulics simulation failed.", error: err.message });
  }
});

app.post("/api/pumps", auth, async (req, res) => {
  try {
    const inputs = {
      flowRate: toNumber(req.body.flowRate, 0.05),
      head: toNumber(req.body.head, 30),
      density: toNumber(req.body.density, 1000),
      efficiency: toNumber(req.body.efficiency, 0.75),
      suctionPressure: toNumber(req.body.suctionPressure, 101325),
      vaporPressure: toNumber(req.body.vaporPressure, 2340),
      suctionLosses: toNumber(req.body.suctionLosses, 5000),
      elevationDifference: toNumber(req.body.elevationDifference, 2),
      npshRequired: toNumber(req.body.npshRequired, 4)
    };

    const g = 9.81;
    const hydraulicPower = inputs.density * g * inputs.flowRate * inputs.head;
    const brakeHorsepower = hydraulicPower / Math.max(inputs.efficiency, 1e-12);
    
    const headTerm = (inputs.suctionPressure - inputs.vaporPressure - inputs.suctionLosses) / (inputs.density * g);
    const npshAvailable = headTerm - inputs.elevationDifference;
    const cavitationRisk = npshAvailable < inputs.npshRequired;

    const results = { hydraulicPower, brakeHorsepower, npshAvailable, cavitationRisk };
    await saveSimulation(req.user.id, "pumps", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Pump simulation failed.", error: err.message });
  }
});

app.post("/api/dragsettling", auth, async (req, res) => {
  try {
    const inputs = {
      particleDiameter: toNumber(req.body.particleDiameter, 0.0005),
      particleDensity: toNumber(req.body.particleDensity, 2500),
      fluidDensity: toNumber(req.body.fluidDensity, 1000),
      fluidViscosity: toNumber(req.body.fluidViscosity, 0.001)
    };

    const g = 9.81;
    let vt = 0.1; 
    let cd = 0.44;
    let rep = 0;
    
    for (let i = 0; i < 100; i++) {
      rep = (inputs.fluidDensity * vt * inputs.particleDiameter) / Math.max(inputs.fluidViscosity, 1e-12);
      if (rep < 0.1) {
        cd = 24 / Math.max(rep, 1e-9);
      } else if (rep < 1000) {
        cd = (24 / Math.max(rep, 1e-9)) * (1 + 0.15 * Math.pow(rep, 0.687));
      } else {
        cd = 0.44;
      }
      const newVt = Math.sqrt((4 * g * inputs.particleDiameter * Math.max(inputs.particleDensity - inputs.fluidDensity, 0)) / (3 * inputs.fluidDensity * cd));
      if (Math.abs(newVt - vt) < 1e-6) {
        vt = newVt;
        break;
      }
      vt = newVt;
    }

    const results = { vt, cd, rep };
    await saveSimulation(req.user.id, "dragsettling", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Drag/settling simulation failed.", error: err.message });
  }
});

app.post("/api/cycles", auth, async (req, res) => {
  try {
    const inputs = {
      n: toNumber(req.body.n, 1),
      t1: toNumber(req.body.t1, 300),
      t2: toNumber(req.body.t2, 450),
      v1: toNumber(req.body.v1, 0.02),
      v2: toNumber(req.body.v2, 0.04),
      p1: toNumber(req.body.p1, 100000),
      cv: toNumber(req.body.cv, 20.8),
      cp: toNumber(req.body.cp, 29.1),
      th: toNumber(req.body.th, 600),
      tc: toNumber(req.body.tc, 300),
      cycleType: String(req.body.cycleType || "isothermal").toLowerCase()
    };

    const r = 8.314;
    let w = 0, q = 0, du = 0, dh = 0, ds = 0;
    const vRatio = inputs.v2 / Math.max(inputs.v1, 1e-9);
    const tRatio = inputs.t2 / Math.max(inputs.t1, 1e-9);

    if (inputs.cycleType === "isothermal") {
      w = inputs.n * r * inputs.t1 * Math.log(vRatio);
      q = w;
      du = 0;
      dh = 0;
      ds = inputs.n * r * Math.log(vRatio);
    } else if (inputs.cycleType === "isobaric") {
      du = inputs.n * inputs.cv * (inputs.t2 - inputs.t1);
      dh = inputs.n * inputs.cp * (inputs.t2 - inputs.t1);
      q = dh;
      w = q - du;
      ds = inputs.n * inputs.cp * Math.log(tRatio);
    } else if (inputs.cycleType === "isochoric") {
      du = inputs.n * inputs.cv * (inputs.t2 - inputs.t1);
      dh = inputs.n * inputs.cp * (inputs.t2 - inputs.t1);
      q = du;
      w = 0;
      ds = inputs.n * inputs.cv * Math.log(tRatio);
    } else if (inputs.cycleType === "adiabatic") {
      du = inputs.n * inputs.cv * (inputs.t2 - inputs.t1);
      dh = inputs.n * inputs.cp * (inputs.t2 - inputs.t1);
      w = -du;
      q = 0;
      ds = 0;
    }

    const carnotEff = 1 - inputs.tc / Math.max(inputs.th, 1e-9);
    const results = { w, q, du, dh, ds, carnotEff };
    await saveSimulation(req.user.id, "cycles", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Thermodynamic cycles simulation failed.", error: err.message });
  }
});

app.post("/api/eos", auth, async (req, res) => {
  try {
    const inputs = {
      t: toNumber(req.body.t, 350),
      p: toNumber(req.body.p, 1500000),
      tc: toNumber(req.body.tc, 369.8),
      pc: toNumber(req.body.pc, 4250000),
      omega: toNumber(req.body.omega, 0.152),
      mockPsatAtTr07: toNumber(req.body.mockPsatAtTr07, 425000)
    };

    const r = 8.314;
    const tr = inputs.t / Math.max(inputs.tc, 1e-9);
    const pr = inputs.p / Math.max(inputs.pc, 1e-9);
    const vIdeal = (r * inputs.t) / Math.max(inputs.p, 1e-9);

    // Virial EOS (Pitzer)
    const b0 = 0.083 - 0.422 / Math.pow(tr, 1.6);
    const b1 = 0.139 - 0.172 / Math.pow(tr, 4.2);
    const b = (r * inputs.tc / Math.max(inputs.pc, 1e-9)) * (b0 + inputs.omega * b1);
    const zVirial = 1 + (b * inputs.p) / (r * inputs.t);
    const vVirial = zVirial * vIdeal;

    // van der Waals EOS
    const aVdw = (27 * Math.pow(r * inputs.tc, 2)) / (64 * Math.max(inputs.pc, 1e-9));
    const bVdw = (r * inputs.tc) / (8 * Math.max(inputs.pc, 1e-9));

    // Solver for van der Waals Cubic
    let vCubic = vIdeal;
    for (let i = 0; i < 100; i++) {
      const fVal = Math.pow(vCubic, 3) - (bVdw + (r * inputs.t) / inputs.p) * Math.pow(vCubic, 2) + (aVdw / inputs.p) * vCubic - (aVdw * bVdw) / inputs.p;
      const fDeriv = 3 * Math.pow(vCubic, 2) - 2 * (bVdw + (r * inputs.t) / inputs.p) * vCubic + aVdw / inputs.p;
      const nextV = vCubic - fVal / Math.max(fDeriv, 1e-12);
      if (Math.abs(nextV - vCubic) < 1e-8) {
        vCubic = nextV;
        break;
      }
      vCubic = nextV;
    }
    const zCubic = (inputs.p * vCubic) / (r * inputs.t);
    const calculatedOmega = -Math.log10(Math.max(inputs.mockPsatAtTr07 / Math.max(inputs.pc, 1e-9), 1e-12)) - 1.0;

    const results = { vIdeal, zVirial, vVirial, zCubic, vCubic, calculatedOmega };
    await saveSimulation(req.user.id, "eos", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "EOS simulation failed.", error: err.message });
  }
});

app.post("/api/thermochem", auth, async (req, res) => {
  try {
    const inputs = {
      temp: toNumber(req.body.temp, 500),
      reactants: req.body.reactants || [
        { name: "CO", hf: -110500, cp: 29.1, nu: 1 },
        { name: "O2", hf: 0, cp: 29.4, nu: 0.5 }
      ],
      products: req.body.products || [
        { name: "CO2", hf: -393500, cp: 37.1, nu: 1 }
      ]
    };

    let sumProdHf = 0, sumReactHf = 0;
    let sumProdCp = 0, sumReactCp = 0;

    inputs.products.forEach(p => {
      sumProdHf += toNumber(p.hf) * toNumber(p.nu);
      sumProdCp += toNumber(p.cp) * toNumber(p.nu);
    });

    inputs.reactants.forEach(r => {
      sumReactHf += toNumber(r.hf) * toNumber(r.nu);
      sumReactCp += toNumber(r.cp) * toNumber(r.nu);
    });

    const hRxn298 = sumProdHf - sumReactHf;
    const deltaCp = sumProdCp - sumReactCp;
    const hRxnTemp = hRxn298 + deltaCp * (inputs.temp - 298.15);
    const hCombustion = hRxnTemp; // standard enthalpy of reaction represents combustion for standard fuels

    const results = { hRxn298, deltaCp, hRxnTemp, hCombustion };
    await saveSimulation(req.user.id, "thermochem", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Thermochemistry simulation failed.", error: err.message });
  }
});

app.post("/api/fugacity", auth, async (req, res) => {
  try {
    const inputs = {
      t: toNumber(req.body.t, 350),
      p: toNumber(req.body.p, 1500000),
      tc: toNumber(req.body.tc, 369.8),
      pc: toNumber(req.body.pc, 4250000)
    };

    const r = 8.314;
    const a = (27 * Math.pow(r * inputs.tc, 2)) / (64 * Math.max(inputs.pc, 1e-9));
    const b = (r * inputs.tc) / (8 * Math.max(inputs.pc, 1e-9));

    // Solve for V
    const getV = (temp, press) => {
      let v = (r * temp) / press;
      for (let i = 0; i < 100; i++) {
        const fVal = Math.pow(v, 3) - (b + (r * temp) / press) * Math.pow(v, 2) + (a / press) * v - (a * b) / press;
        const fDeriv = 3 * Math.pow(v, 2) - 2 * (b + (r * temp) / press) * v + a / press;
        const nextV = v - fVal / Math.max(fDeriv, 1e-12);
        if (Math.abs(nextV - v) < 1e-8) { return nextV; }
        v = nextV;
      }
      return v;
    };

    const v = getV(inputs.t, inputs.p);
    const z = (inputs.p * v) / (r * inputs.t);

    const hResidual = inputs.p * v - r * inputs.t - a / Math.max(v, 1e-9);
    const sResidual = r * Math.log(Math.max(1 - b / Math.max(v, 1e-9), 1e-12));

    const lnPhi = z - 1 - Math.log(Math.max(z - (inputs.p * b) / (r * inputs.t), 1e-12)) - a / Math.max(r * inputs.t * v, 1e-12);
    const phi = Math.exp(lnPhi);
    const fugacity = phi * inputs.p;

    // Numerical Derivative check for Maxwell: dV/dT = - dS/dP
    const dT = 0.1;
    const vPlus = getV(inputs.t + dT, inputs.p);
    const vMinus = getV(inputs.t - dT, inputs.p);
    const dV_dT = (vPlus - vMinus) / (2 * dT);

    const results = { hResidual, sResidual, phi, fugacity, dV_dT };
    await saveSimulation(req.user.id, "fugacity", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Fugacity simulation failed.", error: err.message });
  }
});

app.post("/api/equilibrium", auth, async (req, res) => {
  try {
    const inputs = {
      temp: toNumber(req.body.temp, 350),
      x1: toNumber(req.body.x1, 0.4),
      a12: toNumber(req.body.a12, 1.2),
      a21: toNumber(req.body.a21, 0.8),
      p1Sat: toNumber(req.body.p1Sat, 120000),
      p2Sat: toNumber(req.body.p2Sat, 70000),
      deltaG298: toNumber(req.body.deltaG298, -10000),
      deltaH298: toNumber(req.body.deltaH298, -20000),
      modelType: String(req.body.modelType || "margules").toLowerCase()
    };

    const r = 8.314;
    const x2 = 1 - inputs.x1;
    let gamma1 = 1, gamma2 = 1;

    if (inputs.modelType === "margules") {
      const lnGamma1 = Math.pow(x2, 2) * (inputs.a12 + 2 * (inputs.a21 - inputs.a12) * inputs.x1);
      const lnGamma2 = Math.pow(inputs.x1, 2) * (inputs.a21 + 2 * (inputs.a12 - inputs.a21) * x2);
      gamma1 = Math.exp(lnGamma1);
      gamma2 = Math.exp(lnGamma2);
    } else if (inputs.modelType === "vanlaar") {
      const factor1 = (inputs.a12 * inputs.x1) / Math.max(inputs.a21 * x2, 1e-12);
      const factor2 = (inputs.a21 * x2) / Math.max(inputs.a12 * inputs.x1, 1e-12);
      gamma1 = Math.exp(inputs.a12 / Math.pow(1 + factor1, 2));
      gamma2 = Math.exp(inputs.a21 / Math.pow(1 + factor2, 2));
    } else if (inputs.modelType === "wilson") {
      const term1 = inputs.x1 + inputs.a12 * x2;
      const term2 = inputs.a21 * inputs.x1 + x2;
      gamma1 = Math.exp(-Math.log(Math.max(term1, 1e-12)) + x2 * (inputs.a12 / Math.max(term1, 1e-12) - inputs.a21 / Math.max(term2, 1e-12)));
      gamma2 = Math.exp(-Math.log(Math.max(term2, 1e-12)) - inputs.x1 * (inputs.a12 / Math.max(term1, 1e-12) - inputs.a21 / Math.max(term2, 1e-12)));
    }

    const bubbleP = inputs.x1 * gamma1 * inputs.p1Sat + x2 * gamma2 * inputs.p2Sat;
    const y1 = (inputs.x1 * gamma1 * inputs.p1Sat) / Math.max(bubbleP, 1e-12);

    // Chemical equilibrium constant
    const k298 = Math.exp(-inputs.deltaG298 / (r * 298.15));
    const kTemp = k298 * Math.exp((-inputs.deltaH298 / r) * (1 / inputs.temp - 1 / 298.15));
    const epsilon = kTemp / (1 + kTemp); // for reaction A -> B

    const results = { gamma1, gamma2, bubbleP, y1, kTemp, epsilon };
    await saveSimulation(req.user.id, "equilibrium", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Equilibrium simulation failed.", error: err.message });
  }
});

app.post("/api/conduction", auth, async (req, res) => {
  try {
    const inputs = {
      k: toNumber(req.body.k, 0.5),
      thick: toNumber(req.body.thick, 0.1),
      t1: toNumber(req.body.t1, 100),
      t2: toNumber(req.body.t2, 25),
      kIns: toNumber(req.body.kIns, 0.04),
      hExt: toNumber(req.body.hExt, 10),
      r1: toNumber(req.body.r1, 0.05),
      r2: toNumber(req.body.r2, 0.08),
      kWall: toNumber(req.body.kWall, 15),
      len: toNumber(req.body.len, 10),
      compThicks: req.body.compThicks || [0.05, 0.1],
      compKs: req.body.compKs || [0.8, 0.04]
    };

    const qFlat = inputs.k * (inputs.t1 - inputs.t2) / Math.max(inputs.thick, 1e-9);

    let rComp = 0;
    for (let i = 0; i < inputs.compThicks.length; i++) {
      rComp += inputs.compThicks[i] / Math.max(inputs.compKs[i], 1e-9);
    }
    const qComp = (inputs.t1 - inputs.t2) / Math.max(rComp, 1e-9);

    const rCyl = Math.log(inputs.r2 / Math.max(inputs.r1, 1e-9)) / (2 * Math.PI * inputs.len * inputs.kWall);
    const qCyl = (inputs.t1 - inputs.t2) / Math.max(rCyl, 1e-12);

    const rSph = (inputs.r2 - inputs.r1) / (4 * Math.PI * inputs.kWall * inputs.r1 * inputs.r2);
    const qSph = (inputs.t1 - inputs.t2) / Math.max(rSph, 1e-12);

    const rcCyl = inputs.kIns / Math.max(inputs.hExt, 1e-9);
    const rcSph = (2 * inputs.kIns) / Math.max(inputs.hExt, 1e-9);

    const results = { qFlat, qComp, qCyl, qSph, rcCyl, rcSph };
    await saveSimulation(req.user.id, "conduction", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Conduction simulation failed.", error: err.message });
  }
});

app.post("/api/convection", auth, async (req, res) => {
  try {
    const inputs = {
      fluidDensity: toNumber(req.body.fluidDensity, 998),
      velocity: toNumber(req.body.velocity, 2),
      viscosity: toNumber(req.body.viscosity, 0.001),
      length: toNumber(req.body.length, 1),
      cp: toNumber(req.body.cp, 4184),
      kFluid: toNumber(req.body.kFluid, 0.6),
      tempWall: toNumber(req.body.tempWall, 80),
      tempFluid: toNumber(req.body.tempFluid, 20),
      finDiam: toNumber(req.body.finDiam, 0.01),
      finLen: toNumber(req.body.finLen, 0.1),
      finK: toNumber(req.body.finK, 200),
      hConvection: toNumber(req.body.hConvection, 50)
    };

    const re = (inputs.fluidDensity * inputs.velocity * inputs.length) / Math.max(inputs.viscosity, 1e-12);
    const pr = (inputs.cp * inputs.viscosity) / Math.max(inputs.kFluid, 1e-12);

    const boundaryL = 5.0 * inputs.length / Math.sqrt(Math.max(re, 1));
    const boundaryT = boundaryL * Math.pow(Math.max(pr, 1e-6), -1/3);

    const beta = 1 / (inputs.tempFluid + 273.15);
    const g = 9.81;
    const dT = Math.abs(inputs.tempWall - inputs.tempFluid);
    const kinematicVisc = inputs.viscosity / Math.max(inputs.fluidDensity, 1e-9);
    const gr = (g * beta * dT * Math.pow(inputs.length, 3)) / Math.max(Math.pow(kinematicVisc, 2), 1e-15);
    const ra = gr * pr;

    const nuTerm = 0.387 * Math.pow(ra, 1/6);
    const nuDenom = Math.pow(1 + Math.pow(0.492 / Math.max(pr, 1e-9), 9/16), 8/27);
    const nuNatural = Math.pow(0.825 + nuTerm / Math.max(nuDenom, 1e-9), 2);
    const hNatural = (nuNatural * inputs.kFluid) / Math.max(inputs.length, 1e-9);

    const pFin = Math.PI * inputs.finDiam;
    const aFin = (Math.PI * Math.pow(inputs.finDiam, 2)) / 4;
    const mFin = Math.sqrt((inputs.hConvection * pFin) / Math.max(inputs.finK * aFin, 1e-12));
    const mL = mFin * inputs.finLen;
    const finEff = Math.abs(mL) < 1e-6 ? 1.0 : Math.tanh(mL) / mL;

    const results = { re, pr, boundaryL, boundaryT, gr, ra, nuNatural, hNatural, finEff };
    await saveSimulation(req.user.id, "convection", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Convection simulation failed.", error: err.message });
  }
});

app.post("/api/radiation", auth, async (req, res) => {
  try {
    const inputs = {
      temp1: toNumber(req.body.temp1, 800),
      temp2: toNumber(req.body.temp2, 300),
      eps1: toNumber(req.body.eps1, 0.8),
      eps2: toNumber(req.body.eps2, 0.6),
      tempSat: toNumber(req.body.tempSat, 373.15),
      tempWall: toNumber(req.body.tempWall, 390),
      hfg: toNumber(req.body.hfg, 2256000),
      rhoL: toNumber(req.body.rhoL, 958),
      rhoV: toNumber(req.body.rhoV, 0.6),
      muL: toNumber(req.body.muL, 0.00028),
      kL: toNumber(req.body.kL, 0.68),
      cpL: toNumber(req.body.cpL, 4220),
      sigmaBoil: toNumber(req.body.sigmaBoil, 0.0589),
      csf: toNumber(req.body.csf, 0.013),
      boilingPr: toNumber(req.body.boilingPr, 1.75)
    };

    const sigmaRad = 5.67e-8;
    const eBlack1 = sigmaRad * Math.pow(inputs.temp1, 4);

    const qRadExchange = (sigmaRad * (Math.pow(inputs.temp1, 4) - Math.pow(inputs.temp2, 4))) /
      (1 / inputs.eps1 + 1 / inputs.eps2 - 1);

    const g = 9.81;
    const dTBoil = Math.max(inputs.tempWall - inputs.tempSat, 0);
    const factor1 = inputs.muL * inputs.hfg * Math.sqrt((g * (inputs.rhoL - inputs.rhoV)) / Math.max(inputs.sigmaBoil, 1e-9));
    const factor2 = (inputs.cpL * dTBoil) / Math.max(inputs.csf * inputs.hfg * Math.pow(inputs.boilingPr, 1), 1e-12);
    const qBoiling = factor1 * Math.pow(factor2, 3);

    const hfgCorr = inputs.hfg + 0.68 * inputs.cpL * Math.max(inputs.tempSat - inputs.tempWall, 0);
    const dTCond = Math.max(inputs.tempSat - inputs.tempWall, 1e-9);
    const condTerm = (g * inputs.rhoL * (inputs.rhoL - inputs.rhoV) * Math.pow(inputs.kL, 3) * hfgCorr) /
      (inputs.muL * dTCond * 1.0);
    const hCond = 0.943 * Math.pow(Math.max(condTerm, 0), 0.25);
    const qCond = hCond * dTCond;

    const results = { eBlack1, qRadExchange, qBoiling, hCond, qCond };
    await saveSimulation(req.user.id, "radiation", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Radiation simulation failed.", error: err.message });
  }
});

app.post("/api/evaporator", auth, async (req, res) => {
  try {
    const inputs = {
      feedRate: toNumber(req.body.feedRate, 10),
      xF: toNumber(req.body.xF, 0.1),
      xL: toNumber(req.body.xL, 0.4),
      tF: toNumber(req.body.tF, 320),
      tSatSteam: toNumber(req.body.tSatSteam, 393),
      pEvap: toNumber(req.body.pEvap, 20000),
      uVal1: toNumber(req.body.uVal1, 2000),
      hfgSteam: toNumber(req.body.hfgSteam, 2200000),
      cpFeed: toNumber(req.body.cpFeed, 4000)
    };

    const tSatEvap = 3816.44 / (23.196 - Math.log(Math.max(inputs.pEvap, 100))) + 46.13;
    const hfgEvap = 2.501e6 - 2386 * (tSatEvap - 273.15);

    const lRate = (inputs.feedRate * inputs.xF) / Math.max(inputs.xL, 1e-9);
    const vRate = inputs.feedRate - lRate;

    const qSensible = inputs.feedRate * inputs.cpFeed * (tSatEvap - inputs.tF);
    const qLatent = vRate * hfgEvap;
    const heatDuty = qSensible + qLatent;
    const steamRate = heatDuty / Math.max(inputs.hfgSteam, 1e-9);
    const economy = vRate / Math.max(steamRate, 1e-9);
    const evapArea = heatDuty / Math.max(inputs.uVal1 * (inputs.tSatSteam - tSatEvap), 1e-12);

    const vRate1 = vRate * 0.52;
    const vRate2 = vRate - vRate1;
    const economyDouble = (vRate1 + vRate2) / Math.max(vRate1, 1e-9) * 0.95;

    const results = { tSatEvap, lRate, vRate, heatDuty, steamRate, economy, evapArea, economyDouble };
    await saveSimulation(req.user.id, "evaporator", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Evaporator simulation failed.", error: err.message });
  }
});

app.post("/api/mccabe", auth, async (req, res) => {
  try {
    const inputs = {
      alpha: toNumber(req.body.alpha, 2.5),
      xD: toNumber(req.body.xD, 0.95),
      xB: toNumber(req.body.xB, 0.05),
      xF: toNumber(req.body.xF, 0.5),
      qVal: toNumber(req.body.qVal, 1.0),
      refluxRatio: toNumber(req.body.refluxRatio, 2.0)
    };

    const alpha = Math.max(inputs.alpha, 1.001);
    const xD = clamp(inputs.xD, 1e-5, 0.99999);
    const xB = clamp(inputs.xB, 1e-5, 0.99999);
    const xF = clamp(inputs.xF, 1e-5, 0.99999);

    let xInt = xF, yInt = (alpha * xF) / (1 + (alpha - 1) * xF);
    if (Math.abs(inputs.qVal - 1.0) > 1e-6) {
      const q = inputs.qVal;
      const aCoef = (alpha - 1) * q / (q - 1);
      const bCoef = q / (q - 1) + (alpha - 1) * (-xF / (q - 1)) - alpha;
      const cCoef = -xF / (q - 1);
      const desc = bCoef * bCoef - 4 * aCoef * cCoef;
      if (desc >= 0) {
        const xRoot1 = (-bCoef + Math.sqrt(desc)) / (2 * aCoef);
        const xRoot2 = (-bCoef - Math.sqrt(desc)) / (2 * aCoef);
        xInt = xRoot1 > 0 && xRoot1 < 1 ? xRoot1 : xRoot2;
        yInt = (alpha * xInt) / (1 + (alpha - 1) * xInt);
      }
    }

    const rMin = (xD - yInt) / Math.max(yInt - xInt, 1e-9);
    const R = Math.max(inputs.refluxRatio, rMin * 1.05);

    const slopeRect = R / (R + 1);
    const interRect = xD / (R + 1);

    const xIntersect = (Math.abs(inputs.qVal - 1.0) < 1e-6) ? xF : (interRect + xF / (inputs.qVal - 1)) / (inputs.qVal / (inputs.qVal - 1) - slopeRect);
    const yIntersect = slopeRect * xIntersect + interRect;

    const slopeStrip = (yIntersect - xB) / Math.max(xIntersect - xB, 1e-9);
    const interStrip = xB - slopeStrip * xB;

    const stages = [];
    let xCurr = xD;
    let yCurr = xD;
    let feedStage = 0;
    let nStages = 0;

    stages.push({ x: xCurr, y: yCurr });
    while (xCurr > xB && nStages < 100) {
      nStages++;
      xCurr = yCurr / (alpha - yCurr * (alpha - 1));
      stages.push({ x: xCurr, y: yCurr });

      if (xCurr > xIntersect) {
        yCurr = slopeRect * xCurr + interRect;
      } else {
        if (feedStage === 0) feedStage = nStages;
        yCurr = slopeStrip * xCurr + interStrip;
      }
      stages.push({ x: xCurr, y: yCurr });
    }

    const results = { rMin, nStages, feedStage, stages, xIntersect, yIntersect };
    await saveSimulation(req.user.id, "mccabe", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "McCabe-Thiele simulation failed.", error: err.message });
  }
});

app.post("/api/rachford", auth, async (req, res) => {
  try {
    const inputs = {
      z: req.body.z || [0.4, 0.3, 0.2, 0.1],
      k: req.body.k || [2.5, 1.2, 0.5, 0.1]
    };

    const z = inputs.z.map(v => toNumber(v));
    const k = inputs.k.map(v => toNumber(v));
    const n = z.length;

    let psi = 0.5;
    for (let iter = 0; iter < 100; iter++) {
      let fVal = 0;
      let fDeriv = 0;
      for (let i = 0; i < n; i++) {
        const denom = 1 + psi * (k[i] - 1);
        fVal += (z[i] * (k[i] - 1)) / Math.max(denom, 1e-12);
        fDeriv -= (z[i] * Math.pow(k[i] - 1, 2)) / Math.max(Math.pow(denom, 2), 1e-15);
      }
      const nextPsi = psi - fVal / Math.max(fDeriv, 1e-12);
      psi = clamp(nextPsi, 1e-9, 1 - 1e-9);
      if (Math.abs(fVal) < 1e-8) break;
    }

    const x = [];
    const y = [];
    for (let i = 0; i < n; i++) {
      const xi = z[i] / (1 + psi * (k[i] - 1));
      x.push(clamp(xi, 0, 1));
      y.push(clamp(k[i] * xi, 0, 1));
    }

    const results = { psi, x, y };
    await saveSimulation(req.user.id, "rachford", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Rachford-Rice simulation failed.", error: err.message });
  }
});

app.post("/api/pfr", auth, async (req, res) => {
  try {
    const inputs = {
      flowRate: toNumber(req.body.flowRate, 0.05),
      ca0: toNumber(req.body.ca0, 2.0),
      targetConversion: toNumber(req.body.targetConversion, 0.8),
      rateConstant: toNumber(req.body.rateConstant, 0.1),
      reactionOrder: toNumber(req.body.reactionOrder, 1)
    };

    const fa0 = inputs.flowRate * inputs.ca0;
    const X = clamp(inputs.targetConversion, 1e-6, 0.9999);

    const N = 40;
    const h = X / N;

    const getRate = (conv) => {
      const ca = inputs.ca0 * (1 - conv);
      if (inputs.reactionOrder === 2) {
        return inputs.rateConstant * ca * ca;
      }
      return inputs.rateConstant * ca;
    };

    const gFunc = (conv) => {
      return fa0 / Math.max(getRate(conv), 1e-15);
    };

    let integral = gFunc(0) + gFunc(X);
    for (let i = 1; i < N; i++) {
      const conv = i * h;
      integral += (i % 2 === 0 ? 2 : 4) * gFunc(conv);
    }
    const volume = (h / 3) * integral;
    const residenceTime = volume / Math.max(inputs.flowRate, 1e-12);

    const results = { volume, residenceTime };
    await saveSimulation(req.user.id, "pfr", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "PFR sizing simulation failed.", error: err.message });
  }
});

app.post("/api/nonisothermal", auth, async (req, res) => {
  try {
    const inputs = {
      flowRate: toNumber(req.body.flowRate, 1.5),
      ca0: toNumber(req.body.ca0, 1500),
      targetConversion: toNumber(req.body.targetConversion, 0.65),
      t0: toNumber(req.body.t0, 350),
      k0: toNumber(req.body.k0, 8e6),
      ea: toNumber(req.body.ea, 70000),
      deltaH: toNumber(req.body.deltaH, -60000),
      rhoCp: toNumber(req.body.rhoCp, 3.5e6)
    };

    const x = clamp(inputs.targetConversion, 1e-6, 0.995);
    const R = 8.314;
    const outletTemperature = inputs.t0 + ((-inputs.deltaH) * inputs.ca0 * x) / Math.max(inputs.rhoCp, 1e-9);
    const rateConstant = Math.max(inputs.k0, 1e-12) * Math.exp(-Math.max(inputs.ea, 1e-9) / (R * Math.max(outletTemperature, 1)));
    const residenceTime = x / (Math.max(rateConstant, 1e-12) * (1 - x));
    const volume = inputs.flowRate * residenceTime;
    const heatRelease = (-inputs.deltaH) * inputs.flowRate * inputs.ca0 * x;

    const results = { outletTemperature, rateConstant, residenceTime, volume, heatRelease };
    await saveSimulation(req.user.id, "nonisothermal", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Non-isothermal reactor simulation failed.", error: err.message });
  }
});

app.post("/api/catalytic", auth, async (req, res) => {
  try {
    const inputs = {
      flowRate: toNumber(req.body.flowRate, 1.2),
      ca0: toNumber(req.body.ca0, 1200),
      targetConversion: toNumber(req.body.targetConversion, 0.75),
      kPrime: toNumber(req.body.kPrime, 0.35),
      bedBulkDensity: toNumber(req.body.bedBulkDensity, 650)
    };

    const flowRate = Math.max(inputs.flowRate, 1e-12);
    const ca0 = Math.max(inputs.ca0, 1e-12);
    const x = clamp(inputs.targetConversion, 1e-6, 0.995);
    const kPrime = Math.max(inputs.kPrime, 1e-12);
    const bedBulkDensity = Math.max(inputs.bedBulkDensity, 1e-12);

    const fa0 = flowRate * ca0;
    const requiredCatalystWeight = (fa0 / (kPrime * ca0)) * Math.log(1 / (1 - x));
    const reactorVolume = requiredCatalystWeight / bedBulkDensity;
    const spaceTime = reactorVolume / flowRate;
    const observedRate = kPrime * ca0 * (1 - x);

    const results = { requiredCatalystWeight, reactorVolume, spaceTime, observedRate };
    await saveSimulation(req.user.id, "catalytic", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Catalytic reactor simulation failed.", error: err.message });
  }
});

app.post("/api/effectiveness", auth, async (req, res) => {
  try {
    const inputs = {
      pelletRadius: toNumber(req.body.pelletRadius, 0.0015),
      intrinsicRateConstant: toNumber(req.body.intrinsicRateConstant, 0.8),
      effectiveDiffusivity: toNumber(req.body.effectiveDiffusivity, 2e-7)
    };

    const pelletRadius = Math.max(inputs.pelletRadius, 1e-12);
    const intrinsicRateConstant = Math.max(inputs.intrinsicRateConstant, 1e-12);
    const effectiveDiffusivity = Math.max(inputs.effectiveDiffusivity, 1e-16);

    const thieleModulus = pelletRadius * Math.sqrt(intrinsicRateConstant / effectiveDiffusivity);
    let effectivenessFactor = 1;
    if (thieleModulus > 1e-9) {
      effectivenessFactor =
        (3 / (thieleModulus * thieleModulus)) *
        ((thieleModulus / Math.tanh(thieleModulus)) - 1);
    }
    effectivenessFactor = clamp(effectivenessFactor, 0, 1);
    const observedRateConstant = effectivenessFactor * intrinsicRateConstant;
    const diffusionResistanceRatio = Math.max(1 / Math.max(effectivenessFactor, 1e-12) - 1, 0);

    const results = { thieleModulus, effectivenessFactor, observedRateConstant, diffusionResistanceRatio };
    await saveSimulation(req.user.id, "effectiveness", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Catalyst effectiveness simulation failed.", error: err.message });
  }
});

app.post("/api/diffusionreaction", auth, async (req, res) => {
  try {
    const inputs = {
      halfThickness: toNumber(req.body.halfThickness, 0.001),
      effectiveDiffusivity: toNumber(req.body.effectiveDiffusivity, 2e-7),
      rateConstant: toNumber(req.body.rateConstant, 0.6),
      surfaceConcentration: toNumber(req.body.surfaceConcentration, 1.5)
    };

    const halfThickness = Math.max(inputs.halfThickness, 1e-12);
    const effectiveDiffusivity = Math.max(inputs.effectiveDiffusivity, 1e-16);
    const rateConstant = Math.max(inputs.rateConstant, 1e-12);
    const surfaceConcentration = Math.max(inputs.surfaceConcentration, 0);

    const thieleModulus = halfThickness * Math.sqrt(rateConstant / effectiveDiffusivity);
    const effectivenessFactor = thieleModulus > 1e-9 ? Math.tanh(thieleModulus) / thieleModulus : 1;
    const surfaceFlux = surfaceConcentration * Math.sqrt(effectiveDiffusivity * rateConstant) * Math.tanh(thieleModulus);
    const avgConcentration = surfaceConcentration * effectivenessFactor;

    const profile = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * halfThickness;
      const xByL = x / Math.max(halfThickness, 1e-12);
      const concentration =
        surfaceConcentration *
        (Math.cosh(thieleModulus * xByL) / Math.max(Math.cosh(thieleModulus), 1e-12));
      profile.push({ x, concentration });
    }

    const results = { thieleModulus, effectivenessFactor, surfaceFlux, avgConcentration, profile };
    await saveSimulation(req.user.id, "diffusionreaction", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Diffusion-reaction simulation failed.", error: err.message });
  }
});

app.post("/api/packedbedreactor", auth, async (req, res) => {
  try {
    const inputs = {
      bedLength: toNumber(req.body.bedLength, 3.0),
      bedDiameter: toNumber(req.body.bedDiameter, 0.9),
      particleDiameter: toNumber(req.body.particleDiameter, 0.004),
      voidFraction: toNumber(req.body.voidFraction, 0.42),
      superficialVelocity: toNumber(req.body.superficialVelocity, 0.35),
      fluidDensity: toNumber(req.body.fluidDensity, 850),
      fluidViscosity: toNumber(req.body.fluidViscosity, 0.002),
      particleDensity: toNumber(req.body.particleDensity, 1600),
      flowRate: toNumber(req.body.flowRate, 1.2),
      ca0: toNumber(req.body.ca0, 1200),
      targetConversion: toNumber(req.body.targetConversion, 0.75),
      kPrime: toNumber(req.body.kPrime, 0.35)
    };

    const bedLength = Math.max(inputs.bedLength, 1e-12);
    const bedDiameter = Math.max(inputs.bedDiameter, 1e-12);
    const particleDiameter = Math.max(inputs.particleDiameter, 1e-12);
    const voidFraction = clamp(inputs.voidFraction, 1e-6, 0.95);
    const superficialVelocity = Math.max(inputs.superficialVelocity, 0);
    const fluidDensity = Math.max(inputs.fluidDensity, 1e-12);
    const fluidViscosity = Math.max(inputs.fluidViscosity, 1e-12);
    const particleDensity = Math.max(inputs.particleDensity, 1e-12);
    const flowRate = Math.max(inputs.flowRate, 1e-12);
    const ca0 = Math.max(inputs.ca0, 1e-12);
    const x = clamp(inputs.targetConversion, 1e-6, 0.995);
    const kPrime = Math.max(inputs.kPrime, 1e-12);

    const pressureGradient =
      (150 * fluidViscosity * superficialVelocity * Math.pow(1 - voidFraction, 2)) /
        (Math.pow(particleDiameter, 2) * Math.pow(voidFraction, 3)) +
      (1.75 * fluidDensity * superficialVelocity * superficialVelocity * (1 - voidFraction)) /
        (particleDiameter * Math.pow(voidFraction, 3));
    const totalPressureDrop = pressureGradient * bedLength;

    const bedArea = (Math.PI * bedDiameter * bedDiameter) / 4;
    const bedVolume = bedArea * bedLength;
    const availableCatalystWeight = bedVolume * (1 - voidFraction) * particleDensity;

    const fa0 = flowRate * ca0;
    const requiredCatalystWeight = (fa0 / (kPrime * ca0)) * Math.log(1 / (1 - x));
    const conversionAtAvailable =
      1 - Math.exp(-(kPrime * ca0 / Math.max(fa0, 1e-12)) * availableCatalystWeight);
    const sizingRatio = availableCatalystWeight / Math.max(requiredCatalystWeight, 1e-12);

    const results = {
      pressureGradient,
      totalPressureDrop,
      bedVolume,
      requiredCatalystWeight,
      availableCatalystWeight,
      conversionAtAvailable: clamp(conversionAtAvailable, 0, 0.999999),
      sizingRatio
    };

    await saveSimulation(req.user.id, "packedbedreactor", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Packed bed reactor simulation failed.", error: err.message });
  }
});

app.post("/api/fluidizedbed", auth, async (req, res) => {
  try {
    const inputs = {
      particleDiameter: toNumber(req.body.particleDiameter, 0.00045),
      sphericity: toNumber(req.body.sphericity, 0.9),
      epsilonMf: toNumber(req.body.epsilonMf, 0.45),
      fluidDensity: toNumber(req.body.fluidDensity, 1.2),
      particleDensity: toNumber(req.body.particleDensity, 1400),
      fluidViscosity: toNumber(req.body.fluidViscosity, 1.9e-5),
      superficialVelocity: toNumber(req.body.superficialVelocity, 0.22),
      initialBedHeight: toNumber(req.body.initialBedHeight, 1.4)
    };

    const particleDiameter = Math.max(inputs.particleDiameter, 1e-12);
    const sphericity = clamp(inputs.sphericity, 0.1, 1.0);
    const epsilonMf = clamp(inputs.epsilonMf, 0.2, 0.8);
    const fluidDensity = Math.max(inputs.fluidDensity, 1e-12);
    const particleDensity = Math.max(inputs.particleDensity, fluidDensity + 1e-9);
    const fluidViscosity = Math.max(inputs.fluidViscosity, 1e-12);
    const superficialVelocity = Math.max(inputs.superficialVelocity, 0);
    const initialBedHeight = Math.max(inputs.initialBedHeight, 1e-12);

    const g = 9.81;
    const A =
      (1.75 * fluidDensity * (1 - epsilonMf)) /
      (sphericity * particleDiameter * Math.pow(epsilonMf, 3));
    const B =
      (150 * Math.pow(1 - epsilonMf, 2) * fluidViscosity) /
      (Math.pow(sphericity, 2) * Math.pow(particleDiameter, 2) * Math.pow(epsilonMf, 3));
    const C = -(particleDensity - fluidDensity) * g;
    const discriminant = Math.max(B * B - 4 * A * C, 0);

    let umf = 0;
    if (Math.abs(A) > 1e-14) {
      umf = (-B + Math.sqrt(discriminant)) / (2 * A);
    } else {
      umf = -C / Math.max(B, 1e-12);
    }
    umf = Math.max(umf, 1e-9);

    const reMf = (fluidDensity * umf * particleDiameter) / Math.max(fluidViscosity, 1e-12);
    const richardsonZakiN = reMf < 1 ? 4.8 : reMf < 500 ? 3.0 : 2.4;
    const epsilonOperating = clamp(
      epsilonMf * Math.pow(Math.max(superficialVelocity / umf, 1e-9), 1 / richardsonZakiN),
      epsilonMf,
      0.95
    );
    const expandedBedHeight =
      initialBedHeight * ((1 - epsilonMf) / Math.max(1 - epsilonOperating, 1e-9));
    const pressureDropAtMf = (particleDensity - fluidDensity) * (1 - epsilonMf) * g * initialBedHeight;

    const state =
      superficialVelocity < 0.9 * umf
        ? "Below fluidization"
        : superficialVelocity > 3.0 * umf
        ? "Fast fluidization risk"
        : "Fluidized regime";

    const results = {
      umf,
      reMf,
      epsilonOperating,
      expandedBedHeight,
      pressureDropAtMf,
      state
    };

    await saveSimulation(req.user.id, "fluidizedbed", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Fluidized bed simulation failed.", error: err.message });
  }
});

app.post("/api/rtd", auth, async (req, res) => {
  try {
    const inputs = {
      meanResidenceTime: toNumber(req.body.meanResidenceTime, 80),
      tanksInSeries: toNumber(req.body.tanksInSeries, 3),
      horizonMultiplier: toNumber(req.body.horizonMultiplier, 5)
    };

    const meanResidenceTime = Math.max(inputs.meanResidenceTime, 1e-12);
    const tanksInSeries = Math.max(1, Math.round(inputs.tanksInSeries));
    const horizonMultiplier = Math.max(inputs.horizonMultiplier, 1);

    const factorial = (n) => {
      let f = 1;
      for (let i = 2; i <= n; i++) f *= i;
      return f;
    };

    const profile = [];
    const steps = 100;
    const tMax = meanResidenceTime * horizonMultiplier;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax;
      const theta = (tanksInSeries * t) / meanResidenceTime;
      const e =
        (Math.pow(tanksInSeries / meanResidenceTime, tanksInSeries) *
          Math.pow(Math.max(t, 1e-12), tanksInSeries - 1) *
          Math.exp(-theta)) /
        Math.max(factorial(tanksInSeries - 1), 1e-12);

      let sum = 0;
      for (let k = 0; k <= tanksInSeries - 1; k++) {
        sum += Math.pow(theta, k) / Math.max(factorial(k), 1);
      }
      const f = 1 - Math.exp(-theta) * sum;
      profile.push({ t, e, f: clamp(f, 0, 1) });
    }

    const variance = (meanResidenceTime * meanResidenceTime) / tanksInSeries;
    const sigma = Math.sqrt(variance);
    const pecletEquivalent = 2 * tanksInSeries;

    const results = { variance, sigma, pecletEquivalent, profile };
    await saveSimulation(req.user.id, "rtd", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "RTD simulation failed.", error: err.message });
  }
});

app.post("/api/reactoroptimization", auth, async (req, res) => {
  try {
    const inputs = {
      flowRate: toNumber(req.body.flowRate, 1.2),
      ca0: toNumber(req.body.ca0, 1200),
      rateConstant: toNumber(req.body.rateConstant, 0.6),
      productValue: toNumber(req.body.productValue, 0.12),
      reactorCostRate: toNumber(req.body.reactorCostRate, 15),
      conversionMin: toNumber(req.body.conversionMin, 0.2),
      conversionMax: toNumber(req.body.conversionMax, 0.95)
    };

    const flowRate = Math.max(inputs.flowRate, 1e-12);
    const ca0 = Math.max(inputs.ca0, 1e-12);
    const rateConstant = Math.max(inputs.rateConstant, 1e-12);
    const conversionMin = clamp(inputs.conversionMin, 0.01, 0.98);
    const conversionMax = clamp(inputs.conversionMax, conversionMin + 0.01, 0.99);

    const sweep = [];
    let optimumConversion = conversionMin;
    let optimumVolume = 0;
    let optimumResidenceTime = 0;
    let maxProfit = -Infinity;

    for (let x = conversionMin; x <= conversionMax + 1e-12; x += 0.005) {
      const conversion = clamp(x, conversionMin, conversionMax);
      const volume = (flowRate * conversion) / (rateConstant * Math.max(1 - conversion, 1e-9));
      const residenceTime = volume / flowRate;
      const productionRate = flowRate * ca0 * conversion;
      const revenue = inputs.productValue * productionRate;
      const cost = inputs.reactorCostRate * volume;
      const profit = revenue - cost;

      sweep.push({ conversion, profit, volume });
      if (profit > maxProfit) {
        maxProfit = profit;
        optimumConversion = conversion;
        optimumVolume = volume;
        optimumResidenceTime = residenceTime;
      }
    }

    const results = { optimumConversion, optimumVolume, optimumResidenceTime, maxProfit, sweep };
    await saveSimulation(req.user.id, "reactoroptimization", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Reactor optimization simulation failed.", error: err.message });
  }
});

app.post("/api/diffusion", auth, async (req, res) => {
  try {
    const inputs = {
      t: toNumber(req.body.t, 298.15),
      p: toNumber(req.body.p, 101325),
      ma: toNumber(req.body.ma, 18),
      mb: toNumber(req.body.mb, 29),
      sumVa: toNumber(req.body.sumVa, 12.7),
      sumVb: toNumber(req.body.sumVb, 20.1),
      z: toNumber(req.body.z, 0.01),
      pa1: toNumber(req.body.pa1, 5000),
      pa2: toNumber(req.body.pa2, 1000),
      delta: toNumber(req.body.delta, 0.001),
      kg: toNumber(req.body.kg, 1e-4),
      kl: toNumber(req.body.kl, 1e-4),
      m: toNumber(req.body.m, 1.2)
    };

    const R = 8.314;
    const pAtm = inputs.p / 101325;
    
    // Fuller-Schettler-Giddings (FSG) diffusivity calculation
    const dab = (1.013e-7 * Math.pow(inputs.t, 1.75) * Math.sqrt(1 / inputs.ma + 1 / inputs.mb)) /
      (pAtm * Math.pow(Math.pow(inputs.sumVa, 1/3) + Math.pow(inputs.sumVb, 1/3), 2));

    // Fick's Law: Equimolar Counterdiffusion (EMD)
    const naEmd = (dab / (R * inputs.t * inputs.z)) * (inputs.pa1 - inputs.pa2);

    // Fick's Law: Unimolar Diffusion through stagnant gas (UMD)
    const pb1 = inputs.p - inputs.pa1;
    const pb2 = inputs.p - inputs.pa2;
    let pbLM = pb1;
    if (Math.abs(pb1 - pb2) > 1e-5) {
      pbLM = (pb2 - pb1) / Math.log(pb2 / pb1);
    }
    const naUmd = (dab * inputs.p / (R * inputs.t * inputs.z * pbLM)) * (inputs.pa1 - inputs.pa2);

    // Mass transfer film coefficient kc (film theory)
    const kc = dab / Math.max(inputs.delta, 1e-9);

    // Overall Mass Transfer Coefficients
    const KG = 1 / (1 / Math.max(inputs.kg, 1e-12) + inputs.m / Math.max(inputs.kl, 1e-12));
    const KL = 1 / (1 / Math.max(inputs.kl, 1e-12) + 1 / Math.max(inputs.m * inputs.kg, 1e-12));

    const results = { dab, naEmd, naUmd, kc, KG, KL };
    await saveSimulation(req.user.id, "diffusion", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Diffusion simulation failed.", error: err.message });
  }
});

app.post("/api/absorption", auth, async (req, res) => {
  try {
    const inputs = {
      gRate: toNumber(req.body.gRate, 10),
      y1: toNumber(req.body.y1, 0.05),
      y2: toNumber(req.body.y2, 0.005),
      x2: toNumber(req.body.x2, 0.0),
      m: toNumber(req.body.m, 1.2),
      fSolvent: toNumber(req.body.fSolvent, 1.4),
      efficiency: toNumber(req.body.efficiency, 0.7),
      htu: toNumber(req.body.htu, 0.6)
    };

    const x1Star = inputs.y1 / Math.max(inputs.m, 1e-9);
    const minLOverV = (inputs.y1 - inputs.y2) / Math.max(x1Star - inputs.x2, 1e-9);
    const lMin = inputs.gRate * minLOverV;
    const lOper = lMin * inputs.fSolvent;
    const absorptionFactor = lOper / Math.max(inputs.m * inputs.gRate, 1e-9);

    // Liquid composition at bottom (outlet) from material balance: V(y1 - y2) = L(x1 - x2)
    const x1 = inputs.x2 + (inputs.gRate / Math.max(lOper, 1e-9)) * (inputs.y1 - inputs.y2);

    // Number of ideal stages (Kremser equation)
    let nIdeal = 0;
    const A = absorptionFactor;
    if (Math.abs(A - 1.0) < 1e-6) {
      nIdeal = (inputs.y1 - inputs.y2) / Math.max(inputs.y2 - inputs.m * inputs.x2, 1e-9);
    } else {
      const term = ((inputs.y1 - inputs.m * inputs.x2) / Math.max(inputs.y2 - inputs.m * inputs.x2, 1e-12)) * (1 - 1 / A) + 1 / A;
      nIdeal = Math.log(Math.max(term, 1e-12)) / Math.log(A);
    }
    const nActual = nIdeal / Math.max(inputs.efficiency, 1e-9);

    // NTU calculations (Log-Mean Driving Force)
    const dy1 = inputs.y1 - inputs.m * x1;
    const dy2 = inputs.y2 - inputs.m * inputs.x2;
    let dyLM = dy1;
    if (Math.abs(dy1 - dy2) > 1e-6 && dy1 > 0 && dy2 > 0) {
      dyLM = (dy1 - dy2) / Math.log(dy1 / dy2);
    }
    const ntu = (inputs.y1 - inputs.y2) / Math.max(dyLM, 1e-12);
    const height = inputs.htu * ntu;

    // Operating Line Points
    const operatingLine = [
      { x: inputs.x2, y: inputs.y2 },
      { x: x1, y: inputs.y1 }
    ];
    // Equilibrium Line Points
    const equilibriumLine = [
      { x: 0, y: 0 },
      { x: x1, y: inputs.m * x1 }
    ];

    const results = { lMin, lOper, absorptionFactor, x1, nIdeal, nActual, ntu, height, operatingLine, equilibriumLine };
    await saveSimulation(req.user.id, "absorption", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Absorption column simulation failed.", error: err.message });
  }
});

app.post("/api/drying", auth, async (req, res) => {
  try {
    const inputs = {
      drySolidMass: toNumber(req.body.drySolidMass, 50),
      area: toNumber(req.body.area, 2.0),
      xInitial: toNumber(req.body.xInitial, 0.25),
      xCritical: toNumber(req.body.xCritical, 0.12),
      xEquilibrium: toNumber(req.body.xEquilibrium, 0.02),
      xFinal: toNumber(req.body.xFinal, 0.04),
      rc: toNumber(req.body.rc, 1.5)
    };

    // Constant rate period drying time
    let tConstant = 0;
    if (inputs.xInitial > inputs.xCritical) {
      tConstant = (inputs.drySolidMass / (inputs.area * inputs.rc)) * (inputs.xInitial - inputs.xCritical);
    }

    // Falling rate period drying time (linear assumption)
    const xStart = Math.min(inputs.xInitial, inputs.xCritical);
    // Final moisture content cannot go below equilibrium moisture content
    const xFinalClamped = Math.max(inputs.xFinal, inputs.xEquilibrium + 1e-4);
    
    let tFalling = 0;
    if (xStart > xFinalClamped) {
      tFalling = (inputs.drySolidMass * (inputs.xCritical - inputs.xEquilibrium) / (inputs.area * inputs.rc)) *
        Math.log((xStart - inputs.xEquilibrium) / (xFinalClamped - inputs.xEquilibrium));
    }

    const tTotal = tConstant + tFalling;

    // Generate Drying Rate Curve Points (R vs X)
    const dryingCurve = [];
    const steps = 40;
    const xRange = inputs.xInitial - inputs.xEquilibrium;
    for (let i = 0; i <= steps; i++) {
      const xVal = inputs.xEquilibrium + (i / steps) * xRange;
      let rate = 0;
      if (xVal >= inputs.xCritical) {
        rate = inputs.rc;
      } else {
        rate = inputs.rc * (xVal - inputs.xEquilibrium) / Math.max(inputs.xCritical - inputs.xEquilibrium, 1e-9);
      }
      dryingCurve.push({ x: xVal, rate });
    }

    const results = { tConstant, tFalling, tTotal, dryingCurve };
    await saveSimulation(req.user.id, "drying", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Drying simulation failed.", error: err.message });
  }
});

app.post("/api/economics", auth, async (req, res) => {
  try {
    const inputs = {
      deliveredEquipmentCost: toNumber(req.body.deliveredEquipmentCost, 100000),
      langFactor: toNumber(req.body.langFactor, 4.0),
      workingCapitalPercent: toNumber(req.body.workingCapitalPercent, 15),
      costIndexPast: toNumber(req.body.costIndexPast, 300),
      costIndexPresent: toNumber(req.body.costIndexPresent, 600),
      scalingExponent: toNumber(req.body.scalingExponent, 0.6),
      referenceCapacity: toNumber(req.body.referenceCapacity, 100),
      desiredCapacity: toNumber(req.body.desiredCapacity, 250),
      principal: toNumber(req.body.principal, 100000),
      nominalRate: toNumber(req.body.nominalRate, 0.08),
      interestPeriods: toNumber(req.body.interestPeriods, 12),
      years: toNumber(req.body.years, 10),
      annuityPayment: toNumber(req.body.annuityPayment, 15000),
      salvageValue: toNumber(req.body.salvageValue, 10000),
      capitalizedCostInterest: toNumber(req.body.capitalizedCostInterest, 0.06),
      taxRate: toNumber(req.body.taxRate, 0.02),
      annualRevenue: toNumber(req.body.annualRevenue, 120000),
      annualOperatingCost: toNumber(req.body.annualOperatingCost, 60000),
      incomeTaxRate: toNumber(req.body.incomeTaxRate, 0.30),
      fixedCost: toNumber(req.body.fixedCost, 30000),
      sellingPricePerUnit: toNumber(req.body.sellingPricePerUnit, 15),
      variableCostPerUnit: toNumber(req.body.variableCostPerUnit, 6)
    };

    // 1. Capital Cost & Scaling
    const deliveredCost = Math.max(0, inputs.deliveredEquipmentCost);
    const lang = Math.max(1, inputs.langFactor);
    const wcPct = Math.max(0, inputs.workingCapitalPercent);

    const fci = deliveredCost * lang;
    const wci = fci * (wcPct / 100);
    const tci = fci + wci;

    const pastIdx = Math.max(1, inputs.costIndexPast);
    const presIdx = Math.max(1, inputs.costIndexPresent);
    const costBaseIndex = deliveredCost * (presIdx / pastIdx);

    const scaleExp = inputs.scalingExponent;
    const refCap = Math.max(1e-6, inputs.referenceCapacity);
    const desCap = Math.max(0, inputs.desiredCapacity);
    const costScaled = deliveredCost * Math.pow(desCap / refCap, scaleExp);
    const costScaledPresent = costScaled * (presIdx / pastIdx);

    // 2. Interest and TVM
    const P = Math.max(0, inputs.principal);
    const r = Math.max(0, inputs.nominalRate);
    const m = Math.max(1, inputs.interestPeriods);
    const n = Math.max(1, inputs.years);

    const simpleInterest = P * r * n;
    const simpleFV = P + simpleInterest;

    const compoundFV = P * Math.pow(1 + r / m, m * n);
    const compoundInterest = compoundFV - P;

    const effectiveRate = Math.pow(1 + r / m, m) - 1;

    const presentWorthOfFV = P / Math.pow(1 + r, n);
    const futureWorthOfPV = P * Math.pow(1 + r, n);

    const A_pmt = Math.max(0, inputs.annuityPayment);
    let fvAnnuity = 0;
    let pvAnnuity = 0;
    if (r > 0) {
      fvAnnuity = A_pmt * (Math.pow(1 + r, n) - 1) / r;
      pvAnnuity = A_pmt * (1 - Math.pow(1 + r, -n)) / r;
    } else {
      fvAnnuity = A_pmt * n;
      pvAnnuity = A_pmt * n;
    }

    const Vs = Math.max(0, inputs.salvageValue);
    const iCap = Math.max(1e-4, inputs.capitalizedCostInterest);
    const capitalizedCost = P + (P - Vs) / (Math.pow(1 + iCap, n) - 1);

    const propertyTax = fci * Math.max(0, inputs.taxRate);

    // 3. Depreciation Methods
    const V0 = P;
    const slAnnual = (V0 - Vs) / n;
    
    let dbRate = 0;
    if (V0 > 0 && Vs >= 0 && Vs < V0) {
      dbRate = 1 - Math.pow(Vs / V0, 1 / n);
    } else {
      dbRate = 2 / n;
    }

    const sydSum = (n * (n + 1)) / 2;

    let sfPmt = 0;
    if (r > 0) {
      sfPmt = (V0 - Vs) * r / (Math.pow(1 + r, n) - 1);
    } else {
      sfPmt = (V0 - Vs) / n;
    }

    const depreciationSchedule = [];
    for (let year = 0; year <= n; year++) {
      const slVal = Math.max(Vs, V0 - year * slAnnual);
      const dbVal = Math.max(Vs, V0 * Math.pow(1 - dbRate, year));
      
      let sydAccum = 0;
      for (let y = 1; y <= year; y++) {
        sydAccum += (V0 - Vs) * (n - y + 1) / sydSum;
      }
      const sydVal = Math.max(Vs, V0 - sydAccum);
      
      let sfAccum = 0;
      if (r > 0) {
        sfAccum = sfPmt * (Math.pow(1 + r, year) - 1) / r;
      } else {
        sfAccum = sfPmt * year;
      }
      const sfVal = Math.max(Vs, V0 - sfAccum);

      depreciationSchedule.push({
        year,
        sl: slVal,
        db: dbVal,
        syd: sydVal,
        sf: sfVal
      });
    }

    // 4. Profitability & Cash Flow Analysis
    const rev = Math.max(0, inputs.annualRevenue);
    const opCost = Math.max(0, inputs.annualOperatingCost);
    const taxRateInc = Math.max(0, inputs.incomeTaxRate);

    const depSL = (fci - Vs) / n;
    const netIncomeBeforeTax = rev - opCost - depSL;
    const incTax = Math.max(0, netIncomeBeforeTax * taxRateInc);
    const netProfit = netIncomeBeforeTax - incTax;
    const ncf = netProfit + depSL;

    const paybackPeriod = ncf > 0 ? (fci / ncf) : Infinity;
    const roi = (fci > 0) ? (netProfit / fci) * 100 : 0;

    let npv = -fci;
    for (let y = 1; y <= n; y++) {
      npv += ncf / Math.pow(1 + r, y);
    }
    npv += Vs / Math.pow(1 + r, n);

    let irr = 0;
    let low = -0.99;
    let high = 5.0;
    let solved = false;
    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2;
      let val = -fci;
      for (let y = 1; y <= n; y++) {
        val += ncf / Math.pow(1 + mid, y);
      }
      val += Vs / Math.pow(1 + mid, n);
      if (Math.abs(val) < 1e-4) {
        irr = mid;
        solved = true;
        break;
      }
      if (val > 0) {
        low = mid;
      } else {
        high = mid;
      }
    }
    if (!solved) irr = (low + high) / 2;

    // Break-even Analysis
    const fixedC = Math.max(0, inputs.fixedCost);
    const price = Math.max(0, inputs.sellingPricePerUnit);
    const varC = Math.max(0, inputs.variableCostPerUnit);

    let breakEvenUnits = 0;
    let breakEvenSales = 0;
    let contributionMarginRatio = 0;

    if (price > varC) {
      breakEvenUnits = fixedC / (price - varC);
      breakEvenSales = breakEvenUnits * price;
      contributionMarginRatio = (price - varC) / price;
    } else {
      breakEvenUnits = Infinity;
      breakEvenSales = Infinity;
      contributionMarginRatio = 0;
    }

    const limitQty = (breakEvenUnits && isFinite(breakEvenUnits)) ? Math.max(10, Math.ceil(breakEvenUnits * 2)) : 10000;
    const breakEvenCurve = [];
    const beSteps = 20;
    for (let idx = 0; idx <= beSteps; idx++) {
      const qty = (idx / beSteps) * limitQty;
      const totalRev = qty * price;
      const totalC = fixedC + qty * varC;
      breakEvenCurve.push({ qty, revenue: totalRev, cost: totalC });
    }

    const results = {
      fci, wci, tci,
      costBaseIndex, costScaled, costScaledPresent,
      simpleInterest, simpleFV,
      compoundInterest, compoundFV,
      effectiveRate,
      presentWorthOfFV, futureWorthOfPV,
      fvAnnuity, pvAnnuity,
      capitalizedCost,
      propertyTax,
      depreciationSchedule,
      paybackPeriod, roi, npv, irr,
      breakEvenUnits, breakEvenSales, contributionMarginRatio,
      breakEvenCurve
    };

    await saveSimulation(req.user.id, "economics", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Economics simulation failed.", error: err.message });
  }
});

app.post("/api/distillation_design", auth, async (req, res) => {
  try {
    const inputs = {
      alpha: toNumber(req.body.alpha, 2.5),
      xD: toNumber(req.body.xD, 0.95),
      xB: toNumber(req.body.xB, 0.05),
      xF: toNumber(req.body.xF, 0.5),
      qVal: toNumber(req.body.qVal, 1.0),
      refluxRatio: toNumber(req.body.refluxRatio, 2.0),
      murphreeEfficiency: toNumber(req.body.murphreeEfficiency, 0.70),
      vaporFlowRate: toNumber(req.body.vaporFlowRate, 5.0),
      liquidFlowRate: toNumber(req.body.liquidFlowRate, 4.0),
      vaporDensity: toNumber(req.body.vaporDensity, 1.5),
      liquidDensity: toNumber(req.body.liquidDensity, 800.0),
      surfaceTension: toNumber(req.body.surfaceTension, 20.0),
      traySpacing: toNumber(req.body.traySpacing, 0.45),
      activeFraction: toNumber(req.body.activeFraction, 0.85),
      derateFactor: toNumber(req.body.derateFactor, 0.85),
      weirHeight: toNumber(req.body.weirHeight, 50.0),
      holeAreaFraction: toNumber(req.body.holeAreaFraction, 0.10)
    };

    // 1. Column Sizing / Sieve Tray Diameter
    // Souders-Brown capacity parameter Csb
    const Csb = (0.012 * inputs.traySpacing + 0.005) * Math.pow(Math.max(inputs.surfaceTension, 1.0) / 20.0, 0.2);
    const uf = Csb * Math.sqrt((inputs.liquidDensity - inputs.vaporDensity) / Math.max(inputs.vaporDensity, 1e-6));
    const us = uf * inputs.derateFactor;
    
    // Column cross-sectional area and diameter
    const Ac = (inputs.vaporFlowRate / Math.max(inputs.vaporDensity, 1e-6)) / Math.max(inputs.activeFraction * us, 1e-6);
    const Dc = Math.sqrt(4 * Ac / Math.PI);

    // Perforation / hole velocity
    const holeArea = Ac * inputs.activeFraction * inputs.holeAreaFraction;
    const uHole = (inputs.vaporFlowRate / Math.max(inputs.vaporDensity, 1e-6)) / Math.max(holeArea, 1e-9);
    
    // Dry plate drop (mm liquid): hd = 50.8 * (u_hole/0.85)^2 * (rho_v / rho_l)
    const hd = 50.8 * Math.pow(uHole / 0.85, 2) * (inputs.vaporDensity / Math.max(inputs.liquidDensity, 1e-6));
    const hl = inputs.weirHeight + 10; // Weir crest approximation
    const totalTrayPressureDrop = hd + hl;

    // Minimum weep velocity (approximated weep point check)
    const minWeepVelocity = 4.5 * Math.pow(inputs.surfaceTension / Math.max(inputs.vaporDensity, 1e-6), 0.25);

    // 2. McCabe-Thiele with Murphree Tray Efficiency
    const alpha = Math.max(inputs.alpha, 1.001);
    const xD = clamp(inputs.xD, 1e-5, 0.99999);
    const xB = clamp(inputs.xB, 1e-5, 0.99999);
    const xF = clamp(inputs.xF, 1e-5, 0.99999);
    const R = Math.max(inputs.refluxRatio, 0.1);
    const Emv = clamp(inputs.murphreeEfficiency, 0.05, 1.0);

    const slopeRect = R / (R + 1);
    const interRect = xD / (R + 1);

    // Intersection (pinch point approximation)
    let xInt = xF, yInt = (alpha * xF) / (1 + (alpha - 1) * xF);
    if (Math.abs(inputs.qVal - 1.0) > 1e-6) {
      const q = inputs.qVal;
      const slopeQ = q / (q - 1);
      const interQ = -xF / (q - 1);
      xInt = (interRect - interQ) / (slopeQ - slopeRect);
      yInt = slopeRect * xInt + interRect;
    }
    const slopeStrip = (yInt - xB) / Math.max(xInt - xB, 1e-9);
    const interStrip = xB - slopeStrip * xB;

    const stages = [];
    let xCurr = xD;
    let yCurr = xD;
    let nStages = 0;
    
    stages.push({ x: xCurr, y: yCurr });
    while (xCurr > xB && nStages < 100) {
      nStages++;
      // Equilibrium value y* for xCurr
      const yStar = (alpha * xCurr) / (1 + (alpha - 1) * xCurr);
      // Murphree adjustment: actual change in vapor composition is Emv * (yStar - yPrev)
      // Since we step down: actual vapor y_n = y_n-1 - Emv * (y_n-1 - yStar)
      yCurr = Math.max(xB, yCurr - Emv * (yCurr - yStar));
      stages.push({ x: xCurr, y: yCurr });

      // Determine next liquid composition xCurr from operating lines
      if (xCurr > xInt) {
        xCurr = (yCurr - interRect) / Math.max(slopeRect, 1e-9);
      } else {
        xCurr = (yCurr - interStrip) / Math.max(slopeStrip, 1e-9);
      }
      xCurr = clamp(xCurr, xB * 0.1, xD);
      stages.push({ x: xCurr, y: yCurr });
    }

    // 3. Ponchon-Savarit Enthalpy Curves & Stage Stepping
    // Saturated liquid (h) and vapor (H) enthalpy coordinates
    const enthalpyCurves = [];
    const tRef = 273.15;
    const tSatA = 351.5;
    const tSatB = 373.15;
    const cpLA = 150;
    const cpLB = 130;
    const cpVA = 80;
    const cpVB = 70;
    const latentA = 30000;
    const latentB = 32000;

    const calcH = (x) => {
      const t = x * tSatA + (1 - x) * tSatB;
      const cpL = x * cpLA + (1 - x) * cpLB;
      return cpL * (t - tRef);
    };
    const calcHV = (y) => {
      const t = y * tSatA + (1 - y) * tSatB;
      const cpV = y * cpVA + (1 - y) * cpVB;
      const latent = y * latentA + (1 - y) * latentB;
      return cpV * (t - tRef) + latent;
    };

    for (let i = 0; i <= 20; i++) {
      const zVal = i / 20;
      enthalpyCurves.push({
        z: zVal,
        h: calcH(zVal),
        H: calcHV(zVal)
      });
    }

    // Operating focal points QD and QB
    const hD = calcH(xD);
    const H1 = calcHV(xD); // first vapor leaving column is xD
    const QD = hD + (R + 1) * (H1 - hD);
    
    const hF = calcH(xF);
    const HF = calcHV(xF);
    const HF_feed = inputs.qVal * hF + (1 - inputs.qVal) * HF;
    
    // Bottom focal point QB from feed line intersection: QD, F_feed, QB lie on a straight line
    const QB = QD - ((QD - HF_feed) / Math.max(xD - xF, 1e-9)) * (xD - xB);

    // Ponchon-Savarit stages stepping coordinates
    const psStages = [];
    let xpCurr = xD;
    let ypCurr = xD;
    let psCount = 0;

    psStages.push({ x: xpCurr, y: ypCurr, h: calcH(xpCurr), H: calcHV(ypCurr) });
    while (xpCurr > xB && psCount < 50) {
      psCount++;
      // 1. Equilibrium step (tie line): find liquid composition in equilibrium with ypCurr
      xpCurr = ypCurr / (alpha - ypCurr * (alpha - 1));
      xpCurr = clamp(xpCurr, xB * 0.1, xD);
      
      const hCurr = calcH(xpCurr);
      const HCurr = calcHV(ypCurr);
      psStages.push({ x: xpCurr, y: ypCurr, h: hCurr, H: HCurr });

      // 2. Operating step: draw line from operating point (QD or QB) through (xpCurr, hCurr) to intercept Sat Vapor line
      const QFocal = xpCurr > xInt ? QD : QB;
      const xFocal = xpCurr > xInt ? xD : xB;
      
      // Slope of line connecting Focal point and (xpCurr, hCurr)
      const slopeLine = (QFocal - hCurr) / Math.max(xFocal - xpCurr, 1e-9);
      
      // Bisection to find intersection of Sat Vapor Enthalpy H(y) and operating line: H(y) = hCurr + slopeLine * (y - xpCurr)
      let yL = 0;
      let yH = 1;
      let yIntersectPS = xpCurr;
      for (let iter = 0; iter < 40; iter++) {
        const yM = (yL + yH) / 2;
        const hValLine = hCurr + slopeLine * (yM - xpCurr);
        const hValVap = calcHV(yM);
        if (hValVap > hValLine) {
          if (slopeLine > 0) yL = yM; else yH = yM;
        } else {
          if (slopeLine > 0) yH = yM; else yL = yM;
        }
        yIntersectPS = yM;
      }
      ypCurr = yIntersectPS;
      psStages.push({ x: xpCurr, y: ypCurr, h: hCurr, H: calcHV(ypCurr) });
    }

    const results = {
      Csb, uf, us, Ac, Dc, hd, totalTrayPressureDrop, uHole, minWeepVelocity,
      nStages, stages, xInt, yInt, QD, QB, psCount, psStages, enthalpyCurves
    };

    await saveSimulation(req.user.id, "distillation_design", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Distillation design failed.", error: err.message });
  }
});

app.post("/api/extraction_leaching", auth, async (req, res) => {
  try {
    const inputs = {
      feedRate: toNumber(req.body.feedRate, 100.0),
      xF: toNumber(req.body.xF, 0.15),
      solventRate: toNumber(req.body.solventRate, 120.0),
      yS: toNumber(req.body.yS, 0.0),
      partitionCoefficient: toNumber(req.body.partitionCoefficient, 2.5),
      extractionStages: toNumber(req.body.extractionStages, 3),
      targetRaffinate: toNumber(req.body.targetRaffinate, 0.01),
      feedInertSolid: toNumber(req.body.feedInertSolid, 100.0),
      feedSolute: toNumber(req.body.feedSolute, 20.0),
      leachingSolventRate: toNumber(req.body.leachingSolventRate, 150.0),
      solventRetention: toNumber(req.body.solventRetention, 0.5),
      leachingTargetRecovery: toNumber(req.body.leachingTargetRecovery, 0.95)
    };

    // 1. Cross-current Liquid-Liquid Extraction
    const K = Math.max(inputs.partitionCoefficient, 0.1);
    const N_ext = Math.max(inputs.extractionStages, 1);
    const solventPerStage = inputs.solventRate / N_ext;
    
    let xCurr = inputs.xF;
    const crossStages = [];
    crossStages.push({ stage: 0, x: xCurr, y: 0 });
    for (let i = 1; i <= N_ext; i++) {
      // Stage mass balance: feed solute = raffinate + extract
      xCurr = xCurr / (1 + K * (solventPerStage / Math.max(inputs.feedRate, 1e-9)));
      crossStages.push({
        stage: i,
        x: clamp(xCurr, 0, 1),
        y: clamp(K * xCurr, 0, 1)
      });
    }
    const finalRaffinateCross = xCurr;
    const recoveryCross = (inputs.xF - finalRaffinateCross) / Math.max(inputs.xF, 1e-9) * 100;

    // 2. Counter-current Extraction Sizing (Ideal Stages)
    const E = K * (inputs.solventRate / Math.max(inputs.feedRate, 1e-9));
    let ccStagesReq = 0;
    if (Math.abs(E - 1.0) < 1e-5) {
      ccStagesReq = (inputs.xF - inputs.targetRaffinate) / Math.max(inputs.targetRaffinate - inputs.yS / K, 1e-9);
    } else {
      const term = ((inputs.xF - inputs.yS / K) / Math.max(inputs.targetRaffinate - inputs.yS / K, 1e-12)) * (1 - 1 / E) + 1 / E;
      ccStagesReq = Math.log(Math.max(term, 1e-12)) / Math.log(E);
    }

    // 3. Counter-current Solid-Liquid Leaching
    // Underflow solution rate L (kg/h) = Inert Solid * solventRetention
    const L = inputs.feedInertSolid * inputs.solventRetention;
    const V = inputs.leachingSolventRate;
    
    // Leaching recovery stages calculation:
    // Solve: recovery fraction recovery = 1 - underflow exit solute / feed solute
    // Solute concentration in feed underflow y0: solute / (solute + solution solvent)
    const y0 = inputs.feedSolute / Math.max(inputs.feedSolute + L, 1e-9);
    const soluteInExit = (1 - inputs.leachingTargetRecovery) * inputs.feedSolute;
    const yN = soluteInExit / Math.max(L, 1e-9);

    let leachingStagesReq = 0;
    const alphaLeach = L / Math.max(V, 1e-9);
    if (Math.abs(alphaLeach - 1.0) < 1e-5) {
      leachingStagesReq = (y0 - yN) / Math.max(yN, 1e-9);
    } else {
      const termLeach = (y0 * (1 - alphaLeach) + yN * alphaLeach) / Math.max(yN, 1e-12);
      leachingStagesReq = Math.abs(Math.log(Math.max(termLeach, 1e-12)) / Math.log(alphaLeach));
    }

    const leachingStagesDetail = [];
    for (let i = 0; i <= Math.min(20, Math.ceil(leachingStagesReq)); i++) {
      let yVal = yN;
      if (Math.abs(alphaLeach - 1.0) < 1e-5) {
        yVal = yN + (y0 - yN) * (i / Math.max(leachingStagesReq, 1));
      } else {
        yVal = yN * (Math.pow(alphaLeach, i) - 1) / (Math.pow(alphaLeach, leachingStagesReq) - 1) * (y0 / Math.max(yN, 1e-9) - 1) + yN;
      }
      leachingStagesDetail.push({ stage: i, y: clamp(yVal, 0, 1) });
    }

    const results = {
      crossStages, finalRaffinateCross, recoveryCross, ccStagesReq, leachingStagesReq, leachingStagesDetail
    };

    await saveSimulation(req.user.id, "extraction_leaching", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Extraction & Leaching failed.", error: err.message });
  }
});

app.post("/api/adsorption", auth, async (req, res) => {
  try {
    const inputs = {
      adsorptionModel: req.body.adsorptionModel || "langmuir",
      langmuirQm: toNumber(req.body.langmuirQm, 50.0),
      langmuirKl: toNumber(req.body.langmuirKl, 0.2),
      freundlichKf: toNumber(req.body.freundlichKf, 5.0),
      freundlichN: toNumber(req.body.freundlichN, 2.5),
      adsorbateConc: toNumber(req.body.adsorbateConc, 10.0),
      bedLength: toNumber(req.body.bedLength, 2.0),
      bedDiameter: toNumber(req.body.bedDiameter, 0.5),
      bedVoidage: toNumber(req.body.bedVoidage, 0.40),
      adsorbentDensity: toNumber(req.body.adsorbentDensity, 800.0),
      feedFlowRate: toNumber(req.body.feedFlowRate, 5.0),
      feedConcentration: toNumber(req.body.feedConcentration, 100.0),
      thomasRateConstant: toNumber(req.body.thomasRateConstant, 0.05),
      breakthroughRatio: toNumber(req.body.breakthroughRatio, 0.05),
      saturationRatio: toNumber(req.body.saturationRatio, 0.95)
    };

    // 1. Isotherm Calculation
    let qCapacity = 0;
    const C = inputs.adsorbateConc;
    if (inputs.adsorptionModel === "langmuir") {
      qCapacity = (inputs.langmuirQm * inputs.langmuirKl * C) / (1 + inputs.langmuirKl * C);
    } else {
      qCapacity = inputs.freundlichKf * Math.pow(Math.max(C, 0), 1 / Math.max(inputs.freundlichN, 0.1));
    }

    // 2. Fixed-Bed Breakthrough Curve (Thomas Model)
    // Bed mass
    const Ac = (Math.PI * Math.pow(inputs.bedDiameter, 2)) / 4;
    const mBed = Ac * inputs.bedLength * inputs.adsorbentDensity; // kg
    
    // Equilibrium capacity at feed concentration C0
    const C0 = inputs.feedConcentration;
    let q0 = 0;
    if (inputs.adsorptionModel === "langmuir") {
      q0 = (inputs.langmuirQm * inputs.langmuirKl * C0) / (1 + inputs.langmuirKl * C0);
    } else {
      q0 = inputs.freundlichKf * Math.pow(Math.max(C0, 0), 1 / Math.max(inputs.freundlichN, 0.1));
    }

    // Thomas parameters
    // Q is flow rate in L/h: feedFlowRate (m3/h) * 1000
    const Q = inputs.feedFlowRate * 1000;
    const kTh = inputs.thomasRateConstant; // L/mg.h

    // Stoichiometric / 50% breakthrough time (h): t0.5 = q0 * mBed / (Q * C0 * 1e-6)
    // units: q0 in mg/g = g/kg, mBed in kg -> total adsorbate capacity is q0 * mBed (g) = q0 * mBed * 1000 (mg)
    // Q * C0 (mg/h)
    const t05 = (q0 * mBed * 1000) / Math.max(Q * C0, 1e-9);
    const k = kTh * C0; // h-1

    // Breakthrough and Saturation Times
    // C/C0 = 1 / (1 + exp(-k * (t - t0.5)))
    // ln(1/ratio - 1) = -k * (t - t0.5) -> t = t0.5 - ln(1/ratio - 1)/k
    const tBreakthrough = Math.max(0, t05 - Math.log(1 / inputs.breakthroughRatio - 1) / Math.max(k, 1e-6));
    const tSaturation = Math.max(0, t05 - Math.log(1 / inputs.saturationRatio - 1) / Math.max(k, 1e-6));
    const LUB = inputs.bedLength * (1 - tBreakthrough / Math.max(t05, 1e-9));

    // Generate Breakthrough Curve Points
    const breakthroughCurve = [];
    const steps = 40;
    const maxT = Math.max(1, tSaturation * 1.5);
    for (let idx = 0; idx <= steps; idx++) {
      const timeVal = (idx / steps) * maxT;
      const cRatio = 1 / (1 + Math.exp(-k * (timeVal - t05)));
      breakthroughCurve.push({ t: timeVal, ratio: clamp(cRatio, 0, 1) });
    }

    const results = {
      qCapacity, mBed, q0, t05, tBreakthrough, tSaturation, LUB, breakthroughCurve
    };

    await saveSimulation(req.user.id, "adsorption", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Adsorption simulation failed.", error: err.message });
  }
});

app.post("/api/humidification", auth, async (req, res) => {
  try {
    const inputs = {
      dryBulbTemp: toNumber(req.body.dryBulbTemp, 30.0),
      relativeHumidity: toNumber(req.body.relativeHumidity, 60.0),
      totalPressure: toNumber(req.body.totalPressure, 101325),
      waterInletTemp: toNumber(req.body.waterInletTemp, 40.0),
      waterOutletTemp: toNumber(req.body.waterOutletTemp, 28.0),
      airInletWetBulb: toNumber(req.body.airInletWetBulb, 24.0),
      liquidGasRatio: toNumber(req.body.liquidGasRatio, 1.2),
      overallHTU: toNumber(req.body.overallHTU, 1.5)
    };

    const Td = inputs.dryBulbTemp;
    const RH = clamp(inputs.relativeHumidity, 0, 100);
    const P = inputs.totalPressure;

    // 1. Psychrometric Properties
    // Antoine saturated vapor pressure of water in Pa
    const pSat = 1000 * Math.exp(16.3872 - 3885.70 / (Td + 230.17));
    const pV = (RH / 100) * pSat;
    
    const Y = 0.622 * pV / Math.max(P - pV, 1e-9);
    const YSat = 0.622 * pSat / Math.max(P - pSat, 1e-9);
    const pctHumidity = (Y / Math.max(YSat, 1e-9)) * 100;
    
    // Dew Point
    const Tdp = pV > 0 ? (3885.70 / (16.3872 - Math.log(pV / 1000.0)) - 230.17) : 0;
    
    const cs = 1.005 + 1.88 * Y;
    const vH = (1 / 28.97 + Y / 18.02) * 8314 * (Td + 273.15) / P;
    const Ha = cs * Td + Y * 2501.3;

    // 2. Cooling Tower Design / Simpson Integration
    // Air inlet wet-bulb properties
    const TwIn = inputs.airInletWetBulb;
    const pSatTw = 1000 * Math.exp(16.3872 - 3885.70 / (TwIn + 230.17));
    const YTw = 0.622 * pSatTw / Math.max(P - pSatTw, 1e-9);
    const csTw = 1.005 + 1.88 * YTw;
    const Hin = csTw * TwIn + YTw * 2501.3; // kJ/kg dry air

    // NTU numerical integration
    // NTU = Integral_Tout^Tin [ 4.184 * dT / (H* - Hy) ]
    const cpL = 4.184; // kJ/kg.C
    const N = 40;
    const hStep = (inputs.waterInletTemp - inputs.waterOutletTemp) / N;

    // Enthalpy curves for plot
    const coolingPath = [];
    
    const getIntegrand = (tempWater) => {
      // Saturated air enthalpy H* at tempWater
      const pSatNode = 1000 * Math.exp(16.3872 - 3885.70 / (tempWater + 230.17));
      const ySatNode = 0.622 * pSatNode / Math.max(P - pSatNode, 1e-9);
      const csNode = 1.005 + 1.88 * ySatNode;
      const HStar = csNode * tempWater + ySatNode * 2501.3;

      // Operating air enthalpy Hy
      const Hy = Hin + (inputs.liquidGasRatio * cpL) * (tempWater - inputs.waterOutletTemp);
      
      const drivingForce = Math.max(HStar - Hy, 0.5);
      return { HStar, Hy, integrand: cpL / drivingForce };
    };

    let integral = 0;
    for (let j = 0; j <= N; j++) {
      const tempWater = inputs.waterOutletTemp + j * hStep;
      const { HStar, Hy, integrand } = getIntegrand(tempWater);
      
      let coeff = 2;
      if (j === 0 || j === N) coeff = 1;
      else if (j % 2 === 1) coeff = 4;
      
      integral += coeff * integrand;
      coolingPath.push({ temp: tempWater, HStar, Hy });
    }

    const ntu = (hStep / 3) * integral;
    const coolingTowerHeight = inputs.overallHTU * ntu;

    const results = {
      pSat, pV, Y, YSat, pctHumidity, Tdp, cs, vH, Ha, Hin, ntu, coolingTowerHeight, coolingPath
    };

    await saveSimulation(req.user.id, "humidification", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Humidification failed.", error: err.message });
  }
});

app.post("/api/momentum_transport", auth, async (req, res) => {
  try {
    const inputs = {
      flowSystem: req.body.flowSystem || "pipe",
      dimension: toNumber(req.body.dimension, 0.05),
      length: toNumber(req.body.length, 10.0),
      pressureDrop: toNumber(req.body.pressureDrop, 100.0),
      viscosity: toNumber(req.body.viscosity, 0.001),
      density: toNumber(req.body.density, 1000.0),
      plateDistance: toNumber(req.body.plateDistance, 1.0),
      freeStreamVelocity: toNumber(req.body.freeStreamVelocity, 2.0)
    };

    const R_W = inputs.dimension;
    const L = inputs.length;
    const dP = inputs.pressureDrop;
    const mu = Math.max(inputs.viscosity, 1e-6);
    const rho = Math.max(inputs.density, 1e-3);

    let vMax = 0;
    let vAvg = 0;
    let Re = 0;
    let flowRate = 0;
    const velocityProfile = [];

    const steps = 40;
    if (inputs.flowSystem === "pipe") {
      vMax = (dP * R_W * R_W) / (4 * mu * L);
      vAvg = vMax / 2;
      flowRate = vAvg * Math.PI * R_W * R_W;
      const Deq = 2 * R_W;
      Re = (Deq * vAvg * rho) / mu;

      for (let i = 0; i <= steps; i++) {
        const rVal = (i / steps) * R_W;
        const velocity = vMax * (1 - Math.pow(rVal / R_W, 2));
        const shearStress = (dP / (2 * L)) * rVal;
        velocityProfile.push({ coord: rVal, velocity, shearStress });
      }
    } else {
      vMax = (dP * R_W * R_W) / (2 * mu * L);
      vAvg = (2 * vMax) / 3;
      flowRate = vAvg * (2 * R_W);
      const Deq = 4 * R_W;
      Re = (Deq * vAvg * rho) / mu;

      for (let i = 0; i <= steps; i++) {
        const xVal = (i / steps) * R_W;
        const velocity = vMax * (1 - Math.pow(xVal / R_W, 2));
        const shearStress = (dP / L) * xVal;
        velocityProfile.push({ coord: xVal, velocity, shearStress });
      }
    }

    const x = inputs.plateDistance;
    const Uinf = inputs.freeStreamVelocity;
    const nu = mu / rho;
    const Rex = (rho * Uinf * x) / mu;

    let delta = 0;
    let deltaStar = 0;
    let theta = 0;
    let Cfx = 0;
    let flowRegime = "laminar";

    if (Rex < 500000) {
      delta = (5.0 * x) / Math.sqrt(Rex);
      deltaStar = (1.72 * x) / Math.sqrt(Rex);
      theta = (0.664 * x) / Math.sqrt(Rex);
      Cfx = 0.664 / Math.sqrt(Rex);
    } else {
      flowRegime = "turbulent";
      delta = (0.37 * x) / Math.pow(Rex, 0.2);
      deltaStar = delta / 8;
      theta = (7 / 72) * delta;
      Cfx = 0.0592 / Math.pow(Rex, 0.2);
    }

    const blasiusProfile = [];
    let fVal = 0;
    let dfVal = 0;
    let ddfVal = 0.33206;
    let eta = 0;
    const h = 0.15;
    const numSteps = 50;

    let y = [0, 0, ddfVal];

    const derivs = (etaVal, yVal) => {
      return [yVal[1], yVal[2], -0.5 * yVal[0] * yVal[2]];
    };

    blasiusProfile.push({ eta: 0, f: y[0], uRatio: y[1], shearRatio: y[2] });
    for (let i = 1; i <= numSteps; i++) {
      const k1 = derivs(eta, y);
      const yTemp2 = [y[0] + 0.5 * h * k1[0], y[1] + 0.5 * h * k1[1], y[2] + 0.5 * h * k1[2]];
      const k2 = derivs(eta + 0.5 * h, yTemp2);
      const yTemp3 = [y[0] + 0.5 * h * k2[0], y[1] + 0.5 * h * k2[1], y[2] + 0.5 * h * k2[2]];
      const k3 = derivs(eta + 0.5 * h, yTemp3);
      const yTemp4 = [y[0] + h * k3[0], y[1] + h * k3[1], y[2] + h * k3[2]];
      const k4 = derivs(eta + h, yTemp4);

      y[0] += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      y[1] += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      y[2] += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
      eta += h;

      blasiusProfile.push({
        eta,
        f: y[0],
        uRatio: Math.min(1.0, y[1]),
        shearRatio: y[2]
      });
    }

    const results = {
      vMax, vAvg, Re, flowRate, velocityProfile,
      Rex, delta, deltaStar, theta, Cfx, flowRegime, blasiusProfile
    };

    await saveSimulation(req.user.id, "momentum_transport", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Momentum transport simulation failed.", error: err.message });
  }
});

app.post("/api/heat_mass_transport", auth, async (req, res) => {
  try {
    const inputs = {
      wireRadius: toNumber(req.body.wireRadius, 0.002),
      thermalConductivity: toNumber(req.body.thermalConductivity, 15.0),
      heatGeneration: toNumber(req.body.heatGeneration, 2.0e7),
      surfaceTemp: toNumber(req.body.surfaceTemp, 323.15),
      filmThickness: toNumber(req.body.filmThickness, 0.001),
      diffusionCoeff: toNumber(req.body.diffusionCoeff, 1e-9),
      reactionConstant: toNumber(req.body.reactionConstant, 0.05),
      feedConcentration: toNumber(req.body.feedConcentration, 100.0),
      pdeType: req.body.pdeType || "heat",
      domainLength: toNumber(req.body.domainLength, 0.1),
      diffusivity: toNumber(req.body.diffusivity, 1e-5),
      initialValue: toNumber(req.body.initialValue, 298.15),
      leftBC: toNumber(req.body.leftBC, 373.15),
      rightBC: toNumber(req.body.rightBC, 298.15),
      pdeTime: toNumber(req.body.pdeTime, 100.0)
    };

    const R = inputs.wireRadius;
    const kHeat = Math.max(inputs.thermalConductivity, 1e-3);
    const Sg = inputs.heatGeneration;
    const Tw = inputs.surfaceTemp;

    const tMax = Tw + (Sg * R * R) / (4 * kHeat);
    const heatProfile = [];
    const nNodes = 20;
    for (let i = 0; i <= nNodes; i++) {
      const r = (i / nNodes) * R;
      const T = Tw + ((Sg * R * R) / (4 * kHeat)) * (1 - Math.pow(r / R, 2));
      heatProfile.push({ radius: r, temp: T });
    }

    const Lf = inputs.filmThickness;
    const Dab = Math.max(inputs.diffusionCoeff, 1e-12);
    const krx = Math.max(inputs.reactionConstant, 0);
    const Ca0 = inputs.feedConcentration;

    const phi = Lf * Math.sqrt(krx / Dab);
    const massProfile = [];
    
    const sinh = (val) => (Math.exp(val) - Math.exp(-val)) / 2;
    const denomSinh = sinh(phi);

    for (let i = 0; i <= nNodes; i++) {
      const z = (i / nNodes) * Lf;
      let Ca = 0;
      if (krx === 0) {
        Ca = Ca0 * (1 - z / Lf);
      } else {
        Ca = Ca0 * sinh(phi * (1 - z / Lf)) / Math.max(denomSinh, 1e-9);
      }
      massProfile.push({ z, conc: Ca });
    }

    const L_pde = inputs.domainLength;
    const diff_pde = Math.max(inputs.diffusivity, 1e-12);
    const initVal = inputs.initialValue;
    const L_bc = inputs.leftBC;
    const R_bc = inputs.rightBC;
    const t_pde = inputs.pdeTime;

    const Nx = 20;
    const dx = L_pde / Nx;
    
    const dtMax = (0.45 * dx * dx) / diff_pde;
    const nSteps = Math.min(1000, Math.ceil(t_pde / dtMax));
    const dt = t_pde / nSteps;
    const Fo = (diff_pde * dt) / (dx * dx);

    let U = new Array(Nx + 1).fill(initVal);
    U[0] = L_bc;
    U[Nx] = R_bc;

    const savedTimes = [0, 0.25, 0.5, 0.75, 1.0].map(f => Math.round(f * nSteps));
    const pdeHistory = [];

    pdeHistory.push({ timeStep: 0, time: 0, profile: [...U] });

    for (let step = 1; step <= nSteps; step++) {
      let U_new = [...U];
      for (let i = 1; i < Nx; i++) {
        U_new[i] = U[i] + Fo * (U[i + 1] - 2 * U[i] + U[i - 1]);
      }
      U_new[0] = L_bc;
      U_new[Nx] = R_bc;
      U = U_new;

      if (savedTimes.includes(step)) {
        pdeHistory.push({
          timeStep: step,
          time: step * dt,
          profile: [...U]
        });
      }
    }

    const results = {
      tMax, heatProfile, phi, massProfile,
      Fo, dx, dt, nSteps, pdeHistory
    };

    await saveSimulation(req.user.id, "heat_mass_transport", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Heat & Mass transport simulation failed.", error: err.message });
  }
});

app.post("/api/coupled_transport_solvers", auth, async (req, res) => {
  try {
    const inputs = {
      pelletRadius: toNumber(req.body.pelletRadius, 0.005),
      effDiffusivity: toNumber(req.body.effDiffusivity, 1e-6),
      effConductivity: toNumber(req.body.effConductivity, 0.2),
      reactionEnthalpy: toNumber(req.body.reactionEnthalpy, 8e4),
      arrheniusPreExp: toNumber(req.body.arrheniusPreExp, 1.2e8),
      activationEnergy: toNumber(req.body.activationEnergy, 6e4),
      surfaceConcentration: toNumber(req.body.surfaceConcentration, 20.0),
      surfaceTemp: toNumber(req.body.surfaceTemp, 350.0),
      airTemp: toNumber(req.body.airTemp, 323.15),
      airHumidity: toNumber(req.body.airHumidity, 0.015),
      totalPressure: toNumber(req.body.totalPressure, 101325),
      k1: toNumber(req.body.k1, 0.5),
      k2: toNumber(req.body.k2, 0.2),
      initA: toNumber(req.body.initA, 1.0),
      odeTime: toNumber(req.body.odeTime, 10.0)
    };

    const Rp = inputs.pelletRadius;
    const Deff = Math.max(inputs.effDiffusivity, 1e-12);
    const keff = Math.max(inputs.effConductivity, 1e-3);
    const deltaH = inputs.reactionEnthalpy;
    const k0 = inputs.arrheniusPreExp;
    const Ea = inputs.activationEnergy;
    const CAs = inputs.surfaceConcentration;
    const Ts = inputs.surfaceTemp;
    const Rg = 8.314;

    const kTs = k0 * Math.exp(-Ea / (Rg * Ts));
    const ThieleModulus = Rp * Math.sqrt(kTs / Deff);
    const PraterNumber = (deltaH * Deff * CAs) / (keff * Ts);
    const ArrheniusNumber = Ea / (Rg * Ts);

    const N = 20;
    const dx = 1.0 / N;
    let yArr = new Array(N + 1).fill(1.0);
    let thetaArr = new Array(N + 1).fill(1.0);

    for (let i = 0; i < N; i++) {
      const x = i / N;
      yArr[i] = 0.5 + 0.5 * x * x;
      thetaArr[i] = 1.0 + PraterNumber * (1.0 - yArr[i]);
    }

    const maxRelax = 300;
    const relaxFactor = 0.3;
    for (let iter = 0; iter < maxRelax; iter++) {
      yArr[N] = 1.0;
      thetaArr[N] = 1.0;

      const kCenter = k0 * Math.exp(-Ea / (Rg * Ts * thetaArr[0]));
      const rateFactorCenter = (Rp * Rp * kCenter) / Deff;
      const y0_new = yArr[1] / (1 + (dx * dx * rateFactorCenter) / 3);
      const theta0_new = thetaArr[1] + (dx * dx * PraterNumber * rateFactorCenter * yArr[0]) / 3;

      yArr[0] = yArr[0] * (1 - relaxFactor) + y0_new * relaxFactor;
      thetaArr[0] = thetaArr[0] * (1 - relaxFactor) + theta0_new * relaxFactor;

      for (let i = 1; i < N; i++) {
        const thetaVal = thetaArr[i];
        const kVal = k0 * Math.exp(-Ea / (Rg * Ts * thetaVal));
        const rateFactor = (Rp * Rp * kVal) / Deff;

        const y_new = ((1 + 1 / i) * yArr[i + 1] + (1 - 1 / i) * yArr[i - 1]) / (2 + dx * dx * rateFactor);
        const theta_new = ((1 + 1 / i) * thetaArr[i + 1] + (1 - 1 / i) * thetaArr[i - 1] + dx * dx * PraterNumber * rateFactor * yArr[i]) / 2;

        yArr[i] = yArr[i] * (1 - relaxFactor) + y_new * relaxFactor;
        thetaArr[i] = thetaArr[i] * (1 - relaxFactor) + theta_new * relaxFactor;
      }
    }

    let intNumerator = 0;
    let intDenominator = 0;
    for (let i = 0; i <= N; i++) {
      const x_coord = i * dx;
      const thetaVal = thetaArr[i];
      const kVal = k0 * Math.exp(-Ea / (Rg * Ts * thetaVal));
      const rate = kVal * yArr[i] * CAs;

      const surfaceRate = kTs * CAs;
      const weight = (i === 0 || i === N) ? 1 : (i % 2 === 1 ? 4 : 2);
      intNumerator += weight * rate * x_coord * x_coord;
      intDenominator += weight * surfaceRate * x_coord * x_coord;
    }
    const effectivenessFactor = intNumerator / Math.max(intDenominator, 1e-9);

    const pelletProfile = [];
    for (let i = 0; i <= N; i++) {
      pelletProfile.push({
        radiusFraction: i * dx,
        concFraction: yArr[i],
        tempFraction: thetaArr[i],
        conc: yArr[i] * CAs,
        temp: thetaArr[i] * Ts
      });
    }

    const Tinf = inputs.airTemp;
    const Yinf = inputs.airHumidity;
    const P = inputs.totalPressure;
    const cs = 1.005 + 1.88 * Yinf;

    let TwbLow = 273.15;
    let TwbHigh = Tinf;
    let Twb = (TwbLow + TwbHigh) / 2;

    const calcYs = (T) => {
      const pSatNode = 1000 * Math.exp(16.3872 - 3885.70 / (T - 273.15 + 230.17));
      return 0.622 * pSatNode / Math.max(P - pSatNode, 1e-9);
    };

    const calcLatent = (T) => {
      return 2501.3 - 2.36 * (T - 273.15);
    };

    for (let iter = 0; iter < 100; iter++) {
      const mid = (TwbLow + TwbHigh) / 2;
      const Ys = calcYs(mid);
      const lam = calcLatent(mid);
      const diff = cs * (Tinf - mid) - lam * (Ys - Yinf);
      
      if (Math.abs(diff) < 1e-5) {
        Twb = mid;
        break;
      }
      if (diff > 0) {
        TwbLow = mid;
      } else {
        TwbHigh = mid;
      }
      Twb = mid;
    }
    const Ywb = calcYs(Twb);

    const k1 = inputs.k1;
    const k2 = inputs.k2;
    const initA = inputs.initA;
    const t_ode = inputs.odeTime;

    const odeSteps = 50;
    const hOde = t_ode / odeSteps;
    const odeProfile = [];

    let yOde = [initA, 0, 0];
    let tTime = 0;

    const odeDerivs = (tVal, yVal) => {
      return [
        -k1 * yVal[0],
        k1 * yVal[0] - k2 * yVal[1],
        k2 * yVal[1]
      ];
    };

    odeProfile.push({ time: 0, concA: yOde[0], concB: yOde[1], concC: yOde[2] });

    for (let step = 1; step <= odeSteps; step++) {
      const kO1 = odeDerivs(tTime, yOde);
      const yT2 = [yOde[0] + 0.5 * hOde * kO1[0], yOde[1] + 0.5 * hOde * kO1[1], yOde[2] + 0.5 * hOde * kO1[2]];
      const kO2 = odeDerivs(tTime + 0.5 * hOde, yT2);
      const yT3 = [yOde[0] + 0.5 * hOde * kO2[0], yOde[1] + 0.5 * hOde * kO2[1], yOde[2] + 0.5 * hOde * kO2[2]];
      const kO3 = odeDerivs(tTime + 0.5 * hOde, yT3);
      const yT4 = [yOde[0] + hOde * kO3[0], yOde[1] + hOde * kO3[1], yOde[2] + hOde * kO3[2]];
      const kO4 = odeDerivs(tTime + hOde, yT4);

      yOde[0] += (hOde / 6) * (kO1[0] + 2 * kO2[0] + 2 * kO3[0] + kO4[0]);
      yOde[1] += (hOde / 6) * (kO1[1] + 2 * kO2[1] + 2 * kO3[1] + kO4[1]);
      yOde[2] += (hOde / 6) * (kO1[2] + 2 * kO2[2] + 2 * kO3[2] + kO4[2]);
      tTime += hOde;

      odeProfile.push({
        time: tTime,
        concA: Math.max(0, yOde[0]),
        concB: Math.max(0, yOde[1]),
        concC: Math.max(0, yOde[2])
      });
    }

    const results = {
      ThieleModulus, PraterNumber, ArrheniusNumber, effectivenessFactor, pelletProfile,
      Twb, Ywb, odeProfile
    };

    await saveSimulation(req.user.id, "coupled_transport_solvers", inputs, results);
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Coupled transport simulation failed.", error: err.message });
  }
});

app.get("/api/history", auth, async (req, res) => {
  if (!dbAvailable) {
    return res.status(503).json({ message: "Database is unavailable. History is not available." });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, moduleType, inputs, results, timestamp
       FROM simulations
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT 20`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch history.", error: err.message });
  }
});

app.use(express.static(FRONTEND_DIST_PATH));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(FRONTEND_DIST_PATH, "index.html"));
});

(async () => {
  try {
    await initializeDatabase();
    dbAvailable = true;
    console.log("Database initialized successfully.");
  } catch (err) {
    dbAvailable = false;
    console.error("Database initialization failed, continuing without DB:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`CPSS backend listening on port ${PORT}`);
  });
})();
