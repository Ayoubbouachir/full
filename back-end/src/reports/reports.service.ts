import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Order } from '../orders/entities/order.entity';
import { ReportFiltersDto } from './dto/report-filters.dto';

const PDFDocument = require('pdfkit');

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  private applyFilters(
    projects: Project[],
    orders: Order[],
    filters?: ReportFiltersDto,
  ): { projects: Project[]; orders: Order[] } {
    let filteredProjects = [...projects];
    let filteredOrders = [...orders];

    if (filters?.dateFrom) {
      const from = new Date(filters.dateFrom);
      filteredProjects = filteredProjects.filter(
        (p) => new Date(p.dateD) >= from,
      );
      filteredOrders = filteredOrders.filter(
        (o) => new Date(o.dateArrivage) >= from,
      );
    }
    if (filters?.dateTo) {
      const to = new Date(filters.dateTo);
      filteredProjects = filteredProjects.filter(
        (p) => new Date(p.dateF) <= to,
      );
      filteredOrders = filteredOrders.filter(
        (o) => new Date(o.dateLivraison) <= to,
      );
    }
    if (filters?.projectType) {
      filteredProjects = filteredProjects.filter(
        (p) => p.type?.toLowerCase() === filters.projectType!.toLowerCase(),
      );
    }
    if (filters?.region) {
      filteredProjects = filteredProjects.filter((p) =>
        (p as any).location
          ?.toLowerCase()
          ?.includes(filters.region!.toLowerCase()),
      );
    }
    if (filters?.status) {
      filteredOrders = filteredOrders.filter(
        (o) => o.status?.toLowerCase() === filters.status!.toLowerCase(),
      );
    }
    if (filters?.projectId) {
      filteredProjects = filteredProjects.filter(
        (p) => (p as any)._id?.toString() === filters.projectId,
      );
      filteredOrders = filteredOrders.filter(
        (o) => (o as any).projectId === filters.projectId,
      );
    }

    return { projects: filteredProjects, orders: filteredOrders };
  }

  private orderRevenue(order: Order): number {
    if (!order.lines || !Array.isArray(order.lines)) return 0;
    return order.lines.reduce(
      (sum: number, line: any) => sum + (line.total || 0),
      0,
    );
  }

  async getKpis(filters?: ReportFiltersDto) {
    const [projects, orders] = await Promise.all([
      this.projectsRepository.find(),
      this.ordersRepository.find(),
    ]);
    const { projects: projs, orders: ords } = this.applyFilters(
      projects,
      orders,
      filters,
    );

    const totalRevenue = ords.reduce((s, o) => s + this.orderRevenue(o), 0);
    const totalExpenses = projs.reduce((s, p) => s + (p.cout || 0), 0);
    const now = new Date();
    const activeProjects = projs.filter((p) => new Date(p.dateF) >= now).length;
    const profit = totalRevenue - totalExpenses;
    const profitMargin =
      totalRevenue > 0
        ? Math.round((profit / totalRevenue) * 100 * 100) / 100
        : 0;

    const previousPeriodOrders = orders.filter((o) => {
      const d = new Date(o.dateArrivage);
      const to = filters?.dateFrom
        ? new Date(filters.dateFrom)
        : new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d < to;
    });
    const prevRevenue = previousPeriodOrders.reduce(
      (s, o) => s + this.orderRevenue(o),
      0,
    );
    const growth =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100 * 100) /
          100
        : totalRevenue > 0
          ? 100
          : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      activeProjects,
      profitMargin,
      growth,
      totalProjects: projs.length,
      totalOrders: ords.length,
    };
  }

  async getCharts(filters?: ReportFiltersDto) {
    const [projects, orders] = await Promise.all([
      this.projectsRepository.find(),
      this.ordersRepository.find(),
    ]);
    const { projects: projs, orders: ords } = this.applyFilters(
      projects,
      orders,
      filters,
    );
    const now = new Date();

    const monthMap: Record<string, number> = {};
    ords.forEach((o) => {
      const d = new Date(o.dateArrivage);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + this.orderRevenue(o);
    });
    const monthlyRevenue = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({
        month,
        value: Math.round(value * 100) / 100,
      }));

    const byType = projs.reduce<Record<string, number>>((acc, p) => {
      const t = p.type || 'Autre';
      acc[t] = (acc[t] || 0) + (p.cout || 0);
      return acc;
    }, {});
    const costBreakdown = Object.entries(byType).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));

    const projectProfitability = projs.slice(0, 10).map((p) => {
      const cost = p.cout || 0;
      const rev = ords
        .filter((o) => (o as any).projectId === (p as any)._id?.toString?.())
        .reduce((s, o) => s + this.orderRevenue(o), 0);
      return {
        name: p.nom?.slice(0, 20) || 'Projet',
        revenue: Math.round(rev * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round((rev - cost) * 100) / 100,
      };
    });

    const statusCounts = projs.reduce<Record<string, number>>((acc, p) => {
      const d = new Date(p.dateF);
      const status = d >= now ? 'Actif' : 'Terminé';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const projectStatusDistribution = Object.entries(statusCounts).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    return {
      monthlyRevenue,
      costBreakdown,
      projectProfitability,
      projectStatusDistribution,
    };
  }

  async getAiSummary(filters?: ReportFiltersDto) {
    const [kpis, charts] = await Promise.all([
      this.getKpis(filters),
      this.getCharts(filters),
    ]);

    const insights: string[] = [];
    if (charts.costBreakdown.length) {
      const top = charts.costBreakdown[0];
      const total = charts.costBreakdown.reduce((s, c) => s + c.value, 0);
      const pct = total > 0 ? Math.round((top.value / total) * 100) : 0;
      insights.push(`${top.name} représente ${pct}% des coûts.`);
    }
    if (kpis.growth !== 0) {
      insights.push(
        kpis.growth > 0
          ? `Croissance du chiffre d'affaires: +${kpis.growth}% par rapport à la période précédente.`
          : `Baisse du chiffre d'affaires: ${kpis.growth}% par rapport à la période précédente.`,
      );
    }
    if (kpis.profitMargin !== undefined) {
      if (kpis.profitMargin < 0)
        insights.push(
          `Marge bénéficiaire négative (${kpis.profitMargin}%) — revoir les coûts.`,
        );
      else if (kpis.profitMargin < 10)
        insights.push(
          `Marge faible (${kpis.profitMargin}%) — potentiel d'optimisation.`,
        );
      else insights.push(`Marge bénéficiaire: ${kpis.profitMargin}%.`);
    }
    insights.push(
      `${kpis.activeProjects} projet(s) actif(s) sur ${kpis.totalProjects} au total.`,
    );

    const riskLevel =
      kpis.profitMargin < 0
        ? 'high'
        : kpis.profitMargin < 10
          ? 'medium'
          : 'low';

    const summary =
      `Résumé BI: Revenus ${kpis.totalRevenue} DT, Dépenses ${kpis.totalExpenses} DT. ` +
      `${kpis.activeProjects} projets actifs. Marge ${kpis.profitMargin}%, croissance ${kpis.growth}%. ` +
      (insights.length ? insights.slice(0, 2).join(' ') : '');

    return {
      summary,
      insights,
      riskLevel,
      kpis,
    };
  }

  async exportPdf(filters?: ReportFiltersDto, payload?: any): Promise<Buffer> {
    const kpis = payload?.kpis || (await this.getKpis(filters));
    const charts = payload?.charts || (await this.getCharts(filters));
    const aiSummary = payload?.summary || (await this.getAiSummary(filters));

    let projs: any[] = [];
    if (payload?.planInfo) {
      projs = [
        {
          nom: payload.planInfo.name,
          type: 'Villa (Simulation)',
          cout: payload.planInfo.total,
          nbWorker: 5,
        },
      ];
    } else if (payload?.projects?.length > 0) {
      projs = payload.projects;
    } else {
      projs = this.applyFilters(
        await this.projectsRepository.find(),
        [],
        filters,
      ).projects;
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(20)
        .text('Rapport Business Intelligence', { align: 'center' });
      doc
        .fontSize(10)
        .text(
          `Fullstakers — Généré le ${new Date().toLocaleDateString('fr-FR')}`,
          {
            align: 'center',
          },
        );
      doc.moveDown(2);

      doc.fontSize(14).text('Indicateurs clés (KPIs)');
      doc.fontSize(10);
      doc.text(`Revenus totaux: ${kpis.totalRevenue} DT`);
      doc.text(`Dépenses totales: ${kpis.totalExpenses} DT`);
      doc.text(`Projets actifs: ${kpis.activeProjects}`);
      doc.text(`Marge bénéficiaire: ${kpis.profitMargin}%`);
      doc.text(`Croissance: ${kpis.growth}%`);
      doc.moveDown(1);

      doc.fontSize(14).text('Résumé IA');
      doc.fontSize(10).text(aiSummary.summary, { align: 'justify' });
      doc.moveDown(1);
      doc.text('Points clés:');
      aiSummary.insights.slice(0, 5).forEach((i) => doc.text(`• ${i}`));
      doc.moveDown(2);

      doc.fontSize(14).text('Projets (détail)');
      doc.fontSize(10);
      projs.slice(0, 30).forEach((p) => {
        doc.text(
          `${p.nom} | ${p.type} | ${p.cout} DT | ${p.nbWorker} ouvriers`,
        );
      });
      if (projs.length > 30) doc.text(`... et ${projs.length - 30} autres`);
      doc.moveDown(1);
      doc.fontSize(10).text('— Fin du rapport —', { align: 'center' });
      doc.end();
    });
  }

  async exportExcel(
    filters?: ReportFiltersDto,
    payload?: any,
  ): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const kpis = payload?.kpis || (await this.getKpis(filters));
    const charts = payload?.charts || (await this.getCharts(filters));

    let projs: any[] = [];
    if (payload?.planInfo) {
      projs = [
        {
          nom: payload.planInfo.name,
          type: 'Villa (Simulation)',
          cout: payload.planInfo.total,
          nbWorker: 5,
          dateD: new Date(),
          dateF: new Date(Date.now() + 30 * 86400000),
        },
      ];
    } else if (payload?.projects?.length > 0) {
      projs = payload.projects;
    } else {
      projs = this.applyFilters(
        await this.projectsRepository.find(),
        [],
        filters,
      ).projects;
    }

    let ords: any[] = [];
    if (payload?.planInfo) {
      ords = [];
    } else if (payload?.orders?.length > 0) {
      ords = payload.orders;
    } else {
      ords = this.applyFilters(
        [],
        await this.ordersRepository.find(),
        filters,
      ).orders;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Fullstakers BI';

    const kpiSheet = workbook.addWorksheet('KPIs');
    kpiSheet.columns = [
      { header: 'Indicateur', width: 25 },
      { header: 'Valeur', width: 18 },
    ];
    kpiSheet.addRows([
      ['Revenus totaux (DT)', kpis.totalRevenue],
      ['Dépenses totales (DT)', kpis.totalExpenses],
      ['Projets actifs', kpis.activeProjects],
      ['Marge bénéficiaire (%)', kpis.profitMargin],
      ['Croissance (%)', kpis.growth],
      ['Total projets', kpis.totalProjects],
      ['Total commandes', kpis.totalOrders],
    ]);

    const aggSheet = workbook.addWorksheet('Agrégats');
    aggSheet.columns = [
      { header: 'Mois', width: 12 },
      { header: 'Revenus (DT)', width: 16 },
    ];
    charts.monthlyRevenue.forEach((r) => aggSheet.addRow([r.month, r.value]));

    const projectsSheet = workbook.addWorksheet('Projets');
    projectsSheet.columns = [
      { header: 'Nom', width: 25 },
      { header: 'Type', width: 14 },
      { header: 'Coût (DT)', width: 12 },
      { header: 'Ouvriers', width: 10 },
      { header: 'Date début', width: 12 },
      { header: 'Date fin', width: 12 },
    ];
    projs.forEach((p) => {
      projectsSheet.addRow([
        p.nom,
        p.type,
        p.cout,
        p.nbWorker,
        new Date(p.dateD).toLocaleDateString('fr-FR'),
        new Date(p.dateF).toLocaleDateString('fr-FR'),
      ]);
    });

    const ordersSheet = workbook.addWorksheet('Commandes');
    ordersSheet.columns = [
      { header: 'Statut', width: 14 },
      { header: 'Date arrivage', width: 14 },
      { header: 'Date livraison', width: 14 },
      { header: 'Revenu (DT)', width: 14 },
    ];
    ords.forEach((o) => {
      ordersSheet.addRow([
        o.status,
        new Date(o.dateArrivage).toLocaleDateString('fr-FR'),
        new Date(o.dateLivraison).toLocaleDateString('fr-FR'),
        this.orderRevenue(o),
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
