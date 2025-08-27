
import React from 'react';
import { School } from '../../../types';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { FilePenLine, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/DropdownMenu';
import { useI18n } from '../../../hooks/useI18n';

type SortConfig = { key: keyof School; direction: 'ascending' | 'descending' };

interface SchoolsTableProps {
    schools: School[] | null;
    onView: (school: School) => void;
    onEdit: (school: School) => void;
    onDelete: (school: School) => void;
    sortConfig: SortConfig;
    requestSort: (key: keyof School) => void;
}

function SchoolsTable({ schools, onView, onEdit, onDelete, sortConfig, requestSort }: SchoolsTableProps) {
    const { t } = useI18n();
    
    const getSortDirection = (key: keyof School) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('name')} isSorted={getSortDirection('name')}>{t('schoolName')}</TableHead>
                    <TableHead onClick={() => requestSort('studentCount')} isSorted={getSortDirection('studentCount')}>{t('students')}</TableHead>
                    <TableHead onClick={() => requestSort('address')} isSorted={getSortDirection('address')}>{t('address')}</TableHead>
                    <TableHead onClick={() => requestSort('phone')} isSorted={getSortDirection('phone')}>{t('phone')}</TableHead>
                    <TableHead onClick={() => requestSort('contactEmail')} isSorted={getSortDirection('contactEmail')}>{t('contactEmail')}</TableHead>
                    <TableHead onClick={() => requestSort('createdAt')} isSorted={getSortDirection('createdAt')}>{t('created')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {schools ? (
                    schools.map(school => (
                        <TableRow key={school.id}>
                            <TableCell className="font-medium">{school.name}</TableCell>
                            <TableCell>{school.studentCount}</TableCell>
                            <TableCell>{school.address}</TableCell>
                            <TableCell>{school.phone || '-'}</TableCell>
                            <TableCell>{school.contactEmail}</TableCell>
                            <TableCell>{new Date(school.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onView(school)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t('view')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(school)}>
                                            <FilePenLine className="mr-2 h-4 w-4" />
                                            {t('edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(school)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

export default SchoolsTable;
