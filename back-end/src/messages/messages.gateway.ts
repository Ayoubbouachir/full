import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received sendMessage:', createMessageDto);
    const message = await this.messagesService.create(createMessageDto);
    console.log('Saved message, emitting receiveMessage:', message);

    // Emit to the receiver if they are connected (for simplicity we broadcast or emit to all for now)
    // In a real app index sockets by user ID
    this.server.emit('receiveMessage', message);
    return message;
  }

  @SubscribeMessage('getChatHistory')
  async handleGetChatHistory(
    @MessageBody() data: { user1: string; user2: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received getChatHistory:', data);
    const history = await this.messagesService.findChatHistory(
      data.user1,
      data.user2,
    );
    console.log('Sending chatHistory, count:', history.length);
    client.emit('chatHistory', history);
  }
}
