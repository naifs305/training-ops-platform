import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const periodTypeOptions = [
  { value: 'MONTHLY', label: 'شهري' },
  { value: 'QUARTERLY', label: 'ربع سنوي' },
  { value: 'YEARLY', label: 'سنوي' },
];

const quarterOptions = [
  { value: 1, label: 'الربع الأول' },
  { value: 2, label: 'الربع الثاني' },
  { value: 3, label: 'الربع الثالث' },
  { value: 4, label: 'الربع الرابع' },
];

function formatLevel(level) {
  const map = {
    OUTSTANDING: 'متميز',
    VERY_GOOD: 'جيد جدًا',
    GOOD: 'جيد',
    NEEDS_IMPROVEMENT: 'يحتاج تحسين',
    WEAK: 'ضعيف',
  };
  return map[level] || level || '-';
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(digits);
}

function Badge({ children, tone = 'default' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-slate-50 text-slate-700 border-slate-200',
    soft: 'bg-background text-text-main border-border',
    default: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}

function SummaryCard({ title, value, subtext, tone = 'primary' }) {
  const map = {
    primary: 'text-primary',
    green: 'text-emerald-700',
    red: 'text-red-700',
    amber: 'text-amber-700',
    gray: 'text-text-main',
  };

  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-card">
      <div className="mb-1 text-xs font-bold text-text-soft">{title}</div>
      <div className={`text-2xl font-extrabold ${map[tone] || map.primary}`}>{value}</div>
      {subtext ? <div className="mt-2 text-xs text-text-soft">{subtext}</div> : null}
    </div>
  );
}

function SmallMetric({ label, value, tone = 'text-text-main' }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-sm font-medium text-text-soft">{label}</span>
      <span className={`text-sm font-extrabold ${tone}`}>{value}</span>
    </div>
  );
}

