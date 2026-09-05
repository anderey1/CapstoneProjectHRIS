import React, { useState } from 'react';
import api from '../api/axios';
import { 
  User, Lock, Mail, Briefcase, FolderOpen, Eye, EyeOff, AlertCircle, 
  CheckCircle2, ArrowLeft, ChevronRight, ShieldCheck 
} from 'lucide-react';

const AREA_POSITIONS = {
  Instructional: [
    'Teacher I', 'Teacher II', 'Teacher III', 'Teacher IV', 'Teacher V', 'Teacher VI',
    'Master Teacher I', 'Master Teacher II', 'Master Teacher III', 'Master Teacher IV'
  ],
  Administrative: [
    'Head Teacher I', 'Head Teacher III',
    'Principal I', 'Principal II', 'Principal III', 'Principal IV',
    'Administrative Officer I', 'Administrative Officer II',
    'Administrative Assistant I', 'Administrative Assistant II'
  ],
  Finance: [
    'Accountant I',
    'Administrative Officer I', 'Administrative Officer II',
    'Administrative Assistant I', 'Administrative Assistant II'
  ],
  'ICT Section': [
    'Administrative Assistant I', 'Administrative Assistant II',
    'Administrative Officer I', 'Administrative Officer II'
  ],
  'Division Office': [
    'Schools Division Superintendent',
    'Administrative Officer I', 'Administrative Officer II',
    'Administrative Assistant I', 'Administrative Assistant II',
    'Registrar I', 'Accountant I'
  ]
};

const DEPARTMENTS = Object.keys(AREA_POSITIONS);

const RegisterExisting = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    department: '',
    position: '',
    role: 'TEACHING',
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      // Reset position when department changes
      if (name === 'department') {
        next.position = '';
      }
      
      // Auto-set staff category when position changes
      if (name === 'position') {
        const isTeaching = value.startsWith('Teacher') || value.startsWith('Master Teacher') || value.startsWith('SPED');
        next.role = isTeaching ? 'TEACHING' : 'NON_TEACHING';
      }
      
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic password validation
    if (formData.password !== formData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('employees/register-existing/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        department: formData.department,
        position: formData.position,
        role: formData.role,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data && data.error) {
        setErrorMsg(data.error);
      } else if (data && typeof data === 'object') {
        const errorDetails = Object.entries(data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        setErrorMsg(errorDetails || 'Registration failed. Please check your inputs.');
      } else {
        setErrorMsg('We encountered an issue processing your registration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPositions = formData.department ? AREA_POSITIONS[formData.department] || [] : [];

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden p-6">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#0038A8]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FCD116]/5 rounded-full blur-3xl"></div>
        
        <div className="card w-full max-w-lg bg-white shadow-2xl border border-base-300 rounded-2xl overflow-hidden z-10 text-center p-8 sm:p-12 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-success/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-[#0038A8] uppercase tracking-tight mb-2">Registration Request Received!</h1>
          <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-6">DepEd Lucena City Division</p>
          
          <div className="bg-success/5 border border-success/15 rounded-xl p-4 text-xs font-medium text-success/80 mb-8 leading-relaxed max-w-sm mx-auto">
            Your user account registration request has been successfully submitted to HR for validation. You will be able to log in once they approve your account.
          </div>

          <a 
            href="/login" 
            className="btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none shadow-lg shadow-blue-900/20 rounded-xl text-xs font-black uppercase tracking-widest px-8 h-12"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] relative overflow-hidden py-12 px-6">
      
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#0038A8]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FCD116]/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-xl bg-white shadow-2xl border border-base-300 rounded-2xl overflow-hidden z-10 my-6 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Header Block */}
        <div className="p-8 border-b border-base-100 bg-base-50/30 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 mb-4">
            <img src="/Deped2.png" alt="DepEd Seal" className="w-12 h-12 drop-shadow-sm" />
            <div className="w-px h-8 bg-base-300"></div>
            <img src="/Deped logo.png" alt="DepEd Logo" className="h-8" />
          </div>
          
          <h1 className="text-xl font-black text-[#0038A8] uppercase tracking-tight">Register Employee Account</h1>
          <p className="text-[9px] font-black text-base-content/40 uppercase tracking-[0.2em] mt-1.5">
             For Existing Personnel without Portal Credentials
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 sm:p-10">
          
          {errorMsg && (
            <div className="alert alert-error bg-error/10 border-error/20 text-error rounded-xl p-4 flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1">Registration Error</p>
                 <p className="text-xs font-bold opacity-80 whitespace-pre-wrap">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Verification Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-wider border-b border-base-100 pb-1.5">
                1. Verify Identity
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">First Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      type="text"
                      placeholder="First Name"
                      className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Last Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      type="text"
                      placeholder="Last Name"
                      className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Area (Department)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="select select-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      required
                    >
                      <option value="">Select Area (Department)</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Role (Position)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="select select-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      disabled={!formData.department}
                      required
                    >
                      <option value="">
                        {!formData.department ? "Select Area First" : "Select Role (Position)"}
                      </option>
                      {filteredPositions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Staff Category (Teaching / Non-Teaching)</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="select select-bordered w-full bg-base-50 border-base-200 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                  required
                >
                  <option value="TEACHING">Teaching Staff</option>
                  <option value="NON_TEACHING">Non-Teaching Staff</option>
                </select>
              </div>
            </div>

            {/* Section 2: User Account Credentials */}
            <div className="space-y-4 pt-4 border-t border-base-200">
              <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-wider border-b border-base-100 pb-1.5">
                2. Set Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Preferred Username</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      type="text"
                      placeholder="username"
                      className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="employee@deped.gov.ph"
                      className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input input-bordered w-full pl-11 pr-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-30 hover:opacity-100 transition-opacity"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input input-bordered w-full pl-11 pr-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-30 hover:opacity-100 transition-opacity"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-5 border-t border-base-100 flex flex-col sm:flex-row items-center justify-between gap-4">
               <a 
                  href="/login" 
                  className="text-xs font-bold text-base-content/40 hover:text-[#0038A8] transition-colors flex items-center gap-1.5 order-2 sm:order-1"
               >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
               </a>
               <button
                  type="submit"
                  disabled={isLoading}
                  className={`btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none shadow-lg shadow-blue-900/20 rounded-xl text-xs font-black uppercase tracking-widest px-8 h-12 w-full sm:w-auto order-1 sm:order-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                  {isLoading ? "Processing Registration..." : (
                     <>
                        Register Account
                        <ChevronRight className="w-4 h-4 ml-1" />
                     </>
                  )}
               </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Bottom Legal Notice */}
      <div className="text-center mt-4 opacity-40">
        <p className="text-[9px] font-black uppercase tracking-widest">
           © 2026 DepEd Lucena City Division • Secure Employee Registration
        </p>
      </div>
    </div>
  );
};

export default RegisterExisting;
