export type VideoMetadata = {
  title: string | null;
  artist: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  sourceKey: string | null;
  keyStatus: "pending" | "detected" | "unavailable";
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Uses the provider's oEmbed surface for title/artist/thumbnail metadata.
 * Duration and musical key are intentionally returned as nullable because
 * generic oEmbed does not expose them consistently across video providers.
 */
export async function inspectVideoUrl(videoUrl: string): Promise<VideoMetadata> {
  if (!isHttpUrl(videoUrl)) throw new Error("A full http(s) video URL is required");

  const endpoint = new URL("https://noembed.com/embed");
  endpoint.searchParams.set("url", videoUrl);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Video metadata provider returned ${response.status}`);

  const payload = await response.json() as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };
  const title = typeof payload.title === "string" ? payload.title.trim() : null;
  const artist = typeof payload.author_name === "string" ? payload.author_name.trim() : null;

  return {
    title,
    artist,
    thumbnailUrl: typeof payload.thumbnail_url === "string" ? payload.thumbnail_url : null,
    durationSeconds: null,
    sourceKey: null,
    keyStatus: "pending",
  };
}
