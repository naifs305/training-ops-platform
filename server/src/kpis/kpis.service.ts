import { Injectable, BadRequestException } from '@nestjs/common';
import {
  KpiPeriodType,
  PerformanceLevel,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class KpisService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private getPeriodRange(periodType: KpiPeriodType, year: number, value?: number) {
    if (periodType === 'MONTHLY') {
      if (!value || value < 1 || value > 12) {
        throw new BadRequestException('الشهر غير صحيح');
      }

      const start = new Date(year, value - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, value, 0, 23, 59, 59, 999);

      return {
        label: `${year}-${String(value).padStart(2, '0')}`,
        start,
        end,
      };
    }

    if (periodType === 'QUARTERLY') {
      if (!value || value < 1 || value > 4) {
        throw new BadRequestException('الربع غير صحيح');
      }

      const startMonth = (value - 1) * 3;
      const endMonth = startMonth + 2;

      const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
      const end = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);

      return {
        label: `${year}-Q${value}`,
        start,
        end,
      };
    }

    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    return {
      label: `${year}`,
      start,
      end,
    };
  }

  private toPercent(numerator: number, denominator: number) {
    if (!denominator) return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
  }

  private toAverage(values: number[]) {
    if (!values.length) return 0;
    return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
  }

  private clampScore(value: number) {
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Number(value.toFixed(2));
  }

  private getPerformanceLevel(score: number): PerformanceLevel {
    if (score >= 90) return 'OUTSTANDING';
    if (score >= 80) return 'VERY_GOOD';
    if (score >= 70) return 'GOOD';
    if (score >= 60) return 'NEEDS_IMPROVEMENT';
    return 'WEAK';
  }

  private levelLabel(level: PerformanceLevel) {
    const map: Record<PerformanceLevel, string> = {
      OUTSTANDING: 'متميز',
      VERY_GOOD: 'جيد جدًا',
      GOOD: 'جيد',
      NEEDS_IMPROVEMENT: 'يحتاج تحسين',
      WEAK: 'ضعيف',
    };
    return map[level] || level;
  }

  private calculateWeightedScores(metrics: {
    closureCompletionRate: number;
    dueCourseClosureRate: number;
    avgElementSubmissionHours: number;
    avgResubmissionHours: number;
    avgCourseClosureDelayDays: number;
    firstPassApprovalRate: number;
    returnRate: number;
    rejectRate: number;
    operationalErrorRate: number;
    overdueCoursesRate: number;
    overdueElementsRate: number;
    stalePendingElementsRate: number;
  }, settings: {
    closureCompletionWeight: number;
    overdueClosuresWeight: number;
    avgElementSubmissionWeight: number;
    avgResubmissionWeight: number;
    avgCourseClosureWeight: number;
    firstPassApprovalWeight: number;
    returnRateWeight: number;
    rejectRateWeight: number;
    errorRateWeight: number;
    overdueCoursesWeight: number;
    overdueElementsWeight: number;
    staleElementsWeight: number;
  }) {
    const productivityScore =
      (metrics.closureCompletionRate * settings.closureCompletionWeight +
        metrics.dueCourseClosureRate * settings.overdueClosuresWeight) / 30;

    const elementSubmissionScore = Math.max(0, 100 - metrics.avgElementSubmissionHours * 2);
    const resubmissionScore = Math.max(0, 100 - metrics.avgResubmissionHours * 2);
    const courseClosureDelayScore = Math.max(0, 100 - metrics.avgCourseClosureDelayDays * 10);

    const speedScore =
      (elementSubmissionScore * settings.avgElementSubmissionWeight +
        resubmissionScore * settings.avgResubmissionWeight +
        courseClosureDelayScore * settings.avgCourseClosureWeight) / 20;

    const qualityScore =
      (metrics.firstPassApprovalRate * settings.firstPassApprovalWeight +
        (100 - metrics.returnRate) * settings.returnRateWeight +
        (100 - metrics.rejectRate) * settings.rejectRateWeight +
        (100 - metrics.operationalErrorRate) * settings.errorRateWeight) / 35;

    const disciplineScore =
      ((100 - metrics.overdueCoursesRate) * settings.overdueCoursesWeight +
        (100 - metrics.overdueElementsRate) * settings.overdueElementsWeight +
        (100 - metrics.stalePendingElementsRate) * settings.staleElementsWeight) / 15;

    const finalScore =
      productivityScore * 0.30 +
      speedScore * 0.20 +
      qualityScore * 0.35 +
      disciplineScore * 0.15;

    return {
      productivityScore: this.clampScore(productivityScore),
      speedScore: this.clampScore(speedScore),
      qualityScore: this.clampScore(qualityScore),
      disciplineScore: this.clampScore(disciplineScore),
      finalScore: this.clampScore(finalScore),
    };
  }

  async calculateAndStore(periodType: KpiPeriodType, year: number, value: number | undefined, managerId: string) {
    const { label, start, end } = this.getPeriodRange(periodType, year, value);

    const settings =
      await this.prisma.employeeKpiSetting.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

    const effectiveSettings = settings || {
      id: null,
      closureCompletionWeight: 15,
      overdueClosuresWeight: 15,
      avgElementSubmissionWeight: 5,
      avgResubmissionWeight: 5,
      avgCourseClosureWeight: 10,
      firstPassApprovalWeight: 15,
      returnRateWeight: 10,
      rejectRateWeight: 5,
      errorRateWeight: 5,
      overdueCoursesWeight: 5,
      overdueElementsWeight: 5,
      staleElementsWeight: 5,
    };

    const employees = await this.prisma.user.findMany({
      where: {
        isActive: true,
        roles: { has: 'EMPLOYEE' },
      },
      include: {
        operationalProject: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const snapshots = [];

    for (const employee of employees) {
      const courses = await this.prisma.course.findMany({
        where: {
          primaryEmployeeId: employee.id,
        },
        include: {
          closureElements: {
            include: {
              element: true,
            },
          },
        },
      });

      const relevantCourses = courses.filter((course) => {
        const courseStart = new Date(course.startDate);
        const courseEnd = new Date(course.endDate);
        return courseStart <= end && courseEnd >= start;
      });

      const relevantElements = relevantCourses.flatMap((course) =>
        course.closureElements.filter((el) => el.status !== 'NOT_APPLICABLE'),
      );

      const completedElements = relevantElements.filter(
        (el) => el.status === 'PENDING_APPROVAL' || el.status === 'APPROVED',
      );

      const dueCourses = relevantCourses.filter((course) => new Date(course.endDate) <= end);
      const closedCourses = dueCourses.filter((course) => course.status === 'CLOSED');

      const submittedElements = relevantElements.filter((el) => !!el.executionAt);
      const approvedElements = relevantElements.filter((el) => el.status === 'APPROVED');
      const returnedElements = relevantElements.filter((el) => el.status === 'RETURNED');
      const rejectedElements = relevantElements.filter((el) => el.status === 'REJECTED');

      const overdueCourses = dueCourses.filter((course) => course.status !== 'CLOSED');

      const now = new Date();

      const overdueElements = relevantElements.filter((el) => {
        if (el.status !== 'NOT_STARTED' && el.status !== 'RETURNED') return false;
        const course = relevantCourses.find((c) => c.id === el.courseId);
        if (!course) return false;
        return new Date(course.endDate) < now;
      });

      const stalePendingElements = relevantElements.filter((el) => {
        if (el.status !== 'NOT_STARTED' && el.status !== 'RETURNED') return false;
        const baseDate =
          el.status === 'RETURNED' && el.decisionAt
            ? new Date(el.decisionAt)
            : relevantCourses.find((c) => c.id === el.courseId)?.createdAt;

        if (!baseDate) return false;

        const diffHours = (now.getTime() - new Date(baseDate).getTime()) / (1000 * 60 * 60);
        return diffHours > 72;
      });

      const approvedWithoutReturnOrReject = approvedElements.filter(
        (el) => !el.rejectionReason,
      );

      const elementSubmissionHours = submittedElements.map((el) => {
        const course = relevantCourses.find((c) => c.id === el.courseId);
        if (!course || !el.executionAt) return 0;
        const diff = new Date(el.executionAt).getTime() - new Date(course.createdAt).getTime();
        return diff / (1000 * 60 * 60);
      });

      const resubmissionHours = submittedElements
        .filter((el) => el.decisionAt && el.executionAt && el.status !== 'APPROVED')
        .map((el) => {
          const diff = new Date(el.executionAt!).getTime() - new Date(el.decisionAt!).getTime();
          return diff / (1000 * 60 * 60);
        });

      const courseClosureDelayDays = closedCourses.map((course) => {
        const approvedDates = course.closureElements
          .filter((el) => el.status === 'APPROVED' && el.decisionAt)
          .map((el) => new Date(el.decisionAt as Date).getTime());

        if (!approvedDates.length) return 0;

        const lastApprovedAt = new Date(Math.max(...approvedDates));
        const diff = lastApprovedAt.getTime() - new Date(course.endDate).getTime();
        return Math.max(0, diff / (1000 * 60 * 60 * 24));
      });

      const metrics = {
        requiredElementsCount: relevantElements.length,
        completedElementsCount: completedElements.length,
        closureCompletionRate: this.toPercent(completedElements.length, relevantElements.length),

        dueCoursesCount: dueCourses.length,
        closedCoursesCount: closedCourses.length,
        dueCourseClosureRate: this.toPercent(closedCourses.length, dueCourses.length),

        submittedElementsCount: submittedElements.length,
        approvedElementsCount: approvedElements.length,
        returnedElementsCount: returnedElements.length,
        rejectedElementsCount: rejectedElements.length,

        firstPassApprovalRate: this.toPercent(
          approvedWithoutReturnOrReject.length,
          submittedElements.length,
        ),
        returnRate: this.toPercent(returnedElements.length, submittedElements.length),
        rejectRate: this.toPercent(rejectedElements.length, submittedElements.length),
        operationalErrorRate: this.toPercent(
          returnedElements.length + rejectedElements.length,
          submittedElements.length,
        ),

        avgElementSubmissionHours: this.toAverage(elementSubmissionHours),
        avgResubmissionHours: this.toAverage(resubmissionHours),
        avgCourseClosureDelayDays: this.toAverage(courseClosureDelayDays),

        overdueCoursesCount: overdueCourses.length,
        overdueCoursesRate: this.toPercent(overdueCourses.length, dueCourses.length),

        overdueElementsCount: overdueElements.length,
        overdueElementsRate: this.toPercent(overdueElements.length, relevantElements.length),

        stalePendingElementsCount: stalePendingElements.length,
        stalePendingElementsRate: this.toPercent(
          stalePendingElements.length,
          relevantElements.length,
        ),
      };

      const scores = this.calculateWeightedScores(metrics, effectiveSettings);
      const performanceLevel = this.getPerformanceLevel(scores.finalScore);

      const snapshot = await this.prisma.employeeKpiSnapshot.upsert({
        where: {
          userId_periodType_periodLabel: {
            userId: employee.id,
            periodType,
            periodLabel: label,
          },
        },
        update: {
          periodStart: start,
          periodEnd: end,

          requiredElementsCount: metrics.requiredElementsCount,
          completedElementsCount: metrics.completedElementsCount,
          closureCompletionRate: metrics.closureCompletionRate,

          dueCoursesCount: metrics.dueCoursesCount,
          closedCoursesCount: metrics.closedCoursesCount,
          dueCourseClosureRate: metrics.dueCourseClosureRate,

          submittedElementsCount: metrics.submittedElementsCount,
          approvedElementsCount: metrics.approvedElementsCount,
          returnedElementsCount: metrics.returnedElementsCount,
          rejectedElementsCount: metrics.rejectedElementsCount,

          firstPassApprovalRate: metrics.firstPassApprovalRate,
          returnRate: metrics.returnRate,
          rejectRate: metrics.rejectRate,
          operationalErrorRate: metrics.operationalErrorRate,

          avgElementSubmissionHours: metrics.avgElementSubmissionHours,
          avgResubmissionHours: metrics.avgResubmissionHours,
          avgCourseClosureDelayDays: metrics.avgCourseClosureDelayDays,

          overdueCoursesCount: metrics.overdueCoursesCount,
          overdueCoursesRate: metrics.overdueCoursesRate,

          overdueElementsCount: metrics.overdueElementsCount,
          overdueElementsRate: metrics.overdueElementsRate,

          stalePendingElementsCount: metrics.stalePendingElementsCount,
          stalePendingElementsRate: metrics.stalePendingElementsRate,

          productivityScore: scores.productivityScore,
          speedScore: scores.speedScore,
          qualityScore: scores.qualityScore,
          disciplineScore: scores.disciplineScore,
          finalScore: scores.finalScore,
          performanceLevel,
          settingsId: settings?.id || null,
        },
        create: {
          userId: employee.id,
          periodType,
          periodLabel: label,
          periodStart: start,
          periodEnd: end,

          requiredElementsCount: metrics.requiredElementsCount,
          completedElementsCount: metrics.completedElementsCount,
          closureCompletionRate: metrics.closureCompletionRate,

          dueCoursesCount: metrics.dueCoursesCount,
          closedCoursesCount: metrics.closedCoursesCount,
          dueCourseClosureRate: metrics.dueCourseClosureRate,

          submittedElementsCount: metrics.submittedElementsCount,
          approvedElementsCount: metrics.approvedElementsCount,
          returnedElementsCount: metrics.returnedElementsCount,
          rejectedElementsCount: metrics.rejectedElementsCount,

          firstPassApprovalRate: metrics.firstPassApprovalRate,
          returnRate: metrics.returnRate,
          rejectRate: metrics.rejectRate,
          operationalErrorRate: metrics.operationalErrorRate,

          avgElementSubmissionHours: metrics.avgElementSubmissionHours,
          avgResubmissionHours: metrics.avgResubmissionHours,
          avgCourseClosureDelayDays: metrics.avgCourseClosureDelayDays,

          overdueCoursesCount: metrics.overdueCoursesCount,
          overdueCoursesRate: metrics.overdueCoursesRate,

          overdueElementsCount: metrics.overdueElementsCount,
          overdueElementsRate: metrics.overdueElementsRate,

          stalePendingElementsCount: metrics.stalePendingElementsCount,
          stalePendingElementsRate: metrics.stalePendingElementsRate,

          productivityScore: scores.productivityScore,
          speedScore: scores.speedScore,
          qualityScore: scores.qualityScore,
          disciplineScore: scores.disciplineScore,
          finalScore: scores.finalScore,
          performanceLevel,
          settingsId: settings?.id || null,
        },
        include: {
          user: {
            include: {
              operationalProject: true,
            },
          },
        },
      });

      snapshots.push({
        id: snapshot.id,
        userId: snapshot.userId,
        employeeName: `${snapshot.user.firstName} ${snapshot.user.lastName}`,
        projectName: snapshot.user.operationalProject?.name || '-',
        finalScore: snapshot.finalScore,
        performanceLevel: this.levelLabel(snapshot.performanceLevel),
        closureCompletionRate: snapshot.closureCompletionRate,
        dueCourseClosureRate: snapshot.dueCourseClosureRate,
        firstPassApprovalRate: snapshot.firstPassApprovalRate,
        returnRate: snapshot.returnRate,
        rejectRate: snapshot.rejectRate,
        overdueCoursesRate: snapshot.overdueCoursesRate,
      });
    }

    await this.audit.log(
      managerId,
      'MANAGER',
      'KPI_SNAPSHOTS_CALCULATED',
      {
        periodType,
        periodLabel: label,
        employeesCount: snapshots.length,
      },
    );

    return {
      periodType,
      periodLabel: label,
      periodStart: start,
      periodEnd: end,
      employeesCount: snapshots.length,
      results: snapshots.sort((a, b) => b.finalScore - a.finalScore),
    };
  }

  async getSnapshots(periodType?: KpiPeriodType, periodLabel?: string) {
    return this.prisma.employeeKpiSnapshot.findMany({
      where: {
        ...(periodType ? { periodType } : {}),
        ...(periodLabel ? { periodLabel } : {}),
      },
      include: {
        user: {
          include: {
            operationalProject: true,
          },
        },
        settings: true,
        notes: {
          include: {
            manager: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ finalScore: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getEmployeeSnapshotDetails(userId: string, periodType: KpiPeriodType, periodLabel: string) {
    const snapshot = await this.prisma.employeeKpiSnapshot.findUnique({
      where: {
        userId_periodType_periodLabel: {
          userId,
          periodType,
          periodLabel,
        },
      },
      include: {
        user: {
          include: {
            operationalProject: true,
          },
        },
        settings: true,
        notes: {
          include: {
            manager: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!snapshot) {
      throw new BadRequestException('لا توجد بيانات KPI لهذه الفترة');
    }

    return {
      ...snapshot,
      performanceLevelLabel: this.levelLabel(snapshot.performanceLevel),
    };
  }

  async addManagerNote(snapshotId: string, userId: string, managerId: string, note: string) {
    if (!note?.trim()) {
      throw new BadRequestException('الملاحظة مطلوبة');
    }

    const snapshot = await this.prisma.employeeKpiSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new BadRequestException('سجل KPI غير موجود');
    }

    const created = await this.prisma.employeeKpiNote.create({
      data: {
        snapshotId,
        userId,
        managerId,
        note: note.trim(),
      },
      include: {
        manager: true,
      },
    });

    await this.audit.log(
      managerId,
      'MANAGER',
      'KPI_NOTE_ADDED',
      {
        snapshotId,
        userId,
      },
    );

    return created;
  }
}