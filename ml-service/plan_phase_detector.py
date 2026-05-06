"""
plan_phase_detector.py
══════════════════════════════════════════════════════════════════════════════
Détection de phase d'un plan architectural — 100% gratuit, 100% local

Méthode combinée (score de confiance agrégé) :
  1. Nom de fichier       — mots-clés dans le nom (rapide, prioritaire si trouvé)
  2. Tesseract OCR        — lecture du texte imprimé dans l'image du plan
  3. CLIP (ViT-B/32)      — analyse visuelle sémantique de l'image

Chaque méthode vote avec un poids. La phase gagnante est celle avec le score
agrégé le plus élevé. Si aucune méthode ne dépasse le seuil MIN_CONFIDENCE,
on retourne "unknown".

Installation :
    pip install pytesseract pillow numpy torch torchvision transformers
    # Linux :  sudo apt-get install tesseract-ocr tesseract-ocr-fra
    # macOS :  brew install tesseract tesseract-lang
    # Windows: https://github.com/UB-Mannheim/tesseract/wiki

Usage :
    from plan_phase_detector import detect_plan_phase

    result = detect_plan_phase("plan_chantier.jpg")
    print(result)
    # {
    #   "phase": "fondation",
    #   "label": "Fondations",
    #   "confidence": 0.87,
    #   "method": "clip+ocr",
    #   "details": { ... }
    # }
══════════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Union

import numpy as np
from PIL import Image

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | plan_detector | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("plan_detector")

# ─── Constantes ───────────────────────────────────────────────────────────────

# Phases dans l'ordre chronologique
PHASE_ORDER = ["terrassement", "fondation", "structure", "second_oeuvre", "finition"]

# Métadonnées des phases
PHASES_META = {
    "terrassement":  {"label": "Terrassement",  "icon": "[TR]", "pct": 5},
    "fondation":     {"label": "Fondations",     "icon": "[FD]", "pct": 15},
    "structure":     {"label": "Structure",      "icon": "[ST]", "pct": 45},
    "second_oeuvre": {"label": "Second oeuvre",  "icon": "[SO]", "pct": 72},
    "finition":      {"label": "Finitions",      "icon": "[FN]", "pct": 92},
}

# Mots-clés OCR/filename → phase
KEYWORD_MAP: dict[str, str] = {
    # terrassement
    "terrassement": "terrassement", "excavation": "terrassement",
    "deblai": "terrassement", "remblai": "terrassement",
    "earthwork": "terrassement", "nivellement": "terrassement",
    "decapage": "terrassement", "fouilles": "terrassement",
    "implantation": "terrassement", "topographie": "terrassement",
    "topographique": "terrassement", "relevé": "terrassement",
    # fondation
    "fondation": "fondation", "fondations": "fondation",
    "foundation": "fondation", "semelle": "fondation",
    "radier": "fondation", "pieux": "fondation",
    "micropieux": "fondation", "beton de proprete": "fondation",
    "longrine": "fondation", "amorces": "fondation",
    # structure
    "structure": "structure", "gros oeuvre": "structure",
    "gros œuvre": "structure", "beton arme": "structure",
    "béton armé": "structure", "poteau": "structure",
    "poteaux": "structure", "dalle": "structure",
    "charpente": "structure", "voile": "structure",
    "refend": "structure", "plancher": "structure",
    "elevation": "structure", "poutre": "structure",
    # second_oeuvre
    "second oeuvre": "second_oeuvre", "second œuvre": "second_oeuvre",
    "cloison": "second_oeuvre", "cloisons": "second_oeuvre",
    "plomberie": "second_oeuvre", "electricite": "second_oeuvre",
    "électricité": "second_oeuvre", "climatisation": "second_oeuvre",
    "menuiserie": "second_oeuvre", "isolation": "second_oeuvre",
    "faux plafond": "second_oeuvre",
    # finition
    "finition": "finition", "finitions": "finition",
    "peinture": "finition", "carrelage": "finition",
    "revetement": "finition", "revêtement": "finition",
    "facade": "finition", "façade": "finition",
    "enduit": "finition", "faience": "finition",
    "faïence": "finition", "parquet": "finition",
}

# Prompts CLIP pour chaque phase (descriptions visuelles de ce qu'on voit sur un plan)
CLIP_PROMPTS: dict[str, list[str]] = {
    "terrassement": [
        "architectural plan showing earthwork and excavation",
        "construction blueprint with terrain leveling and soil excavation",
        "site preparation plan with ground clearing and grading",
    ],
    "fondation": [
        "architectural blueprint showing foundation plan with footings",
        "construction drawing with concrete foundation and reinforcement bars",
        "structural plan showing pile foundation and base slabs",
        "floor plan of the building basement and foundations",
        "civil engineering drawing of structural footings and ground beams",
    ],
    "structure": [
        "architectural plan showing structural columns beams and slabs",
        "construction drawing with reinforced concrete frame and walls",
        "structural blueprint with floor plan columns and load bearing walls",
        "blueprint of a reinforced concrete skeleton structure",
    ],
    "second_oeuvre": [
        "architectural plan showing interior walls partitions and MEP",
        "construction drawing with plumbing electrical and HVAC layout",
        "floor plan with interior partition walls and technical networks",
    ],
    "finition": [
        "architectural plan showing interior finishes tiles and paint",
        "construction drawing with facade cladding and floor finishes",
        "detailed plan showing flooring tiling painting and finishing work",
    ],
}

# Poids des méthodes dans le vote final
WEIGHT_FILENAME = 0.50   # nom de fichier — très fiable si trouvé
WEIGHT_OCR      = 0.30   # OCR texte dans l'image
WEIGHT_CLIP     = 0.20   # analyse visuelle CLIP

# Seuil minimal de confiance agrégée pour retourner une phase
MIN_CONFIDENCE  = 0.15

# ─── Chargement CLIP (lazy, une seule fois) ───────────────────────────────────
_clip_model     = None
_clip_processor = None
_clip_loaded    = False


def _load_clip():
    """Charge CLIP ViT-B/32 depuis HuggingFace (téléchargé une seule fois en cache)."""
    global _clip_model, _clip_processor, _clip_loaded
    if _clip_loaded:
        return _clip_model is not None

    try:
        from transformers import CLIPModel, CLIPProcessor
        import torch

        log.info("Chargement CLIP ViT-B/32 (premier chargement : téléchargement HuggingFace)...")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_model.eval()
        log.info("CLIP chargé avec succès.")
        _clip_loaded = True
        return True
    except Exception as e:
        log.warning(f"CLIP non disponible : {e}. La détection sera uniquement OCR + filename.")
        _clip_loaded = True
        return False


# ─── Méthode 1 : Nom de fichier ───────────────────────────────────────────────

def _detect_from_filename(filename: str) -> dict[str, float]:
    """
    Retourne un dict phase → score (0.0 ou 1.0) basé sur les mots-clés du nom de fichier.
    Score 1.0 uniquement pour la phase trouvée.
    """
    scores = {p: 0.0 for p in PHASE_ORDER}
    if not filename:
        return scores

    # Nettoyer : retirer extension, remplacer séparateurs
    stem = Path(filename).stem.lower()
    stem = stem.replace("-", " ").replace("_", " ").replace(".", " ")

    for kw, phase in KEYWORD_MAP.items():
        if kw in stem:
            scores[phase] = 1.0
            log.info(f"[filename] Mot-clé '{kw}' → phase '{phase}'")
            return scores  # premier match suffit

    log.info(f"[filename] Aucun mot-clé trouvé dans '{stem}'")
    return scores


# ─── Méthode 2 : Tesseract OCR ────────────────────────────────────────────────

def _detect_from_ocr(img: Image.Image) -> dict[str, float]:
    """
    Extrait le texte de l'image via Tesseract et retourne scores par phase.
    Score = nombre de mots-clés de la phase trouvés / total mots-clés trouvés.
    """
    scores = {p: 0.0 for p in PHASE_ORDER}

    try:
        import pytesseract
    except ImportError:
        log.warning("[OCR] pytesseract non installé — OCR ignoré.")
        return scores

    try:
        # Préprocessing pour améliorer la lisibilité OCR
        # Redimensionner si trop petite
        w, h = img.size
        if max(w, h) < 1000:
            scale = 1000 / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        # Convertir en niveaux de gris + seuillage
        gray = img.convert("L")

        # OCR avec langues français + anglais
        config = r"--oem 3 --psm 3"
        text = pytesseract.image_to_string(gray, lang="fra+eng", config=config)

        if not text.strip():
            log.info("[OCR] Aucun texte extrait de l'image.")
            return scores

        log.info(f"[OCR] Texte extrait ({len(text)} chars) : {text[:200].strip()!r}...")

        # Compter les mots-clés par phase
        text_lower = text.lower()
        hit_counts = {p: 0 for p in PHASE_ORDER}
        total_hits = 0

        for kw, phase in KEYWORD_MAP.items():
            if kw in text_lower:
                hit_counts[phase] += 1
                total_hits += 1
                log.info(f"[OCR] Mot-clé trouvé : '{kw}' → {phase}")

        if total_hits == 0:
            log.info("[OCR] Aucun mot-clé de phase trouvé dans le texte.")
            return scores

        # Normaliser en scores 0-1
        for phase in PHASE_ORDER:
            scores[phase] = hit_counts[phase] / total_hits

        log.info(f"[OCR] Scores : { {p: round(s, 3) for p, s in scores.items() if s > 0} }")
        return scores

    except Exception as e:
        log.warning(f"[OCR] Erreur Tesseract : {e}")
        return scores


# ─── Méthode 3 : CLIP ─────────────────────────────────────────────────────────

def _detect_from_clip(img: Image.Image) -> dict[str, float]:
    """
    Utilise CLIP pour scorer la similarité de l'image avec les descriptions de chaque phase.
    Retourne scores normalisés par phase.
    """
    scores = {p: 0.0 for p in PHASE_ORDER}

    if not _load_clip() or _clip_model is None:
        return scores

    try:
        import torch

        # Collecter tous les prompts avec leur phase d'appartenance
        all_texts  = []
        text_phases = []
        for phase, prompts in CLIP_PROMPTS.items():
            for prompt in prompts:
                all_texts.append(prompt)
                text_phases.append(phase)

        # Encoder image + textes
        inputs = _clip_processor(
            text=all_texts,
            images=img,
            return_tensors="pt",
            padding=True,
            truncation=True,
        )

        with torch.no_grad():
            outputs = _clip_model(**inputs)
            # logits_per_image : [1, num_texts]
            logits  = outputs.logits_per_image[0]
            probs   = torch.softmax(logits, dim=0).cpu().numpy()

        # Agréger les scores par phase (moyenne des prompts de la phase)
        phase_scores: dict[str, list[float]] = {p: [] for p in PHASE_ORDER}
        for prob, phase in zip(probs, text_phases):
            phase_scores[phase].append(float(prob))

        for phase in PHASE_ORDER:
            if phase_scores[phase]:
                scores[phase] = float(np.mean(phase_scores[phase]))

        # Normaliser
        total = sum(scores.values())
        if total > 0:
            scores = {p: s / total for p, s in scores.items()}

        log.info(f"[CLIP] Scores : { {p: round(s, 3) for p, s in scores.items()} }")
        return scores

    except Exception as e:
        log.warning(f"[CLIP] Erreur : {e}")
        return scores


# ─── Fonction principale ───────────────────────────────────────────────────────

def detect_plan_phase(
    image_input: Union[str, Path, Image.Image],
    filename_hint: str = "",
) -> dict:
    """
    Détecte la phase de construction représentée par un plan architectural.

    Combine :
      - Nom de fichier (poids 50%)
      - Tesseract OCR  (poids 30%)
      - CLIP visuel    (poids 20%)

    Args:
        image_input  : chemin fichier, Path, ou PIL Image
        filename_hint: nom original du fichier (utile si image_input est une PIL Image)

    Returns:
        {
            "phase":      str,    # ID de phase ou "unknown"
            "label":      str,    # Nom lisible
            "icon":       str,    # Emoji
            "pct":        int,    # % approximatif d'avancement
            "confidence": float,  # 0.0 → 1.0
            "method":     str,    # méthodes ayant contribué
            "details": {
                "filename_scores": dict,
                "ocr_scores":      dict,
                "clip_scores":     dict,
                "final_scores":    dict,
            }
        }
    """
    # ── Charger l'image ────────────────────────────────────────────────────────
    if isinstance(image_input, (str, Path)):
        filename_hint = filename_hint or Path(image_input).name
        img = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
    else:
        raise ValueError(f"image_input doit être un chemin ou une PIL Image, reçu : {type(image_input)}")

    log.info(f"detect_plan_phase | image={filename_hint or 'PIL'} | taille={img.size}")

    # ── Méthode 1 : Nom de fichier ─────────────────────────────────────────────
    filename_scores = _detect_from_filename(filename_hint)
    filename_found  = any(s > 0 for s in filename_scores.values())

    # ── Méthode 2 : OCR ────────────────────────────────────────────────────────
    ocr_scores = _detect_from_ocr(img)

    # ── Méthode 3 : CLIP ───────────────────────────────────────────────────────
    clip_scores = _detect_from_clip(img)

    # ── Agrégation pondérée ────────────────────────────────────────────────────
    # Si le nom de fichier a trouvé quelque chose, lui donner tout le poids filename
    # sinon redistribuer vers OCR+CLIP
    if filename_found:
        w_fn, w_ocr, w_clip = WEIGHT_FILENAME, WEIGHT_OCR, WEIGHT_CLIP
    else:
        # Redistribuer le poids filename vers OCR et CLIP
        w_fn   = 0.0
        w_ocr  = WEIGHT_OCR  + WEIGHT_FILENAME * 0.6
        w_clip = WEIGHT_CLIP + WEIGHT_FILENAME * 0.4

    final_scores: dict[str, float] = {}
    for phase in PHASE_ORDER:
        final_scores[phase] = (
            w_fn   * filename_scores[phase] +
            w_ocr  * ocr_scores[phase]      +
            w_clip * clip_scores[phase]
        )

    log.info(f"Scores finaux : { {p: round(s, 3) for p, s in final_scores.items()} }")

    # ── Phase gagnante ─────────────────────────────────────────────────────────
    best_phase = max(final_scores, key=final_scores.get)
    best_score = final_scores[best_phase]

    # Déterminer quelles méthodes ont contribué
    methods_used = []
    if filename_found:                               methods_used.append("filename")
    if any(s > 0 for s in ocr_scores.values()):     methods_used.append("ocr")
    if any(s > 0 for s in clip_scores.values()):    methods_used.append("clip")
    method_str = "+".join(methods_used) if methods_used else "none"

    if best_score < MIN_CONFIDENCE:
        log.info(f"Confiance trop faible ({best_score:.3f}) → 'unknown'")
        return {
            "phase":      "unknown",
            "label":      "Inconnue",
            "icon":       "[?]",
            "pct":        0,
            "confidence": round(best_score, 4),
            "method":     method_str,
            "details": {
                "filename_scores": filename_scores,
                "ocr_scores":      ocr_scores,
                "clip_scores":     clip_scores,
                "final_scores":    final_scores,
            },
        }

    meta = PHASES_META[best_phase]
    log.info(f"Phase détectée : {best_phase} | confiance={best_score:.3f} | méthode={method_str}")

    return {
        "phase":      best_phase,
        "label":      meta["label"],
        "icon":       meta["icon"],
        "pct":        meta["pct"],
        "confidence": round(best_score, 4),
        "method":     method_str,
        "details": {
            "filename_scores": {p: round(s, 4) for p, s in filename_scores.items()},
            "ocr_scores":      {p: round(s, 4) for p, s in ocr_scores.items()},
            "clip_scores":     {p: round(s, 4) for p, s in clip_scores.items()},
            "final_scores":    {p: round(s, 4) for p, s in final_scores.items()},
        },
    }


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) < 2:
        print("Usage: python plan_phase_detector.py <image_plan> [nom_fichier_original]")
        print("Ex:    python plan_phase_detector.py plan.jpg plan_fondation.jpg")
        sys.exit(1)

    path  = sys.argv[1]
    hint  = sys.argv[2] if len(sys.argv) > 2 else ""
    result = detect_plan_phase(path, filename_hint=hint)

    print("\n" + "="*60)
    print("  Résultat de détection de phase")
    print("="*60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print(f"\n  Phase    : {result['icon']}  {result['label']}")
    print(f"  Confiance: {result['confidence']*100:.1f}%")
    print(f"  Méthode  : {result['method']}")
    print("="*60)
