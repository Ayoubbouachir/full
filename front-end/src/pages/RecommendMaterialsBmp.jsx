import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BMP_PROJECT_KEY } from '../bmpProjectModel';
import { computeMaterials, computePlanning } from '../materialsEngine';
import './AIFeatures.css';
import './RecommendMaterialsBmp.css';
import '../components/AIDashboard/AIDashboard.css';

const PRODUCTS_API = 'http://localhost:3100/products/FindAll';

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/* ─── Shared nav / steps components ───────────────────────── */
function WorkflowSteps({ current }) {
  const steps = [
    { id: 1, label: 'Projet', icon: '📝' },
    { id: 2, label: 'Analyse IA', icon: '🧠' },
    { id: 3, label: 'Estimation', icon: '💰' },
    { id: 4, label: 'Planning', icon: '📅' },
  ];
  return (
    <div className="ai-dash-steps" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div
            className={`ai-dash-step ${current === step.id ? 'active' : current > step.id ? 'done' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem',
              borderRadius: '20px', background: current === step.id ? '#FFF7F4' : 'transparent',
              color: current === step.id ? '#E85D26' : '#94A3B8',
              fontWeight: current === step.id ? 700 : 500,
              border: current === step.id ? '1px solid #E85D26' : '1px solid transparent'
            }}
          >
            <span style={{ fontSize: '1rem' }}>{step.icon}</span>
            <span style={{ fontSize: '0.85rem' }}>{step.label}</span>
          </div>
          {index < steps.length - 1 && <div style={{ alignSelf: 'center', width: '20px', height: '1px', background: '#E2E8F0' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function FeatureSubNav() {
  return (
    <nav className="ai-feat-subnav" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', padding: '1rem 0', borderBottom: '1px solid #F1F5F9', marginBottom: '2rem' }}>
      {[
        { path: '/ai-features', label: 'Dashboard', icon: '🏠' },
        { path: '/ai-features/clustering', label: 'Clustering', icon: '📊' },
        { path: '/ai-features/assistant', label: 'Assistant', icon: '🤖' },
        { path: '/ai-features/recommend-materials-bmp', label: 'Projet Pro', icon: '🏗' },
      ].map(item => (
        <Link
          key={item.path}
          to={item.path}
          className="ai-feat-subnav-link"
          style={{ textDecoration: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}
        >
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function computeTotals(materials) {
  const rows = materials.map(m => {
    const quantity = Number(m.quantity) || 0;
    const unitPrice = Number(m.unitPrice) || 0;
    const total = Math.round(quantity * unitPrice * 100) / 100;
    return { ...m, quantity, unitPrice, total };
  });

  const totalMaterials = rows.reduce((s, r) => s + r.total, 0);
  const labor = Math.round(totalMaterials * 0.45);
  const equipment = Math.round(totalMaterials * 0.08);
  const subtotal = totalMaterials + labor + equipment;
  const contingency = Math.round(subtotal * 0.05);
  const estimatedConstruction = totalMaterials + labor + equipment + contingency;

  return {
    rows,
    totalMaterials,
    labor,
    equipment,
    contingency,
    estimatedConstruction,
  };
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function RecommendMaterialsBmp() {
  const navigate = useNavigate();
  const [project, setProject] = useState({
    villa_name: '',
    surface_m2: 150,
    bedrooms: 3,
    bathrooms: 2,
    kitchens: 1,
    standing: 'std',
    budget_range: '0-250k',
    location: 'tunis',
    construction_type: 'villa',
    hasGarage: false,
    hasCellier: false,
  });
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [materialFilterAvailable, setMaterialFilterAvailable] = useState(false);
  const [materialSortBy, setMaterialSortBy] = useState('default');

  // Web Scraping States
  const [scrapingStatus, setScrapingStatus] = useState({});
  const [webMatches, setWebMatches] = useState({});
  const [agentScraping, setAgentScraping] = useState(null); // Nom du fournisseur en cours de scraping
  const [selectedCategory, setSelectedCategory] = useState('TOUS');


  const handleSupplierClick = async (e, supplierName) => {
    if (e) e.preventDefault();
    if (!supplierName || supplierName === 'Catalogue') return;

    setAgentScraping(supplierName);
    try {
      const response = await fetch(`http://localhost:8000/scrape-supplier?name=${encodeURIComponent(supplierName)}`);
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error("Erreur Agent IA:", err);
      window.open(`https://www.google.tn/search?q=${encodeURIComponent(supplierName + ' tunisie site officiel')}`, '_blank');
    } finally {
      setAgentScraping(null);
    }
  };

  const resultRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('user')) {
      navigate('/login');
      return;
    }
    const planData = localStorage.getItem('bmp_plan_analysis');
    if (planData) {
      try {
        const parsed = JSON.parse(planData);
        setProject(prev => ({
          ...prev,
          surface_m2: parsed.surface_m2 ?? prev.surface_m2,
          bedrooms: parsed.bedrooms ?? prev.bedrooms,
          bathrooms: parsed.bathrooms ?? prev.bathrooms,
          kitchens: parsed.kitchens ?? prev.kitchens,
          construction_type: (parsed.detectedType?.toLowerCase().includes('admin')) ? 'admin' : prev.construction_type,
          hasGarage: parsed.rooms?.some(r => r.type === 'garage') ?? false,
          hasCellier: parsed.rooms?.some(r => r.type === 'storage') ?? false,
        }));

        // On ne clique plus automatiquement. L'utilisateur le fera manuellement.

      } catch { }
    }
    const stored = localStorage.getItem(BMP_PROJECT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProject(prev => ({
          ...prev,
          surface_m2: parsed.surface ?? prev.surface_m2,
          bedrooms: parsed.bedrooms ?? prev.bedrooms,
          bathrooms: parsed.bathrooms ?? prev.bathrooms,
          standing: parsed.standing || prev.standing,
          budget_range: parsed.budget || prev.budget_range,
          location: parsed.location || prev.location,
          kitchens: parsed.kitchens ?? prev.kitchens,
        }));
      } catch { }
    }
  }, [navigate]);

  useEffect(() => {
    if (materials.length && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [materials]);

  useEffect(() => {
    fetch(PRODUCTS_API)
      .then(res => res.ok ? res.json() : [])
      .then(data => setProductsCatalog(Array.isArray(data) ? data : []))
      .catch(() => setProductsCatalog([]));
  }, []);

  const handleProjectChange = (field, value) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  const [useLivePrices, setUseLivePrices] = useState(false);



  const handleGenerateMaterials = async (currentProject = project, liveToggle = useLivePrices) => {
    // Si l'argument est un événement (soumission manuelle), on l'ignore pour utiliser l'état actuel
    if (currentProject && typeof currentProject.preventDefault === 'function') {
      currentProject.preventDefault();
      currentProject = project;
      liveToggle = useLivePrices;
    }
    setError(null);
    const surface = Number(currentProject.surface_m2) || 0;
    if (!surface) return;

    setLoading(true);
    try {
      const engineInput = {
        surface: Number(currentProject.surface_m2),
        chambres: Number(currentProject.bedrooms),
        sdb: Number(currentProject.bathrooms),
        standing: currentProject.standing,
        localisation: currentProject.location,
        typeConst: currentProject.construction_type,
        hasGarage: currentProject.hasGarage,
        hasCellier: currentProject.hasCellier
      };

      const result = await computeMaterials(engineInput, liveToggle);

      const mappedItems = result.items.map(item => ({
        ...item,
        category: item.cat,
        material: item.mat,
        quantity: item.qte,
        unit: item.unite,
        unitPrice: item.pu,
        leadTimeDays: item.isLive ? 2 : 5
      }));

      setMaterials(mappedItems);
    } catch (err) {
      setError('Impossible de générer la liste de matériaux. Vérifiez votre connexion.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-generation dynamique quand le projet change ─────────
  // Désactivé : On ne veut plus de génération automatique au changement des inputs
  // La liste s'affichera uniquement au clic sur le bouton "Générer"
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Number(project.surface_m2) > 0) {
        handleGenerateMaterials(project, useLivePrices);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [project.surface_m2, project.bedrooms, project.bathrooms, project.standing, project.location, project.construction_type, project.hasGarage, project.hasCellier, useLivePrices]);
  */

  const handleMaterialChange = (index, field, value) => {
    setMaterials(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === 'quantity' || field === 'unitPrice' ? Number(value) || 0 : value };
      return next;
    });
  };

  const handleAddMaterialRow = () => {
    setMaterials(prev => [
      ...prev,
      {
        id: `custom_${prev.length + 1}`,
        category: 'CUSTOM',
        material: 'Nouveau matériau',
        quantity: 0,
        unit: '',
        unitPrice: 0,
        leadTimeDays: 5,
      },
    ]);
  };

  const handleRemoveMaterialRow = (index) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleWebScrape = async (materialId, materialName, category) => {
    setScrapingStatus(prev => ({ ...prev, [materialId]: true }));

    // Tentative 1: Nom complet nettoyé
    const cleanName = materialName.split(/[(\[]/)[0].trim();
    // Tentative 2: Premier mot seulement (ex: "Béton")
    const shortName = cleanName.split(' ')[0];

    const performScrape = async (query) => {
      try {
        // On interroge désormais l'Agent IA Python sur le port 8000 pour plus de puissance
        const response = await fetch('http://localhost:8000/scrape-material-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: query, category: category, basePrice: 100 }), // basePrice par défaut pour le calcul
        });
        if (!response.ok) return [];
        const result = await response.json();
        // On adapte le format pour qu'il soit compatible avec le reste du code
        return [result];
      } catch (e) {
        console.error("Scraping error:", e);
        return [];
      }
    };

    try {
      let data = await performScrape(cleanName);

      // Retry logic if no results
      if (data.length === 0 && shortName !== cleanName) {
        console.log(`No results for "${cleanName}", retrying with "${shortName}"...`);
        data = await performScrape(shortName);
      }

      if (data.length === 0 && category) {
        console.log(`No results for "${shortName}", retrying with category "${category}"...`);
        data = await performScrape(category);
      }

      if (data && data.length > 0) {
        setWebMatches(prev => ({ ...prev, [materialId]: data[0] }));
        if (data[0].price) {
          const idx = materials.findIndex(m => m.id === materialId);
          if (idx !== -1) handleMaterialChange(idx, 'unitPrice', data[0].price);
        }
      } else {
        alert('Aucun résultat trouvé sur le web pour ce matériau après plusieurs tentatives.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la recherche sur le web.');
    } finally {
      setScrapingStatus(prev => ({ ...prev, [materialId]: false }));
    }
  };

  const { rows, totalMaterials, labor, equipment, contingency, estimatedConstruction } = computeTotals(materials);

  const rowsWithProductInfo = React.useMemo(() => {
    return rows.map((row, idx) => {
      const deliveryDate = addDays(new Date(), row.leadTimeDays ?? 5);
      const webMatch = webMatches[row.id];
      return { ...row, originalIndex: idx, deliveryDate, webMatch };
    });
  }, [rows, webMatches]);

  const handleExportPdf = () => {
    if (!rows.length) return;
    const now = new Date();
    const displayDate = now.toLocaleDateString('fr-FR');

    // Logo BMP en Base64 (SVG)
    const logoBase64 = "PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNTMiIHZpZXdCb3g9IjAgMCA2MCA1MyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNi4yNTQgMTguMTY5NlYxOS44NjY0SDI3Ljk0OEgyOS42NDIxVjE4LjE2OTZWMTYuNDcyN0gyNy45NDhIMjYuMjU0VjE4LjE2OTZaTTMwLjM2ODEgMTguMTY5NlYxOS44NjY0SDMyLjA2MjFIMzMuNzU2MlYxOC4xNjk2VjE2LjQ3MjdIMzIuMDYyMUgzMC4zNjgxVjE4LjE2OTZaTTI2LjI1NCAyMi4zNTEyVjI0LjEwODZIMjcuOTQ4SDI5LjY0MjFWMjIuMzUxMlYyMC41OTM3SDI3Ljk0OEgyNi4yNTRWMjIuMzUxMlpNMzAuNDQ4OCAyMC42NzQ1QzMwLjQwNDQgMjAuNzE4OSAzMC4zNjgxIDIxLjUwOTcgMzAuMzY4MSAyMi40MzJWMjQuMTA4NkgzMi4wNjIxSDMzLjc1NjJWMjIuMzUxMlYyMC41OTM3SDMyLjE0MjhDMzEuMjU1NCAyMC41OTM3IDMwLjQ5MzEgMjAuNjMgMzAuNDQ4OCAyMC42NzQ1Wk0yMy4wNjQgMjYuNDA5NEMyMS41NDU1IDI2LjY4NiAxOS4zMDI2IDI3Ljk0MjUgMTguNTQwMiAyOC45NDM5QzE4LjE0MyAyOS40NjU2IDE3Ljk5NyAzMC4xMzEzIDE4LjMwNTggMzAuMDEyNkMxOS4yOTg0IDI5LjYzMSAyMi44NzEzIDI5LjYwMzQgMjQuMDE3OSAyOS45NjgzQzI0Ljc5IDMwLjIxNDIgMjYuMTIyNSAzMS4wMTc2IDI2LjQyIDMxLjQxNjlDMjYuNTgyOCAzMS42MzUzIDI2LjY3OTggMzIuMDY1OCAyNi43NTc5IDMyLjkxNTdDMjYuODE4IDMzLjU3MTYgMjYuOTQwOSAzNC4zOTA3IDI3LjAzMSAzNC43MzYxQzI3LjE4OTYgMzUuMzQ0NCAyNy4xODU2IDM1LjM3MjggMjYuOTAzNyAzNS42MzgxQzI2Ljc0MzYgMzUuNzg4OCAyNi40NTY3IDM2LjI0MjUgMjYuMjY2IDM2LjY0NjNDMjUuODM4NSAzNy41NTIgMjUuNDA1MiAzOC4wMDE5IDI0LjYyMDUgMzguMzU1QzI0LjI4NzcgMzguNTA0OCAyMy45IDM4Ljc1NTggMjMuNzU4OSAzOC45MTNDMjMuNDM1IDM5LjI3MzggMTcuMjk5OCA0OC4yMTkxIDE3LjIjk5OCA0OC4zMw01QzE3LjIjk5OCA0OC4zNzU4IDE4LjMwNjQgNDkuNDIwMSAxOS41MzY4IDUwLjY1MTJDMjEuNDc3MiA1Mi41OTI4IDIxLjc5NTkgNTIuODY1NyAyMS45NDA0IDUyLjcxMDVDMjIuMTE0NyA1Mi41MjMxIDI3Ljk4NTcgNDIuNzM2NiAyOC4yODg1IDQyLjEyODVDMjguMzk0MyA0MS45MTYxIDI4LjQ1NTkgNDEuNDY1NiAyOC40NDU1IDQwLjk4MTRDMjguNDIyNCAzOS45MTQ0IDI4LjU1OTIgMzkuNTQ3MSAyOS41NTA0IDM4LjAxN0wzMC4zOTQ0IDM2LjcxNDFIMzAuOTA0NEMzMS4xODUgMzYuNzE0MSAzMS44NjkzIDM2LjU3NzcgMzIuNDI1MSAzNi40MTExQzMyLjk4MSAzNi4yNDQ0IDMzLjU4NzAgMzYuMTA4IDMzLjc3MTggMzYuMTA4QzM0LjU3NjMgMzYuMTA4IDM1LjEyMjEgMzYuNjkxNSAzNS4yNDU2IDM3LjY4MzdDMzUuMzAwMyAzOC4xMjMyIDM1LjQwMzEgMzguMzA2IDM1Ljc3NTEgMzguNjI0NlszNi41MTE2IDM5LjI1NTUgMzcuMzM2NSAzOS43NTI5IDM3Ljk1NTcgMzkuOTM5N0MzOC40OTgxIDQwLjEwMzEgMzguNTU5NSA0MC4wOTczIDM5LjA3NzEgMzkuODMxN0MzOS41MjUzIDM5LjYwMTggMzkuNzg2MSAzOS4zMDk3IDQwLjUxMzIgMzguMjIzM0M0MS42MjExIDM2LjU2NzkgNDEuOTgxNyAzNS44MjI3IDQxLjk4MzEgMzUuMTg1MUM0MS45ODQ3IDM0LjUxNiA0MS43MjczIDM0LjIxNjYgNDAuMzI2IDMzLjI1ODJMMzkuMTY2MiAzMi40NjQ4TDM4LjUyOTggMzIuNjUwMkMzNy4yMDI4IDMzLjAzNjcgMzYuNjI5OSAzMi44MDgxIDM1Ljc5NDMgMzEuNTU5M0MzNS4yOTkxIDMwLjgxOTEgMzUuMTMyMiAzMC42ODcxIDMyLjkwNjkgMjkuMjc0OEMzMC40NzExIDI3LjcyODkgMjkuMjU5MyAyNy4xNjU4IDI3LjIyNzIgMjYuNjM1M0syNi4xOTI4IDI2LjM2NTMgMjMuOTY4OSAyNi4yNDQ1IDIzLjA2NCAyNi40MDk0WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yOC45NzIxIDAuMTYzNDY4QzI4LjM5NTEgMC40MjYyNDMgMC40MDA1NDkgMjguNTYzMSAwLjE3NzUxMSAyOS4xMDQ1Qy0wLjA1OTUwMyAyOS42Nzk5IC0wLjA1OTEzOTUgMzAuNDE2OSAwLjE3ODM4OSAzMC45OTExQzAuMzA3NzQgMzEuMzAzOCAyLjY0NzY5IDMzLjczMDQgNy44MzA0NyAzOC45MjYxQzExLjkzNjYgNDMuMDQyNSAxNS4zMzc2IDQ2LjQxMDYgMTUuMzg4MiA0Ni40MTA2QzE1LjQzODkgNDYuNDEwNiAxNS40ODAzIDQyLjg5MjYgMTUuNDgwMyAzOC41OTI4VjMwLjc3NUgxMy4yMzc4QzEwLjY1NDMgMzAuNzc1IDEwLjMxNzggMzAuNjk0NCA5Ljk4NzEgMjkuOTk2NEM5LjYwNTEgMjkuMTkwMSA5Ljc3NDAyIDI4Ljg5OTUgMTEuOTY0MyAyNi41OTM0QzEyLjQwNzUgMjYuMTI2NyAxNi40NTkyIDIxLjc3NzQgMjAuOTY4MSAxNi45MjgyQzI1LjQ3NjkgMTIuMDc4OSAyOS4yNjg1IDguMDU2NCAyOS4zOTM5IDcuOTg5MjVDMjkuNzcyIDcuNzg2NDcgMzAuNDI4NyA3Ljg0ODY1IDMwLjc3MjcgOC4xMTk3OUMzMC45NDkxIDguMjU4ODEgMzQuNDAwNiAxMS45MjUzIDM4LjQ0MjQgMTYuMjY3NUM0Mi40ODQ0IDIwLjYwOTcgNDYuNzA5MyAyNS4xNDU3IDQ3LjgzMTIgMjYuMzQ3NkM0OC45NTMgMjcuNTQ5MyA0OS45NTU5IDI4LjcwODEgNTAuMDU5OCAyOC45MjI0QzUwLjMyNjggMjkuNDcyOSA1MC4xMDEzIDMwLjIxMTEgNDkuNTY2MiAzMC41Mzc5QzQ5LjIxODMgMzAuNzUwNCA0OC45NDU1IDMwLjc3NDEgNDYuODUwMiAzMC43NzQ1TDQ0LjUyMDkgMzAuNzc1VjM4LjU5MjhDNDQuNTIwOSA0Mi44OTI2IDQ0LjU2MjMgNDYuNDEwNiA0NC42MTMgNDYuNDEwNkM0NC42NjM2IDQ2LjQxMDYgNDguMDg4MSA0My4wMTUyIDUyLjIyMjggMzguODY1NUM1OC4yODQgMzIuNzgyNCA1OS43Njk0IDMxLjIyOTggNTkuODg4OCAzMC44NTIzQzYwLjExMTcgMzAuMTQ4IDU5Ljk4OTggMjkuMTc2OSA1OS42MDk3IDI4LjYyOTlDNTkuNDMzNSAyOC4zNzY0IDUzLjAzOTcgMjEuOTEyNSA0NS40MDEzIDE0LjI2NTdDMzUuNTg5NyA0LjQ0MzI1IDMxLjM4MTEgMC4zMDczNCAzMS4wNjMyIDAuMTc1NDY4QzMwLjUxMTkgLTAuMDUzMzY5IDI5LjQ2MTUgLTAuMDU5NDI5MiAyOC45NzIxIDAuMTYzNDY4WiIgZmlsbD0iI0ZFODUwMCIvPgo8L3N2Zz4K";

    const htmlRows = rowsWithProductInfo.map((r, idx) => {
      const dateText = r.deliveryDate.toLocaleDateString('fr-FR');
      const fournisseur = r.webMatch ? r.webMatch.source : (r.fournisseur || 'Catalogue');
      return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="text-align:center; color: #6b7280;">${idx + 1}</td>
        <td><span style="font-weight: 600; color: #475569; font-size: 10px;">${r.category}</span></td>
        <td style="font-weight: 500;">${r.material}</td>
        <td style="text-align:right">${r.quantity}</td>
        <td style="color: #6b7280;">${r.unit || ''}</td>
        <td style="text-align:right">${r.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right; font-weight: 700; color: #1e293b;">${r.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
        <td style="font-size: 11px; color: #475569;">${fournisseur}</td>
        <td style="text-align:center; font-size: 11px; color: #6b7280;">${dateText}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charSet="utf-8" />
  <title>Devis Estimatif BMP AI</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E85D26; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-container { display: flex; align-items: center; gap: 15px; }
    .logo-img { width: 50px; height: auto; }
    .brand-name { font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; }
    .brand-name span { color: #E85D26; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #E85D26; margin-bottom: 4px; }
    .doc-date { font-size: 12px; color: #64748b; }
    
    .project-card { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0; display: flex; gap: 40px; }
    .project-info h1 { font-size: 20px; font-weight: 700; margin: 0 0 10px 0; color: #0f172a; }
    .project-meta { font-size: 13px; color: #475569; }
    .project-meta strong { color: #1e293b; }
    
    .summary-box { background: linear-gradient(135deg, #E85D26 0%, #ff7e4b 100%); border-radius: 12px; padding: 20px; color: white; min-width: 200px; text-align: center; box-shadow: 0 4px 12px rgba(232, 93, 38, 0.2); }
    .summary-label { font-size: 11px; text-transform: uppercase; font-weight: 600; opacity: 0.9; margin-bottom: 5px; display: block; }
    .summary-value { font-size: 24px; font-weight: 800; }

    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th { background: #1e293b; color: white; padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    
    .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; paddingTop: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 20px; }
      .project-card { break-inside: avoid; }
    }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div class="logo-container">
      <img src="data:image/svg+xml;base64,${logoBase64}" class="logo-img" />
      <div class="brand-name">BMP<span>.tn</span></div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Devis Estimatif Matériaux</div>
      <div class="doc-date">Généré le ${displayDate}</div>
    </div>
  </div>

  <div class="project-card">
    <div class="project-info" style="flex: 1;">
      <h1>Projet : ${project.villa_name || 'Ma Construction'}</h1>
      <div class="project-meta">
        <p>Surface : <strong>${project.surface_m2} m²</strong> | Type : <strong>${project.construction_type}</strong></p>
        <p>Client : <strong>${clientName || 'Particulier'}</strong> ${clientEmail ? `(${clientEmail})` : ''}</p>
      </div>
    </div>
    <div class="summary-box">
      <span class="summary-label">Estimation Globale</span>
      <div class="summary-value">${estimatedConstruction.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <small style="font-size: 14px;">DT</small></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align:center;">#</th>
        <th>Catégorie</th>
        <th>Désignation</th>
        <th style="text-align:right;">Qté</th>
        <th>Unité</th>
        <th style="text-align:right;">P.U (DT)</th>
        <th style="text-align:right;">Total (DT)</th>
        <th>Fournisseur</th>
        <th style="text-align:center;">Livraison</th>
      </tr>
    </thead>
    <tbody>${htmlRows}</tbody>
  </table>

  <div class="footer">
    <p>Ce document est une estimation générée par l'IA de BMP.tn. Les prix sont indicatifs basés sur le marché tunisien 2024-2025.</p>
    <p>&copy; ${new Date().getFullYear()} BMP.tn - Leading Innovation in Modern Construction</p>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.open(); win.document.write(html); win.document.close(); }
  };

  const handleExportCsv = () => {
    if (!rows.length) return;
    const headers = ['Category', 'Material', 'Quantity', 'Unit', 'UnitPrice', 'Total', 'Fournisseur'];
    const csvLines = [
      headers.join(';'),
      ...rowsWithProductInfo.map(r => [r.category, r.material, r.quantity, r.unit, r.unitPrice, r.total, r.webMatch?.source || r.fournisseur].join(';')),
    ];
    const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis-materiaux-bmp.csv`;
    a.click();
  };

  return (
    <div className="ai-features-page ai-dashboard-wrap bmp-page">
      <div className="ai-dash-container" style={{ maxWidth: 1100, margin: '0 auto', paddingTop: '2rem' }}>

        {/* ── Hero ─────────────────────────── */}
        <header className="ai-dash-hero" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <nav style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <Link to="/ai-features" style={{ color: '#E85D26', textDecoration: 'none' }}>🏗 Dashboard</Link>
            <span>›</span>
            <span>Plan Analysis</span>
            <span>›</span>
            <span style={{ fontWeight: 600 }}>Planning &amp; Matériaux</span>
          </nav>

          <div style={{ display: 'inline-block', padding: '6px 16px', background: '#FFF7F4', color: '#E85D26', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', border: '1px solid #E85D26' }}>
            Étape 2 — BMP AI CONSTRUCTION
          </div>
          <h1 className="ai-dash-title" style={{ fontSize: '2.8rem', marginBottom: '1rem', color: '#1e293b' }}>Planning & Matériaux</h1>
          <p className="ai-dash-subtitle" style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: '750px', margin: '0 auto', lineHeight: 1.6 }}>
            À partir des données du projet, l'IA génère automatiquement la liste des matériaux, le devis estimatif et le coût global de construction.
          </p>
        </header>

        <WorkflowSteps current={materials.length > 0 ? 3 : 1} />
        <FeatureSubNav />

        {/* ── Project summary + client ─────── */}
        <form onSubmit={handleGenerateMaterials} className={`bmp-card ${loading ? 'is-loading' : ''}`}>
          <div className="bmp-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <span className="bmp-card-header-icon" style={{ background: '#FFF7F4', padding: '10px', borderRadius: '12px', color: '#E85D26' }}>🏠</span>
            <h2 className="bmp-card-title">Paramètres du projet</h2>
            {loading && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#E85D26', fontWeight: 700, animation: 'pulse 1.5s infinite' }}>Calcul IA en cours...</span>}
          </div>

          <span className="bmp-section-label">Informations générales</span>
          <div className="bmp-fields-grid">
            {[
              { field: 'villa_name', label: 'Nom du projet', type: 'text', ph: 'Ex. Villa Les Oliviers' },
              { field: 'surface_m2', label: 'Surface (m²)', type: 'number', ph: '150' },
              { field: 'bedrooms', label: 'Chambres', type: 'number', ph: '3' },
              { field: 'bathrooms', label: 'Salles de bain', type: 'number', ph: '2' },
              { field: 'kitchens', label: 'Cuisines', type: 'number', ph: '1' },
              { field: 'location', label: 'Localisation', type: 'text', ph: 'Tunis' },
              { field: 'budget_range', label: 'Budget', type: 'text', ph: '0-250k' },
            ].map(({ field, label, type, ph }) => (
              <div key={field} className="bmp-field">
                <label>{label}</label>
                <input
                  type={type}
                  value={project[field] ?? ''}
                  placeholder={ph}
                  onChange={e => handleProjectChange(field, e.target.value)}
                />
              </div>
            ))}
            <div className="bmp-field">
              <label>Standing</label>
              <select value={project.standing} onChange={e => handleProjectChange('standing', e.target.value)}>
                <option value="eco">Économique</option>
                <option value="std">Standard</option>
                <option value="lux">Premium / Haut de gamme</option>
              </select>
            </div>
            <div className="bmp-field">
              <label>Type de construction</label>
              <select value={project.construction_type} onChange={e => handleProjectChange('construction_type', e.target.value)}>
                <option value="villa">Villa Individuelle</option>
                <option value="admin">Bâtiment Administratif</option>
                <option value="duplex">Duplex / Jumelée</option>
                <option value="appt">Appartement (Rénovation)</option>
              </select>
            </div>
          </div>

          <div className="bmp-cta" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            <button
              id="btn-generate-materials"
              type="submit"
              className="ai-dash-btn-primary"
              disabled={loading}
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              {loading ? 'Calcul en cours...' : '✨ Générer la liste de matériaux IA'}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <label className="ai-dash-switch-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: '#fff', padding: '0.5rem 1rem', borderRadius: '30px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <input
              type="checkbox"
              checked={useLivePrices}
              onChange={e => setUseLivePrices(e.target.checked)}
              style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
              🔍 Mode Temps Réel (Scraping live)
            </span>
          </label>
        </div>

        {/* ── Materials & quotation ───────── */}
        {materials.length > 0 && (
          <div ref={resultRef}>
            {/* ── Category Tabs ── */}
            <div className="bmp-tabs-container" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setSelectedCategory('TOUS')}
                className={`bmp-tab-btn ${selectedCategory === 'TOUS' ? 'active' : ''}`}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0',
                  background: selectedCategory === 'TOUS' ? '#E85D26' : '#fff',
                  color: selectedCategory === 'TOUS' ? '#fff' : '#64748b',
                  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}
              >
                📊 TOUS ({rowsWithProductInfo.length})
              </button>
              {Array.from(new Set(rowsWithProductInfo.map(m => m.category || 'DIVERS'))).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`bmp-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0',
                    background: selectedCategory === cat ? '#FFD700' : '#fff',
                    color: selectedCategory === cat ? '#000' : '#64748b',
                    fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                    boxShadow: selectedCategory === cat ? '0 4px 12px rgba(255, 215, 0, 0.3)' : 'none'
                  }}
                >
                  {cat} ({rowsWithProductInfo.filter(m => (m.category || 'DIVERS') === cat).length})
                </button>
              ))}
            </div>

            <div className="bmp-card">
              <div className="bmp-card-header" style={{ marginBottom: '0.5rem' }}>
                <span className="bmp-card-header-icon" style={{ background: '#FFF7ED', padding: '10px', borderRadius: '12px', color: '#EA580C' }}>🧱</span>
                <h2 className="bmp-card-title">Détail : {selectedCategory}</h2>
              </div>

              {/* ── Yellow Category Summary Bar (Zone sélectionnée par l'utilisateur) ── */}
              <div style={{
                background: '#FEFCE8',
                borderLeft: '4px solid #FACC15',
                padding: '0.75rem 1.25rem',
                margin: '0 1.5rem 1.5rem 1.5rem',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <span style={{ color: '#854D0E', fontWeight: 600, fontSize: '0.9rem' }}>
                  📊 {rowsWithProductInfo.filter(m => selectedCategory === 'TOUS' || (m.category || 'DIVERS') === selectedCategory).length} articles dans cette section
                </span>
                <span style={{ color: '#854D0E', fontWeight: 800, fontSize: '1rem' }}>
                  Total {selectedCategory} : {rowsWithProductInfo
                    .filter(m => selectedCategory === 'TOUS' || (m.category || 'DIVERS') === selectedCategory)
                    .reduce((sum, it) => sum + (it.total || 0), 0)
                    .toLocaleString()} DT
                </span>
              </div>

              <div className="bmp-table-container">
                <table className="bmp-devis-table">
                  <thead>
                    <tr>
                      <th>Catégorie</th>
                      <th>Matériau</th>
                      <th>Quantité / Unité</th>
                      <th>Prix unitaire (DT)</th>
                      <th>Total (DT)</th>
                      <th>Fournisseur / Match</th>
                      <th>Livraison</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rowsWithProductInfo
                      .filter(m => selectedCategory === 'TOUS' || (m.category || 'DIVERS') === selectedCategory)
                      .map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td>
                            <span className={`bmp-badge-cat ${m.category === 'STRUCTURE' ? 'bmp-cat-structure' :
                              m.category === 'MAÇONNERIE' ? 'bmp-cat-maconnerie' :
                                m.category === 'FINITION' ? 'bmp-cat-finition' : 'bmp-cat-default'
                              }`}>
                              {m.category || 'DIVERS'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#1e293b' }}>{m.material}</td>
                          <td>
                            <span style={{ fontWeight: 700 }}>{m.quantity}</span>
                            <span className="bmp-qte-unit">{m.unit}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{Number(m.unitPrice).toLocaleString()} DT</span>
                              {m.isLive && (
                                <span className="bmp-price-verified">
                                  <span style={{ fontSize: '12px' }}>✅</span> Vérifié IA
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="bmp-total-cell">{Number(m.total).toLocaleString()} DT</td>
                          <td>
                            <div className="bmp-product-cell">
                              <button
                                type="button"
                                onClick={(e) => handleSupplierClick(e, m.fournisseur)}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: '#1e293b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Lancer l'Agent IA de Scraping"
                              >
                                🏪 {m.fournisseur || 'Catalogue'}
                              </button>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {m.deliveryDate ? m.deliveryDate.toLocaleDateString('fr-FR') : '—'}
                            </span>
                          </td>
                          <td>
                            <button className="ai-dash-btn-ghost" style={{ padding: '4px 8px', borderColor: 'transparent' }} onClick={() => handleRemoveMaterialRow(m.originalIndex)}>✕</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <button className="ai-dash-btn ai-dash-btn-ghost" style={{ marginTop: '1rem' }} onClick={handleAddMaterialRow}>+ Ajouter</button>
            </div>

            {/* ────── Phase Planning ────── */}
            <PhasePlanningCard project={project} totalCost={estimatedConstruction} />

            {/* ────── Summary & Export ────── */}
            <div className="bmp-card" style={{ borderTop: '4px solid #E85D26' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Récapitulatif financier</h3>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Matériaux</span>
                      <strong style={{ fontSize: '1.25rem' }}>{totalMaterials.toLocaleString()} DT</strong>
                    </div>
                    <div style={{ paddingLeft: '2rem', borderLeft: '1px solid #e2e8f0' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Total Estimé</span>
                      <strong style={{ fontSize: '1.5rem', color: '#E85D26' }}>{estimatedConstruction.toLocaleString()} DT</strong>
                    </div>
                  </div>
                </div>
                <div className="bmp-export-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="ai-dash-btn-ghost" onClick={handleExportCsv}>📊 CSV</button>
                  <button className="ai-dash-btn-primary" onClick={handleExportPdf}>📄 Générer Devis Complet</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ── AI Agent Overlay ── */}
        {agentScraping && (
          <div className="bmp-ai-overlay">
            <div className="bmp-ai-modal">
              <div className="bmp-pulse-ai">🕷️</div>
              <h2 style={{ color: '#1e293b', marginBottom: '0.75rem', fontWeight: 800 }}>Agent IA Web Scraping</h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem' }}>
                Recherche du site officiel de <br />
                <strong style={{ color: '#E85D26' }}>{agentScraping}</strong> en cours...
              </p>
              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <div className="bmp-dot-pulse"></div>
                <div className="bmp-dot-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="bmp-dot-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhasePlanningCard({ project, totalCost }) {
  // On s'assure que le moteur reçoit les bons noms de champs (surface_m2 -> surface)
  const planning = computePlanning({
    ...project,
    surface: Number(project.surface_m2) || 0,
    chambres: Number(project.bedrooms) || 0,
    typeConst: project.construction_type
  });
  const meta = planning.find(p => p._meta);
  const phases = planning.filter(p => !p._meta);

  return (
    <div className="bmp-card">
      <div className="bmp-card-header" style={{ marginBottom: '1.5rem' }}>
        <span className="bmp-card-header-icon" style={{ background: '#F1F5F9', padding: '10px', borderRadius: '12px', color: '#475569' }}>📅</span>
        <h2 className="bmp-card-title">Planning de Construction</h2>
        <div style={{ marginLeft: 'auto', background: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
          Durée : <strong style={{ color: '#E85D26' }}>{meta?.totalJours} jours</strong>
        </div>
      </div>
      <div className="rmb-gantt-wrap">
        <div className="rmb-gantt">
          {phases.map(ph => {
            const leftPct = (ph.start / meta.totalJours) * 100;
            const widthPct = (ph.duree / meta.totalJours) * 100;
            return (
              <div key={ph.nom} className="rmb-gantt-row">
                <div className="rmb-gantt-label-col">
                  <span className="rmb-gantt-phase-name">{ph.nom}</span>
                  <span className="rmb-gantt-phase-dur">{ph.duree}j</span>
                </div>
                <div className="rmb-gantt-track">
                  <div
                    className="rmb-gantt-bar"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: ph.couleur,
                      boxShadow: `0 4px 12px ${ph.couleur}44`
                    }}
                  >
                    <span className="rmb-gantt-bar-label">{ph.duree}j</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
