import 'dotenv/config';
import { Role, SkillRatingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { prisma } from '../src/utils/db';

async function main() {
  console.log('Seeding structured demo data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const deptA = await prisma.department.upsert({
    where: { name: 'A' },
    update: {},
    create: { name: 'A' },
  });
  const deptB = await prisma.department.upsert({
    where: { name: 'B' },
    update: {},
    create: { name: 'B' },
  });
  const deptC = await prisma.department.upsert({
    where: { name: 'C' },
    update: {},
    create: { name: 'C' },
  });
  const deptD = await prisma.department.upsert({
    where: { name: 'D' },
    update: {},
    create: { name: 'D' },
  });

  const departments = [deptA, deptB, deptC, deptD];

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      role: Role.ADMIN,
      passwordHash,
      profile: {
        upsert: {
          create: {
            fullname: 'System Admin',
            departmentId: deptA.id,
          },
          update: {
            fullname: 'System Admin',
            departmentId: deptA.id,
            managerId: null,
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
          departmentId: deptA.id,
        }
      }
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@example.com' },
    update: {
      role: Role.HR,
      passwordHash,
      profile: {
        upsert: {
          create: {
            fullname: 'HR Manager',
            departmentId: deptB.id,
          },
          update: {
            fullname: 'HR Manager',
            departmentId: deptB.id,
            managerId: null,
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
          departmentId: deptB.id,
        }
      }
    },
  });

  const managers: { email: string; userId: string; profileId: string; departmentId: string }[] = [];

  for (let i = 0; i < departments.length; i++) {
    const department = departments[i];
    const managerEmail = `manager${department.name.toLowerCase()}@example.com`;
    const managerFullname = `Manager ${department.name}`;

    const managerUser = await prisma.user.upsert({
      where: { email: managerEmail },
      update: {
        role: Role.MANAGER,
        passwordHash,
        profile: {
          upsert: {
            create: {
              fullname: managerFullname,
              departmentId: department.id,
              managerId: null,
            },
            update: {
              fullname: managerFullname,
              departmentId: department.id,
              managerId: null,
            },
          },
        },
      },
      create: {
        email: managerEmail,
        passwordHash,
        role: Role.MANAGER,
        profile: {
          create: {
            fullname: managerFullname,
            departmentId: department.id,
            managerId: null,
          },
        },
      },
    });

    const managerProfile = await prisma.employeeProfile.findUnique({
      where: { userId: managerUser.id },
      select: { id: true },
    });

    if (!managerProfile) {
      throw new Error(`Manager profile missing for ${managerEmail}`);
    }

    managers.push({
      email: managerEmail,
      userId: managerUser.id,
      profileId: managerProfile.id,
      departmentId: department.id,
    });
  }

  const employees: { email: string; userId: string; profileId: string; managerUserId: string }[] = [];

  for (const manager of managers) {
    const deptCode = manager.email.replace('manager', '').replace('@example.com', '').toUpperCase();

    for (let i = 1; i <= 5; i++) {
      const email = `employee${deptCode}${i}@example.com`;
      const fullname = `Employee ${deptCode}${i}`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          role: Role.EMPLOYEE,
          passwordHash,
          profile: {
            upsert: {
              create: {
                fullname,
                departmentId: manager.departmentId,
                managerId: manager.profileId,
              },
              update: {
                fullname,
                departmentId: manager.departmentId,
                managerId: manager.profileId,
              },
            },
          },
        },
        create: {
          email,
          passwordHash,
          role: Role.EMPLOYEE,
          profile: {
            create: {
              fullname,
              departmentId: manager.departmentId,
              managerId: manager.profileId,
            },
          },
        },
      });

      const profile = await prisma.employeeProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!profile) {
        throw new Error(`Employee profile missing for ${email}`);
      }

      employees.push({
        email,
        userId: user.id,
        profileId: profile.id,
        managerUserId: manager.userId,
      });
    }
  }

  const skillNames = ['Communication', 'Problem Solving', 'Leadership', 'Technical Knowledge'];
  const skills = [];

  for (const name of skillNames) {
    const skill = await prisma.skill.upsert({
      where: { name },
      update: { description: `${name} skill` },
      create: { name, description: `${name} skill` },
    });
    skills.push(skill);
  }

  // Mixed dataset pattern per employee (cycled):
  // 0 rated, 1 rated (pending), 2 rated (approved), 3 rated (mixed), 4 rated (mixed)
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    const pattern = i % 5;

    let ratedCount = 0;
    if (pattern === 0) ratedCount = 0;
    if (pattern === 1) ratedCount = 1;
    if (pattern === 2) ratedCount = 2;
    if (pattern === 3) ratedCount = 3;
    if (pattern === 4) ratedCount = 4;

    for (let s = 0; s < ratedCount; s++) {
      const skill = skills[s];
      const selfRating = ((i + s) % 5) + 1;
      const shouldBePending = (i + s) % 2 === 0;
      const status = shouldBePending ? SkillRatingStatus.PENDING : SkillRatingStatus.APPROVED;
      const approvedRating = shouldBePending ? null : selfRating;
      const reviewedBy = shouldBePending ? null : employee.managerUserId;
      const reviewedAt = shouldBePending ? null : new Date();

      await prisma.employeeSkill.upsert({
        where: {
          employeeId_skillId: {
            employeeId: employee.profileId,
            skillId: skill.id,
          },
        },
        update: {
          selfRating,
          status,
          approvedRating,
          reviewedBy,
          reviewedAt,
          reviewComment: shouldBePending ? null : 'Reviewed in seed data',
        },
        create: {
          employeeId: employee.profileId,
          skillId: skill.id,
          selfRating,
          status,
          approvedRating,
          reviewedBy,
          reviewedAt,
          reviewComment: shouldBePending ? null : 'Reviewed in seed data',
        },
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log({
    admin: adminUser.email,
    hr: hrUser.email,
    managers: managers.map((m) => m.email),
    employeeCount: employees.length,
    departments: departments.map((d) => d.name),
    skills: skillNames,
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
