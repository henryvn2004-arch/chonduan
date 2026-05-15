import type { Mode, ProjectPin } from '@/types/maps'

const TIER_COLORS: Record<string, string> = {
  binh_dan: '#22C55E',
  trung_cap: '#EAB308',
  cao_cap: '#F97316',
  hang_sang: '#EF4444',
}

function demandColor(score: number): string {
  if (score <= 3) return '#60A5FA'
  if (score <= 6) return '#2563EB'
  return '#1565FF'
}

function fmtSale(pin: ProjectPin): string {
  const val = pin.price_secondary_per_m2_avg ?? pin.price_primary_per_m2_min
  if (!val) return '—'
  return `${Math.round(val / 1_000_000)}tr/m²`
}

function fmtRent(pin: ProjectPin): string {
  if (!pin.rent_2br_avg_monthly_vnd) return '—'
  return `${Math.round(pin.rent_2br_avg_monthly_vnd / 1_000_000)}tr/th`
}

export function getPinColor(pin: ProjectPin, mode: Mode): string {
  return mode === 'sale'
    ? (TIER_COLORS[pin.tier ?? ''] ?? '#94A3B8')
    : demandColor(pin.rent_demand_score ?? 5)
}

export function getPinLabel(pin: ProjectPin, mode: Mode): string {
  return mode === 'sale' ? fmtSale(pin) : fmtRent(pin)
}

/** SVG data URL icon for google.maps.Marker (no Map ID needed) */
export function createMarkerIcon(
  pin: ProjectPin,
  mode: Mode,
  active = false
): { url: string; scaledSize: [number, number]; anchor: [number, number] } {
  const color = getPinColor(pin, mode)
  const label = getPinLabel(pin, mode)
  const w = Math.max(64, label.length * 7 + 20)
  const h = active ? 30 : 26
  const r = h / 2
  const scale = active ? 1 : 1
  const stroke = active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'
  const strokeW = active ? 2.5 : 1.5

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + 6}">
    <rect x="${strokeW / 2}" y="${strokeW / 2}" width="${w - strokeW}" height="${h - strokeW}" rx="${r}" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"/>
    <text x="${w / 2}" y="${h / 2 + 4}" text-anchor="middle" font-size="${active ? 12 : 11}" font-weight="700" fill="white" font-family="system-ui,sans-serif">${label}</text>
    <polygon points="${w / 2 - 5},${h} ${w / 2 + 5},${h} ${w / 2},${h + 5}" fill="${color}"/>
  </svg>`

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: [w, h + 6],
    anchor: [w / 2, h + 6],
  }
}
