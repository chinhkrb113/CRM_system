import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Select } from '../../../components/ui/Select';
import { useI18n } from '../../../hooks/useI18n';
import { getKpiData, getAnomalyAlerts } from '../../../services/mockApi';
import { KpiData, AnomalyAlert } from '../../../types';
import AnomalyAlerts from './AnomalyAlerts';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  BookOpen,
  Award,
  Activity,
  Clock
} from 'lucide-react';

// Mock data for new charts
const userGrowthData = [
  { month: 'Jan', newUsers: 120, returningUsers: 80 },
  { month: 'Feb', newUsers: 150, returningUsers: 95 },
  { month: 'Mar', newUsers: 180, returningUsers: 110 },
  { month: 'Apr', newUsers: 220, returningUsers: 140 },
  { month: 'May', newUsers: 280, returningUsers: 180 },
  { month: 'Jun', newUsers: 320, returningUsers: 220 }
];

const topCoursesData = [
  { course: 'React Fundamentals', students: 450, revenue: 22500 },
  { course: 'Node.js Backend', students: 380, revenue: 19000 },
  { course: 'Python Data Science', students: 320, revenue: 16000 },
  { course: 'UI/UX Design', students: 280, revenue: 14000 },
  { course: 'Digital Marketing', students: 250, revenue: 12500 }
];

const leadQualityData = [
  {
    source: 'Website',
    engagement: 85,
    conversion: 75,
    retention: 80,
    costPerLead: 90
  },
  {
    source: 'Paid Ads',
    engagement: 70,
    conversion: 85,
    retention: 65,
    costPerLead: 60
  },
  {
    source: 'Referral',
    engagement: 95,
    conversion: 90,
    retention: 95,
    costPerLead: 95
  }
];

const completionRateData = [
  { name: 'Completed', value: 76, color: '#10b981' },
  { name: 'In Progress', value: 18, color: '#f59e0b' },
  { name: 'Not Started', value: 6, color: '#ef4444' }
];

interface AdminKpiCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

function AdminKpiCard({ title, value, change, trend, icon: Icon, color }: AdminKpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
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
          <div className={`p-3 rounded-full bg-gradient-to-br ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { t } = useI18n();
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AnomalyAlert[] | null>(null);

  useEffect(() => {
    // Simulate loadinguseEffect(() => {
    const fetchData = async () => {
      const anomalyAlerts = await getAnomalyAlerts();
      setAlerts(anomalyAlerts);
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    };
    fetchData();
  }, []);

  const handleAck = (id: string) => {
    setAlerts(prevAlerts => 
      prevAlerts ? prevAlerts.map(a => a.id === id ? { ...a, acknowledged: true } : a) : null
    );
  };

  const adminKpis = [
    {
      title: 'Total Revenue',
      value: '$124,500',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Learners',
      value: '2,847',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Users,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Course Completion',
      value: '76%',
      change: '+3.1%',
      trend: 'up' as const,
      icon: Award,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Avg. Session Time',
      value: '24m',
      change: '+5.4%',
      trend: 'up' as const,
      icon: Clock,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
    <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive overview of your platform</p>
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
        {adminKpis.map((kpi, index) => (
          <AdminKpiCard key={index} {...kpi} />
        ))}
      </div>

      {/* User Growth Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-500" />
            User Growth Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="New Users"
              />
              <Line 
                type="monotone" 
                dataKey="returningUsers" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Returning Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Courses */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-500" />
              Top Performing Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCoursesData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="course" type="category" width={120} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="students" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Completion Rate */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-500" />
              Course Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={completionRateData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {completionRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {completionRateData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Quality Metrics Radar Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Target className="h-5 w-5 mr-2 text-indigo-500" />
            Lead Quality Metrics by Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={leadQualityData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="source" tick={{ fill: '#6b7280' }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Radar
                name="Engagement"
                dataKey="engagement"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Conversion"
                dataKey="conversion"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Retention"
                dataKey="retention"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="Cost per Lead"
                dataKey="costPerLead"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Anomaly Alerts */}
      <div>
        {alerts ? (
          <AnomalyAlerts alerts={alerts} onAck={handleAck} />
        ) : (
          <Skeleton className="h-[200px]" />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;