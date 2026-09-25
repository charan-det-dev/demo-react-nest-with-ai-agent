import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { parseDurationToMs } from '../common/utils/duration.util';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const BCRYPT_SALT_ROUNDS = 10;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface PublicUser {
  id: string;
  email: string;
  phone: string | null;
  verified: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  private toPublicUser(user: {
    id: string;
    email: string;
    phone: string | null;
    verified: boolean;
  }): PublicUser {
    return { id: user.id, email: user.email, phone: user.phone, verified: user.verified };
  }

  async register(dto: RegisterDto): Promise<{ message: string; user: PublicUser }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone ?? null,
      },
    });

    const token = randomUUID();
    const expiresInMs = parseDurationToMs(
      this.configService.get<string>('VERIFICATION_TOKEN_EXPIRES_IN') ?? '24h',
    );

    await this.prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + expiresInMs),
      },
    });

    await this.mailService.sendVerificationEmail(user.email, token);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user: this.toPublicUser(user),
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw new UnauthorizedException('invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { verified: true },
    });

    await this.prisma.verificationToken.deleteMany({
      where: { userId: verificationToken.userId },
    });

    return { message: 'Email verified successfully.' };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; tokenType: 'Bearer'; user: PublicUser }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('invalid email or password');
    }

    if (!user.verified) {
      throw new ForbiddenException({
        message: 'account is not verified. Please check your email for the verification link.',
        error: 'EMAIL_NOT_VERIFIED',
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException({
        message: 'account is locked due to repeated failed login attempts. Please try again later.',
        error: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil,
      });
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      const failedLoginAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : failedLoginAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
        },
      });

      if (shouldLock) {
        throw new ForbiddenException({
          message:
            'account is locked due to repeated failed login attempts. Please try again later.',
          error: 'ACCOUNT_LOCKED',
        });
      }

      throw new UnauthorizedException('invalid email or password');
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { accessToken, tokenType: 'Bearer', user: this.toPublicUser(user) };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericMessage = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return genericMessage;
    }

    const token = randomUUID();
    const expiresInMs = parseDurationToMs(
      this.configService.get<string>('PASSWORD_RESET_TOKEN_EXPIRES_IN') ?? '1h',
    );

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + expiresInMs),
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, token);

    return genericMessage;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return { message: 'Password has been reset successfully.' };
  }
}
