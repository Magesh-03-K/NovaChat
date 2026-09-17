---
name: NovaChat Design System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dad7f3'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecff'
  surface-container-high: '#e8e5ff'
  surface-container-highest: '#e2e0fc'
  on-surface: '#1a1a2e'
  on-surface-variant: '#464555'
  inverse-surface: '#2f2e43'
  inverse-on-surface: '#f2efff'
  outline: '#767586'
  outline-variant: '#c6c5d7'
  surface-tint: '#474adb'
  primary: '#4143d5'
  on-primary: '#ffffff'
  primary-container: '#5b5fef'
  on-primary-container: '#f9f6ff'
  inverse-primary: '#c0c1ff'
  secondary: '#5846c8'
  on-secondary: '#ffffff'
  secondary-container: '#7161e3'
  on-secondary-container: '#fffbff'
  tertiary: '#a62a30'
  on-tertiary: '#ffffff'
  tertiary-container: '#c84245'
  on-tertiary-container: '#fff5f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#05006c'
  on-primary-fixed-variant: '#2c2cc3'
  secondary-fixed: '#e4dfff'
  secondary-fixed-dim: '#c7bfff'
  on-secondary-fixed: '#170065'
  on-secondary-fixed-variant: '#422db2'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#8c1520'
  background: '#fcf8ff'
  on-background: '#1a1a2e'
  surface-variant: '#e2e0fc'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  micro-timestamp:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.025em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.25rem
  margin-mobile: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system embodies the intersection of high-precision operator workflows and fluid consumer messaging. It delivers instant visual clarity, dependable communication channels, and effortless ergonomic comfort. By combining clean structure with approachable warmth, the interface feels both authoritative and personal—stripping away corporate stiffness without descending into playful disorder.

Targeted at modern professionals, distributed team members, and high-volume communicators, the system evokes feelings of:
- **Instantaneous Responsiveness:** Sharp micro-details, visible presence states, and streamlined visual processing.
- **Calm Focus:** A soft off-white canvas and measured indigo accents that prevent sensory fatigue during all-day interaction.
- **Ergonomic Tactility:** Subtle, diffused ambient lift paired with balanced pill and rounded card geometries that naturally seat inside mobile viewports.

The visual style synthesizes **Modern Consumer Minimalism** with **Lightweight Utility Glass**. Key information surfaces remain crisp and high-contrast, supported by soft-tinted borders and gentle ambient depth.

## Colors

The color palette purposefully departs from legacy emerald greens and sky blues, anchoring on a distinct violet-indigo spectrum. 

### Palette Architecture
- **Primary (`#5B5FEF`):** Anchors core actions, user message bubbles, active navigation indicators, and primary call-to-actions.
- **Secondary / Accent Gradient (`#6D5EF5` to `#8B7CFF`):** Injects dynamic depth into hero actions, pinned channel cards, and floating interactive triggers.
- **Canvas & Background (`#F7F7FB`):** A soft, warm off-white surface that mitigates harsh glare on mobile OLED/LCD displays.
- **Surface / Cards (`#FFFFFF`):** Crisp pure white containers for lists, active message groups, and bottom sheets.
- **Neutral Primary (`#1A1A2E`):** Deep midnight slate for headlines, body copy, and active icons.
- **Neutral Muted (`#8B8D98`):** Restrained slate gray reserved for secondary descriptors, message timestamps, and inactive controls.
- **Functional Accents:**
  - *Online / Active State:* `#34D399` (crisp emerald dot indicator).
  - *Unread Count / Alert:* `#FF6B6B` (coral-red badge providing high pop against cool slate and white).
- **Structural Lines (`#ECECF4`):** Low-contrast borders for cell separation, keyboard accessory trays, and subtle container strokes.

### Application Rules
Maintain strict 60-30-10 balance: 60% neutral canvas/surfaces, 30% deep slate typography and containment boundaries, and 10% purposeful indigo and status highlights. Avoid large solid indigo backgrounds outside of active chat bubbles and primary tap targets.

## Typography

Inter serves as the universal typographic engine across display, body, and microcopy layers. Its tall x-height, neutral geometric construction, and open counters guarantee immediate legibility across varying ambient mobile lighting conditions.

### Hierarchy & Usage Instructions
- **Display & Headlines:** Used strictly for primary conversation titles, onboarding screens, and main view headers (`display-lg`, `headline-lg`). Tighter letter-spacing creates a crisp, composed appearance.
- **Message Content:** Standard chat messages employ `body-md` (14px/20px) for regular density chat streams, and `body-lg` (16px/24px) for focus or accessibility viewing. Medium weight (`body-md-medium`) is reserved for author names, inline mentions, and file attachment labels.
- **Metadata & Microcopy:** Timestamps, delivery ticks, read states, and typing indicators utilize `micro-timestamp` (10px) and `label-sm` (11px). These micro-styles must be paired with `neutral_muted` (`#8B8D98`) or light indigo tints inside active bubbles to remain secondary to conversational content.

## Layout & Spacing

The layout model is optimized for handheld mobile form factors (390px to 420px viewports) while extending gracefully to split-pane desktop or tablet presentation frames.

