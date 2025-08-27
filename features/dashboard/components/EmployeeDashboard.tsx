import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useI18n } from '../../../hooks/useI18n';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Briefcase, 
  Calendar, 
  FileText, 
  Users,
  Clock,
  Building
} from 'lucide-react';

function EmployeeDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const employeeKpis = [
    {
      title: 'Job Applications',
      value: '12',
      change: '+3 this month',
      trend: 'up' as const,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      subtitle: 'Total submitted'
    },
    {
      title: 'Interviews Scheduled',
      value: '5',
      change: '+2 upcoming',
      trend: 'up' as const,
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-600',
      subtitle: 'This month'
    },
    {
      title: 'Companies Interested',
      value: '8',
      change: '+1 new',
      trend: 'up' as const,
      icon: Building,
      color: 'from-orange-500 to-orange-600',
      subtitle: 'Showing interest'
    },
    {
      title: 'Profile Views',
      value: '24',
      change: '+6 this week',
      trend: 'up' as const,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      subtitle: 'By recruiters'
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Employee Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name}!</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {employeeKpis.map((kpi, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {kpi.title}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {kpi.value}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {kpi.subtitle}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View My Applications
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              My Interviews
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Applied to Software Engineer at TechCorp
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Interview scheduled with Innovate Inc.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Profile viewed by 3 companies
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EmployeeDashboard;