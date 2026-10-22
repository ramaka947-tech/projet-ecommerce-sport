import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const URL_KEYS = ['social_instagram', 'social_facebook', 'social_tiktok'];

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const settings = await this.prisma.setting.findMany();
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);
  }

  private validate(input: Record<string, string>) {
    const data: Record<string, string> = {};

    for (const [key, raw] of Object.entries(input)) {
      if (typeof raw !== 'string') {
        throw new BadRequestException(`La valeur de "${key}" doit être du texte.`);
      }
      data[key] = raw.trim();
    }

    for (const key of URL_KEYS) {
      if (data[key] && !/^https:\/\/\S+$/.test(data[key])) {
        throw new BadRequestException(`Le lien "${key}" doit commencer par https://`);
      }
    }

    if (data.contact_email && !/^\S+@\S+\.\S+$/.test(data.contact_email)) {
      throw new BadRequestException('Email de contact invalide.');
    }

    if (data.social_whatsapp) {
      // On ne garde que les chiffres (ex: "+221 77 000 00 00" -> "221770000000")
      data.social_whatsapp = data.social_whatsapp.replace(/\D/g, '');
      if (!/^\d{8,15}$/.test(data.social_whatsapp)) {
        throw new BadRequestException('Numéro WhatsApp invalide.');
      }
    }

    // Coordonnées de la boutique (latitude : ±90, longitude : ±180)
    for (const [key, max] of [
      ['contact_lat', 90],
      ['contact_lng', 180],
    ] as const) {
      if (data[key]) {
        const n = Number(data[key]);
        if (!Number.isFinite(n) || Math.abs(n) > max) {
          throw new BadRequestException(`Coordonnée "${key}" invalide.`);
        }
      }
    }

    if (data.cgv) {
      try {
        if (!Array.isArray(JSON.parse(data.cgv))) throw new Error();
      } catch {
        throw new BadRequestException('Format des CGV invalide.');
      }
    }

        if (data.about) {
      try {
        const p = JSON.parse(data.about);
        if (typeof p?.title !== 'string' || !Array.isArray(p?.paragraphs)) {
          throw new Error();
        }
      } catch {
        throw new BadRequestException('Format de la page À propos invalide.');
      }
    }

    return data;

  }

  async update(input: Record<string, string>) {
    const data = this.validate(input);
    const updates = Object.entries(data).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.findAll();
  }
}