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

const TAXONOMY = {
  power: {
    keywords: [
      "NTPC", "power grid", "electricity", "solar", "wind energy", "renewable",
      "coal plant", "thermal", "hydropower", "transmission", "distribution",
      "SECI", "NHPC", "Adani Green", "Tata Power", "power sector", "MW", "GW",
      "load shedding", "blackout", "energy transition", "green hydrogen",
      "power purchase agreement", "PPA", "discoms", "CERC", "peak demand"
    ],
    weight: 2
  },
  oil: {
    keywords: [
      "ONGC", "oil", "gas", "petroleum", "crude", "refinery", "LNG", "CNG",
      "petrol", "diesel", "fuel", "IOC", "HPCL", "BPCL", "Reliance Industries",
      "pipeline", "LPG", "natural gas", "offshore", "drilling", "barrel",
      "hydrocarbon", "upstream", "downstream", "oil ministry"
    ],
    weight: 2
  },
  tech: {
    keywords: [
      "startup", "AI", "artificial intelligence", "software", "IT sector",
      "Infosys", "TCS", "Wipro", "HCL", "fintech", "edtech", "SaaS",
      "semiconductor", "chip", "digital India", "UPI", "NPCI", "app",
      "cybersecurity", "data center", "cloud", "5G", "tech layoffs",
      "unicorn", "funding round", "Series A", "IPO tech", "deeptech"
    ],
    weight: 2
  },
  banking: {
    keywords: [
      "RBI", "repo rate", "inflation", "CPI", "GDP", "fiscal deficit",
      "SBI", "HDFC", "ICICI", "Axis Bank", "NPA", "bad loans", "credit",
      "monetary policy", "interest rate", "loan", "EMI", "mutual fund",
      "SEBI", "stock market", "Sensex", "Nifty", "BSE", "NSE",
      "FDI", "FII", "rupee", "forex", "bond yield", "T-bill"
    ],
    weight: 2
  },
  politics: {
    keywords: [
      "BJP", "Congress", "Modi", "Rahul Gandhi", "election", "parliament",
      "Lok Sabha", "Rajya Sabha", "CM", "chief minister", "governor",
      "cabinet", "minister", "policy", "government", "ordinance", "bill passed",
      "AAP", "TMC", "Kejriwal", "Yogi", "coalition", "NDA", "INDIA alliance",
      "budget", "vote", "constituency", "bypolls", "assembly"
    ],
    weight: 2
  },
  infrastructure: {
    keywords: [
      "highway", "expressway", "NHAI", "metro", "railway", "Indian Railways",
      "airport", "port", "smart city", "housing", "real estate", "PMAY",
      "infrastructure", "road", "bridge", "tunnel", "construction",
      "L&T", "Adani Ports", "JNPT", "logistics", "supply chain"
    ],
    weight: 1
  }
};

function categorizeArticle(title, summary) {
  const text = (title + " " + summary).toLowerCase();
  const scores = {};
  for (const [category, config] of Object.entries(TAXONOMY)) {
    scores[category] = 0;
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category] += config.weight;
      }
    }
  }
  const topCategory = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];
  
  const assignedCategory = topCategory && topCategory[1] > 0 ? topCategory[0] : "general";
  
  const tags = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .map(([cat]) => cat);

  return { category: assignedCategory, tags };
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
  "by", "of", "is", "are", "was", "were", "to", "be", "has", "have", "had", "it",
  "its", "as", "from", "into", "this", "that", "these", "those"
]);

function getWords(title) {
  const clean = title.toLowerCase().replace(/[^\w\s]/g, "");
  return new Set(clean.split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w)));
}

function titlesShareMoreThan70Percent(title1, title2) {
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

const FEEDS = [
  { url: "https://feeds.feedburner.com/ndtvnews-business", defaultCategory: "economy" },
  { url: "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms", defaultCategory: "economy" },
  { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", defaultCategory: "economy" },
  { url: "https://www.thehindubusinessline.com/feeder/default.rss", defaultCategory: "economy" },
  { url: "https://www.livemint.com/rss/markets", defaultCategory: "economy" },
  { url: "https://feeds.feedburner.com/ndtvnews-india-news", defaultCategory: "politics" },
  { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", defaultCategory: "politics" },
  { url: "https://www.thehindu.com/news/national/feeder/default.rss", defaultCategory: "politics" },
  { url: "https://economictimes.indiatimes.com/industry/energy/power/rssfeeds/13358319.cms", defaultCategory: "power" },
  { url: "https://www.power-technology.com/feed/", defaultCategory: "power" },
  { url: "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms", defaultCategory: "tech" },
  { url: "https://feeds.feedburner.com/gadgets360-latest", defaultCategory: "tech" },
  { url: "https://economictimes.indiatimes.com/industry/energy/oil-gas/rssfeeds/13358320.cms", defaultCategory: "oil" }
];

export default async function handler(req, res) {
  try {
    const filterCategory = (req.query.category || "all").toLowerCase();
    const limit = parseInt(req.query.limit || "40", 10);
    const maxLimit = Math.min(limit, 80);

    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const parsed = await safeParseURL(feed.url);
        return { items: parsed.items || [] };
      } catch (err) {
        return { items: [] };
      }
    });

    const results = await Promise.allSettled(feedPromises);
    let allArticles = [];

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        const feedSource = FEEDS[idx];
        const { items } = result.value;

        items.forEach((item) => {
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

    const uniqueMap = new Map();
    allArticles.forEach(art => {
      if (!uniqueMap.has(art.id)) {
        uniqueMap.set(art.id, art);
      }
    });
    let uniqueArticles = Array.from(uniqueMap.values());

    uniqueArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const filteredUnique = [];
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

    let responseArticles = filteredUnique;
    if (filterCategory !== "all") {
      responseArticles = filteredUnique.filter(
        art => art.category === filterCategory || art.tags.includes(filterCategory)
      );
    }

    responseArticles = responseArticles.slice(0, maxLimit);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({
      success: true,
      fetchedAt: new Date().toISOString(),
      totalArticles: responseArticles.length,
      category: filterCategory,
      articles: responseArticles
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Internal aggregations error",
      articles: []
    });
  }
}
