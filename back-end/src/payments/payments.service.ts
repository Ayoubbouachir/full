import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
const PDFDocument = require('pdfkit');
import { createWriteStream, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly backendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly ordersService: OrdersService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    // const secretKey = 'sk_test_51PEtD0...';
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2026-01-28.clover' as any,
    });
    this.backendUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
  }

  async sendPaymentConfirmationEmail(
    items: any[],
    userEmail: string,
    userName: string,
  ) {
    try {
      const dataToken = Buffer.from(
        JSON.stringify({ items, userEmail, userName }),
      ).toString('base64');
      const confirmationUrl = `${this.backendUrl}/payments/confirm?token=${dataToken}`;

      await this.mailerService.sendMail({
        to: userEmail,
        subject: 'Confirmation de votre paiement - FullStakers',
        template: 'payment-confirmation',
        context: {
          userName,
          items,
          confirmationUrl,
        },
      });

      return { message: 'Confirmation email sent' };
    } catch (error) {
      console.error('Email Error:', error);
      if (error.responseCode === 535) {
        throw new InternalServerErrorException(
          "Erreur d'authentification SMTP : Vérifiez votre mot de passe d'application Gmail.",
        );
      }
      throw new InternalServerErrorException(
        "Échec de l'envoi de l'e-mail de confirmation : " +
          (error.message || 'Erreur inconnue'),
      );
    }
  }

  async confirmPayment(token: string) {
    try {
      const decodedData = JSON.parse(
        Buffer.from(token, 'base64').toString('utf-8'),
      );
      const { items, userEmail, userName } = decodedData;

      if (!items || !Array.isArray(items)) {
        throw new BadRequestException('Invalid confirmation token');
      }

      // Create the order in the database first
      console.log(`Creating order for ${userEmail} (${userName})`);
      await this.ordersService.create({
        status: 'Pending',
        userEmail: userEmail,
        lines: items.map((item) => ({
          idProduct: item._id || item.id,
          productName: item.nomP || item.name || 'Produit',
          qnt: item.quantity || item.qnt,
          unitPrice: item.prix || item.price || item.unitPrice,
        })),
      });

      // Redirect to Stripe with details in the success URL
      const session = await this.createCheckoutSession(
        items,
        userEmail,
        userName,
      );
      return session.url;
    } catch (error) {
      console.error('Confirmation Error:', error);
      throw new BadRequestException('Confirmation failed: ' + error.message);
    }
  }

  async sendInvoiceEmail(
    items: any[],
    userEmail: string,
    userName: string,
    statusLabel?: string,
  ) {
    try {
      // Use provided status or default based on email (historical fallback)
      const finalStatus =
        statusLabel ||
        (userEmail.includes('cod') ? 'Paiement sur place' : 'Payé');

      const pdfBuffer = await this.generateInvoicePDF(
        items,
        userName,
        finalStatus,
      );

      await this.mailerService.sendMail({
        to: userEmail,
        subject: 'Votre Facture Professionnelle - FullStakers',
        template: 'invoice',
        context: {
          userName,
          frontendUrl: this.configService.get('FRONTEND_URL'),
        },
        attachments: [
          {
            filename: `Facture_FullStakers_${Date.now()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      console.log(`Invoice email sent to ${userEmail}`);
    } catch (error) {
      console.error('Invoice Email Error:', error);
    }
  }

  async generateInvoicePDF(
    items: any[],
    userName: string,
    statusLabel: string = 'Payé',
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fillColor('#444444')
        .fontSize(20)
        .text('FullStakers - Facture', 110, 57);
      doc.fontSize(10).text('123 Business Road', 200, 65, { align: 'right' });
      doc.text('Tunisia, TN 1001', 200, 80, { align: 'right' });
      doc.moveDown();

      // Invoice Info
      doc
        .fillColor('#ff5e14')
        .fontSize(14)
        .text('DÉTAILS DE LA FACTURE', 50, 160);
      doc
        .fillColor('#333333')
        .fontSize(10)
        .text(`Nom du client: ${userName}`, 50, 180);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 195);
      doc.text(`Statut: ${statusLabel}`, 50, 210);
      doc.moveDown();

      // Table Header
      const tableTop = 270;
      doc.font('Helvetica-Bold');
      doc.text('Produit', 50, tableTop);
      doc.text('Prix Unit.', 250, tableTop);
      doc.text('Quantité', 350, tableTop);
      doc.text('Total', 450, tableTop);
      doc.moveDown();
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table Content
      let position = tableTop + 30;
      let totalAmount = 0;
      doc.font('Helvetica');

      items.forEach((item) => {
        const itemTotal = (item.prix || item.price) * item.quantity;
        totalAmount += itemTotal;

        doc.text(item.nomP || item.name, 50, position);
        doc.text(`${(item.prix || item.price).toFixed(2)} DT`, 250, position);
        doc.text(item.quantity.toString(), 350, position);
        doc.text(`${itemTotal.toFixed(2)} DT`, 450, position);
        position += 20;
      });

      // Footer Total
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, position + 5)
        .lineTo(550, position + 5)
        .stroke();
      doc
        .font('Helvetica-Bold')
        .text(
          `TOTAL À PAYER: ${totalAmount.toFixed(2)} DT`,
          400,
          position + 20,
        );

      doc.end();
    });
  }

  async createCheckoutSession(
    items: any[],
    userEmail?: string,
    userName?: string,
  ) {
    try {
      console.log(
        'Creating checkout session for items:',
        JSON.stringify(items, null, 2),
      );
      const lineItems = items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.nomP,
            images:
              item.imagePUrl && item.imagePUrl.startsWith('http')
                ? [item.imagePUrl]
                : [],
          },
          unit_amount: Math.round(item.prix * 100),
        },
        quantity: item.quantity,
      }));

      // Include user info in success URL to trigger invoice email on the Success page
      const successUrl = new URL(
        `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001'}/success`,
      );
      if (userEmail) successUrl.searchParams.append('email', userEmail);
      if (userName) successUrl.searchParams.append('name', userName);

      // Also store items in a simplified way if possible, or just send them back
      const itemsToken = Buffer.from(JSON.stringify(items)).toString('base64');
      successUrl.searchParams.append('items', itemsToken);

      const session = await this.stripe.checkout.sessions.create({
        customer_email: userEmail,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl.toString(),
        cancel_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001'}/cart`,
      });

      return { id: session.id, url: session.url };
    } catch (error) {
      console.error('Stripe Error:', error);
      throw error;
    }
  }
}
