"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    // Global validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Enable CORS
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', 'http://localhost:5173'),
        credentials: true,
    });
    // Global prefix
    app.setGlobalPrefix('api');
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`🚀 FlowScope Backend running on: http://localhost:${port}`);
}
bootstrap();
