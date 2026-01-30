import { ReactNode } from "react";

export interface AudioLayer {
  element: "primary" | "secondary" | "ambient" | "guqin" | "meditation";
  audio: HTMLAudioElement;
  volume: number;
  isPlaying: boolean;
}

export interface SleepMusicTrack {
  id: string;
  name: string;
  nameZh: string;
  nameMs: string;
  description: string;
  descriptionZh: string;
  descriptionMs: string;
  icon: ReactNode;
  audioPath: string;
  color: string;
  gradient: string;
}

export interface VolumeState {
  primary: number;
  secondary: number;
  ambient: number;
  guqin: number;
  meditation: number;
}

export type VolumeKey = keyof VolumeState;
