import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/content/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sihat-tcm.vercel.app";
  const lastModified = new Date();
  const supportedLanguages = ["en", "ms", "zh"] as const;

  // Get all blog posts
  const posts = getAllPosts(["slug", "date"]);

  // Generate blog URLs for all languages
  const blogUrls: MetadataRoute.Sitemap = posts.flatMap((post) =>
    supportedLanguages.map((lang) => ({
      url:
        lang === "en"
          ? `${baseUrl}/blog/${post.slug}`
          : `${baseUrl}/blog/${post.slug}?lang=${lang}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: lang === "en" ? 0.7 : 0.6, // Primary language has slightly higher priority
    }))
  );

  // Generate blog index URLs for all languages
  const blogIndexUrls: MetadataRoute.Sitemap = supportedLanguages.map((lang) => ({
    url: lang === "en" ? `${baseUrl}/blog` : `${baseUrl}/blog?lang=${lang}`,
    lastModified,
    changeFrequency: "daily" as const,
    priority: lang === "en" ? 0.8 : 0.7,
  }));

  // Static public pages only (no auth-protected pages like /patient, /doctor)
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    // Note: /login is kept as it's a public entry point, but with low priority
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  return [...staticUrls, ...blogIndexUrls, ...blogUrls];
}
