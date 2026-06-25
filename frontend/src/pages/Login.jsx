import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

/**
 * Cleaned and Professional Login Page
 * 
 * Optimized for clarity, simplicity, and professional enterprise branding.
 */
const Login = () => {
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
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError('Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#0038A8]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FCD116]/5 rounded-full blur-3xl"></div>

      <div className="card w-full max-w-md bg-white shadow-2xl border border-base-300 rounded-2xl overflow-hidden z-10 mx-4">
        <div className="card-body p-8 sm:p-10">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img src="/Deped2.png" alt="DepEd Seal" className="w-16 h-16 drop-shadow-md" />
              <div className="w-px h-12 bg-base-300"></div>
              <img src="/Deped logo.png" alt="DepEd Logo" className="h-12" />
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-[#0038A8] uppercase">
                HRIS PORTAL
              </h1>
              <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-[0.3em] mt-1">
                DepEd Lucena City Division
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-error" />
              <span className="text-xs font-bold text-error leading-tight">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Account Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                  <User className="w-4 h-4" />
                </div>
                <input
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]/20 transition-all rounded-xl text-sm font-medium"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Password</label>
                <button type="button" className="text-[10px] font-bold text-[#0038A8] uppercase tracking-tighter hover:underline">Forgot Password?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-11 pr-11 bg-base-50 focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]/20 transition-all rounded-xl text-sm font-medium"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-30 hover:opacity-100 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn w-full bg-[#0038A8] hover:bg-[#002d86] text-white border-none shadow-lg shadow-blue-900/20 rounded-xl text-xs font-black uppercase tracking-widest mt-4 h-12 ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {!isLoading && <ShieldCheck className="w-4 h-4 mr-2" />}
              {isLoading ? 'Authenticating...' : 'Secure Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
             <span className="text-[10px] font-bold opacity-40 uppercase">Want to join our team? </span>
             <a href="/apply" className="text-[10px] font-black text-[#0038A8] uppercase hover:underline">Apply for a Position Here</a>
          </div>

          {/* System Info Footer */}
          <div className="mt-8 pt-6 border-t border-base-200 text-center">
             <p className="text-[10px] font-medium opacity-30 leading-relaxed uppercase">
                Authorized Access Only. System activity is monitored.
             </p>
          </div>
        </div>
      </div>
      
      {/* Absolute Bottom Footer */}
      <div className="absolute bottom-6 left-0 w-full text-center">
        <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.3em]">
          © 2026 DepEd Lucena City Division
        </p>
      </div>
    </div>
  );
};

export default Login;
