import { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus, Pill } from 'lucide-react'

// Common medicines in Malaysia categorized
const MEDICINE_CATEGORIES = [
    {
        id: 'pain',
        label: { en: 'Pain & Fever', zh: '止痛与发烧', ms: 'Sakit & Demam' },
        items: ['Panadol', 'Uphamol', 'Nurofen', 'Aspirin', 'Ponstan', 'Voltaren', 'Synflex', 'Celebrex', 'Paracetamol', 'Ibuprofen']
    },
    {
        id: 'cough',
        label: { en: 'Cough & Flu', zh: '感冒与咳嗽', ms: 'Batuk & Selesema' },
        items: ['Breacol', 'Woods\' Peppermint', 'Difflam', 'Strepsils', 'Vicks Vaporub', 'Clarinase', 'Zyrtec', 'Clarityne', 'Adezio', 'Ezede', 'Mucosolvan', 'Fluimucil', 'Duro-Tuss', 'Leftose']
    },
    {
        id: 'chronic',
        label: { en: 'Chronic Disease', zh: '慢性病', ms: 'Penyakit Kronik' },
        items: ['Metformin', 'Gliclazide', 'Amlodipine', 'Perindopril', 'Atenolol', 'Bisoprolol', 'Atorvastatin', 'Simvastatin', 'Eltroxin', 'Januvia', 'Concor', 'Norvasc']
    },
    {
        id: 'stomach',
        label: { en: 'Stomach & Gut', zh: '肠胃', ms: 'Perut & Usus' },
        items: ['Gaviscon', 'Eno', 'MMT', 'Buscopan', 'Zentel', 'Ultracarbon', 'Po Chai Pills', 'Motilium', 'Nexium', 'Controloc', 'Lactul']
    },
    {
        id: 'supplements',
        label: { en: 'Supplements', zh: '补充剂', ms: 'Suplemen' },
        items: ['Neurobion', 'Pharmaton', 'Berocca', 'Redoxon', 'Appeton', 'Scott\'s Emulsion', 'Fish Oil', 'Multivitamins', 'Calcium', 'Vitamin C', 'Vitamin D', 'Folic Acid']
    },
    {
        id: 'skin',
        label: { en: 'Skin & External', zh: '皮肤外用', ms: 'Kulit & Luaran' },
        items: ['Dettol', 'Zambuk', 'Mopiko', 'Nixoderm', 'Chloromycetin', 'Fucidin', 'Hirudoid', 'Betnovate', 'Elomet', 'Calamine Lotion']
    },
    {
        id: 'other',
        label: { en: 'Others', zh: '其他', ms: 'Lain-lain' },
        items: ['Eye Mo', 'Bonjela', 'Oral Aid', 'Waxsol', 'Ventolin', 'Gingkobiloba', 'Glucosamine']
    }
]

interface MedicineSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (medicineName: string) => void
    language: string
}

export function MedicineSelectionModal({ isOpen, onClose, onSelect, language }: MedicineSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('pain')

    const lang = language as 'en' | 'zh' | 'ms'

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return null

        const lowerQuery = searchQuery.toLowerCase()
        const allItems = MEDICINE_CATEGORIES.flatMap(cat => cat.items)
        // Deduplicate and filter
        return Array.from(new Set(allItems)).filter(item =>
            item.toLowerCase().includes(lowerQuery)
        )
    }, [searchQuery])

    const handleSelect = (item: string) => {
        onSelect(item)
        onClose()
        setSearchQuery('')
    }

    const handleCustomAdd = () => {
        if (searchQuery.trim()) {
            onSelect(searchQuery.trim())
            onClose()
            setSearchQuery('')
        }
    }

    const content = {
        title: { en: 'Select Medicine', zh: '选择药物', ms: 'Pilih Ubat' },
        searchPlaceholder: { en: 'Search medicine name...', zh: '搜索药物名称...', ms: 'Cari nama ubat...' },
        customAdd: { en: 'Add "', zh: '添加 "', ms: 'Tambah "' },
        noResults: { en: 'No matching medicines found.', zh: '未找到匹配的药物。', ms: 'Tiada ubat yang sepadan ditemui.' },
        popular: { en: 'Popular', zh: '热门', ms: 'Popular' }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
                <DialogHeader className="px-4 py-3 border-b border-stone-100">
                    <DialogTitle className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                        <Pill className="w-5 h-5" />
                        {content.title[lang]}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 bg-stone-50 border-b border-stone-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            className="pl-9 bg-white border-stone-200 focus:ring-emerald-500"
                            placeholder={content.searchPlaceholder[lang]}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-white">
                    {searchQuery.trim() ? (
                        // Search Results
                        <ScrollArea className="h-[400px] p-4">
                            <div className="flex flex-col gap-2">
                                {filteredItems && filteredItems.length > 0 ? (
                                    filteredItems.map((item, idx) => (
                                        <Button
                                            key={idx}
                                            variant="ghost"
                                            className="justify-start h-auto py-3 px-4 text-base font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 border border-stone-100 rounded-lg text-left"
                                            onClick={() => handleSelect(item)}
                                        >
                                            {item}
                                        </Button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-500">
                                        <p className="mb-4">{content.noResults[lang]}</p>
                                        <Button
                                            onClick={handleCustomAdd}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {content.customAdd[lang]}{searchQuery}"
                                        </Button>
                                    </div>
                                )}
                                {filteredItems && filteredItems.length > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleCustomAdd}
                                        className="mt-4 border-dashed border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {content.customAdd[lang]}{searchQuery}"
                                    </Button>
                                )}
                            </div>
                        </ScrollArea>
                    ) : (
                        // Categories
                        <Tabs defaultValue="pain" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                            <div className="border-b border-stone-100 bg-stone-50/50">
                                <div className="w-full overflow-x-auto whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    <TabsList className="h-auto w-max justify-start bg-transparent p-0 px-4 space-x-2 py-2">
                                        {MEDICINE_CATEGORIES.map(cat => (
                                            <TabsTrigger
                                                key={cat.id}
                                                value={cat.id}
                                                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 rounded-full px-4 py-2 h-auto text-sm border border-transparent data-[state=active]:border-emerald-200 transition-colors shadow-sm"
                                            >
                                                {cat.label[lang]}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4 h-[350px]">
                                {MEDICINE_CATEGORIES.map(cat => (
                                    <TabsContent key={cat.id} value={cat.id} className="mt-0 grid grid-cols-2 sm:grid-cols-3 gap-3 pb-8">
                                        {cat.items.map((item, idx) => (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                className="h-auto py-3 px-3 text-sm font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-stone-200 justify-start text-left whitespace-normal leading-tight"
                                                onClick={() => handleSelect(item)}
                                            >
                                                {item}
                                            </Button>
                                        ))}
                                    </TabsContent>
                                ))}
                            </ScrollArea>
                        </Tabs>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
