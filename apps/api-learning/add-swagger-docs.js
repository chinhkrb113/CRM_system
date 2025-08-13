const fs = require('fs');
const path = require('path');

// Define swagger documentation templates for different routes
const swaggerTemplates = {
  jobs: {
    get: `/**
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
 *           enum: [full-time, part-time, contract, internship]
 *         description: Filter by job type
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [entry, junior, mid, senior, lead]
 *         description: Filter by job level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, draft]
 *         description: Filter by job status
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
 */`,
    post: `/**
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
 *               - title
 *               - companyId
 *               - type
 *               - level
 *             properties:
 *               title:
 *                 type: string
 *                 description: Job title
 *               description:
 *                 type: string
 *                 description: Job description
 *               companyId:
 *                 type: string
 *                 description: Company ID
 *               type:
 *                 type: string
 *                 enum: [full-time, part-time, contract, internship]
 *                 description: Job type
 *               level:
 *                 type: string
 *                 enum: [entry, junior, mid, senior, lead]
 *                 description: Job level
 *               location:
 *                 type: string
 *                 description: Job location
 *               salary:
 *                 type: string
 *                 description: Salary range
 *               requirements:
 *                 type: string
 *                 description: Job requirements
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */`
  },
  tasks: {
    get: `/**
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
 *           enum: [project, assignment, quiz, exam]
 *         description: Filter by task type
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
 *         description: Filter by task status
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
 */`
  },
  evaluations: {
    get: `/**
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
 *         name: evaluatorId
 *         schema:
 *           type: string
 *         description: Filter by evaluator ID
 *       - in: query
 *         name: evaluatedId
 *         schema:
 *           type: string
 *         description: Filter by evaluated student ID
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
 */`
  },
  submissions: {
    get: `/**
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
 */`
  }
};

// Function to add swagger docs to a route file
function addSwaggerDocs(routeFile, routeName) {
  const filePath = path.join(__dirname, 'src', 'routes', routeFile);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add GET documentation
  if (swaggerTemplates[routeName] && swaggerTemplates[routeName].get) {
    const getPattern = new RegExp(`// GET /api/learn/${routeName}\s*\nrouter\.get\('/', asyncHandler`);
    if (getPattern.test(content) && !content.includes(`@swagger\n * /api/learn/${routeName}:`)) {
      content = content.replace(
        getPattern,
        `${swaggerTemplates[routeName].get}\n// GET /api/learn/${routeName}\nrouter.get('/', asyncHandler`
      );
    }
  }
  
  // Add POST documentation if exists
  if (swaggerTemplates[routeName] && swaggerTemplates[routeName].post) {
    const postPattern = new RegExp(`// POST /api/learn/${routeName}\s*\nrouter\.post\('/', asyncHandler`);
    if (postPattern.test(content) && !content.includes(`@swagger\n * /api/learn/${routeName}:\n *   post:`)) {
      content = content.replace(
        postPattern,
        `${swaggerTemplates[routeName].post}\n// POST /api/learn/${routeName}\nrouter.post('/', asyncHandler`
      );
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Added Swagger docs to ${routeFile}`);
}

// Add docs to all route files
const routes = [
  { file: 'jobs.ts', name: 'jobs' },
  { file: 'tasks.ts', name: 'tasks' },
  { file: 'evaluations.ts', name: 'evaluations' },
  { file: 'submissions.ts', name: 'submissions' }
];

routes.forEach(route => {
  try {
    addSwaggerDocs(route.file, route.name);
  } catch (error) {
    console.error(`❌ Error processing ${route.file}:`, error.message);
  }
});

console.log('\n🎉 Swagger documentation added to all routes!');