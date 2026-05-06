/**
 * MOTEUR DE MATÉRIAUX — Marché Tunisien 2024-2025
 * Prix réels, fournisseurs vérifiés, logique de construction professionnelle
 */

// ─── Coefficients régionaux Tunisie (transport + main d'œuvre locale) ───────
export const LOCATION_COEFFICIENTS = {
    tunis: { label: 'Tunis / Grand Tunis', coeff: 1.00 },
    sfax: { label: 'Sfax', coeff: 0.93 },
    sousse: { label: 'Sousse / Monastir', coeff: 0.96 },
    nabeul: { label: 'Nabeul / Hammamet', coeff: 0.91 },
    bizerte: { label: 'Bizerte', coeff: 0.95 },
    gabes: { label: 'Gabès', coeff: 0.89 },
    gafsa: { label: 'Gafsa', coeff: 0.86 },
};

// ─── Coefficients de standing ────────────────────────────────────────────────
export const STANDING_PROFILES = {
    eco: {
        label: 'Économique',
        matCoeff: 0.72,   // matériaux basiques
        moCoeff: 0.50,    // M.O. : 50% du coût matériaux
        description: 'Matériaux standards, finitions simples',
    },
    std: {
        label: 'Standard',
        matCoeff: 1.00,
        moCoeff: 0.55,
        description: 'Bon rapport qualité/prix, finitions soignées',
    },
    lux: {
        label: 'Luxe / Haut standing',
        matCoeff: 1.52,   // matériaux premium
        moCoeff: 0.62,    // M.O. qualifiée plus chère
        description: 'Matériaux premium, finitions haute qualité',
    },
};

