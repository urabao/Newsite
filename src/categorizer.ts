export const TAXONOMY = {

  // ═══════════════════════════════════════
  // ENERGY SECTOR
  // ═══════════════════════════════════════

  power: {
    label: "Power & Electricity",
    emoji: "⚡",
    keywords: [
      "NTPC", "power grid", "electricity", "power sector", "load shedding",
      "blackout", "power cut", "peak demand", "transmission", "distribution",
      "CERC", "discoms", "power purchase agreement", "PPA", "energy transition",
      "Power Grid Corporation", "PGCIL", "NHPC", "SJVN", "THDC",
      "thermal power", "coal plant", "supercritical", "ultra-supercritical",
      "MW installed", "GW capacity", "power tariff", "electricity tariff",
      "smart grid", "energy storage", "battery storage", "pumped hydro"
    ],
    weight: 3
  },

  renewable: {
    label: "Renewable Energy",
    emoji: "🌱",
    keywords: [
      "solar", "wind energy", "renewable", "clean energy", "green energy",
      "SECI", "IREDA", "rooftop solar", "solar park", "wind farm",
      "offshore wind", "green hydrogen", "electrolyser", "MNRE",
      "Adani Green", "Tata Power Solar", "ReNew Power", "Greenko",
      "solar auction", "wind auction", "hybrid project", "RPO",
      "renewable purchase obligation", "carbon credit", "net zero",
      "hydropower", "small hydro", "biomass", "biofuel", "ethanol blending"
    ],
    weight: 3
  },

  oil_gas: {
    label: "Oil & Gas",
    emoji: "🛢",
    keywords: [
      "ONGC", "oil", "natural gas", "petroleum", "crude oil", "refinery",
      "LNG", "CNG", "petrol price", "diesel price", "fuel price",
      "IOC", "Indian Oil", "HPCL", "BPCL", "Reliance Industries",
      "pipeline", "LPG", "city gas distribution", "CGD", "offshore drilling",
      "barrel", "hydrocarbon", "upstream", "downstream", "midstream",
      "oil ministry", "MoPNG", "PNGRB", "gas pricing", "APM gas",
      "Petronet", "GAIL", "Gujarat Gas", "IGL", "MGL",
      "exploration block", "NELP", "OALP", "deepwater", "KG basin"
    ],
    weight: 3
  },

  nuclear: {
    label: "Nuclear Energy",
    emoji: "☢",
    keywords: [
      "nuclear energy", "nuclear power", "NPCIL", "DAE", "atomic energy",
      "Kudankulam", "Tarapur", "thorium", "uranium", "reactor",
      "pressurized water reactor", "PWR", "PHWR", "fast breeder",
      "nuclear fuel", "BARC", "AERB", "nuclear plant", "nuclear capacity"
    ],
    weight: 3
  },

  // ═══════════════════════════════════════
  // FINANCIAL SECTOR
  // ═══════════════════════════════════════

  banking: {
    label: "Banking",
    emoji: "🏦",
    keywords: [
      "RBI", "Reserve Bank", "repo rate", "CRR", "SLR", "monetary policy",
      "SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra",
      "Punjab National Bank", "Bank of Baroda", "Canara Bank",
      "NPA", "bad loans", "stressed assets", "IBC", "NCLT", "resolution",
      "credit growth", "deposit", "loan", "EMI", "interest rate",
      "NBFC", "microfinance", "MFI", "co-operative bank",
      "bank merger", "PSU bank", "private bank", "foreign bank",
      "digital banking", "neo bank", "account aggregator"
    ],
    weight: 3
  },

  markets: {
    label: "Capital Markets",
    emoji: "📈",
    keywords: [
      "Sensex", "Nifty", "BSE", "NSE", "stock market", "equity",
      "SEBI", "IPO", "listing", "FII", "FPI", "DII", "mutual fund",
      "SIP", "NAV", "bond market", "yield", "gilt", "T-bill",
      "rupee", "forex", "dollar", "exchange rate", "RBI intervention",
      "derivatives", "futures", "options", "F&O", "circuit breaker",
      "market cap", "index fund", "ETF", "smallcap", "midcap", "largecap",
      "debt fund", "credit rating", "CRISIL", "ICRA", "downgrade",
      "FDI", "inflows", "outflows", "short selling", "circuit limit"
    ],
    weight: 3
  },

  insurance: {
    label: "Insurance",
    emoji: "🛡",
    keywords: [
      "insurance", "IRDAI", "LIC", "life insurance", "general insurance",
      "health insurance", "motor insurance", "crop insurance",
      "reinsurance", "GIC Re", "New India Assurance", "HDFC Life",
      "SBI Life", "ICICI Prudential", "Bajaj Allianz",
      "premium", "claim settlement", "actuarial", "insurance penetration",
      "Pradhan Mantri Jeevan Jyoti", "PMJJBY", "PMSBY"
    ],
    weight: 2
  },

  fintech: {
    label: "Fintech",
    emoji: "💳",
    keywords: [
      "UPI", "NPCI", "digital payment", "PhonePe", "Google Pay", "Paytm",
      "payment gateway", "PPI", "prepaid", "BNPL", "buy now pay later",
      "lending tech", "credit scoring", "Aadhaar", "eKYC",
      "account aggregator", "open banking", "ONDC", "wealthtech",
      "insurtech", "regtech", "sandbox", "payment bank",
      "RuPay", "IMPS", "RTGS", "NEFT", "Bhim", "NACH", "e-RUPI",
      "CBDC", "digital rupee", "crypto regulation"
    ],
    weight: 3
  },

  // ═══════════════════════════════════════
  // TECHNOLOGY SECTOR
  // ═══════════════════════════════════════

  it_services: {
    label: "IT & Software",
    emoji: "💻",
    keywords: [
      "Infosys", "TCS", "Wipro", "HCL Technologies", "Tech Mahindra",
      "Mphasis", "Hexaware", "LTIMindtree", "Persistent Systems",
      "IT sector", "software services", "outsourcing", "offshoring",
      "IT exports", "NASSCOM", "IT headcount", "attrition", "IT layoffs",
      "digital transformation", "cloud migration", "ERP", "SAP",
      "GCC", "global capability centre", "IT park", "SEZ",
      "SaaS", "enterprise software", "IT spending"
    ],
    weight: 3
  },

  startups: {
    label: "Startups & VC",
    emoji: "🚀",
    keywords: [
      "startup", "unicorn", "soonicorn", "funding round", "Series A",
      "Series B", "Series C", "seed funding", "angel investor",
      "venture capital", "VC", "private equity", "PE", "startup India",
      "DPIIT", "Sequoia", "SoftBank", "Tiger Global", "Accel",
      "Blume", "Matrix Partners", "Elevation Capital",
      "valuation", "down round", "bridge round", "acqui-hire",
      "pivot", "runway", "burn rate", "ARR", "GMV",
      "edtech", "healthtech", "agritech", "proptech", "legaltech",
      "D2C", "quick commerce", "Zepto", "Blinkit", "Swiggy Instamart"
    ],
    weight: 3
  },

  ai_deeptech: {
    label: "AI & Deeptech",
    emoji: "🤖",
    keywords: [
      "artificial intelligence", "AI", "machine learning", "deep learning",
      "generative AI", "LLM", "large language model", "foundation model",
      "semiconductor", "chip", "fab", "VLSI", "ISMC", "Micron India",
      "quantum computing", "quantum", "robotics", "automation",
      "computer vision", "NLP", "natural language processing",
      "data centre", "GPU", "NVIDIA India", "AI policy",
      "IndiaAI Mission", "digital public infrastructure", "DPI",
      "open source AI", "AI regulation", "deepfake",
      "space tech", "ISRO", "NSIL", "OneWeb", "Agnikul", "Skyroot"
    ],
    weight: 3
  },

  telecom: {
    label: "Telecom",
    emoji: "📡",
    keywords: [
      "Jio", "Airtel", "Vi", "Vodafone Idea", "BSNL", "MTNL",
      "5G", "spectrum auction", "telecom", "DoT", "TRAI",
      "AGR", "tariff hike", "mobile subscriber", "broadband",
      "fiber", "OTT", "satellite internet", "Starlink India",
      "tower company", "Indus Towers", "ATC India", "telecom PLI",
      "4G rollout", "rural connectivity", "BharatNet"
    ],
    weight: 3
  },

  // ═══════════════════════════════════════
  // MANUFACTURING & INDUSTRIAL
  // ═══════════════════════════════════════

  auto_ev: {
    label: "Auto & EVs",
    emoji: "🚗",
    keywords: [
      "automobile", "auto sector", "EV", "electric vehicle", "Tata Motors",
      "Maruti Suzuki", "Hyundai India", "Mahindra", "Honda", "Toyota",
      "Hero MotoCorp", "Bajaj Auto", "TVS Motor", "Ola Electric",
      "Ather Energy", "electric two-wheeler", "electric bus",
      "FAME scheme", "PLI auto", "auto sales", "vehicle registration",
      "BS6", "EV charging", "charging infrastructure", "battery swap",
      "SIAM", "FADA", "auto expo", "scrappage policy",
      "EV policy", "EV subsidy", "hybrid vehicle"
    ],
    weight: 3
  },

  pharma_health: {
    label: "Pharma & Healthcare",
    emoji: "💊",
    keywords: [
      "pharma", "pharmaceutical", "Sun Pharma", "Dr Reddy", "Cipla",
      "Lupin", "Aurobindo", "Biocon", "Divi's Laboratories",
      "API", "active pharmaceutical ingredient", "USFDA", "warning letter",
      "generic drug", "biosimilar", "CDSCO", "drug regulator",
      "healthcare", "hospital", "Apollo", "Fortis", "Narayana Health",
      "AIIMS", "Ayushman Bharat", "PMJAY", "health insurance",
      "vaccine", "clinical trial", "medical device", "diagnostics",
      "telemedicine", "health ministry", "drug pricing", "NPPA"
    ],
    weight: 3
  },

  defence: {
    label: "Defence & Aerospace",
    emoji: "🛡",
    keywords: [
      "defence", "DRDO", "HAL", "BEL", "Bharat Forge",
      "L&T Defence", "defence export", "defence budget",
      "Tejas", "fighter jet", "LCA", "submarine", "INS",
      "Indian Army", "Indian Navy", "Indian Air Force",
      "defence ministry", "MoD", "defence procurement",
      "indigenisation", "Atmanirbhar defence", "DPP",
      "missile", "BrahMos", "Astra", "Akash", "MRSAM",
      "defence corridor", "defence PSU", "Ordnance Factory"
    ],
    weight: 3
  },

  steel_metals: {
    label: "Steel & Metals",
    emoji: "🔩",
    keywords: [
      "steel", "Tata Steel", "JSW Steel", "SAIL", "JSPL",
      "iron ore", "coking coal", "blast furnace", "EAF",
      "steel production", "steel capacity", "steel export",
      "aluminium", "Hindalco", "Vedanta", "copper", "zinc",
      "NMDC", "Coal India", "mining", "mineral", "ore",
      "metals", "commodity", "base metal", "precious metal"
    ],
    weight: 2
  },

  chemicals: {
    label: "Chemicals & Petrochemicals",
    emoji: "🧪",
    keywords: [
      "chemicals", "petrochemicals", "Reliance Industries", "ONGC Petro",
      "specialty chemicals", "agrochemicals", "fertilizer",
      "GSFC", "GNFC", "Deepak Nitrite", "SRF", "PI Industries",
      "dyes", "pigments", "Aarti Industries", "Vinati Organics",
      "chlor-alkali", "polymer", "PVC", "plastic", "rubber",
      "chemical park", "Dahej", "Surat", "Vadodara chemical"
    ],
    weight: 2
  },

  textiles: {
    label: "Textiles & Apparel",
    emoji: "🧵",
    keywords: [
      "textile", "garment", "apparel", "cotton", "yarn", "fabric",
      "Tirupur", "Surat textile", "Bhilwara", "Ludhiana",
      "spinning mill", "weaving", "dyeing", "man-made fibre",
      "MMF", "polyester", "nylon", "silk", "wool",
      "textile PLI", "PM MITRA", "technical textiles",
      "AEPC", "garment export", "home textile"
    ],
    weight: 2
  },

  fmcg: {
    label: "FMCG & Consumer",
    emoji: "🛒",
    keywords: [
      "FMCG", "HUL", "Hindustan Unilever", "ITC", "Nestle India",
      "Britannia", "Dabur", "Godrej Consumer", "Marico", "Emami",
      "consumer staples", "rural demand", "urban consumption",
      "volume growth", "price hike", "raw material cost",
      "distribution", "general trade", "modern trade",
      "D2C brand", "quick commerce impact", "premiumisation"
    ],
    weight: 2
  },

  // ═══════════════════════════════════════
  // INFRASTRUCTURE & REAL ESTATE
  // ═══════════════════════════════════════

  infrastructure: {
    label: "Roads & Infrastructure",
    emoji: "🏗",
    keywords: [
      "NHAI", "highway", "expressway", "road construction",
      "NIP", "National Infrastructure Pipeline", "Gati Shakti",
      "PM Gati Shakti", "L&T", "IRB Infrastructure",
      "bridge", "tunnel", "flyover", "BOT", "HAM", "EPC",
      "infrastructure ministry", "MoRTH", "capex",
      "government spending", "infrastructure spend"
    ],
    weight: 2
  },

  railways: {
    label: "Railways",
    emoji: "🚆",
    keywords: [
      "Indian Railways", "railway", "Vande Bharat", "bullet train",
      "high speed rail", "NHSRCL", "freight corridor",
      "DFC", "dedicated freight corridor", "RVNL", "IRFC",
      "IRCTC", "railway budget", "railway ministry",
      "electrification", "station redevelopment", "metro rail",
      "DMRC", "BMRCL", "Navi Mumbai Metro", "Pune Metro",
      "railway PSU", "coach factory"
    ],
    weight: 2
  },

  aviation_ports: {
    label: "Aviation & Ports",
    emoji: "✈",
    keywords: [
      "aviation", "airport", "AAI", "DIAL", "MIAL", "GMR", "Adani Airport",
      "IndiGo", "Air India", "SpiceJet", "Akasa Air",
      "airline", "passenger traffic", "cargo", "MRO",
      "UDAN scheme", "regional connectivity", "ATF", "fuel surcharge",
      "port", "JNPT", "Mundra Port", "Adani Ports", "shipping",
      "container", "logistics", "freight", "seafreight",
      "Sagarmala", "coastal shipping", "shipping ministry"
    ],
    weight: 2
  },

  real_estate: {
    label: "Real Estate",
    emoji: "🏠",
    keywords: [
      "real estate", "housing", "residential", "commercial",
      "DLF", "Godrej Properties", "Prestige", "Brigade",
      "Lodha", "Macrotech", "Oberoi Realty",
      "PMAY", "affordable housing", "home loan",
      "RERA", "registration", "stamp duty",
      "office space", "co-working", "data centre real estate",
      "warehousing", "industrial park", "REIT", "InvIT"
    ],
    weight: 2
  },

  // ═══════════════════════════════════════
  // AGRICULTURE
  // ═══════════════════════════════════════

  agriculture: {
    label: "Agriculture",
    emoji: "🌾",
    keywords: [
      "agriculture", "agri", "farm", "kharif", "rabi", "MSP",
      "minimum support price", "procurement", "food grain",
      "wheat", "rice", "pulses", "oilseed", "sugarcane", "cotton",
      "FCI", "NAFED", "fertilizer", "urea", "subsidy",
      "irrigation", "drip irrigation", "PM-KISAN",
      "farmer protest", "agri reform", "APMC", "mandi",
      "crop insurance", "PMFBY", "agritech", "kisan",
      "FPO", "farmer producer organisation", "rural economy",
      "monsoon", "rainfall deficit", "IMD forecast crop"
    ],
    weight: 3
  },

  // ═══════════════════════════════════════
  // SERVICES SECTOR
  // ═══════════════════════════════════════

  education: {
    label: "Education",
    emoji: "🎓",
    keywords: [
      "education", "edtech", "BYJU", "Unacademy", "PhysicsWallah",
      "IIT", "IIM", "NIT", "NEET", "JEE", "CUET",
      "NEP", "National Education Policy", "UGC", "AICTE",
      "school education", "higher education", "university",
      "skill development", "NSDC", "vocational", "apprenticeship",
      "study abroad", "student visa", "scholarship"
    ],
    weight: 2
  },

  media_entertainment: {
    label: "Media & Entertainment",
    emoji: "🎬",
    keywords: [
      "media", "entertainment", "OTT", "Netflix India", "Amazon Prime",
      "Disney Hotstar", "JioCinema", "SonyLiv", "ZEE5",
      "Bollywood", "box office", "streaming", "content",
      "BARC", "TRP", "broadcast", "newspaper circulation",
      "journalism", "press freedom", "Star India",
      "advertising spend", "digital advertising", "IPL media rights"
    ],
    weight: 2
  },

  logistics: {
    label: "Logistics & Supply Chain",
    emoji: "📦",
    keywords: [
      "logistics", "supply chain", "warehousing", "cold chain",
      "Delhivery", "Blue Dart", "Ecom Express", "XpressBees",
      "3PL", "last mile delivery", "e-commerce logistics",
      "freight", "trucking", "FFFAI", "multimodal",
      "PM Gati Shakti logistics", "NLP", "logistics cost",
      "container availability", "port congestion"
    ],
    weight: 2
  },

  tourism_hospitality: {
    label: "Tourism & Hospitality",
    emoji: "🏨",
    keywords: [
      "tourism", "hotel", "hospitality", "IHCL", "Taj Hotels",
      "Oberoi", "Marriott India", "OYO", "MakeMyTrip",
      "foreign tourist", "domestic tourism", "tourism ministry",
      "incredible India", "travel", "airline passenger",
      "RevPAR", "occupancy rate", "medical tourism",
      "adventure tourism", "heritage tourism"
    ],
    weight: 2
  },

  // ═══════════════════════════════════════
  // POLITICS & GOVERNANCE
  // ═══════════════════════════════════════

  politics: {
    label: "Politics & Governance",
    emoji: "🏛",
    keywords: [
      "BJP", "Congress", "Modi", "Rahul Gandhi", "Amit Shah",
      "election", "parliament", "Lok Sabha", "Rajya Sabha",
      "CM", "chief minister", "governor", "cabinet",
      "minister", "ordinance", "bill passed", "amendment",
      "AAP", "TMC", "Kejriwal", "Yogi Adityanath", "NDA",
      "INDIA alliance", "budget", "vote", "constituency",
      "bypolls", "assembly election", "coalition", "majority",
      "policy reform", "government scheme", "welfare scheme",
      "Centre-state", "federalism", "CAG report"
    ],
    weight: 3
  },

  economy_macro: {
    label: "Economy & Macro",
    emoji: "📊",
    keywords: [
      "GDP", "GVA", "inflation", "CPI", "WPI", "IIP",
      "fiscal deficit", "current account", "trade deficit",
      "balance of payments", "forex reserves", "IMF", "World Bank",
      "economic survey", "union budget", "GST", "tax collection",
      "direct tax", "indirect tax", "disinvestment",
      "privatisation", "PSU", "public sector", "sovereign wealth",
      "PLI scheme", "make in India", "production linked incentive",
      "export", "import", "trade", "WTO", "FTA",
      "economic growth", "consumption", "investment cycle",
      "capacity utilisation", "PMI", "core sector"
    ],
    weight: 3
  },

  // ═══════════════════════════════════════
  // INTERNATIONAL
  // ═══════════════════════════════════════

  international: {
    label: "International",
    emoji: "🌍",
    keywords: [
      "US", "USA", "United States", "Federal Reserve", "Fed rate",
      "China", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal",
      "Russia", "Ukraine", "Europe", "EU", "UK", "Britain",
      "Middle East", "Saudi Arabia", "OPEC", "Israel", "Gaza",
      "Japan", "South Korea", "ASEAN", "QUAD", "G20", "G7",
      "WTO", "IMF", "World Bank", "United Nations", "UN",
      "geopolitics", "sanctions", "trade war", "tariff",
      "bilateral", "foreign policy", "India-US", "India-China",
      "Border", "LAC", "Line of Actual Control", "Pakistan army",
      "terrorism", "FATF", "diplomacy", "Modi foreign visit",
      "EAM", "external affairs", "Jaishankar",
      "global recession", "global inflation", "dollar index",
      "global supply chain", "Taiwan strait", "South China Sea"
    ],
    weight: 3
  },

  opinions: {
    label: "Opinions & Editorials",
    emoji: "✍",
    keywords: [],  // Opinions are assigned by source, not keyword. Weight irrelevant.
    weight: 0
  }

};

export type CategoryKey = keyof typeof TAXONOMY | "general" | "local";

export function categorizeArticle(title: string, summary: string, forceCategory: string | null = null) {
  // If category is pre-assigned (e.g. from /api/opinions), respect it
  if (forceCategory) {
    return { category: forceCategory as CategoryKey, tags: [forceCategory] };
  }

  const text = (title + " " + summary).toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, config] of Object.entries(TAXONOMY)) {
    if (category === 'opinions') continue; // Skip — assigned by source
    scores[category] = 0;
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category] += config.weight;
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted[0];
  const assignedCategory = topCategory && topCategory[1] > 0 ? (topCategory[0] as CategoryKey) : "general";

  // Tags: all categories scoring above 0, max 4 tags
  const tags = sorted
    .filter(([_, score]) => score > 0)
    .slice(0, 4)
    .map(([cat]) => cat);

  return { category: assignedCategory, tags };
}
