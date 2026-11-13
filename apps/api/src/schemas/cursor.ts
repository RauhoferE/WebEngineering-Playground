import { z } from 'zod';

const CursorKey = z.object({ createdAt: z.iso.datetime(), id: z.uuid() });
export type CursorKey = z.infer<typeof CursorKey>;

export function encodeCursor(key: CursorKey): string {
  // Pick the two fields explicitly so a whole Comment never ends up in the cursor
  const json = JSON.stringify({ createdAt: key.createdAt, id: key.id });
  return Buffer.from(json).toString('base64url');
}

export function decodeCursor(cursor: string): CursorKey | null {
  try {
    const json: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8')
    );
    const result = CursorKey.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
