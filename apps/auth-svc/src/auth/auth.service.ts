import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ChangePasswordDto, ContextUser, KeysOf, LoginTokenResponse, LoginUserDto, RefreshToken, RefreshTokenDto, RegisterUserDto, ROOT_ADMIN_EMAIL, ROOT_ADMIN_ID, User, UserRole } from "@backend-evolved/shared";
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { KeyService } from '../key/key.service';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(RefreshToken) private refreshRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
        private keyService: KeyService
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

    async register(data: RegisterUserDto) {
        const existing = await this.userRepository.findOne({ where: { email: data.email } })
        if (existing) throw new ConflictException('An User with this email already exists')
        const hash = await bcrypt.hash(data.password, 10)
        const user = this.userRepository.create({ email: data.email, passwordHash: hash, role: data.role })
        return await this.userRepository.save(user)
    }

    async login(data: LoginUserDto): Promise<LoginTokenResponse | { firstLogin: boolean, resetPassword: string }> {
        const user = await this.userRepository.findOne({ where: { email: data.email } });
        if (!user) throw new NotFoundException(`User with email ${data.email} not found`);
        const valid = await bcrypt.compare(data.password, user.passwordHash)
        if (!valid) throw new UnauthorizedException(`Invalid password for user ${data.email}`);
        if (!user.active) {
            switch (user.role) {
                case UserRole.PATIENT:
                    return { ...await this.generatePasswordResetToken(user), firstLogin: true };
                case UserRole.NUTRITIONIST:
                    throw new HttpException(`Your account has been successfully created, but it is currently under review. Please wait for approval to access all features.`, 202);
            }
        }
        return { ...await this.generateTokens(user), role: user.role };
    }

    async generateTokens(user: User) {
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
        return { ...await this.generateTokens(saved.user), role: saved.user.role }
    }

    async deleteUserByEmail(email: string): Promise<void> {
        if (email === ROOT_ADMIN_EMAIL) {
            throw new ForbiddenException('You cannot delete this user.');
        }
        const user = await this.userRepository.findOne({ where: { email } })
        if (!user) throw new NotFoundException(`User with email ${email} not found`)
        await this.userRepository.remove(user);
    }

    async generatePasswordResetToken(user: User): Promise<{ resetPassword: string }> {
        const payload: any = { resetFor: user.id };
        // add firstLogin flag only for patients that are not active
        if (user.role === UserRole.PATIENT && !user.active) {
            payload.firstLogin = true;
        }
        const resetToken = this.jwtService.sign(payload, { expiresIn: '5m' });
        return { resetPassword: resetToken };
    }

    async loginAdmin(email: string, password: string): Promise<LoginTokenResponse> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new NotFoundException(`User with email ${email} not found`);
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) throw new UnauthorizedException(`Invalid password for user ${email}`);
        if (user.role !== UserRole.ADMIN) throw new ForbiddenException("The user is not an admin.");
        return { ...await this.generateTokens(user), role: user.role };
    }

    async approveNutritionist(email: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new NotFoundException(`User with email ${email} not found`);
        if (user.role !== UserRole.NUTRITIONIST) throw new ForbiddenException(`User with email ${email} is not a nutritionist`);
        if (user.active) throw new ConflictException(`Nutritionist with email ${email} is already active`);
        user.active = true;
        return await this.userRepository.save(user);
    }

    async forgotPassword(data: { email: string }): Promise<{ resetPassword: string }> {
        const user = await this.userRepository.findOne({ where: { email: data.email } });
        if (!user) throw new NotFoundException(`User with email ${data.email} not found`);
        return await this.generatePasswordResetToken(user);
    }

    async resetPassword(data: { resetPasswordToken: string, newPassword: string }) {
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

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException(`User not found`);

        const hash = await bcrypt.hash(data.newPassword, 10);
        user.passwordHash = hash;

        // If token indicates firstLogin, activate the patient account
        if (firstLoginFlag && user.role === UserRole.PATIENT) {
            user.active = true;
        }

        await this.userRepository.save(user);

        // Try to remove existing refresh tokens for the user (best-effort)
        try {
            await this.refreshRepository.createQueryBuilder()
                .delete()
                .where("userId = :id", { id: user.id })
                .execute();
        } catch (e) {
            // ignore: depending on entity mapping the column name may differ
        }

        return { ...await this.generateTokens(user), role: user.role };
    }

    async changePassword(user: ContextUser, data: ChangePasswordDto): Promise<LoginTokenResponse> {
        let foundUser = await this.userRepository.findOne({ where: { id: user.id } });
        if (!foundUser) throw new NotFoundException("User not found");
        const valid = await bcrypt.compare(data.currentPassword, foundUser.passwordHash);
        if (!valid) throw new UnauthorizedException(`Invalid password`);
        const newHashedPassword = await bcrypt.hash(data.newPassword, 10);
        foundUser.passwordHash = newHashedPassword;
        foundUser = await this.userRepository.save(foundUser, { reload: true });
        return {
            ...await this.generateTokens(foundUser),
            role: foundUser.role
        };
    }

    async findAll(query?: Partial<KeysOf<User>>): Promise<User[]> {
        return await this.userRepository.find({ where: query });
    }

    async findManyByIds(ids: string[]): Promise<User[]> {
        if (!ids.length) return [];
        return await this.userRepository.find({
            where: { id: In(ids) }
        });
    }

    async findOne(where: { [key in keyof User]?: any }) {
        const foundUser = await this.userRepository.findOneBy(where);
        if (!foundUser) throw new NotFoundException('Nutritionist not found');
        return foundUser;
    }

    async deleteOneById(id: string): Promise<void> {
        if (id === ROOT_ADMIN_ID) {
            throw new ForbiddenException('You cannot delete this user.');
        }
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException(`User with id ${id} not found`);

        console.log("Received userId: ", id);

        // Find all refresh tokens associated with this user and delete them
        const refreshTokens = await this.refreshRepository.find({
            where: { user: { id } },
            relations: ['user']
        });

        if (refreshTokens.length > 0) {
            await this.refreshRepository.remove(refreshTokens);
        }

        // Now delete the user
        await this.userRepository.remove(user);
    }

}
