'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    MessageCircle,
    Heart,
    Camera,
    Send,
    Sparkles,
    CheckCircle2,
    Plus,
    Image as ImageIcon,
    Award,
    Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/stores/useAppStore'
import { useAuth } from '@/stores/useAppStore'
import { FiveElementsRadar } from './FiveElementsRadar'

// Mock data for demo purposes
const MOCK_CIRCLES = [
    {
        id: 'damp-heat',
        key: 'dampHeat' as const,
        members: 847,
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '🔥'
    },
    {
        id: 'qi-deficiency',
        key: 'qiDeficiency' as const,
        members: 1203,
        color: 'from-sky-500 to-blue-500',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
        icon: '💨'
    },
    {
        id: 'yang-deficiency',
        key: 'yangDeficiency' as const,
        members: 654,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: '☀️'
    },
    {
        id: 'yin-deficiency',
        key: 'yinDeficiency' as const,
        members: 892,
        color: 'from-indigo-500 to-purple-500',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        icon: '🌙'
    },
    {
        id: 'phlegm-damp',
        key: 'phlegmDamp' as const,
        members: 567,
        color: 'from-teal-500 to-emerald-500',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        icon: '💧'
    },
]

const MOCK_POSTS = [
    {
        id: 1,
        type: 'meal',
        author: 'Anonymous Member #42',
        avatar: 'AM',
        content: 'Just made this warming ginger congee for breakfast! Perfect for my constitution 🍲',
        likes: 24,
        comments: 8,
        timestamp: '2 hours ago',
        hasImage: true,
    },
    {
        id: 2,
        type: 'success',
        author: 'Anonymous Member #108',
        avatar: 'AM',
        content: 'After 3 months following the TCM diet plan, my energy levels are so much better! Thank you all for the support 💪',
        likes: 67,
        comments: 15,
        timestamp: '5 hours ago',
        hasImage: false,
    },
    {
        id: 3,
        type: 'remedy',
        author: 'Anonymous Member #23',
        avatar: 'AM',
        content: 'Pro tip: Adding a slice of dried orange peel (陈皮) to your tea helps with digestion and reduces phlegm!',
        likes: 45,
        comments: 12,
        timestamp: 'Yesterday',
        hasImage: false,
    },
]

interface CircleOfHealthProps {
    userConstitution?: string
}

