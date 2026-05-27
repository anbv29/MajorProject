const http = require("http");

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };
    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  const baseUrl = "http://localhost:5000";
  const email = `test_sep_${Math.floor(Math.random() * 100000)}@test.com`;
  const password = "password123";

  console.log("1. Registering test user...");
  let authData = await post(`${baseUrl}/api/auth/register`, { email, password });
  const token = authData.token;
  console.log("   Registration success.");

  console.log("\n2. Testing /api/distillation_design...");
  const distRes = await post(`${baseUrl}/api/distillation_design`, {
    alpha: 2.5,
    xD: 0.95,
    xB: 0.05,
    xF: 0.5,
    qVal: 1.0,
    refluxRatio: 2.0,
    murphreeEfficiency: 0.70,
    vaporFlowRate: 5.0,
    liquidFlowRate: 4.0,
    vaporDensity: 1.5,
    liquidDensity: 800.0,
    surfaceTension: 20.0,
    traySpacing: 0.45,
    activeFraction: 0.85,
    derateFactor: 0.85,
    weirHeight: 50.0,
    holeAreaFraction: 0.10
  }, token);
  console.log("   Distillation keys returned:", Object.keys(distRes));
  console.log(`   Column sizing: Dc = ${distRes.Dc?.toFixed(3)} m, Ac = ${distRes.Ac?.toFixed(3)} m2`);
  console.log(`   McCabe stages (Murphree): ${distRes.nStages}, Ponchon stages: ${distRes.psCount}`);
  if (typeof distRes.Dc === "number" && Array.isArray(distRes.stages) && Array.isArray(distRes.psStages)) {
    console.log("   Distillation check: PASS");
  } else {
    console.log("   Distillation check: FAIL");
  }

  console.log("\n3. Testing /api/extraction_leaching...");
  const extRes = await post(`${baseUrl}/api/extraction_leaching`, {
    feedRate: 100.0,
    xF: 0.15,
    solventRate: 120.0,
    yS: 0.0,
    partitionCoefficient: 2.5,
    extractionStages: 3,
    targetRaffinate: 0.01,
    feedInertSolid: 100.0,
    feedSolute: 20.0,
    leachingSolventRate: 150.0,
    solventRetention: 0.5,
    leachingTargetRecovery: 0.95
  }, token);
  console.log("   Extraction/Leaching keys returned:", Object.keys(extRes));
  console.log(`   Final Raffinate: ${extRes.finalRaffinateCross?.toFixed(4)}, Recovery: ${extRes.recoveryCross?.toFixed(2)}%`);
  console.log(`   Counter-current stages req: ${extRes.ccStagesReq?.toFixed(2)}, Leaching stages req: ${extRes.leachingStagesReq?.toFixed(2)}`);
  if (typeof extRes.finalRaffinateCross === "number" && typeof extRes.ccStagesReq === "number" && typeof extRes.leachingStagesReq === "number") {
    console.log("   Extraction/Leaching check: PASS");
  } else {
    console.log("   Extraction/Leaching check: FAIL");
  }

  console.log("\n4. Testing /api/adsorption...");
  const adsRes = await post(`${baseUrl}/api/adsorption`, {
    adsorptionModel: "langmuir",
    langmuirQm: 50.0,
    langmuirKl: 0.2,
    freundlichKf: 5.0,
    freundlichN: 2.5,
    adsorbateConc: 10.0,
    bedLength: 2.0,
    bedDiameter: 0.5,
    bedVoidage: 0.40,
    adsorbentDensity: 800.0,
    feedFlowRate: 5.0,
    feedConcentration: 100.0,
    thomasRateConstant: 0.05,
    breakthroughRatio: 0.05,
    saturationRatio: 0.95
  }, token);
  console.log("   Adsorption keys returned:", Object.keys(adsRes));
  console.log(`   Adsorbent capacity (qCapacity): ${adsRes.qCapacity?.toFixed(2)} mg/g`);
  console.log(`   Breakthrough time: ${adsRes.tBreakthrough?.toFixed(2)} h, Saturation time: ${adsRes.tSaturation?.toFixed(2)} h`);
  if (typeof adsRes.qCapacity === "number" && typeof adsRes.tBreakthrough === "number" && Array.isArray(adsRes.breakthroughCurve)) {
    console.log("   Adsorption check: PASS");
  } else {
    console.log("   Adsorption check: FAIL");
  }

  console.log("\n5. Testing /api/humidification...");
  const humRes = await post(`${baseUrl}/api/humidification`, {
    dryBulbTemp: 30.0,
    relativeHumidity: 60.0,
    totalPressure: 101325,
    waterInletTemp: 40.0,
    waterOutletTemp: 28.0,
    airInletWetBulb: 24.0,
    liquidGasRatio: 1.2,
    overallHTU: 1.5
  }, token);
  console.log("   Humidification keys returned:", Object.keys(humRes));
  console.log(`   Absolute Humidity (Y): ${humRes.Y?.toFixed(4)} kg/kg, Enthalpy (Ha): ${humRes.Ha?.toFixed(2)} kJ/kg`);
  console.log(`   Cooling tower NTU: ${humRes.ntu?.toFixed(3)}, Packed Height: ${humRes.coolingTowerHeight?.toFixed(2)} m`);
  if (typeof humRes.Y === "number" && typeof humRes.coolingTowerHeight === "number" && Array.isArray(humRes.coolingPath)) {
    console.log("   Humidification check: PASS");
  } else {
    console.log("   Humidification check: FAIL");
  }

  console.log("\nAll advanced separations endpoint tests completed!");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
