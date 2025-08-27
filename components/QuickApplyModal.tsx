import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { JobPosting, UserRole } from '../types';
import { createJobApplication } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';

interface QuickApplyModalProps {
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

export function QuickApplyModal({ isOpen, onClose, job, onSuccess }: QuickApplyModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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
        coverLetter: coverLetter || 'Ứng tuyển nhanh - Tôi quan tâm đến vị trí này.',
        resumeUrl: resumeDataUrl
      });

      // Set 3-minute cooldown for this specific job only for employees
      if (user.role === UserRole.EMPLOYEE) {
        const cooldownDuration = 3 * 60 * 1000; // 3 minutes in milliseconds
        const endTime = Date.now() + cooldownDuration;
        
        const existingCooldowns = localStorage.getItem(`job_cooldowns_${user.id}`);
        let jobCooldowns: {[jobId: string]: number} = {};
        
        if (existingCooldowns) {
          try {
            jobCooldowns = JSON.parse(existingCooldowns);
          } catch (error) {
            console.error('Error parsing job cooldowns:', error);
          }
        }
        
        jobCooldowns[job.id] = endTime;
        localStorage.setItem(`job_cooldowns_${user.id}`, JSON.stringify(jobCooldowns));
      }

      onClose();
      setCoverLetter('');
      setResumeFile(null);
      
      setTimeout(() => {
        onSuccess?.();
      }, 50);
      
      setTimeout(() => {
        const isStudentUser = user.role === UserRole.STUDENT;
        toast({
          title: '✅ Ứng tuyển nhanh thành công!',
          description: isStudentUser 
            ? 'Đơn ứng tuyển đã được gửi đến mentor để xem xét.' 
            : 'Vui lòng đợi 3 phút thì sẽ được apply trở lại',
          variant: 'success'
        });
      }, 100);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi đơn ứng tuyển. Vui lòng thử lại.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeFile(e.target.files?.[0] || null);
  };

  const isStudent = user?.role === UserRole.STUDENT;

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
            <DialogTitle>📝 {t('quickApplyTitle')}: {job.title}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{t('company')}:</strong> {job.companyName}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {job.description}
              </p>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>💡 {t('note')}:</strong> Đây là phương án ứng tuyển nhanh. 
                {isStudent 
                  ? ' Đơn sẽ được gửi đến mentor để xem xét.' 
                  : ' Đơn sẽ được gửi trực tiếp đến công ty.'
                }
              </p>
            </div>
          
            <div>
              <Label htmlFor="quickCoverLetter">{t('coverLetterOptional')}</Label>
              <Textarea
                id="quickCoverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={t('coverLetterPlaceholder')}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('coverLetterDefault')}
              </p>
            </div>
            
            <div>
              <Label htmlFor="resumeFile">{t('attachCVOptional')}</Label>
              <Input
                id="resumeFile"
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-foreground file:text-primary hover:file:bg-accent"
                accept=".pdf,.doc,.docx"
              />
            </div>
        </DialogContent>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? `⏳ ${t('submitting')}` : `🚀 ${t('applyNow')}`}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
