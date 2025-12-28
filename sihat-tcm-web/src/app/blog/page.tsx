import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getPaginatedPosts, getAllPosts } from "@/lib/content/blog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, User, Home, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlogLanguageSwitcher } from "@/components/blog/BlogLanguageSwitcher";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { PaginationControl } from "@/components/blog/PaginationControl";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type LangType = "en" | "ms" | "zh";
const POSTS_PER_PAGE = 6;

const blogTranslations = {
  en: {
    badge: "Sihat TCM Blog",
    titlePrefix: "Health &",
    titleHighlight: "TCM Insights",
    description:
      "Discover the wisdom of Traditional Chinese Medicine combined with modern AI diagnostics. Articles, guides, and tips for your wellness journey.",
    readArticle: "Read Article",
    noPosts: "No posts found matching your search.",
    author: "Author",
    published: "Published",
    backToBlog: "Back to Blog",
    backToHome: "Back to Home",
    analysisBadge: "Analysis",
    tcmBadge: "TCM 101",
    promoTitle: "Want a personalized diagnosis?",
    promoDesc:
      "Sihat TCM uses advanced AI to analyze your tongue and provide immediate health insights just like a TCM practitioner.",
    promoButton: "Start Your Diagnosis",
    searchPlaceholder: "Search articles...",
  },
  ms: {
    badge: "Blog Sihat TCM",
    titlePrefix: "Kesihatan &",
    titleHighlight: "Wawasan TCM",
    description:
      "Temui kebijaksanaan Perubatan Tradisional Cina yang digabungkan dengan diagnostik AI moden. Artikel, panduan, dan tips untuk kesihatan anda.",
    readArticle: "Baca Artikel",
    noPosts: "Tiada artikel dijumpai yang sepadan dengan carian anda.",
    author: "Penulis",
    published: "Diterbitkan",
    backToBlog: "Kembali ke Blog",
    backToHome: "Kembali ke Utama",
    analysisBadge: "Analisis",
    tcmBadge: "Asas TCM",
    promoTitle: "Mahukan diagnosis peribadi?",
    promoDesc:
      "Sihat TCM menggunakan AI canggih untuk menganalisis lidah anda dan memberikan wawasan kesihatan segera seperti pengamal TCM.",
    promoButton: "Mulakan Diagnosis Anda",
    searchPlaceholder: "Cari artikel...",
  },
  zh: {
    badge: "Sihat TCM 博客",
    titlePrefix: "健康与",
    titleHighlight: "中医洞察",
    description: "探索传统中医智慧与现代 AI 诊断的结合。为您的健康之旅提供文章、指南和提示。",
    readArticle: "阅读文章",
    noPosts: "未找到符合您搜索的文章。",
    author: "作者",
    published: "发布于",
    backToBlog: "返回博客",
    backToHome: "返回首页",
    analysisBadge: "分析",
    tcmBadge: "中医基础",
    promoTitle: "想要个性化的诊断？",
    promoDesc: "Sihat TCM 使用先进的 AI 分析您的舌头，并像中医师一样提供即时的健康洞察。",
    promoButton: "开始诊断",
    searchPlaceholder: "搜索文章...",
  },
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const lang = (params.lang as string) || "en";
  const t = blogTranslations[lang as LangType] || blogTranslations.en;
  const canonicalPath = lang === "en" ? "/blog" : `/blog?lang=${lang}`;

  return {
    title: `Blog - ${t.titleHighlight}`,
    description: t.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: "/blog",
        ms: "/blog?lang=ms",
        zh: "/blog?lang=zh",
      },
    },
  };
}

