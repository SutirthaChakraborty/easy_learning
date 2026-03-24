# Video Assets

Place your looping background video files here.

## Required Files

| File | Theme | Notes |
| --- | --- | --- |
| `space-loop.webm` | 🚀 Space | Stars, nebulae, galaxies |
| `space-loop.mp4` | 🚀 Space | Safari fallback |
| `ocean-loop.webm` | 🌊 Ocean | Underwater, bubbles, fish |
| `ocean-loop.mp4` | 🌊 Ocean | Safari fallback |
| `forest-loop.webm` | 🌳 Forest | Trees, leaves, light rays |
| `forest-loop.mp4` | 🌳 Forest | Safari fallback |

## Poster Images (shown before video loads)

| File | Purpose |
| --- | --- |
| `poster-space.jpg` | Space theme placeholder |
| `poster-ocean.jpg` | Ocean theme placeholder |
| `poster-forest.jpg` | Forest theme placeholder |

## Guidelines

- **Format:** WebM (VP9) preferred — smaller file size, better quality
- **Max size:** < 5MB per file (compress with HandBrake or FFmpeg)
- **Duration:** 10–30 second seamless loop
- **Resolution:** 1920×1080 minimum
- **Audio:** Remove audio track — videos are always muted
- **License:** Must be royalty-free for commercial use

## Free Sources

- [Pixabay](https://pixabay.com/videos/) — CC0 license
- [Pexels](https://www.pexels.com/videos/) — Free commercial use
- [Mixkit](https://mixkit.co/free-stock-video/) — Free license

## FFmpeg Compression Command

```bash
# Convert MP4 to compressed WebM
ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 1M -an output.webm

# Remove audio and compress MP4
ffmpeg -i input.mp4 -an -c:v libx264 -crf 28 -preset slow output.mp4
```
