// ===== Extraction Types =====

export interface ExtractedContent {
  url: string;
  title: string;
  author: string | null;
  lastUpdated: string | null;
  sections: Section[];
  topInsights: string[];
  dataPoints: string[];
  quotableLines: string[];
}

export interface Section {
  heading: string;
  content: string;
  keyInsights: string[];
  dataPoints: string[];
  quotes: string[];
}

// ===== Generation Types =====

export type Platform = "linkedin" | "threads" | "bluesky";

export type LinkedInIdeaType =
  | "thought-leadership"
  | "data-callout"
  | "contrarian-take"
  | "heres-what-i-learned";

export type ThreadsIdeaType =
  | "hot-take"
  | "quick-tip-thread"
  | "one-thing-surprised-me";

export type BlueskyIdeaType =
  | "insight-link"
  | "mini-thread"
  | "community-question";

export type IdeaType = LinkedInIdeaType | ThreadsIdeaType | BlueskyIdeaType;

export interface GeneratedIdea {
  id: string;
  platform: Platform;
  ideaType: IdeaType;
  content: string;
  characterCount: number;
  sourceUrl: string;
  generatedAt: string;
  edited: boolean;
  editedContent: string | null;
  pushStatus: "pending" | "pushing" | "pushed" | "error";
  bufferIdeaId: string | null;
  pushError: string | null;
}

export interface GenerationResult {
  sourceContent: ExtractedContent;
  ideas: GeneratedIdea[];
  generatedAt: string;
  modelUsed: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ===== Config Types =====

export interface PlatformIdeaTypeConfig {
  type: IdeaType;
  label: string;
  description: string;
  count: number;
}

export interface PlatformConfig {
  platform: Platform;
  displayName: string;
  maxCharacters: number;
  ideaTypes: PlatformIdeaTypeConfig[];
  toneGuidelines: string[];
  structureRules: string[];
  hookFormula: string | null;
  hashtagStrategy: string;
}

export interface GlobalRules {
  antiPatterns: string[];
  brandVoiceDefaults: string[];
  contentPrinciples: string[];
}

export interface ToneProfile {
  name: string;
  description: string;
  voiceAttributes: string[];
  examplePhrases: string[];
  avoidPhrases: string[];
}

// ===== API Request/Response Types =====

export interface ExtractRequest {
  url: string;
}

export interface ExtractResponse {
  success: boolean;
  data?: ExtractedContent;
  error?: string;
}

export interface GenerateRequest {
  extractedContent: ExtractedContent;
  platforms: Platform[];
  toneProfile: string;
}

export interface GenerateResponse {
  success: boolean;
  data?: GenerationResult;
  error?: string;
}

export interface BufferPushRequest {
  idea: {
    content: string;
    sourceUrl: string;
    platform: Platform;
    ideaType: IdeaType;
    sourceTitle: string;
  };
}

export interface BufferPushResponse {
  success: boolean;
  ideaId?: string;
  error?: string;
}

export interface BufferBatchPushRequest {
  ideas: BufferPushRequest["idea"][];
}

export interface BufferBatchPushResponse {
  success: boolean;
  results: {
    index: number;
    ideaId?: string;
    error?: string;
  }[];
}

export interface NotionLogRequest {
  idea: GeneratedIdea;
  sourceTitle: string;
  sourceUrl: string;
}

export interface NotionLogResponse {
  success: boolean;
  pageId?: string;
  error?: string;
}

// ===== UI State Types =====

export interface RecentUrl {
  url: string;
  title: string;
  processedAt: string;
  ideaCount: number;
}
