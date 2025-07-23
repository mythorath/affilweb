// Type definitions for TrendTiers affiliate website

export interface Product {
  name: string;
  review: string;
  link: string;
  price?: string;
  image?: string;
}

export interface TierData {
  [tierKey: string]: Product[];
}

export interface TierListProps {
  tiers: TierData;
}

export interface ArticleFrontmatter {
  title: string;
  description: string;
  pubDate: Date;
  slug: string;
  image?: string;
  tags: string[];
}

export interface AffiliateConfig {
  [provider: string]: {
    baseUrl: string;
    trackingId: string;
  };
}

export interface ProductLinks {
  [productId: string]: {
    [provider: string]: string;
  } & {
    price?: string;
  };
}
