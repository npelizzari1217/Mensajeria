import { DomainEvent } from './events/domain-event';

/**
 * Handler function for domain events.
 * Can be synchronous or asynchronous — errors are caught by the bus.
 */
export type EventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * EventBus port.
 *
 * Domain services and use cases depend on this interface.
 * Infrastructure provides the implementation (in-memory, Kafka, etc.).
 */
export interface EventBus {
  /** Publish a domain event to all registered handlers. */
  publish(event: DomainEvent): void;

  /** Register a handler that receives all published events. */
  subscribe(handler: EventHandler): void;
}
