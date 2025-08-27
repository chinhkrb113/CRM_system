import React from 'react';
import { User, UserRole } from '../../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Badge } from '../../../components/ui/Badge';
import { FilePenLine, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useI18n } from '../../../hooks/useI18n';

const roleColorMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-red-500',
    [UserRole.AGENT]: 'bg-blue-500',
    [UserRole.MENTOR]: 'bg-purple-500',
    [UserRole.STUDENT]: 'bg-green-500',
    [UserRole.COMPANY_USER]: 'bg-orange-500',
    [UserRole.EMPLOYEE]: 'bg-teal-500',
    [UserRole.SCHOOL]: 'bg-indigo-500',
};

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof User; direction: SortDirection };

interface UsersTableProps {
    users: User[] | null;
    onView: (user: User) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    sortConfig: SortConfig;
    requestSort: (key: keyof User) => void;
}

function UsersTable({ users, onView, onEdit, onDelete, sortConfig, requestSort }: UsersTableProps) {
    const { t } = useI18n();
    const { user: currentUser } = useAuth();
    
    const getSortDirection = (key: keyof User) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('name')} isSorted={getSortDirection('name')}>Name</TableHead>
                    <TableHead onClick={() => requestSort('email')} isSorted={getSortDirection('email')}>Email</TableHead>
                    <TableHead onClick={() => requestSort('role')} isSorted={getSortDirection('role')}>Role</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users ? users.map(user => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <span className="font-medium">{user.name}</span>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                                <Badge className={`${roleColorMap[user.role]} text-white`}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                            {user.name === 'Admin User' ? null : (
                                <div className="flex items-center gap-0">
                                    <Button variant="ghost" size="icon" title={t('view')} onClick={() => onView(user)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t('edit')} onClick={() => onEdit(user)} disabled={user.id === currentUser?.id}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={t('delete')} onClick={() => onDelete(user)} disabled={user.id === currentUser?.id}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </TableCell>
                    </TableRow>
                )) : Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default UsersTable;
