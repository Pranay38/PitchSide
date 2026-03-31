export function getGuestId(): string {
  // localStorage is not available during SSR
  if (typeof window === "undefined") return "guest_ssr";

  const KEY = "pitchside_guest_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getGuestUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pitchside_guest_username");
}

export function setGuestUsername(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("pitchside_guest_username", username);
}
