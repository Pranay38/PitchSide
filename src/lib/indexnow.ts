export async function notifyIndexNow(urls: string[]) {
  const key = process.env.INDEXNOW_API_KEY;
  if (!key) {
    console.warn("INDEXNOW_API_KEY is not set. Skipping IndexNow notification.");
    return false;
  }

  const host = "www.thetouchlinedribble.in";
  const keyLocation = `https://${host}/api/indexnow`;

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList: urls,
      }),
    });

    if (!res.ok) {
      console.error(`IndexNow API error: ${res.status} ${res.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error notifying IndexNow:", error);
    return false;
  }
}
