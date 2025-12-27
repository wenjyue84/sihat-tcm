'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Pill,
    Save,
    X,
    AlertCircle,
    Loader2,
    CheckCircle2,
    History,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    getPatientMedicines,
    savePatientMedicine,
    deletePatientMedicine
} from '@/lib/actions';
import { PatientMedicine, SavePatientMedicineInput } from '@/types/database';
import { useLanguage } from '@/stores/useAppStore';
import { toast } from 'sonner';

export function PortfolioMedicines() {
    const { t } = useLanguage();
    const [medicines, setMedicines] = useState<PatientMedicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');

    const [newMedicine, setNewMedicine] = useState<SavePatientMedicineInput>({
        name: '',
        chinese_name: '',
        dosage: '',
        frequency: '',
        purpose: '',
        specialty: '',
        start_date: '',
        stop_date: '',
        notes: '',
        edited_by: 'wenjyue lew', // Default to current user
        is_active: true
    });

    useEffect(() => {
        fetchMedicines();
    }, []);

    async function fetchMedicines() {
        setLoading(true);
        const result = await getPatientMedicines();
        if (result.success && result.data) {
            setMedicines(result.data);
        }
        setLoading(false);
    }

    async function handleSave() {
        if (!newMedicine.name) {
            toast.error(t.common.required);
            return;
        }

        setSaving(true);
        const result = await savePatientMedicine(newMedicine);
        if (result.success) {
            toast.success(t.common.success);
            setIsAdding(false);
            setNewMedicine({
                name: '',
                chinese_name: '',
                dosage: '',
                frequency: '',
                purpose: '',
                specialty: '',
                start_date: '',
                stop_date: '',
                notes: '',
                edited_by: 'wenjyue lew',
                is_active: true
            });
            fetchMedicines();
        } else {
            toast.error(result.error || t.common.error);
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (confirm(t.patientDashboard_v1.healthPortfolio.medicines.deleteConfirm)) {
            const result = await deletePatientMedicine(id);
            if (result.success) {
                toast.success(t.common.success);
                fetchMedicines();
            } else {
                toast.error(result.error || t.common.error);
            }
        }
    }

    return (
        <Card className="border-none shadow-md bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-t-xl pb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Pill className="h-6 w-6" />
                            {t.patientDashboard_v1.healthPortfolio.medicines.title}
                        </CardTitle>
                        <CardDescription className="text-teal-50 opacity-90">
                            {t.patientDashboard_v1.healthPortfolio.medicines.subtitle}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex bg-teal-700/30 rounded-lg p-1 mr-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 rounded-md ${viewMode === 'simple' ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-100 hover:text-white hover:bg-teal-600/50'}`}
                                onClick={() => setViewMode('simple')}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 rounded-md ${viewMode === 'detailed' ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-100 hover:text-white hover:bg-teal-600/50'}`}
                                onClick={() => setViewMode('detailed')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/20 hover:bg-white/30 border-none text-white gap-2"
                            onClick={() => setIsAdding(!isAdding)}
                        >
                            {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {isAdding ? t.common.cancel : t.patientDashboard_v1.healthPortfolio.medicines.addMedicine}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 p-4 border border-teal-100 rounded-lg bg-teal-50/30 space-y-4 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="med-name">{t.patientDashboard_v1.healthPortfolio.medicines.name}</Label>
                                    <Input
                                        id="med-name"
                                        value={newMedicine.name}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                                        placeholder="e.g. Paracetamol"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-chinese">{t.common.name} (中文名)</Label>
                                    <Input
                                        id="med-chinese"
                                        value={newMedicine.chinese_name}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, chinese_name: e.target.value })}
                                        placeholder="e.g. 神经痛药"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-dosage">{t.patientDashboard_v1.healthPortfolio.medicines.dosage}</Label>
                                    <Input
                                        id="med-dosage"
                                        value={newMedicine.dosage}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                                        placeholder="e.g. 500mg"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-freq">{t.patientDashboard_v1.healthPortfolio.medicines.frequency}</Label>
                                    <Input
                                        id="med-freq"
                                        value={newMedicine.frequency}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                                        placeholder="e.g. Twice daily"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-purpose">Purpose (用途)</Label>
                                    <Input
                                        id="med-purpose"
                                        value={newMedicine.purpose}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, purpose: e.target.value })}
                                        placeholder="e.g. Nerve pain"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-specialty">Specialty (专科)</Label>
                                    <Input
                                        id="med-specialty"
                                        value={newMedicine.specialty}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, specialty: e.target.value })}
                                        placeholder="e.g. Cardiology"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-start">Date Started</Label>
                                    <Input
                                        id="med-start"
                                        type="text"
                                        value={newMedicine.start_date}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, start_date: e.target.value })}
                                        placeholder="e.g. 2024-01-01"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="med-stop">Date Stopped</Label>
                                    <Input
                                        id="med-stop"
                                        type="text"
                                        value={newMedicine.stop_date}
                                        onChange={(e) => setNewMedicine({ ...newMedicine, stop_date: e.target.value })}
                                        placeholder="e.g. 2024-12-01"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Checkbox
                                        id="med-active"
                                        checked={newMedicine.is_active}
                                        onCheckedChange={(checked) => setNewMedicine({ ...newMedicine, is_active: !!checked })}
                                    />
                                    <Label htmlFor="med-active" className="cursor-pointer">
                                        {t.patientDashboard_v1.healthPortfolio.medicines.active}
                                    </Label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="med-notes">{t.patientDashboard_v1.healthPortfolio.medicines.notes}</Label>
                                <Textarea
                                    id="med-notes"
                                    value={newMedicine.notes}
                                    onChange={(e) => setNewMedicine({ ...newMedicine, notes: e.target.value })}
                                    placeholder="Additional information..."
                                    className="bg-white min-h-[80px]"
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !newMedicine.name}
                                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {t.patientDashboard_v1.healthPortfolio.medicines.saveMedicine}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>{t.common.loading}</p>
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                        <Pill className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 max-w-xs mx-auto">
                            {t.patientDashboard_v1.healthPortfolio.medicines.noMedicines}
                        </p>
                        <Button
                            variant="outline"
                            className="mt-6 border-teal-200 text-teal-700 hover:bg-teal-50"
                            onClick={() => setIsAdding(true)}
                        >
                            {t.patientDashboard_v1.healthPortfolio.medicines.addMedicine}
                        </Button>
                    </div>
                ) : viewMode === 'simple' ? (
                    <div className="rounded-md border border-slate-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[30%]">{t.patientDashboard_v1.healthPortfolio.medicines.name}</TableHead>
                                    <TableHead>{t.patientDashboard_v1.healthPortfolio.medicines.dosage}</TableHead>
                                    <TableHead>{t.patientDashboard_v1.healthPortfolio.medicines.frequency}</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {medicines.map((med) => (
                                    <TableRow key={med.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700">{med.name}</span>
                                                {med.chinese_name && (
                                                    <span className="text-xs text-slate-400">{med.chinese_name}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">{med.dosage || '-'}</TableCell>
                                        <TableCell className="text-slate-600">{med.frequency || '-'}</TableCell>
                                        <TableCell>
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${med.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${med.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {med.is_active ? 'Active' : 'Stopped'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => handleDelete(med.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                        {medicines.map((med) => (
                            <motion.div
                                key={med.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl border group relative transition-all ${med.is_active
                                    ? 'border-teal-100 bg-teal-50/20'
                                    : 'border-slate-100 bg-slate-50 opacity-70'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${med.is_active ? 'bg-teal-100 text-teal-600' : 'bg-slate-200 text-slate-500'}`}>
                                            <Pill className="h-4 w-4" />
                                        </div>
                                        <h4 className="font-semibold text-slate-800">
                                            {med.name}
                                            {med.chinese_name && <span className="ml-2 text-slate-500 text-sm font-normal">({med.chinese_name})</span>}
                                        </h4>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(med.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-1 ml-10">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                        {med.dosage && (
                                            <span className="text-slate-600 flex items-center gap-1">
                                                <span className="font-medium text-xs uppercase text-slate-400">{t.patientDashboard_v1.healthPortfolio.medicines.dosage}:</span> {med.dosage}
                                            </span>
                                        )}
                                        {med.frequency && (
                                            <span className="text-slate-600 flex items-center gap-1">
                                                <span className="font-medium text-xs uppercase text-slate-400">{t.patientDashboard_v1.healthPortfolio.medicines.frequency}:</span> {med.frequency}
                                            </span>
                                        )}
                                        {med.specialty && (
                                            <span className="text-slate-600 flex items-center gap-1">
                                                <span className="font-medium text-xs uppercase text-slate-400">Specialty:</span> {med.specialty}
                                            </span>
                                        )}
                                    </div>

                                    {med.purpose && (
                                        <p className="text-sm text-slate-700 bg-slate-100/50 px-2 py-1 rounded inline-block mt-2 font-medium">
                                            {med.purpose}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2">
                                        {med.start_date && (
                                            <span>Started: {med.start_date}</span>
                                        )}
                                        {med.stop_date && (
                                            <span>Stopped: {med.stop_date}</span>
                                        )}
                                        {med.edited_by && (
                                            <span>Edited by: {med.edited_by}</span>
                                        )}
                                    </div>

                                    {med.notes && (
                                        <p className="text-xs text-slate-500 italic mt-2">{med.notes}</p>
                                    )}
                                    <div className="flex items-center gap-1 mt-3">
                                        {med.is_active ? (
                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                            <History className="h-3 w-3 text-slate-400" />
                                        )}
                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${med.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {med.is_active ? t.patientDashboard_v1.healthPortfolio.medicines.active : 'Stopped'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
