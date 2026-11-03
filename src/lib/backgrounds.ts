// Хосын сонгосон арын өнгө — хоёр өнгийн зөөлөн градиент, "#rrggbb,#rrggbb" хэлбэрээр хадгална

export const BG_PRESETS = [
  ["Үүр", "#f3b49b", "#e9c3d6"],
  ["Нар жаргах", "#f0a35e", "#c46a86"],
  ["Тэнгис", "#86b3de", "#9fd3c9"],
  ["Ой", "#9fc39a", "#e2d39c"],
  ["Лаванда", "#b6a3e2", "#efbfd2"],
  ["Шөнө", "#3f5f8a", "#8a63a6"],
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

/** Буруу утгыг (гараар өөрчилсөн г.м) null болгоно — CSS-д шууд ордог тул заавал шалгана */
export function parseBg(raw: string | null | undefined): [string, string] | null {
  const [a, b] = (raw ?? "").split(",");
  return a && b && HEX.test(a) && HEX.test(b) ? [a.toLowerCase(), b.toLowerCase()] : null;
}
