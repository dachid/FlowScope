import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { DebugService } from '../debug/debug.service';
import type { Session, TraceData } from '@flowscope/shared';

@Controller('sessions')
export class SessionsController {
  constructor(
    private sessionsService: SessionsService,
    private debugService: DebugService
  ) {}

  @Post()
  async createSession(@Body() createSessionDto: {
    name?: string;
    userId?: string;
    projectId?: string;
    metadata?: any;
  }): Promise<Session> {
    return this.sessionsService.createSession(createSessionDto);
  }

  @Get()
  async getAllSessions(@Query('userId') userId?: string): Promise<Session[]> {
    return this.sessionsService.getAllSessions(userId);
  }

  @Get(':id')
  async getSession(@Param('id') id: string): Promise<Session | null> {
    return this.sessionsService.getSession(id);
  }

  @Put(':id')
  async updateSession(
    @Param('id') id: string,
    @Body() updateSessionDto: Partial<Session>
  ): Promise<Session> {
    return this.sessionsService.updateSession(id, updateSessionDto);
  }

  @Delete(':id')
  async deleteSession(@Param('id') id: string): Promise<void> {
    return this.sessionsService.deleteSession(id);
  }

  @Get('debug/database-sessions')
  async getDatabaseSessions() {
    const sessions = await this.sessionsService.getAllSessions();
    
    const sessionGroups: { [name: string]: Session[] } = {};
    sessions.forEach(session => {
      const name = session.name || 'Unnamed';
      if (!sessionGroups[name]) {
        sessionGroups[name] = [];
      }
      sessionGroups[name].push(session);
    });

    return {
      total: sessions.length,
      groups: sessionGroups,
      duplicates: Object.entries(sessionGroups).filter(([_, sessions]) => sessions.length > 1)
    };
  }

  @Post('debug/cleanup-duplicates')
  async cleanupDuplicateSessions() {
    const sessions = await this.sessionsService.getAllSessions();
    
    const sessionGroups: { [name: string]: Session[] } = {};
    sessions.forEach(session => {
      const name = session.name || 'Unnamed';
      if (!sessionGroups[name]) {
        sessionGroups[name] = [];
      }
      sessionGroups[name].push(session);
    });

    let deleted = 0;
    for (const [name, sessionList] of Object.entries(sessionGroups)) {
      if (sessionList.length > 1) {
        // Keep the newest session, delete the rest
        const sorted = sessionList.sort((a, b) => b.startTime - a.startTime);
        const toDelete = sorted.slice(1); // Remove first (newest), keep rest for deletion
        
        for (const session of toDelete) {
          await this.sessionsService.deleteSession(session.id);
          deleted++;
          console.log(`🗑️ Deleted duplicate session: ${session.name} (${session.id})`);
        }
      }
    }

    return { deleted, remaining: sessions.length - deleted };
  }

  // Trace endpoints
  @Post(':id/traces')
  async addTrace(
    @Param('id') sessionId: string,
    @Body() trace: Omit<TraceData, 'id'>
  ): Promise<TraceData> {
    return this.sessionsService.addTrace(sessionId, trace);
  }

  @Post(':id/traces/bulk')
  async addMultipleTraces(
    @Param('id') sessionId: string,
    @Body() traces: Omit<TraceData, 'id'>[]
  ): Promise<TraceData[]> {
    return this.sessionsService.addMultipleTraces(sessionId, traces);
  }

  @Get(':id/traces')
  async getSessionTraces(@Param('id') sessionId: string): Promise<TraceData[]> {
    return this.sessionsService.getSessionTraces(sessionId);
  }
}
