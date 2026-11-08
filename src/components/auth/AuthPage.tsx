import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Briefcase,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Building2,
  GraduationCap,
  MapPin,
  Lock,
  Mail,
  User,
  Phone,
  Layers,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, registerCandidate, registerHr, rememberedAccount, clearRememberedAccount } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('candidate');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Login form state (prefilled from remembered account if present)
  const [loginEmail, setLoginEmail] = useState(rememberedAccount?.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginCompanyId, setLoginCompanyId] = useState(rememberedAccount?.company_id || '');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Candidate register state
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candPassword, setCandPassword] = useState('');
  const [candConfirmPassword, setCandConfirmPassword] = useState('');
  const [candEducation, setCandEducation] = useState('');
  const [candSkills, setCandSkills] = useState('');
  const [candExperience, setCandExperience] = useState('');
  const [candLocation, setCandLocation] = useState('');

  // HR register state
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  const [hrPassword, setHrPassword] = useState('');
  const [hrConfirmPassword, setHrConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [hrCompanyId, setHrCompanyId] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail, loginPassword, loginCompanyId, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!candName || !candEmail || !candPassword) {
      setError('Name, email, and password are required.');
      return;
    }
    if (candPassword !== candConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (candPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerCandidate({
        name: candName,
        email: candEmail,
        phone: candPhone,
        password: candPassword,
        confirmPassword: candConfirmPassword,
        education: candEducation,
        skills: candSkills,
        experience: candExperience,
        location: candLocation,
      }, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterHrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hrName || !hrEmail || !hrPassword || !companyName) {
      setError('HR Name, email, password, and Company Name are required.');
      return;
    }
    if (hrPassword !== hrConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (hrPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerHr({
        name: hrName,
        email: hrEmail,
        phone: hrPhone,
        password: hrPassword,
        confirmPassword: hrConfirmPassword,
        companyName,
        companyDescription: companyDesc,
        companyLocation,
        company_id: hrCompanyId.trim() || undefined,
      }, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative z-10">
      {/* LEFT SIDE: Recruitment Visual & Brand Experience */}
      <div className="lg:w-[48%] relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 lg:p-14 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Subtle geometric circles */}
        <div className="absolute top-12 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">Hire Screen</span>
              <span className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Recruitment Management System</span>
            </div>
          </div>
        </div>

        {/* Center Tagline & Feature Highlights */}
        <div className="my-10 lg:my-0 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Intelligent Hiring & Transparent Talent Matching
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
            Smart recruitment. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-violet-400">
              Faster screening. Better hiring.
            </span>
          </h1>

          <p className="mt-5 text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
            A unified end-to-end recruitment platform empowering candidates to land high-impact careers and HR leaders to source, track, and interview top talent with zero friction.
          </p>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-indigo-300 font-semibold text-sm mb-1">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span>Resume Engine</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Seamless resume uploads and automatic portfolio attachment to verified jobs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-cyan-300 font-semibold text-sm mb-1">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Transparent Matching</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Clear scoring across skills, experience, education, and location.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-violet-300 font-semibold text-sm mb-1">
                <Users className="w-4 h-4 text-violet-400" />
                <span>Dual Roles & RBAC</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Protected dashboards for Candidates and HR Recruiters with strict access controls.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-emerald-300 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Pipeline</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Instant notifications, application timelines, and integrated interview scheduling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Card */}
      <div className="lg:w-[52%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-xl">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {mode === 'login'
                  ? 'Access your applicant portal or recruiter dashboard'
                  : 'Join the network as a job seeker or corporate recruiter'}
              </p>
            </div>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Role selector for registration or quick role filter */}
          {mode === 'register' && (
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                I want to register as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('candidate')}
                  className={`p-3.5 rounded-xl border flex flex-col text-left transition-all ${
                    selectedRole === 'candidate'
                      ? 'bg-indigo-950/50 border-indigo-500/60 ring-2 ring-indigo-500/20 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className={`w-4 h-4 ${selectedRole === 'candidate' ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="font-semibold text-sm">Job Seeker / Candidate</span>
                  </div>
                  <span className="text-xs text-slate-400">Search jobs, upload resume, track applications</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('hr')}
                  className={`p-3.5 rounded-xl border flex flex-col text-left transition-all ${
                    selectedRole === 'hr'
                      ? 'bg-violet-950/50 border-violet-500/60 ring-2 ring-violet-500/20 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`w-4 h-4 ${selectedRole === 'hr' ? 'text-violet-400' : 'text-slate-500'}`} />
                    <span className="font-semibold text-sm">HR / Recruiter</span>
                  </div>
                  <span className="text-xs text-slate-400">Post jobs, review resumes, schedule interviews</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Remembered Account Quick Access */}
          {mode === 'login' && rememberedAccount && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider block">
                  Saved Account (Last signed in)
                </span>
                <span className="text-xs text-white font-medium truncate block">
                  {rememberedAccount.name ? `${rememberedAccount.name} · ` : ''}{rememberedAccount.email}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(rememberedAccount.email);
                    if (rememberedAccount.company_id) {
                      setLoginCompanyId(rememberedAccount.company_id);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Use
                </button>
                <button
                  type="button"
                  onClick={clearRememberedAccount}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Optional Company ID for HR recruiters */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Company ID <span className="text-slate-500 font-normal lowercase">(optional for HR)</span>
                  </label>
                  <span className="text-[10px] text-violet-400 font-medium">Auto-detected if left empty</span>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={loginCompanyId}
                    onChange={(e) => setLoginCompanyId(e.target.value)}
                    placeholder="e.g. your registered Company ID (or leave blank to auto-detect)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-800/80 text-center">
                <span className="text-xs text-slate-400">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 cursor-pointer"
                  >
                    Register here
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* CANDIDATE REGISTRATION FORM */}
          {mode === 'register' && selectedRole === 'candidate' && (
            <form onSubmit={handleRegisterCandidateSubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={candEmail}
                      onChange={(e) => setCandEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={candPhone}
                      onChange={(e) => setCandPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={candLocation}
                      onChange={(e) => setCandLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password (min 6 chars) *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={candPassword}
                      onChange={(e) => setCandPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={candConfirmPassword}
                      onChange={(e) => setCandConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Education</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={candEducation}
                    onChange={(e) => setCandEducation(e.target.value)}
                    placeholder="e.g. B.S. in Computer Science"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={candSkills}
                  onChange={(e) => setCandSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js, Python, SQL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Experience</label>
                <input
                  type="text"
                  value={candExperience}
                  onChange={(e) => setCandExperience(e.target.value)}
                  placeholder="e.g. 3 years as Full-Stack Engineer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? <span>Creating Candidate Account...</span> : <span>Complete Registration</span>}
              </button>
            </form>
          )}

          {/* HR REGISTRATION FORM */}
          {mode === 'register' && selectedRole === 'hr' && (
            <form onSubmit={handleRegisterHrSubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">HR Recruiter Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={hrName}
                      onChange={(e) => setHrName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      placeholder="sarah@company.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Name *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Tech Labs"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                      placeholder="e.g. New York, NY"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Company ID Input for HR Registration */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Company ID <span className="text-violet-400 font-normal">(Corporate Unique ID)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">e.g. comp_acmecorp</span>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={hrCompanyId}
                    onChange={(e) => setHrCompanyId(e.target.value)}
                    placeholder="e.g. comp_acmecorp (or leave blank to auto-create)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter your organization's unique Company ID. This provides your company with a separate dashboard where other HRs cannot see your jobs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={hrPhone}
                    onChange={(e) => setHrPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password (min 6 chars) *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={hrPassword}
                      onChange={(e) => setHrPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={hrConfirmPassword}
                      onChange={(e) => setHrConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company Description</label>
                <textarea
                  rows={2}
                  value={companyDesc}
                  onChange={(e) => setCompanyDesc(e.target.value)}
                  placeholder="Describe your company, mission, and products..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? <span>Creating HR Account...</span> : <span>Register Company & HR</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
