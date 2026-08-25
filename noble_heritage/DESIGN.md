---
name: Noble Heritage
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#584141'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#8c7071'
  outline-variant: '#e0bfbf'
  surface-tint: '#af2b3e'
  primary: '#570013'
  on-primary: '#ffffff'
  primary-container: '#800020'
  on-primary-container: '#ff828a'
  inverse-primary: '#ffb3b5'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#272919'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d3f2d'
  on-tertiary-container: '#a9aa94'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdada'
  primary-fixed-dim: '#ffb3b5'
  on-primary-fixed: '#40000b'
  on-primary-fixed-variant: '#8e0f28'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#e4e4cc'
  tertiary-fixed-dim: '#c8c8b0'
  on-tertiary-fixed: '#1b1d0e'
  on-tertiary-fixed-variant: '#474836'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is built upon a foundation of **Corporate Modernism** infused with **Islamic Geometric** influences. It aims to evoke a sense of reverence, community, and administrative excellence. The visual language is structured, dependable, and dignified, reflecting the importance of the institution it represents.

The target audience includes congregants, community leaders, and administrative staff who require a clear, high-legibility interface that balances tradition with modern digital efficiency. The emotional response should be one of "Peaceful Authority"—warm and welcoming yet organized and professional.

Key stylistic markers include:
- **Generous white space** to allow for focus and clarity.
- **Subtle geometric patterns** (8-point stars) used as low-opacity backgrounds or dividers.
- **Precise alignment** reflecting the mathematical beauty found in Islamic architecture.

## Colors

The palette is derived directly from the institution's official logo, ensuring a cohesive brand identity across physical and digital touchpoints.

- **Primary (Maroon):** Used for critical actions, headers, and primary navigation elements. It conveys depth and strength.
- **Secondary (Yellow-Gold):** Used sparingly for highlights, status indicators, and subtle decorative accents to signify importance and value.
- **Neutrals:** A crisp white background is prioritized for clarity, with very light grey or cream surfaces used to define content blocks without introducing visual noise.
- **Semantic Colors:** Success (Green), Warning (Amber), and Error (Red) should be calibrated to maintain high contrast against the primary maroon.

## Typography

This design system uses a dual-font approach to balance modernity with readability. 

**Manrope** is used for headlines and display text. Its balanced, geometric proportions feel contemporary and precise. Use tighter letter-spacing for large display sizes to maintain a "locked-in" feel.

**Work Sans** is utilized for body copy and labels. Its slightly wider apertures and neutral personality make it exceptionally readable for long-form content like announcements or schedules.

For the **Login screen**, labels should use `label-md` for maximum clarity, while the welcome message should utilize `headline-lg`.

## Layout & Spacing

The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile devices. 

- **Desktop:** 12 columns, 24px gutters, and 80px side margins. 
- **Tablet:** 8 columns, 20px gutters, and 40px side margins.
- **Mobile:** 4 columns, 16px gutters, and 16px side margins.

Spacing follows an 8px base unit. Vertical rhythm should be strictly maintained, particularly on information-heavy pages. For the **Login screen**, content should be centered both horizontally and vertically on desktop, transitioning to a top-aligned layout with 24px padding on mobile.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Base):** Solid white surface.
- **Level 1 (Cards/Inputs):** Soft 1px border (#E0E0E0) with a very subtle 4px blur shadow at 5% opacity.
- **Level 2 (Dropdowns/Modals):** 1px border with a 12px blur shadow at 10% opacity.

For the Login container, use Level 1 elevation to distinguish the form from the background without creating excessive visual weight.

## Shapes

The shape language is **Soft**. This provides a professional and modern look that avoids the coldness of sharp corners while remaining more formal than "pill" shapes.

- **Standard Buttons & Inputs:** 0.25rem (4px) corner radius.
- **Cards & Large Containers:** 0.5rem (8px) corner radius.
- **Avatars/Icons:** Circular or 8-point star frames.

The Login button should use the standard 4px radius to maintain a crisp, functional appearance.

## Components

### Buttons
- **Primary:** Solid Maroon background, White text. High contrast, reserved for main actions (e.g., "Sign In").
- **Secondary:** Maroon outline, Maroon text, or Gold background for specific promotional highlights.
- **Ghost:** No background, Maroon text, used for low-priority actions (e.g., "Forgot Password").

### Input Fields (Login Screen)
Inputs feature a 1px neutral border that transitions to a 2px Maroon border on focus. Labels sit clearly above the input field using `label-md`. Error states are indicated by a 2px red border and a small supporting text below the field.

### Chips
Used for filtering prayer times or event categories. These should have a light cream (Tertiary) background with Maroon text.

### Cards
Used for news and events. Cards should be flat with a 1px border and 8px padding. Headlines within cards should use `title-md`.

### Login Screen Requirements
The login screen must feature:
1.  **Logo Placement:** Top center, sized appropriately.
2.  **Fields:** Email/Username and Password with "Show Password" toggle.
3.  **Action:** A full-width Primary Maroon button.
4.  **Links:** "Forgot Password" and "Register" links using Maroon text-decoration.