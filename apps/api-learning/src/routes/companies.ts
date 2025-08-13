import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const querySchema = z.object({
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large']).optional(),
  location: z.string().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  q: z.string().optional()
});

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large']).optional(),
  location: z.string().optional(),
  website: z.string().url().optional()
});

const updateCompanySchema = createCompanySchema.partial();

/**
 * @swagger
 * /api/learn/companies:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve a paginated list of companies with optional filtering
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [startup, small, medium, large]
 *         description: Filter by company size
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
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/companies
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { industry, size, location, page, limit, q } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (industry) {
    where.industry = { contains: industry };
  }
  
  if (size) {
    where.size = size;
  }
  
  if (location) {
    where.location = { contains: location };
  }
  
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { industry: { contains: q } }
    ];
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            type: true,
            level: true,
            status: true,
            createdAt: true
          },
          where: {
            status: 'active'
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            jobs: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.company.count({ where })
  ]);

  // Add statistics
  const companiesWithStats = companies.map((company: any) => {
    const activeJobs = company.jobs.length;
    const totalJobs = company._count.jobs;
    
    return {
      ...company,
      stats: {
        activeJobs,
        totalJobs,
        recentJobs: company.jobs
      }
    };
  });

  res.json({
    data: companiesWithStats,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/learn/companies/:id
/**
 * @swagger
 * /api/learn/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Retrieve detailed information about a specific company including jobs and statistics
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Company'
 *                 - type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Job'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalJobs:
 *                           type: integer
 *                         activeJobs:
 *                           type: integer
 *                         jobsByType:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                         jobsByLevel:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                         topSkills:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Skill'
 *                               - type: object
 *                                 properties:
 *                                   jobCount:
 *                                     type: integer
 *       404:
 *         description: Company not found
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
  
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      jobs: {
        include: {
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
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!company) {
    throw createError('Company not found', 404);
  }

  // Calculate company statistics
  const stats = {
    totalJobs: company.jobs.length,
    activeJobs: company.jobs.filter((job: any) => job.status === 'active').length,
    jobsByType: company.jobs.reduce((acc: Record<string, number>, job: any) => {
      acc[job.type] = (acc[job.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    jobsByLevel: company.jobs.reduce((acc: Record<string, number>, job: any) => {
      acc[job.level] = (acc[job.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    topSkills: [] as any[]
  };

  // Calculate top skills across all jobs
  const skillCounts: Record<string, { count: number; skill: any }> = {};
  company.jobs.forEach((job: any) => {
    job.jobSkills.forEach((jobSkill: any) => {
      const skillId = jobSkill.skill.id;
      if (!skillCounts[skillId]) {
        skillCounts[skillId] = {
          count: 0,
          skill: jobSkill.skill
        };
      }
      skillCounts[skillId].count++;
    });
  });

  stats.topSkills = Object.values(skillCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      ...item.skill,
      jobCount: item.count
    }));

  res.json({
    ...company,
    stats
  });
}));

/**
 * @swagger
 * /api/learn/companies:
 *   post:
 *     summary: Create a new company
 *     description: Create a new company record
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: Company name
 *               description:
 *                 type: string
 *                 description: Company description
 *               industry:
 *                 type: string
 *                 description: Industry sector
 *               size:
 *                 type: string
 *                 enum: [startup, small, medium, large]
 *                 description: Company size
 *               location:
 *                 type: string
 *                 description: Company location
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Company website URL
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/companies
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const companyData = createCompanySchema.parse(req.body);
  
  // Check if company with same name already exists
  const existingCompany = await prisma.company.findFirst({
    where: {
      name: {
        equals: companyData.name
      }
    }
  });

  if (existingCompany) {
    throw createError('Company with this name already exists', 409);
  }

  const company = await prisma.company.create({
    data: companyData,
    include: {
      _count: {
        select: {
          jobs: true
        }
      }
    }
  });

  res.status(201).json(company);
}));

/**
 * @swagger
 * /api/learn/companies/{id}:
 *   put:
 *     summary: Update a company
 *     description: Update an existing company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
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
 *                 maxLength: 200
 *                 description: Company name
 *               description:
 *                 type: string
 *                 description: Company description
 *               industry:
 *                 type: string
 *                 description: Industry sector
 *               size:
 *                 type: string
 *                 enum: [startup, small, medium, large]
 *                 description: Company size
 *               location:
 *                 type: string
 *                 description: Company location
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Company website URL
 *           example:
 *             name: "Tech Corp Updated"
 *             description: "Updated technology company"
 *             industry: "Technology"
 *             size: "medium"
 *             location: "San Francisco, CA"
 *             website: "https://techcorp.com"
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Company not found
 *       409:
 *         description: Company name already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// PUT /api/learn/companies/:id
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const companyData = updateCompanySchema.parse(req.body);
  
  // Check if company exists
  const existingCompany = await prisma.company.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  
  if (!existingCompany) {
    throw createError('Company not found', 404);
  }

  // If name is being updated, check for duplicates
  if (companyData.name && companyData.name !== existingCompany.name) {
    const duplicateCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: companyData.name
        },
        id: { not: id }
      }
    });

    if (duplicateCompany) {
      throw createError('Company with this name already exists', 409);
    }
  }

  const company = await prisma.company.update({
    where: { id },
    data: companyData,
    include: {
      jobs: {
        select: {
          id: true,
          title: true,
          status: true
        },
        where: {
          status: 'active'
        },
        take: 5
      },
      _count: {
        select: {
          jobs: true
        }
      }
    }
  });

  res.json(company);
}));

// DELETE /api/learn/companies/:id
/**
 * @swagger
 * /api/learn/companies/{id}:
 *   delete:
 *     summary: Delete company
 *     description: Delete a company if it has no associated jobs
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company deleted successfully"
 *       400:
 *         description: Cannot delete company with existing jobs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
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
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          jobs: true
        }
      }
    }
  });
  
  if (!company) {
    throw createError('Company not found', 404);
  }

  // Check if company has jobs
  if (company._count.jobs > 0) {
    throw createError('Cannot delete company with existing jobs', 400);
  }

  await prisma.company.delete({
    where: { id }
  });

  res.json({ message: 'Company deleted successfully' });
}));

/**
 * @swagger
 * /api/learn/companies/{id}/jobs:
 *   get:
 *     summary: Get jobs by company
 *     description: Retrieve all jobs for a specific company with optional filtering
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, draft]
 *         description: Filter by job status
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
 *     responses:
 *       200:
 *         description: Company jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 jobs:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Job'
 *                       - type: object
 *                         properties:
 *                           jobSkills:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 skill:
 *                                   $ref: '#/components/schemas/Skill'
 *       404:
 *         description: Company not found
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
// GET /api/learn/companies/:id/jobs
router.get('/:id/jobs', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, type, level } = req.query;
  
  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  
  if (!company) {
    throw createError('Company not found', 404);
  }

  const where: any = { companyId: id };
  
  if (status) {
    where.status = status;
  }
  
  if (type) {
    where.type = type;
  }
  
  if (level) {
    where.level = level;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
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
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    company,
    jobs
  });
}));

export { router as companiesRouter };