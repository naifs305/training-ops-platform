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
import PDFDocument = require('pdfkit');

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

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${course.id}.pdf`,
    );

    doc.pipe(res);

    doc.fontSize(18).text('تقرير الدورة التدريبية', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text('موجّه إلى سعادة وكيل التدريب', { align: 'center' });
    doc.moveDown(1.5);

    const rows = [
      ['اسم الدورة', info.name || course.name || '-'],
      ['كود الدورة', info.code || course.code || '-'],
      ['المشروع التشغيلي', info.project || course.operationalProject?.name || '-'],
      ['المدينة', info.city || course.city || '-'],
      ['مقر التنفيذ', info.locationType || course.locationType || '-'],
      ['عدد المتدربين', String(info.traineesCount || course.numTrainees || '-')],
      [
        'تاريخ البداية',
        info.startDate ||
          (course.startDate
            ? new Date(course.startDate).toLocaleDateString('ar-SA')
            : '-'),
      ],
      [
        'تاريخ النهاية',
        info.endDate ||
          (course.endDate
            ? new Date(course.endDate).toLocaleDateString('ar-SA')
            : '-'),
      ],
      [
        'المشرف / المنسق',
        info.supervisor ||
          `${course.primaryEmployee?.firstName || ''} ${course.primaryEmployee?.lastName || ''}`.trim() ||
          '-',
      ],
      [
        'تاريخ التقديم',
        element.executionAt
          ? new Date(element.executionAt).toLocaleString('ar-SA')
          : '-',
      ],
    ];

    doc.fontSize(14).text('بيانات الدورة', { underline: true });
    doc.moveDown(0.6);

    rows.forEach(([label, value]) => {
      doc.fontSize(11).text(`${label}: ${value}`, {
        align: 'right',
      });
      doc.moveDown(0.35);
    });

    doc.moveDown(1);
    doc.fontSize(14).text('تقييم المنسق', { underline: true });
    doc.moveDown(0.6);

    const sections = [
      ['تقييم البيئة التدريبية', data.training_environment],
      ['تقييم المدرب والتزامه وانضباطه', data.trainer_evaluation],
      ['تقييم المادة العلمية واكتمالها على منصة LMS', data.lms_content_evaluation],
      ['تقييم المتدربين وانضباطهم والتزامهم', data.trainee_evaluation],
      ['التقييم العام للبرنامج', data.program_evaluation],
    ];

    sections.forEach(([title, section]: any) => {
      doc.fontSize(12).text(title, { align: 'right' });
      doc.moveDown(0.2);
      doc.fontSize(11).text(`التقييم: ${this.getRatingLabel(section?.rating)}`, {
        align: 'right',
      });
      doc.moveDown(0.2);
      doc.fontSize(10).text(`الملاحظات: ${section?.comment || '—'}`, {
        align: 'right',
      });
      doc.moveDown(0.8);
    });

    doc.fontSize(14).text('ملاحظات إضافية', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(data.other_notes || 'لا توجد ملاحظات إضافية', {
      align: 'right',
    });

    doc.moveDown(1.2);
    doc.fontSize(10).text(
      'أقرّ بأن جميع البيانات الواردة في هذا التقرير صحيحة وحقيقية وتمثل ما جرى في البرنامج التدريبي.',
      { align: 'right' },
    );

    doc.end();
  }
}