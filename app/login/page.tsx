'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserRole } from '@/types';
import { saveSession, getRoleDashboard } from '@/lib/auth';
import { ShieldCheck, Users, Stethoscope, Eye, EyeOff, HeartPulse, Activity, Cross } from 'lucide-react';

type RoleOption = {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  badge: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'superadmin',
    label: 'Super Admin',
    description: 'Full system access, manage doctors & departments',
    icon: <ShieldCheck size={22} />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    badge: 'bg-emerald-700 text-white',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Manage patient entries and view reports',
    icon: <Users size={22} />,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    badge: 'bg-teal-600 text-white',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    description: 'View your own patient reports and analytics',
    icon: <Stethoscope size={22} />,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-300',
    badge: 'bg-green-600 text-white',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Login failed'); return; }
      saveSession(data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      router.push(getRoleDashboard(data.user.role));
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeOption = ROLE_OPTIONS.find(o => o.role === selectedRole)!;

  return (
    <div className="min-h-screen medical-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-teal-200/25 blur-3xl" />
        <div className="hidden sm:block absolute top-12 left-12 text-emerald-200/60 animate-float"><Cross size={28} /></div>
        <div className="hidden sm:block absolute top-24 right-20 text-teal-200/50 animate-float" style={{ animationDelay: '1s' }}><HeartPulse size={24} /></div>
        <div className="hidden sm:block absolute bottom-20 left-24 text-green-200/50 animate-float" style={{ animationDelay: '2s' }}><Activity size={22} /></div>
        <div className="hidden sm:block absolute bottom-32 right-16 text-emerald-200/60 animate-float" style={{ animationDelay: '0.5s' }}><Stethoscope size={30} /></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in-up stagger-1">
          <div
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-3 shadow-lg overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
          >
            <img src="/sipmr.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold gradient-text mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            SIPMR
          </h1>
          <p className="text-emerald-700/70 text-xs md:text-sm font-medium tracking-wide uppercase">
            Hospital Entry Management System
          </p>
        </div>

        {/* Main card */}
        <div className="glass rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up stagger-2">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #34d399, #059669, #047857)' }} />

          <div className="p-5 md:p-8">
            {/* Role selector */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Select Your Role</p>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.role}
                    onClick={() => setSelectedRole(option.role)}
                    type="button"
                    className={`
                      relative flex flex-col items-center gap-1.5 p-2.5 md:p-4 rounded-2xl border-2
                      transition-all duration-200 text-center group
                      ${selectedRole === option.role
                        ? `${option.bg} ${option.border} shadow-md scale-105`
                        : 'bg-white/60 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                      }
                    `}
                  >
                    {selectedRole === option.role && (
                      <span className={`absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full ${option.badge} font-bold shadow-sm`}>✓</span>
                    )}
                    <span className={`transition-colors ${selectedRole === option.role ? option.color : 'text-gray-400 group-hover:text-emerald-600'}`}>
                      {option.icon}
                    </span>
                    <span className={`text-[10px] md:text-xs font-semibold transition-colors leading-tight ${selectedRole === option.role ? option.color : 'text-gray-500 group-hover:text-emerald-600'}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-3 text-center text-xs text-emerald-600/80 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                {activeOption.description}
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@hospital.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</>
                ) : (
                  <><span>Sign In as {activeOption.label}</span><span>→</span></>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-emerald-600/60 mt-5 animate-fade-in-up stagger-4">
          Secure hospital management system · All rights reserved
        </p>
      </div>
    </div>
  );
}