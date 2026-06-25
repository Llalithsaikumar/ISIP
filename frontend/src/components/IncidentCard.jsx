import React, { useState } from 'react';
import { AlertOctagon, User, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';

const IncidentCard = ({ incident, onUpdateStatus }) => {
  const [mitigation, setMitigation] = useState(incident.mitigation_action || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(incident.status);

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'Low': return 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30 glow-green';
      case 'Medium': return 'bg-amber-950/20 text-amber-400 border-amber-500/30 glow-amber';
      case 'High': return 'bg-orange-950/20 text-orange-400 border-orange-500/30 glow-orange';
      case 'Critical': return 'bg-red-950/20 text-red-400 border-red-500/30 glow-red animate-pulse';
      default: return 'bg-slate-950/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (stat) => {
    switch (stat) {
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-indigo-950/20 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-red-950/20 text-red-400 border-red-500/30';
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdateStatus(incident.id, status, mitigation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden scada-grid-bg">
      {/* Sci-fi Panel Corners */}
      <div className="tech-corner-tl"></div>
      <div className="tech-corner-tr"></div>
      <div className="tech-corner-bl"></div>
      <div className="tech-corner-br"></div>

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getSeverityColor(incident.severity)}`}>
              {incident.severity}
            </span>
            <span className={`rounded border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(incident.status)}`}>
              {incident.status}
            </span>
            <span className="rounded bg-slate-950 border border-slate-800 px-2.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono-tech">
              {incident.category}
            </span>
          </div>
          <h4 className="text-base font-bold text-white mt-1 uppercase tracking-wide">{incident.title}</h4>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-[9px] text-indigo-400 font-bold uppercase tracking-widest font-mono-tech">
            <ShieldAlert className="h-3 w-3" />
            <span>RISK SCORE</span>
          </div>
          <span className="text-xl font-black text-white font-orbitron">{incident.risk_score?.toFixed(1) || '0.0'}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed bg-[#03060a]/60 p-3.5 rounded-lg border border-slate-900 font-mono-tech relative z-10">
        {incident.description}
      </p>

      {/* Meta Footer */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-900 pt-3.5 text-[10px] text-slate-500 font-mono-tech relative z-10">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-650" />
          <span>REPORTER: <strong className="text-slate-300">{incident.reporter}</strong> (DEPT: {incident.department.toUpperCase()})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-650" />
          <span>TIMESTAMP: {new Date(incident.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Action / Mitigation Plan */}
      <div className="border-t border-slate-900 pt-3.5 relative z-10">
        {incident.status === 'Resolved' || incident.status === 'Closed' ? (
          <div className="rounded-lg bg-emerald-950/15 border border-emerald-500/20 p-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mitigation Log Approved</h5>
                <p className="text-xs text-slate-300 mt-1 font-mono-tech">{incident.mitigation_action || 'No action notes documented.'}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-3">
            <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">
              Update Corrective Action & Status
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer h-9 uppercase"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <input
                type="text"
                value={mitigation}
                onChange={(e) => setMitigation(e.target.value)}
                placeholder="Describe actions taken to mitigate hazard..."
                className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 h-9 font-mono-tech"
                required
              />
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg px-4 py-2 transition-micro disabled:opacity-50 h-9 uppercase tracking-wider"
              >
                {isUpdating ? 'Saving...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default IncidentCard;
