import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ScatterChart, Scatter, ZAxis, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  BarChart3, Activity, ShieldAlert, Cpu, Heart, CheckCircle2, 
  UserCheck, Zap, Info 
} from 'lucide-react';
import { 
  getDepartmentRiskData, 
  getStressCorrelationData 
} from '../services/dummyData';

const RiskAnalytics = ({ historicalData }) => {
  const deptData = getDepartmentRiskData();
  const correlationData = getStressCorrelationData();

  // Custom styled Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#060a12] border border-slate-800 p-3 rounded-lg shadow-2xl font-mono-tech text-xs text-slate-300 relative">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          <p className="text-slate-500 mb-1 border-b border-slate-900 pb-1">DEPT: {label}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ color: item.color || item.fill }} className="font-bold">
              {item.name.toUpperCase()}: {Number(item.value).toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Scatter Tooltip
  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#060a12] border border-slate-800 p-3 rounded-lg shadow-2xl font-mono-tech text-xs text-slate-300 relative">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          <p className="text-slate-200 font-bold mb-1 border-b border-slate-900 pb-1">{payload[0].payload.category.toUpperCase()}</p>
          <p className="text-orange-400 font-bold">CORE TEMP: {payload[0].value} °C</p>
          <p className="text-cyan-400 font-bold">FATIGUE: {payload[1].value} mm/s</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-mono-tech">
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-4 shrink-0">
        <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2.5 font-orbitron">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          RISK & SAFETY ANALYTICS
        </h1>
        <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
          AGGREGATE INDUSTRIAL TELEMETRY DATA // SCADA SYNERGY GRAPHS
        </p>
      </div>

      {/* THREE ANALYTICAL SUMMARY WIDGETS */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 shrink-0">
        
        {/* WIDGET 1: PPE SITE COMPLIANCE */}
        <div className="glass-card p-4 flex items-center gap-4 border border-slate-900 scada-grid-bg">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-emerald-450 shrink-0 relative z-10 glow-green">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="relative z-10">
            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider font-mono-tech">Site PPE Compliance</span>
            <span className="text-xl font-black text-white font-orbitron">96.6%</span>
            <span className="text-[8px] text-emerald-450 block font-bold mt-0.5 tracking-wider">COMPLIANT SHIFT PROTOCOLS</span>
          </div>
        </div>

        {/* WIDGET 2: HIGHEST RISK ZONE */}
        <div className="glass-card p-4 flex items-center gap-4 border border-slate-900 scada-grid-bg">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-lg text-red-400 shrink-0 relative z-10 glow-red animate-pulse">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="relative z-10">
            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider font-mono-tech">Highest Risk Department</span>
            <span className="text-xl font-black text-white font-orbitron">Maintenance</span>
            <span className="text-[8px] text-red-400 block font-bold mt-0.5 tracking-wider">AVG HAZARD RATIO: 54.8</span>
          </div>
        </div>

        {/* WIDGET 3: MACHINE RELIABILITY */}
        <div className="glass-card p-4 flex items-center gap-4 border border-slate-900 scada-grid-bg">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-cyan-400 shrink-0 relative z-10 glow-green">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="relative z-10">
            <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider font-mono-tech">Machinery Health Index</span>
            <span className="text-xl font-black text-white font-orbitron">98.2%</span>
            <span className="text-[8px] text-cyan-400 block font-bold mt-0.5 tracking-wider">STRESS ENVELOPE: OPTIMAL</span>
          </div>
        </div>

      </div>

      {/* ANALYTICAL CHARTS SECTION */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 flex-1 min-h-[300px]">
        
        {/* CHART 1: DEPARTMENTAL RISK COMPARISON */}
        <div className="glass-card p-5 border border-slate-900 flex flex-col">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2 relative z-10">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Department Risk vs compliance</h3>
            <span className="text-[8px] text-slate-550 font-bold">PLANT-WIDE ROLLUP</span>
          </div>
          
          <div className="flex-1 w-full h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_risk" fill="#6366f1" name="Avg Risk Index" radius={[2, 2, 0, 0]} opacity={0.8} />
                <Bar dataKey="compliance" fill="#10b981" name="PPE Compliance %" radius={[2, 2, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: VIBRATION VS TEMPERATURE CORRELATION */}
        <div className="glass-card p-5 border border-slate-900 flex flex-col">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2 relative z-10">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Thermal vs mechanical stress</h3>
            <span className="text-[8px] text-slate-550 font-bold font-mono-tech">CORRELATION MAP</span>
          </div>
          
          <div className="flex-1 w-full h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" />
                <XAxis type="number" dataKey="x" name="Temperature" unit=" C" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis type="number" dataKey="y" name="Vibration" unit=" mm/s" stroke="#475569" fontSize={8} tickLine={false} />
                <ZAxis type="category" dataKey="category" />
                <Tooltip content={<ScatterTooltip />} />
                {/* Normal operation scatter */}
                <Scatter 
                  name="Normal Ops" 
                  data={correlationData.filter(d => d.category === "Normal Operations")} 
                  fill="#06b6d4" 
                  opacity={0.65}
                />
                {/* Critical stress scatter */}
                <Scatter 
                  name="Critical Stress" 
                  data={correlationData.filter(d => d.category === "Critical Stress")} 
                  fill="#ef4444" 
                  opacity={0.8}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: WORKER EXPOSURE HISTORICAL COMPOSITE */}
        <div className="glass-card p-5 border border-slate-900 flex flex-col lg:col-span-2">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2 relative z-10">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Site headcount exposure vs risk trend</h3>
            <span className="text-[8px] text-slate-550 font-bold uppercase">DUAL AXIS RADAR</span>
          </div>
          
          <div className="flex-1 w-full h-[220px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRiskAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={8} tickLine={false} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="risk_score" stroke="#f43f5e" name="Composite Risk" fillOpacity={1} fill="url(#colorRiskAnalytics)" strokeWidth={1.5} />
                <Line type="monotone" dataKey="worker_count" stroke="#0ea5e9" name="Workers Count" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* COMPLIANCE NOTES PANEL */}
      <div className="glass-card p-4 flex gap-3.5 border border-slate-900">
        <div className="tech-corner-tl"></div>
        <div className="tech-corner-tr"></div>
        <div className="tech-corner-bl"></div>
        <div className="tech-corner-br"></div>

        <Info className="h-5 w-5 text-indigo-400 shrink-0 relative z-10" />
        <div className="text-[10px] text-slate-500 space-y-1 relative z-10 font-mono-tech leading-relaxed">
          <p className="font-bold text-slate-450 uppercase tracking-widest">ANALYSIS CRITERIA NOTES:</p>
          <p>
            - Site PPE Compliance index reflects active image classification nodes cross-referencing worker IDs with helmet/vest detection status.
          </p>
          <p>
            - Thermal vs Mechanical Stress plots active temperature inputs against mechanical vibration shock thresholds. The top-right quadrant (Temp &gt; 80°C, Vibration &gt; 70 mm/s) triggers critical fatigue alarms.
          </p>
        </div>
      </div>

    </div>
  );
};

export default RiskAnalytics;
