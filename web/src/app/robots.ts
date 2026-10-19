// web/src/app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/format";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/search"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}