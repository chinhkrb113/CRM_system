
import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { StudentsTable } from './components/StudentsTable';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { Download, PlusCircle, Search, ListFilter, BookOpen, XCircle, Upload } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { getStudents, deleteStudent, analyzeStudentScore } from '../../services/mockApi';
import { Student, StudentStatus, UserRole } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof Student; direction: SortDirection };

function StudentListPage(): React.ReactNode {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[] | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const { toast } = useToast();

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast({ title: 'Error', description: 'Please select a valid CSV file.', variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvContent = e.target?.result as string;
                const lines = csvContent.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    toast({ title: 'Error', description: 'CSV file must contain at least a header and one data row.', variant: 'destructive' });
                    return;
                }

                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
                const requiredHeaders = ['name', 'email'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                
                if (missingHeaders.length > 0) {
                    toast({ title: 'Error', description: `Missing required columns: ${missingHeaders.join(', ')}`, variant: 'destructive' });
                    return;
                }

                const importedStudents: Partial<Student>[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                    if (values.length >= headers.length) {
                        const student: Partial<Student> = {};
                        headers.forEach((header, index) => {
                            const value = values[index];
                            switch (header) {
                                case 'name':
                                    student.name = value;
                                    break;
                                case 'email':
                                    student.email = value;
                                    break;
                                case 'course':
                                    student.course = value || 'Full-Stack Development';
                                    break;
                                case 'status':
                                    student.status = (Object.values(StudentStatus).includes(value as StudentStatus) ? value : StudentStatus.ACTIVE) as StudentStatus;
                                    break;
                                case 'score':
                                    student.score = value ? parseInt(value) : undefined;
                                    break;
                                case 'skills':
                                    student.skills = value ? value.split(',').map(s => s.trim()) : [];
                                    break;
                            }
                        });
                        if (student.name && student.email) {
                            importedStudents.push(student);
                        }
                    }
                }

                if (importedStudents.length === 0) {
                    toast({ title: 'Error', description: 'No valid student data found in CSV file.', variant: 'destructive' });
                    return;
                }

                // Add imported students to the current list
                const newStudents = importedStudents.map(student => ({
                    id: Math.random().toString(36).substr(2, 9),
                    name: student.name!,
                    email: student.email!,
                    course: student.course || 'Full-Stack Development',
                    status: student.status || StudentStatus.ACTIVE,
                    score: student.score,
                    skills: student.skills || [],
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    aiAssessed: false,
                    progress: 0
                }));

                setStudents(prev => prev ? [...prev, ...newStudents] : newStudents);
                toast({ title: 'Success', description: `Successfully imported ${newStudents.length} students.` });
            } catch (error) {
                toast({ title: 'Error', description: 'Failed to parse CSV file. Please check the format.', variant: 'destructive' });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleExportCSV = () => {
        if (!students || students.length === 0) {
            toast({ title: 'Error', description: 'No students data to export.', variant: 'destructive' });
            return;
        }

        const headers = ['Name', 'Email', 'Course', 'Status', 'Score', 'Skills', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...students.map(student => [
                `"${student.name}"`,
                `"${student.email}"`,
                `"${student.course}"`,
                `"${student.status}"`,
                `"${student.score || ''}"`,
                `"${student.skills || ''}"`,
                `"${new Date(student.createdAt).toLocaleDateString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: 'Success', description: 'Students data exported successfully!' });
    };

    // New states for filtering and pagination
    const [filters, setFilters] = useState({ search: '', status: '', course: '' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchStudents = async () => {
            const schoolName = user?.role === UserRole.SCHOOL ? user.schoolName : undefined;
            const data = await getStudents(schoolName);
            setStudents(data);
        };
        fetchStudents();
    }, [user]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(0); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({ search: '', status: '', course: '' });
        setPage(0);
    };

    const courses = useMemo(() => {
        if (!students) return [];
        return [...new Set(students.map(s => s.course))].sort();
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        const searchTerm = filters.search.toLowerCase();

        return students.filter(student => {
            const searchMatch = searchTerm
                ? student.name.toLowerCase().includes(searchTerm) ||
                  student.email.toLowerCase().includes(searchTerm)
                : true;

            const statusMatch = filters.status ? student.status === filters.status : true;
            const courseMatch = filters.course ? student.course === filters.course : true;
            
            return searchMatch && statusMatch && courseMatch;
        });
    }, [students, filters]);

    const sortedStudents = useMemo(() => {
        if (!filteredStudents) return null;
        const sortableItems = [...filteredStudents];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [filteredStudents, sortConfig]);
    
    const paginatedStudents = useMemo(() => {
        if (!sortedStudents) return null;
        const startIndex = page * rowsPerPage;
        return sortedStudents.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedStudents, page, rowsPerPage]);

    const requestSort = (key: keyof Student) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleAddClick = () => {
        navigate('/learning/students/new');
    };

    const handleEditClick = (student: Student) => {
        navigate(`/learning/students/${student.id}/edit`);
    };

    const handleDeleteClick = (studentId: string) => {
        setStudentToDelete(studentId);
    };

    const confirmDelete = async () => {
        if (studentToDelete) {
            const success = await deleteStudent(studentToDelete);
            if (success) {
                setStudents(prevStudents => prevStudents!.filter(student => student.id !== studentToDelete));
            }
            setStudentToDelete(null);
        }
    };

    const handleAnalyzeScore = async (studentId: string) => {
        setAnalyzingId(studentId);
        try {
            const updatedStudent = await analyzeStudentScore(studentId);
            setStudents(prev => prev!.map(s => s.id === studentId ? updatedStudent : s));
            toast({ title: t('studentScoreAnalyzedSuccess'), variant: 'success' });
        } catch (error: any) {
            toast({ title: t('studentScoreAnalyzedError'), description: t(error.message) || 'An unknown error occurred.', variant: 'destructive' });
        } finally {
            setAnalyzingId(null);
        }
    };
    
    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('allStudents')}</h1>
                    <p className="text-muted-foreground">Browse, manage, and track all enrolled learners.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleImportCSV}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Import CSV"
                        />
                        <div className="border border-input bg-background group-hover:bg-accent group-hover:text-accent-foreground h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                            <Upload className="mr-2 h-4 w-4" />
                            Import CSV
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('exportCsv')}
                    </Button>
                    {(user?.role === UserRole.ADMIN || user?.role === UserRole.MENTOR || user?.role === UserRole.SCHOOL) && (
                        <Button onClick={handleAddClick}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('addStudent')}
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
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
                        {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
                 <div className="relative">
                    <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Select name="course" value={filters.course} onChange={handleFilterChange} className="pl-8">
                        <option value="">All Courses</option>
                        {courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
                <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                    <XCircle className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <StudentsTable 
                        students={paginatedStudents} 
                        onEdit={handleEditClick} 
                        onDelete={handleDeleteClick} 
                        requestSort={requestSort} 
                        sortConfig={sortConfig}
                        onAnalyze={handleAnalyzeScore}
                        analyzingId={analyzingId}
                    />
                </CardContent>
                 <Pagination
                    count={filteredStudents.length}
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
                isOpen={!!studentToDelete}
                onClose={() => setStudentToDelete(null)}
                onConfirm={confirmDelete}
                title={t('areYouSure')}
                description={t('deleteStudentWarning')}
            />
        </div>
    );
}

export default StudentListPage;
