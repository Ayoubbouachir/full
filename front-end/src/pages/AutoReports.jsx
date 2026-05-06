import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import Swal from 'sweetalert2';
import { computeMaterials } from '../materialsEngine';
import './AIFeatures.css';
import './AutoReports.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net';

const AutoReports = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('user')) {
      navigate('/login');
    }
  }, [navigate]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);

  const [filters, setFilters] = useState({
    projectId: '',
    dateFrom: '',
    dateTo: '',
    projectType: '',
    status: '',
    region: '',
  });
  const [allProjects, setAllProjects] = useState([]);
  const [planHistory, setPlanHistory] = useState([]);

  useEffect(() => {
    try {
      const historyRaw = localStorage.getItem('bmp_plan_history');
      if (historyRaw) setPlanHistory(JSON.parse(historyRaw));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/projects/FindAll`)
      .then((r) => r.json())
      .then((data) => setAllProjects(data))
      .catch((e) => console.error(e));
  }, []);

  const queryString = useCallback(() => {
    const q = new URLSearchParams();
    if (filters.projectId) q.set('projectId', filters.projectId);
    if (filters.dateFrom) q.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) q.set('dateTo', filters.dateTo);
    if (filters.projectType) q.set('projectType', filters.projectType);
    if (filters.status) q.set('status', filters.status);
    if (filters.region) q.set('region', filters.region);
    return q.toString();
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Si l'utilisateur sélectionne un plan de l'historique
    if (filters.projectId.startsWith('plan_')) {
      try {
        const historyId = filters.projectId.replace('plan_', '');
        const plan = planHistory.find(h => h.analysisId === historyId);
        if (!plan) throw new Error("Plan introuvable dans l'historique.");

        const surface = plan.surface_m2 || 150;

        // Simuler un projet pour le moteur
        const simulatedProject = {
          surface: surface,
          chambres: plan.bedrooms || 3,
          sdb: plan.bathrooms || 1,
          standing: 'std',
          typeConst: plan.detectedType?.toLowerCase() || 'villa',
          localisation: 'tunis',
          hasGarage: plan.rooms?.some(r => r.type === 'garage') ?? false,
          hasCellier: plan.rooms?.some(r => r.type === 'storage') ?? false
        };

        const materialsData = await computeMaterials(simulatedProject);

        // Grouper les coûts par catégorie pour le graphique
        const costByCategory = {};
        materialsData.items.forEach(item => {
          costByCategory[item.cat] = (costByCategory[item.cat] || 0) + item.total;
        });

        const breakdown = Object.entries(costByCategory).map(([k, v]) => ({ name: k, value: v }));

        setKpis({
          totalRevenue: Math.round(materialsData.total * 1.2),
          totalExpenses: materialsData.total,
          activeProjects: 1,
          profitMargin: 20,
          growth: 0
        });

        setCharts({
          monthlyRevenue: [
            { month: "Mois 1", value: Math.round(materialsData.total * 0.2) },
            { month: "Mois 2", value: Math.round(materialsData.total * 0.5) },
            { month: "Mois 3", value: Math.round(materialsData.total * 1.2) }
          ],
          costBreakdown: breakdown,
          projectProfitability: [{
            name: plan.villa_name || plan.fileName || "Villa Actuelle",
            revenue: Math.round(materialsData.total * 1.2),
            cost: materialsData.total,
            profit: Math.round(materialsData.total * 0.2)
          }],
          projectStatusDistribution: [{ name: "En Étude", value: 100 }]
        });

        setAiSummary({
          riskLevel: "low",
          summary: `Rapport IA dynamique pour "${plan.villa_name || plan.fileName || 'Villa'}". Surface : ${surface} m². Coût matériaux estimé : ${materialsData.total.toLocaleString('fr-TN')} DT.`,
          insights: [
            `Structure : ${Math.round((costByCategory['STRUCTURE'] || 0) / materialsData.total * 100)}% du budget.`,
            `Configuration : ${plan.bedrooms || 0} ch / ${plan.bathrooms || 0} sdb.`,
            `Prêt pour l'exportation.`
          ]
        });

        setLoading(false);
        return;
      } catch (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
    }

    // Comportement normal pour les vrais projets
    const q = queryString();
    const base = `${API_BASE}/reports`;
    try {
      const [kpisRes, chartsRes, summaryRes] = await Promise.all([
        fetch(`${base}/kpis${q ? `?${q}` : ''}`),
        fetch(`${base}/charts${q ? `?${q}` : ''}`),
        fetch(`${base}/ai-summary${q ? `?${q}` : ''}`),
      ]);
      if (!kpisRes.ok || !chartsRes.ok || !summaryRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const [k, c, s] = await Promise.all([
        kpisRes.json(),
        chartsRes.json(),
        summaryRes.json(),
      ]);
      setKpis(k);
      setCharts(c);
      setAiSummary(s);
    } catch (e) {
      setError(e.message);
      setKpis(null);
      setCharts(null);
      setAiSummary(null);
    } finally {
      setLoading(false);
    }
  }, [queryString, filters.projectId, planHistory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadReport = async (format) => {
    setExportLoading(format);
    try {
      const q = queryString();
      const url = `${API_BASE}/reports/export/${format}${q ? `?${q}` : ''}`;

      // ── Récupérer les infos du plan depuis localStorage ────────────────────
      let planInfo = null;
      const savedPlan = localStorage.getItem('bmp_plan_analysis');
      if (savedPlan) {
        try {
          const plan = JSON.parse(savedPlan);
          planInfo = {
            name: plan.villa_name || plan.fileName || 'Mon Plan',
            surface: plan.surface_m2 || 0,
            total: kpis?.totalExpenses || 0,
          };
        } catch (_) { }
      }

      // ── Envoyer les données actuellement affichées dans le rapport ─────────
      const payload = {
        kpis,
        charts,
        summary: aiSummary,
        planInfo,
        projects: [],   // si on a des projets BDD
      };

      const res = await fetch(url, {
        method: 'POST',                           // ← POST au lieu de GET
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(res.statusText);

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `rapport-bi-fullstakers-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(a.href);

      Swal.fire({
        icon: 'success',
        title: 'Téléchargement démarré',
        text: `Rapport ${format.toUpperCase()} généré avec les données réelles.`,
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur export', text: e.message });
    } finally {
      setExportLoading(null);
    }
  };

  const applyFilters = () => fetchData();

  const riskColor = (level) =>
    level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';

  return (
    <div className="ai-features-page reports-dashboard">
      <div className="ai-features-container">
        <header className="ai-hero reports-hero">
          <span className="ai-hero-badge">AI Fullstakers</span>
          <h1>Rapports automatiques</h1>
          <p>
            Tableau de bord Business Intelligence : KPIs, graphiques, résumé IA et export PDF/Excel.
          </p>
          <Link to="/ai-features" className="ai-btn ai-btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            ← Retour aux fonctionnalités AI
          </Link>
        </header>

        {/* Filters */}
        <section className="reports-filters">
          <h3 className="reports-section-title">Filtres</h3>
          <div className="reports-filters-grid">
            <label className="ai-label" style={{ gridColumn: '1 / -1' }}>
              Projet (Remplit automatiquement les dates)
              <select
                className="ai-input"
                value={filters.projectId}
                onChange={(e) => {
                  const pid = e.target.value;
                  const p = allProjects.find((x) => x._id === pid);
                  setFilters((f) => ({
                    ...f,
                    projectId: pid,
                    dateFrom: p?.dateD ? p.dateD.split('T')[0] : f.dateFrom,
                    dateTo: p?.dateF ? p.dateF.split('T')[0] : f.dateTo,
                  }));
                }}
              >
                <option value="">Tous les projets BDD</option>
                {planHistory.length > 0 && (
                  <optgroup label="📜 Historique de vos Plans (IA)">
                    {planHistory.map((h, i) => (
                      <option key={h.analysisId || i} value={`plan_${h.analysisId}`}>
                        📐 {h.villa_name || h.fileName || `Plan ${i + 1}`} ({new Date(h.date).toLocaleDateString()})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="🏗 Projets de la Base de Données">
                  {allProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      🏠 {p.nom}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <label className="ai-label">
              Du
              <input
                type="date"
                className="ai-input"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                onClick={(e) => {
                  if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                  }
                }}
              />
            </label>
            <label className="ai-label">
              Au
              <input
                type="date"
                className="ai-input"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                onClick={(e) => {
                  if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                  }
                }}
              />
            </label>
            <label className="ai-label">
              Type de projet
              <select
                className="ai-input"
                value={filters.projectType}
                onChange={(e) => setFilters((f) => ({ ...f, projectType: e.target.value }))}
              >
                <option value="">Tous les types</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Villa">Villa</option>
                <option value="Appartement">Appartement</option>
                <option value="Bureaux">Bureaux</option>
              </select>
            </label>
            <label className="ai-label">
              Statut commande
              <select
                className="ai-input"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">Tous les statuts</option>
                <option value="Pending">Pending</option>
                <option value="In progress">In progress</option>
                <option value="Delivered">Delivered</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>
            <label className="ai-label">
              Région
              <input
                type="text"
                className="ai-input"
                placeholder="ex: Tunis"
                value={filters.region}
                onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
              />
            </label>
            <button type="button" className="ai-btn ai-btn-primary" onClick={applyFilters} disabled={loading}>
              Appliquer
            </button>
          </div>
        </section>

        {loading && (
          <div className="reports-loading">
            <div className="reports-spinner" />
            <p>Chargement des indicateurs...</p>
          </div>
        )}

        {error && (
          <div className="reports-error">
            <p>{error}</p>
            <button type="button" className="ai-btn ai-btn-primary" onClick={fetchData}>
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && kpis && (
          <>
            {/* KPI Cards */}
            <section className="reports-kpis">
              <h3 className="reports-section-title">Indicateurs clés</h3>
              <div className="reports-kpi-grid">
                <div className="reports-kpi-card">
                  <span className="reports-kpi-label">
                    {filters.projectId === 'current_plan' ? 'Budget Global Estimé' : 'Revenus totaux'}
                  </span>
                  <span className="reports-kpi-value">{kpis.totalRevenue?.toLocaleString('fr-FR')} DT</span>
                </div>
                <div className="reports-kpi-card">
                  <span className="reports-kpi-label">
                    {filters.projectId === 'current_plan' ? 'Coût Matériaux Estimé' : 'Dépenses totales'}
                  </span>
                  <span className="reports-kpi-value">{kpis.totalExpenses?.toLocaleString('fr-FR')} DT</span>
                </div>
                <div className="reports-kpi-card">
                  <span className="reports-kpi-label">Projets actifs</span>
                  <span className="reports-kpi-value">{kpis.activeProjects}</span>
                </div>
                <div className="reports-kpi-card">
                  <span className="reports-kpi-label">Marge %</span>
                  <span className="reports-kpi-value">{kpis.profitMargin}%</span>
                </div>
                <div className="reports-kpi-card">
                  <span className="reports-kpi-label">Croissance %</span>
                  <span className={`reports-kpi-value ${kpis.growth >= 0 ? 'positive' : 'negative'}`}>
                    {kpis.growth >= 0 ? '+' : ''}{kpis.growth}%
                  </span>
                </div>
              </div>
            </section>

            {/* Charts */}
            {charts && (
              <section className="reports-charts">
                <h3 className="reports-section-title">Graphiques</h3>
                <div className="reports-charts-grid">
                  {charts.monthlyRevenue?.length > 0 && (
                    <div className="reports-chart-card">
                      <h4>{filters.projectId === 'current_plan' ? 'Planning de financement' : 'Revenus par mois'}</h4>
                      <ReactApexChart
                        options={{
                          chart: { type: 'line', background: 'transparent', toolbar: { show: false } },
                          stroke: { curve: 'smooth', width: 2 },
                          colors: ['#ff6200'],
                          xaxis: { categories: charts.monthlyRevenue.map((r) => r.month), labels: { style: { colors: '#6b7280' } } },
                          yaxis: { labels: { style: { colors: '#6b7280' } } },
                          theme: { mode: 'light' },
                          grid: { borderColor: '#f3f4f6' },
                        }}
                        series={[{ name: filters.projectId === 'current_plan' ? 'Besoin financier (DT)' : 'Revenus (DT)', data: charts.monthlyRevenue.map((r) => r.value) }]}
                        type="line"
                        height={280}
                      />
                    </div>
                  )}
                  {charts.costBreakdown?.length > 0 && (
                    <div className="reports-chart-card">
                      <h4>Répartition des coûts par type</h4>
                      <ReactApexChart
                        options={{
                          chart: { type: 'donut', background: 'transparent' },
                          labels: charts.costBreakdown.map((c) => c.name),
                          colors: ['#ff6200', '#ff8c42', '#e55700', '#16a34a', '#3b82f6'],
                          legend: { position: 'bottom', labels: { colors: '#374151' } },
                          dataLabels: { enabled: true },
                          theme: { mode: 'light' },
                        }}
                        series={charts.costBreakdown.map((c) => c.value)}
                        type="donut"
                        height={280}
                      />
                    </div>
                  )}
                  {charts.projectProfitability?.length > 0 && (
                    <div className="reports-chart-card reports-chart-card-wide">
                      <h4>Rentabilité projets (top 10)</h4>
                      <ReactApexChart
                        options={{
                          chart: { type: 'bar', stacked: false, background: 'transparent', toolbar: { show: false } },
                          plotOptions: { bar: { horizontal: true, columnWidth: '60%' } },
                          colors: ['#16a34a', '#dc2626', '#3b82f6'],
                          xaxis: { categories: charts.projectProfitability.map((p) => p.name), labels: { style: { colors: '#6b7280' } } },
                          yaxis: { labels: { style: { colors: '#6b7280' } } },
                          legend: { position: 'top', labels: { colors: '#374151' } },
                          theme: { mode: 'light' },
                          grid: { borderColor: '#f3f4f6' },
                        }}
                        series={[
                          { name: filters.projectId === 'current_plan' ? 'Budget Global' : 'Revenus', data: charts.projectProfitability.map((p) => p.revenue) },
                          { name: filters.projectId === 'current_plan' ? 'Coût Matériaux' : 'Coûts', data: charts.projectProfitability.map((p) => p.cost) },
                          { name: filters.projectId === 'current_plan' ? 'Marge Estimée' : 'Profit', data: charts.projectProfitability.map((p) => p.profit) },
                        ]}
                        type="bar"
                        height={300}
                      />
                    </div>
                  )}
                  {charts.projectStatusDistribution?.length > 0 && (
                    <div className="reports-chart-card">
                      <h4>Statut des projets</h4>
                      <ReactApexChart
                        options={{
                          chart: { type: 'donut', background: 'transparent' },
                          labels: charts.projectStatusDistribution.map((s) => s.name),
                          colors: ['#16a34a', '#94a3b8'],
                          legend: { position: 'bottom', labels: { colors: '#374151' } },
                          theme: { mode: 'light' },
                        }}
                        series={charts.projectStatusDistribution.map((s) => s.value)}
                        type="donut"
                        height={260}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* AI Summary */}
            {aiSummary && (
              <section className="reports-ai-summary">
                <h3 className="reports-section-title">Résumé intelligent</h3>
                <div
                  className="reports-ai-card"
                  style={{ borderLeftColor: riskColor(aiSummary.riskLevel) }}
                >
                  <div className="reports-ai-risk">
                    Niveau de risque: <span style={{ color: riskColor(aiSummary.riskLevel) }}>{aiSummary.riskLevel}</span>
                  </div>
                  <p className="reports-ai-text">{aiSummary.summary}</p>
                  {aiSummary.insights?.length > 0 && (
                    <ul className="reports-ai-insights">
                      {aiSummary.insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {/* Export */}
            <section className="reports-export">
              <h3 className="reports-section-title">Exporter le rapport</h3>
              <div className="reports-export-buttons">
                <button
                  className="ai-btn ai-btn-primary"
                  onClick={() => handleDownloadReport('pdf')}
                  disabled={!!exportLoading}
                >
                  {exportLoading === 'pdf' ? '⏳' : '📄'} Télécharger PDF
                </button>
                <button
                  className="ai-btn ai-btn-primary"
                  onClick={() => handleDownloadReport('excel')}
                  disabled={!!exportLoading}
                >
                  {exportLoading === 'excel' ? '⏳' : '📊'} Télécharger Excel
                </button>
                <Link to="/plan-vs-reel" className="ai-btn ai-btn-primary" style={{ backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' }}>
                  📊 Suivi Plan vs Réel
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AutoReports;
