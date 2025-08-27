


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { Textarea } from '../../components/ui/Textarea';
import { getJobById, updateJob, createJob, getCompanies } from '../../services/mockApi';
import { JobPosting, UserRole, Company } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const jobStatuses: JobPosting['status'][] = ['Open', 'Interviewing', 'Closed'];

const initialFormData = {
    title: '',
    companyName: '',
    description: '',
    status: 'Open' as JobPosting['status'],
};

function EditJobPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { t } = useI18n();
    const { toast } = useToast();
    const { user } = useAuth();

    const isNewMode = !jobId;
    const isViewMode = pathname.endsWith('/view');

    const [job, setJob] = useState<JobPosting | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(!isNewMode);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.role === UserRole.ADMIN) {
                const companyData = await getCompanies();
                setCompanies(companyData);
            }

            if (isNewMode) {
                if (user?.role === UserRole.COMPANY_USER) {
                    setFormData(prev => ({ ...prev, companyName: user.companyName || '' }));
                }
                setLoading(false);
                return;
            }

            if (jobId) {
                setLoading(true);
                const data = await getJobById(jobId);
                setJob(data);
                if (data) {
                    setFormData({
                        title: data.title,
                        companyName: data.companyName,
                        description: data.description,
                        status: data.status,
                    });
                }
                setLoading(false);
            }
        };
        fetchData();
    }, [jobId, isNewMode, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isNewMode) {
                await createJob(formData);
                toast({ title: "Success!", description: "Job posted successfully.", variant: 'success' });
            } else {
                if (!jobId) return;
                await updateJob(jobId, formData);
                toast({ title: "Success!", description: "Job information updated.", variant: 'success' });
            }
            navigate('/enterprise/jobs');
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${isNewMode ? 'create' : 'update'} job.`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="space-y-4 p-8"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
    }

    if (!isNewMode && !job) {
        return <div className="p-8">Job not found.</div>
    }

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <Link to="/enterprise/jobs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Jobs
            </Link>
             <form onSubmit={handleSubmit}>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>
                            {isNewMode ? t('addNewJob') : isViewMode ? t('jobDetails') : t('editJob')}
                        </CardTitle>
                        <CardDescription>
                            {isNewMode ? 'Enter details for the new job posting.' : `Details for "${job?.title}".`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('jobTitle')}</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required disabled={isViewMode} />
                        </div>
                        {user?.role === UserRole.ADMIN && (
                             <div className="space-y-2">
                                <Label htmlFor="companyName">{t('company')}</Label>
                                <Select id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required disabled={isViewMode}>
                                    <option value="" disabled>Select a company</option>
                                    {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="description">{t('jobDescription')}</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required disabled={isViewMode} className="min-h-[200px]" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="status">{t('status')}</Label>
                            <Select id="status" name="status" value={formData.status} onChange={handleChange} disabled={isViewMode}>
                                {jobStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                    </CardContent>
                    {!isViewMode && (
                        <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>{t('cancel')}</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                                {t('save')}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </form>
        </div>
    );
}

export default EditJobPage;