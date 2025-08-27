



import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, StudentStatus } from '../../../types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useI18n } from '../../../hooks/useI18n';
import { cn } from '../../../lib/utils';

const statusColorMap: Record<StudentStatus, string> = {
    [StudentStatus.ACTIVE]: 'bg-green-500',
    [StudentStatus.PAUSED]: 'bg-yellow-500',
    [StudentStatus.GRADUATED]: 'bg-blue-500',
};

type SortConfig = { key: keyof Student; direction: 'ascending' | 'descending' };

interface StudentsDirectoryTableProps {
    students: Student[] | null;
    requestSort: (key: keyof Student) => void;
    sortConfig: SortConfig;
}

function StudentsDirectoryTable({ students, requestSort, sortConfig }: StudentsDirectoryTableProps): React.ReactNode {
    const { t } = useI18n();
    const navigate = useNavigate();

    const handleViewProfile = (studentId: string) => {
        navigate(`/learning/students/${studentId}`);
    };

    const getSortDirection = (key: keyof Student) => {
        if (sortConfig.key !== key) return false;
        return sortConfig.direction;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('name')} isSorted={getSortDirection('name')}>{t('name')}</TableHead>
                    <TableHead onClick={() => requestSort('email')} isSorted={getSortDirection('email')}>{t('email')}</TableHead>
                    <TableHead onClick={() => requestSort('course')} isSorted={getSortDirection('course')}>{t('course')}</TableHead>
                    <TableHead>{t('skills')}</TableHead>
                    <TableHead onClick={() => requestSort('status')} isSorted={getSortDirection('status')}>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students ? (
                    students.map(student => (
                        <TableRow key={student.id}>
                            <TableCell>
                                <div className="font-medium">{student.name}</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                            </TableCell>
                            <TableCell>{student.course}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                    {student.skills.slice(0, 3).map(skill => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                    {student.skills.length > 3 && <Badge variant="outline">+{student.skills.length - 3}</Badge>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className={cn("h-2 w-2 rounded-full", statusColorMap[student.status])}></span>
                                    <span>{student.status}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleViewProfile(student.id)}>
                                    {t('viewProfile')}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                           <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                           <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

export default StudentsDirectoryTable;