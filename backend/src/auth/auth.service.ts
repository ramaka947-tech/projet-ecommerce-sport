import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js'; // vérifie ce chemin
import { LoginDto } from './dto/login.dto.js';

const validatePassword = (pwd: string): string | null => {
  if (!pwd || pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/[a-z]/.test(pwd)) return 'Le mot de passe doit contenir une lettre minuscule.';
  if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir une lettre majuscule.';
  if (!/[0-9]/.test(pwd)) return 'Le mot de passe doit contenir un chiffre.';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Le mot de passe doit contenir un caractère spécial (ex : ! @ # $ %).';
  return null;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mail: MailService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, admin.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
    });

    return {
      accessToken: token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  }

  async findAllAdmins() {
    return this.prisma.admin.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdmin(data: { name: string; email: string; password: string }) {
        const pwdError = validatePassword(data.password);
    if (pwdError) throw new BadRequestException(pwdError);
    const existing = await this.prisma.admin.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Cet email est déjà utilisé.');

    const hash = await bcrypt.hash(data.password, 10);
    const admin = await this.prisma.admin.create({
      data: { name: data.name, email: data.email, password: hash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // Mot de passe en clair (avant hash), utilisé uniquement pour le mail
    const emailSent = await this.mail.sendAdminWelcome(data.email, data.name, data.password);

    return { ...admin, emailSent };
  }

  async removeAdmin(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }
    return this.prisma.admin.delete({ where: { id } });
  }
}