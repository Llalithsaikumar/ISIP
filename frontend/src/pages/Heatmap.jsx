import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  ShieldAlert, Activity, Thermometer, Flame, Gauge, AlertTriangle, Users 
} from 'lucide-react';

const Heatmap = ({ zoneData }) => {
  const [selectedZone, setSelectedZone] = useState('Zone A');

  if (!zoneData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4 font-mono-tech">
        <span className="text-sm text-slate-400">LOADING SCADA GRID HEATMAP...</span>
      </div>
    );
  }

  const selectedData = zoneData[selectedZone];

  const getRiskColor = (risk) => {
    if (risk <= 25) return { 
      bg: 'bg-emerald-950/20 border-emerald-500/40 text-emerald-450', 
      cell: 'bg-emerald-950/10 border-emerald-500/30 hover:bg-emerald-950/20', 
      glow: 'shadow-emerald-500/5',
      label: 'SAFE' 
    };
    if (risk <= 50) return { 
      bg: 'bg-yellow-950/20 border-yellow-500/40 text-yellow-400', 
      cell: 'bg-yellow-950/10 border-yellow-500/30 hover:bg-yellow-950/20', 
      glow: 'shadow-yellow-500/5',
      label: 'MODERATE' 
    };
    if (risk <= 75) return { 
      bg: 'bg-orange-950/20 border-orange-500/40 text-orange-400', 
      cell: 'bg-orange-950/10 border-orange-500/30 hover:bg-orange-950/20', 
      glow: 'shadow-orange-500/5',
      label: 'HIGH' 
    };
    return { 
      bg: 'bg-red-950/20 border-red-500/40 text-red-400 animate-pulse', 
      cell: 'bg-red-950/10 border-red-500/35 hover:bg-red-950/20', 
      glow: 'shadow-red-500/10',
      label: 'CRITICAL' 
    };
  };

  const getZoneOutlineSvg = (zoneName) => {
    switch (zoneName) {
      case 'Zone A':
        return (
          <svg className="absolute -bottom-2 -right-2 h-20 w-20 text-slate-800/15 pointer-events-none transform group-hover:scale-105 transition-transform duration-550" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v7M12 15v7M2 12h7M15 12h7M5.5 5.5l4.5 4.5M14 14l4.5 4.5M18.5 5.5L14 10M10 14l-4.5 4.5" />
          </svg>
        );
      case 'Zone B':
        return (
          <svg className="absolute -bottom-2 -right-2 h-20 w-20 text-slate-800/15 pointer-events-none transform group-hover:scale-105 transition-transform duration-550" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path d="M12 2C6.5 8 6.5 13 8 16c2 4 6 6 8 4 2-2 1-7-4-18z" />
            <path d="M12 18v3M9 19v2M15 19v2" />
          </svg>
        );
      case 'Zone C':
        return (
          <svg className="absolute -bottom-2 -right-2 h-20 w-20 text-slate-800/15 pointer-events-none transform group-hover:scale-105 transition-transform duration-550" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <rect x="3" y="10" width="12" height="8" rx="1" />
            <circle cx="6" cy="18" r="2" />
            <circle cx="12" cy="18" r="2" />
            <path d="M15 13h5v5M18 10v8M21 8v10" />
          </svg>
        );
      case 'Zone D':
        return (
          <svg className="absolute -bottom-2 -right-2 h-20 w-20 text-slate-800/15 pointer-events-none transform group-hover:scale-105 transition-transform duration-550" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(30 12 12)" />
            <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(90 12 12)" />
            <ellipse cx="12" cy="12" rx="3" ry="9" transform="rotate(150 12 12)" />
            <circle cx="12" cy="12" r="1.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  const currentStyles = getRiskColor(selectedData.risk_score);

  return (
    <div className="space-y-6 flex-1 flex flex-col font-mono-tech">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-4 shrink-0">
        <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2.5 font-orbitron">
          <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
          PLANT SAFETY HEATMAP
        </h1>
        <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
          GEOGRAPHICAL GRID FLOORS // TELEMETRY CORRELATION MATRICES
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 flex-1 items-stretch">
        
        {/* INTERACTIVE GRID SECTION */}
        <div className="glass-card p-5 flex flex-col justify-between border border-slate-900 overflow-hidden scada-grid-bg">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          {/* Radar Sweep scanning line */}
          <div className="absolute left-0 right-0 h-[2px] bg-indigo-500/25 shadow-[0_0_10px_#6366f1] animate-scan-sweep pointer-events-none z-10"></div>
          
          <div className="relative z-20">
            <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-4">
              Factory Layout blueprint (SELECT ZONE FOR PROFILES)
            </h3>
            
            <div className="grid grid-cols-2 gap-4 h-[300px] lg:h-[350px]">
              {Object.keys(zoneData).map((zoneName) => {
                const zone = zoneData[zoneName];
                const styles = getRiskColor(zone.risk_score);
                const isSelected = selectedZone === zoneName;
                
                return (
                  <button
                    key={zoneName}
                    onClick={() => setSelectedZone(zoneName)}
                    className={`border rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden select-none group ${styles.cell} ${styles.glow} ${
                      isSelected ? 'ring-1 ring-indigo-500/80 border-indigo-500/70 bg-[#0c1424]/40' : ''
                    }`}
                  >
                    {/* SVG Graphic Background */}
                    {getZoneOutlineSvg(zoneName)}

                    <div className="flex justify-between items-start w-full relative z-10">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold tracking-widest font-mono-tech">{zoneName}</span>
                        <h4 className="text-xs font-black text-slate-200 mt-0.5 uppercase font-orbitron">{zone.description}</h4>
                      </div>
                      {zone.alerts_count > 0 && (
                        <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-650 text-[8px] font-black text-white animate-bounce glow-red">
                          {zone.alerts_count}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end w-full mt-4 relative z-10">
                      <div>
                        <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">COMPOSITE RISK</span>
                        <span className="text-xl font-black text-white font-orbitron">{zone.risk_score}%</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${styles.bg}`}>
                        {styles.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-900 grid grid-cols-4 gap-2 text-center text-[8px] font-bold text-slate-500 relative z-20">
            <div className="flex items-center justify-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>SAFE (&lt;=25%)</div>
            <div className="flex items-center justify-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>MODERATE (26-50%)</div>
            <div className="flex items-center justify-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>HIGH (51-75%)</div>
            <div className="flex items-center justify-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>CRITICAL (&gt;75%)</div>
          </div>
        </div>

        {/* SELECTED ZONE DETAILS PANEL */}
        <div className="glass-card p-5 border border-slate-900 flex flex-col justify-between">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <div>
                <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest block">SELECTED SECTOR INSPECTION</span>
                <h3 className="text-base font-black text-white uppercase font-orbitron">{selectedZone}: {selectedData.description}</h3>
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${currentStyles.bg}`}>
                {currentStyles.label}
              </span>
            </div>

            {/* Metrics cards row */}
            <div className="grid gap-3 grid-cols-3">
              <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">CURRENT RISK</span>
                <span className="text-lg font-black text-white mt-1 font-orbitron">{selectedData.risk_score}%</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">ACTIVE ALERTS</span>
                <span className={`text-lg font-black mt-1 font-orbitron ${selectedData.alerts_count > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {selectedData.alerts_count}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg flex flex-col justify-between">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">STAFF DENSITY</span>
                <span className="text-lg font-black text-white mt-1 font-orbitron">{selectedData.worker_count}</span>
              </div>
            </div>

            {/* Telemetry metrics details */}
            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl space-y-3.5">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block border-b border-slate-900 pb-1.5">ZONE DIAGNOSTIC SENSORS</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-950 border border-slate-900 text-orange-400">
                    <Thermometer className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">THERMAL CORE</span>
                    <span className="text-xs font-bold text-slate-205 font-mono-tech">{selectedData.temperature.toFixed(1)} °C</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-950 border border-slate-900 text-emerald-400">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">COMBUSTIBLE GAS</span>
                    <span className="text-xs font-bold text-slate-205 font-mono-tech">{selectedData.gas_level.toFixed(1)} ppm</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-950 border border-slate-900 text-indigo-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">MECHANICAL FATIGUE</span>
                    <span className="text-xs font-bold text-slate-205 font-mono-tech">{selectedData.vibration.toFixed(1)} mm/s</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-950 border border-slate-900 text-cyan-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase font-bold tracking-wider">PPE COMPLIANCE</span>
                    <span className={`text-xs font-bold font-mono-tech ${selectedData.ppe_compliance === 1 ? 'text-emerald-450' : 'text-red-400 font-black animate-pulse'}`}>
                      {selectedData.ppe_compliance === 1 ? "COMPLIANT" : "BREACH"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Trend Chart */}
            <div className="space-y-2">
              <span className="text-[8px] text-slate-550 font-bold uppercase tracking-widest block">SECTOR RISK 24H GRAPH</span>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedData.trend} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`colorRisk-${selectedZone}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f141c" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={7} tickLine={false} />
                    <YAxis stroke="#475569" domain={[0, 100]} fontSize={7} tickLine={false} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#060a12] border border-slate-800 p-2 rounded shadow-2xl font-mono-tech text-[9px] text-slate-300">
                              <p className="text-slate-500 mb-0.5">TIME: {label}</p>
                              <p className="font-bold text-indigo-400">RISK: {payload[0].value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="risk_score" 
                      stroke="#6366f1" 
                      strokeWidth={1.5} 
                      fillOpacity={1} 
                      fill={`url(#colorRisk-${selectedZone})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Heatmap;
