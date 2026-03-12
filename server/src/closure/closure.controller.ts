import {
  Controller,
  Param,
  Body,
  Post,
  Put,
  Req,
  UseGuards,
  Get,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ClosureService } from './closure.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  SubmitReportDto,
  SubmitAdvanceDto,
  SubmitSettlementDto,
} from './dto/form.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Controller('closure')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClosureController {
  constructor(
    private closureService: ClosureService,
    private prisma: PrismaService,
  ) {}

  private getUserRole(req: any): string {
    const headerRole = req.headers['x-active-role'];
    const roles = req.user?.roles || [];

    if (headerRole && roles.includes(headerRole)) return headerRole;
    if (roles.includes('MANAGER')) return 'MANAGER';
    if (roles.includes('EMPLOYEE')) return 'EMPLOYEE';
    return roles[0] || 'EMPLOYEE';
  }

  private getRatingLabel(value?: string) {
    const map = {
      excellent: 'ممتاز',
      good: 'جيد',
      needs_improvement: 'يحتاج تحسين',
      weak: 'ضعيف',
      requires_development: 'يحتاج تطوير',
    };
    return map[value] || '-';
  }

  private getRatingClass(value?: string) {
    const map = {
      excellent: 'badge excellent',
      good: 'badge good',
      needs_improvement: 'badge improve',
      weak: 'badge weak',
      requires_development: 'badge develop',
    };
    return map[value || ''] || 'badge';
  }

  private formatDate(value?: string | Date | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('ar-SA');
  }

  private formatDateTime(value?: string | Date | null) {
    if (!value) return '-';
    return new Date(value).toLocaleString('ar-SA');
  }

  private formatLocationType(value?: string | null) {
    const map = {
      INTERNAL: 'داخلي',
      EXTERNAL: 'خارجي',
      REMOTE: 'عن بُعد',
    };
    return map[value || ''] || value || '-';
  }

  private calculateDurationDays(startDate?: string | Date | null, endDate?: string | Date | null) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    if (Number.isNaN(diff) || diff < 0) return '-';
    return `${Math.floor(diff / (1000 * 60 * 60 * 24)) + 1} أيام عمل`;
  }

  private escapeHtml(value: any) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private toListItems(value: any): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || '').trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/\n|•|●|▪|◦|\d+\.\s*/g)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  private renderList(items: string[], emptyText = 'لا توجد بيانات') {
    if (!items.length) {
      return `<div class="empty">${this.escapeHtml(emptyText)}</div>`;
    }

    return `
      <ul class="list">
        ${items.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}
      </ul>
    `;
  }

  @Put(':id')
  async update(@Param('id') id, @Body() body: UpdateElementDto, @Req() req) {
    return this.closureService.updateStatus(
      id,
      body,
      req.user.userId,
      this.getUserRole(req),
    );
  }

  @Post(':id/report')
  async submitReport(@Param('id') id, @Body() dto: SubmitReportDto, @Req() req) {
    return this.closureService.submitReport(
      id,
      dto,
      req.user.userId,
      this.getUserRole(req),
    );
  }

  @Post(':id/advance')
  async submitAdvance(@Param('id') id, @Body() dto: SubmitAdvanceDto, @Req() req) {
    return this.closureService.submitAdvance(
      id,
      dto,
      req.user.userId,
      this.getUserRole(req),
    );
  }

  @Post(':id/settlement')
  async submitSettlement(
    @Param('id') id,
    @Body() dto: SubmitSettlementDto,
    @Req() req,
  ) {
    return this.closureService.submitSettlement(
      id,
      dto,
      req.user.userId,
      this.getUserRole(req),
    );
  }

  @Get(':id/export')
  async exportReport(@Param('id') id, @Res() res: Response) {
    const element = await this.closureService.getElementDetails(id);

    if (!element) {
      throw new BadRequestException('العنصر غير موجود');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: element.courseId },
      include: {
        primaryEmployee: true,
        operationalProject: true,
      },
    });

    if (!course) {
      throw new BadRequestException('الدورة غير موجودة');
    }

    const data = (element.formData || {}) as any;
    const info = data.generatedCourseInfo || {};

    const courseName = info.name || course.name || '-';
    const city = info.city || course.city || '-';
    const locationType = this.formatLocationType(info.locationType || course.locationType);
    const projectName = info.project || course.operationalProject?.name || '-';
    const supervisor =
      info.supervisor ||
      `${course.primaryEmployee?.firstName || ''} ${course.primaryEmployee?.lastName || ''}`.trim() ||
      '-';
    const startDate = info.startDate || this.formatDate(course.startDate);
    const endDate = info.endDate || this.formatDate(course.endDate);
    const duration = this.calculateDurationDays(course.startDate, course.endDate);

    const registeredCount =
      data.registered_trainees_count ??
      info.traineesCount ??
      course.numTrainees ??
      '-';

    const actualAttendance =
      data.actual_attendance_count ??
      data.attendance_count ??
      registeredCount;

    const attendanceRate =
      data.attendance_rate ??
      (typeof registeredCount === 'number' &&
      typeof actualAttendance === 'number' &&
      registeredCount > 0
        ? `${((actualAttendance / registeredCount) * 100).toFixed(1)}%`
        : '-');

    const trainersCount = data.trainers_count ?? '-';
    const translatorsCount = data.translators_count ?? '-';

    const recommendations = this.toListItems(
      data.recommendations || data.suggestions || data.proposals,
    );

    const evaluationSections = [
      {
        title: 'تقييم البيئة التدريبية',
        rating: data.training_environment?.rating,
        comment: data.training_environment?.comment,
      },
      {
        title: 'تقييم المدرب والتزامه وانضباطه',
        rating: data.trainer_evaluation?.rating,
        comment: data.trainer_evaluation?.comment,
      },
      {
        title: 'تقييم المادة العلمية واكتمالها على منصة LMS',
        rating: data.lms_content_evaluation?.rating,
        comment: data.lms_content_evaluation?.comment,
      },
      {
        title: 'تقييم المتدربين وانضباطهم والتزامهم',
        rating: data.trainee_evaluation?.rating,
        comment: data.trainee_evaluation?.comment,
      },
      {
        title: 'التقييم العام للبرنامج',
        rating: data.program_evaluation?.rating,
        comment: data.program_evaluation?.comment,
      },
    ];

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تقرير افتتاح دورة تدريبية</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

    @page {
      size: A4;
      margin: 14mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: 'Cairo', Tahoma, Arial, sans-serif;
      background: #eef3f2;
      color: #1f2937;
      line-height: 1.65;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 16px 18px 20px;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 3px solid #016564;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }

    .brand-text {
      flex: 1;
    }

    .brand-title {
      margin: 0;
      color: #016564;
      font-size: 24px;
      font-weight: 800;
      line-height: 1.2;
    }

    .brand-subtitle {
      margin: 4px 0 0;
      color: #6b7280;
      font-size: 11px;
      font-weight: 700;
    }

    .logo {
      width: 150px;
      height: auto;
      object-fit: contain;
    }

    .title-box {
      margin: 10px 0 12px;
      padding: 12px 14px;
      background: linear-gradient(135deg, #016564 0%, #498983 100%);
      color: #ffffff;
      border-radius: 14px;
    }

    .title-box h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      line-height: 1.35;
    }

    .title-box p {
      margin: 4px 0 0;
      font-size: 11px;
      opacity: 0.96;
    }

    .letter {
      margin: 8px 0 4px;
      font-size: 13px;
    }

    .paragraph {
      margin: 0 0 6px;
    }

    .section {
      margin-top: 12px;
      border: 1px solid #d6e2e0;
      border-radius: 16px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .section-header {
      background: #f3f8f7;
      color: #016564;
      font-size: 15px;
      font-weight: 800;
      padding: 10px 14px;
      border-bottom: 1px solid #dce7e5;
    }

    .section-body {
      padding: 12px 14px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .card {
      background: #fafcfb;
      border: 1px solid #e5ecea;
      border-radius: 12px;
      padding: 10px 12px;
      min-height: 68px;
    }

    .label {
      color: #6b7280;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .value {
      color: #111827;
      font-size: 13px;
      font-weight: 800;
      word-break: break-word;
      line-height: 1.5;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #dce7e5;
      border-top: 4px solid #016564;
      border-radius: 14px;
      padding: 10px;
      text-align: center;
      min-height: 82px;
    }

    .stat-number {
      color: #016564;
      font-size: 20px;
      font-weight: 900;
      line-height: 1.1;
    }

    .stat-label {
      margin-top: 5px;
      color: #6b7280;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.4;
    }

    .evaluations-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .evaluation-card {
      border: 1px solid #e5ecea;
      border-radius: 14px;
      padding: 12px;
      background: #fcfdfd;
      page-break-inside: avoid;
    }

    .evaluation-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }

    .evaluation-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      border: 1px solid #d1d5db;
      background: #f8fafc;
      color: #334155;
      white-space: nowrap;
    }

    .badge.excellent {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }

    .badge.good {
      background: #ecfeff;
      color: #0f766e;
      border-color: #99f6e4;
    }

    .badge.improve {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }

    .badge.weak {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .badge.develop {
      background: #fdf8f1;
      color: #8c6b2a;
      border-color: #ead8b6;
    }

    .note-box {
      border-right: 4px solid #d0b284;
      background: #fcfaf6;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }

    .list {
      margin: 0;
      padding: 0 18px 0 0;
    }

    .list li {
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
    }

    .empty {
      color: #6b7280;
      font-size: 13px;
      font-weight: 600;
    }

    .footer-note {
      margin-top: 14px;
      padding: 12px 14px;
      background: #f8faf9;
      border-right: 4px solid #d0b284;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }

    .closing {
      margin-top: 12px;
      font-size: 14px;
    }

    .signature {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px dashed #cfd8d6;
      color: #016564;
      font-weight: 800;
      font-size: 14px;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .page {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand-text">
        <h1 class="brand-title">تقرير افتتاح دورة تدريبية</h1>
        <p class="brand-subtitle">نظام إقفال الدورات التدريبية — جامعة نايف العربية للعلوم الأمنية</p>
      </div>
      <img
        class="logo"
        src="https://nauss.edu.sa/Style%20Library/ar-sa/Styles/images/home/Logo.svg"
        alt="شعار جامعة نايف"
      />
    </div>

    <div class="title-box">
      <h2>${this.escapeHtml(courseName)}</h2>
      <p>تقرير تنفيذي ميداني لافتتاح البرنامج ومتابعة الجاهزية التشغيلية</p>
    </div>

    <div class="letter">
      <p class="paragraph"><strong>سعادة وكيل الجامعة للتدريب – سلّمه الله</strong></p>
      <p class="paragraph">السلام عليكم ورحمة الله وبركاته،</p>
      <p class="paragraph">تحية طيبة وبعد،،</p>
      <p class="paragraph">
        نفيد سعادتكم بأنه تم – بفضل الله – افتتاح الدورة التدريبية:
        "<strong>${this.escapeHtml(courseName)}</strong>"،
        والمنعقدة في مدينة <strong>${this.escapeHtml(city)}</strong>،
        وذلك ضمن الخطة التنفيذية المعتمدة للبرامج التدريبية.
      </p>
      <p class="paragraph">
        وقد باشر فريق إدارة عمليات التدريب الإشراف الميداني على انطلاق البرنامج،
        وتم التحقق من الجاهزية التشغيلية والتنظيمية، واستقبال المشاركين بما يليق بمكانة الجامعة ورسالتها التدريبية.
      </p>
    </div>

    <div class="section">
      <div class="section-header">المعلومات الأساسية للدورة</div>
      <div class="section-body">
        <div class="info-grid">
          <div class="card">
            <div class="label">اسم الدورة</div>
            <div class="value">${this.escapeHtml(courseName)}</div>
          </div>
          <div class="card">
            <div class="label">المشروع التشغيلي</div>
            <div class="value">${this.escapeHtml(projectName)}</div>
          </div>
          <div class="card">
            <div class="label">المشرف الميداني</div>
            <div class="value">${this.escapeHtml(supervisor)}</div>
          </div>
          <div class="card">
            <div class="label">مكان الانعقاد</div>
            <div class="value">${this.escapeHtml(city)}</div>
          </div>
          <div class="card">
            <div class="label">مقر التنفيذ</div>
            <div class="value">${this.escapeHtml(locationType)}</div>
          </div>
          <div class="card">
            <div class="label">فترة التنفيذ</div>
            <div class="value">${this.escapeHtml(startDate)} - ${this.escapeHtml(endDate)}</div>
          </div>
          <div class="card">
            <div class="label">المدة</div>
            <div class="value">${this.escapeHtml(duration)}</div>
          </div>
          <div class="card">
            <div class="label">تاريخ رفع التقرير</div>
            <div class="value">${this.escapeHtml(this.formatDateTime(element.executionAt))}</div>
          </div>
          <div class="card">
            <div class="label">عدد المتدربين المسجلين بالنظام</div>
            <div class="value">${this.escapeHtml(info.traineesCount || course.numTrainees || '-')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">إحصائيات المشاركة</div>
      <div class="section-body">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${this.escapeHtml(registeredCount)}</div>
            <div class="stat-label">عدد المشاركين المسجلين</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.escapeHtml(actualAttendance)}</div>
            <div class="stat-label">عدد الحضور الفعلي</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.escapeHtml(attendanceRate)}</div>
            <div class="stat-label">نسبة الحضور</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.escapeHtml(trainersCount)}</div>
            <div class="stat-label">عدد المدربين</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.escapeHtml(translatorsCount)}</div>
            <div class="stat-label">عدد المترجمين</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">محاور التقييم المعتمدة</div>
      <div class="section-body">
        <div class="evaluations-grid">
          ${evaluationSections
            .map(
              (section) => `
                <div class="evaluation-card">
                  <div class="evaluation-head">
                    <div class="evaluation-title">${this.escapeHtml(section.title)}</div>
                    <span class="${this.getRatingClass(section.rating)}">${this.escapeHtml(
                      this.getRatingLabel(section.rating),
                    )}</span>
                  </div>
                  <div class="note-box">
                    ${this.escapeHtml(section.comment || 'لا توجد ملاحظات مسجلة في هذا المحور')}
                  </div>
                </div>
              `,
            )
            .join('')}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">التوصيات والمقترحات</div>
      <div class="section-body">
        ${this.renderList(recommendations, 'لا توجد توصيات مسجلة')}
      </div>
    </div>

    <div class="footer-note">
      نؤكد لسعادتكم استمرار المتابعة الميدانية اليومية حتى ختام البرنامج،
      والرفع بأي مستجدات أو ملاحظات تنفيذية أولًا بأول،
      مع الالتزام بتطبيق أعلى معايير الجودة في الإشراف والمتابعة لضمان تحقيق الأهداف التدريبية المرجوة.
    </div>

    <div class="closing">
      <p class="paragraph">وتفضلوا بقبول فائق الاحترام والتقدير،،،</p>
      <div class="signature">فريق عمل إدارة عمليات التدريب وكالة الجامعة للتدريب</div>
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}