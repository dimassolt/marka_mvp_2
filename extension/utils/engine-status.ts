const ICON_SIZES = [16, 32, 48, 96, 128] as const;

/** Toolbar icon paths: the ghost wears sunglasses only while the Engine is running. */
export function iconPathsFor(running: boolean): Record<number, string> {
  const folder = running ? 'active' : 'inactive';
  return Object.fromEntries(ICON_SIZES.map((size) => [size, `/icon/${folder}/${size}.png`]));
}

/**
 * Whether the Engine is running. The popup only reads it; nothing sets it yet.
 * Later the GET /health check will.
 */
export const engineRunning = storage.defineItem<boolean>('local:engineRunning', {
  fallback: false,
});
