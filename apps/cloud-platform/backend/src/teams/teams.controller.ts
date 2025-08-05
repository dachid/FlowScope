import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, AddMemberDto, UpdateMemberRoleDto } from './dto/teams.dto';

@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  async createTeam(@Request() req: any, @Body() createTeamDto: CreateTeamDto) {
    // In a real implementation, this would extract user ID from JWT token
    const userId = req.user?.id || 'anonymous-user';
    return this.teamsService.createTeam(userId, createTeamDto);
  }

  @Get()
  async getUserTeams(@Request() req: any) {
    const userId = req.user?.id || 'anonymous-user';
    return this.teamsService.getUserTeams(userId);
  }

  @Get(':teamId')
  async getTeam(@Param('teamId') teamId: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous-user';
    return this.teamsService.getTeamById(teamId, userId);
  }

  @Post(':teamId/members')
  async addMember(
    @Param('teamId') teamId: string,
    @Request() req: any,
    @Body() addMemberDto: AddMemberDto,
  ) {
    const userId = req.user?.id || 'anonymous-user';
    return this.teamsService.addMember(teamId, userId, addMemberDto);
  }

  @Put(':teamId/members')
  async updateMemberRole(
    @Param('teamId') teamId: string,
    @Request() req: any,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const userId = req.user?.id || 'anonymous-user';
    return this.teamsService.updateMemberRole(teamId, userId, updateMemberRoleDto);
  }

  @Delete(':teamId/members/:memberId')
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'anonymous-user';
    return this.teamsService.removeMember(teamId, userId, memberId);
  }

  @Post(':teamId/leave')
  async leaveTeam(@Param('teamId') teamId: string, @Request() req: any) {
    const userId = req.user?.id || 'anonymous-user';
    return this.teamsService.leaveTeam(teamId, userId);
  }
}
