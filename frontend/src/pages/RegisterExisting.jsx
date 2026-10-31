import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  Eye, EyeOff, AlertCircle, 
  CheckCircle2, ArrowLeft, ShieldCheck 
} from 'lucide-react';

const AREA_POSITIONS = {
  Instructional: [
    'Teacher I', 'Teacher II', 'Teacher III', 'Teacher IV', 'Teacher V', 'Teacher VI', 'Teacher VII',
    'Master Teacher I', 'Master Teacher II', 'Master Teacher III', 'Master Teacher IV',
    'SPED Teacher I', 'SPED Teacher II', 'SPED Teacher III'
  ],
  Administrative: [
    'Principal I', 'Principal II', 'Principal III', 'Principal IV',
    'Head Teacher I', 'Head Teacher II', 'Head Teacher III', 'Head Teacher IV', 'Head Teacher V', 'Head Teacher VI',
    'Administrative Officer V', 'Administrative Officer IV', 'Administrative Officer II', 'Administrative Officer I',
    'Administrative Assistant III', 'Administrative Assistant II', 'Administrative Assistant I',
    'Administrative Aide VI', 'Administrative Aide IV',
    'Registrar II', 'Registrar I'
  ],
  Finance: [
    'Accountant III', 'Accountant II', 'Accountant I',
    'Administrative Officer V (Budget Officer)',
    'Administrative Assistant III (Senior Bookkeeper)',
    'Administrative Assistant II (Accounting / Cash)',
    'Administrative Assistant I',
    'Administrative Aide VI'
  ],
  'ICT Section': [
    'Information Technology Officer I',
    'Computer Programmer II',
    'Administrative Assistant III (Computer Operator)',
    'Administrative Assistant II',
    'Administrative Assistant I',
    'Administrative Officer I'
  ],
  'Division Office': [
    'Schools Division Superintendent',
    'Assistant Schools Division Superintendent',
    'Attorney III (Legal Officer)',
    'Public Schools District Supervisor (PSDS)',
    'Education Program Supervisor (EPS)',
    'Planning Officer III',
    'Administrative Officer V',
    'Administrative Officer IV',
    'Administrative Assistant III',
    'Administrative Assistant II',
    'Administrative Assistant I'
  ]
};

const DEPARTMENTS = Object.keys(AREA_POSITIONS);
const TEACHING_DEPTS = ['Instructional'];
const NON_TEACHING_DEPTS = ['Administrative', 'Finance', 'ICT Section', 'Division Office'];

