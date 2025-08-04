import { SharingService } from './sharing.service';
import { CreateShareLinkDto, UpdateShareLinkDto, ShareLinkResponseDto, AccessShareLinkDto } from './dto/sharing.dto';
export declare class SharingController {
    private readonly sharingService;
    constructor(sharingService: SharingService);
    createShareLink(createShareLinkDto: CreateShareLinkDto, req: any): Promise<ShareLinkResponseDto>;
    getShareLinks(req: any): Promise<ShareLinkResponseDto[]>;
    getShareLinkByToken(shareToken: string): Promise<ShareLinkResponseDto>;
    updateShareLink(id: string, updateShareLinkDto: UpdateShareLinkDto, req: any): Promise<ShareLinkResponseDto>;
    revokeShareLink(id: string, req: any): Promise<void>;
    accessSharedResource(shareToken: string, accessDto: AccessShareLinkDto, req: any): Promise<any>;
    validateShareAccess(shareToken: string, action?: string): Promise<{
        hasAccess: boolean;
        permissions: any;
        resource?: any;
    }>;
}
