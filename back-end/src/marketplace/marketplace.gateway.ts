import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/marketplace',
})
export class MarketplaceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query?.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);
    }
    console.log(
      '[MarketplaceGateway] Client connected:',
      client.id,
      'userId:',
      userId,
    );
  }

  handleDisconnect(client: Socket) {
    for (const [uid, sid] of this.userSockets) {
      if (sid === client.id) {
        this.userSockets.delete(uid);
        break;
      }
    }
    console.log('[MarketplaceGateway] Client disconnected:', client.id);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitNewOffer(engineerId: string, offer: any) {
    this.emitToUser(engineerId, 'new_offer', offer);
  }

  emitNewMessage(userId: string, message: any) {
    this.emitToUser(userId, 'new_message', message);
  }

  emitStatusChange(requestId: string, status: string, userIds: string[]) {
    userIds.forEach((uid) =>
      this.emitToUser(uid, 'status_change', { requestId, status }),
    );
  }

  emitNotification(userId: string, notification: any) {
    this.emitToUser(userId, 'notification', notification);
  }

  @SubscribeMessage('subscribe_request')
  handleSubscribeRequest(
    @MessageBody() data: { requestId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.requestId) client.join(`request:${data.requestId}`);
  }
}
