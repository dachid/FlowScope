"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const sessions_module_1 = require("./sessions/sessions.module");
const traces_module_1 = require("./traces/traces.module");
const prompts_module_1 = require("./prompts/prompts.module");
const teams_module_1 = require("./teams/teams.module");
const projects_module_1 = require("./projects/projects.module");
const sharing_module_1 = require("./sharing/sharing.module");
const collaboration_module_1 = require("./collaboration/collaboration.module");
const websocket_module_1 = require("./websocket/websocket.module");
const preferences_module_1 = require("./preferences/preferences.module");
const bookmarks_module_1 = require("./bookmarks/bookmarks.module");
const health_controller_1 = require("./health/health.controller");
const logger_middleware_1 = require("./middleware/logger.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(logger_middleware_1.LoggerMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            sessions_module_1.SessionsModule,
            traces_module_1.TracesModule,
            prompts_module_1.PromptsModule,
            teams_module_1.TeamsModule,
            projects_module_1.ProjectsModule,
            sharing_module_1.SharingModule,
            collaboration_module_1.CollaborationModule,
            websocket_module_1.WebSocketModule,
            preferences_module_1.PreferencesModule,
            bookmarks_module_1.BookmarksModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
