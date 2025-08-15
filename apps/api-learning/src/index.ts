import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './lib/prisma';
import { specs, swaggerUi } from './config/swagger';

import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { studentsRouter } from './routes/students';
import { teamsRouter } from './routes/teams';
import { tasksRouter } from './routes/tasks';
import { submissionsRouter } from './routes/submissions';
import { evaluationsRouter } from './routes/evaluations';
import { companiesRouter } from './routes/companies';
import { jobsRouter } from './routes/jobs';
import { skillsRouter } from './routes/skills';
import { healthRouter } from './routes/health';

const app = express();
const port = process.env.PORT || 3002;



// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no auth required)
app.use('/health', healthRouter);

// Swagger documentation (no auth required)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Learning API Documentation'
}));

// Redirect root to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// API routes with auth
app.use('/api/learn', authMiddleware);
app.use('/api/learn/students', studentsRouter);
app.use('/api/learn/teams', teamsRouter);
app.use('/api/learn/tasks', tasksRouter);
app.use('/api/learn/submissions', submissionsRouter);
app.use('/api/learn/evaluations', evaluationsRouter);
app.use('/api/learn/companies', companiesRouter);
app.use('/api/learn/jobs', jobsRouter);
app.use('/api/learn/skills', skillsRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Learning API server running on port: http://localhost:${port}/api-docs `);
});

export default app;