import { ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ChangePasswordDto, ContextUser, FirstLoginResponse, LoginResponse, LoginUserDto, RefreshToken, ResetPasswordDto, ResetPasswordResponse, User, UserRole } from "@backend-evolved/shared";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { KeyService } from '../key/key.service';
import { TokenService } from './token.service';
import { UserService } from './user.service';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(RefreshToken) private refreshRepository: Repository<RefreshToken>,
        private userService: UserService,
        private jwtService: JwtService,
        private keyService: KeyService,
        private tokenService: TokenService
    ) { }

    private async executeLogin(data: LoginUserDto): Promise<User> {
        const user = await this.userService.findOne({ email: data.email });
        if (!user) throw new NotFoundException(`User with email ${data.email} not found`);
        const valid = await bcrypt.compare(data.password, user.passwordHash)
        if (!valid) throw new UnauthorizedException(`Invalid password for user ${data.email}`);
        return user;
    }

    async generalLogin(payload: LoginUserDto): Promise<LoginResponse | FirstLoginResponse> {
        const user = await this.executeLogin(payload);
        if (!user.active) {
            switch (user.role) {
                case UserRole.PATIENT:
                    return await this.tokenService.firstLoginTokenResponse(user);
                case UserRole.NUTRITIONIST:
                    throw new HttpException(`Your account has been successfully created, but it is currently under review. Please wait for approval to access all features.`, 202);
            }
        }
        return await this.tokenService.loginTokenResponse(user);
    }

    async adminLogin(payload: LoginUserDto): Promise<LoginResponse> {
        const user = await this.executeLogin(payload);
        if (user.role !== UserRole.ADMIN) throw new ForbiddenException("The user is not an admin.");
        return await this.tokenService.loginTokenResponse(user);
    }

    async approveNutritionist(email: string): Promise<User> {
        const user = await this.userService.findOne({ email });
        if (user.active) throw new ConflictException(`Nutritionist with email ${email} is already active`);
        return await this.userService.updateOneById(user.id, { active: true });
    }

    async forgotPassword(email: string): Promise<ResetPasswordResponse> {
        const user = await this.userService.findOne({ email });
        if (!user) throw new NotFoundException(`User with email ${email} not found`);
        return await this.tokenService.generatePasswordResetToken(user);
    }

    async resetPassword(data: ResetPasswordDto): Promise<LoginResponse> {
        let payload: any;
        try {
            const publicKey = this.keyService.getPublicKey();
            payload = this.jwtService.verify(data.resetPasswordToken, { publicKey, algorithms: ['RS256'] });
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        const userId = payload?.resetFor;
        const firstLoginFlag = payload?.firstLogin === true;
        if (!userId) throw new UnauthorizedException('Invalid reset token payload');

        const user = await this.userService.findOne({ id: userId });

        const hash = await bcrypt.hash(data.newPassword, 10);
        user.passwordHash = hash;

        // If token indicates firstLogin, activate the patient account
        if (firstLoginFlag && user.role === UserRole.PATIENT) {
            user.active = true;
        }

        await this.userService.save(user);

        // Try to remove existing refresh tokens for the user (best-effort)
        try {
            await this.refreshRepository.createQueryBuilder()
                .delete()
                .where("userId = :id", { id: user.id })
                .execute();
        } catch (e) {
            // ignore: depending on entity mapping the column name may differ
        }

        return await this.tokenService.loginTokenResponse(user);
    }

    async changePassword(user: ContextUser, data: ChangePasswordDto): Promise<LoginResponse> {
        let foundUser = await this.userService.findOne({ id: user.id });
        if (!foundUser) throw new NotFoundException("User not found");
        const valid = await bcrypt.compare(data.currentPassword, foundUser.passwordHash);
        if (!valid) throw new UnauthorizedException(`Invalid password`);
        const newHashedPassword = await bcrypt.hash(data.newPassword, 10);
        foundUser.passwordHash = newHashedPassword;
        return await this.tokenService.loginTokenResponse(foundUser);
    }

}
