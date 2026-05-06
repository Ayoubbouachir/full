import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import './AIDashboard.css';

const CostBreakdown = ({ costBreakdown, recommendation, selectedProducts, currency = 'DT' }) => {
  const computed = useMemo(() => {
    if (costBreakdown && typeof costBreakdown.total === 'number') {
      return costBreakdown;
    }
    if (!recommendation?.recommendations || !selectedProducts) {
      return null;
    }
    let materialsTotal = 0;
    recommendation.recommendations.forEach((cat) => {
      const sel = selectedProducts[cat.category];
      if (sel) materialsTotal += (sel.prix || 0) * (cat.requiredQuantity || 1);
    });
    const labor = Math.round(materialsTotal * 0.45);
    const equipment = Math.round(materialsTotal * 0.08);
    const contingency = Math.round((materialsTotal + labor + equipment) * 0.05);
    const total = materialsTotal + labor + equipment + contingency;
    return {
      materials: materialsTotal,
      labor,
      equipment,
      contingency,
      total,
      currency,
      marginPercent: 10,
    };
  }, [costBreakdown, recommendation, selectedProducts, currency]);

  if (!computed) return null;

  const chartData = [
    { name: 'Matériaux', value: computed.materials },
    { name: 'Main d\'œuvre', value: computed.labor },
    { name: 'Équipement', value: computed.equipment },
    { name: 'Contingence', value: computed.contingency },
  ].filter((d) => d.value > 0);

  const chartOptions = {
    chart: { type: 'donut', background: 'transparent' },
    labels: chartData.map((d) => d.name),
    colors: ['#ff6b35', '#ff9a6c', '#e85a2a', '#c44a22'],
    legend: { position: 'bottom', labels: { colors: '#e8e6e3' } },
    dataLabels: { enabled: true },
    plotOptions: { pie: { donut: { size: '65%' } } },
  };
  const chartSeries = chartData.map((d) => d.value);

  return (
    <div className="ai-dash-card ai-dash-step-card">
      <div className="ai-dash-card-header">
        <span className="ai-dash-step-num">3</span>
        <div>
          <h2 className="ai-dash-card-title">Estimation des coûts</h2>
          <p className="ai-dash-card-desc">Répartition matériaux, main d'œuvre, équipement et contingence.</p>
        </div>
      </div>

      <div className="ai-dash-cost-grid">
        <div className="ai-dash-cost-item">
          <div className="ai-dash-cost-item-label">Matériaux</div>
          <div className="ai-dash-cost-item-value">{Number(computed.materials).toLocaleString('fr-FR')} {currency}</div>
        </div>
        <div className="ai-dash-cost-item">
          <div className="ai-dash-cost-item-label">Main d'œuvre</div>
          <div className="ai-dash-cost-item-value">{Number(computed.labor).toLocaleString('fr-FR')} {currency}</div>
        </div>
        <div className="ai-dash-cost-item">
          <div className="ai-dash-cost-item-label">Équipement</div>
          <div className="ai-dash-cost-item-value">{Number(computed.equipment).toLocaleString('fr-FR')} {currency}</div>
        </div>
        <div className="ai-dash-cost-item">
          <div className="ai-dash-cost-item-label">Contingence</div>
          <div className="ai-dash-cost-item-value">{Number(computed.contingency).toLocaleString('fr-FR')} {currency}</div>
        </div>
      </div>

      <div className="ai-dash-cost-total">
        <div className="ai-dash-cost-total-label">Total estimé</div>
        <div className="ai-dash-cost-total-value">{Number(computed.total).toLocaleString('fr-FR')} {currency}</div>
        {computed.marginPercent != null && (
          <div className="ai-dash-cost-total-label" style={{ marginTop: '0.35rem' }}>
            Marge suggérée: {computed.marginPercent}%
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="ai-dash-chart-wrap">
          <ReactApexChart options={chartOptions} series={chartSeries} type="donut" height={220} />
        </div>
      )}
    </div>
  );
};

export default CostBreakdown;
