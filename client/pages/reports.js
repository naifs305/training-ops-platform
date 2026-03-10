import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import useAuth from '../context/AuthContext';
import api from '../lib/axios';

export default function ReportsPage() {
  const { activeRole } = useAuth();
  const [courses, setCourses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    projectId: '',
    status: '',
    city: '',
    courseType: '',
    locationType: '',
    startDateFrom: '',
    startDateTo: '',
    requiresAdvance: '',
    requiresRevenue: '',
    requiresAdvanceSettlement: '',
    requiresSupervisorCompensation: '',
    requiresTrainerCompensation: '',
  });

  useEffect(() => {
    if (activeRole === 'MANAGER') {
      fetchData();
    }
  }, [activeRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, projectsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/projects'),
      ]);
      setCourses(coursesRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        !filters.search ||
        course.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.code?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesProject =
        !filters.projectId || course.operationalProjectId === filters.projectId;

      const matchesStatus = !filters.status || course.status === filters.status;

      const matchesCity =
        !filters.city ||
        course.city?.toLowerCase().includes(filters.city.toLowerCase());

      const matchesCourseType =
        !filters.courseType || course.courseType === filters.courseType;

      const matchesLocationType =
        !filters.locationType ||
        course.locationType?.toLowerCase().includes(filters.locationType.toLowerCase());

      const matchesStartDateFrom =
        !filters.startDateFrom ||
        new Date(course.startDate) >= new Date(filters.startDateFrom);

      const matchesStartDateTo =
        !filters.startDateTo ||
        new Date(course.startDate) <= new Date(filters.startDateTo);

      const matchesRequiresAdvance =
        filters.requiresAdvance === '' ||
        String(course.requiresAdvance) === filters.requiresAdvance;

      const matchesRequiresRevenue =
        filters.requiresRevenue === '' ||
        String(course.requiresRevenue) === filters.requiresRevenue;

      const matchesRequiresAdvanceSettlement =
        filters.requiresAdvanceSettlement === '' ||
        String(course.requiresAdvanceSettlement) === filters.requiresAdvanceSettlement;

      const matchesRequiresSupervisorCompensation =
        filters.requiresSupervisorCompensation === '' ||
        String(course.requiresSupervisorCompensation) === filters.requiresSupervisorCompensation;

      const matchesRequiresTrainerCompensation =
        filters.requiresTrainerCompensation === '' ||
        String(course.requiresTrainerCompensation) === filters.requiresTrainerCompensation;

      return (
        matchesSearch &&
        matchesProject &&
        matchesStatus &&
        matchesCity &&
        matchesCourseType &&
        matchesLocationType &&
        matchesStartDateFrom &&
        matchesStartDateTo &&
        matchesRequiresAdvance &&
        matchesRequiresRevenue &&
        matchesRequiresAdvanceSettlement &&
        matchesRequiresSupervisorCompensation &&
        matchesRequiresTrainerCompensation
      );
    });
  }, [courses, filters]);

  const stats = useMemo(() => {
    return {
      total: filteredCourses.length,
      preparation: filteredCourses.filter((c) => c.status === 'PREPARATION').length,
      execution: filteredCourses.filter((c) => c.status === 'EXECUTION').length,
      awaiting: filteredCourses.filter((c) => c.status === 'AWAITING_CLOSURE').length,
      closed: filteredCourses.filter((c) => c.status === 'CLOSED').length,
    };
  }, [filteredCourses]);

  const getProjectName = (course) => {
    return (
      course.operationalProject?.name ||
      projects.find((p) => p.id === course.operationalProjectId)?.name ||
      '-'
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA');
  };

  const getStatusLabel = (status) => {
    const map = {
      PREPARATION: 'قيد الإعداد',
      EXECUTION: 'قيد التنفيذ',
      AWAITING_CLOSURE: 'بانتظار الإغلاق',
      CLOSED: 'مغلقة',
      ARCHIVED: 'مؤرشفة',
    };
    return map[status] || status;
  };

  const getBooleanLabel = (value) => (value ? 'نعم' : 'لا');

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');

    const data = filteredCourses.map((course) => ({
      'اسم الدورة': course.name || '',
      'الكود': course.code || '',
      'المشروع': getProjectName(course),
      'المدينة': course.city || '',
      'مقر التنفيذ': course.locationType || '',
      'نوع الدورة': course.courseType === 'internal' ? 'داخلية' : 'خارجية',
      'الحالة': getStatusLabel(course.status),
      'تاريخ البداية': formatDate(course.startDate),
      'تاريخ النهاية': formatDate(course.endDate),
      'عدد المتدربين': course.numTrainees || 0,
      'يتطلب سلفة مالية': getBooleanLabel(course.requiresAdvance),
      'يتطلب إيرادات': getBooleanLabel(course.requiresRevenue),
      'يتطلب تسوية سلفة': getBooleanLabel(course.requiresAdvanceSettlement),
      'يتطلب مستحقات مشرف': getBooleanLabel(course.requiresSupervisorCompensation),
      'يتطلب مستحقات مدرب': getBooleanLabel(course.requiresTrainerCompensation),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقارير');
    XLSX.writeFile(workbook, 'training-operations-reports.xlsx');
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.text('Training Operations Reports', 14, 15);

    const tableRows = filteredCourses.map((course) => [
      course.name || '-',
      course.code || '-',
      getProjectName(course),
      course.city || '-',
      course.locationType || '-',
      course.courseType === 'internal' ? 'Internal' : 'External',
      getStatusLabel(course.status),
      formatDate(course.startDate),
      formatDate(course.endDate),
      String(course.numTrainees || 0),
    ]);

    autoTable(doc, {
      startY: 22,
      head: [[
        'Course Name',
        'Code',
        'Project',
        'City',
        'Location',
        'Type',
        'Status',
        'Start Date',
        'End Date',
        'Trainees',
      ]],
      body: tableRows,
      styles: {
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [0, 108, 109],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [247, 247, 245],
      },
      margin: { top: 22, right: 10, bottom: 10, left: 10 },
    });

    doc.save('training-operations-reports.pdf');
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      projectId: '',
      status: '',
      city: '',
      courseType: '',
      locationType: '',
      startDateFrom: '',
      startDateTo: '',
      requiresAdvance: '',
      requiresRevenue: '',
      requiresAdvanceSettlement: '',
      requiresSupervisorCompensation: '',
      requiresTrainerCompensation: '',
    });
  };

  if (activeRole !== 'MANAGER') {
    return (
      <MainLayout>
        <div className="rounded-3xl border border-danger/20 bg-white p-6 text-danger shadow-card">
          غير مصرح لك بالدخول إلى هذه الصفحة.
        </div>
      </MainLayout>
    );
  }

  const inputClass =
    'w-full rounded-2xl border border-border bg-white p-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-primary">التقارير</h1>
              <p className="mt-1 text-sm text-text-soft">تقارير تشغيلية متقدمة للدورات التدريبية</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark"
              >
                تصدير Excel
              </button>
              <button
                onClick={exportToPDF}
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
              >
                تصدير PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="إجمالي النتائج" value={stats.total} />
          <StatCard title="قيد الإعداد" value={stats.preparation} />
          <StatCard title="قيد التنفيذ" value={stats.execution} />
          <StatCard title="بانتظار الإغلاق" value={stats.awaiting} />
          <StatCard title="مغلقة" value={stats.closed} />
        </div>

        <div className="rounded-3xl border border-border bg-white p-4 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-primary">الفلاتر</h2>
            <button
              onClick={resetFilters}
              className="rounded-2xl border border-border bg-white px-3 py-2 text-sm font-bold text-text-main transition hover:bg-background"
            >
              إعادة تعيين
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="بحث باسم الدورة أو الكود"
              className={inputClass}
            />

            <select
              name="projectId"
              value={filters.projectId}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">كل المشاريع</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">كل الحالات</option>
              <option value="PREPARATION">قيد الإعداد</option>
              <option value="EXECUTION">قيد التنفيذ</option>
              <option value="AWAITING_CLOSURE">بانتظار الإغلاق</option>
              <option value="CLOSED">مغلقة</option>
              <option value="ARCHIVED">مؤرشفة</option>
            </select>

            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder="المدينة"
              className={inputClass}
            />

            <select
              name="courseType"
              value={filters.courseType}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">كل أنواع الدورات</option>
              <option value="internal">داخلية</option>
              <option value="external">خارجية</option>
            </select>

            <input
              type="text"
              name="locationType"
              value={filters.locationType}
              onChange={handleChange}
              placeholder="مقر التنفيذ"
              className={inputClass}
            />

            <input
              type="date"
              name="startDateFrom"
              value={filters.startDateFrom}
              onChange={handleChange}
              className={inputClass}
            />

            <input
              type="date"
              name="startDateTo"
              value={filters.startDateTo}
              onChange={handleChange}
              className={inputClass}
            />

            <select
              name="requiresAdvance"
              value={filters.requiresAdvance}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">السلفة المالية: الكل</option>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>

            <select
              name="requiresRevenue"
              value={filters.requiresRevenue}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">الإيرادات: الكل</option>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>

            <select
              name="requiresAdvanceSettlement"
              value={filters.requiresAdvanceSettlement}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">تسوية السلفة: الكل</option>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>

            <select
              name="requiresSupervisorCompensation"
              value={filters.requiresSupervisorCompensation}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">مستحقات المشرف: الكل</option>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>

            <select
              name="requiresTrainerCompensation"
              value={filters.requiresTrainerCompensation}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">مستحقات المدرب: الكل</option>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-extrabold text-primary">نتائج التقرير</h2>
          </div>

          {loading ? (
            <div className="p-6 text-text-soft">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-background">
                  <tr className="text-right text-text-soft">
                    <th className="px-4 py-3 font-bold">اسم الدورة</th>
                    <th className="px-4 py-3 font-bold">الكود</th>
                    <th className="px-4 py-3 font-bold">المشروع</th>
                    <th className="px-4 py-3 font-bold">المدينة</th>
                    <th className="px-4 py-3 font-bold">مقر التنفيذ</th>
                    <th className="px-4 py-3 font-bold">النوع</th>
                    <th className="px-4 py-3 font-bold">الحالة</th>
                    <th className="px-4 py-3 font-bold">البداية</th>
                    <th className="px-4 py-3 font-bold">النهاية</th>
                    <th className="px-4 py-3 font-bold">المتدربون</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-text-soft">
                        لا توجد نتائج
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => (
                      <tr key={course.id} className="border-t border-border hover:bg-background transition">
                        <td className="px-4 py-3 font-bold text-text-main">{course.name || '-'}</td>
                        <td className="px-4 py-3 text-text-soft">{course.code || '-'}</td>
                        <td className="px-4 py-3 text-text-soft">{getProjectName(course)}</td>
                        <td className="px-4 py-3 text-text-soft">{course.city || '-'}</td>
                        <td className="px-4 py-3 text-text-soft">{course.locationType || '-'}</td>
                        <td className="px-4 py-3 text-text-soft">
                          {course.courseType === 'internal' ? 'داخلية' : 'خارجية'}
                        </td>
                        <td className="px-4 py-3 text-text-soft">{getStatusLabel(course.status)}</td>
                        <td className="px-4 py-3 text-text-soft">{formatDate(course.startDate)}</td>
                        <td className="px-4 py-3 text-text-soft">{formatDate(course.endDate)}</td>
                        <td className="px-4 py-3 text-text-soft">{course.numTrainees || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-card">
      <div className="mb-1 text-sm text-text-soft">{title}</div>
      <div className="text-2xl font-extrabold text-primary">{value}</div>
    </div>
  );
}