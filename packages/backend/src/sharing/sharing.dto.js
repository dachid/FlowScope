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
exports.AccessSharedResourceDto = exports.ShareLinkResponseDto = exports.AccessShareLinkDto = exports.UpdateShareLinkDto = exports.CreateShareLinkDto = exports.ShareableResourceType = exports.SharePermission = void 0;
const class_validator_1 = require("class-validator");
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["COMMENT"] = "COMMENT";
    SharePermission["EDIT"] = "EDIT";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
var ShareableResourceType;
(function (ShareableResourceType) {
    ShareableResourceType["TRACE"] = "TRACE";
    ShareableResourceType["SESSION"] = "SESSION";
    ShareableResourceType["PROJECT"] = "PROJECT";
    ShareableResourceType["PROMPT"] = "PROMPT";
})(ShareableResourceType || (exports.ShareableResourceType = ShareableResourceType = {}));
class CreateShareLinkDto {
}
exports.CreateShareLinkDto = CreateShareLinkDto;
__decorate([
    (0, class_validator_1.IsEnum)(ShareableResourceType),
    __metadata("design:type", String)
], CreateShareLinkDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateShareLinkDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SharePermission),
    __metadata("design:type", String)
], CreateShareLinkDto.prototype, "permission", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateShareLinkDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateShareLinkDto.prototype, "password", void 0);
class UpdateShareLinkDto {
}
exports.UpdateShareLinkDto = UpdateShareLinkDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SharePermission),
    __metadata("design:type", String)
], UpdateShareLinkDto.prototype, "permission", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], UpdateShareLinkDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateShareLinkDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateShareLinkDto.prototype, "isActive", void 0);
class AccessShareLinkDto {
}
exports.AccessShareLinkDto = AccessShareLinkDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccessShareLinkDto.prototype, "password", void 0);
class ShareLinkResponseDto {
}
exports.ShareLinkResponseDto = ShareLinkResponseDto;
class AccessSharedResourceDto {
}
exports.AccessSharedResourceDto = AccessSharedResourceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccessSharedResourceDto.prototype, "password", void 0);
