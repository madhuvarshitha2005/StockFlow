import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, ArrowRight, AlertCircle, Building2 } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.organizationName.trim()) {
      setError('Organization name is required.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: formData.name.trim() || undefined,
        organizationName: formData.organizationName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Failed to create account.';
      setError(msg);
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
          <p className="mb-4 font-script text-3xl text-amber-200">Make space for what matters.</p>
          <h1 className="max-w-lg text-5xl font-medium leading-[1.08] tracking-tight text-slate-50 xl:text-6xl">
            Start organizing smarter.
          </h1>
          <p className="auth-story-copy mt-6 max-w-md text-base leading-7">
            Bring your products, stock levels, and everyday decisions into one beautifully clear workspace.
          </p>
          <div className="mt-12 flex max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Your own workspace</p>
              <p className="mt-1 text-xs text-slate-400">Your organization, your inventory.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">Thoughtful tools for everyday business.</div>
        <div className="auth-orbit" aria-hidden="true">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04]">
            <Package className="h-8 w-8 stroke-[1.2]" />
          </div>
        </div>
      </section>

      <section className="auth-panel flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="auth-mark flex h-10 w-10 items-center justify-center rounded-xl text-white">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">StockFlow</span>
          </div>

          <div className="auth-card rounded-[1.35rem] p-6 sm:p-9">
            <div className="mb-6">
              <p className="mb-2 font-script text-2xl text-indigo-600">A better rhythm for your business</p>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Create your account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Set up your store and start organizing stock.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
                  Organization / store name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="organizationName"
                    required
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="e.g. BlueStar Supply Co"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm transition"
                  />
                  <Building2 className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
                  Your full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Morgan"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
                  Work email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@bluestarsupply.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
                    Confirm password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/10 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Organization...' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-600">
                Sign in
              </Link>
            </p>
          </div>
          <p className="mt-5 text-center text-[11px] text-slate-400">Your first step toward calmer inventory.</p>
        </div>
      </section>
    </div>
  );
};

export default Signup;
