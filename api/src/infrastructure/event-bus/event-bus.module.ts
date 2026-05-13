import { Module, Global } from '@nestjs/common';
import { InMemoryEventBus } from './in-memory-event-bus';
import { loggingHandler } from './handlers/logging-handler';

@Global()
@Module({
  providers: [
    {
      provide: 'EventBus',
      useFactory: () => {
        const bus = new InMemoryEventBus();
        bus.subscribe(loggingHandler);
        return bus;
      },
    },
  ],
  exports: ['EventBus'],
})
export class EventBusModule {}
