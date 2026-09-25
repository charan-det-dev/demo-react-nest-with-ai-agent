import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';

type MockPrisma = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  verificationToken: {
    findUnique: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  passwordResetToken: {
    findUnique: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
};

function createMockPrisma(): MockPrisma {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function createMockJwtService() {
  return {
    signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
  };
}

function createMockMailService() {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockConfigService(overrides: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string) => overrides[key]),
  };
}

describe('AuthService', () => {
  let prisma: MockPrisma;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let mailService: ReturnType<typeof createMockMailService>;
  let configService: ReturnType<typeof createMockConfigService>;
  let authService: AuthService;

  beforeEach(() => {
    prisma = createMockPrisma();
    jwtService = createMockJwtService();
    mailService = createMockMailService();
    configService = createMockConfigService();
    authService = new AuthService(
      prisma as any,
      jwtService as any,
      mailService as any,
      configService as any,
    );
  });

  describe('register', () => {
    it('creates an unverified user with a hashed password and phone when phone is provided', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'user-1',
          email: data.email,
          passwordHash: data.passwordHash,
          phone: data.phone,
          verified: false,
        }),
      );
      prisma.verificationToken.create.mockResolvedValue(undefined);

      const dto = { email: 'user@example.com', password: 'password123', phone: '+66812345678' };
      const result = await authService.register(dto as any);

      // user is created unverified
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.email).toBe(dto.email);
      expect(createArgs.data.phone).toBe(dto.phone);

      // password is hashed, not stored in plaintext
      expect(createArgs.data.passwordHash).not.toBe(dto.password);
      await expect(bcrypt.compare(dto.password, createArgs.data.passwordHash)).resolves.toBe(true);

      // a verification token is generated and emailed
      expect(prisma.verificationToken.create).toHaveBeenCalledTimes(1);
      const tokenArgs = prisma.verificationToken.create.mock.calls[0][0];
      expect(tokenArgs.data.userId).toBe('user-1');
      expect(typeof tokenArgs.data.token).toBe('string');
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        tokenArgs.data.token,
      );

      // response shape: unverified public user, no passwordHash leaked
      expect(result.user).toEqual({
        id: 'user-1',
        email: dto.email,
        phone: dto.phone,
        verified: false,
      });
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('creates an unverified user with phone set to null when phone is omitted', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'user-2',
          email: data.email,
          passwordHash: data.passwordHash,
          phone: data.phone,
          verified: false,
        }),
      );
      prisma.verificationToken.create.mockResolvedValue(undefined);

      const dto = { email: 'nophone@example.com', password: 'password123' };
      const result = await authService.register(dto as any);

      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.phone).toBeNull();
      expect(result.user.phone).toBeNull();
      expect(result.user.verified).toBe(false);
    });

    it('rejects registration when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'dup@example.com' });

      const dto = { email: 'dup@example.com', password: 'password123' };

      await expect(authService.register(dto as any)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('marks the user as verified and deletes the token when the token is valid', async () => {
      const futureExpiry = new Date(Date.now() + 60_000);
      prisma.verificationToken.findUnique.mockResolvedValue({
        id: 'token-1',
        token: 'valid-token',
        userId: 'user-1',
        expiresAt: futureExpiry,
      });
      prisma.user.update.mockResolvedValue({ id: 'user-1', verified: true });
      prisma.verificationToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await authService.verifyEmail('valid-token');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { verified: true },
      });
      expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({ message: 'Email verified successfully.' });
    });

    it('rejects an unknown token without touching the user', async () => {
      prisma.verificationToken.findUnique.mockResolvedValue(null);

      await expect(authService.verifyEmail('unknown-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
    });

    it('rejects an expired token without touching the user', async () => {
      const pastExpiry = new Date(Date.now() - 60_000);
      prisma.verificationToken.findUnique.mockResolvedValue({
        id: 'token-2',
        token: 'expired-token',
        userId: 'user-1',
        expiresAt: pastExpiry,
      });

      await expect(authService.verifyEmail('expired-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    async function buildUser(overrides: Record<string, any> = {}) {
      const password = overrides.plainPassword ?? 'correct-password';
      const passwordHash = await bcrypt.hash(password, 4);
      return {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash,
        phone: null,
        verified: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        ...overrides,
      };
    }

    it('rejects login for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'whatever' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects login for an unverified user without checking the password', async () => {
      const user = await buildUser({ verified: false });
      prisma.user.findUnique.mockResolvedValue(user);

      const attempt = authService.login({ email: user.email, password: 'correct-password' } as any);

      await expect(attempt).rejects.toBeInstanceOf(ForbiddenException);
      await attempt.catch((err) => {
        expect(err.getResponse()).toMatchObject({ error: 'EMAIL_NOT_VERIFIED' });
      });
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects login with the wrong password and records a failed attempt', async () => {
      const user = await buildUser({ failedLoginAttempts: 0 });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, failedLoginAttempts: 1 });

      await expect(
        authService.login({ email: user.email, password: 'wrong-password' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { failedLoginAttempts: 1, lockedUntil: null },
      });
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('issues a JWT and returns the public user on successful login', async () => {
      const user = await buildUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await authService.login({
        email: user.email,
        password: 'correct-password',
      } as any);

      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id, email: user.email });
      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        tokenType: 'Bearer',
        user: { id: user.id, email: user.email, phone: user.phone, verified: true },
      });
      // no prior failures/lock to clear, so no extra write is needed
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
