'use client';

import { Author } from '@/lib/authors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Globe, Twitter } from 'lucide-react';
import Link from 'next/link';

interface AuthorBioProps {
    author: Author;
    lang: 'en' | 'ms' | 'zh';
}

export function AuthorBio({ author, lang }: AuthorBioProps) {
    return (
        <Card className="p-6 bg-stone-50 border-stone-200 mt-12 mb-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Avatar className="w-20 h-20 border-2 border-white shadow-md">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 text-2xl font-serif">
                        {author.name[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-serif font-bold text-stone-900">{author.name}</h3>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                            {author.role}
                        </Badge>
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                        {author.bio[lang]}
                    </p>

                    {author.socials && (
                        <div className="flex gap-3 pt-2">
                            {author.socials.linkedin && (
                                <Link href={author.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#0077b5] transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                    <span className="sr-only">LinkedIn</span>
                                </Link>
                            )}
                            {author.socials.twitter && (
                                <Link href={author.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#1DA1F2] transition-colors">
                                    <Twitter className="w-5 h-5" />
                                    <span className="sr-only">Twitter</span>
                                </Link>
                            )}
                            {author.socials.website && (
                                <Link href={author.socials.website} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-emerald-600 transition-colors">
                                    <Globe className="w-5 h-5" />
                                    <span className="sr-only">Website</span>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
