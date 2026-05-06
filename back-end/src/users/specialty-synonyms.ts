/**
 * Dataset de synonymes multilingues pour les spécialités d'artisans.
 * Chaque entrée : valeur normalisée (FR) → liste de synonymes
 * Couvre : français, arabe classique, arabe dialectal maghrébin, phonétique latin
 */
export const SPECIALTY_SYNONYMS: Record<string, string[]> = {
  Peinture: [
    'peinture',
    'peintre',
    'pinter',
    'painter',
    'dahan',
    'dehen',
    'dahin',
    'دهان',
    'دهن',
    'صباغ',
    'sabagh',
    'sabag',
    'couleur',
    'color',
    'teinture',
    'laka',
    'لكع',
  ],
  Plomberie: [
    'plomberie',
    'plombier',
    'plombi',
    'plumber',
    'sabbak',
    'sabak',
    'سبّاك',
    'seba',
    'مسّاس',
    'massas',
    'tuyau',
    'eau',
    'robinet',
    'ma',
    'ماء',
  ],
  Électricité: [
    'electricite',
    'electricité',
    'electricien',
    'electric',
    'electrician',
    'kahrouba',
    'kahraba',
    'كهربا',
    'كهرباء',
    'كهربجي',
    'kahrabji',
    'courant',
    'branchement',
    'wiring',
    'كهرباجي',
  ],
  Menuiserie: [
    'menuiserie',
    'menuisier',
    'charpente',
    'carpenter',
    'wood',
    'najar',
    'najjar',
    'نجّار',
    'نجار',
    'bois',
    'meuble',
    'khachab',
    'خشب',
  ],
  Carrelage: [
    'carrelage',
    'carreleur',
    'tile',
    'tiling',
    'zellige',
    'zellij',
    'zli',
    'zlijji',
    'زليج',
    'بلاط',
    'blat',
    'ballat',
    'faïence',
    'faience',
    'mosaique',
    'sol',
  ],
  Maçonnerie: [
    'maçonnerie',
    'maconnerie',
    'maçon',
    'macon',
    'mason',
    'beton',
    'benna',
    'benna',
    'بنّاء',
    'بناء',
    'benai',
    'الطين',
    'tine',
    'construction',
    'mur',
  ],
  Climatisation: [
    'climatisation',
    'clim',
    'climatiseur',
    'air conditionné',
    'ac',
    'airco',
    'takyif',
    'takief',
    'تكييف',
    'تكييف',
    'مكيف',
    'moukayyef',
    'froid',
    'chauffage',
  ],
  Soudure: [
    'soudure',
    'soudeur',
    'soudage',
    'welder',
    'welding',
    'lahham',
    'lahhem',
    'لحام',
    'لحّام',
    'lahem',
    'fer',
    'metal',
    'معدن',
  ],
  Piscine: [
    'piscine',
    'pool',
    'swimming pool',
    'birkha',
    'birka',
    'بركة',
    'حوض',
    'hawd',
  ],
  Jardinage: [
    'jardinage',
    'jardinier',
    'jardin',
    'garden',
    'gardener',
    'jnina',
    'jnana',
    'جنينة',
    'حديقة',
    'hadika',
    'plante',
  ],
  Toiture: [
    'toiture',
    'toit',
    'couverture',
    'roof',
    'roofing',
    'satah',
    'سطح',
    'satha',
    'tuile',
  ],
  Vitrage: [
    'vitrage',
    'vitrier',
    'verre',
    'glass',
    'fenêtre',
    'fenetre',
    'ferra',
    'fira',
    'زجاج',
    'zujaj',
    'درب',
  ],
  Plâtrerie: [
    'platrerie',
    'plâtrerie',
    'plâtrier',
    'platre',
    'plâtre',
    'gypse',
    'jbess',
    'jabs',
    'جبس',
    'jibs',
  ],
  Ferronnerie: [
    'ferronnerie',
    'ferronnier',
    'grille',
    'fer forgé',
    'forge',
    'haddad',
    'حدّاد',
    'حداد',
    'fer',
  ],
  Nettoyage: [
    'nettoyage',
    'nettoyeur',
    'cleaning',
    'cleaner',
    'ménage',
    'tandhif',
    'نظافة',
    'تنظيف',
    'tandhifa',
  ],
  Déménagement: [
    'déménagement',
    'demenagement',
    'moving',
    'transport',
    'tanqil',
    'تنقيل',
    'نقل',
    'naql',
  ],
  Chef: [
    'chef',
    'cuisinier',
    'cuisine',
    'restauration',
    'restaurant',
    'cook',
    'cooking',
    'tabbakh',
    'tabakh',
    'طباخ',
    'مطبخ',
    'bakl',
    'makel',
  ],
};

