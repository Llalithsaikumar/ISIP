import React from 'react';
import { Shield, LayoutDashboard, Brain, HelpCircle, ShieldAlert, BarChart3, Grid, Play } from 'lucide-react';

const Header = ({ currentPage, setCurrentPage, activeAlertsCount = 0 }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'heatmap', label: 'Safety Heatmap', icon: Grid },
    { id: 'alerts', label: 'Alerts', icon: ShieldAlert, badge: activeAlertsCount },
    { id: 'analytics', label: 'Risk Analytics', icon: BarChart3 },
    { id: 'prediction', label: 'Risk Predictor', icon: Brain },
    { id: 'safety-ai', label: 'AI Safety Advisor', icon: HelpCircle },
    { id: 'demo', label: 'Demo Mode', icon: Play },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-[#060a12]/80 backdrop-blur-md shrink-0">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Branding */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <Shield className="h-4.5 w-4.5 text-white z-10" />
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-widest text-white font-orbitron">ISIP</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-led"></span>
            </div>
            <span className="block text-[8px] font-bold text-indigo-400/90 font-mono-tech tracking-widest uppercase">
              CONTROL MODULE
            </span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex items-center gap-1 sm:gap-2 h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-micro h-10 uppercase tracking-wider ${
                  isActive
                    ? 'text-white bg-indigo-600/10 border border-indigo-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="hidden lg:inline">{item.label}</span>
                
                {/* Active Indicator Underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] rounded-full"></span>
                )}
                
                {/* Dynamic alert count badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white ring-2 ring-[#03060a] animate-pulse glow-red">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
