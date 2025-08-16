# CRM API Core

The main backend service for the CRM system, providing RESTful APIs for authentication, lead management, interactions, appointments, payments, and AI-powered lead scoring.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Lead Management**: Complete CRUD operations for leads with scoring and assignment
- **Interaction Tracking**: Log and manage all customer interactions
- **Appointment Scheduling**: Book, reschedule, and manage appointments
- **Payment Processing**: Create payment links and handle payment workflows
- **AI Integration**: Automated lead scoring and insights
- **Security**: Rate limiting, input validation, and comprehensive error handling
- **Monitoring**: Structured logging and performance tracking

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston
- **Testing**: Jest

## Project Structure

```
src/
├── controllers/          # API route handlers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── lead.controller.ts
│   ├── interaction.controller.ts
│   ├── appointment.controller.ts
│   ├── payment.controller.ts
│   └── ai.controller.ts
├── services/            # Business logic layer
│   ├── auth.service.ts
│   ├── lead.service.ts
│   ├── interaction.service.ts
│   ├── appointment.service.ts
│   ├── payment.service.ts
│   └── ai.service.ts
├── middleware/          # Express middleware
│   ├── auth.ts
│   ├── error.ts
│   ├── logging.ts
│   ├── rateLimit.ts
│   └── validation.ts
├── routes/             # API route definitions
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── lead.routes.ts
│   ├── interaction.routes.ts
│   ├── appointment.routes.ts
│   ├── payment.routes.ts
│   └── ai.routes.ts
├── utils/              # Utility functions
│   ├── errors.ts
│   ├── password.ts
│   └── validation.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── app.ts              # Express app configuration
└── server.ts           # Server entry point
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Set up the database:
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. (Optional) Seed the database:
   ```bash
   npm run db:seed
   ```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Building for Production

```bash
npm run build
npm start
```

## API Documentation

### Authentication Endpoints

- `POST /api/core/auth/login` - User login
- `POST /api/core/auth/refresh-token` - Refresh JWT token
- `POST /api/core/auth/logout` - User logout
- `GET /api/core/auth/me` - Get current user
- `POST /api/core/auth/change-password` - Change password

### User Management

- `GET /api/core/users` - List users (Admin/Manager)
- `POST /api/core/users` - Create user (Admin)
- `GET /api/core/users/:id` - Get user by ID
- `PATCH /api/core/users/:id` - Update user (Admin)
- `GET /api/core/users/profile` - Get current user profile
- `PATCH /api/core/users/profile` - Update current user profile

### Lead Management

- `GET /api/core/leads` - List leads with filters
- `POST /api/core/leads` - Create new lead
- `GET /api/core/leads/:id` - Get lead by ID
- `PATCH /api/core/leads/:id` - Update lead
- `DELETE /api/core/leads/:id` - Delete lead
- `POST /api/core/leads/:id/score` - Update lead score
- `POST /api/core/leads/:id/assign` - Assign lead to user

### Interaction Management

- `GET /api/core/interactions` - List interactions
- `POST /api/core/interactions` - Create interaction
- `GET /api/core/interactions/:id` - Get interaction by ID
- `PATCH /api/core/interactions/:id` - Update interaction
- `DELETE /api/core/interactions/:id` - Delete interaction

### Appointment Management

- `GET /api/core/appointments` - List appointments
- `POST /api/core/appointments` - Create appointment
- `GET /api/core/appointments/:id` - Get appointment by ID
- `PATCH /api/core/appointments/:id` - Update appointment
- `POST /api/core/appointments/:id/cancel` - Cancel appointment

### Payment Management

- `GET /api/core/payments` - List payments
- `POST /api/core/payments/link` - Create payment link
- `GET /api/core/payments/:id` - Get payment by ID
- `POST /api/core/payments/:id/cancel` - Cancel payment

### AI Services

- `POST /api/core/ai/score/lead/:leadId` - Score a lead
- `POST /api/core/ai/score/batch` - Batch score leads
- `GET /api/core/ai/health` - AI service health check
- `GET /api/core/ai/insights/lead/:leadId` - Get AI insights

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing

## Security Features

- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Joi schema validation for all inputs
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable CORS policies
- **Error Handling**: Secure error responses

## Monitoring and Logging

- **Structured Logging**: Winston with configurable log levels
- **Request Logging**: All API requests are logged
- **Performance Monitoring**: Slow request detection
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: Built-in health check endpoints

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:prod

# Open Prisma Studio
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run database migrations:
   ```bash
   npm run db:migrate:prod
   ```

4. Start the production server:
   ```bash
   npm run start:prod
   ```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Use conventional commit messages

## License

MIT License - see LICENSE file for details