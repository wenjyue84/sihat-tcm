import { getPostBySlug, getPostSlugs } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';

type Props = {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug, ['title', 'excerpt', 'coerImage']);

    return {
        title: `${post.title} | Sihat TCM Blog`,
        description: post.excerpt,
    };
}

export async function generateStaticParams() {
    const slugs = getPostSlugs();
    return slugs.map((slug) => ({
        slug: slug.replace(/\.mdx$/, ''),
    }));
}

// Custom components for MDX
const components = {
    h1: (props: any) => (
        <h1 {...props} className="text-3xl font-serif font-bold text-stone-900 mt-8 mb-4 first:mt-0" />
    ),
    h2: (props: any) => (
        <h2 {...props} className="text-2xl font-serif font-semibold text-stone-800 mt-8 mb-4 border-b border-stone-200 pb-2" />
    ),
    h3: (props: any) => (
        <h3 {...props} className="text-xl font-serif font-semibold text-stone-800 mt-6 mb-3" />
    ),
    p: (props: any) => (
        <p {...props} className="text-stone-600 leading-relaxed mb-4 text-lg" />
    ),
    ul: (props: any) => (
        <ul {...props} className="list-disc list-outside ml-6 mb-4 text-stone-600 space-y-1 text-lg" />
    ),
    ol: (props: any) => (
        <ol {...props} className="list-decimal list-outside ml-6 mb-4 text-stone-600 space-y-1 text-lg" />
    ),
    strong: (props: any) => (
        <strong {...props} className="font-semibold text-stone-900" />
    ),
    blockquote: (props: any) => (
        <blockquote {...props} className="border-l-4 border-emerald-500 pl-4 py-1 my-4 italic text-stone-700 bg-stone-50 rounded-r-lg" />
    ),
    a: (props: any) => (
        <a {...props} className="text-emerald-700 hover:underline underline-offset-4 decoration-emerald-300" />
    ),
};

export default async function BlogPost({ params }: Props) {
    const { slug } = await params;
    const post = getPostBySlug(slug, [
        'title',
        'date',
        'slug',
        'author',
        'content',
        'coverImage',
        'excerpt',
    ]);

    return (
        <article className="min-h-screen bg-stone-50/30 pb-20">
            {/* Article Header */}
            <div className="bg-white border-b border-stone-100 mb-12">
                <div className="container px-4 mx-auto py-12 max-w-4xl">
                    <Button asChild variant="ghost" className="mb-8 pl-0 text-stone-500 hover:text-stone-900 hover:bg-transparent">
                        <Link href="/blog">
                            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Blog
                        </Link>
                    </Button>

                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">Analysis</Badge>
                            <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-none">TCM 101</Badge>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-6 text-stone-500 pt-4 border-t border-stone-100 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-serif font-bold">
                                    {(post.author?.name?.[0] || 'S')}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-stone-900">{post.author.name}</p>
                                    <p className="text-xs">Author</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-stone-200"></div>
                            <div>
                                <p className="text-sm font-medium text-stone-900">{post.date}</p>
                                <p className="text-xs">Published</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <div className="container px-4 mx-auto max-w-3xl">
                <div className="prose prose-stone prose-lg max-w-none">
                    <MDXRemote source={post.content} components={components} />
                </div>

                <div className="mt-16 pt-8 border-t border-stone-200">
                    <div className="bg-emerald-50 rounded-2xl p-8 text-center">
                        <h3 className="font-serif text-2xl font-bold text-emerald-900 mb-2">Want a personalized diagnosis?</h3>
                        <p className="text-emerald-800 mb-6 max-w-lg mx-auto">
                            Sihat TCM uses advanced AI to analyze your tongue and provide immediate health insights just like a TCM practitioner.
                        </p>
                        <Button asChild size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full">
                            <Link href="/patient">Start Your Diagnosis</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
