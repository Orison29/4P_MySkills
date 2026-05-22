"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeliverable = exports.deleteDeliverable = exports.getDeliverableDetails = exports.getProjectDeliverables = exports.createDeliverable = void 0;
const db_1 = require("../../utils/db");
const createDeliverable = async (projectId, name, description) => {
    // Verify project exists
    const project = await db_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new Error("Project not found");
    }
    // Check for duplicate deliverable name within project
    const existingDeliverable = await db_1.prisma.deliverable.findUnique({
        where: {
            projectId_name: {
                projectId,
                name
            }
        }
    });
    if (existingDeliverable) {
        throw new Error("Deliverable with this name already exists in the project");
    }
    return db_1.prisma.deliverable.create({
        data: {
            projectId,
            name,
            description
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true
                }
            }
        }
    });
};
exports.createDeliverable = createDeliverable;
const getProjectDeliverables = async (projectId) => {
    // Verify project exists
    const project = await db_1.prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) {
        throw new Error("Project not found");
    }
    return db_1.prisma.deliverable.findMany({
        where: {
            projectId
        },
        include: {
            requiredSkills: {
                include: {
                    skill: true
                }
            },
            assignments: {
                where: {
                    releasedAt: null
                },
                include: {
                    employee: {
                        include: {
                            user: {
                                select: {
                                    email: true
                                }
                            }
                        }
                    }
                }
            },
            _count: {
                select: {
                    requiredSkills: true,
                    assignments: true,
                    assignmentRequests: true
                }
            }
        },
        orderBy: {
            createdAt: "asc"
        }
    });
};
exports.getProjectDeliverables = getProjectDeliverables;
const getDeliverableDetails = async (deliverableId) => {
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    startDate: true,
                    endDate: true
                }
            },
            requiredSkills: {
                include: {
                    skill: true
                },
                orderBy: {
                    weight: "desc"
                }
            },
            assignments: {
                where: {
                    releasedAt: null
                },
                include: {
                    employee: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            },
            assignmentRequests: {
                where: {
                    status: "PENDING"
                },
                include: {
                    employee: {
                        include: {
                            user: {
                                select: {
                                    email: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    return deliverable;
};
exports.getDeliverableDetails = getDeliverableDetails;
const deleteDeliverable = async (deliverableId) => {
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: {
            assignments: {
                where: {
                    releasedAt: null
                }
            }
        }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    // Don't allow deletion if there are active assignments
    if (deliverable.assignments.length > 0) {
        throw new Error("Cannot delete deliverable with active assignments");
    }
    return db_1.prisma.deliverable.delete({
        where: { id: deliverableId }
    });
};
exports.deleteDeliverable = deleteDeliverable;
const updateDeliverable = async (deliverableId, name, description) => {
    const deliverable = await db_1.prisma.deliverable.findUnique({
        where: { id: deliverableId }
    });
    if (!deliverable) {
        throw new Error("Deliverable not found");
    }
    // If name is being changed, check for duplicates
    if (name && name !== deliverable.name) {
        const existingDeliverable = await db_1.prisma.deliverable.findUnique({
            where: {
                projectId_name: {
                    projectId: deliverable.projectId,
                    name
                }
            }
        });
        if (existingDeliverable) {
            throw new Error("Deliverable with this name already exists in the project");
        }
    }
    return db_1.prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
            ...(name && { name }),
            ...(description !== undefined && { description })
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true
                }
            }
        }
    });
};
exports.updateDeliverable = updateDeliverable;
