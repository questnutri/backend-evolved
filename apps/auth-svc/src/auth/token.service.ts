import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticationTokens, FirstLoginResponse, LoginResponse, RefreshToken, RefreshTokenDto, ResetPasswordResponse, User, UserRole } from "@backend-evolved/shared";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class TokenService {
    constructor(
        @InjectRepository(RefreshToken) private refreshRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
    ) { }

    private getRefreshWindowSeconds(role: UserRole): number {
        switch (role) {
            case UserRole.NUTRITIONIST:
                return 7 * 24 * 3600 // 1 week
            case UserRole.ADMIN:
                return 24 * 3600 // 1 day
            case UserRole.PATIENT:
                return 30 * 24 * 3600 // 1 month (~30 days)
            default:
                return 7 * 24 * 3600 // fallback to 1 week
        }
    }

    async generateTokens(user: User): Promise<AuthenticationTokens> {
        const payload = { sub: user.id, role: user.role }
        const accessToken = this.jwtService.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' })
        const refreshWindowSec = this.getRefreshWindowSeconds(user.role as UserRole)
        const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshWindowSec })
        const refresh = this.refreshRepository.create({
            user,
            token: refreshToken,
            expiresAt: new Date(Date.now() + refreshWindowSec * 1000)
        })
        await this.refreshRepository.save(refresh)
        return { accessToken, refreshToken }
    }

    async refresh(data: RefreshTokenDto) {
        const saved = await this.refreshRepository.findOne({ where: { token: data.refreshToken }, relations: ['user'] })
        if (!saved) throw new UnauthorizedException()
        if (saved.expiresAt.getTime() < Date.now()) {
            // remove expired token
            await this.refreshRepository.delete(saved.id)
            throw new UnauthorizedException()
        }
        return await this.loginTokenResponse(saved.user);
    }

    async generatePasswordResetToken(user: User): Promise<ResetPasswordResponse> {
        const payload: any = { resetFor: user.id };
        // add firstLogin flag only for patients that are not active
        if (user.role === UserRole.PATIENT && !user.active) {
            payload.firstLogin = true;
        }
        const resetToken = this.jwtService.sign(payload, { expiresIn: '5m' });
        return { resetPassword: resetToken };
    }

    async loginTokenResponse(user: User): Promise<LoginResponse> {
        const tokens = await this.generateTokens(user);
        return {
            ...tokens,
            role: user.role,
            id: user.id
        };
    }

    async firstLoginTokenResponse(user: User): Promise<FirstLoginResponse> {
        const resetTokenResponse = await this.generatePasswordResetToken(user);
        return {
            ...resetTokenResponse,
            firstLogin: true
        };
    }
}