const API_BASE = '';
const ENDPOINTS = {
  news: '/api/news',
  local: '/api/local',
  opinions: '/api/opinions',
  article: '/api/article',
  health: '/api/health'
};
const DEFAULT_CITY = 'Surat';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const STATE = {
  allArticles: [],       // All fetched articles
  activeCategory: 'all', // Currently active filter
  city: DEFAULT_CITY,    // Current city
  lastFetched: null,     // ISO timestamp
  isLoading: false,
  readerOpen: false,
  readerArticle: null,
  readerContent: null
};

// Relative Time Utility
function formatRelativeTime(isoString) {
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
}

// Startup initializations
document.addEventListener("DOMContentLoaded", () => {
  setupSkeletons();
  fetchAllData();
  setupEventListeners();

  // Auto Refresh Interval
  setInterval(() => {
    fetchAllData();
  }, REFRESH_INTERVAL_MS);
});

// Setup 8 skeleton items
function setupSkeletons() {
  const skeletonGrid = document.getElementById("skeleton-grid");
  if (!skeletonGrid) return;
  skeletonGrid.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const card = document.createElement("div");
    card.className = "skeleton-card";
    skeletonGrid.appendChild(card);
  }
}

// Fetch national and local news in parallel
async function fetchAllData() {
  STATE.isLoading = true;
  setErrorState(null);

  try {
    const [newsRes, localRes, opinionsRes] = await Promise.allSettled([
      fetch(`${ENDPOINTS.news}?category=all&limit=60`),
      fetch(`${ENDPOINTS.local}?city=${encodeURIComponent(STATE.city)}&lang=en`),
      fetch(`${ENDPOINTS.opinions}?limit=30`)
    ]);

    let newsArticles = [];
    let localArticles = [];
    let opinionArticles = [];

    if (newsRes.status === "fulfilled" && newsRes.value.ok) {
      const json = await newsRes.value.json();
      if (json.success && Array.isArray(json.articles)) {
        newsArticles = json.articles;
      }
    }

    if (opinionsRes.status === "fulfilled" && opinionsRes.value.ok) {
      const json = await opinionsRes.value.json();
      if (json.success && Array.isArray(json.articles)) {
        opinionArticles = json.articles;
      }
    }

    if (localRes.status === "fulfilled" && localRes.value.ok) {
      const json = await localRes.value.json();
      if (json.success && Array.isArray(json.articles)) {
        localArticles = json.articles;
      }
    }

    if (newsArticles.length === 0 && localArticles.length === 0 && opinionArticles.length === 0) {
      throw new Error("No feeds succeeded.");
    }

    // Merge both arrays: national news first, opinions second, local last
    STATE.allArticles = [...newsArticles, ...opinionArticles, ...localArticles];
    STATE.lastFetched = new Date().toISOString();

    // Disable loading screen, activate main dashboard
    document.getElementById("loading-screen").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    renderDashboard();
  } catch (err) {
    console.error("Gathering endpoints error:", err);
    setErrorState(err.message || "Failed to reach India Pulse aggregator system.");
  } finally {
    STATE.isLoading = false;
  }
}

function setErrorState(msg) {
  const grid = document.getElementById("news-grid");
  if (!grid) return;
  if (msg) {
    grid.innerHTML = `
      <div class="error-container font-mono p-8 text-center" style="grid-column: 1 / -1; border: var(--border-brutal); background: var(--col-surface); border-radius: var(--radius-md);">
        <p style="color: var(--col-politics); font-weight: bold; margin-bottom: var(--space-sm);">SENSORS / FEEDS HARVESTER FAILURES</p>
        <p style="color: var(--col-text-secondary); font-size: 13px;">${msg}</p>
        <button onclick="fetchAllData()" class="filter-btn active" style="margin-top: var(--space-md); cursor: pointer;">RETRY AGGREGATION</button>
      </div>
    `;
  }
}

