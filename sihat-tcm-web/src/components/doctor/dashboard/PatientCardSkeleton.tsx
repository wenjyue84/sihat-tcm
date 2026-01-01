"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PatientCardSkeleton() {
    return (
        <Card className="bg-white/90 backdrop-blur">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-4">
                    <div>
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                </div>
            </CardContent>
        </Card>
    );
}

interface PatientCardSkeletonListProps {
    count?: number;
}

export function PatientCardSkeletonList({ count = 3 }: PatientCardSkeletonListProps) {
    return (
        <div className="grid gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <PatientCardSkeleton key={i} />
            ))}
        </div>
    );
}
