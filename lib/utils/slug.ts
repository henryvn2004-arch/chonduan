/** Normalize Vietnamese diacritics + slugify for URL segments. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining marks
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Slugify a province name for use in URLs.
 *  "TP. Hồ Chí Minh" → "tp-ho-chi-minh"
 *  "Hà Nội" → "ha-noi"
 */
export function provinceSlug(province: string): string {
  return slugify(province.replace(/^TP\.\s*/i, 'tp '))
}

/** Slugify a district name for use in URLs.
 *  "Quận 1" → "quan-1"
 *  "Gia Lâm" → "gia-lam"
 */
export function districtSlug(district: string | null | undefined): string {
  if (!district) return 'khac'
  return slugify(district)
}

/** Build the full project URL path. */
export function projectPath(
  province: string,
  district: string | null | undefined,
  slug: string
): string {
  return `/du-an/${provinceSlug(province)}/${districtSlug(district)}/${slug}`
}
