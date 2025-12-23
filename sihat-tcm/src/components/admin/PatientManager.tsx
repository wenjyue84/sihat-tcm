"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Pencil, Trash2, User, Search, ChevronLeft, ChevronRight, Eye, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export type Patient = {
    id: string
    role: 'patient' | 'doctor' | 'admin'
    full_name?: string
    age?: number
    gender?: string
    height?: number
    weight?: number
    medical_history?: string
    updated_at?: string
    // Virtual field for inquiry count
    inquiry_count?: number
}

const ITEMS_PER_PAGE = 10

export function PatientManager() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [viewingPatient, setViewingPatient] = useState<Patient | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    // Search and pagination
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    // Form State
    const [formData, setFormData] = useState<Partial<Patient>>({
        full_name: '',
        age: undefined,
        gender: '',
        height: undefined,
        weight: undefined,
        medical_history: '',
        role: 'patient'
    })

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'patient')
                .order('updated_at', { ascending: false })

            if (error) throw error
            setPatients(data || [])
        } catch (error) {
            console.error('Error fetching patients:', error)
            toast.error('Failed to load patients')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (patient?: Patient) => {
        if (patient) {
            setEditingId(patient.id)
            setFormData({
                full_name: patient.full_name || '',
                age: patient.age,
                gender: patient.gender || '',
                height: patient.height,
                weight: patient.weight,
                medical_history: patient.medical_history || '',
                role: patient.role
            })
        } else {
            setEditingId(null)
            setFormData({
                full_name: '',
                age: undefined,
                gender: '',
                height: undefined,
                weight: undefined,
                medical_history: '',
                role: 'patient'
            })
        }
        setIsDialogOpen(true)
    }

    const handleViewPatient = (patient: Patient) => {
        setViewingPatient(patient)
        setIsViewDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.full_name?.trim()) {
            toast.error('Patient name is required')
            return
        }

        try {
            setSaving(true)

            const dataToSave = {
                full_name: formData.full_name?.trim(),
                age: formData.age || null,
                gender: formData.gender || null,
                height: formData.height || null,
                weight: formData.weight || null,
                medical_history: formData.medical_history || null,
                updated_at: new Date().toISOString()
            }

            if (editingId) {
                const { error } = await supabase
                    .from('profiles')
                    .update(dataToSave)
                    .eq('id', editingId)

                if (error) throw error
                toast.success('Patient updated successfully')
            } else {
                // Note: Creating new patients through admin is complex because profiles
                // are tied to auth.users. For now, we only allow editing existing patients.
                toast.error('Creating new patients requires user registration. Please edit existing patients.')
                setSaving(false)
                return
            }

            setIsDialogOpen(false)
            fetchPatients()
        } catch (error) {
            console.error('Error saving:', error)
            toast.error('Failed to save patient')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this patient? This action cannot be undone and will remove all their data including diagnosis history.')) return

        try {
            setDeleting(id)

            // First delete related inquiries
            await supabase
                .from('inquiries')
                .delete()
                .eq('user_id', id)

            // Then delete the profile
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Patient deleted successfully')
            fetchPatients()
        } catch (error) {
            console.error('Error deleting:', error)
            toast.error('Failed to delete patient. They may have associated records that need to be removed first.')
        } finally {
            setDeleting(null)
        }
    }

    // Filter patients based on search query
    const filteredPatients = patients.filter(patient => {
        const query = searchQuery.toLowerCase()
        return (
            patient.full_name?.toLowerCase().includes(query) ||
            patient.gender?.toLowerCase().includes(query) ||
            patient.medical_history?.toLowerCase().includes(query)
        )
    })

    // Paginate filtered results
    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE)
    const paginatedPatients = filteredPatients.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const calculateBMI = (height?: number, weight?: number) => {
        if (!height || !weight) return null
        const heightInMeters = height / 100
        const bmi = weight / (heightInMeters * heightInMeters)
        return bmi.toFixed(1)
    }

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Underweight', color: 'bg-blue-100 text-blue-700' }
        if (bmi < 25) return { label: 'Normal', color: 'bg-green-100 text-green-700' }
        if (bmi < 30) return { label: 'Overweight', color: 'bg-yellow-100 text-yellow-700' }
        return { label: 'Obese', color: 'bg-red-100 text-red-700' }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Patient Management
                    </CardTitle>
                    <CardDescription>View and manage all registered patients</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, gender, or medical history..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patient</TableHead>
                                        <TableHead className="hidden md:table-cell">Age / Gender</TableHead>
                                        <TableHead className="hidden lg:table-cell">BMI</TableHead>
                                        <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPatients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                {searchQuery ? 'No patients match your search.' : 'No patients found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedPatients.map((patient) => {
                                            const bmi = calculateBMI(patient.height, patient.weight)
                                            const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null
                                            return (
                                                <TableRow key={patient.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <div>{patient.full_name || 'Unnamed Patient'}</div>
                                                                <div className="text-xs text-muted-foreground md:hidden">
                                                                    {patient.age && `${patient.age} yrs`}
                                                                    {patient.age && patient.gender && ' • '}
                                                                    {patient.gender}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <div className="text-sm">
                                                            {patient.age ? `${patient.age} years` : '-'}
                                                            <span className="text-muted-foreground mx-1">/</span>
                                                            {patient.gender || '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        {bmi ? (
                                                            <Badge variant="outline" className={bmiCategory?.color}>
                                                                {bmi} ({bmiCategory?.label})
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                        {patient.updated_at
                                                            ? new Date(patient.updated_at).toLocaleDateString()
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewPatient(patient)}
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenDialog(patient)}
                                                                title="Edit Patient"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(patient.id)}
                                                                disabled={deleting === patient.id}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                title="Delete Patient"
                                                            >
                                                                {deleting === patient.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)} of{' '}
                                    {filteredPatients.length} patients
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Summary Stats */}
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">{patients.length}</div>
                                <div className="text-xs text-muted-foreground">Total Patients</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {patients.filter(p => p.gender?.toLowerCase() === 'male').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Male</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600">
                                    {patients.filter(p => p.gender?.toLowerCase() === 'female').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Female</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-600">
                                    {Math.round(patients.reduce((sum, p) => sum + (p.age || 0), 0) / patients.length) || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Avg Age</div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Patient' : 'Add Patient'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="e.g. John Smith"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    value={formData.age || ''}
                                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                                    placeholder="e.g. 35"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={formData.gender || ''}
                                    onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    value={formData.height || ''}
                                    onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || undefined })}
                                    placeholder="e.g. 175"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    value={formData.weight || ''}
                                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
                                    placeholder="e.g. 70"
                                />
                            </div>
                        </div>

                        {/* BMI Preview */}
                        {formData.height && formData.weight && (
                            <div className="p-3 bg-stone-50 rounded-lg">
                                <div className="text-sm text-muted-foreground">Calculated BMI</div>
                                <div className="flex items-center gap-2 mt-1">
                                    {(() => {
                                        const bmi = calculateBMI(formData.height, formData.weight)
                                        const category = bmi ? getBMICategory(parseFloat(bmi)) : null
                                        return bmi ? (
                                            <>
                                                <span className="text-lg font-semibold">{bmi}</span>
                                                <Badge variant="outline" className={category?.color}>
                                                    {category?.label}
                                                </Badge>
                                            </>
                                        ) : null
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="medical_history">Medical History</Label>
                            <Textarea
                                id="medical_history"
                                value={formData.medical_history}
                                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                placeholder="Previous conditions, allergies, chronic diseases, etc."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Patient Details
                        </DialogTitle>
                    </DialogHeader>

                    {viewingPatient && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <User className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{viewingPatient.full_name || 'Unnamed Patient'}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {viewingPatient.age ? `${viewingPatient.age} years` : 'Age unknown'}
                                        {viewingPatient.gender && ` • ${viewingPatient.gender}`}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-lg">
                                    <div className="text-sm text-muted-foreground">Height</div>
                                    <div className="font-semibold">{viewingPatient.height ? `${viewingPatient.height} cm` : '-'}</div>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <div className="text-sm text-muted-foreground">Weight</div>
                                    <div className="font-semibold">{viewingPatient.weight ? `${viewingPatient.weight} kg` : '-'}</div>
                                </div>
                                <div className="p-3 border rounded-lg col-span-2">
                                    <div className="text-sm text-muted-foreground">BMI</div>
                                    {(() => {
                                        const bmi = calculateBMI(viewingPatient.height, viewingPatient.weight)
                                        const category = bmi ? getBMICategory(parseFloat(bmi)) : null
                                        return bmi ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{bmi}</span>
                                                <Badge variant="outline" className={category?.color}>
                                                    {category?.label}
                                                </Badge>
                                            </div>
                                        ) : <div className="font-semibold">-</div>
                                    })()}
                                </div>
                            </div>

                            <div className="p-3 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Medical History</div>
                                <div className="text-sm">
                                    {viewingPatient.medical_history || 'No medical history recorded.'}
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                                Last updated: {viewingPatient.updated_at
                                    ? new Date(viewingPatient.updated_at).toLocaleString()
                                    : 'Unknown'}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                        <Button
                            onClick={() => {
                                setIsViewDialogOpen(false)
                                if (viewingPatient) handleOpenDialog(viewingPatient)
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Patient
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
