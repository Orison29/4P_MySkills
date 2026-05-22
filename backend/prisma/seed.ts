import 'dotenv/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { prisma } from '../src/utils/db';

async function main() {
  console.log('Seeding minimal admin/hr data...');

  const passwordHash = await bcrypt.hash('password@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      role: Role.ADMIN,
      passwordHash,
    },
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@example.com' },
    update: {
      role: Role.HR,
      passwordHash,
    },
    create: {
      email: 'hr@example.com',
      passwordHash,
      role: Role.HR,
    },
  });

  console.log('Seed completed successfully!');
  console.log({
    admin: adminUser.email,
    hr: hrUser.email,
    departments: [],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
