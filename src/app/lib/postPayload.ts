/** Keep JSON below the hosting platform's request limit, including base64 images. */
export const MAX_POST_BODY_BYTES = 3 * 1024 * 1024;
const IMAGE_DATA_URL = /data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+/g;
const bodyBytes = (body: string) => new TextEncoder().encode(body).length;

async function resizeImage(src: string, width: number, quality: number): Promise<string> {
    // Preserve animated GIFs rather than silently flattening them.
    if (src.startsWith("data:image/gif;")) return src;
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            try {
                const scale = Math.min(1, width / Math.max(image.width, image.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(src);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                const compressed = canvas.toDataURL("image/webp", quality);
                resolve(compressed.startsWith("data:image/") && compressed.length < src.length ? compressed : src);
            } catch { resolve(src); }
        };
        image.onerror = () => resolve(src);
        image.src = src;
    });
}

export async function serializePostPayload(
    payload: unknown,
    optimize: typeof resizeImage = resizeImage,
): Promise<string> {
    let body = JSON.stringify(payload);
    if (bodyBytes(body) <= MAX_POST_BODY_BYTES) return body;
    for (const [width, quality] of [[1600, 0.82], [1200, 0.68], [900, 0.55]]) {
        const images = [...new Set(body.match(IMAGE_DATA_URL) || [])];
        for (const image of images) {
            const smaller = await optimize(image, width, quality);
            if (smaller.length < image.length) body = body.split(image).join(smaller);
        }
        if (bodyBytes(body) <= MAX_POST_BODY_BYTES) return body;
    }
    throw new Error("This post is still too large to save after image optimization. Remove some uploaded images or use hosted image URLs, then try again. Your editor content has been kept.");
}