### Spacing Philosophy & Rhythm
All vertical and horizontal relationships align to a strict 4px/8px incremental base rhythm:
- **Chat Feed Vertical Stacking:** Consecutive messages from the same sender cluster tightly with `space-xs` (4px). Sender-to-receiver turns shift with `space-md` (12px) to clearly punctuate the dialog flow.
- **Mobile Margins:** Standard canvas margin is `1rem` (16px), providing optimal thumb reach while preserving full-screen content area.
- **Safe Area Insets:** Message composer trays enforce a minimum bottom clearance of `space-lg` (20px) plus the native OS home indicator bar to prevent accidental swipe dismissals.
- **Desktop/Tablet Reflow:** When presented on screens wider than 768px, the interface transitions to an operator console layout: a fixed 360px conversation sidebar flanked by a dynamic primary chat canvas with a maximum centered container width of 840px.

## Elevation & Depth

Visual hierarchy uses a refined combination of tinted ambient drop shadows and low-contrast surface dividers. This avoids heavy physical elevation while maintaining distinct functional separation.

### Surface Tiers
- **Canvas Base (Level 0):** Pure `#F7F7FB`. Completely flat, non-interactive background.
- **Standard Card / Floating Panels (Level 1):** Solid `#FFFFFF` background with an ambient tinted shadow:
  `box-shadow: 0 2px 12px rgba(20, 20, 50, 0.06);`
  Used for pinned conversation banners, contact list rows, and search inputs.
- **Active Navigation & Headers (Level 2):** Top app bar and bottom navigation rely on backdrop blur with translucent surfaces:
  `background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(12px); border-bottom: 1px solid #ECECF4;`
- **Floating Modals & Sheets (Level 3):** Bottom sheets, action menus, and image attachment trays utilize a deeper elevation lift:
  `box-shadow: 0 10px 30px rgba(20, 20, 50, 0.12);`

### Outlines
Pair shadows with razor-thin structural borders (`1px solid #ECECF4`) on resting cards to sustain structural definition against bright ambient light.

## Shapes

The design system adopts a balanced roundedness architecture (Factor `2`), harmonizing ergonomic handheld curves with compact information density.

### Geometry Specifications
- **Outgoing Message Bubbles (Self):** Asymmetrical pill geometry. Top-left, bottom-left, and top-right corners are rounded to `1.125rem` (18px), while the bottom-right anchor corner tapers to `0.25rem` (4px) to form the speech tail.
- **Incoming Message Bubbles (Peer):** Mirrored asymmetrical geometry. Top-right, bottom-right, and top-left corners are rounded to `1.125rem` (18px), while the bottom-left corner tapers to `0.25rem` (4px).
- **Cards and Interactive Containers:** `rounded-lg` (16px) for channel list items, media previews, and modal drawers.
- **Action Triggers & Status Badges:** Full pill radii (`9999px`) for quick-reply chips, send buttons, and unread notification capsules.
- **Avatars:** Circular (`9999px`) with an inset `2px` white ring when overlaid with the active green presence indicator.

## Components

### Message Bubbles
- **Outgoing (User):** Background filled with primary `#5B5FEF` or subtle linear gradient (`#6D5EF5` to `#8B7CFF` at 135deg). Text rendered in `#FFFFFF`. Timestamps set in translucent white (`rgba(255,255,255,0.7)`).
- **Incoming (Peer):** Background filled with `#FFFFFF`, bordered with `1px solid #ECECF4`. Primary text rendered in `#1A1A2E`, timestamps in `#8B8D98`.
- **Padding:** Vertical `0.625rem` (10px), horizontal `0.875rem` (14px).

### Input Field & Composer Tray
- **Composer Container:** Docked to screen bottom with blur fill (`rgba(255, 255, 255, 0.95)`), separated by a `1px solid #ECECF4` top divider.
- **Text Input Bar:** Rounded pill shape (`9999px`), background `#FFFFFF`, bordered with `1px solid #ECECF4`. Left-padded with action iconography (attachment, emoji) in `#8B8D98`. Focused state activates a `1.5px solid #5B5FEF` ring without harsh outer glows.
- **Send Button:** Circular 36px button. Disabled state is muted gray `#ECECF4`; active typing state transitions to `#5B5FEF` with a white directional arrow icon.

### Badges & Status Indicators
- **Unread Counter:** Compact pill badge in `#FF6B6B`. Text is `#FFFFFF`, bold `11px`, with `4px` horizontal padding and minimum 18px width/height.
- **Presence Dot:** 10px circular badge in `#34D399` anchored to avatar bottom-right, framed with a 2px solid `#FFFFFF` stroke to cleanly separate from the user photo.

### Chips & Quick Action Filters
- **Resting:** Background `#FFFFFF`, border `1px solid #ECECF4`, text `#1A1A2E`, roundedness `9999px`, height `32px`.
- **Selected:** Background `rgba(91, 95, 239, 0.1)`, border `1px solid #5B5FEF`, text `#5B5FEF`, font weight `500`.

### Conversation List Rows
- **Layout:** Standard height 72px with `1rem` horizontal padding. Left-aligned 48px avatar, central flex block containing name and message preview, right-aligned meta block for timestamp and unread badge.
- **Dividers:** Inset dividers aligned to start at the text label margin (68px inset from left screen edge), rendered in `#ECECF4`.
- **Active / Pressed State:** `#F0F0F8` transition with smooth `150ms` ease-out response.

### Buttons
- **Primary:** Background `#5B5FEF`, text `#FFFFFF`, height 44px, roundedness 12px, font weight `600`. Pressed state darkens to `#4A4EDC`.
- **Secondary / Ghost:** Transparent background, text `#5B5FEF`, active hover/press background `rgba(91, 95, 239, 0.08)`.