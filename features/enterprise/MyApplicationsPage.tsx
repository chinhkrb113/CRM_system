
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { JobApplication, JobApplicationStatus } from '../../types';
import { getJobApplications } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';
import { Calendar, Building, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function MyApplicationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, [user]);

  const loadApplications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getJobApplications(user.id);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: JobApplicationStatus) => {
    const statusConfig = {
      [JobApplicationStatus.PENDING]: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        label: t('pending') 
      },
      [JobApplicationStatus.MENTOR_REVIEW]: { 
        variant: 'warning' as const, 
        icon: AlertCircle, 
        label: t('mentorReview') 
      },
      [JobApplicationStatus.APPROVED]: { 
        variant: 'success' as const, 
        icon: CheckCircle, 
        label: t('approved') 
      },
      [JobApplicationStatus.REJECTED]: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        label: t('rejected') 
      },
      [JobApplicationStatus.WITHDRAWN]: { 
        variant: 'secondary' as const, 
        icon: XCircle, 
        label: t('withdrawn') 
      }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myApplications')}</h1>
          <p className="text-gray-600 mt-1">
            {t('myApplicationsDesc')}
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('noApplications')}</h3>
              <p className="text-gray-500 mt-1">{t('noApplicationsDesc')}</p>
            </div>
            <Button onClick={() => navigate('/enterprise/all-jobs')}>
              {t('browseJobs')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <Card key={application.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.jobTitle}
                    </h3>
                    {getStatusBadge(application.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {application.companyName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('appliedOn')}: {formatDate(application.appliedAt)}
                    </div>
                    {application.applicantType === 'STUDENT' && application.mentorName && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {t('mentor')}: {application.mentorName}
                      </div>
                    )}
                  </div>

                  {application.coverLetter && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('coverLetter')}:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}

                  {application.rejectionReason && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-red-700 mb-1">{t('rejectionReason')}:</p>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {application.rejectionReason}
                      </p>
                    </div>
                  )}

                  {application.mentorApprovalAt && (
                    <div className="text-sm text-green-600">
                      {t('approvedByMentor')}: {application.mentorName} {t('on')} {formatDate(application.mentorApprovalAt)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
