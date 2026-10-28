import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service.js';

const DEFAULT_SHOP_NAME = 'AD Sport Solutions';

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
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
    return this.transporter;
  }

  private async shopName(): Promise<string> {
    try {
      const s = await this.prisma.setting.findUnique({ where: { key: 'shop_name' } });
      return s?.value?.trim() || DEFAULT_SHOP_NAME;
    } catch {
      return DEFAULT_SHOP_NAME;
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
      const siteUrl = (process.env.FRONTEND_URL || 'https://projet-ecommerce-sport-63a1.vercel.app/admin/login').replace(/\/$/, '');
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

  // Ne lève jamais d'erreur : un email raté ne doit pas empêcher la création du compte
  async sendAdminWelcome(to: string, name: string, password: string): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        this.logger.warn("SMTP non configuré : l'email admin n'est pas envoyé.");
        return false;
      }

      const shop = await this.shopName();
      const siteUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
      const loginUrl = `${siteUrl}/admin/login`;
      const from = process.env.MAIL_FROM || `${shop} <${process.env.SMTP_USER}>`;
      const first = (name || '').trim().split(/\s+/)[0] || '';

      // ⚠️ Remplace ces couleurs par celles de ton design
      const C = {
        ink: '#111111',
        action: '#E11D2E',
        canvas: '#F5F5F3',
        line: '#E7E7E4',
        muted: '#6B6B6B',
      };

      // "AD Sport Solutions" -> "AD Sport" en blanc + "Solutions" en rouge
      // (dernier mot en rouge ; si le nom n'a qu'un mot, tout reste en blanc)
      const words = shop.trim().split(/\s+/);
      const brand =
        words.length > 1
          ? `<span style="color:#ffffff">${escapeHtml(words.slice(0, -1).join(' '))} </span><span style="color:${C.action}">${escapeHtml(words[words.length - 1])}</span>`
          : `<span style="color:#ffffff">${escapeHtml(shop)}</span>`;

      const text = [
        `Bonjour ${first},`,
        '',
        `Un compte administrateur ${shop} vient d'être créé pour vous.`,
        '',
        `Email : ${to}`,
        `Mot de passe : ${password}`,
        '',
        `Se connecter : ${loginUrl}`,
      ].join('\n');

      const html = `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:${C.canvas};font-family:Arial,Helvetica,sans-serif;color:${C.ink}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas};padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid ${C.line};border-radius:16px;overflow:hidden">

        <tr><td align="center" style="background:${C.ink};padding:24px">
          <span style="font-size:24px;font-weight:800;letter-spacing:1px">${brand}</span>
        </td></tr>
        <tr><td style="height:4px;background:${C.action};line-height:4px;font-size:4px">&nbsp;</td></tr>

        <tr><td style="padding:32px 32px 8px">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${C.ink}">Bienvenue${first ? ', ' + escapeHtml(first) : ''}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${C.ink}">
            Un compte administrateur <b>${escapeHtml(shop)}</b> vient d'être créé pour vous.
            Voici vos identifiants de connexion :
          </p>
        </td></tr>

        <tr><td style="padding:16px 32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas};border:1px solid ${C.line};border-radius:12px">
            <tr><td style="padding:16px 18px">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C.muted};margin-bottom:4px">Adresse email</div>
              <div style="font-size:15px;font-weight:bold;color:${C.ink}">${escapeHtml(to)}</div>
            </td></tr>
            <tr><td style="padding:0 18px"><div style="border-top:1px solid ${C.line}"></div></td></tr>
            <tr><td style="padding:16px 18px">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C.muted};margin-bottom:4px">Mot de passe</div>
              <div style="font-size:16px;font-weight:bold;font-family:Consolas,Menlo,monospace;color:${C.ink}">${escapeHtml(password)}</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:8px 32px 32px">
          <a href="${loginUrl}" style="display:inline-block;background:${C.action};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:10px">Se connecter à l'administration</a>
        </td></tr>

        <tr><td style="background:${C.canvas};border-top:1px solid ${C.line};padding:18px 32px;text-align:center;font-size:12px;color:${C.muted}">
          © ${new Date().getFullYear()} ${escapeHtml(shop)}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await transporter.sendMail({
        from,
        to,
        subject: `Votre accès administrateur ${shop}`,
        text,
        html,
      });
      return true;
    } catch (err: any) {
      this.logger.error(`Échec d'envoi de l'email admin : ${err?.message || err}`);
      return false;
    }
  }
}