import type { MetadataRoute } from "next";

const siteUrl = "https://priceai.cc";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/official-prices", "/api-models", "/api-transit", "/products/", "/platforms/", "/guides/"],
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
