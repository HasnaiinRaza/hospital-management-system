'use client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8 min-w-0">
      {children}
    </main>
  );
}