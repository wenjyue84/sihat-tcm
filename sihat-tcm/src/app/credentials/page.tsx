'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Award, BookOpen, Database, Shield, CheckCircle, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function CredentialsPage() {
    // Date logic: Previous month relative to today
    const today = new Date()
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const year = prevMonthDate.getFullYear()
    const month = prevMonthDate.getMonth() + 1
    const dateString = `${year}年${month}月`

    return (
        <main className="min-h-screen bg-stone-50 font-sans text-stone-800">
            {/* Hero Section */}
            <section className="relative h-[500px] w-full bg-emerald-900 overflow-hidden flex flex-col items-center justify-center text-center px-4">
                {/* Background Image */}
                <div className="absolute inset-0 z-0 opacity-40">
                    {/* Use the generated image here. Assuming it is in public folder. */}
                    <Image
                        src="/tech_tcm_bg.png"
                        alt="TCM Background"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/90 z-0"></div>

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <Link href="/" className="absolute top-8 left-4 md:left-0 text-white/80 hover:text-white flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-800/80 backdrop-blur-sm border border-emerald-400/30 text-emerald-100 text-sm font-medium mb-4">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>互联网医院机构认证</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
                        思和AI
                    </h1>

                    <p className="text-xl md:text-3xl text-emerald-100 font-light max-w-2xl mx-auto">
                        思和AI中医大模型 <br className="md:hidden" /> 专属于您的老中医
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-emerald-200 text-sm md:text-base mt-2">
                        <span className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            32项 发明专利
                        </span>
                        <span className="opacity-50">|</span>
                        <span className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            54项 知识产权
                        </span>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-20 -mt-20 container mx-auto px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                        <CardContent className="p-8 text-center space-y-2">
                            <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="text-4xl font-bold text-emerald-800">109,092</div>
                            <div className="text-stone-500 font-medium">学习病种数 (个)</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 delay-100">
                        <CardContent className="p-8 text-center space-y-2">
                            <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
                                <Database className="w-6 h-6" />
                            </div>
                            <div className="text-4xl font-bold text-emerald-800">19,283,049</div>
                            <div className="text-stone-500 font-medium">训练学习医案数 (次)</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 delay-200">
                        <CardContent className="p-8 text-center space-y-2">
                            <div className="w-12 h-12 mx-auto bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 mb-4">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div className="text-4xl font-bold text-emerald-800">47,878</div>
                            {/* Using a generic label based on context, or just leaving it as a large number block if preferred. 
                  Given the layout in prompt, it might be separate. I'll add the label below to match visual balance. */}
                            <div className="text-stone-500 font-medium">智慧中医 行业领先</div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Certifications & Footer Info */}
            <section className="container mx-auto px-4 py-12 text-center space-y-8">

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-stone-800">权威认证 & 安全保障</h2>

                    <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base text-stone-600 font-medium max-w-4xl mx-auto leading-relaxed">
                        <span className="px-4 py-2 bg-white border border-emerald-100 rounded-lg shadow-sm">国家信息安全等级保护三级认证</span>
                        <span className="px-4 py-2 bg-white border border-emerald-100 rounded-lg shadow-sm">互联网信息服务算法备案资质</span>
                        <span className="px-4 py-2 bg-white border border-emerald-100 rounded-lg shadow-sm">ISO27701认证</span>
                        <span className="px-4 py-2 bg-white border border-emerald-100 rounded-lg shadow-sm">ISO27001认证</span>
                        <span className="px-4 py-2 bg-white border border-emerald-100 rounded-lg shadow-sm">ISO9001认证</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm text-emerald-700 mt-4">
                        <span>〈 国家级高新技术企业 〉</span>
                        <span>〈 科技型中小企业 〉</span>
                        <span>〈 创新型中小企业 〉</span>
                        <span>〈 专精特新中小企业 〉</span>
                    </div>
                </div>

                <div className="pt-12 border-t border-stone-200">
                    <p className="text-stone-400 text-xs md:text-sm">
                        *图中数据基于截止<span className="font-semibold text-emerald-600">{dateString}</span>AI模型的训练和应用情况统计
                    </p>
                </div>

            </section>
        </main>
    )
}
