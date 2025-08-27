
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Search, XCircle } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { getSchools, deleteSchool } from '../../services/mockApi';
import { School } from '../../types';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useToast } from '../../hooks/useToast';
import SchoolsTable from './components/SchoolsTable';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/Pagination';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof School; direction: SortDirection };

function SchoolsPage() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [schools, setSchools] = useState<School[] | null>(null);
    const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
    
    const [filters, setFilters] = useState({ search: '' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchSchools = async () => {
            const data = await getSchools();
            setSchools(data);
        };
        fetchSchools();
    }, []);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ search: e.target.value });
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({ search: '' });
        setPage(0);
    };

    const filteredSchools = useMemo(() => {
        if (!schools) return [];
        const searchTerm = filters.search.toLowerCase();

        return schools.filter(school =>
            school.name.toLowerCase().includes(searchTerm) ||
            school.address.toLowerCase().includes(searchTerm) ||
            school.contactEmail.toLowerCase().includes(searchTerm)
        );
    }, [schools, filters]);

    const sortedSchools = useMemo(() => {
        const sortableItems = [...filteredSchools];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredSchools, sortConfig]);

     const paginatedSchools = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return sortedSchools.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedSchools, page, rowsPerPage]);

    const requestSort = (key: keyof School) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleAddClick = () => {
        navigate('/admin/schools/new');
    };

    const handleViewClick = (school: School) => {
        navigate(`/admin/schools/${school.id}/view`);
    };

    const handleEditClick = (school: School) => {
        navigate(`/admin/schools/${school.id}/edit`);
    };

    const handleDeleteClick = (school: School) => {
        setSchoolToDelete(school);
    };

    const confirmDelete = async () => {
        if (schoolToDelete) {
            await deleteSchool(schoolToDelete.id);
            setSchools(prev => prev!.filter(c => c.id !== schoolToDelete.id));
            toast({ title: 'Success', description: `School "${schoolToDelete.name}" deleted.`, variant: 'success' });
            setSchoolToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('schools')}</h1>
                    <p className="text-muted-foreground">{t('manageSchools')}</p>
                </div>
                <Button onClick={handleAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addSchool')}
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, address, or email..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="pl-8 w-full"
                    />
                </div>
                <Button variant="ghost" onClick={clearFilters}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <SchoolsTable 
                        schools={paginatedSchools} 
                        onView={handleViewClick}
                        onEdit={handleEditClick} 
                        onDelete={handleDeleteClick}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                    />
                </CardContent>
                 <Pagination
                    count={filteredSchools.length}
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
                isOpen={!!schoolToDelete}
                onClose={() => setSchoolToDelete(null)}
                onConfirm={confirmDelete}
                title={t('areYouSure')}
                description={t('deleteSchoolWarning', { schoolName: schoolToDelete?.name || '' })}
            />
        </div>
    );
}

export default SchoolsPage;
