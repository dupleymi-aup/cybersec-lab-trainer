import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@cybersec.lab' },
  });

  if (!existingAdmin) {
    const adminHash = await bcrypt.hash('Admin@123', 12);
    await prisma.user.create({
      data: {
        id: 'usr_admin_seed',
        email: 'admin@cybersec.lab',
        phone: '+70000000000',
        fullName: 'Администратор',
        role: 'admin',
        passwordHash: adminHash,
      },
    });
    console.log('Created admin user (admin@cybersec.lab / Admin@123)');
  } else {
    console.log('Admin user already exists');
  }

  // Check if teacher already exists
  const existingTeacher = await prisma.user.findUnique({
    where: { email: 'teacher@cybersec.lab' },
  });

  if (!existingTeacher) {
    const teacherHash = await bcrypt.hash('Teacher@123', 12);
    await prisma.user.create({
      data: {
        id: 'usr_teacher_seed',
        email: 'teacher@cybersec.lab',
        phone: '+70000000001',
        fullName: 'Преподаватель',
        role: 'teacher',
        passwordHash: teacherHash,
      },
    });
    console.log('Created teacher user (teacher@cybersec.lab / Teacher@123)');
  } else {
    console.log('Teacher user already exists');
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
