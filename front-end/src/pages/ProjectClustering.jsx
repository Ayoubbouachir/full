import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import Swal from 'sweetalert2';
import './AIFeatures.css';
import './ProjectClustering.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:3100';

const ProjectClustering = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('user')) navigate('/login');
  }, [navigate]);

  const [clusterResult, setClusterResult] = useState(null);
  const [clusterK, setClusterK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClusterProjects = async () => {
    setLoading(true);
    setClusterResult(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai-assistant/cluster-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: clusterK || undefined, maxK: 8 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur clustering');
      setClusterResult(data);
    } catch (e) {
      setError(e.message);
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Normalize cluster item so ML and fallback API shapes both work; avoid NaN/undefined in UI
  const normalizeCluster = (c, index) => ({
    clusterId: c.clusterId ?? c.id ?? index + 1,
    mainType: c.mainType ?? c.label ?? '—',
    projectCount: c.projectCount ?? c.count ?? 0,
    avgCost: Number(c.avgCost ?? c.avgCout ?? 0) || 0,
    avgDuration: Number(c.avgDuration ?? 0) || 0,
  });

  const clustersNormalized = useMemo(
    () => (clusterResult?.clusters || []).map((c, i) => normalizeCluster(c, i)),
    [clusterResult?.clusters]
  );

  const pcaScatterSeries = useMemo(() => {
    if (!clusterResult?.pca2D?.length) return [];
    const labels = clusterResult.projectLabels || [];
    const clusters = clusterResult.clusters || [];
    if (labels.length !== clusterResult.pca2D.length) {
      return [{ name: 'Projects', data: clusterResult.pca2D.map(pt => ({ x: pt[0], y: pt[1] })) }];
    }
    return clusters.map((c, i) => {
      const n = normalizeCluster(c, i);
      return {
        name: `Cluster ${n.clusterId} (${n.mainType})`,
        data: clusterResult.pca2D
          .map((pt, idx) => (labels[idx] === i ? { x: pt[0], y: pt[1] } : null))
          .filter(Boolean),
      };
    });
  }, [clusterResult?.pca2D, clusterResult?.projectLabels, clusterResult?.clusters]);

  const costChartOptions = clustersNormalized.length
    ? {
        chart: { type: 'bar', background: 'transparent' },
        plotOptions: { bar: { horizontal: false, columnWidth: '60%' } },
        xaxis: {
          categories: clustersNormalized.map(c => `Cluster ${c.clusterId} (${c.mainType})`),
        },
        yaxis: { title: { text: 'Coût moyen (DT)' } },
        colors: ['#ff6b35'],
        dataLabels: { enabled: true },
      }
    : null;

  const costChartSeries = clustersNormalized.length
    ? [{ name: 'Coût moyen (DT)', data: clustersNormalized.map(c => Math.round(c.avgCost)) }]
    : [];

  return (
    <div className="ai-features-page clustering-page">
      <div className="ai-features-container">
        <header className="ai-hero">
          <span className="ai-hero-badge">Business Intelligence</span>
          <h1>Clustering de projets</h1>
          <p>Regroupez vos projets par similarité (type, coût, durée, effectif) avec KMeans et visualisez les clusters.</p>
          <Link to="/ai-features" className="ai-btn ai-btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            ← Retour aux fonctionnalités AI
          </Link>
        </header>

        <div className="ai-cards-grid">
          <div className="ai-card clustering-card">
            <div className="ai-card-header">
              <div className="ai-card-icon purple">📊</div>
              <h2 className="ai-card-title">Regrouper les projets (ML)</h2>
            </div>
            <p className="ai-card-desc">K optionnel. Si non renseigné, le service ML suggère un K optimal (elbow + silhouette).</p>
            {error && <div className="clustering-error">{error}</div>}
            <div className="ai-row">
              <div>
                <label className="ai-label">Nombre de groupes k (optionnel)</label>
                <input
                  className="ai-input"
                  type="number"
                  min={2}
                  max={10}
                  value={clusterK}
                  onChange={e => setClusterK(Number(e.target.value) || 3)}
                />
              </div>
              <div>
                <label className="ai-label">&nbsp;</label>
                <button className="ai-btn ai-btn-primary ai-btn-block" onClick={handleClusterProjects} disabled={loading}>
                  {loading ? '⏳ Calcul en cours...' : 'Lancer le clustering'}
                </button>
              </div>
            </div>

            {clusterResult && (
              <>
                <div className="clustering-metrics">
                  <div className="metric-box">
                    <span className="metric-label">K optimal</span>
                    <span className="metric-value">{clusterResult.optimalK ?? '—'}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Score silhouette</span>
                    <span className="metric-value">
                      {clusterResult.silhouetteScore != null && Number.isFinite(clusterResult.silhouetteScore)
                        ? Number(clusterResult.silhouetteScore).toFixed(3)
                        : '—'}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Projets</span>
                    <span className="metric-value">{clusterResult.totalProjects ?? 0}</span>
                  </div>
                </div>

                <div className="clustering-table-wrap">
                  <table className="clustering-table">
                    <thead>
                      <tr>
                        <th>Cluster</th>
                        <th>Type principal</th>
                        <th>Nb projets</th>
                        <th>Coût moyen (DT)</th>
                        <th>Durée moy. (j)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clustersNormalized.map(c => (
                        <tr key={c.clusterId}>
                          <td>{c.clusterId}</td>
                          <td>{c.mainType}</td>
                          <td>{c.projectCount}</td>
                          <td>{Math.round(c.avgCost).toLocaleString('fr-FR')}</td>
                          <td>{Math.round(c.avgDuration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {clusterResult.insights && (
                  <div className="insights-panel">
                    <h4>💡 Insights</h4>
                    {clusterResult.insights.mostProfitableReason && (
                      <p><strong>Cluster le plus rentable:</strong> {clusterResult.insights.mostProfitableReason}</p>
                    )}
                    {clusterResult.insights.anomalyProjectIds?.length > 0 && (
                      <p><strong>Projets atypiques (coût):</strong> {clusterResult.insights.anomalyProjectIds.length} projet(s).</p>
                    )}
                    {clusterResult.insights.strategySuggestion && (
                      <p><strong>Stratégie:</strong> {clusterResult.insights.strategySuggestion}</p>
                    )}
                  </div>
                )}

                {costChartSeries.length > 0 && costChartOptions && (
                  <div className="chart-wrap">
                    <h4>Coût moyen par cluster</h4>
                    <ReactApexChart options={costChartOptions} series={costChartSeries} type="bar" height={280} />
                  </div>
                )}

                {clusterResult.pca2D?.length > 0 && pcaScatterSeries.length > 0 && (
                  <div className="chart-wrap">
                    <h4>Visualisation PCA (2D)</h4>
                    <ReactApexChart
                      options={{
                        chart: { type: 'scatter', zoom: { enabled: true }, background: 'transparent' },
                        colors: ['#ff6b35', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b'],
                        xaxis: { title: { text: 'PCA 1' } },
                        yaxis: { title: { text: 'PCA 2' } },
                      }}
                      series={pcaScatterSeries}
                      type="scatter"
                      height={300}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectClustering;
