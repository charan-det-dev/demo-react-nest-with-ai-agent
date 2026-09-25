import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
    });
    this.from = this.configService.get<string>('SMTP_FROM') ?? 'No Reply <no-reply@example.com>';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Verify your email address',
      text: `Welcome! Please verify your email by visiting this link: ${verifyUrl}\n\nThis link will expire soon.`,
      html: `
        <p>Welcome!</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link will expire soon.</p>
      `,
    });

    this.logger.log(`Verification email sent to ${email}`);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Reset your password',
      text: `We received a request to reset your password. Visit this link to choose a new password: ${resetUrl}\n\nIf you did not request this, you can ignore this email. This link will expire soon.`,
      html: `
        <p>We received a request to reset your password.</p>
        <p>Click the link below to choose a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email. This link will expire soon.</p>
      `,
    });

    this.logger.log(`Password reset email sent to ${email}`);
  }
}
