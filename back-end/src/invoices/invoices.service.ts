import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
  ) {}

  async findAll(projectId?: string) {
    const filter = projectId ? { projectId } : {};
    return this.invoicesRepository.find({
      where: filter,
      order: { date: 'ASC' } as any,
    });
  }

  async create(data: Partial<Invoice>) {
    const invoice = this.invoicesRepository.create(data);
    return this.invoicesRepository.save(invoice);
  }

  async remove(id: string) {
    const invoice = await this.invoicesRepository.findOne({
      where: { _id: new ObjectId(id) as any },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable');
    await this.invoicesRepository.delete({ _id: new ObjectId(id) as any });
    return { message: 'Facture supprimée', id };
  }
}
