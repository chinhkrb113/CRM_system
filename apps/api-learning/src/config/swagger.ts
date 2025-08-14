import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Learning API',
      version: '1.0.0',
      description: 'API documentation for the Learning Management System',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Skill: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the skill'
            },
            name: {
              type: 'string',
              description: 'Name of the skill'
            },
            category: {
              type: 'string',
              enum: ['technical', 'soft', 'domain'],
              description: 'Category of the skill'
            },
            description: {
              type: 'string',
              description: 'Description of the skill'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            _count: {
              type: 'object',
              properties: {
                studentSkills: {
                  type: 'integer'
                },
                jobSkills: {
                  type: 'integer'
                }
              }
            },
            stats: {
              type: 'object',
              properties: {
                studentsCount: {
                  type: 'integer'
                },
                jobsCount: {
                  type: 'integer'
                },
                totalUsage: {
                  type: 'integer'
                }
              }
            }
          }
        },
        CreateSkill: {
          type: 'object',
          required: ['name', 'category'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the skill'
            },
            category: {
              type: 'string',
              enum: ['technical', 'soft', 'domain'],
              description: 'Category of the skill'
            },
            description: {
              type: 'string',
              description: 'Description of the skill'
            }
          }
        },
        Team: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the team'
            },
            name: {
              type: 'string',
              description: 'Name of the team'
            },
            description: {
              type: 'string',
              description: 'Description of the team'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            students: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Student'
              }
            },
            _count: {
              type: 'object',
              properties: {
                students: {
                  type: 'integer'
                },
                tasks: {
                  type: 'integer'
                }
              }
            }
          }
        },
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the company'
            },
            name: {
              type: 'string',
              description: 'Name of the company'
            },
            description: {
              type: 'string',
              description: 'Description of the company'
            },
            industry: {
              type: 'string',
              description: 'Industry sector'
            },
            size: {
              type: 'string',
              enum: ['startup', 'small', 'medium', 'large'],
              description: 'Company size'
            },
            location: {
              type: 'string',
              description: 'Company location'
            },
            website: {
              type: 'string',
              description: 'Company website URL'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the student'
            },
            name: {
              type: 'string',
              description: 'Name of the student'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            avatar: {
              type: 'string',
              description: 'Avatar URL'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer'
            },
            limit: {
              type: 'integer'
            },
            total: {
              type: 'integer'
            },
            pages: {
              type: 'integer'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Skill'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer'
                },
                limit: {
                  type: 'integer'
                },
                total: {
                  type: 'integer'
                },
                pages: {
                  type: 'integer'
                }
              }
            }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the job'
            },
            title: {
              type: 'string',
              description: 'Job title'
            },
            description: {
              type: 'string',
              description: 'Job description'
            },
            requirements: {
              type: 'string',
              description: 'Job requirements'
            },
            location: {
              type: 'string',
              description: 'Job location'
            },
            salary: {
              type: 'string',
              description: 'Salary range'
            },
            type: {
              type: 'string',
              enum: ['full-time', 'part-time', 'internship'],
              description: 'Job type'
            },
            level: {
              type: 'string',
              enum: ['entry', 'mid', 'senior'],
              description: 'Job level'
            },
            status: {
              type: 'string',
              enum: ['active', 'closed', 'draft'],
              description: 'Job status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            company: {
              $ref: '#/components/schemas/Company'
            }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the task'
            },
            title: {
              type: 'string',
              description: 'Task title'
            },
            description: {
              type: 'string',
              description: 'Task description'
            },
            type: {
              type: 'string',
              enum: ['project', 'assignment', 'quiz', 'exam'],
              description: 'Task type'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard'],
              description: 'Task difficulty'
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'archived'],
              description: 'Task status'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Due date'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        Submission: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the submission'
            },
            content: {
              type: 'string',
              description: 'Submission content'
            },
            score: {
              type: 'number',
              description: 'Submission score'
            },
            feedback: {
              type: 'string',
              description: 'Feedback on submission'
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Submission timestamp'
            },
            student: {
              $ref: '#/components/schemas/Student'
            },
            task: {
              $ref: '#/components/schemas/Task'
            }
          }
        },
        Evaluation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the evaluation'
            },
            score: {
              type: 'number',
              description: 'Evaluation score'
            },
            feedback: {
              type: 'string',
              description: 'Evaluation feedback'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            evaluator: {
              $ref: '#/components/schemas/Student'
            },
            evaluated: {
              $ref: '#/components/schemas/Student'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };