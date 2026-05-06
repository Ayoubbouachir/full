/**
 * Central project data model for AI Fullstakers dashboard.
 * Scalable for: multi-project, auth, history (persist to API later).
 */

export const PROJECT_TYPES = [
  { value: 'villa', label: 'Villa' },
  { value: 'building', label: 'Bâtiment' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'industrial', label: 'Industriel' },
];

export const BUDGET_RANGES = [
  { value: '0-25k', label: '0 - 25 000 DT', min: 0, max: 25000 },
  { value: '25k-50k', label: '25 000 - 50 000 DT', min: 25000, max: 50000 },
  { value: '50k-100k', label: '50 000 - 100 000 DT', min: 50000, max: 100000 },
  { value: '100k-250k', label: '100 000 - 250 000 DT', min: 100000, max: 250000 },
  { value: '250k+', label: '250 000+ DT', min: 250000, max: 999999999 },
];

/** Initial empty project state */
export const getInitialProject = () => ({
  id: `proj_${Date.now()}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // Step 1
  description: '',
  projectType: 'villa',
  budgetRange: '50k-100k',
  location: '',
  clientName: '',
  clientEmail: '',
  projectName: '',
  // Step 2 – AI recommendation response
  recommendation: null,
  selectedProducts: {},
  // Step 3 – Cost breakdown (derived + AI)
  costBreakdown: null,
  // Step 4 – Quote lines (editable)
  quoteItems: [],
  quoteVatRate: 0.19,
  // Step 5 – Planning
  planning: null,
  startDate: null,
  deadline: null,
});

/**
 * Example project JSON (for demo / API persistence).
 * Can be POSTed to /projects or stored in history.
 */
export const exampleProjectJSON = () => ({
  id: 'proj_demo_001',
  createdAt: '2025-02-19T10:00:00.000Z',
  updatedAt: '2025-02-19T12:30:00.000Z',
  description: 'Villa moderne 150m² avec jardin, budget moyen.',
  projectType: 'villa',
  budgetRange: '50k-100k',
  location: 'Tunis',
  clientName: 'Jean Dupont',
  clientEmail: 'jean.dupont@email.com',
  projectName: 'Villa Les Oliviers',
  recommendation: {
    projectType: 'villa',
    projectSize: '150m²',
    estimatedDuration: '11 semaines (75 jours)',
    workersNeeded: 5,
    recommendations: [
      {
        category: 'Bétonnière',
        requiredQuantity: 3,
        reason: 'Pour les fondations et murs',
        options: [
          { _id: '1', nomP: 'Bétonnière Standard', prix: 120, inStock: true },
          { _id: '2', nomP: 'Bétonnière Premium', prix: 180, inStock: true },
        ],
      },
      {
        category: 'Perceuse',
        requiredQuantity: 2,
        reason: 'Installation électrique et fixations',
        options: [
          { _id: '3', nomP: 'Perceuse 18V', prix: 85, inStock: true },
          { _id: '4', nomP: 'Perceuse Pro', prix: 150, inStock: true },
        ],
      },
    ],
    riskNotes: ['Livraison béton à planifier 2 semaines avant fondations.'],
    budgetAllocation: { materials: 65, labor: 25, equipment: 7, contingency: 3 },
  },
  selectedProducts: {
    Bétonnière: { _id: '1', nomP: 'Bétonnière Standard', prix: 120 },
    Perceuse: { _id: '3', nomP: 'Perceuse 18V', prix: 85 },
  },
  costBreakdown: {
    materials: 12500,
    labor: 35000,
    equipment: 4200,
    contingency: 2300,
    total: 54000,
    currency: 'DT',
    marginPercent: 12,
  },
  quoteItems: [
    { id: 'q1', product: 'Bétonnière Standard', quantity: 3, unitPrice: 120, totalPrice: 360 },
    { id: 'q2', product: 'Perceuse 18V', quantity: 2, unitPrice: 85, totalPrice: 170 },
  ],
  quoteVatRate: 0.19,
  planning: {
    suggestedDurationDays: 75,
    suggestedWorkers: 5,
    suggestedStart: '2025-03-01',
    suggestedEnd: '2025-05-15',
    recommendedDeliveryBy: '2025-02-22',
    phases: [
      { id: 'f1', name: 'Fondations', start: 0, duration: 14, percent: 18 },
      { id: 'f2', name: 'Structure', start: 14, duration: 35, percent: 47 },
      { id: 'f3', name: 'Second œuvre', start: 49, duration: 26, percent: 35 },
    ],
  },
  startDate: '2025-03-01',
  deadline: '2025-05-15',
});
