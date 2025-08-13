import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create skills first
  console.log('Creating skills...');
  const skills = await Promise.all([
    // Technical skills
    prisma.skill.upsert({
      where: { name: 'JavaScript' },
      update: {},
      create: { name: 'JavaScript', category: 'technical', description: 'Programming language for web development' }
    }),
    prisma.skill.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript', category: 'technical', description: 'Typed superset of JavaScript' }
    }),
    prisma.skill.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', category: 'technical', description: 'JavaScript library for building user interfaces' }
    }),
    prisma.skill.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', category: 'technical', description: 'JavaScript runtime for server-side development' }
    }),
    prisma.skill.upsert({
      where: { name: 'Python' },
      update: {},
      create: { name: 'Python', category: 'technical', description: 'High-level programming language' }
    }),
    prisma.skill.upsert({
      where: { name: 'SQL' },
      update: {},
      create: { name: 'SQL', category: 'technical', description: 'Database query language' }
    }),
    prisma.skill.upsert({
      where: { name: 'Docker' },
      update: {},
      create: { name: 'Docker', category: 'technical', description: 'Containerization platform' }
    }),
    prisma.skill.upsert({
      where: { name: 'AWS' },
      update: {},
      create: { name: 'AWS', category: 'technical', description: 'Amazon Web Services cloud platform' }
    }),
    // Soft skills
    prisma.skill.upsert({
      where: { name: 'Communication' },
      update: {},
      create: { name: 'Communication', category: 'soft', description: 'Effective verbal and written communication' }
    }),
    prisma.skill.upsert({
      where: { name: 'Leadership' },
      update: {},
      create: { name: 'Leadership', category: 'soft', description: 'Ability to lead and motivate teams' }
    }),
    prisma.skill.upsert({
      where: { name: 'Problem Solving' },
      update: {},
      create: { name: 'Problem Solving', category: 'soft', description: 'Analytical thinking and solution finding' }
    }),
    prisma.skill.upsert({
      where: { name: 'Teamwork' },
      update: {},
      create: { name: 'Teamwork', category: 'soft', description: 'Collaborative working with others' }
    }),
    // Domain skills
    prisma.skill.upsert({
      where: { name: 'Machine Learning' },
      update: {},
      create: { name: 'Machine Learning', category: 'domain', description: 'AI and ML algorithms and applications' }
    }),
    prisma.skill.upsert({
      where: { name: 'Data Analysis' },
      update: {},
      create: { name: 'Data Analysis', category: 'domain', description: 'Statistical analysis and data interpretation' }
    }),
    prisma.skill.upsert({
      where: { name: 'UI/UX Design' },
      update: {},
      create: { name: 'UI/UX Design', category: 'domain', description: 'User interface and experience design' }
    })
  ]);

  // Create teams
  console.log('Creating teams...');
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { id: 'team-1' },
      update: {},
      create: {
        id: 'team-1',
        name: 'Frontend Developers',
        description: 'Team focused on frontend development and user experience'
      }
    }),
    prisma.team.upsert({
      where: { id: 'team-2' },
      update: {},
      create: {
        id: 'team-2',
        name: 'Backend Engineers',
        description: 'Team specializing in backend services and APIs'
      }
    }),
    prisma.team.upsert({
      where: { id: 'team-3' },
      update: {},
      create: {
        id: 'team-3',
        name: 'Full Stack Team',
        description: 'Cross-functional team working on full stack applications'
      }
    }),
    prisma.team.upsert({
      where: { id: 'team-4' },
      update: {},
      create: {
        id: 'team-4',
        name: 'Data Science Team',
        description: 'Team focused on data analysis and machine learning'
      }
    })
  ]);

  // Create students
  console.log('Creating students...');
  const students = await Promise.all([
    prisma.student.upsert({
      where: { id: 'student-1' },
      update: {},
      create: {
        id: 'student-1',
        userId: 'user-1',
        email: 'alice.johnson@example.com',
        name: 'Alice Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        teamId: 'team-1'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-2' },
      update: {},
      create: {
        id: 'student-2',
        userId: 'user-2',
        email: 'bob.smith@example.com',
        name: 'Bob Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        teamId: 'team-2'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-3' },
      update: {},
      create: {
        id: 'student-3',
        userId: 'user-3',
        email: 'carol.davis@example.com',
        name: 'Carol Davis',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
        teamId: 'team-3'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-4' },
      update: {},
      create: {
        id: 'student-4',
        userId: 'user-4',
        email: 'david.wilson@example.com',
        name: 'David Wilson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        teamId: 'team-4'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-5' },
      update: {},
      create: {
        id: 'student-5',
        userId: 'user-5',
        email: 'eva.brown@example.com',
        name: 'Eva Brown',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva',
        teamId: 'team-1'
      }
    }),
    prisma.student.upsert({
      where: { id: 'student-6' },
      update: {},
      create: {
        id: 'student-6',
        userId: 'user-6',
        email: 'frank.miller@example.com',
        name: 'Frank Miller',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank',
        teamId: 'team-2'
      }
    })
  ]);

  // Assign skills to students
  console.log('Assigning skills to students...');
  const studentSkills = [
    // Alice - Frontend focused
    { studentId: 'student-1', skillId: skills.find(s => s.name === 'JavaScript')!.id, level: 8, verified: true },
    { studentId: 'student-1', skillId: skills.find(s => s.name === 'React')!.id, level: 9, verified: true },
    { studentId: 'student-1', skillId: skills.find(s => s.name === 'TypeScript')!.id, level: 7, verified: false },
    { studentId: 'student-1', skillId: skills.find(s => s.name === 'UI/UX Design')!.id, level: 6, verified: true },
    { studentId: 'student-1', skillId: skills.find(s => s.name === 'Communication')!.id, level: 8, verified: true },
    
    // Bob - Backend focused
    { studentId: 'student-2', skillId: skills.find(s => s.name === 'Node.js')!.id, level: 8, verified: true },
    { studentId: 'student-2', skillId: skills.find(s => s.name === 'Python')!.id, level: 7, verified: true },
    { studentId: 'student-2', skillId: skills.find(s => s.name === 'SQL')!.id, level: 9, verified: true },
    { studentId: 'student-2', skillId: skills.find(s => s.name === 'Docker')!.id, level: 6, verified: false },
    { studentId: 'student-2', skillId: skills.find(s => s.name === 'Problem Solving')!.id, level: 8, verified: true },
    
    // Carol - Full stack
    { studentId: 'student-3', skillId: skills.find(s => s.name === 'JavaScript')!.id, level: 7, verified: true },
    { studentId: 'student-3', skillId: skills.find(s => s.name === 'React')!.id, level: 6, verified: true },
    { studentId: 'student-3', skillId: skills.find(s => s.name === 'Node.js')!.id, level: 7, verified: true },
    { studentId: 'student-3', skillId: skills.find(s => s.name === 'SQL')!.id, level: 6, verified: false },
    { studentId: 'student-3', skillId: skills.find(s => s.name === 'Leadership')!.id, level: 7, verified: true },
    
    // David - Data Science
    { studentId: 'student-4', skillId: skills.find(s => s.name === 'Python')!.id, level: 9, verified: true },
    { studentId: 'student-4', skillId: skills.find(s => s.name === 'Machine Learning')!.id, level: 8, verified: true },
    { studentId: 'student-4', skillId: skills.find(s => s.name === 'Data Analysis')!.id, level: 9, verified: true },
    { studentId: 'student-4', skillId: skills.find(s => s.name === 'SQL')!.id, level: 7, verified: true },
    { studentId: 'student-4', skillId: skills.find(s => s.name === 'Problem Solving')!.id, level: 9, verified: true }
  ];

  for (const skill of studentSkills) {
    await prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: skill.studentId,
          skillId: skill.skillId
        }
      },
      update: { level: skill.level, verified: skill.verified },
      create: skill
    });
  }

  // Create tasks
  console.log('Creating tasks...');
  const tasks = await Promise.all([
    prisma.task.upsert({
      where: { id: 'task-1' },
      update: {},
      create: {
        id: 'task-1',
        title: 'Build React Component Library',
        description: 'Create a reusable component library with TypeScript and Storybook',
        type: 'team',
        difficulty: 'medium',
        maxScore: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        teamId: 'team-1'
      }
    }),
    prisma.task.upsert({
      where: { id: 'task-2' },
      update: {},
      create: {
        id: 'task-2',
        title: 'API Design and Implementation',
        description: 'Design and implement RESTful API with authentication and rate limiting',
        type: 'individual',
        difficulty: 'hard',
        maxScore: 150,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        teamId: 'team-2'
      }
    }),
    prisma.task.upsert({
      where: { id: 'task-3' },
      update: {},
      create: {
        id: 'task-3',
        title: 'Data Analysis Project',
        description: 'Analyze customer data and create predictive models',
        type: 'project',
        difficulty: 'hard',
        maxScore: 200,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        teamId: 'team-4'
      }
    }),
    prisma.task.upsert({
      where: { id: 'task-4' },
      update: {},
      create: {
        id: 'task-4',
        title: 'Code Review Exercise',
        description: 'Review and provide feedback on peer code submissions',
        type: 'individual',
        difficulty: 'easy',
        maxScore: 50,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      }
    })
  ]);

  // Create submissions
  console.log('Creating submissions...');
  const submissions = [
    {
      taskId: 'task-1',
      studentId: 'student-1',
      content: JSON.stringify({ github_url: 'https://github.com/alice/component-library', demo_url: 'https://alice-components.netlify.app' }),
      status: 'evaluated',
      score: 85,
      feedback: 'Excellent component design and documentation. Good use of TypeScript.'
    },
    {
      taskId: 'task-2',
      studentId: 'student-2',
      content: JSON.stringify({ github_url: 'https://github.com/bob/api-project', api_docs: 'https://bob-api.herokuapp.com/docs' }),
      status: 'evaluated',
      score: 92,
      feedback: 'Well-structured API with comprehensive authentication. Excellent error handling.'
    },
    {
      taskId: 'task-4',
      studentId: 'student-3',
      content: JSON.stringify({ review_document: 'https://docs.google.com/document/d/abc123', reviewed_repos: ['repo1', 'repo2'] }),
      status: 'submitted'
    }
  ];

  for (const submission of submissions) {
    await prisma.submission.upsert({
      where: {
        taskId_studentId: {
          taskId: submission.taskId,
          studentId: submission.studentId
        }
      },
      update: submission,
      create: submission
    });
  }

  // Create evaluations
  console.log('Creating evaluations...');
  const evaluations = [
    { studentId: 'student-1', evaluatorId: 'student-2', type: 'peer', category: 'technical', score: 8, feedback: 'Strong frontend skills and good code quality' },
    { studentId: 'student-1', evaluatorId: 'student-3', type: 'peer', category: 'communication', score: 9, feedback: 'Excellent communication and collaboration' },
    { studentId: 'student-2', evaluatorId: 'student-1', type: 'peer', category: 'technical', score: 9, feedback: 'Outstanding backend development skills' },
    { studentId: 'student-2', evaluatorId: 'student-3', type: 'peer', category: 'problem_solving', score: 8, feedback: 'Great analytical thinking and problem-solving approach' },
    { studentId: 'student-3', evaluatorId: 'student-1', type: 'peer', category: 'leadership', score: 8, feedback: 'Shows good leadership potential in team projects' },
    { studentId: 'student-4', evaluatorId: 'student-1', type: 'peer', category: 'technical', score: 9, feedback: 'Exceptional data science and ML skills' }
  ];

  for (const evaluation of evaluations) {
    await prisma.evaluation.create({ data: evaluation });
  }

  // Create companies
  console.log('Creating companies...');
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'company-1' },
      update: {},
      create: {
        id: 'company-1',
        name: 'TechCorp Solutions',
        description: 'Leading technology solutions provider specializing in web applications and cloud services',
        industry: 'Technology',
        size: 'large',
        location: 'San Francisco, CA',
        website: 'https://techcorp.com'
      }
    }),
    prisma.company.upsert({
      where: { id: 'company-2' },
      update: {},
      create: {
        id: 'company-2',
        name: 'DataFlow Analytics',
        description: 'Data analytics and machine learning company helping businesses make data-driven decisions',
        industry: 'Data Analytics',
        size: 'medium',
        location: 'New York, NY',
        website: 'https://dataflow.com'
      }
    }),
    prisma.company.upsert({
      where: { id: 'company-3' },
      update: {},
      create: {
        id: 'company-3',
        name: 'StartupHub',
        description: 'Fast-growing startup building innovative mobile applications',
        industry: 'Mobile Apps',
        size: 'startup',
        location: 'Austin, TX',
        website: 'https://startuphub.com'
      }
    })
  ]);

  // Create jobs
  console.log('Creating jobs...');
  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: 'job-1' },
      update: {},
      create: {
        id: 'job-1',
        companyId: 'company-1',
        title: 'Senior Frontend Developer',
        description: 'We are looking for a Senior Frontend Developer to join our team and build amazing user experiences using React and TypeScript.',
        requirements: 'Bachelor\'s degree in Computer Science or related field. 3+ years of experience with React, TypeScript, and modern frontend tools.',
        location: 'San Francisco, CA',
        salary: '$120,000 - $160,000',
        type: 'full-time',
        level: 'senior',
        status: 'active'
      }
    }),
    prisma.job.upsert({
      where: { id: 'job-2' },
      update: {},
      create: {
        id: 'job-2',
        companyId: 'company-2',
        title: 'Data Scientist',
        description: 'Join our data science team to build machine learning models and extract insights from large datasets.',
        requirements: 'Master\'s degree in Data Science, Statistics, or related field. Experience with Python, SQL, and ML frameworks.',
        location: 'New York, NY',
        salary: '$130,000 - $180,000',
        type: 'full-time',
        level: 'mid',
        status: 'active'
      }
    }),
    prisma.job.upsert({
      where: { id: 'job-3' },
      update: {},
      create: {
        id: 'job-3',
        companyId: 'company-3',
        title: 'Full Stack Developer Intern',
        description: 'Summer internship opportunity to work on full stack web applications using modern technologies.',
        requirements: 'Currently pursuing degree in Computer Science. Knowledge of JavaScript, React, and Node.js preferred.',
        location: 'Austin, TX',
        salary: '$25/hour',
        type: 'internship',
        level: 'entry',
        status: 'active'
      }
    })
  ]);

  // Create job skills
  console.log('Creating job skills...');
  const jobSkills = [
    // Senior Frontend Developer
    { jobId: 'job-1', skillId: skills.find(s => s.name === 'React')!.id, required: true, weight: 1.0 },
    { jobId: 'job-1', skillId: skills.find(s => s.name === 'TypeScript')!.id, required: true, weight: 0.9 },
    { jobId: 'job-1', skillId: skills.find(s => s.name === 'JavaScript')!.id, required: true, weight: 0.8 },
    { jobId: 'job-1', skillId: skills.find(s => s.name === 'UI/UX Design')!.id, required: false, weight: 0.6 },
    { jobId: 'job-1', skillId: skills.find(s => s.name === 'Communication')!.id, required: true, weight: 0.7 },
    
    // Data Scientist
    { jobId: 'job-2', skillId: skills.find(s => s.name === 'Python')!.id, required: true, weight: 1.0 },
    { jobId: 'job-2', skillId: skills.find(s => s.name === 'Machine Learning')!.id, required: true, weight: 1.0 },
    { jobId: 'job-2', skillId: skills.find(s => s.name === 'Data Analysis')!.id, required: true, weight: 0.9 },
    { jobId: 'job-2', skillId: skills.find(s => s.name === 'SQL')!.id, required: true, weight: 0.8 },
    { jobId: 'job-2', skillId: skills.find(s => s.name === 'Problem Solving')!.id, required: true, weight: 0.7 },
    
    // Full Stack Intern
    { jobId: 'job-3', skillId: skills.find(s => s.name === 'JavaScript')!.id, required: true, weight: 0.9 },
    { jobId: 'job-3', skillId: skills.find(s => s.name === 'React')!.id, required: false, weight: 0.7 },
    { jobId: 'job-3', skillId: skills.find(s => s.name === 'Node.js')!.id, required: false, weight: 0.7 },
    { jobId: 'job-3', skillId: skills.find(s => s.name === 'Teamwork')!.id, required: true, weight: 0.8 }
  ];

  for (const jobSkill of jobSkills) {
    await prisma.jobSkill.upsert({
      where: {
        jobId_skillId: {
          jobId: jobSkill.jobId,
          skillId: jobSkill.skillId
        }
      },
      update: { required: jobSkill.required, weight: jobSkill.weight },
      create: jobSkill
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`Created:`);
  console.log(`- ${skills.length} skills`);
  console.log(`- ${teams.length} teams`);
  console.log(`- ${students.length} students`);
  console.log(`- ${tasks.length} tasks`);
  console.log(`- ${submissions.length} submissions`);
  console.log(`- ${evaluations.length} evaluations`);
  console.log(`- ${companies.length} companies`);
  console.log(`- ${jobs.length} jobs`);
  console.log(`- ${jobSkills.length} job skills`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });