import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, UploadCloud, FileText, Bot, User, HelpCircle, Check, 
  AlertCircle, ShieldAlert, Sparkles, RefreshCw, ClipboardList, BookOpen, AlertTriangle
} from 'lucide-react';
import { queryAssistant, uploadSafetyDocument } from '../services/chat';
import { generateAIReport } from '../services/incidents';

const SafetyAI = ({ telemetry }) => {
  const [activeTab, setActiveTab] = useState('rag'); // 'rag' or 'rca'

  // Tab 1: RAG States
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello, I am your Safety Intelligence Advisor. You can ask me about plant safety guidelines, OSHA standards, hazard mitigations, or standard operating procedures. Upload safety files on the left to index them in my vector database.',
      sources: []
    }
  ]);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Tab 2: RCA / Report States
  const [reportForm, setReportForm] = useState({
    final_risk: 30,
    temperature: 25.0,
    gas_level: 12.0,
    ppe_compliance: 1
  });
  const [reportResult, setReportResult] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    if (activeTab === 'rag') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle RAG Send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim() || sending) return;

    const userMsg = query;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setQuery('');
    setSending(true);

    try {
      const response = await queryAssistant(userMsg);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: response.answer,
        sources: response.sources || []
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I encountered an issue accessing my vector index or LLM. Verify your configurations.',
        sources: []
      }]);
    } finally {
      setSending(false);
    }
  };

  // Handle File Change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  // Handle File Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const response = await uploadSafetyDocument(file);
      setUploadStatus({
        success: true,
        message: `Successfully indexed ${response.filename} (${response.chunks} chunks).`
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setUploadStatus({
        success: false,
        message: err.response?.data?.detail || 'Failed to parse and index safety document.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Load live telemetry parameters into the RCA form
  const handleLoadLiveTelemetry = () => {
    if (!telemetry) return;
    setReportForm({
      final_risk: Math.round(telemetry.risk_score),
      temperature: parseFloat(telemetry.temperature.toFixed(1)),
      gas_level: parseFloat(telemetry.gas_level.toFixed(1)),
      ppe_compliance: telemetry.ppe_compliance
    });
  };

  // Generate safety report
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGeneratingReport(true);
    setReportError(null);
    setReportResult(null);

    try {
      const result = await generateAIReport(reportForm);
      setReportResult(result);
    } catch (err) {
      console.error(err);
      setReportError(err.response?.data?.detail || 'Incident investigation failed. Check if backend is active.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Priority color formatting helper
  const getPriorityBadge = (summaryText) => {
    const text = summaryText || '';
    if (text.includes('CRITICAL')) return { label: 'CRITICAL', style: 'bg-red-950/20 border-red-500/35 text-red-400 glow-red animate-pulse' };
    if (text.includes('HIGH')) return { label: 'HIGH', style: 'bg-orange-950/20 border-orange-500/35 text-orange-400 glow-orange' };
    if (text.includes('MEDIUM')) return { label: 'MEDIUM', style: 'bg-yellow-950/20 border-yellow-500/35 text-yellow-400 glow-amber' };
    return { label: 'LOW', style: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-450 glow-green' };
  };

  const priorityBadge = reportResult ? getPriorityBadge(reportResult.priority || reportResult.incident_summary) : null;

  return (
    <div className="space-y-6 flex-1 flex flex-col font-mono-tech">
      
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-4 gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2.5 font-orbitron">
            <Bot className="h-5 w-5 text-indigo-400 animate-pulse" />
            SAFETY GPT CO-PILOT
          </h1>
          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
            RETRIEVAL-AUGMENTED SAFETY GUIDELINES // KNOWLEDGE INDEXING PIPELINES
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-950 border border-slate-900 p-0.5 rounded-lg shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('rag')}
            className={`text-[10px] px-3.5 py-2 rounded font-bold uppercase flex items-center gap-2 transition-all tracking-wider ${
              activeTab === 'rag' 
                ? 'bg-slate-900 text-white shadow-sm border border-slate-800' 
                : 'text-slate-550 hover:text-slate-350'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            RAG INGEST SYSTEM
          </button>
          <button
            onClick={() => setActiveTab('rca')}
            className={`text-[10px] px-3.5 py-2 rounded font-bold uppercase flex items-center gap-2 transition-all tracking-wider ${
              activeTab === 'rca' 
                ? 'bg-slate-900 text-white shadow-sm border border-slate-800' 
                : 'text-slate-550 hover:text-slate-350'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            INCIDENT DIAGNOSTICS (RCA)
          </button>
        </div>
      </div>

      {activeTab === 'rag' ? (
        /* ==================== TAB 1: RAG KNOWLEDGE BASE ==================== */
        <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0 items-stretch">
          {/* Left Column: VectorDB Document Ingest */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full min-h-0 justify-between">
            <div className="glass-card p-6 flex flex-col h-full min-h-0 justify-between border border-slate-900 scada-grid-bg">
              <div className="tech-corner-tl"></div>
              <div className="tech-corner-tr"></div>
              <div className="tech-corner-bl"></div>
              <div className="tech-corner-br"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-4 shrink-0 border-b border-slate-900 pb-3">
                  <UploadCloud className="h-4.5 w-4.5 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron">Vector DB Datalink</h3>
                </div>
                
                <p className="text-[10px] text-slate-500 mb-6 shrink-0 leading-relaxed font-bold uppercase">
                  INDEX SYSTEM MANUALS, OSHA HANDBOOKS, OR HAZARD CONTROL STANDARD OPERATING PROCEDURES (SOPS).
                </p>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-micro ${
                      file 
                        ? 'border-indigo-500 bg-indigo-950/20' 
                        : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/40'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.txt,.md"
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <FileText className={`h-8 w-8 transition-colors ${file ? 'text-indigo-455' : 'text-slate-700'}`} />
                      {file ? (
                        <div>
                          <p className="text-xs font-bold text-slate-200 truncate max-w-[180px] mx-auto">{file.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB SIZE</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-350 uppercase tracking-wide">Select Document File</p>
                          <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-wider">PDF, TXT, or MD (Max 15MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {uploadStatus && (
                    <div className={`rounded border p-4 text-[9px] font-bold uppercase flex gap-2 items-start leading-relaxed ${
                      uploadStatus.success 
                        ? 'bg-emerald-950/15 border-emerald-500/35 text-emerald-450' 
                        : 'bg-red-950/15 border-red-500/35 text-red-400'
                    }`}>
                      {uploadStatus.success ? <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />}
                      <span>{uploadStatus.message}</span>
                    </div>
                  )}
                </form>
              </div>

              <button
                type="submit"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-950 disabled:border-slate-900 disabled:text-slate-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg py-3 shadow-lg shadow-indigo-600/10 transition-micro shrink-0 border border-transparent h-11 relative z-10"
              >
                {uploading ? 'INGESTING ARCHIVE CHUNKS...' : 'Ingest to Safety DB'}
              </button>
            </div>
          </div>

          {/* Right Column: Chat Assistant Panel */}
          <div className="lg:col-span-2 flex flex-col glass-card h-full min-h-0 overflow-hidden border border-slate-900">
            <div className="tech-corner-tl"></div>
            <div className="tech-corner-tr"></div>
            <div className="tech-corner-bl"></div>
            <div className="tech-corner-br"></div>

            {/* Top Panel Bar */}
            <div className="flex items-center justify-between border-b border-slate-900 px-6 py-4 shrink-0 relative z-10">
              <div className="flex items-center gap-2.5">
                <Bot className="h-4.5 w-4.5 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron">Advisor Dialogue Terminal</h3>
                  <p className="text-[8px] text-slate-550 font-bold tracking-widest uppercase mt-0.5 font-mono-tech">RAG QUERY FEED</p>
                </div>
              </div>
              <HelpCircle className="h-4 w-4 text-slate-600 cursor-help" />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar min-h-0 bg-slate-950/40 relative z-10">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    msg.sender === 'user' 
                      ? 'bg-slate-950 border-slate-800 text-slate-400' 
                      : 'bg-indigo-950/40 border-indigo-500/25 text-indigo-400'
                  }`}>
                    {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 animate-pulse" />}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-2">
                    <div className={`p-4 rounded-lg text-xs leading-relaxed border ${
                      msg.sender === 'user'
                        ? 'bg-indigo-900/10 border-indigo-500/35 text-slate-100 rounded-tr-none'
                        : 'bg-slate-950/90 border-slate-900 text-slate-300 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Sources tag if available */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 px-1 font-mono-tech">
                        <span className="text-[8px] font-black text-slate-550 uppercase tracking-widest mr-1">Retrieved Vectors:</span>
                        {msg.sources.map((src, sidx) => (
                          <span key={sidx} className="bg-slate-950 border border-slate-900 text-[8px] text-indigo-400 font-bold px-2 py-0.5 rounded uppercase">
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                  <div className="h-8 w-8 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-lg rounded-tl-none text-slate-450 text-xs flex gap-2.5 items-center">
                    <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[8px] ml-1 font-bold text-slate-550 uppercase tracking-widest font-mono-tech">SCANNING INDEX CHUNKS...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Form Ingress Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-900 bg-[#060a12] flex gap-2 shrink-0 relative z-10">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query OSHA rules, chemical guidelines, LOTO mitigation, or machine SOPs..."
                className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-4 py-3 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-mono-tech h-11"
                required
              />
              <button
                type="submit"
                disabled={sending || !query.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-4 flex items-center justify-center transition-micro shadow-md shadow-indigo-600/10 h-11"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ==================== TAB 2: INCIDENT INVESTIGATOR & RCA ==================== */
        <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0 items-start">
          {/* Left Column: Parameter Form */}
          <div className="lg:col-span-1 glass-card p-6 space-y-6 border border-slate-900 scada-grid-bg relative">
            <div className="tech-corner-tl"></div>
            <div className="tech-corner-tr"></div>
            <div className="tech-corner-bl"></div>
            <div className="tech-corner-br"></div>

            <div className="flex justify-between items-center border-b border-slate-900 pb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron font-bold">Diagnostics Input</h3>
              </div>
              
              {telemetry && (
                <button
                  type="button"
                  onClick={handleLoadLiveTelemetry}
                  className="flex items-center gap-1.5 text-[8px] font-bold text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 py-1 rounded transition-all tracking-wider uppercase"
                >
                  <RefreshCw className="h-3 w-3" />
                  SYNC TELEMETRY
                </button>
              )}
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4 relative z-10">
              {/* Temperature Input */}
              <div className="space-y-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  Thermal Sensor (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={reportForm.temperature}
                  onChange={(e) => setReportForm(p => ({ ...p, temperature: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono-tech h-10"
                  required
                />
              </div>

              {/* Gas Level Input */}
              <div className="space-y-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  Combustible Gas (ppm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={reportForm.gas_level}
                  onChange={(e) => setReportForm(p => ({ ...p, gas_level: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono-tech h-10"
                  required
                />
              </div>

              {/* Composite Risk Input */}
              <div className="space-y-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  Blended Risk Index (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reportForm.final_risk}
                  onChange={(e) => setReportForm(p => ({ ...p, final_risk: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono-tech h-10"
                  required
                />
              </div>

              {/* PPE Status Selection */}
              <div className="space-y-2">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  PPE Compliance Lockout
                </label>
                <select
                  value={reportForm.ppe_compliance}
                  onChange={(e) => setReportForm(p => ({ ...p, ppe_compliance: parseInt(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-350 focus:outline-none focus:border-indigo-500 h-10 cursor-pointer uppercase"
                >
                  <option value={1}>SECURED (100% COMPLIANT)</option>
                  <option value={0}>BREACH (VIOLATION ON FIELD)</option>
                </select>
              </div>

              {reportError && (
                <div className="rounded border border-red-500/20 bg-red-500/5 p-4 text-[9px] font-bold uppercase flex gap-2 items-start leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{reportError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={generatingReport}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg py-3 shadow-lg shadow-indigo-600/10 transition-micro h-11"
              >
                <Sparkles className="h-4 w-4" />
                {generatingReport ? 'COMPILING INCIDENT RCA LOGS...' : 'Generate Safety SOP'}
              </button>
            </form>
          </div>

          {/* Right Column: Diagnostic & SOP Report Outputs */}
          <div className="lg:col-span-2 space-y-6">
            {!reportResult && !generatingReport ? (
              <div className="glass-card p-12 text-center text-slate-500 h-64 flex flex-col items-center justify-center gap-4 border border-slate-900">
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>
                <HelpCircle className="h-7 w-7 text-slate-750 relative z-10" />
                <p className="text-[10px] font-bold tracking-wider relative z-10">AWAITING SYSTEM PARAMETER HARNESS DIAGNOSTIC TRIGGER</p>
              </div>
            ) : generatingReport ? (
              <div className="glass-card p-12 text-center text-slate-500 h-64 flex flex-col items-center justify-center gap-4 border border-indigo-500/20 animate-pulse">
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>
                <div className="h-9 w-9 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin relative z-10"></div>
                <p className="text-slate-350 font-bold uppercase text-[10px] tracking-widest relative z-10">RUNNING GEMINI CO-PILOT DIAGNOSTIC INVESTIGATORS...</p>
              </div>
            ) : (
              /* REPORT OUTPUT DISPLAY */
              <div className="glass-card p-6 space-y-6 border border-slate-900 relative animate-fadeIn">
                <div className="tech-corner-tl"></div>
                <div className="tech-corner-tr"></div>
                <div className="tech-corner-bl"></div>
                <div className="tech-corner-br"></div>

                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-3 relative z-10 font-mono-tech">
                  <div>
                    <h3 className="text-xs font-bold text-slate-205 uppercase tracking-widest font-orbitron">Safety Incident Docket</h3>
                    <p className="text-[8px] text-slate-550 font-bold tracking-widest uppercase mt-0.5">TICKET ID: ISIP-AI-{Date.now().toString().slice(-6)}</p>
                  </div>
                  {priorityBadge && (
                    <span className={`text-[9px] font-bold px-3 py-1 rounded border uppercase tracking-wider ${priorityBadge.style}`}>
                      PRIORITY: {priorityBadge.label}
                    </span>
                  )}
                </div>

                {/* Summary Statement */}
                <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-lg space-y-1 relative z-10">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block font-mono-tech">Incident Summary Statement</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {reportResult.incident_summary}
                  </p>
                </div>

                {/* Root Cause Analysis (RCA) Callout */}
                <div className="bg-red-950/10 border border-red-500/20 p-4 rounded-lg space-y-2 relative z-10">
                  <span className="text-[8px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1 font-mono-tech">
                    <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                    Root Cause Diagnosis
                  </span>
                  <p className="text-xs text-slate-205 leading-relaxed font-black font-mono-tech">
                    {reportResult.root_cause_analysis}
                  </p>
                </div>

                {/* Action Lists */}
                <div className="grid gap-4 md:grid-cols-2 relative z-10">
                  {/* Immediate Mitigation actions */}
                  <div className="border border-slate-900 bg-slate-950/20 p-4 rounded-lg space-y-3 font-mono-tech">
                    <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest block border-b border-slate-900 pb-1">Immediate Containment</span>
                    <div className="space-y-2.5">
                      {reportResult.immediate_actions.map((act, i) => (
                        <div key={i} className="flex gap-2 items-start text-xs text-slate-300 leading-relaxed">
                          <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5 bg-indigo-950/30 border border-indigo-500/20 rounded p-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Long-term prevention actions */}
                  <div className="border border-slate-900 bg-slate-950/20 p-4 rounded-lg space-y-3 font-mono-tech">
                    <span className="text-[8px] text-emerald-450 font-bold uppercase tracking-widest block border-b border-slate-900 pb-1">Long-term Prevention Control</span>
                    <div className="space-y-2.5">
                      {reportResult.preventive_actions.map((act, i) => (
                        <div key={i} className="flex gap-2 items-start text-xs text-slate-300 leading-relaxed">
                          <span className="text-emerald-400 font-black mt-0.5 font-bold text-sm leading-none">•</span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommended SOP Updates */}
                <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-lg space-y-2 relative z-10 font-mono-tech">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block">Recommended SOP Matrix</span>
                  <pre className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap font-mono-tech font-semibold bg-[#03060a]/90 p-3.5 rounded border border-slate-950">
                    {reportResult.recommended_sop}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyAI;
