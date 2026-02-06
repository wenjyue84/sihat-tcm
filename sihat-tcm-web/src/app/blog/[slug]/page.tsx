import { getPostBySlug, getPostSlugs } from "@/lib/content/blog";
import { BlogLanguageSwitcher } from "@/components/blog/BlogLanguageSwitcher";
import { SocialShare } from "@/components/blog/SocialShare";
import { Newsletter } from "@/components/blog/Newsletter";
import { AuthorBio } from "@/components/blog/AuthorBio";
import { FloatingShareButton } from "@/components/blog/FloatingShareButton";
import { DiagnosisPromo } from "@/components/blog/DiagnosisPromo";
import { getAuthor } from "@/lib/content/authors";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

interface Heading {
  title: string;
  id: string;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const lang = (searchParams.lang as string) || "en";
  const post = getPostBySlug(
    params.slug,
    ["title", "excerpt", "coverImage", "date", "author"],
    lang
  );

  // Build canonical URL based on current language
  const baseUrl = `/blog/${params.slug}`;
  const canonicalUrl = lang !== "en" ? `${baseUrl}?lang=${lang}` : baseUrl;

  return {
    title: `${post.title} | Sihat TCM Blog`,
    description: post.excerpt,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `/blog/${params.slug}`,
        ms: `/blog/${params.slug}?lang=ms`,
        zh: `/blog/${params.slug}?lang=zh`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonicalUrl,
      siteName: "Sihat TCM",
      images: [
        {
          url: post.coverImage || "/og-image.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      publishedTime: post.date,
      authors: [post.author || "Sihat TCM Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage || "/og-image.png"],
    },
  };
}

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({
    slug: slug.replace(/\.mdx$/, ""),
  }));
}

