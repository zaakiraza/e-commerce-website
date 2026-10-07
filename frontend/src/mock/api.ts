/**
 * In-memory OpenAPI. One async function per operationId.
 * Seed enough rows that Home / lists / detail screens render data (not empty states).
 * Do not export helpers that are not OpenAPI operationIds — use src/data/ instead.
 */
export async function health(): Promise<{ ok: true }> {
  return { ok: true };
}
