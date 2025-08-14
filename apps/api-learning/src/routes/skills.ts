import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const querySchema = z.object({
  category: z.enum(['technical', 'soft', 'domain']).optional(),
  q: z.string().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20')
});

const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['technical', 'soft', 'domain']),
  description: z.string().optional()
});

const updateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['technical', 'soft', 'domain']).optional(),
  description: z.string().optional()
});

/**
 * @swagger
 * /api/learn/skills:
 *   get:
 *     summary: Get all skills
 *     description: Retrieve a paginated list of skills with optional filtering
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [technical, soft, domain]
 *         description: Filter by skill category
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for skill name or description
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of skills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/learn/skills
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, q, page, limit } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (category) {
    where.category = category;
  }
  
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: {
        _count: {
          select: {
            studentSkills: true,
            jobSkills: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    }),
    prisma.skill.count({ where })
  ]);

  // Add usage statistics
  const skillsWithStats = skills.map((skill: any) => ({
    ...skill,
    stats: {
      studentsCount: skill._count.studentSkills,
      jobsCount: skill._count.jobSkills,
      totalUsage: skill._count.studentSkills + skill._count.jobSkills
    }
  }));

  res.json({
    data: skillsWithStats,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/learn/skills/:id
/**
 * @swagger
 * /api/learn/skills/{id}:
 *   get:
 *     summary: Get skill by ID
 *     description: Retrieve detailed information about a specific skill including students and jobs using it
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID
 *     responses:
 *       200:
 *         description: Skill details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Skill'
 *                 - type: object
 *                   properties:
 *                     studentSkills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: integer
 *                           verified:
 *                             type: boolean
 *                           student:
 *                             $ref: '#/components/schemas/Student'
 *                     jobSkills:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           weight:
 *                             type: number
 *                           required:
 *                             type: boolean
 *                           job:
 *                             $ref: '#/components/schemas/Job'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         studentsCount:
 *                           type: integer
 *                         jobsCount:
 *                           type: integer
 *                         averageStudentLevel:
 *                           type: number
 *                         averageJobWeight:
 *                           type: number
 *                         verifiedStudentsCount:
 *                           type: integer
 *       404:
 *         description: Skill not found
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
  
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      studentSkills: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { level: 'desc' }
      },
      jobSkills: {
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { weight: 'desc' }
      },
      _count: {
        select: {
          studentSkills: true,
          jobSkills: true
        }
      }
    }
  });

  if (!skill) {
    throw createError('Skill not found', 404);
  }

  // Calculate statistics
  const stats = {
    studentsCount: skill._count.studentSkills,
    jobsCount: skill._count.jobSkills,
    averageStudentLevel: 0,
    averageJobWeight: 0,
    verifiedStudentsCount: 0
  };

  if (skill.studentSkills.length > 0) {
    stats.averageStudentLevel = skill.studentSkills.reduce((sum: any, ss: any) => sum + ss.level, 0) / skill.studentSkills.length;
    stats.verifiedStudentsCount = skill.studentSkills.filter((ss:any) => ss.verified).length;
  }

  if (skill.jobSkills.length > 0) {
    stats.averageJobWeight = skill.jobSkills.reduce((sum: any, js: any) => sum + js.weight, 0) / skill.jobSkills.length;
  }

  res.json({
    ...skill,
    stats
  });
}));

/**
 * @swagger
 * /api/learn/skills:
 *   post:
 *     summary: Create a new skill
 *     description: Create a new skill in the system
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSkill'
 *           example:
 *             name: "JavaScript"
 *             category: "technical"
 *             description: "Programming language for web development"
 *     responses:
 *       201:
 *         description: Skill created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Bad request - validation error or skill already exists
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
// POST /api/learn/skills
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const skillData = createSkillSchema.parse(req.body);
  
  // Check if skill with same name already exists
  const existingSkill = await prisma.skill.findUnique({
    where: { name: skillData.name },
    select: { id: true, name: true }
  });
  
  if (existingSkill) {
    throw createError(`Skill with name '${skillData.name}' already exists`, 400);
  }

  const skill = await prisma.skill.create({
    data: skillData,
    include: {
      _count: {
        select: {
          studentSkills: true,
          jobSkills: true
        }
      }
    }
  });

  res.status(201).json(skill);
}));

/**
 * @swagger
 * /api/learn/skills/{id}:
 *   put:
 *     summary: Update a skill
 *     description: Update an existing skill by ID
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Skill name
 *               category:
 *                 type: string
 *                 enum: [technical, soft, domain]
 *                 description: Skill category
 *               description:
 *                 type: string
 *                 description: Skill description
 *           example:
 *             name: "Advanced JavaScript"
 *             category: "technical"
 *             description: "Advanced JavaScript programming concepts"
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Bad request - validation error or name conflict
 *       404:
 *         description: Skill not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// PUT /api/learn/skills/:id
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const skillData = updateSkillSchema.parse(req.body);
  
  // Check if skill exists
  const existingSkill = await prisma.skill.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  
  if (!existingSkill) {
    throw createError('Skill not found', 404);
  }

  // Check if name is being changed and if new name already exists
  if (skillData.name && skillData.name !== existingSkill.name) {
    const nameConflict = await prisma.skill.findUnique({
      where: { name: skillData.name },
      select: { id: true }
    });
    
    if (nameConflict) {
      throw createError(`Skill with name '${skillData.name}' already exists`, 400);
    }
  }

  const skill = await prisma.skill.update({
    where: { id },
    data: skillData,
    include: {
      _count: {
        select: {
          studentSkills: true,
          jobSkills: true
        }
      }
    }
  });

  res.json(skill);
}));

/**
 * @swagger
 * /api/learn/skills/{id}:
 *   delete:
 *     summary: Delete skill
 *     description: Delete a skill if it's not being used by any students or jobs
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID
 *     responses:
 *       200:
 *         description: Skill deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Skill deleted successfully"
 *       400:
 *         description: Cannot delete skill as it's being used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill not found
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
// DELETE /api/learn/skills/:id
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if skill exists
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          studentSkills: true,
          jobSkills: true
        }
      }
    }
  });
  
  if (!skill) {
    throw createError('Skill not found', 404);
  }

  // Check if skill is being used
  const totalUsage = skill._count.studentSkills + skill._count.jobSkills;
  if (totalUsage > 0) {
    throw createError(
      `Cannot delete skill '${skill.name}' as it is being used by ${skill._count.studentSkills} students and ${skill._count.jobSkills} jobs`,
      400
    );
  }

  await prisma.skill.delete({
    where: { id }
  });

  res.json({ message: 'Skill deleted successfully' });
}));

/**
 * @swagger
 * /api/learn/skills/categories/stats:
 *   get:
 *     summary: Get skills statistics by category
 *     description: Retrieve statistics about skills grouped by category including usage counts
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills category statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         enum: [technical, soft, domain]
 *                         description: Skill category
 *                       skillsCount:
 *                         type: integer
 *                         description: Number of skills in this category
 *                       studentUsage:
 *                         type: integer
 *                         description: Number of students using skills from this category
 *                       jobUsage:
 *                         type: integer
 *                         description: Number of jobs requiring skills from this category
 *                       totalUsage:
 *                         type: integer
 *                         description: Total usage count (students + jobs)
 *                 totalSkills:
 *                   type: integer
 *                   description: Total number of skills across all categories
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/learn/skills/categories/stats
router.get('/categories/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await prisma.skill.groupBy({
    by: ['category'],
    _count: {
      id: true
    }
  });

  // Get usage statistics for each category
  const categoryStats = await Promise.all(
    stats.map(async (stat: any) => {
      const [studentUsage, jobUsage] = await Promise.all([
        prisma.studentSkill.count({
          where: {
            skill: {
              category: stat.category
            }
          }
        }),
        prisma.jobSkill.count({
          where: {
            skill: {
              category: stat.category
            }
          }
        })
      ]);

      return {
        category: stat.category,
        skillsCount: stat._count.id,
        studentUsage,
        jobUsage,
        totalUsage: studentUsage + jobUsage
      };
    })
  );

  res.json({
    categories: categoryStats,
    totalSkills: stats.reduce((sum: any, stat: any) => sum + stat._count.id, 0)
  });
}));

export { router as skillsRouter };