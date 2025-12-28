"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, AppointmentType } from "@/types/database";
import { addMinutes, format } from "date-fns";

interface NewAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (appointment: Omit<Appointment, 'id' | 'doctor_id' | 'status'>) => void;
    selectedDate: Date;
}

export function NewAppointmentDialog({ open, onOpenChange, onCreate, selectedDate }: NewAppointmentDialogProps) {
    const [patientName, setPatientName] = useState("");
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState("60");
    const [type, setType] = useState<AppointmentType>("consultation");
    const [notes, setNotes] = useState("");

    // Update start time when selectedDate changes or dialog opens
    useEffect(() => {
        if (open && selectedDate) {
            // Set time to current time if selected date is today, or 9am if future
            const date = new Date(selectedDate);
            const now = new Date();

            if (date.toDateString() === now.toDateString()) {
                // If today, use current time but rounded to next 30 mins
                // Actually, just keep it simple, use selectedDate at 9 AM default unless it's today right now
                setStartTime(format(now, "yyyy-MM-dd'T'HH:mm"));
            } else {
                // Default to 09:00 AM on selected date
                date.setHours(9, 0, 0, 0);
                setStartTime(format(date, "yyyy-MM-dd'T'HH:mm"));
            }
        }
    }, [open, selectedDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const start = new Date(startTime);
        const end = addMinutes(start, parseInt(duration));

        onCreate({
            patient_id: `temp-${Date.now()}`, // Temporary ID
            patient_name: patientName,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            type,
            notes
        });

        // Reset and close
        setPatientName("");
        setNotes("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Appointment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="patient">Patient Name</Label>
                        <Input
                            id="patient"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="Enter patient name"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Start Time</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 mins</SelectItem>
                                    <SelectItem value="45">45 mins</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="90">1.5 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={type} onValueChange={(v: AppointmentType) => setType(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="consultation">Consultation</SelectItem>
                                <SelectItem value="treatment">Treatment</SelectItem>
                                <SelectItem value="follow_up">Follow Up</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes..."
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Create Appointment</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
