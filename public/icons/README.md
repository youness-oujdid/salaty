# App Icons

Place your PWA icons here:

- `icon-192x192.png` — Android home screen icon
- `icon-512x512.png` — Android splash screen / PWA install

You can generate these from the favicon.svg using:
- https://realfavicongenerator.net
- https://maskable.app (for maskable icons)

Or with ImageMagick:
```bash
convert -background '#0D1527' -fill '#C9A84C' favicon.svg -resize 192x192 icon-192x192.png
convert -background '#0D1527' -fill '#C9A84C' favicon.svg -resize 512x512 icon-512x512.png
```
