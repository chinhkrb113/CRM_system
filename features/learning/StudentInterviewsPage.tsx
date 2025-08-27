import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Interview, InterviewStatus } from '../../types';
import { getInterviewsForStudent } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';
import { Calendar, Building, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import InterviewDetailsModal from '../../components/InterviewDetailsModal';

export function StudentInterviewsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);

  useEffect(() => {
    loadInterviews();
  }, [user]);

  const loadInterviews = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getInterviewsForStudent(user.id);
      setInterviews(data);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: InterviewStatus) => {
    const statusConfig = {
      [InterviewStatus.PENDING]: { 
        variant: 'warning' as const, 
        icon: Clock, 
        label: t('pending') 
      },
      [InterviewStatus.ACCEPTED]: { 
        variant: 'success' as const, 
        icon: CheckCircle, 
        label: t('accepted') 
      },
      [InterviewStatus.DECLINED]: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        label: t('declined') 
      },
      [InterviewStatus.COMPLETED]: { 
        variant: 'secondary' as const, 
        icon: CheckCircle, 
        label: t('completed') 
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

  const handleViewDetails = (interviewId: string) => {
    setSelectedInterviewId(interviewId);
  };

  const handleModalClose = () => {
    setSelectedInterviewId(null);
    loadInterviews(); // Reload interviews to get updated status
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
          <h1 className="text-2xl font-bold text-gray-900">{t('myInterviews')}</h1>
          <p className="text-gray-600 mt-1">
            {t('myInterviewsDesc')}
          </p>
        </div>
      </div>

      {interviews.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('noInterviews')}</h3>
              <p className="text-gray-500 mt-1">{t('noInterviewsDesc')}</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {interview.jobTitle}
                    </h3>
                    {getStatusBadge(interview.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {interview.companyName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(interview.scheduledTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {interview.location}
                    </div>
                  </div>

                  {interview.status === InterviewStatus.PENDING && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">{t('responseRequired')}</span>
                      </div>
                    </div>
                  )}

                  {interview.declineReason && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-red-700 mb-1">{t('declineReason')}:</p>
                      <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {interview.declineReason}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(interview.id)}
                  >
                    {t('viewDetails')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <InterviewDetailsModal
        isOpen={!!selectedInterviewId}
        onClose={handleModalClose}
        interviewId={selectedInterviewId}
      />
    </div>
  );
}

export default StudentInterviewsPage;