import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, type Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

/** Socket after JWT handshake in `handleConnection` */
type ChatSocket = Socket & { userId?: number };

@WebSocketGateway({
  cors: { origin: ['http://localhost:3000', 'http://localhost:3002'] },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: any) {
    try {
      const token = client.handshake?.auth?.token || client.handshake?.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      const userId = payload.sub || payload.userId;
      if (!userId) {
        client.disconnect();
        return;
      }
      client.userId = userId;
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: ChatSocket) {
    if (client.userId) {
      const set = this.userSockets.get(client.userId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) this.userSockets.delete(client.userId);
      }
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: ChatSocket,
  ) {
    if (!client.userId) return;
    client.join(`room_${data.roomId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { roomId: number; message: string },
    @ConnectedSocket() client: ChatSocket,
  ) {
    if (!client.userId || !data.roomId || !data.message?.trim()) return;
    try {
      const msg = await this.chatService.createMessage(
        data.roomId,
        client.userId,
        data.message.trim(),
      );
      const payload = {
        id: msg.id,
        roomId: msg.roomId,
        senderId: msg.senderId,
        message: msg.message,
        createdAt: msg.createdAt,
        sender: msg.sender
          ? { id: msg.sender.id, fullName: msg.sender.fullName }
          : null,
      };
      this.server.to(`room_${data.roomId}`).emit('new_message', payload);
      return payload;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      return { error: msg };
    }
  }
}
