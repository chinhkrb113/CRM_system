import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const querySchema = z.object({
  teamId: z.string().optional(),
  type: z.enum(['individual', 'team', 'project']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  q: z.string().optional()
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(['individual', 'team', 'project']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  maxScore: z.number().min(1).max(1000).default(100),
  dueDate: z.string().datetime().optional(),
  teamId: z.string().optional()
});

const updateTaskSchema = createTaskSchema.partial();

/**
 * @swagger
 * /api/learn/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve a paginated list of tasks with optional filtering
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [individual, team, project]
 *         description: Filter by task type
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by task difficulty
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
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// GET /api/learn/tasks
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { teamId, type, difficulty, page, limit, q } = querySchema.parse(req.query);
  
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (teamId) {
    where.teamId = teamId;
  }
  
  if (type) {
    where.type = type;
  }
  
  if (difficulty) {
    where.difficulty = difficulty;
  }
  
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true }
        },
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
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.task.count({ where })
  ]);

  // Add completion statistics
  const tasksWithStats = tasks.map((task:any) => {
    const submissionCount = task.submissions.length;
    const uniqueStudents = new Set(task.submissions.map((s:any) => s.studentId)).size;
    
    let completionRate = 0;
    if (task.team && task.type === 'team') {
      // For team tasks, completion rate based on team members
      completionRate = task.team ? (uniqueStudents > 0 ? 100 : 0) : 0;
    } else {
      // For individual tasks, we'd need to know total eligible students
      completionRate = submissionCount > 0 ? (submissionCount / 1) * 100 : 0;
    }

    return {
      ...task,
      stats: {
        submissionCount,
        uniqueStudents,
        completionRate: Math.round(completionRate)
      }
    };
  });

  res.json({
    data: tasksWithStats,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/learn/tasks/:id
/**
 * @swagger
 * /api/learn/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve a specific task by its ID with team and submission information
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
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
 *                 type:
 *                   type: string
 *                   enum: [individual, team, project]
 *                 difficulty:
 *                   type: string
 *                   enum: [easy, medium, hard]
 *                 maxScore:
 *                   type: number
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *                 submissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Submission'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSubmissions:
 *                       type: integer
 *                     uniqueStudents:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     evaluatedSubmissions:
 *                       type: integer
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          students: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      submissions: {
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
        orderBy: { submittedAt: 'desc' }
      }
    }
  });

  if (!task) {
    throw createError('Task not found', 404);
  }

  // Calculate statistics
  const stats = {
    totalSubmissions: task.submissions.length,
    uniqueStudents: new Set(task.submissions.map((s:any) => s.studentId)).size,
    averageScore: 0,
    evaluatedSubmissions: task.submissions.filter((s:any) => s.score !== null).length
  };

  const scoredSubmissions = task.submissions.filter((s:any) => s.score !== null);
  if (scoredSubmissions.length > 0) {
    stats.averageScore = scoredSubmissions.reduce((sum:any, s:any) => sum + (s.score || 0), 0) / scoredSubmissions.length;
  }

  res.json({
    ...task,
    stats
  });
}));

/**
 * @swagger
 * /api/learn/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Create a new task for students or teams
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - difficulty
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Task title
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Task description
 *               type:
 *                 type: string
 *                 enum: [individual, team, project]
 *                 description: Task type
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Task difficulty level
 *               maxScore:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 1000
 *                 default: 100
 *                 description: Maximum score for the task
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *               teamId:
 *                 type: string
 *                 description: ID of the team (for team tasks)
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Team not found (if teamId provided)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/learn/tasks
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const taskData = createTaskSchema.parse(req.body);
  
  // If teamId is provided, verify team exists
  if (taskData.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: taskData.teamId },
      select: { id: true }
    });
    
    if (!team) {
      throw createError('Team not found', 404);
    }
  }

  const task = await prisma.task.create({
    data: {
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null
    },
    include: {
      team: {
        select: { id: true, name: true }
      }
    }
  });

  res.status(201).json(task);
}));

/**
 * @swagger
 * /api/learn/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Update an existing task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
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
 *                 description: Task title
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Task description
 *               type:
 *                 type: string
 *                 enum: [individual, team, project]
 *                 description: Task type
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 description: Task difficulty level
 *               maxScore:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 1000
 *                 description: Maximum score for the task
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *               teamId:
 *                 type: string
 *                 description: Team ID (optional)
 *           example:
 *             title: "Updated JavaScript Project"
 *             description: "Build a web application using JavaScript and React"
 *             type: "project"
 *             difficulty: "medium"
 *             maxScore: 100
 *             dueDate: "2024-02-15T23:59:59Z"
 *             teamId: "team123"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Task or team not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// PUT /api/learn/tasks/:id
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const taskData = updateTaskSchema.parse(req.body);
  
  // Check if task exists
  const existingTask = await prisma.task.findUnique({
    where: { id },
    select: { id: true }
  });
  
  if (!existingTask) {
    throw createError('Task not found', 404);
  }

  // If teamId is being updated, verify team exists
  if (taskData.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: taskData.teamId },
      select: { id: true }
    });
    
    if (!team) {
      throw createError('Team not found', 404);
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
    },
    include: {
      team: {
        select: { id: true, name: true }
      },
      _count: {
        select: {
          submissions: true
        }
      }
    }
  });

  res.json(task);
}));

// DELETE /api/learn/tasks/:id
/**
 * @swagger
 * /api/learn/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Delete a task by ID (only if no submissions exist)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       400:
 *         description: Cannot delete task with existing submissions
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          submissions: true
        }
      }
    }
  });
  
  if (!task) {
    throw createError('Task not found', 404);
  }

  // Check if task has submissions
  if (task._count.submissions > 0) {
    throw createError('Cannot delete task with existing submissions', 400);
  }

  await prisma.task.delete({
    where: { id }
  });

  res.json({ message: 'Task deleted successfully' });
}));

export { router as tasksRouter };