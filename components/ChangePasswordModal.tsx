'use client';

import { useState } from 'react';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { X, Eye, EyeOff, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  user: User;
  onClose: () => void;
}

export default function ChangePasswordModal({ user, onClose }: ChangePasswordModalProps) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: score, label: 'Weak',   color: 'bg-red-400' };
    if (score <= 3) return { level: score, label: 'Fair',   color: 'bg-amber-400' };
    return              { level: score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = passwordStrength(form.newPassword);
  const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to change password');
        return;
      }
      setSuccess(true);
      toast.success('Password changed successfully!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Lock size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-emerald-900">Change Password</h2>
              <p className="text-xs text-emerald-600/70">{user.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 mb-2">Password Updated!</h3>
            <p className="text-sm text-gray-500 mb-6">Your password has been changed successfully.</p>
            <button onClick={onClose} className="btn-primary px-8">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Security info */}
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <ShieldCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700">
                For security, please enter your current password before setting a new one.
              </p>
            </div>

            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Current Password *</label>
              <div className="relative">
                <input
                  type={show.current ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                  className="input-field pr-11"
                  placeholder="Enter current password"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors p-1">
                  {show.current ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-emerald-50" />

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">New Password *</label>
              <div className="relative">
                <input
                  type={show.new ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  className="input-field pr-11"
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors p-1">
                  {show.new ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Strength meter */}
              {form.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${
                    strength.label === 'Weak'   ? 'text-red-500' :
                    strength.label === 'Fair'   ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Confirm New Password *</label>
              <div className="relative">
                <input
                  type={show.confirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`input-field pr-11 transition-all ${
                    form.confirmPassword
                      ? passwordsMatch
                        ? 'border-emerald-400 ring-1 ring-emerald-300'
                        : 'border-red-300 ring-1 ring-red-200'
                      : ''
                  }`}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-600 transition-colors p-1">
                  {show.confirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {form.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Passwords match
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !passwordsMatch}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                  : <><Lock size={15} /> Update Password</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}