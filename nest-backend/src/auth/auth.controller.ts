import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, type Session } from './auth.service.js';
import { CurrentUser, Public, type AuthUser } from './decorators.js';
import { SignupDto, LoginDto } from '../dto/auth.dto.js';

const REFRESH_COOKIE = 'refresh_token';
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/auth', // only sent to /auth/refresh and /auth/logout
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/signup
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  async signup(@Body() body: SignupDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.authService.signup(body), res);
  }

  // POST /auth/login
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.authService.login(body), res);
  }

  // POST /auth/refresh: uses the refresh cookie, rotates it, returns a new access token
  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      return this.respond(await this.authService.refresh(req.cookies?.[REFRESH_COOKIE]), res);
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
      throw err;
    }
  }

  // POST /auth/logout: public so it still works after the access token expires
  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
  }

  // GET /auth/me
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  // The refresh token goes in the cookie; only the access token goes in the body
  private respond({ user, accessToken, refreshToken }: Session, res: Response) {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user, accessToken };
  }
}
