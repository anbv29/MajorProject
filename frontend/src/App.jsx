import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Wind,
  Thermometer,
  Waves,
  FlaskConical,
  Droplets,
  Gauge,
  GitBranch,
  SlidersHorizontal,
  History,
  LogOut,
  Download,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Activity,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronRight,
  Layers,
  Compass,
  Zap,
  TrendingDown,
  Grid,
  Sun,
  Moon,
  Droplet,
  Cpu,
  Flame
} from "lucide-react";

const API_BASE = "http://localhost:5000";

const stabilityCoeff = {
  A: { ay: 0.22, by: 0.5, az: 0.2, bz: 1.0 },
  B: { ay: 0.16, by: 0.5, az: 0.12, bz: 1.0 },
  C: { ay: 0.11, by: 0.5, az: 0.08, bz: 1.0 },
  D: { ay: 0.08, by: 0.5, az: 0.06, bz: 1.0 },
  E: { ay: 0.06, by: 0.5, az: 0.03, bz: 1.0 },
  F: { ay: 0.04, by: 0.5, az: 0.016, bz: 1.0 }
};

const tabs = [
  { id: "plume", label: "Air Dispersion", icon: Wind },
  { id: "heatexchanger", label: "Heat Exchanger", icon: Thermometer },
  { id: "pipeflow", label: "Pipe Flow", icon: Waves },
  { id: "cstr", label: "CSTR Reactor", icon: FlaskConical },
  { id: "flash", label: "Flash VLE", icon: Droplets },
  { id: "ergun", label: "Ergun Packed Bed", icon: Gauge },
  { id: "fenske", label: "Fenske Distillation", icon: GitBranch },
  { id: "pid", label: "PID Tuning", icon: SlidersHorizontal },
  { id: "transferfunction", label: "Transfer Functions", icon: Layers },
  { id: "laplace", label: "Laplace Transforms", icon: Cpu },
  { id: "dynamicresponse", label: "Dynamic Response", icon: Activity },
  { id: "firstorder", label: "First-Order Systems", icon: TrendingDown },
  { id: "secondorder", label: "Second-Order Systems", icon: Waves },
  { id: "controllertuning", label: "Controller Tuning", icon: SlidersHorizontal },
  { id: "stabilityanalysis", label: "Stability Analysis", icon: AlertTriangle },
  { id: "rootlocus", label: "Root Locus", icon: Compass },
  { id: "bodeplots", label: "Bode Plots", icon: Grid },
  { id: "frequencyresponse", label: "Frequency Response", icon: Wind },
  { id: "pidcalculations", label: "PID Calculations", icon: Zap },
  { id: "hydrostatics", label: "Hydrostatics Lab", icon: Layers },
  { id: "flowmeters", label: "Flow Meters", icon: Compass },
  { id: "pipehydraulics", label: "Pipe Hydraulics", icon: Waves },
  { id: "pumps", label: "Pumps & NPSH", icon: Zap },
  { id: "dragsettling", label: "Drag & Settling", icon: TrendingDown },
  { id: "cycles", label: "Thermo Cycles", icon: RotateCcw },
  { id: "eos", label: "EOS & Properties", icon: SlidersHorizontal },
  { id: "thermochem", label: "Thermochemistry", icon: Thermometer },
  { id: "fugacity", label: "Residuals & Fugacity", icon: Sparkles },
  { id: "equilibrium", label: "Equilibrium Lab", icon: FlaskConical },
  { id: "conduction", label: "Conduction Lab", icon: Grid },
  { id: "convection", label: "Convection & Fins", icon: Wind },
  { id: "radiation", label: "Phase Change & Rad", icon: Sun },
  { id: "evaporator", label: "Evaporator Sizing", icon: Droplet },
  { id: "mccabe", label: "McCabe-Thiele", icon: Layers },
  { id: "rachford", label: "Rachford-Rice", icon: Cpu },
  { id: "pfr", label: "PFR Reactor", icon: Activity },
  { id: "nonisothermal", label: "Non-Isothermal Reactor", icon: Thermometer },
  { id: "catalytic", label: "Catalytic Reactor", icon: FlaskConical },
  { id: "effectiveness", label: "Catalyst Effectiveness", icon: Sparkles },
  { id: "diffusionreaction", label: "Diffusion-Reaction", icon: Activity },
  { id: "packedbedreactor", label: "Packed Bed Reactor", icon: Grid },
  { id: "fluidizedbed", label: "Fluidized Bed Reactor", icon: Wind },
  { id: "rtd", label: "Residence Time Dist.", icon: Compass },
  { id: "reactoroptimization", label: "Reactor Optimization", icon: TrendingDown },
  { id: "diffusion", label: "Diffusion & Film", icon: Activity },
  { id: "absorption", label: "Absorption Column", icon: Layers },
  { id: "drying", label: "Drying Technology", icon: Sun },
  { id: "economics", label: "Process Economics", icon: TrendingDown },
  { id: "equipmentsizing", label: "Equipment Sizing", icon: Layers },
  { id: "columndesign", label: "Column Design", icon: GitBranch },
  { id: "reactorsizing", label: "Reactor Sizing", icon: FlaskConical },
  { id: "pumpselection", label: "Pump Selection", icon: Zap },
  { id: "heatx_sizing", label: "Heat Exchanger Sizing", icon: Thermometer },
  { id: "costestimation", label: "Cost Estimation", icon: TrendingDown },
  { id: "processoptimization", label: "Process Optimization", icon: Activity },
  { id: "pfd_pid_calc", label: "PFD & P&ID Calculations", icon: Cpu },
  { id: "distillation_design", label: "Distillation Design", icon: Layers },
  { id: "extraction_leaching", label: "Extraction & Leaching", icon: Waves },
  { id: "adsorption", label: "Adsorption Lab", icon: SlidersHorizontal },
  { id: "humidification", label: "Humidification & Cooling", icon: Wind },
  { id: "momentum_transport", label: "Momentum Transport", icon: Activity },
  { id: "heat_mass_transport", label: "Heat & Mass Transport", icon: Flame },
  { id: "coupled_transport_solvers", label: "Coupled Transport & Solvers", icon: Cpu },
  { id: "history", label: "My Database History", icon: History }
];

const moduleDetails = {
  plume: "Gaussian atmospheric dispersion based on Pasquill-Gifford stability classes.",
  heatexchanger: "LMTD-based thermal sizing and effectiveness calculations.",
  pipeflow: "Hydraulics using Reynolds regime and Swamee-Jain friction model.",
  cstr: "First-order CSTR sizing from target conversion and kinetics.",
  flash: "Single-stage flash equilibrium split using relative volatility.",
  ergun: "Packed bed pressure drop via viscous + inertial Ergun terms.",
  fenske: "Minimum theoretical stages from Fenske distillation relation.",
  pid: "Ziegler-Nichols PI/PID tuning from FOPDT process dynamics.",
  transferfunction: "Process transfer function builder for chemical process dynamics with lags and dead-time context.",
  laplace: "Laplace transform solver for common process-control forcing functions used in chemical engineering dynamics.",
  dynamicresponse: "FOPDT dynamic step-response analysis for process units such as reactors, heat exchangers, and columns.",
  firstorder: "First-order process model response metrics including time constant and settling behavior.",
  secondorder: "Second-order process dynamics with damping, overshoot, and resonance indicators.",
  controllertuning: "Chemical process controller tuning correlations (ZN and IMC-based) for PI/PID settings.",
  stabilityanalysis: "Routh-Hurwitz stability screening of closed-loop characteristic equations.",
  rootlocus: "Root locus exploration of closed-loop pole movement with controller gain changes.",
  bodeplots: "Bode magnitude-phase construction for process transfer functions across frequency.",
  frequencyresponse: "Sinusoidal frequency response metrics for process gain attenuation and phase lag.",
  pidcalculations: "Direct PID term-by-term controller output calculations for process control loops.",
  hydrostatics: "Pressure heads, hydrostatic force on plates, manometers, and metacentric stability.",
  flowmeters: "Differential meters (Venturi, Orifice), Pitot tube velocities, and Rotameter calculations.",
  pipehydraulics: "Reynolds regimes, Hagen-Poiseuille laminar equations, and Darcy friction factors.",
  pumps: "Pump sizing, efficiency, brake horsepower, and NPSH cavitation safety checks.",
  dragsettling: "Terminal settling velocity and drag coefficient for solid spheres in viscous fluids.",
  cycles: "First and Second Law energy balances, work, heat, and entropy on thermodynamic paths.",
  eos: "Ideal gas, Virial (Pitzer), and Cubic (van der Waals) Equations of State, plus acentric factors.",
  thermochem: "Heats of formation, reaction, and combustion, corrected for high temperatures.",
  fugacity: "Residual properties (enthalpy, entropy), Maxwell relations check, and fugacity coefficient calculations.",
  equilibrium: "Activity coefficients (Margules/Van Laar/Wilson), bubble point VLE, and reaction equilibrium extent.",
  conduction: "Fourier 1D heat conduction, composite wall resistance, cylinder/sphere heat duties, and critical insulation.",
  convection: "Hydrodynamic/thermal boundary layer thickness, natural convection correlations, and fin efficiency.",
  radiation: "Stefan-Boltzmann radiation exchange, blackbody emissive power, pool boiling, and vertical plate condensation.",
  evaporator: "Single-effect area/economy/duty and double-effect evaporator steam economy solver.",
  mccabe: "McCabe-Thiele binary distillation stages, feed line, and rectifying/stripping operating lines.",
  rachford: "Rachford-Rice multi-component flash separator solving for vapor fraction and phase compositions.",
  pfr: "Plug Flow Reactor (PFR) sizing solver using Simpson's 1/3 numerical integration.",
  nonisothermal: "Adiabatic non-isothermal CSTR sizing using Arrhenius kinetics and energy balance.",
  catalytic: "Catalytic reactor sizing from target conversion and catalyst weight requirement.",
  effectiveness: "Catalyst pellet effectiveness factor using Thiele modulus for internal diffusion limits.",
  diffusionreaction: "Diffusion-reaction in porous media with concentration profile and surface flux.",
  packedbedreactor: "Packed bed reactor design combining Ergun pressure drop and catalyst inventory sizing.",
  fluidizedbed: "Fluidized bed hydrodynamics using minimum fluidization velocity and bed expansion.",
  rtd: "Residence time distribution via tanks-in-series E(t), F(t), and variance metrics.",
  reactoroptimization: "Economic reactor optimization by sweeping conversion to maximize profit.",
  diffusion: "Diffusion fluxes (Fick's law EMD/UMD), Fuller gas diffusivity, mass transfer coefficients, and overall resistance.",
  absorption: "Sizing gas absorption columns: minimum solvent rate, Kremser stage solver, NTU height, and operating lines.",
  drying: "Solid drying kinetics, constant vs. falling rate drying times, and drying rate curves.",
  economics: "Feasibility analysis covering capital cost scaling, compound interest, ordinary annuities, depreciation schedules, and profitability markers (ROI, NPV, DCF/IRR, Break-Even).",
  equipmentsizing: "Preliminary sizing envelopes for process vessels, separators, and utility-linked equipment in chemical plants.",
  columndesign: "Distillation and absorption column design checks covering stages, reflux or solvent ratios, and hydraulic limits.",
  reactorsizing: "Reactor sizing pathway for CSTR, PFR, and packed-bed choices from kinetics, conversion, and thermal effects.",
  pumpselection: "Pump duty screening from flow-head requirements, hydraulic power, NPSH margin, and efficiency windows.",
  heatx_sizing: "Heat exchanger area sizing using duty, LMTD approach, U-values, and service-side constraints.",
  costestimation: "Chemical process cost estimation with capacity scaling, installation factors, and operating-cost framing.",
  processoptimization: "Optimization framework for conversion, throughput, utilities, and profitability under process constraints.",
  pfd_pid_calc: "PFD and P&ID design-basis calculations including mass-energy closure, line sizing checks, and control valve sizing inputs.",
  distillation_design: "Tray hydraulics and stage stepping using both McCabe-Thiele (Murphree efficiency) and Ponchon-Savarit (enthalpy-concentration) models.",
  extraction_leaching: "Liquid-liquid extraction stage balances (cross/counter-current) and solid-liquid leaching under constant underflow.",
  adsorption: "Langmuir and Freundlich capacity isotherm fitting alongside fixed-bed breakthrough time S-curve profiles.",
  humidification: "Psychrometric dew point, relative humidity, and humid volume calculations with Simpson integrated cooling tower sizing.",
  momentum_transport: "Momentum balances, parabolic pipe/slit velocity and shear stress profiles, and Blasius flat-plate boundary layers.",
  heat_mass_transport: "Heat and mass transport equations: steady-state wire heat generation and stagnant film diffusion-reactions, and transient FDM PDE solvers.",
  coupled_transport_solvers: "Coupled heat/mass transfer: spherical non-isothermal catalytic pellet profiles, wet-bulb evaporation solvers, and general RK4 ODE integrators.",
  history: "Query and review your 20 most recent saved simulations."
};

const moduleTips = {
  plume: "Tip: start with local weather defaults, then tweak stack height for scenario checks.",
  heatexchanger: "Tip: sanity-check terminal temperatures before trusting LMTD.",
  pipeflow: "Tip: watch Reynolds number first, then interpret pressure drop.",
  cstr: "Tip: conversion targets near 1.0 can explode required reactor volume.",
  flash: "Tip: when volatility is close to 1, separation becomes difficult.",
  ergun: "Tip: pressure drop rises sharply with velocity in packed beds.",
  fenske: "Tip: use this as a theoretical lower bound for stage count.",
  pid: "Tip: treat Z-N values as a starting point, then detune in practice.",
  transferfunction: "Tip: always keep process dead-time in mind when deciding if feedback will be aggressive or conservative.",
  laplace: "Tip: transform-domain equations are easiest when initial conditions are zero and signals are idealized.",
  dynamicresponse: "Tip: compare dead time to time constant first; high theta/tau usually means tougher control.",
  firstorder: "Tip: after one time constant, a first-order process reaches about 63.2% of its final response.",
  secondorder: "Tip: damping ratio below 0.5 often causes large oscillations in process temperature or composition loops.",
  controllertuning: "Tip: IMC tuning is often safer than classic Ziegler-Nichols for noisy plant data.",
  stabilityanalysis: "Tip: satisfying Routh criteria is necessary for stability but not enough for good control quality.",
  rootlocus: "Tip: if poles move too close to the imaginary axis, expect sluggish or oscillatory process control.",
  bodeplots: "Tip: target a comfortable phase margin before deploying controller changes on real plant loops.",
  frequencyresponse: "Tip: high-frequency attenuation is useful to reject sensor noise in chemical process control.",
  pidcalculations: "Tip: anti-windup clamping is critical when actuators hit valve or pump output limits.",
  hydrostatics: "Tip: make sure metacentric height (GM) is positive for floating stability.",
  flowmeters: "Tip: check that the beta ratio (d/D) is between 0.3 and 0.75 for reliable measurements.",
  pipehydraulics: "Tip: verify if flow is laminar (Re < 2100) before using Hagen-Poiseuille.",
  pumps: "Tip: keep NPSH available higher than NPSH required to prevent cavitation damage.",
  dragsettling: "Tip: terminal velocity is solved iteratively because drag depends on the velocity itself.",
  cycles: "Tip: internal energy change (dU) is always zero for any isothermal path of an ideal gas.",
  eos: "Tip: cubic equations of state require numeric solvers to extract the molar volume roots.",
  thermochem: "Tip: use Kirchhoff's Law to check if the reaction becomes more or less exothermic at high temperatures.",
  fugacity: "Tip: fugacity represents an 'effective pressure' that corrects for non-ideal molecular interactions.",
  equilibrium: "Tip: at chemical equilibrium, the reaction Gibbs free energy change (dG) is exactly zero.",
  conduction: "Tip: critical insulation radius is where the total heat transfer rate reaches its maximum.",
  convection: "Tip: boundary layer calculations are valid for laminar flow over a smooth flat plate.",
  radiation: "Tip: blackbody radiation represents the maximum theoretical thermal radiation from a surface.",
  evaporator: "Tip: double-effect evaporators dramatically increase steam economy (vaporized/steam ratio).",
  mccabe: "Tip: ensure your operating reflux ratio R is strictly greater than the minimum reflux ratio Rmin.",
  rachford: "Tip: Rachford-Rice converges fast via Newton-Raphson, but requires initial guess psi between 0 and 1.",
  pfr: "Tip: for positive-order reactions, a PFR requires less volume than a CSTR to reach the same conversion.",
  nonisothermal: "Tip: exothermic reactions can sharply increase temperature and cut required reactor volume.",
  catalytic: "Tip: catalyst requirement becomes very sensitive as conversion approaches 100%.",
  effectiveness: "Tip: high Thiele modulus means strong diffusion resistance and lower effective reaction rate.",
  diffusionreaction: "Tip: larger pellets or lower diffusivity reduce internal concentration and reaction utilization.",
  packedbedreactor: "Tip: always check both conversion target and pressure drop before fixing bed dimensions.",
  fluidizedbed: "Tip: operate modestly above minimum fluidization velocity to avoid slugging or carryover.",
  rtd: "Tip: higher tanks-in-series count gives narrower RTD and behavior closer to ideal plug flow.",
  reactoroptimization: "Tip: optimal conversion usually occurs before the highest conversion because volume cost grows fast.",
  diffusion: "Tip: stagnant gas diffusion (UMD) has higher flux than EMD because of bulk flow contribution (drift).",
  absorption: "Tip: for absorption, operating liquid rate should typically be 1.2 to 1.5 times the minimum solvent rate.",
  drying: "Tip: falling rate period depends on equilibrium moisture limit; target drying content cannot go below it.",
  economics: "Tip: internal rate of return (IRR) is computed via numerical bisection; a higher IRR indicates a more profitable project.",
  equipmentsizing: "Tip: start from throughput and residence-time targets, then add realistic design margins for turn-down and fouling.",
  columndesign: "Tip: after meeting separation target, verify hydraulic capacity and flooding margin before finalizing diameter.",
  reactorsizing: "Tip: compare multiple reactor configurations at equal conversion before committing to one design route.",
  pumpselection: "Tip: select near the pump best-efficiency point and maintain NPSH available above NPSH required with margin.",
  heatx_sizing: "Tip: validate temperature cross and fouling allowances first, because they dominate required exchanger area.",
  costestimation: "Tip: use one common cost basis year and update all costs with a consistent cost index before comparison.",
  processoptimization: "Tip: define hard safety and quality constraints early; unconstrained optima are often not operable.",
  pfd_pid_calc: "Tip: lock mass and energy balances before instrument sizing so loop calculations stay physically consistent.",
  distillation_design: "Tip: Ponchon-Savarit accounts for heat effects and enthalpy changes, unlike McCabe-Thiele's constant molal overflow assumption.",
  extraction_leaching: "Tip: solid-liquid leaching calculations depend heavily on the solvent retention ratio underflow parameter.",
  adsorption: "Tip: fixed-bed breakthrough time is the point where the effluent solute concentration first begins to rise above detection limits.",
  humidification: "Tip: cooling tower NTU is calculated by integrating the enthalpy driving force between saturated air and operating air.",
  momentum_transport: "Tip: shear stress is always zero at the centerline and maximum at the solid wall due to viscous drag.",
  heat_mass_transport: "Tip: explicit FTCS PDE solvers require the Fourier number Fo <= 0.5 to prevent numerical oscillation and divergence.",
  coupled_transport_solvers: "Tip: spherical catalytic pellets with highly exothermic reactions can trigger thermal runaway if conduction is slow.",
  history: "Tip: filter history by module to compare runs quickly."
};

const strategicTopicGuides = {
  equipmentsizing: {
    assumptions: [
      "Sizing starts from closed mass and energy balances.",
      "Design margins are applied for turndown, fouling, and uncertainty.",
      "Mechanical code checks are treated after process preliminary sizing."
    ],
    related: ["heatexchanger", "pumps", "pipeflow", "evaporator"]
  },
  columndesign: {
    assumptions: [
      "Phase equilibrium data are represented by validated VLE models.",
      "Hydraulic checks include flooding, weeping, and pressure-drop limits.",
      "Stage efficiency or HTU/NTU corrections are included for real equipment."
    ],
    related: ["mccabe", "distillation_design", "absorption", "fenske"]
  },
  reactorsizing: {
    assumptions: [
      "Kinetics are based on representative temperature and composition ranges.",
      "Reactor model choice is aligned with mixing and flow pattern.",
      "Heat effects are screened to avoid thermal runaway or undersizing."
    ],
    related: ["cstr", "pfr", "packedbedreactor", "nonisothermal"]
  },
  pumpselection: {
    assumptions: [
      "Total dynamic head includes static, frictional, and minor losses.",
      "NPSH available is checked at the worst suction condition.",
      "Operation near best efficiency point is preferred for reliability."
    ],
    related: ["pumps", "pipehydraulics", "pipeflow", "flowmeters"]
  },
  heatx_sizing: {
    assumptions: [
      "Duty is taken from validated stream energy balances.",
      "LMTD correction factors and fouling allowances are included.",
      "Material and pressure constraints are considered in configuration choice."
    ],
    related: ["heatexchanger", "conduction", "convection", "evaporator"]
  },
  costestimation: {
    assumptions: [
      "All costs are normalized to a common basis year.",
      "Capacity scaling uses equipment-specific exponents where available.",
      "Installed cost factors include scope assumptions and exclusions."
    ],
    related: ["economics", "distillation_design", "packedbedreactor", "heatexchanger"]
  },
  processoptimization: {
    assumptions: [
      "Objective function and constraints reflect plant operability.",
      "Optimization variables remain within safe and controllable ranges.",
      "Economic optimization is reconciled with quality and emissions limits."
    ],
    related: ["reactoroptimization", "pid", "controllertuning", "frequencyresponse"]
  },
  pfd_pid_calc: {
    assumptions: [
      "PFD stream table balances are closed before control sizing.",
      "Piping line sizing follows service-specific velocity constraints.",
      "Control valve and loop sizing use realistic pressure-drop allocation."
    ],
    related: ["pipeflow", "flowmeters", "pidcalculations", "transferfunction"]
  }
};

const moduleTheory = {
  plume: {
    intro: "Gaussian plume assumes steady emissions and weather to estimate downwind concentration.",
    constants: [
      { name: "Q (g/s)", meaning: "Emission rate from stack", typical: "10-1000 g/s (industry dependent)" },
      { name: "u (m/s)", meaning: "Wind speed controlling dilution", typical: "1-8 m/s urban range" },
      { name: "H (m)", meaning: "Effective stack release height", typical: "20-150 m common stacks" },
      { name: "Stability class", meaning: "Atmospheric turbulence (A unstable to F stable)", typical: "D is neutral baseline" }
    ]
  },
  heatexchanger: {
    intro: "LMTD method converts varying temperature difference into one effective driving force.",
    constants: [
      { name: "U (W/m2.K)", meaning: "Overall heat transfer coefficient", typical: "100-2000 depending on service" },
      { name: "A (m2)", meaning: "Heat transfer surface area", typical: "10-500+ m2 process units" },
      { name: "LMTD (K)", meaning: "Log-mean temperature difference", typical: "5-80 K in many exchangers" },
      { name: "Effectiveness (%)", meaning: "Actual thermal performance ratio", typical: "40-90% practical systems" }
    ]
  },
  pipeflow: {
    intro: "Hydraulic losses come from wall friction and are strongly affected by flow regime.",
    constants: [
      { name: "Reynolds number", meaning: "Flow regime indicator", typical: "<2300 laminar, >4000 turbulent" },
      { name: "f", meaning: "Darcy friction factor", typical: "0.008-0.08 common range" },
      { name: "epsilon (m)", meaning: "Absolute roughness of pipe wall", typical: "1e-6 to 1e-3 m" },
      { name: "dP (Pa)", meaning: "Pressure drop across pipe length", typical: "Depends on L/D and velocity" }
    ]
  },
  cstr: {
    intro: "For first-order kinetics, required CSTR volume rises sharply near high conversion.",
    constants: [
      { name: "k (h^-1)", meaning: "First-order rate constant", typical: "0.1-10 h^-1 (reaction specific)" },
      { name: "X", meaning: "Target conversion fraction", typical: "0.3-0.9 typical design targets" },
      { name: "v0 (m3/h)", meaning: "Volumetric feed flow rate", typical: "Process dependent" },
      { name: "tau (h)", meaning: "Residence time", typical: "Minutes to hours" }
    ]
  },
  flash: {
    intro: "Flash calculation uses a binary-equilibrium shortcut with constant relative volatility.",
    constants: [
      { name: "alpha", meaning: "Relative volatility (light vs heavy key)", typical: ">1 for feasible split" },
      { name: "z", meaning: "Feed mole fraction of light component", typical: "0-1" },
      { name: "V/F", meaning: "Vaporized fraction of feed", typical: "0-1 in single flash" },
      { name: "x, y", meaning: "Liquid and vapor phase mole fractions", typical: "0-1" }
    ]
  },
  ergun: {
    intro: "Ergun equation combines viscous and inertial contributions in packed-bed flow.",
    constants: [
      { name: "epsilon", meaning: "Bed void fraction", typical: "0.35-0.50 for many packings" },
      { name: "Dp (m)", meaning: "Particle diameter", typical: "0.001-0.02 m common pellets" },
      { name: "mu (Pa.s)", meaning: "Dynamic viscosity", typical: "1e-4 to 1e-2 fluids" },
      { name: "rho (kg/m3)", meaning: "Fluid density", typical: "1 (gas) to 1200+ (liquid)" }
    ]
  },
  fenske: {
    intro: "Fenske gives minimum theoretical stages at total reflux (best-case separation).",
    constants: [
      { name: "alpha", meaning: "Relative volatility of key components", typical: "1.1-5+ depending mixture" },
      { name: "xD", meaning: "Light key mole fraction in distillate", typical: "0.85-0.99 target purity" },
      { name: "xB", meaning: "Light key mole fraction in bottoms", typical: "0.01-0.15 impurity spec" },
      { name: "Nmin", meaning: "Minimum ideal stages", typical: "Used as lower bound only" }
    ]
  },
  pid: {
    intro: "Ziegler-Nichols is a quick heuristic for initial controller tuning from FOPDT behavior.",
    constants: [
      { name: "Kp", meaning: "Process gain", typical: "Positive or negative by process direction" },
      { name: "tau_p (s or min)", meaning: "Process time constant", typical: "Must match plant time unit" },
      { name: "theta (s or min)", meaning: "Dead time (transport delay)", typical: "Usually smaller than tau_p" },
      { name: "Kc, tauI, tauD", meaning: "Controller gain, integral time, derivative time", typical: "Starting values for field retuning" }
    ]
  },
  transferfunction: {
    intro: "Transfer functions express process dynamics in the Laplace domain for reactors, heat exchangers, and separation units.",
    constants: [
      { name: "K", meaning: "Steady-state process gain", typical: "Can be positive or negative depending on loop direction" },
      { name: "tau1, tau2", meaning: "Dominant process lags", typical: "Seconds to hours by unit operation" },
      { name: "theta", meaning: "Transport or measurement dead time", typical: "Often 5-40% of dominant time constant" },
      { name: "Poles", meaning: "Roots of transfer-function denominator", typical: "Left-half plane for open-loop stability" }
    ]
  },
  laplace: {
    intro: "Laplace transforms simplify dynamic process equations into algebraic forms for control design and simulation.",
    constants: [
      { name: "Step input", meaning: "Constant change in manipulated variable", typical: "L{A} = A/s" },
      { name: "Ramp input", meaning: "Linear drift in forcing variable", typical: "L{At} = A/s^2" },
      { name: "Impulse input", meaning: "Instantaneous tracer pulse", typical: "L{A delta(t)} = A" },
      { name: "Exponential input", meaning: "Decaying or growing disturbance", typical: "L{Ae^(-at)} = A/(s+a)" }
    ]
  },
  dynamicresponse: {
    intro: "Dynamic response tracks how process outputs evolve after setpoint or disturbance changes.",
    constants: [
      { name: "K", meaning: "Process gain from input to output", typical: "Determines final response magnitude" },
      { name: "tau", meaning: "Dominant time constant", typical: "Defines response speed" },
      { name: "theta", meaning: "Dead-time delay before output moves", typical: "Major challenge for control loops" },
      { name: "t90", meaning: "Approximate 90% rise-time marker", typical: "Near theta + 2.3 tau for FOPDT" }
    ]
  },
  firstorder: {
    intro: "First-order models are common for mixed tanks, thermal elements, and concentration sensors.",
    constants: [
      { name: "tau", meaning: "Time constant", typical: "63.2% response reached at t = tau" },
      { name: "K", meaning: "Static gain", typical: "Output change per unit input step" },
      { name: "t_settle", meaning: "Approximate 2% settling time", typical: "About 4 tau" },
      { name: "t_rise", meaning: "10-90% rise time", typical: "About 2.2 tau" }
    ]
  },
  secondorder: {
    intro: "Second-order behavior appears in interacting thermal loops, pressure-control networks, and actuator-coupled processes.",
    constants: [
      { name: "zeta", meaning: "Damping ratio", typical: "0.4-0.8 often targeted in process control" },
      { name: "wn", meaning: "Natural frequency", typical: "Higher wn gives faster dynamics" },
      { name: "Mp (%)", meaning: "Peak overshoot", typical: "Drops as damping ratio increases" },
      { name: "ts", meaning: "Settling time", typical: "Approx 4/(zeta wn) for underdamped cases" }
    ]
  },
  controllertuning: {
    intro: "Controller tuning translates process-test data into practical PI/PID settings for plant operation.",
    constants: [
      { name: "Ku, Pu", meaning: "Ultimate gain and period from sustained oscillations", typical: "Used in Z-N closed-loop tuning" },
      { name: "lambda", meaning: "IMC closed-loop time tuning factor", typical: "Larger lambda gives smoother control" },
      { name: "Kc", meaning: "Controller proportional gain", typical: "Too high can destabilize loop" },
      { name: "Ti, Td", meaning: "Integral and derivative times", typical: "Set by process lag and delay" }
    ]
  },
  stabilityanalysis: {
    intro: "Stability analysis checks whether closed-loop process poles stay in the stable left-half plane.",
    constants: [
      { name: "a3..a0", meaning: "Characteristic polynomial coefficients", typical: "a3 s^3 + a2 s^2 + a1 s + a0" },
      { name: "Routh criterion", meaning: "Sign and determinant conditions for stability", typical: "All first-column terms must be positive" },
      { name: "stability margin term", meaning: "a2 a1 - a3 a0 for cubic systems", typical: "Positive for stable cubic behavior" },
      { name: "status", meaning: "Stable or unstable classification", typical: "Used before field deployment" }
    ]
  },
  rootlocus: {
    intro: "Root locus shows closed-loop pole trajectories as controller gain changes.",
    constants: [
      { name: "K", meaning: "Loop gain parameter", typical: "Swept from low to high values" },
      { name: "Closed-loop poles", meaning: "Roots of denominator with feedback", typical: "Move toward zeros as K increases" },
      { name: "Real/imag parts", meaning: "Pole coordinates in s-plane", typical: "Imaginary components imply oscillation" },
      { name: "Damping trend", meaning: "How oscillatory behavior changes with gain", typical: "Used for safe tuning windows" }
    ]
  },
  bodeplots: {
    intro: "Bode plots summarize process magnitude attenuation and phase lag across frequency.",
    constants: [
      { name: "Magnitude (dB)", meaning: "20log10 |G(jw)|", typical: "Crosses 0 dB near gain crossover" },
      { name: "Phase (deg)", meaning: "Angle of G(jw)", typical: "More negative phase can reduce stability margin" },
      { name: "w", meaning: "Angular frequency", typical: "Swept logarithmically over decades" },
      { name: "Crossover", meaning: "Frequency where magnitude is near unity", typical: "Linked to response speed" }
    ]
  },
  frequencyresponse: {
    intro: "Frequency response predicts sinusoidal output amplitude and phase lag for process disturbances.",
    constants: [
      { name: "AR", meaning: "Amplitude ratio |Y/U|", typical: "Drops with increasing frequency for lag systems" },
      { name: "Phase lag", meaning: "Output delay angle vs sinusoidal input", typical: "Approaches -90 deg for first-order high-frequency limit" },
      { name: "w", meaning: "Forcing angular frequency", typical: "rad/s or converted plant time units" },
      { name: "Y_amp", meaning: "Output sinusoid amplitude", typical: "Input amplitude times AR" }
    ]
  },
  pidcalculations: {
    intro: "PID calculation blocks evaluate instant controller output from error, integral memory, and derivative action.",
    constants: [
      { name: "e(t)", meaning: "Control error (SP - PV)", typical: "Positive error drives manipulated variable up" },
      { name: "P, I, D", meaning: "Controller component contributions", typical: "Output = bias + P + I + D" },
      { name: "dt", meaning: "Controller execution interval", typical: "Seconds for DCS/PLC loops" },
      { name: "Anti-windup limits", meaning: "Output clamp bounds", typical: "Keeps integral action realistic under saturation" }
    ]
  },
  hydrostatics: {
    intro: "Hydrostatics deals with fluids at rest, governing pressure heads, buoyancy, stability, and forces on submerged surfaces.",
    constants: [
      { name: "rho (kg/m3)", meaning: "Fluid density", typical: "1000 (water), 13600 (mercury)" },
      { name: "h (m)", meaning: "Fluid column depth", typical: "0.5 - 10 m common systems" },
      { name: "GM (m)", meaning: "Metacentric height (stability indicator)", typical: "Must be > 0 for float stability" },
      { name: "y_cp (m)", meaning: "Center of pressure on submerged plate", typical: "Always deeper than centroid depth" }
    ]
  },
  flowmeters: {
    intro: "Differential meters and dynamic devices measure fluid velocity and flow rate via local kinetic-to-static head conversion.",
    constants: [
      { name: "beta (d/D)", meaning: "Throat-to-pipe diameter ratio", typical: "0.3 - 0.75 range" },
      { name: "Cd (Venturi)", meaning: "Discharge coefficient for Venturi", typical: "0.97 - 0.99 (highly streamlined)" },
      { name: "Cd (Orifice)", meaning: "Discharge coefficient for Orifice", typical: "0.60 - 0.62 (large contraction loss)" },
      { name: "Cp (Pitot)", meaning: "Pitot tube correction coefficient", typical: "0.98 - 1.00 (direct velocity)" }
    ]
  },
  pipehydraulics: {
    intro: "Pipe hydraulics explores friction losses in conduits across laminar, transition, and turbulent flow regimes.",
    constants: [
      { name: "Reynolds (Re)", meaning: "Ratio of inertial to viscous forces", typical: "< 2100 laminar, > 4000 turbulent" },
      { name: "f_Darcy", meaning: "Darcy-Weisbach friction factor", typical: "0.015 - 0.08 for standard pipes" },
      { name: "roughness (m)", meaning: "Absolute roughness of pipe wall", typical: "4.5e-5 m (commercial steel)" },
      { name: "dP (Pa)", meaning: "Total frictional pressure drop", typical: "Depends strongly on velocity and diameter" }
    ]
  },
  pumps: {
    intro: "Centrifugal pumps add mechanical energy to fluids. Sizing requires power, efficiency, and cavitation check.",
    constants: [
      { name: "Hydraulic Power (W)", meaning: "Theoretical power added to the fluid", typical: "Flow rate * Density * g * Head" },
      { name: "BHP (W)", meaning: "Brake Horsepower required at pump shaft", typical: "Hydraulic Power / Efficiency" },
      { name: "NPSH Available (m)", meaning: "Absolute head at pump suction above vapor pressure", typical: "Must exceed NPSH Required" },
      { name: "Efficiency (%)", meaning: "Ratio of hydraulic output to mechanical input", typical: "60% - 85% industrial range" }
    ]
  },
  dragsettling: {
    intro: "Sedimentation describes solid particles settling in a fluid under gravity, resisted by skin and form drag.",
    constants: [
      { name: "v_t (m/s)", meaning: "Terminal settling velocity", typical: "Achieved when gravitational force matches drag" },
      { name: "Cd", meaning: "Drag coefficient of particle", typical: "24/Re in laminar, 0.44 in fully turbulent" },
      { name: "Re_p", meaning: "Particle Reynolds number", typical: "Determines boundary layer behavior" },
      { name: "dp (m)", meaning: "Spherical particle diameter", typical: "1e-5 to 1e-2 m" }
    ]
  },
  cycles: {
    intro: "Closed and open system energy balances analyze work, heat transfer, and entropy changes along thermodynamic paths.",
    constants: [
      { name: "dU (J)", meaning: "Internal energy change (closed system)", typical: "0 for isothermal paths" },
      { name: "dH (J)", meaning: "Enthalpy change (open system)", typical: "Cp * dT for ideal gas" },
      { name: "dS (J/K)", meaning: "Entropy change of the system", typical: "Measure of molecular disorder" },
      { name: "Carnot Efficiency", meaning: "Maximum theoretical efficiency between TH and TC", typical: "40% - 60% standard heat engines" }
    ]
  },
  eos: {
    intro: "Equations of State relate pressure, molar volume, and temperature for ideal and non-ideal fluids.",
    constants: [
      { name: "Z", meaning: "Compressibility factor (PV/RT)", typical: "1.0 (ideal gas), < 1.0 (intermolecular attraction)" },
      { name: "omega", meaning: "Acentric factor representing molecular shape asymmetry", typical: "0.0 (Argon), 0.152 (Propane)" },
      { name: "a (Pa.m6/mol2)", meaning: "van der Waals attractive force parameter", typical: "Positive property constant" },
      { name: "b (m3/mol)", meaning: "van der Waals co-volume parameter (molecular size)", typical: "Positive property constant" }
    ]
  },
  thermochem: {
    intro: "Thermochemistry analyzes enthalpy changes accompanying chemical reactions and phase transitions.",
    constants: [
      { name: "dH_rxn298 (J/mol)", meaning: "Standard heat of reaction at 298.15 K", typical: "Negative for exothermic reactions" },
      { name: "delta_Cp (J/mol.K)", meaning: "Enthalpy heat capacity change of reaction", typical: "Determines temperature slope of dH" },
      { name: "dH_rxnTemp (J/mol)", meaning: "Heat of reaction corrected for temperature", typical: "Calculated via Kirchhoff's equation" },
      { name: "dH_c (J/mol)", meaning: "Standard heat of combustion of fuel", typical: "Highly negative exothermic value" }
    ]
  },
  fugacity: {
    intro: "Fugacity corrections account for intermolecular forces, defining residual thermodynamic properties.",
    constants: [
      { name: "phi", meaning: "Fugacity coefficient (f/P)", typical: "1.0 (ideal limit), < 1.0 (dominant attractions)" },
      { name: "H^R (J/mol)", meaning: "Residual Enthalpy deviation from ideal gas", typical: "Enthalpy deviation at high pressure" },
      { name: "S^R (J/mol.K)", meaning: "Residual Entropy deviation from ideal gas", typical: "Entropy deviation at high pressure" },
      { name: "dV/dT (m3/K)", meaning: "Volumetric thermal expansion derivative", typical: "Used to verify Maxwell relations" }
    ]
  },
  equilibrium: {
    intro: "Phase and chemical equilibrium determine vapor-liquid partition and ultimate chemical reaction conversions.",
    constants: [
      { name: "gamma", meaning: "Activity coefficient representing liquid non-ideality", typical: "1.0 (ideal solution limit)" },
      { name: "P_bubble (Pa)", meaning: "Vapor-liquid bubble point pressure", typical: "Sum of partial pressures" },
      { name: "K(T)", meaning: "Temperature-dependent chemical equilibrium constant", typical: "Calculated via free energy change" },
      { name: "epsilon", meaning: "Fractional reaction extent (conversion)", typical: "0.0 (no reaction) to 1.0 (complete)" }
    ]
  },
  conduction: {
    intro: "Conduction models heat transfer within solid media or series configurations using thermal conductivity and resistance.",
    constants: [
      { name: "k (W/m.K)", meaning: "Thermal conductivity of the material", typical: "0.03 (insulation) to 400 (copper)" },
      { name: "L (m)", meaning: "Thickness of flat conduction wall", typical: "0.05 - 0.3 m" },
      { name: "rc (m)", meaning: "Critical radius of insulation", typical: "k/h for cylinder, 2k/h for sphere" },
      { name: "R_th (K/W)", meaning: "Thermal resistance of composite layers", typical: "Units sum to total resistance" }
    ]
  },
  convection: {
    intro: "Convection models fluid boundary layers, natural convection coefficients, and heat dissipation fins.",
    constants: [
      { name: "Re", meaning: "Reynolds number for plate flow boundary layer", typical: "Laminar boundary layer if Re < 500,000" },
      { name: "Pr", meaning: "Prandtl number (viscous to thermal diffusivity)", typical: "0.7 (air), 7.0 (water), 1000+ (oils)" },
      { name: "delta_t (m)", meaning: "Thermal boundary layer thickness", typical: "Proportional to delta * Pr^(-1/3)" },
      { name: "finEff (%)", meaning: "Efficiency of a pin fin heat sink", typical: "60% - 95% depending on length and material" }
    ]
  },
  radiation: {
    intro: "Radiation deals with electro-magnetic energy emission, absorption, and phase-change boiling/condensation heat fluxes.",
    constants: [
      { name: "Eb (W/m2)", meaning: "Blackbody emissive power (Stefan-Boltzmann)", typical: "sigma * T^4" },
      { name: "qRad/A (W/m2)", meaning: "Gray-body surface radiation exchange flux", typical: "Accounts for emissivities and temperatures" },
      { name: "qBoiling (W/m2)", meaning: "Rohsenow pool boiling heat flux", typical: "Rises rapidly with wall excess temperature" },
      { name: "hCond (W/m2.K)", meaning: "Nusselt vertical plate film condensation coefficient", typical: "1000 - 15000 W/m2K common" }
    ]
  },
  evaporator: {
    intro: "Evaporators vaporize solvents to concentrate solutions. Sizing requires thermal capacity and economy balances.",
    constants: [
      { name: "Capacity (W)", meaning: "Heat load required to boil solvent", typical: "Sensible heating + latent heat of vaporization" },
      { name: "Economy (Single)", meaning: "Vaporized solvent per unit steam", typical: "0.8 - 0.95 for single effect" },
      { name: "Economy (Double)", meaning: "Steam economy of two effects in series", typical: "1.6 - 1.9 (near double the efficiency)" },
      { name: "Area (m2)", meaning: "Heat transfer area of steam chest", typical: "Duty / (U * dT_eff)" }
    ]
  },
  mccabe: {
    intro: "McCabe-Thiele graphical method calculates the theoretical stages and feed tray location for binary fractionators.",
    constants: [
      { name: "Rmin", meaning: "Minimum reflux ratio required for separation", typical: "Determines pinch point limit" },
      { name: "R (Reflux)", meaning: "Operating reflux ratio", typical: "Typically 1.2 to 1.5 times Rmin" },
      { name: "stages", meaning: "Total number of theoretical trays", typical: "Includes reboiler as one stage" },
      { name: "feedStage", meaning: "Optimum feed tray entry stage", typical: "Counts from distillate down to bottoms" }
    ]
  },
  rachford: {
    intro: "Rachford-Rice equation models multicomponent isothermal flash separator drum splits.",
    constants: [
      { name: "psi", meaning: "Vapor fraction of the flash feed (V/F)", typical: "Must lie between 0.0 and 1.0" },
      { name: "Ki", meaning: "Component partition coefficients (y_i / x_i)", typical: "Vapor pressure / Total pressure" },
      { name: "zi", meaning: "Feed mole fraction vector", typical: "Sums to 1.0" }
    ]
  },
  pfr: {
    intro: "Plug Flow Reactors (PFR) model continuous cylindrical reactions with concentration gradients along the length.",
    constants: [
      { name: "V_pfr (m3)", meaning: "Reactor volume required for conversion", typical: "Solved via Simpson's integration of conversion" },
      { name: "resTime (s)", meaning: "Space time (residence time in tube)", typical: "Volume / Volumetric flow rate" },
      { name: "ca0 (mol/m3)", meaning: "Initial reactant concentration", typical: "Process concentration parameter" }
    ]
  },
  nonisothermal: {
    intro: "Non-isothermal reactor design couples kinetics and heat release so conversion and temperature are solved together.",
    constants: [
      { name: "Ea (J/mol)", meaning: "Activation energy in Arrhenius relation", typical: "40,000 - 120,000 J/mol" },
      { name: "deltaH (J/mol)", meaning: "Heat of reaction (negative for exothermic)", typical: "-20,000 to -120,000 J/mol" },
      { name: "rhoCp (J/m3.K)", meaning: "Volumetric heat capacity of reacting mixture", typical: "2e6 - 5e6 J/m3.K" },
      { name: "T_out (K)", meaning: "Adiabatic outlet temperature estimate", typical: "Often rises with conversion for exothermic systems" }
    ]
  },
  catalytic: {
    intro: "Catalytic reactor sizing estimates catalyst inventory needed to hit a target conversion for first-order kinetics.",
    constants: [
      { name: "k' (m3/kgcat.h)", meaning: "Catalyst-based rate constant", typical: "0.01 - 5.0 depending catalyst" },
      { name: "W_cat (kg)", meaning: "Required catalyst mass", typical: "From kilograms to tons in plant reactors" },
      { name: "tau (h)", meaning: "Space time based on required reactor volume", typical: "Minutes to hours" },
      { name: "X", meaning: "Target conversion", typical: "0.4 - 0.95 for many catalytic services" }
    ]
  },
  effectiveness: {
    intro: "Catalyst effectiveness factor quantifies how pore diffusion lowers the observed reaction rate inside pellets.",
    constants: [
      { name: "phi", meaning: "Thiele modulus (reaction to diffusion ratio)", typical: "<1 low diffusion resistance, >3 strong resistance" },
      { name: "eta", meaning: "Effectiveness factor", typical: "0.1 - 1.0" },
      { name: "D_eff (m2/s)", meaning: "Effective pore diffusivity", typical: "1e-10 to 1e-6 m2/s" },
      { name: "k_obs (1/s)", meaning: "Observed effective first-order rate", typical: "eta multiplied by intrinsic k" }
    ]
  },
  diffusionreaction: {
    intro: "Diffusion-reaction models internal concentration decay in porous pellets using first-order kinetics.",
    constants: [
      { name: "L (m)", meaning: "Characteristic diffusion length (half thickness or radius)", typical: "1e-4 to 5e-3 m" },
      { name: "C_s (mol/m3)", meaning: "Surface concentration at pellet-fluid interface", typical: "Depends on external film transfer" },
      { name: "N_s (mol/m2.s)", meaning: "Reactive flux at pellet surface", typical: "Increases with D_eff and k" },
      { name: "eta_slab", meaning: "Internal effectiveness for slab geometry", typical: "tanh(phi)/phi" }
    ]
  },
  packedbedreactor: {
    intro: "Packed bed reactor design links conversion target, catalyst packing inventory, and Ergun pressure-drop constraints.",
    constants: [
      { name: "dP/dL (Pa/m)", meaning: "Ergun pressure gradient through packed particles", typical: "10^2 - 10^5 Pa/m" },
      { name: "W_available (kg)", meaning: "Catalyst mass available from reactor geometry", typical: "Depends on voidage and bed volume" },
      { name: "W_required (kg)", meaning: "Catalyst mass required for target conversion", typical: "Calculated from kinetics" },
      { name: "Sizing Ratio", meaning: "W_available / W_required", typical: ">1 indicates adequate catalyst inventory" }
    ]
  },
  fluidizedbed: {
    intro: "Fluidized bed design predicts minimum fluidization velocity and bed expansion for gas-solid contactors.",
    constants: [
      { name: "U_mf (m/s)", meaning: "Minimum fluidization velocity", typical: "0.01 - 1.0 m/s depending solids" },
      { name: "Re_mf", meaning: "Particle Reynolds number at incipient fluidization", typical: "Laminar to transitional range" },
      { name: "epsilon", meaning: "Operating bed voidage", typical: "0.45 - 0.90 in fluidized state" },
      { name: "H_expanded (m)", meaning: "Expanded bed height at operating velocity", typical: "Increases as U/U_mf increases" }
    ]
  },
  rtd: {
    intro: "Residence time distribution (RTD) characterizes non-ideal flow and mixing using tracer-response functions.",
    constants: [
      { name: "E(t)", meaning: "Exit age distribution function", typical: "Area under curve equals 1" },
      { name: "F(t)", meaning: "Cumulative RTD function", typical: "Monotonically increases from 0 to 1" },
      { name: "tau (s)", meaning: "Mean residence time", typical: "Hydraulic volume divided by volumetric flow" },
      { name: "sigma^2 (s2)", meaning: "Variance of RTD", typical: "Lower values indicate narrower spread" }
    ]
  },
  reactoroptimization: {
    intro: "Reactor optimization balances conversion benefit with reactor size cost to maximize operating profit.",
    constants: [
      { name: "Profit ($/h)", meaning: "Revenue minus reactor-related operating/capitalized cost", typical: "Can peak before max conversion" },
      { name: "X_opt", meaning: "Profit-maximizing conversion", typical: "Often moderate rather than extreme" },
      { name: "V_opt (m3)", meaning: "Reactor volume at optimum conversion", typical: "Depends strongly on k and flow rate" },
      { name: "Sweep curve", meaning: "Profit trend versus conversion", typical: "Used for decision and sensitivity checks" }
    ]
  },
  diffusion: {
    intro: "Diffusion models molecular mass transport under concentration/partial pressure gradients using film and resistance theory.",
    constants: [
      { name: "D_AB (m2/s)", meaning: "Binary molecular diffusion coefficient", typical: "1e-5 (gases), 1e-9 (liquids)" },
      { name: "N_A (mol/m2.s)", meaning: "Mass transfer flux rate of solute", typical: "Determines rate of interface mass transfer" },
      { name: "k_c (m/s)", meaning: "Convective film mass transfer coefficient", typical: "D_AB / delta (film theory)" },
      { name: "K_G (mol/m2.s.Pa)", meaning: "Overall gas-phase mass transfer coefficient", typical: "Combines gas and liquid film resistances" }
    ]
  },
  absorption: {
    intro: "Absorption transfers a solute from gas to liquid. Column sizing uses VLE, operating lines, and HTU/NTU height concepts.",
    constants: [
      { name: "L_min (mol/s)", meaning: "Minimum liquid solvent rate required", typical: "Obtained at pinch-point (infinite stages)" },
      { name: "Absorption Factor (A)", meaning: "L / (m * V) - ratio of operating to equilibrium slope", typical: "1.2 - 2.0 (A > 1 for high recovery)" },
      { name: "NTU", meaning: "Number of Transfer Units (difficulty of separation)", typical: "Solved via log-mean driving force" },
      { name: "HTU (m)", meaning: "Height of a Transfer Unit (efficiency of packing)", typical: "0.3 - 0.9 m for industrial packing" }
    ]
  },
  drying: {
    intro: "Drying removes moisture from solids. Kinetics is split into constant-rate surface drying and falling-rate diffusion drying.",
    constants: [
      { name: "t_constant (h)", meaning: "Drying time during constant rate period", typical: "For moisture content above critical limit" },
      { name: "t_falling (h)", meaning: "Drying time during falling rate period", typical: "Governed by internal liquid diffusion" },
      { name: "X_c", meaning: "Critical moisture content (transition point)", typical: "0.1 - 0.2 kg water / kg dry solid" },
      { name: "R_c (kg/m2.h)", meaning: "Constant drying rate index", typical: "Depends on air velocity and humidity" }
    ]
  },
  economics: {
    intro: "Process economics and plant design analyze the feasibility of chemical engineering projects using capital cost scaling, depreciation, time value of money, and profitability indices.",
    constants: [
      { name: "FCI & WCI ($)", meaning: "Fixed Capital and Working Capital Investments", typical: "WCI is typically 15-20% of FCI" },
      { name: "Lang Factor", meaning: "Multiplier to estimate total plant cost from equipment cost", typical: "3.0 for solids, 4.0 for fluids" },
      { name: "Six-Tenths Exponent (n)", meaning: "Equipment cost scaling factor rule", typical: "n = 0.6 is a standard default" },
      { name: "NPV & IRR", meaning: "Net Present Value and Internal Rate of Return profitability metrics", typical: "IRR should exceed company hurdle rate (e.g. 15%)" }
    ]
  },
  distillation_design: {
    intro: "Tray column design sizes column diameter based on flooding limits, tray geometry, pressure drops, and steps stages using Murphree efficiency and Ponchon-Savarit energy balances.",
    constants: [
      { name: "Tray Spacing (m)", meaning: "Vertical distance between trays in column", typical: "0.45 - 0.60 m" },
      { name: "Murphree Efficiency (Emv)", meaning: "Murphree tray efficiency correction factor", typical: "0.60 - 0.85" },
      { name: "Pressure Drop (mm liquid)", meaning: "Total frictional pressure drop per sieve tray", typical: "50 - 120 mm liquid head" },
      { name: "Active Area Fraction", meaning: "Ratio of active tray bubbling area to total cross-section", typical: "0.75 - 0.88" }
    ]
  },
  extraction_leaching: {
    intro: "Liquid-Liquid extraction and solid leaching separate solute compounds using solvent partitions and dissolution equilibria.",
    constants: [
      { name: "Partition Coefficient (K)", meaning: "Equilibrium concentration ratio of solute between solvent and carrier", typical: "1.5 - 10+" },
      { name: "Solvent Retention Ratio", meaning: "Mass of solution retained per unit mass of inert solids in leaching underflow", typical: "0.2 - 0.8" },
      { name: "Target Recovery (%)", meaning: "Fraction of feed solute extracted in leaching overflow", typical: "90% - 99%" }
    ]
  },
  adsorption: {
    intro: "Adsorption describes solute molecules binding to active solid surfaces. Bed design models S-curve breakthroughs over time.",
    constants: [
      { name: "qm (mg/g)", meaning: "Maximum monolayer adsorption capacity (Langmuir)", typical: "10 - 500 mg/g" },
      { name: "Breakthrough Time (tb)", meaning: "Operational limit when outlet solute concentration exceeds limit", typical: "Hours to days" },
      { name: "LUB (m)", meaning: "Length of Unused Bed representing unused mass transfer zone", typical: "0.1 - 0.8 m" }
    ]
  },
  humidification: {
    intro: "Humidification properties track vapor-air psychrometrics. Cooling tower heights are sized using enthalpy driving force integrals.",
    constants: [
      { name: "Relative Humidity (RH)", meaning: "Ratio of water partial pressure to sat vapor pressure", typical: "10% - 95%" },
      { name: "Humid Volume (vH)", meaning: "Volume of air per kg of dry air carrying water vapor", typical: "0.8 - 0.95 m³/kg dry air" },
      { name: "Cooling Tower NTU", meaning: "Number of Transfer Units (separation difficulty)", typical: "1.0 - 4.5" }
    ]
  },
  equipmentsizing: {
    intro: "Equipment sizing converts process balances into preliminary dimensions, holdup, and utility requirements for major chemical plant hardware.",
    constants: [
      { name: "Design throughput", meaning: "Nominal flow basis plus design margin", typical: "10-20% above expected average operation" },
      { name: "Residence time", meaning: "Required process hold-up", typical: "Seconds for mixers, minutes to hours for vessels" },
      { name: "Allowable velocity", meaning: "Hydraulic constraint for service", typical: "Bounded by erosion, entrainment, or pressure-drop limits" },
      { name: "Design margin", meaning: "Conservative allowance for uncertainty", typical: "Applied during early-stage sizing" }
    ]
  },
  columndesign: {
    intro: "Column design combines equilibrium-separation targets with tray or packing hydraulics to establish stages and diameter.",
    constants: [
      { name: "Theoretical stages", meaning: "Ideal equilibrium contacts required", typical: "Converted to real stages via tray/packing efficiency" },
      { name: "Reflux/Solvent ratio", meaning: "Separation driving intensity", typical: "Chosen above minimum for controllability" },
      { name: "Flooding fraction", meaning: "Operating load relative to flood point", typical: "Typically 70-85% of flooding rate" },
      { name: "Stage pressure drop", meaning: "Hydraulic loss through internals", typical: "Limited by vacuum and utility penalties" }
    ]
  },
  reactorsizing: {
    intro: "Reactor sizing maps kinetics and heat effects into required volume, catalyst inventory, and conversion profile.",
    constants: [
      { name: "Rate law", meaning: "Reaction rate dependence on concentration and temperature", typical: "Empirical or mechanistic model basis" },
      { name: "Target conversion", meaning: "Required reactant conversion level", typical: "Set by product purity and economics" },
      { name: "Space time (tau)", meaning: "Volume divided by volumetric feed rate", typical: "Primary preliminary reactor sizing metric" },
      { name: "Heat of reaction", meaning: "Thermal source/sink from conversion", typical: "Determines heating/cooling integration needs" }
    ]
  },
  pumpselection: {
    intro: "Pump selection aligns process duty with pump curves while preserving NPSH margin and efficient operation.",
    constants: [
      { name: "Flow rate (Q)", meaning: "Required liquid flow duty", typical: "Defined by process throughput and recycles" },
      { name: "Total Dynamic Head", meaning: "Static plus friction and pressure-lift demand", typical: "Core criterion for pump matching" },
      { name: "NPSH available/required", meaning: "Cavitation prevention check", typical: "NPSH available must exceed required with margin" },
      { name: "Best Efficiency Point", meaning: "Most efficient stable operating region", typical: "Operation preferred near BEP range" }
    ]
  },
  heatx_sizing: {
    intro: "Heat exchanger sizing links thermal duty to driving force and overall heat transfer coefficient.",
    constants: [
      { name: "Duty (Q)", meaning: "Required heat transfer load", typical: "Computed from stream energy balances" },
      { name: "LMTD", meaning: "Log-mean temperature difference", typical: "Corrected for multipass/crossflow arrangements" },
      { name: "Overall U", meaning: "Combined film, wall, and fouling coefficient", typical: "Service- and geometry-dependent" },
      { name: "Area (A)", meaning: "Required transfer surface", typical: "From Q = U*A*DeltaT_lm relation" }
    ]
  },
  costestimation: {
    intro: "Cost estimation quantifies preliminary feasibility using equipment scaling, installation factors, and operating costs.",
    constants: [
      { name: "Base equipment cost", meaning: "Reference purchased-equipment cost", typical: "Supplier or database anchor at base year" },
      { name: "Capacity exponent", meaning: "Size-cost scaling exponent", typical: "Often about 0.5 to 0.8 for process equipment" },
      { name: "Installation factor", meaning: "Multiplier to convert purchased to installed cost", typical: "Includes piping, steel, and site complexity" },
      { name: "OPEX drivers", meaning: "Recurring operating-cost contributors", typical: "Utilities and raw materials dominate variable cost" }
    ]
  },
  processoptimization: {
    intro: "Process optimization identifies operating/design settings that maximize value while meeting safety and quality constraints.",
    constants: [
      { name: "Objective function", meaning: "Target quantity to optimize", typical: "Profit, conversion, utility use, or emissions" },
      { name: "Decision variables", meaning: "Adjustable process parameters", typical: "Temperature, pressure, recycle, reflux, residence time" },
      { name: "Constraints", meaning: "Hard feasibility boundaries", typical: "Equipment limits and product specifications" },
      { name: "Sensitivity", meaning: "Objective response to variable changes", typical: "Used to rank optimization levers" }
    ]
  },
  pfd_pid_calc: {
    intro: "PFD and P&ID calculations establish consistent design-basis numbers for streams, lines, valves, and instrument loops.",
    constants: [
      { name: "Mass/energy closure", meaning: "Overall and component balance consistency", typical: "Required before detailed design freeze" },
      { name: "Line velocity limits", meaning: "Service-specific piping criteria", typical: "Chosen to avoid erosion, noise, or settling" },
      { name: "Control valve Cv", meaning: "Valve capacity sizing coefficient", typical: "From flow, pressure drop, and fluid properties" },
      { name: "Tag and loop basis", meaning: "Instrumentation and control data integrity", typical: "Aligned across PFD, P&ID, and loop sheets" }
    ]
  }
};

const moduleReferences = {
  plume: {
    derivation: "Developed by Pasquill (1961) and modified by Gifford to estimate downwind dispersion of point-source pollution based on standard deviation of plume spread.",
    dailyUse: "Environmental permits and preliminary site assessment for local particulate/gas emissions.",
    industrialUse: "Air quality monitoring for flare stacks, chemical leaks, and determining safe zones around power plant stack emissions."
  },
  heatexchanger: {
    derivation: "Derived from integrating Fourier's Law of steady heat conduction across a varying temperature gradient for single-pass parallel/counter-flow systems.",
    dailyUse: "Quick efficiency checks for HVAC sizing or small-scale heating/cooling applications.",
    industrialUse: "Sizing shell-and-tube or plate heat exchangers in oil refineries and petrochemical plants to optimize energy recovery."
  },
  pipeflow: {
    derivation: "Based on the Darcy-Weisbach equation. The Colebrook-White equation for friction was approximated by Swamee and Jain (1976) for direct solving without iteration.",
    dailyUse: "Checking pressure drops in residential plumbing or calculating pump heads for garden irrigation.",
    industrialUse: "Sizing large-scale pipeline networks and evaluating pump head requirements for massive process fluid transport systems."
  },
  cstr: {
    derivation: "Derived from a steady-state molar mass balance over a well-mixed control volume, popularized in classical reaction engineering texts like Fogler.",
    dailyUse: "Educational prototyping or small continuous brewing and fermentation prototyping.",
    industrialUse: "Sizing large-scale fermentation tanks, wastewater treatment reactors, and continuous polymer synthesis loops."
  },
  flash: {
    derivation: "Based on the Rachford-Rice (1952) objective function, using Raoult's Law and constant relative volatility to simplify vapor-liquid equilibrium (VLE).",
    dailyUse: "Simple solvent recovery approximations or lab-scale distillation troubleshooting.",
    industrialUse: "Design of flash drums prior to distillation columns in crude oil processing and natural gas phase separation."
  },
  ergun: {
    derivation: "Formulated by Sabri Ergun in 1952, combining the Kozeny-Carman viscous flow equation with the Burke-Plummer inertial flow equation for porous media.",
    dailyUse: "Designing household water filtration systems and small gravel-bed filters.",
    industrialUse: "Predicting pressure drop in catalytic fixed beds, blast furnaces, and industrial absorption or scrubbing towers."
  },
  fenske: {
    derivation: "Engineered by Merrell Fenske (1932) to compute the theoretical minimum number of trays for multicomponent distillation at total reflux.",
    dailyUse: "Evaluating fundamental separations potential and determining if a distillation split is even theoretically feasible.",
    industrialUse: "Shortcut column design in petrochemistry to bound rigorous stage-by-stage simulations for mass transfer."
  },
  pid: {
    derivation: "Developed by John G. Ziegler and Nathaniel B. Nichols in 1942 based on ultimate gain and period, or process step responses (FOPDT).",
    dailyUse: "Tuning 3D printer bed thermistors, drone rotors, or simple sous-vide temperature controllers.",
    industrialUse: "Field-tuning countless flow, temperature, and pressure control loops across continuous chemical synthesis floors."
  },
  transferfunction: {
    derivation: "Based on Laplace-domain linearization of process balances and standard block-diagram control theory.",
    dailyUse: "Approximating tank, heater, or sensor behavior before writing controller logic.",
    industrialUse: "Building plant-wide control models for reactors, distillation columns, and heat-integrated networks."
  },
  laplace: {
    derivation: "Developed by Pierre-Simon Laplace to transform differential equations into algebraic expressions in s-domain.",
    dailyUse: "Converting textbook step and ramp process inputs for quick control calculations.",
    industrialUse: "Deriving dynamic process-transfer models used in DCS tuning and advanced process control."
  },
  dynamicresponse: {
    derivation: "Rooted in first-principles process dynamics and first-order-plus-dead-time identification methods.",
    dailyUse: "Interpreting how quickly lab systems respond to valve changes.",
    industrialUse: "Step-test analysis for temperature, pressure, and composition loops in operating plants."
  },
  firstorder: {
    derivation: "Comes from linear mass/energy balances where one dominant storage element controls dynamics.",
    dailyUse: "Modeling simple stirred tanks and thermal sensors.",
    industrialUse: "Estimating loop response of many utilities and auxiliary process systems."
  },
  secondorder: {
    derivation: "Arises from coupled storage effects and actuator-process interactions in linearized process models.",
    dailyUse: "Studying overshoot and oscillation of lab heater-control setups.",
    industrialUse: "Designing and diagnosing interacting process loops with oscillatory tendencies."
  },
  controllertuning: {
    derivation: "Combines empirical Ziegler-Nichols rules with model-based IMC tuning for process-control applications.",
    dailyUse: "Generating initial PI/PID settings from simple step tests.",
    industrialUse: "Commissioning and retuning DCS loops for robust chemical plant operation."
  },
  stabilityanalysis: {
    derivation: "Uses Routh-Hurwitz algebraic criteria to assess closed-loop characteristic polynomial stability.",
    dailyUse: "Checking if a candidate controller may destabilize a benchtop loop.",
    industrialUse: "Formal stability screening before deploying new controller settings in production units."
  },
  rootlocus: {
    derivation: "Developed by Walter R. Evans to visualize closed-loop pole migration with changing loop gain.",
    dailyUse: "Understanding how gain changes affect damping and oscillation.",
    industrialUse: "Selecting safe controller gain windows in process control retrofits."
  },
  bodeplots: {
    derivation: "Introduced by Hendrik Wade Bode to represent frequency-domain gain and phase behavior.",
    dailyUse: "Estimating sensor filtering impact on loop speed.",
    industrialUse: "Verifying gain and phase margins for stability robustness in chemical process loops."
  },
  frequencyresponse: {
    derivation: "Derived from sinusoidal steady-state analysis of linear dynamic systems in s = jw form.",
    dailyUse: "Checking how periodic disturbances propagate through a process.",
    industrialUse: "Designing disturbance rejection strategies for compressors, reactors, and separations."
  },
  pidcalculations: {
    derivation: "Based on continuous PID control law decomposition into proportional, integral, and derivative actions.",
    dailyUse: "Evaluating immediate controller output from measured process error.",
    industrialUse: "Implementing and validating PID logic in PLC/DCS for plant control loops."
  },
  hydrostatics: {
    derivation: "Based on Blaise Pascal's law of pressure transmission in fluids (1647) and Archimedes' buoyancy principles (250 BC).",
    dailyUse: "Estimating water tower tank pressures, sizing basic hydraulic jacks, or checking floating pontoon load stability.",
    industrialUse: "Designing massive storage tanks, underwater bulkheads, and assessing hydrostatic stability of offshore oil rigs."
  },
  flowmeters: {
    derivation: "Derived by Giovanni Venturi (1797) and Henri Pitot (1732) using Bernoulli's conservation of energy mechanical energy balances.",
    dailyUse: "Validating domestic water meters or measuring airspeed via Pitot-static systems on personal airplanes.",
    industrialUse: "Standardizing orifice/Venturi plates in high-pressure oil pipelines and gas distribution headers for billing."
  },
  pipehydraulics: {
    derivation: "Developed by Gotthilf Hagen (1839) and Jean Poiseuille (1840) for laminar flow, extended by Darcy, Weisbach, and Colebrook for turbulent conditions.",
    dailyUse: "Sizing main pipes in residential heating, selecting garden hose diameters, or calculating pool filter pressure drops.",
    industrialUse: "Estimating friction pressure losses across petrochemical refineries, cross-country gas pipelines, and massive process line headers."
  },
  pumps: {
    derivation: "Derived from Euler's turbomachinery equations for momentum change in impellers, coupled with Net Positive Suction Head safety formulas.",
    dailyUse: "Selecting water well pumps or sizing domestic sumps and pond water recirculation filters.",
    industrialUse: "Specifying process pumps for volatile liquids, checking NPSHa to ensure no cavitation erosion on impeller blades."
  },
  dragsettling: {
    derivation: "Formulated by George Gabriel Stokes (1851) for viscous friction, extended with semi-empirical correlations for high-velocity particle regimes.",
    dailyUse: "Evaluating coffee grind settling rates in cold brew or tracking dust settling speeds in home air filters.",
    industrialUse: "Designing mineral flotation tanks, wastewater clarifiers, industrial cyclone separators, and fluidization beds."
  },
  cycles: {
    derivation: "Grounded in Sadi Carnot's reflection on thermodynamic cycles (1824) and Rudolf Clausius's mathematical formulation of entropy.",
    dailyUse: "Estimating air conditioning cooling loads or checking general power plant conversion efficiencies.",
    industrialUse: "Designing steam power cycles (Rankine), gas turbine plants (Brayton), and optimizing large-scale industrial refrigeration compressors."
  },
  eos: {
    derivation: "Developed by Johannes Diderik van der Waals (1873) by correcting ideal gas volumes for molecular size and attractive forces.",
    dailyUse: "Calculating gas cylinder contents at high pressures or verifying compressibility factors for laboratory gas cylinders.",
    industrialUse: "Predicting volumetric properties of hydrocarbon mixtures in gas reservoirs and pipelines using Virial or Cubic equations of state."
  },
  thermochem: {
    derivation: "Based on Germain Hess's law of constant heat summation (1840) and Gustav Kirchhoff's reaction enthalpy temperature correction equation (1858).",
    dailyUse: "Determining heating values of fuels or estimating theoretical flame temperatures of barbecue grills.",
    industrialUse: "Sizing cooling jackets for highly exothermic chemical reactors and predicting heat loads in combustion furnace designs."
  },
  fugacity: {
    derivation: "Formulated by Gilbert N. Lewis (1901) to replace physical pressure with chemical activity, defining thermodynamic departures.",
    dailyUse: "Evaluating thermodynamic property deviations for non-ideal high-pressure gas streams.",
    industrialUse: "Determining residual enthalpy and entropy changes in non-ideal gas expansions, steam turbines, and gas compressors."
  },
  equilibrium: {
    derivation: "Grounded in J. Willard Gibbs' phase rule and free energy minimization, combined with Margules (1895) activity coefficient correlations.",
    dailyUse: "Predicting solvent recovery purities or estimating vapor pressure drops in simple distillation splits.",
    industrialUse: "Sizing gas-liquid absorption columns, distillation systems, and calculating final product yields of industrial chemical reactors."
  },
  conduction: {
    derivation: "Formulated from Jean-Baptiste Joseph Fourier's Analytical Theory of Heat (1822) mapping thermal conduction in solids.",
    dailyUse: "Evaluating insulation thickness for domestic pipe systems and home walls.",
    industrialUse: "Sizing insulation jackets for refinery reactors, steam pipes, and calculating furnace wall heat losses."
  },
  convection: {
    derivation: "Based on boundary layer equations solved by Ludwig Prandtl (1904) and fin heat transfer equations combining conduction and surface convection.",
    dailyUse: "Sizing heat sink cooling fins for computer CPUs and consumer electronics.",
    industrialUse: "Sizing air-cooled heat exchangers, turbine blade cooling passages, and industrial convection drying tunnels."
  },
  radiation: {
    derivation: "Derived by Josef Stefan (1879) and Ludwig Boltzmann (1884) for blackbody radiation, combined with Nusselt and Rohsenow phase change correlations.",
    dailyUse: "Calculating radiant campfire warmth, sizing kitchen boiling pots, or checking simple condenser cooling loads.",
    industrialUse: "Designing boiler water tubes, steam condensers, nuclear reactor cooling cores, and petrochemical combustion chambers."
  },
  evaporator: {
    derivation: "Formulated from heat and material balances of evaporative solvent recovery, popularized by Norbert Rillieux's invention of multiple-effect evaporation (1843).",
    dailyUse: "Sizing small juice concentrate boilers or evaluating sugar refinery steam loads.",
    industrialUse: "Designing multi-stage desalination systems, pulp/paper black liquor concentrators, and industrial chemical crystallization units."
  },
  mccabe: {
    derivation: "Invented by Warren L. McCabe and Ernest Thiele in 1925 to simplify binary distillation column sizing graphically.",
    dailyUse: "Estimating reflux needs for lab fractionators and verifying stages in ethanol-water stills.",
    industrialUse: "Quick sizing and baseline validation of industrial fractionators in chemical plants and oil refineries."
  },
  rachford: {
    derivation: "Derived by Rachford and Rice in 1952 to compute vapor-liquid equilibrium splits for multi-component hydrocarbons.",
    dailyUse: "Solving flash separator gas-liquid splits for lab-scale solvent separation.",
    industrialUse: "Designing flash drums, refinery separator stages, and gas processing plant demethanizers."
  },
  pfr: {
    derivation: "Derived from continuous molar balances along a tubular coordinate system, solving kinetics differential equations.",
    dailyUse: "Sizing laboratory tube reactors or estimating residence times for continuous polymer lines.",
    industrialUse: "Designing tubular cracking furnaces, high-pressure ethylene reactors, and massive catalytic gas-phase reformers."
  },
  nonisothermal: {
    derivation: "Based on adiabatic energy balances combined with Arrhenius temperature-dependent kinetics from classical reaction engineering.",
    dailyUse: "Checking whether a lab reactor can self-heat or needs temperature control during exothermic tests.",
    industrialUse: "Designing adiabatic catalytic reactors, quench systems, and runaway-risk screening for scale-up."
  },
  catalytic: {
    derivation: "Derived from catalyst-weight form of the design equation W = integral(F_A0/(-rA'))dX for heterogeneous reactors.",
    dailyUse: "Estimating catalyst charge for pilot packed beds and lab-scale fixed-bed tubes.",
    industrialUse: "Sizing hydroprocessing, reforming, oxidation, and ammonia synthesis catalyst beds."
  },
  effectiveness: {
    derivation: "Uses Thiele modulus and analytical effectiveness-factor solutions from porous catalyst pellet diffusion-reaction theory.",
    dailyUse: "Comparing pellet sizes to see if observed rate loss is diffusion-limited.",
    industrialUse: "Selecting catalyst pellet diameter and porosity during scale-up and revamp studies."
  },
  diffusionreaction: {
    derivation: "Solved from steady-state diffusion-reaction differential equations in porous solids with first-order kinetics.",
    dailyUse: "Estimating concentration gradients inside catalyst pellets during bench experiments.",
    industrialUse: "Predicting internal transport limitations in refinery, hydrogenation, and environmental catalysts."
  },
  packedbedreactor: {
    derivation: "Combines Ergun's packed-bed momentum equation with catalytic reactor design equations on catalyst weight basis.",
    dailyUse: "Balancing pressure drop and conversion in small tubular packed bed reactors.",
    industrialUse: "Designing fixed-bed catalytic reactors in petrochemical, fertilizer, and specialty chemical plants."
  },
  fluidizedbed: {
    derivation: "Built from Ergun incipient-fluidization balance and Richardson-Zaki bed expansion correlations for gas-solid systems.",
    dailyUse: "Checking if airflow in a lab fluidized bed is high enough to fluidize catalyst particles.",
    industrialUse: "Designing FCC regenerators, polymerization reactors, biomass gasifiers, and fluid-bed dryers."
  },
  rtd: {
    derivation: "Uses tracer-response theory and tanks-in-series model developed from age distribution analysis in non-ideal reactors.",
    dailyUse: "Diagnosing bypassing or dead zones in mixing tanks from tracer pulse tests.",
    industrialUse: "Characterizing commercial reactors and separator vessels for model calibration and debottlenecking."
  },
  reactoroptimization: {
    derivation: "Applies economic objective functions over reactor design equations to find conversion maximizing net profit.",
    dailyUse: "Choosing sensible conversion targets for lab campaigns with limited catalyst and utilities.",
    industrialUse: "Operating-point optimization in continuous reactors under catalyst cost and throughput constraints."
  },
  diffusion: {
    derivation: "Formulated from Adolf Fick's laws of diffusion (1855) and Fuller, Schettler, Giddings semi-empirical gas diffusivity correlation (1966).",
    dailyUse: "Estimating perfume evaporation rates in a room or damp clothes drying in still air.",
    industrialUse: "Sizing chemical membrane separators, gas sweetening units, and catalyst pellet pore diffusion parameters."
  },
  absorption: {
    derivation: "Based on Kremser's absorption stage analytical equations (1930) and Chilton-Colburn HTU/NTU analogies (1935).",
    dailyUse: "Analyzing ammonia water-scrubbers or domestic gas absorption cooling loops.",
    industrialUse: "Designing industrial CO2 capture amine columns, acidic gas scrubbers, and VOC tail gas recovery units."
  },
  drying: {
    derivation: "Based on Lewis' solid drying model dividing kinetic behavior into constant surface evaporation and falling-rate diffusion regimes.",
    dailyUse: "Estimating hair drying times or optimizing food dehydrator baking durations.",
    industrialUse: "Specifying continuous rotary dryers, spray drying towers, and fluid bed dryers for solid product processing."
  },
  economics: {
    derivation: "Based on classic chemical engineering design methodologies by Peters & Timmerhaus, Lang factors, Swamee-Jain capacity scaling rules, and compound discounting formulas.",
    dailyUse: "Calculating loans, estimating equipment replacements, and assessing personal retirement annuities.",
    industrialUse: "Sizing refinery investments, validating factory capacity scaling cost expansions, and deciding capital allocations via company hurdle rate evaluations."
  },
  distillation_design: {
    derivation: "Based on Ponchon-Savarit enthalpy balance stage calculations (1921-1922) and Murphree tray efficiency correlations (1925).",
    dailyUse: "Checking fractional column heat loads or sizing small laboratory glass distillation towers.",
    industrialUse: "Sizing petroleum fractionators, industrial ethanol columns, and distillation column tray geometries."
  },
  extraction_leaching: {
    derivation: "Uses Hunter-Nash LLE stage balance methodologies (1936) and standard counter-current leaching equations.",
    dailyUse: "Brewing coffee (leaching) or decaffeinating tea leaves via solvent washing.",
    industrialUse: "Specifying liquid extractors for pharmaceutical intermediates or oilseed leaching plants."
  },
  adsorption: {
    derivation: "Based on Langmuir gas-surface monolayer bounds (1918), Freundlich adsorption correlations (1909), and fixed-bed breakthrough models.",
    dailyUse: "Checking water filter cartridges or using silica gel packets to keep packages dry.",
    industrialUse: "Designing carbon bed solvent recovery units, industrial air dryers, and pressure swing adsorption plants."
  },
  humidification: {
    derivation: "Based on psychrometric carrier-air balances, Antoine vapor equations, and Merkel's cooling tower NTU integrals (1925).",
    dailyUse: "Checking relative humidity with wet/dry bulb thermometers or home evaporative cooler limits.",
    industrialUse: "Designing industrial natural draft cooling towers, power plant condenser cooling loops, and humidifiers."
  },
  equipmentsizing: {
    derivation: "Derived from conservation balances and first-pass design heuristics used in process design texts for vessels, separators, and utility equipment.",
    dailyUse: "Sizing household storage tanks, pressure vessels, or utility buffers from flow and hold-up requirements.",
    industrialUse: "Pre-FEED sizing of process drums, tanks, and separators before detailed mechanical design."
  },
  columndesign: {
    derivation: "Built on equilibrium stage methods (Fenske-Underwood-Gilliland, Kremser, and HTU/NTU concepts) coupled with hydraulic flood checks.",
    dailyUse: "Estimating required contact stages in a teaching distillation or absorption setup.",
    industrialUse: "Designing refinery and petrochemical towers for separation duty while staying below flooding limits."
  },
  reactorsizing: {
    derivation: "Based on reactor design equations from mole and energy balances for CSTR, PFR, and heterogeneous catalytic reactors.",
    dailyUse: "Estimating batch-to-continuous reactor scale conversion for pilot experiments.",
    industrialUse: "Sizing plant reactors to meet conversion and selectivity targets under thermal and pressure constraints."
  },
  pumpselection: {
    derivation: "Developed from Bernoulli plus friction-loss frameworks and manufacturer pump performance curves with NPSH criteria.",
    dailyUse: "Choosing water-transfer pumps for irrigation or tank-to-tank transfer applications.",
    industrialUse: "Selecting centrifugal pumps in process units based on duty point, efficiency, and cavitation margin."
  },
  heatx_sizing: {
    derivation: "Founded on heat-transfer balances and LMTD/effectiveness methods from classical exchanger design theory.",
    dailyUse: "Estimating required coil or plate area for small heating or cooling services.",
    industrialUse: "Preliminary thermal sizing of shell-and-tube and plate exchangers during process package development."
  },
  costestimation: {
    derivation: "Built on chemical plant cost-indexing, scale-up exponents, Lang factors, and lifecycle operating-cost methods.",
    dailyUse: "Rough-order budgeting for equipment replacement and utility-cost comparisons.",
    industrialUse: "Conceptual CAPEX/OPEX estimation for feasibility studies and investment decisions."
  },
  processoptimization: {
    derivation: "Uses constrained optimization methods over process models to maximize economic performance while preserving feasibility.",
    dailyUse: "Tuning operating conditions in lab units for yield, conversion, or energy reduction.",
    industrialUse: "Plant-wide optimization of throughput, utility usage, and product slate under operating constraints."
  },
  pfd_pid_calc: {
    derivation: "Comes from structured process design workflows linking stream balances, hydraulic checks, and control-loop sizing data.",
    dailyUse: "Preparing consistent stream tables and loop notes for unit-operation reports.",
    industrialUse: "Producing coherent design-basis calculations that support PFD/P&ID issue for design and hazard review."
  }
};

const INDIAN_CITY_DEFAULTS = {
  delhi: { name: "Delhi", lat: 28.6139, lon: 77.209, windSpeed: 2.4, stability: "E" },
  mumbai: { name: "Mumbai", lat: 19.076, lon: 72.8777, windSpeed: 4.2, stability: "D" },
  kolkata: { name: "Kolkata", lat: 22.5726, lon: 88.3639, windSpeed: 3.1, stability: "D" },
  chennai: { name: "Chennai", lat: 13.0827, lon: 80.2707, windSpeed: 4.4, stability: "C" },
  bengaluru: { name: "Bengaluru", lat: 12.9716, lon: 77.5946, windSpeed: 3.3, stability: "D" },
  hyderabad: { name: "Hyderabad", lat: 17.385, lon: 78.4867, windSpeed: 3.2, stability: "D" },
  pune: { name: "Pune", lat: 18.5204, lon: 73.8567, windSpeed: 3.0, stability: "D" },
  ahmedabad: { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, windSpeed: 3.4, stability: "D" },
  jaipur: { name: "Jaipur", lat: 26.9124, lon: 75.7873, windSpeed: 2.9, stability: "E" },
  lucknow: { name: "Lucknow", lat: 26.8467, lon: 80.9462, windSpeed: 2.5, stability: "E" },
  bhopal: { name: "Bhopal", lat: 23.2599, lon: 77.4126, windSpeed: 2.6, stability: "E" },
  surat: { name: "Surat", lat: 21.1702, lon: 72.8311, windSpeed: 3.6, stability: "D" },
  kanpur: { name: "Kanpur", lat: 26.4499, lon: 80.3319, windSpeed: 2.4, stability: "E" },
  patna: { name: "Patna", lat: 25.5941, lon: 85.1376, windSpeed: 2.4, stability: "E" },
  guwahati: { name: "Guwahati", lat: 26.1445, lon: 91.7362, windSpeed: 2.1, stability: "E" },
  amritsar: { name: "Amritsar", lat: 31.634, lon: 74.8723, windSpeed: 2.7, stability: "E" },
  ludhiana: { name: "Ludhiana", lat: 30.901, lon: 75.8573, windSpeed: 2.8, stability: "E" },
  jalandhar: { name: "Jalandhar", lat: 31.326, lon: 75.5762, windSpeed: 2.7, stability: "E" },
  patiala: { name: "Patiala", lat: 30.3398, lon: 76.3869, windSpeed: 2.6, stability: "E" },
  bathinda: { name: "Bathinda", lat: 30.211, lon: 74.9455, windSpeed: 2.8, stability: "E" },
  mohali: { name: "Mohali", lat: 30.7046, lon: 76.7179, windSpeed: 2.6, stability: "E" },
  pathankot: { name: "Pathankot", lat: 32.2643, lon: 75.6421, windSpeed: 2.5, stability: "E" },
  moga: { name: "Moga", lat: 30.823, lon: 75.1738, windSpeed: 2.7, stability: "E" },
  hoshiarpur: { name: "Hoshiarpur", lat: 31.5143, lon: 75.9115, windSpeed: 2.6, stability: "E" },
  sangrur: { name: "Sangrur", lat: 30.2458, lon: 75.8421, windSpeed: 2.7, stability: "E" },
  firozpur: { name: "Firozpur", lat: 30.9331, lon: 74.6225, windSpeed: 2.8, stability: "E" }
};

// ── Utility functions ──
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const formatNum = (v) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.abs(v) >= 10000 || (Math.abs(v) > 0 && Math.abs(v) < 0.001)
      ? v.toExponential(4)
      : v.toFixed(4)
    : String(v);

function inferStabilityFromWind(windSpeed) {
  const ws = num(windSpeed, 2);
  if (ws < 1.5) return "F";
  if (ws < 2.5) return "E";
  if (ws < 3.5) return "D";
  if (ws < 5) return "C";
  return "B";
}

function toCsvRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const header = keys.join(",");
  const body = rows
    .map((row) =>
      keys
        .map((k) => {
          const value = row[k] ?? "";
          const str = typeof value === "object" ? JSON.stringify(value) : String(value);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

function exportCsv(filename, data) {
  const rows = Array.isArray(data) ? data : [data];
  const csv = toCsvRows(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Calculation functions (unchanged logic) ──
function calcPlume(inputs) {
  const stackHeight = num(inputs.stackHeight);
  const emissionRate = num(inputs.emissionRate);
  const windSpeed = num(inputs.windSpeed, 1);
  const stability = String(inputs.stability || "D").toUpperCase();
  const c = stabilityCoeff[stability] || stabilityCoeff.D;
  const profile = [];
  for (let d = 100; d <= 5000; d += 100) {
    const sy = c.ay * Math.pow(d, c.by);
    const sz = c.az * Math.pow(d, c.bz);
    const concentration =
      (emissionRate / (Math.PI * windSpeed * sy * sz)) *
      Math.exp(-(Math.pow(stackHeight, 2) / (2 * Math.pow(sz, 2))));
    profile.push({ distance: d, concentration });
  }
  return { maxConcentration: Math.max(...profile.map((p) => p.concentration)), profile };
}

function calcHeatExchanger(inputs) {
  const th_in = num(inputs.th_in); const th_out = num(inputs.th_out); const tc_in = num(inputs.tc_in); const tc_out = num(inputs.tc_out); const u_val = num(inputs.u_val); const area = num(inputs.area);
  const dT1 = th_in - tc_out; const dT2 = th_out - tc_in;
  const lmtd = Math.abs(dT1 - dT2) < 1e-9 ? dT1 : (dT1 - dT2) / Math.log(Math.max(dT1, 1e-9) / Math.max(dT2, 1e-9));
  const heatDuty = u_val * area * lmtd;
  const effectiveness = clamp(((th_in - th_out) / Math.max(th_in - tc_in, 1e-9)) * 100, 0, 100);
  return { dT1, dT2, lmtd, heatDuty, effectiveness };
}

function calcPipeFlow(inputs) {
  const diameter = num(inputs.diameter); const length = num(inputs.length); const roughness = num(inputs.roughness); const velocity = num(inputs.velocity); const density = num(inputs.density); const viscosity = num(inputs.viscosity);
  const reynolds = (density * velocity * diameter) / Math.max(viscosity, 1e-12);
  const frictionFactor = reynolds < 2300 ? 64 / Math.max(reynolds, 1e-9) : 0.25 / Math.pow(Math.log10(roughness / (3.7 * Math.max(diameter, 1e-12)) + 5.74 / Math.pow(reynolds, 0.9)), 2);
  const pressureDrop = frictionFactor * (length / Math.max(diameter, 1e-12)) * ((density * velocity * velocity) / 2);
  const volumetricFlow = (Math.PI * diameter * diameter * velocity) / 4;
  const pumpPower = pressureDrop * volumetricFlow;
  return { reynolds, frictionFactor, pressureDrop, volumetricFlow, pumpPower };
}

function calcCstr(inputs) {
  const flowRate = num(inputs.flowRate); const targetConversion = clamp(num(inputs.targetConversion), 1e-6, 0.999999); const rateConstant = num(inputs.rateConstant);
  const volume = (flowRate * targetConversion) / (Math.max(rateConstant, 1e-12) * (1 - targetConversion));
  const residenceTime = volume / Math.max(flowRate, 1e-12);
  return { volume, residenceTime };
}

function calcFlash(inputs) {
  const z = num(inputs.z); const alpha = num(inputs.alpha); const vaporFraction = num(inputs.vaporFraction);
  const liquidMoleFraction = z / (1 + vaporFraction * (alpha - 1));
  const vaporMoleFraction = (alpha * liquidMoleFraction) / (1 + (alpha - 1) * liquidMoleFraction);
  return { liquidMoleFraction, vaporMoleFraction };
}

function calcErgun(inputs) {
  const L = num(inputs.L); const Dp = num(inputs.Dp); const epsilon = clamp(num(inputs.epsilon), 1e-6, 0.999999); const v = num(inputs.v); const rho = num(inputs.rho); const mu = num(inputs.mu);
  const dP_dL = (150 * mu * v * Math.pow(1 - epsilon, 2)) / (Math.pow(Dp, 2) * Math.pow(epsilon, 3)) + (1.75 * rho * v * v * (1 - epsilon)) / (Dp * Math.pow(epsilon, 3));
  const totalPressureDrop = dP_dL * L;
  return { dP_dL, totalPressureDrop };
}

function calcFenske(inputs) {
  const alpha = num(inputs.alpha); const xD = clamp(num(inputs.xD), 1e-9, 1 - 1e-9); const xB = clamp(num(inputs.xB), 1e-9, 1 - 1e-9);
  const nMin = Math.log((xD / (1 - xD)) / (xB / (1 - xB))) / Math.log(Math.max(alpha, 1 + 1e-9));
  return { nMin };
}

function calcPid(inputs) {
  const Kp = num(inputs.Kp); const tau_p = num(inputs.tau_p); const theta = num(inputs.theta);
  return {
    pi: { Kc: (0.9 * tau_p) / (Math.max(Kp, 1e-12) * Math.max(theta, 1e-12)), tauI: 3.3 * theta },
    pid: { Kc: (1.2 * tau_p) / (Math.max(Kp, 1e-12) * Math.max(theta, 1e-12)), tauI: 2.0 * theta, tauD: 0.5 * theta }
  };
}

function calcTransferFunction(inputs) {
  const processGain = num(inputs.processGain, 2.0);
  const tau1 = Math.max(num(inputs.tau1, 4.0), 1e-9);
  const tau2 = Math.max(num(inputs.tau2, 1.5), 1e-9);
  const deadTime = Math.max(num(inputs.deadTime, 0.8), 0);

  const a = tau1 * tau2;
  const b = tau1 + tau2;
  const c = 1;
  const discriminant = b * b - 4 * a * c;
  let poles = [];
  if (discriminant >= 0) {
    const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    poles = [{ real: r1, imag: 0 }, { real: r2, imag: 0 }];
  } else {
    const real = -b / (2 * a);
    const imag = Math.sqrt(Math.abs(discriminant)) / (2 * a);
    poles = [{ real, imag }, { real, imag: -imag }];
  }

  const modelType = deadTime > 0 ? "SOPDT with dead time" : "SOPDT";
  const transferFunction = `${formatNum(processGain)} * exp(-${formatNum(deadTime)}s) / ((${formatNum(tau1)}s+1)(${formatNum(tau2)}s+1))`;

  return {
    modelType,
    transferFunction,
    numerator: [processGain],
    denominator: [a, b, c],
    steadyGain: processGain,
    poles
  };
}

function calcLaplace(inputs) {
  const signalType = String(inputs.signalType || "step").toLowerCase();
  const amplitude = num(inputs.amplitude, 1.0);
  const decay = Math.max(num(inputs.decay, 1.0), 1e-9);
  const omega = Math.max(num(inputs.omega, 1.0), 1e-9);
  const sValue = Math.max(num(inputs.sValue, 1.0), 1e-9);
  const tValue = Math.max(num(inputs.tValue, 1.0), 0);

  let laplaceExpression = "";
  let valueAtS = 0;
  let timeDomainSample = 0;

  if (signalType === "ramp") {
    laplaceExpression = `${formatNum(amplitude)}/s^2`;
    valueAtS = amplitude / (sValue * sValue);
    timeDomainSample = amplitude * tValue;
  } else if (signalType === "impulse") {
    laplaceExpression = `${formatNum(amplitude)}`;
    valueAtS = amplitude;
    timeDomainSample = tValue === 0 ? amplitude : 0;
  } else if (signalType === "exponential") {
    laplaceExpression = `${formatNum(amplitude)}/(s+${formatNum(decay)})`;
    valueAtS = amplitude / (sValue + decay);
    timeDomainSample = amplitude * Math.exp(-decay * tValue);
  } else if (signalType === "sine") {
    laplaceExpression = `${formatNum(amplitude * omega)}/(s^2+${formatNum(omega * omega)})`;
    valueAtS = (amplitude * omega) / (sValue * sValue + omega * omega);
    timeDomainSample = amplitude * Math.sin(omega * tValue);
  } else {
    laplaceExpression = `${formatNum(amplitude)}/s`;
    valueAtS = amplitude / sValue;
    timeDomainSample = amplitude;
  }

  return { signalType, laplaceExpression, valueAtS, timeDomainSample };
}

function calcDynamicResponse(inputs) {
  const processGain = num(inputs.processGain, 2.0);
  const tau = Math.max(num(inputs.tau, 6.0), 1e-9);
  const deadTime = Math.max(num(inputs.deadTime, 1.0), 0);
  const stepSize = num(inputs.stepSize, 1.0);
  const horizon = Math.max(num(inputs.horizon, 40), 1);

  const profile = [];
  const points = 80;
  for (let i = 0; i <= points; i++) {
    const t = (horizon * i) / points;
    const y = t < deadTime ? 0 : processGain * stepSize * (1 - Math.exp(-(t - deadTime) / tau));
    profile.push({ t, y });
  }

  const finalValue = processGain * stepSize;
  const riseTime90 = deadTime + 2.303 * tau;
  const settlingTime = deadTime + 4 * tau;
  return { finalValue, riseTime90, settlingTime, profile };
}

function calcFirstOrder(inputs) {
  const processGain = num(inputs.processGain, 1.6);
  const tau = Math.max(num(inputs.tau, 5.0), 1e-9);
  const stepSize = num(inputs.stepSize, 1.0);
  const horizon = Math.max(num(inputs.horizon, 30), 1);

  const finalValue = processGain * stepSize;
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

  return { finalValue, y63, riseTime1090, settlingTime, profile };
}

function calcSecondOrder(inputs) {
  const processGain = num(inputs.processGain, 1.0);
  const zeta = Math.max(num(inputs.zeta, 0.4), 1e-6);
  const wn = Math.max(num(inputs.wn, 0.8), 1e-6);
  const stepSize = num(inputs.stepSize, 1.0);
  const horizon = Math.max(num(inputs.horizon, 40), 1);

  const finalValue = processGain * stepSize;
  const profile = [];
  const points = 100;

  let overshoot = 0;
  let peakTime = 0;
  let settlingTime = zeta > 0 ? 4 / (zeta * wn) : Infinity;
  let dampedFrequency = 0;

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

  return { finalValue, overshoot, peakTime, settlingTime, dampedFrequency, profile };
}

function calcControllerTuning(inputs) {
  const processGain = num(inputs.processGain, 1.5);
  const tau = Math.max(num(inputs.tau, 8.0), 1e-9);
  const theta = Math.max(num(inputs.theta, 1.2), 1e-9);
  const ku = Math.max(num(inputs.ku, 2.4), 1e-9);
  const pu = Math.max(num(inputs.pu, 4.0), 1e-9);
  const lambda = Math.max(num(inputs.lambda, 5.0), 1e-9);

  const znPI = { Kc: 0.45 * ku, Ti: pu / 1.2 };
  const znPID = { Kc: 0.6 * ku, Ti: pu / 2, Td: pu / 8 };

  const imcPI = {
    Kc: tau / (Math.max(processGain, 1e-12) * (lambda + theta)),
    Ti: tau + theta / 2
  };
  const imcPID = {
    Kc: (tau + theta / 2) / (Math.max(processGain, 1e-12) * (lambda + theta / 2)),
    Ti: tau + theta / 2,
    Td: (tau * theta) / Math.max(2 * tau + theta, 1e-12)
  };

  return { znPI, znPID, imcPI, imcPID };
}

function calcStabilityAnalysis(inputs) {
  const a3 = num(inputs.a3, 1);
  const a2 = num(inputs.a2, 6);
  const a1 = num(inputs.a1, 11);
  const a0 = num(inputs.a0, 6);

  const positivity = a3 > 0 && a2 > 0 && a1 > 0 && a0 > 0;
  const marginTerm = a2 * a1 - a3 * a0;
  const stable = positivity && marginTerm > 0;
  const routhS1 = marginTerm / Math.max(a2, 1e-12);
  const status = stable ? "Stable" : "Unstable";

  return { marginTerm, routhS1, stable, status };
}

function calcRootLocus(inputs) {
  const tau1 = Math.max(num(inputs.tau1, 4.0), 1e-9);
  const tau2 = Math.max(num(inputs.tau2, 1.8), 1e-9);
  const selectedK = Math.max(num(inputs.selectedK, 2.0), 0);
  const kMax = Math.max(num(inputs.kMax, 20), selectedK + 1e-9);

  const computeRoots = (k) => {
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
    const roots = computeRoots(k);
    locus.push({ k, real1: roots[0].real, imag1: roots[0].imag, real2: roots[1].real, imag2: roots[1].imag });
  }
  const selectedRoots = computeRoots(selectedK);

  return { selectedRoots, locus };
}

function calcBodePlots(inputs) {
  const processGain = Math.max(num(inputs.processGain, 2.0), 1e-12);
  const tau1 = Math.max(num(inputs.tau1, 4.0), 1e-9);
  const tau2 = Math.max(num(inputs.tau2, 1.5), 1e-9);
  const wMin = Math.max(num(inputs.wMin, 0.01), 1e-6);
  const wMax = Math.max(num(inputs.wMax, 10), wMin * 1.01);
  const points = Math.max(Math.round(num(inputs.points, 40)), 10);

  const bode = [];
  for (let i = 0; i <= points; i++) {
    const ratio = i / points;
    const w = wMin * Math.pow(wMax / wMin, ratio);
    const mag =
      20 * Math.log10(processGain) -
      10 * Math.log10(1 + Math.pow(w * tau1, 2)) -
      10 * Math.log10(1 + Math.pow(w * tau2, 2));
    const phase = (-(Math.atan(w * tau1) + Math.atan(w * tau2)) * 180) / Math.PI;
    bode.push({ w, magnitude: mag, phase });
  }

  let crossover = null;
  for (let i = 1; i < bode.length; i++) {
    if ((bode[i - 1].magnitude >= 0 && bode[i].magnitude <= 0) || (bode[i - 1].magnitude <= 0 && bode[i].magnitude >= 0)) {
      crossover = bode[i].w;
      break;
    }
  }

  return { crossover, bode };
}

function calcFrequencyResponse(inputs) {
  const processGain = num(inputs.processGain, 2.0);
  const tau = Math.max(num(inputs.tau, 5.0), 1e-9);
  const omega = Math.max(num(inputs.omega, 0.4), 1e-9);
  const inputAmplitude = num(inputs.inputAmplitude, 1.0);

  const amplitudeRatio = processGain / Math.sqrt(1 + Math.pow(omega * tau, 2));
  const phaseLagDeg = (-Math.atan(omega * tau) * 180) / Math.PI;
  const outputAmplitude = amplitudeRatio * inputAmplitude;

  const sweep = [];
  for (let w = 0.01; w <= 10; w *= 1.22) {
    const ar = processGain / Math.sqrt(1 + Math.pow(w * tau, 2));
    const ph = (-Math.atan(w * tau) * 180) / Math.PI;
    sweep.push({ w, amplitudeRatio: ar, phaseLagDeg: ph });
  }

  return { amplitudeRatio, phaseLagDeg, outputAmplitude, sweep };
}

function calcPidCalculations(inputs) {
  const kc = num(inputs.kc, 1.8);
  const ti = Math.max(num(inputs.ti, 3.5), 1e-9);
  const td = Math.max(num(inputs.td, 0.8), 0);
  const setPoint = num(inputs.setPoint, 60);
  const pv = num(inputs.pv, 55);
  const prevError = num(inputs.prevError, 4.5);
  const integral = num(inputs.integral, 20);
  const dt = Math.max(num(inputs.dt, 1), 1e-9);
  const bias = num(inputs.bias, 0);
  const outputMin = num(inputs.outputMin, 0);
  const outputMax = num(inputs.outputMax, 100);

  const error = setPoint - pv;
  const integralNew = integral + error * dt;
  const pTerm = kc * error;
  const iTerm = (kc / ti) * integralNew;
  const dTerm = kc * td * ((error - prevError) / dt);
  const rawOutput = bias + pTerm + iTerm + dTerm;
  const output = clamp(rawOutput, outputMin, outputMax);

  return { error, pTerm, iTerm, dTerm, rawOutput, output, integralNew };
}

function calcHydrostatics(inputs) {
  const fluidDensity = num(inputs.fluidDensity, 1000);
  const height = num(inputs.height, 2);
  const patm = num(inputs.patm, 101325);
  const plateWidth = num(inputs.plateWidth, 1);
  const plateHeight = num(inputs.plateHeight, 2);
  const plateDepthCentroid = num(inputs.plateDepthCentroid, 3);
  const manometerFluidDensity = num(inputs.manometerFluidDensity, 13600);
  const manometerDeflection = num(inputs.manometerDeflection, 0.1);
  const submergedVolume = num(inputs.submergedVolume, 10);
  const waterplaneI = num(inputs.waterplaneI, 12);
  const bgDistance = num(inputs.bgDistance, 0.5);

  const g = 9.81;
  const phydro = fluidDensity * g * height;
  const pabs = phydro + patm;
  const fhydro = fluidDensity * g * plateDepthCentroid * (plateWidth * plateHeight);
  const ycp = plateDepthCentroid + (plateHeight * plateHeight) / (12 * plateDepthCentroid);
  const manometerDeltaP = (manometerFluidDensity - fluidDensity) * g * manometerDeflection;
  const bm = waterplaneI / Math.max(submergedVolume, 1e-12);
  const gm = bm - bgDistance;
  const stability = gm > 0 ? "Stable" : "Unstable";

  return { phydro, pabs, fhydro, ycp, manometerDeltaP, bm, gm, stability };
}

function calcFlowMeters(inputs) {
  const pipeDiameter = num(inputs.pipeDiameter, 0.1);
  const throatDiameter = num(inputs.throatDiameter, 0.05);
  const fluidDensity = num(inputs.fluidDensity, 1000);
  const deltaP = num(inputs.deltaP, 50000);
  const dischargeCoeffVenturi = num(inputs.dischargeCoeffVenturi, 0.98);
  const dischargeCoeffOrifice = num(inputs.dischargeCoeffOrifice, 0.61);
  const dischargeCoeffPitot = num(inputs.dischargeCoeffPitot, 1.0);
  const rotameterFloatVolume = num(inputs.rotameterFloatVolume, 1e-5);
  const rotameterFloatDensity = num(inputs.rotameterFloatDensity, 7800);
  const rotameterFloatArea = num(inputs.rotameterFloatArea, 1e-4);
  const rotameterAnnularArea = num(inputs.rotameterAnnularArea, 5e-5);
  const rotameterDischargeCoeff = num(inputs.rotameterDischargeCoeff, 0.6);

  const beta = clamp(throatDiameter / Math.max(pipeDiameter, 1e-12), 0.01, 0.99);
  const a1 = (Math.PI * pipeDiameter * pipeDiameter) / 4;
  const a2 = (Math.PI * throatDiameter * throatDiameter) / 4;

  const term1 = 1 - Math.pow(beta, 4);
  const sqrtTerm = Math.sqrt((2 * Math.max(deltaP, 0)) / (fluidDensity * Math.max(term1, 1e-12)));
  const qVenturi = dischargeCoeffVenturi * a2 * sqrtTerm;
  const qOrifice = dischargeCoeffOrifice * a2 * sqrtTerm;
  const vPitot = dischargeCoeffPitot * Math.sqrt((2 * Math.max(deltaP, 0)) / fluidDensity);
  const qRotameter = rotameterDischargeCoeff * rotameterAnnularArea * Math.sqrt((2 * 9.81 * rotameterFloatVolume * Math.max(rotameterFloatDensity - fluidDensity, 0)) / (Math.max(rotameterFloatArea, 1e-12) * fluidDensity));

  return { beta, qVenturi, qOrifice, vPitot, qRotameter };
}

function calcPipeHydraulics(inputs) {
  const diameter = num(inputs.diameter, 0.1);
  const length = num(inputs.length, 50);
  const velocity = num(inputs.velocity, 1.5);
  const density = num(inputs.density, 1000);
  const viscosity = num(inputs.viscosity, 0.001);
  const roughness = num(inputs.roughness, 0.000045);

  const reynolds = (density * velocity * diameter) / Math.max(viscosity, 1e-12);
  const regime = reynolds < 2100 ? "Laminar" : (reynolds > 4000 ? "Turbulent" : "Transition");
  let fDarcy = 0;
  if (reynolds < 2100) {
    fDarcy = 64 / Math.max(reynolds, 1e-9);
  } else {
    fDarcy = 0.25 / Math.pow(Math.log10(roughness / (3.7 * Math.max(diameter, 1e-12)) + 5.74 / Math.pow(reynolds, 0.9)), 2);
  }
  const q = (Math.PI * diameter * diameter * velocity) / 4;
  const dpLaminar = (128 * viscosity * length * q) / (Math.PI * Math.pow(Math.max(diameter, 1e-12), 4));
  const dpDarcy = fDarcy * (length / Math.max(diameter, 1e-12)) * (density * velocity * velocity / 2);

  return { reynolds, regime, fDarcy, dpLaminar, dpDarcy };
}

function calcPumps(inputs) {
  const flowRate = num(inputs.flowRate, 0.05);
  const head = num(inputs.head, 30);
  const density = num(inputs.density, 1000);
  const efficiency = num(inputs.efficiency, 0.75);
  const suctionPressure = num(inputs.suctionPressure, 101325);
  const vaporPressure = num(inputs.vaporPressure, 2340);
  const suctionLosses = num(inputs.suctionLosses, 5000);
  const elevationDifference = num(inputs.elevationDifference, 2);
  const npshRequired = num(inputs.npshRequired, 4);

  const g = 9.81;
  const hydraulicPower = density * g * flowRate * head;
  const brakeHorsepower = hydraulicPower / Math.max(efficiency, 1e-12);
  const headTerm = (suctionPressure - vaporPressure - suctionLosses) / (density * g);
  const npshAvailable = headTerm - elevationDifference;
  const cavitationRisk = npshAvailable < npshRequired;

  return { hydraulicPower, brakeHorsepower, npshAvailable, cavitationRisk };
}

function calcDragSettling(inputs) {
  const particleDiameter = num(inputs.particleDiameter, 0.0005);
  const particleDensity = num(inputs.particleDensity, 2500);
  const fluidDensity = num(inputs.fluidDensity, 1000);
  const fluidViscosity = num(inputs.fluidViscosity, 0.001);

  const g = 9.81;
  let vt = 0.1;
  let cd = 0.44;
  let rep = 0;

  for (let i = 0; i < 100; i++) {
    rep = (fluidDensity * vt * particleDiameter) / Math.max(fluidViscosity, 1e-12);
    if (rep < 0.1) {
      cd = 24 / Math.max(rep, 1e-9);
    } else if (rep < 1000) {
      cd = (24 / Math.max(rep, 1e-9)) * (1 + 0.15 * Math.pow(rep, 0.687));
    } else {
      cd = 0.44;
    }
    const newVt = Math.sqrt((4 * g * particleDiameter * Math.max(particleDensity - fluidDensity, 0)) / (3 * fluidDensity * cd));
    if (Math.abs(newVt - vt) < 1e-6) {
      vt = newVt;
      break;
    }
    vt = newVt;
  }

  return { vt, cd, rep };
}

function calcCycles(inputs) {
  const n = num(inputs.n, 1);
  const t1 = num(inputs.t1, 300);
  const t2 = num(inputs.t2, 450);
  const v1 = num(inputs.v1, 0.02);
  const v2 = num(inputs.v2, 0.04);
  const cv = num(inputs.cv, 20.8);
  const cp = num(inputs.cp, 29.1);
  const th = num(inputs.th, 600);
  const tc = num(inputs.tc, 300);
  const cycleType = String(inputs.cycleType || "isothermal").toLowerCase();

  const r = 8.314;
  let w = 0, q = 0, du = 0, dh = 0, ds = 0;
  const vRatio = v2 / Math.max(v1, 1e-9);
  const tRatio = t2 / Math.max(t1, 1e-9);

  if (cycleType === "isothermal") {
    w = n * r * t1 * Math.log(vRatio);
    q = w;
    du = 0;
    dh = 0;
    ds = n * r * Math.log(vRatio);
  } else if (cycleType === "isobaric") {
    du = n * cv * (t2 - t1);
    dh = n * cp * (t2 - t1);
    q = dh;
    w = q - du;
    ds = n * cp * Math.log(tRatio);
  } else if (cycleType === "isochoric") {
    du = n * cv * (t2 - t1);
    dh = n * cp * (t2 - t1);
    q = du;
    w = 0;
    ds = n * cv * Math.log(tRatio);
  } else if (cycleType === "adiabatic") {
    du = n * cv * (t2 - t1);
    dh = n * cp * (t2 - t1);
    w = -du;
    q = 0;
    ds = 0;
  }

  const carnotEff = 1 - tc / Math.max(th, 1e-9);
  return { w, q, du, dh, ds, carnotEff };
}

function calcEos(inputs) {
  const t = num(inputs.t, 350);
  const p = num(inputs.p, 1500000);
  const tc = num(inputs.tc, 369.8);
  const pc = num(inputs.pc, 4250000);
  const omega = num(inputs.omega, 0.152);
  const mockPsatAtTr07 = num(inputs.mockPsatAtTr07, 425000);

  const r = 8.314;
  const tr = t / Math.max(tc, 1e-9);
  const vIdeal = (r * t) / Math.max(p, 1e-9);

  // Virial
  const b0 = 0.083 - 0.422 / Math.pow(tr, 1.6);
  const b1 = 0.139 - 0.172 / Math.pow(tr, 4.2);
  const b = (r * tc / Math.max(pc, 1e-9)) * (b0 + omega * b1);
  const zVirial = 1 + (b * p) / (r * t);
  const vVirial = zVirial * vIdeal;

  // Cubic van der Waals
  const aVdw = (27 * Math.pow(r * tc, 2)) / (64 * Math.max(pc, 1e-9));
  const bVdw = (r * tc) / (8 * Math.max(pc, 1e-9));
  let vCubic = vIdeal;
  for (let i = 0; i < 100; i++) {
    const fVal = Math.pow(vCubic, 3) - (bVdw + (r * t) / p) * Math.pow(vCubic, 2) + (aVdw / p) * vCubic - (aVdw * bVdw) / p;
    const fDeriv = 3 * Math.pow(vCubic, 2) - 2 * (bVdw + (r * t) / p) * vCubic + aVdw / p;
    const nextV = vCubic - fVal / Math.max(fDeriv, 1e-12);
    if (Math.abs(nextV - vCubic) < 1e-8) {
      vCubic = nextV;
      break;
    }
    vCubic = nextV;
  }
  const zCubic = (p * vCubic) / (r * t);
  const calculatedOmega = -Math.log10(Math.max(mockPsatAtTr07 / Math.max(pc, 1e-9), 1e-12)) - 1.0;

  return { vIdeal, zVirial, vVirial, zCubic, vCubic, calculatedOmega };
}

function calcThermochem(inputs) {
  const temp = num(inputs.temp, 500);
  const reactants = inputs.reactants || [
    { name: "CO", hf: -110500, cp: 29.1, nu: 1 },
    { name: "O2", hf: 0, cp: 29.4, nu: 0.5 }
  ];
  const products = inputs.products || [
    { name: "CO2", hf: -393500, cp: 37.1, nu: 1 }
  ];

  let sumProdHf = 0, sumReactHf = 0;
  let sumProdCp = 0, sumReactCp = 0;

  products.forEach(p => {
    sumProdHf += num(p.hf) * num(p.nu);
    sumProdCp += num(p.cp) * num(p.nu);
  });

  reactants.forEach(r => {
    sumReactHf += num(r.hf) * num(r.nu);
    sumReactCp += num(r.cp) * num(r.nu);
  });

  const hRxn298 = sumProdHf - sumReactHf;
  const deltaCp = sumProdCp - sumReactCp;
  const hRxnTemp = hRxn298 + deltaCp * (temp - 298.15);
  const hCombustion = hRxnTemp;

  return { hRxn298, deltaCp, hRxnTemp, hCombustion };
}

function calcFugacity(inputs) {
  const t = num(inputs.t, 350);
  const p = num(inputs.p, 1500000);
  const tc = num(inputs.tc, 369.8);
  const pc = num(inputs.pc, 4250000);

  const r = 8.314;
  const a = (27 * Math.pow(r * tc, 2)) / (64 * Math.max(pc, 1e-9));
  const b = (r * tc) / (8 * Math.max(pc, 1e-9));

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

  const v = getV(t, p);
  const z = (p * v) / (r * t);

  const hResidual = p * v - r * t - a / Math.max(v, 1e-9);
  const sResidual = r * Math.log(Math.max(1 - b / Math.max(v, 1e-9), 1e-12));
  const lnPhi = z - 1 - Math.log(Math.max(z - (p * b) / (r * t), 1e-12)) - a / Math.max(r * t * v, 1e-12);
  const phi = Math.exp(lnPhi);
  const fugacity = phi * p;

  const dT = 0.1;
  const vPlus = getV(t + dT, p);
  const vMinus = getV(t - dT, p);
  const dV_dT = (vPlus - vMinus) / (2 * dT);

  return { hResidual, sResidual, phi, fugacity, dV_dT };
}

function calcEquilibrium(inputs) {
  const temp = num(inputs.temp, 350);
  const x1 = num(inputs.x1, 0.4);
  const a12 = num(inputs.a12, 1.2);
  const a21 = num(inputs.a21, 0.8);
  const p1Sat = num(inputs.p1Sat, 120000);
  const p2Sat = num(inputs.p2Sat, 70000);
  const deltaG298 = num(inputs.deltaG298, -10000);
  const deltaH298 = num(inputs.deltaH298, -20000);
  const modelType = String(inputs.modelType || "margules").toLowerCase();

  const r = 8.314;
  const x2 = 1 - x1;
  let gamma1 = 1, gamma2 = 1;

  if (modelType === "margules") {
    const lnGamma1 = Math.pow(x2, 2) * (a12 + 2 * (a21 - a12) * x1);
    const lnGamma2 = Math.pow(x1, 2) * (a21 + 2 * (a12 - a21) * x2);
    gamma1 = Math.exp(lnGamma1);
    gamma2 = Math.exp(lnGamma2);
  } else if (modelType === "vanlaar") {
    const factor1 = (a12 * x1) / Math.max(a21 * x2, 1e-12);
    const factor2 = (a21 * x2) / Math.max(a12 * x1, 1e-12);
    gamma1 = Math.exp(a12 / Math.pow(1 + factor1, 2));
    gamma2 = Math.exp(a21 / Math.pow(1 + factor2, 2));
  } else if (modelType === "wilson") {
    const term1 = x1 + a12 * x2;
    const term2 = a21 * x1 + x2;
    gamma1 = Math.exp(-Math.log(Math.max(term1, 1e-12)) + x2 * (a12 / Math.max(term1, 1e-12) - a21 / Math.max(term2, 1e-12)));
    gamma2 = Math.exp(-Math.log(Math.max(term2, 1e-12)) - x1 * (a12 / Math.max(term1, 1e-12) - a21 / Math.max(term2, 1e-12)));
  }

  const bubbleP = x1 * gamma1 * p1Sat + x2 * gamma2 * p2Sat;
  const y1 = (x1 * gamma1 * p1Sat) / Math.max(bubbleP, 1e-12);

  const k298 = Math.exp(-deltaG298 / (r * 298.15));
  const kTemp = k298 * Math.exp((-deltaH298 / r) * (1 / temp - 1 / 298.15));
  const epsilon = kTemp / (1 + kTemp);

  return { gamma1, gamma2, bubbleP, y1, kTemp, epsilon };
}

function calcConduction(inputs) {
  const k = num(inputs.k, 0.5);
  const thick = num(inputs.thick, 0.1);
  const t1 = num(inputs.t1, 100);
  const t2 = num(inputs.t2, 25);
  const kIns = num(inputs.kIns, 0.04);
  const hExt = num(inputs.hExt, 10);
  const r1 = num(inputs.r1, 0.05);
  const r2 = num(inputs.r2, 0.08);
  const kWall = num(inputs.kWall, 15);
  const len = num(inputs.len, 10);
  const compThicks = inputs.compThicks || [0.05, 0.1];
  const compKs = inputs.compKs || [0.8, 0.04];

  const qFlat = k * (t1 - t2) / Math.max(thick, 1e-9);

  let rComp = 0;
  for (let i = 0; i < compThicks.length; i++) {
    rComp += num(compThicks[i]) / Math.max(num(compKs[i]), 1e-9);
  }
  const qComp = (t1 - t2) / Math.max(rComp, 1e-9);

  const rCyl = Math.log(r2 / Math.max(r1, 1e-9)) / (2 * Math.PI * len * kWall);
  const qCyl = (t1 - t2) / Math.max(rCyl, 1e-12);

  const rSph = (r2 - r1) / (4 * Math.PI * kWall * r1 * r2);
  const qSph = (t1 - t2) / Math.max(rSph, 1e-12);

  const rcCyl = kIns / Math.max(hExt, 1e-9);
  const rcSph = (2 * kIns) / Math.max(hExt, 1e-9);

  return { qFlat, qComp, qCyl, qSph, rcCyl, rcSph };
}

function calcConvection(inputs) {
  const fluidDensity = num(inputs.fluidDensity, 998);
  const velocity = num(inputs.velocity, 2);
  const viscosity = num(inputs.viscosity, 0.001);
  const length = num(inputs.length, 1);
  const cp = num(inputs.cp, 4184);
  const kFluid = num(inputs.kFluid, 0.6);
  const tempWall = num(inputs.tempWall, 80);
  const tempFluid = num(inputs.tempFluid, 20);
  const finDiam = num(inputs.finDiam, 0.01);
  const finLen = num(inputs.finLen, 0.1);
  const finK = num(inputs.finK, 200);
  const hConvection = num(inputs.hConvection, 50);

  const re = (fluidDensity * velocity * length) / Math.max(viscosity, 1e-12);
  const pr = (cp * viscosity) / Math.max(kFluid, 1e-12);

  const boundaryL = 5.0 * length / Math.sqrt(Math.max(re, 1));
  const boundaryT = boundaryL * Math.pow(Math.max(pr, 1e-6), -1/3);

  const beta = 1 / (tempFluid + 273.15);
  const g = 9.81;
  const dT = Math.abs(tempWall - tempFluid);
  const kinematicVisc = viscosity / Math.max(fluidDensity, 1e-9);
  const gr = (g * beta * dT * Math.pow(length, 3)) / Math.max(Math.pow(kinematicVisc, 2), 1e-15);
  const ra = gr * pr;

  const nuTerm = 0.387 * Math.pow(ra, 1/6);
  const nuDenom = Math.pow(1 + Math.pow(0.492 / Math.max(pr, 1e-9), 9/16), 8/27);
  const nuNatural = Math.pow(0.825 + nuTerm / Math.max(nuDenom, 1e-9), 2);
  const hNatural = (nuNatural * kFluid) / Math.max(length, 1e-9);

  const pFin = Math.PI * finDiam;
  const aFin = (Math.PI * Math.pow(finDiam, 2)) / 4;
  const mFin = Math.sqrt((hConvection * pFin) / Math.max(finK * aFin, 1e-12));
  const mL = mFin * finLen;
  const finEff = Math.abs(mL) < 1e-6 ? 1.0 : Math.tanh(mL) / mL;

  return { re, pr, boundaryL, boundaryT, gr, ra, nuNatural, hNatural, finEff };
}

function calcRadiation(inputs) {
  const temp1 = num(inputs.temp1, 800);
  const temp2 = num(inputs.temp2, 300);
  const eps1 = num(inputs.eps1, 0.8);
  const eps2 = num(inputs.eps2, 0.6);
  const tempSat = num(inputs.tempSat, 373.15);
  const tempWall = num(inputs.tempWall, 390);
  const hfg = num(inputs.hfg, 2256000);
  const rhoL = num(inputs.rhoL, 958);
  const rhoV = num(inputs.rhoV, 0.6);
  const muL = num(inputs.muL, 0.00028);
  const kL = num(inputs.kL, 0.68);
  const cpL = num(inputs.cpL, 4220);
  const sigmaBoil = num(inputs.sigmaBoil, 0.0589);
  const csf = num(inputs.csf, 0.013);
  const boilingPr = num(inputs.boilingPr, 1.75);

  const sigmaRad = 5.67e-8;
  const eBlack1 = sigmaRad * Math.pow(temp1, 4);

  const qRadExchange = (sigmaRad * (Math.pow(temp1, 4) - Math.pow(temp2, 4))) /
    (1 / eps1 + 1 / eps2 - 1);

  const g = 9.81;
  const dTBoil = Math.max(tempWall - tempSat, 0);
  const factor1 = muL * hfg * Math.sqrt((g * (rhoL - rhoV)) / Math.max(sigmaBoil, 1e-9));
  const factor2 = (cpL * dTBoil) / Math.max(csf * hfg * Math.pow(boilingPr, 1), 1e-12);
  const qBoiling = factor1 * Math.pow(factor2, 3);

  const hfgCorr = hfg + 0.68 * cpL * Math.max(tempSat - tempWall, 0);
  const dTCond = Math.max(tempSat - tempWall, 1e-9);
  const condTerm = (g * rhoL * (rhoL - rhoV) * Math.pow(kL, 3) * hfgCorr) /
    (muL * dTCond * 1.0);
  const hCond = 0.943 * Math.pow(Math.max(condTerm, 0), 0.25);
  const qCond = hCond * dTCond;

  return { eBlack1, qRadExchange, qBoiling, hCond, qCond };
}

function calcEvaporator(inputs) {
  const feedRate = num(inputs.feedRate, 10);
  const xF = num(inputs.xF, 0.1);
  const xL = num(inputs.xL, 0.4);
  const tF = num(inputs.tF, 320);
  const tSatSteam = num(inputs.tSatSteam, 393);
  const pEvap = num(inputs.pEvap, 20000);
  const uVal1 = num(inputs.uVal1, 2000);
  const hfgSteam = num(inputs.hfgSteam, 2200000);
  const cpFeed = num(inputs.cpFeed, 4000);

  const tSatEvap = 3816.44 / (23.196 - Math.log(Math.max(pEvap, 100))) + 46.13;
  const hfgEvap = 2.501e6 - 2386 * (tSatEvap - 273.15);

  const lRate = (feedRate * xF) / Math.max(xL, 1e-9);
  const vRate = feedRate - lRate;

  const qSensible = feedRate * cpFeed * (tSatEvap - tF);
  const qLatent = vRate * hfgEvap;
  const heatDuty = qSensible + qLatent;
  const steamRate = heatDuty / Math.max(hfgSteam, 1e-9);
  const economy = vRate / Math.max(steamRate, 1e-9);
  const evapArea = heatDuty / Math.max(uVal1 * (tSatSteam - tSatEvap), 1e-12);

  const vRate1 = vRate * 0.52;
  const vRate2 = vRate - vRate1;
  const economyDouble = (vRate1 + vRate2) / Math.max(vRate1, 1e-9) * 0.95;

  return { tSatEvap, lRate, vRate, heatDuty, steamRate, economy, evapArea, economyDouble };
}

function calcMcCabe(inputs) {
  const alpha = Math.max(num(inputs.alpha, 2.5), 1.001);
  const xD = clamp(num(inputs.xD, 0.95), 1e-5, 0.99999);
  const xB = clamp(num(inputs.xB, 0.05), 1e-5, 0.99999);
  const xF = clamp(num(inputs.xF, 0.5), 1e-5, 0.99999);
  const qVal = num(inputs.qVal, 1.0);
  const refluxRatio = num(inputs.refluxRatio, 2.0);

  let xInt = xF, yInt = (alpha * xF) / (1 + (alpha - 1) * xF);
  if (Math.abs(qVal - 1.0) > 1e-6) {
    const q = qVal;
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
  const R = Math.max(refluxRatio, rMin * 1.05);

  const slopeRect = R / (R + 1);
  const interRect = xD / (R + 1);

  const xIntersect = (Math.abs(qVal - 1.0) < 1e-6) ? xF : (interRect + xF / (qVal - 1)) / (qVal / (qVal - 1) - slopeRect);
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

  return { rMin, nStages, feedStage, stages, xIntersect, yIntersect };
}

function calcRachford(inputs) {
  const z = [num(inputs.z1, 0.4), num(inputs.z2, 0.3), num(inputs.z3, 0.2), num(inputs.z4, 0.1)];
  const k = [num(inputs.k1, 2.5), num(inputs.k2, 1.2), num(inputs.k3, 0.5), num(inputs.k4, 0.1)];
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

  return { psi, x, y };
}

function calcDiffusion(inputs) {
  const t = num(inputs.t, 298.15);
  const p = num(inputs.p, 101325);
  const ma = num(inputs.ma, 18);
  const mb = num(inputs.mb, 29);
  const sumVa = num(inputs.sumVa, 12.7);
  const sumVb = num(inputs.sumVb, 20.1);
  const z = num(inputs.z, 0.01);
  const pa1 = num(inputs.pa1, 5000);
  const pa2 = num(inputs.pa2, 1000);
  const delta = num(inputs.delta, 0.001);
  const kg = num(inputs.kg, 1e-4);
  const kl = num(inputs.kl, 1e-4);
  const m = num(inputs.m, 1.2);

  const R = 8.314;
  const pAtm = p / 101325;
  
  // Fuller-Schettler-Giddings (FSG) diffusivity calculation
  const dab = (1.013e-7 * Math.pow(t, 1.75) * Math.sqrt(1 / ma + 1 / mb)) /
    (pAtm * Math.pow(Math.pow(sumVa, 1/3) + Math.pow(sumVb, 1/3), 2));

  // Fick's Law: Equimolar Counterdiffusion (EMD)
  const naEmd = (dab / (R * t * z)) * (pa1 - pa2);

  // Fick's Law: Unimolar Diffusion through stagnant gas (UMD)
  const pb1 = p - pa1;
  const pb2 = p - pa2;
  let pbLM = pb1;
  if (Math.abs(pb1 - pb2) > 1e-5) {
    pbLM = (pb2 - pb1) / Math.log(pb2 / pb1);
  }
  const naUmd = (dab * p / (R * t * z * pbLM)) * (pa1 - pa2);

  // Mass transfer film coefficient kc (film theory)
  const kc = dab / Math.max(delta, 1e-9);

  // Overall Mass Transfer Coefficients
  const KG = 1 / (1 / Math.max(kg, 1e-12) + m / Math.max(kl, 1e-12));
  const KL = 1 / (1 / Math.max(kl, 1e-12) + 1 / Math.max(m * kg, 1e-12));

  return { dab, naEmd, naUmd, kc, KG, KL };
}

function calcAbsorption(inputs) {
  const gRate = num(inputs.gRate, 10);
  const y1 = num(inputs.y1, 0.05);
  const y2 = num(inputs.y2, 0.005);
  const x2 = num(inputs.x2, 0.0);
  const m = num(inputs.m, 1.2);
  const fSolvent = num(inputs.fSolvent, 1.4);
  const efficiency = num(inputs.efficiency, 0.7);
  const htu = num(inputs.htu, 0.6);

  const x1Star = y1 / Math.max(m, 1e-9);
  const minLOverV = (y1 - y2) / Math.max(x1Star - x2, 1e-9);
  const lMin = gRate * minLOverV;
  const lOper = lMin * fSolvent;
  const absorptionFactor = lOper / Math.max(m * gRate, 1e-9);

  // Liquid composition at bottom (outlet) from material balance: V(y1 - y2) = L(x1 - x2)
  const x1 = x2 + (gRate / Math.max(lOper, 1e-9)) * (y1 - y2);

  // Number of ideal stages (Kremser equation)
  let nIdeal = 0;
  const A = absorptionFactor;
  if (Math.abs(A - 1.0) < 1e-6) {
    nIdeal = (y1 - y2) / Math.max(y2 - m * x2, 1e-9);
  } else {
    const term = ((y1 - m * x2) / Math.max(y2 - m * x2, 1e-12)) * (1 - 1 / A) + 1 / A;
    nIdeal = Math.log(Math.max(term, 1e-12)) / Math.log(A);
  }
  const nActual = nIdeal / Math.max(efficiency, 1e-9);

  // NTU calculations (Log-Mean Driving Force)
  const dy1 = y1 - m * x1;
  const dy2 = y2 - m * x2;
  let dyLM = dy1;
  if (Math.abs(dy1 - dy2) > 1e-6 && dy1 > 0 && dy2 > 0) {
    dyLM = (dy1 - dy2) / Math.log(dy1 / dy2);
  }
  const ntu = (y1 - y2) / Math.max(dyLM, 1e-12);
  const height = htu * ntu;

  // Operating Line Points
  const operatingLine = [
    { x: x2, y: y2 },
    { x: x1, y: y1 }
  ];
  // Equilibrium Line Points
  const equilibriumLine = [
    { x: 0, y: 0 },
    { x: x1, y: m * x1 }
  ];

  return { lMin, lOper, absorptionFactor, x1, nIdeal, nActual, ntu, height, operatingLine, equilibriumLine };
}

function calcDrying(inputs) {
  const drySolidMass = num(inputs.drySolidMass, 50);
  const area = num(inputs.area, 2.0);
  const xInitial = num(inputs.xInitial, 0.25);
  const xCritical = num(inputs.xCritical, 0.12);
  const xEquilibrium = num(inputs.xEquilibrium, 0.02);
  const xFinal = num(inputs.xFinal, 0.04);
  const rc = num(inputs.rc, 1.5);

  // Constant rate period drying time
  let tConstant = 0;
  if (xInitial > xCritical) {
    tConstant = (drySolidMass / (area * rc)) * (xInitial - xCritical);
  }

  // Falling rate period drying time (linear assumption)
  const xStart = Math.min(xInitial, xCritical);
  const xFinalClamped = Math.max(xFinal, xEquilibrium + 1e-4);
  
  let tFalling = 0;
  if (xStart > xFinalClamped) {
    tFalling = (drySolidMass * (xCritical - xEquilibrium) / (area * rc)) *
      Math.log((xStart - xEquilibrium) / (xFinalClamped - xEquilibrium));
  }

  const tTotal = tConstant + tFalling;

  // Generate Drying Rate Curve Points (R vs X)
  const dryingCurve = [];
  const steps = 40;
  const xRange = xInitial - xEquilibrium;
  for (let i = 0; i <= steps; i++) {
    const xVal = xEquilibrium + (i / steps) * xRange;
    let rate = 0;
    if (xVal >= xCritical) {
      rate = rc;
    } else {
      rate = rc * (xVal - xEquilibrium) / Math.max(xCritical - xEquilibrium, 1e-9);
    }
    dryingCurve.push({ x: xVal, rate });
  }

  return { tConstant, tFalling, tTotal, dryingCurve };
}

function calcEconomics(inputs) {
  const deliveredCost = Math.max(0, num(inputs.deliveredEquipmentCost, 100000));
  const lang = Math.max(1, num(inputs.langFactor, 4.0));
  const wcPct = Math.max(0, num(inputs.workingCapitalPercent, 15));

  // Capital Cost Estimation
  const fci = deliveredCost * lang;
  const wci = fci * (wcPct / 100);
  const tci = fci + wci;

  // Cost Index and Scaling
  const pastIdx = Math.max(1, num(inputs.costIndexPast, 300));
  const presIdx = Math.max(1, num(inputs.costIndexPresent, 600));
  const costBaseIndex = deliveredCost * (presIdx / pastIdx);

  const scaleExp = num(inputs.scalingExponent, 0.6);
  const refCap = Math.max(1e-6, num(inputs.referenceCapacity, 100));
  const desCap = Math.max(0, num(inputs.desiredCapacity, 250));
  const costScaled = deliveredCost * Math.pow(desCap / refCap, scaleExp);
  const costScaledPresent = costScaled * (presIdx / pastIdx);

  // Interest and TVM
  const P = Math.max(0, num(inputs.principal, 100000));
  const r = Math.max(0, num(inputs.nominalRate, 0.08));
  const m = Math.max(1, num(inputs.interestPeriods, 12));
  const n = Math.max(1, num(inputs.years, 10));

  const simpleInterest = P * r * n;
  const simpleFV = P + simpleInterest;

  const compoundFV = P * Math.pow(1 + r / m, m * n);
  const compoundInterest = compoundFV - P;

  const effectiveRate = Math.pow(1 + r / m, m) - 1;

  const presentWorthOfFV = P / Math.pow(1 + r, n);
  const futureWorthOfPV = P * Math.pow(1 + r, n);

  const A_pmt = Math.max(0, num(inputs.annuityPayment, 15000));
  let fvAnnuity = 0;
  let pvAnnuity = 0;
  if (r > 0) {
    fvAnnuity = A_pmt * (Math.pow(1 + r, n) - 1) / r;
    pvAnnuity = A_pmt * (1 - Math.pow(1 + r, -n)) / r;
  } else {
    fvAnnuity = A_pmt * n;
    pvAnnuity = A_pmt * n;
  }

  const Vs = Math.max(0, num(inputs.salvageValue, 10000));
  const iCap = Math.max(1e-4, num(inputs.capitalizedCostInterest, 0.06));
  const capitalizedCost = P + (P - Vs) / (Math.pow(1 + iCap, n) - 1);

  const propertyTax = fci * Math.max(0, num(inputs.taxRate, 0.02));

  // Depreciation
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

  // Profitability
  const rev = Math.max(0, num(inputs.annualRevenue, 120000));
  const opCost = Math.max(0, num(inputs.annualOperatingCost, 60000));
  const taxRateInc = Math.max(0, num(inputs.incomeTaxRate, 0.30));

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
  const fixedC = Math.max(0, num(inputs.fixedCost, 30000));
  const price = Math.max(0, num(inputs.sellingPricePerUnit, 15));
  const varC = Math.max(0, num(inputs.variableCostPerUnit, 6));

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

  return {
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
}

function calcPfr(inputs) {
  const flowRate = num(inputs.flowRate, 0.05);
  const ca0 = num(inputs.ca0, 2.0);
  const targetConversion = num(inputs.targetConversion, 0.8);
  const rateConstant = num(inputs.rateConstant, 0.1);
  const reactionOrder = num(inputs.reactionOrder, 1);

  const fa0 = flowRate * ca0;
  const X = clamp(targetConversion, 1e-6, 0.9999);

  const N = 40;
  const h = X / N;

  const getRate = (conv) => {
    const ca = ca0 * (1 - conv);
    if (reactionOrder === 2) {
      return rateConstant * ca * ca;
    }
    return rateConstant * ca;
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
  const residenceTime = volume / Math.max(flowRate, 1e-12);

  return { volume, residenceTime };
}

function calcNonIsothermal(inputs) {
  const flowRate = num(inputs.flowRate, 1.5);
  const ca0 = num(inputs.ca0, 1500);
  const targetConversion = clamp(num(inputs.targetConversion, 0.65), 1e-6, 0.995);
  const t0 = num(inputs.t0, 350);
  const k0 = Math.max(num(inputs.k0, 8e6), 1e-12);
  const ea = Math.max(num(inputs.ea, 70000), 1e-9);
  const deltaH = num(inputs.deltaH, -60000);
  const rhoCp = Math.max(num(inputs.rhoCp, 3.5e6), 1e-9);

  const R = 8.314;
  const outletTemperature = t0 + ((-deltaH) * ca0 * targetConversion) / rhoCp;
  const rateConstant = k0 * Math.exp(-ea / (R * Math.max(outletTemperature, 1)));
  const residenceTime = targetConversion / (Math.max(rateConstant, 1e-12) * (1 - targetConversion));
  const volume = flowRate * residenceTime;
  const heatRelease = (-deltaH) * flowRate * ca0 * targetConversion;

  return { outletTemperature, rateConstant, residenceTime, volume, heatRelease };
}

function calcCatalytic(inputs) {
  const flowRate = Math.max(num(inputs.flowRate, 1.2), 1e-12);
  const ca0 = Math.max(num(inputs.ca0, 1200), 1e-12);
  const targetConversion = clamp(num(inputs.targetConversion, 0.75), 1e-6, 0.995);
  const kPrime = Math.max(num(inputs.kPrime, 0.35), 1e-12);
  const bedBulkDensity = Math.max(num(inputs.bedBulkDensity, 650), 1e-12);

  const fa0 = flowRate * ca0;
  const requiredCatalystWeight = (fa0 / (kPrime * ca0)) * Math.log(1 / (1 - targetConversion));
  const reactorVolume = requiredCatalystWeight / bedBulkDensity;
  const spaceTime = reactorVolume / flowRate;
  const observedRate = kPrime * ca0 * (1 - targetConversion);

  return { requiredCatalystWeight, reactorVolume, spaceTime, observedRate };
}

function calcEffectiveness(inputs) {
  const pelletRadius = Math.max(num(inputs.pelletRadius, 0.0015), 1e-12);
  const intrinsicRateConstant = Math.max(num(inputs.intrinsicRateConstant, 0.8), 1e-12);
  const effectiveDiffusivity = Math.max(num(inputs.effectiveDiffusivity, 2e-7), 1e-16);

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

  return { thieleModulus, effectivenessFactor, observedRateConstant, diffusionResistanceRatio };
}

function calcDiffusionReaction(inputs) {
  const halfThickness = Math.max(num(inputs.halfThickness, 0.001), 1e-12);
  const effectiveDiffusivity = Math.max(num(inputs.effectiveDiffusivity, 2e-7), 1e-16);
  const rateConstant = Math.max(num(inputs.rateConstant, 0.6), 1e-12);
  const surfaceConcentration = Math.max(num(inputs.surfaceConcentration, 1.5), 0);

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

  return { thieleModulus, effectivenessFactor, surfaceFlux, avgConcentration, profile };
}

function calcPackedBedReactor(inputs) {
  const bedLength = Math.max(num(inputs.bedLength, 3.0), 1e-12);
  const bedDiameter = Math.max(num(inputs.bedDiameter, 0.9), 1e-12);
  const particleDiameter = Math.max(num(inputs.particleDiameter, 0.004), 1e-12);
  const voidFraction = clamp(num(inputs.voidFraction, 0.42), 1e-6, 0.95);
  const superficialVelocity = Math.max(num(inputs.superficialVelocity, 0.35), 0);
  const fluidDensity = Math.max(num(inputs.fluidDensity, 850), 1e-12);
  const fluidViscosity = Math.max(num(inputs.fluidViscosity, 0.002), 1e-12);
  const particleDensity = Math.max(num(inputs.particleDensity, 1600), 1e-12);
  const flowRate = Math.max(num(inputs.flowRate, 1.2), 1e-12);
  const ca0 = Math.max(num(inputs.ca0, 1200), 1e-12);
  const targetConversion = clamp(num(inputs.targetConversion, 0.75), 1e-6, 0.995);
  const kPrime = Math.max(num(inputs.kPrime, 0.35), 1e-12);

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
  const requiredCatalystWeight = (fa0 / (kPrime * ca0)) * Math.log(1 / (1 - targetConversion));
  const conversionAtAvailable =
    1 - Math.exp(-(kPrime * ca0 / Math.max(fa0, 1e-12)) * availableCatalystWeight);
  const sizingRatio = availableCatalystWeight / Math.max(requiredCatalystWeight, 1e-12);

  return {
    pressureGradient,
    totalPressureDrop,
    bedVolume,
    requiredCatalystWeight,
    availableCatalystWeight,
    conversionAtAvailable: clamp(conversionAtAvailable, 0, 0.999999),
    sizingRatio
  };
}

function calcFluidizedBed(inputs) {
  const particleDiameter = Math.max(num(inputs.particleDiameter, 0.00045), 1e-12);
  const sphericity = clamp(num(inputs.sphericity, 0.9), 0.1, 1.0);
  const epsilonMf = clamp(num(inputs.epsilonMf, 0.45), 0.2, 0.8);
  const fluidDensity = Math.max(num(inputs.fluidDensity, 1.2), 1e-12);
  const particleDensity = Math.max(num(inputs.particleDensity, 1400), fluidDensity + 1e-9);
  const fluidViscosity = Math.max(num(inputs.fluidViscosity, 1.9e-5), 1e-12);
  const superficialVelocity = Math.max(num(inputs.superficialVelocity, 0.22), 0);
  const initialBedHeight = Math.max(num(inputs.initialBedHeight, 1.4), 1e-12);

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
  const expandedBedHeight = initialBedHeight * ((1 - epsilonMf) / Math.max(1 - epsilonOperating, 1e-9));
  const pressureDropAtMf = (particleDensity - fluidDensity) * (1 - epsilonMf) * g * initialBedHeight;

  const state =
    superficialVelocity < 0.9 * umf
      ? "Below fluidization"
      : superficialVelocity > 3.0 * umf
      ? "Fast fluidization risk"
      : "Fluidized regime";

  return {
    umf,
    reMf,
    epsilonOperating,
    expandedBedHeight,
    pressureDropAtMf,
    state
  };
}

function calcRtd(inputs) {
  const meanResidenceTime = Math.max(num(inputs.meanResidenceTime, 80), 1e-12);
  const tanksInSeries = Math.max(1, Math.round(num(inputs.tanksInSeries, 3)));
  const horizonMultiplier = Math.max(num(inputs.horizonMultiplier, 5), 1.0);

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

  return { variance, sigma, pecletEquivalent, profile };
}

function calcReactorOptimization(inputs) {
  const flowRate = Math.max(num(inputs.flowRate, 1.2), 1e-12);
  const ca0 = Math.max(num(inputs.ca0, 1200), 1e-12);
  const rateConstant = Math.max(num(inputs.rateConstant, 0.6), 1e-12);
  const productValue = num(inputs.productValue, 0.12);
  const reactorCostRate = num(inputs.reactorCostRate, 15);
  const conversionMin = clamp(num(inputs.conversionMin, 0.2), 0.01, 0.98);
  const conversionMax = clamp(num(inputs.conversionMax, 0.95), conversionMin + 0.01, 0.99);

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
    const revenue = productValue * productionRate;
    const cost = reactorCostRate * volume;
    const profit = revenue - cost;

    sweep.push({ conversion, profit, volume });
    if (profit > maxProfit) {
      maxProfit = profit;
      optimumConversion = conversion;
      optimumVolume = volume;
      optimumResidenceTime = residenceTime;
    }
  }

  return { optimumConversion, optimumVolume, optimumResidenceTime, maxProfit, sweep };
}

function calcDistillationDesign(inputs) {
  const alphaVal = num(inputs.alpha, 2.5);
  const xDVal = num(inputs.xD, 0.95);
  const xBVal = num(inputs.xB, 0.05);
  const xFVal = num(inputs.xF, 0.5);
  const qValVal = num(inputs.qVal, 1.0);
  const refluxRatioVal = num(inputs.refluxRatio, 2.0);
  const murphreeEfficiencyVal = num(inputs.murphreeEfficiency, 0.70);
  const vaporFlowRateVal = num(inputs.vaporFlowRate, 5.0);
  const liquidFlowRateVal = num(inputs.liquidFlowRate, 4.0);
  const vaporDensityVal = num(inputs.vaporDensity, 1.5);
  const liquidDensityVal = num(inputs.liquidDensity, 800.0);
  const surfaceTensionVal = num(inputs.surfaceTension, 20.0);
  const traySpacingVal = num(inputs.traySpacing, 0.45);
  const activeFractionVal = num(inputs.activeFraction, 0.85);
  const derateFactorVal = num(inputs.derateFactor, 0.85);
  const weirHeightVal = num(inputs.weirHeight, 50.0);
  const holeAreaFractionVal = num(inputs.holeAreaFraction, 0.10);

  // 1. Column Sizing / Sieve Tray Diameter
  const Csb = (0.012 * traySpacingVal + 0.005) * Math.pow(Math.max(surfaceTensionVal, 1.0) / 20.0, 0.2);
  const uf = Csb * Math.sqrt((liquidDensityVal - vaporDensityVal) / Math.max(vaporDensityVal, 1e-6));
  const us = uf * derateFactorVal;
  
  const Ac = (vaporFlowRateVal / Math.max(vaporDensityVal, 1e-6)) / Math.max(activeFractionVal * us, 1e-6);
  const Dc = Math.sqrt(4 * Ac / Math.PI);

  const holeArea = Ac * activeFractionVal * holeAreaFractionVal;
  const uHole = (vaporFlowRateVal / Math.max(vaporDensityVal, 1e-6)) / Math.max(holeArea, 1e-9);
  
  const hd = 50.8 * Math.pow(uHole / 0.85, 2) * (vaporDensityVal / Math.max(liquidDensityVal, 1e-6));
  const hl = weirHeightVal + 10;
  const totalTrayPressureDrop = hd + hl;

  const minWeepVelocity = 4.5 * Math.pow(surfaceTensionVal / Math.max(vaporDensityVal, 1e-6), 0.25);

  // 2. McCabe-Thiele with Murphree Tray Efficiency
  const alpha = Math.max(alphaVal, 1.001);
  const xD = clamp(xDVal, 1e-5, 0.99999);
  const xB = clamp(xBVal, 1e-5, 0.99999);
  const xF = clamp(xFVal, 1e-5, 0.99999);
  const R = Math.max(refluxRatioVal, 0.1);
  const Emv = clamp(murphreeEfficiencyVal, 0.05, 1.0);

  const slopeRect = R / (R + 1);
  const interRect = xD / (R + 1);

  let xInt = xF, yInt = (alpha * xF) / (1 + (alpha - 1) * xF);
  if (Math.abs(qValVal - 1.0) > 1e-6) {
    const q = qValVal;
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
    const yStar = (alpha * xCurr) / (1 + (alpha - 1) * xCurr);
    yCurr = Math.max(xB, yCurr - Emv * (yCurr - yStar));
    stages.push({ x: xCurr, y: yCurr });

    if (xCurr > xInt) {
      xCurr = (yCurr - interRect) / Math.max(slopeRect, 1e-9);
    } else {
      xCurr = (yCurr - interStrip) / Math.max(slopeStrip, 1e-9);
    }
    xCurr = clamp(xCurr, xB * 0.1, xD);
    stages.push({ x: xCurr, y: yCurr });
  }

  // 3. Ponchon-Savarit Enthalpy Curves & Stage Stepping
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

  const hD = calcH(xD);
  const H1 = calcHV(xD);
  const QD = hD + (R + 1) * (H1 - hD);
  
  const hF = calcH(xF);
  const HF = calcHV(xF);
  const HF_feed = qValVal * hF + (1 - qValVal) * HF;
  
  const QB = QD - ((QD - HF_feed) / Math.max(xD - xF, 1e-9)) * (xD - xB);

  const psStages = [];
  let xpCurr = xD;
  let ypCurr = xD;
  let psCount = 0;

  psStages.push({ x: xpCurr, y: ypCurr, h: calcH(xpCurr), H: calcHV(ypCurr) });
  while (xpCurr > xB && psCount < 50) {
    psCount++;
    xpCurr = ypCurr / (alpha - ypCurr * (alpha - 1));
    xpCurr = clamp(xpCurr, xB * 0.1, xD);
    
    const hCurr = calcH(xpCurr);
    const HCurr = calcHV(ypCurr);
    psStages.push({ x: xpCurr, y: ypCurr, h: hCurr, H: HCurr });

    const QFocal = xpCurr > xInt ? QD : QB;
    const xFocal = xpCurr > xInt ? xD : xB;
    
    const slopeLine = (QFocal - hCurr) / Math.max(xFocal - xpCurr, 1e-9);
    
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

  return {
    Csb, uf, us, Ac, Dc, hd, totalTrayPressureDrop, uHole, minWeepVelocity,
    nStages, stages, xInt, yInt, QD, QB, psCount, psStages, enthalpyCurves
  };
}

function calcExtractionLeaching(inputs) {
  const feedRate = num(inputs.feedRate, 100.0);
  const xF = num(inputs.xF, 0.15);
  const solventRate = num(inputs.solventRate, 120.0);
  const yS = num(inputs.yS, 0.0);
  const K = Math.max(num(inputs.partitionCoefficient, 2.5), 0.1);
  const N_ext = Math.max(num(inputs.extractionStages, 3), 1);
  const targetRaffinate = num(inputs.targetRaffinate, 0.01);
  const feedInertSolid = num(inputs.feedInertSolid, 100.0);
  const feedSolute = num(inputs.feedSolute, 20.0);
  const leachingSolventRate = num(inputs.leachingSolventRate, 150.0);
  const solventRetention = num(inputs.solventRetention, 0.5);
  const leachingTargetRecovery = num(inputs.leachingTargetRecovery, 0.95);

  // 1. Cross-current Liquid-Liquid Extraction
  const solventPerStage = solventRate / N_ext;
  let xCurr = xF;
  const crossStages = [];
  crossStages.push({ stage: 0, x: xCurr, y: 0 });
  for (let i = 1; i <= N_ext; i++) {
    xCurr = xCurr / (1 + K * (solventPerStage / Math.max(feedRate, 1e-9)));
    crossStages.push({
      stage: i,
      x: clamp(xCurr, 0, 1),
      y: clamp(K * xCurr, 0, 1)
    });
  }
  const finalRaffinateCross = xCurr;
  const recoveryCross = (xF - finalRaffinateCross) / Math.max(xF, 1e-9) * 100;

  // 2. Counter-current Extraction Sizing (Ideal Stages)
  const E = K * (solventRate / Math.max(feedRate, 1e-9));
  let ccStagesReq = 0;
  if (Math.abs(E - 1.0) < 1e-5) {
    ccStagesReq = (xF - targetRaffinate) / Math.max(targetRaffinate - yS / K, 1e-9);
  } else {
    const term = ((xF - yS / K) / Math.max(targetRaffinate - yS / K, 1e-12)) * (1 - 1 / E) + 1 / E;
    ccStagesReq = Math.log(Math.max(term, 1e-12)) / Math.log(E);
  }

  // 3. Counter-current Solid-Liquid Leaching
  const L = feedInertSolid * solventRetention;
  const V = leachingSolventRate;
  
  const y0 = feedSolute / Math.max(feedSolute + L, 1e-9);
  const soluteInExit = (1 - leachingTargetRecovery) * feedSolute;
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

  return {
    crossStages, finalRaffinateCross, recoveryCross, ccStagesReq, leachingStagesReq, leachingStagesDetail
  };
}

function calcAdsorption(inputs) {
  const adsorptionModel = inputs.adsorptionModel || "langmuir";
  const langmuirQm = num(inputs.langmuirQm, 50.0);
  const langmuirKl = num(inputs.langmuirKl, 0.2);
  const freundlichKf = num(inputs.freundlichKf, 5.0);
  const freundlichN = num(inputs.freundlichN, 2.5);
  const adsorbateConc = num(inputs.adsorbateConc, 10.0);
  const bedLength = num(inputs.bedLength, 2.0);
  const bedDiameter = num(inputs.bedDiameter, 0.5);
  const bedVoidage = num(inputs.bedVoidage, 0.40);
  const adsorbentDensity = num(inputs.adsorbentDensity, 800.0);
  const feedFlowRate = num(inputs.feedFlowRate, 5.0);
  const feedConcentration = num(inputs.feedConcentration, 100.0);
  const thomasRateConstant = num(inputs.thomasRateConstant, 0.05);
  const breakthroughRatio = num(inputs.breakthroughRatio, 0.05);
  const saturationRatio = num(inputs.saturationRatio, 0.95);

  // 1. Isotherm Calculation
  let qCapacity = 0;
  const C = adsorbateConc;
  if (adsorptionModel === "langmuir") {
    qCapacity = (langmuirQm * langmuirKl * C) / (1 + langmuirKl * C);
  } else {
    qCapacity = freundlichKf * Math.pow(Math.max(C, 0), 1 / Math.max(freundlichN, 0.1));
  }

  // 2. Fixed-Bed Breakthrough Curve (Thomas Model)
  const Ac = (Math.PI * Math.pow(bedDiameter, 2)) / 4;
  const mBed = Ac * bedLength * adsorbentDensity;
  
  const C0 = feedConcentration;
  let q0 = 0;
  if (adsorptionModel === "langmuir") {
    q0 = (langmuirQm * langmuirKl * C0) / (1 + langmuirKl * C0);
  } else {
    q0 = freundlichKf * Math.pow(Math.max(C0, 0), 1 / Math.max(freundlichN, 0.1));
  }

  const Q = feedFlowRate * 1000;
  const kTh = thomasRateConstant;
  const t05 = (q0 * mBed * 1000) / Math.max(Q * C0, 1e-9);
  const k = kTh * C0;

  const tBreakthrough = Math.max(0, t05 - Math.log(1 / breakthroughRatio - 1) / Math.max(k, 1e-6));
  const tSaturation = Math.max(0, t05 - Math.log(1 / saturationRatio - 1) / Math.max(k, 1e-6));
  const LUB = bedLength * (1 - tBreakthrough / Math.max(t05, 1e-9));

  const breakthroughCurve = [];
  const steps = 40;
  const maxT = Math.max(1, tSaturation * 1.5);
  for (let idx = 0; idx <= steps; idx++) {
    const timeVal = (idx / steps) * maxT;
    const cRatio = 1 / (1 + Math.exp(-k * (timeVal - t05)));
    breakthroughCurve.push({ t: timeVal, ratio: clamp(cRatio, 0, 1) });
  }

  return {
    qCapacity, mBed, q0, t05, tBreakthrough, tSaturation, LUB, breakthroughCurve
  };
}

function calcHumidification(inputs) {
  const Td = num(inputs.dryBulbTemp, 30.0);
  const RH = clamp(num(inputs.relativeHumidity, 60.0), 0, 100);
  const P = num(inputs.totalPressure, 101325);
  const waterInletTemp = num(inputs.waterInletTemp, 40.0);
  const waterOutletTemp = num(inputs.waterOutletTemp, 28.0);
  const TwIn = num(inputs.airInletWetBulb, 24.0);
  const liquidGasRatio = num(inputs.liquidGasRatio, 1.2);
  const overallHTU = num(inputs.overallHTU, 1.5);

  // 1. Psychrometric Properties
  const pSat = 1000 * Math.exp(16.3872 - 3885.70 / (Td + 230.17));
  const pV = (RH / 100) * pSat;
  
  const Y = 0.622 * pV / Math.max(P - pV, 1e-9);
  const YSat = 0.622 * pSat / Math.max(P - pSat, 1e-9);
  const pctHumidity = (Y / Math.max(YSat, 1e-9)) * 100;
  
  const Tdp = pV > 0 ? (3885.70 / (16.3872 - Math.log(pV / 1000.0)) - 230.17) : 0;
  
  const cs = 1.005 + 1.88 * Y;
  const vH = (1 / 28.97 + Y / 18.02) * 8314 * (Td + 273.15) / P;
  const Ha = cs * Td + Y * 2501.3;

  // 2. Cooling Tower Design / Simpson Integration
  const pSatTw = 1000 * Math.exp(16.3872 - 3885.70 / (TwIn + 230.17));
  const YTw = 0.622 * pSatTw / Math.max(P - pSatTw, 1e-9);
  const csTw = 1.005 + 1.88 * YTw;
  const Hin = csTw * TwIn + YTw * 2501.3;

  const cpL = 4.184;
  const N = 40;
  const hStep = (waterInletTemp - waterOutletTemp) / N;

  const coolingPath = [];
  
  const getIntegrand = (tempWater) => {
    const pSatNode = 1000 * Math.exp(16.3872 - 3885.70 / (tempWater + 230.17));
    const ySatNode = 0.622 * pSatNode / Math.max(P - pSatNode, 1e-9);
    const csNode = 1.005 + 1.88 * ySatNode;
    const HStar = csNode * tempWater + ySatNode * 2501.3;

    const Hy = Hin + (liquidGasRatio * cpL) * (tempWater - waterOutletTemp);
    
    const drivingForce = Math.max(HStar - Hy, 0.5);
    return { HStar, Hy, integrand: cpL / drivingForce };
  };

  let integral = 0;
  for (let j = 0; j <= N; j++) {
    const tempWater = waterOutletTemp + j * hStep;
    const { HStar, Hy, integrand } = getIntegrand(tempWater);
    
    let coeff = 2;
    if (j === 0 || j === N) coeff = 1;
    else if (j % 2 === 1) coeff = 4;
    
    integral += coeff * integrand;
    coolingPath.push({ temp: tempWater, HStar, Hy });
  }

  const ntu = (hStep / 3) * integral;
  const coolingTowerHeight = overallHTU * ntu;

  return {
    pSat, pV, Y, YSat, pctHumidity, Tdp, cs, vH, Ha, Hin, ntu, coolingTowerHeight, coolingPath
  };
}

function calcMomentumTransport(inputs) {
  const flowSystem = inputs.flowSystem || "pipe";
  const dimension = num(inputs.dimension, 0.05);
  const length = num(inputs.length, 10.0);
  const pressureDrop = num(inputs.pressureDrop, 100.0);
  const viscosity = Math.max(num(inputs.viscosity, 0.001), 1e-6);
  const density = Math.max(num(inputs.density, 1000.0), 1e-3);
  const plateDistance = num(inputs.plateDistance, 1.0);
  const freeStreamVelocity = num(inputs.freeStreamVelocity, 2.0);

  const R_W = dimension;
  const L = length;
  const dP = pressureDrop;
  const mu = viscosity;
  const rho = density;

  let vMax = 0;
  let vAvg = 0;
  let Re = 0;
  let flowRate = 0;
  const velocityProfile = [];

  const steps = 40;
  if (flowSystem === "pipe") {
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

  const x = plateDistance;
  const Uinf = freeStreamVelocity;
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
  let ddfVal = 0.33206;
  let eta = 0;
  const h = 0.15;
  const numSteps = 50;
  let y = [0, 0, ddfVal];

  const derivs = (etaVal, yVal) => [yVal[1], yVal[2], -0.5 * yVal[0] * yVal[2]];

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

  return {
    vMax, vAvg, Re, flowRate, velocityProfile,
    Rex, delta, deltaStar, theta, Cfx, flowRegime, blasiusProfile
  };
}

function calcHeatMassTransport(inputs) {
  const wireRadius = num(inputs.wireRadius, 0.002);
  const thermalConductivity = Math.max(num(inputs.thermalConductivity, 15.0), 1e-3);
  const heatGeneration = num(inputs.heatGeneration, 2.0e7);
  const surfaceTemp = num(inputs.surfaceTemp, 323.15);
  const filmThickness = num(inputs.filmThickness, 0.001);
  const diffusionCoeff = Math.max(num(inputs.diffusionCoeff, 1e-9), 1e-12);
  const reactionConstant = Math.max(num(inputs.reactionConstant, 0.05), 0);
  const feedConcentration = num(inputs.feedConcentration, 100.0);
  const pdeType = inputs.pdeType || "heat";
  const domainLength = num(inputs.domainLength, 0.1);
  const diffusivity = Math.max(num(inputs.diffusivity, 1e-5), 1e-12);
  const initialValue = num(inputs.initialValue, 298.15);
  const leftBC = num(inputs.leftBC, 373.15);
  const rightBC = num(inputs.rightBC, 298.15);
  const pdeTime = num(inputs.pdeTime, 100.0);

  const R = wireRadius;
  const kHeat = thermalConductivity;
  const Sg = heatGeneration;
  const Tw = surfaceTemp;

  const tMax = Tw + (Sg * R * R) / (4 * kHeat);
  const heatProfile = [];
  const nNodes = 20;
  for (let i = 0; i <= nNodes; i++) {
    const r = (i / nNodes) * R;
    const T = Tw + ((Sg * R * R) / (4 * kHeat)) * (1 - Math.pow(r / R, 2));
    heatProfile.push({ radius: r, temp: T });
  }

  const Lf = filmThickness;
  const Dab = diffusionCoeff;
  const krx = reactionConstant;
  const Ca0 = feedConcentration;

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

  const L_pde = domainLength;
  const diff_pde = diffusivity;
  const initVal = initialValue;
  const L_bc = leftBC;
  const R_bc = rightBC;
  const t_pde = pdeTime;

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

  return {
    tMax, heatProfile, phi, massProfile,
    Fo, dx, dt, nSteps, pdeHistory
  };
}

function calcCoupledTransportSolvers(inputs) {
  const Rp = num(inputs.pelletRadius, 0.005);
  const Deff = Math.max(num(inputs.effDiffusivity, 1e-6), 1e-12);
  const keff = Math.max(num(inputs.effConductivity, 0.2), 1e-3);
  const deltaH = num(inputs.reactionEnthalpy, 8e4);
  const k0 = num(inputs.arrheniusPreExp, 1.2e8);
  const Ea = num(inputs.activationEnergy, 6e4);
  const CAs = num(inputs.surfaceConcentration, 20.0);
  const Ts = num(inputs.surfaceTemp, 350.0);
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

  const Tinf = num(inputs.airTemp, 323.15);
  const Yinf = num(inputs.airHumidity, 0.015);
  const P = num(inputs.totalPressure, 101325);
  const cs = 1.005 + 1.88 * Yinf;

  let TwbLow = 273.15;
  let TwbHigh = Tinf;
  let Twb = (TwbLow + TwbHigh) / 2;

  const calcYs = (T) => {
    const pSatNode = 1000 * Math.exp(16.3872 - 3885.70 / (T - 273.15 + 230.17));
    return 0.622 * pSatNode / Math.max(P - pSatNode, 1e-9);
  };
  const calcLatent = (T) => 2501.3 - 2.36 * (T - 273.15);

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

  const k1 = num(inputs.k1, 0.5);
  const k2 = num(inputs.k2, 0.2);
  const initA = num(inputs.initA, 1.0);
  const t_ode = num(inputs.odeTime, 10.0);

  const odeSteps = 50;
  const hOde = t_ode / odeSteps;
  const odeProfile = [];
  let yOde = [initA, 0, 0];
  let tTime = 0;
  const odeDerivs = (tVal, yVal) => [
    -k1 * yVal[0],
    k1 * yVal[0] - k2 * yVal[1],
    k2 * yVal[1]
  ];

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

  return {
    ThieleModulus, PraterNumber, ArrheniusNumber, effectivenessFactor, pelletProfile,
    Twb, Ywb, odeProfile
  };
}

// ── Framer Motion presets ──
const springIn = { type: "spring", stiffness: 300, damping: 30 };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } };
const staggerContainer = { animate: { transition: { staggerChildren: 0.06 } } };
const staggerItem = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

// ── Mesh Gradient Background ──
function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="mesh-blob-1 absolute -left-[15%] -top-[20%] h-[600px] w-[600px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
      <div className="mesh-blob-2 absolute -right-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-teal-500/[0.06] blur-[100px]" />
      <div className="mesh-blob-3 absolute bottom-[-15%] left-[30%] h-[550px] w-[550px] rounded-full bg-cyan-500/[0.05] blur-[110px]" />
    </div>
  );
}

// ── Glassmorphism Components ──

function LineAreaChart({ points, xKey, yKey, color = "#34d399", title = "Simulation Profile", xLabel = "X", yLabel = "Y", yUnit = "" }) {
  if (!Array.isArray(points) || points.length === 0) return null;
  const width = 900; const height = 320; const padLeft = 70; const padRight = 28; const padTop = 26; const padBottom = 54;
  const xs = points.map((p) => num(p[xKey])); const ys = points.map((p) => num(p[yKey]));
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minYRaw = Math.min(...ys); const maxY = Math.max(...ys); const minY = minYRaw >= 0 ? 0 : minYRaw;
  const plotW = width - padLeft - padRight; const plotH = height - padTop - padBottom;
  const normX = (x) => padLeft + ((x - minX) / Math.max(maxX - minX, 1e-9)) * plotW;
  const normY = (y) => height - padBottom - ((y - minY) / Math.max(maxY - minY, 1e-9)) * plotH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${normX(num(p[xKey]))} ${normY(num(p[yKey]))}`).join(" ");
  const area = `${path} L ${normX(maxX)} ${height - padBottom} L ${normX(minX)} ${height - padBottom} Z`;
  const yTicks = Array.from({ length: 6 }, (_, i) => minY + ((maxY - minY) * i) / 5);
  const xTicks = Array.from({ length: 6 }, (_, i) => minX + ((maxX - minX) * i) / 5);
  const peak = points.reduce((acc, p) => (num(p[yKey]) > num(acc[yKey]) ? p : acc), points[0]);

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium tracking-tight text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-500">Peak: {formatNum(num(peak[yKey]))} {yUnit}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tick, i) => (
          <g key={`y-${i}`}>
            <line x1={padLeft} y1={normY(tick)} x2={width - padRight} y2={normY(tick)} stroke="rgba(255,255,255,0.04)" />
            <text x={padLeft - 10} y={normY(tick) + 4} textAnchor="end" fontSize="10" fill="#71717a">{formatNum(tick)}</text>
          </g>
        ))}
        {xTicks.map((tick, i) => (
          <g key={`x-${i}`}>
            <text x={normX(tick)} y={height - padBottom + 18} textAnchor="middle" fontSize="10" fill="#71717a">{formatNum(tick)}</text>
          </g>
        ))}
        <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="rgba(255,255,255,0.08)" />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="rgba(255,255,255,0.08)" />
        <path d={area} fill="url(#areaGrad)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={normX(num(p[xKey]))} cy={normY(num(p[yKey]))} r="1.5" fill={color} opacity="0.6">
            <title>{xLabel}: {formatNum(num(p[xKey]))} | {yLabel}: {formatNum(num(p[yKey]))} {yUnit}</title>
          </circle>
        ))}
        <circle cx={normX(num(peak[xKey]))} cy={normY(num(peak[yKey]))} r="4" fill="white" stroke={color} strokeWidth="2">
          <title>Peak at {xLabel}={formatNum(num(peak[xKey]))}, {yLabel}={formatNum(num(peak[yKey]))} {yUnit}</title>
        </circle>
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#a1a1aa">{xLabel}</text>
        <text x={16} y={height / 2} transform={`rotate(-90, 16, ${height / 2})`} textAnchor="middle" fontSize="11" fill="#a1a1aa">{yLabel} {yUnit ? `(${yUnit})` : ""}</text>
      </svg>
    </div>
  );
}

function StatCard({ title, value, unit }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgb(0 0 0 / 0.2)" }}
      transition={{ duration: 0.2 }}
      className="glass-panel rounded-2xl p-5"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {formatNum(value)} <span className="text-sm font-normal text-zinc-500">{unit || ""}</span>
      </p>
    </motion.div>
  );
}

function Field({ label, value, onChange, type = "number", options }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input rounded-xl px-3 py-2.5 text-sm text-white outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-zinc-900 text-white">{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input rounded-xl px-3 py-2.5 text-sm text-white outline-none"
        />
      )}
    </label>
  );
}

function EngineeringPanel({ warnings = [], assumptions = [] }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Engineering Checks</p>
      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-400/90">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
              {w}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">Inputs are within typical design envelope.</p>
      )}
      {assumptions.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Assumptions</p>
          {assumptions.map((a, i) => (
            <p key={i} className="mt-1 text-xs text-zinc-500">{a}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function TheoryPanel({ moduleId }) {
  const data = moduleTheory[moduleId];
  if (!data) return null;
  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Theory & Constants</p>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{data.intro}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {data.constants.map((item) => (
          <div key={item.name} className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
            <p className="text-xs font-semibold text-zinc-300">{item.name}</p>
            <p className="mt-1 text-xs text-zinc-500">{item.meaning}</p>
            <p className="mt-1 text-[10px] font-mono text-teal-400/70">Typical: {item.typical}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferencePanel({ moduleId }) {
  const data = moduleReferences[moduleId];
  if (!data) return null;
  return (
    <motion.div {...fadeUp} className="glass-panel rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Derivation & Practical Impact</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Origin", text: data.derivation },
          { label: "Daily Use", text: data.dailyUse },
          { label: "Industrial", text: data.industrialUse }
        ].map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -2 }}
            className="rounded-xl bg-white/[0.02] p-4 border border-white/[0.04] transition-colors hover:bg-white/[0.04]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{item.label}</p>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ModuleDiagram({ moduleId }) {
  const diagrams = {
    plume: { title: "How It Works: Gaussian Plume", subtitle: "Predicts pollutant concentration downwind from a stack.", steps: [
      { title: "Define source & weather", simple: "Stack height, emission rate, wind speed, and stability class.", formula: "Inputs: H, Q, u, stability" },
      { title: "Estimate plume spread", simple: "Model converts stability into horizontal and vertical spread (σ_y, σ_z).", formula: "σ_y, σ_z = f(distance, stability)" },
      { title: "Compute concentration", simple: "For each distance, concentration is calculated and plotted.", formula: "C = [Q/(π·u·σ_y·σ_z)] · exp[-H²/(2σ_z²)]" }
    ]},
    heatexchanger: { title: "How It Works: LMTD Heat Exchanger", subtitle: "Estimates exchanger thermal performance.", steps: [
      { title: "Capture temperatures", simple: "Hot and cold stream inlet/outlet temperatures.", formula: "T_h,in, T_h,out, T_c,in, T_c,out" },
      { title: "Get effective ΔT", simple: "LMTD compresses varying ΔT into one representative value.", formula: "LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂)" },
      { title: "Estimate duty", simple: "Heat transfer and effectiveness from U and area.", formula: "Q = U·A·LMTD" }
    ]},
    pipeflow: { title: "How It Works: Pipe Hydraulics", subtitle: "Flow regime, pressure losses, and pumping load.", steps: [
      { title: "Flow regime", simple: "Reynolds number: laminar or turbulent.", formula: "Re = ρ·v·D/μ" },
      { title: "Friction factor", simple: "Laminar formula or Swamee-Jain for turbulent.", formula: "f = 64/Re or Swamee-Jain" },
      { title: "Pressure & power", simple: "Pressure drop and pump power requirement.", formula: "ΔP = f·(L/D)·(ρv²/2)" }
    ]},
    cstr: { title: "How It Works: CSTR Sizing", subtitle: "Perfectly mixed reactor for first-order conversion.", steps: [
      { title: "Set targets", simple: "Feed flow, conversion, kinetic constant.", formula: "v₀, X, k" },
      { title: "Compute volume", simple: "Volume rises sharply near X → 1.", formula: "V = v₀·X / [k·(1-X)]" },
      { title: "Residence time", simple: "Average time fluid stays in reactor.", formula: "τ = V / v₀" }
    ]},
    flash: { title: "How It Works: Flash VLE", subtitle: "Vapor-liquid split for a binary flash stage.", steps: [
      { title: "Feed assumptions", simple: "Composition, relative volatility, vapor fraction.", formula: "z, α, V/F" },
      { title: "Liquid composition", simple: "Mass balance for liquid leaving flash drum.", formula: "x = z / [1 + (V/F)(α-1)]" },
      { title: "Vapor composition", simple: "Equilibrium relation for vapor.", formula: "y = α·x / [1 + (α-1)·x]" }
    ]},
    ergun: { title: "How It Works: Ergun Packed Bed", subtitle: "Viscous and inertial losses through packed particles.", steps: [
      { title: "Describe bed", simple: "Bed length, particle size, porosity, velocity, fluid props.", formula: "L, Dp, ε, v, ρ, μ" },
      { title: "Pressure gradient", simple: "Adds viscous + inertial terms.", formula: "dP/dL = viscous + inertial" },
      { title: "Total drop", simple: "Multiply gradient by bed length.", formula: "ΔP = (dP/dL)·L" }
    ]},
    fenske: { title: "How It Works: Fenske Equation", subtitle: "Minimum theoretical stages at total reflux.", steps: [
      { title: "Separation spec", simple: "Relative volatility and composition targets.", formula: "α, x_D, x_B" },
      { title: "Separation ratio", simple: "Enrichment in distillate vs depletion in bottoms.", formula: "(x_D/(1-x_D)) / (x_B/(1-x_B))" },
      { title: "Minimum stages", simple: "Higher α usually means fewer stages.", formula: "N_min = log(ratio) / log(α)" }
    ]},
    pid: { title: "How It Works: Ziegler-Nichols", subtitle: "Quick PI/PID tuning from FOPDT model.", steps: [
      { title: "Process dynamics", simple: "Gain, time constant, dead time from step test.", formula: "Kp, τ_p, θ" },
      { title: "PI tuning", simple: "Proportional gain and integral time.", formula: "Kc = 0.9τ_p/(Kp·θ), τ_I = 3.3θ" },
      { title: "PID tuning", simple: "Adds derivative for faster rejection.", formula: "Kc = 1.2τ_p/(Kp·θ), τ_D = 0.5θ" }
    ]},
    hydrostatics: { title: "How It Works: Hydrostatics Lab", subtitle: "Analyzes pressure, submerged forces, and floating stability.", steps: [
      { title: "Fluid Head Pressures", simple: "Computes gauge and absolute pressures at depth.", formula: "P = ρ·g·h + P_atm" },
      { title: "Force on Submerged Surfaces", simple: "Calculates total force and center of pressure.", formula: "F = ρ·g·h_c·A | y_cp = y_c + I_x/(y_c·A)" },
      { title: "Metacentric Stability", simple: "Assesses stability of floating hulls.", formula: "GM = BM - BG (GM > 0 is Stable)" }
    ]},
    flowmeters: { title: "How It Works: Flow Meters", subtitle: "Measures fluid velocity and discharge rate.", steps: [
      { title: "Calculate Area Ratios", simple: "Computes pipe-to-throat beta ratio and areas.", formula: "β = d/D | A = π·D²/4" },
      { title: "Differential Head Calculations", simple: "Calculates flow using pressure drops.", formula: "Q = C_d·A_throat·√[2·ΔP / (ρ·(1-β⁴))]" },
      { title: "Pitot & Rotameter Math", simple: "Uses dynamic pressure or float weight balancing.", formula: "v = C_p·√[2·ΔP/ρ] | Q ∝ √[V_f·(ρ_f-ρ)]" }
    ]},
    pipehydraulics: { title: "How It Works: Pipe Hydraulics", subtitle: "Detailed Reynolds, laminar, and pressure drop calculations.", steps: [
      { title: "Regime & Reynolds", simple: "Evaluates whether flow is laminar, turbulent, or in transition.", formula: "Re = ρ·v·D / μ" },
      { title: "Darcy Friction Factor", simple: "Computes wall friction factor using Hagen-Poiseuille or Swamee-Jain.", formula: "f = 64/Re or Swamee-Jain" },
      { title: "Frictional Loss", simple: "Computes total pressure drop across pipe length.", formula: "ΔP = f·(L/D)·(ρ·v²/2)" }
    ]},
    pumps: { title: "How It Works: Pumps & NPSH", subtitle: "Evaluates pump powers, efficiency, and cavitation risk.", steps: [
      { title: "Hydraulic Power Sizing", simple: "Computes direct mechanical power added to fluid.", formula: "W_h = ρ·g·Q·H" },
      { title: "Brake Horsepower shaft power", simple: "Computes total shaft motor power using efficiency.", formula: "BHP = W_h / η" },
      { title: "Cavitation Head Check", simple: "Calculates available suction head vs required head.", formula: "NPSH_a = (P_s - P_v - losses)/(ρ·g) - z" }
    ]},
    dragsettling: { title: "How It Works: Drag & Settling", subtitle: "Iteratively solves terminal settling velocity of sphere.", steps: [
      { title: "Reynolds Particle Guess", simple: "Initializes guess for settling velocity.", formula: "v_t = 0.1 m/s" },
      { title: "Correlate Drag Coefficient", simple: "Computes drag coefficient from particle Reynolds.", formula: "C_d = f(Re_p)" },
      { title: "Converge Terminal Speed", simple: "Iterates velocity equation until convergence.", formula: "v_t = √[4·g·d_p·(ρ_p-ρ) / (3·ρ·C_d)]" }
    ]},
    cycles: { title: "How It Works: Thermodynamic Cycles", subtitle: "Path integrals for heat, work, internal energy, and entropy.", steps: [
      { title: "Set Path & Moles", simple: "Define mole count, temperatures, volumes, heat capacities.", formula: "n, T1, T2, V1, V2, Cv, Cp" },
      { title: "Compute Heat & Work", simple: "Integrate dW = P·dV and apply First Law: dU = Q - W.", formula: "W = f(path), dU = n·Cv·dT, Q = dU + W" },
      { title: "Efficiency & Entropy", simple: "Entropy change of path and Carnot efficiency limit.", formula: "dS = f(path) | η = 1 - Tc/Th" }
    ]},
    eos: { title: "How It Works: Equations of State", subtitle: "Compressibility and volumetric properties of real gases.", steps: [
      { title: "Ideal gas properties", simple: "Computes baseline ideal gas volume.", formula: "V_ideal = R·T / P | Z = 1" },
      { title: "Virial corrections", simple: "Computes Virial volume using Pitzer correlation.", formula: "B = (RTc/Pc)·[B0 + ω·B1] | Z = 1 + B·P/(R·T)" },
      { title: "Cubic van der Waals", simple: "Solves cubic volume root using Newton-Raphson.", formula: "V³ - [b + RT/P]·V² + [a/P]·V - a·b/P = 0" }
    ]},
    thermochem: { title: "How It Works: Kirchhoff Thermochemistry", subtitle: "Calculates heats of reaction and combustion at high temperatures.", steps: [
      { title: "Standard enthalpy", simple: "Enthalpy of reaction at standard reference temperature (298.15 K).", formula: "ΔH_rxn° = Σ ν_i·ΔH_f,i°" },
      { title: "Heat capacity change", simple: "Overall heat capacity change for reactants and products.", formula: "ΔCp = Σ ν_i·Cp_i" },
      { title: "Kirchhoff correction", simple: "Corrects standard reaction enthalpy for high temperatures.", formula: "ΔH(T) = ΔH° + ΔCp·[T - T0]" }
    ]},
    fugacity: { title: "How It Works: Departure Functions", subtitle: "Evaluates residual properties and fugacity from cubic EOS.", steps: [
      { title: "Cubic Solver", simple: "Solves for real molar volume V and compressibility Z.", formula: "V = f(T, P) via Newton-Raphson" },
      { title: "Residual Enthalpy & Entropy", simple: "Finds departure functions compared to ideal gas.", formula: "H^R = PV - RT - a/V | S^R = R·ln(1 - b/V)" },
      { title: "Fugacity Coefficient", simple: "Computes effective pressure correction ratio.", formula: "ln(φ) = Z - 1 - ln(Z - P·b/RT) - a/(RT·V)" }
    ]},
    equilibrium: { title: "How It Works: VLE & Extent", subtitle: "Computes activity, bubble point VLE, and chemical conversion.", steps: [
      { title: "Activity coefficients", simple: "Computes gamma values using Margules, Van Laar, or Wilson.", formula: "γ = f(x_i, parameters)" },
      { title: "Bubble Point Pressure", simple: "Solves VLE bubble pressure using modified Raoult's Law.", formula: "P = Σ x_i·γ_i·P_sat,i | y_i = x_i·γ_i·P_sat,i / P" },
      { title: "Reaction conversion", simple: "Solves for final reaction extent ε from chemical constant K(T).", formula: "K(T) = exp(-ΔG/RT) | ε = K / (1 + K)" }
    ]},
    conduction: { title: "How It Works: Conduction Lab", subtitle: "Calculates Fourier heat fluxes and composite/cylindrical/spherical resistances.", steps: [
      { title: "Flat wall conduction", simple: "Calculates 1D conduction flux and composite wall series resistance.", formula: "q = dT / Σ(L_i/k_i) | Fourier's Law" },
      { title: "Radial conduction", simple: "Conduction through cylindrical tubes or spherical shells.", formula: "q_cyl = 2πLk·dT/ln(r2/r1) | q_sph = 4πk·r1·r2·dT/dr" },
      { title: "Critical insulation", simple: "Solves insulation thickness where heat transfer is maximized.", formula: "rc = k/h (cylinder) | rc = 2k/h (sphere)" }
    ]},
    convection: { title: "How It Works: Convection & Fins", subtitle: "Dimensional analysis, thermal boundary layers, and cooling fins.", steps: [
      { title: "Fluid dimensions", simple: "Computes Reynolds (inertial/viscous) and Prandtl (diffusivity) numbers.", formula: "Re = ρ·v·L/μ | Pr = Cp·μ/k" },
      { title: "Boundary layers", simple: "Laminar flat plate hydrodynamic and thermal boundary thicknesses.", formula: "δ = 5x/√Re_x | δ_t = δ · Pr^(-1/3)" },
      { title: "Natural convection & fins", simple: "Natural convection vertical plate Rayleigh coefficient and pin fin efficiency.", formula: "Ra = Gr·Pr | η = tanh(mL)/mL" }
    ]},
    radiation: { title: "How It Works: Radiation & Phase Change", subtitle: "Stefan-Boltzmann radiation exchange, boiling and condensation.", steps: [
      { title: "Blackbody emission", simple: "Stefan-Boltzmann emissive power of a blackbody surface.", formula: "Eb = σ·T⁴ | σ = 5.67e-8 W/m²K⁴" },
      { title: "Gray-body exchange", simple: "Net radiation exchange flux between two large plates.", formula: "q/A = σ(T1⁴-T2⁴) / (1/e1 + 1/e2 - 1)" },
      { title: "Boiling & Condensation", simple: "Rohsenow pool boiling and Nusselt vertical plate condensation film rates.", formula: "q_boil = f(dT_excess) | h_cond = f(dT_subcool)" }
    ]},
    evaporator: { title: "How It Works: Evaporator Sizing", subtitle: "Material/enthalpy sizing of single and double effect evaporators.", steps: [
      { title: "Mass & solute balances", simple: "Overall solvent and solute mass balances.", formula: "F = L + V | F·xF = L·xL" },
      { title: "Energy & Steam balance", simple: "Enthalpy balances to find steam duty and heat transfer area.", formula: "Q = S·λ_s = V·λ_v + L·H_L - F·H_F" },
      { title: "Steam economy", simple: "Evaporation solvent mass vaporized per unit steam consumed.", formula: "Economy = V / S" }
    ]},
    mccabe: { title: "How It Works: McCabe-Thiele", subtitle: "Theoretical stage stepping for binary distillation columns.", steps: [
      { title: "Minimum Reflux ratio", simple: "Calculates Rmin using feed and distillate pinch intersection.", formula: "Rmin = (xD - y_int) / (y_int - x_int)" },
      { title: "Operating lines", formula: "Rectification: y = [R/(R+1)]x + xD/(R+1) | Stripping: y = f(xB, x_int)" },
      { title: "Graphical stage step", simple: "Steps compositions down from xD to xB between operating and VLE lines.", formula: "x_n = y_n / [α - y_n(α-1)]" }
    ]},
    rachford: { title: "How It Works: Rachford-Rice", subtitle: "Newton-Raphson multi-component VLE flash separator.", steps: [
      { title: "Rachford-Rice equation", simple: "Defines objective function summing liquid-vapor split fractions.", formula: "f(ψ) = Σ z_i(K_i-1) / [1 + ψ(K_i-1)] = 0" },
      { title: "Numerical solve", simple: "Newton-Raphson iterations to find feed vapor fraction (psi).", formula: "ψ_new = ψ - f(ψ)/f'(ψ)" },
      { title: "Phase compositions", simple: "Computes equilibrium liquid and vapor composition vectors.", formula: "x_i = z_i / [1+ψ(K_i-1)] | y_i = K_i·x_i" }
    ]},
    pfr: { title: "How It Works: PFR Reactor Sizing", subtitle: "Tubular reactor conversion integration via Simpson's 1/3 rule.", steps: [
      { title: "Kinetics equation", simple: "Reaction rate formulation based on conversion X.", formula: "-rA = k·Ca0ⁿ·(1 - X)ⁿ" },
      { title: "Sizing integral", simple: "PFR design equation representing conversion change along length.", formula: "V = fa0 · Int_0^X [ dX / -rA ]" },
      { title: "Numerical Integration", simple: "Computes volume using Simpson's 1/3 rule over 40 steps.", formula: "V = (h/3)·[g(0) + 4Σg_odd + 2Σg_even + g(X)]" }
    ]},
    nonisothermal: { title: "How It Works: Non-Isothermal Reactor", subtitle: "Couples energy balance with temperature-dependent kinetics.", steps: [
      { title: "Adiabatic temperature rise", simple: "Converts conversion into outlet temperature using reaction heat.", formula: "T_out = T0 + [(-deltaH)·Ca0·X]/(rhoCp)" },
      { title: "Arrhenius kinetics", simple: "Updates rate constant at outlet temperature.", formula: "k(T) = k0·exp[-Ea/(R·T_out)]" },
      { title: "CSTR sizing", simple: "Computes residence time and volume for target conversion.", formula: "tau = X/[k(T)(1-X)] | V = v0·tau" }
    ]},
    catalytic: { title: "How It Works: Catalytic Reactor", subtitle: "Determines catalyst mass and equivalent reactor volume.", steps: [
      { title: "Molar feed basis", simple: "Converts volumetric feed to reactant molar feed.", formula: "F_A0 = v0·Ca0" },
      { title: "Catalyst design equation", simple: "Integrates first-order catalytic rate to target conversion.", formula: "W = [F_A0/(k'·Ca0)]·ln[1/(1-X)]" },
      { title: "Reactor sizing", simple: "Converts catalyst mass to packed volume and space time.", formula: "V = W/rho_bulk | tau = V/v0" }
    ]},
    effectiveness: { title: "How It Works: Catalyst Effectiveness", subtitle: "Quantifies internal diffusion limits in porous pellets.", steps: [
      { title: "Thiele modulus", simple: "Compares intrinsic reaction to pore diffusion rates.", formula: "phi = R_p·sqrt(k/D_eff)" },
      { title: "Effectiveness factor", simple: "Spherical pellet analytical solution.", formula: "eta = (3/phi²)·(phi·coth(phi)-1)" },
      { title: "Observed kinetics", simple: "Scales intrinsic rate to effective observed rate.", formula: "k_obs = eta·k" }
    ]},
    diffusionreaction: { title: "How It Works: Diffusion-Reaction", subtitle: "Solves concentration profile and reactive flux in porous media.", steps: [
      { title: "Diffusion-reaction balance", simple: "Uses first-order steady-state porous slab equation.", formula: "D_eff·d²C/dx² - kC = 0" },
      { title: "Internal profile", simple: "Builds concentration profile from center to surface.", formula: "C(x)=C_s·cosh(phi·x/L)/cosh(phi)" },
      { title: "Surface flux", simple: "Computes reactive flux at particle boundary.", formula: "N_s = C_s·sqrt(D_eff·k)·tanh(phi)" }
    ]},
    packedbedreactor: { title: "How It Works: Packed Bed Reactor", subtitle: "Checks both hydrodynamics and catalytic sizing constraints.", steps: [
      { title: "Ergun pressure loss", simple: "Calculates viscous and inertial pressure gradient.", formula: "dP/dL = 150 term + 1.75 term" },
      { title: "Catalyst requirement", simple: "Computes catalyst mass for target conversion.", formula: "W_req = [F_A0/(k'·Ca0)]·ln[1/(1-X)]" },
      { title: "Geometry check", simple: "Compares available catalyst from bed geometry to required mass.", formula: "Sizing ratio = W_available / W_req" }
    ]},
    fluidizedbed: { title: "How It Works: Fluidized Bed Reactor", subtitle: "Finds minimum fluidization and operating bed expansion.", steps: [
      { title: "Incipient fluidization", simple: "Solves Ergun-based force balance for U_mf.", formula: "A·U_mf² + B·U_mf + C = 0" },
      { title: "Voidage expansion", simple: "Uses Richardson-Zaki relation for operating voidage.", formula: "epsilon = epsilon_mf·(U/U_mf)^(1/n)" },
      { title: "Expanded height", simple: "Converts voidage increase to expanded bed height.", formula: "H = H_mf·(1-epsilon_mf)/(1-epsilon)" }
    ]},
    rtd: { title: "How It Works: Residence Time Distribution", subtitle: "Tracer-response model using tanks-in-series.", steps: [
      { title: "E-curve", simple: "Computes residence time probability density.", formula: "E(t) = ((n/tau)^n·t^(n-1)e^(-nt/tau))/(n-1)!" },
      { title: "F-curve", simple: "Builds cumulative distribution from E-curve.", formula: "F(t)=1-e^(-theta)·Sum_{k=0}^{n-1}(theta^k/k!)" },
      { title: "Moments", simple: "Extracts spread and plug-flow proximity metrics.", formula: "sigma² = tau²/n | Pe ~ 2n" }
    ]},
    reactoroptimization: { title: "How It Works: Reactor Optimization", subtitle: "Sweeps conversion and maximizes profit.", steps: [
      { title: "CSTR sizing per conversion", simple: "Computes required volume and residence time at each conversion.", formula: "V = v0·X/[k(1-X)]" },
      { title: "Economic objective", simple: "Computes revenue minus reactor-related cost.", formula: "Profit = value·(v0·Ca0·X) - costRate·V" },
      { title: "Select optimum", simple: "Returns conversion giving maximum profit in sweep range.", formula: "X_opt = argmax(Profit(X))" }
    ]},
    diffusion: { title: "How It Works: Diffusion & Film Theory", subtitle: "Models molecular mass flux and boundary film coefficients.", steps: [
      { title: "Define concentrations", simple: "Define temperatures, pressure, path length, and boundary partial pressures.", formula: "T, P, z, pa1, pa2" },
      { title: "Estimate diffusivity", simple: "Computes binary gas diffusivity using the Fuller-Schettler-Giddings correlation.", formula: "D_AB = f(T, P, MW, atomic volumes)" },
      { title: "Flux & film resistance", simple: "Calculates EMD and stagnant diffusion (UMD) fluxes, plus film coefficients.", formula: "N_A = f(D_AB) | 1/K_G = 1/kg + m/kl" }
    ]},
    absorption: { title: "How It Works: Gas Absorption Sizing", subtitle: "Sizing packed columns and trayed columns for gas absorption.", steps: [
      { title: "Minimum solvent rate", simple: "Calculates the minimum liquid rate where infinite stages are reached.", formula: "L_min = V · (y1-y2)/(y1/m - x2)" },
      { title: "Kremser stage stepping", simple: "Solves for the number of theoretical stages using the Kremser formula.", formula: "N = ln[((y1-mx2)/(y2-mx2))(1-1/A) + 1/A] / ln(A)" },
      { title: "Packed tower height", simple: "Solves overall log-mean NTU and multiplies by HTU for packed height.", formula: "NTU_OG = (y1-y2)/dy_LM | Z = HTU_OG · NTU_OG" }
    ]},
    drying: { title: "How It Works: Solid Drying Kinetics", subtitle: "Estimates drying times across constant and falling rate regimes.", steps: [
      { title: "Define solid & moisture", simple: "Set dry solid mass, drying area, initial, critical, and equilibrium moisture content.", formula: "Inputs: Ms, Ad, X1, Xc, X*, X2" },
      { title: "Constant rate period", simple: "Dries from initial down to critical moisture under constant surface evaporation.", formula: "t_c = [Ms / (Ad · Rc)] · (X1 - Xc)" },
      { title: "Falling rate period", simple: "Dries below critical moisture content down to target final moisture.", formula: "t_f = [Ms(Xc-X*) / (Ad · Rc)] · ln[(X_start-X*)/(X2-X*)]" }
    ]},
    economics: { title: "How It Works: Process Economics", subtitle: "Estimates capital costs, depreciation, time value of money, and profitability.", steps: [
      { title: "Capital Cost Estimation", simple: "Calculates Fixed and Working Capital Investment (FCI & WCI) from equipment costs.", formula: "FCI = C_delivered · LangFactor | WCI = FCI · WC%" },
      { title: "Cost Index & Scaling", simple: "Adjusts costs across years and sizes using exponents and cost index ratios.", formula: "C2 = C1 · (S2/S1)^n · (I2/I1)" },
      { title: "TVM & Interest", simple: "Solves simple vs compound interest, annuities, and capitalized costs.", formula: "F_comp = P(1+r/m)^(m·n) | K = P + (P-Vs)/((1+i)^n-1)" },
      { title: "Profitability & Break-Even", simple: "Solves payback period, ROI, NPV, numerical IRR, and break-even output.", formula: "NPV = -FCI + Σ NCF_t/(1+r)^t | Q_BE = FixedCost / (Price - VarCost)" }
    ]},
    distillation_design: { title: "How It Works: Distillation Design", subtitle: "Sizes sieve tray columns and performs Murphree & Ponchon-Savarit staging.", steps: [
      { title: "Sieve Tray Diameter Sizing", simple: "Computes column cross-sectional area from vapor density and Souders-Brown velocity.", formula: "uf = Csb·√[(ρL-ρV)/ρV] | Dc = √[4·Ac/π]" },
      { title: "Murphree Stage Stepping", simple: "Steps actual stages by scaling equilibrium vapor compositions with efficiency Emv.", formula: "y_n = y_n-1 - Emv·(y_n-1 - y*)" },
      { title: "Ponchon-Savarit staging", simple: "Projects stages on enthalpy-concentration grid via reboiler/condenser operating points.", formula: "H(y_n+1) = h(x_n) + slope·(y_n+1 - x_n)" }
    ]},
    extraction_leaching: { title: "How It Works: Extraction & Leaching", subtitle: "Computes liquid-liquid extraction stages and solid-liquid leaching underflows.", steps: [
      { title: "Cross-current LLE", simple: "Steps raffinate solute concentrations stage-by-stage using partition coefficient K.", formula: "x_i = x_i-1 / [1 + K·(Si/R)]" },
      { title: "Counter-current Extraction", simple: "Sized via log analytical Kremser relations with extraction factor E.", formula: "N = ln[((xF-yS/K)/(xN-yS/K))(1-1/E) + 1/E] / ln(E)" },
      { title: "Solid Leaching stages", simple: "Solves counter-current stage demands under constant solution underflows.", formula: "N_leach = ln[(y0(1-α) + yN·α)/yN] / ln(α) | α = L/V" }
    ]},
    adsorption: { title: "How It Works: Adsorption Lab", subtitle: "Evaluates Langmuir/Freundlich isotherms and bed breakthrough times.", steps: [
      { title: "Isotherm Capacity", simple: "Solves adsorption loading q capacity at feed concentration.", formula: "q = qm·Kl·C / [1+Kl·C] | q = Kf·C^(1/n)" },
      { title: "Thomas Breakthrough Curve", simple: "Solves fixed-bed effluent concentration profile S-curve over operation.", formula: "C/C0 = 1 / [1 + exp(-k·(t - t0.5))]" },
      { title: "LUB Bed Sizing", simple: "Calculates unused bed length from breakthrough and stoichiometric times.", formula: "LUB = L·(1 - tb/t0.5)" }
    ]},
    humidification: { title: "How It Works: Humidification & Cooling", subtitle: "Psychrometric calculations and cooling tower heights.", steps: [
      { title: "Psychrometrics", simple: "Saturates vapor pressures and computes humidity ratio and enthalpies.", formula: "Y = 0.622·pV/[P-pV] | Ha = cs·Td + Y·λ0" },
      { title: "Cooling Tower NTU Sizing", simple: "Integrates enthalpy differences along water cooling path via Simpson's rule.", formula: "NTU = Int [ cpL·dT / (H* - Hy) ]" },
      { title: "Tower Packed Height", simple: "Determines packed height using NTU and transfer unit HTU heights.", formula: "Z = HTU · NTU" }
    ]},
    momentum_transport: { title: "How It Works: Momentum Transport", subtitle: "Momentum shell balances and flat-plate boundary layers.", steps: [
      { title: "Velocity Profile", simple: "Solves parabolic laminar velocity distributions in pipes or slits.", formula: "v = vmax·[1 - (r/R)^2]" },
      { title: "Shear Stress Profile", simple: "Shell momentum balance gives linear shear stress distributions.", formula: "tau = [dP/(2L)]·r" },
      { title: "Boundary Layer Sizing", simple: "Predicts boundary layer growth and displacement/momentum thickness.", formula: "delta = 5.0·x / sqrt(Rex)" },
      { title: "Blasius similarity profile", simple: "Numerical RK4 integration of the Blasius similarity ODE.", formula: "f''' + 0.5·f·f'' = 0" }
    ]},
    heat_mass_transport: { title: "How It Works: Heat & Mass Transport", subtitle: "Heat and mass shell balances and transient finite differences.", steps: [
      { title: "Wire heat generation", simple: "Parabolic thermal profiles with electrical heat dissipation.", formula: "T(r) = Tw + [Sg·R^2/(4k)]·[1 - (r/R)^2]" },
      { title: "Film diffusion-reaction", simple: "Mass balance for stagnant film diffusion coupled to first-order reaction.", formula: "Ca = Ca0·sinh(phi·[1-z/L]) / sinh(phi)" },
      { title: "Transient PDE explicit solver", simple: "Solves 1D conduction/diffusion transient PDEs using FTCS finite difference.", formula: "U(i, n+1) = U(i, n) + Fo·[U(i+1, n) - 2·U(i, n) + U(i-1, n)]" }
    ]},
    coupled_transport_solvers: { title: "How It Works: Coupled Transport & Solvers", subtitle: "Simultaneous heat/mass transfer and numerical ODE solvers.", steps: [
      { title: "Catalyst pellet BVP", simple: "Non-isothermal spherical species diffusion and energy balances.", formula: "Deff·d2C/dr2 + ... = k·C | keff·d2T/dr2 + ... = -dH·k·C" },
      { title: "Coupled wet-bulb evaporation", simple: "Droplet evaporation bisection solver balancing heat and mass flux.", formula: "Tinf - Twb = (lambda/cs)·[Ys(Twb) - Yinf]" },
      { title: "Numerical RK4 solver", simple: "Runge-Kutta 4th order method for consecutive kinetics systems.", formula: "k1 = f(t,y), k2 = f(t+h/2, y+h/2·k1), ..." }
    ]}
  };
  Object.assign(diagrams, {
    transferfunction: { title: "How It Works: Process Transfer Function", subtitle: "Builds a second-order-plus-dead-time process model.", steps: [
      { title: "Set process parameters", simple: "Use gain, two lags, and dead-time from process tests.", formula: "K, tau1, tau2, theta" },
      { title: "Assemble SOPDT model", simple: "Create transfer function in the Laplace domain.", formula: "G(s)=K*exp(-theta*s)/((tau1*s+1)(tau2*s+1))" },
      { title: "Read poles", simple: "Poles indicate dynamic speed and potential oscillation.", formula: "den(s)=tau1*tau2*s^2 + (tau1+tau2)s + 1" }
    ]},
    laplace: { title: "How It Works: Laplace Transforms", subtitle: "Maps process forcing signals into s-domain algebra.", steps: [
      { title: "Choose signal type", simple: "Step, ramp, impulse, exponential, or sine forcing.", formula: "f(t) -> F(s)" },
      { title: "Apply identity", simple: "Use standard transform pair for chosen forcing.", formula: "L{A}=A/s, L{At}=A/s^2, etc." },
      { title: "Evaluate", simple: "Compute transformed value at selected s if needed.", formula: "F(s0)" }
    ]},
    dynamicresponse: { title: "How It Works: Dynamic Response", subtitle: "Predicts time trajectory after an input step.", steps: [
      { title: "Define FOPDT model", simple: "Set process gain, lag, and dead-time.", formula: "K, tau, theta" },
      { title: "Compute trajectory", simple: "Response starts after dead-time then rises exponentially.", formula: "y=K*du*(1-exp(-(t-theta)/tau))" },
      { title: "Extract metrics", simple: "Read rise and settling behavior from response.", formula: "t90 approx theta+2.3*tau, ts approx theta+4*tau" }
    ]},
    firstorder: { title: "How It Works: First-Order Systems", subtitle: "Classical single-lag process response.", steps: [
      { title: "Set first-order model", simple: "Define gain and time constant.", formula: "G(s)=K/(tau*s+1)" },
      { title: "Step response", simple: "Output approaches final value exponentially.", formula: "y=K*du*(1-exp(-t/tau))" },
      { title: "Time markers", simple: "Use standard process-response timing rules.", formula: "y(tau)=63.2%, tr~2.2*tau, ts~4*tau" }
    ]},
    secondorder: { title: "How It Works: Second-Order Systems", subtitle: "Damping-driven oscillatory process behavior.", steps: [
      { title: "Set damping and natural frequency", simple: "zeta and wn govern shape and speed.", formula: "zeta, wn" },
      { title: "Compute response type", simple: "Underdamped overshoots, overdamped is smooth.", formula: "G(s)=K*wn^2/(s^2+2*zeta*wn*s+wn^2)" },
      { title: "Read quality metrics", simple: "Overshoot, peak-time, and settling-time describe control quality.", formula: "Mp, tp, ts" }
    ]},
    controllertuning: { title: "How It Works: Controller Tuning", subtitle: "Computes practical PI/PID parameters.", steps: [
      { title: "Collect test parameters", simple: "Use Ku/Pu or process model constants.", formula: "Ku, Pu, Kp, tau, theta" },
      { title: "Apply tuning rules", simple: "Calculate ZN and IMC-style settings.", formula: "Kc, Ti, Td from tuning correlations" },
      { title: "Compare aggressiveness", simple: "ZN is faster; IMC is usually smoother/robuster.", formula: "Rule-dependent closed-loop behavior" }
    ]},
    stabilityanalysis: { title: "How It Works: Stability Analysis", subtitle: "Checks closed-loop stability with Routh criteria.", steps: [
      { title: "Define characteristic polynomial", simple: "Use cubic closed-loop equation coefficients.", formula: "a3*s^3 + a2*s^2 + a1*s + a0 = 0" },
      { title: "Evaluate Routh conditions", simple: "Check positivity and determinant margin.", formula: "a2*a1 - a3*a0 > 0" },
      { title: "Classify", simple: "Return stable/unstable classification for loop design.", formula: "All first-column terms positive" }
    ]},
    rootlocus: { title: "How It Works: Root Locus", subtitle: "Tracks closed-loop pole motion with gain.", steps: [
      { title: "Define base model", simple: "Use two-lag denominator and feedback gain K.", formula: "(tau1*tau2)s^2 + (tau1+tau2)s + (1+K)=0" },
      { title: "Sweep gain", simple: "Compute poles over gain range.", formula: "K from 0 to Kmax" },
      { title: "Interpret pole paths", simple: "Imaginary parts indicate oscillatory tendencies.", formula: "Re(p), Im(p)" }
    ]},
    bodeplots: { title: "How It Works: Bode Plots", subtitle: "Magnitude and phase across frequency.", steps: [
      { title: "Set transfer function", simple: "Choose gain and lag parameters.", formula: "G(jw)=K/((1+jw*tau1)(1+jw*tau2))" },
      { title: "Compute curves", simple: "Evaluate magnitude in dB and phase in degrees.", formula: "20log10|G| and angle(G)" },
      { title: "Use crossover", simple: "Locate approximate gain crossover for control-speed insight.", formula: "|G(jwc)|~1" }
    ]},
    frequencyresponse: { title: "How It Works: Frequency Response", subtitle: "Sinusoidal attenuation and phase lag.", steps: [
      { title: "Set forcing frequency", simple: "Choose disturbance or test sinusoid frequency.", formula: "u=A*sin(wt)" },
      { title: "Compute amplitude ratio", simple: "Find how strongly process attenuates input.", formula: "AR=K/sqrt(1+(w*tau)^2)" },
      { title: "Compute phase lag", simple: "Find angular delay between output and input.", formula: "phi=-atan(w*tau)" }
    ]},
    pidcalculations: { title: "How It Works: PID Calculations", subtitle: "Computes controller output term-by-term.", steps: [
      { title: "Error evaluation", simple: "Difference between setpoint and process variable.", formula: "e=SP-PV" },
      { title: "PID terms", simple: "Compute proportional, integral, and derivative contributions.", formula: "u=bias + P + I + D" },
      { title: "Output limits", simple: "Clamp output and update integral memory.", formula: "u=clamp(u_raw, u_min, u_max)" }
    ]}
  });

  const meta = diagrams[moduleId];
  if (!meta) return null;

  return (
    <motion.div {...fadeUp} className="glass-panel rounded-2xl p-6">
      <p className="text-base font-semibold tracking-tight text-zinc-200">{meta.title}</p>
      <p className="mt-1 text-sm text-zinc-500">{meta.subtitle}</p>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {meta.steps.map((step, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -3, boxShadow: "0 12px 40px rgb(0 0 0 / 0.15)" }}
            className="relative rounded-xl bg-white/[0.02] p-4 border border-white/[0.04] transition-all"
          >
            <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-400 ring-1 ring-white/[0.08]">
              {idx + 1}
            </div>
            <p className="text-sm font-medium text-zinc-300">{step.title}</p>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{step.simple}</p>
            <div className="mt-3 rounded-lg bg-black/30 px-3 py-2">
              <p className="font-mono text-[11px] text-emerald-400/80">{step.formula}</p>
            </div>
            {idx < meta.steps.length - 1 && (
              <div className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-zinc-600 md:block">
                <ChevronRight size={14} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const studentFunFacts = {
  plume: "🏗️ The tallest chimney ever built is in Kazakhstan (1,377 ft). It was built that high so the plume wouldn't poison the local town!",
  heatexchanger: "🐘 Elephants use their huge ears as biological heat exchangers! Blood flows through vessels near the skin to release body heat.",
  pipeflow: "🛢️ The Trans-Alaska pipeline is 800 miles long. The friction from the flow is so high that the oil actually warms up as it travels!",
  cstr: "🍔 Your stomach is essentially a biological CSTR! Food comes in continuously, gets perfectly mixed by muscles, reacts with acid, and exits.",
  flash: "🌊 Flash vaporizers are used in deep-sea submarines to quickly boil and separate fresh water from salty ocean water to keep the crew hydrated.",
  ergun: "🐟 The sponge filter in a home aquarium is a type of packed bed! The 'particles' are actual plastic sponges where bacteria live.",
  fenske: "⚡ Distillation is so energy-intensive that it consumes about 6% of all industrial energy used in the United States!",
  pid: "🚗 PID controllers aren't just for chemical plants. Your car's cruise control uses a PID algorithm to keep your speed exactly at 60 mph on hills!",
  hydrostatics: "🚢 The mega-container ship Ever Given became stuck in the Suez Canal in 2021, and salvage crews had to calculate the metacentric height hourly to make sure it wouldn't capsize when floated!",
  flowmeters: "✈️ If a Pitot tube gets blocked by ice or insects, the airplane's airspeed indicator will read completely wrong, which has historically caused commercial aviation incidents.",
  pipehydraulics: "🌋 Magma flowing in underground lava tubes behaves exactly like laminar flow in pipes, obeying the Hagen-Poiseuille relationship despite being millions of times more viscous than water!",
  pumps: "🫀 The human heart is a pulsatile pump that beats around 100,000 times a day, pumping 2,000 gallons of blood—though it has a low efficiency of about 10-15%!",
  dragsettling: "🌧️ Raindrops fall slower than they theoretically should under gravity because of air drag! A droplet reaches a terminal velocity of only about 9 m/s.",
  cycles: "🔄 Sadi Carnot, who developed the Carnot cycle in 1824, was a French military engineer. His work was largely ignored until Rudolf Clausius and Lord Kelvin formalized it decades later!",
  eos: "🎈 Johannes van der Waals won the Nobel Prize in Physics in 1910 for his equation of state. The parameters 'a' and 'b' represent molecular attraction and physical size, respectively.",
  thermochem: "🔥 Hess's Law shows that enthalpy change is a state function. This means the energy released from burning sugar is exactly the same whether it happens in a bomb calorimeter or in your cells!",
  fugacity: "🎛️ Gilbert N. Lewis invented the term 'fugacity' from the Latin word 'fugere' (to flee), representing the tendency of molecules to escape from a phase.",
  equilibrium: "⚖️ VLE bubble point calculations are essential for making high-proof spirits. Traditional copper pot stills rely entirely on Raoult's Law to enrich vapor in ethanol.",
  conduction: "❄️ Silver has the highest thermal conductivity of any metal (429 W/mK), which is why it feels freezing cold to the touch almost instantly when placed on ice!",
  convection: "🏎️ The thermal boundary layer on a Formula 1 race car's tires determines how fast heat dissipates, directly affecting rubber grip and racing performance.",
  radiation: "☀️ The Sun's core temperature is 15 million Kelvin, but its surface is only 5,800 Kelvin, radiating energy that travels 93 million miles through the vacuum of space to reach Earth.",
  evaporator: "🥛 Norbert Rillieux's invention of the multiple-effect evaporator in 1843 revolutionized the sugar industry, using 70% less fuel by recycling latent vapor heat.",
  mccabe: "🗼 Distillation columns in oil refineries can be up to 100 meters tall and contain hundreds of actual trays, stepping compositions stage-by-stage just like a McCabe-Thiele diagram.",
  rachford: "⛽ Rachford-Rice flash calculations are executed billions of times a day in oil reservoir simulators to predict gas-to-liquid ratios in underground wells.",
  pfr: "🚀 PFR reactors are used in rocket engines! Reactants are injected at one end, react as they flow through the nozzle, and exit at high velocity.",
  nonisothermal: "🔥 Many industrial oxidation reactors run adiabatically, so operators add quench streams to avoid thermal runaway.",
  catalytic: "🧪 A few millimeters change in catalyst pellet diameter can significantly change conversion and pressure drop at plant scale.",
  effectiveness: "🕳️ Even if the catalyst surface is extremely active, pore diffusion can hide much of that activity from the bulk fluid.",
  diffusionreaction: "📉 Internal concentration in porous catalysts can be much lower than external concentration when reaction is very fast.",
  packedbedreactor: "🏭 Fixed-bed reactors often trade conversion for lower pressure drop to reduce compressor energy cost.",
  fluidizedbed: "🌪️ Fluidized beds behave like boiling liquids, which is why they provide excellent heat transfer and mixing.",
  rtd: "⏱️ RTD tests with a salt pulse and a conductivity probe are one of the fastest ways to diagnose real mixing behavior.",
  reactoroptimization: "📈 Maximum conversion is not always maximum profit because reactor volume grows nonlinearly near X = 1.",
  diffusion: "🌬️ Fick's laws of diffusion are identical in mathematical form to Fourier's laws of heat conduction! The same partial differential equations govern both heat flow and mass flow.",
  absorption: "🧼 Amine absorption columns are critical in carbon capture. They scrub CO2 from coal plant flue gases before the gases can exit the stack into the atmosphere.",
  economics: "💰 The six-tenths factor rule was first proposed in 1947 by Roger Williams Jr. It shows that equipment costs scale non-linearly because size relates to volume (capacity) while cost relates to surface area (metal used)!",
  distillation_design: "🗼 The world's largest distillation column is located in Jamnagar, India, processing over 600,000 barrels of crude oil per day in a single tower!",
  extraction_leaching: "☕ Supercritical carbon dioxide extraction is used to decaffeinate green coffee beans, leaving the beans' flavor molecules completely intact!",
  adsorption: "活性炭 Active carbon has an incredibly high surface-area-to-mass ratio; just one gram of activated carbon can have a surface area of over 3,000 square meters (almost half a soccer field)!",
  humidification: "🌧️ Saturated air enthalpy is a non-linear function of temperature because the vapor pressure of water rises exponentially with temperature, as modeled by the Antoine equation!"
};

function FunFactCard({ moduleId }) {
  const fact = studentFunFacts[moduleId];
  if (!fact) return null;
  return (
    <motion.div {...fadeUp} className="rounded-2xl bg-amber-500/[0.04] border border-amber-400/10 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-base">💡</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70">Did you know?</p>
          <p className="mt-1.5 text-sm text-amber-200/60 leading-relaxed">{fact}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Application ──
export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("cpss1_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  const [token, setToken] = useState(localStorage.getItem("cpss1_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("cpss1_user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { localStorage.removeItem("cpss1_user"); localStorage.removeItem("cpss1_token"); return null; }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("plume");
  const [viewMode, setViewMode] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const [lastRunAt, setLastRunAt] = useState("");
  const [xp, setXp] = useState(() => Number(localStorage.getItem("cpss1_xp")) || 0);
  const [historyFilter, setHistoryFilter] = useState("");
  const [plumeCity, setPlumeCity] = useState("Delhi");
  const [plumeCityLoading, setPlumeCityLoading] = useState(false);
  const [plumeCityError, setPlumeCityError] = useState("");
  const [plumeCityMeta, setPlumeCityMeta] = useState(null);

  useEffect(() => {
    localStorage.setItem("cpss1_theme", theme);
    document.documentElement.classList.toggle("theme-light", theme === "light");
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  const [plumeIn, setPlumeIn] = useState({ stackHeight: 50, emissionRate: 100, windSpeed: 5, stability: "D" });
  const [hxIn, setHxIn] = useState({ th_in: 150, th_out: 90, tc_in: 25, tc_out: 70, u_val: 500, area: 75 });
  const [pipeIn, setPipeIn] = useState({ diameter: 0.2, length: 100, roughness: 0.00005, velocity: 2, density: 998, viscosity: 0.001 });
  const [cstrIn, setCstrIn] = useState({ flowRate: 12, targetConversion: 0.75, rateConstant: 1.5 });
  const [flashIn, setFlashIn] = useState({ z: 0.5, alpha: 2.2, vaporFraction: 0.4 });
  const [ergunIn, setErgunIn] = useState({ L: 3, Dp: 0.005, epsilon: 0.4, v: 0.3, rho: 950, mu: 0.002 });
  const [fenskeIn, setFenskeIn] = useState({ alpha: 2.5, xD: 0.95, xB: 0.05 });
  const [pidIn, setPidIn] = useState({ Kp: 1.2, tau_p: 6, theta: 1.2 });
  const [transferFunctionIn, setTransferFunctionIn] = useState({ processGain: 2.0, tau1: 4.0, tau2: 1.5, deadTime: 0.8 });
  const [laplaceIn, setLaplaceIn] = useState({ signalType: "step", amplitude: 1.0, decay: 1.0, omega: 1.0, sValue: 1.0, tValue: 1.0 });
  const [dynamicResponseIn, setDynamicResponseIn] = useState({ processGain: 2.0, tau: 6.0, deadTime: 1.0, stepSize: 1.0, horizon: 40 });
  const [firstOrderIn, setFirstOrderIn] = useState({ processGain: 1.6, tau: 5.0, stepSize: 1.0, horizon: 30 });
  const [secondOrderIn, setSecondOrderIn] = useState({ processGain: 1.0, zeta: 0.4, wn: 0.8, stepSize: 1.0, horizon: 40 });
  const [controllerTuningIn, setControllerTuningIn] = useState({ processGain: 1.5, tau: 8.0, theta: 1.2, ku: 2.4, pu: 4.0, lambda: 5.0 });
  const [stabilityAnalysisIn, setStabilityAnalysisIn] = useState({ a3: 1, a2: 6, a1: 11, a0: 6 });
  const [rootLocusIn, setRootLocusIn] = useState({ tau1: 4.0, tau2: 1.8, selectedK: 2.0, kMax: 20 });
  const [bodePlotsIn, setBodePlotsIn] = useState({ processGain: 2.0, tau1: 4.0, tau2: 1.5, wMin: 0.01, wMax: 10, points: 40 });
  const [frequencyResponseIn, setFrequencyResponseIn] = useState({ processGain: 2.0, tau: 5.0, omega: 0.4, inputAmplitude: 1.0 });
  const [pidCalculationsIn, setPidCalculationsIn] = useState({ kc: 1.8, ti: 3.5, td: 0.8, setPoint: 60, pv: 55, prevError: 4.5, integral: 20, dt: 1, bias: 0, outputMin: 0, outputMax: 100 });
  const [hydrostaticsIn, setHydrostaticsIn] = useState({ fluidDensity: 1000, height: 2, patm: 101325, plateWidth: 1, plateHeight: 2, plateDepthCentroid: 3, manometerFluidDensity: 13600, manometerDeflection: 0.1, submergedVolume: 10, waterplaneI: 12, bgDistance: 0.5 });
  const [flowmetersIn, setFlowmetersIn] = useState({ pipeDiameter: 0.1, throatDiameter: 0.05, fluidDensity: 1000, deltaP: 50000, dischargeCoeffVenturi: 0.98, dischargeCoeffOrifice: 0.61, dischargeCoeffPitot: 1.0, rotameterFloatVolume: 1e-5, rotameterFloatDensity: 7800, rotameterFloatArea: 1e-4, rotameterAnnularArea: 5e-5, rotameterDischargeCoeff: 0.6 });
  const [pipehydraulicsIn, setPipehydraulicsIn] = useState({ diameter: 0.1, length: 50, velocity: 1.5, density: 1000, viscosity: 0.001, roughness: 0.000045 });
  const [pumpsIn, setPumpsIn] = useState({ flowRate: 0.05, head: 30, density: 1000, efficiency: 0.75, suctionPressure: 101325, vaporPressure: 2340, suctionLosses: 5000, elevationDifference: 2, npshRequired: 4 });
  const [dragsettlingIn, setDragsettlingIn] = useState({ particleDiameter: 0.0005, particleDensity: 2500, fluidDensity: 1000, fluidViscosity: 0.001 });
  const [cyclesIn, setCyclesIn] = useState({ n: 1, t1: 300, t2: 450, v1: 0.02, v2: 0.04, p1: 100000, cv: 20.8, cp: 29.1, th: 600, tc: 300, cycleType: "isothermal" });
  const [eosIn, setEosIn] = useState({ t: 350, p: 1500000, tc: 369.8, pc: 4250000, omega: 0.152, mockPsatAtTr07: 425000 });
  const [thermochemIn, setThermochemIn] = useState({ temp: 500 });
  const [fugacityIn, setFugacityIn] = useState({ t: 350, p: 1500000, tc: 369.8, pc: 4250000 });
  const [equilibriumIn, setEquilibriumIn] = useState({ temp: 350, x1: 0.4, a12: 1.2, a21: 0.8, p1Sat: 120000, p2Sat: 70000, deltaG298: -10000, deltaH298: -20000, modelType: "margules" });
  const [conductionIn, setConductionIn] = useState({ k: 0.5, thick: 0.1, t1: 100, t2: 25, kIns: 0.04, hExt: 10, r1: 0.05, r2: 0.08, kWall: 15, len: 10 });
  const [convectionIn, setConvectionIn] = useState({ fluidDensity: 998, velocity: 2, viscosity: 0.001, length: 1, cp: 4184, kFluid: 0.6, tempWall: 80, tempFluid: 20, finDiam: 0.01, finLen: 0.1, finK: 200, hConvection: 50 });
  const [radiationIn, setRadiationIn] = useState({ temp1: 800, temp2: 300, eps1: 0.8, eps2: 0.6, tempSat: 373.15, tempWall: 390, hfg: 2256000, rhoL: 958, rhoV: 0.6, muL: 0.00028, kL: 0.68, cpL: 4220, sigmaBoil: 0.0589, csf: 0.013, boilingPr: 1.75 });
  const [evaporatorIn, setEvaporatorIn] = useState({ feedRate: 10, xF: 0.1, xL: 0.4, tF: 320, tSatSteam: 393, pEvap: 20000, uVal1: 2000, hfgSteam: 2200000, cpFeed: 4000 });
  const [mccabeIn, setMcCabeIn] = useState({ alpha: 2.5, xD: 0.95, xB: 0.05, xF: 0.5, qVal: 1.0, refluxRatio: 2.0 });
  const [rachfordIn, setRachfordIn] = useState({ z1: 0.4, z2: 0.3, z3: 0.2, z4: 0.1, k1: 2.5, k2: 1.2, k3: 0.5, k4: 0.1 });
  const [pfrIn, setPfrIn] = useState({ flowRate: 0.05, ca0: 2.0, targetConversion: 0.8, rateConstant: 0.1, reactionOrder: 1 });
  const [nonIsothermalIn, setNonIsothermalIn] = useState({ flowRate: 1.5, ca0: 1500, targetConversion: 0.65, t0: 350, k0: 8000000, ea: 70000, deltaH: -60000, rhoCp: 3500000 });
  const [catalyticIn, setCatalyticIn] = useState({ flowRate: 1.2, ca0: 1200, targetConversion: 0.75, kPrime: 0.35, bedBulkDensity: 650 });
  const [effectivenessIn, setEffectivenessIn] = useState({ pelletRadius: 0.0015, intrinsicRateConstant: 0.8, effectiveDiffusivity: 2e-7 });
  const [diffusionReactionIn, setDiffusionReactionIn] = useState({ halfThickness: 0.001, effectiveDiffusivity: 2e-7, rateConstant: 0.6, surfaceConcentration: 1.5 });
  const [packedBedReactorIn, setPackedBedReactorIn] = useState({ bedLength: 3.0, bedDiameter: 0.9, particleDiameter: 0.004, voidFraction: 0.42, superficialVelocity: 0.35, fluidDensity: 850, fluidViscosity: 0.002, particleDensity: 1600, flowRate: 1.2, ca0: 1200, targetConversion: 0.75, kPrime: 0.35 });
  const [fluidizedBedIn, setFluidizedBedIn] = useState({ particleDiameter: 0.00045, sphericity: 0.9, epsilonMf: 0.45, fluidDensity: 1.2, particleDensity: 1400, fluidViscosity: 1.9e-5, superficialVelocity: 0.22, initialBedHeight: 1.4 });
  const [rtdIn, setRtdIn] = useState({ meanResidenceTime: 80, tanksInSeries: 3, horizonMultiplier: 5 });
  const [reactorOptimizationIn, setReactorOptimizationIn] = useState({ flowRate: 1.2, ca0: 1200, rateConstant: 0.6, productValue: 0.12, reactorCostRate: 15, conversionMin: 0.2, conversionMax: 0.95 });
  const [diffusionIn, setDiffusionIn] = useState({ t: 298.15, p: 101325, ma: 18, mb: 29, sumVa: 12.7, sumVb: 20.1, z: 0.01, pa1: 5000, pa2: 1000, delta: 0.001, kg: 1e-4, kl: 1e-4, m: 1.2 });
  const [absorptionIn, setAbsorptionIn] = useState({ gRate: 10, y1: 0.05, y2: 0.005, x2: 0.0, m: 1.2, fSolvent: 1.4, efficiency: 0.7, htu: 0.6 });
  const [dryingIn, setDryingIn] = useState({ drySolidMass: 50, area: 2.0, xInitial: 0.25, xCritical: 0.12, xEquilibrium: 0.02, xFinal: 0.04, rc: 1.5 });

  const [plumeRes, setPlumeRes] = useState(null);
  const [hxRes, setHxRes] = useState(null);
  const [pipeRes, setPipeRes] = useState(null);
  const [cstrRes, setCstrRes] = useState(null);
  const [flashRes, setFlashRes] = useState(null);
  const [ergunRes, setErgunRes] = useState(null);
  const [fenskeRes, setFenskeRes] = useState(null);
  const [pidRes, setPidRes] = useState(null);
  const [transferFunctionRes, setTransferFunctionRes] = useState(null);
  const [laplaceRes, setLaplaceRes] = useState(null);
  const [dynamicResponseRes, setDynamicResponseRes] = useState(null);
  const [firstOrderRes, setFirstOrderRes] = useState(null);
  const [secondOrderRes, setSecondOrderRes] = useState(null);
  const [controllerTuningRes, setControllerTuningRes] = useState(null);
  const [stabilityAnalysisRes, setStabilityAnalysisRes] = useState(null);
  const [rootLocusRes, setRootLocusRes] = useState(null);
  const [bodePlotsRes, setBodePlotsRes] = useState(null);
  const [frequencyResponseRes, setFrequencyResponseRes] = useState(null);
  const [pidCalculationsRes, setPidCalculationsRes] = useState(null);
  const [hydrostaticsRes, setHydrostaticsRes] = useState(null);
  const [flowmetersRes, setFlowmetersRes] = useState(null);
  const [pipehydraulicsRes, setPipehydraulicsRes] = useState(null);
  const [pumpsRes, setPumpsRes] = useState(null);
  const [dragsettlingRes, setDragsettlingRes] = useState(null);
  const [cyclesRes, setCyclesRes] = useState(null);
  const [eosRes, setEosRes] = useState(null);
  const [thermochemRes, setThermochemRes] = useState(null);
  const [fugacityRes, setFugacityRes] = useState(null);
  const [equilibriumRes, setEquilibriumRes] = useState(null);
  const [conductionRes, setConductionRes] = useState(null);
  const [convectionRes, setConvectionRes] = useState(null);
  const [radiationRes, setRadiationRes] = useState(null);
  const [evaporatorRes, setEvaporatorRes] = useState(null);
  const [mccabeRes, setMcCabeRes] = useState(null);
  const [rachfordRes, setRachfordRes] = useState(null);
  const [pfrRes, setPfrRes] = useState(null);
  const [nonIsothermalRes, setNonIsothermalRes] = useState(null);
  const [catalyticRes, setCatalyticRes] = useState(null);
  const [effectivenessRes, setEffectivenessRes] = useState(null);
  const [diffusionReactionRes, setDiffusionReactionRes] = useState(null);
  const [packedBedReactorRes, setPackedBedReactorRes] = useState(null);
  const [fluidizedBedRes, setFluidizedBedRes] = useState(null);
  const [rtdRes, setRtdRes] = useState(null);
  const [reactorOptimizationRes, setReactorOptimizationRes] = useState(null);
  const [diffusionRes, setDiffusionRes] = useState(null);
  const [absorptionRes, setAbsorptionRes] = useState(null);
  const [dryingRes, setDryingRes] = useState(null);
  const [economicsIn, setEconomicsIn] = useState({
    deliveredEquipmentCost: 100000,
    langFactor: 4.0,
    workingCapitalPercent: 15,
    costIndexPast: 300,
    costIndexPresent: 600,
    scalingExponent: 0.6,
    referenceCapacity: 100,
    desiredCapacity: 250,
    principal: 100000,
    nominalRate: 0.08,
    interestPeriods: 12,
    years: 10,
    annuityPayment: 15000,
    salvageValue: 10000,
    capitalizedCostInterest: 0.06,
    taxRate: 0.02,
    annualRevenue: 120000,
    annualOperatingCost: 60000,
    incomeTaxRate: 0.30,
    fixedCost: 30000,
    sellingPricePerUnit: 15,
    variableCostPerUnit: 6
  });
  const [economicsRes, setEconomicsRes] = useState(null);
  const [econSubTab, setEconSubTab] = useState("capital");

  const [distillationDesignIn, setDistillationDesignIn] = useState({
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
  });
  const [distillationDesignRes, setDistillationDesignRes] = useState(null);
  const [distillSubTab, setDistillSubTab] = useState("hydraulics");

  const [extractionLeachingIn, setExtractionLeachingIn] = useState({
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
  });
  const [extractionLeachingRes, setExtractionLeachingRes] = useState(null);
  const [extractSubTab, setExtractSubTab] = useState("extraction");

  const [adsorptionIn, setAdsorptionIn] = useState({
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
  });
  const [adsorptionRes, setAdsorptionRes] = useState(null);
  const [adsorbSubTab, setAdsorbSubTab] = useState("isotherms");

  const [humidificationIn, setHumidificationIn] = useState({
    dryBulbTemp: 30.0,
    relativeHumidity: 60.0,
    totalPressure: 101325,
    waterInletTemp: 40.0,
    waterOutletTemp: 28.0,
    airInletWetBulb: 24.0,
    liquidGasRatio: 1.2,
    overallHTU: 1.5
  });
  const [humidificationRes, setHumidificationRes] = useState(null);
  const [humidSubTab, setHumidSubTab] = useState("properties");

  const [momentumIn, setMomentumIn] = useState({
    flowSystem: "pipe",
    dimension: 0.05,
    length: 10.0,
    pressureDrop: 100.0,
    viscosity: 0.001,
    density: 1000.0,
    plateDistance: 1.0,
    freeStreamVelocity: 2.0
  });
  const [momentumRes, setMomentumRes] = useState(null);
  const [momentumSubTab, setMomentumSubTab] = useState("profiles");

  const [heatMassIn, setHeatMassIn] = useState({
    wireRadius: 0.002,
    thermalConductivity: 15.0,
    heatGeneration: 2.0e7,
    surfaceTemp: 323.15,
    filmThickness: 0.001,
    diffusionCoeff: 1e-9,
    reactionConstant: 0.05,
    feedConcentration: 100.0,
    pdeType: "heat",
    domainLength: 0.1,
    diffusivity: 1e-5,
    initialValue: 298.15,
    leftBC: 373.15,
    rightBC: 298.15,
    pdeTime: 100.0
  });
  const [heatMassRes, setHeatMassRes] = useState(null);
  const [heatMassSubTab, setHeatMassSubTab] = useState("heat");

  const [coupledSolversIn, setCoupledSolversIn] = useState({
    pelletRadius: 0.005,
    effDiffusivity: 1e-6,
    effConductivity: 0.2,
    reactionEnthalpy: 8e4,
    arrheniusPreExp: 1.2e8,
    activationEnergy: 6e4,
    surfaceConcentration: 20.0,
    surfaceTemp: 350.0,
    airTemp: 323.15,
    airHumidity: 0.015,
    totalPressure: 101325,
    k1: 0.5,
    k2: 0.2,
    initA: 1.0,
    odeTime: 10.0
  });
  const [coupledSolversRes, setCoupledSolversRes] = useState(null);
  const [coupledSolversSubTab, setCoupledSolversSubTab] = useState("coupled");

  const [historyRes, setHistoryRes] = useState([]);

  const defaults = {
    plume: { stackHeight: 50, emissionRate: 100, windSpeed: 5, stability: "D" },
    heatexchanger: { th_in: 150, th_out: 90, tc_in: 25, tc_out: 70, u_val: 500, area: 75 },
    pipeflow: { diameter: 0.2, length: 100, roughness: 0.00005, velocity: 2, density: 998, viscosity: 0.001 },
    cstr: { flowRate: 12, targetConversion: 0.75, rateConstant: 1.5 },
    flash: { z: 0.5, alpha: 2.2, vaporFraction: 0.4 },
    ergun: { L: 3, Dp: 0.005, epsilon: 0.4, v: 0.3, rho: 950, mu: 0.002 },
    fenske: { alpha: 2.5, xD: 0.95, xB: 0.05 },
    pid: { Kp: 1.2, tau_p: 6, theta: 1.2 },
    transferfunction: { processGain: 2.0, tau1: 4.0, tau2: 1.5, deadTime: 0.8 },
    laplace: { signalType: "step", amplitude: 1.0, decay: 1.0, omega: 1.0, sValue: 1.0, tValue: 1.0 },
    dynamicresponse: { processGain: 2.0, tau: 6.0, deadTime: 1.0, stepSize: 1.0, horizon: 40 },
    firstorder: { processGain: 1.6, tau: 5.0, stepSize: 1.0, horizon: 30 },
    secondorder: { processGain: 1.0, zeta: 0.4, wn: 0.8, stepSize: 1.0, horizon: 40 },
    controllertuning: { processGain: 1.5, tau: 8.0, theta: 1.2, ku: 2.4, pu: 4.0, lambda: 5.0 },
    stabilityanalysis: { a3: 1, a2: 6, a1: 11, a0: 6 },
    rootlocus: { tau1: 4.0, tau2: 1.8, selectedK: 2.0, kMax: 20 },
    bodeplots: { processGain: 2.0, tau1: 4.0, tau2: 1.5, wMin: 0.01, wMax: 10, points: 40 },
    frequencyresponse: { processGain: 2.0, tau: 5.0, omega: 0.4, inputAmplitude: 1.0 },
    pidcalculations: { kc: 1.8, ti: 3.5, td: 0.8, setPoint: 60, pv: 55, prevError: 4.5, integral: 20, dt: 1, bias: 0, outputMin: 0, outputMax: 100 },
    hydrostatics: { fluidDensity: 1000, height: 2, patm: 101325, plateWidth: 1, plateHeight: 2, plateDepthCentroid: 3, manometerFluidDensity: 13600, manometerDeflection: 0.1, submergedVolume: 10, waterplaneI: 12, bgDistance: 0.5 },
    flowmeters: { pipeDiameter: 0.1, throatDiameter: 0.05, fluidDensity: 1000, deltaP: 50000, dischargeCoeffVenturi: 0.98, dischargeCoeffOrifice: 0.61, dischargeCoeffPitot: 1.0, rotameterFloatVolume: 1e-5, rotameterFloatDensity: 7800, rotameterFloatArea: 1e-4, rotameterAnnularArea: 5e-5, rotameterDischargeCoeff: 0.6 },
    pipehydraulics: { diameter: 0.1, length: 50, velocity: 1.5, density: 1000, viscosity: 0.001, roughness: 0.000045 },
    pumps: { flowRate: 0.05, head: 30, density: 1000, efficiency: 0.75, suctionPressure: 101325, vaporPressure: 2340, suctionLosses: 5000, elevationDifference: 2, npshRequired: 4 },
    dragsettling: { particleDiameter: 0.0005, particleDensity: 2500, fluidDensity: 1000, fluidViscosity: 0.001 },
    cycles: { n: 1, t1: 300, t2: 450, v1: 0.02, v2: 0.04, p1: 100000, cv: 20.8, cp: 29.1, th: 600, tc: 300, cycleType: "isothermal" },
    eos: { t: 350, p: 1500000, tc: 369.8, pc: 4250000, omega: 0.152, mockPsatAtTr07: 425000 },
    thermochem: { temp: 500 },
    fugacity: { t: 350, p: 1500000, tc: 369.8, pc: 4250000 },
    equilibrium: { temp: 350, x1: 0.4, a12: 1.2, a21: 0.8, p1Sat: 120000, p2Sat: 70000, deltaG298: -10000, deltaH298: -20000, modelType: "margules" },
    conduction: { k: 0.5, thick: 0.1, t1: 100, t2: 25, kIns: 0.04, hExt: 10, r1: 0.05, r2: 0.08, kWall: 15, len: 10 },
    convection: { fluidDensity: 998, velocity: 2, viscosity: 0.001, length: 1, cp: 4184, kFluid: 0.6, tempWall: 80, tempFluid: 20, finDiam: 0.01, finLen: 0.1, finK: 200, hConvection: 50 },
    radiation: { temp1: 800, temp2: 300, eps1: 0.8, eps2: 0.6, tempSat: 373.15, tempWall: 390, hfg: 2256000, rhoL: 958, rhoV: 0.6, muL: 0.00028, kL: 0.68, cpL: 4220, sigmaBoil: 0.0589, csf: 0.013, boilingPr: 1.75 },
    evaporator: { feedRate: 10, xF: 0.1, xL: 0.4, tF: 320, tSatSteam: 393, pEvap: 20000, uVal1: 2000, hfgSteam: 2200000, cpFeed: 4000 },
    mccabe: { alpha: 2.5, xD: 0.95, xB: 0.05, xF: 0.5, qVal: 1.0, refluxRatio: 2.0 },
    rachford: { z1: 0.4, z2: 0.3, z3: 0.2, z4: 0.1, k1: 2.5, k2: 1.2, k3: 0.5, k4: 0.1 },
    pfr: { flowRate: 0.05, ca0: 2.0, targetConversion: 0.8, rateConstant: 0.1, reactionOrder: 1 },
    nonisothermal: { flowRate: 1.5, ca0: 1500, targetConversion: 0.65, t0: 350, k0: 8000000, ea: 70000, deltaH: -60000, rhoCp: 3500000 },
    catalytic: { flowRate: 1.2, ca0: 1200, targetConversion: 0.75, kPrime: 0.35, bedBulkDensity: 650 },
    effectiveness: { pelletRadius: 0.0015, intrinsicRateConstant: 0.8, effectiveDiffusivity: 2e-7 },
    diffusionreaction: { halfThickness: 0.001, effectiveDiffusivity: 2e-7, rateConstant: 0.6, surfaceConcentration: 1.5 },
    packedbedreactor: { bedLength: 3.0, bedDiameter: 0.9, particleDiameter: 0.004, voidFraction: 0.42, superficialVelocity: 0.35, fluidDensity: 850, fluidViscosity: 0.002, particleDensity: 1600, flowRate: 1.2, ca0: 1200, targetConversion: 0.75, kPrime: 0.35 },
    fluidizedbed: { particleDiameter: 0.00045, sphericity: 0.9, epsilonMf: 0.45, fluidDensity: 1.2, particleDensity: 1400, fluidViscosity: 1.9e-5, superficialVelocity: 0.22, initialBedHeight: 1.4 },
    rtd: { meanResidenceTime: 80, tanksInSeries: 3, horizonMultiplier: 5 },
    reactoroptimization: { flowRate: 1.2, ca0: 1200, rateConstant: 0.6, productValue: 0.12, reactorCostRate: 15, conversionMin: 0.2, conversionMax: 0.95 },
    diffusion: { t: 298.15, p: 101325, ma: 18, mb: 29, sumVa: 12.7, sumVb: 20.1, z: 0.01, pa1: 5000, pa2: 1000, delta: 0.001, kg: 1e-4, kl: 1e-4, m: 1.2 },
    absorption: { gRate: 10, y1: 0.05, y2: 0.005, x2: 0.0, m: 1.2, fSolvent: 1.4, efficiency: 0.7, htu: 0.6 },
    drying: { drySolidMass: 50, area: 2.0, xInitial: 0.25, xCritical: 0.12, xEquilibrium: 0.02, xFinal: 0.04, rc: 1.5 },
    economics: {
      deliveredEquipmentCost: 100000,
      langFactor: 4.0,
      workingCapitalPercent: 15,
      costIndexPast: 300,
      costIndexPresent: 600,
      scalingExponent: 0.6,
      referenceCapacity: 100,
      desiredCapacity: 250,
      principal: 100000,
      nominalRate: 0.08,
      interestPeriods: 12,
      years: 10,
      annuityPayment: 15000,
      salvageValue: 10000,
      capitalizedCostInterest: 0.06,
      taxRate: 0.02,
      annualRevenue: 120000,
      annualOperatingCost: 60000,
      incomeTaxRate: 0.30,
      fixedCost: 30000,
      sellingPricePerUnit: 15,
      variableCostPerUnit: 6
    },
    distillation_design: {
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
    },
    extraction_leaching: {
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
    },
    adsorption: {
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
    },
    humidification: {
      dryBulbTemp: 30.0,
      relativeHumidity: 60.0,
      totalPressure: 101325,
      waterInletTemp: 40.0,
      waterOutletTemp: 28.0,
      airInletWetBulb: 24.0,
      liquidGasRatio: 1.2,
      overallHTU: 1.5
    },
    momentum_transport: {
      flowSystem: "pipe",
      dimension: 0.05,
      length: 10.0,
      pressureDrop: 100.0,
      viscosity: 0.001,
      density: 1000.0,
      plateDistance: 1.0,
      freeStreamVelocity: 2.0
    },
    heat_mass_transport: {
      wireRadius: 0.002,
      thermalConductivity: 15.0,
      heatGeneration: 2.0e7,
      surfaceTemp: 323.15,
      filmThickness: 0.001,
      diffusionCoeff: 1e-9,
      reactionConstant: 0.05,
      feedConcentration: 100.0,
      pdeType: "heat",
      domainLength: 0.1,
      diffusivity: 1e-5,
      initialValue: 298.15,
      leftBC: 373.15,
      rightBC: 298.15,
      pdeTime: 100.0
    },
    coupled_transport_solvers: {
      pelletRadius: 0.005,
      effDiffusivity: 1e-6,
      effConductivity: 0.2,
      reactionEnthalpy: 8e4,
      arrheniusPreExp: 1.2e8,
      activationEnergy: 6e4,
      surfaceConcentration: 20.0,
      surfaceTemp: 350.0,
      airTemp: 323.15,
      airHumidity: 0.015,
      totalPressure: 101325,
      k1: 0.5,
      k2: 0.2,
      initA: 1.0,
      odeTime: 10.0
    }
  };

  const addXp = () => { setXp((prev) => { const next = prev + 15; localStorage.setItem("cpss1_xp", next); return next; }); };
  const getRank = (currentXp) => {
    if (currentXp < 50) return { title: "Freshman", color: "text-zinc-500" };
    if (currentXp < 150) return { title: "Sophomore", color: "text-teal-400/80" };
    if (currentXp < 300) return { title: "Junior Engineer", color: "text-emerald-400/80" };
    if (currentXp < 600) return { title: "Senior Engineer", color: "text-cyan-400/80" };
    if (currentXp < 1200) return { title: "Process Manager", color: "text-green-400/80" };
    return { title: "Chief Engineer", color: "text-amber-400/80" };
  };
  const rank = getRank(xp);
  const nextRankXp = xp < 50 ? 50 : xp < 150 ? 150 : xp < 300 ? 300 : xp < 600 ? 600 : xp < 1200 ? 1200 : xp;
  const progressPercent = xp >= 1200 ? 100 : Math.min(100, (xp / nextRankXp) * 100);

  // Scroll-linked animation for dashboard
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.03]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.85]);

  // Accent color for the XP bar
  const xpBarColor = "bg-gradient-to-r from-emerald-500/60 to-teal-400/60";

  const filteredHistory = useMemo(() => {
    if (!historyFilter.trim()) return historyRes;
    const q = historyFilter.toLowerCase();
    return historyRes.filter((item) => String(item.moduleType || "").toLowerCase().includes(q) || JSON.stringify(item.inputs || {}).toLowerCase().includes(q) || JSON.stringify(item.results || {}).toLowerCase().includes(q));
  }, [historyRes, historyFilter]);

  const ergunCurve = useMemo(() => {
    if (!ergunRes) return [];
    const points = [];
    for (let v = 0; v <= 1.0; v += 0.05) { const local = calcErgun({ ...ergunIn, v }); points.push({ velocity: Number(v.toFixed(2)), pressureGradient: local.dP_dL }); }
    return points;
  }, [ergunRes, ergunIn]);

  const diffusionCurve = useMemo(() => {
    if (!diffusionRes) return [];
    const points = [];
    const steps = 20;
    const zTotal = num(diffusionIn.z, 0.01) * 1000;
    const p = num(diffusionIn.p, 101325);
    const pa1 = num(diffusionIn.pa1, 5000);
    const pa2 = num(diffusionIn.pa2, 1000);
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const zVal = frac * zTotal;
      const paEmd = pa1 - (pa1 - pa2) * frac;
      const paUmd = p - (p - pa1) * Math.pow(Math.max((p - pa2) / Math.max(p - pa1, 1e-9), 1e-9), frac);
      points.push({ z: Number(zVal.toFixed(2)), paEmd, paUmd });
    }
    return points;
  }, [diffusionRes, diffusionIn]);

  const plumeWarnings = useMemo(() => { const w = []; if (num(plumeIn.windSpeed) < 0.5) w.push("Very low wind speed can overpredict centerline concentration."); if (num(plumeIn.stackHeight) < 10) w.push("Stack height below 10 m may violate effective plume rise assumptions."); if (!["A","B","C","D","E","F"].includes(String(plumeIn.stability).toUpperCase())) w.push("Stability class should be between A and F."); return w; }, [plumeIn]);
  const hxWarnings = useMemo(() => { const w = []; if (num(hxIn.th_in) <= num(hxIn.th_out)) w.push("Hot stream inlet should be higher than hot outlet."); if (num(hxIn.tc_out) <= num(hxIn.tc_in)) w.push("Cold stream outlet should be higher than cold inlet."); if (num(hxIn.u_val) < 50 || num(hxIn.u_val) > 3000) w.push("U value appears outside common range."); return w; }, [hxIn]);
  const pipeWarnings = useMemo(() => { const w = []; const re = (num(pipeIn.density)*num(pipeIn.velocity)*num(pipeIn.diameter))/Math.max(num(pipeIn.viscosity),1e-12); if (re < 2300) w.push("Flow is laminar; Swamee-Jain is mainly for turbulent regime."); if (num(pipeIn.velocity) > 5) w.push("Velocity above 5 m/s may cause erosion."); if (num(pipeIn.roughness) > num(pipeIn.diameter)/20) w.push("Roughness to diameter ratio is unusually high."); return w; }, [pipeIn]);
  const cstrWarnings = useMemo(() => { const w = []; if (num(cstrIn.targetConversion) >= 0.95) w.push("Very high conversion may require very large volume."); if (num(cstrIn.rateConstant) <= 0) w.push("Rate constant must be positive."); return w; }, [cstrIn]);
  const flashWarnings = useMemo(() => { const w = []; if (num(flashIn.alpha) <= 1) w.push("Relative volatility near 1 implies poor separation."); if (num(flashIn.vaporFraction) < 0 || num(flashIn.vaporFraction) > 1) w.push("Vapor fraction should be between 0 and 1."); if (num(flashIn.z) < 0 || num(flashIn.z) > 1) w.push("Feed composition z should be between 0 and 1."); return w; }, [flashIn]);
  const ergunWarnings = useMemo(() => { const w = []; if (num(ergunIn.epsilon) < 0.3 || num(ergunIn.epsilon) > 0.6) w.push("Void fraction outside typical range (0.3-0.6)."); if (num(ergunIn.v) > 1.5) w.push("High velocity can induce fluidization risk."); if (num(ergunIn.Dp) <= 0) w.push("Particle diameter must be positive."); return w; }, [ergunIn]);
  const fenskeWarnings = useMemo(() => { const w = []; if (num(fenskeIn.alpha) <= 1.1) w.push("Low relative volatility indicates difficult distillation."); if (num(fenskeIn.xD) <= num(fenskeIn.xB)) w.push("Distillate purity should exceed bottoms impurity."); return w; }, [fenskeIn]);
  const pidWarnings = useMemo(() => { const w = []; if (num(pidIn.theta) <= 0) w.push("Dead time must be positive."); if (num(pidIn.theta)/Math.max(num(pidIn.tau_p),1e-9) > 1) w.push("High dead-time ratio may require conservative tuning."); if (num(pidIn.Kp) === 0) w.push("Process gain cannot be zero."); return w; }, [pidIn]);
  const transferFunctionWarnings = useMemo(() => { const w = []; if (num(transferFunctionIn.tau1) <= 0 || num(transferFunctionIn.tau2) <= 0) w.push("All time constants must be positive."); if (num(transferFunctionIn.deadTime) < 0) w.push("Dead time cannot be negative."); return w; }, [transferFunctionIn]);
  const laplaceWarnings = useMemo(() => { const w = []; if (num(laplaceIn.sValue) <= 0) w.push("s-value for numeric evaluation must be positive."); if (String(laplaceIn.signalType || "").toLowerCase() === "exponential" && num(laplaceIn.decay) <= 0) w.push("Exponential decay constant should be positive."); return w; }, [laplaceIn]);
  const dynamicResponseWarnings = useMemo(() => { const w = []; if (num(dynamicResponseIn.tau) <= 0) w.push("Time constant must be positive."); if (num(dynamicResponseIn.horizon) <= num(dynamicResponseIn.deadTime)) w.push("Simulation horizon should exceed dead time."); return w; }, [dynamicResponseIn]);
  const firstOrderWarnings = useMemo(() => { const w = []; if (num(firstOrderIn.tau) <= 0) w.push("Time constant must be positive."); if (num(firstOrderIn.horizon) <= 0) w.push("Horizon must be positive."); return w; }, [firstOrderIn]);
  const secondOrderWarnings = useMemo(() => { const w = []; if (num(secondOrderIn.zeta) <= 0) w.push("Damping ratio must be positive."); if (num(secondOrderIn.wn) <= 0) w.push("Natural frequency must be positive."); return w; }, [secondOrderIn]);
  const controllerTuningWarnings = useMemo(() => { const w = []; if (num(controllerTuningIn.ku) <= 0 || num(controllerTuningIn.pu) <= 0) w.push("Ku and Pu must be positive."); if (num(controllerTuningIn.lambda) <= 0) w.push("IMC lambda must be positive."); return w; }, [controllerTuningIn]);
  const stabilityAnalysisWarnings = useMemo(() => { const w = []; if (num(stabilityAnalysisIn.a3) === 0) w.push("Leading coefficient a3 cannot be zero."); if ([stabilityAnalysisIn.a3, stabilityAnalysisIn.a2, stabilityAnalysisIn.a1, stabilityAnalysisIn.a0].some((v) => !Number.isFinite(Number(v)))) w.push("All polynomial coefficients must be numeric."); return w; }, [stabilityAnalysisIn]);
  const rootLocusWarnings = useMemo(() => { const w = []; if (num(rootLocusIn.tau1) <= 0 || num(rootLocusIn.tau2) <= 0) w.push("Time constants must be positive."); if (num(rootLocusIn.kMax) <= 0) w.push("Maximum gain sweep should be positive."); return w; }, [rootLocusIn]);
  const bodePlotsWarnings = useMemo(() => { const w = []; if (num(bodePlotsIn.wMin) <= 0 || num(bodePlotsIn.wMax) <= 0) w.push("Frequencies must be positive."); if (num(bodePlotsIn.wMin) >= num(bodePlotsIn.wMax)) w.push("wMin must be lower than wMax."); return w; }, [bodePlotsIn]);
  const frequencyResponseWarnings = useMemo(() => { const w = []; if (num(frequencyResponseIn.tau) <= 0) w.push("Time constant must be positive."); if (num(frequencyResponseIn.omega) <= 0) w.push("Forcing frequency must be positive."); return w; }, [frequencyResponseIn]);
  const pidCalculationsWarnings = useMemo(() => { const w = []; if (num(pidCalculationsIn.ti) <= 0) w.push("Integral time Ti must be positive."); if (num(pidCalculationsIn.dt) <= 0) w.push("Controller sample time dt must be positive."); if (num(pidCalculationsIn.outputMin) >= num(pidCalculationsIn.outputMax)) w.push("Output min must be less than output max."); return w; }, [pidCalculationsIn]);
  const hydrostaticsWarnings = useMemo(() => { const w = []; if (num(hydrostaticsIn.fluidDensity) <= 0) w.push("Fluid density must be positive."); if (num(hydrostaticsIn.height) <= 0) w.push("Height must be positive."); if (num(hydrostaticsIn.manometerFluidDensity) <= num(hydrostaticsIn.fluidDensity)) w.push("Manometer fluid density should typically exceed process fluid density."); return w; }, [hydrostaticsIn]);
  const flowmetersWarnings = useMemo(() => { const w = []; if (num(flowmetersIn.throatDiameter) >= num(flowmetersIn.pipeDiameter)) w.push("Throat diameter must be strictly less than pipe diameter."); if (num(flowmetersIn.pipeDiameter) <= 0 || num(flowmetersIn.throatDiameter) <= 0) w.push("Diameters must be positive."); return w; }, [flowmetersIn]);
  const pipehydraulicsWarnings = useMemo(() => { const w = []; const re = (num(pipehydraulicsIn.density)*num(pipehydraulicsIn.velocity)*num(pipehydraulicsIn.diameter))/Math.max(num(pipehydraulicsIn.viscosity),1e-12); if (re < 0) w.push("Reynolds number cannot be negative."); if (re >= 2100 && re <= 4000) w.push("Flow is in critical transition regime. Calculations might be unstable."); return w; }, [pipehydraulicsIn]);
  const pumpsWarnings = useMemo(() => { const w = []; if (num(pumpsIn.efficiency) <= 0 || num(pumpsIn.efficiency) > 1) w.push("Efficiency must be between 0 and 1."); if (num(pumpsIn.npshRequired) <= 0) w.push("NPSH required must be positive."); return w; }, [pumpsIn]);
  const dragsettlingWarnings = useMemo(() => { const w = []; if (num(dragsettlingIn.particleDensity) <= num(dragsettlingIn.fluidDensity)) w.push("Particle density must exceed fluid density for settling to occur."); if (num(dragsettlingIn.particleDiameter) <= 0) w.push("Particle diameter must be positive."); return w; }, [dragsettlingIn]);
  const cyclesWarnings = useMemo(() => { const w = []; if (num(cyclesIn.n) <= 0) w.push("Mole count must be positive."); if (num(cyclesIn.t1) <= 0 || num(cyclesIn.t2) <= 0) w.push("Temperatures must be positive."); return w; }, [cyclesIn]);
  const eosWarnings = useMemo(() => { const w = []; if (num(eosIn.tc) <= 0 || num(eosIn.pc) <= 0) w.push("Critical properties must be positive."); if (num(eosIn.t) <= 0 || num(eosIn.p) <= 0) w.push("Temperature and pressure must be positive."); return w; }, [eosIn]);
  const thermochemWarnings = useMemo(() => { const w = []; if (num(thermochemIn.temp) <= 0) w.push("Temperature must be positive."); return w; }, [thermochemIn]);
  const fugacityWarnings = useMemo(() => { const w = []; if (num(fugacityIn.tc) <= 0 || num(fugacityIn.pc) <= 0) w.push("Critical constants must be positive."); if (num(fugacityIn.t) <= 0 || num(fugacityIn.p) <= 0) w.push("Temperature and pressure must be positive."); return w; }, [fugacityIn]);
  const equilibriumWarnings = useMemo(() => { const w = []; if (num(equilibriumIn.x1) < 0 || num(equilibriumIn.x1) > 1) w.push("Mole fraction x1 must be between 0 and 1."); if (num(equilibriumIn.temp) <= 0) w.push("Temperature must be positive."); return w; }, [equilibriumIn]);
  const conductionWarnings = useMemo(() => { const w = []; if (num(conductionIn.k) <= 0 || num(conductionIn.kWall) <= 0 || num(conductionIn.kIns) <= 0) w.push("Thermal conductivities must be positive."); if (num(conductionIn.r2) <= num(conductionIn.r1)) w.push("Outer radius must exceed inner radius."); return w; }, [conductionIn]);
  const convectionWarnings = useMemo(() => { const w = []; if (num(convectionIn.velocity) < 0) w.push("Velocity cannot be negative."); if (num(convectionIn.fluidDensity) <= 0 || num(convectionIn.viscosity) <= 0) w.push("Fluid physical properties must be positive."); return w; }, [convectionIn]);
  const radiationWarnings = useMemo(() => { const w = []; if (num(radiationIn.temp1) <= 0 || num(radiationIn.temp2) <= 0) w.push("Absolute temperatures must be positive."); if (num(radiationIn.eps1) <= 0 || num(radiationIn.eps1) > 1 || num(radiationIn.eps2) <= 0 || num(radiationIn.eps2) > 1) w.push("Surface emissivities must be between 0 and 1."); return w; }, [radiationIn]);
  const evaporatorWarnings = useMemo(() => { const w = []; if (num(evaporatorIn.feedRate) <= 0) w.push("Feed rate must be positive."); if (num(evaporatorIn.xL) <= num(evaporatorIn.xF)) w.push("Product concentration (xL) must exceed feed concentration (xF)."); return w; }, [evaporatorIn]);
  const mccabeWarnings = useMemo(() => { const w = []; if (num(mccabeIn.alpha) <= 1.0) w.push("Relative volatility must be greater than 1.0 for separation."); if (num(mccabeIn.xD) <= num(mccabeIn.xB)) w.push("Distillate purity must exceed bottoms composition."); return w; }, [mccabeIn]);
  const rachfordWarnings = useMemo(() => { const w = []; const sumZ = num(rachfordIn.z1) + num(rachfordIn.z2) + num(rachfordIn.z3) + num(rachfordIn.z4); if (Math.abs(sumZ - 1.0) > 0.05) w.push("Feed compositions (z_i) should sum to approximately 1.0."); return w; }, [rachfordIn]);
  const pfrWarnings = useMemo(() => { const w = []; if (num(pfrIn.flowRate) <= 0 || num(pfrIn.ca0) <= 0) w.push("Flow rate and initial concentration must be positive."); if (num(pfrIn.targetConversion) <= 0 || num(pfrIn.targetConversion) >= 0.99) w.push("Target conversion must be between 0.0 and 0.99."); return w; }, [pfrIn]);
  const nonIsothermalWarnings = useMemo(() => { const w = []; if (num(nonIsothermalIn.targetConversion) <= 0 || num(nonIsothermalIn.targetConversion) >= 0.99) w.push("Target conversion should be between 0 and 0.99."); if (num(nonIsothermalIn.rhoCp) <= 0) w.push("Volumetric heat capacity must be positive."); if (num(nonIsothermalIn.ea) <= 0) w.push("Activation energy must be positive."); return w; }, [nonIsothermalIn]);
  const catalyticWarnings = useMemo(() => { const w = []; if (num(catalyticIn.kPrime) <= 0) w.push("Catalyst rate constant kPrime must be positive."); if (num(catalyticIn.targetConversion) <= 0 || num(catalyticIn.targetConversion) >= 0.99) w.push("Target conversion should be between 0 and 0.99."); if (num(catalyticIn.bedBulkDensity) <= 0) w.push("Bed bulk density must be positive."); return w; }, [catalyticIn]);
  const effectivenessWarnings = useMemo(() => { const w = []; if (num(effectivenessIn.pelletRadius) <= 0) w.push("Pellet radius must be positive."); if (num(effectivenessIn.effectiveDiffusivity) <= 0) w.push("Effective diffusivity must be positive."); if (num(effectivenessIn.intrinsicRateConstant) <= 0) w.push("Intrinsic rate constant must be positive."); return w; }, [effectivenessIn]);
  const diffusionReactionWarnings = useMemo(() => { const w = []; if (num(diffusionReactionIn.halfThickness) <= 0) w.push("Characteristic diffusion length must be positive."); if (num(diffusionReactionIn.effectiveDiffusivity) <= 0) w.push("Effective diffusivity must be positive."); if (num(diffusionReactionIn.surfaceConcentration) < 0) w.push("Surface concentration must be non-negative."); return w; }, [diffusionReactionIn]);
  const packedBedReactorWarnings = useMemo(() => { const w = []; if (num(packedBedReactorIn.voidFraction) <= 0.2 || num(packedBedReactorIn.voidFraction) >= 0.8) w.push("Void fraction is outside common packed-bed ranges."); if (num(packedBedReactorIn.particleDiameter) <= 0) w.push("Particle diameter must be positive."); if (num(packedBedReactorIn.superficialVelocity) <= 0) w.push("Superficial velocity must be positive."); return w; }, [packedBedReactorIn]);
  const fluidizedBedWarnings = useMemo(() => { const w = []; if (num(fluidizedBedIn.particleDensity) <= num(fluidizedBedIn.fluidDensity)) w.push("Particle density must exceed fluid density for stable fluidization modeling."); if (num(fluidizedBedIn.superficialVelocity) <= 0) w.push("Superficial velocity must be positive."); if (num(fluidizedBedIn.epsilonMf) <= 0.2 || num(fluidizedBedIn.epsilonMf) >= 0.8) w.push("Minimum fluidization voidage should usually be between 0.2 and 0.8."); return w; }, [fluidizedBedIn]);
  const rtdWarnings = useMemo(() => { const w = []; if (num(rtdIn.meanResidenceTime) <= 0) w.push("Mean residence time must be positive."); if (num(rtdIn.tanksInSeries) < 1) w.push("Tanks in series must be at least 1."); if (num(rtdIn.horizonMultiplier) < 2) w.push("Use horizon multiplier >= 2 for complete RTD capture."); return w; }, [rtdIn]);
  const reactorOptimizationWarnings = useMemo(() => { const w = []; if (num(reactorOptimizationIn.conversionMin) >= num(reactorOptimizationIn.conversionMax)) w.push("Minimum conversion must be less than maximum conversion."); if (num(reactorOptimizationIn.rateConstant) <= 0) w.push("Rate constant must be positive."); if (num(reactorOptimizationIn.flowRate) <= 0 || num(reactorOptimizationIn.ca0) <= 0) w.push("Flow rate and feed concentration must be positive."); return w; }, [reactorOptimizationIn]);
  const diffusionWarnings = useMemo(() => { const w = []; if (num(diffusionIn.z) <= 0) w.push("Diffusion path length (z) must be positive."); if (num(diffusionIn.pa1) < num(diffusionIn.pa2)) w.push("Point 1 partial pressure should exceed Point 2 to drive diffusion."); if (num(diffusionIn.p) < num(diffusionIn.pa1)) w.push("Total pressure (P) must exceed solute partial pressure."); return w; }, [diffusionIn]);
  const absorptionWarnings = useMemo(() => { const w = []; if (num(absorptionIn.y1) <= num(absorptionIn.y2)) w.push("Inlet gas mole fraction must exceed outlet gas fraction."); const x1Star = num(absorptionIn.y1) / Math.max(num(absorptionIn.m), 1e-9); if (num(absorptionIn.x2) >= x1Star) w.push("Inlet solvent composition is too high, preventing driving force."); const minLOverV = (num(absorptionIn.y1) - num(absorptionIn.y2)) / Math.max(x1Star - num(absorptionIn.x2), 1e-9); const lMin = num(absorptionIn.gRate) * minLOverV; const lOper = lMin * num(absorptionIn.fSolvent); const A = lOper / Math.max(num(absorptionIn.m) * num(absorptionIn.gRate), 1e-9); if (A < 1) w.push("Absorption factor A is less than 1. Solvent rate is likely too low for complete recovery."); return w; }, [absorptionIn]);
  const dryingWarnings = useMemo(() => { const w = []; if (num(dryingIn.xInitial) <= num(dryingIn.xFinal)) w.push("Initial moisture content must exceed target final moisture."); if (num(dryingIn.xFinal) <= num(dryingIn.xEquilibrium)) w.push("Cannot dry below the equilibrium moisture content (physical limit)."); if (num(dryingIn.xCritical) <= num(dryingIn.xEquilibrium)) w.push("Critical moisture content must exceed equilibrium moisture content."); return w; }, [dryingIn]);
  const economicsWarnings = useMemo(() => {
    const w = [];
    if (num(economicsIn.deliveredEquipmentCost) <= 0) w.push("Delivered equipment cost must be positive.");
    if (num(economicsIn.langFactor) < 1.0) w.push("Lang factor must be at least 1.0.");
    if (num(economicsIn.workingCapitalPercent) < 0) w.push("Working capital percentage must be non-negative.");
    if (num(economicsIn.principal) <= 0) w.push("Principal asset value must be positive.");
    if (num(economicsIn.nominalRate) <= 0) w.push("Nominal interest rate must be positive.");
    if (num(economicsIn.interestPeriods) < 1) w.push("Compounding periods per year must be at least 1.");
    if (num(economicsIn.years) < 1) w.push("Asset lifetime (years) must be at least 1.");
    if (num(economicsIn.salvageValue) < 0) w.push("Salvage value must be non-negative.");
    if (num(economicsIn.salvageValue) >= num(economicsIn.principal)) w.push("Salvage value cannot exceed the principal asset value.");
    if (num(economicsIn.sellingPricePerUnit) <= num(economicsIn.variableCostPerUnit)) w.push("Selling price per unit must exceed variable cost per unit to achieve break-even.");
    if (num(economicsIn.referenceCapacity) <= 0) w.push("Reference equipment capacity must be positive.");
    if (num(economicsIn.desiredCapacity) <= 0) w.push("Desired equipment capacity must be positive.");
    return w;
  }, [economicsIn]);

  const distillationDesignWarnings = useMemo(() => {
    const w = [];
    if (num(distillationDesignIn.alpha) <= 1.0) w.push("Relative volatility (alpha) must be greater than 1.0.");
    if (num(distillationDesignIn.xD) <= num(distillationDesignIn.xB)) w.push("Distillate purity xD must exceed bottoms concentration xB.");
    if (num(distillationDesignIn.xF) <= num(distillationDesignIn.xB) || num(distillationDesignIn.xF) >= num(distillationDesignIn.xD)) w.push("Feed composition xF must lie between xB and xD.");
    if (num(distillationDesignIn.murphreeEfficiency) <= 0 || num(distillationDesignIn.murphreeEfficiency) > 1.0) w.push("Murphree efficiency must be between 0.0 and 1.0.");
    if (num(distillationDesignIn.vaporFlowRate) <= 0) w.push("Vapor flow rate must be positive.");
    if (num(distillationDesignIn.liquidFlowRate) <= 0) w.push("Liquid flow rate must be positive.");
    return w;
  }, [distillationDesignIn]);

  const extractionLeachingWarnings = useMemo(() => {
    const w = [];
    if (num(extractionLeachingIn.xF) <= num(extractionLeachingIn.targetRaffinate)) w.push("Feed concentration xF must exceed target raffinate concentration.");
    if (num(extractionLeachingIn.partitionCoefficient) <= 0) w.push("Partition coefficient must be positive.");
    if (num(extractionLeachingIn.feedRate) <= 0 || num(extractionLeachingIn.solventRate) <= 0) w.push("Rates must be positive.");
    if (num(extractionLeachingIn.solventRetention) < 0) w.push("Solvent retention in leaching must be non-negative.");
    if (num(extractionLeachingIn.leachingTargetRecovery) <= 0 || num(extractionLeachingIn.leachingTargetRecovery) >= 1.0) w.push("Target leaching recovery must be between 0.0 and 1.0.");
    return w;
  }, [extractionLeachingIn]);

  const adsorptionWarnings = useMemo(() => {
    const w = [];
    if (num(adsorptionIn.feedConcentration) <= 0) w.push("Feed concentration must be positive.");
    if (num(adsorptionIn.bedLength) <= 0 || num(adsorptionIn.bedDiameter) <= 0) w.push("Bed dimensions must be positive.");
    if (num(adsorptionIn.bedVoidage) <= 0 || num(adsorptionIn.bedVoidage) >= 1.0) w.push("Bed voidage must be between 0.0 and 1.0.");
    if (num(adsorptionIn.breakthroughRatio) <= 0 || num(adsorptionIn.breakthroughRatio) >= num(adsorptionIn.saturationRatio)) w.push("Breakthrough ratio must be positive and less than saturation ratio.");
    return w;
  }, [adsorptionIn]);

  const humidificationWarnings = useMemo(() => {
    const w = [];
    if (num(humidificationIn.relativeHumidity) < 0 || num(humidificationIn.relativeHumidity) > 100) w.push("Relative humidity must be between 0% and 100%.");
    if (num(humidificationIn.dryBulbTemp) <= 0) w.push("Dry bulb temperature must be positive.");
    if (num(humidificationIn.waterInletTemp) <= num(humidificationIn.waterOutletTemp)) w.push("Water inlet temperature must exceed outlet temperature.");
    if (num(humidificationIn.airInletWetBulb) >= num(humidificationIn.waterOutletTemp)) w.push("Inlet wet bulb temperature must be lower than outlet water temperature (cooling limit).");
    return w;
  }, [humidificationIn]);

  const momentumWarnings = useMemo(() => {
    const w = [];
    if (num(momentumIn.dimension) <= 0) w.push("Flow system boundary dimension must be positive.");
    if (num(momentumIn.length) <= 0) w.push("Flow channel length must be positive.");
    if (num(momentumIn.pressureDrop) <= 0) w.push("Pressure drop must be positive to drive flow.");
    if (num(momentumIn.viscosity) <= 0 || num(momentumIn.density) <= 0) w.push("Fluid physical properties must be positive.");
    if (num(momentumIn.plateDistance) <= 0) w.push("Plate distance x from leading edge must be positive.");
    if (num(momentumIn.freeStreamVelocity) <= 0) w.push("Free stream velocity must be positive.");
    return w;
  }, [momentumIn]);

  const heatMassWarnings = useMemo(() => {
    const w = [];
    if (num(heatMassIn.wireRadius) <= 0) w.push("Wire radius must be positive.");
    if (num(heatMassIn.thermalConductivity) <= 0) w.push("Thermal conductivity must be positive.");
    if (num(heatMassIn.filmThickness) <= 0 || num(heatMassIn.diffusionCoeff) <= 0) w.push("Film parameters must be positive.");
    if (num(heatMassIn.domainLength) <= 0) w.push("PDE domain length must be positive.");
    if (num(heatMassIn.diffusivity) <= 0) w.push("Diffusivity must be positive.");
    if (num(heatMassIn.pdeTime) <= 0) w.push("PDE simulation time must be positive.");
    return w;
  }, [heatMassIn]);

  const coupledSolversWarnings = useMemo(() => {
    const w = [];
    if (num(coupledSolversIn.pelletRadius) <= 0) w.push("Pellet radius must be positive.");
    if (num(coupledSolversIn.effDiffusivity) <= 0 || num(coupledSolversIn.effConductivity) <= 0) w.push("Effective transport coefficients must be positive.");
    if (num(coupledSolversIn.surfaceConcentration) <= 0 || num(coupledSolversIn.surfaceTemp) <= 0) w.push("Boundary surface conditions must be positive.");
    if (num(coupledSolversIn.odeTime) <= 0) w.push("ODE integration duration must be positive.");
    return w;
  }, [coupledSolversIn]);

  async function applyIndianCityConditions() {
    setPlumeCityLoading(true); setPlumeCityError("");
    const userCity = String(plumeCity || "").trim(); const cityKey = userCity.toLowerCase(); const fallback = INDIAN_CITY_DEFAULTS[cityKey] || null;
    try {
      let lat = fallback?.lat; let lon = fallback?.lon; let resolvedName = fallback?.name || userCity;
      try { const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(userCity)}&country=India&format=json&limit=1`); const geo = await geoRes.json(); if (Array.isArray(geo) && geo.length > 0) { lat = num(geo[0].lat); lon = num(geo[0].lon); resolvedName = geo[0].display_name?.split(",")[0] || resolvedName; } } catch {}
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("City not found in Indian dataset.");
      let liveWind = fallback?.windSpeed ?? 3.0;
      try { const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m&timezone=auto`); const wx = await wxRes.json(); if (wx?.current?.wind_speed_10m !== undefined) liveWind = num(wx.current.wind_speed_10m); } catch {}
      const stability = inferStabilityFromWind(liveWind);
      setPlumeIn((p) => ({ ...p, windSpeed: Number(liveWind.toFixed(2)), stability, city: resolvedName, latitude: Number(lat.toFixed(4)), longitude: Number(lon.toFixed(4)) }));
      setPlumeCityMeta({ city: resolvedName, lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)), windSpeed: Number(liveWind.toFixed(2)), stability });
    } catch (err) { setPlumeCityError(err.message || "Could not load city atmospheric conditions."); } finally { setPlumeCityLoading(false); }
  }

  const saveAuth = (payload) => { localStorage.setItem("cpss1_token", payload.token); localStorage.setItem("cpss1_user", JSON.stringify(payload.user)); setToken(payload.token); setUser(payload.user); };
  const logout = () => { localStorage.removeItem("cpss1_token"); localStorage.removeItem("cpss1_user"); setToken(""); setUser(null); setHistoryRes([]); };
  const authSubmit = async (e) => {
    e.preventDefault(); setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authForm) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || "Authentication failed");
      saveAuth(data); setFallbackMode(false);
    } catch (err) { setAuthError(err.message || "Unable to authenticate."); }
  };

  async function simulate(endpoint, inputs, fallbackCalc, setResult) {
    setLoading(true); setFallbackMode(false);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(inputs) });
      if (res.status === 401) { logout(); throw new Error("Session expired."); }
      if (!res.ok) { const errPayload = await res.json().catch(() => ({})); throw new Error(errPayload.message || "Backend rejected request"); }
      const data = await res.json(); setResult(data); setLastRunAt(new Date().toLocaleTimeString()); addXp();
    } catch (err) { const local = fallbackCalc(inputs); setResult(local); setFallbackMode(true); setLastRunAt(new Date().toLocaleTimeString()); addXp(); } finally { setLoading(false); }
  }

  async function loadHistory() {
    setLoading(true);
    try { const res = await fetch(`${API_BASE}/api/history`, { headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) throw new Error(); const data = await res.json(); setHistoryRes(data); setFallbackMode(false); setLastRunAt(new Date().toLocaleTimeString()); } catch { setHistoryRes([]); setFallbackMode(true); } finally { setLoading(false); }
  }

  useEffect(() => { if (activeTab === "history" && token) loadHistory(); }, [activeTab, token]);
  useEffect(() => { let alive = true; const check = async () => { try { const res = await fetch(`${API_BASE}/api/health`); if (alive) setBackendOnline(res.ok); } catch { if (alive) setBackendOnline(false); } }; check(); const timer = setInterval(check, 15000); return () => { alive = false; clearInterval(timer); }; }, []);

  // ── Reusable buttons ──
  const SimButton = ({ onClick }) => (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 shadow-organic transition-all hover:shadow-organic-lg">
      {loading ? "Simulating..." : "Run Simulation"}
    </motion.button>
  );
  const ResetButton = ({ onClick }) => (
    <button onClick={onClick} className="ml-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300 transition-all">
      <span className="inline-flex items-center gap-1.5"><RotateCcw size={13} /> Reset</span>
    </button>
  );
  const ExportButton = ({ onClick, label = "Export CSV" }) => (
    <button onClick={onClick} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-300 transition-all inline-flex items-center gap-1.5">
      <Download size={13} /> {label}
    </button>
  );

  // ────── LOGIN SCREEN ──────
  if (!token) {
    return (
      <div className={`app-shell relative flex min-h-screen items-center justify-center overflow-hidden p-6 ${theme === "light" ? "theme-light" : "theme-dark"}`}>
        <MeshBackground />
        <button
          type="button"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          className="absolute right-6 top-6 z-20 rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-zinc-400 transition-all hover:bg-white/[0.08] hover:text-zinc-200"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springIn}
          className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-10"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">ChemE Process</h1>
            <h2 className="text-lg font-medium text-zinc-500 mt-0.5">Simulation Suite</h2>
            <p className="mt-3 text-sm text-zinc-600 leading-relaxed">Your simulation workspace for everyday process decisions.</p>
          </div>
          <form onSubmit={authSubmit} className="space-y-5">
            <Field label="Email" value={authForm.email} onChange={(v) => setAuthForm((p) => ({ ...p, email: v }))} type="email" />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Password</span>
              <div className="glass-input flex items-center gap-2 rounded-xl px-3 py-2.5">
                <input type={showPassword ? "text" : "password"} value={authForm.password} onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))} className="flex-1 bg-transparent text-sm text-white outline-none placeholder-zinc-600" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            {authError && <p className="text-xs font-medium text-red-400/80">{authError}</p>}
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-organic transition-all hover:shadow-organic-lg">
              {authMode === "login" ? "Sign In" : "Create Account"}
            </motion.button>
          </form>
          <button className="mt-5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors" onClick={() => setAuthMode((m) => (m === "login" ? "register" : "login"))}>
            {authMode === "login" ? "Need an account? Register" : "Already registered? Sign in"}
          </button>
        </motion.div>
      </div>
    );
  }

  // ────── MAIN APP ──────
  return (
    <div className={`app-shell relative min-h-screen overflow-hidden text-zinc-300 font-sans ${theme === "light" ? "theme-light" : "theme-dark"}`}>
      <MeshBackground />

      {/* ── Top Navigation ── */}
      <header className="relative z-50 flex items-center justify-between border-b border-white/[0.04] bg-black/40 px-8 py-3.5 backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-xs font-bold text-white tracking-tight">CP</div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">ChemE Process Suite</h1>
            <p className="text-[11px] text-zinc-600">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-all"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <div className="flex flex-col items-end">
            <p className={`text-[11px] font-semibold ${rank.color}`}>{rank.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div className={`h-full rounded-full ${xpBarColor}`} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
              </div>
              <p className="text-[10px] text-zinc-600 tabular-nums">{xp}/{nextRankXp}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg p-1.5 text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 transition-all">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main ref={scrollRef} className="relative z-10 mx-auto max-w-6xl px-6 py-10 h-[calc(100vh-56px)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {viewMode === "dashboard" ? (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {/* Hero with scroll-linked zoom */}
              <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="mb-16 pt-8 text-center">
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springIn }} className="text-5xl font-bold tracking-tight text-white">
                  Process Simulations
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-3 text-base text-zinc-500 max-w-lg mx-auto">
                  Choose a module below to open a focused workspace with real-time calculations and engineering insights.
                </motion.p>
              </motion.div>

              {/* Module Grid */}
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 pb-20">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      variants={staggerItem}
                      whileHover={{ y: -4, boxShadow: "0 16px 60px rgb(0 0 0 / 0.25)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setActiveTab(tab.id); setViewMode("workspace"); }}
                      className="edge-lit group flex flex-col items-start gap-5 bg-white/[0.02] backdrop-blur-md p-7 text-left transition-all duration-300 hover:bg-white/[0.04]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/[0.06] text-emerald-400/70 transition-all group-hover:bg-emerald-500/[0.12] group-hover:text-emerald-300 ring-1 ring-emerald-400/[0.1]">
                        <Icon size={22} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-zinc-200 group-hover:text-white transition-colors">{tab.label}</h3>
                        <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed line-clamp-2">{moduleDetails[tab.id]}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="pb-20">
              {/* Workspace Header */}
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <button onClick={() => setViewMode("dashboard")} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-400 transition-all group">
                    <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> All Modules
                  </button>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">{tabs.find((t) => t.id === activeTab)?.label}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{moduleDetails[activeTab]}</p>
                  <p className="mt-1 text-xs text-zinc-600 italic">{moduleTips[activeTab]}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 mt-1">
                  <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${backendOnline ? "border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-400/80" : "border-red-500/20 bg-red-500/[0.06] text-red-400/70"}`}>
                    <Activity size={11} />
                    {backendOnline ? "Online" : "Offline"}
                  </div>
                  {lastRunAt && <div className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-zinc-600">Last: {lastRunAt}</div>}
                  {fallbackMode && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1 text-[11px] text-amber-400/70">
                      <AlertTriangle size={11} /> Local Fallback
                    </div>
                  )}
                </div>
              </div>

              {/* Simulation Panel */}
              <div className="glass-panel rounded-3xl p-8 space-y-6 border-t border-emerald-500/[0.06]" key={activeTab}>

            {activeTab === "plume" && (
              <section className="space-y-6">
                <div className="rounded-2xl bg-emerald-500/[0.04] border border-emerald-400/10 p-5">
                  <p className="text-sm font-medium text-zinc-300">Indian City Atmospheric Mode</p>
                  <p className="mt-1 text-xs text-zinc-500">Auto-load local coordinates and wind-driven stability for dispersion setup.</p>
                  <div className="mt-3 flex flex-col gap-2 md:flex-row">
                    <input list="indian-cities" value={plumeCity} onChange={(e) => setPlumeCity(e.target.value)} placeholder="Enter Indian city" className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
                    <datalist id="indian-cities">{Object.values(INDIAN_CITY_DEFAULTS).map((c) => <option key={c.name} value={c.name} />)}</datalist>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={applyIndianCityConditions} className="rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.1] transition-all whitespace-nowrap">
                      {plumeCityLoading ? "Applying..." : "Apply City"}
                    </motion.button>
                  </div>
                  {plumeCityError && <p className="mt-2 text-xs text-red-400/70">{plumeCityError}</p>}
                  {plumeCityMeta && <p className="mt-2 text-xs text-zinc-500">Using {plumeCityMeta.city} ({plumeCityMeta.lat}, {plumeCityMeta.lon}) | Wind: {plumeCityMeta.windSpeed} m/s | Stability: {plumeCityMeta.stability}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Field label="Stack Height (m)" value={plumeIn.stackHeight} onChange={(v) => setPlumeIn((p) => ({ ...p, stackHeight: v }))} />
                  <Field label="Emission Rate (g/s)" value={plumeIn.emissionRate} onChange={(v) => setPlumeIn((p) => ({ ...p, emissionRate: v }))} />
                  <Field label="Wind Speed (m/s)" value={plumeIn.windSpeed} onChange={(v) => setPlumeIn((p) => ({ ...p, windSpeed: v }))} />
                  <Field label="Stability (A-F)" value={plumeIn.stability} onChange={(v) => setPlumeIn((p) => ({ ...p, stability: v }))} options={["A","B","C","D","E","F"]} />
                </div>
                <EngineeringPanel warnings={plumeWarnings} assumptions={["Steady-state meteorology", "Flat terrain", "No chemical reaction/deposition"]} />
                <ModuleDiagram moduleId="plume" />
                <TheoryPanel moduleId="plume" />
                <ReferencePanel moduleId="plume" />
                <FunFactCard moduleId="plume" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/plume", plumeIn, calcPlume, setPlumeRes)} />
                  <ResetButton onClick={() => setPlumeIn(defaults.plume)} />
                </div>
                {plumeRes && (<>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <StatCard title="Max Concentration" value={plumeRes.maxConcentration} unit="g/m³" />
                    <StatCard title="Distance Points" value={plumeRes.profile?.length || 0} />
                    <StatCard title="City Context" value={plumeIn.city || plumeCityMeta?.city || "Manual"} />
                  </div>
                  <ExportButton onClick={() => exportCsv("plume_profile.csv", plumeRes.profile || [])} />
                  <LineAreaChart points={plumeRes.profile || []} xKey="distance" yKey="concentration" color="#34d399" title="Gaussian Plume Centerline Concentration" xLabel="Downwind Distance (m)" yLabel="Concentration" yUnit="g/m³" />
                  <div className="glass-panel rounded-2xl p-4 text-sm text-zinc-400">
                    <p className="font-medium text-zinc-300">Sensitivity (wind ±10%)</p>
                    <p className="mt-1">Max C at 0.9× wind: {formatNum(calcPlume({ ...plumeIn, windSpeed: num(plumeIn.windSpeed)*0.9 }).maxConcentration)} g/m³</p>
                    <p>Max C at 1.1× wind: {formatNum(calcPlume({ ...plumeIn, windSpeed: num(plumeIn.windSpeed)*1.1 }).maxConcentration)} g/m³</p>
                  </div>
                </>)}
              </section>
            )}

            {activeTab === "heatexchanger" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Object.keys(hxIn).map((key) => <Field key={key} label={key} value={hxIn[key]} onChange={(v) => setHxIn((p) => ({ ...p, [key]: v }))} />)}</div>
                <EngineeringPanel warnings={hxWarnings} assumptions={["No phase change", "Constant U", "Counter-current LMTD"]} />
                <ModuleDiagram moduleId="heatexchanger" /><TheoryPanel moduleId="heatexchanger" /><ReferencePanel moduleId="heatexchanger" /><FunFactCard moduleId="heatexchanger" />
                <div className="flex items-center"><SimButton onClick={() => simulate("/api/heatexchanger", hxIn, calcHeatExchanger, setHxRes)} /><ResetButton onClick={() => setHxIn(defaults.heatexchanger)} /></div>
                {hxRes && (<><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><StatCard title="LMTD" value={hxRes.lmtd} unit="K" /><StatCard title="Heat Duty" value={hxRes.heatDuty} unit="W" /><StatCard title="Effectiveness" value={hxRes.effectiveness} unit="%" /></div><ExportButton onClick={() => exportCsv("heat_exchanger.csv", hxRes)} /><p className="text-sm text-zinc-500">Duty if U +10%: {formatNum(calcHeatExchanger({ ...hxIn, u_val: num(hxIn.u_val)*1.1 }).heatDuty)} W</p></>)}
              </section>
            )}

            {activeTab === "pipeflow" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Object.keys(pipeIn).map((key) => <Field key={key} label={key} value={pipeIn[key]} onChange={(v) => setPipeIn((p) => ({ ...p, [key]: v }))} />)}</div>
                <EngineeringPanel warnings={pipeWarnings} assumptions={["Single-phase incompressible", "Fully developed flow", "Constant properties"]} />
                <ModuleDiagram moduleId="pipeflow" /><TheoryPanel moduleId="pipeflow" /><ReferencePanel moduleId="pipeflow" /><FunFactCard moduleId="pipeflow" />
                <div className="flex items-center"><SimButton onClick={() => simulate("/api/pipeflow", pipeIn, calcPipeFlow, setPipeRes)} /><ResetButton onClick={() => setPipeIn(defaults.pipeflow)} /></div>
                {pipeRes && (<><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><StatCard title="Reynolds" value={pipeRes.reynolds} /><StatCard title="Friction Factor" value={pipeRes.frictionFactor} /><StatCard title="Pressure Drop" value={pipeRes.pressureDrop} unit="Pa" /><StatCard title="Vol. Flow" value={pipeRes.volumetricFlow} unit="m³/s" /><StatCard title="Pump Power" value={pipeRes.pumpPower} unit="W" /></div><ExportButton onClick={() => exportCsv("pipeflow.csv", pipeRes)} /><p className="text-sm text-zinc-500">ΔP if velocity +10%: {formatNum(calcPipeFlow({ ...pipeIn, velocity: num(pipeIn.velocity)*1.1 }).pressureDrop)} Pa</p></>)}
              </section>
            )}

            {activeTab === "cstr" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Object.keys(cstrIn).map((key) => <Field key={key} label={key} value={cstrIn[key]} onChange={(v) => setCstrIn((p) => ({ ...p, [key]: v }))} />)}</div>
                <EngineeringPanel warnings={cstrWarnings} assumptions={["First-order irreversible", "Perfect mixing", "Steady-state"]} />
                <ModuleDiagram moduleId="cstr" /><TheoryPanel moduleId="cstr" /><ReferencePanel moduleId="cstr" /><FunFactCard moduleId="cstr" />
                <div className="flex items-center"><SimButton onClick={() => simulate("/api/cstr", cstrIn, calcCstr, setCstrRes)} /><ResetButton onClick={() => setCstrIn(defaults.cstr)} /></div>
                {cstrRes && (<><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><StatCard title="Required Volume" value={cstrRes.volume} unit="m³" /><StatCard title="Residence Time" value={cstrRes.residenceTime} unit="h" /></div><ExportButton onClick={() => exportCsv("cstr.csv", cstrRes)} /><p className="text-sm text-zinc-500">Volume if k -10%: {formatNum(calcCstr({ ...cstrIn, rateConstant: num(cstrIn.rateConstant)*0.9 }).volume)} m³</p></>)}
              </section>
            )}

            {activeTab === "flash" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Object.keys(flashIn).map((key) => <Field key={key} label={key} value={flashIn[key]} onChange={(v) => setFlashIn((p) => ({ ...p, [key]: v }))} />)}</div>
                <EngineeringPanel warnings={flashWarnings} assumptions={["Binary approximation", "Constant relative volatility", "Single equilibrium stage"]} />
                <ModuleDiagram moduleId="flash" /><TheoryPanel moduleId="flash" /><ReferencePanel moduleId="flash" /><FunFactCard moduleId="flash" />
                <div className="flex items-center"><SimButton onClick={() => simulate("/api/flash", flashIn, calcFlash, setFlashRes)} /><ResetButton onClick={() => setFlashIn(defaults.flash)} /></div>
                {flashRes && (<><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><StatCard title="Liquid Mole Fraction (x)" value={flashRes.liquidMoleFraction} /><StatCard title="Vapor Mole Fraction (y)" value={flashRes.vaporMoleFraction} /></div><ExportButton onClick={() => exportCsv("flash_vle.csv", flashRes)} /><p className="text-sm text-zinc-500">y if α +10%: {formatNum(calcFlash({ ...flashIn, alpha: num(flashIn.alpha)*1.1 }).vaporMoleFraction)}</p></>)}
              </section>
            )}

            {activeTab === "ergun" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Object.keys(ergunIn).map((key) => <Field key={key} label={key} value={ergunIn[key]} onChange={(v) => setErgunIn((p) => ({ ...p, [key]: v }))} />)}</div>
                <EngineeringPanel warnings={ergunWarnings} assumptions={["Fixed bed, no channeling", "Uniform particle size", "Steady superficial flow"]} />
                <ModuleDiagram moduleId="ergun" /><TheoryPanel moduleId="ergun" /><ReferencePanel moduleId="ergun" /><FunFactCard moduleId="ergun" />
                <div className="flex items-center"><SimButton onClick={() => simulate("/api/ergun", ergunIn, calcErgun, setErgunRes)} /><ResetButton onClick={() => setErgunIn(defaults.ergun)} /></div>
                {ergunRes && (<><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><StatCard title="dP/dL" value={ergunRes.dP_dL} unit="Pa/m" /><StatCard title="Total ΔP" value={ergunRes.totalPressureDrop} unit="Pa" /></div><ExportButton onClick={() => exportCsv("ergun.csv", ergunRes)} /><LineAreaChart points={ergunCurve} xKey="velocity" yKey="pressureGradient" color="#fb923c" title="Ergun Pressure Gradient vs Velocity" xLabel="Velocity (m/s)" yLabel="dP/dL" yUnit="Pa/m" /><p className="text-sm text-zinc-500">Total ΔP if v +10%: {formatNum(calcErgun({ ...ergunIn, v: num(ergunIn.v)*1.1 }).totalPressureDrop)} Pa</p></>)}
              </section>
            )}

            {activeTab === "fenske" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Object.keys(fenskeIn).map((key) => <Field key={key} label={key} value={fenskeIn[key]} onChange={(v) => setFenskeIn((p) => ({ ...p, [key]: v }))} />)}</div>
                <EngineeringPanel warnings={fenskeWarnings} assumptions={["Total reflux limit", "Constant relative volatility", "Binary-key approximation"]} />
                <ModuleDiagram moduleId="fenske" /><TheoryPanel moduleId="fenske" /><ReferencePanel moduleId="fenske" /><FunFactCard moduleId="fenske" />
                <div className="flex items-center"><SimButton onClick={() => simulate("/api/fenske", fenskeIn, calcFenske, setFenskeRes)} /><ResetButton onClick={() => setFenskeIn(defaults.fenske)} /></div>
                {fenskeRes && (<><StatCard title="Minimum Stages (Nmin)" value={fenskeRes.nMin} /><ExportButton onClick={() => exportCsv("fenske.csv", fenskeRes)} /><p className="text-sm text-zinc-500">Nmin if α -10%: {formatNum(calcFenske({ ...fenskeIn, alpha: num(fenskeIn.alpha)*0.9 }).nMin)}</p></>)}
              </section>
            )}

            {activeTab === "pid" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Object.keys(pidIn).map((key) => <Field key={key} label={key} value={pidIn[key]} onChange={(v) => setPidIn((p) => ({ ...p, [key]: v }))} />)}</div>
                <EngineeringPanel warnings={pidWarnings} assumptions={["FOPDT process model", "Classical Z-N correlations", "Aggressive tuning"]} />
                <ModuleDiagram moduleId="pid" /><TheoryPanel moduleId="pid" /><ReferencePanel moduleId="pid" /><FunFactCard moduleId="pid" />
                <div className="flex items-center"><SimButton onClick={() => simulate("/api/pid", pidIn, calcPid, setPidRes)} /><ResetButton onClick={() => setPidIn(defaults.pid)} /></div>
                {pidRes && (<><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><StatCard title="PI Kc" value={pidRes.pi?.Kc} /><StatCard title="PI τ_I" value={pidRes.pi?.tauI} /><StatCard title="PID Kc" value={pidRes.pid?.Kc} /><StatCard title="PID τ_I" value={pidRes.pid?.tauI} /><StatCard title="PID τ_D" value={pidRes.pid?.tauD} /></div><ExportButton onClick={() => exportCsv("pid_tuning.csv", { ...pidRes.pi, ...pidRes.pid })} /><p className="text-sm text-zinc-500">PID Kc if θ +10%: {formatNum(calcPid({ ...pidIn, theta: num(pidIn.theta)*1.1 }).pid.Kc)}</p></>)}
              </section>
            )}

            {activeTab === "transferfunction" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(transferFunctionIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={transferFunctionIn[key]} onChange={(v) => setTransferFunctionIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={transferFunctionWarnings} assumptions={["Linearized process dynamics", "Two dominant process lags", "Dead-time approximated in exponential term"]} />
                <ModuleDiagram moduleId="transferfunction" /><TheoryPanel moduleId="transferfunction" /><ReferencePanel moduleId="transferfunction" /><FunFactCard moduleId="transferfunction" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/transferfunction", transferFunctionIn, calcTransferFunction, setTransferFunctionRes)} />
                  <ResetButton onClick={() => setTransferFunctionIn(defaults.transferfunction)} />
                </div>
                {transferFunctionRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Model Type" value={transferFunctionRes.modelType} />
                      <StatCard title="Steady Gain" value={transferFunctionRes.steadyGain} />
                      <StatCard title="Pole 1 (Re)" value={transferFunctionRes.poles?.[0]?.real} />
                      <StatCard title="Pole 1 (Im)" value={transferFunctionRes.poles?.[0]?.imag} />
                      <StatCard title="Pole 2 (Re)" value={transferFunctionRes.poles?.[1]?.real} />
                      <StatCard title="Pole 2 (Im)" value={transferFunctionRes.poles?.[1]?.imag} />
                    </div>
                    <div className="glass-panel rounded-2xl p-4 font-mono text-sm text-zinc-400">{transferFunctionRes.transferFunction}</div>
                    <ExportButton onClick={() => exportCsv("transfer_function.csv", transferFunctionRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "laplace" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="Signal Type" value={laplaceIn.signalType} onChange={(v) => setLaplaceIn((p) => ({ ...p, signalType: v }))} options={["step", "ramp", "impulse", "exponential", "sine"]} />
                  {Object.keys(laplaceIn).filter((k) => k !== "signalType").map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={laplaceIn[key]} onChange={(v) => setLaplaceIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={laplaceWarnings} assumptions={["Zero initial conditions", "Ideal forcing signals", "Laplace-domain algebraic analysis"]} />
                <ModuleDiagram moduleId="laplace" /><TheoryPanel moduleId="laplace" /><ReferencePanel moduleId="laplace" /><FunFactCard moduleId="laplace" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/laplace", laplaceIn, calcLaplace, setLaplaceRes)} />
                  <ResetButton onClick={() => setLaplaceIn(defaults.laplace)} />
                </div>
                {laplaceRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Signal Type" value={laplaceRes.signalType} />
                      <StatCard title="Value at s" value={laplaceRes.valueAtS} />
                      <StatCard title="Time-domain sample" value={laplaceRes.timeDomainSample} />
                    </div>
                    <div className="glass-panel rounded-2xl p-4 font-mono text-sm text-zinc-400">L(f(t)) = {laplaceRes.laplaceExpression}</div>
                    <ExportButton onClick={() => exportCsv("laplace_transform.csv", laplaceRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "dynamicresponse" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(dynamicResponseIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={dynamicResponseIn[key]} onChange={(v) => setDynamicResponseIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={dynamicResponseWarnings} assumptions={["FOPDT approximation", "Single step disturbance", "Linear operating region"]} />
                <ModuleDiagram moduleId="dynamicresponse" /><TheoryPanel moduleId="dynamicresponse" /><ReferencePanel moduleId="dynamicresponse" /><FunFactCard moduleId="dynamicresponse" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/dynamicresponse", dynamicResponseIn, calcDynamicResponse, setDynamicResponseRes)} />
                  <ResetButton onClick={() => setDynamicResponseIn(defaults.dynamicresponse)} />
                </div>
                {dynamicResponseRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Final Value" value={dynamicResponseRes.finalValue} />
                      <StatCard title="t90" value={dynamicResponseRes.riseTime90} />
                      <StatCard title="Settling Time" value={dynamicResponseRes.settlingTime} />
                    </div>
                    <ExportButton onClick={() => exportCsv("dynamic_response.csv", dynamicResponseRes.profile || [])} />
                    <LineAreaChart points={dynamicResponseRes.profile || []} xKey="t" yKey="y" color="#34d399" title="Dynamic Process Response" xLabel="Time" yLabel="Output" />
                  </>
                )}
              </section>
            )}

            {activeTab === "firstorder" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(firstOrderIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={firstOrderIn[key]} onChange={(v) => setFirstOrderIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={firstOrderWarnings} assumptions={["First-order process model", "No dead time", "Constant gain and time constant"]} />
                <ModuleDiagram moduleId="firstorder" /><TheoryPanel moduleId="firstorder" /><ReferencePanel moduleId="firstorder" /><FunFactCard moduleId="firstorder" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/firstorder", firstOrderIn, calcFirstOrder, setFirstOrderRes)} />
                  <ResetButton onClick={() => setFirstOrderIn(defaults.firstorder)} />
                </div>
                {firstOrderRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Final Value" value={firstOrderRes.finalValue} />
                      <StatCard title="63.2% Output" value={firstOrderRes.y63} />
                      <StatCard title="Rise Time 10-90%" value={firstOrderRes.riseTime1090} />
                      <StatCard title="Settling Time" value={firstOrderRes.settlingTime} />
                    </div>
                    <ExportButton onClick={() => exportCsv("first_order_response.csv", firstOrderRes.profile || [])} />
                    <LineAreaChart points={firstOrderRes.profile || []} xKey="t" yKey="y" color="#60a5fa" title="First-Order Step Response" xLabel="Time" yLabel="Output" />
                  </>
                )}
              </section>
            )}

            {activeTab === "secondorder" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(secondOrderIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={secondOrderIn[key]} onChange={(v) => setSecondOrderIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={secondOrderWarnings} assumptions={["Second-order LTI approximation", "Step input forcing", "Damping and natural frequency constants"]} />
                <ModuleDiagram moduleId="secondorder" /><TheoryPanel moduleId="secondorder" /><ReferencePanel moduleId="secondorder" /><FunFactCard moduleId="secondorder" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/secondorder", secondOrderIn, calcSecondOrder, setSecondOrderRes)} />
                  <ResetButton onClick={() => setSecondOrderIn(defaults.secondorder)} />
                </div>
                {secondOrderRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Final Value" value={secondOrderRes.finalValue} />
                      <StatCard title="Overshoot (%)" value={secondOrderRes.overshoot} />
                      <StatCard title="Peak Time" value={secondOrderRes.peakTime} />
                      <StatCard title="Settling Time" value={secondOrderRes.settlingTime} />
                      <StatCard title="Damped Frequency" value={secondOrderRes.dampedFrequency} />
                    </div>
                    <ExportButton onClick={() => exportCsv("second_order_response.csv", secondOrderRes.profile || [])} />
                    <LineAreaChart points={secondOrderRes.profile || []} xKey="t" yKey="y" color="#fb923c" title="Second-Order Step Response" xLabel="Time" yLabel="Output" />
                  </>
                )}
              </section>
            )}

            {activeTab === "controllertuning" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(controllerTuningIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={controllerTuningIn[key]} onChange={(v) => setControllerTuningIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={controllerTuningWarnings} assumptions={["Empirical ZN and model-based IMC tuning", "Single-loop process control", "Positive time constants"]} />
                <ModuleDiagram moduleId="controllertuning" /><TheoryPanel moduleId="controllertuning" /><ReferencePanel moduleId="controllertuning" /><FunFactCard moduleId="controllertuning" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/controllertuning", controllerTuningIn, calcControllerTuning, setControllerTuningRes)} />
                  <ResetButton onClick={() => setControllerTuningIn(defaults.controllertuning)} />
                </div>
                {controllerTuningRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="ZN PI Kc" value={controllerTuningRes.znPI?.Kc} />
                      <StatCard title="ZN PI Ti" value={controllerTuningRes.znPI?.Ti} />
                      <StatCard title="ZN PID Kc" value={controllerTuningRes.znPID?.Kc} />
                      <StatCard title="ZN PID Ti" value={controllerTuningRes.znPID?.Ti} />
                      <StatCard title="ZN PID Td" value={controllerTuningRes.znPID?.Td} />
                      <StatCard title="IMC PI Kc" value={controllerTuningRes.imcPI?.Kc} />
                      <StatCard title="IMC PI Ti" value={controllerTuningRes.imcPI?.Ti} />
                      <StatCard title="IMC PID Kc" value={controllerTuningRes.imcPID?.Kc} />
                      <StatCard title="IMC PID Ti" value={controllerTuningRes.imcPID?.Ti} />
                      <StatCard title="IMC PID Td" value={controllerTuningRes.imcPID?.Td} />
                    </div>
                    <ExportButton onClick={() => exportCsv("controller_tuning.csv", { ...controllerTuningRes.znPI, ...controllerTuningRes.znPID, ...controllerTuningRes.imcPI, ...controllerTuningRes.imcPID })} />
                  </>
                )}
              </section>
            )}

            {activeTab === "stabilityanalysis" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {Object.keys(stabilityAnalysisIn).map((key) => (
                    <Field key={key} label={key.toUpperCase()} value={stabilityAnalysisIn[key]} onChange={(v) => setStabilityAnalysisIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={stabilityAnalysisWarnings} assumptions={["Cubic characteristic equation", "Routh-Hurwitz stability test", "Continuous-time closed-loop polynomial"]} />
                <ModuleDiagram moduleId="stabilityanalysis" /><TheoryPanel moduleId="stabilityanalysis" /><ReferencePanel moduleId="stabilityanalysis" /><FunFactCard moduleId="stabilityanalysis" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/stabilityanalysis", stabilityAnalysisIn, calcStabilityAnalysis, setStabilityAnalysisRes)} />
                  <ResetButton onClick={() => setStabilityAnalysisIn(defaults.stabilityanalysis)} />
                </div>
                {stabilityAnalysisRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Margin Term a2a1-a3a0" value={stabilityAnalysisRes.marginTerm} />
                      <StatCard title="Routh s1 Row" value={stabilityAnalysisRes.routhS1} />
                      <StatCard title="Status" value={stabilityAnalysisRes.status} />
                    </div>
                    <ExportButton onClick={() => exportCsv("stability_analysis.csv", stabilityAnalysisRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "rootlocus" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {Object.keys(rootLocusIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={rootLocusIn[key]} onChange={(v) => setRootLocusIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={rootLocusWarnings} assumptions={["Second-order feedback approximation", "Gain sweep from 0 to Kmax", "Closed-loop poles from quadratic equation"]} />
                <ModuleDiagram moduleId="rootlocus" /><TheoryPanel moduleId="rootlocus" /><ReferencePanel moduleId="rootlocus" /><FunFactCard moduleId="rootlocus" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/rootlocus", rootLocusIn, calcRootLocus, setRootLocusRes)} />
                  <ResetButton onClick={() => setRootLocusIn(defaults.rootlocus)} />
                </div>
                {rootLocusRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Pole 1 Real" value={rootLocusRes.selectedRoots?.[0]?.real} />
                      <StatCard title="Pole 1 Imag" value={rootLocusRes.selectedRoots?.[0]?.imag} />
                      <StatCard title="Pole 2 Real" value={rootLocusRes.selectedRoots?.[1]?.real} />
                      <StatCard title="Pole 2 Imag" value={rootLocusRes.selectedRoots?.[1]?.imag} />
                    </div>
                    <ExportButton onClick={() => exportCsv("root_locus.csv", rootLocusRes.locus || [])} />
                  </>
                )}
              </section>
            )}

            {activeTab === "bodeplots" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(bodePlotsIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={bodePlotsIn[key]} onChange={(v) => setBodePlotsIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={bodePlotsWarnings} assumptions={["Linear transfer function model", "Log-frequency sweep", "Magnitude and phase response from G(jw)"]} />
                <ModuleDiagram moduleId="bodeplots" /><TheoryPanel moduleId="bodeplots" /><ReferencePanel moduleId="bodeplots" /><FunFactCard moduleId="bodeplots" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/bodeplots", bodePlotsIn, calcBodePlots, setBodePlotsRes)} />
                  <ResetButton onClick={() => setBodePlotsIn(defaults.bodeplots)} />
                </div>
                {bodePlotsRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Gain Crossover (w)" value={bodePlotsRes.crossover ?? "Not found"} />
                    </div>
                    <ExportButton onClick={() => exportCsv("bode_plot_data.csv", bodePlotsRes.bode || [])} />
                    <LineAreaChart points={bodePlotsRes.bode || []} xKey="w" yKey="magnitude" color="#22d3ee" title="Bode Magnitude Plot" xLabel="Angular Frequency (rad/s)" yLabel="Magnitude (dB)" />
                    <LineAreaChart points={bodePlotsRes.bode || []} xKey="w" yKey="phase" color="#f97316" title="Bode Phase Plot" xLabel="Angular Frequency (rad/s)" yLabel="Phase (deg)" />
                  </>
                )}
              </section>
            )}

            {activeTab === "frequencyresponse" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {Object.keys(frequencyResponseIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={frequencyResponseIn[key]} onChange={(v) => setFrequencyResponseIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={frequencyResponseWarnings} assumptions={["First-order process model", "Sinusoidal steady-state forcing", "Frequency-domain linear analysis"]} />
                <ModuleDiagram moduleId="frequencyresponse" /><TheoryPanel moduleId="frequencyresponse" /><ReferencePanel moduleId="frequencyresponse" /><FunFactCard moduleId="frequencyresponse" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/frequencyresponse", frequencyResponseIn, calcFrequencyResponse, setFrequencyResponseRes)} />
                  <ResetButton onClick={() => setFrequencyResponseIn(defaults.frequencyresponse)} />
                </div>
                {frequencyResponseRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Amplitude Ratio" value={frequencyResponseRes.amplitudeRatio} />
                      <StatCard title="Phase Lag" value={frequencyResponseRes.phaseLagDeg} unit="deg" />
                      <StatCard title="Output Amplitude" value={frequencyResponseRes.outputAmplitude} />
                    </div>
                    <ExportButton onClick={() => exportCsv("frequency_response.csv", frequencyResponseRes.sweep || [])} />
                    <LineAreaChart points={frequencyResponseRes.sweep || []} xKey="w" yKey="amplitudeRatio" color="#10b981" title="Amplitude Ratio vs Frequency" xLabel="Angular Frequency (rad/s)" yLabel="Amplitude Ratio" />
                  </>
                )}
              </section>
            )}

            {activeTab === "pidcalculations" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(pidCalculationsIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={pidCalculationsIn[key]} onChange={(v) => setPidCalculationsIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={pidCalculationsWarnings} assumptions={["Ideal parallel PID structure", "Discrete-time update with fixed dt", "Output clamping as anti-windup safeguard"]} />
                <ModuleDiagram moduleId="pidcalculations" /><TheoryPanel moduleId="pidcalculations" /><ReferencePanel moduleId="pidcalculations" /><FunFactCard moduleId="pidcalculations" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/pidcalculations", pidCalculationsIn, calcPidCalculations, setPidCalculationsRes)} />
                  <ResetButton onClick={() => setPidCalculationsIn(defaults.pidcalculations)} />
                </div>
                {pidCalculationsRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Error" value={pidCalculationsRes.error} />
                      <StatCard title="P Term" value={pidCalculationsRes.pTerm} />
                      <StatCard title="I Term" value={pidCalculationsRes.iTerm} />
                      <StatCard title="D Term" value={pidCalculationsRes.dTerm} />
                      <StatCard title="Raw Output" value={pidCalculationsRes.rawOutput} />
                      <StatCard title="Clamped Output" value={pidCalculationsRes.output} />
                      <StatCard title="Updated Integral" value={pidCalculationsRes.integralNew} />
                    </div>
                    <ExportButton onClick={() => exportCsv("pid_calculation.csv", pidCalculationsRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "hydrostatics" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(hydrostaticsIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={hydrostaticsIn[key]} onChange={(v) => setHydrostaticsIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={hydrostaticsWarnings} assumptions={["Fluid is static/at rest", "Submerged plate is flat and rectangular", "Fluid density is constant"]} />
                <ModuleDiagram moduleId="hydrostatics" /><TheoryPanel moduleId="hydrostatics" /><ReferencePanel moduleId="hydrostatics" /><FunFactCard moduleId="hydrostatics" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/hydrostatics", hydrostaticsIn, calcHydrostatics, setHydrostaticsRes)} />
                  <ResetButton onClick={() => setHydrostaticsIn(defaults.hydrostatics)} />
                </div>
                {hydrostaticsRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Hydrostatic Pressure" value={hydrostaticsRes.phydro} unit="Pa" />
                      <StatCard title="Absolute Pressure" value={hydrostaticsRes.pabs} unit="Pa" />
                      <StatCard title="Submerged Force" value={hydrostaticsRes.fhydro} unit="N" />
                      <StatCard title="Center of Pressure" value={hydrostaticsRes.ycp} unit="m" />
                      <StatCard title="Manometer Delta P" value={hydrostaticsRes.manometerDeltaP} unit="Pa" />
                      <StatCard title="Metacentric BM" value={hydrostaticsRes.bm} unit="m" />
                      <StatCard title="Metacentric GM" value={hydrostaticsRes.gm} unit="m" />
                      <div className="glass-panel rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Hull Stability</p>
                        <p className={`mt-2 text-2xl font-bold tracking-tight ${hydrostaticsRes.stability === "Stable" ? "text-emerald-400" : "text-rose-400"}`}>
                          {hydrostaticsRes.stability}
                        </p>
                      </div>
                    </div>
                    <ExportButton onClick={() => exportCsv("hydrostatics.csv", hydrostaticsRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "flowmeters" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(flowmetersIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={flowmetersIn[key]} onChange={(v) => setFlowmetersIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={flowmetersWarnings} assumptions={["Incompressible fluid flow", "No frictional loss except meter factor", "Steady-state flow"]} />
                <ModuleDiagram moduleId="flowmeters" /><TheoryPanel moduleId="flowmeters" /><ReferencePanel moduleId="flowmeters" /><FunFactCard moduleId="flowmeters" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/flowmeters", flowmetersIn, calcFlowMeters, setFlowmetersRes)} />
                  <ResetButton onClick={() => setFlowmetersIn(defaults.flowmeters)} />
                </div>
                {flowmetersRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Beta Ratio (d/D)" value={flowmetersRes.beta} />
                      <StatCard title="Venturi Flow Rate" value={flowmetersRes.qVenturi} unit="m³/s" />
                      <StatCard title="Orifice Flow Rate" value={flowmetersRes.qOrifice} unit="m³/s" />
                      <StatCard title="Pitot Tube Velocity" value={flowmetersRes.vPitot} unit="m/s" />
                      <StatCard title="Rotameter Flow Rate" value={flowmetersRes.qRotameter} unit="m³/s" />
                    </div>
                    <ExportButton onClick={() => exportCsv("flowmeters.csv", flowmetersRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "pipehydraulics" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(pipehydraulicsIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={pipehydraulicsIn[key]} onChange={(v) => setPipehydraulicsIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={pipehydraulicsWarnings} assumptions={["Fully developed pipe flow", "Rigid tube wall", "Single phase fluid"]} />
                <ModuleDiagram moduleId="pipehydraulics" /><TheoryPanel moduleId="pipehydraulics" /><ReferencePanel moduleId="pipehydraulics" /><FunFactCard moduleId="pipehydraulics" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/pipehydraulics", pipehydraulicsIn, calcPipeHydraulics, setPipehydraulicsRes)} />
                  <ResetButton onClick={() => setPipehydraulicsIn(defaults.pipehydraulics)} />
                </div>
                {pipehydraulicsRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Reynolds Number" value={pipehydraulicsRes.reynolds} />
                      <StatCard title="Flow Regime" value={pipehydraulicsRes.regime} />
                      <StatCard title="Friction Factor (f)" value={pipehydraulicsRes.fDarcy} />
                      <StatCard title="Laminar (HP) ΔP" value={pipehydraulicsRes.dpLaminar} unit="Pa" />
                      <StatCard title="Darcy-Weisbach ΔP" value={pipehydraulicsRes.dpDarcy} unit="Pa" />
                    </div>
                    <ExportButton onClick={() => exportCsv("pipehydraulics.csv", pipehydraulicsRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "pumps" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(pumpsIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={pumpsIn[key]} onChange={(v) => setPumpsIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={pumpsWarnings} assumptions={["Centrifugal pump mechanics", "Constant temperature of liquid", "Frictional head loss at suction is static"]} />
                <ModuleDiagram moduleId="pumps" /><TheoryPanel moduleId="pumps" /><ReferencePanel moduleId="pumps" /><FunFactCard moduleId="pumps" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/pumps", pumpsIn, calcPumps, setPumpsRes)} />
                  <ResetButton onClick={() => setPumpsIn(defaults.pumps)} />
                </div>
                {pumpsRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Hydraulic Fluid Power" value={pumpsRes.hydraulicPower} unit="W" />
                      <StatCard title="Brake Horsepower (BHP)" value={pumpsRes.brakeHorsepower} unit="W" />
                      <StatCard title="NPSH Available" value={pumpsRes.npshAvailable} unit="m" />
                      <div className="glass-panel rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Cavitation Status</p>
                        <p className={`mt-2 text-2xl font-bold tracking-tight ${pumpsRes.cavitationRisk ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                          {pumpsRes.cavitationRisk ? "Cavitation Warning!" : "Safe Operation"}
                        </p>
                      </div>
                    </div>
                    <ExportButton onClick={() => exportCsv("pump_sizing.csv", pumpsRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "dragsettling" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(dragsettlingIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={dragsettlingIn[key]} onChange={(v) => setDragsettlingIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={dragsettlingWarnings} assumptions={["Infinite volume of fluid (no wall effects)", "Perfectly spherical rigid particles", "No particle-particle collision/interaction"]} />
                <ModuleDiagram moduleId="dragsettling" /><TheoryPanel moduleId="dragsettling" /><ReferencePanel moduleId="dragsettling" /><FunFactCard moduleId="dragsettling" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/dragsettling", dragsettlingIn, calcDragSettling, setDragsettlingRes)} />
                  <ResetButton onClick={() => setDragsettlingIn(defaults.dragsettling)} />
                </div>
                {dragsettlingRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Terminal Velocity (vt)" value={dragsettlingRes.vt} unit="m/s" />
                      <StatCard title="Drag Coefficient (Cd)" value={dragsettlingRes.cd} />
                      <StatCard title="Particle Reynolds" value={dragsettlingRes.rep} />
                    </div>
                    <ExportButton onClick={() => exportCsv("dragsettling.csv", dragsettlingRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "cycles" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(cyclesIn).map((key) => (
                    key === "cycleType" ? (
                      <Field key={key} label="Path Cycle Type" value={cyclesIn[key]} onChange={(v) => setCyclesIn((p) => ({ ...p, [key]: v }))} options={["isothermal", "isobaric", "isochoric", "adiabatic"]} />
                    ) : (
                      <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={cyclesIn[key]} onChange={(v) => setCyclesIn((p) => ({ ...p, [key]: v }))} />
                    )
                  ))}
                </div>
                <EngineeringPanel warnings={cyclesWarnings} assumptions={["Closed or open energy path balances", "Ideal gas properties", "Constant specific heat capacities"]} />
                <ModuleDiagram moduleId="cycles" /><TheoryPanel moduleId="cycles" /><ReferencePanel moduleId="cycles" /><FunFactCard moduleId="cycles" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/cycles", cyclesIn, calcCycles, setCyclesRes)} />
                  <ResetButton onClick={() => setCyclesIn(defaults.cycles)} />
                </div>
                {cyclesRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Path Work Done (W)" value={cyclesRes.w} unit="J" />
                      <StatCard title="Path Heat Transfer (Q)" value={cyclesRes.q} unit="J" />
                      <StatCard title="Internal Energy (dU)" value={cyclesRes.du} unit="J" />
                      <StatCard title="Enthalpy Change (dH)" value={cyclesRes.dh} unit="J" />
                      <StatCard title="Entropy Change (dS)" value={cyclesRes.ds} unit="J/K" />
                      <StatCard title="Carnot Limit Efficiency" value={cyclesRes.carnotEff * 100} unit="%" />
                    </div>
                    <ExportButton onClick={() => exportCsv("thermo_cycles.csv", cyclesRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "eos" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(eosIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={eosIn[key]} onChange={(v) => setEosIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={eosWarnings} assumptions={["Uniform bulk phase", "Virial truncated to second term", "Newton-Raphson solver for Cubic root"]} />
                <ModuleDiagram moduleId="eos" /><TheoryPanel moduleId="eos" /><ReferencePanel moduleId="eos" /><FunFactCard moduleId="eos" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/eos", eosIn, calcEos, setEosRes)} />
                  <ResetButton onClick={() => setEosIn(defaults.eos)} />
                </div>
                {eosRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Ideal Volume" value={eosRes.vIdeal} unit="m³/mol" />
                      <StatCard title="Virial Compressibility Z" value={eosRes.zVirial} />
                      <StatCard title="Virial Volume" value={eosRes.vVirial} unit="m³/mol" />
                      <StatCard title="Cubic van der Waals Z" value={eosRes.zCubic} />
                      <StatCard title="Cubic Volume" value={eosRes.vCubic} unit="m³/mol" />
                      <StatCard title="Calculated Acentric Factor" value={eosRes.calculatedOmega} />
                    </div>
                    <ExportButton onClick={() => exportCsv("equations_of_state.csv", eosRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "thermochem" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(thermochemIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={thermochemIn[key]} onChange={(v) => setThermochemIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={thermochemWarnings} assumptions={["Ideal specific heat capacity", "Constant reactant/product ratios", "No secondary reaction pathways"]} />
                <ModuleDiagram moduleId="thermochem" /><TheoryPanel moduleId="thermochem" /><ReferencePanel moduleId="thermochem" /><FunFactCard moduleId="thermochem" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/thermochem", thermochemIn, calcThermochem, setThermochemRes)} />
                  <ResetButton onClick={() => setThermochemIn(defaults.thermochem)} />
                </div>
                {thermochemRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <StatCard title="Std Heat of Reaction (298K)" value={thermochemRes.hRxn298} unit="J/mol" />
                      <StatCard title="Reaction dCp" value={thermochemRes.deltaCp} unit="J/mol.K" />
                      <StatCard title="Heat of Reaction at Temp" value={thermochemRes.hRxnTemp} unit="J/mol" />
                      <StatCard title="Heat of Combustion" value={thermochemRes.hCombustion} unit="J/mol" />
                    </div>
                    <ExportButton onClick={() => exportCsv("thermochemistry.csv", thermochemRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "fugacity" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(fugacityIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={fugacityIn[key]} onChange={(v) => setFugacityIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={fugacityWarnings} assumptions={["Maxwell relation derivative verification", "Cubic van der Waals root integration", "Thermodynamic departure definition"]} />
                <ModuleDiagram moduleId="fugacity" /><TheoryPanel moduleId="fugacity" /><ReferencePanel moduleId="fugacity" /><FunFactCard moduleId="fugacity" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/fugacity", fugacityIn, calcFugacity, setFugacityRes)} />
                  <ResetButton onClick={() => setFugacityIn(defaults.fugacity)} />
                </div>
                {fugacityRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Residual Enthalpy (H^R)" value={fugacityRes.hResidual} unit="J/mol" />
                      <StatCard title="Residual Entropy (S^R)" value={fugacityRes.sResidual} unit="J/mol.K" />
                      <StatCard title="Fugacity Coefficient (phi)" value={fugacityRes.phi} />
                      <StatCard title="Fugacity (f)" value={fugacityRes.fugacity} unit="Pa" />
                      <StatCard title="Numerical dV/dT" value={fugacityRes.dV_dT} unit="m³/K" />
                    </div>
                    <ExportButton onClick={() => exportCsv("residual_fugacity.csv", fugacityRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "equilibrium" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(equilibriumIn).map((key) => (
                    key === "modelType" ? (
                      <Field key={key} label="Activity Model" value={equilibriumIn[key]} onChange={(v) => setEquilibriumIn((p) => ({ ...p, [key]: v }))} options={["margules", "vanlaar", "wilson"]} />
                    ) : (
                      <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={equilibriumIn[key]} onChange={(v) => setEquilibriumIn((p) => ({ ...p, [key]: v }))} />
                    )
                  ))}
                </div>
                <EngineeringPanel warnings={equilibriumWarnings} assumptions={["Binary activity models (Margules, Van Laar, Wilson)", "Modified Raoult's law for VLE bubble point", "Van't Hoff temperature correction for K"]} />
                <ModuleDiagram moduleId="equilibrium" /><TheoryPanel moduleId="equilibrium" /><ReferencePanel moduleId="equilibrium" /><FunFactCard moduleId="equilibrium" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/equilibrium", equilibriumIn, calcEquilibrium, setEquilibriumRes)} />
                  <ResetButton onClick={() => setEquilibriumIn(defaults.equilibrium)} />
                </div>
                {equilibriumRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Activity Coeff gamma1" value={equilibriumRes.gamma1} />
                      <StatCard title="Activity Coeff gamma2" value={equilibriumRes.gamma2} />
                      <StatCard title="VLE Bubble Pressure" value={equilibriumRes.bubbleP} unit="Pa" />
                      <StatCard title="Vapor Composition y1" value={equilibriumRes.y1} />
                      <StatCard title="Equilibrium Constant K" value={equilibriumRes.kTemp} />
                      <StatCard title="Reaction Extent (epsilon)" value={equilibriumRes.epsilon} />
                    </div>
                    <ExportButton onClick={() => exportCsv("equilibrium_lab.csv", equilibriumRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "conduction" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(conductionIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={conductionIn[key]} onChange={(v) => setConductionIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={conductionWarnings} assumptions={["Steady-state 1D heat conduction", "Negligible radiation losses", "Constant thermal conductivities"]} />
                <ModuleDiagram moduleId="conduction" /><TheoryPanel moduleId="conduction" /><ReferencePanel moduleId="conduction" /><FunFactCard moduleId="conduction" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/conduction", conductionIn, calcConduction, setConductionRes)} />
                  <ResetButton onClick={() => setConductionIn(defaults.conduction)} />
                </div>
                {conductionRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Flat Wall Heat Flux" value={conductionRes.qFlat} unit="W/m²" />
                      <StatCard title="Composite Wall Flux" value={conductionRes.qComp} unit="W/m²" />
                      <StatCard title="Cylinder Heat Duty" value={conductionRes.qCyl} unit="W" />
                      <StatCard title="Sphere Heat Duty" value={conductionRes.qSph} unit="W" />
                      <StatCard title="Crit. Radius Cylinder" value={conductionRes.rcCyl} unit="m" />
                      <StatCard title="Crit. Radius Sphere" value={conductionRes.rcSph} unit="m" />
                    </div>
                    <ExportButton onClick={() => exportCsv("conduction_lab.csv", conductionRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "convection" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(convectionIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={convectionIn[key]} onChange={(v) => setConvectionIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={convectionWarnings} assumptions={["Flat plate laminar flow boundary layers", "Churchill-Chu natural convection vertical plate model", "Rectangular adiabatic tip pin fin approximation"]} />
                <ModuleDiagram moduleId="convection" /><TheoryPanel moduleId="convection" /><ReferencePanel moduleId="convection" /><FunFactCard moduleId="convection" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/convection", convectionIn, calcConvection, setConvectionRes)} />
                  <ResetButton onClick={() => setConvectionIn(defaults.convection)} />
                </div>
                {convectionRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Reynolds Number" value={convectionRes.re} />
                      <StatCard title="Prandtl Number" value={convectionRes.pr} />
                      <StatCard title="Hydrodynamic Boundary L." value={convectionRes.boundaryL} unit="m" />
                      <StatCard title="Thermal Boundary L." value={convectionRes.boundaryT} unit="m" />
                      <StatCard title="Grashof Number" value={convectionRes.gr} />
                      <StatCard title="Rayleigh Number" value={convectionRes.ra} />
                      <StatCard title="Natural Nusselt No." value={convectionRes.nuNatural} />
                      <StatCard title="Natural Coeff (h)" value={convectionRes.hNatural} unit="W/m²K" />
                      <StatCard title="Fin Efficiency" value={convectionRes.finEff * 100} unit="%" />
                    </div>
                    <ExportButton onClick={() => exportCsv("convection_lab.csv", convectionRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "radiation" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(radiationIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={radiationIn[key]} onChange={(v) => setRadiationIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={radiationWarnings} assumptions={["Stefan-Boltzmann blackbody radiation", "Two large gray plates exchange model", "Rohsenow pool boiling and Nusselt vertical plate condensation"]} />
                <ModuleDiagram moduleId="radiation" /><TheoryPanel moduleId="radiation" /><ReferencePanel moduleId="radiation" /><FunFactCard moduleId="radiation" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/radiation", radiationIn, calcRadiation, setRadiationRes)} />
                  <ResetButton onClick={() => setRadiationIn(defaults.radiation)} />
                </div>
                {radiationRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Blackbody Power Eb1" value={radiationRes.eBlack1} unit="W/m²" />
                      <StatCard title="Gray-Body Exchange" value={radiationRes.qRadExchange} unit="W/m²" />
                      <StatCard title="Boiling Heat Flux" value={radiationRes.qBoiling} unit="W/m²" />
                      <StatCard title="Condensation Coeff (h)" value={radiationRes.hCond} unit="W/m²K" />
                      <StatCard title="Condensation Heat Flux" value={radiationRes.qCond} unit="W/m²" />
                    </div>
                    <ExportButton onClick={() => exportCsv("phase_change_radiation.csv", radiationRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "evaporator" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(evaporatorIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={evaporatorIn[key]} onChange={(v) => setEvaporatorIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={evaporatorWarnings} assumptions={["Negligible boiling point elevation (BPE) for water-like solvent", "Steam chest saturated condensation", "Double-effect equal area and split forward-feed approximation"]} />
                <ModuleDiagram moduleId="evaporator" /><TheoryPanel moduleId="evaporator" /><ReferencePanel moduleId="evaporator" /><FunFactCard moduleId="evaporator" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/evaporator", evaporatorIn, calcEvaporator, setEvaporatorRes)} />
                  <ResetButton onClick={() => setEvaporatorIn(defaults.evaporator)} />
                </div>
                {evaporatorRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Solvent Boiling Temp" value={evaporatorRes.tSatEvap} unit="K" />
                      <StatCard title="Liquid Outlet Flow" value={evaporatorRes.lRate} unit="kg/s" />
                      <StatCard title="Vapor Output Flow" value={evaporatorRes.vRate} unit="kg/s" />
                      <StatCard title="Evaporator Heat Duty" value={evaporatorRes.heatDuty} unit="W" />
                      <StatCard title="Steam Consumption" value={evaporatorRes.steamRate} unit="kg/s" />
                      <StatCard title="Steam Economy (Single)" value={evaporatorRes.economy} />
                      <StatCard title="Heat Transfer Area" value={evaporatorRes.evapArea} unit="m²" />
                      <StatCard title="Steam Economy (Double)" value={evaporatorRes.economyDouble} />
                    </div>
                    <ExportButton onClick={() => exportCsv("evaporator_sizing.csv", evaporatorRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "mccabe" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(mccabeIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={mccabeIn[key]} onChange={(v) => setMcCabeIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={mccabeWarnings} assumptions={["Constant molar overflow (CMO)", "Total condenser and partial reboiler", "Feed enters at optimum stage"]} />
                <ModuleDiagram moduleId="mccabe" /><TheoryPanel moduleId="mccabe" /><ReferencePanel moduleId="mccabe" /><FunFactCard moduleId="mccabe" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/mccabe", mccabeIn, calcMcCabe, setMcCabeRes)} />
                  <ResetButton onClick={() => setMcCabeIn(defaults.mccabe)} />
                </div>
                {mccabeRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Minimum Reflux Rmin" value={mccabeRes.rMin} />
                      <StatCard title="Theoretical Stages" value={mccabeRes.nStages} />
                      <StatCard title="Optimum Feed Stage" value={mccabeRes.feedStage} />
                    </div>
                    <ExportButton onClick={() => exportCsv("mccabe_stages.csv", mccabeRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "rachford" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(rachfordIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={rachfordIn[key]} onChange={(v) => setRachfordIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={rachfordWarnings} assumptions={["Newton-Raphson Rachford-Rice solver", "Four-component hydrocarbon isothermal flash", "Ideal vapor-liquid partition coefficients"]} />
                <ModuleDiagram moduleId="rachford" /><TheoryPanel moduleId="rachford" /><ReferencePanel moduleId="rachford" /><FunFactCard moduleId="rachford" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/rachford", rachfordIn, calcRachford, setRachfordRes)} />
                  <ResetButton onClick={() => setRachfordIn(defaults.rachford)} />
                </div>
                {rachfordRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Vapor Fraction (psi)" value={rachfordRes.psi} />
                      <StatCard title="Liquid composition x1" value={rachfordRes.x[0]} />
                      <StatCard title="Liquid composition x2" value={rachfordRes.x[1]} />
                      <StatCard title="Liquid composition x3" value={rachfordRes.x[2]} />
                      <StatCard title="Liquid composition x4" value={rachfordRes.x[3]} />
                      <StatCard title="Vapor composition y1" value={rachfordRes.y[0]} />
                      <StatCard title="Vapor composition y2" value={rachfordRes.y[1]} />
                      <StatCard title="Vapor composition y3" value={rachfordRes.y[2]} />
                      <StatCard title="Vapor composition y4" value={rachfordRes.y[3]} />
                    </div>
                    <ExportButton onClick={() => exportCsv("rachford_flash.csv", rachfordRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "pfr" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(pfrIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={pfrIn[key]} onChange={(v) => setPfrIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={pfrWarnings} assumptions={["Isothermal tubular PFR reactor", "Simpson's 1/3 integration method", "Concentration changes along axial length only"]} />
                <ModuleDiagram moduleId="pfr" /><TheoryPanel moduleId="pfr" /><ReferencePanel moduleId="pfr" /><FunFactCard moduleId="pfr" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/pfr", pfrIn, calcPfr, setPfrRes)} />
                  <ResetButton onClick={() => setPfrIn(defaults.pfr)} />
                </div>
                {pfrRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="PFR Reactor Volume" value={pfrRes.volume} unit="m³" />
                      <StatCard title="Reactor Space Time" value={pfrRes.residenceTime} unit="s" />
                    </div>
                    <ExportButton onClick={() => exportCsv("pfr_kinetics.csv", pfrRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "nonisothermal" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(nonIsothermalIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={nonIsothermalIn[key]} onChange={(v) => setNonIsothermalIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={nonIsothermalWarnings} assumptions={["Adiabatic CSTR approximation", "Single first-order reaction", "Constant rhoCp over operating range"]} />
                <ModuleDiagram moduleId="nonisothermal" /><TheoryPanel moduleId="nonisothermal" /><ReferencePanel moduleId="nonisothermal" /><FunFactCard moduleId="nonisothermal" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/nonisothermal", nonIsothermalIn, calcNonIsothermal, setNonIsothermalRes)} />
                  <ResetButton onClick={() => setNonIsothermalIn(defaults.nonisothermal)} />
                </div>
                {nonIsothermalRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Outlet Temperature" value={nonIsothermalRes.outletTemperature} unit="K" />
                      <StatCard title="Rate Constant" value={nonIsothermalRes.rateConstant} unit="1/h" />
                      <StatCard title="Residence Time" value={nonIsothermalRes.residenceTime} unit="h" />
                      <StatCard title="Reactor Volume" value={nonIsothermalRes.volume} unit="mÂ³" />
                      <StatCard title="Heat Release" value={nonIsothermalRes.heatRelease} unit="J/h" />
                    </div>
                    <ExportButton onClick={() => exportCsv("nonisothermal_reactor.csv", nonIsothermalRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "catalytic" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(catalyticIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={catalyticIn[key]} onChange={(v) => setCatalyticIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={catalyticWarnings} assumptions={["First-order heterogeneous kinetics", "Isothermal catalyst bed", "No catalyst deactivation"]} />
                <ModuleDiagram moduleId="catalytic" /><TheoryPanel moduleId="catalytic" /><ReferencePanel moduleId="catalytic" /><FunFactCard moduleId="catalytic" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/catalytic", catalyticIn, calcCatalytic, setCatalyticRes)} />
                  <ResetButton onClick={() => setCatalyticIn(defaults.catalytic)} />
                </div>
                {catalyticRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Required Catalyst" value={catalyticRes.requiredCatalystWeight} unit="kg" />
                      <StatCard title="Reactor Volume" value={catalyticRes.reactorVolume} unit="mÂ³" />
                      <StatCard title="Space Time" value={catalyticRes.spaceTime} unit="h" />
                      <StatCard title="Rate at Outlet" value={catalyticRes.observedRate} unit="mol/mÂ³.h" />
                    </div>
                    <ExportButton onClick={() => exportCsv("catalytic_reactor.csv", catalyticRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "effectiveness" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(effectivenessIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={effectivenessIn[key]} onChange={(v) => setEffectivenessIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={effectivenessWarnings} assumptions={["Spherical pellet geometry", "First-order intrinsic reaction", "Steady diffusion in pores"]} />
                <ModuleDiagram moduleId="effectiveness" /><TheoryPanel moduleId="effectiveness" /><ReferencePanel moduleId="effectiveness" /><FunFactCard moduleId="effectiveness" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/effectiveness", effectivenessIn, calcEffectiveness, setEffectivenessRes)} />
                  <ResetButton onClick={() => setEffectivenessIn(defaults.effectiveness)} />
                </div>
                {effectivenessRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Thiele Modulus" value={effectivenessRes.thieleModulus} />
                      <StatCard title="Effectiveness Factor" value={effectivenessRes.effectivenessFactor} />
                      <StatCard title="Observed k" value={effectivenessRes.observedRateConstant} unit="1/s" />
                      <StatCard title="Diffusion Resistance Ratio" value={effectivenessRes.diffusionResistanceRatio} />
                    </div>
                    <ExportButton onClick={() => exportCsv("catalyst_effectiveness.csv", effectivenessRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "diffusionreaction" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(diffusionReactionIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={diffusionReactionIn[key]} onChange={(v) => setDiffusionReactionIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={diffusionReactionWarnings} assumptions={["1D slab diffusion-reaction model", "First-order irreversible reaction", "Steady-state internal profile"]} />
                <ModuleDiagram moduleId="diffusionreaction" /><TheoryPanel moduleId="diffusionreaction" /><ReferencePanel moduleId="diffusionreaction" /><FunFactCard moduleId="diffusionreaction" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/diffusionreaction", diffusionReactionIn, calcDiffusionReaction, setDiffusionReactionRes)} />
                  <ResetButton onClick={() => setDiffusionReactionIn(defaults.diffusionreaction)} />
                </div>
                {diffusionReactionRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Thiele Modulus" value={diffusionReactionRes.thieleModulus} />
                      <StatCard title="Effectiveness (Slab)" value={diffusionReactionRes.effectivenessFactor} />
                      <StatCard title="Surface Flux" value={diffusionReactionRes.surfaceFlux} unit="mol/mÂ².s" />
                      <StatCard title="Average Concentration" value={diffusionReactionRes.avgConcentration} unit="mol/mÂ³" />
                    </div>
                    <ExportButton onClick={() => exportCsv("diffusion_reaction_profile.csv", diffusionReactionRes.profile || [])} />
                    <LineAreaChart points={diffusionReactionRes.profile || []} xKey="x" yKey="concentration" color="#22d3ee" title="Internal Concentration Profile" xLabel="x (m)" yLabel="Concentration" yUnit="mol/mÂ³" />
                  </>
                )}
              </section>
            )}

            {activeTab === "packedbedreactor" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(packedBedReactorIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={packedBedReactorIn[key]} onChange={(v) => setPackedBedReactorIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={packedBedReactorWarnings} assumptions={["Steady packed-bed operation", "First-order catalyst kinetics", "Uniform packing and flow distribution"]} />
                <ModuleDiagram moduleId="packedbedreactor" /><TheoryPanel moduleId="packedbedreactor" /><ReferencePanel moduleId="packedbedreactor" /><FunFactCard moduleId="packedbedreactor" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/packedbedreactor", packedBedReactorIn, calcPackedBedReactor, setPackedBedReactorRes)} />
                  <ResetButton onClick={() => setPackedBedReactorIn(defaults.packedbedreactor)} />
                </div>
                {packedBedReactorRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Pressure Gradient" value={packedBedReactorRes.pressureGradient} unit="Pa/m" />
                      <StatCard title="Total Pressure Drop" value={packedBedReactorRes.totalPressureDrop} unit="Pa" />
                      <StatCard title="Bed Volume" value={packedBedReactorRes.bedVolume} unit="mÂ³" />
                      <StatCard title="Required Catalyst" value={packedBedReactorRes.requiredCatalystWeight} unit="kg" />
                      <StatCard title="Available Catalyst" value={packedBedReactorRes.availableCatalystWeight} unit="kg" />
                      <StatCard title="Sizing Ratio" value={packedBedReactorRes.sizingRatio} />
                      <StatCard title="X from Available Bed" value={packedBedReactorRes.conversionAtAvailable} />
                    </div>
                    <ExportButton onClick={() => exportCsv("packed_bed_reactor.csv", packedBedReactorRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "fluidizedbed" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(fluidizedBedIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={fluidizedBedIn[key]} onChange={(v) => setFluidizedBedIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={fluidizedBedWarnings} assumptions={["Spherical-equivalent particles", "Incipient fluidization from Ergun force balance", "Richardson-Zaki bed expansion"]} />
                <ModuleDiagram moduleId="fluidizedbed" /><TheoryPanel moduleId="fluidizedbed" /><ReferencePanel moduleId="fluidizedbed" /><FunFactCard moduleId="fluidizedbed" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/fluidizedbed", fluidizedBedIn, calcFluidizedBed, setFluidizedBedRes)} />
                  <ResetButton onClick={() => setFluidizedBedIn(defaults.fluidizedbed)} />
                </div>
                {fluidizedBedRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Umf" value={fluidizedBedRes.umf} unit="m/s" />
                      <StatCard title="Re at Umf" value={fluidizedBedRes.reMf} />
                      <StatCard title="Operating Voidage" value={fluidizedBedRes.epsilonOperating} />
                      <StatCard title="Expanded Bed Height" value={fluidizedBedRes.expandedBedHeight} unit="m" />
                      <StatCard title="dP at Umf" value={fluidizedBedRes.pressureDropAtMf} unit="Pa" />
                      <StatCard title="Regime" value={fluidizedBedRes.state} />
                    </div>
                    <ExportButton onClick={() => exportCsv("fluidized_bed_design.csv", fluidizedBedRes)} />
                  </>
                )}
              </section>
            )}

            {activeTab === "rtd" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(rtdIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={rtdIn[key]} onChange={(v) => setRtdIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={rtdWarnings} assumptions={["Pulse tracer experiment", "Tanks-in-series approximation", "No reaction during tracer test"]} />
                <ModuleDiagram moduleId="rtd" /><TheoryPanel moduleId="rtd" /><ReferencePanel moduleId="rtd" /><FunFactCard moduleId="rtd" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/rtd", rtdIn, calcRtd, setRtdRes)} />
                  <ResetButton onClick={() => setRtdIn(defaults.rtd)} />
                </div>
                {rtdRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Variance" value={rtdRes.variance} unit="sÂ²" />
                      <StatCard title="Std. Deviation" value={rtdRes.sigma} unit="s" />
                      <StatCard title="Pe Equivalent" value={rtdRes.pecletEquivalent} />
                    </div>
                    <ExportButton onClick={() => exportCsv("rtd_profile.csv", rtdRes.profile || [])} />
                    <LineAreaChart points={rtdRes.profile || []} xKey="t" yKey="e" color="#60a5fa" title="Residence Time Distribution E(t)" xLabel="Time (s)" yLabel="E(t)" />
                  </>
                )}
              </section>
            )}

            {activeTab === "reactoroptimization" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(reactorOptimizationIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} value={reactorOptimizationIn[key]} onChange={(v) => setReactorOptimizationIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={reactorOptimizationWarnings} assumptions={["Single first-order CSTR economics", "Product value linear with conversion", "Reactor cost proportional to required volume"]} />
                <ModuleDiagram moduleId="reactoroptimization" /><TheoryPanel moduleId="reactoroptimization" /><ReferencePanel moduleId="reactoroptimization" /><FunFactCard moduleId="reactoroptimization" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/reactoroptimization", reactorOptimizationIn, calcReactorOptimization, setReactorOptimizationRes)} />
                  <ResetButton onClick={() => setReactorOptimizationIn(defaults.reactoroptimization)} />
                </div>
                {reactorOptimizationRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Optimum Conversion" value={reactorOptimizationRes.optimumConversion} />
                      <StatCard title="Optimum Volume" value={reactorOptimizationRes.optimumVolume} unit="mÂ³" />
                      <StatCard title="Optimum Residence Time" value={reactorOptimizationRes.optimumResidenceTime} unit="h" />
                      <StatCard title="Max Profit" value={reactorOptimizationRes.maxProfit} unit="$/h" />
                    </div>
                    <ExportButton onClick={() => exportCsv("reactor_optimization.csv", reactorOptimizationRes.sweep || [])} />
                    <LineAreaChart points={reactorOptimizationRes.sweep || []} xKey="conversion" yKey="profit" color="#34d399" title="Profit vs Conversion" xLabel="Conversion" yLabel="Profit" yUnit="$/h" />
                  </>
                )}
              </section>
            )}

            {activeTab === "diffusion" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(diffusionIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={diffusionIn[key]} onChange={(v) => setDiffusionIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={diffusionWarnings} assumptions={["Binary gas mixture", "Fuller-Schettler-Giddings diffusivity model", "Film theory mass transfer", "Steady-state molecular transport"]} />
                <ModuleDiagram moduleId="diffusion" /><TheoryPanel moduleId="diffusion" /><ReferencePanel moduleId="diffusion" /><FunFactCard moduleId="diffusion" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/diffusion", diffusionIn, calcDiffusion, setDiffusionRes)} />
                  <ResetButton onClick={() => setDiffusionIn(defaults.diffusion)} />
                </div>
                {diffusionRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Diffusivity (D_AB)" value={diffusionRes.dab} unit="m²/s" />
                      <StatCard title="Equimolar Flux (EMD)" value={diffusionRes.naEmd} unit="mol/m²s" />
                      <StatCard title="Stagnant Flux (UMD)" value={diffusionRes.naUmd} unit="mol/m²s" />
                      <StatCard title="Film Coefficient (kc)" value={diffusionRes.kc} unit="m/s" />
                      <StatCard title="Overall Gas Coeff (KG)" value={diffusionRes.KG} unit="mol/m²sPa" />
                      <StatCard title="Overall Liq Coeff (KL)" value={diffusionRes.KL} unit="m/s" />
                    </div>
                    <ExportButton onClick={() => exportCsv("diffusion_sizing.csv", diffusionRes)} />
                    <div className="glass-panel rounded-2xl p-5">
                      <p className="text-sm font-medium tracking-tight text-zinc-200">Gas Phase Partial Pressure Profiles of A (p_A)</p>
                      <div className="mt-4 flex justify-center">
                        <svg viewBox="0 0 400 250" className="w-full max-w-lg bg-black/20 rounded-xl p-4">
                          <line x1="40" y1="20" x2="40" y2="210" stroke="rgba(255,255,255,0.08)" />
                          <line x1="40" y1="210" x2="380" y2="210" stroke="rgba(255,255,255,0.08)" />
                          
                          <text x="210" y="240" textAnchor="middle" fontSize="10" fill="#71717a">Distance z (mm)</text>
                          <text x="12" y="115" transform="rotate(-90, 12, 115)" textAnchor="middle" fontSize="10" fill="#71717a">Partial Pressure p_A (Pa)</text>
                          
                          {(() => {
                            const zTotal = num(diffusionIn.z, 0.01) * 1000;
                            const maxP = num(diffusionIn.pa1) * 1.1;
                            const scaleX = (val) => 40 + (val / Math.max(zTotal, 1e-9)) * 320;
                            const scaleY = (val) => 210 - (val / Math.max(maxP, 1e-9)) * 180;
                            
                            let emdPath = "";
                            let umdPath = "";
                            
                            diffusionCurve.forEach((pPoint, idx) => {
                              const x = scaleX(pPoint.z);
                              const yEmd = scaleY(pPoint.paEmd);
                              const yUmd = scaleY(pPoint.paUmd);
                              
                              if (idx === 0) {
                                emdPath += `M ${x} ${yEmd}`;
                                umdPath += `M ${x} ${yUmd}`;
                              } else {
                                emdPath += ` L ${x} ${yEmd}`;
                                umdPath += ` L ${x} ${yUmd}`;
                              }
                            });
                            
                            return (
                              <>
                                {/* EMD Profile */}
                                <path d={emdPath} fill="none" stroke="#60a5fa" strokeWidth="2" />
                                <text x="180" y={scaleY(num(diffusionIn.pa1)*0.6) - 10} fontSize="8" fill="#60a5fa">EMD (Linear)</text>
                                
                                {/* UMD Profile */}
                                <path d={umdPath} fill="none" stroke="#fb923c" strokeWidth="2" strokeDasharray="3 3" />
                                <text x="180" y={scaleY(num(diffusionIn.pa1)*0.6) + 15} fontSize="8" fill="#fb923c">UMD (Stagnant B)</text>

                                {/* Boundary points */}
                                <circle cx={scaleX(0)} cy={scaleY(diffusionIn.pa1)} r="3" fill="#ffffff" />
                                <circle cx={scaleX(zTotal)} cy={scaleY(diffusionIn.pa2)} r="3" fill="#ffffff" />
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

            {activeTab === "absorption" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(absorptionIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={absorptionIn[key]} onChange={(v) => setAbsorptionIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={absorptionWarnings} assumptions={["Dilute gas absorption (linear operating line)", "Henry's Law VLE model", "Kremser stage equations", "Log-mean driving force NTU integration"]} />
                <ModuleDiagram moduleId="absorption" /><TheoryPanel moduleId="absorption" /><ReferencePanel moduleId="absorption" /><FunFactCard moduleId="absorption" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/absorption", absorptionIn, calcAbsorption, setAbsorptionRes)} />
                  <ResetButton onClick={() => setAbsorptionIn(defaults.absorption)} />
                </div>
                {absorptionRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Minimum Solvent Rate" value={absorptionRes.lMin} unit="mol/s" />
                      <StatCard title="Operating Solvent Rate" value={absorptionRes.lOper} unit="mol/s" />
                      <StatCard title="Absorption Factor (A)" value={absorptionRes.absorptionFactor} />
                      <StatCard title="Outlet Liquid Comp (x1)" value={absorptionRes.x1} />
                      <StatCard title="Theoretical Stages" value={absorptionRes.nIdeal} />
                      <StatCard title="Actual Stages" value={absorptionRes.nActual} />
                      <StatCard title="NTU_OG" value={absorptionRes.ntu} />
                      <StatCard title="Packed Height (Z)" value={absorptionRes.height} unit="m" />
                    </div>
                    <ExportButton onClick={() => exportCsv("absorption_sizing.csv", absorptionRes)} />
                    <div className="glass-panel rounded-2xl p-5">
                      <p className="text-sm font-medium tracking-tight text-zinc-200">Absorption Operating & Equilibrium Lines</p>
                      <div className="mt-4 flex justify-center">
                        <svg viewBox="0 0 400 300" className="w-full max-w-lg bg-black/20 rounded-xl p-4">
                          <line x1="40" y1="20" x2="40" y2="260" stroke="rgba(255,255,255,0.08)" />
                          <line x1="40" y1="260" x2="380" y2="260" stroke="rgba(255,255,255,0.08)" />
                          
                          <text x="210" y="295" textAnchor="middle" fontSize="10" fill="#71717a">Liquid Mole Fraction (x)</text>
                          <text x="12" y="145" transform="rotate(-90, 12, 145)" textAnchor="middle" fontSize="10" fill="#71717a">Gas Mole Fraction (y)</text>
                          
                          {(() => {
                            const maxX = Math.max(absorptionRes.x1 * 1.2, 0.01);
                            const maxY = Math.max(absorptionIn.y1 * 1.2, 0.01);
                            const scaleX = (val) => 40 + (val / maxX) * 320;
                            const scaleY = (val) => 260 - (val / maxY) * 230;
                            
                            return (
                              <>
                                {/* Equilibrium Line */}
                                <line 
                                  x1={scaleX(0)} 
                                  y1={scaleY(0)} 
                                  x2={scaleX(absorptionRes.x1)} 
                                  y2={scaleY(absorptionIn.m * absorptionRes.x1)} 
                                  stroke="#34d399" 
                                  strokeWidth="2" 
                                  strokeDasharray="4 4"
                                />
                                <text x={scaleX(absorptionRes.x1) - 100} y={scaleY(absorptionIn.m * absorptionRes.x1) + 15} fontSize="8" fill="#34d399">Equilibrium (y = mx)</text>

                                {/* Operating Line */}
                                <line 
                                  x1={scaleX(absorptionIn.x2)} 
                                  y1={scaleY(absorptionIn.y2)} 
                                  x2={scaleX(absorptionRes.x1)} 
                                  y2={scaleY(absorptionIn.y1)} 
                                  stroke="#60a5fa" 
                                  strokeWidth="2.5" 
                                />
                                <text x={scaleX(absorptionRes.x1) - 90} y={scaleY(absorptionIn.y1) - 10} fontSize="8" fill="#60a5fa">Operating Line</text>

                                {/* Start and end points */}
                                <circle cx={scaleX(absorptionIn.x2)} cy={scaleY(absorptionIn.y2)} r="4" fill="#60a5fa" />
                                <circle cx={scaleX(absorptionRes.x1)} cy={scaleY(absorptionIn.y1)} r="4" fill="#60a5fa" />
                                
                                {/* Pinch Point reference */}
                                <circle cx={scaleX(absorptionIn.y1 / absorptionIn.m)} cy={scaleY(absorptionIn.y1)} r="4" fill="#f87171" />
                                <text x={scaleX(absorptionIn.y1 / absorptionIn.m) - 60} y={scaleY(absorptionIn.y1) + 15} fontSize="8" fill="#f87171">Pinch Point (x*, y1)</text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

            {activeTab === "drying" && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {Object.keys(dryingIn).map((key) => (
                    <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={dryingIn[key]} onChange={(v) => setDryingIn((p) => ({ ...p, [key]: v }))} />
                  ))}
                </div>
                <EngineeringPanel warnings={dryingWarnings} assumptions={["Constant rate period governed by surface evaporation", "Linear falling rate drying period", "Negligible heat conduction resistance inside solid"]} />
                <ModuleDiagram moduleId="drying" /><TheoryPanel moduleId="drying" /><ReferencePanel moduleId="drying" /><FunFactCard moduleId="drying" />
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/drying", dryingIn, calcDrying, setDryingRes)} />
                  <ResetButton onClick={() => setDryingIn(defaults.drying)} />
                </div>
                {dryingRes && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Constant Period Time" value={dryingRes.tConstant} unit="h" />
                      <StatCard title="Falling Period Time" value={dryingRes.tFalling} unit="h" />
                      <StatCard title="Total Drying Time" value={dryingRes.tTotal} unit="h" />
                    </div>
                    <ExportButton onClick={() => exportCsv("drying_sizing.csv", dryingRes)} />
                    <LineAreaChart points={dryingRes.dryingCurve || []} xKey="x" yKey="rate" color="#eab308" title="Drying Rate vs Moisture Content (X)" xLabel="Moisture Content X (kg/kg)" yLabel="Drying Rate R (kg/m²h)" yUnit="kg/m²h" />
                  </>
                )}
              </section>
            )}

            {activeTab === "economics" && (
              <section className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex border-b border-white/[0.08] mb-6 overflow-x-auto">
                  {["capital", "interest", "depreciation", "profitability"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setEconSubTab(tab)}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                        econSubTab === tab ? "border-emerald-500 text-emerald-400 bg-white/[0.02]" : "border-transparent text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {tab === "capital" && "Capital & Cost Scaling"}
                      {tab === "interest" && "Interest & TVM"}
                      {tab === "depreciation" && "Depreciation & Taxes"}
                      {tab === "profitability" && "Profitability & BEP"}
                    </button>
                  ))}
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {econSubTab === "capital" && (
                    <>
                      <Field label="Delivered Equipment Cost ($)" value={economicsIn.deliveredEquipmentCost} onChange={(v) => setEconomicsIn((p) => ({ ...p, deliveredEquipmentCost: v }))} />
                      <Field label="Lang Factor" value={economicsIn.langFactor} onChange={(v) => setEconomicsIn((p) => ({ ...p, langFactor: v }))} />
                      <Field label="Working Capital Percent (%)" value={economicsIn.workingCapitalPercent} onChange={(v) => setEconomicsIn((p) => ({ ...p, workingCapitalPercent: v }))} />
                      <Field label="Past Cost Index" value={economicsIn.costIndexPast} onChange={(v) => setEconomicsIn((p) => ({ ...p, costIndexPast: v }))} />
                      <Field label="Present Cost Index" value={economicsIn.costIndexPresent} onChange={(v) => setEconomicsIn((p) => ({ ...p, costIndexPresent: v }))} />
                      <Field label="Scaling Exponent (n)" value={economicsIn.scalingExponent} onChange={(v) => setEconomicsIn((p) => ({ ...p, scalingExponent: v }))} />
                      <Field label="Reference Capacity" value={economicsIn.referenceCapacity} onChange={(v) => setEconomicsIn((p) => ({ ...p, referenceCapacity: v }))} />
                      <Field label="Desired Capacity" value={economicsIn.desiredCapacity} onChange={(v) => setEconomicsIn((p) => ({ ...p, desiredCapacity: v }))} />
                    </>
                  )}
                  {econSubTab === "interest" && (
                    <>
                      <Field label="Principal Sum ($)" value={economicsIn.principal} onChange={(v) => setEconomicsIn((p) => ({ ...p, principal: v }))} />
                      <Field label="Nominal Rate (fraction)" value={economicsIn.nominalRate} onChange={(v) => setEconomicsIn((p) => ({ ...p, nominalRate: v }))} />
                      <Field label="Compounding Periods/Yr" value={economicsIn.interestPeriods} onChange={(v) => setEconomicsIn((p) => ({ ...p, interestPeriods: v }))} />
                      <Field label="Years (n)" value={economicsIn.years} onChange={(v) => setEconomicsIn((p) => ({ ...p, years: v }))} />
                      <Field label="Annual Annuity PMT ($)" value={economicsIn.annuityPayment} onChange={(v) => setEconomicsIn((p) => ({ ...p, annuityPayment: v }))} />
                      <Field label="Capitalized Cost Interest" value={economicsIn.capitalizedCostInterest} onChange={(v) => setEconomicsIn((p) => ({ ...p, capitalizedCostInterest: v }))} />
                    </>
                  )}
                  {econSubTab === "depreciation" && (
                    <>
                      <Field label="Asset Cost (V0) ($)" value={economicsIn.principal} onChange={(v) => setEconomicsIn((p) => ({ ...p, principal: v }))} />
                      <Field label="Salvage Value (Vs) ($)" value={economicsIn.salvageValue} onChange={(v) => setEconomicsIn((p) => ({ ...p, salvageValue: v }))} />
                      <Field label="Asset Life (Years)" value={economicsIn.years} onChange={(v) => setEconomicsIn((p) => ({ ...p, years: v }))} />
                      <Field label="Interest Rate (fraction)" value={economicsIn.nominalRate} onChange={(v) => setEconomicsIn((p) => ({ ...p, nominalRate: v }))} />
                      <Field label="Property Tax Rate (fraction)" value={economicsIn.taxRate} onChange={(v) => setEconomicsIn((p) => ({ ...p, taxRate: v }))} />
                    </>
                  )}
                  {econSubTab === "profitability" && (
                    <>
                      <Field label="Annual Revenue ($)" value={economicsIn.annualRevenue} onChange={(v) => setEconomicsIn((p) => ({ ...p, annualRevenue: v }))} />
                      <Field label="Annual Operating Cost ($)" value={economicsIn.annualOperatingCost} onChange={(v) => setEconomicsIn((p) => ({ ...p, annualOperatingCost: v }))} />
                      <Field label="Income Tax Rate (fraction)" value={economicsIn.incomeTaxRate} onChange={(v) => setEconomicsIn((p) => ({ ...p, incomeTaxRate: v }))} />
                      <Field label="Annual Fixed Cost ($)" value={economicsIn.fixedCost} onChange={(v) => setEconomicsIn((p) => ({ ...p, fixedCost: v }))} />
                      <Field label="Selling Price per Unit ($)" value={economicsIn.sellingPricePerUnit} onChange={(v) => setEconomicsIn((p) => ({ ...p, sellingPricePerUnit: v }))} />
                      <Field label="Variable Cost per Unit ($)" value={economicsIn.variableCostPerUnit} onChange={(v) => setEconomicsIn((p) => ({ ...p, variableCostPerUnit: v }))} />
                    </>
                  )}
                </div>

                <EngineeringPanel warnings={economicsWarnings} assumptions={["Lang factor plant estimation models", "Six-Tenths capacity equipment cost scaling rules", "Compounded interest rates", "Multi-method asset depreciation comparison", "Discounted cash flow profit indices"]} />
                <ModuleDiagram moduleId="economics" /><TheoryPanel moduleId="economics" /><ReferencePanel moduleId="economics" /><FunFactCard moduleId="economics" />
                
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/economics", economicsIn, calcEconomics, setEconomicsRes)} />
                  <ResetButton onClick={() => setEconomicsIn(defaults.economics)} />
                </div>

                {economicsRes && (
                  <>
                    {/* Dynamic results layout */}
                    <div className="space-y-6">
                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Capital Cost Results</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Fixed Capital (FCI)" value={economicsRes.fci} unit="$" />
                          <StatCard title="Working Capital (WCI)" value={economicsRes.wci} unit="$" />
                          <StatCard title="Total Capital (TCI)" value={economicsRes.tci} unit="$" />
                          <StatCard title="Index Corrected Equipment Cost" value={economicsRes.costBaseIndex} unit="$" />
                          <StatCard title="Capacity Scaled Equipment Cost" value={economicsRes.costScaled} unit="$" />
                          <StatCard title="Scaled & Index Corrected Cost" value={economicsRes.costScaledPresent} unit="$" />
                        </div>
                      </div>

                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Time Value of Money & Interest</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Simple Interest" value={economicsRes.simpleInterest} unit="$" />
                          <StatCard title="Simple Future Value" value={economicsRes.simpleFV} unit="$" />
                          <StatCard title="Compound Interest" value={economicsRes.compoundInterest} unit="$" />
                          <StatCard title="Compound Future Value" value={economicsRes.compoundFV} unit="$" />
                          <StatCard title="Effective Annual Rate" value={(economicsRes.effectiveRate * 100).toFixed(4)} unit="%" />
                          <StatCard title="Present Worth of Lump Sum" value={economicsRes.presentWorthOfFV} unit="$" />
                          <StatCard title="Future Worth of Lump Sum" value={economicsRes.futureWorthOfPV} unit="$" />
                          <StatCard title="Present Value of Ordinary Annuity" value={economicsRes.pvAnnuity} unit="$" />
                          <StatCard title="Future Value of Ordinary Annuity" value={economicsRes.fvAnnuity} unit="$" />
                          <StatCard title="Capitalized Cost" value={economicsRes.capitalizedCost} unit="$" />
                        </div>
                      </div>

                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Depreciation & Property Taxes</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Property Tax" value={economicsRes.propertyTax} unit="$/yr" />
                        </div>
                        <div className="mt-4 flex flex-col md:flex-row gap-6 items-center">
                          <div className="glass-panel rounded-2xl p-5 flex-1 w-full">
                            <p className="text-sm font-medium tracking-tight text-zinc-200 mb-3">Book Value Decay Comparison Curves ($)</p>
                            <div className="flex justify-center">
                              <svg viewBox="0 0 420 260" className="w-full max-w-xl bg-black/20 rounded-xl p-4">
                                <line x1="45" y1="30" x2="45" y2="210" stroke="rgba(255,255,255,0.08)" />
                                <line x1="45" y1="210" x2="385" y2="210" stroke="rgba(255,255,255,0.08)" />
                                <text x="215" y="245" textAnchor="middle" fontSize="10" fill="#71717a">Time (Years)</text>
                                <text x="12" y="120" transform="rotate(-90, 12, 120)" textAnchor="middle" fontSize="10" fill="#71717a">Book Value ($)</text>
                                {(() => {
                                  const V0 = Math.max(1, num(economicsIn.principal));
                                  const n = Math.max(1, num(economicsIn.years));
                                  const sched = economicsRes.depreciationSchedule || [];
                                  const scaleX = (y) => 45 + (y / n) * 320;
                                  const scaleY = (v) => 210 - (v / V0) * 170;
                                  let slPath = "", dbPath = "", sydPath = "", sfPath = "";
                                  sched.forEach((pt, idx) => {
                                    const sx = scaleX(pt.year);
                                    const sySl = scaleY(pt.sl);
                                    const syDb = scaleY(pt.db);
                                    const sySyd = scaleY(pt.syd);
                                    const sySf = scaleY(pt.sf);
                                    if (idx === 0) {
                                      slPath += `M ${sx} ${sySl}`;
                                      dbPath += `M ${sx} ${syDb}`;
                                      sydPath += `M ${sx} ${sySyd}`;
                                      sfPath += `M ${sx} ${sySf}`;
                                    } else {
                                      slPath += ` L ${sx} ${sySl}`;
                                      dbPath += ` L ${sx} ${syDb}`;
                                      sydPath += ` L ${sx} ${sySyd}`;
                                      sfPath += ` L ${sx} ${sySf}`;
                                    }
                                  });
                                  return (
                                    <>
                                      <path d={slPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
                                      <path d={dbPath} fill="none" stroke="#10b981" strokeWidth="2" />
                                      <path d={sydPath} fill="none" stroke="#f97316" strokeWidth="2" />
                                      <path d={sfPath} fill="none" stroke="#a855f7" strokeWidth="2" />
                                      <g transform="translate(260, 40)" fontSize="9">
                                        <rect width="110" height="60" fill="rgba(0,0,0,0.6)" rx="4" stroke="rgba(255,255,255,0.05)" />
                                        <circle cx="10" cy="10" r="3" fill="#3b82f6" /><text x="18" y="13" fill="#a1a1aa">Straight Line</text>
                                        <circle cx="10" cy="22" r="3" fill="#10b981" /><text x="18" y="25" fill="#a1a1aa">Declining Bal</text>
                                        <circle cx="10" cy="34" r="3" fill="#f97316" /><text x="18" y="37" fill="#a1a1aa">Sum of Digits</text>
                                        <circle cx="10" cy="46" r="3" fill="#a855f7" /><text x="18" y="49" fill="#a1a1aa">Sinking Fund</text>
                                      </g>
                                      <text x={scaleX(0) + 5} y={scaleY(V0) + 12} fontSize="8" fill="#ffffff">${formatNum(V0)}</text>
                                      <text x={scaleX(n) - 30} y={scaleY(num(economicsIn.salvageValue)) - 8} fontSize="8" fill="#ffffff">${formatNum(num(economicsIn.salvageValue))}</text>
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Profitability & Break-Even Point (BEP)</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Payback Period" value={economicsRes.paybackPeriod === Infinity ? "Infinity" : economicsRes.paybackPeriod.toFixed(4)} unit="Years" />
                          <StatCard title="Return on Investment (ROI)" value={economicsRes.roi.toFixed(4)} unit="%" />
                          <StatCard title="Net Present Value (NPV)" value={economicsRes.npv} unit="$" />
                          <StatCard title="Internal Rate of Return (IRR)" value={(economicsRes.irr * 100).toFixed(4)} unit="%" />
                          <StatCard title="Break-Even Point (Quantity)" value={economicsRes.breakEvenUnits === Infinity ? "Infinity" : economicsRes.breakEvenUnits.toFixed(0)} unit="Units/Yr" />
                          <StatCard title="Break-Even Point (Sales)" value={economicsRes.breakEvenSales === Infinity ? "Infinity" : economicsRes.breakEvenSales} unit="$" />
                        </div>
                        <div className="mt-4 flex flex-col md:flex-row gap-6 items-center">
                          <div className="glass-panel rounded-2xl p-5 flex-1 w-full">
                            <p className="text-sm font-medium tracking-tight text-zinc-200 mb-3">Break-Even Chart Analysis</p>
                            <div className="flex justify-center">
                              <svg viewBox="0 0 420 260" className="w-full max-w-xl bg-black/20 rounded-xl p-4">
                                <line x1="45" y1="30" x2="45" y2="210" stroke="rgba(255,255,255,0.08)" />
                                <line x1="45" y1="210" x2="385" y2="210" stroke="rgba(255,255,255,0.08)" />
                                <text x="215" y="245" textAnchor="middle" fontSize="10" fill="#71717a">Production Quantity (Units/Yr)</text>
                                <text x="12" y="120" transform="rotate(-90, 12, 120)" textAnchor="middle" fontSize="10" fill="#71717a">Amount ($/Yr)</text>
                                {(() => {
                                  const fixedC = Math.max(0, num(economicsIn.fixedCost));
                                  const price = Math.max(0, num(economicsIn.sellingPricePerUnit));
                                  const varC = Math.max(0, num(economicsIn.variableCostPerUnit));
                                  const beUnits = economicsRes.breakEvenUnits;
                                  const limitQty = (beUnits && isFinite(beUnits)) ? Math.max(10, Math.ceil(beUnits * 2)) : 10000;
                                  const maxRev = limitQty * price;
                                  const maxVal = Math.max(1, maxRev, fixedC + limitQty * varC);
                                  const scaleX = (q) => 45 + (q / limitQty) * 320;
                                  const scaleY = (d) => 210 - (d / maxVal) * 170;
                                  const x0 = scaleX(0);
                                  const xEnd = scaleX(limitQty);
                                  const yr0 = scaleY(0);
                                  const yrEnd = scaleY(limitQty * price);
                                  const yc0 = scaleY(fixedC);
                                  const ycEnd = scaleY(fixedC + limitQty * varC);
                                  const showBe = isFinite(beUnits) && beUnits > 0 && beUnits < limitQty;
                                  const xBe = scaleX(beUnits);
                                  const yBe = scaleY(beUnits * price);
                                  const lossPath = `M ${x0} ${yc0} L ${xBe} ${yBe} L ${x0} ${yr0} Z`;
                                  const profitPath = `M ${xBe} ${yBe} L ${xEnd} ${ycEnd} L ${xEnd} ${yrEnd} Z`;
                                  return (
                                    <>
                                      {showBe && (
                                        <>
                                          <path d={lossPath} fill="rgba(239, 68, 68, 0.15)" />
                                          <path d={profitPath} fill="rgba(16, 185, 129, 0.15)" />
                                          <text x={(x0 + xBe)/2} y={(yc0 + yBe)/2 + 25} fill="#f87171" fontSize="8" textAnchor="middle">Loss Zone</text>
                                          <text x={(xBe + xEnd)/2} y={(yBe + ycEnd)/2 - 15} fill="#34d399" fontSize="8" textAnchor="middle">Profit Zone</text>
                                        </>
                                      )}
                                      <line x1={x0} y1={yc0} x2={xEnd} y2={ycEnd} stroke="#f87171" strokeWidth="2" />
                                      <text x={xEnd - 55} y={ycEnd - 5} fill="#f87171" fontSize="8">Total Cost</text>
                                      <line x1={x0} y1={yr0} x2={xEnd} y2={yrEnd} stroke="#60a5fa" strokeWidth="2" />
                                      <text x={xEnd - 65} y={yrEnd - 5} fill="#60a5fa" fontSize="8">Revenue</text>
                                      {showBe && (
                                        <>
                                          <line x1={xBe} y1={scaleY(0)} x2={xBe} y2={yBe} stroke="rgba(255,255,255,0.4)" strokeDasharray="3 3" />
                                          <circle cx={xBe} cy={yBe} r="4" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                                          <g transform={`translate(${xBe - 40}, ${yBe - 30})`}>
                                            <rect width="80" height="20" fill="rgba(0,0,0,0.8)" rx="4" />
                                            <text x="4" y="13" fill="#34d399" fontSize="8" fontWeight="bold">BEP: {beUnits.toFixed(0)} units</text>
                                          </g>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ExportButton onClick={() => exportCsv("process_economics.csv", economicsRes)} />
                    </div>
                  </>
                )}
              </section>
            )}

            {activeTab === "distillation_design" && (
              <section className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex border-b border-white/[0.08] mb-6 overflow-x-auto">
                  {["hydraulics", "stages", "ponchon"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDistillSubTab(tab)}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                        distillSubTab === tab ? "border-emerald-500 text-emerald-400 bg-white/[0.02]" : "border-transparent text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {tab === "hydraulics" && "Tray Hydraulics & Sizing"}
                      {tab === "stages" && "Murphree Tray Stages"}
                      {tab === "ponchon" && "Ponchon-Savarit Enthalpy Method"}
                    </button>
                  ))}
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {distillSubTab === "hydraulics" && (
                    <>
                      <Field label="Vapor Flow Rate (kg/s)" value={distillationDesignIn.vaporFlowRate} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, vaporFlowRate: v }))} />
                      <Field label="Liquid Flow Rate (kg/s)" value={distillationDesignIn.liquidFlowRate} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, liquidFlowRate: v }))} />
                      <Field label="Vapor Density (kg/m³)" value={distillationDesignIn.vaporDensity} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, vaporDensity: v }))} />
                      <Field label="Liquid Density (kg/m³)" value={distillationDesignIn.liquidDensity} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, liquidDensity: v }))} />
                      <Field label="Surface Tension (mN/m)" value={distillationDesignIn.surfaceTension} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, surfaceTension: v }))} />
                      <Field label="Tray Spacing (m)" value={distillationDesignIn.traySpacing} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, traySpacing: v }))} />
                      <Field label="Active Fraction" value={distillationDesignIn.activeFraction} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, activeFraction: v }))} />
                      <Field label="Derate Factor" value={distillationDesignIn.derateFactor} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, derateFactor: v }))} />
                      <Field label="Weir Height (mm)" value={distillationDesignIn.weirHeight} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, weirHeight: v }))} />
                      <Field label="Hole Area Fraction" value={distillationDesignIn.holeAreaFraction} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, holeAreaFraction: v }))} />
                    </>
                  )}
                  {(distillSubTab === "stages" || distillSubTab === "ponchon") && (
                    <>
                      <Field label="Relative Volatility (alpha)" value={distillationDesignIn.alpha} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, alpha: v }))} />
                      <Field label="Distillate Purity (xD)" value={distillationDesignIn.xD} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, xD: v }))} />
                      <Field label="Bottoms impurity (xB)" value={distillationDesignIn.xB} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, xB: v }))} />
                      <Field label="Feed Composition (xF)" value={distillationDesignIn.xF} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, xF: v }))} />
                      <Field label="Feed q-value (thermal)" value={distillationDesignIn.qVal} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, qVal: v }))} />
                      <Field label="Reflux Ratio (R)" value={distillationDesignIn.refluxRatio} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, refluxRatio: v }))} />
                      <Field label="Murphree Efficiency (Emv)" value={distillationDesignIn.murphreeEfficiency} onChange={(v) => setDistillationDesignIn((p) => ({ ...p, murphreeEfficiency: v }))} />
                    </>
                  )}
                </div>

                <EngineeringPanel warnings={distillationDesignWarnings} assumptions={["Steady state binary column operations", "Sieve tray hydraulics model", "Constant molal overflow (for McCabe-Thiele)", "Linear sat liquid/vapor enthalpy paths (for Ponchon-Savarit)"]} />
                <ModuleDiagram moduleId="distillation_design" /><TheoryPanel moduleId="distillation_design" /><ReferencePanel moduleId="distillation_design" /><FunFactCard moduleId="distillation_design" />
                
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/distillation_design", distillationDesignIn, calcDistillationDesign, setDistillationDesignRes)} />
                  <ResetButton onClick={() => setDistillationDesignIn(defaults.distillation_design)} />
                </div>

                {distillationDesignRes && (
                  <>
                    <div className="space-y-6">
                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Sieve Tray Hydraulics & Diameter Sizing</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Souders-Brown Csb" value={distillationDesignRes.Csb} unit="m/s" />
                          <StatCard title="Flooding Velocity (uf)" value={distillationDesignRes.uf} unit="m/s" />
                          <StatCard title="Sizing Velocity (us)" value={distillationDesignRes.us} unit="m/s" />
                          <StatCard title="Active Bubbling Area" value={distillationDesignRes.Ac} unit="m²" />
                          <StatCard title="Column Diameter (Dc)" value={distillationDesignRes.Dc} unit="m" />
                          <StatCard title="Dry Plate Drop (hd)" value={distillationDesignRes.hd} unit="mm liquid" />
                          <StatCard title="Total Plate Drop" value={distillationDesignRes.totalTrayPressureDrop} unit="mm liquid" />
                          <StatCard title="Vapor Hole Velocity" value={distillationDesignRes.uHole} unit="m/s" />
                          <StatCard title="Min Weep Velocity Limit" value={distillationDesignRes.minWeepVelocity} unit="m/s" />
                        </div>
                      </div>

                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Staging & Reflux Results</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Murphree-Corrected Stages" value={distillationDesignRes.nStages} unit="plates" />
                          <StatCard title="Ponchon-Savarit Stages" value={distillationDesignRes.psCount} unit="plates" />
                          <StatCard title="Condenser Focal Point (QD)" value={distillationDesignRes.QD} unit="J/mol" />
                          <StatCard title="Reboiler Focal Point (QB)" value={distillationDesignRes.QB} unit="J/mol" />
                        </div>

                        {distillSubTab === "ponchon" && (
                          <div className="mt-4 flex flex-col md:flex-row gap-6 items-center">
                            <div className="glass-panel rounded-2xl p-5 flex-1 w-full">
                              <p className="text-sm font-medium tracking-tight text-zinc-200 mb-3">Ponchon-Savarit Enthalpy-Concentration Diagram</p>
                              <div className="flex justify-center">
                                <svg viewBox="0 0 420 280" className="w-full max-w-xl bg-black/20 rounded-xl p-4">
                                  {/* Grid Lines */}
                                  <line x1="45" y1="30" x2="45" y2="230" stroke="rgba(255,255,255,0.08)" />
                                  <line x1="45" y1="230" x2="385" y2="230" stroke="rgba(255,255,255,0.08)" />
                                  
                                  <text x="215" y="265" textAnchor="middle" fontSize="10" fill="#71717a">Mole Fraction z, x, y</text>
                                  <text x="12" y="130" transform="rotate(-90, 12, 130)" textAnchor="middle" fontSize="10" fill="#71717a">Enthalpy H, h (kJ/mol)</text>

                                  {(() => {
                                    const QD = distillationDesignRes.QD;
                                    const QB = distillationDesignRes.QB;
                                    const curves = distillationDesignRes.enthalpyCurves || [];
                                    const stagesPS = distillationDesignRes.psStages || [];

                                    const scaleX = (x) => 45 + x * 320;
                                    const scaleY = (val) => 230 - ((val - QB) / Math.max(QD - QB, 1e-9)) * 190;

                                    let hLine = "";
                                    let HLine = "";

                                    curves.forEach((pt, idx) => {
                                      const sx = scaleX(pt.z);
                                      const syh = scaleY(pt.h);
                                      const syH = scaleY(pt.H);
                                      if (idx === 0) {
                                        hLine += `M ${sx} ${syh}`;
                                        HLine += `M ${sx} ${syH}`;
                                      } else {
                                        hLine += ` L ${sx} ${syh}`;
                                        HLine += ` L ${sx} ${syH}`;
                                      }
                                    });

                                    return (
                                      <>
                                        {/* Enthalpy curves */}
                                        <path d={hLine} fill="none" stroke="#60a5fa" strokeWidth="2" />
                                        <path d={HLine} fill="none" stroke="#f87171" strokeWidth="2" />
                                        <text x="70" y={scaleY(curves[0].h) - 10} fill="#60a5fa" fontSize="8">Liquid (h)</text>
                                        <text x="70" y={scaleY(curves[0].H) - 10} fill="#f87171" fontSize="8">Vapor (H)</text>

                                        {/* Focal points */}
                                        <circle cx={scaleX(distillationDesignIn.xD)} cy={scaleY(QD)} r="4" fill="#34d399" />
                                        <text x={scaleX(distillationDesignIn.xD) + 8} y={scaleY(QD) + 3} fill="#34d399" fontSize="8">QD</text>

                                        <circle cx={scaleX(distillationDesignIn.xB)} cy={scaleY(QB)} r="4" fill="#a78bfa" />
                                        <text x={scaleX(distillationDesignIn.xB) + 8} y={scaleY(QB) + 3} fill="#a78bfa" fontSize="8">QB</text>

                                        {/* Stage lines */}
                                        {stagesPS.map((st, sIdx) => {
                                          if (sIdx % 2 === 1 && sIdx < stagesPS.length) {
                                            const prev = stagesPS[sIdx - 1];
                                            return (
                                              <g key={sIdx}>
                                                {/* Tie Line */}
                                                <line x1={scaleX(prev.x)} y1={scaleY(prev.h)} x2={scaleX(st.x)} y2={scaleY(st.H)} stroke="#eab308" strokeWidth="1" strokeDasharray="2 2" />
                                              </g>
                                            );
                                          } else if (sIdx > 0) {
                                            const prev = stagesPS[sIdx - 1];
                                            // Operating line to focal point
                                            const QFocal = prev.x > distillationDesignRes.xInt ? QD : QB;
                                            const xFocal = prev.x > distillationDesignRes.xInt ? distillationDesignIn.xD : distillationDesignIn.xB;
                                            return (
                                              <line key={sIdx} x1={scaleX(prev.x)} y1={scaleY(prev.h)} x2={scaleX(xFocal)} y2={scaleY(QFocal)} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                                            );
                                          }
                                          return null;
                                        })}
                                      </>
                                    );
                                  })()}
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <ExportButton onClick={() => exportCsv("distillation_tray_design.csv", distillationDesignRes)} />
                    </div>
                  </>
                )}
              </section>
            )}

            {activeTab === "extraction_leaching" && (
              <section className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex border-b border-white/[0.08] mb-6 overflow-x-auto">
                  {["extraction", "leaching"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setExtractSubTab(tab)}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                        extractSubTab === tab ? "border-emerald-500 text-emerald-400 bg-white/[0.02]" : "border-transparent text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {tab === "extraction" && "Liquid-Liquid Extraction"}
                      {tab === "leaching" && "Solid-Liquid Leaching"}
                    </button>
                  ))}
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {extractSubTab === "extraction" && (
                    <>
                      <Field label="Feed Solution Rate (kg/h)" value={extractionLeachingIn.feedRate} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, feedRate: v }))} />
                      <Field label="Feed Solute Fraction (xF)" value={extractionLeachingIn.xF} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, xF: v }))} />
                      <Field label="Total Solvent Rate (kg/h)" value={extractionLeachingIn.solventRate} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, solventRate: v }))} />
                      <Field label="Solvent Solute Fraction (yS)" value={extractionLeachingIn.yS} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, yS: v }))} />
                      <Field label="Partition Coeff (K = y/x)" value={extractionLeachingIn.partitionCoefficient} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, partitionCoefficient: v }))} />
                      <Field label="Cross-Current Stages" value={extractionLeachingIn.extractionStages} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, extractionStages: v }))} />
                      <Field label="Target CC Raffinate" value={extractionLeachingIn.targetRaffinate} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, targetRaffinate: v }))} />
                    </>
                  )}
                  {extractSubTab === "leaching" && (
                    <>
                      <Field label="Feed Inert Solid (kg/h)" value={extractionLeachingIn.feedInertSolid} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, feedInertSolid: v }))} />
                      <Field label="Feed Solute (kg/h)" value={extractionLeachingIn.feedSolute} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, feedSolute: v }))} />
                      <Field label="Leaching Solvent Rate (kg/h)" value={extractionLeachingIn.leachingSolventRate} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, leachingSolventRate: v }))} />
                      <Field label="Solvent Retention (soln/inert)" value={extractionLeachingIn.solventRetention} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, solventRetention: v }))} />
                      <Field label="Target Recovery (fraction)" value={extractionLeachingIn.leachingTargetRecovery} onChange={(v) => setExtractionLeachingIn((p) => ({ ...p, leachingTargetRecovery: v }))} />
                    </>
                  )}
                </div>

                <EngineeringPanel warnings={extractionLeachingWarnings} assumptions={["Immiscible carrier and solvent assumption (dilute LLE limit)", "Complete solute dissolution in leaching stages", "Constant underflow retention in solid cake"]} />
                <ModuleDiagram moduleId="extraction_leaching" /><TheoryPanel moduleId="extraction_leaching" /><ReferencePanel moduleId="extraction_leaching" /><FunFactCard moduleId="extraction_leaching" />
                
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/extraction_leaching", extractionLeachingIn, calcExtractionLeaching, setExtractionLeachingRes)} />
                  <ResetButton onClick={() => setExtractionLeachingIn(defaults.extraction_leaching)} />
                </div>

                {extractionLeachingRes && (
                  <>
                    <div className="space-y-6">
                      {extractSubTab === "extraction" && (
                        <div className="border-t border-white/[0.08] pt-6">
                          <h4 className="text-sm font-semibold text-zinc-300 mb-3">Liquid-Liquid Extraction Results</h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <StatCard title="Final Raffinate Fraction" value={extractionLeachingRes.finalRaffinateCross.toFixed(4)} unit="fraction" />
                            <StatCard title="Cross-Current Recovery" value={extractionLeachingRes.recoveryCross.toFixed(2)} unit="%" />
                            <StatCard title="Counter-Current Ideal Stages" value={extractionLeachingRes.ccStagesReq.toFixed(2)} unit="stages" />
                          </div>

                          <div className="mt-4 glass-panel rounded-2xl p-5 w-full">
                            <p className="text-sm font-medium tracking-tight text-zinc-200 mb-3">Cross-Current Stage Concentration Decay</p>
                            <div className="flex justify-center">
                              <svg viewBox="0 0 420 220" className="w-full max-w-xl bg-black/20 rounded-xl p-4">
                                <line x1="45" y1="20" x2="45" y2="170" stroke="rgba(255,255,255,0.08)" />
                                <line x1="45" y1="170" x2="385" y2="170" stroke="rgba(255,255,255,0.08)" />
                                <text x="215" y="205" textAnchor="middle" fontSize="10" fill="#71717a">Extraction Stage Index</text>
                                <text x="12" y="95" transform="rotate(-90, 12, 95)" textAnchor="middle" fontSize="10" fill="#71717a">Solute fraction x_i</text>

                                {(() => {
                                  const stepsL = extractionLeachingRes.crossStages || [];
                                  const maxVal = Math.max(0.1, extractionLeachingIn.xF);
                                  const scaleX = (idx) => 45 + (idx / Math.max(stepsL.length - 1, 1)) * 320;
                                  const scaleY = (val) => 170 - (val / maxVal) * 140;

                                  let rPath = "";
                                  stepsL.forEach((pt, idx) => {
                                    const sx = scaleX(pt.stage);
                                    const sy = scaleY(pt.x);
                                    if (idx === 0) rPath += `M ${sx} ${sy}`; else rPath += ` L ${sx} ${sy}`;
                                  });

                                  return (
                                    <>
                                      <path d={rPath} fill="none" stroke="#60a5fa" strokeWidth="2" />
                                      {stepsL.map((pt, idx) => (
                                        <g key={idx}>
                                          <circle cx={scaleX(pt.stage)} cy={scaleY(pt.x)} r="3.5" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.5" />
                                          <text x={scaleX(pt.stage) - 10} y={scaleY(pt.x) - 8} fill="#a1a1aa" fontSize="7">{pt.x.toFixed(4)}</text>
                                        </g>
                                      ))}
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {extractSubTab === "leaching" && (
                        <div className="border-t border-white/[0.08] pt-6">
                          <h4 className="text-sm font-semibold text-zinc-300 mb-3">Solid-Liquid Leaching Results</h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <StatCard title="Ideal Leaching Stages" value={extractionLeachingRes.leachingStagesReq.toFixed(2)} unit="stages" />
                          </div>

                          <div className="mt-4 glass-panel rounded-2xl p-5 w-full">
                            <p className="text-sm font-medium tracking-tight text-zinc-200 mb-3">Leaching Underflow Concentration Stepping</p>
                            <div className="flex justify-center">
                              <svg viewBox="0 0 420 220" className="w-full max-w-xl bg-black/20 rounded-xl p-4">
                                <line x1="45" y1="20" x2="45" y2="170" stroke="rgba(255,255,255,0.08)" />
                                <line x1="45" y1="170" x2="385" y2="170" stroke="rgba(255,255,255,0.08)" />
                                <text x="215" y="205" textAnchor="middle" fontSize="10" fill="#71717a">Leaching Stage Index</text>
                                <text x="12" y="95" transform="rotate(-90, 12, 95)" textAnchor="middle" fontSize="10" fill="#71717a">Solute fraction in Underflow (y)</text>

                                {(() => {
                                  const stepsLeach = extractionLeachingRes.leachingStagesDetail || [];
                                  const maxVal = Math.max(0.1, stepsLeach[0]?.y || 0.1);
                                  const scaleX = (idx) => 45 + (idx / Math.max(stepsLeach.length - 1, 1)) * 320;
                                  const scaleY = (val) => 170 - (val / maxVal) * 140;

                                  let rPath = "";
                                  stepsLeach.forEach((pt, idx) => {
                                    const sx = scaleX(pt.stage);
                                    const sy = scaleY(pt.y);
                                    if (idx === 0) rPath += `M ${sx} ${sy}`; else rPath += ` L ${sx} ${sy}`;
                                  });

                                  return (
                                    <>
                                      <path d={rPath} fill="none" stroke="#a78bfa" strokeWidth="2" />
                                      {stepsLeach.map((pt, idx) => (
                                        <g key={idx}>
                                          <circle cx={scaleX(pt.stage)} cy={scaleY(pt.y)} r="3.5" fill="#ffffff" stroke="#a78bfa" strokeWidth="1.5" />
                                          <text x={scaleX(pt.stage) - 10} y={scaleY(pt.y) - 8} fill="#a1a1aa" fontSize="7">{pt.y.toFixed(4)}</text>
                                        </g>
                                      ))}
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <ExportButton onClick={() => exportCsv("extraction_leaching_design.csv", extractionLeachingRes)} />
                    </div>
                  </>
                )}
              </section>
            )}

            {activeTab === "adsorption" && (
              <section className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex border-b border-white/[0.08] mb-6 overflow-x-auto">
                  {["isotherms", "breakthrough"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAdsorbSubTab(tab)}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                        adsorbSubTab === tab ? "border-emerald-500 text-emerald-400 bg-white/[0.02]" : "border-transparent text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {tab === "isotherms" && "Isotherm Models"}
                      {tab === "breakthrough" && "Fixed-Bed Breakthrough"}
                    </button>
                  ))}
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {adsorbSubTab === "isotherms" && (
                    <>
                      <div className="md:col-span-3 mb-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Adsorption Isotherm Model</label>
                        <select value={adsorptionIn.adsorptionModel} onChange={(e) => setAdsorptionIn((p) => ({ ...p, adsorptionModel: e.target.value }))} className="glass-input mt-1.5 w-full rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none">
                          <option value="langmuir">Langmuir Isotherm</option>
                          <option value="freundlich">Freundlich Isotherm</option>
                        </select>
                      </div>
                      <Field label="Langmuir Monolayer Qm (mg/g)" value={adsorptionIn.langmuirQm} onChange={(v) => setAdsorptionIn((p) => ({ ...p, langmuirQm: v }))} />
                      <Field label="Langmuir Coeff Kl (L/mg)" value={adsorptionIn.langmuirKl} onChange={(v) => setAdsorptionIn((p) => ({ ...p, langmuirKl: v }))} />
                      <Field label="Freundlich Coeff Kf" value={adsorptionIn.freundlichKf} onChange={(v) => setAdsorptionIn((p) => ({ ...p, freundlichKf: v }))} />
                      <Field label="Freundlich n (intensity)" value={adsorptionIn.freundlichN} onChange={(v) => setAdsorptionIn((p) => ({ ...p, freundlichN: v }))} />
                      <Field label="Equil Adsorbate Conc C (mg/L)" value={adsorptionIn.adsorbateConc} onChange={(v) => setAdsorptionIn((p) => ({ ...p, adsorbateConc: v }))} />
                    </>
                  )}
                  {adsorbSubTab === "breakthrough" && (
                    <>
                      <Field label="Bed Length (m)" value={adsorptionIn.bedLength} onChange={(v) => setAdsorptionIn((p) => ({ ...p, bedLength: v }))} />
                      <Field label="Bed Diameter (m)" value={adsorptionIn.bedDiameter} onChange={(v) => setAdsorptionIn((p) => ({ ...p, bedDiameter: v }))} />
                      <Field label="Bed Voidage (fraction)" value={adsorptionIn.bedVoidage} onChange={(v) => setAdsorptionIn((p) => ({ ...p, bedVoidage: v }))} />
                      <Field label="Adsorbent Density (kg/m³)" value={adsorptionIn.adsorbentDensity} onChange={(v) => setAdsorptionIn((p) => ({ ...p, adsorbentDensity: v }))} />
                      <Field label="Feed Flow Rate (m³/h)" value={adsorptionIn.feedFlowRate} onChange={(v) => setAdsorptionIn((p) => ({ ...p, feedFlowRate: v }))} />
                      <Field label="Feed Solute Conc C0 (mg/L)" value={adsorptionIn.feedConcentration} onChange={(v) => setAdsorptionIn((p) => ({ ...p, feedConcentration: v }))} />
                      <Field label="Thomas Rate Kth (L/mg·h)" value={adsorptionIn.thomasRateConstant} onChange={(v) => setAdsorptionIn((p) => ({ ...p, thomasRateConstant: v }))} />
                      <Field label="Breakthrough Ratio (C/C0)" value={adsorptionIn.breakthroughRatio} onChange={(v) => setAdsorptionIn((p) => ({ ...p, breakthroughRatio: v }))} />
                      <Field label="Saturation Ratio (C/C0)" value={adsorptionIn.saturationRatio} onChange={(v) => setAdsorptionIn((p) => ({ ...p, saturationRatio: v }))} />
                    </>
                  )}
                </div>

                <EngineeringPanel warnings={adsorptionWarnings} assumptions={["Langmuir monolayer surface saturation model", "Freundlich empirical multi-layer capacity model", "Thomas fixed-bed breakthrough transport kinetics"]} />
                <ModuleDiagram moduleId="adsorption" /><TheoryPanel moduleId="adsorption" /><ReferencePanel moduleId="adsorption" /><FunFactCard moduleId="adsorption" />
                
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/adsorption", adsorptionIn, calcAdsorption, setAdsorptionRes)} />
                  <ResetButton onClick={() => setAdsorptionIn(defaults.adsorption)} />
                </div>

                {adsorptionRes && (
                  <>
                    <div className="space-y-6">
                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Adsorption & Bed Capacity results</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Isotherm capacity (q)" value={adsorptionRes.qCapacity.toFixed(4)} unit="mg/g" />
                          <StatCard title="Adsorbent Bed Mass" value={adsorptionRes.mBed.toFixed(2)} unit="kg" />
                          <StatCard title="Feed Capacity Loading (q0)" value={adsorptionRes.q0.toFixed(4)} unit="mg/g" />
                          <StatCard title="Stoichiometric Time (t0.5)" value={adsorptionRes.t05.toFixed(4)} unit="h" />
                          <StatCard title="Breakthrough Time (tb)" value={adsorptionRes.tBreakthrough.toFixed(4)} unit="h" />
                          <StatCard title="Saturation Time (ts)" value={adsorptionRes.tSaturation.toFixed(4)} unit="h" />
                          <StatCard title="Length of Unused Bed (LUB)" value={adsorptionRes.LUB.toFixed(4)} unit="m" />
                        </div>
                      </div>

                      {adsorbSubTab === "breakthrough" && (
                        <div className="border-t border-white/[0.08] pt-6 flex flex-col md:flex-row gap-6 items-center">
                          <div className="glass-panel rounded-2xl p-5 flex-1 w-full">
                            <p className="text-sm font-medium tracking-tight text-zinc-200 mb-3">Fixed-Bed Adsorption Breakthrough S-Curve</p>
                            <div className="flex justify-center">
                              <svg viewBox="0 0 420 220" className="w-full max-w-xl bg-black/20 rounded-xl p-4">
                                <line x1="45" y1="20" x2="45" y2="170" stroke="rgba(255,255,255,0.08)" />
                                <line x1="45" y1="170" x2="385" y2="170" stroke="rgba(255,255,255,0.08)" />
                                <text x="215" y="205" textAnchor="middle" fontSize="10" fill="#71717a">Time (Hours)</text>
                                <text x="12" y="95" transform="rotate(-90, 12, 95)" textAnchor="middle" fontSize="10" fill="#71717a">Effluent Ratio C/C0</text>

                                {(() => {
                                  const listT = adsorptionRes.breakthroughCurve || [];
                                  const scaleX = (tVal) => 45 + (tVal / Math.max(listT[listT.length - 1]?.t, 1)) * 320;
                                  const scaleY = (ratioVal) => 170 - ratioVal * 140;

                                  let btPath = "";
                                  listT.forEach((pt, idx) => {
                                    const sx = scaleX(pt.t);
                                    const sy = scaleY(pt.ratio);
                                    if (idx === 0) btPath += `M ${sx} ${sy}`; else btPath += ` L ${sx} ${sy}`;
                                  });

                                  const xbPoint = scaleX(adsorptionRes.tBreakthrough);
                                  const ybPoint = scaleY(adsorptionIn.breakthroughRatio);
                                  
                                  const xsPoint = scaleX(adsorptionRes.tSaturation);
                                  const ysPoint = scaleY(adsorptionIn.saturationRatio);

                                  return (
                                    <>
                                      {/* breakthrough curve path */}
                                      <path d={btPath} fill="none" stroke="#eab308" strokeWidth="2.5" />
                                      
                                      {/* Breakthrough node */}
                                      <line x1={xbPoint} y1={scaleY(0)} x2={xbPoint} y2={ybPoint} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
                                      <circle cx={xbPoint} cy={ybPoint} r="4" fill="#ffffff" stroke="#f87171" strokeWidth="1.5" />
                                      <text x={xbPoint - 15} y={ybPoint - 8} fill="#f87171" fontSize="7" fontWeight="bold">tb: {adsorptionRes.tBreakthrough.toFixed(1)}h</text>
                                      
                                      {/* Saturation node */}
                                      <line x1={xsPoint} y1={scaleY(0)} x2={xsPoint} y2={ysPoint} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
                                      <circle cx={xsPoint} cy={ysPoint} r="4" fill="#ffffff" stroke="#34d399" strokeWidth="1.5" />
                                      <text x={xsPoint + 8} y={ysPoint + 10} fill="#34d399" fontSize="7" fontWeight="bold">ts: {adsorptionRes.tSaturation.toFixed(1)}h</text>
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <ExportButton onClick={() => exportCsv("adsorbent_breakthrough.csv", adsorptionRes)} />
                    </div>
                  </>
                )}
              </section>
            )}

            {activeTab === "humidification" && (
              <section className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex border-b border-white/[0.08] mb-6 overflow-x-auto">
                  {["properties", "cooling"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setHumidSubTab(tab)}
                      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                        humidSubTab === tab ? "border-emerald-500 text-emerald-400 bg-white/[0.02]" : "border-transparent text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {tab === "properties" && "Psychrometric Properties"}
                      {tab === "cooling" && "Cooling Tower Sizing"}
                    </button>
                  ))}
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {humidSubTab === "properties" && (
                    <>
                      <Field label="Dry Bulb Temp (C)" value={humidificationIn.dryBulbTemp} onChange={(v) => setHumidificationIn((p) => ({ ...p, dryBulbTemp: v }))} />
                      <Field label="Relative Humidity (%)" value={humidificationIn.relativeHumidity} onChange={(v) => setHumidificationIn((p) => ({ ...p, relativeHumidity: v }))} />
                      <Field label="Total Pressure (Pa)" value={humidificationIn.totalPressure} onChange={(v) => setHumidificationIn((p) => ({ ...p, totalPressure: v }))} />
                    </>
                  )}
                  {humidSubTab === "cooling" && (
                    <>
                      <Field label="Water Inlet Temp (C)" value={humidificationIn.waterInletTemp} onChange={(v) => setHumidificationIn((p) => ({ ...p, waterInletTemp: v }))} />
                      <Field label="Water Outlet Temp (C)" value={humidificationIn.waterOutletTemp} onChange={(v) => setHumidificationIn((p) => ({ ...p, waterOutletTemp: v }))} />
                      <Field label="Air Wet-Bulb Inlet (C)" value={humidificationIn.airInletWetBulb} onChange={(v) => setHumidificationIn((p) => ({ ...p, airInletWetBulb: v }))} />
                      <Field label="Liquid/Gas Ratio L/G" value={humidificationIn.liquidGasRatio} onChange={(v) => setHumidificationIn((p) => ({ ...p, liquidGasRatio: v }))} />
                      <Field label="Overall HTU (m)" value={humidificationIn.overallHTU} onChange={(v) => setHumidificationIn((p) => ({ ...p, overallHTU: v }))} />
                    </>
                  )}
                </div>

                <EngineeringPanel warnings={humidificationWarnings} assumptions={["Merkel equation cooling tower sizing", "Antoine saturated vapor pressure models", "Adiabatic air water energy transfers"]} />
                <ModuleDiagram moduleId="humidification" /><TheoryPanel moduleId="humidification" /><ReferencePanel moduleId="humidification" /><FunFactCard moduleId="humidification" />
                
                <div className="flex items-center">
                  <SimButton onClick={() => simulate("/api/humidification", humidificationIn, calcHumidification, setHumidificationRes)} />
                  <ResetButton onClick={() => setHumidificationIn(defaults.humidification)} />
                </div>

                {humidificationRes && (
                  <>
                    <div className="space-y-6">
                      <div className="border-t border-white/[0.08] pt-6">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">Humidification & Cooling Results</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <StatCard title="Water Sat Pressure" value={humidificationRes.pSat.toFixed(0)} unit="Pa" />
                          <StatCard title="Water Vapor Pressure" value={humidificationRes.pV.toFixed(0)} unit="Pa" />
                          <StatCard title="Humidity Ratio (Y)" value={humidificationRes.Y.toFixed(5)} unit="kg/kg dry air" />
                          <StatCard title="Dew Point Temperature" value={humidificationRes.Tdp.toFixed(2)} unit="°C" />
                          <StatCard title="Humid Heat (cs)" value={humidificationRes.cs.toFixed(4)} unit="kJ/kg·K" />
                          <StatCard title="Humid Volume (vH)" value={humidificationRes.vH.toFixed(4)} unit="m³/kg" />
                          <StatCard title="Humid Air Enthalpy" value={humidificationRes.Ha.toFixed(2)} unit="kJ/kg" />
                          <StatCard title="Cooling Tower NTU" value={humidificationRes.ntu.toFixed(4)} unit="units" />
                          <StatCard title="Packed Column Sizing Height" value={humidificationRes.coolingTowerHeight.toFixed(4)} unit="m" />
                        </div>
                      </div>

                      {humidSubTab === "cooling" && (
                        <div className="border-t border-white/[0.08] pt-6 flex flex-col md:flex-row gap-6 items-center">
                          <div className="glass-panel rounded-2xl p-5 flex-1 w-full">
                            <p className="text-sm font-medium tracking-tight text-zinc-200 mb-3">Cooling Tower Enthalpy Operating Line vs Equilibrium</p>
                            <div className="flex justify-center">
                              <svg viewBox="0 0 420 240" className="w-full max-w-xl bg-black/20 rounded-xl p-4">
                                <line x1="45" y1="20" x2="45" y2="190" stroke="rgba(255,255,255,0.08)" />
                                <line x1="45" y1="190" x2="385" y2="190" stroke="rgba(255,255,255,0.08)" />
                                <text x="215" y="225" textAnchor="middle" fontSize="10" fill="#71717a">Water Temperature T (°C)</text>
                                <text x="12" y="105" transform="rotate(-90, 12, 105)" textAnchor="middle" fontSize="10" fill="#71717a">Air Enthalpy H (kJ/kg)</text>

                                {(() => {
                                  const cList = humidificationRes.coolingPath || [];
                                  const minT = humidificationIn.waterOutletTemp - 2;
                                  const maxT = humidificationIn.waterInletTemp + 2;
                                  
                                  const minH = cList[0]?.Hy - 10;
                                  const maxH = cList[cList.length - 1]?.HStar + 10;

                                  const scaleX = (tVal) => 45 + ((tVal - minT) / Math.max(maxT - minT, 1e-9)) * 320;
                                  const scaleY = (hVal) => 190 - ((hVal - minH) / Math.max(maxH - minH, 1e-9)) * 150;

                                  let hsPath = "";
                                  let hyPath = "";
                                  cList.forEach((pt, idx) => {
                                    const sx = scaleX(pt.temp);
                                    const syStar = scaleY(pt.HStar);
                                    const syy = scaleY(pt.Hy);
                                    if (idx === 0) {
                                      hsPath += `M ${sx} ${syStar}`;
                                      hyPath += `M ${sx} ${syy}`;
                                    } else {
                                      hsPath += ` L ${sx} ${syStar}`;
                                      hyPath += ` L ${sx} ${syy}`;
                                    }
                                  });

                                  return (
                                    <g>
                                      {/* Saturated Enthalpy curve H* */}
                                      <path d={hsPath} fill="none" stroke="#f87171" strokeWidth="2.5" />
                                      <text x="60" y={scaleY(cList[0].HStar) - 10} fill="#f87171" fontSize="7">Sat Enthalpy H*</text>
                                      
                                      {/* Operating Air Enthalpy line Hy */}
                                      <path d={hyPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" />
                                      <text x="60" y={scaleY(cList[0].Hy) + 12} fill="#60a5fa" fontSize="7">Operating Line Hy</text>
                                    </g>
                                  );
                                })()}
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <ExportButton onClick={() => exportCsv("cooling_tower_properties.csv", humidificationRes)} />
                    </div>
                  </>
                )}
              </section>
            )}

            {strategicTopicGuides[activeTab] && (
              <section className="space-y-6">
                <div className="glass-panel rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-zinc-300">Integrated Chemical Engineering Topic Workspace</h4>
                  <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                    This module is a high-level design workspace. Use the related simulation modules below for detailed calculations and equipment checks.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {strategicTopicGuides[activeTab].related.map((moduleId) => (
                      <button
                        key={moduleId}
                        onClick={() => setActiveTab(moduleId)}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left text-sm text-zinc-300 transition-all hover:bg-white/[0.05]"
                      >
                        Open {tabs.find((tab) => tab.id === moduleId)?.label || moduleId}
                      </button>
                    ))}
                  </div>
                </div>

                <EngineeringPanel warnings={[]} assumptions={strategicTopicGuides[activeTab].assumptions} />
                <TheoryPanel moduleId={activeTab} />
                <ReferencePanel moduleId={activeTab} />
                <FunFactCard moduleId={activeTab} />
              </section>
            )}

            {activeTab === "history" && (
              <section className="space-y-5">
                <input value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} placeholder="Filter by module, input, or result..." className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
                <div className="flex items-center gap-3">
                  <SimButton onClick={loadHistory} />
                  <ExportButton onClick={() => exportCsv("simulation_history.csv", historyRes)} />
                </div>
                <div className="space-y-3">
                  {filteredHistory.length === 0 ? (
                    <p className="text-sm text-zinc-600">No saved records found.</p>
                  ) : (
                    filteredHistory.map((item) => (
                      <div key={item.id} className="glass-panel rounded-2xl p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-medium text-zinc-300">{item.moduleType}</p>
                          <p className="text-[11px] text-zinc-600">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-600">Inputs</p>
                        <pre className="mt-1 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-zinc-400 font-mono">{JSON.stringify(item.inputs, null, 2)}</pre>
                        <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-600">Results</p>
                        <pre className="mt-1 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-zinc-400 font-mono">{JSON.stringify(item.results, null, 2)}</pre>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
