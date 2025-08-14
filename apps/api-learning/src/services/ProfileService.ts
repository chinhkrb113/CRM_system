import { prisma } from '../lib/prisma';
import { createError } from '../middleware/errorHandler';

export interface StudentProfile {
  id: string;
  studentId: string;
  basicInfo: {
    name: string;
    email: string;
    avatar?: string;
    team?: {
      id: string;
      name: string;
    };
  };
  skills: {
    technical: Array<{
      name: string;
      level: number;
      verified: boolean;
      category: string;
    }>;
    soft: Array<{
      name: string;
      level: number;
      verified: boolean;
      category: string;
    }>;
    domain: Array<{
      name: string;
      level: number;
      verified: boolean;
      category: string;
    }>;
  };
  performance: {
    tasks: {
      total: number;
      completed: number;
      averageScore: number;
      byDifficulty: Record<string, {
        count: number;
        averageScore: number;
      }>;
      byType: Record<string, {
        count: number;
        averageScore: number;
      }>;
    };
    evaluations: {
      total: number;
      averageScore: number;
      byType: Record<string, {
        count: number;
        averageScore: number;
      }>;
      byCategory: Record<string, {
        count: number;
        averageScore: number;
      }>;
    };
  };
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  lastUpdated: string;
  version: number;
}

export class ProfileService {
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  async getStudentProfile(studentId: string, forceRefresh = false): Promise<StudentProfile> {
    // Check for cached profile first
    if (!forceRefresh) {
      const cachedProfile = await this.getCachedProfile(studentId);
      if (cachedProfile) {
        return cachedProfile;
      }
    }

    // Generate new profile
    const profile = await this.generateProfile(studentId);
    
    // Cache the profile
    await this.cacheProfile(studentId, profile);
    
    return profile;
  }

  private async getCachedProfile(studentId: string): Promise<StudentProfile | null> {
    const cachedProfile = await prisma.profile.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    if (!cachedProfile) {
      return null;
    }

    // Check if cache is still valid
    const cacheAge = Date.now() - new Date(cachedProfile.createdAt).getTime();
    if (cacheAge > this.CACHE_TTL) {
      return null;
    }

    return cachedProfile.profileJson as unknown as StudentProfile;
  }

