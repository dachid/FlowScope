"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const teams_service_1 = require("./teams.service");
const teams_dto_1 = require("./dto/teams.dto");
let TeamsController = class TeamsController {
    constructor(teamsService) {
        this.teamsService = teamsService;
    }
    async createTeam(req, createTeamDto) {
        // In a real implementation, this would extract user ID from JWT token
        const userId = req.user?.id || 'anonymous-user';
        return this.teamsService.createTeam(userId, createTeamDto);
    }
    async getUserTeams(req) {
        const userId = req.user?.id || 'anonymous-user';
        return this.teamsService.getUserTeams(userId);
    }
    async getTeam(teamId, req) {
        const userId = req.user?.id || 'anonymous-user';
        return this.teamsService.getTeamById(teamId, userId);
    }
    async addMember(teamId, req, addMemberDto) {
        const userId = req.user?.id || 'anonymous-user';
        return this.teamsService.addMember(teamId, userId, addMemberDto);
    }
    async updateMemberRole(teamId, req, updateMemberRoleDto) {
        const userId = req.user?.id || 'anonymous-user';
        return this.teamsService.updateMemberRole(teamId, userId, updateMemberRoleDto);
    }
    async removeMember(teamId, memberId, req) {
        const userId = req.user?.id || 'anonymous-user';
        return this.teamsService.removeMember(teamId, userId, memberId);
    }
    async leaveTeam(teamId, req) {
        const userId = req.user?.id || 'anonymous-user';
        return this.teamsService.leaveTeam(teamId, userId);
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, teams_dto_1.CreateTeamDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "createTeam", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getUserTeams", null);
__decorate([
    (0, common_1.Get)(':teamId'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getTeam", null);
__decorate([
    (0, common_1.Post)(':teamId/members'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, teams_dto_1.AddMemberDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Put)(':teamId/members'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, teams_dto_1.UpdateMemberRoleDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Delete)(':teamId/members/:memberId'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)(':teamId/leave'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "leaveTeam", null);
exports.TeamsController = TeamsController = __decorate([
    (0, common_1.Controller)('teams'),
    __metadata("design:paramtypes", [teams_service_1.TeamsService])
], TeamsController);
