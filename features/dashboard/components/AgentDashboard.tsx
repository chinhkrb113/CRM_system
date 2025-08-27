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
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Phone,
  Mail,
  Calendar,
  Award,
  Activity,
  UserCheck
} from 'lucide-react';

// Mock data for Agent Dashboard
const salesPerformanceData = [
  { month: 'Jan', sales: 45000, target: 50000, leads: 120 },
  { month: 'Feb', sales: 52000, target: 50000, leads: 135 },
  { month: 'Mar', sales: 48000, target: 55000, leads: 128 },
  { month: 'Apr', sales: 61000, target: 55000, leads: 145 },
  { month: 'May', sales: 58000, target: 60000, leads: 152 },
  { month: 'Jun', sales: 67000, target: 60000, leads: 168 }
];

const leadConversionData = [
  { stage: 'New Leads', count: 245, color: '#3b82f6' },
  { stage: 'Qualified', count: 180, color: '#10b981' },
  { stage: 'Proposal', count: 95, color: '#f59e0b' },
  { stage: 'Negotiation', count: 45, color: '#8b5cf6' },
  { stage: 'Closed Won', count: 32, color: '#06d6a0' }
];

const activityData = [
  { day: 'Mon', calls: 25, emails: 45, meetings: 8 },
  { day: 'Tue', calls: 32, emails: 38, meetings: 12 },
  { day: 'Wed', calls: 28, emails: 42, meetings: 6 },
  { day: 'Thu', calls: 35, emails: 48, meetings: 15 },
  { day: 'Fri', calls: 30, emails: 35, meetings: 10 },
  { day: 'Sat', calls: 15, emails: 20, meetings: 3 },
  { day: 'Sun', calls: 8, emails: 12, meetings: 1 }
];

const topClientsData = [
  { client: 'TechCorp Inc.', revenue: 45000, deals: 8 },
  { client: 'Innovation Ltd.', revenue: 38000, deals: 6 },
  { client: 'StartupXYZ', revenue: 32000, deals: 12 },
  { client: 'Enterprise Co.', revenue: 28000, deals: 5 },
  { client: 'Digital Agency', revenue: 25000, deals: 9 }
];

interface AgentKpiCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function AgentKpiCard({ title, value, change, trend, icon: Icon, color, subtitle }: AgentKpiCardProps) {
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

function AgentDashboard() {
  const { t } = useI18n();
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const agentKpis = [
    {
      title: 'Monthly Revenue',
      value: '$67,000',
      change: '+15.3%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      subtitle: 'Target: $60,000'
    },
    {
      title: 'Active Leads',
      value: '168',
      change: '+8.7%',
      trend: 'up' as const,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      subtitle: 'This month'
    },
    {
      title: 'Conversion Rate',
      value: '13.1%',
      change: '+2.4%',
      trend: 'up' as const,
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      subtitle: 'Industry avg: 11%'
    },
    {
      title: 'Deals Closed',
      value: '32',
      change: '+6.2%',
      trend: 'up' as const,
      icon: Award,
      color: 'from-orange-500 to-orange-600',
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sales Agent Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your sales performance and lead management</p>
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
        {agentKpis.map((kpi, index) => (
          <AgentKpiCard key={index} {...kpi} />
        ))}
      </div>

      {/* Sales Performance Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
            Sales Performance vs Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={salesPerformanceData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
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
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#salesGradient)"
                name="Sales"
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#targetGradient)"
                name="Target"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Conversion Funnel */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
              Lead Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadConversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {leadConversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-500" />
              Weekly Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
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
                  dataKey="calls" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  name="Calls"
                />
                <Line 
                  type="monotone" 
                  dataKey="emails" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                  name="Emails"
                />
                <Line 
                  type="monotone" 
                  dataKey="meetings" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                  name="Meetings"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            Top Performing Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClientsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="client" type="category" width={120} stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Deals'
                ]}
              />
              <Bar dataKey="revenue" fill="#06d6a0" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Make Calls</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect with your leads</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Mail className="h-8 w-8 mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Send Emails</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Follow up with prospects</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Schedule Meetings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Book appointments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AgentDashboard;