import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/layout/MainLayout';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';

export default function EditCoursePage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    name: '',
    city: '',
    startDate: '',
    endDate: '',
    numTrainees: '',
    operationalProjectId: '',
    primaryEmployeeId: '',
    requiresAdvance: false,
    requiresRevenue: false,
    materialsIssued: false,
    requiresAdvanceSettlement: false,
    requiresSupervisorCompensation: false,
    requiresTrainerCompensation: false,
  });

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const toDateInputValue = (value) => {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [courseRes, projectsRes, usersRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get('/projects'),
        api.get('/users'),
      ]);

      const course = courseRes.data;
      const employeeUsers = (usersRes.data || []).filter((u) => u.roles?.includes('EMPLOYEE'));

      setProjects(projectsRes.data || []);
      setUsers(employeeUsers);

      setForm({
        name: course.name || '',
        city: course.city || '',
        startDate: course.startDate ? toDateInputValue(course.startDate) : '',
        endDate: course.endDate ? toDateInputValue(course.endDate) : '',
        numTrainees: course.numTrainees ?? '',
        operationalProjectId: course.operationalProjectId || course.operationalProject?.id || '',
        primaryEmployeeId: course.primaryEmployeeId || course.primaryEmployee?.id || '',
        requiresAdvance: !!course.requiresAdvance,
        requiresRevenue: !!course.requiresRevenue,
        materialsIssued: !!course.materialsIssued,
        requiresAdvanceSettlement: !!course.requiresAdvanceSettlement,
        requiresSupervisorCompensation: !!course.requiresSupervisorCompensation,
        requiresTrainerCompensation: !!course.requiresTrainerCompensation,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحميل بيانات الدورة');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCheckboxChange = (key) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('اسم الدورة مطلوب');
    if (!form.city.trim()) return toast.error('المدينة مطلوبة');
    if (!form.startDate) return toast.error('تاريخ البداية مطلوب');
    if (!form.endDate) return toast.error('تاريخ النهاية مطلوب');
    if (!form.operationalProjectId) return toast.error('المشروع التشغيلي مطلوب');
    if (!form.primaryEmployeeId) return toast.error('الموظف المسؤول مطلوب');

    try {
      setSaving(true);

      await api.put(`/courses/${id}`, {
        name: form.name.trim(),
        city: form.city.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        numTrainees: Number(form.numTrainees || 0),
        operationalProjectId: form.operationalProjectId,
        primaryEmployeeId: form.primaryEmployeeId,
        requiresAdvance: form.requiresAdvance,
        requiresRevenue: form.requiresRevenue,
        materialsIssued: form.materialsIssued,
        requiresAdvanceSettlement: form.requiresAdvanceSettlement,
        requiresSupervisorCompensation: form.requiresSupervisorCompensation,
        requiresTrainerCompensation: form.requiresTrainerCompensation,
      });

      toast.success('تم تعديل الدورة بنجاح');
      router.push('/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في تعديل الدورة');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  const labelClass = 'mb-2 block text-sm font-bold text-text-main';

  if (loading) {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-border bg-white p-8 text-center text-sm font-medium text-text-soft shadow-card">
          جاري تحميل بيانات الدورة...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <h1 className="text-2xl font-extrabold text-text-main">تعديل الدورة</h1>
          <p className="mt-2 text-sm text-text-soft">عدّل بيانات الدورة ثم احفظ التغييرات</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-card"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>اسم الدورة</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>المدينة</label>
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>تاريخ البداية</label>
              <input
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>تاريخ النهاية</label>
              <input
                type="date"
                className={inputClass}
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>عدد المتدربين</label>
              <input
                type="number"
                className={inputClass}
                value={form.numTrainees}
                onChange={(e) => handleChange('numTrainees', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>المشروع التشغيلي</label>
              <select
                className={inputClass}
                value={form.operationalProjectId}
                onChange={(e) => handleChange('operationalProjectId', e.target.value)}
              >
                <option value="">اختر المشروع التشغيلي</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>الموظف المسؤول</label>
              <select
                className={inputClass}
                value={form.primaryEmployeeId}
                onChange={(e) => handleChange('primaryEmployeeId', e.target.value)}
              >
                <option value="">اختر الموظف المسؤول</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-4">
            <h2 className="mb-4 text-lg font-extrabold text-text-main">الإعدادات التشغيلية</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ['requiresAdvance', 'يتطلب سلفة'],
                ['requiresRevenue', 'يتطلب إيرادات'],
                ['materialsIssued', 'تم صرف مواد'],
                ['requiresAdvanceSettlement', 'يتطلب تسوية سلفة'],
                ['requiresSupervisorCompensation', 'يتطلب مستحقات مشرف'],
                ['requiresTrainerCompensation', 'يتطلب مستحقات مدرب'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-main"
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={() => handleCheckboxChange(key)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/courses')}
              className="rounded-2xl border border-border bg-white px-5 py-3 text-sm font-bold text-text-main transition hover:border-primary hover:bg-primary-light hover:text-primary"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}