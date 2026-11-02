import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, organization, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-700">
          Welcome back, <span className="text-slate-900 font-bold">{user?.name || user?.email?.split('@')[0]}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
            {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4 text-slate-500" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Store Admin'}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{user?.email}</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 transition"
            title="Sign out of StockFlow"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
