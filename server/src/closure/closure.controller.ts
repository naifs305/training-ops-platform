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
import * as pdf from 'html-pdf';
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
    const attachments = Array.isArray(data.attachments) ? data.attachments : [];

    const htmlTemplate = `
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              direction: rtl;
              color: #1f2937;
              padding: 28px;
              font-size: 12px;
              line-height: 1.8;
            }
            .page {
              border: 1px solid #e5e7eb;
              border-radius: 14px;
              overflow: hidden;
            }
            .header {
              background: #016564;
              color: white;
              padding: 22px 24px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 6px 0 0 0;
              font-size: 13px;
              opacity: 0.95;
            }
            .section {
              padding: 18px 22px;
              border-top: 1px solid #e5e7eb;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #016564;
              margin-bottom: 12px;
            }
            .grid {
              width: 100%;
              border-collapse: collapse;
            }
            .grid td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              vertical-align: top;
            }
            .label {
              color: #6b7280;
              font-size: 11px;
              margin-bottom: 4px;
            }
            .value {
              font-weight: bold;
              color: #111827;
            }
            .box {
              background: #f8f9f9;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 10px;
            }
            .photos {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .photo {
              width: 160px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 6px;
            }
            .photo img {
              width: 100%;
              height: 110px;
              object-fit: cover;
              border-radius: 8px;
              display: block;
            }
            .footer-note {
              background: #fff7ed;
              border: 1px solid #fed7aa;
              border-radius: 10px;
              padding: 12px;
              color: #9a3412;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <h1>تقرير الدورة التدريبية</h1>
              <p>موجّه إلى سعادة وكيل التدريب</p>
            </div>

            <div class="section">
              <div class="section-title">بيانات الدورة</div>
              <table class="grid">
                <tr>
                  <td>
                    <div class="label">اسم الدورة</div>
                    <div class="value">${info.name || course.name || '-'}</div>
                  </td>
                  <td>
                    <div class="label">كود الدورة</div>
                    <div class="value">${info.code || course.code || '-'}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="label">المشروع التشغيلي</div>
                    <div class="value">${info.project || course.operationalProject?.name || '-'}</div>
                  </td>
                  <td>
                    <div class="label">المدينة</div>
                    <div class="value">${info.city || course.city || '-'}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="label">مقر التنفيذ</div>
                    <div class="value">${info.locationType || course.locationType || '-'}</div>
                  </td>
                  <td>
                    <div class="label">عدد المتدربين</div>
                    <div class="value">${info.traineesCount || course.numTrainees || '-'}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="label">تاريخ البداية</div>
                    <div class="value">${info.startDate || (course.startDate ? new Date(course.startDate).toLocaleDateString('ar-SA') : '-')}</div>
                  </td>
                  <td>
                    <div class="label">تاريخ النهاية</div>
                    <div class="value">${info.endDate || (course.endDate ? new Date(course.endDate).toLocaleDateString('ar-SA') : '-')}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="label">المشرف / المنسق</div>
                    <div class="value">${info.supervisor || `${course.primaryEmployee?.firstName || ''} ${course.primaryEmployee?.lastName || ''}`.trim() || '-'}</div>
                  </td>
                  <td>
                    <div class="label">تاريخ التقديم</div>
                    <div class="value">${element.executionAt ? new Date(element.executionAt).toLocaleString('ar-SA') : '-'}</div>
                  </td>
                </tr>
              </table>
            </div>

            <div class="section">
              <div class="section-title">تقييم المنسق</div>

              <div class="box">
                <div class="label">تقييم البيئة التدريبية</div>
                <div class="value">${this.getRatingLabel(data.training_environment?.rating)}</div>
                <div>${data.training_environment?.comment || '—'}</div>
              </div>

              <div class="box">
                <div class="label">تقييم المدرب والتزامه وانضباطه</div>
                <div class="value">${this.getRatingLabel(data.trainer_evaluation?.rating)}</div>
                <div>${data.trainer_evaluation?.comment || '—'}</div>
              </div>

              <div class="box">
                <div class="label">تقييم المادة العلمية واكتمالها على منصة LMS</div>
                <div class="value">${this.getRatingLabel(data.lms_content_evaluation?.rating)}</div>
                <div>${data.lms_content_evaluation?.comment || '—'}</div>
              </div>

              <div class="box">
                <div class="label">تقييم المتدربين وانضباطهم والتزامهم</div>
                <div class="value">${this.getRatingLabel(data.trainee_evaluation?.rating)}</div>
                <div>${data.trainee_evaluation?.comment || '—'}</div>
              </div>

              <div class="box">
                <div class="label">التقييم العام للبرنامج</div>
                <div class="value">${this.getRatingLabel(data.program_evaluation?.rating)}</div>
                <div>${data.program_evaluation?.comment || '—'}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">ملاحظات إضافية</div>
              <div class="box">${data.other_notes || 'لا توجد ملاحظات إضافية'}</div>
            </div>

            ${
              attachments.length
                ? `
            <div class="section">
              <div class="section-title">الصور الداعمة</div>
              <div class="photos">
                ${attachments
                  .map(
                    (file: any) => `
                  <div class="photo">
                    <img src="${file.content}" alt="${file.name || 'attachment'}" />
                  </div>
                `,
                  )
                  .join('')}
              </div>
            </div>
            `
                : ''
            }

            <div class="section">
              <div class="footer-note">
                أقرّ بأن جميع البيانات الواردة في هذا التقرير صحيحة وحقيقية وتمثل ما جرى في البرنامج التدريبي.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    pdf
      .create(htmlTemplate, { format: 'A4', border: '10mm' })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send(err);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${course.id}.pdf`);
        res.send(buffer);
      });
  }
}