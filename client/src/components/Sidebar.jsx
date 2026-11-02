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
    <aside className="app-sidebar w-64 border-r flex flex-col shrink-0 min-h-screen">
      {/* Brand header */}
      <div className="sidebar-brand h-16 flex items-center px-6 border-b gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-50">
            StockFlow
          </span>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
            MVP
          </span>
        </div>
      </div>

      {/* Organization Info Box */}
      <div className="sidebar-org p-4 border-b">
        <div className="sidebar-org-card rounded-xl p-3 border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 text-slate-200 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Organization</p>
            <p className="text-xs font-bold text-slate-50 truncate" title={organization?.name}>
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
                    ? 'bg-indigo-100 text-indigo-900 shadow-sm'
                    : 'text-slate-300 hover:text-slate-50 hover:bg-white/10'
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
      <div className="sidebar-tenant p-4 border-t border-white/10">
        <div className="sidebar-tenant-card rounded-xl p-3 text-xs text-slate-100 border">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold">Tenant Scoped</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="sidebar-tenant-copy text-[11px] leading-relaxed">
            All data strictly isolated to {organization?.name || 'your store'}.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
