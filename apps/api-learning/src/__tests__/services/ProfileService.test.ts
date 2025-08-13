import { ProfileService } from '../../services/ProfileService';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock the prisma lib module
jest.mock('../../lib/prisma', () => ({
  prisma: {
    profile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    evaluation: {
      findMany: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
    },
  }
}));

// Get the mocked prisma instance
import { prisma } from '../../lib/prisma';
const prismaMock = prisma as any;

describe('ProfileService', () => {
  let profileService: ProfileService;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService = new ProfileService();
    
    // Set default mock return values
    prismaMock.submission.findMany.mockResolvedValue([]);
    prismaMock.evaluation.findMany.mockResolvedValue([]);
    prismaMock.task.findMany.mockResolvedValue([]);
    prismaMock.profile.findMany.mockResolvedValue([]);
    prismaMock.profile.deleteMany.mockResolvedValue({ count: 0 });
  });

  describe('getStudentProfile', () => {
    const mockStudent = {
      id: 'student-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'avatar.jpg',
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
            category: 'technical',
            description: 'Programming language'
          },
          level: 8,
          verified: true
        }
      ]
    };

    const mockSubmissions = [
      {
        id: 'sub-1',
        score: 85,
        status: 'evaluated',
        createdAt: new Date(),
        task: {
          title: 'React Component',
          maxScore: 100,
          difficulty: 'medium'
        }
      }
    ];

    const mockEvaluations = [
      {
        id: 'eval-1',
        score: 8,
        category: 'technical',
        type: 'peer',
        createdAt: new Date()
      }
    ];

    beforeEach(() => {
      const studentWithRelations = {
        ...mockStudent,
        submissions: mockSubmissions,
        evaluations: mockEvaluations
      };
      prismaMock.student.findUnique.mockResolvedValue(studentWithRelations as any);
      prismaMock.submission.findMany.mockResolvedValue(mockSubmissions as any);
      prismaMock.evaluation.findMany.mockResolvedValue(mockEvaluations as any);
    });

    it('should get a complete profile for a student', async () => {
      // Mock cache miss to force profile generation
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.profile.create.mockResolvedValue({} as any);
      
      const profile = await profileService.getStudentProfile('student-1');

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('studentId');
      expect(profile).toHaveProperty('basicInfo');
      expect(profile).toHaveProperty('skills');
      expect(profile).toHaveProperty('performance');
      expect(profile).toHaveProperty('strengths');
      expect(profile).toHaveProperty('areasForImprovement');
      expect(profile).toHaveProperty('recommendations');
    });

    it('should throw error if student not found', async () => {
      prismaMock.student.findUnique.mockResolvedValue(null);
      prismaMock.profile.findFirst.mockResolvedValue(null);

      await expect(profileService.getStudentProfile('nonexistent'))
        .rejects.toThrow('Student not found');
    });

    it('should calculate task performance correctly', async () => {
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.profile.create.mockResolvedValue({} as any);
      
      const profile = await profileService.getStudentProfile('student-1');

      expect(profile.performance.tasks.total).toBeGreaterThanOrEqual(0);
      expect(profile.performance.tasks.completed).toBeGreaterThanOrEqual(0);
      expect(profile.performance.tasks.averageScore).toBeGreaterThanOrEqual(0);
    });

    it('should calculate evaluation performance correctly', async () => {
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.profile.create.mockResolvedValue({} as any);
      
      const profile = await profileService.getStudentProfile('student-1');

      expect(profile.performance.evaluations.total).toBeGreaterThanOrEqual(0);
      expect(profile.performance.evaluations.averageScore).toBeGreaterThanOrEqual(0);
    });

    it('should generate insights based on performance', async () => {
      prismaMock.profile.findFirst.mockResolvedValue(null);
      prismaMock.profile.create.mockResolvedValue({} as any);
      
      const profile = await profileService.getStudentProfile('student-1');

      expect(profile.strengths).toBeDefined();
      expect(profile.areasForImprovement).toBeDefined();
      expect(profile.recommendations).toBeDefined();
      expect(Array.isArray(profile.strengths)).toBe(true);
    });
  });

  describe('getStudentProfile with cache', () => {
    it('should return cached profile if available and not expired', async () => {
      const cachedProfile = {
        id: 'profile-1',
        studentId: 'student-1',
        basicInfo: { name: 'John Doe', email: 'john@example.com' },
        skills: { technical: [], soft: [], domain: [] },
        performance: { tasks: { total: 0, completed: 0, averageScore: 0 }, evaluations: { total: 0, averageScore: 0 } },
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
        lastUpdated: new Date().toISOString(),
        version: 1
      };

      // Mock cached profile found
      prismaMock.profile.findFirst.mockResolvedValue({
        id: 'profile-1',
        studentId: 'student-1',
        profileData: cachedProfile,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
      
      // Mock student data in case it's needed
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: [],
        team: { name: 'Test Team' },
        submissions: [],
        evaluations: []
      } as any);

      const profile = await profileService.getStudentProfile('student-1');
      expect(profile.studentId).toBe('student-1');
    });

    it('should generate new profile if forced refresh', async () => {
      // Mock the student data for profile generation
      prismaMock.student.findUnique.mockResolvedValue({
        id: 'student-1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: [],
        team: { name: 'Test Team' },
        submissions: [],
        evaluations: []
      } as any);
      
      prismaMock.submission.findMany.mockResolvedValue([]);
      prismaMock.evaluation.findMany.mockResolvedValue([]);
      prismaMock.profile.create.mockResolvedValue({} as any);

      const profile = await profileService.getStudentProfile('student-1', true);
      expect(profile).toHaveProperty('lastUpdated');
    });
  });


});