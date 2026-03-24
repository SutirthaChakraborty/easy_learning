# Easy Learn — Design Guide

## Typography

- **Primary font:** Nunito (Google Fonts)
- **Dyslexia font:** OpenDyslexic
- **Base size:** 18px
- **Line height:** 1.8 (body), 1.1 (headings)
- **Max line length:** 70ch for body text

## Colour Palette

| Name | Hex | Usage |
|---|---|---|
| Primary | `#6c63ff` | Buttons, accents, links |
| Secondary | `#ff6584` | Highlights, badges |
| Accent | `#43e97b` | Success, XP bar |
| Warning | `#f7971e` | Streaks, alerts |
| Dark | `#1a1a2e` | Background |
| Mid | `#16213e` | Section backgrounds |

## Accessibility Standards

- WCAG 2.1 AA minimum
- Colour contrast ratio: 4.5:1 for body text, 3:1 for large text
- All interactive elements have visible focus styles
- All images have alt text
- All form fields have associated labels
- Keyboard navigable throughout

## Component Conventions

- Border radius: `8px` (small), `16px` (cards), `32px` (large), `9999px` (pills)
- Transitions: `0.3s ease` for hover states
- Cards lift `8px` on hover with subtle glow
- Buttons have `translateY(-3px)` hover effect
