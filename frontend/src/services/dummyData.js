/**
 * Dummy Data and Live Telemetry Simulation Service
 * Styled for Industrial Control Room aesthetics.
 */

// Generate a random float within a range
const randomRange = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

// Generate a random int within a range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generates historical hourly log data for the past 24 hours.
 */
export const generateHistoricalData = (hours = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourString = `${String(time.getHours()).padStart(2, '0')}:00`;
    
    // Simulate diurnal variation + occasional spikes
    const isSpike = i === 12 || i === 4; // Simulate spikes 12h and 4h ago
    
    const temperature = isSpike 
      ? randomRange(90, 115) 
      : randomRange(35, 65);
      
    const gas_level = isSpike 
      ? randomRange(65, 88) 
      : randomRange(5, 25);
      
    const vibration = isSpike 
      ? randomRange(70, 95) 
      : randomRange(8, 30);
      
    const worker_count = randomInt(5, 45);
    const ppe_compliance = isSpike ? 0 : 1;
    
    // Calculate simulated risk score (similar to risk_engine formula)
    const base_risk = 5.0;
    const temp_norm = (temperature - 20) / 100;
    const gas_norm = gas_level / 100;
    const vib_norm = vibration / 100;
    
    const synergy = temp_norm * gas_norm * 45;
    const vib_contrib = vib_norm * 15;
    const ppe_penalty = (1 - ppe_compliance) * 20;
    const exposure = (worker_count / 50) * (gas_norm * 0.5 + vib_norm * 0.5) * 10;
    
    let risk_score = base_risk + synergy + vib_contrib + ppe_penalty + exposure + randomRange(-2, 2);
    risk_score = Math.max(0, Math.min(100, Math.round(risk_score * 100) / 100));
    
    data.push({
      time: hourString,
      temperature,
      gas_level,
      vibration,
      risk_score,
      worker_count
    });
  }
  
  return data;
};

/**
 * Returns a list of initial safety alerts.
 */
export const getInitialAlerts = () => [
  {
    id: 1,
    type: "Gas Leak",
    title: "High Carbon Monoxide Levels",
    severity: "Critical",
    status: "Active",
    timestamp: "18:10:04",
    location: "Zone B - Boiler Room",
    value: "82.5 ppm",
    threshold: "50 ppm"
  },
  {
    id: 2,
    type: "Vibration Alert",
    title: "Excessive Vibration on Turbine #4",
    severity: "High",
    status: "Active",
    timestamp: "18:05:12",
    location: "Zone A - Generator Hall",
    value: "94.2 mm/s",
    threshold: "75 mm/s"
  },
  {
    id: 3,
    type: "PPE Violation",
    title: "Unhelmeted Worker Detected",
    severity: "Medium",
    status: "Acknowledged",
    timestamp: "17:54:30",
    location: "Zone C - Loading Bay 3",
    value: "Compliance breach",
    threshold: "100% compliance"
  },
  {
    id: 4,
    type: "Thermal Warning",
    title: "Reactor Wall Temp Elevation",
    severity: "Critical",
    status: "Active",
    timestamp: "18:14:22",
    location: "Zone D - Secondary Reactor",
    value: "104.8 C",
    threshold: "95 C"
  },
  {
    id: 5,
    type: "Humidity Breach",
    title: "Severe Ambient Humidity Drop",
    severity: "Low",
    status: "Resolved",
    timestamp: "16:30:15",
    location: "Zone E - Cleanroom Storage",
    value: "12.4%",
    threshold: "20% - 80%"
  }
];

/**
 * Generates a live telemetry tick based on previous telemetry state
 * and a potential manual override scenario.
 */
