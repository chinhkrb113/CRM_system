import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const querySchema = z.object({
  taskId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.enum(['submitted', 'evaluated', 'graded']).optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10')
});

const createSubmissionSchema = z.object({
  taskId: z.string(),
  studentId: z.string(),
  content: z.string().min(1) // JSON string or file path
});

const evaluateSubmissionSchema = z.object({
  score: z.number().min(0).max(1000),
  feedback: z.string().optional(),
  rubric: z.record(z.any()).optional() // Flexible rubric object
});

/**
 * @swagger
 * /api/learn/submissions:
 *   get:
 *     summary: Get all submissions
 *     description: Retrieve a paginated list of submissions with optional filtering
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         description: Filter by task ID
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, evaluated, graded]
 *         description: Filter by submission status
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
 *         description: List of submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/submissions
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, studentId, status, page, limit } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (taskId) {
    where.taskId = taskId;
  }
  
  if (studentId) {
    where.studentId = studentId;
  }
  
  if (status) {
    where.status = status;
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true,
            maxScore: true,
            dueDate: true
          }
        },
        student: {
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
      orderBy: { submittedAt: 'desc' }
    }),
    prisma.submission.count({ where })
  ]);

  // Add additional metadata
  const submissionsWithMeta = submissions.map((submission: any) => {
    const isLate = submission.task.dueDate && 
      new Date(submission.submittedAt) > new Date(submission.task.dueDate);
    
    const scorePercentage = submission.score && submission.task.maxScore 
      ? (submission.score / submission.task.maxScore) * 100 
      : null;

    return {
      ...submission,
      meta: {
        isLate,
        scorePercentage: scorePercentage ? Math.round(scorePercentage) : null,
        hasRubric: !!submission.rubric
      }
    };
  });

  res.json({
    data: submissionsWithMeta,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/learn/submissions/:id
/**
 * @swagger
 * /api/learn/submissions/{id}:
 *   get:
 *     summary: Get submission by ID
 *     description: Retrieve a specific submission by its ID with task and student information
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 taskId:
 *                   type: string
 *                 studentId:
 *                   type: string
 *                 content:
 *                   type: string
 *                 score:
 *                   type: number
 *                 feedback:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [submitted, evaluated, graded]
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     isLate:
 *                       type: boolean
 *                     scorePercentage:
 *                       type: number
 *                     timeSinceSubmission:
 *                       type: number
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      task: {
        include: {
          team: {
            select: { id: true, name: true }
          }
        }
      },
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
      }
    }
  });

  if (!submission) {
    throw createError('Submission not found', 404);
  }

  // Add metadata
  const isLate = submission.task.dueDate && 
    new Date(submission.submittedAt) > new Date(submission.task.dueDate);
  
  const scorePercentage = submission.score && submission.task.maxScore 
    ? (submission.score / submission.task.maxScore) * 100 
    : null;

  res.json({
    ...submission,
    meta: {
      isLate,
      scorePercentage: scorePercentage ? Math.round(scorePercentage) : null,
      timeSinceSubmission: Date.now() - new Date(submission.submittedAt).getTime()
    }
  });
}));

/**
 * @swagger
 * /api/learn/submissions:
 *   post:
 *     summary: Create a new submission
 *     description: Create a new submission for a task
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - studentId
 *               - content
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: ID of the task
 *               studentId:
 *                 type: string
 *                 description: ID of the student
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Submission content (JSON string or file path)
 *     responses:
 *       201:
 *         description: Submission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Task or student not found
 *       409:
 *         description: Submission already exists for this task and student
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/submissions
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const submissionData = createSubmissionSchema.parse(req.body);
  
  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: submissionData.taskId },
    select: { id: true, title: true, dueDate: true }
  });
  
  if (!task) {
    throw createError('Task not found', 404);
  }

  // Verify student exists
  const student = await prisma.student.findUnique({
    where: { id: submissionData.studentId },
    select: { id: true, name: true }
  });
  
  if (!student) {
    throw createError('Student not found', 404);
  }

  // Check if submission already exists
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      taskId_studentId: {
        taskId: submissionData.taskId,
        studentId: submissionData.studentId
      }
    }
  });

  if (existingSubmission) {
    throw createError('Submission already exists for this task and student', 409);
  }

  const submission = await prisma.submission.create({
    data: submissionData,
    include: {
      task: {
        select: {
          id: true,
          title: true,
          type: true,
          maxScore: true,
          dueDate: true
        }
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.status(201).json(submission);
}));

/**
 * @swagger
 * /api/learn/submissions/{id}/evaluate:
 *   post:
 *     summary: Evaluate a submission
 *     description: Evaluate a submission by providing score and feedback
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *                 description: Score for the submission
 *               feedback:
 *                 type: string
 *                 description: Optional feedback text
 *               rubric:
 *                 type: object
 *                 description: Optional rubric object with evaluation criteria
 *     responses:
 *       200:
 *         description: Submission evaluated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Invalid input data or submission already evaluated
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/submissions/:id/evaluate
router.post('/:id/evaluate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const evaluationData = evaluateSubmissionSchema.parse(req.body);
  
  // Check if submission exists
  const existingSubmission = await prisma.submission.findUnique({
    where: { id },
    include: {
      task: {
        select: { id: true, title: true, maxScore: true }
      },
      student: {
        select: { id: true, name: true }
      }
    }
  });
  
  if (!existingSubmission) {
    throw createError('Submission not found', 404);
  }

  // Validate score against task max score
  if (evaluationData.score > existingSubmission.task.maxScore) {
    throw createError(
      `Score cannot exceed task maximum score of ${existingSubmission.task.maxScore}`,
      400
    );
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: {
      score: evaluationData.score,
      feedback: evaluationData.feedback,
      rubric: evaluationData.rubric,
      status: 'evaluated',
      evaluatedAt: new Date()
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          type: true,
          maxScore: true
        }
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Calculate score percentage
  const scorePercentage = (submission.score! / submission.task.maxScore) * 100;

  res.json({
    ...submission,
    meta: {
      scorePercentage: Math.round(scorePercentage),
      evaluatedBy: req.user?.id,
      evaluatedAt: submission.evaluatedAt
    }
  });
}));

/**
 * @swagger
 * /api/learn/submissions/{id}:
 *   put:
 *     summary: Update a submission
 *     description: Update submission content (only allowed if not yet evaluated)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Updated submission content
 *           example:
 *             content: "Updated solution with better implementation"
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Bad request - submission already evaluated or validation error
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// PUT /api/learn/submissions/:id
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
  
  // Check if submission exists and is not evaluated
  const existingSubmission = await prisma.submission.findUnique({
    where: { id },
    select: { id: true, status: true }
  });
  
  if (!existingSubmission) {
    throw createError('Submission not found', 404);
  }

  if (existingSubmission.status === 'evaluated') {
    throw createError('Cannot update evaluated submission', 400);
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: { content },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          type: true
        }
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.json(submission);
}));

// DELETE /api/learn/submissions/:id
/**
 * @swagger
 * /api/learn/submissions/{id}:
 *   delete:
 *     summary: Delete a submission
 *     description: Delete a submission by ID (only if not evaluated)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submission deleted successfully
 *       400:
 *         description: Cannot delete evaluated submission
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if submission exists
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { id: true, status: true }
  });
  
  if (!submission) {
    throw createError('Submission not found', 404);
  }

  if (submission.status === 'evaluated') {
    throw createError('Cannot delete evaluated submission', 400);
  }

  await prisma.submission.delete({
    where: { id }
  });

  res.json({ message: 'Submission deleted successfully' });
}));

export { router as submissionsRouter };