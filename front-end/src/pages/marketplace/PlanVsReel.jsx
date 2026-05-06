import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import Swal from 'sweetalert2';
import { computeMaterials } from '../../materialsEngine';
import './PlanVsReel.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net';

const CAT_LABELS = {
  STRUCTURE: 'Structure',
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Électricité',
  FINITIONS: 'Finitions',
  CUISINE: 'Cuisine',
};

const CAT_COLORS = {
  STRUCTURE: '#378ADD',
  PLOMBERIE: '#1D9E75',
  ELECTRICITE: '#EF9F27',
  FINITIONS: '#D85A30',
  CUISINE: '#D4537E',
};

// Convertit les items du moteur en estimations par catégorie
const buildEstimatesFromPlan = (materialsData) => {
  const estimates = { STRUCTURE: 0, PLOMBERIE: 0, ELECTRICITE: 0, FINITIONS: 0, CUISINE: 0 };
  materialsData.items.forEach((item) => {
    const key = item.cat?.toUpperCase();
    if (estimates[key] !== undefined) {
      estimates[key] += item.total;
    } else {
      estimates['FINITIONS'] += item.total; // fallback
    }
  });
  return estimates;
};

const fmt = (n) =>
  Math.round(n).toLocaleString('fr-TN', { minimumFractionDigits: 0 });

