import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dummy data...');

  // Create Departments
  const engDept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering' },
  });

  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources' },
  });

  const execDept = await prisma.department.upsert({
    where: { name: 'Executive' },
    update: {},
    create: { name: 'Executive' },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      profile: {
        upsert: {
          create: {
            fullname: 'System Admin',
            departmentId: execDept.id,
          },
          update: {
            departmentId: execDept.id,
          }
        }
      }
    },
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
      profile: {
        create: {
          fullname: 'System Admin',
          departmentId: execDept.id,
        }
      }
    },
  });

  // Create HR
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@example.com' },
    update: {
      profile: {
        upsert: {
          create: {
            fullname: 'HR Manager',
            departmentId: hrDept.id,
          },
          update: {
            departmentId: hrDept.id,
          }
        }
      }
    },
    create: {
      email: 'hr@example.com',
      passwordHash,
      role: Role.HR,
      profile: {
        create: {
          fullname: 'HR Manager',
          departmentId: hrDept.id,
        }
      }
    },
  });

  // Create Manager
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {
      profile: {
        upsert: {
          create: {
            fullname: 'Engineering Manager',
            departmentId: engDept.id,
          },
          update: {
            departmentId: engDept.id,
          }
        }
      }
    },
    create: {
      email: 'manager@example.com',
      passwordHash,
      role: Role.MANAGER,
      profile: {
        create: {
          fullname: 'Engineering Manager',
          departmentId: engDept.id,
        }
      }
    },
  });

  const managerProfile = await prisma.employeeProfile.findUnique({
    where: { userId: managerUser.id }
  });

  // Create Employee
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {
      profile: {
        upsert: {
          create: {
            fullname: 'Software Engineer',
            departmentId: engDept.id,
            managerId: managerProfile?.id,
          },
          update: {
            departmentId: engDept.id,
            managerId: managerProfile?.id,
          }
        }
      }
    },
    create: {
      email: 'employee@example.com',
      passwordHash,
      role: Role.EMPLOYEE,
      profile: {
        create: {
          fullname: 'Software Engineer',
          departmentId: engDept.id,
          managerId: managerProfile?.id,
        }
      }
    },
  });

  console.log('Seed completed successfully!');
  console.log({
    admin: adminUser.email,
    hr: hrUser.email,
    manager: managerUser.email,
    employee: employeeUser.email,
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
