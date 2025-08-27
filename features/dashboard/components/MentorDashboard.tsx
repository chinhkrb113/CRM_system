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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  Clock,
  MessageSquare,
  CheckCircle,
  Star,
  Target,
  Calendar,
  Video,
  FileText
} from 'lucide-react';

// Mock data for Mentor Dashboard
const studentProgressData = [
  { month: 'Jan', active: 45, completed: 12, enrolled: 52 },
  { month: 'Feb', active: 52, completed: 18, enrolled: 58 },
  { month: 'Mar', active: 48, completed: 15, enrolled: 55 },
  { month: 'Apr', active: 61, completed: 22, enrolled: 68 },
  { month: 'May', active: 58, completed: 25, enrolled: 72 },
  { month: 'Jun', active: 67, completed: 28, enrolled: 78 }
];

const coursePerformanceData = [
  { course: 'React Fundamentals', students: 45, completion: 85, rating: 4.8 },
  { course: 'JavaScript Advanced', students: 38, completion: 78, rating: 4.6 },
  { course: 'Node.js Backend', students: 32, completion: 72, rating: 4.7 },
  { course: 'Database Design', students: 28, completion: 88, rating: 4.9 },
  { course: 'UI/UX Principles', students: 25, completion: 82, rating: 4.5 }
];

const engagementMetrics = [
  { metric: 'Participation', score: 85, fullMark: 100 },
  { metric: 'Assignment Quality', score: 78, fullMark: 100 },
  { metric: 'Discussion Activity', score: 92, fullMark: 100 },
  { metric: 'Attendance', score: 88, fullMark: 100 },
  { metric: 'Feedback Response', score: 75, fullMark: 100 },
  { metric: 'Peer Interaction', score: 82, fullMark: 100 }
];

const weeklyActivityData = [
  { day: 'Mon', sessions: 8, messages: 25, reviews: 12 },
  { day: 'Tue', sessions: 12, messages: 32, reviews: 15 },
  { day: 'Wed', sessions: 6, messages: 18, reviews: 8 },
  { day: 'Thu', sessions: 15, messages: 28, reviews: 18 },
  { day: 'Fri', sessions: 10, messages: 22, reviews: 14 },
  { day: 'Sat', sessions: 5, messages: 12, reviews: 6 },
  { day: 'Sun', sessions: 3, messages: 8, reviews: 4 }
];

const studentSatisfactionData = [
  { rating: '5 Stars', count: 145, color: '#10b981' },
  { rating: '4 Stars', count: 89, color: '#3b82f6' },
  { rating: '3 Stars', count: 32, color: '#f59e0b' },
  { rating: '2 Stars', count: 12, color: '#ef4444' },
  { rating: '1 Star', count: 5, color: '#6b7280' }
];

interface MentorKpiCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function MentorKpiCard({ title, value, change, trend, icon: Icon, color, subtitle }: MentorKpiCardProps) {
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

function MentorDashboard() {
  const { t } = useI18n();
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const mentorKpis = [
    {
      title: 'Active Students',
      value: '67',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      subtitle: 'Across 5 courses'
    },
    {
      title: 'Course Completion',
      value: '82%',
      change: '+5.3%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      subtitle: 'Average rate'
    },
    {
      title: 'Student Rating',
      value: '4.7',
      change: '+0.2',
      trend: 'up' as const,
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      subtitle: 'Out of 5.0'
    },
    {
      title: 'Teaching Hours',
      value: '156',
      change: '+8.7%',
      trend: 'up' as const,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      subtitle: 'This month'
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Mentor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor student progress and teaching performance</p>
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
        {mentorKpis.map((kpi, index) => (
          <MentorKpiCard key={index} {...kpi} />
        ))}
      </div>

{/* Weekly Activity and Student Satisfaction */}
<div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Weekly Teaching Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyActivityData}>
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
                  dataKey="sessions" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  name="Sessions"
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                  name="Messages"
                />
                <Line 
                  type="monotone" 
                  dataKey="reviews" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                  name="Reviews"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student Satisfaction */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Student Satisfaction Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={studentSatisfactionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ rating, percent }) => `${rating}: ${(percent * 100).toFixed(0)}%`}
                >
                  {studentSatisfactionData.map((entry, index) => (
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

      {/* Student Progress Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-500" />
            Student Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={studentProgressData}>
              <defs>
                <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="enrolledGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
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
                dataKey="enrolled"
                stackId="1"
                stroke="#8b5cf6"
                fill="url(#enrolledGradient)"
                name="Enrolled"
              />
              <Area
                type="monotone"
                dataKey="active"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#activeGradient)"
                name="Active"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stackId="1"
                stroke="#10b981"
                fill="url(#completedGradient)"
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Course Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-emerald-500" />
              Course Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="course" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="completion" fill="#10b981" radius={[4, 4, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student Engagement Radar */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-500" />
              Student Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={engagementMetrics}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <Radar
                  name="Engagement"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Video className="h-8 w-8 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Start Session</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Begin teaching</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Message Students</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Send updates</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Grade Assignments</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review submissions</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 mx-auto mb-3 text-yellow-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Course</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">New content</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MentorDashboard;