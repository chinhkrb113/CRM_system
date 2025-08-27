import React, { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { JobPosting, UserRole } from '../types';
import { createJobApplication } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { FileUp } from 'lucide-react';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting;
  onSuccess?: () => void;
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function JobApplicationModal({ isOpen, onClose, job, onSuccess }: JobApplicationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [formData, setFormData] = useState({
    coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);


  // Load cooldown from localStorage on mount
  React.useEffect(() => {
    const savedCooldown = localStorage.getItem(`apply_cooldown_${user?.id}`);
    if (savedCooldown) {
      const endTime = parseInt(savedCooldown);
      if (endTime > Date.now()) {
        setCooldownEndTime(endTime);
      } else {
        localStorage.removeItem(`apply_cooldown_${user?.id}`);
      }
    }
  }, [user?.id]);

  // Effect to handle cooldown timer
  React.useEffect(() => {
    if (!cooldownEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, cooldownEndTime - now);
      setRemainingTime(remaining);

      if (remaining === 0) {
        setCooldownEndTime(null);
        localStorage.removeItem(`apply_cooldown_${user?.id}`);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEndTime, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let resumeDataUrl = '';
      if (resumeFile) {
        resumeDataUrl = await fileToDataUrl(resumeFile);
      }
      
      const applicantType = user.role === UserRole.STUDENT ? 'STUDENT' : 'EMPLOYEE';
      
      await createJobApplication({
        jobId: job.id,
        applicantId: user.id,
        applicantType,
        coverLetter: formData.coverLetter,
        resumeUrl: resumeDataUrl,
      });

      // Set 3-minute cooldown only for employees
      if (user.role === UserRole.EMPLOYEE) {
        const cooldownDuration = 3 * 60 * 1000; // 3 minutes in milliseconds
        const endTime = Date.now() + cooldownDuration;
        setCooldownEndTime(endTime);
        localStorage.setItem(`apply_cooldown_${user.id}`, endTime.toString());
      }

      onSuccess?.();
      onClose();
      setFormData({ coverLetter: '' });
      setResumeFile(null);
      
      // Show toast after modal closes to avoid being hidden
      setTimeout(() => {
        const isStudentUser = user.role === UserRole.STUDENT;
        toast({
          title: 'Ứng tuyển thành công!',
          description: isStudentUser 
            ? 'Đơn ứng tuyển đã được gửi đến mentor để xem xét. Bạn sẽ nhận được thông báo khi mentor phê duyệt.' 
            : 'Đơn ứng tuyển đã được gửi đến công ty. Vui lòng chờ 3 phút trước khi ứng tuyển công việc khác.',
          variant: 'success'
        });
      }, 100);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('applicationSubmitError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const isStudent = user?.role === UserRole.STUDENT;
  const isOnCooldown = cooldownEndTime && Date.now() < cooldownEndTime;
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('applyForJob')}: {job.title}
            </h2>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{t('company')}:</strong> {job.companyName}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {job.description}
              </p>
            </div>

            {isStudent && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t('note')}:</strong> Đơn ứng tuyển của bạn sẽ được gửi đến mentor để xem xét và phê duyệt trước khi chuyển đến công ty.
                </p>
              </div>
            )}
            
            {user?.role === UserRole.EMPLOYEE && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>{t('note')}:</strong> Đơn ứng tuyển của bạn sẽ được gửi trực tiếp đến công ty để xem xét.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="coverLetter">{t('coverLetter')}</Label>
                <Textarea
                  id="coverLetter"
                  value={formData.coverLetter}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                  placeholder={t('coverLetterPlaceholder')}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="resumeFile">{t('attachCVOptional')}</Label>
                <Input
                  id="resumeFile"
                  type="file"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-foreground file:text-primary hover:file:bg-accent"
                  accept=".pdf,.doc,.docx"
                />
              </div>


              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isOnCooldown}
                  className="flex-1"
                >
                  {loading 
                    ? t('submitting') 
                    : isOnCooldown 
                      ? `Chờ ${formatTime(remainingTime)}` 
                      : t('submitApplication')
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
