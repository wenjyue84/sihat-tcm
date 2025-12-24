import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata = {
    title: 'Blog - Sihat TCM',
    description: 'Latest insights on Traditional Chinese Medicine, AI diagnosis, and holistic health.',
};

export default function BlogIndex() {
    const posts = getAllPosts(['title', 'date', 'slug', 'author', 'coverImage', 'excerpt']);

    return (
        <div className="min-h-screen bg-stone-50/50 pb-20">
            {/* Hero Section */}
            <section className="bg-white border-b border-stone-100 py-20">
                <div className="container px-4 mx-auto text-center">
                    <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-200 bg-emerald-50">Sihat TCM Blog</Badge>
                    <h1 className="text-4xl font-serif font-medium text-stone-900 mb-4 tracking-tight">
                        Health & <span className="text-emerald-700">TCM Insights</span>
                    </h1>
                    <p className="text-lg text-stone-500 max-w-2xl mx-auto">
                        Discover the wisdom of Traditional Chinese Medicine combined with modern AI diagnostics.
                        Articles, guides, and tips for your wellness journey.
                    </p>
                </div>
            </section>

            {/* Blog Grid */}
            <div className="container px-4 mx-auto mt-12">
                {posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Card key={post.slug} className="group hover:shadow-lg transition-all duration-300 border-stone-200 bg-white overflow-hidden flex flex-col h-full">
                                <div className="h-48 bg-emerald-100/30 flex items-center justify-center overflow-hidden">
                                    {/* Placeholder for cover image if not real image loaded */}
                                    <div className="text-emerald-800/20 text-6xl font-serif select-none">TCM</div>
                                </div>
                                <CardHeader>
                                    <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
                                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {post.date}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author.name || 'Sihat Team'}</span>
                                    </div>
                                    <Link href={`/blog/${post.slug}`} className="hover:text-emerald-700 transition-colors">
                                        <CardTitle className="font-serif text-xl leading-tight group-hover:underline decoration-emerald-500/30 underline-offset-4 mb-2">
                                            {post.title}
                                        </CardTitle>
                                    </Link>
                                    <CardDescription className="line-clamp-3 text-stone-500">
                                        {post.excerpt}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {/* Spacer */}
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button asChild variant="ghost" className="p-0 h-auto hover:bg-transparent text-emerald-700 hover:text-emerald-800 font-medium group-hover:translate-x-1 transition-transform">
                                        <Link href={`/blog/${post.slug}`}>
                                            Read Article <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-stone-500">No posts found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
