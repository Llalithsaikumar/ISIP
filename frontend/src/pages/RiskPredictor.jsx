import React, { useState } from 'react';
import { BrainCircuit, Info, Sparkles } from 'lucide-react';
import { evaluateRisk } from '../services/prediction';

const RiskPredictor = () => {
  const [form, setForm] = useState({
    category: 'Chemical',
    department: 'Warehouse',
    severity: 'High',
    likelihood: 'Possible',
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const evaluation = await evaluateRisk(form);
      setResult(evaluation);
    } catch (err) {
      console.error(err);
      setError('Could not run risk predictions. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (label) => {
    if (!label) return 'text-slate-400 border-slate-800 bg-slate-950/20';
    if (label.includes('Low')) return 'text-emerald-450 bg-emerald-950/15 border-emerald-500/30 glow-green';
    if (label.includes('Medium')) return 'text-amber-400 bg-amber-950/15 border-amber-500/30 glow-amber';
    if (label.includes('High')) return 'text-orange-400 bg-orange-950/15 border-orange-500/30 glow-orange';
    if (label.includes('Critical')) return 'text-red-400 bg-red-950/15 border-red-500/35 glow-red animate-pulse';
    return 'text-indigo-400 bg-indigo-950/15 border-indigo-500/30';
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-mono-tech animate-fadeIn">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-4 shrink-0">
        <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2.5 font-orbitron">
          <BrainCircuit className="h-5 w-5 text-indigo-400" />
          PREDICTIVE INTELLIGENCE MODULE
        </h1>
        <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
          RANDOM FOREST REGRESSION INFERENCE ENGINE // HYPOTHETICAL INCIDENT ANALYSES
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[10px] font-bold text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 flex-1 items-start">
        {/* Left: Input Form */}
        <div className="glass-card p-6 h-fit border border-slate-900 scada-grid-bg relative">
          <div className="tech-corner-tl"></div>
          <div className="tech-corner-tr"></div>
          <div className="tech-corner-bl"></div>
          <div className="tech-corner-br"></div>

          <div className="flex items-center gap-2.5 mb-6 border-b border-slate-900 pb-3 relative z-10">
            <BrainCircuit className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron">Parameter Config Board</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Hazard Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 hover:border-slate-800 transition-micro cursor-pointer uppercase h-10"
                >
                  <option value="Chemical">Chemical / Gas Leak</option>
                  <option value="Electrical">Electrical Arc / Shock</option>
                  <option value="Mechanical">Mechanical Breakage</option>
                  <option value="Slippage">Slippage & Falls</option>
                  <option value="PPE Violation">PPE Violation</option>
                  <option value="Fire Hazard">Fire Hazard</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Zone Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 hover:border-slate-800 transition-micro cursor-pointer uppercase h-10"
                >
                  <option value="Operations">Operations Floor</option>
                  <option value="Maintenance">Maintenance Bay</option>
                  <option value="Warehouse">Warehouse Depot</option>
                  <option value="Logistics">Logistics Hub</option>
                  <option value="Quality Assurance">Quality QA Lab</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Severity Class
                </label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 hover:border-slate-800 transition-micro cursor-pointer uppercase h-10"
                >
                  <option value="Low">Low (Minor rating)</option>
                  <option value="Medium">Medium (Moderate rating)</option>
                  <option value="High">High (Elevated rating)</option>
                  <option value="Critical">Critical (Severe rating)</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Likelihood Class
                </label>
                <select
                  value={form.likelihood}
                  onChange={(e) => setForm(prev => ({ ...prev, likelihood: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 hover:border-slate-800 transition-micro cursor-pointer uppercase h-10"
                >
                  <option value="Rare">Rare (Unlikely)</option>
                  <option value="Possible">Possible (Occasional)</option>
                  <option value="Likely">Likely (Frequent)</option>
                  <option value="Certain">Certain (Continuous)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg py-3 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-micro disabled:opacity-50 h-11"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'RUNNING RISK MATRIX MODELS...' : 'Inference Risk Predictor'}
            </button>
          </form>
        </div>

        {/* Right: Results Dashboard */}
        <div className="space-y-6 flex-1 flex flex-col justify-start">
          {!result && !loading ? (
            <div className="glass-card p-12 text-center text-slate-500 h-64 flex flex-col items-center justify-center gap-4 border border-slate-900">
              <div className="tech-corner-tl"></div>
              <div className="tech-corner-tr"></div>
              <div className="tech-corner-bl"></div>
              <div className="tech-corner-br"></div>
              <Info className="h-7 w-7 text-slate-700 relative z-10" />
              <p className="text-[10px] font-bold tracking-wider relative z-10">AWAITING SYSTEM PARAMETER INPUT INFERENCE TARGETS</p>
            </div>
          ) : loading ? (
            <div className="glass-card p-12 text-center text-slate-500 h-64 flex flex-col items-center justify-center gap-4 border border-indigo-500/20 animate-pulse">
              <div className="tech-corner-tl"></div>
              <div className="tech-corner-tr"></div>
              <div className="tech-corner-bl"></div>
              <div className="tech-corner-br"></div>
              <div className="h-9 w-9 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin relative z-10"></div>
              <p className="text-slate-300 font-bold uppercase text-[10px] tracking-wider relative z-10">RUNNING RANDOM FOREST INFERENCE PIPELINE...</p>
            </div>
          ) : (
            <div className="glass-card p-6 space-y-6 border border-slate-900 relative">
              <div className="tech-corner-tl"></div>
              <div className="tech-corner-tr"></div>
              <div className="tech-corner-bl"></div>
              <div className="tech-corner-br"></div>

              {/* Heading */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3.5 relative z-10">
                <h4 className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron">Model Assessment Report</h4>
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest font-mono-tech">CLASSIFIER V1.0 // SKLEARN</span>
              </div>

              {/* Main Indicator */}
              <div className={`p-6 rounded-lg border text-center space-y-2 relative z-10 ${getRiskColor(result.predicted_risk_label)}`}>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-80 font-mono-tech">PREDICTED RISK ASSESSMENT</p>
                <h3 className="text-2xl font-black font-orbitron uppercase tracking-widest">{result.predicted_risk_label}</h3>
                <p className="text-[9px] font-mono-tech opacity-90">
                  MODEL CONFIDENCE: {(result.confidence_score * 100).toFixed(1)}%
                </p>
              </div>

              {/* Confidence Bar */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono-tech">
                  <span>Inference Confidence Level</span>
                  <span className="text-slate-300">{(result.confidence_score * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    style={{ width: `${result.confidence_score * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* All Probabilities */}
              <div className="space-y-3 pt-2 relative z-10">
                <h5 className="text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 font-mono-tech">Class Probability Matrix</h5>
                <div className="space-y-2">
                  {Object.entries(result.all_probabilities).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60 font-mono-tech">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{key}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              key.includes('Low') ? 'bg-emerald-500' :
                              key.includes('Medium') ? 'bg-amber-500' :
                              key.includes('High') ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${val * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-200 w-10 text-right">{(val * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advisory advisory */}
              <div className="rounded-lg bg-slate-950 border border-slate-900 p-4 text-[10px] text-slate-500 flex items-start gap-2.5 leading-relaxed relative z-10 font-mono-tech">
                <Info className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  This forecast output maps real-time categories into categorical features utilizing Random Forest models. High/Critical flags should be verified using physical checks and documented using LOTO mitigation protocols.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskPredictor;
