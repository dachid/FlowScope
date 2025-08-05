"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(createUserDto) {
        const { email, password, name, company } = createUserDto;
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.UnauthorizedException('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                company,
                role: 'USER',
            },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                role: true,
                createdAt: true,
            },
        });
        // Generate JWT token
        const tokens = await this.generateTokens(user.id, user.email);
        return {
            user,
            ...tokens,
        };
    }
    async login(loginUserDto) {
        const { email, password } = loginUserDto;
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                company: user.company,
                role: user.role,
                createdAt: user.createdAt,
            },
            ...tokens,
        };
    }
    async refreshTokens(userId, refreshToken) {
        // Verify refresh token
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
            if (payload.sub !== userId) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            // Generate new tokens
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            return this.generateTokens(user.id, user.email);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId) {
        // In a production app, you might want to blacklist the token
        // For now, we'll just return success
        return { message: 'Logout successful' };
    }
    async validateUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                company: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
    async generateTokens(userId, email) {
        const payload = { sub: userId, email };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '7d',
            }),
        ]);
        return {
            accessToken,
            refreshToken,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
