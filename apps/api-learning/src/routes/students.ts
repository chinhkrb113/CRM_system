import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProfileService } from '../services/ProfileService';

const router = Router();

// Validation schemas
const querySchema = z.object({
  teamId: z.string().optional(),
  q: z.string().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10')
});

const skillUpdateSchema = z.object({
  skills: z.array(z.object({
    skillId: z.string(),
    level: z.number().min(1, 'Level must be between 1 and 10').max(10, 'Level must be between 1 and 10'),
    verified: z.boolean().optional()
  })).min(1, 'Skills array is required')
});

/**
 * @swagger
 * /api/learn/students:
 *   get:
 *     summary: Get all students
 *     description: Retrieve a paginated list of students with optional filtering
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for student name or email
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
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/students
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { teamId, q, page, limit } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (teamId) {
    where.teamId = teamId;
  }
  
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true }
        },
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
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.student.count({ where })
  ]);

  res.json({
    data: students,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/learn/students/:id
/**
 * @swagger
 * /api/learn/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     description: Retrieve detailed information about a specific student including skills, submissions, and evaluations
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Student'
 *                 - type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: integer
 *                           verified:
 *                             type: boolean
 *                           skill:
 *                             $ref: '#/components/schemas/Skill'
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *                     evaluations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Evaluation'
 *                     _count:
 *                       type: object
 *                       properties:
 *                         submissions:
 *                           type: integer
 *                         evaluations:
 *                           type: integer
 *                         givenEvals:
 *                           type: integer
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      team: true,
      skills: {
        include: {
          skill: true
        }
      },
      submissions: {
        include: {
          task: {
            select: { id: true, title: true, type: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 10
      },
      evaluations: {
        include: {
          evaluator: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          submissions: true,
          evaluations: true,
          givenEvals: true
        }
      }
    }
  });

  if (!student) {
    throw createError('Student not found', 404);
  }

  res.json(student);
}));

/**
 * @swagger
 * /api/learn/students/{id}/skills:
 *   get:
 *     summary: Get student skills
 *     description: Retrieve all skills associated with a specific student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student skills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: integer
 *                         description: Skill level (1-10)
 *                       verified:
 *                         type: boolean
 *                         description: Whether the skill is verified
 *                       skill:
 *                         $ref: '#/components/schemas/Skill'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/learn/students/:id/skills
router.get('/:id/skills', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      skills: {
        include: {
          skill: true
        },
        orderBy: [
          { level: 'desc' },
          { skill: { name: 'asc' } }
        ]
      }
    }
  });

  if (!student) {
    throw createError('Student not found', 404);
  }

  res.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email
    },
    skills: student.skills
  });
}));

/**
 * @swagger
 * /api/learn/students/{id}/skills:
 *   patch:
 *     summary: Update student skills
 *     description: Update the skills associated with a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     skillId:
 *                       type: string
 *                       description: Skill ID
 *                     level:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 5
 *                       description: Skill level (1-5)
 *                 description: Array of skills to update
 *             required:
 *               - skills
 *     responses:
 *       200:
 *         description: Student skills updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       skill:
 *                         $ref: '#/components/schemas/Skill'
 *                       level:
 *                         type: integer
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// PATCH /api/learn/students/:id/skills
router.patch('/:id/skills', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const student = await prisma.student.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!student) {
    throw createError('Student not found', 404);
  }

  const skills = await prisma.studentSkill.findMany({
    where: { studentId: id },
    include: {
      skill: true
    },
    orderBy: [
      { skill: { category: 'asc' } },
      { level: 'desc' }
    ]
  });

  res.json(skills);
}));

// PATCH /api/learn/students/:id/skills
router.patch('/:id/skills', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    
    const { skills } = skillUpdateSchema.parse(req.body);
  
    const student = await prisma.student.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!student) {
      throw createError('Student not found', 404);
    }

    // Validate skill IDs exist
    const skillIds = skills.map(s => s.skillId);
    const existingSkills = await prisma.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true }
    });
    
    const existingSkillIds = existingSkills.map((s: any) => s.id);
    const invalidSkillIds = skillIds.filter(id => !existingSkillIds.includes(id));
    
    if (invalidSkillIds.length > 0) {
      throw createError(`Invalid skill IDs: ${invalidSkillIds.join(', ')}`, 400);
    }

    // Update skills in transaction
    const updatedSkills = await prisma.$transaction(async (tx: any) => {
      const results = [];
      
      for (const skillData of skills) {
        const result = await tx.studentSkill.upsert({
          where: {
            studentId_skillId: {
              studentId: id,
              skillId: skillData.skillId
            }
          },
          update: {
            level: skillData.level,
            verified: skillData.verified ?? undefined
          },
          create: {
            studentId: id,
            skillId: skillData.skillId,
            level: skillData.level,
            verified: skillData.verified ?? false
          },
          include: {
            skill: true
          }
        });
        results.push(result);
      }
      
      return results;
    });

    res.json({ message: 'Skills updated successfully', skills: updatedSkills });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/learn/students/{id}/profile:
 *   get:
 *     summary: Get student profile
 *     description: Retrieve comprehensive profile information for a student including analytics and performance metrics
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Whether to refresh cached profile data
 *     responses:
 *       200:
 *         description: Student profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *                 analytics:
 *                   type: object
 *                   description: Student performance analytics
 *                 skills:
 *                   type: object
 *                   description: Skills breakdown and statistics
 *                 performance:
 *                   type: object
 *                   description: Performance metrics and trends
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/learn/students/:id/profile
router.get('/:id/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { refresh } = req.query;
  
  const student = await prisma.student.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!student) {
    throw createError('Student not found', 404);
  }

  const profileService = new ProfileService();
  const profile = await profileService.getStudentProfile(id, refresh === 'true');

  res.json(profile);
}));

export { router as studentsRouter };
export default router;