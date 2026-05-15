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
    <div className="min-h-screen flex items-center justify-center bg-base-200 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl"></div>

      <div className="card w-full max-w-md bg-white shadow-xl border border-base-300 rounded-xl overflow-hidden z-10 mx-4">
        <div className="card-body p-10">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-center text-base-content uppercase">
              DEPED LUCENA HRIS
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1 h-1 bg-success rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">
                Secure Access Gateway
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 border border-error/20 p-4 rounded-lg flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-error" />
              <span className="text-xs font-bold text-error leading-tight">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-primary transition-all">
                  <User className="w-4 h-4" />
                </div>
                <input
                  name="username"
                  type="text"
                  placeholder="Official username"
                  className="input input-md w-full pl-11 bg-base-100 border-base-300 focus:border-primary transition-all rounded-lg text-sm font-medium"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Password</label>
                <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-tighter hover:underline">Forgot Access?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-primary transition-all">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Account password"
                  className="input input-md w-full pl-11 pr-11 bg-base-100 border-base-300 focus:border-primary transition-all rounded-lg text-sm font-medium"
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
              className={`btn btn-primary btn-md w-full shadow-md shadow-primary/20 rounded-lg text-xs font-black uppercase tracking-widest mt-4 ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {!isLoading && <LogIn className="w-4 h-4 mr-2" />}
              {isLoading ? 'Verifying Identity...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* System Info Footer */}
          <div className="mt-10 pt-8 border-t border-base-200 text-center space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-base-100 border border-base-300 rounded-full">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Preview Build 2.0.4</span>
             </div>
             <p className="text-[10px] font-medium opacity-30 leading-relaxed max-w-[200px] mx-auto uppercase">
                Authorized Personnel Only. All access attempts are logged for security audit.
             </p>
          </div>
        </div>
      </div>
      
      {/* Absolute Bottom Footer */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.3em]">
          © 2026 DepEd Lucena City Division
        </p>
      </div>
    </div>
  );
};

export default Login;
