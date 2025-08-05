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
exports.CollaborationController = void 0;
const common_1 = require("@nestjs/common");
const collaboration_service_1 = require("./collaboration.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const collaboration_dto_1 = require("./collaboration.dto");
let CollaborationController = class CollaborationController {
    constructor(collaborationService) {
        this.collaborationService = collaborationService;
    }
    // Comments endpoints
    async createComment(createCommentDto, req) {
        return this.collaborationService.createComment(createCommentDto, req.user.id);
    }
    async getComments(resourceType, resourceId) {
        return this.collaborationService.getComments(resourceType, resourceId);
    }
    async updateComment(id, updateCommentDto, req) {
        return this.collaborationService.updateComment(id, updateCommentDto, req.user.id);
    }
    async deleteComment(id, req) {
        return this.collaborationService.deleteComment(id, req.user.id);
    }
    async resolveComment(id, req) {
        return this.collaborationService.resolveComment(id, req.user.id);
    }
    // Annotations endpoints
    async createAnnotation(createAnnotationDto, req) {
        return this.collaborationService.createAnnotation(createAnnotationDto, req.user.id);
    }
    async getAnnotations(resourceType, resourceId) {
        return this.collaborationService.getAnnotations(resourceType, resourceId);
    }
    async updateAnnotation(id, updateAnnotationDto, req) {
        return this.collaborationService.updateAnnotation(id, updateAnnotationDto, req.user.id);
    }
    async deleteAnnotation(id, req) {
        return this.collaborationService.deleteAnnotation(id, req.user.id);
    }
    // Presence endpoints
    async updatePresence(presenceUpdateDto, req) {
        return this.collaborationService.updatePresence(presenceUpdateDto, req.user.id);
    }
    async getPresence(resourceType, resourceId) {
        return this.collaborationService.getPresence(resourceType, resourceId);
    }
};
exports.CollaborationController = CollaborationController;
__decorate([
    (0, common_1.Post)('comments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [collaboration_dto_1.CreateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "createComment", null);
__decorate([
    (0, common_1.Get)('comments'),
    __param(0, (0, common_1.Query)('resourceType')),
    __param(1, (0, common_1.Query)('resourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "getComments", null);
__decorate([
    (0, common_1.Put)('comments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collaboration_dto_1.UpdateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "updateComment", null);
__decorate([
    (0, common_1.Delete)('comments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Put)('comments/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "resolveComment", null);
__decorate([
    (0, common_1.Post)('annotations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [collaboration_dto_1.CreateAnnotationDto, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "createAnnotation", null);
__decorate([
    (0, common_1.Get)('annotations'),
    __param(0, (0, common_1.Query)('resourceType')),
    __param(1, (0, common_1.Query)('resourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "getAnnotations", null);
__decorate([
    (0, common_1.Put)('annotations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collaboration_dto_1.UpdateAnnotationDto, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "updateAnnotation", null);
__decorate([
    (0, common_1.Delete)('annotations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "deleteAnnotation", null);
__decorate([
    (0, common_1.Post)('presence'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [collaboration_dto_1.PresenceUpdateDto, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "updatePresence", null);
__decorate([
    (0, common_1.Get)('presence'),
    __param(0, (0, common_1.Query)('resourceType')),
    __param(1, (0, common_1.Query)('resourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "getPresence", null);
exports.CollaborationController = CollaborationController = __decorate([
    (0, common_1.Controller)('collaboration'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [collaboration_service_1.CollaborationService])
], CollaborationController);
