import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DatePicker from 'react-datepicker';
import MainLayout from '../../../components/layout/MainLayout';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';

function formatDateForApi(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DateRangeInput = forwardRef(function DateRangeInput(
  { startDate, endDate, onClear, onClick },
  ref,
) {
  return (
    <div className="w-full">
      <button
        type="button"
        ref={ref}
        onClick={onClick}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-right transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="text-lg text-slate-400">📅</div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mb-1 text-xs font-medium text-slate-500">تاريخ البداية</div>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {startDate || 'اختر تاريخ البداية'}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mb-1 text-xs font-medium text-slate-500">تاريخ النهاية</div>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {endDate || 'اختر تاريخ النهاية'}
                </div>
              </div>
            </div>
          </div>

          {(startDate || endDate) && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear();
                }
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              مسح
            </span>
          )}
        </div>
      </button>
    </div>
  );
});

export default function EditCoursePage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  const startDateObj = form.startDate ? new Date(form.startDate) : null;
  const endDateObj = form.endDate ? new Date(form.endDate) : null;

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.city.trim() &&
      form.startDate &&
      form.endDate &&
      form.numTrainees &&
      Number(form.numTrainees) > 0 &&
      form.operationalProjectId &&
      form.primaryEmployeeId
    );
  }, [form]);

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
        startDate: course.startDate ? formatDateForApi(new Date(course.startDate)) : '',
        endDate: course.endDate ? formatDateForApi(new Date(course.endDate)) : '',
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

  const handleCheckboxChange = (key, checked) => {
    setForm((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;

    setForm((prev) => ({
      ...prev,
      startDate: start ? formatDateForApi(start) : '',
      endDate: end ? formatDateForApi(end) : '',
    }));

    if (start && end) {
      setTimeout(() => {
        setIsDatePickerOpen(false);
      }, 50);
    }
  };

  const clearDateRange = () => {
    setForm((prev) => ({
      ...prev,
      startDate: '',
      endDate: '',
    }));
    setIsDatePickerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('أكمل الحقول المطلوبة أولًا');
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('تاريخ النهاية يجب أن يكون بعد أو مساويًا لتاريخ البداية');
      return;
    }

    try {
      setSaving(true);

      await api.put(`/courses/${id}`, {
        name: form.name.trim(),
        city: form.city.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        numTrainees: Number(form.numTrainees),
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

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-right">جاري تحميل بيانات الدورة...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50" dir="rtl">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">تعديل الدورة</h1>
            <p className="mt-2 text-sm text-slate-500">عدّل بيانات الدورة ثم احفظ التغييرات</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">البيانات الأساسية</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="عنوان الدورة"
                  required
                  value={form.name}
                  onChange={(value) => handleChange('name', value)}
                  placeholder="مثال: التفتيش الأمني"
                  className="md:col-span-2"
                />

                <Field
                  label="المدينة"
                  required
                  value={form.city}
                  onChange={(value) => handleChange('city', value)}
                  placeholder="مثال: الرياض"
                />

                <DateRangeField
                  startDate={startDateObj}
                  endDate={endDateObj}
                  startDateValue={form.startDate}
                  endDateValue={form.endDate}
                  isOpen={isDatePickerOpen}
                  setIsOpen={setIsDatePickerOpen}
                  onChange={handleDateRangeChange}
                  onClear={clearDateRange}
                />

                <Field
                  label="عدد المتدربين"
                  required
                  type="number"
                  min="1"
                  value={form.numTrainees}
                  onChange={(value) => handleChange('numTrainees', value)}
                  placeholder="مثال: 25"
                />

                <SelectField
                  label="المشروع التشغيلي"
                  required
                  value={form.operationalProjectId}
                  onChange={(value) => handleChange('operationalProjectId', value)}
                  options={projects.map((project) => ({
                    value: project.id,
                    label: project.name,
                  }))}
                />

                <SelectField
                  label="الموظف المسؤول"
                  required
                  value={form.primaryEmployeeId}
                  onChange={(value) => handleChange('primaryEmployeeId', value)}
                  options={users.map((user) => ({
                    value: user.id,
                    label: `${user.firstName} ${user.lastName}`,
                  }))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">الإعدادات التشغيلية</h2>
                <p className="mt-1 text-sm text-slate-500">
                  هذه الخيارات تتحكم في العناصر التشغيلية المشروطة داخل الدورة
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <CheckboxField
                  label="يتطلب سلفة"
                  checked={form.requiresAdvance}
                  onChange={(checked) => handleCheckboxChange('requiresAdvance', checked)}
                />

                <CheckboxField
                  label="يتطلب إيرادات"
                  checked={form.requiresRevenue}
                  onChange={(checked) => handleCheckboxChange('requiresRevenue', checked)}
                />

                <CheckboxField
                  label="تم صرف مواد"
                  checked={form.materialsIssued}
                  onChange={(checked) => handleCheckboxChange('materialsIssued', checked)}
                />

                <CheckboxField
                  label="يتطلب تسوية سلفة"
                  checked={form.requiresAdvanceSettlement}
                  onChange={(checked) =>
                    handleCheckboxChange('requiresAdvanceSettlement', checked)
                  }
                />

                <CheckboxField
                  label="يتطلب مستحقات مشرف"
                  checked={form.requiresSupervisorCompensation}
                  onChange={(checked) =>
                    handleCheckboxChange('requiresSupervisorCompensation', checked)
                  }
                />

                <CheckboxField
                  label="يتطلب مستحقات مدرب"
                  checked={form.requiresTrainerCompensation}
                  onChange={(checked) =>
                    handleCheckboxChange('requiresTrainerCompensation', checked)
                  }
                />
              </div>
            </div>

            <div className="sticky bottom-4 z-10">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/courses')}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={!canSubmit || saving}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
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
  disabled = false,
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
        <option value="">
          {label === 'المشروع التشغيلي' ? 'اختر المشروع التشغيلي' : 'اختر الموظف المسؤول'}
        </option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateRangeField({
  startDate,
  endDate,
  startDateValue,
  endDateValue,
  isOpen,
  setIsOpen,
  onChange,
  onClear,
}) {
  return (
    <div className="md:col-span-2">
      <span className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
        تاريخ الدورة
        <span className="text-red-500">*</span>
      </span>

      <DatePicker
        selected={startDate}
        onChange={onChange}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        open={isOpen}
        onInputClick={() => setIsOpen(true)}
        onClickOutside={() => setIsOpen(false)}
        shouldCloseOnSelect={false}
        monthsShown={2}
        popperPlacement="bottom-start"
        dateFormat="yyyy-MM-dd"
        placeholderText="اختر تاريخ البداية والنهاية"
        calendarClassName="border border-slate-200 rounded-xl shadow-xl"
        wrapperClassName="w-full"
        customInput={
          <DateRangeInput
            startDate={startDateValue}
            endDate={endDateValue}
            onClear={onClear}
          />
        }
      />
    </div>
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