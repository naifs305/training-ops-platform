import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../../context/AuthContext';
import api from '../../lib/axios';
import MainLayout from '../../components/layout/MainLayout';
import toast from 'react-hot-toast';

export default function CreateCourse() {
  const router = useRouter();
  const { activeRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    locationType: '',
    startDate: '',
    endDate: '',
    numTrainees: 0,
    operationalProjectId: '',
    primaryEmployeeId: '',
    supportingEmployeeIds: [],
    courseType: 'internal',
    requiresAdvance: false,
    requiresRevenue: false,
    materialsIssued: false,
    requiresAdvanceSettlement: false,
    requiresSupervisorCompensation: false,
    requiresTrainerCompensation: false,
  });

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const me = await api.get('/users/me');
      const payload = { ...form, primaryEmployeeId: me.data.id };

      await api.post('/courses', payload);
      toast.success('تم إنشاء الدورة بنجاح');
      router.push('/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  if (activeRole === 'MANAGER') {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-danger/20 bg-white p-10 text-center text-danger shadow-card">
          يجب التبديل إلى دور الموظف لإنشاء دورة جديدة.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <h1 className="text-2xl font-extrabold text-text-main">إنشاء دورة جديدة</h1>
          <p className="mt-2 text-sm text-text-soft">
            أدخل بيانات الدورة وفق الهوية المؤسسية للمنصة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-8 shadow-card space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">اسم الدورة</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">
                كود الدورة (اختياري)
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">المدينة</label>
              <input
                type="text"
                name="city"
                required
                value={form.city}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">مقر التنفيذ</label>
              <input
                type="text"
                name="locationType"
                required
                value={form.locationType}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">تاريخ البداية</label>
              <input
                type="date"
                name="startDate"
                required
                value={form.startDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">تاريخ النهاية</label>
              <input
                type="date"
                name="endDate"
                required
                value={form.endDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">عدد المتدربين</label>
              <input
                type="number"
                name="numTrainees"
                required
                value={form.numTrainees}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">المشروع التشغيلي</label>
              <select
                name="operationalProjectId"
                required
                value={form.operationalProjectId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">اختر المشروع</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-text-main">نوع الدورة</label>
              <select
                name="courseType"
                value={form.courseType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="internal">داخلية</option>
                <option value="external">خارجية</option>
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-6">
            <h3 className="mb-5 text-lg font-extrabold text-primary">الإعدادات التشغيلية</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-text-main">
                <input
                  type="checkbox"
                  name="requiresAdvance"
                  checked={form.requiresAdvance}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                يتطلب سلفة مالية
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-text-main">
                <input
                  type="checkbox"
                  name="requiresRevenue"
                  checked={form.requiresRevenue}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                يتطلب إيرادات
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-text-main">
                <input
                  type="checkbox"
                  name="materialsIssued"
                  checked={form.materialsIssued}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                تم إصدار مواد تدريبية
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-text-main">
                <input
                  type="checkbox"
                  name="requiresAdvanceSettlement"
                  checked={form.requiresAdvanceSettlement}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                يتطلب تسوية سلفة
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-text-main">
                <input
                  type="checkbox"
                  name="requiresSupervisorCompensation"
                  checked={form.requiresSupervisorCompensation}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                يتطلب مستحقات مشرف
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-text-main">
                <input
                  type="checkbox"
                  name="requiresTrainerCompensation"
                  checked={form.requiresTrainerCompensation}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                يتطلب مستحقات مدرب
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-dark disabled:opacity-70"
            >
              {loading ? 'جاري الحفظ...' : 'إنشاء الدورة'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}