const isTeachingPosition = (pos) => {
  if (!pos) return false;
  return pos.startsWith('Teacher') || pos.startsWith('Master Teacher') || pos.startsWith('SPED');
};

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
    role: '',
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      // Staff Category changed -> sync department & position
      if (name === 'role') {
        if (value === 'TEACHING') {
          if (!TEACHING_DEPTS.includes(next.department)) {
            next.department = 'Instructional';
            next.position = '';
          } else if (next.position && !isTeachingPosition(next.position)) {
            next.position = '';
          }
        } else if (value === 'NON_TEACHING') {
          if (TEACHING_DEPTS.includes(next.department)) {
            next.department = '';
            next.position = '';
          } else if (next.position && isTeachingPosition(next.position)) {
            next.position = '';
          }
        }
      }

      // Department changed -> sync staff category & reset position
      if (name === 'department') {
        next.position = '';
        if (value) {
          next.role = TEACHING_DEPTS.includes(value) ? 'TEACHING' : 'NON_TEACHING';
        }
      }
      
      // Position changed -> auto-set staff category accordingly
      if (name === 'position') {
        if (value) {
          next.role = isTeachingPosition(value) ? 'TEACHING' : 'NON_TEACHING';
        }
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

  const availableDepartments = formData.role === 'TEACHING'
    ? TEACHING_DEPTS
    : (formData.role === 'NON_TEACHING' ? NON_TEACHING_DEPTS : DEPARTMENTS);

  const departmentPositions = formData.department ? AREA_POSITIONS[formData.department] || [] : [];
  const filteredPositions = departmentPositions.filter(pos => {
    if (formData.role === 'TEACHING') return isTeachingPosition(pos);
    if (formData.role === 'NON_TEACHING') return !isTeachingPosition(pos);
    return true;
  });

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-100 text-slate-900">
        <header className="w-full bg-[#0038A8] border-b-2 border-[#FCD116] px-4 py-3 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <img src="/Deped2.png" alt="Republic of the Philippines Seal" className="w-8 h-8 object-contain" />
            <div className="w-px h-6 bg-blue-300/40"></div>
            <img src="/Deped logo.png" alt="Department of Education" className="h-7 object-contain" />
            <div className="text-white text-xs font-bold uppercase tracking-tight">
              DepEd Lucena City Division • Account Activation
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-300 rounded-lg shadow-sm p-8 text-center space-y-5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                Activation Request Submitted
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Your portal account request has been routed to the Division Personnel / HR Section for Plantilla verification.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded text-left text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">Next Steps:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>HR administrators will match your name against current Division Plantilla records.</li>
                <li>Once validated and approved, you can sign in using your registered username.</li>
              </ul>
            </div>
            <div className="pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[#0038A8] hover:bg-[#002d86] text-white text-xs font-semibold uppercase tracking-wider rounded border border-[#002d86]"
              >
                Return to Login Terminal
              </Link>
            </div>
          </div>
        </main>

        <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
          <p>© 2026 DepEd Lucena City Division • Human Resource Information System</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 text-slate-900">
      {/* DepEd Institutional Top Header Bar */}
      <header className="w-full bg-[#0038A8] border-b-2 border-[#FCD116] px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Deped2.png" alt="Republic of the Philippines Seal" className="w-9 h-9 object-contain" />
            <div className="w-px h-7 bg-blue-300/40"></div>
            <img src="/Deped logo.png" alt="Department of Education" className="h-8 object-contain" />
            <div className="text-white">
              <p className="text-xs font-bold uppercase tracking-wide leading-none">Republic of the Philippines</p>
              <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-tight mt-0.5">Department of Education • Division of Lucena City</p>
            </div>
          </div>
          <Link to="/login" className="text-xs text-blue-100 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
          {/* Header Title */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-900">
              Personnel Portal Account Activation
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Form for regular division personnel activating their online HRIS credentials
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {errorMsg && (
              <div role="alert" className="mb-6 bg-red-50 border border-red-300 p-3.5 rounded flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Official Plantilla Identity */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                  <span className="w-5 h-5 rounded-full bg-[#0038A8] text-white text-[10px] font-bold flex items-center justify-center font-mono">1</span>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    Official Plantilla Identity & Assignment
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      type="text"
                      placeholder="e.g. Maria"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      type="text"
                      placeholder="e.g. Santos"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                    Staff Classification <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                    required
                  >
                    <option value="">-- Select Staff Classification --</option>
                    <option value="TEACHING">Teaching Personnel</option>
                    <option value="NON_TEACHING">Non-Teaching Personnel</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Department / Area <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {availableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Plantilla Position <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8] disabled:bg-slate-50 disabled:text-slate-400"
                      disabled={!formData.department}
                      required
                    >
                      <option value="">
                        {!formData.department ? '-- Select Department First --' : '-- Select Plantilla Position --'}
                      </option>
                      {filteredPositions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Portal Credentials */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                  <span className="w-5 h-5 rounded-full bg-[#0038A8] text-white text-[10px] font-bold flex items-center justify-center font-mono">2</span>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    Portal Security & Login Credentials
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Preferred Username <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      type="text"
                      placeholder="e.g. maria.santos"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Official / DepEd Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="employee@deped.gov.ph"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Account Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                      Confirm Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0038A8] focus:ring-1 focus:ring-[#0038A8]"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-[#0038A8] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#0038A8] hover:bg-[#002d86] text-white text-xs font-semibold uppercase tracking-wider rounded border border-[#002d86] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isLoading ? 'Submitting Registration...' : 'Submit Activation Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <p>Department of Education — Schools Division of Lucena City • Human Resource Information System</p>
      </footer>
    </div>
  );
};

export default RegisterExisting;
