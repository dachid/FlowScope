import { PrismaClient } from '../../prisma/generated/client';
export declare class PrismaService extends PrismaClient {
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