function HorizontalBar({ label, value, colorClass = 'bg-primary' }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-text-main">{label}</span>
        <span className="font-extrabold text-text-soft">{formatNumber(safe)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

function toneByCoverage(rate) {
  if (rate >= 100) return 'green';
  if (rate >= 80) return 'amber';
  return 'red';
}

function toneByPerformance(item) {
  if (!item?.isSubjectToEvaluation) return 'gray';
  if (item?.performanceLevel === 'OUTSTANDING') return 'green';
  if (item?.performanceLevel === 'VERY_GOOD') return 'blue';
  if (item?.performanceLevel === 'GOOD') return 'gray';
  if (item?.performanceLevel === 'NEEDS_IMPROVEMENT') return 'amber';
  return 'red';
}

function toneByCommitment(status) {
  if (status === 'COMMITTED') return 'green';
  if (status === 'NOT_COMMITTED') return 'red';
  if (status === 'NEEDS_FOLLOWUP') return 'amber';
  return 'gray';
}

function toneByDiscipline(status) {
  if (status === 'DISCIPLINED') return 'green';
  if (status === 'UNDISCIPLINED') return 'red';
  if (status === 'NEEDS_FOLLOWUP') return 'amber';
  return 'gray';
}

export default function KpisPage() {
  const currentYear = new Date().getFullYear();
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [year, setYear] = useState(currentYear);
  const [value, setValue] = useState(new Date().getMonth() + 1);

  const [loadingCalculation, setLoadingCalculation] = useState(false);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState({});

  const [snapshots, setSnapshots] = useState([]);
  const [assignmentRows, setAssignmentRows] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const periodLabel = useMemo(() => {
    if (periodType === 'MONTHLY') return `${year}-${String(value).padStart(2, '0')}`;
    if (periodType === 'QUARTERLY') return `${year}-Q${value}`;
    return `${year}`;
  }, [periodType, year, value]);

  const years = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [currentYear]);

  const inputClass =
    'border border-border rounded-2xl px-3 py-2.5 text-sm bg-white text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  const evaluatedSnapshots = useMemo(
    () => snapshots.filter((item) => item.isSubjectToEvaluation),
    [snapshots],
  );

  const fetchSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      const res = await api.get('/kpis', {
        params: {
          periodType,
          periodLabel,
        },
      });
      setSnapshots(res.data || []);
    } catch {
      toast.error('تعذر تحميل مؤشرات الأداء');
    } finally {
      setLoadingSnapshots(false);
    }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await api.get('/kpis/assignments', {
        params: {
          periodType,
          year: Number(year),
          value: periodType === 'YEARLY' ? undefined : Number(value),
        },
      });

      const rows = (res.data?.rows || []).map((row) => ({
        ...row,
        assignedCoursesCountInput:
          row.assignedCoursesCount === null || row.assignedCoursesCount === undefined
            ? ''
            : String(row.assignedCoursesCount),
        notesInput: row.notes || '',
      }));

      setAssignmentRows(rows);
    } catch {
      toast.error('تعذر تحميل سجل الإسناد');
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchSnapshots();
    setSelectedSnapshot(null);
    setNote('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, periodLabel]);

  const handleCalculate = async () => {
    setLoadingCalculation(true);
    try {
      await api.post('/kpis/calculate', {
        periodType,
        year: Number(year),
        value: periodType === 'YEARLY' ? undefined : Number(value),
      });
      toast.success('تم احتساب مؤشرات الأداء');
      await fetchSnapshots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر احتساب مؤشرات الأداء');
    } finally {
      setLoadingCalculation(false);
    }
  };

  const handleOpenDetails = async (snapshot) => {
    try {
      const res = await api.get(
        `/kpis/${snapshot.userId}/${snapshot.periodType}/${snapshot.periodLabel}`,
      );
      setSelectedSnapshot(res.data);
      setNote('');
    } catch {
      toast.error('تعذر تحميل تفاصيل الموظف');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedSnapshot?.id) return;
    if (!note.trim()) {
      toast.error('اكتب الملاحظة أولًا');
      return;
    }

    setSavingNote(true);
    try {
      await api.post(`/kpis/${selectedSnapshot.id}/notes`, {
        userId: selectedSnapshot.userId,
        note: note.trim(),
      });

      toast.success('تم حفظ الملاحظة');

      const res = await api.get(
        `/kpis/${selectedSnapshot.userId}/${selectedSnapshot.periodType}/${selectedSnapshot.periodLabel}`,
      );
      setSelectedSnapshot(res.data);
      setNote('');
      fetchSnapshots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حفظ الملاحظة');
    } finally {
      setSavingNote(false);
    }
  };

  const handleAssignmentInputChange = (userId, field, newValue) => {
    setAssignmentRows((prev) =>
      prev.map((row) => (row.userId === userId ? { ...row, [field]: newValue } : row)),
    );
  };

  const handleSaveAssignment = async (row) => {
    const countValue = String(row.assignedCoursesCountInput ?? '').trim();

    if (countValue === '' || Number.isNaN(Number(countValue)) || Number(countValue) < 0) {
      toast.error('أدخل عددًا صحيحًا للدورات المسندة');
      return;
    }

    setSavingAssignments((prev) => ({ ...prev, [row.userId]: true }));
    try {
      await api.post('/kpis/assignments', {
        userId: row.userId,
        periodType,
        year: Number(year),
        value: periodType === 'YEARLY' ? undefined : Number(value),
        assignedCoursesCount: Number(countValue),
        notes: row.notesInput || '',
      });

      toast.success(`تم حفظ إسناد ${row.employeeName}`);
      await fetchAssignments();
      await fetchSnapshots();

      if (
        selectedSnapshot &&
        selectedSnapshot.userId === row.userId &&
        selectedSnapshot.periodType === periodType &&
        selectedSnapshot.periodLabel === periodLabel
      ) {
        const res = await api.get(`/kpis/${row.userId}/${periodType}/${periodLabel}`);
        setSelectedSnapshot(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حفظ سجل الإسناد');
    } finally {
      setSavingAssignments((prev) => ({ ...prev, [row.userId]: false }));
    }
  };

  const topPerformer = evaluatedSnapshots.length ? evaluatedSnapshots[0] : null;
  const lowPerformer = evaluatedSnapshots.length
    ? evaluatedSnapshots[evaluatedSnapshots.length - 1]
    : null;

  const averageScore = evaluatedSnapshots.length
    ? formatNumber(
        evaluatedSnapshots.reduce((sum, item) => sum + Number(item.finalScore || 0), 0) /
          evaluatedSnapshots.length,
      )
    : '-';

  const totalAssignedCourses = assignmentRows.reduce(
    (sum, row) => sum + Number(row.assignedCoursesCount || 0),
    0,
  );
  const totalActualCourses = assignmentRows.reduce(
    (sum, row) => sum + Number(row.actualCoursesCount || 0),
    0,
  );
  const totalMissingCourses = assignmentRows.reduce(
    (sum, row) => sum + Number(row.missingCoursesCount || 0),
    0,
  );

  const committedCount = evaluatedSnapshots.filter(
    (item) => item.commitmentStatus === 'COMMITTED',
  ).length;

  const disciplinedCount = evaluatedSnapshots.filter(
    (item) => item.disciplineStatus === 'DISCIPLINED',
  ).length;

  const nonEvaluatedCount = snapshots.filter((item) => !item.isSubjectToEvaluation).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-5 shadow-card">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-primary">مؤشرات الأداء</h1>
              <p className="mt-1 text-sm text-text-soft">
                متابعة الإسناد، تقييم الأداء، وقراءة واضحة لحالة كل مستخدم
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-soft">نوع الفترة</label>
                <select
                  value={periodType}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPeriodType(next);
                    if (next === 'MONTHLY') setValue(new Date().getMonth() + 1);
                    if (next === 'QUARTERLY') setValue(1);
                    if (next === 'YEARLY') setValue(1);
                  }}
                  className={inputClass}
                >
                  {periodTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-soft">السنة</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={inputClass}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {periodType === 'MONTHLY' && (
                <div>
                  <label className="mb-1 block text-xs text-text-soft">الشهر</label>
                  <select
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className={inputClass}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {periodType === 'QUARTERLY' && (
                <div>
                  <label className="mb-1 block text-xs text-text-soft">الربع</label>
                  <select
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className={inputClass}
                  >
                    {quarterOptions.map((q) => (
                      <option key={q.value} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleCalculate}
                disabled={loadingCalculation}
                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
              >
                {loadingCalculation ? 'جاري الاحتساب...' : 'احتساب المؤشرات'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          <SummaryCard title="الفترة الحالية" value={periodLabel} />
          <SummaryCard title="المستخدمون المقيمون" value={evaluatedSnapshots.length} />
          <SummaryCard title="غير خاضعين للتقييم" value={nonEvaluatedCount} tone="gray" />
          <SummaryCard title="إجمالي الدورات المسندة" value={totalAssignedCourses} />
          <SummaryCard title="إجمالي الدورات الفعلية" value={totalActualCourses} />
          <SummaryCard
            title="فجوة التسجيل"
            value={totalMissingCourses}
            tone={totalMissingCourses > 0 ? 'red' : 'green'}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-card xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-primary">التحليل البصري للأداء</h2>
              <Badge tone="gray">{periodLabel}</Badge>
            </div>

            <div className="space-y-4">
              <HorizontalBar
                label="متوسط الدرجة"
                value={evaluatedSnapshots.length ? Number(averageScore) : 0}
                colorClass="bg-primary"
              />
              <HorizontalBar
                label="نسبة الالتزام العامة"
                value={evaluatedSnapshots.length ? (committedCount / evaluatedSnapshots.length) * 100 : 0}
                colorClass="bg-emerald-500"
              />
              <HorizontalBar
                label="نسبة الانضباط العامة"
                value={evaluatedSnapshots.length ? (disciplinedCount / evaluatedSnapshots.length) * 100 : 0}
                colorClass="bg-cyan-500"
              />
              <HorizontalBar
                label="نسبة تغطية الإسناد"
                value={totalAssignedCourses ? (totalActualCourses / totalAssignedCourses) * 100 : 0}
                colorClass="bg-amber-500"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-5 shadow-card">
            <h2 className="mb-4 text-lg font-extrabold text-primary">ملخص سريع</h2>
            <div className="space-y-3">
              <SmallMetric
                label="الأعلى أداءً"
                value={
                  topPerformer
                    ? `${topPerformer.user?.firstName || ''} ${topPerformer.user?.lastName || ''}`.trim()
                    : '-'
                }
                tone="text-primary"
              />
              <SmallMetric
                label="الأقل أداءً"
                value={
                  lowPerformer
                    ? `${lowPerformer.user?.firstName || ''} ${lowPerformer.user?.lastName || ''}`.trim()
                    : '-'
                }
                tone="text-danger"
              />
              <SmallMetric label="متوسط الدرجة" value={averageScore} tone="text-primary" />
              <SmallMetric label="عدد الملتزمين" value={committedCount} tone="text-emerald-700" />
              <SmallMetric label="عدد المنضبطين" value={disciplinedCount} tone="text-cyan-700" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-5 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-primary">سجل إسناد الدورات</h2>
              <p className="mt-1 text-sm text-text-soft">
                إدخال سريع ومختصر، وكل مستخدم يظهر كبطاقة مستقلة بدل الجدول الطويل
              </p>
            </div>
            <Badge tone="gray">{periodLabel}</Badge>
          </div>

          {loadingAssignments ? (
            <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center text-text-soft">
              جاري تحميل سجل الإسناد...
            </div>
          ) : assignmentRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center text-text-soft">
              لا توجد بيانات مستخدمين لهذه الفترة
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {assignmentRows.map((row) => (
                <div key={row.userId} className="rounded-3xl border border-border bg-background p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-text-main">{row.employeeName}</div>
                      <div className="mt-1 text-xs text-text-soft">{row.projectName}</div>
                    </div>
                    <Badge tone="gray">{row.periodLabel}</Badge>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-white p-3">
                      <div className="text-[11px] font-bold text-text-soft">الفعلي</div>
                      <div className="mt-1 text-xl font-extrabold text-primary">
                        {row.actualCoursesCount}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-3">
                      <div className="text-[11px] font-bold text-text-soft">المسند</div>
                      <input
                        type="number"
                        min="0"
                        value={row.assignedCoursesCountInput}
                        onChange={(e) =>
                          handleAssignmentInputChange(
                            row.userId,
                            'assignedCoursesCountInput',
                            e.target.value,
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-center text-base font-extrabold text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge tone={toneByCoverage(row.courseRegistrationCoverageRate)}>
                      التغطية: {formatNumber(row.courseRegistrationCoverageRate)}%
                    </Badge>

                    {row.missingCoursesCount > 0 ? (
                      <Badge tone="red">ناقص {row.missingCoursesCount}</Badge>
                    ) : (
                      <Badge tone="green">مطابق</Badge>
                    )}

                    {row.extraCoursesCount > 0 ? (
                      <Badge tone="amber">زيادة {row.extraCoursesCount}</Badge>
                    ) : null}
                  </div>

                  <textarea
                    value={row.notesInput}
                    onChange={(e) =>
                      handleAssignmentInputChange(row.userId, 'notesInput', e.target.value)
                    }
                    className="mb-4 min-h-[78px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="ملاحظات مختصرة"
                  />

                  <button
                    onClick={() => handleSaveAssignment(row)}
                    disabled={!!savingAssignments[row.userId]}
                    className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                  >
                    {savingAssignments[row.userId] ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-extrabold text-primary">نتائج الموظفين</h2>
              <p className="mt-1 text-sm text-text-soft">
                عرض واضح للدرجة، الالتزام، الانضباط، والتغطية
              </p>
            </div>
            <Badge tone="gray">{periodLabel}</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background text-text-soft">
                <tr>
                  <th className="px-4 py-3 text-right font-bold">الموظف</th>
                  <th className="px-4 py-3 text-right font-bold">المشروع</th>
                  <th className="px-4 py-3 text-right font-bold">المسند</th>
                  <th className="px-4 py-3 text-right font-bold">الفعلي</th>
                  <th className="px-4 py-3 text-right font-bold">التغطية</th>
                  <th className="px-4 py-3 text-right font-bold">الالتزام</th>
                  <th className="px-4 py-3 text-right font-bold">الانضباط</th>
                  <th className="px-4 py-3 text-right font-bold">الدرجة</th>
                  <th className="px-4 py-3 text-right font-bold">التصنيف</th>
                  <th className="px-4 py-3 text-right font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loadingSnapshots ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-10 text-center text-text-soft">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : snapshots.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-10 text-center text-text-soft">
                      لا توجد نتائج لهذه الفترة
                    </td>
                  </tr>
                ) : (
                  snapshots.map((item) => (
                    <tr key={item.id} className="border-t border-border hover:bg-background transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-text-main">
                          {item.user?.firstName} {item.user?.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-main">
                        {item.user?.operationalProject?.name || '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-text-main">
                        {item.assignedCoursesCount ?? 0}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">
                        {item.actualCoursesCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={toneByCoverage(item.courseRegistrationCoverageRate)}>
                          {formatNumber(item.courseRegistrationCoverageRate)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={toneByCommitment(item.commitmentStatus)}>
                          {item.commitmentStatusLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={toneByDiscipline(item.disciplineStatus)}>
                          {item.disciplineStatusLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-primary">
                        {item.isSubjectToEvaluation ? formatNumber(item.finalScore) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={toneByPerformance(item)}>
                          {item.performanceLevelLabel || formatLevel(item.performanceLevel)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleOpenDetails(item)}
                          className="rounded-2xl border border-primary px-3 py-1.5 font-bold text-primary transition hover:bg-primary-light"
                        >
                          التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedSnapshot && (
          <div className="space-y-5 rounded-3xl border border-border bg-white p-5 shadow-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-primary">
                  {selectedSnapshot.user?.firstName} {selectedSnapshot.user?.lastName}
                </h3>
                <p className="mt-1 text-sm text-text-soft">
                  {selectedSnapshot.user?.operationalProject?.name || '-'} — {selectedSnapshot.periodLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone={toneByPerformance(selectedSnapshot)}>
                  {selectedSnapshot.performanceLevelLabel}
                </Badge>
                <Badge tone={toneByCommitment(selectedSnapshot.commitmentStatus)}>
                  {selectedSnapshot.commitmentStatusLabel}
                </Badge>
                <Badge tone={toneByDiscipline(selectedSnapshot.disciplineStatus)}>
                  {selectedSnapshot.disciplineStatusLabel}
                </Badge>
                <Badge tone="blue">
                  الدرجة: {selectedSnapshot.isSubjectToEvaluation ? formatNumber(selectedSnapshot.finalScore) : '-'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard title="الدورات المسندة" value={selectedSnapshot.assignedCoursesCount ?? 0} />
              <SummaryCard title="الدورات الفعلية" value={selectedSnapshot.actualCoursesCount ?? 0} />
              <SummaryCard
                title="الدورات غير المسجلة"
                value={selectedSnapshot.missingCoursesCount ?? 0}
                tone={Number(selectedSnapshot.missingCoursesCount) > 0 ? 'red' : 'green'}
              />
              <SummaryCard
                title="نسبة التغطية"
                value={`${formatNumber(selectedSnapshot.courseRegistrationCoverageRate)}%`}
                tone={toneByCoverage(selectedSnapshot.courseRegistrationCoverageRate) === 'green' ? 'green' : toneByCoverage(selectedSnapshot.courseRegistrationCoverageRate) === 'amber' ? 'amber' : 'red'}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-3xl border border-border p-4">
                <h4 className="mb-4 text-lg font-extrabold text-primary">الإسناد والتسجيل</h4>
                <div className="space-y-3">
                  <SmallMetric label="عدد الدورات المسندة" value={selectedSnapshot.assignedCoursesCount ?? 0} />
                  <SmallMetric label="عدد الدورات الفعلية" value={selectedSnapshot.actualCoursesCount ?? 0} />
                  <SmallMetric
                    label="الدورات غير المسجلة"
                    value={selectedSnapshot.missingCoursesCount ?? 0}
                    tone="text-danger"
                  />
                  <SmallMetric
                    label="نسبة التغطية"
                    value={`${formatNumber(selectedSnapshot.courseRegistrationCoverageRate)}%`}
                    tone="text-primary"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border p-4">
                <h4 className="mb-4 text-lg font-extrabold text-primary">الإنجاز</h4>
                <div className="space-y-3">
                  <SmallMetric label="العناصر المطلوبة" value={selectedSnapshot.requiredElementsCount} />
                  <SmallMetric label="العناصر المقدمة" value={selectedSnapshot.submittedElementsCount} />
                  <SmallMetric label="العناصر المكتملة" value={selectedSnapshot.completedElementsCount} />
                  <SmallMetric
                    label="نسبة الإنجاز"
                    value={`${formatNumber(selectedSnapshot.closureCompletionRate)}%`}
                    tone="text-primary"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border p-4">
                <h4 className="mb-4 text-lg font-extrabold text-primary">الجودة</h4>
                <div className="space-y-3">
                  <SmallMetric
                    label="اعتماد من أول مرة"
                    value={`${formatNumber(selectedSnapshot.firstPassApprovalRate)}%`}
                  />
                  <SmallMetric
                    label="معدل الإعادة"
                    value={`${formatNumber(selectedSnapshot.returnRate)}%`}
                  />
                  <SmallMetric
                    label="معدل الرفض"
                    value={`${formatNumber(selectedSnapshot.rejectRate)}%`}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border p-4">
                <h4 className="mb-4 text-lg font-extrabold text-primary">السرعة والانضباط</h4>
                <div className="space-y-3">
                  <SmallMetric
                    label="متوسط وقت التقديم"
                    value={`${formatNumber(selectedSnapshot.avgElementSubmissionHours)} ساعة`}
                  />
                  <SmallMetric
                    label="العناصر المتأخرة"
                    value={`${formatNumber(selectedSnapshot.overdueElementsRate)}%`}
                  />
                  <SmallMetric
                    label="العناصر المعلقة"
                    value={`${formatNumber(selectedSnapshot.stalePendingElementsRate)}%`}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border p-4">
              <h4 className="mb-4 text-lg font-extrabold text-primary">التحليل البصري للمستخدم</h4>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <HorizontalBar
                  label="التغطية"
                  value={selectedSnapshot.courseRegistrationCoverageRate}
                  colorClass="bg-cyan-500"
                />
                <HorizontalBar
                  label="الإنجاز"
                  value={selectedSnapshot.closureCompletionRate}
                  colorClass="bg-primary"
                />
                <HorizontalBar
                  label="اعتماد من أول مرة"
                  value={selectedSnapshot.firstPassApprovalRate}
                  colorClass="bg-emerald-500"
                />
                <HorizontalBar
                  label="معدل الانضباط"
                  value={100 - Number(selectedSnapshot.overdueElementsRate || 0)}
                  colorClass="bg-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-border p-4">
              <h4 className="font-extrabold text-text-main">ملاحظات المدير</h4>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[110px] w-full rounded-2xl border border-border p-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="اكتب ملاحظة مهنية عن أداء المستخدم خلال هذه الفترة"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="rounded-2xl bg-primary px-5 py-2.5 font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {savingNote ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {selectedSnapshot.notes?.length ? (
                  selectedSnapshot.notes.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-background p-3">
                      <div className="text-sm text-text-main">{item.note}</div>
                      <div className="mt-2 text-[11px] text-text-soft">
                        {item.manager?.firstName} {item.manager?.lastName} —{' '}
                        {new Date(item.createdAt).toLocaleString('ar-SA')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-text-soft">لا توجد ملاحظات حتى الآن</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}