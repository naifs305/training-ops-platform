import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../context/AuthContext';
import api from '../../lib/axios';
import MainLayout from '../../components/layout/MainLayout';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Courses() {
  const router = useRouter();
  const { activeRole } = useAuth();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', project: '' });
  const [reassignSelections, setReassignSelections] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      setFilters((prev) => ({
        ...prev,
        status: router.query.status || '',
      }));
    }
  }, [router.isReady, router.query.status]);

  useEffect(() => {
    fetchCourses();
    if (activeRole === 'MANAGER') {
      fetchUsers();
    }
  }, [filters, activeRole]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);

      const res = await api.get(`/courses?${params.toString()}`);
      setCourses(res.data.filter((c) => c.status !== 'ARCHIVED'));
    } catch (err) {
      console.error(err);
      toast.error('تعذر تحميل الدورات');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.filter((u) => u.roles?.includes('EMPLOYEE')));
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('هل أنت متأكد من أرشفة هذه الدورة؟')) return;
    try {
      setActionLoadingId(id);
      await api.put(`/courses/${id}/archive`);
      toast.success('تمت الأرشفة');
      fetchCourses();
    } catch (e) {
      toast.error('فشل في الأرشفة');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;
    try {
      setActionLoadingId(id);
      await api.delete(`/courses/${id}`);
      toast.success('تم حذف الدورة');
      fetchCourses();
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل في حذف الدورة');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReassign = async (courseId) => {
    const primaryEmployeeId = reassignSelections[courseId];
    if (!primaryEmployeeId) {
      toast.error('اختر الموظف أولًا');
      return;
    }

    try {
      setActionLoadingId(courseId);
      await api.put(`/courses/${courseId}/reassign`, { primaryEmployeeId });
      toast.success('تم نقل الدورة بنجاح');
      fetchCourses();
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل في نقل الدورة');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PREPARATION: 'قيد الإعداد',
      EXECUTION: 'قيد التنفيذ',
      AWAITING_CLOSURE: 'بانتظار الإغلاق',
      CLOSED: 'مغلقة',
      ARCHIVED: 'مؤرشفة',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      PREPARATION: 'bg-primary-light text-primary',
      EXECUTION: 'bg-amber-50 text-warning',
      AWAITING_CLOSURE: 'bg-red-50 text-danger',
      CLOSED: 'bg-emerald-50 text-success',
      ARCHIVED: 'bg-gray-100 text-text-soft',
    };
    return classes[status] || 'bg-gray-100 text-text-soft';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-text-main">الدورات النشطة</h1>
              <p className="mt-2 text-sm text-text-soft">
                متابعة الدورات الجارية ضمن الهوية المؤسسية للمنصة
              </p>
            </div>

            <div className="flex gap-2">
              {activeRole === 'MANAGER' && (
                <Link href="/archive">
                  <button className="rounded-2xl border border-border bg-white px-4 py-2 text-sm font-bold text-text-main transition hover:border-primary hover:bg-primary-light hover:text-primary">
                    الأرشيف
                  </button>
                </Link>
              )}

              {activeRole === 'EMPLOYEE' && (
                <Link href="/courses/create">
                  <button className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-primary-dark">
                    + دورة جديدة
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-3xl border border-border bg-white p-4 shadow-card md:grid-cols-4">
          <select
            className="w-full rounded-2xl border border-border bg-white p-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">كل الحالات</option>
            <option value="PREPARATION">قيد الإعداد</option>
            <option value="EXECUTION">قيد التنفيذ</option>
            <option value="AWAITING_CLOSURE">بانتظار الإغلاق</option>
            <option value="CLOSED">مغلقة</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-border bg-white p-8 text-center text-sm font-medium text-text-soft shadow-card">
            جاري التحميل...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <Link href={`/courses/${course.id}`}>
                  <div className="cursor-pointer p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-extrabold leading-8 text-text-main">
                        {course.name}
                      </h3>

                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(course.status)}`}
                      >
                        {getStatusLabel(course.status)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl bg-background px-4 py-3 text-sm text-text-soft">
                        {course.beneficiaryEntity} - {course.city}
                      </div>

                      <div className="text-sm text-text-main">
                        <span className="font-bold text-primary">المسؤول:</span>{' '}
                        {course.primaryEmployee?.firstName} {course.primaryEmployee?.lastName}
                      </div>

                      <div className="text-sm text-text-soft">
                        <span className="font-bold text-text-main">تاريخ البداية:</span>{' '}
                        {new Date(course.startDate).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="mt-auto px-6 pb-6">
                  {activeRole === 'EMPLOYEE' && course.status === 'PREPARATION' && (
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={actionLoadingId === course.id}
                      className="w-full rounded-2xl border border-danger/20 px-4 py-3 text-sm font-bold text-danger transition hover:bg-red-50 disabled:opacity-50"
                    >
                      حذف الدورة
                    </button>
                  )}

                  {activeRole === 'MANAGER' && (
                    <div className="space-y-3">
                      <select
                        className="w-full rounded-2xl border border-border bg-white p-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                        value={reassignSelections[course.id] || ''}
                        onChange={(e) =>
                          setReassignSelections((prev) => ({
                            ...prev,
                            [course.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">اختر موظفًا لنقل الدورة</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleReassign(course.id)}
                        disabled={actionLoadingId === course.id}
                        className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        نقل الدورة
                      </button>

                      {course.status === 'CLOSED' && (
                        <button
                          onClick={() => handleArchive(course.id)}
                          disabled={actionLoadingId === course.id}
                          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold text-text-main transition hover:border-primary hover:bg-primary-light hover:text-primary disabled:opacity-50"
                        >
                          نقل إلى الأرشيف
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}