export function CircleOfHealth({ userConstitution = 'dampHeat' }: CircleOfHealthProps) {
    const { t } = useLanguage()
    const { profile } = useAuth()
    const [joinedCircles, setJoinedCircles] = useState<string[]>([userConstitution])
    const [activeCircle, setActiveCircle] = useState(userConstitution)
    const [postContent, setPostContent] = useState('')

    const handleJoinCircle = (circleKey: string) => {
        if (!joinedCircles.includes(circleKey)) {
            setJoinedCircles([...joinedCircles, circleKey])
        }
        setActiveCircle(circleKey)
    }

    const suggestedCircle = MOCK_CIRCLES.find(c => c.key === userConstitution) || MOCK_CIRCLES[0]

    return (
        <div className="space-y-8">
            {/* Welcome Banner - Redesigned with 'Genuine' Hero Image */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl bg-[#FFFBF0] border border-[#E6DCC5] shadow-lg"
            >
                {/* Background Pattern/Texture */}
                <div className="absolute inset-0 opacity-10 bg-[url('/images/circle-of-health-hero.png')] bg-cover bg-center blur-3xl mix-blend-multiply" />

                <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center p-8 md:p-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Safe & Anonymous Space</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif text-[#2C3E50] leading-tight">
                            {t.circleOfHealth.title}
                        </h2>
                        <p className="text-lg text-[#5D6D7E] leading-relaxed">
                            {t.circleOfHealth.welcomeMessage}
                        </p>
                        <div className="pt-2">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 rounded-full px-6">
                                Explore Communities
                            </Button>
                        </div>
                    </div>
                    <div className="hidden md:flex justify-center">
                        {/* Main Hero Image */}
                        <div className="relative w-full max-w-md aspect-square rounded-full overflow-hidden shadow-2xl ring-8 ring-white/50">
                            <img
                                src="/images/circle-of-health-hero.png"
                                alt="Circle of Health Community"
                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Five Elements Radar Chart - NEW */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <FiveElementsRadar
                    constitutionType={userConstitution}
                // You can pass real diagnosis data here if available
                // currentScores={...}
                // historicalScores={...}
                />
            </motion.div>

            {/* Your Suggested Circle */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif text-slate-800">Your Recommended Circle</h3>
                </div>
                <Card className={`overflow-hidden border border-opacity-50 shadow-sm ${suggestedCircle.bgColor} ${suggestedCircle.borderColor}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl bg-white/80 p-3 rounded-2xl shadow-sm">
                                    {suggestedCircle.icon}
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-semibold text-slate-800">
                                        {t.circleOfHealth.groups[suggestedCircle.key]}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="bg-white/50 text-slate-600 font-normal">
                                            Recommended for You
                                        </Badge>
                                        <CardDescription className="m-0">
                                            Based on your constitution
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                            {joinedCircles.includes(suggestedCircle.key) ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    {t.circleOfHealth.joined}
                                </Badge>
                            ) : (
                                <Button
                                    size="sm"
                                    className={`bg-gradient-to-r ${suggestedCircle.color} hover:opacity-90 shadow-sm`}
                                    onClick={() => handleJoinCircle(suggestedCircle.key)}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {t.circleOfHealth.join}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="flex items-center gap-6 text-sm text-slate-600 bg-white/40 p-3 rounded-xl inline-flex">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <span className="font-medium">{t.circleOfHealth.memberCount.replace('{count}', suggestedCircle.members.toLocaleString())}</span>
                            </div>
                            <div className="flex -space-x-2">
                                {[...Array(5)].map((_, i) => (
                                    <Avatar key={i} className="w-6 h-6 border-2 border-white ring-1 ring-slate-100">
                                        <AvatarFallback className={`text-[10px] bg-gradient-to-br ${suggestedCircle.color} text-white`}>
                                            {String.fromCharCode(65 + i)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-500 font-medium">
                                    +{suggestedCircle.members - 5}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Browse Other Circles */}
            <div>
                <h3 className="text-xl font-serif text-slate-800 mb-6">{t.circleOfHealth.myCircles}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {MOCK_CIRCLES.filter(c => c.key !== suggestedCircle.key).map((circle, idx) => (
                        <motion.div
                            key={circle.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                        >
                            <Card
                                className={`h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${activeCircle === circle.key
                                    ? `ring-2 ring-offset-2 ring-emerald-500 shadow-md`
                                    : 'hover:border-emerald-200 border-slate-100'
                                    }`}
                                onClick={() => setActiveCircle(circle.key)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-3xl p-2 bg-slate-50 rounded-xl">{circle.icon}</span>
                                        {joinedCircles.includes(circle.key) && (
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Joined
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mb-4">
                                        <p className="font-semibold text-lg text-slate-800 truncate mb-1">
                                            {t.circleOfHealth.groups[circle.key]}
                                        </p>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {circle.members.toLocaleString()} members
                                        </p>
                                    </div>

                                    {!joinedCircles.includes(circle.key) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleJoinCircle(circle.key)
                                            }}
                                        >
                                            {t.circleOfHealth.join}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Community Feed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif text-slate-800 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                        Community Conversations
                    </h3>
                </div>

                <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
                    <div className="bg-slate-50/50 p-4 border-b border-slate-100">
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="gap-1.5 rounded-full bg-white hover:bg-slate-50">
                                <Camera className="w-4 h-4 text-blue-500" />
                                {t.circleOfHealth.mealShare}
                            </Button>
                            <Button size="sm" className="gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200">
                                <Sparkles className="w-4 h-4" />
                                {t.circleOfHealth.shareRemedy}
                            </Button>
                        </div>
                    </div>

                    <CardContent className="space-y-6 p-6">
                        {/* Post Input */}
                        <div className="flex gap-4">
                            <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
                                    {profile?.full_name?.charAt(0) || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 relative group">
                                <textarea
                                    placeholder={t.circleOfHealth.postPlaceholder}
                                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none shadow-sm text-sm"
                                    rows={2}
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 rounded-full"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className={`rounded-full transition-all ${postContent.trim() ? 'bg-emerald-600 hover:bg-emerald-700 w-auto px-4 opacity-100' : 'w-0 px-0 opacity-0 overflow-hidden'}`}
                                        disabled={!postContent.trim()}
                                    >
                                        <Send className="w-3.5 h-3.5 mr-1" />
                                        Post
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Posts */}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {MOCK_POSTS.map((post, idx) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50/80 transition-all hover:shadow-sm bg-white"
                                    >
                                        <div className="flex gap-4">
                                            <Avatar className="mt-1">
                                                <AvatarFallback className={`bg-gradient-to-br from-indigo-400 to-purple-400 text-white shadow-sm`}>
                                                    {post.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-slate-800">{post.author}</span>
                                                    {post.type === 'success' && (
                                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 text-[10px] px-2">
                                                            <Award className="w-3 h-3 mr-1" />
                                                            Success Story
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-slate-400">&bull; {post.timestamp}</span>
                                                </div>
                                                <p className="text-slate-600 mb-3 leading-relaxed">{post.content}</p>
                                                {post.hasImage && (
                                                    <div className="mb-4 rounded-2xl overflow-hidden bg-slate-100 h-56 flex items-center justify-center relative group cursor-pointer">
                                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                                                        <div className="text-center text-slate-400">
                                                            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                            <span className="text-sm font-medium">shared_image.jpg</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-6">
                                                    <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-500 transition-colors group">
                                                        <div className="p-1.5 rounded-full group-hover:bg-rose-50 transition-colors">
                                                            <Heart className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium">{post.likes}</span>
                                                    </button>
                                                    <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors group">
                                                        <div className="p-1.5 rounded-full group-hover:bg-emerald-50 transition-colors">
                                                            <MessageCircle className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium">{post.comments}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