// Render Header counts, ticker, and main grids
function renderDashboard() {
  const lastUpdatedEl = document.getElementById("last-updated");
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Updated ${formatRelativeTime(STATE.lastFetched)}`;
  }

  const articleCountEl = document.getElementById("article-count");
  if (articleCountEl) {
    articleCountEl.textContent = `${STATE.allArticles.length} articles`;
  }

  renderTicker();
  renderGrid();
}

// Rendering headline news scrolling ticker
function renderTicker() {
  const tickerEl = document.getElementById("ticker-content");
  if (!tickerEl) return;

  const topTen = STATE.allArticles.slice(0, 10);
  if (topTen.length === 0) {
    tickerEl.textContent = "INDIA PULSE — FETCHING LIVE ECONOMIC FEED DIALS...";
    return;
  }

  const singleStr = topTen.map(item => item.title.toUpperCase()).join(" — ◆ — ");
  // Double-string for seamless infinite scrolling loop
  tickerEl.innerHTML = `${singleStr} — ◆ — ${singleStr}`;
}

// Render news cards grid
function renderGrid() {
  const grid = document.getElementById("news-grid");
  if (!grid) return;

  grid.innerHTML = "";

  // Perform category-wise client side filtering
  let filtered = STATE.allArticles;
  if (STATE.activeCategory !== 'all') {
    filtered = STATE.allArticles.filter(art => 
      art.category === STATE.activeCategory || art.tags.includes(STATE.activeCategory)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--col-text-secondary); font-family: var(--font-mono); padding: var(--space-xl);">
        NO ARTICLES FOUND ACTIVE IN SECTOR "${STATE.activeCategory.toUpperCase()}"
      </div>
    `;
    return;
  }

  let index = 0;
  let articlesHTML = "";

  filtered.forEach(art => {
    // Top story is featured ONLY when category filter is 'all' and there is an imageUrl
    const isFeatured = index === 0 && STATE.activeCategory === 'all' && !!art.imageUrl;
    articlesHTML += buildCardHTML(art, isFeatured);
    index++;
  });

  grid.innerHTML = articlesHTML;

  // Add click handlers
  const cards = grid.querySelectorAll(".news-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      const art = STATE.allArticles.find(a => a.id === id);
      if (art) openReader(art);
    });
  });
}

