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
exports.SharingController = void 0;
const common_1 = require("@nestjs/common");
const sharing_service_1 = require("./sharing.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const sharing_dto_1 = require("./dto/sharing.dto");
let SharingController = class SharingController {
    constructor(sharingService) {
        this.sharingService = sharingService;
    }
    async createShareLink(createShareLinkDto, req) {
        return this.sharingService.createShareLink(createShareLinkDto, req.user.id);
    }
    async getShareLinks(req) {
        return this.sharingService.getShareLinksByUser(req.user.id);
    }
    async getShareLinkByToken(shareToken) {
        return this.sharingService.getShareLinkByToken(shareToken);
    }
    async updateShareLink(id, updateShareLinkDto, req) {
        return this.sharingService.updateShareLink(id, updateShareLinkDto, req.user.id);
    }
    async revokeShareLink(id, req) {
        return this.sharingService.revokeShareLink(id, req.user.id);
    }
    async accessSharedResource(shareToken, accessDto, req) {
        return this.sharingService.accessSharedResource(shareToken, req.user?.id);
    }
    async validateShareAccess(shareToken, action) {
        return this.sharingService.validateShareAccess(shareToken, action);
    }
};
exports.SharingController = SharingController;
__decorate([
    (0, common_1.Post)('links'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sharing_dto_1.CreateShareLinkDto, Object]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "createShareLink", null);
__decorate([
    (0, common_1.Get)('links'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "getShareLinks", null);
__decorate([
    (0, common_1.Get)('links/:shareToken'),
    __param(0, (0, common_1.Param)('shareToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "getShareLinkByToken", null);
__decorate([
    (0, common_1.Put)('links/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sharing_dto_1.UpdateShareLinkDto, Object]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "updateShareLink", null);
__decorate([
    (0, common_1.Delete)('links/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "revokeShareLink", null);
__decorate([
    (0, common_1.Post)('access/:shareToken'),
    __param(0, (0, common_1.Param)('shareToken')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sharing_dto_1.AccessShareLinkDto, Object]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "accessSharedResource", null);
__decorate([
    (0, common_1.Get)('access/:shareToken/validate'),
    __param(0, (0, common_1.Param)('shareToken')),
    __param(1, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SharingController.prototype, "validateShareAccess", null);
exports.SharingController = SharingController = __decorate([
    (0, common_1.Controller)('sharing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sharing_service_1.SharingService])
], SharingController);
