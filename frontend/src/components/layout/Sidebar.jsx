import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Zap,
  Layers,
  BarChart3,
  Building2,
  Sliders,
  TrendingUp,
  Lightbulb,
  Cpu,
  FileText,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Carbon Data Collection',
      items: [
        { name: 'Data Hub', path: '/data', icon: Layers },
        { name: 'Electricity Data', path: '/data/electricity', icon: Zap },
      ],
    },
    {
      label: 'Campus Governance',
      items: [
        { name: 'Departments', path: '/departments', icon: Building2 },
        { name: 'Emission Factors', path: '/emission-factors', icon: Sliders },
      ],
    },
    {
      label: 'AI & Intelligence',
      items: [
        { name: 'ML Predictions', path: '/predictions', icon: TrendingUp, badge: 'ML' },
        { name: 'AI Recommendations', path: '/recommendations', icon: Lightbulb, badge: 'AI' },
        { name: 'What-If Simulation', path: '/simulation', icon: Cpu },
        { name: 'ESG Reports', path: '/reports', icon: FileText },
      ],
    },
    {
      label: 'System',
      items: [
        { name: 'Settings & Health', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 p-0.5 shadow-lg shadow-brand-900/40 group-hover:shadow-brand-500/30 transition-shadow">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-400" />
              </div>
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-slate-100 flex items-center gap-1.5">
                Carbon<span className="text-brand-400">IQ</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-wider font-mono uppercase">
                Smart Campus
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                <span className="text-[10px] text-brand-400 font-medium font-mono uppercase">
                  {user?.role || 'VIEWER'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.label}
              </h4>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
