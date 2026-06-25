import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import RiskAnalytics from './pages/RiskAnalytics';
import RiskPredictor from './pages/RiskPredictor';
import SafetyAI from './pages/SafetyAI';
import Heatmap from './pages/Heatmap';
import DemoMode from './pages/DemoMode';
import { generateHistoricalData, getInitialAlerts, getLiveTelemetryTick } from './services/dummyData';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Simulation states
  const [isLive, setIsLive] = useState(true);
  const [scenario, setScenario] = useState('normal');
  const [telemetry, setTelemetry] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [zoneData, setZoneData] = useState(null);

  // Initialize data on startup
  useEffect(() => {
    const history = generateHistoricalData(24);
    setHistoricalData(history);
    
    // Seed initial telemetry matching the last historical data point
    const lastPoint = history[history.length - 1];
    setTelemetry({
      temperature: lastPoint.temperature,
      gas_level: lastPoint.gas_level,
      humidity: 55,
      vibration: lastPoint.vibration,
      worker_count: lastPoint.worker_count,
      shift: 'day',
      ppe_compliance: 1,
      risk_score: lastPoint.risk_score,
      anomaly_score: lastPoint.risk_score * 0.8,
      risk_level: 'LOW'
    });

    setAlerts(getInitialAlerts());

    // Seed initial zoneData
    const zoneNames = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
    const zoneDescriptions = {
      'Zone A': 'Generator Hall',
      'Zone B': 'Boiler Room',
      'Zone C': 'Loading Bay',
      'Zone D': 'Secondary Reactor'
    };
    
    const initialZones = {};
    zoneNames.forEach(name => {
      const zoneHistory = generateHistoricalData(24);
      const lastZonePt = zoneHistory[zoneHistory.length - 1];
      initialZones[name] = {
        description: zoneDescriptions[name],
        temperature: lastZonePt.temperature,
        gas_level: lastZonePt.gas_level,
        vibration: lastZonePt.vibration,
        worker_count: lastZonePt.worker_count,
        ppe_compliance: 1,
        risk_score: lastZonePt.risk_score,
        alerts_count: name === 'Zone B' ? 1 : 0,
        trend: zoneHistory.map(pt => ({ time: pt.time, risk_score: pt.risk_score }))
      };
    });
    setZoneData(initialZones);
  }, []);

  // Fetch forecast whenever historicalData changes
  useEffect(() => {
    if (historicalData.length < 3) return;

    const fetchForecast = async () => {
      try {
        const response = await fetch('/api/v1/prediction/forecast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            risk_history: historicalData.map(d => d.risk_score),
            interval_seconds: 2.0
          })
        });
        if (response.ok) {
          const data = await response.json();
          setForecast(data);
        }
      } catch (err) {
        console.error("Error fetching forecast:", err);
      }
    };

    fetchForecast();
  }, [historicalData]);

  // Live telemetry update loop
  useEffect(() => {
    if (!isLive || !telemetry) return;

    const intervalId = setInterval(() => {
      setTelemetry((prev) => {
        const nextTick = getLiveTelemetryTick(prev, scenario);
        
        // Push historical data point to maintain trend continuity
        setHistoricalData((prevHist) => {
          const updated = [...prevHist.slice(1)];
          const now = new Date();
          const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          updated.push({
            time: timeString,
            temperature: nextTick.temperature,
            gas_level: nextTick.gas_level,
            vibration: nextTick.vibration,
            risk_score: nextTick.risk_score,
            worker_count: nextTick.worker_count
          });
          return updated;
        });

        // Tick zoneData separately to simulate regional factory hazards
        setZoneData((prevZones) => {
          if (!prevZones) return prevZones;
          const now = new Date();
          const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          
          const updatedZones = {};
          Object.keys(prevZones).forEach((zoneName) => {
            const prevZone = prevZones[zoneName];
            let zScenario = 'normal';
            if (zoneName === 'Zone A' && scenario === 'vibration_fatigue') zScenario = 'vibration_fatigue';
            else if (zoneName === 'Zone B' && scenario === 'gas_leak') zScenario = 'gas_leak';
            else if (zoneName === 'Zone C' && scenario === 'ppe_violation') zScenario = 'ppe_violation';
            else if (zoneName === 'Zone D' && scenario === 'anomaly_spike') zScenario = 'anomaly_spike';
            
            const nextZoneTick = getLiveTelemetryTick(prevZone, zScenario);
            const newTrend = [...prevZone.trend.slice(1), { time: timeString, risk_score: nextZoneTick.risk_score }];
            
            // Calculate active alerts in this specific zone
            let zoneAlerts = 0;
            if (nextZoneTick.gas_level > 85) zoneAlerts++;
            if (nextZoneTick.temperature > 100) zoneAlerts++;
            if (nextZoneTick.ppe_compliance === 0) zoneAlerts++;
            if (nextZoneTick.risk_score > 75) zoneAlerts++;

            updatedZones[zoneName] = {
              ...prevZone,
              temperature: nextZoneTick.temperature,
              gas_level: nextZoneTick.gas_level,
              vibration: nextZoneTick.vibration,
              worker_count: nextZoneTick.worker_count,
              ppe_compliance: nextZoneTick.ppe_compliance,
              risk_score: nextZoneTick.risk_score,
              alerts_count: zoneAlerts,
              trend: newTrend
            };
          });
          return updatedZones;
        });

        // Trigger dynamic alerts when dangerous conditions are generated
        if (nextTick.risk_score > 50 && Math.random() > 0.4) {
          const now = new Date();
          const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          
          let alertTitle = "Safety Alert Elevated Risk";
          let alertType = "Telemetry Peak";
          let location = "Sector 2 - Core Operations";
          let val = `${nextTick.risk_score}/100`;

          if (scenario === "gas_leak") {
            alertTitle = "Gas Leak Hazard Detected";
            alertType = "Gas Leak";
            location = "Zone B - Boiler Room";
            val = `${nextTick.gas_level} ppm`;
          } else if (scenario === "vibration_fatigue") {
            alertTitle = "Critical Machine Vibration Shock";
            alertType = "Vibration Alert";
            location = "Zone A - Generator Hall";
            val = `${nextTick.vibration} mm/s`;
          } else if (scenario === "ppe_violation") {
            alertTitle = "PPE Protocol Breach In Progress";
            alertType = "PPE Violation";
            location = "Zone C - Loading Bay 3";
            val = "Non-compliant workers";
          } else if (scenario === "anomaly_spike") {
            alertTitle = "Extreme System Telemetry Anomaly";
            alertType = "Thermal Warning";
            location = "Zone D - Secondary Reactor";
            val = `${nextTick.temperature} C`;
          }

          // Avoid duplicate alerts in close proximity
          setAlerts((prevAlerts) => {
            const hasDuplicate = prevAlerts.some(a => a.type === alertType && a.status === "Active");
            if (hasDuplicate) return prevAlerts;
            
            return [
              {
                id: Date.now(),
                type: alertType,
                title: alertTitle,
                severity: nextTick.risk_score > 75 ? "Critical" : "High",
                status: "Active",
                timestamp,
                location,
                value: val,
                threshold: "Threshold breached"
              },
              ...prevAlerts
            ];
          });
        }

        return nextTick;
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isLive, scenario, telemetry]);

  const activeAlertsCount = alerts.filter(a => a.status === 'Active').length;

  const handleApplyScenarioState = (demoResult) => {
    setTelemetry({
      temperature: demoResult.telemetry.temperature,
      gas_level: demoResult.telemetry.gas_level,
      humidity: demoResult.telemetry.humidity,
      vibration: demoResult.telemetry.vibration,
      worker_count: demoResult.telemetry.worker_count,
      shift: demoResult.telemetry.shift,
      ppe_compliance: demoResult.telemetry.ppe_compliance,
      risk_score: demoResult.telemetry.risk_score,
      anomaly_score: demoResult.telemetry.anomaly_score,
      risk_level: demoResult.telemetry.risk_level
    });

    setAlerts((prevAlerts) => {
      const newAlerts = demoResult.alerts.map((al, index) => {
        const now = new Date();
        const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        let alertTitle = "Safety Alert Elevated Risk";
        let location = "Sector 2 - Core Operations";
        let val = `${demoResult.telemetry.risk_score}/100`;

        if (al.alert_type === "GAS_LEAK") {
          alertTitle = "Gas Leak Hazard Detected";
          location = "Zone B - Boiler Room";
          val = `${demoResult.telemetry.gas_level} ppm`;
        } else if (al.alert_type === "THERMAL_EXCESS") {
          alertTitle = "Critical Machine Temperature Warning";
          location = "Zone A - Generator Hall";
          val = `${demoResult.telemetry.temperature} °C`;
        } else if (al.alert_type === "PPE_VIOLATION") {
          alertTitle = "PPE Protocol Breach In Progress";
          location = "Zone C - Loading Bay 3";
          val = "Non-compliant workers";
        } else if (al.alert_type === "COMPOSITE_RISK") {
          alertTitle = "Critical Blended Composite Risk Score";
          location = "Sector 2 - Core Operations";
        }

        return {
          id: Date.now() + index,
          type: al.alert_type,
          title: alertTitle,
          severity: al.severity,
          status: "Active",
          timestamp,
          location,
          value: val,
          threshold: "Threshold breached"
        };
      });

      const filteredPrev = prevAlerts.filter(p => !newAlerts.some(n => n.type === p.type && p.status === "Active"));
      return [...newAlerts, ...filteredPrev];
    });

    setIsLive(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            telemetry={telemetry} 
            historicalData={historicalData}
            isLive={isLive}
            setIsLive={setIsLive}
            scenario={scenario}
            setScenario={setScenario}
            activeAlertsCount={activeAlertsCount}
            forecast={forecast}
          />
        );
      case 'alerts':
        return (
          <Alerts 
            alerts={alerts} 
            setAlerts={setAlerts} 
          />
        );
      case 'heatmap':
        return (
          <Heatmap 
            zoneData={zoneData} 
          />
        );
      case 'analytics':
        return (
          <RiskAnalytics 
            historicalData={historicalData} 
          />
        );
      case 'prediction':
        return <RiskPredictor />;
      case 'safety-ai':
        return <SafetyAI telemetry={telemetry} />;
      case 'demo':
        return (
          <DemoMode 
            onApplyScenarioState={handleApplyScenarioState}
          />
        );
      default:
        return (
          <Dashboard 
            telemetry={telemetry} 
            historicalData={historicalData}
            isLive={isLive}
            setIsLive={setIsLive}
            scenario={scenario}
            setScenario={setScenario}
            activeAlertsCount={activeAlertsCount}
            forecast={forecast}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#07090c] text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">
      {/* Decorative Grid Lines for Industrial SCADA/Control Room Vibe */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1319_1px,transparent_1px),linear-gradient(to_bottom,#0f1319_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20 z-0"></div>
      
      {/* Dynamic Glowing Alarm Backdrop overlay when critical alerts are active */}
      {activeAlertsCount > 0 && (
        <div className="absolute inset-0 bg-red-900/5 pointer-events-none z-0 animate-pulse duration-1000"></div>
      )}

      {/* Navigation Header */}
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        activeAlertsCount={activeAlertsCount} 
      />
      
      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 overflow-hidden flex flex-col">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#121720]/80 bg-[#07090c] py-4 text-center text-[10px] text-slate-500 font-mono tracking-wider shrink-0 z-10 relative">
        <p>SYSTEM CODE: ISIP-X1 // STATUS: SECURE // DB STATE: SYNCED // LIVE FEED: {isLive ? "ONLINE" : "STANDBY"}</p>
      </footer>
    </div>
  );
}

export default App;
