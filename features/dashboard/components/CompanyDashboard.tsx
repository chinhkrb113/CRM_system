import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Select } from '../../../components/ui/Select';
import { useI18n } from '../../../hooks/useI18n';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { getJobs, getInterviewsForCompany, getJobApplications } from '../../../services/mockApi';
import { JobPosting, Interview, JobApplication } from '../../../types';
import { 
  ComposedChart,
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
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign,
  UserCheck,
  Clock,
  Target,
  Building,
  Award,
  Search,
  FileText,
  Calendar,
  TrendingDown,
  Activity
} from 'lucide-react';

// Mock data for charts without API endpoints
const departmentHiringData = [
  { department: 'Engineering', openPositions: 15, filled: 8, pending: 7 },
  { department: 'Sales', openPositions: 12, filled: 10, pending: 2 },
  { department: 'Marketing', openPositions: 8, filled: 6, pending: 2 },
  { department: 'HR', openPositions: 5, filled: 3, pending: 2 },
  { department: 'Finance', openPositions: 6, filled: 4, pending: 2 }
];

const candidateSourceData = [
  { source: 'Job Boards', candidates: 145, color: '#3b82f6' },
  { source: 'Referrals', candidates: 89, color: '#10b981' },
  { source: 'LinkedIn', candidates: 67, color: '#0077b5' },
  { source: 'Company Website', candidates: 45, color: '#f59e0b' },
  { source: 'Recruiters', candidates: 32, color: '#8b5cf6' },
  { source: 'Others', candidates: 28, color: '#6b7280' }
];

const employeePerformanceData = [
  { quarter: 'Q1', satisfaction: 78, retention: 92, productivity: 85 },
  { quarter: 'Q2', satisfaction: 82, retention: 94, productivity: 88 },
  { quarter: 'Q3', satisfaction: 85, retention: 91, productivity: 90 },
  { quarter: 'Q4', satisfaction: 87, retention: 95, productivity: 92 }
];

const timeToHireData = [
  { position: 'Software Engineer', days: 28, target: 30 },
  { position: 'Sales Manager', days: 35, target: 25 },
  { position: 'Marketing Specialist', days: 22, target: 20 },
  { position: 'HR Coordinator', days: 18, target: 15 },
  { position: 'Data Analyst', days: 32, target: 35 }
];

