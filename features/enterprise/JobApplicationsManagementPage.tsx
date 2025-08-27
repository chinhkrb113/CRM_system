
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Dialog } from '../../components/ui/Dialog';
import { JobApplication, JobApplicationStatus, UserRole } from '../../types';
import { getJobApplications, updateJobApplicationStatus, createInterview } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { Calendar, Building, User, Clock, CheckCircle, XCircle, AlertCircle, Eye, CalendarPlus, FileText } from 'lucide-react';
import { buttonVariants } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const getExtensionFromDataUrl = (dataUrl: string): string => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return '';
  const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    default:
      return '';
  }
};

export function JobApplicationsManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({
    scheduledAt: '',
    location: ''
  });

  useEffect(() => {
    loadApplications();
  }, [user]);

  const loadApplications = async () => {
    if (!user || user.role !== UserRole.COMPANY_USER) return;
    
    try {
      setLoading(true);
      // Get all applications for jobs posted by this company
      const data = await getJobApplications();
      // Filter applications for jobs from this company
      const companyApplications = data.filter(app => 
        app.companyName === user.companyName && (
          app.status === JobApplicationStatus.APPROVED || 
          app.status === JobApplicationStatus.PENDING ||
          app.status === JobApplicationStatus.MENTOR_REVIEW
        )
      );
      setApplications(companyApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !user) return;
    
    try {
      setActionLoading(selectedApplication.id);
      
      // Create interview
      await createInterview({
        jobId: selectedApplication.jobId,
        candidateId: selectedApplication.applicantId,
        interviewerId: user.id,
        scheduledAt: interviewData.scheduledAt,
        location: interviewData.location
      });

      toast({
        title: t('interviewScheduled'),
        description: t('interviewScheduledDesc'),
        variant: 'success'
      });
      
      setShowInterviewModal(false);
      setInterviewData({ scheduledAt: '', location: '' });
      setSelectedApplication(null);
      await loadApplications();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('scheduleInterviewError'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openInterviewModal = (application: JobApplication) => {
    setSelectedApplication(application);
    setShowInterviewModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">{t('jobApplicationsManagement')}</h1>
          <p className="text-gray-600 mt-1">
            {t('jobApplicationsManagementDesc')}
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('noApplicationsReceived')}</h3>
              <p className="text-gray-500 mt-1">{t('noApplicationsReceivedDesc')}</p>
            </div>
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
                      <User className="h-4 w-4" />
                      {application.applicantType === 'STUDENT' ? t('student') : t('employee')}: {application.applicantName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('appliedOn')}: {formatDate(application.appliedAt)}
                    </div>
                  </div>

                  {application.coverLetter && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('coverLetter')}:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}

                  {application.resumeUrl && (
                     <div className="mb-4">
                        <a
                          href={application.resumeUrl}
                          download={`CV_${application.applicantName.replace(/\s+/g, '_')}_${application.jobTitle.replace(/\s+/g, '_')}${getExtensionFromDataUrl(application.resumeUrl)}`}
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {t('viewResume')}
                        </a>
                      </div>
                  )}

                  {(application.status === JobApplicationStatus.APPROVED || 
                    (application.applicantType === 'EMPLOYEE' && application.status === JobApplicationStatus.PENDING)) && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => openInterviewModal(application)}
                        disabled={actionLoading === application.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {actionLoading === application.id ? (
                          <Spinner className="h-4 w-4 mr-2" />
                        ) : (
                          <CalendarPlus className="h-4 w-4 mr-2" />
                        )}
                        {t('scheduleInterview')}
                      </Button>
                    </div>
                  )}

                  {application.applicantType === 'STUDENT' && application.mentorName && (
                    <div className="text-sm text-green-600 mt-2">
                      {t('approvedByMentor')}: {application.mentorName}
                      {application.mentorApprovalAt && (
                        <span className="ml-2">
                          {t('on')} {formatDate(application.mentorApprovalAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Dialog isOpen={showInterviewModal} onClose={() => setShowInterviewModal(false)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('scheduleInterview')}</h3>
          <p className="text-gray-600">
            {t('scheduleInterviewFor')}: {selectedApplication?.applicantName}
          </p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduledAt">{t('interviewDateTime')}</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={interviewData.scheduledAt}
                onChange={(e) => setInterviewData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="location">{t('location')}</Label>
              <Input
                id="location"
                value={interviewData.location}
                onChange={(e) => setInterviewData(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('scheduleLocationPlaceholder')}
                required
              />
            </div>
            

          </div>
          
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowInterviewModal(false);
                setInterviewData({ scheduledAt: '', location: '' });
                setSelectedApplication(null);
              }}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleScheduleInterview}
              disabled={!interviewData.scheduledAt || !interviewData.location || actionLoading === selectedApplication?.id}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading === selectedApplication?.id ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : null}
              {t('schedule')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
