import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../context/AuthContext';
import api from '../lib/axios';
import MainLayout from '../components/layout/MainLayout';
import KPICard from '../components/shared/KPICard';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, activeRole, loading } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (activeRole) {
      const endpoint = activeRole === 'MANAGER' ? '/analytics/manager' : '/analytics/employee';
      api.get(endpoint).then((res) => setStats(res.data)).catch(() => setStats(null));
    }
  }, [activeRole]);

  if (loading) {
    return (
      <div className="p-10 font-cairo text-text-main">
        جاري التحميل...
      </div>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="min-h-full bg-background p-4 md:p-6">
        <div className="mb-6 rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-text-main">
                مرحبًا، {user.firstName}
              </h1>
              <p className="mt-2 text-sm text-text-soft">
                منصة حوكمة العمليات التدريبية بهوية جامعة نايف العربية للعلوم الأمنية
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-2xl border border-primary/20 bg-primary-light px-4 py-2 text-sm font-bold text-primary">
              {activeRole === 'MANAGER' ? 'لوحة المدير' : 'لوحة الموظف'}
            </div>
          </div>
        </div>

        {activeRole === 'MANAGER' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Link href="/courses">
                <div className="cursor-pointer">
                  <KPICard title="إجمالي الدورات" value={stats.total} />
                </div>
              </Link>

              <Link href="/courses?status=PREPARATION">
                <div className="cursor-pointer">
                  <KPICard title="قيد الإعداد" value={stats.preparation} />
                </div>
              </Link>

              <Link href="/courses?status=EXECUTION">
                <div className="cursor-pointer">
                  <KPICard title="قيد التنفيذ" value={stats.execution} />
                </div>
              </Link>

              <Link href="/courses?status=AWAITING_CLOSURE">
                <div className="cursor-pointer">
                  <KPICard title="بانتظار الإغلاق" value={stats.awaiting} />
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Link href="/reports">
                <div className="cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-light/30">
                  <div className="mb-2 text-lg font-extrabold text-primary">التقارير</div>
                  <div className="text-sm leading-7 text-text-soft">
                    تقارير متقدمة مع فلاتر وتصدير Excel و PDF
                  </div>
                </div>
              </Link>

              <Link href="/archive">
                <div className="cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-light/30">
                  <div className="mb-2 text-lg font-extrabold text-primary">أرشيف الإقفالات</div>
                  <div className="text-sm leading-7 text-text-soft">
                    أرشفة متقدمة للدورات المغلقة وسجل الإقفالات
                  </div>
                </div>
              </Link>

              <Link href="/messages">
                <div className="cursor-pointer rounded-2xl border border-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-light/30">
                  <div className="mb-2 text-lg font-extrabold text-primary">المراسلات</div>
                  <div className="text-sm leading-7 text-text-soft">
                    نظام مراسلة داخلي بسيط بين المستخدمين
                  </div>
                </div>
              </Link>
            </div>

            <div className="rounded-2xl border border-danger/20 bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-extrabold text-danger">
                  الاعتمادات المعلقة ({stats.pendingApprovals})
                </h3>
                <Link href="/approvals" className="text-sm font-bold text-primary hover:text-primary-dark">
                  عرض الكل
                </Link>
              </div>
              <p className="text-sm text-text-soft">
                يوجد {stats.pendingApprovals} عنصر بانتظار اعتمادك.
              </p>
            </div>
          </div>
        )}

        {activeRole === 'EMPLOYEE' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Link href="/courses">
                <div className="cursor-pointer">
                  <KPICard title="دوراتي" value={stats.myCourses} color="primary" />
                </div>
              </Link>

              <Link href="/courses">
                <div className="cursor-pointer">
                  <KPICard title="مهام متأخرة" value={stats.overdueItems} color="red" />
                </div>
              </Link>

              <Link href="/courses?status=AWAITING_CLOSURE">
                <div className="cursor-pointer">
                  <KPICard title="بانتظار الاعتماد" value={stats.pendingMyApproval} color="yellow" />
                </div>
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h3 className="mb-4 text-lg font-extrabold text-text-main">دوراتي النشطة</h3>
              <div className="py-6 text-center text-text-soft">
                <Link href="/courses" className="font-bold text-primary hover:text-primary-dark">
                  الذهاب لقائمة الدورات
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}