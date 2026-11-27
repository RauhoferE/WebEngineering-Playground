import type {
  CommentEvent,
  CommentEventInput,
  CommentEventRepository,
} from '../comment-event-repository.js';

export class MemoryCommentEventRepository implements CommentEventRepository {
  // Per bear, in seq order: seq = position + 1
  private readonly events = new Map<string, CommentEvent[]>();

  async append(
    bearId: string,
    event: CommentEventInput
  ): Promise<CommentEvent> {
    const list = this.events.get(bearId) ?? [];
    const stored: CommentEvent = { ...event, bearId, seq: list.length + 1 };
    list.push(stored);
    this.events.set(bearId, list);
    return stored;
  }

  async since(bearId: string, afterSeq: number): Promise<CommentEvent[]> {
    return (this.events.get(bearId) ?? []).filter((e) => e.seq > afterSeq);
  }

  async currentSeq(bearId: string): Promise<number> {
    return this.events.get(bearId)?.length ?? 0;
  }
}
