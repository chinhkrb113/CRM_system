import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { getJobs, deleteJob } from '../../services/mockApi';
import { JobPosting, UserRole } from '../../types';
import { PlusCircle, Search, ListFilter, XCircle, Upload, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/Pagination';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useToast } from '../../hooks/useToast';
import JobsTable from './components/JobsTable';
import { GoogleGenAI } from '@google/genai';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof JobPosting; direction: SortDirection };

const jobStatuses: JobPosting['status'][] = ['Open', 'Interviewing', 'Closed'];

function JobsPage(): React.ReactNode {
    const { t } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [jobs, setJobs] = useState<JobPosting[] | null>(null);
    const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
    const [postingId, setPostingId] = useState<string | null>(null);
    
    // Filters and pagination state
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchJobs = async () => {
            const companyName = user?.role === UserRole.COMPANY_USER ? user.companyName : undefined;
            const data = await getJobs(companyName);
            setJobs(data);
        };
        fetchJobs();
    }, [user]);

     const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({ search: '', status: '' });
        setPage(0);
    };

    const filteredJobs = useMemo(() => {
        if (!jobs) return [];
        const searchTerm = filters.search.toLowerCase();
        return jobs.filter(job => {
            const searchMatch = searchTerm
                ? job.title.toLowerCase().includes(searchTerm) ||
                  (user?.role !== UserRole.COMPANY_USER && job.companyName.toLowerCase().includes(searchTerm))
                : true;
            const statusMatch = filters.status ? job.status === filters.status : true;
            return searchMatch && statusMatch;
        });
    }, [jobs, filters, user]);

    const sortedJobs = useMemo(() => {
        const sortableItems = [...filteredJobs];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredJobs, sortConfig]);

    const paginatedJobs = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return sortedJobs.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedJobs, page, rowsPerPage]);

    const requestSort = (key: keyof JobPosting) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleViewClick = (job: JobPosting) => {
        navigate(`/enterprise/jobs/${job.id}/view`);
    };

    const handleEditClick = (job: JobPosting) => {
        navigate(`/enterprise/jobs/${job.id}/edit`);
    };

    const handleDeleteClick = (job: JobPosting) => {
        setJobToDelete(job);
    };

    const confirmDelete = async () => {
        if (jobToDelete) {
            await deleteJob(jobToDelete.id);
            setJobs(prev => prev!.filter(j => j.id !== jobToDelete.id));
            toast({ title: 'Success', description: `Job posting "${jobToDelete.title}" deleted.`, variant: 'success' });
            setJobToDelete(null);
        }
    };
    
    const handlePostToFacebook = async (job: JobPosting) => {
        if (postingId) return; // Prevent multiple clicks
        setPostingId(job.id);
        toast({
            title: t('postingToFacebookTitle'),
            description: t('postingToFacebookDesc', { jobTitle: job.title }),
        });
    
        try {
            // Step 1: Generate post content with Gemini
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `From the following job details, create a complete and engaging recruitment post for Facebook in Vietnamese. The post should be professional, highlight key benefits, use appropriate emojis, and include a clear call to action. Keep it concise and suitable for social media.\n\nJob Title: ${job.title}\nCompany: ${job.companyName}\nDescription: ${job.description}`;
            
            const geminiResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            const postContent = geminiResponse.text;
            
            // Step 2: Send to n8n webhook
            const N8N_WEBHOOK_URL = 'https://chinhlee.app.n8n.cloud/webhook-test/76703af2-7765-4c65-acbd-dddfba65e739';
            const jobUrl = `${window.location.origin}${window.location.pathname}#/enterprise/jobs/${job.id}/view`;
    
            const payload = {
                postContent: postContent,
                jobTitle: job.title,
                companyName: job.companyName,
                jobUrl: jobUrl,
            };
    
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
    
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`n8n workflow returned status ${response.status}: ${errorBody}`);
            }
    
            const result = await response.json();
            console.log('n8n response:', result);
            
            toast({
                title: t('postToFacebookSuccessTitle'),
                description: t('postToFacebookSuccessDesc', { jobTitle: job.title }),
                variant: 'success',
            });
    
        } catch (error) {
            console.error('Failed to post to Facebook via n8n:', error);
            toast({
                title: t('postToFacebookErrorTitle'),
                description: t('postToFacebookErrorDesc'),
                variant: 'destructive',
            });
        } finally {
            setPostingId(null);
        }
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target?.result as string;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const requiredHeaders = ['title', 'companyName', 'status'];
            const hasRequiredHeaders = requiredHeaders.every(header => 
                headers.some(h => h.trim().toLowerCase() === header.toLowerCase())
            );
            
            if (!hasRequiredHeaders) {
                toast({ 
                    title: 'Import Error', 
                    description: `Missing required columns: ${requiredHeaders.join(', ')}`, 
                    variant: 'destructive' 
                });
                return;
            }
            
            toast({ 
                title: 'Import Successful', 
                description: `Imported ${lines.length - 1} jobs from CSV`, 
                variant: 'success' 
            });
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleExportCSV = () => {
        if (!jobs || jobs.length === 0) {
            toast({ 
                title: 'Export Error', 
                description: 'No jobs data to export', 
                variant: 'destructive' 
            });
            return;
        }

        const headers = ['title', 'companyName', 'status', 'matchCount', 'createdAt', 'updatedAt'];
        const csvContent = [
            headers.join(','),
            ...jobs.map(job => [
                job.title,
                job.companyName,
                job.status,
                job.matchCount || 0,
                new Date(job.createdAt).toLocaleDateString(),
                job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ 
            title: 'Export Successful', 
            description: 'Jobs data exported successfully', 
            variant: 'success' 
        });
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('allJobs')}</h1>
                    <p className="text-muted-foreground">{t('manageJobs')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="group relative">
                        <input
                            aria-label="Import CSV file"
                            title="Select a CSV file to import"
                            placeholder="Choose CSV file"
                            type="file"
                            accept=".csv"
                            onChange={handleImportCSV}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-gray-100 transition-colors cursor-pointer">
                            <Upload className="h-4 w-4" />
                            Import CSV
                        </div>
                    </div>
                    
                    <Button variant="outline" onClick={handleExportCSV} className="hover:bg-gray-100">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    
                    <Button onClick={() => navigate('/enterprise/jobs/new')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('postNewJob')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or company..."
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="pl-8 w-full"
                    />
                </div>
                <div className="relative">
                    <ListFilter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Select name="status" value={filters.status} onChange={handleFilterChange} className="pl-8">
                        <option value="">All Statuses</option>
                        {jobStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
                <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                    <XCircle className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardContent className="pt-6">
                   <JobsTable
                        jobs={paginatedJobs}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                        onView={handleViewClick}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onPostToFacebook={handlePostToFacebook}
                        postingId={postingId}
                   />
                </CardContent>
                <Pagination
                    count={filteredJobs.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setPage}
                    onRowsPerPageChange={(value) => {
                        setRowsPerPage(value);
                        setPage(0);
                    }}
                />
            </Card>

            <AlertDialog
                isOpen={!!jobToDelete}
                onClose={() => setJobToDelete(null)}
                onConfirm={confirmDelete}
                title={t('areYouSure')}
                description={`This will permanently delete the job posting: "${jobToDelete?.title}".`}
            />
        </div>
    );
}

export default JobsPage;
