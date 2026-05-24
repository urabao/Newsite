import Parser from "rss-parser";
import crypto from "crypto";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"]
    ]
  }
});

async function safeParseURL(urlStr) {
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

function getSha256Id(title, pubDate) {
  return crypto.createHash("sha256")
    .update(title + pubDate)
    .digest("hex")
    .substring(0, 12);
}

function cleanSummary(text) {
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

function getHostname(urlStr, fallback) {
  try {
    const url = new URL(urlStr);
    return url.hostname;
  } catch (e) {
    return fallback;
  }
}

function getImageUrl(item) {
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

export default async function handler(req, res) {
  try {
    const city = (req.query.city || "").trim();
    if (!city) {
      return res.status(200).json({
        success: true,
        fetchedAt: new Date().toISOString(),
        totalArticles: 0,
        category: "local",
        city: "",
        lang: "en",
        articles: []
      });
    }
    const lang = (req.query.lang || "en").toLowerCase();

    const cityQuery = `"${city}" local news OR "${city}" municipal OR "${city}" district`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(cityQuery)}&hl=${lang}-IN&gl=IN&ceid=IN:${lang}`;

    const bizQuery = `"${city}" business OR "${city}" industry OR "${city}" economy OR "${city}" investment`;
    const bizUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(bizQuery)}&hl=${lang}-IN&gl=IN&ceid=IN:${lang}`;

    const [parsedLocal, parsedBiz] = await Promise.all([
      safeParseURL(url).catch(() => ({ items: [] })),
      safeParseURL(bizUrl).catch(() => ({ items: [] }))
    ]);

    const allItems = [...(parsedLocal.items || []), ...(parsedBiz.items || [])];
    
    // Deduplicate by URL
    const uniqueMap = new Map();
    const articles = [];

    for (const item of allItems) {
      if (!item.title) continue;
      
      const itemUrl = item.link || item.guid || "";
      if (uniqueMap.has(itemUrl)) continue;
      uniqueMap.set(itemUrl, true);

      const title = item.title.substring(0, 120).trim();
      const summaryText = item.contentSnippet || item.content || item.description || "";
      const summary = cleanSummary(summaryText);
      const rawPubDate = item.isoDate || item.pubDate || new Date().toISOString();
      const publishedAt = new Date(rawPubDate).toISOString();
      const id = getSha256Id(title, publishedAt);
      const source = getHostname(itemUrl, "news.google.com");
      const imageUrl = getImageUrl(item);

      articles.push({
        id,
        title,
        summary,
        url: itemUrl,
        source,
        publishedAt,
        imageUrl,
        tags: [city, "local"],
        category: "local"
      });
    }

    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const resultSlice = articles.slice(0, 25);

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
    res.status(200).json({
      success: true,
      fetchedAt: new Date().toISOString(),
      totalArticles: resultSlice.length,
      category: "local",
      city,
      lang,
      articles: resultSlice
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      error: err.message || "Failed to fetch local news",
      articles: []
    });
  }
}
