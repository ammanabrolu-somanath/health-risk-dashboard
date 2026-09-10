/** Band presentation. Colour is always paired with a label and a glyph — a
 *  projector will distort the hue and some viewers will not see it at all. */
export const BAND_STYLE = {
  low: {
    label: 'Low',
    glyph: '●',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    hex: '#12805C',
  },
  moderate: {
    label: 'Moderate',
    glyph: '◆',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    hex: '#C77A16',
  },
  high: {
    label: 'High',
    glyph: '▲',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    hex: '#C6304A',
  },
};

/** A signed delta, with the minus sign that reads as "better". */
export function signed(n) {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function pluralPoints(n) {
  return `${Math.abs(n)} ${Math.abs(n) === 1 ? 'point' : 'points'}`;
}

export function formatActivity(minutes) {
  return `${minutes} min/week`;
}
