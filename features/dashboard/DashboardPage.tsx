
import React from 'react';
import { useState, useEffect } from 'react';
import { KpiData, AnomalyAlert } from '../../types';
import { getKpiData, getAnomalyAlerts } from '../../services/mockApi';
import KpiCard from '../../components/KpiCard';
import SalesChart from './components/SalesChart';
import LeadsBySourceChart from './components/LeadsBySourceChart';
import AnomalyAlerts from './components/AnomalyAlerts';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import AdminDashboard from './components/AdminDashboard';
import AgentDashboard from './components/AgentDashboard';
import MentorDashboard from './components/MentorDashboard';
import StudentDashboard from './components/StudentDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import SchoolDashboard from './components/SchoolDashboard';

function DashboardPage(): React.ReactNode {
  const [kpis, setKpis] = useState<KpiData[] | null>(null);
  const [alerts, setAlerts] = useState<AnomalyAlert[] | null>(null);
  const { t } = useI18n();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const kpiData = await getKpiData(t);
      const anomalyAlerts = await getAnomalyAlerts();
      setKpis(kpiData);
      setAlerts(anomalyAlerts);
    };
    fetchData();
  }, [t]);

  const handleAck = (id: string) => {
    setAlerts(prevAlerts => 
      prevAlerts ? prevAlerts.map(a => a.id === id ? { ...a, acknowledged: true } : a) : null
    );
  };

  // Render role-specific dashboard
  const renderDashboardByRole = () => {
    if (!user) {
      return (
        <div className="space-y-6 p-6">
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

    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard />;
      case UserRole.AGENT:
        return <AgentDashboard />;
      case UserRole.MENTOR:
        return <MentorDashboard />;
      case UserRole.STUDENT:
        return <StudentDashboard />;
      case UserRole.EMPLOYEE:
        return <EmployeeDashboard />;
      case UserRole.COMPANY_USER:
        return <CompanyDashboard />;
      case UserRole.SCHOOL:
        return <SchoolDashboard />;
      default:
        // Fallback to original dashboard for unknown roles
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis ? (
                kpis.map((kpi) => <KpiCard key={kpi.title} {...kpi} />)
              ) : (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[126px]" />)
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="lg:col-span-4">
                <SalesChart />
              </div>
              <div className="lg:col-span-3">
                <LeadsBySourceChart />
              </div>
            </div>
            
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
  };

  return renderDashboardByRole();
}

export default DashboardPage;