export default async function BlogPost(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const lang = (searchParams.lang as string) || "en";

  const post = getPostBySlug(
    params.slug,
    ["title", "date", "slug", "author", "content", "coverImage", "excerpt", "readingTime", "faq"],
    lang
  );

  const allPosts = getPostSlugs().map((slug) =>
    getPostBySlug(slug, ["title", "slug", "coverImage", "date"], lang)
  );
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  // Extract headings for Table of Contents
  const headings: Heading[] =
    post.content?.match(/^##\s+(.+)$/gm)?.map((heading: string) => {
      const title = heading.replace(/^##\s+/, "");
      // Use Unicode property escapes to support generic characters (Chinese, Malay, etc.)
      const id = title
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\-_]+/gu, "-")
        .replace(/^-+|-+$/g, "");
      return { title, id: id || "heading" };
    }) || [];

  // Custom components for MDX with ID injection for TOC
  const components = {
    h1: (props: any) => (
      <h1
        {...props}
        className="text-3xl font-serif font-bold text-stone-900 mt-8 mb-4 first:mt-0"
      />
    ),
    h2: (props: any) => {
      const text = props.children?.toString() || "";
      const id =
        text
          .toLowerCase()
          .trim()
          .replace(/[^\p{L}\p{N}\-_]+/gu, "-")
          .replace(/^-+|-+$/g, "") || "heading";
      return (
        <h2
          id={id}
          {...props}
          className="text-2xl font-serif font-semibold text-stone-800 mt-8 mb-4 border-b border-stone-200 pb-2 scroll-mt-24"
        />
      );
    },
    h3: (props: any) => (
      <h3 {...props} className="text-xl font-serif font-semibold text-stone-800 mt-6 mb-3" />
    ),
    p: (props: any) => <p {...props} className="text-stone-600 leading-relaxed mb-4 text-lg" />,
    ul: (props: any) => (
      <ul
        {...props}
        className="list-disc list-outside ml-6 mb-4 text-stone-600 space-y-1 text-lg"
      />
    ),
    ol: (props: any) => (
      <ol
        {...props}
        className="list-decimal list-outside ml-6 mb-4 text-stone-600 space-y-1 text-lg"
      />
    ),
    strong: (props: any) => <strong {...props} className="font-semibold text-stone-900" />,
    blockquote: (props: any) => (
      <blockquote
        {...props}
        className="border-l-4 border-emerald-500 pl-4 py-1 my-4 italic text-stone-700 bg-stone-50 rounded-r-lg"
      />
    ),
    a: (props: any) => (
      <a
        {...props}
        className="text-emerald-700 hover:underline underline-offset-4 decoration-emerald-300"
      />
    ),
    DiagnosisPromo: DiagnosisPromo,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage
      ? `https://sihat-tcm.vercel.app${post.coverImage}`
      : "https://sihat-tcm.vercel.app/og-image.png",
    datePublished: post.date,
    dateModified: post.date,
    author: post.author
      ? [
          {
            "@type": "Person",
            name:
              typeof post.author === "string"
                ? post.author
                : (post.author as { name: string }).name,
          },
        ]
      : [],
    publisher: {
      "@type": "Organization",
      name: "Sihat TCM",
      logo: {
        "@type": "ImageObject",
        url: "https://sihat-tcm.vercel.app/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://sihat-tcm.vercel.app/blog/${params.slug}${lang !== "en" ? `?lang=${lang}` : ""}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://sihat-tcm.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://sihat-tcm.vercel.app/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://sihat-tcm.vercel.app/blog/${params.slug}${lang !== "en" ? `?lang=${lang}` : ""}`,
      },
    ],
  };

  // FAQ Structured Data
  const faqJsonLd =
    post.faq && Array.isArray(post.faq) && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item: any) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  const blogTranslations = {
    en: {
      home: "Home",
      blog: "Blog",
      backToBlog: "Back to Blog",
      analysisBadge: "Analysis",
      tcmBadge: "TCM 101",
      author: "Author",
      published: "Published",
      readMore: "Read More",
      promoTitle: "Want a personalized diagnosis?",
      promoDesc:
        "Sihat TCM uses advanced AI to analyze your tongue and provide immediate health insights just like a TCM practitioner.",
      promoButton: "Start Your Diagnosis",
      tableOfContents: "Table of Contents",
      needCheck: "Need a quick check?",
      scanNow: "Scan Now",
      inThisArticle: "In this article",
    },
    ms: {
      home: "Utama",
      blog: "Blog",
      backToBlog: "Kembali ke Blog",
      analysisBadge: "Analisis",
      tcmBadge: "Asas TCM",
      author: "Penulis",
      published: "Diterbitkan",
      readMore: "Baca Selanjutnya",
      promoTitle: "Mahukan diagnosis peribadi?",
      promoDesc:
        "Sihat TCM menggunakan AI canggih untuk menganalisis lidah anda dan memberikan wawasan kesihatan segera seperti pengamal TCM.",
      promoButton: "Mulakan Diagnosis Anda",
      tableOfContents: "Isi Kandungan",
      needCheck: "Perlukan pemeriksaan pantas?",
      scanNow: "Imbas Sekarang",
      inThisArticle: "Dalam artikel ini",
    },
    zh: {
      home: "首页",
      blog: "博客",
      backToBlog: "返回博客",
      analysisBadge: "分析",
      tcmBadge: "中医基础",
      author: "作者",
      published: "发布于",
      readMore: "阅读更多",
      promoTitle: "想要个性化的诊断？",
      promoDesc: "Sihat TCM 使用先进的 AI 分析您的舌头，并像中医师一样提供即时的健康洞察。",
      promoButton: "开始诊断",
      tableOfContents: "目录",
      needCheck: "需要快速检查？",
      scanNow: "立即扫描",
      inThisArticle: "本文内容",
    },
  };

  type LangType = "en" | "ms" | "zh";
  const t = blogTranslations[lang as LangType] || blogTranslations.en;

  const isDrAi =
    (typeof post.author === "object" &&
      post.author &&
      "name" in post.author &&
      (post.author as { name: string }).name?.toLowerCase().includes("ai")) ||
    (typeof post.author === "string" && post.author.toLowerCase().includes("ai")) ||
    false;
  const authorId = isDrAi ? "dr-ai" : "sihat-team"; // Simple mapping logic for now
  const authorProfile = getAuthor(authorId);

  return (
    <article className="min-h-screen bg-stone-50/30 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {/* Article Header */}
      <div className="bg-white border-b border-stone-100 mb-12">
        <div className="container px-4 mx-auto py-12 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-stone-500 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-emerald-700 transition-colors">
              {t.home}
            </Link>
            <span className="mx-2 text-stone-300">/</span>
            <Link href="/blog" className="hover:text-emerald-700 transition-colors">
              {t.blog}
            </Link>
            <span className="mx-2 text-stone-300">/</span>
            <span
              className="text-stone-900 line-clamp-1 max-w-[200px] md:max-w-none font-medium truncate"
              aria-current="page"
            >
              {post.title}
            </span>
          </nav>

          <Button
            asChild
            variant="ghost"
            className="mb-4 pl-0 text-stone-500 hover:text-stone-900 hover:bg-transparent -ml-2"
          >
            <Link href="/blog">
              <ArrowLeft className="mr-2 w-4 h-4" /> {t.backToBlog}
            </Link>
          </Button>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none"
                >
                  {t.analysisBadge}
                </Badge>
                <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-none">
                  {t.tcmBadge}
                </Badge>
              </div>
              <BlogLanguageSwitcher />
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-6 text-stone-500 pt-4 border-t border-stone-100 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-serif font-bold overflow-hidden">
                  {authorProfile.avatar ? (
                    <img
                      src={authorProfile.avatar}
                      alt={authorProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (typeof post.author === "object" && post.author && "name" in post.author
                      ? (post.author as { name: string }).name[0]
                      : typeof post.author === "string"
                        ? post.author[0]
                        : "S") || "S"
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">{authorProfile.name}</p>
                  <p className="text-xs">{t.author}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-stone-200"></div>
              <div>
                <p className="text-sm font-medium text-stone-900">{post.date}</p>
                <p className="text-xs">{t.published}</p>
              </div>
              {post.readingTime && (
                <>
                  <div className="h-8 w-px bg-stone-200"></div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{post.readingTime}</p>
                    <p className="text-xs">Read Time</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 mx-auto max-w-6xl flex flex-col lg:flex-row gap-12">
        {/* Sidebar / TOC (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 transition-opacity">
          <div className="sticky top-24 space-y-8">
            {headings.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-stone-100 shadow-sm">
                <h4 className="font-serif font-bold text-stone-900 mb-4">{t.tableOfContents}</h4>
                <nav className="space-y-2">
                  {headings.map((heading, index) => (
                    <a
                      key={`${heading.id}-${index}`}
                      href={`#${heading.id}`}
                      className="block text-sm text-stone-600 hover:text-emerald-700 transition-colors line-clamp-1"
                    >
                      {heading.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}
            <div className="border border-emerald-100 bg-emerald-50 rounded-xl p-6">
              <h4 className="font-bold text-emerald-900 mb-2">{t.needCheck}</h4>
              <p className="text-sm text-emerald-800 mb-4">{t.promoDesc}</p>
              <Button
                asChild
                size="sm"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-full"
              >
                <Link href="/">{t.scanNow}</Link>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex-1 max-w-3xl min-w-0">
          {/* Inline TOC (Mobile) */}
          {headings.length > 0 && (
            <div className="lg:hidden bg-white rounded-xl p-6 border border-stone-100 shadow-sm mb-8">
              <h4 className="font-serif font-bold text-stone-900 mb-4">{t.inThisArticle}</h4>
              <nav className="space-y-2">
                {headings.map((heading, index) => (
                  <a
                    key={`${heading.id}-${index}`}
                    href={`#${heading.id}`}
                    className="block text-sm text-stone-600 hover:text-emerald-700 transition-colors"
                  >
                    {heading.title}
                  </a>
                ))}
              </nav>
            </div>
          )}

          <div className="prose prose-stone prose-lg max-w-none">
            {post.content && <MDXRemote source={post.content} components={components} />}
          </div>

          <SocialShare
            url={`https://sihat-tcm.vercel.app/blog/${params.slug}`}
            title={post.title || ""}
          />

          <AuthorBio author={authorProfile} lang={lang as "en" | "ms" | "zh"} />

          <Newsletter />

          {/* Related Posts */}
          <div className="pt-10 border-t border-stone-200">
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">{t.readMore}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}${lang !== "en" ? `?lang=${lang}` : ""}`}
                  className="group block"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-stone-100 h-full flex flex-col">
                    <div className="h-32 bg-stone-100 relative overflow-hidden">
                      {related.coverImage ? (
                        <img
                          src={related.coverImage}
                          alt={related.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center h-full text-stone-300"
                          role="img"
                          aria-label={`Placeholder for: ${related.title}`}
                        >
                          <span className="font-serif text-2xl">TCM</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-grow">
                      <h4 className="font-serif font-semibold text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
                        {related.title}
                      </h4>
                      <div className="text-xs text-stone-400">{related.date}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 pt-8 border-t border-stone-200">
            <div className="bg-emerald-50 rounded-2xl p-8 text-center">
              <h3 className="font-serif text-2xl font-bold text-emerald-900 mb-2">
                {t.promoTitle}
              </h3>
              <p className="text-emerald-800 mb-6 max-w-lg mx-auto">{t.promoDesc}</p>
              <Button
                asChild
                size="lg"
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full"
              >
                <Link href="/">{t.promoButton}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <FloatingShareButton
        url={`https://sihat-tcm.vercel.app/blog/${params.slug}`}
        title={post.title || ""}
      />
    </article>
  );
}
