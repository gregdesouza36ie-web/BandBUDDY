
## External metadata notes

- `https://noembed.com/embed?url=...` returns provider-neutral title, author, and thumbnail metadata for supported video links; it does not reliably expose duration or musical key.
- `https://www.youtube.com/iframe_api` is used client-side to attempt duration lookup for YouTube links. Duration can remain unavailable when the player cannot load.
- The source-key field stays pending rather than inventing a key from title metadata; a trustworthy key requires audio analysis of the actual media.
