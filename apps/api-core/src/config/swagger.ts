import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

// Swagger JSDoc configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CRM Core API',
      version: '1.0.0',
      description: 'Core API for CRM system - Authentication, Leads, Users, Interactions, Appointments, Payments, AI',
      contact: {
        name: 'API Support',
        email: 'support@crm.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../controllers/*.ts')
  ]
};

// Generate swagger specification from JSDoc comments
const swaggerSpec = swaggerJsdoc(swaggerOptions) as any;

// Add health check endpoint manually since it's in app.ts
swaggerSpec.paths = swaggerSpec.paths || {};
swaggerSpec.paths['/api/core/health'] = {
  get: {
    tags: ['Health'],
    summary: 'Health check endpoint',
    responses: {
      '200': {
        description: 'API is healthy',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                timestamp: { type: 'string' },
                version: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};




export const setupSwagger = (app: Express): void => {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CRM Core API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: false,
      showCommonExtensions: false,
      tryItOutEnabled: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      validatorUrl: null
    }
  };

  // Setup Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Serve swagger JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('\n=== 📚 SWAGGER DOCUMENTATION ===');
  console.log('🔗 Swagger UI: http://localhost:3001/api/docs');
  console.log('📄 Swagger JSON: http://localhost:3001/api/docs.json');
  console.log('\n=== 🧪 TEST CREDENTIALS ===');
  console.log('👤 Test User: admin@crm.com');
  console.log('🔑 Test Password: password123');
  console.log('\n=== 🚀 API ENDPOINTS ===');
  console.log('🏥 Health Check: http://localhost:3001/api/core/health');
  console.log('🔐 Login: POST http://localhost:3001/api/core/auth/login');
  console.log('================================\n');
};

export { swaggerSpec };