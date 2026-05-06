import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import {
  extractSpecialtyFromSentence,
  getAllSpecialties,
  SPECIALTY_SYNONYMS,
} from '../users/specialty-synonyms';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArtisanChatResponse {
  message: string;
  type: 'artisan_search' | 'help' | 'specialty_list';
  data?: any[];
}

// ─── Listes de déclencheurs ────────────────────────────────────────────────────

/** Mots-clés français */
const TRIGGER_FR = [
  'artisan',
  'cherche',
  'besoin',
  'trouver',
  'trouve',
  'recherche',
  'besoin de',
  'qui fait',
  'qui peut',
  'disponible',
  'contacter',
];

/** Mots-clés arabes (dialects + classique) */
const TRIGGER_AR = [
  'نجم',
  'نحوس',
  'حاجه',
  'بش',
  'نلقى',
  'حرفي',
  'صنايعي',
  'حرفية',
  'صنايعية',
  'فمن',
  'عندي',
];

/** Jointure complète */
const ALL_TRIGGERS = [...TRIGGER_FR, ...TRIGGER_AR];

/** Villes tunisiennes communes */
const COMMON_CITIES = [
  'tunis',
  'ariana',
  'monastir',
  'sousse',
  'sfax',
  'bizerte',
  'nabeul',
  'ben arous',
  'manouba',
  'raoued',
  'soukra',
  'ennasr',
  'hay khadra',
  'la marsa',
  'carthage',
  'sidi bou said',
  'la goulette',
  'mégrine',
  'rades',
  'hammam lif',
  'bardo',
  'cite el khadra',
];

// ─── Regex extraction de zone ─────────────────────────────────────────────────

const ZONE_REGEX =
  /(?:dans la zone de|dans la zone|zone de|dans|à|in|vers|quartier de|quartier)\s+(?!zone\b)([^\s,.،]+)/i;

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ChatbotArtisanService {
  constructor(private readonly usersService: UsersService) {}

  // ============================================================
  // 🛠️ Point d'entrée principal : traitement du message
  // ============================================================
  async handleMessage(message: string): Promise<ArtisanChatResponse> {
    const lowerMsg = message.toLowerCase().trim();

    // 1. Commande aide
    if (
      lowerMsg === 'aide' ||
      lowerMsg === 'help' ||
      lowerMsg === '?' ||
      lowerMsg === 'مساعدة'
    ) {
      return this.buildHelpResponse();
    }

    // 2. Liste des spécialités
    if (
      lowerMsg.includes('spécialité') ||
      lowerMsg === 'liste' ||
      lowerMsg.includes('specialites')
    ) {
      return this.buildSpecialtyListResponse();
    }

    // 3. Détection de déclencheur artisan
    const isArtisanSearch =
      ALL_TRIGGERS.some((t) => lowerMsg.includes(t)) ||
      !!extractSpecialtyFromSentence(lowerMsg);

    if (!isArtisanSearch) {
      return this.buildHelpResponse();
    }

    // 4. Extraction de la spécialité (synonymes multilingues)
    const searchSpec = extractSpecialtyFromSentence(lowerMsg);

    // 5. Extraction de la zone (sans IA)
    const zone = this.extractZone(message, lowerMsg);

    // 6. Recherche en base
    return this.searchAndRespond(searchSpec, zone);
  }

  // ============================================================
  // 🔍 Extraction de zone (pure logique locale)
  // ============================================================
  private extractZone(originalMessage: string, lowerMsg: string): string {
    // a) Ville connue directement dans le message
    const foundCity = COMMON_CITIES.find((city) => lowerMsg.includes(city));
    if (foundCity) return foundCity;

    // b) Regex générique (ex: "dans zone Ariana", "à Sfax")
    const zoneMatch = originalMessage.match(ZONE_REGEX);
    if (zoneMatch) {
      const candidate = zoneMatch[1].trim();
      // S'assurer que le candidat n'est pas lui-même un synonyme de spécialité
      if (!extractSpecialtyFromSentence(candidate.toLowerCase())) {
        return candidate;
      }
    }

    return '';
  }

  // ============================================================
  // 🗄️  Recherche DB + formatage réponse
  // ============================================================
  private async searchAndRespond(
    searchSpec: string | null,
    zone: string,
  ): Promise<ArtisanChatResponse> {
    const artisans = await this.usersService.findArtisans(
      searchSpec || undefined,
      zone || undefined,
    );

    if (artisans.length > 0) {
      const header =
        `✅ **${artisans.length} artisan(s) trouvé(s)**` +
        (searchSpec ? ` — **${searchSpec}**` : '') +
        (zone ? ` à **${zone}**` : '');

      return {
        message: header,
        type: 'artisan_search',
        data: artisans,
      };
    }

    // Aucun résultat
    const suggestions = this.buildSuggestions(searchSpec, zone);
    return {
      message:
        `🔍 **Aucun artisan trouvé**` +
        (searchSpec ? ` pour la spécialité **${searchSpec}**` : '') +
        (zone ? ` dans la zone **${zone}**` : '') +
        `.\n\n${suggestions}`,
      type: 'artisan_search',
    };
  }

  // ============================================================
  // 💡 Suggestions en cas d'échec
  // ============================================================
  private buildSuggestions(spec: string | null, zone: string): string {
    const lines: string[] = ['Vous pouvez essayer :'];
    if (zone) lines.push(`• Une autre ville (ex: Tunis, Sfax, Sousse)`);
    if (spec) lines.push(`• Une autre spécialité (ex: Électricité, Plomberie)`);
    lines.push(
      `• Tapez **liste** pour voir toutes les spécialités disponibles`,
    );
    return lines.join('\n');
  }

  // ============================================================
  // 📋 Réponse liste des spécialités
  // ============================================================
  private buildSpecialtyListResponse(): ArtisanChatResponse {
    const specialties = getAllSpecialties();
    const list = specialties
      .map((s) => {
        const synonyms = SPECIALTY_SYNONYMS[s];
        // On montre 3 exemples de synonymes max
        const examples = synonyms
          .filter((syn) => /^[a-z]/i.test(syn))
          .slice(0, 3)
          .join(', ');
        return `• **${s}**${examples ? ` _(ex: ${examples})_` : ''}`;
      })
      .join('\n');

    return {
      message:
        `📋 **Spécialités disponibles** :\n\n${list}\n\n` +
        `Exemple : "Cherche un plombier à Ariana" ou "besoin dahan à Tunis"`,
      type: 'specialty_list',
    };
  }

  // ============================================================
  // ❓ Réponse aide
  // ============================================================
  private buildHelpResponse(): ArtisanChatResponse {
    return {
      message:
        `🤖 **Chatbot Artisans – Fullstakers**\n\n` +
        `Je peux vous aider à trouver des artisans qualifiés !\n\n` +
        `**Exemples de questions :**\n` +
        `• "Cherche un plombier à Ariana"\n` +
        `• "J'ai besoin d'un électricien à Tunis"\n` +
        `• "najjar dans zone Sousse"\n` +
        `• "دهان في تونس"\n\n` +
        `Tapez **liste** pour voir toutes les spécialités disponibles.`,
      type: 'help',
    };
  }
}
