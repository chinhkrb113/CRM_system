import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Search, XCircle, Upload, Download } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { getCompanies, deleteCompany } from '../../services/mockApi';
import { Company } from '../../types';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useToast } from '../../hooks/useToast';
import CompaniesTable from './components/CompaniesTable';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/Pagination';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof Company; direction: SortDirection };

function CompaniesPage() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [companies, setCompanies] = useState<Company[] | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
    
    // Filters and pagination state
    const [filters, setFilters] = useState({ search: '' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchCompanies = async () => {
            const data = await getCompanies();
            setCompanies(data);
        };
        fetchCompanies();
    }, []);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ search: e.target.value });
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({ search: '' });
        setPage(0);
    };

    const filteredCompanies = useMemo(() => {
        if (!companies) return [];
        const searchTerm = filters.search.toLowerCase();

        return companies.filter(company =>
            company.name.toLowerCase().includes(searchTerm) ||
            company.industry.toLowerCase().includes(searchTerm) ||
            company.contactEmail.toLowerCase().includes(searchTerm)
        );
    }, [companies, filters]);

    const sortedCompanies = useMemo(() => {
        const sortableItems = [...filteredCompanies];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredCompanies, sortConfig]);

     const paginatedCompanies = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return sortedCompanies.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedCompanies, page, rowsPerPage]);

    const requestSort = (key: keyof Company) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleAddClick = () => {
        navigate('/admin/companies/new');
    };

    const handleViewClick = (company: Company) => {
        navigate(`/admin/companies/${company.id}/view`);
    };

    const handleEditClick = (company: Company) => {
        navigate(`/admin/companies/${company.id}/edit`);
    };

    const handleDeleteClick = (company: Company) => {
        setCompanyToDelete(company);
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const csv = e.target?.result as string;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                // Validate required headers
                const requiredHeaders = ['name', 'industry', 'contactEmail'];
                const hasRequiredHeaders = requiredHeaders.every(header => 
                    headers.some(h => h.trim().toLowerCase() === header.toLowerCase())
                );
                
                if (!hasRequiredHeaders) {
                    alert('CSV file must contain columns: name, industry, contactEmail');
                    return;
                }
                
                console.log('CSV imported successfully:', csv);
                alert('Companies imported successfully!');
            };
            reader.readAsText(file);
        } else {
            alert('Please select a valid CSV file');
        }
        event.target.value = '';
    };

    const handleExportCSV = () => {
        if (!companies || companies.length === 0) {
            alert('No companies to export');
            return;
        }
        
        const headers = ['Name', 'Industry', 'Contact Email', 'Created Date', 'Updated Date'];
        const csvContent = [
            headers.join(','),
            ...companies.map(company => [
                `"${company.name}"`,
                `"${company.industry}"`,
                `"${company.contactEmail}"`,
                new Date(company.createdAt).toLocaleDateString(),
                company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : ''
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const confirmDelete = async () => {
        if (companyToDelete) {
            await deleteCompany(companyToDelete.id);
            setCompanies(prev => prev!.filter(c => c.id !== companyToDelete.id));
            toast({ title: 'Success', description: `Company "${companyToDelete.name}" deleted.`, variant: 'success' });
            setCompanyToDelete(null);
        }
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('companies')}</h1>
                    <p className="text-muted-foreground">{t('manageCompanies')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
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
                    <Button onClick={handleAddClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('addCompany')}
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, industry, or email..."
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

            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <CompaniesTable 
                        companies={paginatedCompanies} 
                        onView={handleViewClick}
                        onEdit={handleEditClick} 
                        onDelete={handleDeleteClick}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                    />
                </CardContent>
                 <Pagination
                    count={filteredCompanies.length}
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
                isOpen={!!companyToDelete}
                onClose={() => setCompanyToDelete(null)}
                onConfirm={confirmDelete}
                title={t('areYouSure')}
                description={t('deleteCompanyWarning', { companyName: companyToDelete?.name || '' })}
            />
        </div>
    );
}

export default CompaniesPage;