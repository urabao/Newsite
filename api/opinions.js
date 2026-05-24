import Parser from "rss-parser";
import crypto from "crypto";

const parser = new Parser({
  customFields: {
    item: ['dc:creator', 'author', 'media:content', 'enclosure']
  }
});

const OPINION_FEEDS = [
  "https://www.thehindu.com/opinion/feeder/default.rss",
  "https://www.thehindu.com/opinion/editorial/feeder/default.rss",
  "https://www.thehindu.com/opinion/lead/feeder/default.rss",
  "https://economictimes.indiatimes.com/opinion/rssfeeds/897228639.cms",
  "https://www.livemint.com/rss/opinion",
  "https://www.business-standard.com/rss/opinion-columnists-7.rss",
  "https://indianexpress.com/section/opinion/feed/",
  "https://theprint.in/category/opinion/feed/",
  "https://thewire.in/category/opinion/feed",
  "https://www.hindustantimes.com/feeds/rss/opinion/rssfeed.xml"
];

const PUBLICATION_MAP = {
  'thehindu.com': 'The Hindu',
  'economictimes.indiatimes.com': 'Economic Times',
  'livemint.com': 'Mint',
  'business-standard.com': 'Business Standard',
  'indianexpress.com': 'Indian Express',
  'theprint.in': 'The Print',
  'thewire.in': 'The Wire',
  'hindustantimes.com': 'Hindustan Times'
};

const TAXONOMY = {
  power: { keywords: ["NTPC", "power grid", "electricity", "solar", "wind energy", "renewable", "coal plant", "thermal", "hydropower", "transmission", "distribution", "SECI", "NHPC", "Adani Green", "Tata Power", "power sector", "MW", "GW", "load shedding", "blackout", "energy transition", "green hydrogen", "power purchase agreement", "PPA", "discoms", "CERC", "peak demand"], weight: 2 },
  oil: { keywords: ["ONGC", "oil", "gas", "petroleum", "crude", "refinery", "LNG", "CNG", "petrol", "diesel", "fuel", "IOC", "HPCL", "BPCL", "Reliance Industries", "pipeline", "LPG", "natural gas", "offshore", "drilling", "barrel", "hydrocarbon", "upstream", "downstream", "oil ministry"], weight: 2 },
  tech: { keywords: ["startup", "AI", "artificial intelligence", "software", "IT sector", "Infosys", "TCS", "Wipro", "HCL", "fintech", "edtech", "SaaS", "semiconductor", "chip", "digital India", "UPI", "NPCI", "app", "cybersecurity", "data center", "cloud", "5G", "tech layoffs", "unicorn", "funding round", "Series A", "IPO tech", "deeptech"], weight: 2 },
  banking: { keywords: ["RBI", "repo rate", "inflation", "CPI", "GDP", "fiscal deficit", "SBI", "HDFC", "ICICI", "Axis Bank", "NPA", "bad loans", "credit", "monetary policy", "interest rate", "loan", "EMI", "mutual fund", "SEBI", "stock market", "Sensex", "Nifty", "BSE", "NSE", "FDI", "FII", "rupee", "forex", "bond yield", "T-bill"], weight: 2 },
  politics: { keywords: ["BJP", "Congress", "Modi", "Rahul Gandhi", "election", "parliament", "Lok Sabha", "Rajya Sabha", "CM", "chief minister", "governor", "cabinet", "minister", "policy", "government", "ordinance", "bill passed", "AAP", "TMC", "Kejriwal", "Yogi", "coalition", "NDA", "INDIA alliance", "budget", "vote", "constituency", "bypolls", "assembly"], weight: 2 },
  infrastructure: { keywords: ["highway", "expressway", "NHAI", "metro", "railway", "Indian Railways", "airport", "port", "smart city", "housing", "real estate", "PMAY", "infrastructure", "road", "bridge", "tunnel", "construction", "L&T", "Adani Ports", "JNPT", "logistics", "supply chain"], weight: 1 }
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
  return Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .map(([cat]) => cat);
}

function getHostname(urlStr) {
  try {
    const url = new URL(urlStr);
    let host = url.hostname;
    if (host.startsWith('www.')) host = host.substring(4);
    return host;
  } catch (e) {
    return "";
  }
}

async function safeParseURL(urlStr) {
  const response = await fetch(urlStr, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "application/rss+xml, application/xml, text/xml, */*"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let xmlText = await response.text();
  xmlText = xmlText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  xmlText = xmlText.replace(/<img[^>]*>/gi, "");
  xmlText = xmlText.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "");
  xmlText = xmlText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
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
  if (match && match[1]) return match[1];
  return null;
}

export default async function handler(req, res) {
  try {
    const limitUrlStr = req.query.limit || "30";
    const limit = Math.min(parseInt(limitUrlStr, 10), 60);

    const feedPromises = OPINION_FEEDS.map(async (feedUrl) => {
      try {
        const parsed = await safeParseURL(feedUrl);
        return { items: parsed.items || [], feedUrl };
      } catch (err) {
        return { items: [], feedUrl };
      }
    });

    const results = await Promise.allSettled(feedPromises);
    let allArticles = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { items, feedUrl } = result.value;

        items.forEach((item) => {
          const title = (item.title || "").substring(0, 120).trim();
          if (!title) return;

          const summaryText = item.contentSnippet || item.content || item.description || "";
          const summary = cleanSummary(summaryText);
          const url = item.link || item.guid || "";
          const rawPubDate = item.isoDate || item.pubDate || new Date().toISOString();
          const publishedAt = new Date(rawPubDate).toISOString();
          
          let host = getHostname(url) || getHostname(feedUrl);
          const publicationName = PUBLICATION_MAP[host] || host;

          const id = getSha256Id(title, publishedAt);
          const imageUrl = getImageUrl(item);
          const author = item['dc:creator'] || item.author || null;

          const extraTags = categorizeArticle(title, summary);
          const tags = [...new Set(["opinion", ...extraTags])];

          allArticles.push({
            id,
            title,
            summary,
            url,
            source: host,
            publicationName,
            author,
            publishedAt,
            imageUrl,
            tags,
            category: "opinions"
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

    const responseArticles = uniqueArticles.slice(0, limit);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.status(200).json({
      success: true,
      fetchedAt: new Date().toISOString(),
      totalArticles: responseArticles.length,
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
