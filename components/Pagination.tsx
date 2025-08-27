
import React from 'react';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select } from './ui/Select';

interface PaginationProps {
    count: number;
    page: number; // 0-indexed
    rowsPerPage: number;
    onPageChange: (newPage: number) => void;
    onRowsPerPageChange: (newRowsPerPage: number) => void;
}

export function Pagination({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange }: PaginationProps) {
    const totalPages = Math.ceil(count / rowsPerPage);

    const handlePreviousPage = () => {
        onPageChange(page - 1);
    };

    const handleNextPage = () => {
        onPageChange(page + 1);
    };

    const handleFirstPage = () => {
        onPageChange(0);
    };

    const handleLastPage = () => {
        onPageChange(totalPages - 1);
    };

    return (
        <div className="flex items-center justify-between px-6 py-3 border-t">
            <div className="flex-1 text-sm text-muted-foreground">
                Showing {count > 0 ? Math.min(page * rowsPerPage + 1, count) : 0} - {Math.min((page + 1) * rowsPerPage, count)} of {count} results
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={rowsPerPage}
                        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                        className="w-[70px]"
                    >
                        {[10, 20, 30, 40, 50].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {page + 1} of {totalPages > 0 ? totalPages : 1}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={handleFirstPage}
                        disabled={page === 0}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={handlePreviousPage}
                        disabled={page === 0}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={handleNextPage}
                        disabled={page >= totalPages - 1 || totalPages === 0}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={handleLastPage}
                        disabled={page >= totalPages - 1 || totalPages === 0}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}