'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearSession } from '@/lib/auth';
import { User, UserRole } from '@/types';
import {
  HeartPulse, LayoutDashboard, Building2, FileBarChart,
  ClipboardList, LogOut, ChevronRight, Shield, Stethoscope,
  Users, KeyRound, Menu, X
} from 'lucide-react';
import { clsx } from 'clsx';
import ChangePasswordModal from '@/components/ChangePasswordModal';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  superadmin: [
    { label: 'Dashboard',       href: '/superadmin',              icon: <LayoutDashboard size={18} /> },
    { label: 'Manage Doctors',  href: '/superadmin/doctors',      icon: <Stethoscope size={18} /> },
    { label: 'Departments',     href: '/superadmin/departments',  icon: <Building2 size={18} /> },
    { label: 'Reports',         href: '/superadmin/reports',      icon: <FileBarChart size={18} /> },
  ],
  admin: [
    { label: 'Dashboard',       href: '/admin',          icon: <LayoutDashboard size={18} /> },
    { label: 'Entries',         href: '/admin/entries',  icon: <ClipboardList size={18} /> },
    { label: 'Reports',         href: '/admin/reports',  icon: <FileBarChart size={18} /> },
  ],
  doctor: [
    { label: 'Dashboard',  href: '/doctor',          icon: <LayoutDashboard size={18} /> },
    { label: 'My Reports', href: '/doctor/reports',  icon: <FileBarChart size={18} /> },
  ],
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  superadmin: <Shield size={16} />,
  admin:      <Users size={16} />,
  doctor:     <Stethoscope size={16} />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  superadmin: 'bg-emerald-700',
  admin:      'bg-teal-600',
  doctor:     'bg-green-600',
};

// Bottom nav icons (slightly larger for touch)
const BOTTOM_NAV_ICONS: Record<UserRole, NavItem[]> = {
  superadmin: [
    { label: 'Home',        href: '/superadmin',             icon: <LayoutDashboard size={20} /> },
    { label: 'Doctors',     href: '/superadmin/doctors',     icon: <Stethoscope size={20} /> },
    { label: 'Departments', href: '/superadmin/departments', icon: <Building2 size={20} /> },
    { label: 'Reports',     href: '/superadmin/reports',     icon: <FileBarChart size={20} /> },
    { label: 'More',        href: '__more__',                icon: <Menu size={20} /> },
  ],
  admin: [
    { label: 'Home',     href: '/admin',          icon: <LayoutDashboard size={20} /> },
    { label: 'Entries',  href: '/admin/entries',  icon: <ClipboardList size={20} /> },
    { label: 'Reports',  href: '/admin/reports',  icon: <FileBarChart size={20} /> },
    { label: 'More',     href: '__more__',        icon: <Menu size={20} /> },
  ],
  doctor: [
    { label: 'Home',     href: '/doctor',         icon: <LayoutDashboard size={20} /> },
    { label: 'Reports',  href: '/doctor/reports', icon: <FileBarChart size={20} /> },
    { label: 'More',     href: '__more__',        icon: <Menu size={20} /> },
  ],
};

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const router  = useRouter();
  const pathname = usePathname();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMoreDrawer,    setShowMoreDrawer]    = useState(false);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const navItems       = NAV_ITEMS[user.role]       || [];
  const bottomNavItems = BOTTOM_NAV_ICONS[user.role] || [];

  const isActive = (href: string) =>
    pathname === href || (href !== `/${user.role}` && pathname.startsWith(href));

  return (
    <>
      {/* ════════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile)
      ════════════════════════════════════════ */}
      <aside
        className="hidden md:flex w-64 min-h-screen flex-col flex-shrink-0"
        style={{
          background:   'linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%)',
          borderRight:  '1px solid rgba(167, 243, 208, 0.5)',
        }}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
            >
              <img src="/sipmr.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
            </div>
            <div>
              <span
                className="font-bold text-emerald-900 text-sm leading-tight block"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                SIPMR
              </span>
              <span className="text-xs text-emerald-500">Hospital System</span>
            </div>
          </div>
        </div>

        {/* User badge */}
        <div className="mx-4 mb-5 p-3 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${ROLE_COLORS[user.role]}`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900 truncate">{user.name}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${ROLE_COLORS[user.role]}`}>
                {ROLE_ICONS[user.role]}
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div className="mx-4 mb-3">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-2">Navigation</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={clsx('sidebar-item w-full', isActive(item.href) && 'active')}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {isActive(item.href) && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 space-y-1">
          <div className="h-px bg-emerald-100 mb-3" />
          <button
            onClick={() => setShowPasswordModal(true)}
            className="sidebar-item w-full text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
          >
            <KeyRound size={18} />
            <span>Change Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MOBILE BOTTOM NAV (hidden on desktop)
      ════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-emerald-100 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => {
            const active = item.href !== '__more__' && isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  if (item.href === '__more__') {
                    setShowMoreDrawer(true);
                  } else {
                    router.push(item.href);
                  }
                }}
                className={clsx(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[10px] font-semibold transition-colors',
                  active
                    ? 'text-emerald-600'
                    : 'text-gray-400 hover:text-emerald-500'
                )}
              >
                <span className={clsx(
                  'p-1.5 rounded-xl transition-all',
                  active ? 'bg-emerald-100 text-emerald-600' : ''
                )}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ════════════════════════════════════════
          MOBILE "MORE" DRAWER
      ════════════════════════════════════════ */}
      {showMoreDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMoreDrawer(false)}
          />

          {/* Drawer */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 space-y-2 animate-slide-up">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* User info */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${ROLE_COLORS[user.role]}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-emerald-900 text-sm">{user.name}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${ROLE_COLORS[user.role]}`}>
                  {ROLE_ICONS[user.role]}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>

            {/* Change password */}
            <button
              onClick={() => { setShowMoreDrawer(false); setShowPasswordModal(true); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold text-sm transition-colors"
            >
              <KeyRound size={18} />
              Change Password
            </button>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-600 bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>

            {/* Cancel */}
            <button
              onClick={() => setShowMoreDrawer(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-gray-500 hover:bg-gray-100 font-medium text-sm transition-colors mt-1"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal user={user} onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}