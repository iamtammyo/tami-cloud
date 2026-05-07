export type GenreTag =
  | "portrait"
  | "street"
  | "landscape"
  | "documentary"
  | "fashion"
  | "architecture"
  | "wildlife"
  | "still-life"
  | "abstract"
  | "macro"
  | "travel"
  | "fine-art"
  | "photojournalism";

export type MoodTag =
  | "moody"
  | "bright"
  | "minimal"
  | "dramatic"
  | "intimate"
  | "energetic"
  | "melancholic"
  | "serene";

export type Analysis = {
  genre: GenreTag;
  subjects: string[];
  mood: MoodTag;
  palette: string[];
  composition: string;
  lighting: string;
  technique: string;
  strengths: string[];
  improvements: string[];
  similarPhotographers: string[];
  oneLine: string;
};

export type StoredPhoto = {
  id: string;
  createdAt: number;
  thumbDataUrl: string;
  filename: string;
  analysis: Analysis;
  collectionId?: string;
};

export type Collection = {
  id: string;
  name: string;
  createdAt: number;
};

export type Photographer = {
  id: string;
  name: string;
  era: string;
  country: string;
  styles: GenreTag[];
  signature: string;
  bio: string;
  wikipediaTitle: string;
  quote?: string;
};
