"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Pencil, Trash2, MapPin, Phone, Users, Clock, Database, BadgeInfo } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

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
    notes?: string
}

const DEFAULT_PRACTITIONERS = [
    {
        name: "De Siang TCM & Acupuncture / 德祥中医诊所",
        clinic_name: "De Siang TCM & Acupuncture",
        specialties: ["General TCM", "Acupuncture"],
        address: "1, Jalan Dedap 17, Taman Johor Jaya, 81100 Johor Bahru, Johor",
        phone: "07-355 5172",
        working_hours: "9:00 am – evening (Closed Wed am)",
        experience: "Established clinic",
        notes: "Popular neighbourhood TCM in Johor Jaya, offers acupuncture and herbal consultation."
    },
    {
        name: "Ban Hock Tong TCM Clinic / 万福堂中医诊所",
        clinic_name: "Ban Hock Tong TCM Clinic",
        specialties: ["Internal Medicine", "Acupuncture", "Spinal Adjustment", "Cupping", "Women's Health"],
        address: "54, Jalan Perwira 1, Taman Ungku Tun Aminah, 81300 Skudai, Johor",
        phone: "010‑884 9118 / 010‑887 9118",
        working_hours: "Daily 11:00 am – 7:00 pm (by appt)",
        experience: "Since 1989",
        notes: "Established since 1989, very well-known JB brand with multiple TCM services and online presence."
    },
    {
        name: "Guo An TCM Rehab & Wellness Centre / 国安中医康复养生中心",
        clinic_name: "Guo An TCM Rehab & Wellness Centre",
        specialties: ["TCM Rehab", "Wellness", "Physiotherapy", "Chronic Disease"],
        address: "Johor Bahru, Johor",
        phone: "Check website",
        working_hours: "Daily normal clinic hours",
        experience: "Legacy since ~1950",
        notes: "Evolved from Yew Kok Ann TCM (since ~1950), focuses on rehabilitation and long-term wellness."
    },
    {
        name: "Southern Traditional Chinese Medical Centre / 南方中医中心",
        clinic_name: "Southern TCM Centre",
        specialties: ["Acupuncture", "Internal Medicine", "Dermatology", "Oncology", "Geriatrics", "Neurology"],
        address: "Southern TCM Centre, TCM Building, Southern University College, PTD 64888, 15KM Jalan Skudai, 81300 Skudai, Johor",
        phone: "07‑554 1795 / 07‑558 6605",
        working_hours: "Mon–Fri 9:00 am – 5:00 pm",
        experience: "University Centre",
        notes: "Well-known teaching and service centre in Skudai with multiple TCM specialties and community services."
    },
    {
        name: "Ren Shan Acupuncture Clinic / 仁山针灸诊所",
        clinic_name: "Ren Shan Acupuncture Clinic",
        specialties: ["Acupuncture"],
        address: "67, Jalan Mutiara 1/9, Taman Mutiara Mas, 81300 Skudai, Johor, Malaysia",
        phone: "07‑333 1315 / +60 12‑793 3229",
        working_hours: "9:30 am – 8:00 pm, Mon–Sun",
        experience: ">30 years",
        notes: "Frequently listed among JB’s recommended acupuncture spots; principal physician with >30 years’ TCM experience."
    },
    {
        name: "Xiang Xing TCM Medical Centre / 湘杏中医",
        clinic_name: "Xiang Xing TCM Medical Centre",
        specialties: ["General TCM", "Acupuncture", "Herbal Medicine"],
        address: "78, Jalan Serampang, Taman Pelangi, 80400 Johor Bahru, Johor",
        phone: "07‑333 1315",
        working_hours: "Standard TCM clinic hours",
        experience: "Well-known",
        notes: "Well-known JB TCM centre with many local reviews and active social media page."
    }
]

export function PractitionerManager() {
    const [practitioners, setPractitioners] = useState<Practitioner[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [seeding, setSeeding] = useState(false)

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
        working_hours: '',
        notes: ''
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
                working_hours: '',
                notes: ''
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
            toast.error('Failed to save practitioner. Make sure the database schema is updated.')
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

    const handleSeedPractitioners = async () => {
        if (!confirm('This will add 6 default practitioners/clinics to the list. Continue?')) return

        try {
            setSeeding(true)

            // Filter out ones that might already exist (simple check by name)
            const newPractitioners = DEFAULT_PRACTITIONERS.filter(p =>
                !practitioners.some(existing => existing.name === p.name)
            )

            if (newPractitioners.length === 0) {
                toast.info('All default practitioners already exist')
                return
            }

            const { error } = await supabase
                .from('tcm_practitioners')
                .insert(newPractitioners)

            if (error) throw error

            toast.success(`Added ${newPractitioners.length} practitioners`)
            fetchPractitioners()
        } catch (error) {
            console.error('Error seeding:', error)
            toast.error('Failed to add practitioners. Check if "notes" column exists in database.')
        } finally {
            setSeeding(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recommended Practitioners / Clinics</CardTitle>
                    <CardDescription>Manage the list of TCM doctors and clinics displayed in reports</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeedPractitioners} disabled={seeding || loading}>
                        {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                        Add Defaults
                    </Button>
                    <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New
                    </Button>
                </div>
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
                                    <TableHead>Practitioner / Clinic</TableHead>
                                    <TableHead>Specialties / Focus</TableHead>
                                    <TableHead className="hidden md:table-cell">Details</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {practitioners.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No practitioners found. Click "Add Defaults" to seed data.
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
                                                        <div className="max-w-[200px] md:max-w-[300px] break-words">{p.name}</div>
                                                        <div className="text-xs text-muted-foreground md:hidden">{p.clinic_name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[250px]">
                                                    {p.specialties?.slice(0, 3).map((s, i) => (
                                                        <Badge key={i} variant="secondary" className="text-xs">
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                    {(p.specialties?.length || 0) > 3 && (
                                                        <Badge variant="outline" className="text-xs">+{p.specialties.length - 3}</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="text-sm space-y-1">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span className="truncate max-w-[200px]" title={p.address}>{p.address}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>{p.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="truncate max-w-[200px]">{p.working_hours}</span>
                                                    </div>
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
                        <div className="space-y-2">
                            <Label htmlFor="name">Name (English / Chinese)</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. De Siang TCM & Acupuncture / 德祥中医诊所"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="clinic">Short Clinic Name</Label>
                                <Input
                                    id="clinic"
                                    value={formData.clinic_name}
                                    onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                                    placeholder="e.g. De Siang TCM"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="photo">Photo URL (Optional)</Label>
                                <Input
                                    id="photo"
                                    value={formData.photo}
                                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialties">Type / Focus (comma separated)</Label>
                            <Input
                                id="specialties"
                                value={specialtiesInput}
                                onChange={(e) => setSpecialtiesInput(e.target.value)}
                                placeholder="e.g. General TCM, Acupuncture, Herbal Medicine"
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
                                <Label htmlFor="hours">Working Hours</Label>
                                <Input
                                    id="hours"
                                    value={formData.working_hours}
                                    onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                    placeholder="e.g. Mon-Sat: 9am - 6pm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="experience">Experience</Label>
                                <Input
                                    id="experience"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    placeholder="e.g. >30 years or Established 1989"
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

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional details, reputation, background..."
                                className="min-h-[80px]"
                            />
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
