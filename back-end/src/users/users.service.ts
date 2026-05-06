import { Injectable, OnModuleInit, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';

import { normalizeSpecialty, searchSpecialties } from './specialty-synonyms';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  async onModuleInit() {
    // Seed Admin User
    const adminEmail = 'admin@fullstackers.com';
    const existingAdmin = await this.findOneByEmail(adminEmail);
    if (!existingAdmin) {
      console.log('Seeding default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = this.usersRepository.create({
        nom: 'Admin',
        prenom: 'System',
        numTele: '0000000000',
        address: 'System',
        cin: 'ADM001',
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        imageUrl: '',
      });
      await this.usersRepository.save(adminUser);
    }
  }

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email?.toLowerCase();

    // 1. Validation du mot de passe (Majuscule, Chiffre, Spécial)
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(createUserDto.password)) {
      throw new ConflictException(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.',
      );
    }

    // 2. Vérification si l'email existe déjà
    if (email) {
      const existingUser = await this.findOneByEmail(email);
      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // 3. Préparation de l'utilisateur
    if (createUserDto.email) {
      createUserDto.email = email;
    }

    // Hachage du mot de passe
    const rawPassword = createUserDto.password;
    createUserDto.password = await bcrypt.hash(rawPassword, 10);

    // Normalisation de la spécialité
    if (createUserDto.speciality) {
      createUserDto.speciality = normalizeSpecialty(createUserDto.speciality);
    }

    // Génération du token d'activation
    const verificationToken = Math.random().toString(36).substring(2, 15);

    const user = this.usersRepository.create({
      ...createUserDto,
      isVerified: false,
      verificationToken,
      createdAt: new Date(),
    });

    const savedUser = await this.usersRepository.save(user);

    // 4. Envoi de l'email d'activation
    try {
      const activationLink = `http://localhost:3000/auth/verify?token=${verificationToken}`;
      await this.mailerService.sendMail({
        to: `${createUserDto.prenom} ${createUserDto.nom} <${email}>`,
        subject: '🚀 Activez votre compte FullStakers !',
        template: './registration', // template name
        context: {
          name: `${createUserDto.prenom} ${createUserDto.nom}`,
          activationLink,
        },
      });
      console.log(`[UsersService] Email d'activation envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur envoi email activation:', error);
      // Optionnel: On pourrait supprimer l'utilisateur si l'email échoue,
      // mais ici on va juste logguer l'erreur car le token est enregistré.
    }

    return savedUser;
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepository.findOne({
      where: { verificationToken: token },
    });
    if (!user) {
      throw new ConflictException("Lien d'activation invalide");
    }

    user.isVerified = true;
    (user as any).verificationToken = undefined; // Use undefined/null depending on mongo driver/strictness
    await this.usersRepository.save(user);
    return {
      message:
        'Compte activé avec succès ! Vous pouvez maintenant vous connecter.',
    };
  }

  async findAll() {
    return this.usersRepository.find({
      where: { isVerified: true },
    });
  }

  async findOne(id: string) {
    return this.usersRepository.findOneBy({ _id: new ObjectId(id) });
  }

  async findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findOne(id);
      if (!user) return null;

      // Remove _id from payload to avoid TypeORM/Mongo conflicts
      const { _id, password, email, ...updateData } = updateUserDto as any;

      // Handle email change with uniqueness check
      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        const existing = await this.findOneByEmail(email);
        if (existing) {
          throw new ConflictException('Cet email est déjà utilisé');
        }
        user.email = email.toLowerCase();
      }

      // Handle password hashing if updated
      if (password && password.trim() !== '') {
        user.password = await bcrypt.hash(password, 10);
      }

      // Merge other fields
      this.usersRepository.merge(user, updateData);
      return await this.usersRepository.save(user);
    } catch (error) {
      console.error('Update User Error:', error);
      throw error; // Rethrow to let NestJS handle it or catch specifically
    }
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    if (user) {
      return this.usersRepository.remove(user);
    }
    return null;
  }

  async updateFaceDescriptor(id: string, descriptor: number[]) {
    const user = await this.findOne(id);
    if (user) {
      user.faceDescriptor = descriptor;
      return this.usersRepository.save(user);
    }
    return null;
  }

  async findArtisans(speciality?: string, position?: string) {
    let artisans = await this.usersRepository.find({
      where: {
        role: UserRole.ARTISAN,
        isVerified: true,
      },
    });

    if (speciality && speciality.trim()) {
      // ✅ Recherche multilingue : "dahan", "دهان", "daha n" → cherche les artisans "Peinture"
      const matchedSpecialties = searchSpecialties(speciality);
      if (matchedSpecialties.length > 0) {
        artisans = artisans.filter((a) =>
          matchedSpecialties.some(
            (std) =>
              normalizeSpecialty(a.speciality || '').toLowerCase() ===
                std.toLowerCase() ||
              (a.speciality || '').toLowerCase().includes(std.toLowerCase()),
          ),
        );
      } else {
        // Fallback includes classique
        const searchSpec = speciality.toLowerCase();
        artisans = artisans.filter((a) =>
          (a.speciality || '').toLowerCase().includes(searchSpec),
        );
      }
    }

    if (position && position.trim()) {
      const searchPos = position.toLowerCase();
      artisans = artisans.filter(
        (a) =>
          (a.position || '').toLowerCase().includes(searchPos) ||
          (a.address || '').toLowerCase().includes(searchPos),
      );
    }

    return artisans;
  }

  async upgradeSubscription(userId: string, planId: string) {
    const user = await this.findOne(userId);
    if (!user) return null;

    user.subscriptionPlan = planId;
    user.subscriptionStatus = 'ACTIVE';

    // Set expiry to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    user.subscriptionExpiresAt = expiresAt;

    return this.usersRepository.save(user);
  }
}
