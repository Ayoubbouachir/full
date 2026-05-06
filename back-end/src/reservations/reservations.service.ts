import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: MongoRepository<Reservation>,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const reservation =
      this.reservationsRepository.create(createReservationDto);
    return await this.reservationsRepository.save(reservation);
  }

  async findAll(): Promise<Reservation[]> {
    return await this.reservationsRepository.find();
  }

  async findByClient(clientId: string): Promise<Reservation[]> {
    return await this.reservationsRepository.find({
      where: { clientId },
    });
  }

  async findByArtisan(artisanId: string): Promise<Reservation[]> {
    return await this.reservationsRepository.find({
      where: { artisanId },
    });
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
  ): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOneBy({
      _id: new ObjectId(id),
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    reservation.status = status;
    return await this.reservationsRepository.save(reservation);
  }

  async remove(id: string): Promise<void> {
    await this.reservationsRepository.delete(id);
  }
}
