import { Injectable, BadRequestException } from '@nestjs/common';
import { KpiPeriodType, PerformanceLevel } from '@prisma/client';
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

  private getCommitmentStatus(params: {
    isSubjectToEvaluation: boolean;
    assignmentCoverageRate: number;
    missingCoursesCount: number;
    completionRate: number;
  }) {
    if (!params.isSubjectToEvaluation) {
      return {
        value: 'NOT_APPLICABLE',
        label: 'غير خاضع للتقييم',
      };
    }

    if (
      params.missingCoursesCount === 0 &&
      params.assignmentCoverageRate >= 100 &&
      params.completionRate >= 80
    ) {
      return {
        value: 'COMMITTED',
        label: 'ملتزم',
      };
    }

    if (params.missingCoursesCount >= 1 || params.assignmentCoverageRate < 80) {
      return {
        value: 'NOT_COMMITTED',
        label: 'غير ملتزم',
      };
    }

    return {
      value: 'NEEDS_FOLLOWUP',
      label: 'يحتاج متابعة',
    };
  }

  private getDisciplineStatus(params: {
    isSubjectToEvaluation: boolean;
    overdueElementsRate: number;
    stalePendingElementsRate: number;
    returnRate: number;
    rejectRate: number;
  }) {
    if (!params.isSubjectToEvaluation) {
      return {
        value: 'NOT_APPLICABLE',
        label: 'غير خاضع للتقييم',
      };
    }

    if (
      params.overdueElementsRate <= 10 &&
      params.stalePendingElementsRate <= 10 &&
      params.returnRate <= 15 &&
      params.rejectRate <= 5
    ) {
      return {
        value: 'DISCIPLINED',
        label: 'منضبط',
      };
    }

    if (
      params.overdueElementsRate > 25 ||
      params.stalePendingElementsRate > 25 ||
      params.returnRate > 25 ||
      params.rejectRate > 10
    ) {
      return {
        value: 'UNDISCIPLINED',
        label: 'غير منضبط',
      };
    }

    return {
      value: 'NEEDS_FOLLOWUP',
      label: 'يحتاج متابعة',
    };
  }

  private calculateWeightedScores(metrics: {
    isSubjectToEvaluation: boolean;
    assignmentCoverageRate: number;
    missingCoursesRate: number;
    submissionRate: number;
    completionRate: number;
    firstPassSubmissionRate: number;
    returnRate: number;
    rejectRate: number;
    operationalErrorRate: number;
    avgElementSubmissionHours: number;
    avgResubmissionHours: number;
    overdueElementsRate: number;
    stalePendingElementsRate: number;
  }) {
    if (!metrics.isSubjectToEvaluation) {
      return {
        productivityScore: 0,
        speedScore: 0,
        qualityScore: 0,
        disciplineScore: 0,
        finalScore: 0,
      };
    }

    const coverageScore = Math.max(
      0,
      metrics.assignmentCoverageRate - metrics.missingCoursesRate * 0.5,
    );

    const productivityScore =
      coverageScore * 0.45 +
      metrics.submissionRate * 0.2 +
      metrics.completionRate * 0.35;

    const qualityScore =
      metrics.firstPassSubmissionRate * 0.45 +
      (100 - metrics.returnRate) * 0.2 +
      (100 - metrics.rejectRate) * 0.15 +
      (100 - metrics.operationalErrorRate) * 0.2;

    const elementSubmissionScore = Math.max(0, 100 - metrics.avgElementSubmissionHours * 2);
    const resubmissionScore = Math.max(0, 100 - metrics.avgResubmissionHours * 2.5);

    const speedScore = elementSubmissionScore * 0.7 + resubmissionScore * 0.3;

    const disciplineScore =
      (100 - metrics.missingCoursesRate) * 0.35 +
      (100 - metrics.overdueElementsRate) * 0.35 +
      (100 - metrics.stalePendingElementsRate) * 0.3;

    const finalScore =
      productivityScore * 0.35 +
      qualityScore * 0.25 +
      speedScore * 0.2 +
      disciplineScore * 0.2;

    return {
      productivityScore: this.clampScore(productivityScore),
      speedScore: this.clampScore(speedScore),
      qualityScore: this.clampScore(qualityScore),
      disciplineScore: this.clampScore(disciplineScore),
      finalScore: this.clampScore(finalScore),
    };
  }

  private buildViewModel(base: {
    assignedCoursesCount: number;
    actualCoursesCount: number;
    missingCoursesCount: number;
    extraCoursesCount: number;
    assignmentCoverageRate: number;
    closureCompletionRate: number;
    submissionRate: number;
    overdueElementsRate: number;
    stalePendingElementsRate: number;
    returnRate: number;
    rejectRate: number;
    performanceLevel: PerformanceLevel;
    finalScore: number;
  }) {
    const isSubjectToEvaluation = !(base.assignedCoursesCount === 0 && base.actualCoursesCount === 0);

    const commitmentStatus = this.getCommitmentStatus({
      isSubjectToEvaluation,
      assignmentCoverageRate: base.assignmentCoverageRate,
      missingCoursesCount: base.missingCoursesCount,
      completionRate: base.closureCompletionRate,
    });

    const disciplineStatus = this.getDisciplineStatus({
      isSubjectToEvaluation,
      overdueElementsRate: base.overdueElementsRate,
      stalePendingElementsRate: base.stalePendingElementsRate,
      returnRate: base.returnRate,
      rejectRate: base.rejectRate,
    });

    return {
      isSubjectToEvaluation,
      commitmentStatus: commitmentStatus.value,
      commitmentStatusLabel: commitmentStatus.label,
      disciplineStatus: disciplineStatus.value,
      disciplineStatusLabel: disciplineStatus.label,
      performanceLevelLabel: isSubjectToEvaluation
        ? this.levelLabel(base.performanceLevel)
        : 'غير خاضع للتقييم',
      finalScoreDisplay: isSubjectToEvaluation ? base.finalScore : null,
    };
  }

  async calculateAndStore(
    periodType: KpiPeriodType,
    year: number,
    value: number | undefined,
    managerId: string,
  ) {
    const { label, start, end } = this.getPeriodRange(periodType, year, value);

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
      const assignment = await this.prisma.courseAssignmentRegister.findUnique({
        where: {
          userId_periodType_periodLabel: {
            userId: employee.id,
            periodType,
            periodLabel: label,
          },
        },
      });

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

      const submittedElements = relevantElements.filter((el) => !!el.executionAt);
      const approvedElements = relevantElements.filter((el) => el.status === 'APPROVED');
      const returnedElements = relevantElements.filter((el) => el.status === 'RETURNED');
      const rejectedElements = relevantElements.filter((el) => el.status === 'REJECTED');
      const pendingApprovalElements = relevantElements.filter(
        (el) => el.status === 'PENDING_APPROVAL',
      );
      const completedElements = [...approvedElements, ...pendingApprovalElements];

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

      const submittedWithoutReturnOrReject = submittedElements.filter(
        (el) => el.status !== 'RETURNED' && el.status !== 'REJECTED',
      );

      const elementSubmissionHours = submittedElements.map((el) => {
        const course = relevantCourses.find((c) => c.id === el.courseId);
        if (!course || !el.executionAt) return 0;
        const diff = new Date(el.executionAt).getTime() - new Date(course.createdAt).getTime();
        return Math.max(0, diff / (1000 * 60 * 60));
      });

      const resubmissionHours = submittedElements
        .filter((el) => el.decisionAt && el.executionAt && el.status !== 'APPROVED')
        .map((el) => {
          const diff = new Date(el.executionAt!).getTime() - new Date(el.decisionAt!).getTime();
          return Math.max(0, diff / (1000 * 60 * 60));
        });

      const assignedCoursesCount = assignment?.assignedCoursesCount ?? 0;
      const actualCoursesCount = relevantCourses.length;
      const missingCoursesCount = Math.max(assignedCoursesCount - actualCoursesCount, 0);
      const extraCoursesCount = Math.max(actualCoursesCount - assignedCoursesCount, 0);
      const assignmentCoverageRate = this.toPercent(actualCoursesCount, assignedCoursesCount);
      const missingCoursesRate = this.toPercent(missingCoursesCount, assignedCoursesCount);
      const isSubjectToEvaluation = !(assignedCoursesCount === 0 && actualCoursesCount === 0);

      const metrics = {
        isSubjectToEvaluation,
        requiredElementsCount: relevantElements.length,
        completedElementsCount: completedElements.length,
        closureCompletionRate: this.toPercent(completedElements.length, relevantElements.length),

        submittedElementsCount: submittedElements.length,
        approvedElementsCount: approvedElements.length,
        returnedElementsCount: returnedElements.length,
        rejectedElementsCount: rejectedElements.length,

        submissionRate: this.toPercent(submittedElements.length, relevantElements.length),
        firstPassSubmissionRate: this.toPercent(
          submittedWithoutReturnOrReject.length,
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

        overdueElementsCount: overdueElements.length,
        overdueElementsRate: this.toPercent(overdueElements.length, relevantElements.length),

        stalePendingElementsCount: stalePendingElements.length,
        stalePendingElementsRate: this.toPercent(
          stalePendingElements.length,
          relevantElements.length,
        ),

        assignmentCoverageRate,
        missingCoursesRate,
      };

      const scores = this.calculateWeightedScores({
        isSubjectToEvaluation: metrics.isSubjectToEvaluation,
        assignmentCoverageRate: metrics.assignmentCoverageRate,
        missingCoursesRate: metrics.missingCoursesRate,
        submissionRate: metrics.submissionRate,
        completionRate: metrics.closureCompletionRate,
        firstPassSubmissionRate: metrics.firstPassSubmissionRate,
        returnRate: metrics.returnRate,
        rejectRate: metrics.rejectRate,
        operationalErrorRate: metrics.operationalErrorRate,
        avgElementSubmissionHours: metrics.avgElementSubmissionHours,
        avgResubmissionHours: metrics.avgResubmissionHours,
        overdueElementsRate: metrics.overdueElementsRate,
        stalePendingElementsRate: metrics.stalePendingElementsRate,
      });

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

          dueCoursesCount: assignedCoursesCount,
          closedCoursesCount: actualCoursesCount,
          dueCourseClosureRate: metrics.assignmentCoverageRate,

          submittedElementsCount: metrics.submittedElementsCount,
          approvedElementsCount: metrics.approvedElementsCount,
          returnedElementsCount: metrics.returnedElementsCount,
          rejectedElementsCount: metrics.rejectedElementsCount,

          firstPassApprovalRate: metrics.firstPassSubmissionRate,
          returnRate: metrics.returnRate,
          rejectRate: metrics.rejectRate,
          operationalErrorRate: metrics.operationalErrorRate,

          avgElementSubmissionHours: metrics.avgElementSubmissionHours,
          avgResubmissionHours: metrics.avgResubmissionHours,
          avgCourseClosureDelayDays: 0,

          overdueCoursesCount: missingCoursesCount,
          overdueCoursesRate: metrics.missingCoursesRate,

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
          settingsId: null,
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

          dueCoursesCount: assignedCoursesCount,
          closedCoursesCount: actualCoursesCount,
          dueCourseClosureRate: metrics.assignmentCoverageRate,

          submittedElementsCount: metrics.submittedElementsCount,
          approvedElementsCount: metrics.approvedElementsCount,
          returnedElementsCount: metrics.returnedElementsCount,
          rejectedElementsCount: metrics.rejectedElementsCount,

          firstPassApprovalRate: metrics.firstPassSubmissionRate,
          returnRate: metrics.returnRate,
          rejectRate: metrics.rejectRate,
          operationalErrorRate: metrics.operationalErrorRate,

          avgElementSubmissionHours: metrics.avgElementSubmissionHours,
          avgResubmissionHours: metrics.avgResubmissionHours,
          avgCourseClosureDelayDays: 0,

          overdueCoursesCount: missingCoursesCount,
          overdueCoursesRate: metrics.missingCoursesRate,

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
          settingsId: null,
        },
        include: {
          user: {
            include: {
              operationalProject: true,
            },
          },
        },
      });

      const viewModel = this.buildViewModel({
        assignedCoursesCount,
        actualCoursesCount,
        missingCoursesCount,
        extraCoursesCount,
        assignmentCoverageRate,
        closureCompletionRate: metrics.closureCompletionRate,
        submissionRate: metrics.submissionRate,
        overdueElementsRate: metrics.overdueElementsRate,
        stalePendingElementsRate: metrics.stalePendingElementsRate,
        returnRate: metrics.returnRate,
        rejectRate: metrics.rejectRate,
        performanceLevel: snapshot.performanceLevel,
        finalScore: snapshot.finalScore,
      });

      snapshots.push({
        id: snapshot.id,
        userId: snapshot.userId,
        employeeName: `${snapshot.user.firstName} ${snapshot.user.lastName}`,
        projectName: snapshot.user.operationalProject?.name || '-',
        assignedCoursesCount,
        actualCoursesCount,
        missingCoursesCount,
        extraCoursesCount,
        courseRegistrationCoverageRate: assignmentCoverageRate,
        finalScore: snapshot.finalScore,
        performanceLevel: this.levelLabel(snapshot.performanceLevel),
        closureCompletionRate: snapshot.closureCompletionRate,
        submissionRate: metrics.submissionRate,
        firstPassApprovalRate: snapshot.firstPassApprovalRate,
        returnRate: snapshot.returnRate,
        rejectRate: snapshot.rejectRate,
        overdueCoursesRate: snapshot.overdueCoursesRate,
        ...viewModel,
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
      results: snapshots.sort((a, b) => {
        if (a.isSubjectToEvaluation !== b.isSubjectToEvaluation) {
          return a.isSubjectToEvaluation ? -1 : 1;
        }
        return (b.finalScoreDisplay ?? -1) - (a.finalScoreDisplay ?? -1);
      }),
    };
  }

  async getSnapshots(periodType?: KpiPeriodType, periodLabel?: string) {
    const snapshots = await this.prisma.employeeKpiSnapshot.findMany({
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

    const enriched = await Promise.all(
      snapshots.map(async (snapshot) => {
        const assignment = await this.prisma.courseAssignmentRegister.findUnique({
          where: {
            userId_periodType_periodLabel: {
              userId: snapshot.userId,
              periodType: snapshot.periodType,
              periodLabel: snapshot.periodLabel,
            },
          },
        });

        const actualCoursesCount = await this.prisma.course.count({
          where: {
            primaryEmployeeId: snapshot.userId,
            startDate: { lte: snapshot.periodEnd },
            endDate: { gte: snapshot.periodStart },
          },
        });

        const assignedCoursesCount = assignment?.assignedCoursesCount ?? 0;
        const missingCoursesCount = Math.max(assignedCoursesCount - actualCoursesCount, 0);
        const extraCoursesCount = Math.max(actualCoursesCount - assignedCoursesCount, 0);
        const assignmentCoverageRate = this.toPercent(actualCoursesCount, assignedCoursesCount);

        return {
          ...snapshot,
          assignedCoursesCount,
          actualCoursesCount,
          missingCoursesCount,
          extraCoursesCount,
          courseRegistrationCoverageRate: assignmentCoverageRate,
          ...this.buildViewModel({
            assignedCoursesCount,
            actualCoursesCount,
            missingCoursesCount,
            extraCoursesCount,
            assignmentCoverageRate,
            closureCompletionRate: snapshot.closureCompletionRate,
            submissionRate: this.toPercent(
              snapshot.submittedElementsCount,
              snapshot.requiredElementsCount,
            ),
            overdueElementsRate: snapshot.overdueElementsRate,
            stalePendingElementsRate: snapshot.stalePendingElementsRate,
            returnRate: snapshot.returnRate,
            rejectRate: snapshot.rejectRate,
            performanceLevel: snapshot.performanceLevel,
            finalScore: snapshot.finalScore,
          }),
        };
      }),
    );

    return enriched.sort((a, b) => {
      if (a.isSubjectToEvaluation !== b.isSubjectToEvaluation) {
        return a.isSubjectToEvaluation ? -1 : 1;
      }
      return (b.finalScoreDisplay ?? -1) - (a.finalScoreDisplay ?? -1);
    });
  }

  async getEmployeeSnapshotDetails(
    userId: string,
    periodType: KpiPeriodType,
    periodLabel: string,
  ) {
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

    const assignment = await this.prisma.courseAssignmentRegister.findUnique({
      where: {
        userId_periodType_periodLabel: {
          userId,
          periodType,
          periodLabel,
        },
      },
    });

    const actualCoursesCount = await this.prisma.course.count({
      where: {
        primaryEmployeeId: userId,
        startDate: { lte: snapshot.periodEnd },
        endDate: { gte: snapshot.periodStart },
      },
    });

    const assignedCoursesCount = assignment?.assignedCoursesCount ?? 0;
    const missingCoursesCount = Math.max(assignedCoursesCount - actualCoursesCount, 0);
    const extraCoursesCount = Math.max(actualCoursesCount - assignedCoursesCount, 0);
    const assignmentCoverageRate = this.toPercent(actualCoursesCount, assignedCoursesCount);

    return {
      ...snapshot,
      assignedCoursesCount,
      actualCoursesCount,
      missingCoursesCount,
      extraCoursesCount,
      courseRegistrationCoverageRate: assignmentCoverageRate,
      assignmentNotes: assignment?.notes || null,
      ...this.buildViewModel({
        assignedCoursesCount,
        actualCoursesCount,
        missingCoursesCount,
        extraCoursesCount,
        assignmentCoverageRate,
        closureCompletionRate: snapshot.closureCompletionRate,
        submissionRate: this.toPercent(
          snapshot.submittedElementsCount,
          snapshot.requiredElementsCount,
        ),
        overdueElementsRate: snapshot.overdueElementsRate,
        stalePendingElementsRate: snapshot.stalePendingElementsRate,
        returnRate: snapshot.returnRate,
        rejectRate: snapshot.rejectRate,
        performanceLevel: snapshot.performanceLevel,
        finalScore: snapshot.finalScore,
      }),
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

  async getAssignmentRegister(periodType: KpiPeriodType, year: number, value?: number) {
    const { label, start, end } = this.getPeriodRange(periodType, year, value);

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

    const rows = await Promise.all(
      employees.map(async (employee) => {
        const register = await this.prisma.courseAssignmentRegister.findUnique({
          where: {
            userId_periodType_periodLabel: {
              userId: employee.id,
              periodType,
              periodLabel: label,
            },
          },
        });

        const actualCoursesCount = await this.prisma.course.count({
          where: {
            primaryEmployeeId: employee.id,
            startDate: { lte: end },
            endDate: { gte: start },
          },
        });

        const assignedCoursesCount = register?.assignedCoursesCount ?? 0;
        const missingCoursesCount = Math.max(assignedCoursesCount - actualCoursesCount, 0);
        const extraCoursesCount = Math.max(actualCoursesCount - assignedCoursesCount, 0);
        const assignmentCoverageRate = this.toPercent(actualCoursesCount, assignedCoursesCount);

        return {
          userId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          projectName: employee.operationalProject?.name || '-',
          periodType,
          periodLabel: label,
          periodStart: start,
          periodEnd: end,
          assignedCoursesCount,
          actualCoursesCount,
          notes: register?.notes || '',
          updatedAt: register?.updatedAt || null,
          missingCoursesCount,
          extraCoursesCount,
          courseRegistrationCoverageRate: assignmentCoverageRate,
          isSubjectToEvaluation: !(assignedCoursesCount === 0 && actualCoursesCount === 0),
        };
      }),
    );

    return {
      periodType,
      periodLabel: label,
      periodStart: start,
      periodEnd: end,
      rows,
    };
  }

  async upsertAssignmentRegister(
    managerId: string,
    userId: string,
    periodType: KpiPeriodType,
    year: number,
    value: number | undefined,
    assignedCoursesCount: number,
    notes?: string,
  ) {
    if (assignedCoursesCount < 0) {
      throw new BadRequestException('عدد الدورات المسندة غير صحيح');
    }

    const employee = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!employee) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const { label, start, end } = this.getPeriodRange(periodType, year, value);

    const saved = await this.prisma.courseAssignmentRegister.upsert({
      where: {
        userId_periodType_periodLabel: {
          userId,
          periodType,
          periodLabel: label,
        },
      },
      update: {
        assignedCoursesCount,
        notes: notes?.trim() || null,
        periodStart: start,
        periodEnd: end,
      },
      create: {
        userId,
        periodType,
        periodLabel: label,
        periodStart: start,
        periodEnd: end,
        assignedCoursesCount,
        notes: notes?.trim() || null,
      },
    });

    await this.audit.log(
      managerId,
      'MANAGER',
      'ASSIGNMENT_REGISTER_UPDATED',
      {
        userId,
        periodType,
        periodLabel: label,
        assignedCoursesCount,
      },
    );

    return saved;
  }
}