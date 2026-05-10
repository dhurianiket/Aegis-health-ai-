import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHealthScore(score: number): {
  color: string;
  label: string;
} {
  if (score >= 85) return { color: "text-green-500", label: "Excellent" };
  if (score >= 70) return { color: "text-blue-500", label: "Good" };
  if (score >= 50) return { color: "text-yellow-500", label: "Fair" };
  return { color: "text-red-500", label: "Critical" };
}
