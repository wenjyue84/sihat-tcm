"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Pencil, Trash2, MapPin, Phone, Users, Clock } from 'lucide-react'
import { toast } from 'sonner'

export type Practitioner = {
    id: string
    name: string
    photo: string
    clinic_name: string
    specialties: string[]
    address: string
    phone: string
    experience: string
    waze_link?: string
    working_hours: string
}

export function PractitionerManager() {
    const [practitioners, setPractitioners] = useState<Practitioner[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Partial<Practitioner>>({
        name: '',
        photo: '',
        clinic_name: '',
        specialties: [],
        address: '',
        phone: '',
        experience: '',
        waze_link: '',
        working_hours: ''
    })

    const [specialtiesInput, setSpecialtiesInput] = useState('')

    useEffect(() => {
        fetchPractitioners()
    }, [])

    const fetchPractitioners = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('tcm_practitioners')
                .select('*')
                .order('name')

            if (error) throw error
            setPractitioners(data || [])
        } catch (error) {
            console.error('Error fetching practitioners:', error)
            toast.error('Failed to load practitioners')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (practitioner?: Practitioner) => {
        if (practitioner) {
            setEditingId(practitioner.id)
            setFormData(practitioner)
            setSpecialtiesInput(practitioner.specialties?.join(', ') || '')
        } else {
            setEditingId(null)
            setFormData({
                name: '',
                photo: '',
                clinic_name: '',
                specialties: [],
                address: '',
                phone: '',
                experience: '',
                waze_link: '',
                working_hours: ''
            })
            setSpecialtiesInput('')
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const specialtiesArray = specialtiesInput
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)

            const dataToSave = {
                ...formData,
                specialties: specialtiesArray
            }

            if (editingId) {
                const { error } = await supabase
                    .from('tcm_practitioners')
                    .update(dataToSave)
                    .eq('id', editingId)

                if (error) throw error
                toast.success('Practitioner updated')
            } else {
                const { error } = await supabase
                    .from('tcm_practitioners')
                    .insert([dataToSave])

                if (error) throw error
                toast.success('Practitioner added')
            }

            setIsDialogOpen(false)
            fetchPractitioners()
        } catch (error) {
            console.error('Error saving:', error)
            toast.error('Failed to save practitioner')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this practitioner?')) return

        try {
            const { error } = await supabase
                .from('tcm_practitioners')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Practitioner deleted')
            fetchPractitioners()
        } catch (error) {
            console.error('Error deleting:', error)
            toast.error('Failed to delete practitioner')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recommended Practitioners</CardTitle>
                    <CardDescription>Manage the list of TCM doctors displayed in reports</CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Practitioner
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Practitioner</TableHead>
                                    <TableHead>Clinic</TableHead>
                                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {practitioners.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No practitioners found. Add one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    practitioners.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    {p.photo && (
                                                        <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover bg-stone-100" />
                                                    )}
                                                    <div>
                                                        <div>{p.name}</div>
                                                        <div className="text-xs text-muted-foreground md:hidden">{p.clinic_name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span>{p.clinic_name}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{p.address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="text-sm">
                                                    <div>{p.phone}</div>
                                                    <div className="text-xs text-muted-foreground">{p.working_hours}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(p)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Practitioner' : 'Add Practitioner'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Doctor Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Dr. Lee Wei Hong"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="photo">Photo URL</Label>
                                <Input
                                    id="photo"
                                    value={formData.photo}
                                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clinic">Clinic Name</Label>
                            <Input
                                id="clinic"
                                value={formData.clinic_name}
                                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                                placeholder="e.g. TCM Wellness Centre"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialties">Specialties (comma separated)</Label>
                            <Input
                                id="specialties"
                                value={specialtiesInput}
                                onChange={(e) => setSpecialtiesInput(e.target.value)}
                                placeholder="e.g. Acupuncture, Herbal Medicine, Pain Management"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Full clinic address"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+60 3-xxxx xxxx"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="experience">Experience</Label>
                                <Input
                                    id="experience"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    placeholder="e.g. 15 years"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hours">Working Hours</Label>
                                <Input
                                    id="hours"
                                    value={formData.working_hours}
                                    onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                    placeholder="e.g. Mon-Sat: 9am - 6pm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="waze">Waze Link (Optional)</Label>
                                <Input
                                    id="waze"
                                    value={formData.waze_link}
                                    onChange={(e) => setFormData({ ...formData, waze_link: e.target.value })}
                                    placeholder="https://waze.com/..."
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
