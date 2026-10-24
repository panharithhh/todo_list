import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { User } from '../user.entity.js';
import { SignupDto, LoginDto } from '../dto/auth.dto.js';
import type { AuthUser } from './decorators.js';
import type { JwtPayload } from './jwt.strategy.js';

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<Session> {
    const email = dto.email.trim().toLowerCase();
    if (await this.userRepository.existsBy({ email })) {
      throw new ConflictException('That email is already taken');
    }

    const user = await this.userRepository.save(
      this.userRepository.create({ email, password: await argon2.hash(dto.password), role: 'user' }),
    );
    return this.startSession(user);
  }

  async login(dto: LoginDto): Promise<Session> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.trim().toLowerCase() },
      select: { id: true, email: true, role: true, password: true },
    });
    if (!user || !(await argon2.verify(user.password, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.startSession(user);
  }

  // Swaps a refresh token for a new pair. Each refresh token works once:
  // presenting an old one means it leaked, so the session is ended.
  async refresh(refreshToken: string | undefined): Promise<Session> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, refreshTokenHash: true },
    });
    if (!user?.refreshTokenHash) throw new UnauthorizedException('Session ended');

    if (!(await argon2.verify(user.refreshTokenHash, refreshToken!))) {
      await this.userRepository.update(user.id, { refreshTokenHash: null });
      throw new UnauthorizedException('Refresh token reused, please log in again');
    }
    return this.startSession(user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken).catch(() => null);
    if (payload) await this.userRepository.update(payload.sub, { refreshTokenHash: null });
  }

  private async startSession(user: User): Promise<Session> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );
    await this.userRepository.update(user.id, { refreshTokenHash: await argon2.hash(refreshToken) });
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string | undefined): Promise<{ sub: string }> {
    if (!token) throw new UnauthorizedException('No refresh token');
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }
}
