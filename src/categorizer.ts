export const TAXONOMY = {
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

export type CategoryKey = keyof typeof TAXONOMY | "general" | "local";

export function categorizeArticle(title: string, summary: string) {
  const text = (title + " " + summary).toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, config] of Object.entries(TAXONOMY)) {
    scores[category] = 0;
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category] += config.weight;
      }
    }
  }

  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedScores[0];

  const assignedCategory = topCategory && topCategory[1] > 0 ? (topCategory[0] as CategoryKey) : "general";

  // Tags: all categories with score > 0
  const tags = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .map(([cat]) => cat);

  return { category: assignedCategory, tags };
}
