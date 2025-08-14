import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { AiJdService } from '../services/AiJdService';

const router = Router();

// Validation schemas
const querySchema = z.object({
  companyId: z.string().optional(),
  type: z.enum(['full-time', 'part-time', 'internship']).optional(),
  level: z.enum(['entry', 'mid', 'senior']).optional(),
  status: z.enum(['active', 'closed', 'draft']).optional(),
  location: z.string().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  q: z.string().optional()
});

const createJobSchema = z.object({
  companyId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  requirements: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  type: z.enum(['full-time', 'part-time', 'internship']).default('full-time'),
  level: z.enum(['entry', 'mid', 'senior']).default('entry'),
  status: z.enum(['active', 'closed', 'draft']).default('active')
});

const updateJobSchema = createJobSchema.partial().omit({ companyId: true });

const matchQuerySchema = z.object({
  topK: z.string().transform(Number).optional().default('10'),
  wSkill: z.string().transform(Number).optional().default('0.7'),
  wEval: z.string().transform(Number).optional().default('0.3')
});

/**
 * @swagger
 * /api/learn/jobs:
 *   get:
 *     summary: Get all jobs
 *     description: Retrieve a paginated list of jobs with optional filtering
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full-time, part-time, internship]
 *         description: Filter by job type
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [entry, mid, senior]
 *         description: Filter by job level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, draft]
 *         description: Filter by job status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
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
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/jobs
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { companyId, type, level, status, location, page, limit, q } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (companyId) {
    where.companyId = companyId;
  }
  
  if (type) {
    where.type = type;
  }
  
  if (level) {
    where.level = level;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }
  
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { requirements: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            location: true
          }
        },
        jobSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        _count: {
          select: {
            jobSkills: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.job.count({ where })
  ]);

  // Add metadata
  const jobsWithMeta = jobs.map((job: any) => {
    const skillsByCategory = job.jobSkills.reduce((acc: any, jobSkill: any) => {
      const category = jobSkill.skill.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(jobSkill.skill);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      ...job,
      meta: {
        skillCount: job.jobSkills.length,
        skillsByCategory,
        isParsed: !!job.parsedData
      }
    };
  });

  res.json({
    data: jobsWithMeta,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/learn/jobs/:id
/**
 * @swagger
 * /api/learn/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     description: Retrieve a specific job by its ID with company and skills information
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 requirements:
 *                   type: string
 *                 location:
 *                   type: string
 *                 salary:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [full-time, part-time, internship]
 *                 level:
 *                   type: string
 *                   enum: [entry, mid, senior]
 *                 status:
 *                   type: string
 *                   enum: [active, closed, draft]
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *                 skillsByCategory:
 *                   type: object
 *                   description: Skills grouped by category
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      jobSkills: {
        include: {
          skill: true
        },
        orderBy: [
          { skill: { category: 'asc' } },
          { weight: 'desc' }
        ]
      }
    }
  });

  if (!job) {
    throw createError('Job not found', 404);
  }

  // Group skills by category
  const skillsByCategory = job.jobSkills.reduce((acc: any, jobSkill: any) => {
    const category = jobSkill.skill.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({
      ...jobSkill.skill,
      required: jobSkill.required,
      weight: jobSkill.weight
    });
    return acc;
  }, {} as Record<string, any[]>);

  res.json({
    ...job,
    skillsByCategory
  });
}));

/**
 * @swagger
 * /api/learn/jobs:
 *   post:
 *     summary: Create a new job
 *     description: Create a new job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - title
 *               - description
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: ID of the company posting the job
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Job title
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Job description
 *               requirements:
 *                 type: string
 *                 description: Job requirements
 *               location:
 *                 type: string
 *                 description: Job location
 *               salary:
 *                 type: string
 *                 description: Salary information
 *               type:
 *                 type: string
 *                 enum: [full-time, part-time, internship]
 *                 default: full-time
 *                 description: Job type
 *               level:
 *                 type: string
 *                 enum: [entry, mid, senior]
 *                 default: entry
 *                 description: Job level
 *               status:
 *                 type: string
 *                 enum: [active, closed, draft]
 *                 default: active
 *                 description: Job status
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/jobs
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const jobData = createJobSchema.parse(req.body);
  
  // Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: jobData.companyId },
    select: { id: true, name: true }
  });
  
  if (!company) {
    throw createError('Company not found', 404);
  }

  const job = await prisma.job.create({
    data: jobData,
    include: {
      company: {
        select: {
          id: true,
          name: true,
          industry: true
        }
      },
      jobSkills: {
        include: {
          skill: true
        }
      }
    }
  });

  res.status(201).json(job);
}));

/**
 * @swagger
 * /api/learn/jobs/{id}:
 *   put:
 *     summary: Update a job
 *     description: Update an existing job by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Job title
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Job description
 *               requirements:
 *                 type: string
 *                 description: Job requirements
 *               location:
 *                 type: string
 *                 description: Job location
 *               salary:
 *                 type: string
 *                 description: Salary range
 *               type:
 *                 type: string
 *                 enum: [full-time, part-time, internship]
 *                 description: Job type
 *               level:
 *                 type: string
 *                 enum: [entry, mid, senior]
 *                 description: Job level
 *               status:
 *                 type: string
 *                 enum: [active, closed, draft]
 *                 description: Job status
 *           example:
 *             title: "Senior Software Engineer"
 *             description: "We are looking for a senior software engineer..."
 *             requirements: "5+ years of experience in software development"
 *             location: "Remote"
 *             salary: "$120,000 - $150,000"
 *             type: "full-time"
 *             level: "senior"
 *             status: "active"
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// PUT /api/learn/jobs/:id
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const jobData = updateJobSchema.parse(req.body);
  
  // Check if job exists
  const existingJob = await prisma.job.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!existingJob) {
    throw createError('Job not found', 404);
  }

  const job = await prisma.job.update({
    where: { id },
    data: jobData,
    include: {
      company: {
        select: {
          id: true,
          name: true,
          industry: true
        }
      },
      jobSkills: {
        include: {
          skill: true
        }
      }
    }
  });

  res.json(job);
}));

// DELETE /api/learn/jobs/:id
/**
 * @swagger
 * /api/learn/jobs/{id}:
 *   delete:
 *     summary: Delete a job
 *     description: Delete a job by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job deleted successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, title: true }
  });
  
  if (!job) {
    throw createError('Job not found', 404);
  }

  // Delete job and related job skills (cascade)
  await prisma.job.delete({
    where: { id }
  });

  res.json({ message: 'Job deleted successfully' });
}));

/**
 * @swagger
 * /api/learn/jobs/{id}/parse:
 *   post:
 *     summary: Parse job description
 *     description: Use AI to parse job description and extract skills and requirements
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job description parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *                 parseResult:
 *                   type: object
 *                   description: AI parsing results
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/jobs/:id/parse
router.post('/:id/parse', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: {
        select: { id: true, name: true, industry: true }
      }
    }
  });
  
  if (!job) {
    throw createError('Job not found', 404);
  }

  try {
    // Call AI-JD service to parse job description
    const aiJdService = new AiJdService();
    const parseResult = await aiJdService.parseJobDescription({
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
      company: job.company.name,
      industry: job.company.industry || ''
    });

    // Update job with parsed data
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        parsedData: parseResult as any
      },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });

    // If skills were extracted, create job skills
    if (parseResult.skills && Array.isArray(parseResult.skills)) {
      await prisma.$transaction(async (tx: any) => {
        // Remove existing job skills
        await tx.jobSkill.deleteMany({
          where: { jobId: id }
        });

        // Create skills if they don't exist and add job skills
        for (const skillData of parseResult.skills) {
          const skill = await tx.skill.upsert({
            where: { name: skillData.name },
            update: {},
            create: {
              name: skillData.name,
              category: skillData.category || 'technical',
              description: skillData.description
            }
          });

          await tx.jobSkill.create({
            data: {
              jobId: id,
              skillId: skill.id,
              required: skillData.required ?? true,
              weight: skillData.weight ?? 1.0
            }
          });
        }
      });
    }

    res.json({
      message: 'Job description parsed successfully',
      job: updatedJob,
      parseResult
    });

  } catch (error) {
    console.error('AI-JD parse error:', error);
    throw createError('Failed to parse job description', 500);
  }
}));

/**
 * @swagger
 * /api/learn/jobs/{id}/match:
 *   get:
 *     summary: Job matching
 *     description: Find and rank candidates that match the job requirements using AI
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: query
 *         name: topK
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top candidates to return
 *       - in: query
 *         name: wSkill
 *         schema:
 *           type: number
 *           default: 0.7
 *         description: Weight for skill matching (0-1)
 *       - in: query
 *         name: wEval
 *         schema:
 *           type: number
 *           default: 0.3
 *         description: Weight for evaluation scores (0-1)
 *     responses:
 *       200:
 *         description: Candidate matching results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     company:
 *                       type: object
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Matched candidates with scores
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     totalCandidates:
 *                       type: integer
 *                     topK:
 *                       type: integer
 *                     weights:
 *                       type: object
 *                     matchedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/jobs/:id/match
router.get('/:id/match', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { topK, wSkill, wEval } = matchQuerySchema.parse(req.query);
  
  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: {
        select: { id: true, name: true }
      },
      jobSkills: {
        include: {
          skill: true
        }
      }
    }
  });
  
  if (!job) {
    throw createError('Job not found', 404);
  }

  try {
    // Get all students with their profiles
    const students = await prisma.student.findMany({
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        evaluations: {
          select: {
            type: true,
            category: true,
            score: true
          }
        },
        profiles: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Prepare data for AI-JD matching service
    const jobData = {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
      skills: job.jobSkills.map((js: any) => ({
        name: js.skill.name,
        category: js.skill.category,
        required: js.required,
        weight: js.weight
      })),
      parsedData: job.parsedData
    };

    const candidatesData = students.map((student: any) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      skills: student.skills.map((ss: any) => ({
        name: ss.skill.name,
        category: ss.skill.category,
        level: ss.level,
        verified: ss.verified
      })),
      evaluations: student.evaluations,
      profile: student.profiles[0]?.profileJson || {}
    }));

    // Call AI-JD matching service
    const aiJdService = new AiJdService();
    const matchResult = await aiJdService.matchCandidates({
      job: jobData,
      candidates: candidatesData,
      topK,
      weights: {
        skill: wSkill,
        evaluation: wEval
      }
    });

    res.json({
      job: {
        id: job.id,
        title: job.title,
        company: job.company
      },
      matches: matchResult.matches,
      metadata: {
        totalCandidates: students.length,
        topK,
        weights: {
          skill: wSkill,
          evaluation: wEval
        },
        matchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI-JD match error:', error);
    throw createError('Failed to match candidates', 500);
  }
}));

// GET /api/learn/jobs/:id/skills
/**
 * @swagger
 * /api/learn/jobs/{id}/skills:
 *   get:
 *     summary: Get job skills
 *     description: Retrieve skills associated with a specific job, grouped by category
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job skills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                 skillsByCategory:
 *                   type: object
 *                   description: Skills grouped by category with weights and requirements
 *                 totalSkills:
 *                   type: integer
 *                   description: Total number of skills for this job
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id/skills', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, title: true }
  });
  
  if (!job) {
    throw createError('Job not found', 404);
  }

  const jobSkills = await prisma.jobSkill.findMany({
    where: { jobId: id },
    include: {
      skill: true
    },
    orderBy: [
      { skill: { category: 'asc' } },
      { weight: 'desc' }
    ]
  });

  // Group by category
  const skillsByCategory = jobSkills.reduce((acc: any, jobSkill: any) => {
    const category = jobSkill.skill.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({
      id: jobSkill.id,
      skill: jobSkill.skill,
      required: jobSkill.required,
      weight: jobSkill.weight
    });
    return acc;
  }, {} as Record<string, any[]>);

  res.json({
    job,
    skillsByCategory,
    totalSkills: jobSkills.length
  });
}));

export { router as jobsRouter };