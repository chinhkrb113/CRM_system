import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const querySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  q: z.string().optional()
});

const assignMemberSchema = z.object({
  studentIds: z.array(z.string()).min(1)
});

/**
 * @swagger
 * /api/learn/teams:
 *   get:
 *     summary: Get all teams
 *     description: Retrieve a paginated list of teams with optional search
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for team name or description
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/teams
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit, q } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      include: {
        students: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            students: true,
            tasks: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.team.count({ where })
  ]);

  res.json({
    data: teams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * @swagger
 * /api/learn/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     description: Retrieve detailed information about a specific team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/teams/:id
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          skills: {
            include: {
              skill: {
                select: { id: true, name: true, category: true }
              }
            }
          },
          _count: {
            select: {
              submissions: true,
              evaluations: true
            }
          }
        }
      },
      tasks: {
        include: {
          submissions: {
            include: {
              student: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!team) {
    throw createError('Team not found', 404);
  }

  // Calculate team statistics
  const stats = {
    totalMembers: team.students.length,
    totalTasks: team.tasks.length,
    completedTasks: team.tasks.filter((task:any) => 
      task.submissions.length === team.students.length
    ).length,
    averageSkillLevel: 0
  };

  // Calculate average skill level
  const allSkills = team.students.flatMap((student:any) => student.skills);
  if (allSkills.length > 0) {
    stats.averageSkillLevel = allSkills.reduce((sum:any, skill:any) => sum + skill.level, 0) / allSkills.length;
  }

  res.json({
    ...team,
    stats
  });
}));

/**
 * @swagger
 * /api/learn/teams/{id}/members:
 *   post:
 *     summary: Assign students to team
 *     description: Add multiple students to a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentIds
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of student IDs to assign
 *     responses:
 *       200:
 *         description: Students assigned successfully
 *       404:
 *         description: Team not found
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/teams/:id/members
router.post('/:id/members', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { studentIds } = assignMemberSchema.parse(req.body);
  
  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  
  if (!team) {
    throw createError('Team not found', 404);
  }

  // Check if all students exist and are not already in a team
  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds }
    },
    select: {
      id: true,
      name: true,
      teamId: true
    }
  });

  if (students.length !== studentIds.length) {
    throw createError('One or more students not found', 404);
  }

  const studentsWithTeam = students.filter((student:any) => student.teamId !== null);
  if (studentsWithTeam.length > 0) {
    throw createError(
      `Students already in teams: ${studentsWithTeam.map((s:any) => s.name).join(', ')}`,
      400
    );
  }

  // Assign students to team
  const updatedStudents = await prisma.$transaction(async (tx:any) => {
    return Promise.all(
      studentIds.map(studentId =>
        tx.student.update({
          where: { id: studentId },
          data: { teamId: id },
          include: {
            skills: {
              include: {
                skill: {
                  select: { id: true, name: true, category: true }
                }
              }
            }
          }
        })
      )
    );
  });

  res.json({
    message: `Successfully assigned ${updatedStudents.length} students to team ${team.name}`,
    students: updatedStudents
  });
}));

/**
 * @swagger
 * /api/learn/teams/{id}/members/{studentId}:
 *   delete:
 *     summary: Remove student from team
 *     description: Remove a specific student from a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID to remove
 *     responses:
 *       200:
 *         description: Student removed successfully
 *       404:
 *         description: Team or student not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// DELETE /api/learn/teams/:id/members/:studentId
router.delete('/:id/members/:studentId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, studentId } = req.params;
  
  // Check if team exists
  const team = await prisma.team.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  
  if (!team) {
    throw createError('Team not found', 404);
  }

  // Check if student exists and is in this team
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, teamId: true }
  });

  if (!student) {
    throw createError('Student not found', 404);
  }

  if (student.teamId !== id) {
    throw createError('Student is not a member of this team', 400);
  }

  // Remove student from team
  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: { teamId: null },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  res.json({
    message: `Successfully removed ${student.name} from team ${team.name}`,
    student: updatedStudent
  });
}));

export { router as teamsRouter };