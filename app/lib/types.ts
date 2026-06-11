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
  paletteHex?: string[];
  composition: string;
  lighting: string;
  technique: string;
  strengths: string[];
  improvements: string[];
  similarPhotographers: string[];
  oneLine: string;
  cameraTips?: string[];
};

export type CameraProfile = {
  id: string;
  brand: string;
  model: string;
  fullName: string;
  bodyClass: "mirrorless" | "dslr" | "rangefinder" | "compact" | "phone";
  sensorClass: string;
  controls: {
    aperture: string;
    shutterSpeed: string;
    iso: string;
    exposureCompensation: string;
    modes: string;
    signature?: string;
  };
};

export type SkillLevel = "beginner" | "developing" | "advanced";

export type UserProfile = {
  cameraId: string | null;
  customCameraName: string | null;
  skillLevel: SkillLevel | null;
  mainSubjects: string[];
  completedAt: number;
};

export type Exif = {
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: number;
  focalLength35?: number;
  aperture?: number;
  shutterSeconds?: number;
  iso?: number;
  dateTaken?: string;
};

export type PhotoStatus = "analyzing" | "done" | "failed";

export type StoredPhoto = {
  id: string;
  createdAt: number;
  thumbDataUrl: string;
  /** ~1280px render for the hero viewer; older records fall back to the thumb. */
  displayDataUrl?: string;
  filename: string;
  status: PhotoStatus;
  analysis: Analysis | null;
  error?: string;
  /** Full-size data URL kept only until analysis succeeds, so a failed call can be retried. */
  retryDataUrl?: string;
  retryMediaType?: string;
  collectionId?: string;
  exif?: Exif;
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
