import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toSafeNumber(value: number | null | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  return toSafeNumber(value).toFixed(digits)
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  return `${(toSafeNumber(value) * 100).toFixed(digits)}%`
}

export function formatPercentValue(value: number | null | undefined, digits = 0) {
  return `${Math.round(toSafeNumber(value) * 100).toFixed(digits)}%`
}
