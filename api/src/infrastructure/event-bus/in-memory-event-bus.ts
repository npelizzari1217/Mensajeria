import { EventBus, EventHandler, DomainEvent } from '@mensajeria/domain';

/**
 * Synchronous in-memory EventBus implementation.
 *
 * Handlers are called synchronously in registration order when an event
 * is published. Errors in handlers are caught and logged — they never
 * propagate to the caller.
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers: Set<EventHandler> = new Set();

  subscribe(handler: EventHandler): void {
    this.handlers.add(handler);
  }

  publish(event: DomainEvent): void {
    for (const handler of this.handlers) {
      try {
        const result = handler(event);
        // Handle async handlers — catch promise rejections
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`[EventBus] Handler error for ${event.eventName}:`, error);
          });
        }
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event.eventName}:`, error);
      }
    }
  }
}
