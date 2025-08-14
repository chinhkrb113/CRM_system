import { PrismaClient, UserRole, LeadStatus, LeadSource, InteractionType, AppointmentStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for all users (password: 'password123')
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'admin@crm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'manager@crm.com',
        password: hashedPassword,
        firstName: 'Manager',
        lastName: 'User',
        role: 'MANAGER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'sales@crm.com',
        password: hashedPassword,
        firstName: 'Sales',
        lastName: 'Rep',
        role: 'SALES',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440004',
        email: 'support@crm.com',
        password: hashedPassword,
        firstName: 'Support',
        lastName: 'Agent',
        role: 'SUPPORT',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Users created:', users.length);

  // Create leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        id: '660e8400-e29b-41d4-a716-446655440001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Tech Corp',
        jobTitle: 'CTO',
        status: 'NEW',
        source: 'WEBSITE',
        score: 85,
        notes: 'Interested in enterprise solution',
        customFields: JSON.stringify({ budget: '$50000', timeline: 'Q2 2024' }),
        ownerId: '550e8400-e29b-41d4-a716-446655440003',
      },
    }),
    prisma.lead.create({
      data: {
        id: '660e8400-e29b-41d4-a716-446655440002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+1234567891',
        company: 'Business Inc',
        jobTitle: 'CEO',
        status: 'CONTACTED',
        source: 'REFERRAL',
        score: 92,
        notes: 'High priority lead',
        customFields: JSON.stringify({ budget: '$100000', timeline: 'Q1 2024' }),
        ownerId: '550e8400-e29b-41d4-a716-446655440003',
      },
    }),
    prisma.lead.create({
      data: {
        id: '660e8400-e29b-41d4-a716-446655440003',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@startup.com',
        phone: '+1234567892',
        company: 'Startup LLC',
        jobTitle: 'Founder',
        status: 'QUALIFIED',
        source: 'SOCIAL_MEDIA',
        score: 78,
        notes: 'Looking for cost-effective solution',
        customFields: JSON.stringify({ budget: '$25000', timeline: 'Q3 2024' }),
        ownerId: '550e8400-e29b-41d4-a716-446655440003',
      },
    }),
    prisma.lead.create({
      data: {
        id: '660e8400-e29b-41d4-a716-446655440004',
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@enterprise.com',
        phone: '+1234567893',
        company: 'Enterprise Corp',
        jobTitle: 'VP Sales',
        status: 'PROPOSAL',
        source: 'EMAIL_CAMPAIGN',
        score: 95,
        notes: 'Ready to move forward',
        customFields: JSON.stringify({ budget: '$200000', timeline: 'Q1 2024' }),
        ownerId: '550e8400-e29b-41d4-a716-446655440003',
      },
    }),
  ]);

  console.log('✅ Leads created:', leads.length);

  // Create interactions
  const interactions = await Promise.all([
    prisma.interaction.create({
      data: {
        id: '770e8400-e29b-41d4-a716-446655440001',
        leadId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        type: 'CALL',
        subject: 'Initial Contact',
        description: 'First call to discuss requirements. Scheduled for tomorrow.',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
    }),
    prisma.interaction.create({
      data: {
        id: '770e8400-e29b-41d4-a716-446655440002',
        leadId: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        type: 'EMAIL',
        subject: 'Follow-up Email',
        description: 'Sent product information and pricing. Email sent successfully.',
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        outcome: 'Positive response received',
      },
    }),
  ]);

  console.log('✅ Interactions created:', interactions.length);

  // Create appointments
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        id: '880e8400-e29b-41d4-a716-446655440001',
        leadId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Discovery Call',
        description: 'Initial discovery call to understand requirements',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 60,
        location: 'Virtual',
        meetingType: 'VIDEO_CALL',
        reminderMinutes: 15,
        status: 'SCHEDULED',
        notes: 'Reminder set',
      },
    }),
    prisma.appointment.create({
      data: {
        id: '880e8400-e29b-41d4-a716-446655440002',
        leadId: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Product Demo',
        description: 'Comprehensive product demonstration',
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        duration: 90,
        location: 'Client Office',
        meetingType: 'IN_PERSON',
        reminderMinutes: 30,
        status: 'SCHEDULED',
        notes: 'Bring demo materials',
      },
    }),
  ]);

  console.log('✅ Appointments created:', appointments.length);

  // Create payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        id: '990e8400-e29b-41d4-a716-446655440001',
        leadId: '660e8400-e29b-41d4-a716-446655440004',
        amount: 50000.00,
        currency: 'USD',
        status: 'PENDING',
        paymentLink: 'https://payment.crm.com/pay/990e8400-e29b-41d4-a716-446655440001',
        description: 'Initial payment for enterprise solution',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        metadata: JSON.stringify({ invoice_id: 'INV-2024-001', payment_method: 'bank_transfer' }),
      },
    }),
    prisma.payment.create({
      data: {
        id: '990e8400-e29b-41d4-a716-446655440002',
        leadId: '660e8400-e29b-41d4-a716-446655440002',
        amount: 25000.00,
        currency: 'USD',
        status: 'PAID',
        paymentLink: 'https://payment.crm.com/pay/990e8400-e29b-41d4-a716-446655440002',
        description: 'Startup package payment',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: JSON.stringify({ invoice_id: 'INV-2024-002', payment_method: 'credit_card', transaction_id: 'txn_123456' }),
      },
    }),
  ]);

  console.log('✅ Payments created:', payments.length);

  // Create audit logs
  const auditLogs = await Promise.all([
    prisma.auditLog.create({
      data: {
        id: 'aa0e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        action: 'CREATE',
        entity: 'LEAD',
        entityId: '660e8400-e29b-41d4-a716-446655440001',
        newData: JSON.stringify({ name: 'John Doe', email: 'john.doe@example.com', status: 'NEW' }),
      },
    }),
    prisma.auditLog.create({
      data: {
        id: 'aa0e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        action: 'UPDATE',
        entity: 'LEAD',
        entityId: '660e8400-e29b-41d4-a716-446655440002',
        oldData: JSON.stringify({ status: 'NEW' }),
        newData: JSON.stringify({ status: 'CONTACTED' }),
      },
    }),
  ]);

  console.log('✅ Audit logs created:', auditLogs.length);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample accounts created:');
  console.log('- Admin: admin@crm.com (password: password123)');
  console.log('- Manager: manager@crm.com (password: password123)');
  console.log('- Sales: sales@crm.com (password: password123)');
  console.log('- Support: support@crm.com (password: password123)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });