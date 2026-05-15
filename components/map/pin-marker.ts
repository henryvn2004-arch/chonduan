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

export function createPinElement(pin: ProjectPin, mode: Mode, active = false): HTMLElement {
  const color =
    mode === 'sale'
      ? (TIER_COLORS[pin.tier ?? ''] ?? '#94A3B8')
      : demandColor(pin.rent_demand_score ?? 5)

  const label = mode === 'sale' ? fmtSale(pin) : fmtRent(pin)

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `position: relative; display: inline-block; cursor: pointer;`

  const bubble = document.createElement('div')
  bubble.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: ${color};
    color: white;
    font-size: 11px;
    font-weight: 600;
    font-family: Poppins, system-ui, sans-serif;
    padding: 4px 9px;
    border-radius: 10px;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    transform: ${active ? 'scale(1.2)' : 'scale(1)'};
    transition: transform 0.15s ease;
    user-select: none;
    border: 2px solid rgba(255,255,255,0.6);
  `
  bubble.textContent = label

  const arrow = document.createElement('div')
  arrow.style.cssText = `
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid ${color};
  `

  wrapper.appendChild(bubble)
  wrapper.appendChild(arrow)
  return wrapper
}
