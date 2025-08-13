import { PrismaClient } from '@prisma/client';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/learning_test_db';
process.env.PORT = '3001';
process.env.AI_JD_SERVICE_URL = 'http://localhost:8080';
process.env.CORE_API_URL = 'http://localhost:3000';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Prisma Client globally
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    team: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    submission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    evaluation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    skill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    studentSkill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    company: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    job: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    jobSkill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    profile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn()
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn()
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

// Mock axios for API calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, callback) => {
    if (token === 'valid-token') {
      callback(null, { id: 'user-1', role: 'student' });
    } else {
      callback(new Error('Invalid token'));
    }
  }),
  sign: jest.fn(() => 'mocked-token')
}));

// Test utilities
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'test-user', role: 'student' },
  ...overrides
});

export const createMockResponse = () => {
  const res: any = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    end: jest.fn(() => res),
    setHeader: jest.fn(() => res)
  };
  return res;
};

export const createMockNext = () => jest.fn();

// Database test utilities
export const cleanupDatabase = async (prisma: PrismaClient) => {
  const tablenames = [
    'evaluation',
    'submission',
    'task',
    'student_skill',
    'student',
    'team',
    'job_skill',
    'job',
    'company',
    'skill',
    'profile'
  ];

  for (const tablename of tablenames) {
    await prisma.$executeRaw`TRUNCATE TABLE "${tablename}" CASCADE;`;
  }
};

// Setup and teardown
beforeAll(async () => {
  // Global setup if needed
});

afterAll(async () => {
  // Global cleanup if needed
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});