export const getLiveTelemetryTick = (prevTelemetry, scenario = "normal") => {
  let { temperature, gas_level, vibration, worker_count, shift, ppe_compliance } = prevTelemetry || {
    temperature: 42.5,
    gas_level: 8.2,
    vibration: 12.4,
    worker_count: 12,
    shift: "day",
    ppe_compliance: 1
  };

  // Perform random walks or apply scenario overrides
  if (scenario === "gas_leak") {
    temperature = randomRange(82.0, 98.0);
    gas_level = randomRange(75.0, 94.0);
    vibration = randomRange(15.0, 35.0);
    ppe_compliance = Math.random() > 0.8 ? 0 : 1;
  } else if (scenario === "vibration_fatigue") {
    temperature = randomRange(88.0, 105.0);
    gas_level = randomRange(8.0, 22.0);
    vibration = randomRange(82.0, 96.0);
    ppe_compliance = 1;
  } else if (scenario === "ppe_violation") {
    temperature = randomRange(35.0, 55.0);
    gas_level = randomRange(5.0, 15.0);
    vibration = randomRange(10.0, 25.0);
    ppe_compliance = 0;
    worker_count = randomInt(28, 48);
  } else if (scenario === "anomaly_spike") {
    temperature = randomRange(112.0, 119.5);
    gas_level = randomRange(92.0, 99.0);
    vibration = randomRange(92.0, 99.0);
    ppe_compliance = 0;
  } else {
    // Normal operation with slight random walk
    temperature = Math.max(25, Math.min(65, temperature + randomRange(-1.5, 1.5)));
    gas_level = Math.max(2, Math.min(22, gas_level + randomRange(-0.8, 0.8)));
    vibration = Math.max(5, Math.min(28, vibration + randomRange(-1.2, 1.2)));
    // Occasional change in workers
    if (Math.random() > 0.7) {
      worker_count = Math.max(2, Math.min(48, worker_count + randomInt(-2, 2)));
    }
    // Occasional PPE breach
    if (Math.random() > 0.95) {
      ppe_compliance = ppe_compliance === 1 ? 0 : 1;
    }
  }

  // Calculate live composite risk score
  const temp_norm = (temperature - 20) / 100;
  const gas_norm = gas_level / 100;
  const vib_norm = vibration / 100;
  
  const synergy = temp_norm * gas_norm * 45;
  const vib_contrib = vib_norm * 15;
  const ppe_penalty = (1 - ppe_compliance) * 20;
  const exposure = (worker_count / 50) * (gas_norm * 0.5 + vib_norm * 0.5) * 10;
  
  let risk_score = 5.0 + synergy + vib_contrib + ppe_penalty + exposure;
  risk_score = Math.max(0, Math.min(100, Math.round(risk_score * 100) / 100));

  // Determine risk level category
  let risk_level = "LOW";
  if (risk_score > 75) risk_level = "CRITICAL";
  else if (risk_score > 50) risk_level = "HIGH";
  else if (risk_score > 25) risk_level = "MEDIUM";

  // Determine IsolationForest anomaly risk (simulated)
  let anomaly_score = Math.max(0, Math.min(100, (temp_norm * 0.3 + gas_norm * 0.3 + vib_norm * 0.4) * 100 + randomRange(-5, 5)));
  if (scenario !== "normal") {
    anomaly_score = randomRange(75, 98);
  }

  return {
    temperature: Math.round(temperature * 100) / 100,
    gas_level: Math.round(gas_level * 100) / 100,
    humidity: randomRange(45, 68), // ambient
    vibration: Math.round(vibration * 100) / 100,
    worker_count,
    shift,
    ppe_compliance,
    risk_score,
    anomaly_score: Math.round(anomaly_score * 100) / 100,
    risk_level
  };
};

/**
 * Returns risk level summaries by department.
 */
export const getDepartmentRiskData = () => [
  { name: "Operations", avg_risk: 42.4, workers: 32, compliance: 96 },
  { name: "Maintenance", avg_risk: 54.8, workers: 14, compliance: 92 },
  { name: "Warehouse", avg_risk: 28.2, workers: 18, compliance: 100 },
  { name: "Logistics", avg_risk: 31.6, workers: 10, compliance: 95 },
  { name: "QA / Testing", avg_risk: 18.5, workers: 6, compliance: 100 }
];

/**
 * Returns correlation points (Vibration vs Temp) for Scatter Chart.
 */
export const getStressCorrelationData = () => {
  const points = [];
  // Generate normal scatter cloud
  for (let i = 0; i < 50; i++) {
    points.push({
      x: randomRange(25, 60), // Temp
      y: randomRange(10, 35), // Vib
      category: "Normal Operations"
    });
  }
  // Generate high stress danger points
  for (let i = 0; i < 15; i++) {
    points.push({
      x: randomRange(85, 115), // Temp
      y: randomRange(72, 98),  // Vib
      category: "Critical Stress"
    });
  }
  return points;
};
