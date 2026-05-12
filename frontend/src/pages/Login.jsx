import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Login Page Component
 * 
 * Redesigned with a modern, professional look for DepEd Lucena City Division.
 * Features:
 * - Responsive, centered card layout
 * - Icon-integrated input fields
 * - Show/Hide password toggle
 * - Loading state feedback
 * - Branded typography and colors
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
      // Redirect handled by AuthContext or manual redirect
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-300 to-secondary/10 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-primary to-secondary w-full" />
        
        <div className="card-body p-8">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-center text-base-content">
              DepEd Lucena HRIS
            </h1>
            <p className="text-sm text-base-content/60 text-center mt-1">
              Human Resource Information System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error shadow-sm mb-6 py-3 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold opacity-70">Username</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
                  <User className="w-5 h-5" />
                </span>
                <input
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  className="input input-bordered w-full pl-10 focus:input-primary transition-all bg-base-200/50"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold opacity-70">Password</span>
                <span className="label-text-alt link link-hover text-primary font-medium">Forgot?</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="input input-bordered w-full pl-10 pr-10 focus:input-primary transition-all bg-base-200/50"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="form-control">
                <label className="label cursor-pointer gap-2 p-0">
                  <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" />
                  <span className="label-text text-xs opacity-60">Remember device</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-control mt-4">
              <button 
                type="submit" 
                className={`btn btn-primary w-full shadow-lg ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {!isLoading && <LogIn className="w-4 h-4 mr-2" />}
                {isLoading ? 'Verifying...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-base-300 text-center">
            <div className="badge badge-outline badge-sm opacity-50 mb-3 uppercase tracking-widest font-bold">
              Development Preview
            </div>
            <p className="text-xs text-base-content/40 leading-relaxed">
              Use <span className="font-bold text-base-content/60">admin / admin123</span><br />
              to explore the system functionality.
            </p>
          </div>
        </div>
      </div>
      
      {/* Branding Footer (Optional) */}
      <div className="fixed bottom-6 text-xs font-medium opacity-30 text-center uppercase tracking-widest">
        © 2026 DepEd Lucena City Division
      </div>
    </div>
  );
};

export default Login;
