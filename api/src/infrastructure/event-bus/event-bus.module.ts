import { Module, Global, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { EventBus } from '@mensajeria/domain';
import { InMemoryEventBus } from './in-memory-event-bus';
import { loggingHandler } from './handlers/logging-handler';
import { WebSocketHandler } from './handlers/websocket-handler';
import { MessagingModule } from '../../presentation/messaging/messaging.module';

@Global()
@Module({
  imports: [forwardRef(() => MessagingModule)],
  providers: [
    {
      provide: 'EventBus',
      useFactory: () => new InMemoryEventBus(),
    },
    WebSocketHandler,
  ],
  exports: ['EventBus'],
})
export class EventBusModule implements OnModuleInit {
  constructor(
    @Inject('EventBus') private readonly eventBus: EventBus,
    private readonly webSocketHandler: WebSocketHandler,
  ) {}

  onModuleInit(): void {
    // Subscribe logging — every event gets logged to console
    this.eventBus.subscribe(loggingHandler);

    // Subscribe WebSocket bridge — forwards domain events to real-time clients
    this.eventBus.subscribe((event) => this.webSocketHandler.handle(event));
  }
}
