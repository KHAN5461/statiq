---
name: Karmayogi StatIQ
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#003120'
  on-tertiary: '#ffffff'
  tertiary-container: '#004a32'
  on-tertiary-container: '#4ac08f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system for this platform is rooted in **Corporate Modernism**, blending the systematic rigor of Material Design 3 with the refined, functional aesthetics of `shadcn/ui`. The UI is designed to feel institutional yet accessible, projecting authority, data-driven precision, and government-grade reliability.

The visual language prioritizes clarity and information density. It utilizes a high-signal, low-noise approach with expansive white space, subtle borders, and a disciplined color application to ensure that complex statistical data remains the focal point for MoSPI and iGOT stakeholders.

## Colors
This design system employs a sophisticated palette designed for high legibility and semantic clarity. 

- **Primary (Ashoka Blue):** Used for primary actions, navigation headers, and institutional branding.
- **Secondary (Indigo):** Reserved specifically for AI-driven insights, iGOT Karmayogi synchronization features, and intelligent data processing indicators.
- **Background & Surface:** A tiered neutral system using Slate/Neutral Gray for the base background to reduce eye strain, while pure White is used for interactive surfaces and data cards.
- **Semantic Palette:** Functional colors (Emerald, Amber, Crimson) are applied to status indicators, competency levels, and critical alerts following standard accessibility contrast ratios.

## Typography
The system uses **Inter** as the sole typeface to maintain a clean, utilitarian aesthetic. The typographic scale is optimized for data density and readability.

- **Display & Headlines:** Use semi-bold weights with slight negative letter-spacing for a modern, compact look in dashboards.
- **Body Text:** Optimized at 14px and 16px for long-form reporting and statistical analysis.
- **Labels:** Uppercase styles are used sparingly for category headers and meta-data to create visual hierarchy without increasing font size.

## Layout & Spacing
The layout follows a **Fluid Grid** model with fixed maximum widths for content readability.

- **Grid System:** A 12-column grid for desktop with 24px gutters. For analytical dashboards, a 16px gutter may be used to increase data density.
- **Rhythm:** An 8pt linear scale governs all spacing (padding, margins, gaps).
- **Responsive Behavior:** 
  - **Desktop:** Sidebar navigation is fixed (280px); content expands.
  - **Tablet:** Sidebar collapses to an icon rail; margins reduce to 24px.
  - **Mobile:** Single column layout; margins reduce to 16px; navigation moves to a bottom bar or hamburger menu.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** Slate-50 (#F8FAFC) creates the base canvas.
- **Level 1 (Cards/Surfaces):** White background with a 1px solid border in Slate-200. No shadow in static state.
- **Level 2 (Hover/Active):** On hover, elements gain a subtle, ultra-diffused shadow (`0 4px 6px -1px rgb(0 0 0 / 0.1)`) and a border color shift to Slate-300.
- **Modals & Overlays:** Use a heavy backdrop blur (8px) with a semi-transparent Slate-900 overlay to maintain focus on the task at hand.

## Shapes
The shape language is "Soft-Professional."

- **Cards:** Use a consistent `rounded-xl` (12px) radius to soften the high-density data environment.
- **Interactive Elements:** Buttons and Input fields use a tighter `rounded-md` (6px to 8px) to maintain a sense of precision and "tool-like" functionality.
- **Badges/Chips:** Use a fully rounded pill shape to distinguish them clearly from interactive buttons.

## Components

### Buttons & Inputs
- **Primary Button:** Ashoka Blue background, white text. Transitions to a deeper shade on hover.
- **Ghost/Outline:** Slate-200 border, transparent background. Used for secondary actions to reduce visual clutter.
- **Inputs:** 1px Slate-200 border, transitions to 2px Primary Accent on focus with a subtle blue outer glow.

### Data & Status Badges
- **Filled Variant:** High-visibility for critical status (e.g., "Critical," "Overdue").
- **Outline Variant:** Default for metadata or secondary categorization.
- **Success/Warning/Error:** Utilize the semantic palette with 10% opacity backgrounds and 100% opacity text of the same hue.

### Quiz Option Tiles
- Interactive tiles for assessment modules. 
- **Default:** White surface, Slate-200 border.
- **Hover:** Slate-50 background, Primary border.
- **Selected:** Ashoka Blue border (2px) with a subtle Blue-50 background tint.
- **Correct/Incorrect:** Transitions to Emerald or Crimson borders respectively upon submission.

### Competency Radar Charts
- **Grid Lines:** Slate-200, 1px stroke.
- **Data Area:** Primary Accent (Ashoka Blue) with 20% opacity fill and 2px solid stroke.
- **Comparison Area (Average):** Dotted Slate-400 stroke, no fill.

### Cards
- **Stat Cards:** 12px radius, centered large-format numbers (Primary Blue), with label-md text.
- **Container:** Always 1px border (Slate-200). Use horizontal dividers for internal sectioning.