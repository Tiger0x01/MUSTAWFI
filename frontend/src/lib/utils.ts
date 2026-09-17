import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function toArabicDigits(str: string | number, lang: "en" | "ar" = "ar"): string {
  if (lang !== "ar") return String(str);
  return String(str).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}