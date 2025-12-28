"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types/database";
import { NewAppointmentDialog } from "./NewAppointmentDialog";

// Mock data generator for testing
const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: '1',
        doctor_id: 'doc1',
        patient_id: 'p1',
        patient_name: 'Sarah Tan',
        start_time: new Date().toISOString(), // Today
        end_time: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        type: 'consultation',
        notes: 'Follow up on migraines'
    },
    {
        id: '2',
        doctor_id: 'doc1',
        patient_id: 'p2',
        patient_name: 'Lim Wei',
        start_time: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // 2 days later
        end_time: new Date(new Date().setDate(new Date().getDate() + 2) + 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        type: 'treatment',
        notes: 'Acupuncture session'
    }
];

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getAppointmentsForDate = (date: Date) => {
        return appointments.filter(apt => isSameDay(new Date(apt.start_time), date));
    };

    const selectedAppointments = getAppointmentsForDate(selectedDate);

    const handleCreateAppointment = (newApt: Omit<Appointment, 'id' | 'doctor_id' | 'status'>) => {
        const appointment: Appointment = {
            ...newApt,
            id: Math.random().toString(36).substr(2, 9),
            doctor_id: 'current-doctor-id', // In real app, get from auth context
            status: 'scheduled'
        };
        setAppointments([...appointments, appointment]);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)]">
            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
                <header className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                    {days.map((day, dayIdx) => {
                        const dayAppointments = getAppointmentsForDate(day);
                        return (
                            <div
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "bg-white p-2 min-h-[80px] cursor-pointer hover:bg-slate-50 transition-colors relative flex flex-col items-start gap-1",
                                    !isSameMonth(day, monthStart) && "text-slate-300 bg-slate-50/50",
                                    isSameDay(day, selectedDate) && "ring-2 ring-inset ring-blue-500 z-10",
                                )}
                            >
                                <span
                                    className={cn(
                                        "text-sm w-7 h-7 flex items-center justify-center rounded-full",
                                        isToday(day) && "bg-blue-600 text-white font-bold",
                                        !isToday(day) && "text-slate-700"
                                    )}
                                >
                                    {format(day, "d")}
                                </span>

                                <div className="flex flex-col gap-1 w-full">
                                    {dayAppointments.map((apt) => (
                                        <div key={apt.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate w-full ${apt.type === 'consultation' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                            }`}>
                                            {format(new Date(apt.start_time), "HH:mm")} {apt.patient_name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Side Panel: Selected Date Details */}
            <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-800">
                        {format(selectedDate, "EEEE, MMM d")}
                    </h3>
                    <Button size="sm" className="h-8 gap-1" onClick={() => setIsNewAppointmentOpen(true)}>
                        <Plus className="w-4 h-4" /> New
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {selectedAppointments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">No appointments scheduled.</p>
                        </div>
                    ) : (
                        selectedAppointments.map(apt => (
                            <div key={apt.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-blue-200 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-slate-900">{apt.patient_name}</span>
                                    <span className="text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 capitalize">
                                        {apt.type}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 mb-2">
                                    {format(new Date(apt.start_time), "h:mm a")} - {format(new Date(apt.end_time), "h:mm a")}
                                </div>
                                {apt.notes && (
                                    <div className="text-xs text-slate-400 italic">
                                        "{apt.notes}"
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <NewAppointmentDialog
                open={isNewAppointmentOpen}
                onOpenChange={setIsNewAppointmentOpen}
                onCreate={handleCreateAppointment}
                selectedDate={selectedDate}
            />
        </div>
    );
}
