import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';

export interface ClusterProjectFeature {
  projectId: string;
  projectType: string;
  location: string;
  surface: number;
  predictedCost: number;
  duration: number;
  laborCount: number;
}

export interface ClusterInfoResponse {
  clusterId: number;
  projectCount: number;
  avgCost: number;
  avgDuration: number;
  mainType: string;
  projectIds?: string[];
}

export interface ClusteringInsights {
  mostProfitableClusterId?: number;
  mostProfitableReason?: string;
  anomalyProjectIds?: string[];
  strategySuggestion?: string;
}

export interface ClusteringResult {
  optimalK: number;
  silhouetteScore: number;
  clusters: ClusterInfoResponse[];
  pca2D?: number[][];
  projectLabels?: number[];
  elbowScores?: number[];
  silhouettePerK?: number[];
  totalProjects: number;
  insights?: ClusteringInsights;
}

@Injectable()
export class ClusteringService {
  private readonly mlBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {
    this.mlBaseUrl =
      this.configService.get<string>('ML_SERVICE_URL') ||
      'http://127.0.0.1:8000';
  }

  private mapProjectToFeature(
    p: Project & { _id?: { toString: () => string } },
  ): ClusterProjectFeature {
    const id = (p as any)._id?.toString?.() ?? (p as any).id ?? '';
    const dateD = p.dateD ? new Date(p.dateD) : new Date();
    const dateF = p.dateF ? new Date(p.dateF) : new Date();
    const durationMs = dateF.getTime() - dateD.getTime();
    const durationDays = Math.max(1, durationMs / (1000 * 60 * 60 * 24));
    const surface = (p as any).surface ?? 100;
    return {
      projectId: id,
      projectType: (p.type || 'renovation').toLowerCase(),
      location: (p as any).location ?? '',
      surface: Number(surface),
      predictedCost: Number(p.cout ?? 0),
      duration: Math.round(durationDays),
      laborCount: Number(p.nbWorker ?? 0),
    };
  }

  async runClustering(options?: {
    k?: number;
    maxK?: number;
  }): Promise<ClusteringResult> {
    const projects = await this.projectsService.findAll();
    if (projects.length < 2) {
      return {
        optimalK: 0,
        silhouetteScore: 0,
        clusters: [],
        totalProjects: projects.length,
      };
    }

    const features = projects.map((p) => this.mapProjectToFeature(p as any));
    const body = {
      projects: features,
      maxK: options?.maxK ?? 8,
      forceK: options?.k ?? undefined,
    };

    let response: Response;
    try {
      response = await fetch(`${this.mlBaseUrl}/cluster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`ML service unavailable: ${(err as Error).message}`);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ML clustering failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as ClusteringResult;
    return data;
  }
}
