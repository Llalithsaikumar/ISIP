import React, { useState, useEffect } from 'react';
import { 
  Play, ShieldAlert, CheckCircle2, AlertTriangle, Database, 
  Sparkles, Clock, Activity, FileText, Users, Thermometer, 
  Flame, Check, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { getDemoScenarios, runDemoScenario } from '../services/demo';

const DemoMode = ({ onApplyScenarioState }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [executingKey, setExecutingKey] = useState(null);
  const [activeScenarioResult, setActiveScenarioResult] = useState(null);
  const [executionStep, setExecutionStep] = useState(0);
  const [error, setError] = useState(null);

  // Fetch scenarios on load
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await getDemoScenarios();
        setScenarios(data);
      } catch (err) {
        console.error("Error fetching demo scenarios:", err);
        // Fallback metadata if API fails or prior to backend start
        setScenarios([
          {
            key: "gas_leak",
            title: "Scenario 1: Gas Leak",
            description: "Simulates a pipeline rupture leaking combustible gases. Triggers CRITICAL GAS_LEAK alarm.",
            target_zone: "Zone B - Boiler Room",
            expected_hazards: ["Gas Leak Alert", "Composite Risk Warning"]
          },
          {
            key: "machine_overheating",
            title: "Scenario 2: Machine Overheating",
            description: "Simulates bearing failure and thermal runaway on generator turbines. Triggers CRITICAL THERMAL_EXCESS alarm.",
            target_zone: "Zone A - Generator Hall",
            expected_hazards: ["Thermal Warning", "Vibration Alert", "Composite Risk Warning"]
          },
          {
            key: "ppe_violation",
            title: "Scenario 3: PPE Violation",
            description: "Simulates non-compliant staff entering operations area without helmet and vest. Triggers HIGH PPE_VIOLATION alarm.",
            target_zone: "Zone C - Loading Bay 3",
            expected_hazards: ["PPE Violation Alert"]
          },
          {
            key: "combined_catastrophe",
            title: "Scenario 4: Combined Catastrophic Event",
            description: "Simulates co-occurring thermal runaway, combustible gas leak, and active PPE compliance breaches. Triggers ALL safety alarms simultaneously.",
            target_zone: "Zone D - Secondary Reactor",
            expected_hazards: ["Gas Leak Alert", "Thermal Warning", "Vibration Alert", "PPE Violation Alert", "Composite Risk Warning"]
          }
        ]);
      } finally {
        setLoadingScenarios(false);
      }
    };
    fetchScenarios();
  }, []);

  // Execution steps simulator for visual realism
  useEffect(() => {
    if (!executingKey) return;
    setExecutionStep(1); // Simulating telemetry
    
    const t1 = setTimeout(() => setExecutionStep(2), 700); // Computing risk
    const t2 = setTimeout(() => setExecutionStep(3), 1400); // Evaluating alarms
    const t3 = setTimeout(() => setExecutionStep(4), 2100); // AI RCA
    const t4 = setTimeout(() => setExecutionStep(5), 2800); // Committing DB
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [executingKey]);

  const handleExecuteScenario = async (key) => {
    setExecutingKey(key);
    setError(null);
    setActiveScenarioResult(null);

    try {
      // Execute the endpoint
      const result = await runDemoScenario(key);
      
      // Delay response slightly to finish the step animations
      setTimeout(() => {
        setActiveScenarioResult(result);
        setExecutingKey(null);
        setExecutionStep(0);
      }, 3500);
      
    } catch (err) {
      console.error("Error executing scenario:", err);
      setError(err.response?.data?.detail || "Failed to execute scenario. Verify backend connection.");
      setExecutingKey(null);
      setExecutionStep(0);
    }
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-955/20 border-red-500/35 text-red-400 glow-red animate-pulse';
      case 'HIGH': return 'bg-orange-955/20 border-orange-500/35 text-orange-400 glow-orange';
      case 'MEDIUM': return 'bg-yellow-955/20 border-yellow-500/35 text-yellow-400 glow-amber';
      default: return 'bg-emerald-955/20 border-emerald-500/30 text-emerald-450 glow-green';
    }
  };

  const handleApplyStateToDashboard = () => {
    if (!activeScenarioResult || !onApplyScenarioState) return;
    onApplyScenarioState(activeScenarioResult);
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-mono-tech">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-4 gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2.5 font-orbitron">
            <Play className="h-5 w-5 text-indigo-400 animate-pulse" />
            SIMULATION DEMO CENTER
          </h1>
          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
            ONE-CLICK FIELD INJECTIONS // AUTOMATIC SAFETY SYSTEM TESTING
          </p>
        </div>
      </div>

      {/* Main Grid: Left column scenario trigger cards, Right column results */}
      <div className="grid gap-6 lg:grid-cols-12 flex-1 items-start">
        
        {/* Scenario Selection Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-4 border border-slate-900 relative scada-grid-bg">
            <div className="tech-corner-tl"></div>
            <div className="tech-corner-tr"></div>
            <div className="tech-corner-bl"></div>
            <div className="tech-corner-br"></div>
            
            <h2 className="text-[10px] font-bold text-slate-350 uppercase tracking-widest mb-1.5 flex items-center gap-2 font-orbitron">
              <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
              INJECTION SIMULATOR DECK
            </h2>
            <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider">
              SELECT ANY SCENARIO BELOW. THE INJECTOR WILL INTERFACE WITH ML ENGINE CLASSIFIERS, AUDIT RULES, GENERATE AI SOP TICKETS AND SYNC INCIDENT REGISTRIES.
            </p>
          </div>

          {loadingScenarios ? (
            <div className="glass-card p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 border border-slate-900">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="text-[10px] font-bold">LOADING SCENARIOS...</span>
            </div>
          ) : (
            scenarios.map((scen) => (
              <div 
                key={scen.key} 
                className={`glass-card p-5 border transition-all duration-300 relative overflow-hidden scada-grid-bg ${
                  executingKey === scen.key 
                    ? 'border-indigo-500/40 bg-indigo-950/15' 
                    : activeScenarioResult?.logged_incident?.category.toLowerCase().includes(scen.key.split('_')[0])
                      ? 'border-indigo-500/20 bg-indigo-950/5'
                      : 'border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>

                {/* Scenario details */}
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-black text-slate-205 uppercase font-orbitron tracking-wide">{scen.title}</h3>
                      <span className="text-[8px] text-slate-500 font-bold block mt-1 uppercase tracking-widest font-mono-tech">
                        TARGET: {scen.target_zone.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {scen.description}
                  </p>

                  {/* Hazard tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5 font-mono-tech">
                    {scen.expected_hazards.map((haz, idx) => (
                      <span key={idx} className="bg-slate-950 border border-slate-900 text-[8px] text-orange-400 font-bold px-2 py-0.5 rounded uppercase">
                        {haz}
                      </span>
                    ))}
                  </div>

                  {/* Action trigger button */}
                  <button
                    disabled={executingKey !== null}
                    onClick={() => handleExecuteScenario(scen.key)}
                    className="w-full mt-2 bg-indigo-950/30 hover:bg-indigo-650 border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-lg py-2.5 shadow-md shadow-indigo-600/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none h-10"
                  >
                    <Play className="h-3.5 w-3.5" />
                    ACTIVATE SCENARIO
                  </button>
                </div>
              </div>
            ))
          )}

          {error && (
            <div className="rounded border border-red-500/20 bg-red-500/5 p-4 text-[9px] font-bold uppercase text-red-400 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Diagnostic Results Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Awaiting execution status */}
          {!activeScenarioResult && !executingKey && (
            <div className="glass-card p-12 text-center text-slate-500 h-64 flex flex-col items-center justify-center gap-4 border border-slate-900">
              <div className="tech-corner-tl"></div>
              <div className="tech-corner-tr"></div>
              <div className="tech-corner-bl"></div>
              <div className="tech-corner-br"></div>
              <Eye className="h-7 w-7 text-slate-750 relative z-10" />
              <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting simulator override triggers</p>
                <p className="text-[9px] text-slate-550 leading-relaxed font-bold uppercase max-w-sm mx-auto">
                  INJECT TELEMETRY LOADS ON THE LEFT TO CAPTURE INFERENCE DIAGNOSTICS FEED AND COMPILE SOP ACTION TICKETS.
                </p>
              </div>
            </div>
          )}

          {/* Running Scenario Steps Indicator */}
          {executingKey && (
            <div className="glass-card p-8 space-y-6 border border-indigo-500/35 shadow-lg shadow-indigo-600/5 relative">
              <div className="tech-corner-tl"></div>
              <div className="tech-corner-tr"></div>
              <div className="tech-corner-bl"></div>
              <div className="tech-corner-br"></div>

              <div className="flex flex-col items-center justify-center gap-4 text-center relative z-10">
                <div className="h-9 w-9 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron">INJECTING TELEMETRY & AUDITING HAZARDS...</p>
                  <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest font-mono-tech">
                    SCENARIO: {scenarios.find(s => s.key === executingKey)?.title.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Progress list steps */}
              <div className="space-y-3.5 border-t border-slate-900 pt-5 max-w-xs mx-auto relative z-10 font-mono-tech">
                {[
                  { step: 1, label: "Simulating environmental telemetry data" },
                  { step: 2, label: "Evaluating composite ML risk scores" },
                  { step: 3, label: "Triggering rule-based annunciator alarms" },
                  { step: 4, label: "Generating Root Cause Analysis & SOP" },
                  { step: 5, label: "Logging ticket to safety incidents database" }
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 items-center text-xs">
                    {executionStep > item.step ? (
                      <div className="h-5 w-5 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-450 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : executionStep === item.step ? (
                      <div className="h-5 w-5 rounded bg-indigo-950/20 border border-indigo-500/50 text-indigo-400 flex items-center justify-center shrink-0 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded bg-slate-950 border border-slate-900 text-slate-650 flex items-center justify-center shrink-0 text-[9px] font-bold">
                        0{item.step}
                      </div>
                    )}
                    <span className={`${
                      executionStep > item.step 
                        ? 'text-slate-450 font-semibold' 
                        : executionStep === item.step 
                          ? 'text-white font-bold' 
                          : 'text-slate-650'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Display */}
          {activeScenarioResult && !executingKey && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Top Banner Control Integration */}
              <div className="glass-card p-5 border border-indigo-500/20 bg-indigo-950/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 relative">
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>

                <div className="relative z-10">
                  <h3 className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-450" />
                    SIMULATOR RUN COMPLETE
                  </h3>
                  <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-widest font-bold font-mono-tech">
                    INCIDENT REGISTRY VERIFIED // PRESS INTEGRATE TO MERGE ACTIVE TELEMETRY
                  </p>
                </div>
                <button
                  onClick={handleApplyStateToDashboard}
                  className="bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/35 text-white font-bold text-xs uppercase tracking-wider rounded-lg px-4 py-2.5 shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5 shrink-0 relative z-10 h-10"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Integrate to Console
                </button>
              </div>

              {/* Grid 1: Telemetry and Risk outputs */}
              <div className="grid gap-4 md:grid-cols-12">
                {/* Telemetry Metrics */}
                <div className="glass-card p-5 md:col-span-7 space-y-4 border border-slate-900">
                  <div className="tech-corner-tl"></div>
                  <div className="tech-corner-tr"></div>
                  <div className="tech-corner-bl"></div>
                  <div className="tech-corner-br"></div>

                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block border-b border-slate-900 pb-2 relative z-10 font-mono-tech">
                    Generated Telemetry Sensors
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3 relative z-10 font-mono-tech">
                    {[
                      { icon: Thermometer, label: "Core Temp", val: `${activeScenarioResult.telemetry.temperature.toFixed(1)} °C`, color: "text-orange-400" },
                      { icon: Flame, label: "Combustible Gas", val: `${activeScenarioResult.telemetry.gas_level.toFixed(1)} ppm`, color: "text-emerald-400" },
                      { icon: Activity, label: "Vibration Load", val: `${activeScenarioResult.telemetry.vibration.toFixed(1)} mm/s`, color: "text-cyan-400" },
                      { icon: Users, label: "Staff Present", val: `${activeScenarioResult.telemetry.worker_count} workers`, color: "text-slate-300" },
                      { icon: Clock, label: "Operations Shift", val: `${activeScenarioResult.telemetry.shift.toUpperCase()} SHIFT`, color: "text-indigo-400" },
                      { icon: ShieldAlert, label: "PPE compliance", val: activeScenarioResult.telemetry.ppe_compliance === 1 ? "COMPLIANT" : "BREACH VIOLATION", color: activeScenarioResult.telemetry.ppe_compliance === 1 ? "text-emerald-450" : "text-red-400 animate-pulse font-black" }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="bg-slate-950/60 border border-slate-900/60 p-2.5 rounded-lg flex flex-col justify-between min-h-[60px]">
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                          <span className={`text-[11px] font-bold mt-1.5 flex items-center gap-1.5 ${item.color}`}>
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {item.val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Machine Learning Risk Output */}
                <div className="glass-card p-5 md:col-span-5 space-y-4 border border-slate-900">
                  <div className="tech-corner-tl"></div>
                  <div className="tech-corner-tr"></div>
                  <div className="tech-corner-bl"></div>
                  <div className="tech-corner-br"></div>

                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block border-b border-slate-900 pb-2 relative z-10 font-mono-tech">
                    ML Regression Inferences
                  </span>

                  <div className="space-y-3 font-mono-tech relative z-10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">RF Regressor Risk:</span>
                      <span className="text-slate-205 font-bold">{activeScenarioResult.telemetry.risk_score.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">IF Anomaly Level:</span>
                      <span className="text-slate-205 font-bold">{activeScenarioResult.telemetry.anomaly_score.toFixed(1)}%</span>
                    </div>
                    
                    <div className="border-t border-slate-900 pt-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Composite Index:</span>
                      <span className="text-lg font-black text-white font-orbitron">{activeScenarioResult.telemetry.risk_score}%</span>
                    </div>

                    <div className={`mt-2 rounded border p-2 text-center text-xs font-bold uppercase tracking-wider ${getRiskBadgeColor(activeScenarioResult.telemetry.risk_level)}`}>
                      RISK LEVEL: {activeScenarioResult.telemetry.risk_level}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rule-Based Alarms Panel */}
              <div className="glass-card p-5 space-y-4 border border-slate-900">
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>

                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block border-b border-slate-900 pb-2 relative z-10 font-mono-tech">
                  Annunciator Alerts Active
                </span>

                {activeScenarioResult.alerts.length === 0 ? (
                  <div className="text-xs text-slate-550 font-bold py-2 relative z-10 uppercase tracking-wider">
                    NO FIELD COMPLIANCE ALERTS TRIGGERED.
                  </div>
                ) : (
                  <div className="space-y-2 relative z-10 font-mono-tech">
                    {activeScenarioResult.alerts.map((al, idx) => (
                      <div key={idx} className="bg-red-950/10 border border-red-500/25 p-3 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-red-550 animate-pulse shrink-0" />
                          <div>
                            <p className="font-bold text-red-400 uppercase tracking-wider">{al.alert_type}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">{al.message}</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-red-650 text-white font-bold px-2 py-0.5 rounded shadow glow-red font-orbitron">
                          {al.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safety AI Incident report */}
              <div className="glass-card p-5 space-y-4 border border-slate-900">
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>

                <div className="flex justify-between items-center border-b border-slate-900 pb-2 relative z-10 font-mono-tech">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                    Gemini AI Investigation & SOP
                  </span>
                  <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-widest font-orbitron">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    CO-PILOT AGENT
                  </span>
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Summary */}
                  <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-lg space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block font-mono-tech">Incident Statement Summary</span>
                    <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                      {activeScenarioResult.incident_report.incident_summary}
                    </p>
                  </div>

                  {/* Diagnosis */}
                  <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-lg space-y-1">
                    <span className="text-[8px] text-red-405 font-bold uppercase tracking-widest block font-mono-tech">Root Cause Analysis</span>
                    <p className="text-xs text-slate-350 leading-relaxed font-black font-mono-tech">
                      {activeScenarioResult.incident_report.root_cause_analysis}
                    </p>
                  </div>

                  {/* SOP */}
                  <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-lg space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block font-mono-tech">Recommended Standard Operating Procedures</span>
                    <pre className="text-[10px] text-slate-405 leading-relaxed whitespace-pre-wrap font-mono-tech p-2.5 bg-[#03060a]/90 border border-slate-950 rounded font-semibold">
                      {activeScenarioResult.incident_report.recommended_sop}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Database Synced Status */}
              <div className="glass-card border border-slate-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between font-mono-tech text-[9px] gap-2.5 relative">
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>

                <div className="flex items-center gap-2 relative z-10 font-bold uppercase tracking-wider">
                  <Database className="h-4 w-4 text-emerald-450" />
                  <span className="text-slate-500">SQLITE TRANSACTION SYNCHRONIZATION:</span>
                  <span className="text-emerald-450 font-black">COMMITTED</span>
                </div>
                <div className="text-slate-450 font-black uppercase tracking-wider relative z-10">
                  DOCKET ID: ISIP-{activeScenarioResult.logged_incident.id} // DEPT: {activeScenarioResult.logged_incident.department.toUpperCase()}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default DemoMode;
