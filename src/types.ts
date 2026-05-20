export interface FelineSoundParams {
  pitch: number;    // in Hz (e.g., 300 to 1200)
  duration: number; // in seconds (e.g., 0.2 to 2.5)
  intensity: 'soft' | 'normal' | 'yawn' | 'yowl' | 'screaming';
}

export type CatBreed = 'Tabby' | 'Siamese' | 'Persian' | 'Sphynx';
export type CatMood = 'Curious' | 'Cuddly' | 'Zoomies' | 'Hangry' | 'Annoyed';

export interface BreedTemplate {
  name: CatBreed;
  description: string;
  avatar: string; // inline emoji or mini canvas representation
  tagline: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  catPhonetics?: string;
  gesture?: string;
  timestamp: Date;
}

export interface HumanToCatResponse {
  catPhonetics: string;
  catWords: string[];
  emotion: string;
  gesture: string;
  pitchMultiplier: number;
  tempoMultiplier: number;
  isSimulation?: boolean;
}

export interface CatToHumanResponse {
  translation: string;
  confidence: number;
  mood: string;
  catThought: string;
  actionRequired: string;
  isSimulation?: boolean;
}

export interface FelineEmotionAnalysisResponse {
  emotion: 'happy' | 'anxious' | 'hungry' | 'playful' | 'seeking attention';
  confidence: number;
  explanation: string;
  translation: string;
  actionItem: string;
  acousticMetricsParsed: {
    avgPitchHz: number;
    lengthSeconds: number;
    containsTrill: boolean;
    volumePattern: string;
  };
  isSimulation?: boolean;
}