export default async function BlogIndex(props: Props) {
  const searchParams = await props.searchParams;
  const lang = (searchParams.lang as string) || "en";
  const query = (searchParams.q as string)?.toLowerCase() || "";
  const page = Number(searchParams.page) || 1;

  const t = blogTranslations[lang as LangType] || blogTranslations.en;

  let posts;
  let paginationData = null;

  if (query) {
    // If searching, we currently just fetch all and filter (CLIENT side filtering/ or simple full fetch)
    // For production with many posts, you'd want server-side search.
    // Here, we'll fetch all and filter, disabling pagination for search results for simplicity
    const allPosts = getAllPosts(
      ["title", "date", "slug", "author", "coverImage", "excerpt", "readingTime"],
      lang
    );
    posts = allPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) || post.excerpt.toLowerCase().includes(query)
    );
  } else {
    // Normal paginated view
    const data = getPaginatedPosts(
      ["title", "date", "slug", "author", "coverImage", "excerpt", "readingTime"],
      lang,
      page,
      POSTS_PER_PAGE
    );
    posts = data.posts;
    paginationData = data.pagination;
  }

  // JSON-LD structured data for Blog schema
  const blogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Sihat TCM Blog",
    description: t.description,
    url: "https://sihat-tcm.vercel.app/blog",
    inLanguage: lang === "en" ? "en-US" : lang === "ms" ? "ms-MY" : "zh-CN",
    publisher: {
      "@type": "Organization",
      name: "Sihat TCM",
      url: "https://sihat-tcm.vercel.app",
      logo: {
        "@type": "ImageObject",
        url: "https://sihat-tcm.vercel.app/logo.png",
      },
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `https://sihat-tcm.vercel.app/blog/${post.slug}${lang !== "en" ? `?lang=${lang}` : ""}`,
      datePublished: post.date,
      author: {
        "@type": "Person",
        name: post.author?.name || "Sihat Team",
      },
      ...(post.coverImage && {
        image: post.coverImage.startsWith("http")
          ? post.coverImage
          : `https://sihat-tcm.vercel.app${post.coverImage}`,
      }),
    })),
  };

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListJsonLd) }}
      />
      {/* Hero Section */}
      <section className="bg-white border-b border-stone-100 py-20">
        <div className="container px-4 mx-auto text-center relative">
          <div className="absolute top-0 right-4 md:right-0">
            <BlogLanguageSwitcher />
          </div>
          <Badge
            variant="outline"
            className="mb-4 text-emerald-700 border-emerald-200 bg-emerald-50"
          >
            {t.badge}
          </Badge>
          <h1 className="text-4xl font-serif font-medium text-stone-900 mb-4 tracking-tight">
            {t.titlePrefix} <span className="text-emerald-700">{t.titleHighlight}</span>
          </h1>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto mb-8">{t.description}</p>

          <BlogSearch placeholder={t.searchPlaceholder} />

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              className="border-stone-300 text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            >
              <Link href="/">
                <Home className="mr-2 w-4 h-4" />
                {t.backToHome}
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg hover:shadow-emerald-900/20"
            >
              <Link href="/">
                {t.promoButton}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <div className="container px-4 mx-auto mt-12">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card
                key={post.slug}
                className="group hover:shadow-lg transition-all duration-300 border-stone-200 bg-white overflow-hidden flex flex-col h-full"
              >
                <div className="h-48 bg-emerald-100/30 relative overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center h-full text-emerald-800/20 text-6xl font-serif select-none"
                      role="img"
                      aria-label={`Placeholder image for article: ${post.title}`}
                    >
                      TCM
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {post.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {post.author.name || "Sihat Team"}
                    </span>
                    {post.readingTime && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.readingTime}
                        </span>
                      </>
                    )}
                  </div>
                  <Link
                    href={`/blog/${post.slug}${lang !== "en" ? `?lang=${lang}` : ""}`}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    <CardTitle className="font-serif text-xl leading-tight group-hover:underline decoration-emerald-500/30 underline-offset-4 mb-2">
                      {post.title}
                    </CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-3 text-stone-500">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">{/* Spacer */}</CardContent>
                <CardFooter className="pt-0">
                  <Button
                    asChild
                    variant="ghost"
                    className="p-0 h-auto hover:bg-transparent text-emerald-700 hover:text-emerald-800 font-medium group-hover:translate-x-1 transition-transform"
                  >
                    <Link href={`/blog/${post.slug}${lang !== "en" ? `?lang=${lang}` : ""}`}>
                      {t.readArticle} <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-stone-500">{t.noPosts}</p>
          </div>
        )}

        {paginationData && (
          <PaginationControl
            currentPage={paginationData.currentPage}
            totalPages={paginationData.totalPages}
          />
        )}
      </div>
    </div>
  );
}
