import { DomainEvent } from '@mensajeria/domain';

/**
 * Logging event handler.
 *
 * A simple consumer that logs every dispatched domain event to the console.
 * Useful for debugging and observability while proving events are flowing.
 */
export function loggingHandler(event: DomainEvent): void {
  console.log(
    `[EventBus] Event dispatched: ${event.eventName} at ${event.occurredAt.toISOString()}`,
    event,
  );
}