/**
 * Retourne la liste de toutes les spécialités normalisées (clés)
 */
export function getAllSpecialties(): string[] {
  return Object.keys(SPECIALTY_SYNONYMS);
}

/**
 * Normalise une entrée utilisateur vers la spécialité standard française.
 * Ex: "dahan" → "Peinture", "najjar" → "Menuiserie"
 */
export function normalizeSpecialty(input: string): string {
  if (!input || !input.trim()) return input;

  const cleaned = removeDiacritics(input.trim().toLowerCase());

  // 1. Exact match sur les synonymes
  for (const [standard, synonyms] of Object.entries(SPECIALTY_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (cleaned === removeDiacritics(synonym.toLowerCase())) {
        return standard;
      }
    }
    // Exact match sur la clé elle-même
    if (cleaned === standard.toLowerCase()) return standard;
  }

  // 2. Fuzzy match — Levenshtein distance ≤ 2
  let bestMatch: string | null = null;
  let bestScore = Infinity;

  for (const [standard, synonyms] of Object.entries(SPECIALTY_SYNONYMS)) {
    const allTerms = [
      standard.toLowerCase(),
      ...synonyms.map((s) => s.toLowerCase()),
    ];
    for (const term of allTerms) {
      const dist = levenshtein(cleaned, removeDiacritics(term));
      if (dist < bestScore) {
        bestScore = dist;
        bestMatch = standard;
      }
    }
  }

  // Seuil tolérance : distance max = 2 (pour corriger fautes de frappe)
  if (bestScore <= 2 && bestMatch) return bestMatch;

  // 3. Aucun match → retourner la valeur capitalisée telle quelle
  return (
    input.trim().charAt(0).toUpperCase() + input.trim().slice(1).toLowerCase()
  );
}

/**
 * Recherche multilingue : retourne les spécialités normalisées qui correspondent
 * à la query (y compris fuzzy matching)
 * Ex: "daha n" → ["Peinture"]
 */
export function searchSpecialties(query: string): string[] {
  if (!query || !query.trim()) return getAllSpecialties();

  const cleaned = removeDiacritics(query.trim().toLowerCase()).replace(
    /\s+/g,
    '',
  );
  const results = new Set<string>();

  for (const [standard, synonyms] of Object.entries(SPECIALTY_SYNONYMS)) {
    const allTerms = [
      standard.toLowerCase(),
      ...synonyms.map((s) => s.toLowerCase()),
    ];
    for (const term of allTerms) {
      const cleanedTerm = removeDiacritics(term).replace(/\s+/g, '');
      // Inclusion + fuzzy
      if (cleanedTerm.includes(cleaned) || cleaned.includes(cleanedTerm)) {
        results.add(standard);
        break;
      }
      if (levenshtein(cleaned, cleanedTerm) <= 2) {
        results.add(standard);
        break;
      }
    }
  }

  return Array.from(results);
}

export function extractSpecialtyFromSentence(sentence: string): string | null {
  const cleanedSentence = removeDiacritics(sentence.toLowerCase());
  const words = cleanedSentence.split(/[\s,.'’]+/); // Découpage par mots

  let bestMatch: string | null = null;
  let bestScore = Infinity;

  for (const word of words) {
    if (word.length < 3) continue; // Ignore les petits mots (je, un, de...)

    for (const [standard, synonyms] of Object.entries(SPECIALTY_SYNONYMS)) {
      const allTerms = [
        standard.toLowerCase(),
        ...synonyms.map((s) => s.toLowerCase()),
      ];

      for (const term of allTerms) {
        const cleanedTerm = removeDiacritics(term);
        // Correspondance exacte prioritaire
        if (cleanedTerm === word) {
          return standard;
        }
        // 1 seule faute de frappe autorisée (pour éviter les faux positifs)
        if (cleanedTerm.length > 4) {
          const dist = levenshtein(cleanedTerm, word);
          if (dist <= 1 && dist < bestScore) {
            bestScore = dist;
            bestMatch = standard;
          }
        }
      }
    }
  }
  return bestMatch;
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/**
 * Supprime les accents/diacritiques d'une chaîne
 */
function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Distance de Levenshtein entre deux chaînes
 */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
