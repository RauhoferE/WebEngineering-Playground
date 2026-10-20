// Empty in dev and Docker (same origin via proxy), absolute URL for the cross-origin test
export const apiBase = import.meta.env.VITE_API_URL ?? '';
