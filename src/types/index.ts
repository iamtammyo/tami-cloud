export type Platform = "twitter" | "instagram" | "linkedin";

export interface SocialAccount {
  id: string;
  provider: Platform;
  username: string;
  profileImage?: string;
}

export interface Post {
  id: string;
  platform: Platform;
  content: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  isTopPerformer: boolean;
  accountUsername?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  category: string;
  platform?: Platform | null;
  tags: string[];
  sourcePostIds: string[];
  isAiGenerated: boolean;
  usageCount: number;
  explanation?: string;
  placeholders?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedTemplate {
  name: string;
  content: string;
  category: string;
  explanation: string;
  placeholders: string[];
}
