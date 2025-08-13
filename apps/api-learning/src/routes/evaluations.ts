import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const querySchema = z.object({
  studentId: z.string().optional(),
  evaluatorId: z.string().optional(),
  type: z.enum(['360', 'peer', 'self', 'instructor']).optional(),
  category: z.string().optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10')
});

const createEvaluationSchema = z.object({
  studentId: z.string(),
  evaluatorId: z.string(),
  type: z.enum(['360', 'peer', 'self', 'instructor']),
  category: z.string().min(1),
  score: z.number().min(1).max(10),
  feedback: z.string().optional()
});

const bulkEvaluationSchema = z.object({
  evaluations: z.array(createEvaluationSchema).min(1).max(50)
});

/**
 * @swagger
 * /api/learn/evaluations:
 *   get:
 *     summary: Get all evaluations
 *     description: Retrieve a paginated list of evaluations with optional filtering
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: evaluatorId
 *         schema:
 *           type: string
 *         description: Filter by evaluator ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [360, peer, self, instructor]
 *         description: Filter by evaluation type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
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
 *         description: List of evaluations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/evaluations
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { studentId, evaluatorId, type, category, page, limit } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (studentId) {
    where.studentId = studentId;
  }
  
  if (evaluatorId) {
    where.evaluatorId = evaluatorId;
  }
  
  if (type) {
    where.type = type;
  }
  
  if (category) {
    where.category = category;
  }

  const [evaluations, total] = await Promise.all([
    prisma.evaluation.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.evaluation.count({ where })
  ]);

  res.json({
    data: evaluations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/learn/evaluations/:id
/**
 * @swagger
 * /api/learn/evaluations/{id}:
 *   get:
 *     summary: Get evaluation by ID
 *     description: Retrieve a specific evaluation by its ID with student and evaluator information
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Evaluation ID
 *     responses:
 *       200:
 *         description: Evaluation details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 studentId:
 *                   type: string
 *                 evaluatorId:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [360, peer, self, instructor]
 *                 category:
 *                   type: string
 *                 score:
 *                   type: number
 *                   minimum: 1
 *                   maximum: 10
 *                 feedback:
 *                   type: string
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *                 evaluator:
 *                   $ref: '#/components/schemas/Student'
 *       404:
 *         description: Evaluation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      student: {
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
          }
        }
      },
      evaluator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  });

  if (!evaluation) {
    throw createError('Evaluation not found', 404);
  }

  res.json(evaluation);
}));

/**
 * @swagger
 * /api/learn/evaluations:
 *   post:
 *     summary: Create a new evaluation
 *     description: Create a new evaluation for a student
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - evaluatorId
 *               - type
 *               - category
 *               - score
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: ID of the student being evaluated
 *               evaluatorId:
 *                 type: string
 *                 description: ID of the evaluator
 *               type:
 *                 type: string
 *                 enum: [360, peer, self, instructor]
 *                 description: Type of evaluation
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 description: Evaluation category
 *               score:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Evaluation score
 *               feedback:
 *                 type: string
 *                 description: Optional feedback text
 *     responses:
 *       201:
 *         description: Evaluation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evaluation'
 *       400:
 *         description: Invalid input data or self-evaluation not allowed
 *       404:
 *         description: Student or evaluator not found
 *       409:
 *         description: Evaluation already exists for this combination
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/evaluations
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const evaluationData = createEvaluationSchema.parse(req.body);
  
  // Verify student exists
  const student = await prisma.student.findUnique({
    where: { id: evaluationData.studentId },
    select: { id: true, name: true }
  });
  
  if (!student) {
    throw createError('Student not found', 404);
  }

  // Verify evaluator exists
  const evaluator = await prisma.student.findUnique({
    where: { id: evaluationData.evaluatorId },
    select: { id: true, name: true }
  });
  
  if (!evaluator) {
    throw createError('Evaluator not found', 404);
  }

  // Prevent self-evaluation for non-self types
  if (evaluationData.type !== 'self' && evaluationData.studentId === evaluationData.evaluatorId) {
    throw createError('Students cannot evaluate themselves unless type is "self"', 400);
  }

  // Check for duplicate evaluation
  const existingEvaluation = await prisma.evaluation.findFirst({
    where: {
      studentId: evaluationData.studentId,
      evaluatorId: evaluationData.evaluatorId,
      type: evaluationData.type,
      category: evaluationData.category
    }
  });

  if (existingEvaluation) {
    throw createError('Evaluation already exists for this combination', 409);
  }

  const evaluation = await prisma.evaluation.create({
    data: evaluationData,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      evaluator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.status(201).json(evaluation);
}));

/**
 * @swagger
 * /api/learn/evaluations/bulk:
 *   post:
 *     summary: Create multiple evaluations
 *     description: Create multiple evaluations in a single request with validation and duplicate checking
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - evaluations
 *             properties:
 *               evaluations:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                     - evaluatorId
 *                     - type
 *                     - category
 *                     - score
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       description: ID of the student being evaluated
 *                     evaluatorId:
 *                       type: string
 *                       description: ID of the evaluator
 *                     type:
 *                       type: string
 *                       enum: [360, peer, self, instructor]
 *                       description: Type of evaluation
 *                     category:
 *                       type: string
 *                       minLength: 1
 *                       description: Evaluation category
 *                     score:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 10
 *                       description: Evaluation score
 *                     feedback:
 *                       type: string
 *                       description: Optional feedback text
 *     responses:
 *       201:
 *         description: Evaluations created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully created 5 evaluations"
 *                 evaluations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evaluation'
 *       400:
 *         description: Bad request - validation errors or duplicates
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student or evaluator not found
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/evaluations/bulk
router.post('/bulk', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { evaluations } = bulkEvaluationSchema.parse(req.body);
  
  // Validate all students and evaluators exist
  const studentIds = [...new Set(evaluations.map((e: any) => e.studentId))];
  const evaluatorIds = [...new Set(evaluations.map((e: any) => e.evaluatorId))];
  const allUserIds = [...new Set([...studentIds, ...evaluatorIds])];
  
  const users = await prisma.student.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true }
  });
  
  const foundUserIds = new Set(users.map((u: any) => u.id));
  const missingUsers = allUserIds.filter(id => !foundUserIds.has(id));
  
  if (missingUsers.length > 0) {
    throw createError(`Users not found: ${missingUsers.join(', ')}`, 404);
  }

  // Check for duplicates within the batch and existing evaluations
  const evaluationKeys = evaluations.map((e: any) => 
    `${e.studentId}-${e.evaluatorId}-${e.type}-${e.category}`
  );
  
  const duplicateKeys = evaluationKeys.filter((key, index) => 
    evaluationKeys.indexOf(key) !== index
  );
  
  if (duplicateKeys.length > 0) {
    throw createError('Duplicate evaluations found in batch', 400);
  }

  // Create evaluations in transaction
  const createdEvaluations = await prisma.$transaction(async (tx: any) => {
    const results = [];
    
    for (const evalData of evaluations) {
      // Check for existing evaluation
      const existing = await tx.evaluation.findFirst({
        where: {
          studentId: evalData.studentId,
          evaluatorId: evalData.evaluatorId,
          type: evalData.type,
          category: evalData.category
        }
      });
      
      if (existing) {
        throw new Error(`Evaluation already exists: ${evalData.studentId}-${evalData.evaluatorId}-${evalData.type}-${evalData.category}`);
      }
      
      const evaluation = await tx.evaluation.create({
        data: evalData,
        include: {
          student: {
            select: { id: true, name: true }
          },
          evaluator: {
            select: { id: true, name: true }
          }
        }
      });
      
      results.push(evaluation);
    }
    
    return results;
  });

  res.status(201).json({
    message: `Successfully created ${createdEvaluations.length} evaluations`,
    evaluations: createdEvaluations
  });
}));

/**
 * @swagger
 * /api/learn/evaluations/stats/{studentId}:
 *   get:
 *     summary: Get evaluation statistics for a student
 *     description: Retrieve comprehensive evaluation statistics for a specific student including overall stats, breakdown by type and category, and recent evaluations
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the student
 *     responses:
 *       200:
 *         description: Student evaluation statistics
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
 *                 overall:
 *                   type: object
 *                   properties:
 *                     totalEvaluations:
 *                       type: integer
 *                       description: Total number of evaluations
 *                     averageScore:
 *                       type: number
 *                       description: Average score across all evaluations
 *                     highestScore:
 *                       type: number
 *                       description: Highest score received
 *                     lowestScore:
 *                       type: number
 *                       description: Lowest score received
 *                 byType:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       totalScore:
 *                         type: number
 *                       averageScore:
 *                         type: number
 *                       scores:
 *                         type: array
 *                         items:
 *                           type: number
 *                 byCategory:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       totalScore:
 *                         type: number
 *                       averageScore:
 *                         type: number
 *                       scores:
 *                         type: array
 *                         items:
 *                           type: number
 *                 recentEvaluations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       category:
 *                         type: string
 *                       score:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/evaluations/stats/:studentId
router.get('/stats/:studentId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { studentId } = req.params;
  
  // Verify student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true }
  });
  
  if (!student) {
    throw createError('Student not found', 404);
  }

  // Get evaluation statistics
  const evaluations = await prisma.evaluation.findMany({
    where: { studentId },
    select: {
      type: true,
      category: true,
      score: true,
      createdAt: true
    }
  });

  // Calculate statistics by type and category
  const statsByType: Record<string, any> = {};
  const statsByCategory: Record<string, any> = {};
  
  evaluations.forEach((evaluation: any) => {
    // By type
    if (!statsByType[evaluation.type]) {
      statsByType[evaluation.type] = {
        count: 0,
        totalScore: 0,
        averageScore: 0,
        scores: []
      };
    }
    statsByType[evaluation.type].count++;
    statsByType[evaluation.type].totalScore += evaluation.score;
    statsByType[evaluation.type].scores.push(evaluation.score);
    
    // By category
    if (!statsByCategory[evaluation.category]) {
      statsByCategory[evaluation.category] = {
        count: 0,
        totalScore: 0,
        averageScore: 0,
        scores: []
      };
    }
    statsByCategory[evaluation.category].count++;
    statsByCategory[evaluation.category].totalScore += evaluation.score;
    statsByCategory[evaluation.category].scores.push(evaluation.score);
  });

  // Calculate averages
  Object.values(statsByType).forEach((stats: any) => {
    stats.averageScore = stats.totalScore / stats.count;
  });
  
  Object.values(statsByCategory).forEach((stats: any) => {
    stats.averageScore = stats.totalScore / stats.count;
  });

  const overallStats = {
    totalEvaluations: evaluations.length,
    averageScore: evaluations.length > 0 
      ? evaluations.reduce((sum: any, e: any) => sum + e.score, 0) / evaluations.length 
      : 0,
    highestScore: evaluations.length > 0 ? Math.max(...evaluations.map((e: any) => e.score)) : 0,
    lowestScore: evaluations.length > 0 ? Math.min(...evaluations.map((e: any) => e.score)) : 0
  };

  res.json({
    student,
    overall: overallStats,
    byType: statsByType,
    byCategory: statsByCategory,
    recentEvaluations: evaluations
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  });
}));

export { router as evaluationsRouter };