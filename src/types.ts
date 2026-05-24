export interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
  tags: string[];
  category: string;
}

export interface NewsResponse {
  success: boolean;
  fetchedAt: string;
  totalArticles: number;
  category: string;
  articles: Article[];
  error?: string;
}

export interface LocalNewsResponse extends NewsResponse {
  city: string;
  lang: string;
}
