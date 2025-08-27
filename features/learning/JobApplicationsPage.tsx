import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Dialog } from '../../components/ui/Dialog';
import { JobApplication, JobApplicationStatus, UserRole } from '../../types';
import { getJobApplications, updateJobApplicationStatus } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import { Calendar, Building, User, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';

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

export function JobApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [user]);

  const loadApplications = async () => {
    if (!user || user.role !== UserRole.MENTOR) return;
    
    try {
      setLoading(true);
      const data = await getJobApplications();
      // Mentor sees applications from their students that are pending review, or that they have already actioned.
      const mentorApplications = data.filter(app => 
        app.applicantType === 'STUDENT' && app.mentorId === user.id
      );
      setApplications(mentorApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!user) return;
    
    try {
      setActionLoading(applicationId);
      await updateJobApplicationStatus(applicationId, JobApplicationStatus.APPROVED, user.id);
      toast({
        title: t('applicationApproved'),
        description: t('applicationApprovedDesc'),
        variant: 'success'
      });
      await loadApplications();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('approvalError'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !user) return;
    
    try {
      setActionLoading(selectedApplication.id);
      await updateJobApplicationStatus(
        selectedApplication.id, 
        JobApplicationStatus.REJECTED, 
        user.id,
        rejectionReason
      );
      toast({
        title: t('applicationRejected'),
        description: t('applicationRejectedDesc'),
        variant: 'success'
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedApplication(null);
      await loadApplications();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('rejectionError'),
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (application: JobApplication) => {
    setSelectedApplication(application);
    setShowRejectModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">{t('jobApplications')}</h1>
          <p className="text-gray-600 mt-1">
            {t('jobApplicationsDesc')}
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
              <h3 className="text-lg font-medium text-gray-900">{t('noApplicationsToReview')}</h3>
              <p className="text-gray-500 mt-1">{t('noApplicationsToReviewDesc')}</p>
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
                      <Building className="h-4 w-4" />
                      {application.companyName}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {t('student')}: {application.applicantName}
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
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {t('viewResume')} →
                      </a>
                    </div>
                  )}

                  {application.status === JobApplicationStatus.MENTOR_REVIEW && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleApprove(application.id)}
                        disabled={actionLoading === application.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === application.id ? (
                          <Spinner className="h-4 w-4 mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {t('approve')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openRejectModal(application)}
                        disabled={actionLoading === application.id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('reject')}
                      </Button>
                    </div>
                  )}

                  {application.mentorApprovalAt && (
                    <div className="text-sm text-green-600 mt-2">
                      {t('approvedByMentor')}: {application.mentorName}
                      {application.mentorApprovalAt && (
                        <span className="ml-2">
                          {t('on')} {formatDate(application.mentorApprovalAt)}
                        </span>
                      )}
                    </div>
                  )}

                  {application.rejectionReason && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-700 mb-1">{t('rejectionReason')}:</p>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {application.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Dialog isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">{t('rejectApplication')}</h3>
              </div>
              <p className="text-gray-600 mb-4">
                {t('rejectApplicationDesc')}
              </p>
              <div className="mb-4">
                <Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('rejectionReason')} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('rejectionReasonPlaceholder')}
                  rows={4}
                  className={`w-full ${!rejectionReason.trim() && rejectionReason.length > 0 ? 'border-red-300 focus:border-red-500' : ''}`}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {rejectionReason.length}/500 {t('characters')}
                  </span>
                  {!rejectionReason.trim() && rejectionReason.length > 0 && (
                    <span className="text-xs text-red-500">{t('rejectionReasonRequired')}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedApplication(null);
                  }}
                  className="flex-1"
                  disabled={actionLoading === selectedApplication?.id}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || rejectionReason.trim().length < 10 || actionLoading === selectedApplication?.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                >
                  {actionLoading === selectedApplication?.id ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : null}
                  {t('reject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