interface CompanyKpiCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function CompanyKpiCard({ title, value, change, trend, icon: Icon, color, subtitle }: CompanyKpiCardProps) {
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
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
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

function CompanyDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<any>(null);
  const [hiringMetricsData, setHiringMetricsData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        if (!user || !user.companyName) return;
        
        setLoading(true);
        try {
            const [jobs, interviews, applications] = await Promise.all([
                getJobs(user.companyName),
                getInterviewsForCompany(user.companyName),
                getJobApplications().then(apps => apps.filter(app => app.companyName === user.companyName))
            ]);

            // Process KPI data
            const openPositions = jobs.filter(j => j.status === 'Open' || j.status === 'Interviewing').length;
            setKpiData({ openPositions, totalEmployees: 1247, hiringCost: 25800, employeeRetention: 95 });

            // Process hiring metrics chart data by month
            const metricsByMonth: {[key: string]: { applications: number, interviews: number, hired: number }} = {};
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = d.toLocaleString('en-US', { month: 'short' });
                metricsByMonth[monthKey] = { applications: 0, interviews: 0, hired: 0 };
            }

            applications.forEach(app => {
                const monthKey = new Date(app.appliedAt).toLocaleString('en-US', { month: 'short' });
                if (metricsByMonth[monthKey]) metricsByMonth[monthKey].applications++;
            });

            interviews.forEach(interview => {
                const monthKey = new Date(interview.scheduledTime).toLocaleString('en-US', { month: 'short' });
                if (metricsByMonth[monthKey]) {
                    metricsByMonth[monthKey].interviews++;
                    if (interview.status === 'COMPLETED' && Math.random() > 0.5) {
                        metricsByMonth[monthKey].hired++;
                    }
                }
            });
            
            setHiringMetricsData(Object.entries(metricsByMonth).map(([month, data]) => ({ month, ...data })));

            // Process recent activities
            const recentApps = applications.slice(0, 2).map(app => ({
                action: `New application: ${app.applicantName} for ${app.jobTitle}`,
                time: new Date(app.appliedAt).toLocaleString(),
                type: 'info'
            }));
            const recentInterviews = interviews.filter(i => new Date(i.scheduledTime) > new Date()).slice(0, 2).map(i => ({
                action: `Interview scheduled: ${i.candidateName} for ${i.jobTitle}`,
                time: new Date(i.scheduledTime).toLocaleString(),
                type: 'info'
            }));
            const recentHires = interviews.filter(i => i.status === 'COMPLETED').slice(0, 1).map(i => ({
                action: `Offer accepted: ${i.candidateName} for ${i.jobTitle}`,
                time: new Date(i.scheduledTime).toLocaleString(),
                type: 'success'
            }));
            
            const combinedActivities = [...recentApps, ...recentInterviews, ...recentHires]
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .slice(0, 5);
            setRecentActivities(combinedActivities);

        } catch (err) {
            console.error("Failed to fetch company dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user]);

  const companyKpis = kpiData ? [
    {
      title: 'Total Employees', value: kpiData.totalEmployees.toLocaleString(), change: '+28 this month',
      trend: 'up' as const, icon: Users, color: 'from-blue-500 to-blue-600', subtitle: 'Active workforce'
    },
    {
      title: 'Open Positions', value: kpiData.openPositions, change: '+8 new',
      trend: 'up' as const, icon: Briefcase, color: 'from-emerald-500 to-emerald-600', subtitle: 'Across departments'
    },
    {
      title: 'Hiring Cost', value: `$${(kpiData.hiringCost/1000).toFixed(1)}K`, change: '+12.5%',
      trend: 'up' as const, icon: DollarSign, color: 'from-orange-500 to-orange-600', subtitle: 'Per hire average'
    },
    {
      title: 'Employee Retention', value: `${kpiData.employeeRetention}%`, change: '+2.1%',
      trend: 'up' as const, icon: UserCheck, color: 'from-purple-500 to-purple-600', subtitle: 'Annual rate'
    }
  ] : [];

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
    <div className="space-y-8 p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Company Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor hiring metrics and workforce analytics</p>
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
        {companyKpis.map((kpi, index) => (
          <CompanyKpiCard key={index} {...kpi} />
        ))}
      </div>

      {/* Hiring Metrics Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
            Hiring Metrics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={hiringMetricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar yAxisId="left" dataKey="applications" fill="#3b82f6" name="Applications" />
              <Bar yAxisId="left" dataKey="interviews" fill="#10b981" name="Interviews" />
              <Line yAxisId="right" type="monotone" dataKey="hired" stroke="#f59e0b" strokeWidth={3} name="Hired" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Hiring Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-500" />
              Department Hiring Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentHiringData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="department" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="filled" stackId="a" fill="#10b981" name="Filled" />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Candidate Sources */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Search className="h-5 w-5 mr-2 text-emerald-500" />
              Candidate Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={candidateSourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="candidates"
                  label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                >
                  {candidateSourceData.map((entry, index) => (
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

      {/* Recent Activities */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            Recent Hiring Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            )) : <p className="text-sm text-center text-gray-500 py-4">No recent activities.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card onClick={() => navigate('/enterprise/jobs/new')} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Briefcase className="h-8 w-8 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Post New Job</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create listing</p>
          </CardContent>
        </Card>
        <Card onClick={() => navigate('/enterprise/applications-management')} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-emerald-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">View Candidates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review applications</p>
          </CardContent>
        </Card>
        <Card onClick={() => navigate('/enterprise/interviews')} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Schedule Interviews</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Book meetings</p>
          </CardContent>
        </Card>
        <Card onClick={() => toast({ title: 'Feature not available', description: 'Report generation is coming soon.' })} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Generate Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Analytics</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CompanyDashboard;
