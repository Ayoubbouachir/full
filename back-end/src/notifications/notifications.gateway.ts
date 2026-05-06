import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log('Notification Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Notification Client disconnected:', client.id);
    // Find and remove from map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() userId: any,
    @ConnectedSocket() client: Socket,
  ) {
    const uId = String(userId);
    console.log(
      `User ${uId} registered for notifications with socket ${client.id}`,
    );
    this.userSockets.set(uId, client.id);
  }

  sendNotification(userId: any, notification: any) {
    const uId = String(userId);
    const socketId = this.userSockets.get(uId);
    if (socketId) {
      console.log(`Sending real-time notification to user ${uId}`);
      this.server.to(socketId).emit('newNotification', notification);
    } else {
      console.log(
        `User ${uId} not connected via socket. Notification saved in DB only.`,
      );
    }
  }

  broadcastNotification(notification: any) {
    this.server.emit('newNotification', notification);
  }
}
