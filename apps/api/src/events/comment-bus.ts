import { EventEmitter } from 'node:events';
import type { CommentEvent } from '../repositories/comment-event-repository.js';

const SHUTDOWN = 'shutdown';
// Prefixed, so no bear id can collide with "shutdown" (or EventEmitter's special "error")
const channel = (bearId: string): string => `bear:${bearId}`;

// In-process only: every API instance has its own bus (see the theory question)
export class CommentBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // One listener per open stream; the default limit of 10 prints MaxListenersExceededWarning
    this.emitter.setMaxListeners(0);
  }

  // Call only after COMMIT. Listeners run synchronously and must not throw
  publish(event: CommentEvent): void {
    this.emitter.emit(channel(event.bearId), event);
  }

  // Returns the unsubscribe function
  subscribe(
    bearId: string,
    listener: (event: CommentEvent) => void
  ): () => void {
    const name = channel(bearId);
    this.emitter.on(name, listener);
    return () => {
      this.emitter.off(name, listener);
    };
  }

  // Open streams register here, so app.close() can end them (preClose hook in app.ts)
  onShutdown(listener: () => void): () => void {
    this.emitter.on(SHUTDOWN, listener);
    return () => {
      this.emitter.off(SHUTDOWN, listener);
    };
  }

  shutdown(): void {
    this.emitter.emit(SHUTDOWN);
  }
}