// ─── Catalogue matériaux Tunisie — prix unitaires HT en DT (marché 2024-2025)
const CATALOGUE = {
    // ── STRUCTURE ─────────────────────────────────────────────────────────────
    beton_b25: { cat: 'STRUCTURE', mat: 'Béton B25 (livré)', unite: 'm³', pu_std: 195, fournisseur: 'Ciment Oum Eddouil', dispo: 'En stock', note: 'Résistance 25 MPa — pour dalles et fondations' },
    beton_b30: { cat: 'STRUCTURE', mat: 'Béton B30', unite: 'm³', pu_std: 215, fournisseur: 'SCG Carthage', dispo: 'En stock', note: 'Haute résistance — poteaux et poutres' },
    acier_ha12: { cat: 'STRUCTURE', mat: 'Acier HA Ø12 mm', unite: 'kg', pu_std: 2.95, fournisseur: 'El Fouladh (SIDCO)', dispo: 'En stock', note: 'Barres rondes à haute adhérence — chaînages' },
    acier_ha14: { cat: 'STRUCTURE', mat: 'Acier HA Ø14 mm', unite: 'kg', pu_std: 2.90, fournisseur: 'El Fouladh (SIDCO)', dispo: 'En stock', note: 'Barres HA standard — armatures principales' },
    acier_ha16: { cat: 'STRUCTURE', mat: 'Acier HA Ø16 mm', unite: 'kg', pu_std: 2.88, fournisseur: 'El Fouladh (SIDCO)', dispo: 'En stock', note: 'Dalles et poutres principales' },
    brique_8t: { cat: 'STRUCTURE', mat: 'Brique creuse 8T', unite: 'm²', pu_std: 14.5, fournisseur: 'Briqueterie Grombalia', dispo: 'En stock', note: 'Brique 8 trous 20×20×35 — cloisons intérieures' },
    brique_10t: { cat: 'STRUCTURE', mat: 'Brique pleine 10T', unite: 'm²', pu_std: 18.0, fournisseur: 'Briqueterie Mornag', dispo: 'En stock', note: 'Murs extérieurs — isolation thermique renforcée' },
    ciment_425: { cat: 'STRUCTURE', mat: 'Ciment CEM I 42.5', unite: 'sac', pu_std: 8.20, fournisseur: 'Ciment de Bizerte', dispo: 'En stock', note: 'Sac 50kg — usage général maçonnerie' },
    ciment_525: { cat: 'STRUCTURE', mat: 'Ciment CEM II 52.5', unite: 'sac', pu_std: 9.80, fournisseur: 'Ciments Jbal Oust', dispo: 'En stock', note: 'Sac 50kg — béton haute résistance' },
    sable_riviere: { cat: 'STRUCTURE', mat: 'Sable de rivière', unite: 'm³', pu_std: 28.0, fournisseur: 'Carrière Oued Miliane', dispo: 'En stock', note: 'Granulométrie 0/4 — béton et mortier' },
    gravier_1632: { cat: 'STRUCTURE', mat: 'Gravier 16/32', unite: 'm³', pu_std: 34.0, fournisseur: 'Carrière Zaghouan', dispo: 'En stock', note: 'Concassé calibré — béton structurel' },
    hourdis_16: { cat: 'STRUCTURE', mat: 'Hourdis 16+5', unite: 'm²', pu_std: 22.0, fournisseur: 'STBP Tunis', dispo: 'En stock', note: 'Corps creux pour balle — portée 4m' },
    treillis_15: { cat: 'STRUCTURE', mat: 'Treillis soudé ST15', unite: 'm²', pu_std: 12.5, fournisseur: 'El Fouladh (SIDCO)', dispo: 'En stock', note: 'Maillage 15×15cm — dalle de compression' },
    marbre_thala: { cat: 'STRUCTURE', mat: 'Marbre Thala Gris', unite: 'm²', pu_std: 45.0, fournisseur: 'Marbrerie Carthage', dispo: 'En stock', note: 'Marbre local tunisien — idéal pour les seuils et appuis' },
    pierre_chabaane: { cat: 'STRUCTURE', mat: 'Pierre Dar Chaâbane', unite: 'm²', pu_std: 65.0, fournisseur: 'Artisan Nabeul', dispo: 'Sur commande', note: 'Pierre sculptée traditionnelle pour encadrements' },

    // ── PLOMBERIE ─────────────────────────────────────────────────────────────
    tuyau_pvc110: { cat: 'PLOMBERIE', mat: 'Tuyau PVC Ø110 mm', unite: 'ml', pu_std: 4.80, fournisseur: 'SOTUBI', dispo: 'En stock', note: 'Évacuation eaux usées — norme EN 1401' },
    tuyau_pvc50: { cat: 'PLOMBERIE', mat: 'Tuyau PVC Ø50 mm', unite: 'ml', pu_std: 2.60, fournisseur: 'SOTUBI', dispo: 'En stock', note: 'Eaux grises — évacuations lavabos' },
    tuyau_ppr20: { cat: 'PLOMBERIE', mat: 'Tube PPR Ø20 mm', unite: 'ml', pu_std: 3.20, fournisseur: 'SOPROMAT', dispo: 'En stock', note: 'Eau chaude/froide — résiste 95°C' },
    wc_suspendu_std: { cat: 'PLOMBERIE', mat: 'WC suspendu Roca', unite: 'pce', pu_std: 210, fournisseur: 'Sanitaires Ghazi', dispo: 'En stock', note: 'Pack complet avec bâti-support' },
    wc_suspendu_lux: { cat: 'PLOMBERIE', mat: 'WC suspendu Grohe', unite: 'pce', pu_std: 480, fournisseur: 'Grohe Tunisie', dispo: 'Sur commande', note: 'Design premium — sans bride' },
    lavabo_std: { cat: 'PLOMBERIE', mat: 'Lavabo encastré std', unite: 'pce', pu_std: 145, fournisseur: 'SOMOCER', dispo: 'En stock', note: 'Céramique blanche — 60×45 cm' },
    lavabo_lux: { cat: 'PLOMBERIE', mat: 'Vasque à poser', unite: 'pce', pu_std: 320, fournisseur: 'Atlas Céramique', dispo: 'Sur commande', note: 'Porcelaine design — 50cm Ø' },
    robinetterie: { cat: 'PLOMBERIE', mat: 'Robinet mélangeur', unite: 'pce', pu_std: 75, fournisseur: 'SOPROMAT', dispo: 'En stock', note: 'Chromé — lavabo & évier' },
    robinetterie_lux: { cat: 'PLOMBERIE', mat: 'Mitigeur Grohe', unite: 'pce', pu_std: 190, fournisseur: 'Grohe Tunisie', dispo: 'Sur commande', note: 'Série Essence — bec haut' },
    mitigeur_douche: { cat: 'PLOMBERIE', mat: 'Mitigeur douche', unite: 'pce', pu_std: 95, fournisseur: 'SOPROMAT', dispo: 'En stock', note: 'Thermostatique — anti-brûlure' },
    chauffe_eau: { cat: 'PLOMBERIE', mat: 'Chauffe-eau 100L', unite: 'pce', pu_std: 480, fournisseur: 'Thermor Tunisie', dispo: 'En stock', note: 'Ballon électrique — économique' },
    chauffe_eau_sol: { cat: 'PLOMBERIE', mat: 'Chauffe-eau solaire', unite: 'pce', pu_std: 1850, fournisseur: 'Soléo Énergie', dispo: 'Sur commande', note: '200L — panneaux inclus, exigence RT2020' },
    bac_douche: { cat: 'PLOMBERIE', mat: 'Receveur douche 90²', unite: 'pce', pu_std: 165, fournisseur: 'SOMOCER', dispo: 'En stock', note: 'Antidérapant — 90×90 cm' },

    // ── ÉLECTRICITÉ ───────────────────────────────────────────────────────────
    cable_25: { cat: 'ÉLECTRICITÉ', mat: 'Câble NYY 3G2.5mm²', unite: 'ml', pu_std: 2.10, fournisseur: 'SONELEC', dispo: 'En stock', note: 'Circuits prises — norme NF C 15-100' },
    cable_6: { cat: 'ÉLECTRICITÉ', mat: 'Câble NYY 3G6mm²', unite: 'ml', pu_std: 4.80, fournisseur: 'SONELEC', dispo: 'En stock', note: 'Circuit cuisinière / cumulus' },
    cable_15: { cat: 'ÉLECTRICITÉ', mat: 'Câble 1.5mm² éclairage', unite: 'ml', pu_std: 1.35, fournisseur: 'SONELEC', dispo: 'En stock', note: 'Circuits éclairage' },
    conduit_iro: { cat: 'ÉLECTRICITÉ', mat: 'Conduit IRO Ø20', unite: 'ml', pu_std: 0.95, fournisseur: 'STEG Matériaux', dispo: 'En stock', note: 'Protection des câbles — gaine rigide' },
    prise_16a: { cat: 'ÉLECTRICITÉ', mat: 'Prise 2P+T 16A', unite: 'pce', pu_std: 8.50, fournisseur: 'Schneider Electric', dispo: 'En stock', note: 'Série Unica — avec protection enfant' },
    interrupteur: { cat: 'ÉLECTRICITÉ', mat: 'Interrupteur simple', unite: 'pce', pu_std: 7.20, fournisseur: 'Schneider Electric', dispo: 'En stock', note: 'Série Unica — va-et-vient disponible' },
    spot_led: { cat: 'ÉLECTRICITÉ', mat: 'Spot LED 7W encastré', unite: 'pce', pu_std: 22.0, fournisseur: 'Elec Pro TN', dispo: 'En stock', note: '3000K — IRC>80 — bague GU10' },
    spot_led_lux: { cat: 'ÉLECTRICITÉ', mat: 'Spot LED 10W Paulmann', unite: 'pce', pu_std: 48.0, fournisseur: 'Paulmann Tunisie', dispo: 'Sur commande', note: 'Orientable — design aluminium brossé' },
    tableau_12p: { cat: 'ÉLECTRICITÉ', mat: 'Tableau électrique 12 disj.', unite: 'pce', pu_std: 285, fournisseur: 'Schneider Electric', dispo: 'En stock', note: 'Coffret encastré — bornier inclus' },
    tableau_18p: { cat: 'ÉLECTRICITÉ', mat: 'Tableau 18 disjoncteurs', unite: 'pce', pu_std: 420, fournisseur: 'Schneider Electric', dispo: 'En stock', note: 'Grande maison — 3 rangées' },
    detecteur_fum: { cat: 'ÉLECTRICITÉ', mat: 'Détecteur de fumée', unite: 'pce', pu_std: 35.0, fournisseur: 'Elec Pro TN', dispo: 'En stock', note: 'Norme EN 14604 — pile 10 ans' },

    // ── FINITIONS ─────────────────────────────────────────────────────────────
    carrelage_gres: { cat: 'FINITIONS', mat: 'Grès cérame 60×60', unite: 'm²', pu_std: 28.0, fournisseur: 'SOMOCER', dispo: 'En stock', note: 'Imitation béton — R9 antidérapant' },
    carrelage_lux: { cat: 'FINITIONS', mat: 'Carrelage 80×80 Rectifié', unite: 'm²', pu_std: 68.0, fournisseur: 'Atlas Céramique', dispo: 'Sur commande', note: 'Grès cérame poli — effet marbre' },
    faience_sdb: { cat: 'FINITIONS', mat: 'Faïence SdB 25×40', unite: 'm²', pu_std: 19.5, fournisseur: 'SOMOCER', dispo: 'En stock', note: 'Blanche brillante — emballage 1.5m²' },
    faience_lux: { cat: 'FINITIONS', mat: 'Faïence murale 30×90', unite: 'm²', pu_std: 55.0, fournisseur: 'Porcelanosa TN', dispo: 'Sur commande', note: 'Grand format — minimaliste' },
    peinture_int: { cat: 'FINITIONS', mat: 'Peinture Astral Mat', unite: 'm²', pu_std: 5.50, fournisseur: 'Astral Tunisie', dispo: 'En stock', note: '2 couches — mat lavable — pose incluse' },
    peinture_lux: { cat: 'FINITIONS', mat: 'Peinture Astral Satinée', unite: 'm²', pu_std: 12.0, fournisseur: 'Astral Tunisie', dispo: 'Sur commande', note: 'Velours absolu — 0 COV — grande couvrance' },
    enduit_plat: { cat: 'FINITIONS', mat: 'Enduit plâtre Knauf', unite: 'm²', pu_std: 9.80, fournisseur: 'Knauf Tunisie', dispo: 'En stock', note: 'Finition lisse — épaisseur 15mm' },
    isolation_min: { cat: 'FINITIONS', mat: 'Laine minérale 100mm', unite: 'm²', pu_std: 18.5, fournisseur: 'Isover Tunisie', dispo: 'En stock', note: 'R=2.5 m².K/W — toiture terrasse' },
    porte_int_std: { cat: 'FINITIONS', mat: 'Porte intérieure HDF', unite: 'pce', pu_std: 235, fournisseur: 'Bois Menuiserie TN', dispo: 'En stock', note: '80×210 cm — stratifié chêne — pose incluse' },
    porte_int_lux: { cat: 'FINITIONS', mat: 'Porte intérieure bois massif', unite: 'pce', pu_std: 620, fournisseur: 'Menuiserie Bardo', dispo: 'Sur commande', note: 'Hévéa verni — 83×210 cm — serrure incluse' },
    fenetre_pvc: { cat: 'FINITIONS', mat: 'Fenêtre PVC double vitrage', unite: 'pce', pu_std: 285, fournisseur: 'Aluminium Sfax', dispo: 'En stock', note: '2 vantaux 120×120 — vitrage 4/16/4' },
    fenetre_alu: { cat: 'FINITIONS', mat: 'Fenêtre alu laqué DVR', unite: 'pce', pu_std: 420, fournisseur: 'Profilés Bizerte', dispo: 'Sur commande', note: 'Rupture de pont thermique — RAL au choix' },
    portail_fer: { cat: 'FINITIONS', mat: 'Portail coulissant 4m', unite: 'pce', pu_std: 980, fournisseur: 'Serrurerie Ariana', dispo: 'Sur commande', note: 'Motorisé — galvanisé + peinture époxy' },
    garde_corps: { cat: 'FINITIONS', mat: 'Garde-corps inox 316L', unite: 'ml', pu_std: 185, fournisseur: 'Inox Design TN', dispo: 'Sur commande', note: 'Câbles tendus ou remplissage verre feuilleté' },
    zellige_nabeul: { cat: 'FINITIONS', mat: 'Zellige artisanal', unite: 'm²', pu_std: 85.0, fournisseur: 'Artisans Nabeul', dispo: 'Sur commande', note: 'Carreaux de terre cuite émaillée faits main' },
    porte_garage: { cat: 'FINITIONS', mat: 'Porte garage sectionnelle', unite: 'pce', pu_std: 1450, fournisseur: 'Serrurerie Ariana', dispo: 'Sur commande', note: 'Motorisée — isolée 40mm — avec télécommandes' },
    peinture_sol: { cat: 'FINITIONS', mat: 'Peinture sol époxy', unite: 'm²', pu_std: 35.0, fournisseur: 'Astral Tunisie', dispo: 'En stock', note: 'Spécial garage — haute résistance' },

    // ── CUISINE ───────────────────────────────────────────────────────────────
    evier_inox: { cat: 'CUISINE', mat: 'Évier inox 2 bacs', unite: 'pce', pu_std: 195, fournisseur: 'Franke Tunisie', dispo: 'En stock', note: '86×50 cm — avec siphon — brossé' },
    evier_granit: { cat: 'CUISINE', mat: 'Évier granit 1 bac', unite: 'pce', pu_std: 380, fournisseur: 'Blanco Tunisie', dispo: 'Sur commande', note: '56×51 cm — gris anthracite' },
    robinet_cuisine_std: { cat: 'CUISINE', mat: 'Mitigeur cuisine', unite: 'pce', pu_std: 88, fournisseur: 'SOPROMAT', dispo: 'En stock', note: 'Bec haut chromé — bague eco-flow' },
    robinet_cuisine_lux: { cat: 'CUISINE', mat: 'Mitigeur cuisine Grohe', unite: 'pce', pu_std: 220, fournisseur: 'Grohe Tunisie', dispo: 'Sur commande', note: 'Série Minta — extractible' },
    plan_travail_std: { cat: 'CUISINE', mat: 'Plan travail stratifié', unite: 'ml', pu_std: 145, fournisseur: 'Cuisine Expert TN', dispo: 'En stock', note: 'Ep. 38mm — chant ABS — anti-humidité' },
    plan_travail_granit: { cat: 'CUISINE', mat: 'Plan travail granit', unite: 'ml', pu_std: 480, fournisseur: 'Marbrerie Carthage', dispo: 'Sur commande', note: 'Ep. 20mm — poli brillant — couleur au choix' },
    placard_std: { cat: 'CUISINE', mat: 'Meuble cuisine std', unite: 'ml', pu_std: 185, fournisseur: 'Macadi Cuisines', dispo: 'En stock', note: 'Caissons mélaminé 18mm — façades MDF' },
    placard_lux: { cat: 'CUISINE', mat: 'Cuisine équipée premium', unite: 'ml', pu_std: 680, fournisseur: 'Scavolini Tunisie', dispo: 'Sur commande', note: 'Façades laquées mat — soft-close Blum' },
};

