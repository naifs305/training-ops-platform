import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async getUsersForMessaging(requesterId: string, role: string) {
    const requester = await this.usersService.findById(requesterId);

    if (!requester) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: requesterId },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        operationalProjectId: true,
        operationalProject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return users;
  }

  async getInbox(userId: string) {
    return this.prisma.messageRecipient.findMany({
      where: {
        recipientId: userId,
      },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        message: {
          createdAt: 'desc',
        },
      },
    });
  }

  async getSent(userId: string) {
    return this.prisma.message.findMany({
      where: {
        senderId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async sendMessage(
    senderId: string,
    role: string,
    body: {
      recipientIds: string[];
      subject: string;
      message: string;
      courseId?: string;
    },
  ) {
    const recipientIds = [...new Set((body.recipientIds || []).filter(Boolean))];

    if (!recipientIds.length) {
      throw new BadRequestException('يجب اختيار مستلم واحد على الأقل');
    }

    if (!body.subject?.trim()) {
      throw new BadRequestException('موضوع الرسالة مطلوب');
    }

    if (!body.message?.trim()) {
      throw new BadRequestException('نص الرسالة مطلوب');
    }

    const sender = await this.usersService.findById(senderId);

    if (!sender) {
      throw new BadRequestException('المرسل غير موجود');
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        isActive: true,
      },
      select: {
        id: true,
        operationalProjectId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (recipients.length !== recipientIds.length) {
      throw new BadRequestException('بعض المستلمين غير موجودين أو غير نشطين');
    }

    let courseRecord: { id: string; name: string; primaryEmployeeId: string } | null = null;

    if (body.courseId) {
      courseRecord = await this.prisma.course.findUnique({
        where: { id: body.courseId },
        select: {
          id: true,
          name: true,
          primaryEmployeeId: true,
        },
      });

      if (!courseRecord) {
        throw new BadRequestException('الدورة المرتبطة غير موجودة');
      }
    }

    const createdMessage = await this.prisma.message.create({
      data: {
        senderId,
        subject: body.subject.trim(),
        body: body.message.trim(),
        courseId: body.courseId || null,
        recipients: {
          create: recipientIds.map((recipientId) => ({
            recipientId,
          })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    for (const recipient of recipients) {
      await this.notificationsService.create(
        recipient.id,
        'MESSAGE',
        'رسالة داخلية جديدة',
        `لديك رسالة جديدة بعنوان: ${body.subject.trim()}`,
        {
          messageId: createdMessage.id,
          senderId,
          senderName: `${sender.firstName} ${sender.lastName}`,
        },
      );
    }

    return createdMessage;
  }

  async markAsRead(messageId: string, userId: string) {
    const recipient = await this.prisma.messageRecipient.findFirst({
      where: {
        messageId,
        recipientId: userId,
      },
    });

    if (!recipient) {
      throw new ForbiddenException('لا تملك صلاحية الوصول لهذه الرسالة');
    }

    return this.prisma.messageRecipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
        readById: userId,
      },
    });
  }
}