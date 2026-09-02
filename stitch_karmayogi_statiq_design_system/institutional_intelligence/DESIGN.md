---
name: Institutional Intelligence
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#494456'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#7a7488'
  outline-variant: '#cbc3d9'
  surface-tint: '#6b24fa'
  primary: '#5700db'
  on-primary: '#ffffff'
  primary-container: '#702dff'
  on-primary-container: '#e6dbff'
  inverse-primary: '#cebdff'
  secondary: '#2f05ea'
  on-secondary: '#ffffff'
  secondary-container: '#4b3bff'
  on-secondary-container: '#dbd8ff'
  tertiary: '#833200'
  on-tertiary: '#ffffff'
  tertiary-container: '#aa4300'
  on-tertiary-container: '#ffd9c9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cebdff'
  on-primary-fixed: '#21005e'
  on-primary-fixed-variant: '#5100ce'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#2d00e5'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
  text-secondary: '#5F5F5F'
  text-muted: '#9E9E9E'
  feedback-error: '#F13E3E'
  surface-border: '#E0E0E0'
  surface-bg: '#F9F9FB'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
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
    fontWeight: '500'
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
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 2rem
  gutter: 1.5rem
  card-gap: 1rem
  section-margin: 3rem
---

## Brand & Style

This design system is engineered for a GovTech context, prioritizing clarity, authority, and modern data-driven governance. The brand personality is professional and institutional yet forward-looking, moving away from legacy bureaucratic aesthetics toward a sleek, tech-enabled intelligence platform.

The design style is **Corporate / Modern** with a lean toward **Minimalism**. It utilizes expansive white space, precise typography, and a "vibrant-professional" accent to highlight critical data pathways. The interface should feel reliable and robust, evoking a sense of efficiency and large-scale analytical power for government stakeholders.

## Colors

The palette is anchored by a high-contrast relationship between deep ink-rich text and a pure white surface. The primary brand expression uses a **Purple-to-Indigo gradient** (`#702DFF` to `#4A3AFF`) specifically for high-level brand elements, data visualizations, and primary action states. 

Functional colors are strictly categorized:
- **Primary Accent:** Used for active navigation states, focus indicators, and successful data trends.
- **Neutral Scale:** Primary text uses a near-black for maximum legibility. Secondary and muted text levels provide hierarchy without introducing unnecessary chromatic weight.
- **Feedback:** Error states and critical "Logout" or "Delete" actions use a sharp, urgent red.

## Typography

The system utilizes **Inter** exclusively to ensure a systematic and utilitarian feel across all data densities. 

- **Hierarchy:** Dramatic weight differences (from 400 to 800) are used to distinguish between data values and structural labels.
- **Headlines:** Use 600 weight for standard headers. The 800 weight is reserved for high-level dashboard metrics (Display sizes) to provide a "bold statement" of facts.
- **Labels:** Small labels use uppercase with increased letter spacing to maintain legibility in dense table headers and chart legends.

## Layout & Spacing

The design system employs a **Fixed Grid** philosophy for desktop dashboards to ensure data visualizations remain consistent and readable. 

- **Grid:** A 12-column system with 24px (1.5rem) gutters.
- **Margins:** Main dashboard containers use 32px (2rem) safe margins from the screen edge.
- **Breakpoints:**
  - **Desktop (1200px+):** Full 12-column layout with sidebar.
  - **Tablet (768px - 1199px):** 8-column layout; sidebar collapses to an icon-only rail.
  - **Mobile (<767px):** Single-column fluid layout with 16px margins.
- **Rhythm:** Use an 8px base unit for all internal component spacing (padding, gaps between small elements).

## Elevation & Depth

Hierarchy is established through **Tonal Layers** supplemented by a signature **Ambient Shadow**. 

- **Surface Levels:** The background uses a very subtle grey (`#F9F9FB`), while active cards and content containers use pure white (`#FFFFFF`) to pop forward.
- **Shadows:** A sophisticated, diffused shadow (`0px 14px 42px rgba(8, 15, 52, 0.06)`) is applied to cards. This creates a soft "lift" that suggests importance without looking heavy or cluttered.
- **Borders:** Low-contrast outlines (`1px solid #E0E0E0`) are used for input fields and table structures to maintain a crisp, organized appearance without relying on shadows for every element.

## Shapes

The shape language utilizes a tiered approach to rounding to distinguish between the "frame" and the "content":

- **Main Containers:** Outer dashboard sections and large page wrappers use a generous 20px radius.
- **Component Cards:** Inner data cards and modal windows use a 12px radius.
- **Interactive Elements:** Buttons and tags use a **Pill-shaped (40px)** radius to maximize their "tappability" and distinguish them from static data containers.
- **Form Inputs:** Fields use a standard 8px radius to maintain a professional, structured look.

## Components

- **Buttons:** Primary buttons are pill-shaped, featuring the brand gradient. Secondary buttons use a transparent background with a 1px border.
- **Chips/Badges:** Used for status indicators (e.g., "Active," "Pending"). They use the 12px radius with a light tinted background of the status color and high-contrast text.
- **Cards:** The primary vehicle for data. Must include the signature shadow and 12px border radius. Content inside should have 24px of internal padding.
- **Input Fields:** Use a 500 weight for labels. The focus state should utilize a 2px solid border in the Primary Purple (`#702DFF`).
- **Data Tables:** High-density, minimal borders. Row hover states should use a subtle `#F9F9FB` background shift.
- **Progress Bars:** Use the brand gradient for "completed" segments to tie back to the institutional identity.