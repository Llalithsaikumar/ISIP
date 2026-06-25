import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, CheckCircle2, Eye, EyeOff, Bell, BellOff, 
  Filter, AlertTriangle, Hammer, Clock, MapPin 
} from 'lucide-react';

const Alerts = ({ alerts, setAlerts }) => {
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, acknowledged, resolved
  const [filterSeverity, setFilterSeverity] = useState('all'); // all, critical, high, medium, low
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const audioCtxRef = useRef(null);

  const activeAlerts = alerts.filter(a => a.status === 'Active');
  const activeAlertsCount = activeAlerts.length;

  // Web Audio alarm buzzer simulation
  useEffect(() => {
    if (!soundEnabled || activeAlertsCount === 0) return;

    const intervalId = setInterval(() => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Classic industrial alarm twin-beep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch (err) {
        console.warn("Audio Context playback blocked by browser security policy.", err);
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [soundEnabled, activeAlertsCount]);

  // Acknowledge an alert
  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a));
  };

  // Resolve an alert
  const handleResolve = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
  };

  // Clear resolved logs
  const handleClearResolved = () => {
    setAlerts(prev => prev.filter(a => a.status !== 'Resolved'));
  };

  // Apply filters
  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = filterStatus === 'all' || alert.status.toLowerCase() === filterStatus;
    const severityMatch = filterSeverity === 'all' || alert.severity.toLowerCase() === filterSeverity;
    return statusMatch && severityMatch;
  });

  const getSeverityStyle = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', glow: 'animate-led glow-red' };
      case 'high':
        return { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', glow: 'animate-led glow-orange' };
      case 'medium':
        return { text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', glow: 'glow-amber' };
      default:
        return { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', glow: 'glow-green' };
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-mono-tech">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-4 gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2.5 font-orbitron">
            <ShieldAlert className={`h-5 w-5 ${activeAlertsCount > 0 ? 'text-red-500 animate-pulse glow-red' : 'text-slate-400'}`} />
            SAFETY ALARM ANNUNCIATOR
          </h1>
          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
            MASTER ALARM PANELS // EVENT DISPATCH CONSOLE
          </p>
        </div>

        {/* Audio Beep Controls */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold border transition-all uppercase tracking-wider ${
              soundEnabled 
                ? 'bg-red-950/40 border-red-500/40 text-red-400 shadow-md shadow-red-500/5' 
                : 'bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'
            }`}
          >
            {soundEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {soundEnabled ? 'HORN ALARM ACTIVE' : 'HORN ALARM MUTED'}
          </button>
          
          {alerts.some(a => a.status === 'Resolved') && (
            <button
              onClick={handleClearResolved}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 rounded-lg px-3 py-2 text-xs font-bold hover:text-slate-300 uppercase tracking-wider h-9"
            >
              PURGE RESOLVED
            </button>
          )}
        </div>
      </div>

      {/* MASTER FLASHING WARNING BANNER */}
      {activeAlertsCount > 0 && (
        <div className="bg-red-950/15 border border-red-500/35 rounded-xl p-4 flex items-center justify-between shrink-0 shadow-lg shadow-red-500/5 relative overflow-hidden border-critical-flash">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
            <div>
              <p className="text-xs font-black text-red-400 uppercase tracking-wider font-orbitron">CRITICAL HAZARD BREACH ACTIVE</p>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5 tracking-widest font-mono-tech">IMMEDIATE LOTO AND CONTAINMENT SQUAD DEPLOYMENT REQUIRED</p>
            </div>
          </div>
          <span className="text-[10px] bg-red-650 text-white font-black py-1 px-3.5 rounded shadow-md animate-pulse font-orbitron">
            ALARM
          </span>
        </div>
      )}

      {/* ALERTS FILTER BAR */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 shrink-0 border border-slate-900 scada-grid-bg">
        <div className="tech-corner-tl"></div>
        <div className="tech-corner-tr"></div>
        <div className="tech-corner-bl"></div>
        <div className="tech-corner-br"></div>

        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mr-2">
            <Filter className="h-3.5 w-3.5 text-slate-650" />
            <span>FILTER PANEL:</span>
          </div>

          {/* Status Filters */}
          <div className="flex bg-slate-950 border border-slate-900 p-0.5 rounded-lg">
            {['all', 'active', 'acknowledged', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-[9px] px-2.5 py-1.5 rounded font-bold uppercase tracking-wider transition-all ${
                  filterStatus === status 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-550 hover:text-slate-350'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Severity Filters */}
          <div className="flex bg-slate-950 border border-slate-900 p-0.5 rounded-lg">
            {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`text-[9px] px-2.5 py-1.5 rounded font-bold uppercase tracking-wider transition-all ${
                  filterSeverity === severity 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-550 hover:text-slate-350'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[9px] font-bold text-slate-500 relative z-10 uppercase tracking-widest font-mono-tech">
          RECORDS: {filteredAlerts.length} / {alerts.length} LOGGED
        </div>
      </div>

      {/* ALARM GRID ANNUNCIATOR TABLE */}
      <div className="flex-1 min-h-[300px] overflow-y-auto custom-scrollbar border border-slate-900 rounded-xl bg-slate-950/60 relative">
        <div className="tech-corner-tl"></div>
        <div className="tech-corner-tr"></div>
        <div className="tech-corner-bl"></div>
        <div className="tech-corner-br"></div>
        
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 relative z-10">
            <CheckCircle2 className="h-7 w-7 text-slate-700" />
            <p className="text-[10px] font-bold tracking-wider">NO ALARM TICKETS MATCH CURRENT SEARCH CONSTRAINTS</p>
          </div>
        ) : (
          <div className="min-w-[800px] w-full border-collapse text-left relative z-10">
            {/* Header */}
            <div className="grid grid-cols-12 bg-slate-950/90 border-b border-slate-900 text-slate-500 text-[9px] font-bold py-3.5 px-4 uppercase tracking-widest sticky top-0 z-20">
              <div className="col-span-1.5">Status</div>
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-3">Alarm Event / Code</div>
              <div className="col-span-2.5">Location</div>
              <div className="col-span-1.5">Telemetry</div>
              <div className="col-span-1.5 text-right">Actions</div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-900">
              {filteredAlerts.map((alert) => {
                const style = getSeverityStyle(alert.severity);
                return (
                  <div 
                    key={alert.id} 
                    className={`grid grid-cols-12 items-center text-xs py-4 px-4 hover:bg-slate-950/40 transition-micro border-l-2 ${
                      alert.status === 'Active' 
                        ? alert.severity.toLowerCase() === 'critical'
                          ? 'border-red-500 bg-red-950/5'
                          : 'border-orange-500 bg-orange-950/5'
                        : 'border-transparent'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="col-span-1.5 flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full bg-current ${style.text} ${style.glow}`}></span>
                      <span className={`ml-2 text-[9px] font-bold ${style.text} uppercase tracking-wider`}>{alert.severity}</span>
                    </div>

                    {/* Timestamp */}
                    <div className="col-span-2 text-slate-400 flex items-center gap-1.5 font-mono-tech">
                      <Clock className="h-3.5 w-3.5 text-slate-650" />
                      {alert.timestamp}
                    </div>

                    {/* Title */}
                    <div className="col-span-3">
                      <p className="font-bold text-slate-200 uppercase tracking-wide">{alert.title}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 font-mono-tech">{alert.type}</p>
                    </div>

                    {/* Location */}
                    <div className="col-span-2.5 text-slate-400 flex items-center gap-1.5 uppercase font-mono-tech">
                      <MapPin className="h-3.5 w-3.5 text-slate-650" />
                      {alert.location}
                    </div>

                    {/* Telemetry Trigger */}
                    <div className="col-span-1.5 text-slate-300 font-mono-tech">
                      <p className="font-bold text-slate-205">{alert.value}</p>
                      <p className="text-[8px] text-slate-600 font-bold mt-0.5">LIMIT: {alert.threshold.toUpperCase()}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1.5 text-right flex justify-end gap-1.5">
                      {alert.status === 'Active' && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/35 text-indigo-400 text-[9px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider transition-micro h-7"
                        >
                          ACK
                        </button>
                      )}
                      
                      {alert.status !== 'Resolved' && (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/35 text-emerald-450 text-[9px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider transition-micro h-7"
                        >
                          RESOLVE
                        </button>
                      )}

                      {alert.status === 'Resolved' && (
                        <span className="text-[9px] text-emerald-450 font-bold px-3 py-1.5 flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          DONE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Alerts;