// HTML builder for single card item
function buildCardHTML(article, isFeatured) {
  const imgHTML = article.imageUrl 
    ? `<img src="${article.imageUrl}" alt="${article.title}" class="card-image" loading="lazy">` 
    : '';

  const timeText = formatRelativeTime(article.publishedAt);

  let categoryDisplay = article.category;
  if (article.category === "power") categoryDisplay = "⚡ power";
  if (article.category === "oil") categoryDisplay = "🛢 oil & gas";
  if (article.category === "tech") categoryDisplay = "💻 tech";
  if (article.category === "banking") categoryDisplay = "📈 markets";
  if (article.category === "politics") categoryDisplay = "🏛 politics";
  if (article.category === "infrastructure") categoryDisplay = "🏗 infra";
  if (article.category === "local") categoryDisplay = "📍 local";
  if (article.category === "opinions") categoryDisplay = "✍ opinions";
  if (article.category === "general") categoryDisplay = "◆ general";

  const tagsHTML = (article.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${t.toLowerCase()}</span>`).join('');
  
  let sourceDisplay = article.source;
  if (article.category === "opinions" && article.author) {
    sourceDisplay = `<span class="card-author">BY ${article.author.toUpperCase()}</span>`;
  }

  return `
    <div class="news-card ${isFeatured ? 'featured' : ''}" data-category="${article.category}" data-id="${article.id}">
      ${imgHTML}
      <div class="card-body">
        <div class="card-source-row">
          <span style="display:flex;align-items:center;gap:8px">${article.publicationName || article.source} ${article.category === 'opinions' && article.author ? `&middot; <span class="card-author">BY ${article.author.toUpperCase()}</span>` : ''}</span>
          <span class="card-time">${timeText}</span>
        </div>
        <div style="display: flex; justify-content: flex-start;">
          <span class="card-category-badge">${categoryDisplay}</span>
        </div>
        <h2 class="card-title">${article.title}</h2>
        ${article.summary ? `<p class="card-summary">${article.summary}</p>` : ''}
        ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
      </div>
      <button class="card-read-more" aria-label="Read ${article.title}">READ ARTICLE ◆</button>
    </div>
  `;
}

async function openReader(article) {
  STATE.readerOpen = true;
  STATE.readerArticle = article;
  
  const panel = document.getElementById('reader-panel');
  const overlay = document.getElementById('reader-overlay');
  
  panel.classList.remove('hidden');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  let categoryDisplay = article.category;
  if (article.category === "power") categoryDisplay = "⚡ power";
  if (article.category === "oil") categoryDisplay = "🛢 oil & gas";
  if (article.category === "tech") categoryDisplay = "💻 tech";
  if (article.category === "banking") categoryDisplay = "📈 markets";
  if (article.category === "politics") categoryDisplay = "🏛 politics";
  if (article.category === "infrastructure") categoryDisplay = "🏗 infra";
  if (article.category === "local") categoryDisplay = "📍 local";
  if (article.category === "opinions") categoryDisplay = "✍ opinions";
  if (article.category === "general") categoryDisplay = "◆ general";
  
  document.getElementById('reader-category-badge').textContent = categoryDisplay;
  document.getElementById('reader-source').textContent = article.publicationName || article.source;
  document.getElementById('reader-time').textContent = formatRelativeTime(article.publishedAt);
  document.getElementById('reader-author').textContent = article.author ? `BY ${article.author.toUpperCase()}` : '';
  document.getElementById('reader-title').textContent = article.title;
  
  document.getElementById('reader-loading').classList.remove('hidden');
  document.getElementById('reader-content').innerHTML = '';
  document.getElementById('reader-paywall-block').classList.add('hidden');
  
  const closeBtn = document.getElementById('reader-close');
  if(closeBtn) closeBtn.focus();

  try {
    const res = await fetch(`${ENDPOINTS.article}?url=${encodeURIComponent(article.url)}`);
    const data = await res.json();
    STATE.readerContent = data;
    renderReaderContent(data);
  } catch (err) {
    renderReaderContent({ success: false, originalUrl: article.url, archiveUrl: 'https://12ft.io/'+article.url, googleCacheUrl: 'https://webcache.googleusercontent.com/search?q=cache:'+encodeURIComponent(article.url) });
  }
}

function renderReaderContent(data) {
  const loading = document.getElementById('reader-loading');
  const content = document.getElementById('reader-content');
  const paywallBlock = document.getElementById('reader-paywall-block');
  
  loading.classList.add('hidden');
  
  if (data.success === false) {
    content.innerHTML = `<div id="reader-error" class="font-mono" style="padding:var(--space-md);background:#222;border:var(--border-brutal);color:#FF6B6B;">Could not load article.</div>
      <div id="reader-links-block" style="margin-top:var(--space-md);display:flex;gap:var(--space-md);">
        <a href="${data.originalUrl}" target="_blank" class="reader-action-btn primary">READ ON SITE →</a>
        <a href="${data.archiveUrl}" target="_blank" class="reader-action-btn">TRY 12FT.IO →</a>
        <a href="${data.googleCacheUrl}" target="_blank" class="reader-action-btn">GOOGLE CACHE →</a>
      </div>
    `;
    return;
  }
  
  if (data.paywalled === true) {
    if (data.bodyText) {
      content.innerHTML = data.bodyText.split('\n\n').map(p => `<p>${p}</p>`).join('');
    }
    document.getElementById('reader-link-original').href = data.originalUrl;
    document.getElementById('reader-link-12ft').href = data.archiveUrl;
    document.getElementById('reader-link-cache').href = data.googleCacheUrl;
    paywallBlock.classList.remove('hidden');
    return;
  }
  
  if (data.paywalled === false && data.bodyText) {
    let html = '';
    if (data.heroImage) {
      html += `<img src="${data.heroImage}" alt="Hero Image">`;
    }
    html += data.bodyText.split('\n\n').map(p => `<p>${p}</p>`).join('');
    html += `
      <div id="reader-links-block">
        <a href="${data.originalUrl}" target="_blank" class="reader-action-btn primary">OPEN ORIGINAL →</a>
        <span id="reader-word-count">${data.wordCount} words &middot; ~${Math.ceil(data.wordCount/200)} min read</span>
      </div>
    `;
    content.innerHTML = html;
  }
}

function closeReader() {
  STATE.readerOpen = false;
  STATE.readerArticle = null;
  STATE.readerContent = null;
  document.getElementById('reader-panel').classList.add('hidden');
  document.getElementById('reader-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// User Action Controls
function setupEventListeners() {
  // Category selections
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      STATE.activeCategory = btn.getAttribute("data-category");
      renderGrid();
    });
  });

  // Local city adjustments
  const citySubmit = document.getElementById("city-submit");
  const cityInput = document.getElementById("city-input");

  const triggerCityUpdate = () => {
    const val = cityInput.value.trim();
    if (val) {
      STATE.city = val;
      fetchAllData();
    }
  };

  if (citySubmit) {
    citySubmit.addEventListener("click", triggerCityUpdate);
  }

  if (cityInput) {
    cityInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        triggerCityUpdate();
      }
    });
  }

  // Refresh
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      fetchAllData();
    });
  }
  
  // Reader handlers
  const closeBtn = document.getElementById('reader-close');
  if (closeBtn) closeBtn.addEventListener('click', closeReader);
  
  const overlay = document.getElementById('reader-overlay');
  if (overlay) overlay.addEventListener('click', closeReader);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && STATE.readerOpen) {
      closeReader();
    }
  });
}
