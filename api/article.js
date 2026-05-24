import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const originalUrl = req.query.url ? decodeURIComponent(req.query.url) : null;
    if (!originalUrl || !originalUrl.startsWith("https://")) {
      return res.status(400).json({ success: false, error: "Invalid URL", paywalled: false });
    }

    const archiveUrl = "https://12ft.io/" + originalUrl;
    const googleCacheUrl = "https://webcache.googleusercontent.com/search?q=cache:" + encodeURIComponent(originalUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(originalUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.google.com/'
        }
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      return res.status(200).json({
        success: false,
        paywalled: false,
        error: "Could not reach article",
        originalUrl,
        archiveUrl,
        googleCacheUrl
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        paywalled: false,
        error: "Could not reach article",
        originalUrl,
        archiveUrl,
        googleCacheUrl
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove fluff
    $('script, style, nav, header, footer, aside, iframe, noscript, .ad, .advertisement, .paywall, .subscription-wall, .newsletter-signup, #comments').remove();

    const selectors = [
      'article[class*="article"] p',
      'div[class*="article-body"] p',
      'div[class*="story-body"] p',
      'div[class*="content-body"] p',
      'div[class*="article-content"] p',
      '.article__body p',
      '.story__body p',
      'main p',
      'article p'
    ];

    let pElements = null;
    for (const selector of selectors) {
      const match = $(selector);
      if (match.length > 0) {
        pElements = match;
        break;
      }
    }

    let bodyText = "";
    if (pElements) {
      const texts = [];
      pElements.each((_, el) => {
        const text = $(el).text().trim();
        if (text) texts.push(text);
      });
      bodyText = texts.join("\n\n");
    }

    // Title
    let title = $('h1').first().text().trim();
    if (!title) {
        title = $('title').first().text().split('|')[0].split('-')[0].trim();
    }

    // Author
    let author = $('[class*="author"], [rel="author"], [itemprop="author"]').first().text().trim() || null;

    // Published date
    let publishedAt = $('[itemprop="datePublished"], [class*="publish-date"], time').first().attr('datetime') || 
                      $('[itemprop="datePublished"], [class*="publish-date"], time').first().text().trim() || null;

    // Hero image
    let heroImage = $('[class*="article"] img').first().attr('src') || $('img').first().attr('src') || null;

    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
    let paywalled = wordCount < 150;

    const lowerHtml = html.toLowerCase();
    const paywallKeywords = [
      "subscribe to continue", "subscription required", "sign in to read", 
      "premium article", "already a subscriber", "unlock this story"
    ];
    for (const kw of paywallKeywords) {
      if (lowerHtml.includes(kw)) {
        paywalled = true;
        break;
      }
    }

    if (paywalled && wordCount < 80) {
      bodyText = null;
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      paywalled,
      title,
      author,
      publishedAt,
      heroImage,
      bodyText,
      wordCount,
      originalUrl,
      archiveUrl,
      googleCacheUrl
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      paywalled: false,
      error: "Could not reach article",
      originalUrl: req.query.url || "",
      archiveUrl: "https://12ft.io/" + (req.query.url || ""),
      googleCacheUrl: "https://webcache.googleusercontent.com/search?q=cache:" + encodeURIComponent(req.query.url || "")
    });
  }
}
