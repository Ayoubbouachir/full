import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();
    console.log(`[AuthService] Tentative de connexion pour: ${email}`);

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      console.log(`[AuthService] Échec: Utilisateur non trouvé pour ${email}`);
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    console.log(
      `[AuthService] Utilisateur trouvé: ${user.email}. Vérification du mot de passe...`,
    );

    // Handle both hashed and plain text passwords
    let isMatch = false;
    try {
      if (user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(loginDto.password, user.password);
      } else {
        isMatch = user.password === loginDto.password;
      }
    } catch (error) {
      console.error(
        '[AuthService] Erreur lors de la comparaison bcrypt:',
        error,
      );
      isMatch = user.password === loginDto.password;
    }

    if (isMatch) {
      const { password, ...result } = user;
      console.log(`[AuthService] Connexion réussie pour: ${email}`);
      return result;
    }

    console.log(`[AuthService] Échec: Mot de passe incorrect pour ${email}`);
    throw new UnauthorizedException('Mot de passe incorrect');
  }

  async register(createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  async registerFace(registerFaceDto: {
    email: string;
    password: string;
    descriptor: number[];
  }) {
    const email = registerFaceDto.email.toLowerCase().trim();
    console.log(`[AuthService] Enregistrement du visage pour: ${email}`);

    // Find user by email and password
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Verify password
    let isMatch = false;
    try {
      if (user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(registerFaceDto.password, user.password);
      } else {
        isMatch = user.password === registerFaceDto.password;
      }
    } catch (error) {
      console.error(
        '[AuthService] Erreur lors de la comparaison bcrypt:',
        error,
      );
      isMatch = user.password === registerFaceDto.password;
    }

    if (!isMatch) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // Update user with face descriptor
    await this.usersService.updateFaceDescriptor(
      user._id.toString(),
      registerFaceDto.descriptor,
    );

    const { password, ...result } = user;
    console.log(`[AuthService] Visage enregistré avec succès pour: ${email}`);
    return { ...result, message: 'Visage enregistré avec succès' };
  }

  async loginFace(loginFaceDto: { descriptor: number[] }) {
    console.log(
      `[AuthService] Tentative de connexion par reconnaissance faciale`,
    );

    const users = await this.usersService.findAll();
    const threshold = 0.6; // Euclidean distance threshold

    for (const user of users) {
      if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
        continue;
      }

      // Calculate Euclidean distance
      const distance = this.calculateEuclideanDistance(
        loginFaceDto.descriptor,
        user.faceDescriptor,
      );

      console.log(`[AuthService] Distance pour ${user.email}: ${distance}`);

      if (distance < threshold) {
        const { password, ...result } = user;
        console.log(
          `[AuthService] Connexion faciale réussie pour: ${user.email}`,
        );
        return result;
      }
    }

    console.log(`[AuthService] Échec: Aucun visage correspondant trouvé`);
    throw new UnauthorizedException('Visage non reconnu');
  }

  private calculateEuclideanDistance(
    descriptor1: number[],
    descriptor2: number[],
  ): number {
    if (descriptor1.length !== descriptor2.length) {
      return Infinity;
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }
}
