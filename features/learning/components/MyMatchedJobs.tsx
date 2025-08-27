import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useI18n } from '../../../hooks/useI18n';
import { getJobMatchesForStudent } from '../../../services/mockApi';
import { JobPosting } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Briefcase } from 'lucide-react';

interface MyMatchedJobsProps {
    studentId: string;
}

function MyMatchedJobs({ studentId }: MyMatchedJobsProps) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<JobPosting[] | null | undefined>(undefined); // undefined for loading

    useEffect(() => {
        const fetchJobs = async () => {
            const jobsData = await getJobMatchesForStudent(studentId);
            setJobs(jobsData);
        };
        fetchJobs();
    }, [studentId]);

    const renderContent = () => {
        if (jobs === undefined) {
            return (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            );
        }

        if (!jobs || jobs.length === 0) {
            return (
                <div className="text-center py-10 text-muted-foreground">
                    <Briefcase className="mx-auto h-12 w-12" />
                    <p className="mt-4">{t('noMatchedJobs')}</p>
                </div>
            );
        }

        return (
            <ul className="space-y-3">
                {jobs.map(job => (
                    <li key={job.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <div>
                            <p className="font-semibold text-primary">{job.title}</p>
                            <p className="text-sm text-muted-foreground">{job.companyName}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/enterprise/jobs/${job.id}/matches`)}>
                            {t('viewJob')}
                        </Button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{t('matchedJobs')}</CardTitle>
                <CardDescription>{t('matchedJobsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}

export default MyMatchedJobs;