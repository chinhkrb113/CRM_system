import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/learning_test_db'
    }
  }
});

// Mock auth middleware for testing
jest.mock('../../middleware/auth', () => ({
  auth: jest.fn((req, res, next) => {
    req.user = { id: 'test-user', role: 'admin' };
    next();
  }),
  requireRole: jest.fn(() => (req: any, res: any, next: any) => next())
}));

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test database
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await prisma.evaluation.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.task.deleteMany();
    await prisma.studentSkill.deleteMany();
    await prisma.student.deleteMany();
    await prisma.team.deleteMany();
    await prisma.jobSkill.deleteMany();
    await prisma.job.deleteMany();
    await prisma.company.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.profile.deleteMany();
  });

  describe('Health Check', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('api-learning');
    });

    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('Teams API', () => {
    let teamId: string;

    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          id: 'test-team-1',
          name: 'Test Team',
          description: 'A test team'
        }
      });
      teamId = team.id;
    });

    it('should create and retrieve teams', async () => {
      // Get teams
      const getResponse = await request(app)
        .get('/api/learn/teams')
        .expect(200);

      expect(getResponse.body.data).toHaveLength(1);
      expect(getResponse.body.data[0].name).toBe('Test Team');
    });

    it('should get team details', async () => {
      const response = await request(app)
        .get(`/api/learn/teams/${teamId}`)
        .expect(200);

      expect(response.body.id).toBe(teamId);
      expect(response.body.name).toBe('Test Team');
      expect(response.body.stats).toBeDefined();
    });
  });

  describe('Students API', () => {
    let teamId: string;
    let studentId: string;

    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          id: 'test-team-1',
          name: 'Test Team',
          description: 'A test team'
        }
      });
      teamId = team.id;

      const student = await prisma.student.create({
        data: {
          id: 'test-student-1',
          userId: 'test-user-1',
          email: 'test@example.com',
          name: 'Test Student',
          teamId: teamId
        }
      });
      studentId = student.id;
    });

    it('should get students list', async () => {
      const response = await request(app)
        .get('/api/learn/students')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Student');
    });

    it('should get student details', async () => {
      const response = await request(app)
        .get(`/api/learn/students/${studentId}`)
        .expect(200);

      expect(response.body.id).toBe(studentId);
      expect(response.body.name).toBe('Test Student');
      expect(response.body.team).toBeDefined();
    });

    it('should filter students by team', async () => {
      const response = await request(app)
        .get(`/api/learn/students?teamId=${teamId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].teamId).toBe(teamId);
    });
  });

  describe('Skills and Student Skills', () => {
    let studentId: string;
    let skillId: string;

    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          id: 'test-team-1',
          name: 'Test Team',
          description: 'A test team'
        }
      });

      const student = await prisma.student.create({
        data: {
          id: 'test-student-1',
          userId: 'test-user-1',
          email: 'test@example.com',
          name: 'Test Student',
          teamId: team.id
        }
      });
      studentId = student.id;

      const skill = await prisma.skill.create({
        data: {
          id: 'test-skill-1',
          name: 'JavaScript',
          category: 'technical',
          description: 'Programming language'
        }
      });
      skillId = skill.id;
    });

    it('should update student skills', async () => {
      const skillsData = {
        skills: [
          { skillId: skillId, level: 8 }
        ]
      };

      const response = await request(app)
        .patch(`/api/learn/students/${studentId}/skills`)
        .send(skillsData)
        .expect(200);

      expect(response.body.message).toBe('Skills updated successfully');

      // Verify the skill was added
      const skillsResponse = await request(app)
        .get(`/api/learn/students/${studentId}/skills`)
        .expect(200);

      expect(skillsResponse.body).toHaveLength(1);
      expect(skillsResponse.body[0].level).toBe(8);
      expect(skillsResponse.body[0].skill.name).toBe('JavaScript');
    });
  });

  describe('Tasks and Submissions', () => {
    let teamId: string;
    let studentId: string;
    let taskId: string;

    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          id: 'test-team-1',
          name: 'Test Team',
          description: 'A test team'
        }
      });
      teamId = team.id;

      const student = await prisma.student.create({
        data: {
          id: 'test-student-1',
          userId: 'test-user-1',
          email: 'test@example.com',
          name: 'Test Student',
          teamId: teamId
        }
      });
      studentId = student.id;

      const task = await prisma.task.create({
        data: {
          id: 'test-task-1',
          title: 'Test Task',
          description: 'A test task',
          type: 'individual',
          difficulty: 'medium',
          maxScore: 100,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          teamId: teamId
        }
      });
      taskId = task.id;
    });

    it('should create and retrieve tasks', async () => {
      const response = await request(app)
        .get('/api/learn/tasks')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Task');
    });

    it('should create a submission', async () => {
      const submissionData = {
        taskId: taskId,
        studentId: studentId,
        content: JSON.stringify({ answer: 'Test submission content' })
      };

      const response = await request(app)
        .post('/api/learn/submissions')
        .send(submissionData)
        .expect(201);

      expect(response.body.taskId).toBe(taskId);
      expect(response.body.studentId).toBe(studentId);
      expect(response.body.status).toBe('submitted');
    });

    it('should evaluate a submission', async () => {
      // First create a submission
      const submission = await prisma.submission.create({
        data: {
          taskId: taskId,
          studentId: studentId,
          content: JSON.stringify({ answer: 'Test content' }),
          status: 'submitted'
        }
      });

      const evaluationData = {
        score: 85,
        feedback: 'Good work!',
        rubric: JSON.stringify({ criteria1: 8, criteria2: 9 })
      };

      const response = await request(app)
        .post(`/api/learn/submissions/${submission.id}/evaluate`)
        .send(evaluationData)
        .expect(200);

      expect(response.body.score).toBe(85);
      expect(response.body.status).toBe('evaluated');
      expect(response.body.feedback).toBe('Good work!');
    });
  });

  describe('Companies and Jobs', () => {
    let companyId: string;

    beforeEach(async () => {
      const company = await prisma.company.create({
        data: {
          id: 'test-company-1',
          name: 'Test Company',
          description: 'A test company',
          industry: 'Technology',
          size: 'medium',
          location: 'Test City'
        }
      });
      companyId = company.id;
    });

    it('should create and retrieve companies', async () => {
      const response = await request(app)
        .get('/api/learn/companies')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Company');
    });

    it('should create a job', async () => {
      const jobData = {
        companyId: companyId,
        title: 'Software Engineer',
        description: 'A software engineering position',
        requirements: 'Bachelor degree in CS',
        location: 'Remote',
        salary: '$80,000 - $120,000',
        type: 'full-time',
        level: 'mid',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/learn/jobs')
        .send(jobData)
        .expect(201);

      expect(response.body.title).toBe('Software Engineer');
      expect(response.body.companyId).toBe(companyId);
    });

    it('should get jobs list', async () => {
      // Create a job first
      await prisma.job.create({
        data: {
          id: 'test-job-1',
          companyId: companyId,
          title: 'Test Job',
          description: 'A test job',
          requirements: 'Test requirements',
          location: 'Test Location',
          type: 'full-time',
          level: 'entry',
          status: 'active'
        }
      });

      const response = await request(app)
        .get('/api/learn/jobs')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Job');
    });
  });

  describe('Evaluations', () => {
    let studentId: string;
    let evaluatorId: string;

    beforeEach(async () => {
      const team = await prisma.team.create({
        data: {
          id: 'test-team-1',
          name: 'Test Team',
          description: 'A test team'
        }
      });

      const student = await prisma.student.create({
        data: {
          id: 'test-student-1',
          userId: 'test-user-1',
          email: 'student@example.com',
          name: 'Test Student',
          teamId: team.id
        }
      });
      studentId = student.id;

      const evaluator = await prisma.student.create({
        data: {
          id: 'test-evaluator-1',
          userId: 'test-user-2',
          email: 'evaluator@example.com',
          name: 'Test Evaluator',
          teamId: team.id
        }
      });
      evaluatorId = evaluator.id;
    });

    it('should create an evaluation', async () => {
      const evaluationData = {
        studentId: studentId,
        evaluatorId: evaluatorId,
        type: 'peer',
        category: 'technical',
        score: 8,
        feedback: 'Good technical skills'
      };

      const response = await request(app)
        .post('/api/learn/evaluations')
        .send(evaluationData)
        .expect(201);

      expect(response.body.studentId).toBe(studentId);
      expect(response.body.evaluatorId).toBe(evaluatorId);
      expect(response.body.score).toBe(8);
    });

    it('should get evaluations list', async () => {
      // Create an evaluation first
      await prisma.evaluation.create({
        data: {
          studentId: studentId,
          evaluatorId: evaluatorId,
          type: 'peer',
          category: 'technical',
          score: 8,
          feedback: 'Good work'
        }
      });

      const response = await request(app)
        .get('/api/learn/evaluations')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].score).toBe(8);
    });

    it('should get evaluation stats for a student', async () => {
      // Create multiple evaluations
      await prisma.evaluation.createMany({
        data: [
          {
            studentId: studentId,
            evaluatorId: evaluatorId,
            type: 'peer',
            category: 'technical',
            score: 8,
            feedback: 'Good technical skills'
          },
          {
            studentId: studentId,
            evaluatorId: evaluatorId,
            type: 'peer',
            category: 'communication',
            score: 7,
            feedback: 'Good communication'
          }
        ]
      });

      const response = await request(app)
        .get(`/api/learn/evaluations/stats/${studentId}`)
        .expect(200);

      expect(response.body.overall.totalEvaluations).toBe(2);
      expect(response.body.overall.averageScore).toBe(7.5);
      expect(response.body.byCategory.technical.average).toBe(8);
      expect(response.body.byCategory.communication.average).toBe(7);
    });
  });
});