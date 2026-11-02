import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell grid min-h-screen lg:grid-cols-2">
      <section className="auth-story hidden min-h-screen flex-col justify-between p-12 lg:flex xl:p-16">
        <div className="relative z-10 flex items-center gap-3">
          <div className="auth-mark flex h-11 w-11 items-center justify-center rounded-2xl text-white">
            <Package className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-50">StockFlow</span>
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            Inventory, in order
          </span>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="mb-4 font-script text-3xl text-amber-200">A little more room to think.</p>
          <h1 className="max-w-lg text-5xl font-medium leading-[1.08] tracking-tight text-slate-50 xl:text-6xl">
            Inventory, beautifully organized.
          </h1>
          <p className="auth-story-copy mt-6 max-w-md text-base leading-7">
            A simpler way to manage your products, stock, and business — all in one calm, clear workspace.
          </p>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-3">
            {['Product catalog', 'Stock levels', 'Low-stock alerts'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                <span className="mb-3 block h-1 w-7 rounded-full bg-amber-200/80" />
                <span className="text-xs font-medium text-slate-200">{item}</span>
                <span className="mt-2 block text-[10px] text-slate-400">A clearer view of your business</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>Thoughtful tools for everyday business.</span>
          <span>StockFlow · 2026</span>
        </div>
        <div className="auth-orbit" aria-hidden="true">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04]">
            <Package className="h-8 w-8 stroke-[1.2]" />
          </div>
        </div>
      </section>

      <section className="auth-panel flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="auth-mark flex h-10 w-10 items-center justify-center rounded-xl text-white">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">StockFlow</span>
          </div>

          <div className="auth-card rounded-[1.35rem] p-6 sm:p-9">
            <div className="mb-7">
              <p className="mb-2 font-script text-2xl text-indigo-600">Good to have you back</p>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to manage your inventory.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/10 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Explore a demo workspace</span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('demo@stockflow.io', 'Password123!')}
                  className="auth-demo-button w-full rounded-xl border p-3 text-left transition"
                >
                  <span className="block text-xs font-semibold text-slate-900">Apex Retail Logistics</span>
                  <span className="mt-1 block text-[11px] text-slate-500">demo@stockflow.io · Tenant A</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('owner@stellargoods.com', 'Password123!')}
                  className="auth-demo-button w-full rounded-xl border p-3 text-left transition"
                >
                  <span className="block text-xs font-semibold text-slate-900">Stellar Goods & Apparel</span>
                  <span className="mt-1 block text-[11px] text-slate-500">owner@stellargoods.com · Tenant B</span>
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              New to StockFlow?{' '}
              <Link to="/signup" className="font-semibold text-indigo-700 hover:text-indigo-600">
                Create an account
              </Link>
            </p>
          </div>
          <p className="mt-5 text-center text-[11px] text-slate-400">A more considered way to keep stock in view.</p>
        </div>
      </section>
    </div>
  );
};

export default Login;
