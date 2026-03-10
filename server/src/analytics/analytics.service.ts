import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getManagerDashboard(projectId?: string) {
    const where: any = {};
    if (projectId) where.operationalProjectId = projectId;

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        closureElements: {
          where: { status: 'PENDING_APPROVAL' },
        },
      },
    });

    const total = courses.length;
    const preparation = courses.filter((c) => c.status === 'PREPARATION').length;
    const execution = courses.filter((c) => c.status === 'EXECUTION').length;
    const awaiting = courses.filter((c) => c.status === 'AWAITING_CLOSURE').length;
    const closed = courses.filter((c) => c.status === 'CLOSED').length;

    const pendingApprovals = courses.reduce((acc, c) => acc + c.closureElements.length, 0);

    return {
      total,
      preparation,
      execution,
      awaiting,
      closed,
      pendingApprovals,
    };
  }

  async getEmployeeDashboard(userId: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        OR: [
          { primaryEmployeeId: userId },
          { supportingTeam: { some: { userId } } },
        ],
      },
      include: {
        closureElements: true,
      },
    });

    const myCourses = courses.length;
    const now = new Date();

    const overdueItems = courses.flatMap((c) =>
      c.closureElements.filter(
        (el) =>
          (el.status === 'NOT_STARTED' || el.status === 'RETURNED') &&
          new Date(c.endDate) < now,
      ),
    ).length;

    const pendingMyApproval = courses.flatMap((c) =>
      c.closureElements.filter((el) => el.status === 'PENDING_APPROVAL'),
    ).length;

    return { myCourses, overdueItems, pendingMyApproval };
  }

  async getEmployeeKPI(userId: string) {
    const completed = await this.prisma.courseClosureTracking.count({
      where: { executedById: userId, status: 'APPROVED' },
    });

    const rejected = await this.prisma.courseClosureTracking.count({
      where: { executedById: userId, status: 'REJECTED' },
    });

    return { completed, rejected };
  }

  async getPendingApprovalsQueue() {
    const items = await this.prisma.courseClosureTracking.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        element: true,
        course: {
          include: {
            operationalProject: true,
            primaryEmployee: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { executionAt: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      elementName: item.element.name,
      courseId: item.courseId,
      courseName: item.course.name,
      employeeName: `${item.course.primaryEmployee.firstName} ${item.course.primaryEmployee.lastName}`,
      submittedAt: item.executionAt,
    }));
  }
}