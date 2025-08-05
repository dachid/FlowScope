import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, LoginUserDto } from './dto/auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(createUserDto: CreateUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            name: string | null;
            company: string | null;
            id: string;
            role: string;
            createdAt: Date;
        };
    }>;
    login(loginUserDto: LoginUserDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            company: string | null;
            role: string;
            createdAt: Date;
        };
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<{
        email: string;
        name: string | null;
        company: string | null;
        id: string;
        role: string;
        createdAt: Date;
    }>;
    private generateTokens;
}
