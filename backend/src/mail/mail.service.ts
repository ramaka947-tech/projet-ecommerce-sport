import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { promises as dns } from 'node:dns';
import { PrismaService } from '../prisma/prisma.service.js';

const DEFAULT_SHOP_NAME = 'AD Sport Solutions';
const DEFAULT_SITE_URL = 'https://projet-ecommerce-sport-63a1.vercel.app';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private prisma: PrismaService) {}

  private getSiteUrl(): string {
    const raw = process.env.FRONTEND_URL || DEFAULT_SITE_URL;
    return raw.replace(/\/admin\/login\/?$/, '').replace(/\/$/, '');
  }

  private async shopName(): Promise<string> {
    try {
      const s = await this.prisma.setting.findUnique({ where: { key: 'shop_name' } });
      return s?.value?.trim() || DEFAULT_SHOP_NAME;
    } catch {
      return DEFAULT_SHOP_NAME;
    }
  }

  private getCredentials() {
    const user =
      process.env.SMTP_USER || process.env.MAIL_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
    const pass =
      process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS;
    return { user, pass: pass?.replace(/\s+/g, '') };
  }

  // Accepte la clé "xkeysib-..." ou sa version encodée "eyJ..." (base64 JSON)
  private getBrevoKey(): string | undefined {
    const raw = process.env.BREVO_API_KEY?.trim().replace(/^["']|["']$/g, '');
    if (!raw) return undefined;
    if (raw.startsWith('eyJ')) {
      try {
        const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
        if (decoded?.api_key) return decoded.api_key as string;
      } catch {
        /* on garde la valeur brute */
      }
    }
    return raw;
  }

  // Envoi principal : Brevo (HTTPS) si BREVO_API_KEY existe, sinon SMTP Gmail (local)
  private async send(to: string, subject: string, html: string, shop: string): Promise<boolean> {
    if (this.getBrevoKey()) {
      return this.sendViaBrevo(to, subject, html, shop);
    }
    return this.sendViaSmtp(to, subject, html, shop);
  }

  // --- Brevo : API HTTPS (fonctionne sur Render gratuit) ---
  private async sendViaBrevo(to: string, subject: string, html: string, shop: string): Promise<boolean> {
    // Expéditeur : BREVO_SENDER_EMAIL si défini, sinon l'adresse Gmail déjà configurée
    const senderEmail = process.env.BREVO_SENDER_EMAIL || this.getCredentials().user;
    if (!senderEmail) {
      this.logger.warn('Aucune adresse expéditeur (BREVO_SENDER_EMAIL / SMTP_USER) : email non envoyé.');
      return false;
    }

    try {
      const res = await fetch(BREVO_URL, {
        method: 'POST',
        headers: {
          'api-key': this.getBrevoKey() as string,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: shop, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`❌ Brevo ${res.status} : ${body}`);
        return false;
      }

      this.logger.log(`✅ Email envoyé à ${to} (Brevo)`);
      return true;
    } catch (err: any) {
      this.logger.error(`❌ Brevo : ${err?.message || err}`);
      return false;
    }
  }

  // --- SMTP Gmail : utilisé uniquement en local (port 465 puis 587, IPv4) ---
  private async sendViaSmtp(to: string, subject: string, html: string, shop: string): Promise<boolean> {
    const { user, pass } = this.getCredentials();
    if (!user || !pass) {
      this.logger.warn('Identifiants SMTP introuvables : email non envoyé.');
      return false;
    }

    const configs = [
      { port: 465, secure: true },
      { port: 587, secure: false },
    ];

    let ip = 'smtp.gmail.com';
    try {
      ip = (await dns.lookup('smtp.gmail.com', { family: 4 })).address;
      this.logger.log(`[SMTP] smtp.gmail.com -> ${ip}`);
    } catch (e: any) {
      this.logger.error(`❌ DNS : ${e?.message || e}`);
    }

    for (const c of configs) {
      try {
        this.logger.log(`[SMTP] Tentative sur le port ${c.port}...`);
        const transporter = nodemailer.createTransport({
          host: ip,
          port: c.port,
          tls: {
            servername: 'smtp.gmail.com',
            // Antivirus local qui intercepte le SSL : on tolère hors production uniquement
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
          secure: c.secure,
          requireTLS: !c.secure,
          family: 4,
          auth: { user, pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
        } as any);

        await transporter.sendMail({
          from: `"${shop}" <${user}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`✅ Email envoyé à ${to} (SMTP port ${c.port})`);
        return true;
      } catch (err: any) {
        this.logger.error(`❌ Port ${c.port} : ${err?.message || err}`);
      }
    }
    return false;
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    try {
      const shop = await this.shopName();
      const siteUrl = this.getSiteUrl();
      const first = name.trim().split(/\s+/)[0] || name;

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

      await this.send(to, `Bienvenue chez ${shop}`, html, shop);
    } catch (err: any) {
      this.logger.error(`❌ Échec email de bienvenue : ${err?.message || err}`);
    }
  }

  async sendAdminWelcome(to: string, name: string, password: string): Promise<boolean> {
    try {
      const shop = await this.shopName();
      const loginUrl = `${this.getSiteUrl()}/admin/login`;
      const first = (name || '').trim().split(/\s+/)[0] || '';

      const C = { ink: '#111111', action: '#E11D2E', canvas: '#F5F5F3', line: '#E7E7E4', muted: '#6B6B6B' };
      const words = shop.trim().split(/\s+/);
      const brand = words.length > 1
        ? `<span style="color:#ffffff">${escapeHtml(words.slice(0, -1).join(' '))} </span><span style="color:${C.action}">${escapeHtml(words[words.length - 1])}</span>`
        : `<span style="color:#ffffff">${escapeHtml(shop)}</span>`;

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
            Un compte administrateur <b>${escapeHtml(shop)}</b> vient d'être créé pour vous. Voici vos identifiants :
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

      return await this.send(to, `Votre accès administrateur ${shop}`, html, shop);
    } catch (err: any) {
      this.logger.error(`❌ Échec email admin : ${err?.message || err}`);
      return false;
    }
  }
}