// ─── Fonction de Scraping Intégrée (Appel Backend) ──────────────────────────
export async function fetchLivePrices(materialName) {
    try {
        const response = await fetch(`http://localhost:3100/ai-assistant/scrape-web?query=${encodeURIComponent(materialName)}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.warn(`[Scraper] Impossible de récupérer les prix pour ${materialName}:`, error);
        return [];
    }
}

// ─── Règles de quantification ──────────────────
export async function computeMaterials(project, useLivePrices = false) {
    const { surface, chambres, sdb, standing, typeConst, hasGarage, hasCellier } = project;
    const sp = STANDING_PROFILES[standing] || STANDING_PROFILES.std;
    const loc = LOCATION_COEFFICIENTS[project.localisation] || LOCATION_COEFFICIENTS.tunis;
    const coeff = sp.matCoeff * loc.coeff;

    // Ratios structurels
    const volBeton = surface * 0.22;
    const kgAcier = surface * (standing === 'lux' ? 26 : 22);
    const msBrique = surface * 1.65;
    const sacsCim = Math.ceil(surface * 0.65);
    const m3Sable = surface * 0.14;
    const m3Gravier = surface * 0.18;
    const m2Hourdis = surface * 1.02;
    const m2Treillis = surface * 1.02;

    const mlPVC110 = 18 + sdb * 10 + chambres * 3;
    const mlPVC50 = 8 + sdb * 8;
    const mlPPR20 = 12 + sdb * 14 + 6;
    const nbWC = sdb;
    const nbLavabo = sdb + 1;
    const nbMitigeur = sdb + 1;
    const nbBacDouche = sdb;

    const mlCable25 = Math.round(surface * 5.2);
    const mlCable6 = Math.round(4 + sdb * 2);
    const mlCable15 = Math.round(surface * 3.8);
    const mlConduit = Math.round((mlCable25 + mlCable15) * 0.85);
    const nbPrises = Math.round(chambres * 6 + 8 + sdb * 2);
    const nbInter = Math.round(chambres * 3 + 6);
    const nbSpots = Math.round(surface * 0.38);
    const szTableau = surface > 160 ? 'tableau_18p' : 'tableau_12p';
    const nbDetectFumee = Math.max(2, Math.round(surface / 50));

    const m2Carrelage = Math.round(surface * 1.05);
    const m2FaienceSdb = sdb * 18;
    const m2Peinture = Math.round(surface * 2.85);
    const m2Enduit = Math.round(surface * 2.85);
    const m2Isolation = Math.round(surface * 1.1);
    const nbPorteInt = chambres + sdb + 3;
    const nbFenetre = Math.round(chambres * 1.5 + 4);
    const mlGardeCorps = (typeConst === 'villa' || typeConst === 'admin') ? Math.round(surface * 0.12) : 0;

    const mlPlanTravail = typeConst === 'admin' ? Math.max(1.5, Math.round(sdb * 0.8)) : Math.max(3, Math.round(Math.sqrt(surface) * 0.8));
    const mlPlacard = typeConst === 'admin' ? Math.max(2, Math.round(surface * 0.02)) : Math.max(4, Math.round(Math.sqrt(surface) * 1.2));

    const isLux = standing === 'lux';

    const addItem = async (key, qte, overridePu = null) => {
        const base = CATALOGUE[key];
        if (!base) return null;
        let pu = Math.round((overridePu ?? base.pu_std) * coeff);
        let liveLink = null;
        let isLive = false;
        if (useLivePrices) {
            const liveData = await fetchLivePrices(base.mat);
            if (liveData && liveData.length > 0) {
                const validPrices = liveData.filter(p => p.prix > 0);
                if (validPrices.length > 0) {
                    const cheapest = validPrices.sort((a, b) => a.prix - b.prix)[0];
                    pu = cheapest.prix;
                    liveLink = cheapest.link;
                    isLive = true;
                }
            }
        }
        return {
            id: key, cat: base.cat, mat: base.mat, qte: Math.round(qte * 10) / 10,
            unite: base.unite, pu, total: Math.round(pu * qte),
            fournisseur: isLive ? 'Web (Live)' : base.fournisseur,
            dispo: base.dispo, note: base.note, link: liveLink, isLive: isLive
        };
    };

    const itemsPromises = [
        addItem('beton_b25', volBeton * (isLux ? 0.4 : 0.6)),
        addItem('beton_b30', volBeton * (isLux ? 0.6 : 0.4)),
        addItem(isLux ? 'acier_ha16' : 'acier_ha14', kgAcier),
        addItem('acier_ha12', kgAcier * 0.3),
        addItem(surface > 150 ? 'brique_10t' : 'brique_8t', msBrique),
        addItem(isLux ? 'ciment_525' : 'ciment_425', sacsCim),
        addItem('sable_riviere', m3Sable),
        addItem('gravier_1632', m3Gravier),
        addItem('hourdis_16', m2Hourdis),
        addItem('treillis_15', m2Treillis),
        addItem('tuyau_pvc110', mlPVC110),
        addItem('tuyau_pvc50', mlPVC50),
        addItem('tuyau_ppr20', mlPPR20),
        addItem(isLux ? 'wc_suspendu_lux' : 'wc_suspendu_std', nbWC),
        addItem(isLux ? 'lavabo_lux' : 'lavabo_std', nbLavabo),
        addItem(isLux ? 'robinetterie_lux' : 'robinetterie', nbMitigeur),
        addItem('mitigeur_douche', nbMitigeur),
        addItem('bac_douche', nbBacDouche),
        addItem(isLux ? 'chauffe_eau_sol' : 'chauffe_eau', 1),
        addItem('cable_25', mlCable25),
        addItem('cable_6', mlCable6),
        addItem('cable_15', mlCable15),
        addItem('conduit_iro', mlConduit),
        addItem('prise_16a', nbPrises),
        addItem('interrupteur', nbInter),
        addItem(isLux ? 'spot_led_lux' : 'spot_led', nbSpots),
        addItem(szTableau, 1),
        addItem('detecteur_fum', nbDetectFumee),
        addItem(isLux ? 'carrelage_lux' : 'carrelage_gres', m2Carrelage),
        addItem(isLux ? 'faience_lux' : 'faience_sdb', m2FaienceSdb),
        addItem(isLux ? 'peinture_lux' : 'peinture_int', m2Peinture),
        addItem('enduit_plat', m2Enduit),
        addItem('isolation_min', m2Isolation),
        addItem(isLux ? 'porte_int_lux' : 'porte_int_std', nbPorteInt),
        addItem(isLux ? 'fenetre_alu' : 'fenetre_pvc', nbFenetre),
        ...(typeConst === 'villa' ? [addItem('portail_fer', 1)] : []),
        ...(mlGardeCorps > 0 ? [addItem('garde_corps', mlGardeCorps)] : []),
        ...(project.kitchens > 0 ? [
            addItem(isLux ? 'evier_granit' : 'evier_inox', project.kitchens),
            addItem(isLux ? 'robinet_cuisine_lux' : 'robinet_cuisine_std', project.kitchens),
            addItem(isLux ? 'plan_travail_granit' : 'plan_travail_std', mlPlanTravail),
            addItem(isLux ? 'placard_lux' : 'placard_std', mlPlacard),
        ] : []),
        ...(isLux ? [
            addItem('marbre_thala', surface * 0.15),
            addItem('zellige_nabeul', sdb * 4),
        ] : []),
        ...(hasGarage ? [
            addItem('porte_garage', 1),
            addItem('peinture_sol', 25),
        ] : []),
    ];

    const items = (await Promise.all(itemsPromises)).filter(Boolean);
    const totalMat = items.reduce((acc, i) => acc + i.total, 0);
    const moEstim = Math.round(totalMat * sp.moCoeff);
    const equip = Math.round(totalMat * 0.065);
    const imprevus = Math.round((totalMat + moEstim + equip) * 0.025);
    const total = totalMat + moEstim + equip + imprevus;

    return { items, totalMat, moEstim, equip, imprevus, total };
}

export function computePlanning(project) {
    const { surface, standing, typeConst } = project;
    // Ratios de complexité ajustés pour la Tunisie
    const sf = surface < 100 ? 0.85 : surface < 150 ? 1.00 : surface < 200 ? 1.12 : surface < 300 ? 1.25 : 1.45;
    const stf = standing === 'lux' ? 1.20 : standing === 'eco' ? 0.90 : 1.00;
    const tf = typeConst === 'duplex' ? 1.15 : typeConst === 'appt' ? 0.90 : typeConst === 'admin' ? 1.25 : 1.00;
    const dur = (base) => Math.round(base * sf * stf * tf);

    const phases = [
        { nom: 'Préparation & Terrassement', couleur: '#6366F1', duree: dur(10), dep: null, desc: 'Nivellement, décapage, implantation des axes' },
        { nom: 'Fondations', couleur: '#2563EB', duree: dur(20), dep: 0, desc: 'Fouilles, béton de propreté, semelles armées' },
        { nom: 'Structure / Gros œuvre', couleur: '#E85D26', duree: dur(45), dep: 1, desc: 'Poteaux, poutres, chaînages, coulage dalle' },
        { nom: 'Séchage dalle (Cure)', couleur: '#94a3b8', duree: 21, dep: 2, desc: 'Temps de séchage incompressible du béton (norme)' },
        { nom: 'Maçonnerie', couleur: '#D97706', duree: dur(25), dep: 3, desc: 'Cloisons briques, doublage, chape sol' },
        { nom: 'Toiture / Étanchéité', couleur: '#7C3AED', duree: dur(15), dep: 2, desc: 'Complexe étanchéité, isolation terrasse' },
        { nom: 'Plomberie & Électricité', couleur: '#0891B2', duree: dur(22), dep: 4, desc: 'Réseaux encastrés' },
        { nom: 'Enduit & Isolation', couleur: '#059669', duree: dur(18), dep: 4, desc: 'Enduit ciment ext., enduit plâtre int.' },
        { nom: 'Carrelage & Faïence', couleur: '#16A34A', duree: dur(20), dep: 7, desc: 'Pose carrelage sol, faïence SdB, joints' },
        { nom: 'Menuiseries', couleur: '#CA8A04', duree: dur(12), dep: 7, desc: 'Fenêtres, portes, volets' },
        { nom: 'Peinture & Finitions', couleur: '#BE185D', duree: dur(18), dep: 8, desc: 'Peinture int/ext., faux-plafonds' },
        { nom: 'Réception & Levée de réserves', couleur: '#374151', duree: dur(7), dep: 10, desc: 'Contrôle qualité, DOE' },
    ];

    const starts = new Array(phases.length).fill(0);
    for (let i = 1; i < phases.length; i++) {
        const d = phases[i].dep;
        if (d === null) { starts[i] = 0; continue; }

        // --- Optimisation du parallélisme réelle ---

        // La Toiture (5) peut commencer dès que 30% de la Structure (2) est faite
        if (i === 5) {
            starts[i] = starts[2] + Math.round(phases[2].duree * 0.3);
            continue;
        }
        // L'Enduit (7) peut commencer dès que 50% de la Maçonnerie (4) est faite
        if (i === 7) {
            starts[i] = starts[4] + Math.round(phases[4].duree * 0.5);
            continue;
        }
        // Les Menuiseries (9) commencent en même temps que le Carrelage (8)
        if (i === 9) {
            starts[i] = starts[8];
            continue;
        }

        // Par défaut, séquentiel par rapport à la dépendance principale
        starts[i] = starts[d] + phases[d].duree;
    }

    const totalJours = starts[phases.length - 1] + phases[phases.length - 1].duree;
    const totalSemaines = Math.ceil(totalJours / 7);
    const totalMois = Math.ceil(totalJours / 30);

    const processed = phases.map((p, i) => ({
        ...p,
        start: starts[i],
        startSem: Math.floor(starts[i] / 7),
        dureeSem: Math.ceil(p.duree / 7),
    }));

    return [...processed, { _meta: true, totalJours, totalSemaines, totalMois }];
}
