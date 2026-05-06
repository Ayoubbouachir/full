# Reports Module (BI Dashboard)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports/kpis` | KPIs: totalRevenue, totalExpenses, activeProjects, profitMargin, growth |
| GET | `/reports/charts` | Chart data: monthlyRevenue, costBreakdown, projectProfitability, projectStatusDistribution |
| GET | `/reports/ai-summary` | AI summary, insights, riskLevel |
| GET | `/reports/export/pdf` | Download PDF report (with optional query filters) |
| GET | `/reports/export/excel` | Download Excel report (with optional query filters) |

## Query params (all GET)

- `dateFrom` (ISO date)
- `dateTo` (ISO date)
- `projectType` (string)
- `status` (order status)
- `region` (project location)

## Example: GET /reports/kpis

```json
{
  "totalRevenue": 125000.5,
  "totalExpenses": 98000,
  "activeProjects": 12,
  "profitMargin": 21.6,
  "growth": 8.5,
  "totalProjects": 25,
  "totalOrders": 140
}
```

## Example: GET /reports/ai-summary

```json
{
  "summary": "Résumé BI: Revenus 125000.5 DT, Dépenses 98000 DT. 12 projets actifs. Marge 21.6%, croissance 8.5%.",
  "insights": [
    "villa représente 45% des coûts.",
    "Croissance du chiffre d'affaires: +8.5% par rapport à la période précédente.",
    "Marge bénéficiaire: 21.6%.",
    "12 projet(s) actif(s) sur 25 au total."
  ],
  "riskLevel": "low",
  "kpis": { ... }
}
```

## Folder structure

```
back-end/src/reports/
  dto/
    report-filters.dto.ts
  aggregations.example.ts   # MongoDB pipeline examples
  reports.controller.ts
  reports.service.ts
  reports.module.ts
  README.md
```

## Performance

- KPIs/charts use in-memory aggregation over `find()`. For large datasets, use MongoDB aggregation (see `aggregations.example.ts`) and call `getMongoRepository(Project).aggregate()` or equivalent.
