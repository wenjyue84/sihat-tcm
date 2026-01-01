"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, Clock } from "lucide-react";
import type { DashboardStats } from "../hooks/useDoctorDashboard";

interface DashboardStatsCardsProps {
    stats: DashboardStats;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur border-blue-100">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.uniquePatients}</p>
                        <p className="text-sm text-gray-500">Unique Patients</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-green-100">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        <p className="text-sm text-gray-500">Total Inquiries</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur border-purple-100">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.recent}</p>
                        <p className="text-sm text-gray-500">Last 7 Days</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
