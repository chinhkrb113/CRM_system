
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useI18n } from '../../../hooks/useI18n';
import { useAuth } from '../../../contexts/AuthContext';
import { getStudents } from '../../../services/mockApi';
import { Student, StudentStatus } from '../../../types';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { 
  Users, 
  GraduationCap,
  BookOpen,
  UserCheck
} from 'lucide-react';

interface SchoolKpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

function SchoolKpiCard({ title, value, icon: Icon, color }: SchoolKpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-br ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SchoolDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        if (user?.schoolName) {
            setLoading(true);
            const studentData = await getStudents(user.schoolName);
            setStudents(studentData);
            setLoading(false);
        }
    };
    fetchData();
  }, [user]);

  const schoolKpis = useMemo(() => {
    if (!students) return [];
    return [
      {
        title: 'Total Students',
        value: students.length.toString(),
        icon: Users,
        color: 'from-blue-500 to-blue-600'
      },
      {
        title: 'Active Students',
        value: students.filter(s => s.status === StudentStatus.ACTIVE).length.toString(),
        icon: UserCheck,
        color: 'from-green-500 to-green-600'
      },
      {
        title: 'Graduated Students',
        value: students.filter(s => s.status === StudentStatus.GRADUATED).length.toString(),
        icon: GraduationCap,
        color: 'from-purple-500 to-purple-600'
      },
      {
        title: 'Active Courses',
        value: new Set(students.map(s => s.course)).size.toString(),
        icon: BookOpen,
        color: 'from-orange-500 to-orange-600'
      }
    ];
  }, [students]);

  const courseDistributionData = useMemo(() => {
    if (!students) return [];
    const courseCounts = students.reduce((acc, student) => {
        acc[student.course] = (acc[student.course] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(courseCounts).map(([name, count]) => ({ name, count }));
  }, [students]);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user?.schoolName}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your students and courses.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {schoolKpis.map((kpi, index) => (
          <SchoolKpiCard key={index} {...kpi} />
        ))}
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            Student Distribution by Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default SchoolDashboard;
