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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceResponseDto = exports.PresenceUpdateDto = exports.AnnotationResponseDto = exports.CommentResponseDto = exports.UpdateAnnotationDto = exports.CreateAnnotationDto = exports.UpdateCommentDto = exports.CreateCommentDto = exports.AnnotationType = void 0;
const class_validator_1 = require("class-validator");
var AnnotationType;
(function (AnnotationType) {
    AnnotationType["NOTE"] = "NOTE";
    AnnotationType["HIGHLIGHT"] = "HIGHLIGHT";
    AnnotationType["BOOKMARK"] = "BOOKMARK";
    AnnotationType["ISSUE"] = "ISSUE";
})(AnnotationType || (exports.AnnotationType = AnnotationType = {}));
class CreateCommentDto {
}
exports.CreateCommentDto = CreateCommentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "parentId", void 0);
class UpdateCommentDto {
}
exports.UpdateCommentDto = UpdateCommentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCommentDto.prototype, "content", void 0);
class CreateAnnotationDto {
}
exports.CreateAnnotationDto = CreateAnnotationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnnotationDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnnotationDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnnotationDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAnnotationDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AnnotationType),
    __metadata("design:type", String)
], CreateAnnotationDto.prototype, "type", void 0);
class UpdateAnnotationDto {
}
exports.UpdateAnnotationDto = UpdateAnnotationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAnnotationDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateAnnotationDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AnnotationType),
    __metadata("design:type", String)
], UpdateAnnotationDto.prototype, "type", void 0);
class CommentResponseDto {
}
exports.CommentResponseDto = CommentResponseDto;
class AnnotationResponseDto {
}
exports.AnnotationResponseDto = AnnotationResponseDto;
class PresenceUpdateDto {
}
exports.PresenceUpdateDto = PresenceUpdateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresenceUpdateDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresenceUpdateDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresenceUpdateDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PresenceUpdateDto.prototype, "cursor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PresenceUpdateDto.prototype, "selection", void 0);
class PresenceResponseDto {
}
exports.PresenceResponseDto = PresenceResponseDto;
