import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service.js';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private prisma: PrismaService) { }

  // Créé à la première utilisation : le .env est alors forcément chargé
  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

    const port = Number(SMTP_PORT) || 465;
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return this.transporter;
  }

  private async shopName(): Promise<string> {
    try {
      const s = await this.prisma.setting.findUnique({ where: { key: 'shop_name' } });
      return s?.value || 'SportPro';
    } catch {
      return 'SportPro';
    }
  }

  // Ne lève jamais d'erreur : un email raté ne doit pas empêcher l'inscription
  async sendWelcome(to: string, name: string): Promise<void> {
    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        this.logger.warn("SMTP non configuré : l'email de bienvenue n'est pas envoyé.");
        return;
      }

      const shop = await this.shopName();
      const siteUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      const from = process.env.MAIL_FROM || `${shop} <${process.env.SMTP_USER}>`;
      const first = name.trim().split(/\s+/)[0] || name;

      const text = [
        `Bonjour ${first},`,
        '',
        `Bienvenue chez ${shop} ! Votre compte est créé.`,
        '',
        'Avec votre compte, vous pouvez :',
        '- suivre vos commandes en temps réel,',
        '- retrouver votre panier et vos favoris sur tous vos appareils,',
        '- commander plus vite grâce à vos informations enregistrées.',
        '',
        `Découvrir la boutique : ${siteUrl}/boutique`,
        '',
        "Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.",
      ].join('\n');

      const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111;line-height:1.5">
  <h1 style="font-size:22px;margin:0 0 16px">Bienvenue chez ${escapeHtml(shop)}</h1>
  <p>Bonjour ${escapeHtml(first)},</p>
  <p>Votre compte est créé. Avec votre compte, vous pouvez :</p>
  <ul style="padding-left:20px">
    <li>suivre vos commandes en temps réel,</li>
    <li>retrouver votre panier et vos favoris sur tous vos appareils,</li>
    <li>commander plus vite grâce à vos informations enregistrées.</li>
  </ul>
  <p style="margin:24px 0">
    <a href="${siteUrl}/boutique" style="background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">Découvrir la boutique</a>
  </p>
  <p style="font-size:12px;color:#666">Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.</p>
</div>`;

      await transporter.sendMail({
        from,
        to,
        subject: `Bienvenue chez ${shop}`,
        text,
        html,
      });
    } catch (err: any) {
      this.logger.error(`Échec d'envoi de l'email de bienvenue : ${err?.message || err}`);
    }
  }
}