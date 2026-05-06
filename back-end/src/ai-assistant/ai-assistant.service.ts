import { BadRequestException, Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import { ProjectsService } from '../projects/projects.service';
import { OrdersService } from '../orders/orders.service';
import { ChatMemoryService } from '../chat-memory/chat-memory.service';
import { ChatbotArtisanService } from './chatbot-artisan.service';
import { Product } from '../products/entities/product.entity';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import PDFDocument = require('pdfkit');
import {
  shouldIncludeProductForMessage,
  dedupeConstructionProducts,
} from './product-matcher.util';
import { RecommendMaterialsBmpResponse } from './dto/recommend-materials-bmp.dto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ScrapedProduct {
  nomP: string;
  prix: number | null;
  source: string;
  link: string;
  isExternal: true;
  image?: string;
}

export interface OptimizeBudgetResult {
  summary: string;
  costReduction: number;
  suggestedChanges: {
    material: string;
    replaceWith: string;
    savings: number;
  }[];
}

// ─── MODÈLES GEMINI — essayés dans l'ordre jusqu'à succès ────────────────────
const GEMINI_MODELS = [
  'gemini-2.5-flash',        // Meilleur — peut être surchargé (503)
  'gemini-2.0-flash',        // Très bon — stable
  'gemini-2.0-flash-lite',   // Léger — toujours disponible
  'gemini-1.5-flash-latest', // Dernier recours
];

// ─── Mots-clés BTP → termes de recherche tunisiens ───────────────────────────
const CONSTRUCTION_INTENT_MAP: Record<string, string[]> = {
  villa: [
    'ciment portland',
    'sable fin',
    'fer béton 12mm',
    'brique rouge',
    'carrelage sol',
    'peinture façade',
  ],
  renovation: [
    'enduit ciment',
    'carrelage mural',
    'peinture intérieure',
    'plâtre',
    'isolation thermique',
  ],
  toiture: [
    'tuile romane',
    'tôle galvanisée',
    'charpente bois',
    'étanchéité bitume',
  ],
  electricite: [
    'câble électrique 2.5mm',
    'disjoncteur 16A',
    'tableau électrique',
    'prise électrique',
  ],
  plomberie: [
    'tube pvc 100mm',
    'robinet mitigeur',
    'tuyau cuivre',
    'raccord plomberie',
  ],
  outillage: [
    'perceuse visseuse',
    'meuleuse angle',
    'niveau laser',
    'marteau burin',
  ],
  piscine: ['pompe filtration piscine', 'liner piscine', 'filtre à sable'],
  maison: ['ciment portland', 'sable', 'fer béton', 'brique', 'carrelage'],
  construction: ['ciment', 'sable fin', 'fer béton', 'brique rouge', 'gravier'],
};

// ─── Sites tunisiens BTP ──────────────────────────────────────────────────────
const SCRAPE_SOURCES_BTP = [
  {
    name: 'Tayara.tn',
    searchUrl: (q: string) =>
      `https://www.tayara.tn/ads/k/${encodeURIComponent(q)}/`,
    itemSelector: '[class*="card"], article, .listing, [class*="AdCard"]',
    nameSelector: 'h2, h3, [class*="title"], [class*="Title"]',
    priceSelector: '[class*="price"], [class*="prix"], [class*="Price"]',
    linkSelector: 'a',
    imageSelector: 'img',
    baseUrl: 'https://www.tayara.tn',
  },
  {
    name: 'Maison.tn',
    searchUrl: (q: string) =>
      `https://www.maison.tn/search?q=${encodeURIComponent(q)}`,
    itemSelector: '.product, .product-item, [class*="product"], .item',
    nameSelector: '.product-name, h2, h3, .name',
    priceSelector: '[class*="price"], .prix, .price',
    linkSelector: 'a',
    imageSelector: 'img',
    baseUrl: 'https://www.maison.tn',
  },
  {
    name: 'Jumia.com.tn',
    searchUrl: (q: string) =>
      `https://www.jumia.com.tn/catalog/?q=${encodeURIComponent(q)}`,
    itemSelector: 'article.prd, [class*="article"]',
    nameSelector: '.name, h3, [class*="name"]',
    priceSelector: '.prc, [class*="price"]',
    linkSelector: 'a',
    imageSelector: 'img',
    baseUrl: 'https://www.jumia.com.tn',
  },
];

const SCRAPE_SOURCES_OUTILLAGE = [
  {
    name: 'Mytek.tn',
    searchUrl: (q: string) =>
      `https://www.mytek.tn/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    itemSelector: '.product-item-info',
    nameSelector: '.product-item-name a',
    priceSelector: '.price',
    linkSelector: '.product-item-name a',
    imageSelector: 'img.product-image-photo',
    baseUrl: 'https://www.mytek.tn',
  },
  {
    name: 'Tunisianet',
    searchUrl: (q: string) =>
      `https://www.tunisianet.com.tn/recherche?controller=search&s=${encodeURIComponent(q)}`,
    itemSelector: '.product-miniature',
    nameSelector: '.product-title a',
    priceSelector: '.price',
    linkSelector: '.product-title a',
    imageSelector: 'img',
    baseUrl: 'https://www.tunisianet.com.tn',
  },
];

