import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ElementStatus } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateCourseDto, userId: string, roleContext: string) {
    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        code: dto.code,
        beneficiaryEntity: 'غير محدد',
        city: dto.city,
        locationType: dto.locationType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        numTrainees: dto.numTrainees,
        courseType: dto.courseType,
        requiresAdvance: dto.requiresAdvance,
        requiresRevenue: dto.requiresRevenue,
        materialsIssued: dto.materialsIssued,
        requiresAdvanceSettlement: dto.requiresAdvanceSettlement,
        requiresSupervisorCompensation: dto.requiresSupervisorCompensation,
        requiresTrainerCompensation: dto.requiresTrainerCompensation,
        status: 'PREPARATION',
        operationalProject: {
          connect: { id: dto.operationalProjectId },
        },
        primaryEmployee: {
          connect: { id: dto.primaryEmployeeId },
        },
        supportingTeam:
          dto.supportingEmployeeIds && dto.supportingEmployeeIds.length > 0
            ? {
                create: dto.supportingEmployeeIds.map((id) => ({ userId: id })),
              }
            : undefined,
      },
      include: {
        supportingTeam: true,
        operationalProject: true,
        primaryEmployee: true,
      },
    });

    await this.initializeClosureElements(course);
    await this.audit.log(
      userId,
      roleContext,
      'COURSE_CREATED',
      { courseName: course.name },
      course.id,
    );

    return course;
  }

  private async initializeClosureElements(course: any) {
    const allElements = await this.prisma.closureElement.findMany();

    const data = allElements.map((el) => {
      let status: ElementStatus = 'NOT_STARTED';

      if (el.key === 'advance_req') {
        if (!course.requiresAdvance) status = 'NOT_APPLICABLE';
      }

      if (el.key === 'settlement') {
        if (!course.requiresAdvanceSettlement) status = 'NOT_APPLICABLE';
      }

      if (el.key === 'revenues') {
        if (!course.requiresRevenue) status = 'NOT_APPLICABLE';
      }

      if (el.key === 'materials') {
        if (!course.materialsIssued) status = 'NOT_APPLICABLE';
      }

      return {
        courseId: course.id,
        elementId: el.id,
        status,
      };
    });

    await this.prisma.courseClosureTracking.createMany({ data });
  }

  async findAll(userId: string, role: string, projectId?: string, status?: string) {
    const where: any = {};

    if (role === 'EMPLOYEE') {
      where.OR = [
        { primaryEmployeeId: userId },
        { supportingTeam: { some: { userId } } },
      ];
    }

    if (projectId) where.operationalProjectId = projectId;
    if (status) where.status = status;

    return this.prisma.course.findMany({
      where,
      include: {
        primaryEmployee: true,
        operationalProject: true,
        supportingTeam: { include: { user: true } },
        closureElements: { include: { element: true } },
        _count: { select: { closureElements: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        primaryEmployee: true,
        supportingTeam: { include: { user: true } },
        operationalProject: true,
        closureElements: {
          include: { element: true },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    if (!course) {
      throw new ForbiddenException('Course not found');
    }

    if (role === 'EMPLOYEE') {
      const isPrimary = course.primaryEmployeeId === userId;
      const isSupport = course.supportingTeam.some((s) => s.userId === userId);

      if (!isPrimary && !isSupport) {
        throw new ForbiddenException('Not authorized');
      }
    }

    return course;
  }

  async archiveCourse(id: string, managerId: string) {
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await this.audit.log(managerId, 'MANAGER', 'COURSE_ARCHIVED', {}, id);
    return course;
  }

  async findArchived(search?: string, userId?: string, role?: string) {
    const where: any = {
      status: {
        in: ['CLOSED', 'ARCHIVED'],
      },
    };

    if (role === 'EMPLOYEE' && userId) {
      where.AND = [
        {
          OR: [
            { primaryEmployeeId: userId },
            { supportingTeam: { some: { userId } } },
          ],
        },
      ];
    }

    if (search) {
      const searchFilter = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      };

      if (where.AND) {
        where.AND.push(searchFilter);
      } else {
        where.AND = [searchFilter];
      }
    }

    return this.prisma.course.findMany({
      where,
      include: {
        primaryEmployee: true,
        operationalProject: true,
        supportingTeam: { include: { user: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteCourse(id: string, userId: string, role: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
      },
      include: {
        closureElements: true,
        supportingTeam: true,
      },
    });

    if (!course) {
      throw new BadRequestException('الدورة غير موجودة');
    }

    if (role === 'EMPLOYEE') {
      if (course.primaryEmployeeId !== userId) {
        throw new ForbiddenException('لا تملك صلاحية حذف هذه الدورة');
      }

      if (course.status !== 'PREPARATION') {
        throw new BadRequestException('لا يمكن حذف الدورة بعد انتقالها من مرحلة الإعداد');
      }

      const hasSubmittedElements = course.closureElements.some((el) =>
        ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RETURNED'].includes(el.status),
      );

      if (hasSubmittedElements) {
        throw new BadRequestException('لا يمكن حذف الدورة بعد بدء العمل على عناصر الإغلاق');
      }
    }

    await this.prisma.$transaction([
      this.prisma.courseSupport.deleteMany({
        where: { courseId: id },
      }),
      this.prisma.courseClosureTracking.deleteMany({
        where: { courseId: id },
      }),
      this.prisma.auditLog.deleteMany({
        where: { courseId: id },
      }),
      this.prisma.course.delete({
        where: { id },
      }),
    ]);

    await this.audit.log(
      userId,
      role,
      'COURSE_DELETED',
      { courseName: course.name },
      id,
    );

    return { success: true, message: 'تم حذف الدورة بنجاح' };
  }

  async reassignCourse(id: string, newPrimaryEmployeeId: string, managerId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        primaryEmployee: true,
      },
    });

    if (!course) {
      throw new BadRequestException('الدورة غير موجودة');
    }

    const newEmployee = await this.prisma.user.findUnique({
      where: { id: newPrimaryEmployeeId },
    });

    if (!newEmployee) {
      throw new BadRequestException('الموظف الجديد غير موجود');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        primaryEmployeeId: newPrimaryEmployeeId,
      },
      include: {
        primaryEmployee: true,
        operationalProject: true,
        closureElements: { include: { element: true } },
      },
    });

    await this.audit.log(
      managerId,
      'MANAGER',
      'COURSE_REASSIGNED',
      {
        courseName: course.name,
        fromEmployeeId: course.primaryEmployeeId,
        fromEmployeeName: `${course.primaryEmployee.firstName} ${course.primaryEmployee.lastName}`,
        toEmployeeId: newEmployee.id,
        toEmployeeName: `${newEmployee.firstName} ${newEmployee.lastName}`,
      },
      id,
    );

    return updatedCourse;
  }
}