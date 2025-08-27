
import React from 'react';
import { Company } from '../../../types';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { FilePenLine, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui/DropdownMenu';
import { useI18n } from '../../../hooks/useI18n';

type SortConfig = { key: keyof Company; direction: 'ascending' | 'descending' };

interface CompaniesTableProps {
    companies: Company[] | null;
    onView: (company: Company) => void;
    onEdit: (company: Company) => void;
    onDelete: (company: Company) => void;
    sortConfig: SortConfig;
    requestSort: (key: keyof Company) => void;
}

function CompaniesTable({ companies, onView, onEdit, onDelete, sortConfig, requestSort }: CompaniesTableProps) {
    const { t } = useI18n();
    
    const getSortDirection = (key: keyof Company) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('name')} isSorted={getSortDirection('name')}>{t('companyName')}</TableHead>
                    <TableHead onClick={() => requestSort('industry')} isSorted={getSortDirection('industry')}>{t('industry')}</TableHead>
                    <TableHead onClick={() => requestSort('contactEmail')} isSorted={getSortDirection('contactEmail')}>{t('contactEmail')}</TableHead>
                    <TableHead onClick={() => requestSort('createdAt')} isSorted={getSortDirection('createdAt')}>{t('created')}</TableHead>
                    <TableHead onClick={() => requestSort('updatedAt')} isSorted={getSortDirection('updatedAt')}>{t('updated')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {companies ? (
                    companies.map(company => (
                        <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{company.industry}</TableCell>
                            <TableCell>{company.contactEmail}</TableCell>
                            <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onView(company)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t('view')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(company)}>
                                            <FilePenLine className="mr-2 h-4 w-4" />
                                            {t('edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(company)} className="text-destructive">
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
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

export default CompaniesTable;
