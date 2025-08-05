import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { Session, TraceData, SessionStatus, TraceStatus, TraceEventType } from '@flowscope/shared';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async createSession(data: {
    name?: string;
    userId?: string;
    projectId?: string;
    metadata?: any;
  }): Promise<Session> {
    const session = await this.prisma.session.create({
      data: {
        name: data.name,
        userId: data.userId,
        projectId: data.projectId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        status: 'active',
      },
    });

    return {
      id: session.id,
      name: session.name || undefined,
      startTime: session.startTime.getTime(),
      endTime: session.endTime?.getTime(),
      status: session.status as SessionStatus,
      metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
      traces: [], // Empty traces array for new session
    };
  }

  async getAllSessions(userId?: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: userId ? { userId } : {},
      orderBy: { startTime: 'desc' },
    });

    // Get traces for each session
    const sessionsWithTraces = await Promise.all(
      sessions.map(async (session) => {
        const traces = await this.getSessionTraces(session.id);
        return {
          id: session.id,
          name: session.name || undefined,
          startTime: session.startTime.getTime(),
          endTime: session.endTime?.getTime(),
          status: session.status as SessionStatus,
          metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
          traces,
        };
      })
    );

    return sessionsWithTraces;
  }

  async getSession(id: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) return null;

    const traces = await this.getSessionTraces(id);

    return {
      id: session.id,
      name: session.name || undefined,
      startTime: session.startTime.getTime(),
      endTime: session.endTime?.getTime(),
      status: session.status as SessionStatus,
      metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
      traces,
    };
  }

  async updateSession(id: string, data: Partial<Session>): Promise<Session> {
    const session = await this.prisma.session.update({
      where: { id },
      data: {
        name: data.name,
        status: data.status,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    const traces = await this.getSessionTraces(id);

    return {
      id: session.id,
      name: session.name || undefined,
      startTime: session.startTime.getTime(),
      endTime: session.endTime?.getTime(),
      status: session.status as SessionStatus,
      metadata: session.metadata ? JSON.parse(session.metadata) : undefined,
      traces,
    };
  }

  async deleteSession(id: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id },
    });
  }

  // Trace data management
  async addTrace(sessionId: string, trace: Omit<TraceData, 'id'>): Promise<TraceData> {
    const traceData = await this.prisma.traceData.create({
      data: {
        sessionId,
        operation: trace.type || 'unknown',
        language: 'javascript',
        framework: 'unknown',
        data: trace.data as any, // Cast to any to handle unknown JSON
        metadata: trace.metadata as any, // Cast to any to handle unknown JSON
        parentId: trace.parentId,
        duration: trace.duration,
        status: trace.status || 'pending',
        timestamp: trace.timestamp ? new Date(trace.timestamp) : new Date(),
        startTime: trace.timestamp ? new Date(trace.timestamp) : new Date(),
        endTime: trace.duration 
          ? new Date((trace.timestamp || Date.now()) + trace.duration)
          : undefined,
      },
    });

    return {
      id: traceData.id,
      sessionId: traceData.sessionId,
      chainId: traceData.operation, // Map operation to chainId for backward compatibility
      timestamp: traceData.timestamp.getTime(),
      type: traceData.operation as TraceEventType,
      data: traceData.data,
      metadata: traceData.metadata as Record<string, unknown> | undefined,
      parentId: traceData.parentId || undefined,
      duration: traceData.duration || undefined,
      status: traceData.status as TraceStatus,
    };
  }

  async getSessionTraces(sessionId: string): Promise<TraceData[]> {
    const traces = await this.prisma.traceData.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return traces.map(trace => ({
      id: trace.id,
      sessionId: trace.sessionId,
      chainId: trace.operation, // Map operation to chainId for backward compatibility
      timestamp: trace.timestamp.getTime(),
      type: trace.operation as TraceEventType,
      data: trace.data,
      metadata: trace.metadata as Record<string, unknown> | undefined,
      parentId: trace.parentId || undefined,
      duration: trace.duration || undefined,
      status: trace.status as TraceStatus,
    }));
  }

  async addMultipleTraces(sessionId: string, traces: Omit<TraceData, 'id'>[]): Promise<TraceData[]> {
    const createdTraces = await Promise.all(
      traces.map(trace => this.addTrace(sessionId, trace))
    );
    return createdTraces;
  }
}
