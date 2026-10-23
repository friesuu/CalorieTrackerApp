# Haze design system — light and dark

A general visual design system for restyling any app.

**Reference images:** `design/haze-light.png` and `design/haze-dark.png` show one example screen in each theme. Copy the **visual style** from them: colours, type, spacing, shapes, borders and shadows. Do **not** copy the example's content, features or exact layout. Apply the style to this app's own screens.

---

## 1. Ground rules

- **Restyle only.** Keep every feature, route, API call, state and data flow exactly as it is. Change markup structure only where the layout needs it.
- **Map, don't invent.** Map every existing UI element to the closest component in section 9. Don't add components or features the app doesn't already have, except those in section 2. If something has no good match, flag it instead of guessing.
- **Tokens only.** All colours, fonts, radii, spacing and shadows live in one place (CSS custom properties, the Tailwind theme, or the framework's theme object). Components never contain raw hex values.
- **Consistency.** The same kind of element looks the same on every screen.
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48 px only.
- **Accessibility:**
  - Every clickable element is a real `<button>` or `<a>` (or the framework's equivalent), at least 44px tall.
  - Icon-only buttons have an accessible label.
  - Visible focus ring: 2px outline in `--accent`, 2px offset.
  - Text contrast at least 4.5:1 in both themes.
  - Never use colour alone to carry meaning.
- **Responsive:** mobile is a first-class layout. Must work from 360px wide upward (section 10). The page itself never scrolls sideways.
- **Icons:** keep the app's existing icon set if it has one. Otherwise use lucide. Stroke icons, 16–20px, stroke width 1.6–2. No emoji as UI icons.
- **Motion:** 150–200ms ease-out for hovers, menus and drawers. No animation under `prefers-reduced-motion`.

## 2. Allowed additions

1. A Light/Dark theme switch. Put it in the app's existing settings, nav or header (see section 4).
2. On mobile: a menu button that opens the app's existing side navigation as a drawer (section 10). The navigation's contents and actions stay the same.

Nothing else may be added.

## 3. Typography

Font: **Outfit** 400/500/600 from Google Fonts. Fallback `ui-sans-serif, system-ui, sans-serif`. Never use 700.

| Role | Size / weight | Notes |
|---|---|---|
| Page title (H1) | 22px / 600 | letter-spacing -0.015em. 20px on mobile |
| Section title (H2) | 18px / 600 | letter-spacing -0.01em |
| Card / group title (H3) | 16px / 600 | |
| Body | 15px / 400 | line-height 1.6 |
| Small / help text | 13px / 400 | `--muted` |
| Labels, buttons | 15px / 500 | form labels 13px / 500, `--text-2` |
| Pills, badges, counts | 12px / 500 | |
| Section label in nav | 12px / 500 (light); 11px / 500 uppercase, letter-spacing 0.08em (dark) | `--muted` |

- Numbers in tables and stats use `font-variant-numeric: tabular-nums`.
- App or brand name: 17px / 600, letter-spacing -0.01em.

## 4. Theming

- Light values on `:root`. Dark values on `[data-theme="dark"]`.
- Default theme follows `prefers-color-scheme`.
- Theme switch: a two-segment control (sun icon "Light", moon icon "Dark"). It sets `data-theme` on `<html>` and saves the choice in `localStorage`. It uses the segmented-control style from section 9.

## 5. Colour tokens

### Surfaces, borders and text

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--page` | #ECEEF4 | #0D0E12 | App background behind panels |
| `--nav` | #F8F9FC | #121318 | Sidebar / navigation panel |
| `--panel` | #FFFFFF | #15161C | Main content panel, modals |
| `--raised` | #FFFFFF | #1B1D24 | Cards, inputs, buttons, list containers |
| `--sunken` | #F4F5F9 | #111217 | Wells, trays, table headers, segmented-control tracks, skeletons |
| `--bar` | #FAFBFD | #131419 | Sticky header/footer/action bars inside a panel |
| `--hover` | #F4F5F9 | #17181E | Hover and pressed state for rows and nav items |
| `--selected-bg` | #E9EBFB | #1B1D24 (+1px `--border`) | Current nav item, selected row |
| `--selected-text` | #2F3794 | #E7E8EE (icon in `--accent`) | |
| `--border-nav` | #E2E5EE | #22242C | Nav panel outline |
| `--border-panel` | #E2E5EE | #24262F | Main panel outline |
| `--border` | #E8EBF2 | #2A2C36 | Cards, rows, pills, secondary buttons |
| `--border-strong` | #DDE1EA | #2C2F3A | Inputs |
| `--divider` | #EDEFF4 | #22242C | Header/footer/section dividers |
| `--divider-subtle` | #EEF0F4 | #262833 | Between list and table rows |
| `--text` | #262B5C | #E7E8EE | Main text (indigo ink in light) |
| `--text-2` | #4E5383 | #A6A9B6 | Secondary text, labels |
| `--text-pill` | (palette text) | #C9CBD6 | Text inside pills in dark |
| `--muted` | #6B6F94 | #7E828F | Help text, meta, timestamps |
| `--placeholder` | #7E82A3 | #6F7380 | Input placeholders |
| `--link` | #4A55C9 | #AEB4F0 | Inline links |
| `--accent` | #5B67E8 | #8B93E6 | Focus rings, checked controls, accent icons and dots |
| `--primary-bg` | #5B67E8 | #E7E8EE | Primary buttons |
| `--primary-text` | #FFFFFF | #0D0E12 | |
| `--tint` | #E6E8FC | #1D1F2B | Avatars, soft highlight backgrounds |
| `--tint-border` | none | #2A2D40 | |
| `--scrim` | rgba(15,17,32,.35) | rgba(0,0,0,.6) | Behind modals and drawers |
| `--tooltip-bg` | #262B5C | #E7E8EE | Tooltips (inverted) |
| `--tooltip-text` | #FFFFFF | #0D0E12 | |

### Status palette

Each colour has one meaning everywhere in the app:

- **Info / brand (periwinkle):** general information, neutral highlights, "later".
- **Success (mint):** done, added, active, positive.
- **Warning (peach):** in progress, changed, pending, needs attention.
- **Danger (rose):** errors, destructive actions, overdue, urgent.
- **Neutral:** no status, archived, empty.

| Colour | Light tint (bg) | Light icon | Light text | Dark dot / icon / text |
|---|---|---|---|---|
| Info | #E6E8FC | #5B67E8 | #2F3794 | #8B93E6 |
| Success | #DDF3EA | #2B8C70 | #1F6B55 | #6FBFA2 |
| Warning | #FDEBDD | #C8692F | #9A4A1C | #D9996E |
| Danger | #FBE4EA | #D0597A | #9C2F4E | #D9849A |
| Neutral | #EEF0F4 | #6B6F94 | #4E5383 | #3A3D4A (dot), #7E828F (text) |

Rules:
- Use the palette only for pills, badges, icons, dots, alerts and small buttons, never for large areas.
- **Light:** tinted backgrounds with darker text of the same hue.
- **Dark:** no tinted fills. Colour appears as dots, icons and (for errors) text only.
- **Charts:** series colours in this order: info, success, warning, danger, then neutral greys.

## 6. Shadows and edges

**Light**
- Main panel: `0 1px 3px rgba(35,38,64,.05), 0 16px 40px rgba(35,38,64,.07)`
- Cards and rows: `0 1px 2px rgba(35,38,64,.07)`
- Inputs and secondary buttons: `0 1px 2px rgba(35,38,64,.04)`
- Floating (menus, popovers, toasts, modals): `0 12px 32px rgba(35,38,64,.12)`

**Dark**
- Main panel: `inset 0 1px 0 rgba(255,255,255,.03), 0 24px 60px rgba(0,0,0,.45)`
- Nav panel, primary inputs and raised buttons: top highlight `inset 0 1px 0 rgba(255,255,255,.03)` to `.04`
- Floating: 1px `--border` plus `0 16px 40px rgba(0,0,0,.5)`
- Cards and rows: no shadow; use the 1px `--border`.

## 7. Radius

| Element | Radius |
|---|---|
| Main panel | 28px |
| Nav panel, modals, drawers, bottom sheets | 24px |
| Large cards, trays | 20px |
| Cards, list and table containers, menus, toasts | 16px |
| Buttons, inputs, nav items, rows | 14px |
| Segmented-control segments | 12px |
| Tooltips | 10px |
| Pills, badges, chips, icon buttons, avatars | 999px |

## 8. Layout (desktop, 1024px and up)

- **App shell:** `--page` background with 16px padding and a 16px gap between panels.
  - Side navigation, if the app has one, is a panel 248px wide (`--nav`, 1px `--border-nav`).
  - If the app uses a top navigation bar instead, render it as a full-width `--nav` panel above the main panel.
  - The main panel fills the rest (`--panel`, 1px `--border-panel`).
- **Page header** inside the main panel:
  - Page title on the left, page actions on the right.
  - 12px/32px padding, 1px `--divider` underneath.
- **Content width:**
  - 1120px max for dashboards, tables and grids.
  - 720px max for reading, forms, settings and chat.
  - Centred, 32px padding.
- **Rhythm:** 32px between sections, 16px between form fields and cards, 20px padding inside cards.
- **Sticky action bars** (e.g. save/cancel, composers): `--bar` background, 1px `--divider` on top, bottom corners matching the panel.

## 9. Components

### Buttons
All buttons are at least 44px tall, 0 16px padding, 15px/500 text, 14px radius, with an optional 16px icon on the left.

| Type | Light | Dark |
|---|---|---|
| Primary | `--primary-bg` (accent), white text | `--primary-bg` (#E7E8EE), dark text |
| Secondary | `--raised`, 1px `--border`, small shadow | `--raised`, 1px `--border`, top highlight |
| Ghost | transparent, `--text-2`; `--hover` on hover | same |
| Danger | danger tint background, danger text | transparent, 1px `--border`, danger text and icon |
| Icon button | 44px round, transparent, `--muted` icon, `--hover` on hover | same |

States:
- Disabled: 50% opacity, `not-allowed` cursor.
- Loading: a spinner replaces the icon and the button keeps its width.
- One primary button per view or section.

### Form controls
- **Text inputs, selects, textareas:**
  - `--raised` background, 1px `--border-strong`, 14px radius, 44px tall, 0 14px padding.
  - 15px text (16px on mobile).
  - Placeholder in `--placeholder`.
- **Label** above the field: 13px/500, `--text-2`. **Help text** below it: 13px, `--muted`.
- **Error:** border in danger colour, plus a danger message with an icon below. Never colour alone.
- **Checkbox, radio, switch:**
  - Off: `--raised` with `--border-strong`.
  - On: `--accent` fill with a white mark (light) or a #0D0E12 mark (dark).
  - The whole label row is the 44px tap target.

### Segmented control and tabs
- Segmented control:
  - Track: `--sunken`, 1px `--border`, 16px radius, 4px padding.
  - Active segment: `--raised`, 1px `--border`, 12px radius.
- Tabs: text tabs in `--text-2`. The active tab is `--text` with a 2px `--accent` bar under it.

### Cards
- `--raised`, 1px `--border`, 16px radius (20px for large cards), 20px padding.
- Card shadow in light only.
- Card title H3. Meta text in `--muted`.

### Lists
- Container: `--raised`, 1px `--border`, 16px radius.
- Rows: at least 44px tall (56px for two-line rows), 1px `--divider-subtle` between them, `--hover` on hover or press.
- Trailing meta on the right in `--muted`, or as a pill.

### Tables
- Same container as lists.
- Header row: `--sunken` background, 12px/500 `--text-2` labels.
- Body rows: 48px tall, with `--divider-subtle` between them.
- Numbers right-aligned and tabular.
- On mobile, see section 10.

### Navigation (sidebar)
- Items: 44px tall, 14px radius, 18px icon + label, optional count badge on the right.
- Current item: `--selected-bg` / `--selected-text`.
- Section labels: see section 3.
- 1px `--divider` between groups.

### Pills, badges and status
- 12px/500, 999px radius, padding 2px 10px.
- **Light:** status tint background + status text.
- **Dark:** transparent, 1px `--border`, `--text-pill` text, with a 6px status dot before the text.
- Counts: light uses an info tint pill; dark uses an outlined neutral pill.

### Avatars
- Round. Sizes 28px, 32px or 40px.
- Initials 13px/600 in `--accent`, on `--tint` (plus `--tint-border` in dark).

### Alerts and banners
- 16px radius, 12px/16px padding, status icon + text.
- **Light:** status tint background.
- **Dark:** `--raised` with 1px `--border` and a status-coloured icon.

### Menus, dropdowns and popovers
- `--raised`, 1px `--border`, 16px radius, floating shadow, 6px padding.
- Items: 40–44px tall, 10px radius, `--hover` on hover.
- Destructive items use danger text.

### Modals and dialogs
- `--panel`, 24px radius, max-width 520px, 24px padding, over `--scrim`.
- Title H2. Actions bottom-right, primary last.
- On mobile, they become bottom sheets (section 10).

### Toasts
- `--raised`, 1px `--border`, 16px radius, floating shadow, status icon + text, optional action.
- Position: bottom-right on desktop, bottom-centre on mobile (above the safe area).

### Tooltips
- `--tooltip-bg` / `--tooltip-text`, 10px radius, 12px text, 6px/10px padding.

### Empty states
- Centred: a 40px icon in a `--sunken` circle, an H3 title, one line of `--muted` text, and one primary action.

### Loading
- Skeleton blocks in `--sunken` with a gentle pulse (none under reduced motion).
- Spinners in `--accent`.

### Chat and messages (only if the app has them)
- **User messages:** right-aligned bubble, max-width ~78%, 22px radius. Light: #E7EAFD. Dark: #1F2130 with a 1px #2A2D40 border.
- **Other messages:** no bubble, 30px avatar, small 13px sender label (light #3A43A8 / 600, dark `--text-2` / 500).
- **Composer:** sits in a sticky `--bar`. A `--raised` box with `--border-strong`, 22px radius, and a round 44px primary send button.

## 10. Mobile and tablet

Same tokens, same components and the same themes. Only the layout changes.

### Breakpoints
- **Mobile:** below 720px. Use everything in this section.
- **Tablet:** 720–1023px. Desktop layout, but the sidebar is 224px wide and page padding is 12px.
- **Desktop:** 1024px and up (section 8).

### Page setup (all sizes)
- Viewport meta: `width=device-width, initial-scale=1, viewport-fit=cover`.
- Full-height layouts use `100dvh` (with a `100vh` fallback), never plain `100vh`.
- `<meta name="theme-color">` matches the panel: #FFFFFF in light, #15161C in dark. Update it when the theme changes.

### Mobile shell
- No page padding and no gap. The main panel fills the screen edge to edge, with no outer border, radius or shadow. Background `--panel`.
- **Header:** sticky at the top, with `padding-top: env(safe-area-inset-top)` and a 1px `--divider` underneath.
  - Left: a 44px menu button (if the app has side navigation), with an accessible label and `aria-expanded`.
  - Middle: page title, 20px, one line with an ellipsis.
  - Right: up to two icon buttons. Move extra actions into a "more" menu.
- **Content:** padding 16px, 24px between sections. Only the content area scrolls.
- **Sticky bottom bars** (actions, composers): `padding-bottom: calc(12px + env(safe-area-inset-bottom))`, square corners.

### Navigation drawer
- The side navigation becomes a drawer that slides in from the left.
  - Width `min(320px, 85vw)`, full height, `--nav` background.
  - 1px `--border-nav` on its right edge; top-right and bottom-right corners 24px.
  - Top and bottom padding include the safe-area insets.
- `--scrim` sits behind it.
- It closes on any of these: tapping the scrim, pressing Esc, or choosing a destination.
- While open, focus is trapped inside it and the page behind doesn't scroll. On close, focus returns to the menu button.
- A top navigation bar collapses into the same drawer.

### Components on mobile
- **Inputs:** 16px font size (prevents iOS zoom on focus). Full width.
- **Buttons:** full width in forms and sheets. Stack them vertically with the primary on top.
- **Modals:** become bottom sheets.
  - Full width, top corners 24px, a 36×4px grab handle in `--border`.
  - Max height 90dvh, with the content scrolling inside.
- **Tables:** either scroll sideways inside their own container (first column sticky), or switch to a stacked card per row, label on the left and value on the right. Pick one approach per table and say which.
- **Card grids:** a single column.
- **Chip or filter rows:** one row that scrolls sideways inside its own container (scrollbar hidden). The page itself never scrolls sideways.
- **Toasts:** full width minus 16px each side, above the bottom safe area and above any sticky bar.
- **Keyboard:** when the on-screen keyboard opens, focused inputs and sticky composers must stay visible above it.

### Touch
- No hover-only controls. Anything shown on hover on desktop must be visible or reachable with a tap.
- At least 8px between neighbouring tap targets.
- Pressed state: the background shifts to `--hover`.

### Test sizes
- 360px, 390px and 430px wide in portrait, plus one landscape phone (844×390).
- Check both themes at each size, with the drawer and any sheets both open and closed.
