import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Search, XCircle, Upload, Download } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { getAgents, deleteUser } from '../../services/mockApi';
import { User } from '../../types';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useToast } from '../../hooks/useToast';
import AgentsTable from './components/AgentsTable';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/Pagination';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof User; direction: SortDirection };

function AgentsPage() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [agents, setAgents] = useState<User[] | null>(null);
    const [agentToDelete, setAgentToDelete] = useState<User | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
    
    // Filters and pagination state
    const [filters, setFilters] = useState({ search: '' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    

    useEffect(() => {
        const fetchAgents = async () => {
            const data = await getAgents();
            setAgents(data);
        };
        fetchAgents();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ search: e.target.value });
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({ search: '' });
        setPage(0);
    };

    const filteredAgents = useMemo(() => {
        if (!agents) return [];
        const searchTerm = filters.search.toLowerCase();

        return agents.filter(agent =>
            agent.name.toLowerCase().includes(searchTerm) ||
            agent.email.toLowerCase().includes(searchTerm)
        );
    }, [agents, filters]);

    const sortedAgents = useMemo(() => {
        const sortableItems = [...filteredAgents];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredAgents, sortConfig]);

    const paginatedAgents = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return sortedAgents.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedAgents, page, rowsPerPage]);

    const requestSort = (key: keyof User) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleAddClick = () => {
        navigate('/admin/agents/new');
    };
    
    const handleViewClick = (agent: User) => {
        navigate(`/admin/agents/${agent.id}/view`);
    };

    const handleEditClick = (agent: User) => {
        navigate(`/admin/agents/${agent.id}/edit`);
    };

    const handleDeleteClick = (agent: User) => {
        setAgentToDelete(agent);
    };

    const confirmDelete = async () => {
        if (agentToDelete) {
            await deleteUser(agentToDelete.id);
            setAgents(prev => prev!.filter(a => a.id !== agentToDelete.id));
            toast({ title: 'Success', description: `Agent "${agentToDelete.name}" deleted.`, variant: 'success' });
            setAgentToDelete(null);
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
            
            // Validate required headers
            const requiredHeaders = ['name', 'email'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            
            if (missingHeaders.length > 0) {
                toast({ 
                    title: 'Import Error', 
                    description: `Missing required columns: ${missingHeaders.join(', ')}`, 
                    variant: 'destructive' 
                });
                return;
            }
            
            toast({ 
                title: 'Import Successful', 
                description: `Imported ${lines.length - 1} agents from CSV`, 
                variant: 'success' 
            });
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleExportCSV = () => {
        if (!agents || agents.length === 0) {
            toast({ 
                title: 'Export Error', 
                description: 'No agents data to export', 
                variant: 'destructive' 
            });
            return;
        }

        const headers = ['name', 'email', 'phone', 'createdAt', 'updatedAt'];
        const csvContent = [
            headers.join(','),
            ...agents.map(agent => [
                agent.name,
                agent.email,
                agent.phone || '',
                new Date(agent.createdAt).toLocaleDateString(),
                agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `agents_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ 
            title: 'Export Successful', 
            description: 'Agents data exported successfully', 
            variant: 'success' 
        });
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('agents')}</h1>
                    <p className="text-muted-foreground">{t('manageAgents')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="group relative">
                        <input
                            title="Import CSV file"
                            placeholder="Choose a CSV file to import"
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
                        {t('addAgent')}
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
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
                    <AgentsTable 
                        agents={paginatedAgents} 
                        onView={handleViewClick}
                        onEdit={handleEditClick} 
                        onDelete={handleDeleteClick}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                    />
                </CardContent>
                 <Pagination
                    count={filteredAgents.length}
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
                isOpen={!!agentToDelete}
                onClose={() => setAgentToDelete(null)}
                onConfirm={confirmDelete}
                title={t('areYouSure')}
                description={t('deleteUserWarning', { userName: agentToDelete?.name || '' })}
            />
        </div>
    );
}

export default AgentsPage;