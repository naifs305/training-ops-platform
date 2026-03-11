import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/layout/MainLayout';
import useAuth from '../../context/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const initialForm = {
  title: '',
  city: '',
  courseType: '',
  projectId: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  trainerName: '',
  trainerOrganization: '',
  targetAudience: '',
  traineesCount: '',
  notes: '',
  requiresAdvanceSettlement: false,
  requiresSupervisorCompensation: false,
  requiresTrainerCompensation: false,
};

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [projects, setProjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const res = await api.get('/projects');

        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        setProjects(items);

        if (items.length > 0) {
          setForm((prev) => ({
            ...prev,
            projectId: prev.projectId || items[0].id,
          }));
        }
      } catch (error) {
        console.error('Failed to load projects: - create.js:57', error);
        toast.error('تعذر تحميل المشاريع التشغيلية');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim() &&
      form.city.trim() &&
      form.courseType.trim() &&
      form.projectId &&
      form.startDate &&
      form.endDate
    );
  }, [form]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const normalizePayload = () => {
    return {
      title: form.title.trim(),
      city: form.city.trim(),
      courseType: form.courseType.trim(),
      projectId: form.projectId,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      trainerName: form.trainerName.trim() || undefined,
      trainerOrganization: form.trainerOrganization.trim() || undefined,
      targetAudience: form.targetAudience.trim() || undefined,
      traineesCount: form.traineesCount ? Number(form.traineesCount) : undefined,
      notes: form.notes.trim() || undefined,
      requiresAdvanceSettlement: form.requiresAdvanceSettlement,
      requiresSupervisorCompensation: form.requiresSupervisorCompensation,
      requiresTrainerCompensation: form.requiresTrainerCompensation,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('أكمل الحقول الأساسية أولًا');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = normalizePayload();
      const res = await api.post('/courses', payload);

      toast.success('تم إنشاء الدورة بنجاح');

      const createdId =
        res?.data?.id ||
        res?.data?.data?.id ||
        res?.data?.course?.id;

      if (createdId) {
        router.push(`/courses/${createdId}`);
        return;
      }

      router.push('/courses');
    } catch (error) {
      console.error('Create course failed: - create.js:133', error);
      toast.error(
        error?.response?.data?.message || 'تعذر إنشاء الدورة',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-right">جاري التحميل...</div>
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50" dir="rtl">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  إنشاء دورة جديدة
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  نموذج مرتب وواضح وسريع للإدخال التشغيلي
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/courses')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                العودة إلى الدورات
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  البيانات الأساسية
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  تم حذف كود الدورة ومقر التنفيذ، وتم رفع نوع الدورة للأعلى بجانب المدينة
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="عنوان الدورة"
                  required
                  value={form.title}
                  onChange={(value) => handleChange('title', value)}
                  placeholder="اكتب عنوان الدورة"
                  className="xl:col-span-2"
                />

                <Field
                  label="المدينة"
                  required
                  value={form.city}
                  onChange={(value) => handleChange('city', value)}
                  placeholder="مثال: الرياض"
                />

                <Field
                  label="نوع الدورة"
                  required
                  value={form.courseType}
                  onChange={(value) => handleChange('courseType', value)}
                  placeholder="مثال: حضورية / تنفيذية / دولية"
                />

                <SelectField
                  label="المشروع التشغيلي"
                  required
                  value={form.projectId}
                  onChange={(value) => handleChange('projectId', value)}
                  disabled={isLoadingProjects}
                  options={projects.map((project) => ({
                    label: project.name,
                    value: project.id,
                  }))}
                />

                <Field
                  label="تاريخ البداية"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(value) => handleChange('startDate', value)}
                />

                <Field
                  label="تاريخ النهاية"
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(value) => handleChange('endDate', value)}
                />

                <Field
                  label="وقت البداية"
                  type="time"
                  value={form.startTime}
                  onChange={(value) => handleChange('startTime', value)}
                />

                <Field
                  label="وقت النهاية"
                  type="time"
                  value={form.endTime}
                  onChange={(value) => handleChange('endTime', value)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  معلومات التنفيذ
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="اسم المدرب"
                  value={form.trainerName}
                  onChange={(value) => handleChange('trainerName', value)}
                  placeholder="اكتب اسم المدرب"
                />

                <Field
                  label="جهة المدرب"
                  value={form.trainerOrganization}
                  onChange={(value) => handleChange('trainerOrganization', value)}
                  placeholder="الجهة أو المؤسسة"
                />

                <Field
                  label="الفئة المستهدفة"
                  value={form.targetAudience}
                  onChange={(value) => handleChange('targetAudience', value)}
                  placeholder="مثال: قيادات أمنية / منسقون / متدربون"
                  className="xl:col-span-2"
                />

                <Field
                  label="عدد المتدربين المتوقع"
                  type="number"
                  min="0"
                  value={form.traineesCount}
                  onChange={(value) => handleChange('traineesCount', value)}
                  placeholder="مثال: 25"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  الإعدادات التشغيلية
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <CheckboxField
                  label="يتطلب تسوية سلفة"
                  checked={form.requiresAdvanceSettlement}
                  onChange={(checked) =>
                    handleChange('requiresAdvanceSettlement', checked)
                  }
                />

                <CheckboxField
                  label="يتطلب مستحقات مشرف"
                  checked={form.requiresSupervisorCompensation}
                  onChange={(checked) =>
                    handleChange('requiresSupervisorCompensation', checked)
                  }
                />

                <CheckboxField
                  label="يتطلب مستحقات مدرب"
                  checked={form.requiresTrainerCompensation}
                  onChange={(checked) =>
                    handleChange('requiresTrainerCompensation', checked)
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  ملاحظات إضافية
                </h2>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  الملاحظات
                </span>
                <textarea
                  rows={5}
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="أضف أي ملاحظات تشغيلية مهمة"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            <div className="sticky bottom-4 z-10">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-500">
                    الحقول الأساسية المطلوبة:
                    <span className="mx-1 font-semibold text-slate-800">عنوان الدورة</span>
                    /
                    <span className="mx-1 font-semibold text-slate-800">المدينة</span>
                    /
                    <span className="mx-1 font-semibold text-slate-800">نوع الدورة</span>
                    /
                    <span className="mx-1 font-semibold text-slate-800">المشروع</span>
                    /
                    <span className="mx-1 font-semibold text-slate-800">تاريخ البداية والنهاية</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/courses')}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'جاري إنشاء الدورة...' : 'إنشاء الدورة'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  min,
  className = '',
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
      >
        <option value="">اختر المشروع</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}