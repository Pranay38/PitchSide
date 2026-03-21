// Generates or retrieves a unique device ID from cookies to track anonymous interactions (likes, votes)
// without relying on localStorage, as per requirements.

export function getDeviceId(): string {
  if (typeof document === "undefined") return "server-side-uuid";

  const match = document.cookie.match(/(?:^|;\s*)deviceId=([^;]*)/);
  if (match && match[1]) {
    return match[1];
  }

  // Generate new UUID
  const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  
  // Set cookie for 1 year
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `deviceId=${uuid}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  
  return uuid;
}
