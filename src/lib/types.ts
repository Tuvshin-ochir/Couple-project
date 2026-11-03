export type Who = "a" | "b";

export type Names = { a: string; b: string };

export type City = { name: string; tz: string; lat: number | null; lon: number | null };

export const other = (w: Who): Who => (w === "a" ? "b" : "a");

export const isWho = (v: unknown): v is Who => v === "a" || v === "b";
