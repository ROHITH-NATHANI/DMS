import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Report {
  id: number;
  type: string;
  severity: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url: string;
  timestamp: string;
}

export interface Shelter {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number;
  address: string;
}

export interface MissingPerson {
  id: number;
  name: string;
  last_seen_location: string;
  latitude: number;
  longitude: number;
  contact_info: string;
  status: string;
  timestamp: string;
}
