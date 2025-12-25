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
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

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
        <div className="space-y-6">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500">
                    <CardContent className="p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Users className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-1">{t.circleOfHealth.title}</h2>
                                <p className="text-white/90">{t.circleOfHealth.welcomeMessage}</p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">100% Anonymous</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Your Suggested Circle */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className={`overflow-hidden border-2 ${suggestedCircle.borderColor} ${suggestedCircle.bgColor}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{suggestedCircle.icon}</span>
                                <div>
                                    <CardTitle className="text-lg">
                                        {t.circleOfHealth.groups[suggestedCircle.key]}
                                    </CardTitle>
                                    <CardDescription>
                                        Recommended based on your constitution
                                    </CardDescription>
                                </div>
                            </div>
                            {joinedCircles.includes(suggestedCircle.key) ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {t.circleOfHealth.joined}
                                </Badge>
                            ) : (
                                <Button
                                    size="sm"
                                    className={`bg-gradient-to-r ${suggestedCircle.color} hover:opacity-90`}
                                    onClick={() => handleJoinCircle(suggestedCircle.key)}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {t.circleOfHealth.join}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{t.circleOfHealth.memberCount.replace('{count}', suggestedCircle.members.toLocaleString())}</span>
                            </div>
                            <div className="flex -space-x-2">
                                {[...Array(5)].map((_, i) => (
                                    <Avatar key={i} className="w-6 h-6 border-2 border-white">
                                        <AvatarFallback className={`text-xs bg-gradient-to-br ${suggestedCircle.color} text-white`}>
                                            {String.fromCharCode(65 + i)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-600">
                                    +{suggestedCircle.members - 5}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Browse Other Circles */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t.circleOfHealth.myCircles}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MOCK_CIRCLES.filter(c => c.key !== suggestedCircle.key).map((circle, idx) => (
                        <motion.div
                            key={circle.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                        >
                            <Card
                                className={`cursor-pointer transition-all hover:shadow-md ${activeCircle === circle.key ? `ring-2 ring-offset-2 ring-emerald-500` : ''
                                    }`}
                                onClick={() => setActiveCircle(circle.key)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">{circle.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">
                                                {t.circleOfHealth.groups[circle.key]}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {circle.members.toLocaleString()} members
                                            </p>
                                        </div>
                                    </div>
                                    {joinedCircles.includes(circle.key) ? (
                                        <Badge variant="secondary" className="w-full justify-center">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {t.circleOfHealth.joined}
                                        </Badge>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
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
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-emerald-600" />
                                Community Feed
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="gap-1">
                                    <Camera className="w-4 h-4" />
                                    {t.circleOfHealth.mealShare}
                                </Button>
                                <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                                    <Sparkles className="w-4 h-4" />
                                    {t.circleOfHealth.shareRemedy}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Post Input */}
                        <div className="flex gap-3 p-4 bg-slate-50 rounded-xl">
                            <Avatar>
                                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                    {profile?.full_name?.charAt(0) || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <textarea
                                    placeholder={t.circleOfHealth.postPlaceholder}
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                    rows={2}
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="text-slate-500">
                                            <ImageIcon className="w-4 h-4 mr-1" />
                                            Photo
                                        </Button>
                                    </div>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={!postContent.trim()}>
                                        <Send className="w-4 h-4 mr-1" />
                                        Post
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Posts */}
                        <AnimatePresence>
                            {MOCK_POSTS.map((post, idx) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex gap-3">
                                        <Avatar>
                                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                                                {post.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-slate-800">{post.author}</span>
                                                {post.type === 'success' && (
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                                        <Award className="w-3 h-3 mr-1" />
                                                        {t.circleOfHealth.successStory}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-slate-400">{post.timestamp}</span>
                                            </div>
                                            <p className="text-slate-600 mb-3">{post.content}</p>
                                            {post.hasImage && (
                                                <div className="mb-3 rounded-lg overflow-hidden bg-slate-100 h-48 flex items-center justify-center">
                                                    <div className="text-center text-slate-400">
                                                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                                        <span className="text-sm">Meal Photo</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <button className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                                                    <Heart className="w-4 h-4" />
                                                    <span>{post.likes}</span>
                                                </button>
                                                <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span>{post.comments}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
