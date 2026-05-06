export const BMP_PROJECT_KEY = 'bmp_project';

export function buildBmpProjectFromForm(form) {
  return {
    description: form.description ?? '',
    project_type: form.projectType ?? '',
    surface: form.surface ? Number(form.surface) : null,
    bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
    standing: form.standing ?? '',
    budget: form.budgetRange ?? '',
    location: form.location ?? '',
  };
}

