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
        .split(/\n|•|-|—|–|\d+\./g)
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
        ${items
          .map((item) => `<li>${this.escapeHtml(item)}</li>`)
          .join('')}
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

    const trainingEnvironmentRating =
      this.getRatingLabel(data.training_environment?.rating) || '-';

    const venueEvaluation =
      data.venue_evaluation ||
      this.getRatingLabel(data.program_evaluation?.rating) ||
      '-';

    const logisticsSupplies = Array.isArray(data.logistics_items)
      ? data.logistics_items.join(' - ')
      : data.logistics_items || data.logistics_support || '-';

    const positives = this.toListItems(data.positives || data.strengths || data.highlights);
    const negatives = this.toListItems(data.negatives || data.challenges || data.issues);
    const recommendations = this.toListItems(
      data.recommendations || data.suggestions || data.proposals,
    );

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير افتتاح دورة تدريبية</title>
  <style>
    @page {
      size: A4;
      margin: 18mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: "Cairo", Tahoma, Arial, sans-serif;
      background: #eef3f2;
      color: #1f2937;
      line-height: 1.9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 22px 26px 28px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 3px solid #016564;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }

    .brand-text {
      flex: 1;
    }

    .brand-title {
      margin: 0;
      color: #016564;
      font-size: 28px;
      font-weight: 800;
      line-height: 1.3;
    }

    .brand-subtitle {
      margin: 8px 0 0;
      color: #6b7280;
      font-size: 13px;
      font-weight: 600;
    }

    .logo {
      width: 180px;
      height: auto;
      object-fit: contain;
    }

    .title-box {
      margin: 18px 0 16px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #016564 0%, #498983 100%);
      color: #ffffff;
      border-radius: 16px;
    }

    .title-box h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
    }

    .title-box p {
      margin: 6px 0 0;
      font-size: 13px;
      opacity: 0.95;
    }

    .letter {
      margin: 18px 0 8px;
      font-size: 15px;
      color: #1f2937;
    }

    .section {
      margin-top: 18px;
      border: 1px solid #d6e2e0;
      border-radius: 18px;
      overflow: hidden;
    }

    .section-header {
      background: #f3f8f7;
      color: #016564;
      font-size: 17px;
      font-weight: 800;
      padding: 12px 16px;
      border-bottom: 1px solid #dce7e5;
    }

    .section-body {
      padding: 14px 16px 16px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .card {
      background: #fafcfb;
      border: 1px solid #e5ecea;
      border-radius: 14px;
      padding: 12px 14px;
      min-height: 82px;
    }

    .label {
      color: #6b7280;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .value {
      color: #111827;
      font-size: 15px;
      font-weight: 800;
      word-break: break-word;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #dce7e5;
      border-top: 4px solid #016564;
      border-radius: 16px;
      padding: 12px;
      text-align: center;
    }

    .stat-number {
      color: #016564;
      font-size: 24px;
      font-weight: 900;
      line-height: 1.2;
    }

    .stat-label {
      margin-top: 6px;
      color: #6b7280;
      font-size: 12px;
      font-weight: 700;
    }

    .paragraph {
      margin: 0;
      font-size: 14px;
    }

    .list {
      margin: 0;
      padding: 0 18px 0 0;
    }

    .list li {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .empty {
      color: #6b7280;
      font-size: 14px;
      font-weight: 600;
    }

    .footer-note {
      margin-top: 22px;
      padding: 14px 16px;
      background: #f8faf9;
      border-right: 4px solid #d0b284;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .closing {
      margin-top: 18px;
      font-size: 15px;
    }

    .signature {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px dashed #cfd8d6;
      color: #016564;
      font-weight: 800;
      font-size: 15px;
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
        نفيد سعادتكم بأنه تم – بفضل الله – افتتاح الدورة التدريبية الخارجية:
        "<strong>${this.escapeHtml(courseName)}</strong>"،
        والمنعقدة في مدينة <strong>${this.escapeHtml(city)}</strong>،
        وذلك ضمن الخطة التنفيذية المعتمدة للبرامج الخارجية لهذا العام.
      </p>
      <p class="paragraph">
        وقد باشر فريق إدارة عمليات التدريب الإشراف الميداني على انطلاق البرنامج،
        وتم التحقق من جاهزية القاعة التدريبية، وسلامة الترتيبات التنظيمية،
        واستقبال المشاركين بما يليق بمكانة الجامعة ورسالتها التدريبية.
      </p>
    </div>

    <div class="section">
      <div class="section-header">المعلومات الأساسية للدورة</div>
      <div class="section-body">
        <div class="grid">
          <div class="card">
            <div class="label">اسم الدورة التدريبية</div>
            <div class="value">${this.escapeHtml(courseName)}</div>
          </div>
          <div class="card">
            <div class="label">المشروع التشغيلي</div>
            <div class="value">${this.escapeHtml(projectName)}</div>
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
            <div class="label">المشرف الميداني</div>
            <div class="value">${this.escapeHtml(supervisor)}</div>
          </div>
          <div class="card">
            <div class="label">تاريخ رفع التقرير</div>
            <div class="value">${this.escapeHtml(this.formatDateTime(element.executionAt))}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">إحصائيات المشاركة</div>
      <div class="section-body">
        <div class="stat-grid">
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
        </div>
        <div style="height:12px"></div>
        <div class="grid">
          <div class="card">
            <div class="label">عدد المترجمين</div>
            <div class="value">${this.escapeHtml(translatorsCount)}</div>
          </div>
          <div class="card">
            <div class="label">تعليق مختصر</div>
            <div class="value">
              ${
                attendanceRate !== '-'
                  ? `نسبة حضور ${this.escapeHtml(attendanceRate)} تعكس مستوى الالتزام وجودة التنسيق المسبق`
                  : 'لا توجد بيانات كافية لإصدار تعليق على نسبة الحضور'
              }
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">تقييم المرافق والخدمات</div>
      <div class="section-body">
        <div class="grid">
          <div class="card">
            <div class="label">البيئة التدريبية</div>
            <div class="value">${this.escapeHtml(trainingEnvironmentRating)}</div>
          </div>
          <div class="card">
            <div class="label">تقييم مقر التدريب</div>
            <div class="value">${this.escapeHtml(venueEvaluation)}</div>
          </div>
          <div class="card" style="grid-column: 1 / -1;">
            <div class="label">التجهيزات اللوجستية</div>
            <div class="value">${this.escapeHtml(logisticsSupplies)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">الإيجابيات والملاحظات المميزة</div>
      <div class="section-body">
        ${this.renderList(positives, 'لا توجد إيجابيات مسجلة')}
      </div>
    </div>

    <div class="section">
      <div class="section-header">السلبيات والتحديات</div>
      <div class="section-body">
        ${this.renderList(negatives, 'لا توجد سلبيات أو تحديات مسجلة')}
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
      والرفع بأي مستجدات أو ملاحظات تنفيذية أولًا بأول.
      كما نؤكد التزامنا بتطبيق أعلى معايير الجودة في الإشراف والمتابعة
      لضمان تحقيق الأهداف التدريبية المرجوة.
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