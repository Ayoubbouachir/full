const productDataTranslations = {
    fr: {
        'Cement Mixer': {
            name: 'Bétonnière',
            description: 'Bétonnière industrielle pour les grands projets de construction.',
            category: 'Équipement'
        },
        'Power Drill': {
            name: 'Perceuse Électrique',
            description: 'Perceuse haute performance avec réglages de vitesse variables.',
            category: 'Outils'
        },
        'Safety Helmet': {
            name: 'Casque de Sécurité',
            description: 'Casque de protection durable pour la sécurité sur le chantier.',
            category: 'Sécurité'
        },
        'Measuring Tape': {
            name: 'Mètre Ruban',
            description: 'Mètre ruban professionnel de 10 m avec boîtier robuste.',
            category: 'Outils'
        },
        'Work Gloves': {
            name: 'Gants de Travail',
            description: 'Gants de protection résistants pour les travaux de construction lourds.',
            category: 'Sécurité'
        }
    },
    ar: {
        'Cement Mixer': {
            name: 'خلاطة أسمنت',
            description: 'خلاطة أسمنت صناعية لمشاريع البناء الكبيرة.',
            category: 'معدات'
        },
        'Power Drill': {
            name: 'مثقاب كهربائي',
            description: 'مثقاب عالي الأداء مع إعدادات سرعة متغيرة.',
            category: 'أدوات'
        },
        'Safety Helmet': {
            name: 'خوذة سلامة',
            description: 'خوذة حماية متينة للسلامة في موقع العمل.',
            category: 'سلامة'
        },
        'Measuring Tape': {
            name: 'شريط قياس',
            description: 'شريط قياس احترافي بطول 10 أمتار مع غلاف قوي.',
            category: 'أدوات'
        },
        'Work Gloves': {
            name: 'قفازات عمل',
            description: 'قفازات حماية متينة لأعمال البناء الشاقة.',
            category: 'سلامة'
        }
    }
};

export const translateProduct = (product, lang) => {
    if (!product || lang === 'en') return product;

    const translations = productDataTranslations[lang];
    if (!translations) return product;

    const translated = translations[product.nomP];
    if (!translated) return product;

    return {
        ...product,
        nomP: translated.name || product.nomP,
        description: translated.description || product.description,
        categorie: translated.category || product.categorie
    };
};
