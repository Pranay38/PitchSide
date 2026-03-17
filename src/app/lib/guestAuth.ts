export function getGuestId(): string {
  const KEY = "pitchside_guest_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getGuestUsername(): string | null {
  return localStorage.getItem("pitchside_guest_username");
}

export function setGuestUsername(username: string): void {
  localStorage.setItem("pitchside_guest_username", username);
}
