import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/test-*', '/credentials'],
        },
        sitemap: 'https://sihat-tcm.vercel.app/sitemap.xml',
    };
}
