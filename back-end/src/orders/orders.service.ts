import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ObjectId } from 'mongodb';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { Facture } from './entities/facture.entity';

import { UsersService } from '../users/users.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Facture)
    private readonly factureRepository: Repository<Facture>,
    private readonly usersService: UsersService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const { dateArrivage, dateLivraison, ...rest } = createOrderDto;

    // Find the user by email to get their ID for the Facture
    const emailToSearch = createOrderDto.userEmail || '';
    const user = emailToSearch
      ? await this.usersService.findOneByEmail(emailToSearch)
      : null;
    const userId = user ? user._id.toString() : emailToSearch;

    const lines = createOrderDto.lines.map((lineDto, index) => ({
      idLine: index + 1,
      total: lineDto.qnt * lineDto.unitPrice,
      ...lineDto,
    }));

    const totalPrice = lines.reduce((sum, line) => sum + (line.total || 0), 0);

    const newOrder = this.ordersRepository.create({
      ...(rest as any),
      status: createOrderDto.status || 'Pending',
      totalPrice: totalPrice,
      trackingNumber:
        (createOrderDto as any).trackingNumber ||
        `TRK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      lines: lines,
      dateArrivage: dateArrivage ? new Date(dateArrivage) : new Date(),
      dateLivraison: dateLivraison
        ? new Date(dateLivraison)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days later
    });

    const savedOrder = (await this.ordersRepository.save(newOrder)) as any;

    // Initial Facture (Awaiting Driver)
    const newFacture = this.factureRepository.create({
      idOrder: savedOrder._id.toString(),
      idUser1: userId, // User ID if found, otherwise email
      idUser2: 'Awaiting', // ID of the driver (User2)
      order: savedOrder,
    });
    await this.factureRepository.save(newFacture);

    return savedOrder;
  }

  async findAll(userEmail?: string) {
    if (userEmail) {
      return this.ordersRepository.findBy({ userEmail });
    }
    return this.ordersRepository.find();
  }

  async findByDriverId(driverId: string) {
    return this.ordersRepository.findBy({ driverId });
  }

  async findOne(id: string) {
    try {
      return await this.ordersRepository.findOneBy({
        _id: new ObjectId(id),
      });
    } catch (e) {
      return null;
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);
    if (order) {
      if (updateOrderDto.lines) {
        (updateOrderDto as any).lines = updateOrderDto.lines.map(
          (lineDto, index) => ({
            idLine: index + 1,
            total: lineDto.qnt * lineDto.unitPrice,
            ...lineDto,
          }),
        );
      }

      this.ordersRepository.merge(order, updateOrderDto);
      const savedOrder = await this.ordersRepository.save(order);

      // Sync with Facture
      const facture = await this.factureRepository.findOneBy({ idOrder: id });
      if (facture) {
        facture.order = savedOrder;
        await this.factureRepository.save(facture);
      }
      return savedOrder;
    }
    return null;
  }

  async acceptOrder(id: string, driverId: string, driverName?: string) {
    const order = await this.findOne(id);
    if (order) {
      order.driverId = driverId;
      order.driverName = driverName || 'Chauffeur BMP';
      order.status = 'assigned';
      const savedOrder = await this.ordersRepository.save(order);

      // Update Facture too
      const facture = await this.factureRepository.findOneBy({ idOrder: id });
      if (facture) {
        facture.idUser2 = driverId;
        facture.order = savedOrder;
        await this.factureRepository.save(facture);
      } else {
        // Fallback create if missing
        const newFacture = this.factureRepository.create({
          idOrder: id,
          idUser1: order.userEmail,
          idUser2: driverId,
          order: savedOrder,
        });
        await this.factureRepository.save(newFacture);
      }

      return savedOrder;
    }
    return null;
  }

  async findFacturesByUser(userIdOrEmail: string) {
    console.log(`Searching factures for: ${userIdOrEmail}`);

    const searchQueries: any[] = [
      { idUser1: userIdOrEmail },
      { idUser2: userIdOrEmail },
    ];

    // If it's a 24-char hex string (MongoDB ID), try to find the user's email too
    if (userIdOrEmail.length === 24) {
      try {
        const user = await this.usersService.findOne(userIdOrEmail);
        if (user && user.email) {
          const email = user.email.toLowerCase();
          if (email !== userIdOrEmail) {
            searchQueries.push({ idUser1: email });
            searchQueries.push({ idUser2: email });
          }
        }
      } catch (e) {
        // Not a valid ObjectId or not found
      }
    }

    // Explicitly use $or for MongoDB in TypeORM MongoRepository
    return this.factureRepository.find({
      where: { $or: searchQueries },
    } as any);
  }

  async findFactureByOrder(orderId: string) {
    return this.factureRepository.findOneBy({ idOrder: orderId });
  }

  async createFactureForQuotation(quotation: any) {
    // Check if facture already exists
    const existing = await this.findFactureByOrder(quotation._id.toString());
    if (existing) return existing;

    const newFacture = this.factureRepository.create({
      idOrder: quotation._id.toString(),
      idUser1: quotation.clientId,
      idUser2: quotation.workerId,
      order: {
        _id: quotation._id,
        dateArrivage: quotation.createdAt || new Date(),
        totalPrice: quotation.price,
        lines: quotation.items
          ? quotation.items.map((it) => ({
              productName: it.item,
              qnt: it.qty,
              unitPrice: it.unitPrice,
              total: it.total,
            }))
          : [
              {
                productName: quotation.title,
                qnt: 1,
                unitPrice: quotation.price,
                total: quotation.price,
              },
            ],
      },
    });
    return this.factureRepository.save(newFacture);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    if (order) {
      await this.factureRepository.delete({ idOrder: id });
      return this.ordersRepository.remove(order);
    }
    return null;
  }
}
