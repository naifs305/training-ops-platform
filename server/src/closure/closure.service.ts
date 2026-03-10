import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  SubmitReportDto,
  SubmitAdvanceDto,
  SubmitSettlementDto,
  RevenueStatusDto,
} from './dto/form.dto';

@Injectable()
export class ClosureService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private validateReportComments(dto: SubmitReportDto) {
    const requiredSections = [
      dto.training_environment,
      dto.trainer_evaluation,
      dto.lms_content_evaluation,
      dto.trainee_evaluation,
      dto.program_evaluation,
    ];

    for (const section of requiredSections) {
      if (!section?.rating) {
        throw new BadRequestException('لا يمكن تقديم التقرير قبل استكمال الحقول الإلزامية');
      }

      if (
        ['needs_improvement', 'weak', 'requires_development'].includes(section.rating) &&
        (!section.comment || section.comment.trim() === '')
      ) {
        throw new BadRequestException('يوجد تقييم يتطلب إدخال ملاحظة تفسيرية إلزامية');
      }
    }

    if (!dto.declarationConfirmed) {
      throw new BadRequestException('يجب الإقرار بصحة البيانات قبل تقديم التقرير');
    }

    if (dto.attachments && dto.attachments.length > 6) {
      throw new BadRequestException('الحد الأقصى للصور الداعمة هو 6 صور');
    }
  }

  private validateAdvance(dto: SubmitAdvanceDto) {
    if (
      dto.totalAmount === undefined ||
      dto.totalAmount === null ||
      dto.totalAmount < 0 ||
      !dto.requestDate ||
      !dto.receiptDate
    ) {
      throw new BadRequestException('بيانات طلب السلفة غير مكتملة');
    }
  }

  private validateSettlement(dto: SubmitSettlementDto) {
    if (
      dto.advanceAmount === undefined ||
      dto.advanceAmount === null ||
      dto.advanceAmount < 0 ||
      dto.spentAmount === undefined ||
      dto.spentAmount === null ||
      dto.spentAmount < 0 ||
      !dto.deliveredToAuditorDate ||
      !dto.invoicesUploadedDate
    ) {
      throw new BadRequestException('بيانات تسوية السلفة غير مكتملة');
    }
  }

  async submitReport(
    trackingId: string,
    dto: SubmitReportDto,
    userId: string,
    roleContext: string,
  ) {
    this.validateReportComments(dto);

    return this.updateStatus(
      trackingId,
      {
        status: 'PENDING_APPROVAL',
        formData: dto,
        notes: 'تم تقديم التقرير الرقمي',
      },
      userId,
      roleContext,
    );
  }

  async submitAdvance(
    trackingId: string,
    dto: SubmitAdvanceDto,
    userId: string,
    roleContext: string,
  ) {
    this.validateAdvance(dto);

    return this.updateStatus(
      trackingId,
      {
        status: 'PENDING_APPROVAL',
        formData: dto,
        notes: 'تم تقديم طلب السلفة',
      },
      userId,
      roleContext,
    );
  }

  async submitSettlement(
    trackingId: string,
    dto: SubmitSettlementDto,
    userId: string,
    roleContext: string,
  ) {
    this.validateSettlement(dto);

    return this.updateStatus(
      trackingId,
      {
        status: 'PENDING_APPROVAL',
        formData: dto,
        notes: 'تم تقديم التسوية',
      },
      userId,
      roleContext,
    );
  }

  async updateRevenueStatus(
    trackingId: string,
    dto: RevenueStatusDto,
    userId: string,
    roleContext: string,
  ) {
    return this.updateStatus(
      trackingId,
      {
        status: 'PENDING_APPROVAL',
        formData: { businessStatus: dto.status },
        notes: `تحديث حالة الإيرادات: ${dto.status}`,
      },
      userId,
      roleContext,
    );
  }

  async updateStatus(
    trackingId: string,
    data: { status: any; formData?: any; notes?: string },
    userId: string,
    roleContext: string,
  ) {
    const item = await this.prisma.courseClosureTracking.findUnique({
      where: { id: trackingId },
      include: {
        element: true,
        course: {
          include: {
            supportingTeam: true,
          },
        },
      },
    });

    if (!item) {
      throw new BadRequestException('Element not found');
    }

    if (roleContext === 'EMPLOYEE') {
      const isPrimary = item.course.primaryEmployeeId === userId;
      const isSupport = item.course.supportingTeam?.some((member) => member.userId === userId);

      if (!isPrimary && !isSupport) {
        throw new ForbiddenException('Not authorized');
      }

      if (data.status === 'PENDING_APPROVAL') {
        const result = await this.prisma.courseClosureTracking.update({
          where: { id: trackingId },
          data: {
            status: 'PENDING_APPROVAL',
            formData: data.formData ?? item.formData,
            notes: data.notes ?? item.notes,
            executionAt: new Date(),
            executedById: userId,
            rejectionReason: null,
            decisionAt: null,
            decidedById: null,
          },
        });

        await this.audit.log(
          userId,
          roleContext,
          'ELEMENT_SUBMITTED',
          { element: item.element.name, status: 'PENDING_APPROVAL' },
          item.courseId,
        );

        return result;
      }

      if (data.status === 'NOT_STARTED') {
        if (item.status !== 'PENDING_APPROVAL' && item.status !== 'RETURNED') {
          throw new BadRequestException('لا يمكن سحب العنصر في حالته الحالية');
        }

        const result = await this.prisma.courseClosureTracking.update({
          where: { id: trackingId },
          data: {
            status: 'NOT_STARTED',
            decisionAt: null,
            decidedById: null,
            rejectionReason: null,
          },
        });

        await this.audit.log(
          userId,
          roleContext,
          'ELEMENT_WITHDRAWN',
          { element: item.element.name, status: 'NOT_STARTED' },
          item.courseId,
        );

        return result;
      }

      throw new ForbiddenException('غير مسموح للموظف بهذا الإجراء');
    }

    if (roleContext === 'MANAGER') {
      if (item.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException('العنصر ليس بانتظار الاعتماد');
      }

      if (!['APPROVED', 'REJECTED', 'RETURNED'].includes(data.status)) {
        throw new BadRequestException('حالة غير مسموحة للمدير');
      }

      const managerReason =
        data.status === 'REJECTED' || data.status === 'RETURNED'
          ? (data.notes || '').trim()
          : null;

      if (
        (data.status === 'REJECTED' || data.status === 'RETURNED') &&
        !managerReason
      ) {
        throw new BadRequestException('يجب كتابة سبب الرفض أو الإعادة');
      }

      const result = await this.prisma.courseClosureTracking.update({
        where: { id: trackingId },
        data: {
          status: data.status,
          decisionAt: new Date(),
          decidedById: userId,
          notes: managerReason,
          rejectionReason: managerReason,
        },
      });

      await this.audit.log(
        userId,
        roleContext,
        data.status === 'APPROVED'
          ? 'ELEMENT_APPROVED'
          : data.status === 'RETURNED'
            ? 'ELEMENT_RETURNED'
            : 'ELEMENT_REJECTED',
        { element: item.element.name, status: data.status, notes: managerReason },
        item.courseId,
      );

      await this.checkCourseClosure(item.courseId);
      return result;
    }

    throw new ForbiddenException('Not authorized');
  }

  async getElementDetails(id: string) {
    return this.prisma.courseClosureTracking.findUnique({
      where: { id },
      include: { course: true, element: true },
    });
  }

  private async checkCourseClosure(courseId: string) {
    const elements = await this.prisma.courseClosureTracking.findMany({
      where: { courseId },
    });

    const allClosed = elements.every(
      (el) => el.status === 'APPROVED' || el.status === 'NOT_APPLICABLE',
    );

    if (allClosed) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { status: 'CLOSED' },
      });

      await this.audit.log('system', 'SYSTEM', 'COURSE_CLOSED', {}, courseId);
    }
  }
}