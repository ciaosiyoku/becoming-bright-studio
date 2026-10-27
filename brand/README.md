# Brand: Becoming Bright Studio

**Theme line:** *Every day a little brighter.*

**The mark:** a sunrise. A night-blue sky warms into dawn, the sun rises over a green hill, and a young sprout opens
two leaves in front of it. The idea: learning is not a switch but a sunrise. It grows a little every day, from dark
to bright. The coral leaf is the child and the teal leaf is the parent, the same colours as in the app. The sprout
is also the seedling of the learning garden, which grows into a tree as a skill becomes known.

| File | Use |
|---|---|
| `icon.svg`, `png/icon-*.png` | App icon with rounded corners (README, social posts, 192/512 in the web app manifest) |
| `icon-maskable.svg`, `png/icon-maskable-*.png` | Android "maskable" icon. The artwork sits inside the safe zone, so Android can crop it to a circle or squircle |
| `icon-square.svg`, `png/apple-touch-icon-*.png` | iPad/iPhone home screen. iOS rounds the corners itself, so this one is square |
| `favicon.ico` | Browser tab (16, 32 and 48 px) |
| `mark.svg`, `png/mark.png` | Sun, hill and sprout in a circle, without a background |
| `wordmark-light.svg` / `wordmark-dark.svg` | Mark with the name on two lines, for light or dark backgrounds |
| `wordmark-line-light.svg` / `wordmark-line-dark.svg` | Mark with the name on one line |

All of these are drawn by `scripts/make-brand.mjs`, so change the logo there and run it again (it explains how).

## Colours

| Name | Hex | Role |
|---|---|---|
| Night | `#1B2540` (sky gradient `#1E2850` → `#4A3F86` → `#C9628A` → `#FFB36B`) | Icon sky, text |
| Sun | `#FFD15C` (gradient `#FFF4C7` → `#F29A2E`) | Brightness, rewards |
| Bright (light / dark backgrounds) | `#E08A1E` / `#F8C24A` | The word "Bright" in the wordmark |
| Hill | `#46C07F` → `#1D7A50` | Growth |
| Coral | `#E2557E` | The child |
| Teal | `#178C84` | The parent |

## Type

The wordmark is set in **Fredoka SemiBold**, converted to outlines, so the font doesn't need to be installed.
Fredoka is licensed under the SIL Open Font License (`FREDOKA-OFL.txt`).

## Rules

- Keep clear space around the mark of at least the sun's radius.
- Don't stretch, recolour or rotate the mark, and don't add a real child's photo or name to it.
- The artwork is original and released with the code under the MIT licence.

## In the app

`npm run dev` and `npm run build` copy the app icons from here into `public/icons/` (`scripts/copy-brand.mjs`),
so this folder is the only place to change the logo. `public/icons/` is not committed.
