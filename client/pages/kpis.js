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

function formatNumber(value) {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(2);
}

function Badge({ children, tone = 'default' }) {
  const tones = {
    green: 'bg-emerald-50 text-success border-emerald-200',
    blue: 'bg-primary-light text-primary border-primary/20',
    amber: 'bg-amber-50 text-warning border-amber-200',
    red: 'bg-red-50 text-danger border-danger/20',
    gray: 'bg-background text-text-main border-border',
    default: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}

function SummaryCard({ title, value, subtext }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-card">
      <div className="mb-1 text-xs font-medium text-text-soft">{title}</div>
      <div className="text-2xl font-extrabold text-primary">{value}</div>
      {subtext ? <div className="mt-2 text-xs text-text-soft">{subtext}</div> : null}
    </div>
  );
}

export default function KpisPage() {
  const currentYear = new Date().getFullYear();
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [year, setYear] = useState(currentYear);
  const [value, setValue] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const periodLabel = useMemo(() => {
    if (periodType === 'MONTHLY') {
      return `${year}-${String(value).padStart(2, '0')}`;
    }
    if (periodType === 'QUARTERLY') {
      return `${year}-Q${value}`;
    }
    return `${year}`;
  }, [periodType, year, value]);

  const years = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [currentYear]);

  const fetchSnapshots = async () => {
    setLoadingTable(true);
    try {
      const res = await api.get('/kpis', {
        params: {
          periodType,
          periodLabel,
        },
      });
      setSnapshots(res.data || []);
    } catch (err) {
      toast.error('تعذر تحميل مؤشرات الأداء');
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, periodLabel]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await api.post('/kpis/calculate', {
        periodType,
        year: Number(year),
        value: periodType === 'YEARLY' ? undefined : Number(value),
      });
      toast.success('تم احتساب مؤشرات الأداء');
      fetchSnapshots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر احتساب مؤشرات الأداء');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (snapshot) => {
    try {
      const res = await api.get(
        `/kpis/${snapshot.userId}/${snapshot.periodType}/${snapshot.periodLabel}`,
      );
      setSelectedSnapshot(res.data);
      setNote('');
    } catch (err) {
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

  const topPerformer = snapshots[0];
  const lowPerformer = snapshots.length ? snapshots[snapshots.length - 1] : null;
  const averageScore = snapshots.length
    ? formatNumber(
        snapshots.reduce((sum, item) => sum + Number(item.finalScore || 0), 0) /
          snapshots.length,
      )
    : '-';

  const inputClass =
    'border border-border rounded-2xl px-3 py-2.5 text-sm bg-white text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-5 shadow-card">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-primary">مؤشرات الأداء KPI</h1>
              <p className="mt-1 text-sm text-text-soft">
                لوحة المدير لقياس الأداء التشغيلي وجودة إغلاق الدورات ومتابعة الموظفين
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
                disabled={loading}
                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
              >
                {loading ? 'جاري الاحتساب...' : 'احتساب المؤشرات'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="الفترة الحالية" value={periodLabel} />
          <SummaryCard title="عدد الموظفين" value={snapshots.length} />
          <SummaryCard title="متوسط الدرجة" value={averageScore} />
          <SummaryCard
            title="الأعلى أداءً"
            value={topPerformer ? topPerformer.user?.firstName || topPerformer.userId : '-'}
            subtext={topPerformer ? `الدرجة: ${formatNumber(topPerformer.finalScore)}` : ''}
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-extrabold text-primary">نتائج الموظفين</h2>
              <p className="mt-1 text-sm text-text-soft">
                مقارنة مباشرة حسب المؤشرات المحسوبة للفترة المحددة
              </p>
            </div>

            {lowPerformer ? (
              <Badge tone="amber">
                أقل نتيجة: {lowPerformer.user?.firstName} {lowPerformer.user?.lastName} —{' '}
                {formatNumber(lowPerformer.finalScore)}
              </Badge>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background text-text-soft">
                <tr>
                  <th className="px-4 py-3 text-right font-bold">الموظف</th>
                  <th className="px-4 py-3 text-right font-bold">المشروع</th>
                  <th className="px-4 py-3 text-right font-bold">الدرجة</th>
                  <th className="px-4 py-3 text-right font-bold">التصنيف</th>
                  <th className="px-4 py-3 text-right font-bold">نسبة الإنجاز</th>
                  <th className="px-4 py-3 text-right font-bold">اعتماد من أول مرة</th>
                  <th className="px-4 py-3 text-right font-bold">معدل الإعادة</th>
                  <th className="px-4 py-3 text-right font-bold">معدل الرفض</th>
                  <th className="px-4 py-3 text-right font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loadingTable ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-10 text-center text-text-soft">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : snapshots.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-10 text-center text-text-soft">
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
                      <td className="px-4 py-3 font-extrabold text-primary">
                        {formatNumber(item.finalScore)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            item.performanceLevel === 'OUTSTANDING'
                              ? 'green'
                              : item.performanceLevel === 'VERY_GOOD'
                                ? 'blue'
                                : item.performanceLevel === 'GOOD'
                                  ? 'gray'
                                  : item.performanceLevel === 'NEEDS_IMPROVEMENT'
                                    ? 'amber'
                                    : 'red'
                          }
                        >
                          {formatLevel(item.performanceLevel)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-main">
                        {formatNumber(item.closureCompletionRate)}%
                      </td>
                      <td className="px-4 py-3 text-text-main">
                        {formatNumber(item.firstPassApprovalRate)}%
                      </td>
                      <td className="px-4 py-3 text-text-main">
                        {formatNumber(item.returnRate)}%
                      </td>
                      <td className="px-4 py-3 text-text-main">
                        {formatNumber(item.rejectRate)}%
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
                <h3 className="text-xl font-extrabold text-primary">
                  {selectedSnapshot.user?.firstName} {selectedSnapshot.user?.lastName}
                </h3>
                <p className="mt-1 text-sm text-text-soft">
                  {selectedSnapshot.user?.operationalProject?.name || '-'} —{' '}
                  {selectedSnapshot.periodLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone="green">الدرجة: {formatNumber(selectedSnapshot.finalScore)}</Badge>
                <Badge tone="blue">الإنتاجية: {formatNumber(selectedSnapshot.productivityScore)}</Badge>
                <Badge tone="amber">السرعة: {formatNumber(selectedSnapshot.speedScore)}</Badge>
                <Badge tone="gray">الجودة: {formatNumber(selectedSnapshot.qualityScore)}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="نسبة الإنجاز"
                value={`${formatNumber(selectedSnapshot.closureCompletionRate)}%`}
              />
              <SummaryCard
                title="إغلاق الدورات المستحقة"
                value={`${formatNumber(selectedSnapshot.dueCourseClosureRate)}%`}
              />
              <SummaryCard
                title="اعتماد من أول مرة"
                value={`${formatNumber(selectedSnapshot.firstPassApprovalRate)}%`}
              />
              <SummaryCard
                title="مستوى الأداء"
                value={formatLevel(selectedSnapshot.performanceLevel)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-3xl border border-border p-4">
                <h4 className="mb-3 font-extrabold text-text-main">المؤشرات التشغيلية</h4>
                <div className="space-y-2 text-sm text-text-main">
                  <div>العناصر المطلوبة: {selectedSnapshot.requiredElementsCount}</div>
                  <div>العناصر المكتملة: {selectedSnapshot.completedElementsCount}</div>
                  <div>العناصر المقدمة: {selectedSnapshot.submittedElementsCount}</div>
                  <div>العناصر المعتمدة: {selectedSnapshot.approvedElementsCount}</div>
                  <div>العناصر المعادة: {selectedSnapshot.returnedElementsCount}</div>
                  <div>العناصر المرفوضة: {selectedSnapshot.rejectedElementsCount}</div>
                </div>
              </div>

              <div className="rounded-3xl border border-border p-4">
                <h4 className="mb-3 font-extrabold text-text-main">مؤشرات السرعة والانضباط</h4>
                <div className="space-y-2 text-sm text-text-main">
                  <div>
                    متوسط تقديم العنصر: {formatNumber(selectedSnapshot.avgElementSubmissionHours)} ساعة
                  </div>
                  <div>
                    متوسط إعادة التقديم: {formatNumber(selectedSnapshot.avgResubmissionHours)} ساعة
                  </div>
                  <div>
                    متوسط تأخر إغلاق الدورة: {formatNumber(selectedSnapshot.avgCourseClosureDelayDays)} يوم
                  </div>
                  <div>
                    نسبة الدورات المتأخرة: {formatNumber(selectedSnapshot.overdueCoursesRate)}%
                  </div>
                  <div>
                    نسبة العناصر المتأخرة: {formatNumber(selectedSnapshot.overdueElementsRate)}%
                  </div>
                  <div>
                    العناصر المعلقة: {formatNumber(selectedSnapshot.stalePendingElementsRate)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-border p-4">
              <h4 className="font-extrabold text-text-main">ملاحظات المدير</h4>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[110px] w-full rounded-2xl border border-border p-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="اكتب ملاحظة مهنية عن أداء الموظف خلال هذه الفترة"
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