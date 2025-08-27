import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Select } from '../../../components/ui/Select';
import { useI18n } from '../../../hooks/useI18n';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Clock,
  Target,
  CheckCircle,
  Star,
  Calendar,
  Play,
  FileText,
  Users,
  Trophy,
  Brain,
  Zap
} from 'lucide-react';

// Mock data for Student Dashboard
const learningProgressData = [
  { week: 'Week 1', completed: 15, target: 20, hours: 8 },
  { week: 'Week 2', completed: 22, target: 25, hours: 12 },
  { week: 'Week 3', completed: 18, target: 20, hours: 10 },
  { week: 'Week 4', completed: 28, target: 30, hours: 15 },
  { week: 'Week 5', completed: 25, target: 25, hours: 14 },
  { week: 'Week 6', completed: 32, target: 30, hours: 18 }
];

const courseProgressData = [
  { course: 'React Fundamentals', progress: 85, totalLessons: 24, completedLessons: 20 },
  { course: 'JavaScript ES6+', progress: 92, totalLessons: 18, completedLessons: 17 },
  { course: 'CSS Grid & Flexbox', progress: 100, totalLessons: 12, completedLessons: 12 },
  { course: 'Node.js Basics', progress: 45, totalLessons: 20, completedLessons: 9 },
  { course: 'Database Design', progress: 30, totalLessons: 16, completedLessons: 5 }
];

const skillProgressData = [
  { skill: 'Frontend Development', progress: 78, color: '#3b82f6' },
  { skill: 'Backend Development', progress: 45, color: '#10b981' },
  { skill: 'Database Management', progress: 62, color: '#f59e0b' },
  { skill: 'UI/UX Design', progress: 55, color: '#8b5cf6' },
  { skill: 'Project Management', progress: 40, color: '#ef4444' }
];

const studyTimeData = [
  { day: 'Mon', hours: 3.5, sessions: 2 },
  { day: 'Tue', hours: 4.2, sessions: 3 },
  { day: 'Wed', hours: 2.8, sessions: 2 },
  { day: 'Thu', hours: 5.1, sessions: 4 },
  { day: 'Fri', hours: 3.9, sessions: 3 },
  { day: 'Sat', hours: 6.2, sessions: 4 },
  { day: 'Sun', hours: 2.5, sessions: 1 }
];

const achievementsData = [
  { achievement: 'Course Completed', count: 3, color: '#10b981' },
  { achievement: 'Perfect Scores', count: 8, color: '#3b82f6' },
  { achievement: 'Streak Days', count: 15, color: '#f59e0b' },
  { achievement: 'Certificates', count: 2, color: '#8b5cf6' }
];

interface StudentKpiCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function StudentKpiCard({ title, value, change, trend, icon: Icon, color, subtitle }: StudentKpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
            )}
            <div className="flex items-center space-x-1">
              <TrendingUp className={`h-4 w-4 ${
                trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-br ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentDashboard() {
  const { t } = useI18n();
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const studentKpis = [
    {
      title: 'Courses Enrolled',
      value: '5',
      change: '+1 this month',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      subtitle: '3 completed'
    },
    {
      title: 'Learning Streak',
      value: '15',
      change: '+3 days',
      trend: 'up' as const,
      icon: Zap,
      color: 'from-yellow-500 to-yellow-600',
      subtitle: 'Current streak'
    },
    {
      title: 'Overall Progress',
      value: '68%',
      change: '+12%',
      trend: 'up' as const,
      icon: Target,
      color: 'from-emerald-500 to-emerald-600',
      subtitle: 'All courses'
    },
    {
      title: 'Study Hours',
      value: '28h',
      change: '+5.2h',
      trend: 'up' as const,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      subtitle: 'This week'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Student Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your learning journey and achievements</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {studentKpis.map((kpi, index) => (
          <StudentKpiCard key={index} {...kpi} />
        ))}
      </div>

 {/* Study Time and Achievements */}
 <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Study Time */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Daily Study Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studyTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                  name="Study Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={achievementsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ achievement, count }) => `${achievement}: ${count}`}
                >
                  {achievementsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>


      {/* Learning Progress Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
            Weekly Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={learningProgressData}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#completedGradient)"
                name="Lessons Completed"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Course Progress */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseProgressData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" />
                <YAxis dataKey="course" type="category" width={120} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Progress']}
                />
                <Bar dataKey="progress" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skill Development */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-500" />
              Skill Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={skillProgressData}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                  background
                  dataKey="progress"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Progress']}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

     
      {/* Current Courses */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-emerald-500" />
            Current Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courseProgressData.slice(0, 3).map((course, index) => (
              <Card key={index} className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{course.course}</h4>
                    <span className="text-xs text-gray-500">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                    <span>{course.progress === 100 ? 'Completed' : 'In Progress'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Play className="h-8 w-8 mx-auto mb-3 text-emerald-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Continue Learning</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Resume course</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assignments</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View pending</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Study Groups</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Join discussions</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Schedule</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View calendar</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StudentDashboard;
