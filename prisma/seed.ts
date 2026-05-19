import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getDefaultPassword(role: 'admin' | 'teacher'): string {
  const envVar = role === 'admin' ? 'SEED_ADMIN_PASSWORD' : 'SEED_TEACHER_PASSWORD';
  const defaultPassword = role === 'admin' ? 'Admin@123' : 'Teacher@123';
  return process.env[envVar] || defaultPassword;
}

async function main() {
  console.log('Seeding database...');

  // Warn about default passwords
  if (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_TEACHER_PASSWORD) {
    console.warn(
      '\n⚠️  WARNING: Using default seed passwords. ' +
      'Set SEED_ADMIN_PASSWORD and SEED_TEACHER_PASSWORD environment variables. ' +
      'Change default passwords immediately after first login!\n'
    );
  }

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@cybersec.lab' },
  });

  if (!existingAdmin) {
    const adminPassword = getDefaultPassword('admin');
    const adminHash = await bcrypt.hash(adminPassword, 12);
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
    console.log('Created admin user (admin@cybersec.lab)');
  } else {
    console.log('Admin user already exists');
  }

  // Check if teacher already exists
  const existingTeacher = await prisma.user.findUnique({
    where: { email: 'teacher@cybersec.lab' },
  });

  if (!existingTeacher) {
    const teacherPassword = getDefaultPassword('teacher');
    const teacherHash = await bcrypt.hash(teacherPassword, 12);
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
    console.log('Created teacher user (teacher@cybersec.lab)');
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
