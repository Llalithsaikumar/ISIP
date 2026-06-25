import React from 'react';

const MetricCard = ({ title, value, description, icon: Icon, colorClass }) => {
  return (
    <div className="glass-card glass-card-hover p-6 flex items-start justify-between border border-slate-900 scada-grid-bg relative">
      <div className="tech-corner-tl"></div>
      <div className="tech-corner-tr"></div>
      <div className="tech-corner-bl"></div>
      <div className="tech-corner-br"></div>
      
      <div className="space-y-2 relative z-10 font-mono-tech">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-white font-orbitron">{value}</h3>
        {description && (
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">{description}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-slate-950 border border-slate-900 relative z-10 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
};

export default MetricCard;
