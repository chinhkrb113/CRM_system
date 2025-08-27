import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Search, ListFilter, XCircle } from 'lucide-react';
import { getUsers, deleteUser } from '../../services/mockApi';
import { User, UserRole } from '../../types';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useToast } from '../../hooks/useToast';
import { useI18n } from '../../hooks/useI18n';
import UsersTable from './components/UsersTable';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/Pagination';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof User; direction: SortDirection };

function SettingsPage() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[] | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { toast } = useToast();
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
    
    // Filters and pagination state
    const [filters, setFilters] = useState({ search: '', role: '' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getUsers();
            setUsers(data);
        };
        fetchUsers();
    }, []);
    
     const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({ search: '', role: '' });
        setPage(0);
    };

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const searchTerm = filters.search.toLowerCase();

        return users.filter(user => {
            const searchMatch = searchTerm
                ? user.name.toLowerCase().includes(searchTerm) ||
                  user.email.toLowerCase().includes(searchTerm)
                : true;
            const roleMatch = filters.role ? user.role === filters.role : true;
            return searchMatch && roleMatch;
        });
    }, [users, filters]);

    const sortedUsers = useMemo(() => {
        const sortableItems = [...filteredUsers];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredUsers, sortConfig]);
    
    const paginatedUsers = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return sortedUsers.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedUsers, page, rowsPerPage]);

    const requestSort = (key: keyof User) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const handleViewClick = (user: User) => {
        navigate(`/ops/users/${user.id}/view`);
    };

    const handleEditClick = (user: User) => {
        navigate(`/ops/users/${user.id}/edit`);
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete.id);
            setUsers(prev => prev!.filter(u => u.id !== userToDelete.id));
            toast({ title: 'Success', description: `User ${userToDelete.name} has been deleted.`, variant: 'success' });
            setUserToDelete(null);
        }
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage system users and their roles.</p>
                </div>
                 <Button onClick={() => navigate('/ops/users/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                    <Select name="role" value={filters.role} onChange={handleFilterChange} className="pl-8">
                        <option value="">All Roles</option>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                </div>
                <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                    <XCircle className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>View and manage all users in the Synergy CRM system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable
                        users={paginatedUsers}
                        onView={handleViewClick}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                    />
                </CardContent>
                 <Pagination
                    count={filteredUsers.length}
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
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                title={t('areYouSure')}
                description={t('deleteUserWarning', { userName: userToDelete?.name || '' })}
            />
        </div>
    );
}

export default SettingsPage;