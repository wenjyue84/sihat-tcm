import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const postsDirectory = path.join(process.cwd(), "src/content/blog");

export function getPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  const files = fs.readdirSync(postsDirectory);
  const slugs = new Set<string>();

  files.forEach((file) => {
    if (!file.endsWith(".mdx")) return;
    // Strip .mdx
    let slug = file.replace(/\.mdx$/, "");
    // Strip language suffix if present (e.g. .ms, .zh)
    // We assume the default (no suffix) or .en is English
    if (slug.endsWith(".ms")) slug = slug.replace(/\.ms$/, "");
    else if (slug.endsWith(".zh")) slug = slug.replace(/\.zh$/, "");
    else if (slug.endsWith(".en")) slug = slug.replace(/\.en$/, "");

    slugs.add(slug);
  });

  return Array.from(slugs);
}

// @REQUIRES_TRANSLATION: All new articles MUST be translated to 'ms' and 'zh'.
// This function is used by the Admin Dashboard to alert about missing translations.
export function checkMissingTranslations(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const files = fs.readdirSync(postsDirectory);
  const slugs = new Set<string>();

  files.forEach((file) => {
    if (!file.endsWith(".mdx")) return;
    let slug = file.replace(/\.mdx$/, "");
    if (slug.endsWith(".ms")) slug = slug.replace(/\.ms$/, "");
    else if (slug.endsWith(".zh")) slug = slug.replace(/\.zh$/, "");
    else if (slug.endsWith(".en")) slug = slug.replace(/\.en$/, "");
    slugs.add(slug);
  });

  const missingTranslations: string[] = [];
  slugs.forEach((slug) => {
    const hasMs = files.includes(`${slug}.ms.mdx`);
    const hasZh = files.includes(`${slug}.zh.mdx`);

    if (!hasMs) missingTranslations.push(`${slug} (Missing Malay .ms.mdx)`);
    if (!hasZh) missingTranslations.push(`${slug} (Missing Chinese .zh.mdx)`);
  });

  return missingTranslations;
}

export function getPostBySlug(slug: string, fields: string[] = [], lang: string = "en") {
  const realSlug = slug.replace(/\.mdx$/, "");

  // Determine which file to read
  // Priority: slug.lang.mdx -> slug.en.mdx -> slug.mdx
  let fullPath = path.join(postsDirectory, `${realSlug}.mdx`);

  if (lang && lang !== "en") {
    const langPath = path.join(postsDirectory, `${realSlug}.${lang}.mdx`);
    if (fs.existsSync(langPath)) {
      fullPath = langPath;
    }
  } else {
    // Check for .en.mdx explicitly if we want to support that naming convention too
    const enPath = path.join(postsDirectory, `${realSlug}.en.mdx`);
    if (fs.existsSync(enPath)) {
      fullPath = enPath;
    }
  }

  // If file doesn't exist (e.g. only .ms exists but .en requested, or vice versa default fallback)
  if (!fs.existsSync(fullPath)) {
    // Fallback to default .mdx if specific lang not found
    const defaultPath = path.join(postsDirectory, `${realSlug}.mdx`);
    if (fs.existsSync(defaultPath)) {
      fullPath = defaultPath;
    } else {
      // Try enabling fallback to ANY language? Probably better to just error or return empty
      // For now, let's assume at least one version exists if getPostSlugs found it.
    }
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // Properly typed blog post items
  type BlogPostItem = {
    slug?: string;
    content?: string;
    readingTime?: string;
    title?: string;
    date?: string;
    author?: string;
    coverImage?: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    [key: string]: unknown; // Allow other frontmatter fields
  };

  const items: BlogPostItem = {};

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = realSlug;
    }
    if (field === "content") {
      items[field] = content;
    }

    if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
  });

  // Always calculate reading time if content is available or requested
  if (fields.includes("readingTime") || fields.includes("content")) {
    const stats = readingTime(content);
    items["readingTime"] = stats.text;
  }

  return items;
}

export function getAllPosts(fields: string[] = [], lang: string = "en") {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields, lang))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}

export function getPaginatedPosts(
  fields: string[] = [],
  lang: string = "en",
  page: number = 1,
  limit: number = 6
) {
  const allPosts = getAllPosts(fields, lang);
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / limit);

  // Ensure page is valid
  const safePage = Math.max(1, Math.min(page, totalPages > 0 ? totalPages : 1));
  const offset = (safePage - 1) * limit;

  const posts = allPosts.slice(offset, offset + limit);

  return {
    posts,
    pagination: {
      currentPage: safePage,
      totalPages,
      totalPosts,
      limit,
    },
  };
}
