import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import studentsRouter from '../../routes/students';
import { authMiddleware } from '../../middleware/auth';
import { errorHandler } from '../../middleware/errorHandler';
import { prisma } from '../../lib/prisma';
import { ProfileService } from '../../services/ProfileService';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn().mockImplementation(() => mockDeep<PrismaClient>())
}));

// Mock the prisma instance
jest.mock('../../lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>()
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: jest.fn((req: any, res: any, next: any) => {
    req.user = { id: 'user-1', role: 'student' };
    next();
  })
}));

// Mock ProfileService
const mockGetStudentProfile = jest.fn();

jest.mock('../../services/ProfileService', () => ({
  ProfileService: class MockProfileService {
    getStudentProfile = mockGetStudentProfile;
  }
}));

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

describe('Students API', () => {
  let app: express.Application;

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/students', studentsRouter);
    app.use(errorHandler);
    
    // Catch-all for unhandled routes
    app.use('*', (req, res) => {
      res.status(404).json({ message: 'Route not found' });
    });
    
    // Set up default mocks
    prismaMock.studentSkill.findMany.mockResolvedValue([]);
    prismaMock.skill.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      return callback(prismaMock);
    });
    prismaMock.studentSkill.upsert.mockResolvedValue({} as any);
  });

  describe('GET /api/students', () => {
    const mockStudents = [
      {
        id: 'student-1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'avatar1.jpg',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Frontend Team' },
        _count: { submissions: 5, evaluations: 3 }
      },
      {
        id: 'student-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'avatar2.jpg',
        teamId: 'team-2',
        team: { id: 'team-2', name: 'Backend Team' },
        _count: { submissions: 3, evaluations: 2 }
      }
    ];

    beforeEach(() => {
      prismaMock.student.findMany.mockResolvedValue(mockStudents as any);
      prismaMock.student.count.mockResolvedValue(2);
    });

    it('should return list of students with pagination', async () => {
      const response = await request(app)
        .get('/api/students')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter students by team', async () => {
      prismaMock.student.findMany.mockResolvedValue([mockStudents[0]] as any);
      prismaMock.student.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/students?teamId=team-1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].teamId).toBe('team-1');
    });

    it('should search students by name or email', async () => {
      prismaMock.student.findMany.mockResolvedValue([mockStudents[0]] as any);
      prismaMock.student.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/students?q=john')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('John');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/students?page=2&limit=1')
        .expect(200);

      expect(prismaMock.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1
        })
      );
    });
  });

  describe('GET /api/students/:id', () => {
    const mockStudent = {
      id: 'student-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'avatar1.jpg',
      teamId: 'team-1',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      team: {
        id: 'team-1',
        name: 'Frontend Team',
        description: 'Frontend development team'
      },
      skills: [
        {
          skill: {
            id: 'skill-1',
            name: 'JavaScript',
            category: 'technical'
          },
          level: 8,
          verified: true
        }
      ],
      submissions: [
        {
          id: 'sub-1',
          score: 85,
          status: 'evaluated',
          task: { title: 'React Component' }
        }
      ],
      evaluationsReceived: [
        {
          id: 'eval-1',
          score: 8,
          category: 'technical',
          type: 'peer'
        }
      ]
    };

    it('should return student details', async () => {
      prismaMock.student.findUnique.mockResolvedValue(mockStudent as any);

      const response = await request(app)
        .get('/api/students/student-1')
        .expect(200);

      expect(response.body.id).toBe('student-1');
      expect(response.body.name).toBe('John Doe');
      expect(response.body.team).toBeDefined();
      expect(response.body.skills).toBeDefined();
      expect(response.body.recentSubmissions).toBeDefined();
      expect(response.body.recentEvaluations).toBeDefined();
    });

    it('should return 404 if student not found', async () => {
      prismaMock.student.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/students/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Student not found');
    });
  });

  describe('GET /api/students/:id/skills', () => {
    const mockSkills = [
      {
        skill: {
          id: 'skill-1',
          name: 'JavaScript',
          category: 'technical',
          description: 'Programming language'
        },
        level: 8,
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should return student skills', async () => {
      prismaMock.studentSkill.findMany.mockResolvedValue(mockSkills as any);

      const response = await request(app)
        .get('/api/students/student-1/skills')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].skill.name).toBe('JavaScript');
      expect(response.body[0].level).toBe(8);
    });

    it('should group skills by category', async () => {
      const mixedSkills = [
        ...mockSkills,
        {
          skill: {
            id: 'skill-2',
            name: 'Communication',
            category: 'soft',
            description: 'Soft skill'
          },
          level: 7,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      prismaMock.studentSkill.findMany.mockResolvedValue(mixedSkills as any);

      const response = await request(app)
        .get('/api/students/student-1/skills?grouped=true')
        .expect(200);

      expect(response.body).toHaveProperty('technical');
      expect(response.body).toHaveProperty('soft');
      expect(response.body.technical).toHaveLength(1);
      expect(response.body.soft).toHaveLength(1);
    });
  });

  describe('PATCH /api/students/:id/skills', () => {
    const skillsUpdate = [
      { skillId: 'skill-1', level: 9 },
      { skillId: 'skill-2', level: 7 }
    ];

    beforeEach(() => {
      prismaMock.student.findUnique.mockResolvedValue({ id: 'student-1' } as any);
      
      prismaMock.skill.findMany.mockResolvedValue([
        { id: 'skill-1', name: 'JavaScript' },
        { id: 'skill-2', name: 'React' }
      ] as any);
      
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback(prismaMock);
      });
      
      prismaMock.studentSkill.upsert.mockResolvedValue({} as any);
    });

    it('should update student skills', async () => {
      const response = await request(app)
        .patch('/api/students/student-1/skills')
        .send({ skills: skillsUpdate })
        .expect(200);

      expect(response.body.message).toBe('Skills updated successfully');
      expect(prismaMock.studentSkill.upsert).toHaveBeenCalledTimes(2);
    });

    it('should validate skill IDs exist', async () => {
      prismaMock.skill.findMany.mockResolvedValue([{ id: 'skill-1', name: 'JavaScript' }] as any);

      const response = await request(app)
        .patch('/api/students/student-1/skills')
        .send({ skills: skillsUpdate })
        .expect(400);

      expect(response.body.message).toContain('Invalid skill IDs');
    });

    it('should validate skill levels are between 1-10', async () => {
      const invalidSkills = [{ skillId: 'skill-1', level: 15 }];

      const response = await request(app)
        .patch('/api/students/student-1/skills')
        .send({ skills: invalidSkills });

      console.log('Level validation - Response status:', response.status);
      console.log('Level validation - Response body:', response.body);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Level must be between 1 and 10');
    });

    it('should require skills array', async () => {
      const response = await request(app)
        .patch('/api/students/student-1/skills')
        .send({});
        
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Skills array is required');
    });
  });

  describe('GET /api/students/:id/profile', () => {
    const mockProfile = {
      student: {
        id: 'student-1',
        name: 'John Doe',
        email: 'john@example.com'
      },
      skills: {
        technical: [{ name: 'JavaScript', level: 8 }],
        soft: [],
        domain: []
      },
      taskPerformance: {
        totalSubmissions: 5,
        averageScore: 85,
        completionRate: 100
      },
      evaluationPerformance: {
        totalEvaluations: 3,
        averageScore: 8.5
      },
      insights: {
        strengths: ['Strong technical skills'],
        areasForImprovement: ['Communication'],
        recommendations: ['Practice public speaking']
      },
      generatedAt: new Date().toISOString()
    };

    beforeEach(() => {
      mockGetStudentProfile.mockResolvedValue(mockProfile);
      // Mock student lookup for profile endpoint
      prismaMock.student.findUnique.mockResolvedValue({ id: 'student-1' } as any);
    });

    it('should return student profile', async () => {
      const response = await request(app)
        .get('/api/students/student-1/profile');

      if (response.status !== 200) {
        console.log('Error response:', response.body);
        console.log('Status:', response.status);
      }
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProfile);
      expect(mockGetStudentProfile).toHaveBeenCalledWith('student-1', false);
    });

    it('should handle refresh parameter', async () => {
      const response = await request(app)
        .get('/api/students/student-1/profile?refresh=true')
        .expect(200);

      expect(response.body).toEqual(mockProfile);
      expect(mockGetStudentProfile).toHaveBeenCalledWith('student-1', true);
    });
  });
});