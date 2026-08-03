export type Role = "host" | "guest";

export type SessionStatus =
  | "waiting"
  | "connected"
  | "draft_ready"
  | "postcard_ready"
  | "pulse_ready"
  | "completed";

export type Artist = {
  id: string;
  name: string;
  genre: string;
  day: string;
  url?: string;
  source: "festival-preview" | "jambase";
};

export type Senses = {
  energy: number;
  soundLevel: number | null;
  tags: string[];
  light: string;
  air: string;
};

export type Postcard = {
  title: string;
  body: string;
  altText: string;
  signal: string;
  palette: [string, string, string];
};

export type SameSkySession = {
  code: string;
  role: Role;
  status: SessionStatus;
  paired: boolean;
  artist: Artist | null;
  stageName: string | null;
  observation: string | null;
  senses: Senses | null;
  postcard: Postcard | null;
  aiMode: "openai" | "festival-safe" | null;
  photoUrl: string | null;
  pulseColor: string | null;
  pulseAt: number | null;
  pulseEndsAt: number | null;
  demo: boolean;
  createdAt: number;
  expiresAt: number;
};

export type SkyPulse = {
  id: string;
  artistName: string;
  color: string;
  pulseAt: number;
  x: number;
  y: number;
};
