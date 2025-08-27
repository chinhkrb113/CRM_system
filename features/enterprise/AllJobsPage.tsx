

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../components/ui/DropdownMenu';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { getJobs, getJobApplications } from '../../services/mockApi';
import { JobPosting, UserRole, JobApplication } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import JobDetailsModal from './components/JobDetailsModal';

import { QuickApplyModal } from '../../components/QuickApplyModal';

const statusColorMap = {
    Open: 'bg-green-500',
    Interviewing: 'bg-blue-500',
    Closed: 'bg-gray-500',
};

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof JobPosting; direction: SortDirection };

function AllJobsPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const { toast } = useToast();
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [userApplications, setUserApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [jobToQuickApply, setJobToQuickApply] = useState<JobPosting | null>(null);
    const [isQuickApplyModalOpen, setIsQuickApplyModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });

    const [jobCooldowns, setJobCooldowns] = useState<{[jobId: string]: number}>({});
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const jobsData = await getJobs();
                setJobs(jobsData);
                
                if (user?.id && user?.role) {
                    const applicationsData = await getJobApplications(user.id, user.role);
                    setUserApplications(applicationsData);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        if (user?.id) {
            loadQuickApplyCooldown();
        }
    }, []); // Empty dependency array - only run once on mount

    // Auto-update timer every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);



    // Load job-specific cooldowns from localStorage (only for employees)
    const loadQuickApplyCooldown = useCallback(() => {
        if (!user?.id || user.role !== UserRole.EMPLOYEE) return;
        const savedCooldowns = localStorage.getItem(`job_cooldowns_${user.id}`);
        if (savedCooldowns) {
            try {
                const cooldowns = JSON.parse(savedCooldowns);
                const now = Date.now();
                const activeCooldowns: {[jobId: string]: number} = {};
                
                // Filter out expired cooldowns
                Object.entries(cooldowns).forEach(([jobId, endTime]) => {
                    const endTimeNumber = typeof endTime === 'number' ? endTime : Number(endTime);
                    if (!isNaN(endTimeNumber) && endTimeNumber > now) {
                        activeCooldowns[jobId] = endTimeNumber;
                    }
                });
                
                setJobCooldowns(activeCooldowns);
                
                // Update localStorage with only active cooldowns
                if (Object.keys(activeCooldowns).length > 0) {
                    localStorage.setItem(`job_cooldowns_${user.id}`, JSON.stringify(activeCooldowns));
                } else {
                    localStorage.removeItem(`job_cooldowns_${user.id}`);
                }
            } catch (error) {
                console.error('Error parsing job cooldowns:', error);
                localStorage.removeItem(`job_cooldowns_${user.id}`);
            }
        }
    }, [user?.id, user?.role]);



    // Job-specific cooldown timer effect
    useEffect(() => {
        if (Object.keys(jobCooldowns).length === 0) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const updatedCooldowns: {[jobId: string]: number} = {};
            let hasChanges = false;

            Object.entries(jobCooldowns).forEach(([jobId, endTime]) => {
                const endTimeNumber = typeof endTime === 'number' ? endTime : Number(endTime);
                if (!isNaN(endTimeNumber) && endTimeNumber > now) {
                    updatedCooldowns[jobId] = endTimeNumber;
                } else {
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                setJobCooldowns(updatedCooldowns);
                if (user?.id) {
                    if (Object.keys(updatedCooldowns).length > 0) {
                        localStorage.setItem(`job_cooldowns_${user.id}`, JSON.stringify(updatedCooldowns));
                    } else {
                        localStorage.removeItem(`job_cooldowns_${user.id}`);
                    }
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [jobCooldowns, user?.id]);

    const sortedJobs = useMemo(() => {
        if (!jobs || jobs.length === 0) return [];
        const sortableItems = [...jobs];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [jobs, sortConfig]);

    const requestSort = (key: keyof JobPosting) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortDirection = (key: keyof JobPosting) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    const handleViewDetails = (job: JobPosting) => {
        setSelectedJob(job);
        setIsModalOpen(true);
    };



    const handleQuickApply = (job: JobPosting) => {
        setJobToQuickApply(job);
        setIsQuickApplyModalOpen(true);
    };

    const hasAppliedForJob = (jobId: string) => {
        return userApplications.some(app => app.jobId === jobId);
    };



    const loadUserApplications = useCallback(async () => {
        if (user?.id && user?.role) {
            try {
                const applicationsData = await getJobApplications(user.id, user.role);
                setUserApplications(applicationsData);
            } catch (error) {
                console.error('Error loading user applications:', error);
            }
        }
    }, []);

    const handleSuccessfulApplication = useCallback(() => {
        loadUserApplications();
        loadQuickApplyCooldown();
    }, [loadUserApplications, loadQuickApplyCooldown]);

    const canApplyForJobs = user && (user.role === UserRole.STUDENT || user.role === UserRole.EMPLOYEE);

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('allJobsTitle')}</h1>
                 <p className="text-muted-foreground">{t('allJobsDesc')}</p>
            </div>
            
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <div>
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => requestSort('title')} isSorted={getSortDirection('title')}>{t('jobTitle')}</TableHead>
                                 <TableHead onClick={() => requestSort('companyName')} isSorted={getSortDirection('companyName')}>{t('company')}</TableHead>
                                 <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>{t('status')}</TableHead>
                                 <TableHead onClick={() => requestSort('createdAt')} isSorted={getSortDirection('createdAt')}>{t('postedDate')}</TableHead>
                                 <TableHead>{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!loading && sortedJobs.length > 0 ? sortedJobs.map(job => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-semibold">{job.title}</TableCell>
                                    <TableCell>{job.companyName}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("h-2 w-2 rounded-full", statusColorMap[job.status])}></span>
                                            <span>{job.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                         <div className="flex items-center gap-2">
                                             <DropdownMenu>
                                                 <DropdownMenuTrigger asChild>
                                                     <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                         <span className="sr-only">Open menu</span>
                                                         <span className="text-lg">⋯</span>
                                                     </Button>
                                                 </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="end">
                                                     <DropdownMenuItem onClick={() => {
                                                         setSelectedJob(job);
                                                         setIsModalOpen(true);
                                                     }}>
                                                         👁️ {t('viewDetails')}
                                                     </DropdownMenuItem>
                                                     {canApplyForJobs && (
                                         jobCooldowns[job.id] && Number(jobCooldowns[job.id]) > currentTime ? (
                                             <DropdownMenuItem disabled>
                                                 ⏱️ Đang chờ
                                             </DropdownMenuItem>
                                         ) : (
                                             <DropdownMenuItem onClick={() => handleQuickApply(job)}>
                                                 ⚡ Ứng tuyển nhanh
                                             </DropdownMenuItem>
                                         )
                                     )}
                                                 </DropdownMenuContent>
                                             </DropdownMenu>
                                             {canApplyForJobs && jobCooldowns[job.id] && Number(jobCooldowns[job.id]) > currentTime && (
                                                 <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                     {(() => {
                                                         const remainingMs = Number(jobCooldowns[job.id]) - currentTime;
                                                         const minutes = Math.floor(remainingMs / 60000);
                                                         const seconds = Math.floor((remainingMs % 60000) / 1000);
                                                         return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                                     })()}
                                                 </div>
                                             )}
                                         </div>
                                     </TableCell>
                                </TableRow>
                            )) : Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
            {selectedJob && (
                <JobDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    job={selectedJob}
                />
            )}

            {jobToQuickApply && (
                <QuickApplyModal
                    isOpen={isQuickApplyModalOpen}
                    onClose={() => {
                        setIsQuickApplyModalOpen(false);
                        setJobToQuickApply(null);
                    }}
                    job={jobToQuickApply}
                    onSuccess={handleSuccessfulApplication}
                />
            )}
        </div>
    );
}

export default AllJobsPage;
