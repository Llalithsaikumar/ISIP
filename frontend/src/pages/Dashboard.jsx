import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  ShieldAlert, AlertTriangle, Users, Gauge, Thermometer, Flame, 
  Activity, Play, Pause, AlertCircle, RefreshCw 
} from 'lucide-react';

const Dashboard = ({ 
  telemetry, 
  historicalData, 
  isLive, 
  setIsLive, 
  scenario, 
  setScenario,
  activeAlertsCount,
  forecast
}) => {
  
  if (!telemetry) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 font-mono-tech">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-400">CONNECTING TO ISIP CONTROL NODE...</span>
      </div>
    );
  }

  // Count active critical alerts
  const criticalEventsCount = activeAlertsCount > 0 ? activeAlertsCount : 0; 
  
  // Custom styled Tooltip for industrial charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#060a12] border border-slate-800/80 p-3 rounded-lg shadow-2xl font-mono-tech text-xs text-slate-350 relative">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          <p className="text-slate-500 mb-1 border-b border-slate-900 pb-1">TIME: {label}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ color: item.color }} className="font-bold">
              {item.name.toUpperCase()}: {Number(item.value).toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Determine hazard level glow and color styles
  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return { border: 'border-red-500/40 bg-red-950/10 shadow-red-500/5', text: 'text-red-400', glow: 'glow-red' };
      case 'HIGH': return { border: 'border-orange-500/40 bg-orange-950/10 shadow-orange-500/5', text: 'text-orange-400', glow: 'glow-orange' };
      case 'MEDIUM': return { border: 'border-yellow-500/40 bg-yellow-950/10 shadow-yellow-500/5', text: 'text-yellow-400', glow: 'glow-amber' };
      default: return { border: 'border-emerald-500/30 bg-emerald-950/10 shadow-emerald-500/5', text: 'text-emerald-450', glow: 'glow-green' };
    }
  };

  const riskStyles = getRiskColor(telemetry.risk_level);

  return (
    <div className="space-y-6 flex-1 flex flex-col font-mono-tech">
      
      {/* Control Room Console Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-4 gap-4 shrink-0 relative">
        <div className="scanline-overlay"></div>
        <div>
          <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2.5 font-orbitron">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-led"></span>
            ISIP OPERATIONS CONSOLE
          </h1>
          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
            NODE IP: 127.0.0.1 // AREA: Plant Wide Integration Terminal
          </p>
        </div>
        
        {/* Play/Pause Live Telemetry */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold border transition-all uppercase tracking-wider ${
              isLive 
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-400 shadow-md shadow-indigo-500/5' 
                : 'bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'
            }`}
          >
            {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isLive ? 'SYSTEM CONNECTED' : 'SYSTEM PAUSED'}
          </button>
          
          <div className="text-[10px] font-bold text-slate-500 bg-slate-950 border border-slate-900 px-3 py-2 rounded-lg">
            POLL: 2.0s
          </div>
        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        
        {/* CARD 1: CURRENT RISK */}
        <div className={`glass-card p-5 relative overflow-hidden transition-all duration-300 border ${riskStyles.border} ${riskStyles.glow} scada-grid-bg`}>
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">COMPOSITE RISK LEVEL</span>
              <h2 className="text-2xl font-black text-white mt-1.5 font-orbitron">{telemetry.risk_score}%</h2>
            </div>
            
            {/* Radial SVG gauge */}
            <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-900"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={riskStyles.text}
                  strokeWidth="3.5"
                  strokeDasharray={`${telemetry.risk_score}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white font-orbitron">
                {telemetry.risk_score}%
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10 border-t border-slate-900 pt-3">
            <span className={`text-xs font-black ${riskStyles.text} uppercase tracking-widest font-orbitron`}>
              STATUS: {telemetry.risk_level}
            </span>
            <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider">0-100 INDEX</span>
          </div>
        </div>

        {/* CARD 2: ACTIVE ALERTS */}
        <div className={`glass-card p-5 relative overflow-hidden transition-all duration-300 border ${
          activeAlertsCount > 0 ? 'border-red-500/40 bg-red-950/10 glow-red' : 'border-slate-900'
        } scada-grid-bg`}>
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">ACTIVE ALARM NODES</span>
              <h2 className="text-2xl font-black text-white mt-1.5 font-orbitron">{activeAlertsCount}</h2>
            </div>
            <div className={`p-2.5 rounded-lg bg-slate-950 border border-slate-900 ${
              activeAlertsCount > 0 ? 'text-red-500 animate-led' : 'text-slate-500'
            }`}>
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10 border-t border-slate-900 pt-3">
            <span className={`text-xs font-bold tracking-widest ${activeAlertsCount > 0 ? 'text-red-400 animate-pulse font-black' : 'text-slate-500'}`}>
              {activeAlertsCount > 0 ? 'ALARM AUDIO ACTIVE' : 'NO ACTIVE ALARMS'}
            </span>
            <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider">ANNUNCIATOR</span>
          </div>
        </div>

        {/* CARD 3: CRITICAL EVENTS */}
        <div className="glass-card p-5 relative overflow-hidden transition-all duration-300 border border-slate-900 scada-grid-bg">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">CRITICAL EVENTS</span>
              <h2 className="text-2xl font-black text-white mt-1.5 font-orbitron">{criticalEventsCount}</h2>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 text-orange-500">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10 border-t border-slate-900 pt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">UNRESOLVED HAZARDS</span>
            <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider font-mono-tech">SYS-TICKET</span>
          </div>
        </div>

        {/* CARD 4: WORKERS ON SITE */}
        <div className="glass-card p-5 relative overflow-hidden transition-all duration-300 border border-slate-900 scada-grid-bg">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">ZONE STAFF OVERVIEW</span>
              <h2 className="text-2xl font-black text-white mt-1.5 font-orbitron">{telemetry.worker_count}</h2>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 text-cyan-400">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between relative z-10 border-t border-slate-900 pt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono-tech">
              {telemetry.shift.toUpperCase()} SHIFT // PPE OK
            </span>
            <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider">HEADCOUNT</span>
          </div>
        </div>

      </div>

      {/* TREND CHARTS GRID */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 flex-1 min-h-[300px]">
        
        {/* CHART 1: RISK SCORE TREND */}
        <div className="glass-card p-5 border border-slate-900 flex flex-col">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">COMPOSITE RISK TREND</h3>
            </div>
            <span className="text-[8px] text-slate-550 font-bold">24H ROLLING FEED</span>
          </div>
          
          <div className="flex-1 w-full h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis stroke="#475569" domain={[0, 100]} fontSize={8} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="risk_score" stroke="#6366f1" name="Composite Risk" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: GAS TREND */}
        <div className="glass-card p-5 border border-slate-900 flex flex-col">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">GAS CONCENTRATION (PPM)</h3>
            </div>
            <span className="text-[8px] text-slate-550 font-bold">LIMIT: 50.0 PPM</span>
          </div>
          
          <div className="flex-1 w-full h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis stroke="#475569" domain={[0, 100]} fontSize={8} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="gas_level" stroke="#10b981" name="Gas Level" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: TEMPERATURE TREND */}
        <div className="glass-card p-5 border border-slate-900 flex flex-col">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">THERMAL TELEMETRY (°C)</h3>
            </div>
            <span className="text-[8px] text-slate-550 font-bold">MAX: 90.0 °C</span>
          </div>
          
          <div className="flex-1 w-full h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis stroke="#475569" domain={[0, 120]} fontSize={8} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="temperature" fill="#f97316" name="Temperature" radius={[2, 2, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* PREDICTIVE HAZARD FORECAST PANEL */}
      <div className="glass-card p-5 border border-slate-900">
        <div className="tech-corner-tl"></div>
        <div className="tech-corner-tr"></div>
        <div className="tech-corner-bl"></div>
        <div className="tech-corner-br"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-900 pb-3 relative z-10">
          <div>
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest flex items-center gap-2 font-orbitron">
              <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
              PREDICTIVE RISK FORECASTING
            </h3>
            <p className="text-[8px] text-slate-550 font-bold mt-1 uppercase">
              PROJECTED RISK SLOPE // LINEAR REGRESSION COEFFICIENTS
            </p>
          </div>
          {forecast && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider font-orbitron ${
              forecast.forecast.includes("Critical") 
                ? "bg-red-950/20 border-red-500/40 text-red-400 animate-pulse" 
                : forecast.forecast.includes("upward")
                  ? "bg-orange-950/20 border-orange-500/40 text-orange-400"
                  : "bg-emerald-950/20 border-emerald-500/30 text-emerald-450"
            }`}>
              CURVE: {forecast.forecast}
            </div>
          )}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 items-center relative z-10">
          {/* Grid of future points */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 col-span-1">
            {[
              { label: "CURRENT FEED", val: forecast?.risk_now ?? "--", color: "text-indigo-400" },
              { label: "+5.0 MINUTES", val: forecast?.risk_5min ?? "--", color: forecast?.risk_5min >= 75 ? "text-red-400" : forecast?.risk_5min >= 50 ? "text-orange-400" : "text-emerald-450" },
              { label: "+10.0 MINUTES", val: forecast?.risk_10min ?? "--", color: forecast?.risk_10min >= 75 ? "text-red-400" : forecast?.risk_10min >= 50 ? "text-orange-400" : "text-emerald-450" },
              { label: "+15.0 MINUTES", val: forecast?.risk_15min ?? "--", color: forecast?.risk_15min >= 75 ? "text-red-400" : forecast?.risk_15min >= 50 ? "text-orange-400" : "text-emerald-450" }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                <span className={`text-sm font-black ${item.color} font-orbitron`}>
                  {typeof item.val === 'number' ? `${item.val}%` : item.val}
                </span>
              </div>
            ))}
          </div>

          {/* Future Risk Curve Chart */}
          <div className="col-span-1 lg:col-span-3 h-[185px] w-full">
            {forecast ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { time: "Now", risk: forecast.risk_now },
                    { time: "+5 Min", risk: forecast.risk_5min },
                    { time: "+10 Min", risk: forecast.risk_10min },
                    { time: "+15 Min", risk: forecast.risk_15min }
                  ]}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={8} tickLine={false} />
                  <YAxis stroke="#475569" domain={[0, 100]} fontSize={8} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#818cf8"
                    name="Projected Risk"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                    dot={{ r: 3, stroke: '#818cf8', strokeWidth: 1.5, fill: '#03060a' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-mono-tech">
                COMPILING SENSOR FORECAST CURVE...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OVERRIDE CONTROL PANEL PANEL */}
      <div className="glass-card p-5 border border-slate-900">
        <div className="tech-corner-tl"></div>
        <div className="tech-corner-tr"></div>
        <div className="tech-corner-bl"></div>
        <div className="tech-corner-br"></div>
        
        <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-4 flex items-center gap-2 font-orbitron">
          <AlertCircle className="h-4 w-4 text-indigo-400" />
          MANUAL INCIDENT INJECTION OVERRIDES
        </h3>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 relative z-10">
          
          {[
            { id: 'normal', label: 'NORMAL OPERATIONS', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/10 hover:bg-emerald-950/20 shadow-emerald-900/5', led: 'bg-emerald-500' },
            { id: 'gas_leak', label: 'INJECT GAS LEAK', color: 'border-red-500/50 text-red-400 bg-red-950/10 hover:bg-red-950/20 shadow-red-900/5', led: 'bg-red-500' },
            { id: 'vibration_fatigue', label: 'VIBRATION SHOCK', color: 'border-orange-500/50 text-orange-400 bg-orange-950/10 hover:bg-orange-950/20 shadow-orange-900/5', led: 'bg-orange-500' },
            { id: 'ppe_violation', label: 'PPE PROTOCOL BREACH', color: 'border-yellow-500/50 text-yellow-400 bg-yellow-950/10 hover:bg-yellow-950/20 shadow-yellow-900/5', led: 'bg-yellow-500' },
            { id: 'anomaly_spike', label: 'ANOMALY SPIKE', color: 'border-indigo-500/50 text-indigo-400 bg-indigo-950/10 hover:bg-indigo-950/20 shadow-indigo-900/5', led: 'bg-indigo-500' }
          ].map((scen) => {
            const isActive = scenario === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => setScenario(scen.id)}
                className={`border rounded-lg py-3 px-4 text-[10px] font-bold transition-micro flex items-center justify-center gap-2.5 relative overflow-hidden uppercase tracking-wider ${
                  isActive
                    ? `${scen.color} ring-1 ring-offset-0`
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? `${scen.led} animate-led` : 'bg-slate-700'}`}></span>
                {scen.label}
              </button>
            );
          })}
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
