import type { Who } from "@/lib/types";

// Профайл зураг байвал (main)/layout дахь <style> нь .av-a / .av-b-д зургийг тавина
export default function Avatar({ who, name, size }: { who: Who; name: string; size?: "sm" | "lg" | "xl" }) {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  return (
    <span className={`av av-${who}${size ? ` ${size}` : ""}`} title={name} aria-hidden="true">
      {initial}
    </span>
  );
}
