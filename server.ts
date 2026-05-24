import express from "express";
import path from "path";
import crypto from "crypto";
import Parser from "rss-parser";
import { createServer as createViteServer } from "vite";
import { categorizeArticle } from "./src/categorizer.js";
import { Article } from "./src/types.js";

const app = express();
const PORT = 3000;

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"]
    ]
  }
});

async function safeParseURL(urlStr: string): Promise<any> {
  const response = await fetch(urlStr, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml, */*"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let xmlText = await response.text();
  
  // Strip control characters except tab, CR, LF
  xmlText = xmlText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  
  // HTML tags inside XML that aren't CDATA escaped often break strict XML parsers 
  // with "Attribute without value" or "Invalid attribute name" (like `<img src=... nowrap>`).
  // We conservatively remove img, iframe, script tags before parsing to salvage the feed.
  xmlText = xmlText.replace(/<img[^>]*>/gi, "");
  xmlText = xmlText.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "");
  xmlText = xmlText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  
  // Fix unescaped ampersands safely
  xmlText = xmlText.replace(/&(?!(?:apos|quot|amp|lt|gt|#x[0-9a-fA-F]+|#[0-9]+);)/g, '&amp;');
  
  return await parser.parseString(xmlText);
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
  "by", "of", "is", "are", "was", "were", "to", "be", "has", "have", "had", "it",
  "its", "as", "from", "into", "this", "that", "these", "those"
]);

function getWords(title: string): Set<string> {
  const clean = title.toLowerCase().replace(/[^\w\s]/g, "");
  const words = clean.split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w));
  return new Set(words);
}

function titlesShareMoreThan70Percent(title1: string, title2: string): boolean {
  const words1 = getWords(title1);
  const words2 = getWords(title2);
  if (words1.size === 0 || words2.size === 0) return false;

  let common = 0;
  for (const w of words1) {
    if (words2.has(w)) {
      common++;
    }
  }

  const score = common / Math.min(words1.size, words2.size);
  return score > 0.70;
}

function getSha256Id(title: string, pubDate: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(title + pubDate);
  return hash.digest("hex").substring(0, 12);
}

function cleanSummary(text: string): string {
  if (!text) return "";
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  const decoded = stripped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");
  
  if (decoded.length <= 280) return decoded;
  return decoded.substring(0, 277) + "...";
}

function getHostname(urlStr: string, fallback: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname;
  } catch (e) {
    return fallback;
  }
}

function getImageUrl(item: any): string | null {
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  if (item["media:content"] && item["media:content"].$ && item["media:content"].$.url) {
    return item["media:content"].$.url;
  }
  const htmlContent = item.content || item.description || "";
  const match = htmlContent.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

const FEEDS = [
  // ECONOMY / NATIONAL
  { url: "https://feeds.feedburner.com/ndtvnews-business", defaultCategory: "economy" },
  { url: "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms", defaultCategory: "economy" },
  { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", defaultCategory: "economy" },
  { url: "https://www.thehindubusinessline.com/feeder/default.rss", defaultCategory: "economy" },
  { url: "https://www.livemint.com/rss/markets", defaultCategory: "economy" },
  
  // POLITICS
  { url: "https://feeds.feedburner.com/ndtvnews-india-news", defaultCategory: "politics" },
  { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", defaultCategory: "politics" },
  { url: "https://www.thehindu.com/news/national/feeder/default.rss", defaultCategory: "politics" },
  
  // POWER / ENERGY
  { url: "https://economictimes.indiatimes.com/industry/energy/power/rssfeeds/13358319.cms", defaultCategory: "power" },
  { url: "https://www.power-technology.com/feed/", defaultCategory: "power" },
  
  // TECHNOLOGY
  { url: "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms", defaultCategory: "tech" },
  { url: "https://feeds.feedburner.com/gadgets360-latest", defaultCategory: "tech" },
  
  // OIL & GAS
  { url: "https://economictimes.indiatimes.com/industry/energy/oil-gas/rssfeeds/13358320.cms", defaultCategory: "oil" }
];

// 4.3 Health Check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

import opinionsHandler from "./api/opinions.js";
app.get("/api/opinions", async (req, res) => {
  await opinionsHandler(req, res);
});

import articleHandler from "./api/article.js";
app.get("/api/article", async (req, res) => {
  await articleHandler(req, res);
});

// 4.1 api/news.js — Primary Feed Aggregator
app.get("/api/news", async (req, res) => {
  try {
    const filterCategory = (req.query.category as string || "all").toLowerCase();
    const limit = parseInt(req.query.limit as string || "40", 10);
    const maxLimit = Math.min(limit, 80);

    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const parsed = await safeParseURL(feed.url);
        return {
          items: parsed.items || [],
          sourceTitle: parsed.title || getHostname(feed.url, "Unknown Source")
        };
      } catch (err) {
        console.error(`Failed to fetch and parse feed ${feed.url}:`, err);
        return { items: [], sourceTitle: "" };
      }
    });

    const results = await Promise.allSettled(feedPromises);
    let allArticles: Article[] = [];

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        const feedSource = FEEDS[idx];
        const { items } = result.value;

        items.forEach((item: any) => {
          const title = (item.title || "").substring(0, 120).trim();
          if (!title) return;

          const summaryText = item.contentSnippet || item.content || item.description || "";
          const summary = cleanSummary(summaryText);
          const url = item.link || item.guid || "";
          
          const rawPubDate = item.isoDate || item.pubDate || new Date().toISOString();
          const publishedAt = new Date(rawPubDate).toISOString();

          const source = getHostname(url, getHostname(feedSource.url, "news"));
          const id = getSha256Id(title, publishedAt);
          const imageUrl = getImageUrl(item);

          // Apply classification taxonomy
          const classification = categorizeArticle(title, summary);

          allArticles.push({
            id,
            title,
            summary,
            url,
            source,
            publishedAt,
            imageUrl,
            tags: classification.tags,
            category: classification.category
          });
        });
      }
    });

    // Deduplicate by ID
    const uniqueMap = new Map<string, Article>();
    allArticles.forEach(art => {
      if (!uniqueMap.has(art.id)) {
        uniqueMap.set(art.id, art);
      }
    });
    let uniqueArticles = Array.from(uniqueMap.values());

    // Sort by publishedAt descending
    uniqueArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Fuzzy-deduplicate (if two titles share >70% of words, keep the newer one)
    const filteredUnique: Article[] = [];
    for (const art of uniqueArticles) {
      let isDuplicate = false;
      for (const existing of filteredUnique) {
        if (titlesShareMoreThan70Percent(art.title, existing.title)) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        filteredUnique.push(art);
      }
    }

    // Filter by requested category if not "all"
    let responseArticles = filteredUnique;
    if (filterCategory !== "all") {
      responseArticles = filteredUnique.filter(
        art => art.category === filterCategory || art.tags.includes(filterCategory)
      );
    }

    // Slice to limit
    responseArticles = responseArticles.slice(0, maxLimit);

    res.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.json({
      success: true,
      fetchedAt: new Date().toISOString(),
      totalArticles: responseArticles.length,
      category: filterCategory,
      articles: responseArticles
    });
  } catch (err: any) {
    console.error("Master aggregator error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal aggregations error",
      articles: []
    });
  }
});

// 4.2 api/local.js — Local Town News Endpoint
app.get("/api/local", async (req, res) => {
  try {
    const city = (req.query.city as string || "Surat").trim();
    if (!city) {
      return res.status(400).json({
        success: false,
        error: "City is required",
        articles: []
      });
    }
    const lang = (req.query.lang as string || "en").toLowerCase();

    const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(city)}+India+local&hl=${lang}-IN&gl=IN&ceid=IN:${lang}`;
    
    const parsed = await safeParseURL(googleNewsUrl);
    const articles: Article[] = (parsed.items || []).map((item: any) => {
      const title = (item.title || "").substring(0, 120).trim();
      const summaryText = item.contentSnippet || item.content || item.description || "";
      const summary = cleanSummary(summaryText);
      const url = item.link || item.guid || "";
      const rawPubDate = item.isoDate || item.pubDate || new Date().toISOString();
      const publishedAt = new Date(rawPubDate).toISOString();
      const id = getSha256Id(title, publishedAt);
      const source = getHostname(url, "news.google.com");
      const imageUrl = getImageUrl(item);

      return {
        id,
        title,
        summary,
        url,
        source,
        publishedAt,
        imageUrl,
        tags: [city, "local"],
        category: "local"
      };
    });

    // Sort by pubDate descending
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const resultSlice = articles.slice(0, 20);

    res.set("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
    res.json({
      success: true,
      fetchedAt: new Date().toISOString(),
      totalArticles: resultSlice.length,
      category: "local",
      city,
      lang,
      articles: resultSlice
    });
  } catch (err: any) {
    console.error("Local news aggregation error:", err);
    res.json({
      success: false,
      error: err.message || "Failed to fetch local news aggregator",
      articles: []
    });
  }
});

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

bootstrap();
