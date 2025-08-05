import { PrismaService } from '../database/prisma.service';
import { Injectable } from '@nestjs/common';

interface SessionGroup {
  [key: string]: any[];
}

@Injectable()
export class DebugService {
  constructor(private prisma: PrismaService) {}

  async getDatabaseSessions() {
    const sessions = await this.prisma.session.findMany({
      select: {
        id: true,
        name: true,
        startTime: true,
        status: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    const sessionGroups: SessionGroup = {};
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
      sessions: sessions
    };
  }

  async cleanupDuplicateSessions() {
    const sessions = await this.prisma.session.findMany({
      orderBy: {
        startTime: 'asc'
      }
    });

    const sessionGroups: SessionGroup = {};
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
        const sorted = sessionList.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        const toDelete = sorted.slice(1); // Remove first (newest), keep rest for deletion
        
        for (const session of toDelete) {
          await this.prisma.session.delete({
            where: { id: session.id }
          });
          deleted++;
          console.log(`🗑️ Deleted duplicate session: ${session.name} (${session.id})`);
        }
      }
    }

    return { deleted, remaining: sessions.length - deleted };
  }
}
