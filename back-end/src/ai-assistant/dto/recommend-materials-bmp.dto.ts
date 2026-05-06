import {
  IsOptional,
  IsArray,
  IsString,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Request: optional project, plan, planning, supplier catalog */
export class RecommendMaterialsBmpDto {
  @IsOptional()
  @IsObject()
  project?: {
    surface_m2?: number;
    bedrooms?: number;
    bathrooms?: number;
    standing?: string;
    budget_range?: string;
    location?: string;
  };

  @IsOptional()
  @IsObject()
  plan?: {
    room_list?: string[];
    room_surfaces?: Record<string, number>;
    wet_areas?: string[];
  };

  @IsOptional()
  @IsArray()
  planning?: Array<{
    phase?: string;
    start?: string;
    end?: string;
    zone?: string;
    dependencies?: string[];
    needs_materials?: string[];
  }>;

  @IsOptional()
  @IsArray()
  supplier_catalog?: Array<{
    item?: string;
    category?: string;
    stock_level?: 'high' | 'medium' | 'low';
    lead_time_days?: number;
    supplier_name?: string;
    price_range?: string;
    location?: string;
  }>;
}

/** Response types for BMP.tn Construction AI (strict JSON) */
export interface BmpProjectSummary {
  surface_m2: string;
  bedrooms: string;
  bathrooms: string;
  standing: string;
  budget_range: string;
  location: string;
  unknown_fields: string[];
}

export interface BmpPlanningSummaryItem {
  phase: string;
  start: string;
  end: string;
  zone: string;
  needs_materials: string[];
}

export interface BmpMaterialAlternative {
  item: string;
  availability: string;
  lead_time_days: number;
  recommended_order_date: string;
}

export interface BmpMaterialItem {
  category: string;
  recommended_item: string;
  availability: 'high' | 'medium' | 'low';
  lead_time_days: number;
  recommended_order_date: string;
  why: string;
  alternatives: BmpMaterialAlternative[];
}

export interface BmpScheduleRisk {
  risk_level: 'low' | 'medium' | 'high';
  blocked_if_not_ordered_by: string;
  mitigation: string;
}

export interface BmpMaterialsByPhase {
  phase: string;
  zone: string;
  materials: BmpMaterialItem[];
  schedule_risk: BmpScheduleRisk;
}

export interface BmpBudgetDistribution {
  structure_pct: number;
  finishing_pct: number;
  mep_pct: number;
  bathrooms_kitchen_pct: number;
}

export interface BmpRiskAndAction {
  risk: string;
  impact: string;
  action: string;
}

export interface RecommendMaterialsBmpResponse {
  project_summary: BmpProjectSummary;
  planning_summary: BmpPlanningSummaryItem[];
  materials_by_phase: BmpMaterialsByPhase[];
  budget_distribution_estimate: BmpBudgetDistribution;
  risks_and_actions: BmpRiskAndAction[];
  next_required_inputs: string[];
  _meta?: { supplier_catalog_used: boolean; availability_note?: string };
}
