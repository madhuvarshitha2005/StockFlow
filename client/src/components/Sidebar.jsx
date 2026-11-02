import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Boxes, Settings, Building2, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { organization } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products & Stock', path: '/products', icon: Boxes },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-indigo-900 to-indigo-600 bg-clip-text text-transparent">
            StockFlow
          </span>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            MVP
          </span>
        </div>
      </div>

      {/* Organization Info Box */}
      <div className="p-4 border-b border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Organization</p>
            <p className="text-xs font-bold text-slate-800 truncate" title={organization?.name}>
              {organization?.name || 'My Organization'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-3 text-xs text-indigo-900 border border-indigo-100">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold">Tenant Scoped</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-indigo-600 text-[11px] leading-relaxed">
            All data strictly isolated to {organization?.name || 'your store'}.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
