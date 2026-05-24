import { useState, useEffect, useCallback, useMemo, FormEvent } from "react";
import { Article } from "./types.js";

const DEFAULT_CITY = "Surat";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cityInput, setCityInput] = useState<string>(DEFAULT_CITY);
  const [activeCity, setActiveCity] = useState<string>(DEFAULT_CITY);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

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
      // Parallel fetch using Promise.allSettled
      const [newsRes, localRes] = await Promise.allSettled([
        fetch(`/api/news?category=all&limit=60`),
        fetch(`/api/local?city=${encodeURIComponent(targetCity)}&lang=en`)
      ]);

      let parsedNewsArticles: Article[] = [];
      let parsedLocalArticles: Article[] = [];

      if (newsRes.status === "fulfilled" && newsRes.value.ok) {
        const json = await newsRes.value.json();
        if (json.success && Array.isArray(json.articles)) {
          parsedNewsArticles = json.articles;
        }
      } else {
        console.error("Failed to parse standard news aggregators");
      }

      if (localRes.status === "fulfilled" && localRes.value.ok) {
        const json = await localRes.value.json();
        if (json.success && Array.isArray(json.articles)) {
          parsedLocalArticles = json.articles;
        }
      } else {
        console.error("Failed to parse local news aggregator");
      }

      if (parsedNewsArticles.length === 0 && parsedLocalArticles.length === 0) {
        throw new Error("No economic or political news feeds could be fetched at this time");
      }

      // Merge results: local articles appended at the end
      const merged = [...parsedNewsArticles, ...parsedLocalArticles];
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
      return "INDIA PULSE — FETCHING LIVE ECONOMY, TECH, POLITICS & TOWN NEWS FEEDS...";
    }
    const titlesJoined = limitArticles.map(a => a.title.toUpperCase()).join(" — ◆ — ");
    return `${titlesJoined} — ◆ — ${titlesJoined}`;
  }, [allArticles]);

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
              placeholder="Surat"
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
          <button
            className={`filter-btn ${activeCategory === "power" ? "active" : ""}`}
            data-category="power"
            onClick={() => setActiveCategory("power")}
          >
            ⚡ POWER
          </button>
          <button
            className={`filter-btn ${activeCategory === "oil" ? "active" : ""}`}
            data-category="oil"
            onClick={() => setActiveCategory("oil")}
          >
            🛢 OIL & GAS
          </button>
          <button
            className={`filter-btn ${activeCategory === "tech" ? "active" : ""}`}
            data-category="tech"
            onClick={() => setActiveCategory("tech")}
          >
            💻 TECH
          </button>
          <button
            className={`filter-btn ${activeCategory === "banking" ? "active" : ""}`}
            data-category="banking"
            onClick={() => setActiveCategory("banking")}
          >
            📈 MARKETS
          </button>
          <button
            className={`filter-btn ${activeCategory === "politics" ? "active" : ""}`}
            data-category="politics"
            onClick={() => setActiveCategory("politics")}
          >
            🏛 POLITICS
          </button>
          <button
            className={`filter-btn ${activeCategory === "infrastructure" ? "active" : ""}`}
            data-category="infrastructure"
            onClick={() => setActiveCategory("infrastructure")}
          >
            🏗 INFRA
          </button>
          <button
            className={`filter-btn ${activeCategory === "local" ? "active" : ""}`}
            data-category="local"
            onClick={() => setActiveCategory("local")}
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
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`news-card ${isFeatured ? "featured" : ""}`}
                  data-category={article.category}
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
                      <span>{article.source}</span>
                      <span className="card-time">{formatRelativeTime(article.publishedAt)}</span>
                    </div>

                    <div className="flex justify-start">
                      <span className="card-category-badge">
                        {article.category === "power" && "⚡ power"}
                        {article.category === "oil" && "🛢 oil & gas"}
                        {article.category === "tech" && "💻 tech"}
                        {article.category === "banking" && "📈 markets"}
                        {article.category === "politics" && "🏛 politics"}
                        {article.category === "infrastructure" && "🏗 infra"}
                        {article.category === "local" && "📍 local"}
                        {article.category === "general" && "◆ general"}
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
                </a>
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
    </>
  );
}