  private async cacheProfile(studentId: string, profile: StudentProfile): Promise<void> {
    await prisma.profile.create({
      data: {
        studentId,
        profileJson: profile as any,
        version: profile.version
      }
    });

    // Clean up old cached profiles (keep only last 5)
    const oldProfiles = await prisma.profile.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      skip: 5
    });

    if (oldProfiles.length > 0) {
      await prisma.profile.deleteMany({
        where: {
          id: {
            in: oldProfiles.map((p: { id: string }) => p.id)
          }
        }
      });
    }
  }

  private async generateProfile(studentId: string): Promise<StudentProfile> {
    // Get student basic info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        team: {
          select: { id: true, name: true }
        },
        skills: {
          include: {
            skill: true
          }
        },
        submissions: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                type: true,
                difficulty: true,
                maxScore: true
              }
            }
          },
          where: {
            score: { not: null }
          }
        },
        evaluations: {
          select: {
            type: true,
            category: true,
            score: true,
            feedback: true,
            createdAt: true
          }
        }
      }
    });

    if (!student) {
      throw createError('Student not found', 404);
    }

    // Process skills by category
    const skills = {
      technical: student.skills.filter((s: any) => s.skill.category === 'technical').map((s: any) => ({
        name: s.skill.name,
        level: s.level,
        verified: s.verified,
        category: s.skill.category
      })),
      soft: student.skills.filter((s: any) => s.skill.category === 'soft').map((s: any) => ({
        name: s.skill.name,
        level: s.level,
        verified: s.verified,
        category: s.skill.category
      })),
      domain: student.skills.filter((s: any) => s.skill.category === 'domain').map((s: any) => ({
        name: s.skill.name,
        level: s.level,
        verified: s.verified,
        category: s.skill.category
      }))
    };

    // Process task performance
    const taskPerformance = this.calculateTaskPerformance(student.submissions);
    
    // Process evaluation performance
    const evaluationPerformance = this.calculateEvaluationPerformance(student.evaluations);

    // Generate insights
    const insights = this.generateInsights(skills, taskPerformance, evaluationPerformance);

    const profile: StudentProfile = {
      id: `profile_${studentId}_${Date.now()}`,
      studentId,
      basicInfo: {
        name: student.name,
        email: student.email,
        avatar: student.avatar || undefined,
        team: student.team || undefined
      },
      skills,
      performance: {
        tasks: taskPerformance,
        evaluations: evaluationPerformance
      },
      strengths: insights.strengths,
      areasForImprovement: insights.areasForImprovement,
      recommendations: insights.recommendations,
      lastUpdated: new Date().toISOString(),
      version: 1
    };

    return profile;
  }

  private calculateTaskPerformance(submissions: any[]) {
    const total = submissions.length;
    const completed = submissions.filter((s: any) => s.score !== null).length;
    
    let averageScore = 0;
    if (completed > 0) {
      const totalScore = submissions
        .filter((s: any) => s.score !== null)
        .reduce((sum: number, s: any) => sum + (s.score / s.task.maxScore) * 100, 0);
      averageScore = totalScore / completed;
    }

    // Group by difficulty
    const byDifficulty: Record<string, { count: number; averageScore: number }> = {};
    submissions.forEach((s: any) => {
      const difficulty = s.task.difficulty;
      if (!byDifficulty[difficulty]) {
        byDifficulty[difficulty] = { count: 0, averageScore: 0 };
      }
      byDifficulty[difficulty].count++;
      if (s.score !== null) {
        const scorePercent = (s.score / s.task.maxScore) * 100;
        byDifficulty[difficulty].averageScore = 
          (byDifficulty[difficulty].averageScore * (byDifficulty[difficulty].count - 1) + scorePercent) / byDifficulty[difficulty].count;
      }
    });

    // Group by type
    const byType: Record<string, { count: number; averageScore: number }> = {};
    submissions.forEach((s: any) => {
      const type = s.task.type;
      if (!byType[type]) {
        byType[type] = { count: 0, averageScore: 0 };
      }
      byType[type].count++;
      if (s.score !== null) {
        const scorePercent = (s.score / s.task.maxScore) * 100;
        byType[type].averageScore = 
          (byType[type].averageScore * (byType[type].count - 1) + scorePercent) / byType[type].count;
      }
    });

    return {
      total,
      completed,
      averageScore: Math.round(averageScore * 100) / 100,
      byDifficulty,
      byType
    };
  }

  private calculateEvaluationPerformance(evaluations: any[]) {
    const total = evaluations.length;
    
    let averageScore = 0;
    if (total > 0) {
      averageScore = evaluations.reduce((sum, e) => sum + e.score, 0) / total;
    }

    // Group by type
    const byType: Record<string, { count: number; averageScore: number }> = {};
    evaluations.forEach(e => {
      if (!byType[e.type]) {
        byType[e.type] = { count: 0, averageScore: 0 };
      }
      byType[e.type].count++;
      byType[e.type].averageScore = 
        (byType[e.type].averageScore * (byType[e.type].count - 1) + e.score) / byType[e.type].count;
    });

    // Group by category
    const byCategory: Record<string, { count: number; averageScore: number }> = {};
    evaluations.forEach(e => {
      if (!byCategory[e.category]) {
        byCategory[e.category] = { count: 0, averageScore: 0 };
      }
      byCategory[e.category].count++;
      byCategory[e.category].averageScore = 
        (byCategory[e.category].averageScore * (byCategory[e.category].count - 1) + e.score) / byCategory[e.category].count;
    });

    return {
      total,
      averageScore: Math.round(averageScore * 100) / 100,
      byType,
      byCategory
    };
  }

  private generateInsights(skills: any, taskPerformance: any, evaluationPerformance: any) {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendations: string[] = [];

    // Analyze skills
    const allSkills = [...skills.technical, ...skills.soft, ...skills.domain];
    const highLevelSkills = allSkills.filter((s: any) => s.level >= 8);
    const lowLevelSkills = allSkills.filter((s: any) => s.level <= 4);
    const verifiedSkills = allSkills.filter((s: any) => s.verified);

    if (highLevelSkills.length > 0) {
      strengths.push(`Strong proficiency in ${highLevelSkills.map((s: any) => s.name).join(', ')}`);
    }

    if (verifiedSkills.length > allSkills.length * 0.7) {
      strengths.push('High skill verification rate demonstrates credibility');
    }

    if (lowLevelSkills.length > 0) {
      areasForImprovement.push(`Needs improvement in ${lowLevelSkills.map((s: any) => s.name).join(', ')}`);
    }

    // Analyze task performance
    if (taskPerformance.averageScore >= 85) {
      strengths.push('Excellent task completion performance');
    } else if (taskPerformance.averageScore < 70) {
      areasForImprovement.push('Task completion scores need improvement');
      recommendations.push('Focus on understanding task requirements and seek feedback');
    }

    // Analyze evaluation performance
    if (evaluationPerformance.averageScore >= 8) {
      strengths.push('Strong peer and instructor evaluations');
    } else if (evaluationPerformance.averageScore < 6) {
      areasForImprovement.push('Peer evaluation scores indicate areas for growth');
      recommendations.push('Seek feedback from peers and mentors for improvement');
    }

    // Generate recommendations based on patterns
    if (skills.technical.length < 5) {
      recommendations.push('Expand technical skill set through additional learning');
    }

    if (skills.soft.length < 3) {
      recommendations.push('Develop soft skills through team collaboration and communication practice');
    }

    if (taskPerformance.byType.team && taskPerformance.byType.team.averageScore < taskPerformance.averageScore) {
      recommendations.push('Focus on improving team collaboration skills');
    }

    return {
      strengths,
      areasForImprovement,
      recommendations
    };
  }
}