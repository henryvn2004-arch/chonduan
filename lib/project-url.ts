export function slugify(text: string): string {
  return text
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, "")
}

export function projectUrl(province: string, slug: string): string {
  return `/du-an/${slugify(province)}/${slug}`
}
