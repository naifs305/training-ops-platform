import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const projects = [
    { id: 'proj_1', name: 'مشروع القيادة الأمنية' },
    { id: 'proj_2', name: 'مشروع التهديدات الحديثة' },
    { id: 'proj_3', name: 'مشروع الوقاية الأمنية' },
  ];

  for (const p of projects) {
    await prisma.operationalProject.upsert({
      where: { id: p.id },
      update: { name: p.name },
      create: p,
    });
  }

  const passwordHash = await bcrypt.hash('Zx.321321', 10);

  await prisma.user.upsert({
    where: { email: 'Nalshahrani@nauss.edu.sa' },
    update: {
      email: 'Nalshahrani@nauss.edu.sa',
      passwordHash,
      firstName: 'نايف',
      lastName: 'الشهراني',
      mobileNumber: '0568122221',
      roles: [Role.MANAGER, Role.EMPLOYEE],
      operationalProjectId: 'proj_1',
      isActive: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
    create: {
      email: 'Nalshahrani@nauss.edu.sa',
      passwordHash,
      firstName: 'نايف',
      lastName: 'الشهراني',
      mobileNumber: '0568122221',
      roles: [Role.MANAGER, Role.EMPLOYEE],
      operationalProjectId: 'proj_1',
      isActive: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  const elements = [
    { key: 'trainee_registration', name: 'تسجيل المتدربين في المنصة', isFormBased: false },
    { key: 'registration_message', name: 'إرسال رسالة للمتدربين', isFormBased: false },
    { key: 'advance_req', name: 'طلب السلفة المؤقتة', isFormBased: true },
    { key: 'pre_test', name: 'تقديم الاختبار القبلي', isFormBased: false },
    { key: 'reaction_evaluation', name: 'تقديم تقييم الدورة', isFormBased: false },
    { key: 'post_test', name: 'تقديم الاختبار البعدي', isFormBased: false },
    { key: 'certificates', name: 'إصدار الشهادات', isFormBased: false },
    { key: 'report', name: 'تقرير الدورة', isFormBased: true },
    { key: 'supervisor_compensation', name: 'رفع مستحقات المشرف', isFormBased: false },
    { key: 'trainer_compensation', name: 'رفع مستحقات المدرب', isFormBased: false },
    { key: 'revenues', name: 'رفع الإيرادات المالية', isFormBased: false },
    { key: 'materials', name: 'إعادة المواد التدريبية المعارة', isFormBased: false },
    { key: 'settlement', name: 'تسوية السلفة المؤقتة', isFormBased: true },
  ];

  for (const el of elements) {
    await prisma.closureElement.upsert({
      where: { key: el.key },
      update: {
        name: el.name,
        isFormBased: el.isFormBased,
      },
      create: el,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });