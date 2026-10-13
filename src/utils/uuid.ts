// ==============================================================================
// AGROPULSE - GENERADOR DE UUID v4 (RFC 4122)
// Compatible con React Native, Web y Node.js para client_request_id
// ==============================================================================

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
