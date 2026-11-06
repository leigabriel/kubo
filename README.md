# Kubo

Kubo is a creative digital space for discovering, organizing, and exploring digital assets through a simple, immersive experience.

The home page leads with a single massive bottom-anchored wordmark in the Gravelands typeface, set against pure black with a pixel-monospace header — letting the typography carry the entire identity.

![Kubo](public/favicon.png)

## Features

- Edge-to-edge hero wordmark that fills the full width of the section at any viewport size
- Consistent edge margins across desktop, tablet, and mobile
- Pixel-monospace `Geist Pixel` navigation with keyboard-focus states and touch-sized targets
- Custom `Gravelands` display typeface and `Geist Pixel` monospace for a distinctive dual-voice system
- Dark-only design with inverted selection styling
- Fully responsive from small phones to widescreen displays, with `prefers-reduced-motion` support

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 with Turbopack |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript |
| Data | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Storage | Amazon S3 (`@aws-sdk/client-s3`) |
| 3D | Model Viewer, glTF Transform, Draco, Meshoptimizer |

## Project Structure

```
src/
  app/
    layout.tsx        Root layout with metadata and favicon
    page.tsx          Home page composition
  components/
    layout/
      SiteHeader.tsx  Asterisk brand mark and primary navigation
    sections/
      HomeHero.tsx    Bottom-anchored KUBO wordmark
  styles/
    globals.css       Global reset and dark theme tokens
    fonts.css         Gravelands and Geist Pixel @font-face
    home.css          Home layout, header, and hero styling
public/
  favicon.png         Diagonal-arrow favicon
  fonts/              Gravelands and Geist Pixel typefaces
```

## Design System

- **Palette:** pure black `#000000` background with off-white `#f7f7f7` text
- **Display type:** Gravelands, stretched to fill the container width
- **Interface type:** Geist Pixel monospace for navigation
- **Layout:** header pinned to the top with a large void above the bottom-anchored hero
- **Motion:** subtle hover fades and a global reduced-motion override

## License

This project is licensed under the [MIT License](LICENSE).
