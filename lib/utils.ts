/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BUCKET_ID } from "./appwrite.config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseStringify = (value: any) => {
    if (value === undefined || value === null) return null;
    return JSON.parse(JSON.stringify(value));
  }

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

// FORMAT DATE TIME
export const formatDateTime = (dateString: Date | string) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    // weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: "short", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // numeric day of the month (e.g., '25')
    year: "numeric", // numeric year (e.g., '2023')
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    year: "numeric", // numeric year (e.g., '2023')
    month: "2-digit", // abbreviated month name (e.g., 'Oct')
    day: "2-digit", // numeric day of the month (e.g., '25')
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // numeric year (e.g., '2023')
    day: "numeric", // numeric day of the month (e.g., '25')
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };

  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions
  );

  const formattedDateDay: string = new Date(dateString).toLocaleString(
    "en-US",
    dateDayOptions
  );

  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions
  );

  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions
  );

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

export function encryptKey(passkey: string) {
  return btoa(passkey);
}

export function decryptKey(passkey: string) {
  return atob(passkey);
}

export function scheduleToSlotKey(schedule: Date | string): { dateStr: string; timeStr: string } {
  const d = new Date(schedule)

  // ← Use local date parts instead of toISOString() which shifts to UTC
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const dateStr = `${year}-${month}-${day}`

  let hours = d.getHours()
  const minutes = d.getMinutes()
  const period = hours >= 12 ? "PM" : "AM"
  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12

  const timeStr = `${hours}:${minutes.toString().padStart(2, "0")} ${period}`
  return { dateStr, timeStr }
}

// Add this helper in the component (or in utils.ts):
export function toLocalDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}` // "2026-04-26" in local timezone
}

export function getFileViewUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_ENDPOINT
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  
  console.log("getFileViewUrl debug:", { endpoint, bucketId, projectId, fileId })
  
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`
}