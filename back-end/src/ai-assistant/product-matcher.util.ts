/**
 * Construction product matching: avoid naive substring matches
 * (e.g. "ciment" must not match "cement mixer" / bétonnière).
 */

export type ProductKind = 'material' | 'equipment' | 'tool' | 'other';

const MIXER_OR_MACHINE =
  /bétonnière|betonniere|mix(er)?|bétonni|concrete\s*mixer/i;
const CEMENT_MATERIAL =
  /ciment(\s+sac)?|cement\s+bag|mortier|sac\s+de\s+ciment/i;

/** Rough classification from product name + category. */
export function classifyProductKind(
  name: string,
  categorie?: string,
): ProductKind {
  const t = `${name} ${categorie || ''}`.toLowerCase();
  if (/(outil|tool|wrench|scie|hammer|mètre|metre\s+ruban)/i.test(t))
    return 'tool';
  if (MIXER_OR_MACHINE.test(t) && !CEMENT_MATERIAL.test(t)) return 'equipment';
  if (
    /(ciment|mortier|sable|gravier|brique|fer\s|acier|carrelage|peinture)/i.test(
      t,
    )
  )
    return 'material';
  if (/(échafaud|échelle|casque|gant|helmet|glove)/i.test(t))
    return 'equipment';
  return 'other';
}

/** When user asks for cement/material, drop obvious equipment false positives. */
export function shouldIncludeProductForMessage(
  productName: string,
  userMessage: string,
  categorie?: string,
): boolean {
  const msg = (userMessage || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  const kind = classifyProductKind(productName, categorie);

  const wantsCement =
    /\bciment\b|\bcement\b|\bmortier\b/.test(msg) &&
    !/\bbétonnière\b|\bbetonniere\b|\bmixer\b/.test(msg);
  if (wantsCement) {
    if (MIXER_OR_MACHINE.test(name) && !CEMENT_MATERIAL.test(name))
      return false;
    if (kind === 'equipment' && !CEMENT_MATERIAL.test(name)) return false;
  }

  const wantsMixer =
    /\bbétonnière\b|\bbetonniere\b|\bmixer\b|\bmalaxeur\b/.test(msg);
  if (wantsMixer) {
    if (kind === 'material' && !MIXER_OR_MACHINE.test(name)) return false;
  }

  return true;
}

export function dedupeConstructionProducts<
  T extends { nomP?: string; isExternal?: boolean; link?: string },
>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of items) {
    const key = `${p.isExternal ? 'ext' : 'loc'}:${String(p.nomP || '')
      .toLowerCase()
      .trim()}:${String(p.link || '').slice(0, 80)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
