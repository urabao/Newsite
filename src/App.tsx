import { useState, useEffect, useCallback, useMemo, FormEvent } from "react";
import { Article } from "./types.js";
import { TAXONOMY } from "./categorizer";

const DEFAULT_CITY = "";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cityInput, setCityInput] = useState<string>(DEFAULT_CITY);
  const [activeCity, setActiveCity] = useState<string>(DEFAULT_CITY);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Reader state
  const [readerOpen, setReaderOpen] = useState<boolean>(false);
  const [readerArticle, setReaderArticle] = useState<Article | null>(null);
  const [readerContent, setReaderContent] = useState<any>(null);
  const [readerLoading, setReaderLoading] = useState<boolean>(false);

  // Time formatter helper
  const formatRelativeTime = useCallback((isoString: string): string => {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMs < 0 || diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${past.getDate()} ${months[past.getMonth()]}`;
  }, []);

  // Time elapsed ticker for the header
  const [timeElapsedText, setTimeElapsedText] = useState<string>("--");

  useEffect(() => {
    if (!lastFetched) {
      setTimeElapsedText("--");
      return;
    }

    const updateText = () => {
      setTimeElapsedText(formatRelativeTime(lastFetched));
    };

    updateText();
    const interval = setInterval(updateText, 30000); // update relative text every 30s
    return () => clearInterval(interval);
  }, [lastFetched, formatRelativeTime]);

  const fetchData = useCallback(async (targetCity: string) => {
    setIsLoading(true);
    setErrorStatus(null);
    try {
      // Parallel fetch using Promise.allSettled: national news, opinions, and local
      const fetchPromises: Promise<Response>[] = [
        fetch(`/api/news?category=all&limit=60`),
        fetch(`/api/opinions?limit=30`)
      ];

      let localResIndex = -1;
      if (targetCity) {
        localResIndex = fetchPromises.length;
        fetchPromises.push(fetch(`/api/local?city=${encodeURIComponent(targetCity)}&lang=en`));
      }

      const results = await Promise.allSettled(fetchPromises);

      let parsedNewsArticles: Article[] = [];
      let parsedOpinionArticles: Article[] = [];
      let parsedLocalArticles: Article[] = [];

      const newsRes = results[0];
      const opinionsRes = results[1];

      if (newsRes.status === "fulfilled" && newsRes.value.ok) {
        const json = await newsRes.value.json();
        if (json.success && Array.isArray(json.articles)) {
          parsedNewsArticles = json.articles;
        }
      }

      if (opinionsRes.status === "fulfilled" && opinionsRes.value.ok) {
        const json = await opinionsRes.value.json();
        if (json.success && Array.isArray(json.articles)) {
          parsedOpinionArticles = json.articles;
        }
      }

      if (localResIndex !== -1) {
        const localRes = results[localResIndex];
        if (localRes.status === "fulfilled" && localRes.value.ok) {
          const json = await localRes.value.json();
          if (json.success && Array.isArray(json.articles)) {
            parsedLocalArticles = json.articles;
          }
        }
      }

      if (parsedNewsArticles.length === 0 && parsedOpinionArticles.length === 0 && parsedLocalArticles.length === 0) {
        throw new Error("No economic, editorial, or political news feeds could be fetched at this time");
      }

      // Merge: national news first, opinions second, local last
      const merged = [...parsedNewsArticles, ...parsedOpinionArticles, ...parsedLocalArticles];
      setAllArticles(merged);
      setLastFetched(new Date().toISOString());
      setActiveCity(targetCity);
    } catch (err: any) {
      console.error("Error gathering feeds:", err);
      setErrorStatus(err.message || "Unable to parse feed resources. Check endpoint status.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // First-time load + 5-min intervals
  useEffect(() => {
    fetchData(DEFAULT_CITY);

    const interval = setInterval(() => {
      fetchData(activeCity);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchData, activeCity]);

  // Handle City submission
  const handleCitySubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = cityInput.trim();
    if (cleaned) {
      fetchData(cleaned);
    }
  };

  const getBadgeContent = useCallback((cat: string) => {
    if (cat === "general") return "◆ general";
    if (cat === "local") return "📍 local";
    const tax = TAXONOMY[cat as keyof typeof TAXONOMY];
    if (tax) return `${tax.emoji} ${tax.label.toLowerCase()}`;
    return `◆ ${cat}`;
  }, []);

  // Category filter mapping
  const filteredArticles = useMemo(() => {
    if (activeCategory === "all") {
      return allArticles;
    }
    return allArticles.filter(
      art => art.category === activeCategory || art.tags.includes(activeCategory)
    );
  }, [allArticles, activeCategory]);

  // Headline ticker generation (top 10 articles)
  const tickerText = useMemo(() => {
    const limitArticles = allArticles.slice(0, 10);
    if (limitArticles.length === 0) {
      return "INDIA PULSE — FETCHING LIVE ECONOMY, EDITORIALS, POLITICS & TOWN NEWS FEEDS...";
    }
    const titlesJoined = limitArticles.map(a => a.title.toUpperCase()).join(" — ◆ — ");
    return `${titlesJoined} — ◆ — ${titlesJoined}`;
  }, [allArticles]);

  const openReader = async (article: Article) => {
    setReaderOpen(true);
    setReaderArticle(article);
    setReaderContent(null);
    setReaderLoading(true);
    document.body.style.overflow = "hidden";

    try {
      const res = await fetch(`/api/article?url=${encodeURIComponent(article.url)}`);
      const data = await res.json();
      setReaderContent(data);
    } catch (err) {
      setReaderContent({
        success: false,
        originalUrl: article.url,
        archiveUrl: `https://12ft.io/${article.url}`,
        googleCacheUrl: `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(article.url)}`
      });
    } finally {
      setReaderLoading(false);
    }
  };

  const closeReader = () => {
    setReaderOpen(false);
    setReaderArticle(null);
    setReaderContent(null);
    document.body.style.overflow = "";
  };

  // Keyboard Escape to close reader
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && readerOpen) {
        closeReader();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readerOpen]);

  // Focus close button on open
  useEffect(() => {
    if (readerOpen) {
      setTimeout(() => {
        document.getElementById("reader-close")?.focus();
      }, 50);
    }
  }, [readerOpen]);

  return (
    <>
      {/* 6.1 LOADING SCREEN - Displays if isLoading & no articles have loaded yet */}
      {isLoading && allArticles.length === 0 && (
        <div id="loading-screen" role="progressbar">
          <div id="loading-ticker">INDIA PULSE — FETCHING LIVE DATA...</div>
          <div id="skeleton-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD */}
      <div id="dashboard" className={isLoading && allArticles.length === 0 ? "hidden" : ""}>
        {/* HEADER */}
        <header id="site-header">
          <div id="header-logo">
            INDIA<span>PULSE</span>
          </div>
          <div id="header-meta">
            <span id="last-updated">Updated {timeElapsedText}</span>
            <span id="article-count">{allArticles.length} articles parsed</span>
          </div>
          <form id="city-control" onSubmit={handleCitySubmit}>
            <label htmlFor="city-input">LOCAL NEWS FOR:</label>
            <input
              type="text"
              id="city-input"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Enter your city..."
            />
            <button type="submit" id="city-submit">
              GO
            </button>
          </form>
        </header>

        {/* CATEGORY FILTER BAR */}
        <nav id="filter-bar" aria-label="News sectors">
          <button
            className={`filter-btn ${activeCategory === "all" ? "active" : ""}`}
            data-category="all"
            onClick={() => setActiveCategory("all")}
          >
            ALL
          </button>
          {Object.entries(TAXONOMY).map(([key, item]) => (
            <button
              key={key}
              className={`filter-btn ${activeCategory === key ? "active" : ""}`}
              data-category={key}
              onClick={() => setActiveCategory(key)}
            >
              {item.emoji} {item.label.toUpperCase()}
            </button>
          ))}
          <button
            className={`filter-btn ${activeCategory === "local" ? "active" : ""}`}
            data-category="local"
            onClick={() => setActiveCategory("local")}
            disabled={!activeCity}
            aria-disabled={!activeCity}
          >
            📍 LOCAL
          </button>
        </nav>

        {/* HEADLINE NEWS TICKER BAR */}
        <div id="ticker-wrap">
          <span id="ticker-label">LIVE</span>
          <div id="ticker-content-container">
            <div id="ticker-content" aria-live="off">
              {tickerText}
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {errorStatus && (
          <div className="p-8 text-center bg-red-950/40 border-4 border-red-900 m-8 rounded-lg max-w-2xl mx-auto">
            <p className="font-mono text-medium text-red-400 mb-2">FEED HARVESTING FAILURE</p>
            <p className="font-body text-sm text-gray-400">{errorStatus}</p>
          </div>
        )}

        {/* MAIN MASONRY CONTENT GRID */}
        {!errorStatus && (
          <main id="news-grid">
            {filteredArticles.map((article, index) => {
              // Featured Card Logic: 
              // "The featured card is only applied to the first article AND only when STATE.activeCategory === 'all'"
              const isFeatured = index === 0 && activeCategory === "all" && !!article.imageUrl;

              return (
                <div
                  key={article.id}
                  className={`news-card ${isFeatured ? "featured" : ""}`}
                  data-category={article.category}
                  onClick={() => openReader(article)}
                >
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="card-image"
                      loading="lazy"
                    />
                  )}
                  <div className="card-body">
                    <div className="card-source-row">
                      <span className="flex items-center gap-2">
                        {article.publicationName || article.source}
                        {article.category === "opinions" && article.author && (
                          <>
                            &middot;{" "}
                            <span className="card-author">
                              BY {article.author.toUpperCase()}
                            </span>
                          </>
                        )}
                      </span>
                      <span className="card-time">{formatRelativeTime(article.publishedAt)}</span>
                    </div>

                    <div className="flex justify-start">
                      <span className="card-category-badge">
                        {getBadgeContent(article.category)}
                      </span>
                    </div>

                    <h2 className="card-title font-display text-gray-200">{article.title}</h2>

                    {article.summary && (
                      <p className="card-summary text-gray-400 font-body">
                        {article.summary}
                      </p>
                    )}

                    {article.tags && article.tags.length > 0 && (
                      <div className="card-tags">
                        {article.tags.slice(0, 3).map((tag, tIdx) => (
                          <span key={tIdx} className="card-tag font-mono">
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="card-read-more" aria-label={`Read ${article.title}`}>
                    READ ARTICLE ◆
                  </button>
                </div>
              );
            })}

            {filteredArticles.length === 0 && !isLoading && (
              <div className="text-center font-mono py-12 text-gray-500 max-w-md mx-auto">
                No matching articles currently active in category "{activeCategory.toUpperCase()}" for city [{activeCity.toUpperCase()}].
              </div>
            )}
          </main>
        )}

        {/* FOOTER */}
        <footer id="site-footer">
          <span>INDIA PULSE © 2026 — REAL-TIME PUBLIC RSS DEDUPLICATED AGGREGATIONS</span>
          <button id="refresh-btn" onClick={() => fetchData(activeCity)} disabled={isLoading}>
            {isLoading ? "REFRESHING..." : "↻ REFRESH"}
          </button>
        </footer>
      </div>

      {/* ARTICLE READER PANEL */}
      {readerOpen && readerArticle && (
        <>
          <div id="reader-overlay" onClick={closeReader} />
          <div
            id="reader-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Article Reader"
          >
            <div id="reader-header">
              <div id="reader-header-meta">
                <span id="reader-category-badge" className="card-category-badge">
                  {getBadgeContent(readerArticle.category)}
                </span>
                <span id="reader-source">
                  {readerArticle.publicationName || readerArticle.source}
                </span>
                <span id="reader-time">
                  {formatRelativeTime(readerArticle.publishedAt)}
                </span>
                {readerArticle.author && (
                  <span id="reader-author" className="card-author">
                    BY {readerArticle.author.toUpperCase()}
                  </span>
                )}
              </div>
              <h1 id="reader-title">{readerArticle.title}</h1>
              <button id="reader-close" aria-label="Close reader" onClick={closeReader}>
                ✕ CLOSE
              </button>
            </div>

            <div id="reader-body">
              {readerLoading && (
                <div id="reader-loading">
                  <div className="reader-skeleton-line wide"></div>
                  <div className="reader-skeleton-line"></div>
                  <div className="reader-skeleton-line wide"></div>
                  <div className="reader-skeleton-line narrow"></div>
                  <div className="reader-skeleton-line wide"></div>
                  <div className="reader-skeleton-line"></div>
                </div>
              )}

              {!readerLoading && readerContent && (
                <div id="reader-content">
                  {readerContent.success === false ? (
                    <>
                      <div
                        id="reader-error"
                        className="font-mono p-4 mb-4 bg-red-950/40 border-2 border-red-900 text-red-400 rounded-lg text-sm"
                      >
                        Could not load article.
                      </div>
                      <div id="reader-links-block" className="flex flex-wrap gap-4 mt-4">
                        <a
                          href={readerContent.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reader-action-btn primary"
                        >
                          READ ON SITE →
                        </a>
                        <a
                          href={readerContent.archiveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reader-action-btn"
                        >
                          TRY 12FT.IO →
                        </a>
                        <a
                          href={readerContent.googleCacheUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reader-action-btn"
                        >
                          GOOGLE CACHE →
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Paywall scenario */}
                      {readerContent.paywalled === true && (
                        <>
                          {readerContent.bodyText &&
                            readerContent.bodyText.split("\n\n").map((p: string, idx: number) => (
                              <p key={idx}>{p}</p>
                            ))}
                          <div id="reader-paywall-block" className="rounded-lg p-6 bg-zinc-900 border-4 border-black text-center my-6">
                            <div id="reader-paywall-icon" className="text-4xl mb-4">🔒</div>
                            <p id="reader-paywall-message" className="font-display text-xl text-white mb-6">
                              This article requires a subscription to read in full.
                            </p>
                            <div id="reader-paywall-actions" className="flex flex-wrap justify-center gap-4 mb-6">
                              <a
                                id="reader-link-original"
                                href={readerContent.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reader-action-btn primary"
                              >
                                READ ON SITE →
                              </a>
                              <a
                                id="reader-link-12ft"
                                href={readerContent.archiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reader-action-btn"
                              >
                                TRY 12FT.IO →
                              </a>
                              <a
                                id="reader-link-cache"
                                href={readerContent.googleCacheUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reader-action-btn"
                              >
                                GOOGLE CACHE →
                              </a>
                            </div>
                            <p id="reader-paywall-note" className="font-mono text-[10px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                              12ft.io attempts to bypass soft paywalls. Not guaranteed. For
                              full access, consider supporting the publication.
                            </p>
                          </div>
                        </>
                      )}

                      {/* Free full text scenario */}
                      {readerContent.paywalled === false && readerContent.bodyText && (
                        <>
                          {readerContent.heroImage && (
                            <img
                              src={readerContent.heroImage}
                              alt="Hero Image"
                              className="w-full border-4 border-black rounded-lg mb-6 max-h-96 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {readerContent.bodyText.split("\n\n").map((p: string, idx: number) => (
                            <p key={idx}>{p}</p>
                          ))}
                          <div id="reader-links-block" className="flex items-center justify-between border-t-2 border-dashed border-zinc-800 pt-6 mt-6">
                            <a
                              href={readerContent.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="reader-action-btn primary"
                            >
                              OPEN ORIGINAL →
                            </a>
                            <span id="reader-word-count" className="font-mono text-xs text-zinc-500">
                              {readerContent.wordCount} words &middot; ~
                              {Math.ceil(readerContent.wordCount / 200)} min read
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
