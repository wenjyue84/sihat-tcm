'use client';

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationControlProps {
    currentPage: number;
    totalPages: number;
}

export function PaginationControl({ currentPage, totalPages }: PaginationControlProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Helper to build URL with maintained search params
    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    return (
        <Pagination className="mt-12 justify-center">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href={currentPage > 1 ? createPageURL(currentPage - 1) : '#'}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                </PaginationItem>

                {/* Logic to show pages. For simplicity: show all if <= 5, otherwise simplified logic */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Simple logic: show first, last, current, and adjacent to current
                    if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                        return (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={currentPage === page}
                                    href={createPageURL(page)}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        );
                    }

                    // Show ellipsis
                    if (
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                        return <PaginationItem key={`ellipsis-${page}`}><PaginationEllipsis /></PaginationItem>;
                    }

                    return null;
                })}

                <PaginationItem>
                    <PaginationNext
                        href={currentPage < totalPages ? createPageURL(currentPage + 1) : '#'}
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
