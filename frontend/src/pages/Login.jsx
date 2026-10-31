import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

/**
 * Official DepEd Division HRIS Portal Sign-In Terminal
 * Standard: DESIGN.md (ENERGY 1 / RHYTHM 1 / MOTION 1, DepEd Blue #0038A8, Slate Neutrals)
 */
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Please verify your employee username and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 text-slate-900">
      {/* DepEd Institutional Top Header Bar */}
      <header className="w-full bg-[#0038A8] border-b-2 border-[#FCD116] px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Deped2.png" alt="Republic of the Philippines Seal" className="w-9 h-9 object-contain" />
            <div className="w-px h-7 bg-blue-300/40"></div>
            <img src="/Deped logo.png" alt="Department of Education" className="h-8 object-contain" />
            <div className="hidden sm:block ml-2 text-white">
              <p className="text-xs font-bold uppercase tracking-wide leading-none">Republic of the Philippines</p>
              <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-tight mt-0.5">Department of Education • Division of Lucena City</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-900/60 border border-blue-400/30 rounded text-[11px] font-mono text-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              PORTAL SECURE
            </span>
          </div>
        </div>
      </header>

      {/* Main Terminal Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
          {/* Card Header Strip */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900">
              HRIS Administrative Portal
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Authorized personnel authentication terminal
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Error Banner */}
            {error && (
              <div role="alert" className="bg-red-50 border border-red-300 p-3.5 rounded flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Account Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="e.g. employee.username"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500">Contact HR if forgotten</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#0038A8] hover:bg-[#002d86] text-white font-semibold text-xs uppercase tracking-wider py-2.5 px-4 rounded border border-[#002d86] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                {isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}
              </button>
            </form>

            {/* Quick Links */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>Existing regular employee?</span>
                <Link to="/register-existing" className="font-semibold text-[#0038A8] hover:underline">
                  Activate Account
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span>Job applicant / candidate?</span>
                <Link to="/apply" className="font-semibold text-[#0038A8] hover:underline">
                  Submit Application
                </Link>
              </div>
            </div>

            {/* Legal Advisory Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 leading-relaxed">
              <strong className="font-semibold text-slate-800">Notice:</strong> This is an official Republic of the Philippines information system. Unauthorized access or misuse is punishable under Republic Act No. 10173 (Data Privacy Act of 2012) and Republic Act No. 10175 (Cybercrime Prevention Act of 2012).
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <p>Department of Education — Schools Division of Lucena City • Human Resource Information System</p>
      </footer>
    </div>
  );
};

export default Login;
