import { TaskStatus } from "@prisma/client";
import { prisma } from "../../utils/db";

export const updateTaskStatus = async (
  taskId: string,
  userId: string,
  status: TaskStatus
) => {
  const employee = await prisma.employeeProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!employee) {
    throw new Error("Employee profile not found");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, employeeId: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.employeeId !== employee.id) {
    throw new Error("Unauthorized");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
};

export const getMyTasks = async (userId: string) => {
  const employee = await prisma.employeeProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!employee) {
    return [];
  }

  return prisma.task.findMany({
    where: { employeeId: employee.id },
    include: {
      project: { select: { id: true, name: true } },
      deliverable: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getManagerTeamTasks = async (userId: string) => {
  const manager = await prisma.employeeProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!manager) {
    return [];
  }

  return prisma.task.findMany({
    where: { employee: { managerId: manager.id } },
    include: {
      employee: {
        select: {
          id: true,
          fullname: true,
          user: { select: { email: true } },
        },
      },
      project: { select: { id: true, name: true } },
      deliverable: { select: { id: true, name: true } },
    },
    orderBy: [{ employeeId: "asc" }, { createdAt: "desc" }],
  });
};