// ─── Gemini API caller — 100% dynamique, teste tous les modèles ──────────────
async function callGemini(
  apiKey: string,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  if (!apiKey || !apiKey.startsWith('AIza')) {
    throw new Error(
      '❌ GEMINI_API_KEY manquante ou invalide.\n' +
      '👉 Obtenez une clé GRATUITE sur https://aistudio.google.com/app/apikey\n' +
      'Puis ajoutez dans votre .env : GEMINI_API_KEY=AIza...',
    );
  }

  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!res.ok) {
        const errBody = await res.text();
        // Erreur fatale → inutile d'essayer d'autres modèles
        if (res.status === 400)
          throw new Error(`Gemini 400 — Requête invalide: ${errBody.slice(0, 300)}`);
        if (res.status === 403)
          throw new Error('Gemini 403 — Clé API invalide. Vérifiez votre GEMINI_API_KEY dans .env');
        // Surcharge ou quota → on essaie le modèle suivant
        if (res.status === 429 || res.status === 503 || res.status === 404) {
          lastError = new Error(`Gemini ${res.status} sur ${model} — passage au modèle suivant...`);
          continue;
        }
        throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = new Error(`${model} a retourné une réponse vide.`);
        continue;
      }
      return text; // ✅ succès
    } catch (err: any) {
      // Timeout ou erreur réseau → on essaie le suivant
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        lastError = new Error(`Timeout sur ${model}`);
        continue;
      }
      // Erreur fatale (400, 403) → on remonte immédiatement
      throw err;
    }
  }

  throw lastError ?? new Error('Tous les modèles Gemini sont indisponibles.');
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private readonly mlServiceUrl: string;
  private ragStore: Map<string, string[]> = new Map();

  private getGeminiKeys(): string[] {
    return [
      this.configService.get<string>('GEMINI_API_KEY'),
      this.configService.get<string>('GEMINI_API_KEY_2'),
      this.configService.get<string>('GEMINI_API_KEY_3'),
    ].filter((k): k is string => !!(k && k.startsWith('AIza')));
  }

  private readonly SCRAPING_BLACKLIST = [
    'sac à dos',
    'hydrobak',
    'camelbak',
    'biberon',
    'pâtisserie',
    'confiserie',
    'vêtement',
    'chaussure',
    'téléphone',
    'tablette',
    'laptop',
    'ordinateur',
    'jouet',
    'parfum',
    'cosmétique',
    'alimentation',
    'nourriture',
    'boisson',
    'hydratation',
    'sport',
    'fitness',
    'gym',
  ];

  constructor(
    private configService: ConfigService,
    private productsService: ProductsService,
    private chatMemoryService: ChatMemoryService,
    private chatbotArtisanService: ChatbotArtisanService,
    @Inject(forwardRef(() => ProjectsService))
    private projectsService: ProjectsService,
    private ordersService: OrdersService,
  ) {
    const geminiKeys = this.getGeminiKeys();
    if (geminiKeys.length > 0) {
      this.genAI = new GoogleGenerativeAI(geminiKeys[0]);
      this.logger.log(`✅ Gemini initialisé avec ${geminiKeys.length} clé(s)`);
    } else {
      this.logger.warn('⚠️ Aucune GEMINI_API_KEY valide dans .env');
    }

    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.logger.log('✅ OpenAI initialisé pour fallback Vision');
    }

    this.mlServiceUrl =
      this.configService.get<string>('ML_SERVICE_URL') ||
      'http://127.0.0.1:8000';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILE HANDLING & RAG INGESTION
  // ══════════════════════════════════════════════════════════════════════════

  private async readUploadBuffer(file: Express.Multer.File): Promise<Buffer> {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    if (file.buffer?.length) return file.buffer;
    const p = (file as any).path;
    if (p) {
      const { readFile } = await import('fs/promises');
      return readFile(p);
    }
    throw new BadRequestException('Fichier vide ou non accessible.');
  }

  /**
   * INGEST CORRIGÉ : stocke TOUJOURS en local + tente ML service
   * Le RAG local fonctionne même si le ML service est down
   */
  async forwardIngestToMl(file: Express.Multer.File): Promise<any> {
    if (!file) throw new BadRequestException('Aucun fichier fourni');

    // 1. Indexer localement si possible
    let text = '';
    try {
      text = await this.extractTextFromFile(file);
    } catch (e) {
      this.logger.warn(
        `Extraction locale échouée pour "${file.originalname}": ${e.message}`,
      );
    }

    const isReadable =
      text.length > 50 &&
      !text.startsWith('[PDF non lisible') &&
      (text.match(/[a-zA-ZÀ-ÿ0-9]/g) || []).length / Math.max(text.length, 1) >
      0.3;

    if (isReadable) {
      const chunks = this.chunkText(text, 300);
      this.ragStore.set(file.originalname, chunks);
      this.logger.log(
        `✅ RAG local: ${chunks.length} chunks indexés pour "${file.originalname}"`,
      );
    } else {
      this.logger.warn(
        `⚠️ PDF non lisible localement pour "${file.originalname}" — tentative via ML Service...`,
      );
    }

    try {
      const formData = new FormData();
      // Utilisation de Uint8Array pour compatibilité type BlobPart
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype,
      });
      formData.append('file', blob, file.originalname);

      const res = await fetch(`${this.mlServiceUrl}/ingest`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(45_000),
      });

      if (res.ok) {
        const mlData = await res.json();
        this.logger.log(
          `✅ ML Service: ${mlData.added} segments indexés pour "${file.originalname}"`,
        );
        return {
          filename: file.originalname,
          added: mlData.added || 1,
          source: 'ml-service',
          isReadable: true,
        };
      } else {
        const err = await res.text();
        this.logger.warn(`Échec Ingest ML: ${err}`);
      }
    } catch (e) {
      this.logger.warn(
        `ML Service indisponible pour l'ingestion: ${e.message}`,
      );
    }

    // Fallback final si même le ML a échoué ET que le local était illisible
    if (!isReadable) {
      return {
        filename: file.originalname,
        added: 0,
        warning:
          'Le document semble protégé ou illisible. Veuillez essayer un fichier TXT ou un PDF plus propre.',
        fallback: true,
      };
    }

    return {
      filename: file.originalname,
      added: this.ragStore.get(file.originalname)?.length || 0,
      source: 'local',
    };
  }

  private async extractTextFromImage(
    file: Express.Multer.File,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!apiKey) throw new Error("GEMINI_API_KEY requise pour l'OCR.");

    const base64 = file.buffer.toString('base64');
    const mimeType = file.mimetype as 'image/png' | 'image/jpeg' | 'image/webp';

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64 } },
            {
              text: 'Extrais TOUT le texte visible dans cette image, mot pour mot. Conserve les nombres et unités tels quels. Réponds uniquement avec le texte extrait.',
            },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 2000 },
    };

    let lastError: Error | null = null;
    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) {
          const msg = await res.text();
          if (res.status === 429 || res.status === 503 || res.status === 404) {
            lastError = new Error(`OCR ${res.status} sur ${model}`);
            continue;
          }
          throw new Error(`OCR échoué (${res.status}): ${msg.slice(0, 200)}`);
        }
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (e: any) {
        if (e.name === 'TimeoutError' || e.name === 'AbortError') {
          lastError = new Error(`Timeout OCR sur ${model}`);
          continue;
        }
        throw e;
      }
    }
    throw lastError ?? new Error('OCR: tous les modèles Gemini sont indisponibles.');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CORE CHAT ASSISTANT
  // ══════════════════════════════════════════════════════════════════════════

  async getAssistantChatWithMemory(
    message: string,
    sessionId: string | undefined,
    historyFromClient: any[],
    userId?: string,
  ) {
    let history = historyFromClient;
    let effectiveSessionId = sessionId;

    if (userId && this.chatMemoryService) {
      try {
        const { session } = await this.chatMemoryService.getOrCreateSession(
          sessionId,
          userId,
        );
        effectiveSessionId = (session as any)._id.toString();
        if (effectiveSessionId) {
          history =
            await this.chatMemoryService.getHistoryForLLM(effectiveSessionId);
        }
      } catch (e) {
        this.logger.error('Memory error', e);
      }
    }

    const isGreeting = this.isGreeting(message);
    let internalProducts: Product[] = [];
    let externalProducts: ScrapedProduct[] = [];

    if (!isGreeting) {
      internalProducts = await this.searchInternalProducts(message);

      // Web scraping si peu de produits internes
      if (internalProducts.length < 3) {
        const searchTerms = this.resolveSearchTerms(message);
        externalProducts = await this.scrapeProductsFromWeb(
          message,
          searchTerms,
        );
      }
    }

    const ragContext = await this.retrieveRagContext(message);
    const systemPrompt = this.buildSystemPrompt(
      internalProducts,
      externalProducts,
      ragContext,
    );

    const chatHistory: ChatMessage[] = history.slice(-8).map((m) => ({
      role: m.role as any,
      content: String(m.content),
    }));

    const geminiKey = this.configService.get<string>('GEMINI_API_KEY') || '';

    let replyText = '';

    try {
      if (!geminiKey || !geminiKey.startsWith('AIza')) {
        // Pas de clé Gemini → réponse locale intelligente
        replyText = this.buildLocalResponse(
          message,
          internalProducts,
          externalProducts,
          ragContext,
        );
      } else {
        replyText = await callGemini(
          geminiKey,
          systemPrompt,
          chatHistory,
          message,
        );
      }
    } catch (err) {
      this.logger.error('Gemini failed:', err.message);

      // Fallback local si Gemini échoue (quota ou pas de clé)
      replyText = this.buildLocalResponse(
        message,
        internalProducts,
        externalProducts,
        ragContext,
      );
    }

    // Nettoyage des produits web pour le rendu UI
    const isConstructionQuery = message
      .toLowerCase()
      .match(
        /(ciment|béton|beton|brique|sable|fer|carrelage|peinture|plomberie|sac|toiture|isolation)/,
      );
    let finalExternal = externalProducts;
    if (isConstructionQuery) {
      const badWords = [
        'sac à dos',
        'sac à main',
        'sac de sport',
        'sac de camping',
        'hydrobak',
        'vêtement',
        'chaussure',
        'bijou',
        'parfum',
      ];
      finalExternal = externalProducts.filter(
        (p) => !badWords.some((bad) => p.nomP.toLowerCase().includes(bad)),
      );
    }

    // Ne pas envoyer de produits web si la question concerne explicitement un document
    const isDocQuestion = message
      .toLowerCase()
      .match(/(document|fichier|pdf|plan|devis)/);
    if (isDocQuestion) {
      finalExternal = [];
    }

    const result = {
      message: replyText,
      intent: this.detectIntent(message),
      products: internalProducts,
      externalProducts: finalExternal,
      sources: ragContext.sources,
      sessionId: effectiveSessionId || null,
    };

    if (userId && effectiveSessionId && this.chatMemoryService) {
      await this.chatMemoryService.addMessage(
        effectiveSessionId,
        'user',
        message,
      );
      await this.chatMemoryService.addMessage(
        effectiveSessionId,
        'assistant',
        replyText,
      );
    }

    return result;
  }

  /**
   * RÉPONSE LOCALE — fonctionne SANS aucune clé API
   * Utile quand Gemini quota épuisé ou pas configuré
   */
  private buildLocalResponse(
    message: string,
    internal: any[],
    external: ScrapedProduct[],
    rag: { context: string; sources: any[] },
  ): string {
    const parts: string[] = [];
    const lowerMsg = message.toLowerCase();

    const isDocQuestion =
      lowerMsg.includes('document') ||
      lowerMsg.includes('fichier') ||
      lowerMsg.includes('pdf') ||
      lowerMsg.includes('plan') ||
      lowerMsg.includes('devis');

    const isQuantityQuestion =
      lowerMsg.includes('combien') ||
      lowerMsg.includes('quantit') ||
      lowerMsg.includes('nombre') ||
      lowerMsg.includes('quelle quantité') ||
      lowerMsg.includes('sac') ||
      lowerMsg.includes('tonne') ||
      lowerMsg.includes('m2') ||
      lowerMsg.includes('litre') ||
      lowerMsg.includes('brique') ||
      lowerMsg.includes('kg');

    // ── PRIORITÉ ABSOLUE : Document RAG ────────────────────────────────────────
    if (rag.context && rag.context.trim().length > 10) {
      const docName = rag.sources[0]?.filename || 'votre document';

      // Tentative extraction intelligente
      const ragAnswer = this.extractRelevantFromRag(message, rag.context);

      if (ragAnswer) {
        parts.push(`📄 **D'après le document "${docName}" :**\n\n${ragAnswer}`);
        parts.push(`\n---\n*Source : ${docName}*`);
        return parts.join('\n\n');
      }

      // Si pas de match précis mais c'est clairement une question sur le doc
      if (isDocQuestion || isQuantityQuestion) {
        // Retourner les premières lignes du document qui contiennent des chiffres
        const linesWithNumbers = rag.context
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 5 && /\d/.test(l))
          .slice(0, 8);

        if (linesWithNumbers.length > 0) {
          parts.push(
            `📄 **Données chiffrées dans le document "${docName}" :**\n\n` +
            linesWithNumbers.map((l) => `• ${l}`).join('\n'),
          );
          parts.push(`\n---\n*Source : ${docName}*`);
          return parts.join('\n\n');
        }

        // Dernier recours : retourner le début du document
        const preview = rag.context.slice(0, 800).trim();
        if (preview.length > 20) {
          parts.push(
            `📄 **Contenu du document "${docName}" :**\n\n${preview}…`,
          );
          parts.push(`\n---\n*Source : ${docName}*`);
          return parts.join('\n\n');
        }
      }
    }

    // ── PRIORITÉ 2 : Recommandation villa/maison ────────────────────────────────
    if (
      lowerMsg.includes('villa') ||
      lowerMsg.includes('maison') ||
      lowerMsg.includes('construction') ||
      lowerMsg.includes('matériau') ||
      lowerMsg.includes('recommande')
    ) {
      parts.push(`🏗️ **Matériaux recommandés pour une villa 150m² (Tunisie) :**
 
  **Gros œuvre :**
  • Ciment Portland CPJ 42,5 — **300-400 sacs** (50kg)
  • Fer à béton HA12/HA16 — **3-4 tonnes**
  • Brique creuse 20cm — **15 000 à 20 000 unités**
  • Sable fin lavé — **40-50 m³**
  • Gravier 15/25 — **20-30 m³**
 
  **Revêtement :**
  • Carrelage sol 60×60 — **160 m²** (+ 10% perte)
  • Faïence murale — **80 m²**
  • Peinture façade — **80-100 kg**
 
  💰 **Budget indicatif : 160 000 – 220 000 TND** (hors terrain)`);
    }

    // ── PRIORITÉ 3 : Produits catalogue interne ─────────────────────────────────
    if (internal.length > 0) {
      parts.push(
        `🏪 **Produits Fullstakers disponibles :**\n` +
        internal
          .slice(0, 5)
          .map((p) => `• ${p.nomP} — ${p.prix} DT`)
          .join('\n'),
      );
    }

    // ── PRIORITÉ 4 : Produits web — SEULEMENT si pas de document et pas de
    //    question de quantité (évite les "sac à dos" quand on demande "sac ciment")
    const isConstructionQuery =
      lowerMsg.includes('ciment') ||
      lowerMsg.includes('béton') ||
      lowerMsg.includes('beton') ||
      lowerMsg.includes('brique') ||
      lowerMsg.includes('sable') ||
      lowerMsg.includes('fer') ||
      lowerMsg.includes('carrelage') ||
      lowerMsg.includes('peinture') ||
      lowerMsg.includes('plomberie') ||
      lowerMsg.includes('sac') ||
      lowerMsg.includes('toiture') ||
      lowerMsg.includes('isolation');

    if (external.length > 0 && !isConstructionQuery) {
      parts.push(
        `🌐 **Produits trouvés en ligne :**\n` +
        external
          .slice(0, 4)
          .map(
            (p) =>
              `• [${p.nomP}](${p.link}) — ${p.prix ? p.prix + ' DT' : 'Prix N/D'} (${p.source})`,
          )
          .join('\n'),
      );
    } else if (external.length > 0 && isConstructionQuery) {
      // Filtrer les produits web non pertinents (sac à dos, sac à main...)
      const relevantExternal = external.filter((p) => {
        const nameLower = p.nomP.toLowerCase();
        const badWords = [
          'sac à dos',
          'sac à main',
          'sac de sport',
          'sac de camping',
          'hydrobak',
          'vêtement',
          'chaussure',
          'bijou',
          'parfum',
        ];
        return !badWords.some((bad) => nameLower.includes(bad));
      });
      if (relevantExternal.length > 0) {
        parts.push(
          `🌐 **Produits BTP trouvés en ligne :**\n` +
          relevantExternal
            .slice(0, 4)
            .map(
              (p) =>
                `• [${p.nomP}](${p.link}) — ${p.prix ? p.prix + ' DT' : 'Prix N/D'} (${p.source})`,
            )
            .join('\n'),
        );
      }
    }

    if (parts.length === 0) {
      parts.push(
        `🤖 Bonjour ! Je suis Maram, votre assistante construction Fullstakers.\n\n` +
        `Posez-moi vos questions sur les matériaux, devis ou projets BTP en Tunisie.\n\n` +
        `📎 Uploadez un PDF pour des réponses basées sur votre document.`,
      );
    }

    return parts.join('\n\n');
  }

  private extractRelevantFromRag(
    query: string,
    context: string,
  ): string | null {
    if (!context || context.trim().length < 5) return null;

    const genericStop = new Set([
      'les',
      'des',
      'pour',
      'dans',
      'avec',
      'que',
      'qui',
      'est',
      'sont',
      'une',
      'par',
      'sur',
      'pas',
      'plus',
      'mais',
      'aux',
      'ces',
      'mes',
      'ses',
      'leur',
      'leurs',
      'vous',
      'nous',
      'ils',
      'elles',
      'avoir',
      'être',
      'cette',
      'ceux',
      'cela',
    ]);

    // Normalise un mot (minuscules, sans accents)
    const normalize = (w: string) =>
      w
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    // Matche le mot ET son pluriel simple (+s)
    const flexMatch = (text: string, word: string): boolean => {
      const n = normalize(word);
      const t = normalize(text);
      // Pluriel simple, forme en -aux, -ux
      const variants = [n, n + 's', n + 'x', n.replace(/s$/, '')].filter(
        (v) => v.length > 1,
      );
      return variants.some((v) => {
        try {
          return new RegExp(
            `\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
            'i',
          ).test(t);
        } catch {
          return false;
        }
      });
    };

    const queryWords = normalize(query)
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !genericStop.has(w));

    // Synonymes BTP élargi
    const synonymMap: Record<string, string[]> = {
      sac: ['sacs', 'portland', 'ciment', 'cpj', 'kg', '50kg'],
      ciment: ['sac', 'sacs', 'portland', 'cpj', 'beton', 'béton', 'liant'],
      fer: ['acier', 'armature', 'ha400', 'tonne', 'ha12', 'ha16', 'barre'],
      brique: ['briques', 'maçonnerie', 'bloc'],
      budget: ['tnd', 'plafond', 'montant', 'coût', 'coüt', 'prix', 'total'],
      surface: ['m2', 'habitable', 'm²', 'superficie'],
      isolation: ['laine', 'pare-vapeur', 'r='],
      quantite: ['quantité', 'nombre', 'combien', 'unités'],
      sable: ['m3', 'gravier', 'granulat'],
      toiture: ['toit', 'tuile', 'charpente', 'comble'],
      plomberie: ['tube', 'tuyau', 'robinet', 'pvc'],
      electricite: ['cable', 'câble', 'disjoncteur', 'tableau', 'interrupteur'],
      carrelage: ['faience', 'faïence', 'm2', 'revêtement'],
      peinture: ['enduit', 'kg', 'litre', 'façade'],
      document: ['pdf', 'fichier', 'plan', 'devis', 'rapport'],
    };

    const expandedWords = [...queryWords];
    for (const qw of queryWords) {
      const key = normalize(qw);
      if (synonymMap[key]) expandedWords.push(...synonymMap[key]);
      // Synonymes sur formes fléchies aussi (ex: "sacs" → synonymes de "sac")
      for (const [k, syns] of Object.entries(synonymMap)) {
        if (flexMatch(qw, k)) expandedWords.push(...syns);
      }
    }

    const lines = context
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 3);

    const scored = lines
      .map((line) => {
        // Score = nombre de mots de la requête présents dans la ligne
        const matchCount = expandedWords.filter((w) =>
          flexMatch(line, w),
        ).length;
        // Bonus si la ligne contient un chiffre (probable donnée quantitative)
        const hasNumber = /\d/.test(line) ? 1 : 0;
        // Bonus si la ligne contient une unité BTP
        const hasUnit =
          /\b(sac|kg|tonne|m2|m²|m3|ml|dt|tnd|brique|unité|pièce)\b/i.test(line)
            ? 1
            : 0;
        return { line, score: matchCount + hasNumber + hasUnit };
      })
      .filter(({ score }) => score >= 1)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;

    return scored
      .slice(0, 6)
      .map((s) => `• ${s.line}`)
      .join('\n');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERNAL PRODUCT SEARCH
  // ══════════════════════════════════════════════════════════════════════════

  async searchInternalProducts(query: string): Promise<Product[]> {
    try {
      const allProducts = await this.productsService.findAll();
      const q = query.toLowerCase();
      const filtered = allProducts.filter((p: any) => {
        const name = (p.name || p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return (
          name.includes(q) ||
          desc.includes(q) ||
          cat.includes(q) ||
          q
            .split(' ')
            .some((w) => w.length > 2 && (name.includes(w) || cat.includes(w)))
        );
      });
      return filtered.slice(0, 6);
    } catch (err) {
      this.logger.warn('Internal search failed:', err.message);
      return [];
    }
  }

  private resolveSearchTerms(message: string): string[] {
    const lower = message.toLowerCase();
    for (const [intent, terms] of Object.entries(CONSTRUCTION_INTENT_MAP)) {
      if (lower.includes(intent)) return terms.slice(0, 4);
    }
    // Fallback: extraire mots-clés de la requête
    const keywords = this.extractKeywords(message);
    return keywords.length > 0
      ? keywords.slice(0, 3)
      : ['ciment', 'brique', 'sable'];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WEB SCRAPING AMÉLIORÉ
  // ══════════════════════════════════════════════════════════════════════════

  async scrapeProductsFromWeb(
    originalQuery: string,
    searchTerms: string[],
  ): Promise<ScrapedProduct[]> {
    if (searchTerms.length === 0) return [];

    const intent = this.detectIntent(originalQuery);
    const sources =
      intent === 'outillage'
        ? [...SCRAPE_SOURCES_BTP, ...SCRAPE_SOURCES_OUTILLAGE]
        : SCRAPE_SOURCES_BTP;

    const results: ScrapedProduct[] = [];

    // Scraper en parallèle pour être plus rapide
    const scrapePromises = searchTerms
      .slice(0, 3)
      .flatMap((term) =>
        sources.map((source) => this.scrapeOneSource(source, term)),
      );

    const settled = await Promise.allSettled(scrapePromises);
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }

    // Dédoublonnage
    const seen = new Set<string>();
    return results
      .filter((p) => {
        const key = p.nomP.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }

  private async scrapeOneSource(
    source: any,
    keyword: string,
  ): Promise<ScrapedProduct[]> {
    const results: ScrapedProduct[] = [];
    try {
      const url = source.searchUrl(keyword);
      const html = await this.fetchHtml(url);
      if (!html) return results;
      const $ = cheerio.load(html);

      $(source.itemSelector)
        .slice(0, 5)
        .each((_, el) => {
          const name = $(el).find(source.nameSelector).first().text().trim();
          const priceRaw = $(el)
            .find(source.priceSelector)
            .first()
            .text()
            .trim();
          const price = this.parsePriceFromText(priceRaw);
          const href =
            $(el).find(source.linkSelector).first().attr('href') || '';
          const img =
            $(el).find(source.imageSelector).first().attr('src') || '';

          if (!name || name.length < 3) return;
          const nameLower = name.toLowerCase();

          const isBlacklisted = this.SCRAPING_BLACKLIST.some((bad) =>
            nameLower.includes(bad),
          );
          if (isBlacklisted) return;

          const kwWords = keyword
            .toLowerCase()
            .split(' ')
            .filter((w) => w.length > 2);
          const isRelevant = kwWords.some((w) => nameLower.includes(w));
          if (!isRelevant) return;

          results.push({
            nomP: name.slice(0, 100),
            prix: price,
            source: source.name,
            link: href.startsWith('http')
              ? href
              : href
                ? `${source.baseUrl}${href}`
                : source.baseUrl,
            isExternal: true,
            image: img.startsWith('http')
              ? img
              : img
                ? `${source.baseUrl}${img}`
                : undefined,
          });
        });
    } catch (err) {
      this.logger.warn(`[${source.name}] "${keyword}" → ${err.message}`);
    }
    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RAG CORRIGÉ — cherche dans TOUS les documents stockés
  // ══════════════════════════════════════════════════════════════════════════

  private async retrieveRagContext(
    query: string,
  ): Promise<{ context: string; sources: any[] }> {
    const sources: any[] = [];
    const chunks: string[] = [];

    // TENTATIVE 1 : ML Service (FAISS)
    try {
      const res = await fetch(`${this.mlServiceUrl}/rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, top_k: 6 }),
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        const data = await res.json();
        for (const c of data.contexts || []) {
          chunks.push(c.text);
          sources.push({
            filename: c.meta?.filename || 'Document',
            snippet: c.text.slice(0, 120) + '…',
          });
        }
        if (chunks.length > 0) {
          this.logger.log(`RAG ML: ${chunks.length} chunks récupérés`);
          return { context: chunks.join('\n\n'), sources };
        }
      }
    } catch (e) {
      this.logger.warn(`ML RAG indisponible: ${e.message}`);
    }

    // TENTATIVE 2 : RAG local
    if (this.ragStore.size > 0) {
      this.logger.log(
        `RAG local: ${this.ragStore.size} document(s) en mémoire`,
      );

      const normalize = (w: string) =>
        w
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      const flexMatch = (text: string, word: string): boolean => {
        const n = normalize(word);
        const t = normalize(text);
        const variants = [n, n + 's', n.replace(/s$/, '')].filter(
          (v) => v.length > 1,
        );
        return variants.some((v) => {
          try {
            return new RegExp(
              `\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
              'i',
            ).test(t);
          } catch {
            return false;
          }
        });
      };

      const genericStop = new Set([
        'les',
        'des',
        'pour',
        'dans',
        'avec',
        'que',
        'qui',
        'est',
        'sont',
        'une',
        'par',
        'sur',
        'pas',
        'plus',
        'mais',
        'aux',
        'par',
        'ces',
        'mes',
        'ses',
        'leur',
        'leurs',
      ]);

      const queryWords = query
        .toLowerCase()
        .replace(/[^\wàâäéèêëîïôùûüçœæ]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !genericStop.has(w));

      for (const [filename, fileChunks] of this.ragStore.entries()) {
        const fullText = fileChunks.join(' ');

        // Vérifier si AU MOINS UN mot de la question existe en mot entier dans le document
        const matchingWords = queryWords.filter((w) => flexMatch(fullText, w));
        const isDocExplicit =
          query.toLowerCase().includes('document') ||
          query.toLowerCase().includes('fichier');

        if (matchingWords.length === 0 && !isDocExplicit) {
          this.logger.log(
            `RAG local: "${filename}" non pertinent pour "${query}" (aucun mot entier trouvé) → ignoré`,
          );
          continue;
        }

        this.logger.log(
          `RAG local: "${filename}" pertinent — mots matchés: [${matchingWords.join(', ')}]`,
        );

        // Pour les petits documents pertinents → retourner tout
        if (fileChunks.length <= 5) {
          chunks.push(...fileChunks);
          sources.push({
            filename,
            snippet: fileChunks[0]?.slice(0, 120) + '…',
          });
          continue;
        }

        // Grands documents → scoring par chunks
        const scored = fileChunks
          .map((chunk) => {
            const score = matchingWords.filter((w) =>
              flexMatch(chunk, w),
            ).length;
            return { chunk, score };
          })
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score);

        if (scored.length > 0) {
          chunks.push(...scored.slice(0, 5).map((s) => s.chunk));
          sources.push({
            filename,
            snippet: scored[0].chunk.slice(0, 120) + '…',
          });
        } else if (isDocExplicit) {
          // Fallback : si c'est une question sur le doc mais 0 match, on retourne les premiers chunks
          chunks.push(...fileChunks.slice(0, 5));
          sources.push({
            filename,
            snippet: (fileChunks[0] || '').slice(0, 120) + '…',
          });
        }
      }
    }

    return { context: chunks.join('\n\n'), sources };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SYSTEM PROMPT OPTIMISÉ
  // ══════════════════════════════════════════════════════════════════════════

  private buildSystemPrompt(
    internal: any[],
    external: ScrapedProduct[],
    rag: { context: string; sources: any[] },
  ): string {
    const parts = [
      `Tu es Maram, experte en construction et matériaux BTP pour Fullstakers (Tunisie 🇹🇳).
Tu réponds en français, de façon concise, précise et professionnelle.
Les prix sont en Dinars Tunisiens (DT).

RÈGLES STRICTES :
1. 📄 DOCUMENT : Si un document est fourni, extrais et cite EXACTEMENT les valeurs numériques qu'il contient (quantités, prix, surfaces). NE PAS estimer si le document donne la réponse.
2. 🏪 CATALOGUE : Recommande nos produits Fullstakers en priorité.
3. 🌐 WEB : Utilise les produits web comme alternatives.
4. 🧠 EXPERTISE : Pour les recommandations villa/maison, donne des quantités précises basées sur les normes tunisiennes.`,
    ];

    if (rag.context && rag.context.trim().length > 10) {
      parts.push(
        `\n## 📄 CONTENU DU DOCUMENT (SOURCE PRIORITAIRE)\n\`\`\`\n${rag.context.slice(0, 3000)}\n\`\`\`\n` +
        `⚠️ Si la question porte sur des quantités ou données dans ce document, donne la valeur EXACTE du document.`,
      );
    }

    if (internal.length > 0) {
      parts.push(
        `\n## 🏪 CATALOGUE FULLSTAKERS\n` +
        internal.map((p) => `• ${p.nomP} — ${p.prix} DT`).join('\n'),
      );
    }

    if (external.length > 0) {
      parts.push(
        `\n## 🌐 PRODUITS TROUVÉS EN LIGNE\n` +
        external
          .map(
            (p) =>
              `• ${p.nomP} — ${p.prix != null ? p.prix + ' DT' : 'Prix N/D'} (${p.source})`,
          )
          .join('\n'),
      );
    }

    return parts.join('\n');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADVANCED TOOLS
  // ══════════════════════════════════════════════════════════════════════════

  async recommendMaterials(desc: string) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    const prompt = `Tu es un expert BTP en Tunisie. Recommande les matériaux pour ce projet: "${desc}".
Réponds UNIQUEMENT en JSON valide (sans markdown) avec ce format exact:
{"projectType":"...","recommendations":[{"category":"...","reason":"...","requiredQuantity":"...","options":[{"nomP":"...","prix":0,"inStock":true}]}]}`;

    try {
      const text = await callGemini(
        apiKey,
        'Expert BTP Tunisie. JSON uniquement.',
        [],
        prompt,
      );
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      // Réponse locale si Gemini indisponible
      return this.getLocalVillaRecommendation(desc);
    }
  }

  private getLocalVillaRecommendation(desc: string) {
    return {
      projectType: 'Villa / Construction neuve',
      recommendations: [
        {
          category: 'Ciment & Béton',
          reason: 'Base de toute construction',
          requiredQuantity: '300-400 sacs de 50kg',
          options: [
            { nomP: 'Ciment Portland CEM II 42.5', prix: 18, inStock: true },
            { nomP: 'Ciment CEM I 52.5', prix: 22, inStock: true },
          ],
        },
        {
          category: 'Fer à béton',
          reason: 'Armature structure',
          requiredQuantity: '3-4 tonnes (HA12, HA14, HA16)',
          options: [
            { nomP: 'Fer HA12 - barre 12m', prix: 38, inStock: true },
            { nomP: 'Fer HA16 - barre 12m', prix: 65, inStock: true },
          ],
        },
        {
          category: 'Briques',
          reason: 'Maçonnerie murs',
          requiredQuantity: '15 000 à 20 000 briques',
          options: [
            { nomP: 'Brique rouge 20x10x6cm', prix: 0.28, inStock: true },
            { nomP: 'Brique creuse 20x20x20cm', prix: 0.55, inStock: true },
          ],
        },
        {
          category: 'Sable & Gravier',
          reason: 'Mortier et béton',
          requiredQuantity: '40-60 m³ sable + 25-35 m³ gravier',
          options: [
            { nomP: 'Sable fin lavé (tonne)', prix: 45, inStock: true },
            { nomP: 'Gravier 15/25 (tonne)', prix: 55, inStock: true },
          ],
        },
        {
          category: 'Carrelage',
          reason: 'Revêtement sol et murs',
          requiredQuantity: '160-180 m²',
          options: [
            { nomP: 'Carrelage sol 60x60 grès', prix: 28, inStock: true },
            { nomP: 'Faïence murale 30x60', prix: 22, inStock: true },
          ],
        },
      ],
    };
  }

  async compareQuotes(quotes: any[]) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    try {
      const text = await callGemini(
        apiKey,
        'Expert devis construction Tunisie. JSON uniquement.',
        [],
        `Compare ces devis: ${JSON.stringify(quotes)}. JSON: { bestForPrice:{label,total}, recommendation }`,
      );
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return {
        recommendation:
          'Comparez les devis selon le rapport qualité/prix et les délais de livraison.',
      };
    }
  }

  async getSmartSchedule(body: any) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    try {
      const text = await callGemini(
        apiKey,
        'Expert planification chantier BTP tunisien. JSON uniquement.',
        [],
        `Planning: ${JSON.stringify(body)}. JSON: { suggestedWorkers, suggestedDurationDays, suggestedStart, suggestedEnd, recommendedDeliveryBy, message }`,
      );
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return {
        message:
          'Planning estimé: 8-12 mois pour une villa standard, 5-8 ouvriers recommandés.',
      };
    }
  }

  async suggestCategory(productName: string, description?: string) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    try {
      const text = await callGemini(
        apiKey,
        'Classification produits construction. JSON uniquement.',
        [],
        `Catégorie pour "${productName}". JSON: { suggestedCategory, confidence, method }`,
      );
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return {
        suggestedCategory: 'Matériaux de construction',
        confidence: 'medium',
        method: 'local',
      };
    }
  }

  async predictPriceTrends(productName: string) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    try {
      const text = await callGemini(
        apiKey,
        'Analyste prix matériaux Tunisie. JSON uniquement.',
        [],
        `Prix de "${productName}" en TND. JSON: { product, currentPrice, predictedPrice, trend, recommendation }`,
      );
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return {
        product: productName,
        recommendation:
          'Consultez les fournisseurs locaux pour les prix actuels.',
      };
    }
  }

  async getArtisanChatResponse(message: string) {
    return this.chatbotArtisanService.handleMessage(message);
  }

  async clusterProjects(k: number = 3) {
    const projects = await this.projectsService.findAll();
    return {
      clusters: [{ label: 'All', count: projects.length, projects }],
      totalProjects: projects.length,
    };
  }

  async recommendMaterialsScheduleAware(
    input: any,
  ): Promise<RecommendMaterialsBmpResponse> {
    const basic = await this.recommendMaterials(
      input.projectDescription || 'Villa 150m²',
    );
    return {
      project_summary: {
        surface_m2: '100',
        bedrooms: '3',
        bathrooms: '2',
        standing: 'Standard',
        budget_range: 'Medium',
        location: 'Tunis',
        unknown_fields: [],
      },
      planning_summary: [],
      materials_by_phase: basic.recommendations?.map((r: any) => ({
        phase: 'Construction',
        materials: r.options?.map((o: any) => ({
          material_name: o.nomP,
          suggested_quantity: r.requiredQuantity,
          estimated_unit_cost: o.prix,
          reason: r.reason,
        })),
      })) as any,
      budget_distribution_estimate: {
        structure_pct: 40,
        finishing_pct: 30,
        mep_pct: 15,
        bathrooms_kitchen_pct: 15,
      },
      risks_and_actions: [],
      next_required_inputs: [],
      _meta: { supplier_catalog_used: true },
    };
  }

  async generateQuotePDF(quoteData: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.text('DEVIS FULLSTAKERS');
      doc.text(`Description: ${quoteData.projectDescription || ''}`);
      doc.end();
    });
  }

  async generateReportPdf(): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.text('RAPPORT DE CHANTIER');
      doc.end();
    });
  }

  async analyzePlanVision(file: Express.Multer.File): Promise<any> {
    if (!this.genAI) {
      throw new BadRequestException('Gemini API non configurée');
    }

    const planBuf = await this.readUploadBuffer(file);
    const mimeType = file.mimetype;
    const prompt = `Tu es un expert en architecture. Analyse cette image.
Si l'image N'EST PAS un plan architectural (par exemple, une photo de personnes, un paysage, etc.), renvoie EXACTEMENT ce JSON avec une erreur :
{ "error": "Ceci n'est pas un plan architectural valide." }

Si c'est un plan architectural, extrais les informations et estime les surfaces. Renvoie EXACTEMENT ce format JSON (sans aucun texte autour) :
{
  "villa_name": "Villa Moderne",
  "surface_m2": 120,
  "bedrooms": 2,
  "floors": 1,
  "bathrooms": 1,
  "kitchens": 1,
  "wallArea": 200,
  "structuralArea": 15,
  "confidence": 85,
  "detectedType": "Appartement",
  "rooms": [
    { "name": "Salon", "surface": 30, "type": "living" }
  ]
} (Essaye de trouver le nom du projet ou de la villa écrit sur le plan si possible)`;

    const geminiKeys = this.getGeminiKeys();
    let lastError: Error | null = null;

    for (const apiKey of geminiKeys) {
      const genAI = new GoogleGenerativeAI(apiKey);
      for (const modelName of GEMINI_MODELS) {
        try {
          this.logger.log(`👁️ analyzePlanVision → essai ${modelName} (clé ...${apiKey.slice(-4)})`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            { inlineData: { data: planBuf.toString('base64'), mimeType } },
            prompt,
          ]);
          const textRes = result.response.text().replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(textRes);
          if (parsed.error) throw new BadRequestException(parsed.error);
          this.logger.log(`✅ analyzePlanVision réussi avec ${modelName}`);
          return { ...parsed, analysisId: `PLAN-${Date.now()}` };
        } catch (e: any) {
          if (e instanceof BadRequestException) throw e;
          const status = e?.status ?? e?.httpStatus ?? 0;
          const msg: string = e?.message ?? '';
          const isOverload =
            status === 503 || status === 429 || status === 404 ||
            msg.includes('503') || msg.includes('429') || msg.includes('404') ||
            msg.includes('overloaded') || msg.includes('quota') || msg.includes('not found');
          if (isOverload) {
            this.logger.warn(`⚠️ ${modelName} quota/surchargé, passage au suivant...`);
            lastError = new Error(`Quota dépassé sur ${modelName}`);
            continue;
          }
          this.logger.warn(`Erreur ${modelName}: ${msg.slice(0, 80)}`);
          lastError = new Error(`Erreur d'analyse avec ${modelName}`);
        }
      }
    }

    // Fallback OpenAI Vision
    if (this.openai) {
      try {
        this.logger.log('🤖 analyzePlanVision → Fallback OpenAI GPT-4o...');
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${planBuf.toString('base64')}` } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        });
        const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
        if (parsed.error) throw new BadRequestException(parsed.error);
        this.logger.log('✅ analyzePlanVision réussi avec OpenAI GPT-4o');
        return { ...parsed, analysisId: `PLAN-${Date.now()}` };
      } catch (e: any) {
        if (e instanceof BadRequestException) throw e;
        this.logger.error('❌ OpenAI Vision fallback échoué:', e.message);
      }
    }

    throw new BadRequestException(
      'Tous les services IA sont temporairement indisponibles. Réessayez dans quelques secondes.',
    );
  }

  async analyzeProgressVision(
    planFile: Express.Multer.File,
    photoFile: Express.Multer.File,
    plannedStartDate?: string,
  ) {
    // ── PRIORITÉ 1 : Gemini Vision (Plus précis pour l'avancement) ──────────────
    if (this.genAI) {
      try {
        const progressPrompt = `Compare ce plan architectural et cette photo de chantier.
Tu dois déterminer l'avancement actuel du chantier visible sur la photo parmi ces 5 phases strictes :
1. "terrassement" (Excavation, sol nu, engins de terrassement) -> 5%
2. "fondation" (Semelles, ferraillage au sol, coulage béton fondation) -> 15%
3. "structure" (Murs, poteaux, dalles en cours d'élévation) -> 45%
4. "second_oeuvre" (Cloisons, électricité, plomberie, menuiseries) -> 70%
5. "finition" (Peinture, carrelage, aménagements finaux) -> 95%

Renvoie UNIQUEMENT ce JSON (pas de markdown) :
{
  "compatible": true,
  "message": "Description précise de ce que tu vois et si ça correspond au plan.",
  "plan_phase_label": "Phase détectée dans le plan",
  "photo_phase_label": "Label de la phase photo",
  "photo_confidence": 0.95,
  "photo_progress": 5,
  "photo_phase": "terrassement",
  "phaseName": "Nom de la phase",
  "summary": "Résumé de l'analyse.",
  "observations": ["Observation détaillée 1", "Observation détaillée 2"],
  "recommendations": ["Recommandation action 1", "Recommandation 2"],
  "pipeline": [
    {"id": "terrassement", "label": "Terrassement", "pct": 5, "icon": "🚜", "active": true, "done": false},
    {"id": "fondation", "label": "Fondations", "pct": 15, "icon": "🏗", "active": false, "done": false},
    {"id": "structure", "label": "Structure", "pct": 45, "icon": "🧱", "active": false, "done": false},
    {"id": "second_oeuvre", "label": "Second Oeuvre", "pct": 70, "icon": "🔌", "active": false, "done": false},
    {"id": "finition", "label": "Finitions", "pct": 95, "icon": "🎨", "active": false, "done": false}
  ]
}
Assure-toi de bien mettre "active": true UNIQUEMENT sur la phase actuelle ("photo_phase"), et "done": true pour les phases précédentes. Maintiens les pourcentages correspondants.`;

        let progressLastError: Error | null = null;
        const geminiKeys = this.getGeminiKeys();
        for (const apiKey of geminiKeys) {
          const genAIInst = new GoogleGenerativeAI(apiKey);
          for (const modelName of GEMINI_MODELS) {
            try {
              this.logger.log(`✨ analyzeProgressVision → essai ${modelName} (clé ...${apiKey.slice(-4)})...`);
              const model = genAIInst.getGenerativeModel({ model: modelName });
              const result = await model.generateContent([
                { inlineData: { data: planFile.buffer.toString('base64'), mimeType: planFile.mimetype } },
                { inlineData: { data: photoFile.buffer.toString('base64'), mimeType: photoFile.mimetype } },
                progressPrompt,
              ]);
              const text = result.response.text().replace(/```json|```/g, '').trim();
              const data = JSON.parse(text);
              const phases = ['terrassement', 'fondation', 'structure', 'second_oeuvre', 'finition'];
              const activeIdx = phases.indexOf(data.photo_phase) !== -1 ? phases.indexOf(data.photo_phase) : 0;
              data.pipeline.forEach((p: any, i: number) => { p.active = i === activeIdx; p.done = i < activeIdx; });
              this.logger.log(`✅ analyzeProgressVision réussi avec ${modelName}`);
              return data;
            } catch (e: any) {
              const status = e?.status ?? e?.httpStatus ?? 0;
              const msg: string = e?.message ?? '';
              const isOverload =
                status === 503 || status === 429 || status === 404 ||
                msg.includes('503') || msg.includes('429') || msg.includes('404') ||
                msg.includes('overloaded') || msg.includes('quota') || msg.includes('not found');
              if (isOverload) {
                this.logger.warn(`⚠️ ${modelName} quota/surchargé, passage au suivant...`);
                progressLastError = new Error(`Quota dépassé sur ${modelName}`);
                continue;
              }
              this.logger.warn(`Erreur ${modelName}: ${msg.slice(0, 80)}`);
              progressLastError = new Error(`Erreur analyse avec ${modelName}`);
            }
          }
        }
        if (progressLastError) {
          this.logger.error(`❌ Tous les modèles Gemini ont échoué: ${progressLastError.message}`);
        }
      } catch { /* erreurs déjà loguées */ }
    } // fin if (this.genAI)

    // ── FALLBACK : ML Service (ResNet18 Vision) ─────────────────────────────
    try {
      this.logger.log(
        '🏗️ Fallback: Envoi au ML Service /compare (ResNet18)...',
      );
      const formData = new FormData();
      formData.append(
        'plan',
        new Blob([new Uint8Array(planFile.buffer)], {
          type: planFile.mimetype,
        }),
        planFile.originalname,
      );
      formData.append(
        'photo',
        new Blob([new Uint8Array(photoFile.buffer)], {
          type: photoFile.mimetype,
        }),
        photoFile.originalname,
      );

      const res = await fetch(`${this.mlServiceUrl}/compare`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60_000),
      });

      if (res.ok) {
        const mlData = await res.json();
        this.logger.log(
          `✅ ML Service: plan=${mlData.plan_phase_label}, réel=${mlData.photo_phase_label}`,
        );
        return mlData;
      }
      this.logger.warn(`⚠️ ML Service a répondu ${res.status}`);
    } catch (err) {
      this.logger.warn(`⚠️ ML Service indisponible: ${err.message}`);
    }

    // ── ULTIME FALLBACK ────────────────────────────────────────────────────────
    this.logger.warn('⚠️ Utilisation du fallback local (tous services IA indisponibles)');
    return {
      compatible: true,
      message: 'Analyse en mode simulation — les services IA sont temporairement indisponibles. Relancez le ML Service sur le port 8000.',
      plan_phase_label: 'Fondations',
      photo_phase_label: 'Structure',
      photo_phase: 'structure',
      photo_confidence: 0.6,
      photo_progress: 45,
      phaseName: 'Gros Œuvre',
      summary: 'Analyse locale — vérifiez le ML Service (port 8000) et vos clés Gemini.',
      observations: [
        'Les services IA sont indisponibles (quota Gemini et ML Service hors ligne).',
        'Relancez le ML Service avec : uvicorn main:app --port 8000',
        'Vérifiez vos clés GEMINI_API_KEY dans le fichier .env',
      ],
      recommendations: [
        'Relancez le service ML pour une analyse précise.',
        'Vérifiez vos quotas Gemini sur https://aistudio.google.com',
      ],
      pipeline: [
        { id: 'terrassement', label: 'Terrassement', pct: 5, icon: '🚜', active: false, done: true },
        { id: 'fondation', label: 'Fondations', pct: 15, icon: '🏗', active: false, done: true },
        { id: 'structure', label: 'Structure', pct: 45, icon: '🧱', active: true, done: false },
        { id: 'second_oeuvre', label: 'Second Œuvre', pct: 70, icon: '🔌', active: false, done: false },
        { id: 'finition', label: 'Finitions', pct: 95, icon: '🎨', active: false, done: false },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  extractKeywords(text: string): string[] {
    // ⚠️ NE PAS mettre de termes BTP ici (ciment, sac, fer, brique, etc.)
    const stopwords = new Set([
      'le',
      'la',
      'les',
      'de',
      'du',
      'des',
      'un',
      'une',
      'et',
      'ou',
      'pour',
      'dans',
      'sur',
      'avec',
      'est',
      'sont',
      'je',
      'tu',
      'il',
      'nous',
      'vous',
      'ils',
      'me',
      'mon',
      'ma',
      'mes',
      'ce',
      'cet',
      'cette',
      'ces',
      'que',
      'qui',
      'quoi',
      'comment',
      'avoir',
      'veux',
      'veut',
      'cherche',
      'trouver',
      'quel',
      'quelle',
      'quels',
      'quelles',
      'combien',
      'faut',
      'dois',
      'peut',
      'faire',
      'aussi',
      'très',
      'bien',
      'tout',
      'même',
      'plus',
      'moins',
      'entre',
      'chez',
      'par',
      'sur',
      'sous',
    ]);
    return text
      .toLowerCase()
      .replace(/[^\wàâäéèêëîïôùûüçœæ]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w))
      .slice(0, 8);
  }

  detectIntent(message: string): string {
    const l = message.toLowerCase();
    if (l.includes('devis') || l.includes('pdf')) return 'generate_quote';
    if (
      l.includes('perceuse') ||
      l.includes('meuleuse') ||
      l.includes('outillage')
    )
      return 'outillage';
    if (l.includes('prix') || l.includes('coût') || l.includes('combien'))
      return 'price_inquiry';
    if (
      l.includes('recommande') ||
      l.includes('matériau') ||
      l.includes('villa') ||
      l.includes('maison') ||
      l.includes('construction')
    )
      return 'recommend_materials';
    return 'general';
  }

  private parsePriceFromText(text: string): number | null {
    const clean = text.replace(/\s/g, '').replace(',', '.');
    const m = clean.match(/\d+\.?\d*/);
    if (!m) return null;
    const v = parseFloat(m[0]);
    return isNaN(v) || v <= 0 || v > 1_000_000 ? null : v;
  }

  private async fetchHtml(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
        },
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok ? res.text() : null;
    } catch {
      return null;
    }
  }

  private async extractTextFromFile(
    file: Express.Multer.File,
  ): Promise<string> {
    // ── TXT ──────────────────────────────────────────────────────────────────
    if (file.mimetype === 'text/plain') {
      return file.buffer.toString('utf-8');
    }

    // ── IMAGE ─────────────────────────────────────────────────────────────────
    if (file.mimetype.startsWith('image/')) {
      return this.extractTextFromImage(file);
    }

    // ── PDF ───────────────────────────────────────────────────────────────────
    if (
      file.mimetype === 'application/pdf' ||
      file.originalname?.toLowerCase().endsWith('.pdf')
    ) {
      // TENTATIVE 1 : pdf-parse (le plus fiable)
      try {
        // Désactiver le rendu de page pour éviter les crashs avec certains PDFs
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(file.buffer, {
          // Ne pas essayer de rendre les pages, juste extraire le texte
          pagerender: null,
          max: 0, // toutes les pages
        });

        const text = data?.text || '';

        // Vérifier que le texte extrait est lisible (pas du binaire)
        const readableChars = (text.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()%+-]/g) || [])
          .length;
        const readableRatio = text.length > 0 ? readableChars / text.length : 0;

        if (text.length > 50 && readableRatio > 0.5) {
          this.logger.log(
            `✅ pdf-parse: ${text.length} chars extraits (ratio lisible: ${(readableRatio * 100).toFixed(0)}%)`,
          );
          return text;
        }

        this.logger.warn(
          `pdf-parse a retourné du texte non lisible (ratio: ${(readableRatio * 100).toFixed(0)}%) → fallback`,
        );
      } catch (e) {
        this.logger.warn(`pdf-parse échoué: ${e.message}`);
      }

      // TENTATIVE 2 : Gemini Vision OCR (si clé disponible)
      const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
      if (apiKey && apiKey.startsWith('AIza')) {
        try {
          this.logger.log('🔍 Tentative OCR Gemini sur le PDF...');

          const base64 = file.buffer.toString('base64');
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

          const body = {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64,
                    },
                  },
                  {
                    text: `Extrais TOUT le texte de ce document PDF, page par page.
Conserve tous les chiffres, quantités, unités et tableaux tels quels.
Format de sortie : texte brut structuré, une information par ligne.
Exemples de format attendu :
- Sacs de ciment : 350
- Surface : 150 m²
- Budget total : 85 000 DT
Réponds UNIQUEMENT avec le contenu extrait, sans commentaires.`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0, maxOutputTokens: 4000 },
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(45_000),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text.length > 30) {
              this.logger.log(
                `✅ Gemini OCR PDF: ${text.length} chars extraits`,
              );
              return text;
            }
          } else {
            const errText = await res.text();
            this.logger.warn(
              `Gemini OCR PDF ${res.status}: ${errText.slice(0, 200)}`,
            );
          }
        } catch (e) {
          this.logger.warn(`Gemini OCR PDF échoué: ${e.message}`);
        }
      }

      // TENTATIVE 3 : Extraction manuelle du flux texte PDF
      // Les PDFs contiennent souvent du texte entre BT...ET (Begin Text / End Text)
      try {
        const raw = file.buffer.toString('latin1'); // latin1 préserve les bytes
        const textBlocks: string[] = [];

        // Extraire les blocs BT...ET
        const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
        let match: RegExpExecArray | null;

        while ((match = btEtRegex.exec(raw)) !== null) {
          const block = match[1];
          // Extraire le contenu des parenthèses Tj/TJ
          const tjRegex = /\(([^)]*)\)\s*(?:Tj|TJ)/g;
          let tjMatch: RegExpExecArray | null;
          while ((tjMatch = tjRegex.exec(block)) !== null) {
            const text = tjMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '')
              .replace(/\\t/g, ' ')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\')
              // Enlever les caractères non-imprimables sauf espace et newline
              .replace(/[^\x20-\x7EÀ-ÿ\n]/g, ' ')
              .trim();
            if (text.length > 1) textBlocks.push(text);
          }
        }

        if (textBlocks.length > 0) {
          const extracted = textBlocks
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          this.logger.log(
            `✅ Extraction manuelle PDF: ${extracted.length} chars, ${textBlocks.length} blocs`,
          );

          // Vérifier la qualité
          const readableRatio =
            (extracted.match(/[a-zA-ZÀ-ÿ0-9]/g) || []).length /
            extracted.length;
          if (readableRatio > 0.3 && extracted.length > 30) {
            return extracted;
          }
        }
      } catch (e) {
        this.logger.warn(`Extraction manuelle PDF échouée: ${e.message}`);
      }

      // ÉCHEC TOTAL : retourner message d'erreur explicite
      this.logger.error(
        `❌ Impossible d'extraire le texte du PDF "${file.originalname}"`,
      );
      return `[PDF non lisible: "${file.originalname}". Le fichier est peut-être scanné ou protégé. Veuillez convertir en PDF texte ou TXT.]`;
    }

    // ── Autres formats ────────────────────────────────────────────────────────
    try {
      return file.buffer.toString('utf-8');
    } catch {
      return file.buffer.toString('latin1');
    }
  }

  private chunkText(text: string, maxWords = 300): string[] {
    // Nettoyer le texte
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Découper par phrases (meilleur pour RAG)
    const sentences = cleanText
      .split(/(?<=[.!?;])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    // Grouper en chunks de ~maxWords mots
    const chunks: string[] = [];
    let current = '';
    let wordCount = 0;

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).length;
      if (wordCount + words > maxWords && current.length > 0) {
        chunks.push(current.trim());
        current = sentence + ' ';
        wordCount = words;
      } else {
        current += sentence + ' ';
        wordCount += words;
      }
    }
    if (current.trim().length > 10) chunks.push(current.trim());

    // Si le document est petit (< 2 chunks), garder tout en 1 chunk
    if (chunks.length === 0 && cleanText.length > 10) {
      return [cleanText];
    }

    return chunks;
  }

  /**
   * Vide la mémoire RAG (locale + ML Service)
   */
  async clearRag(): Promise<any> {
    this.logger.log('🧹 Vidage de la mémoire RAG...');

    // 1. Vider la Map locale
    this.ragStore.clear();

    // 2. Tenter de vider le ML Service
    try {
      const res = await fetch(`${this.mlServiceUrl}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        this.logger.log('✅ ML Service FAISS index vidé');
      } else {
        const err = await res.text();
        this.logger.warn(`Échec vidage ML Service: ${err}`);
      }
    } catch (e) {
      this.logger.warn(`ML Service indisponible pour le vidage: ${e.message}`);
    }

    return { status: 'cleared', local: true, ml: true };
  }

  private isGreeting(message: string): boolean {
    const greetings = [
      'hi',
      'hello',
      'salut',
      'bonjour',
      'coucou',
      'hey',
      'yo',
      'slt',
      'bjr',
      'allo',
      'hola',
    ];
    const msg = message
      .toLowerCase()
      .trim()
      .replace(/[?!.,]/g, '');
    return greetings.includes(msg) || msg.length < 3;
  }
}