// ─── Composant principal ──────────────────────────────────────────────────────
const PlanVsReel = () => {
  const [activeTab, setActiveTab] = useState('saisie');
  const [invoices, setInvoices] = useState([]);
  const [estimates, setEstimates] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [allProjects, setAllProjects] = useState([]);

  // Formulaire facture
  const [form, setForm] = useState({ cat: 'STRUCTURE', desc: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // ── Charger les projets disponibles
  useEffect(() => {
    fetch(`${API_BASE}/projects/FindAll`)
      .then((r) => r.json())
      .then((data) => setAllProjects(data))
      .catch(console.error);
  }, []);

  // ── Charger le plan (depuis localStorage ou API)
  const loadPlanData = useCallback(async () => {
    const savedPlan = localStorage.getItem('bmp_plan_analysis');
    if (!savedPlan) { setEstimates(null); setPlanInfo(null); return; }
    try {
      const plan = JSON.parse(savedPlan);
      const simProject = {
        surface: plan.surface_m2 || 150,
        chambres: plan.bedrooms || 3,
        sdb: plan.bathrooms || 1,
        standing: 'std',
        typeConst: plan.detectedType?.toLowerCase() || 'villa',
        localisation: 'tunis',
        hasGarage: plan.rooms?.some(r => r.type === 'garage') ?? false,
        hasCellier: plan.rooms?.some(r => r.type === 'storage') ?? false
      };
      const mat = await computeMaterials(simProject);
      setEstimates(buildEstimatesFromPlan(mat));
      setPlanInfo({
        name: plan.villa_name || plan.fileName || plan.analysisId || 'Mon Projet',
        surface: plan.surface_m2 || 150,
        total: mat.total,
        analysisId: plan.analysisId,
      });
    } catch (e) {
      console.error('Erreur lecture plan:', e);
    }
  }, []);

  useEffect(() => { loadPlanData(); }, [loadPlanData]);

  const handleResetPlan = () => {
    if (!window.confirm('Effacer le plan ET les factures locales ? Cette action est irréversible.')) return;
    localStorage.removeItem('bmp_plan_analysis');
    localStorage.removeItem('bmp_invoices');
    localStorage.removeItem('bmp_plan_history');
    setEstimates(null);
    setPlanInfo(null);
    setInvoices([]);
  };


  // ── Charger les factures depuis le backend si projet sélectionné
  const fetchInvoices = useCallback(async () => {
    if (!projectId) return;
    setLoadingInvoices(true);
    try {
      const res = await fetch(`${API_BASE}/invoices?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInvoices(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ── Lire aussi depuis localStorage si pas de backend
  useEffect(() => {
    if (!projectId) {
      const saved = localStorage.getItem('bmp_invoices');
      if (saved) setInvoices(JSON.parse(saved));
    }
  }, [projectId]);

  const persistInvoices = (list) => {
    setInvoices(list);
    if (!projectId) localStorage.setItem('bmp_invoices', JSON.stringify(list));
  };

  // ── Ajouter une facture
  const addInvoice = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Swal.fire({ icon: 'warning', title: 'Montant invalide', text: 'Veuillez saisir un montant positif.' });
      return;
    }
    const newInv = {
      id: Date.now(),
      cat: form.cat,
      desc: form.desc || CAT_LABELS[form.cat],
      amount: parseFloat(form.amount),
      date: form.date,
      projectId: projectId || 'local',
    };

    if (projectId) {
      try {
        const res = await fetch(`${API_BASE}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newInv),
        });
        if (!res.ok) throw new Error(res.statusText);
        const saved = await res.json();
        persistInvoices([...invoices, saved]);
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: e.message });
        return;
      }
    } else {
      persistInvoices([...invoices, newInv]);
    }

    setForm((f) => ({ ...f, desc: '', amount: '' }));
    Swal.fire({ icon: 'success', title: 'Facture ajoutée', timer: 1200, showConfirmButton: false });
  };

  // ── Supprimer une facture
  const deleteInvoice = async (inv) => {
    const result = await Swal.fire({
      title: 'Supprimer cette facture ?',
      text: `${inv.desc} — ${fmt(inv.amount)} DT`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    });
    if (!result.isConfirmed) return;

    if (projectId && inv._id) {
      try {
        await fetch(`${API_BASE}/invoices/${inv._id}`, { method: 'DELETE' });
      } catch (e) {
        console.error(e);
      }
    }
    persistInvoices(invoices.filter((i) => i.id !== inv.id && i._id !== inv._id));
  };

  // ── Calculs analytiques
  const getRealByCategory = () => {
    const totals = {};
    Object.keys(CAT_LABELS).forEach((k) => (totals[k] = 0));
    invoices.forEach((inv) => {
      const k = inv.cat?.toUpperCase();
      if (totals[k] !== undefined) totals[k] += inv.amount;
    });
    return totals;
  };

  const real = getRealByCategory();
  const safeEstimates = estimates || { STRUCTURE: 62000, PLOMBERIE: 18000, ELECTRICITE: 14000, FINITIONS: 28000, CUISINE: 12000 };
  const totalEst = Object.values(safeEstimates).reduce((a, b) => a + b, 0);
  const totalReal = Object.values(real).reduce((a, b) => a + b, 0);
  const totalEcart = totalReal - totalEst;
  const pctConsome = totalEst > 0 ? Math.round((totalReal / totalEst) * 100) : 0;

  // ── Alertes
  const cats = Object.keys(CAT_LABELS);
  const overCats = cats.filter((c) => real[c] > safeEstimates[c] * 1.1);
  const warnCats = cats.filter((c) => real[c] > safeEstimates[c] * 0.85 && real[c] <= safeEstimates[c] * 1.1);

  // ── Données graphiques
  const chartLabels = cats.map((c) => CAT_LABELS[c]);
  const estData = cats.map((c) => safeEstimates[c]);
  const realData = cats.map((c) => real[c]);

  // Cumul dans le temps
  const sortedInvoices = [...invoices].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumul = 0;
  const timeLabels = [];
  const timeData = [];
  sortedInvoices.forEach((inv) => {
    cumul += inv.amount;
    timeLabels.push(inv.date);
    timeData.push(Math.round(cumul));
  });
  if (!timeLabels.length) {
    timeLabels.push("Aujourd'hui");
    timeData.push(0);
  }

  // ── Export PDF stylé
  const handleExportPdf = () => {
    const now = new Date();
    const displayDate = now.toLocaleDateString('fr-FR');
    const logoBase64 = "PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNTMiIHZpZXdCb3g9IjAgMCA2MCA1MyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNi4yNTQgMTguMTY5NlYxOS44NjY0SDI3Ljk0OEgyOS42NDIxVjE4LjE2OTZWMTYuNDcyN0gyNy45NDhIMjYuMjU0VjE4LjE2OTZaTTMwLjM2ODEgMTguMTY5NlYxOS44NjY0SDMyLjA2MjFIMzMuNzU2MlYxOC4xNjk2VjE2LjQ3MjdIMzIuMDYyMUgzMC4zNjgxVjE4LjE2OTZaTTI2LjI1NCAyMi4zNTEyVjI0LjEwODZIMjcuOTQ4SDI5LjY0MjFWMjIuMzUxMlYyMC41OTM3SDI3Ljk0OEgyNi4yNTRWMjIuMzUxMlpNMzAuNDQ4OCAyMC42NzQ1QzMwLjQwNDQgMjAuNzE4OSAzMC4zNjgxIDIxLjUwOTcgMzAuMzY4MSAyMi40MzJWMjQuMTA4NkgzMi4wNjIxSDMzLjc1NjJWMjIuMzUxMlYyMC41OTM3SDMyLjE0MjhDMzEuMjU1NCAyMC41OTM3IDMwLjQ5MzEgMjAuNjMgMzAuNDQ4OCAyMC42NzQ1Wk0yMy4wNjQgMjYuNDA5NEMyMS41NDU1IDI2LjY4NiAxOS4zMDI2IDI3Ljk0MjUgMTguNTQwMiAyOC45NDM5QzE4LjE0MyAyOS40NjU2IDE3Ljk5NyAzMC4xMzEzIDE4LjMwNTggMzAuMDEyNkMxOS4yOTg0IDI5LjYzMSAyMi44NzEzIDI5LjYwMzQgMjQuMDE3OSAyOS45NjgzQzI0Ljc5IDMwLjIxNDIgMjYuMTIyNSAzMS4wMTc2IDI2LjQyIDMxLjQxNjlDMjYuNTgyOCAzMS42MzUzIDI2LjY3OTggMzIuMDY1OCAyNi43NTc5IDMyLjkxNTdDMjYuODE4IDMzLjU3MTYgMjYuOTQwOSAzNC4zOTA3IDI3LjAzMSAzNC43MzYxQzI3LjE4OTYgMzUuMzQ0NCAyNy4xODU2IDM1LjM3MjggMjYuOTAzNyAzNS42MzgxQzI2Ljc0MzYgMzUuNzg4OCAyNi40NTY3IDM2LjI0MjUgMjYuMjY2IDM2LjY0NjNDMjUuODM4NSAzNy41NTIgMjUuNDA1MiAzOC4wMDE5IDI0LjYyMDUgMzguMzU1QzI0LjI4NzcgMzguNTA0OCAyMy45IDM4Ljc1NTggMjMuNzU4OSAzOC45MTNDMjMuNDM1IDM5LjI3MzggMTcuMjk5OCA0OC4yMTkxIDE3LjIjk5OCA0OC4zMw01QzE3LjIjk5OCA0OC4zNzU4IDE4LjMwNjQgNDkuNDIwMSAxOS41MzY4IDUwLjY1MTJDMjEuNDc3MiA1Mi41OTI4IDIxLjc5NTkgNTIuODY1NyAyMS45NDA0IDUyLjcxMDVDMjIuMTE0NyA1Mi41MjMxIDI3Ljk4NTcgNDIuNzM2NiAyOC4yODg1IDQyLjEyODVDMjguMzk0MyA0MS45MTYxIDI4LjQ1NTkgNDEuNDY1NiAyOC40NDU1IDQwLjk4MTRDMjguNDIyNCAzOS45MTQ0IDI4LjU1OTIgMzkuNTQ3MSAyOS41NTA0IDM4LjAxN0wzMC4zOTQ0IDM2LjcxNDFIMzAuOTA0NEMzMS4xODUgMzYuNzE0MSAzMS44NjkzIDM2LjU3NzcgMzIuNDI1MSAzNi40MTExQzMyLjk4MSAzNi4yNDQ0IDMzLjU4NzAgMzYuMTA4IDMzLjc3MTggMzYuMTA4QzM0LjU3NjMgMzYuMTA4IDM1LjEyMjEgMzYuNjkxNSAzNS4yNDU2IDM3LjY4MzdDMzUuMzAwMyAzOC4xMjMyIDM1LjQwMzEgMzguMzA2IDM1Ljc3NTEgMzguNjI0NlszNi41MTE2IDM5LjI1NTUgMzcuMzM2NSAzOS43NTI5IDM3Ljk1NTcgMzkuOTM5N0MzOC40OTgxIDQwLjEwMzEgMzguNTU5NSA0MC4wOTczIDM5LjA3NzEgMzkuODMxN0MzOS41MjUzIDM5LjYwMTggMzkuNzg2MSAzOS4zMDk3IDQwLjUxMzIgMzguMjIzM0M0MS42MjExIDM2LjU2NzkgNDEuOTgxNyAzNS44MjI3IDQxLjk4MzEgMzUuMTg1MUM0MS45ODQ3IDM0LjUxNiA0MS43MjczIDM0LjIxNjYgNDAuMzI2IDMzLjI1ODJMMzkuMTY2MiAzMi40NjQ4TDM4LjUyOTggMzIuNjUwMkMzNy4yMDI4IDMzLjAzNjcgMzYuNjI5OSAzMi44MDgxIDM1Ljc5NDMgMzEuNTU5M0MzNS4yOTkxIDMwLjgxOTEgMzUuMTMyMiAzMC42ODcxIDMyLjkwNjkgMjkuMjc0OEMzMC40NzExIDI3LjcyODkgMjYuMjU5MyAyNy4xNjU4IDI3LjIyNzIgMjYuNjM1M0syNi4xOTI4IDI2LjM2NTMgMjMuOTY4OSAyNi4yNDQ1IDIzLjA2NCAyNi40MDk0WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yOC45NzIxIDAuMTYzNDY4QzI4LjM5NTEgMC40MjYyNDMgMC40MDA1NDkgMjguNTYzMSAwLjE3NzUxMSAyOS4xMDQ1Qy0wLjA1OTUwMyAyOS42Nzk5IC0wLjA1OTEzOTUgMzAuNDE2OSAwLjE3ODM4OSAzMC45OTExQzAuMzA3NzQgMzEuMzAzOCAyLjY0NzY5IDMzLjczMDQgNy44MzA0NyAzOC45MjYxQzExLjkzNjYgNDMuMDQyNSAxNS4zMzc2IDQ2LjQxMDYgMTUuMzg4MiA0Ni40MTA2QzE1LjQzODkgNDYuNDEwNiAxNS40ODAzIDQyLjg5MjYgMTUuNDgwMyAzOC41OTI4VjMwLjc3NUgxMy4yMzc4QzEwLjY1NDMgMzAuNzc1IDEwLjMxNzggMzAuNjk0NCA5Ljk4NzEgMjkuOTk2NEM5LjYwNTEgMjkuMTkwMSA5Ljc3NDAyIDI4Ljg5OTUgMTEuOTY0MyAyNi41OTM0QzEyLjQwNzUgMjYuMTI2NyAxNi40NTkyIDIxLjc3NzQgMjAuOTY4MSAxNi45MjgyQzI1LjQ3NjkgMTIuMDc4OSAyOS4yNjg1IDguMDU2NCAyOS4zOTM5IDcuOTg5MjVDMjkuNzcyIDcuNzg2NDcgMzAuNDI4NyA3Ljg0ODY1IDMwLjc3MjcgOC4xMTk3OUMzMC45NDkxIDguMjU4ODEgMzQuNDAwNiAxMS45MjUzIDM4LjQ0MjQgMTYuMjY3NUM0Mi40ODQ0IDIwLjYwOTcgNDYuNzA5MyAyNS4xNDU3IDQ3LjgzMTIgMjYuMzQ3NkM0OC45NTMgMjcuNTQ5MyA0OS45NTU5IDI4LjcwODEgNTAuMDU5OCAyOC45MjI0QzUwLjMyNjggMjkuNDcyOSA1MC4xMDEzIDMwLjIxMTEgNDkuNTY2MiAzMC41Mzc5QzQ5LjIxODMgMzAuNzUwNCA0OC45NDU1IDMwLjc3NDEgNDYuODUwMiAzMC43NzQ1TDQ0LjUyMDkgMzAuNzc1VjM4LjU5MjhDNDQuNTIwOSA0Mi44OTI2IDQ0LjU2MjMgNDYuNDEwNiA0NC42MTMgNDYuNDEwNkM0NC42NjM2IDQ2LjQxMDYgNDguMDg4MSA0My4wMTUyIDUyLjIyMjggMzguODY1NUM1OC4yODQgMzIuNzgyNCA1OS43Njk0IDMxLjIyOTggNTkuODg4OCAzMC44NTIzQzYwLjExMTcgMzAuMTQ4IDU5Ljk4OTggMjkuMTc2OSA1OS42MDk3IDI4LjYyOTlDNTkuNDMzNSAyOC4zNzY0IDUzLjAzOTcgMjEuOTEyNSA0NS40MDEzIDE0LjI2NTdDMzUuNTg5NyA0LjQ0MzI1IDMxLjM4MTEgMC4zMDczNCAzMS4wNjMyIDAuMTc1NDY4QzMwLjUxMTkgLTAuMDUzMzY5IDI5LjQ2MTUgLTAuMDU5NDI5MiAyOC45NzIxIDAuMTYzNDY4WiIgZmlsbD0iI0ZFODUwMCIvPgo8L3N2Zz4K";

    const tableRows = cats.map((cat) => {
      const est = safeEstimates[cat];
      const rv = real[cat];
      const ecart = rv - est;
      const pct = est > 0 ? Math.min(Math.round((rv / est) * 100), 100) : 0;
      return `
      <tr>
        <td style="font-weight:600;">${CAT_LABELS[cat]}</td>
        <td style="text-align:right;">${fmt(est)}</td>
        <td style="text-align:right; color: ${rv > est ? '#E24B4A' : '#1e293b'};">${fmt(rv)}</td>
        <td style="text-align:right; font-weight:700; color: ${ecart > 0 ? '#E24B4A' : ecart < 0 ? '#639922' : '#6b7280'};">
          ${ecart >= 0 ? '+' : ''}${fmt(ecart)}
        </td>
        <td style="text-align:center;">${pct}%</td>
      </tr>`;
    }).join('');

    // Génération du diagnostic textuel dynamique
    let diagnostic = "";
    if (totalEcart > 0) {
      diagnostic = `Le projet présente un dépassement global de <strong>${fmt(totalEcart)} DT</strong> (${pctConsome}% du budget consommé). `;
      if (overCats.length > 0) {
        diagnostic += `L'attention doit être portée sur : <strong>${overCats.map(c => CAT_LABELS[c]).join(', ')}</strong> qui présentent des écarts critiques. `;
      }
      diagnostic += "Il est recommandé de réévaluer les finitions ou de négocier avec les fournisseurs pour compenser ces surcoûts.";
    } else {
      diagnostic = `Le budget est parfaitement maîtrisé avec une économie de <strong>${fmt(Math.abs(totalEcart))} DT</strong>. `;
      diagnostic += "La gestion des dépenses est optimale. Vous disposez d'une marge de sécurité confortable pour les phases suivantes.";
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charSet="utf-8" />
  <title>Rapport Financier BMP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E85D26; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-container { display: flex; align-items: center; gap: 10px; }
    .brand-name { font-size: 24px; font-weight: 800; color: #1e293b; }
    .brand-name span { color: #E85D26; }
    .doc-info { text-align: right; }
    .doc-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #E85D26; }
    
    .project-card { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #e2e8f0; }
    .project-info h1 { font-size: 18px; font-weight: 700; margin: 0 0 5px 0; }
    
    .diagnostic-box { background: #FFF7ED; border-left: 4px solid #EA580C; padding: 15px 20px; border-radius: 0 12px 12px 0; margin-bottom: 30px; }
    .diagnostic-title { font-weight: 800; color: #9A3412; font-size: 13px; text-transform: uppercase; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }

    .kpi-grid { display: flex; gap: 15px; margin-bottom: 30px; }
    .kpi-card { flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; }
    .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; display: block; }
    .kpi-value { font-size: 16px; font-weight: 800; }
    .kpi-value.over { color: #E24B4A; }
    .kpi-value.under { color: #22c55e; }

    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th { background: #1e293b; color: white; padding: 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    
    .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; paddingTop: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div class="logo-container">
      <div class="brand-name">BMP<span>.tn</span></div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Rapport d'Analyse Écrit</div>
      <div class="doc-date">Généré le ${displayDate}</div>
    </div>
  </div>

  <div class="project-card">
    <div class="project-info">
      <h1>Analyse Budgétaire : ${planInfo?.name || 'Mon Projet'}</h1>
      <div style="font-size: 13px; color: #475569;">Surface : ${planInfo?.surface || 0} m²</div>
    </div>
  </div>

    <div class="diagnostic-box">
      <div class="diagnostic-title">Diagnostic de l'Assistant IA</div>
      <div style="font-size: 13px; color: #431407; line-height: 1.6;">${diagnostic}</div>
    </div>

  <div class="kpi-grid">
    <div class="kpi-card"><span class="kpi-label">Budget IA</span><div class="kpi-value">${fmt(totalEst)} DT</div></div>
    <div class="kpi-card"><span class="kpi-label">Dépenses Réelles</span><div class="kpi-value">${fmt(totalReal)} DT</div></div>
    <div class="kpi-card"><span class="kpi-label">Écart Global</span><div class="kpi-value ${totalEcart > 0 ? 'over' : 'under'}">${totalEcart > 0 ? '+' : ''}${fmt(totalEcart)} DT</div></div>
    <div class="kpi-card"><span class="kpi-label">Consommation</span><div class="kpi-value ${pctConsome > 100 ? 'over' : ''}">${pctConsome}%</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Poste de dépense</th>
        <th style="text-align:right;">Estimé (DT)</th>
        <th style="text-align:right;">Réel (DT)</th>
        <th style="text-align:right;">Écart Financier</th>
        <th style="text-align:center;">Statut</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    <p>Ce rapport écrit est une analyse automatisée. Les données sont issues du moteur d'estimation IA BMP et de vos factures.</p>
    <p>&copy; ${now.getFullYear()} BMP.tn - Leading Innovation in Modern Construction</p>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.open(); win.document.write(html); win.document.close(); }
  };

  // ── Options ApexCharts
  const barOptions = {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
    colors: ['rgba(55,138,221,0.5)', ...cats.map((c) => CAT_COLORS[c])],
    xaxis: { categories: chartLabels, labels: { style: { colors: '#6b7280', fontSize: '12px' } } },
    yaxis: { labels: { style: { colors: '#6b7280' }, formatter: (v) => fmt(v) + ' DT' } },
    legend: { show: false },
    grid: { borderColor: '#f3f4f6' },
    theme: { mode: 'light' },
    tooltip: { y: { formatter: (v) => fmt(v) + ' DT' } },
    dataLabels: { enabled: false },
  };

  const lineOptions = {
    chart: { type: 'area', background: 'transparent', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: [2, 2], dashArray: [0, 6] },
    colors: ['#ff6200', '#22c55e'],
    fill: { type: ['gradient', 'none'], gradient: { shadeIntensity: 0.4, opacityFrom: 0.3, opacityTo: 0.05 } },
    xaxis: { categories: timeLabels, labels: { style: { colors: '#6b7280', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#6b7280' }, formatter: (v) => fmt(v) + ' DT' } },
    legend: { show: false },
    grid: { borderColor: '#f3f4f6' },
    theme: { mode: 'light' },
    tooltip: { y: { formatter: (v) => fmt(v) + ' DT' } },
    dataLabels: { enabled: false },
    annotations: {
      yaxis: [{
        y: totalEst,
        borderColor: '#22c55e',
        borderWidth: 1.5,
        strokeDashArray: 5,
        label: { text: 'Budget total', style: { color: '#22c55e', background: '#f0fdf4' } },
      }],
    },
  };

  return (
    <div className="pvr-page">
      <div className="pvr-container">

        {/* ── Header ── */}
        <header className="pvr-hero">
          <span className="pvr-badge">AI Fullstakers</span>
          <h1>Plan estimé vs Réel</h1>
          <p>Suivez l'écart entre le budget IA et les coûts réels de votre chantier.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleExportPdf} className="pvr-btn pvr-btn-primary">📊 Rapports automatiques</button>
            <Link to="/ai-features" className="pvr-btn pvr-btn-outline">← Fonctionnalités AI</Link>
          </div>
        </header>

        {/* ── Sélecteur projet ── */}
        <section className="pvr-section">
          <label className="pvr-label">
            Projet lié (optionnel — sinon les factures sont sauvegardées localement)
            <select
              className="pvr-input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Stockage local (sans projet)</option>
              {allProjects.map((p) => (
                <option key={p._id} value={p._id}>{p.nom}</option>
              ))}
            </select>
          </label>
          {planInfo ? (
            <div className="pvr-plan-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>📐</span>
              <span style={{ flex: 1 }}>
                Plan détecté : <strong>{planInfo.name}</strong> — {planInfo.surface} m² —
                Budget estimé : <strong>{fmt(planInfo.total)} DT</strong>
              </span>
              <button
                onClick={loadPlanData}
                title="Recharger si vous avez analysé un nouveau plan"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: 6, padding: '3px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                🔄 Recharger le plan
              </button>
              <button
                onClick={handleResetPlan}
                title="Effacer plan et factures locales"
                style={{ background: 'none', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 6, padding: '3px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                🗑 Réinitialiser
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>
              Aucun plan analysé — <a href="/ai-features/plan-analysis" style={{ color: '#F97316' }}>Analysez votre plan ici →</a>
            </div>
          )}
        </section>

        {/* ── Tabs ── */}
        <div className="pvr-tabs">
          <button
            className={`pvr-tab ${activeTab === 'saisie' ? 'active' : ''}`}
            onClick={() => setActiveTab('saisie')}
          >
            📄 Saisie factures
            {invoices.length > 0 && <span className="pvr-count">{invoices.length}</span>}
          </button>
          <button
            className={`pvr-tab ${activeTab === 'analyse' ? 'active' : ''}`}
            onClick={() => setActiveTab('analyse')}
          >
            📊 Analyse & graphiques
          </button>
        </div>

        {/* ══════════════════════════════════════
            ONGLET SAISIE
        ══════════════════════════════════════ */}
        {activeTab === 'saisie' && (
          <>
            {/* Formulaire ajout */}
            <section className="pvr-section">
              <h3 className="pvr-section-title">Ajouter une facture</h3>
              <div className="pvr-form-grid">
                <label className="pvr-label">
                  Catégorie
                  <select
                    className="pvr-input"
                    value={form.cat}
                    onChange={(e) => setForm((f) => ({ ...f, cat: e.target.value }))}
                  >
                    {Object.entries(CAT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="pvr-label">
                  Description
                  <input
                    type="text"
                    className="pvr-input"
                    placeholder="ex: Ciment BRS 350kg..."
                    value={form.desc}
                    onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                  />
                </label>
                <label className="pvr-label">
                  Montant (DT)
                  <input
                    type="number"
                    className="pvr-input"
                    placeholder="0"
                    min="0"
                    step="100"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addInvoice()}
                  />
                </label>
                <label className="pvr-label">
                  Date
                  <input
                    type="date"
                    className="pvr-input"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </label>
                <button className="pvr-btn pvr-btn-primary pvr-btn-add" onClick={addInvoice}>
                  + Ajouter
                </button>
              </div>
            </section>

            {/* Liste factures */}
            <section className="pvr-section">
              <h3 className="pvr-section-title">
                Factures saisies
                {invoices.length > 0 && (
                  <span style={{ marginLeft: '8px', fontSize: '13px', color: '#6b7280', fontWeight: 400 }}>
                    Total : <strong>{fmt(totalReal)} DT</strong>
                  </span>
                )}
              </h3>
              {loadingInvoices ? (
                <div className="pvr-loading"><div className="pvr-spinner" /> Chargement...</div>
              ) : invoices.length === 0 ? (
                <div className="pvr-empty">
                  <span>📋</span>
                  <p>Aucune facture — ajoutez-en ci-dessus pour commencer le suivi.</p>
                </div>
              ) : (
                <div className="pvr-invoice-table-wrap">
                  <table className="pvr-invoice-table">
                    <thead>
                      <tr>
                        <th>Catégorie</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Montant (DT)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv, i) => (
                        <tr key={inv._id || inv.id || i}>
                          <td>
                            <span className="pvr-cat-dot" style={{ background: CAT_COLORS[inv.cat?.toUpperCase()] || '#888' }} />
                            {CAT_LABELS[inv.cat?.toUpperCase()] || inv.cat}
                          </td>
                          <td>{inv.desc}</td>
                          <td style={{ color: '#6b7280', fontSize: '12px' }}>{inv.date}</td>
                          <td style={{ textAlign: 'right', fontWeight: 500 }}>{fmt(inv.amount)}</td>
                          <td>
                            <button className="pvr-btn-del" onClick={() => deleteInvoice(inv)} title="Supprimer">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ fontWeight: 500, padding: '10px 14px' }}>Total réel</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', padding: '10px 14px' }}>
                          {fmt(totalReal)} DT
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════════════════════════
            ONGLET ANALYSE
        ══════════════════════════════════════ */}
        {activeTab === 'analyse' && (
          <>
            {/* Alertes */}
            {overCats.length > 0 && (
              <div className="pvr-alert pvr-alert-danger">
                🔴 Dépassement budgétaire : <strong>{overCats.map((c) => CAT_LABELS[c]).join(', ')}</strong> dépassent l'estimation de plus de 10%.
              </div>
            )}
            {warnCats.length > 0 && overCats.length === 0 && (
              <div className="pvr-alert pvr-alert-warn">
                🟡 Attention : <strong>{warnCats.map((c) => CAT_LABELS[c]).join(', ')}</strong> approchent la limite budgétaire (&gt;85%).
              </div>
            )}
            {invoices.length > 0 && overCats.length === 0 && warnCats.length === 0 && (
              <div className="pvr-alert pvr-alert-ok">
                🟢 Toutes les catégories sont dans les limites budgétaires.
              </div>
            )}

            {/* KPIs */}
            <section className="pvr-section">
              <h3 className="pvr-section-title">Indicateurs clés</h3>
              <div className="pvr-kpi-grid">
                <div className="pvr-kpi-card">
                  <span className="pvr-kpi-label">Budget estimé</span>
                  <span className="pvr-kpi-value">{fmt(totalEst)} DT</span>
                </div>
                <div className="pvr-kpi-card">
                  <span className="pvr-kpi-label">Dépenses réelles</span>
                  <span className="pvr-kpi-value">{fmt(totalReal)} DT</span>
                </div>
                <div className="pvr-kpi-card">
                  <span className="pvr-kpi-label">Écart global</span>
                  <span className={`pvr-kpi-value ${totalEcart > 0 ? 'over' : totalEcart < 0 ? 'under' : ''}`}>
                    {totalEcart >= 0 ? '+' : ''}{fmt(totalEcart)} DT
                  </span>
                </div>
                <div className="pvr-kpi-card">
                  <span className="pvr-kpi-label">Budget consommé</span>
                  <span className={`pvr-kpi-value ${pctConsome > 100 ? 'over' : pctConsome > 85 ? '' : 'under'}`}>
                    {pctConsome}%
                  </span>
                </div>
                <div className="pvr-kpi-card">
                  <span className="pvr-kpi-label">Reste estimé</span>
                  <span className="pvr-kpi-value">{fmt(Math.max(0, totalEst - totalReal))} DT</span>
                </div>
              </div>
            </section>

            {/* Tableau par catégorie */}
            <section className="pvr-section">
              <h3 className="pvr-section-title">Répartition par catégorie</h3>
              <div className="pvr-invoice-table-wrap">
                <table className="pvr-invoice-table">
                  <thead>
                    <tr>
                      <th>Catégorie</th>
                      <th style={{ textAlign: 'right' }}>Estimé (DT)</th>
                      <th style={{ textAlign: 'right' }}>Réel (DT)</th>
                      <th style={{ textAlign: 'right' }}>Écart</th>
                      <th>Avancement</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cats.map((cat) => {
                      const est = safeEstimates[cat];
                      const rv = real[cat];
                      const ecart = rv - est;
                      const pct = Math.min(Math.round((rv / est) * 100), 100);
                      const isOver = rv > est * 1.1;
                      const isWarn = rv > est * 0.85 && !isOver;
                      return (
                        <tr key={cat}>
                          <td>
                            <span className="pvr-cat-dot" style={{ background: CAT_COLORS[cat] }} />
                            {CAT_LABELS[cat]}
                          </td>
                          <td style={{ textAlign: 'right' }}>{fmt(est)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 500, color: rv > est ? '#E24B4A' : 'inherit' }}>
                            {fmt(rv)}
                          </td>
                          <td style={{ textAlign: 'right', color: ecart > 0 ? '#E24B4A' : ecart < 0 ? '#639922' : '#6b7280' }}>
                            {ecart >= 0 ? '+' : ''}{fmt(ecart)}
                          </td>
                          <td style={{ minWidth: '120px' }}>
                            <div className="pvr-progress-wrap">
                              <div className="pvr-progress-bg">
                                <div
                                  className="pvr-progress-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: isOver ? '#E24B4A' : isWarn ? '#EF9F27' : CAT_COLORS[cat],
                                  }}
                                />
                              </div>
                              <span className="pvr-progress-pct">{pct}%</span>
                            </div>
                          </td>
                          <td>
                            {isOver ? (
                              <span className="pvr-badge pvr-badge-over">Dépassé</span>
                            ) : isWarn ? (
                              <span className="pvr-badge pvr-badge-warn">Vigilance</span>
                            ) : rv === 0 ? (
                              <span className="pvr-badge pvr-badge-neutral">—</span>
                            ) : (
                              <span className="pvr-badge pvr-badge-ok">OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Graphique comparatif */}
            <section className="pvr-section">
              <h3 className="pvr-section-title">Comparaison estimé vs réel par catégorie</h3>
              <div className="pvr-chart-card">
                <div className="pvr-legend">
                  <span className="pvr-legend-item">
                    <span className="pvr-legend-dot" style={{ background: 'rgba(55,138,221,0.5)', border: '1.5px solid #378ADD' }} />
                    Estimé
                  </span>
                  <span className="pvr-legend-item">
                    <span className="pvr-legend-dot" style={{ background: '#ff6200' }} />
                    Réel
                  </span>
                </div>
                <ReactApexChart
                  options={barOptions}
                  series={[
                    { name: 'Estimé', data: estData },
                    { name: 'Réel', data: realData },
                  ]}
                  type="bar"
                  height={300}
                />
              </div>
            </section>

            {/* Graphique évolution dans le temps */}
            <section className="pvr-section">
              <h3 className="pvr-section-title">Évolution cumulative des dépenses</h3>
              <div className="pvr-chart-card">
                <div className="pvr-legend">
                  <span className="pvr-legend-item">
                    <span className="pvr-legend-dot" style={{ background: '#ff6200' }} />
                    Dépenses cumulées
                  </span>
                  <span className="pvr-legend-item">
                    <span className="pvr-legend-dot" style={{ background: '#22c55e' }} />
                    Budget total (ligne)
                  </span>
                </div>
                <ReactApexChart
                  options={lineOptions}
                  series={[
                    { name: 'Dépenses cumulées', data: timeData },
                    { name: 'Budget total', data: timeLabels.map(() => Math.round(totalEst)) },
                  ]}
                  type="area"
                  height={260}
                />
              </div>
            </section>

            {/* Donut reste à dépenser */}
            <section className="pvr-section">
              <h3 className="pvr-section-title">Répartition du budget consommé</h3>
              <div className="pvr-chart-card" style={{ maxWidth: '400px' }}>
                <ReactApexChart
                  options={{
                    chart: { type: 'donut', background: 'transparent' },
                    labels: ['Dépensé', 'Restant'],
                    colors: [totalEcart > 0 ? '#E24B4A' : '#ff6200', '#e5e7eb'],
                    legend: { position: 'bottom', labels: { colors: '#374151' } },
                    dataLabels: { enabled: true, formatter: (v) => Math.round(v) + '%' },
                    tooltip: { y: { formatter: (v) => fmt(v) + ' DT' } },
                    theme: { mode: 'light' },
                  }}
                  series={[Math.round(totalReal), Math.max(0, Math.round(totalEst - totalReal))]}
                  type="donut"
                  height={260}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanVsReel;
