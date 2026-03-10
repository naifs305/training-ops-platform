import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import api from '../../lib/axios';
import RoleSwitcher from './RoleSwitcher';

export default function Header() {
  const { user, logout, activeRole } = useAuth();
  const [notifCount, setNotifCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const unread = (res.data || []).filter((n) => !n.isRead).length;
      setNotifCount(unread);
    } catch (error) {
      console.error('Header notifications error - Header.js:17', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-10 h-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h2 className="text-2xl font-extrabold text-primary">
              نظام إقفال الدورات التدريبية
            </h2>
            <p className="mt-1 text-xs text-text-soft">
              {activeRole === 'MANAGER' ? 'وضع المدير' : 'وضع الموظف'}
            </p>
          </div>

          {activeRole === 'MANAGER' && (
            <nav className="hidden lg:flex items-center gap-2">
              <Link
                href="/approvals"
                className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-main transition hover:border-primary hover:bg-primary-light hover:text-primary"
              >
                الاعتمادات
              </Link>

              <Link
                href="/reports"
                className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-main transition hover:border-primary hover:bg-primary-light hover:text-primary"
              >
                التقارير
              </Link>

              <Link
                href="/archive"
                className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-main transition hover:border-primary hover:bg-primary-light hover:text-primary"
              >
                الأرشيف
              </Link>

              <Link
                href="/messages"
                className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-main transition hover:border-primary hover:bg-primary-light hover:text-primary"
              >
                المراسلات
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          <Link href="/notifications">
            <div className="relative cursor-pointer rounded-xl border border-border bg-white p-2 transition hover:border-primary hover:bg-primary-light">
              <svg
                className="h-5 w-5 text-text-main"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
                  {notifCount}
                </span>
              )}
            </div>
          </Link>

          {user && user.roles.length > 1 && <RoleSwitcher />}

          {user && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-text-main">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-text-soft">{user.email}</span>
            </div>
          )}

          <button
            onClick={logout}
            className="rounded-xl border border-danger px-3 py-1.5 text-sm font-medium text-danger transition hover:bg-red-50"
          >
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}