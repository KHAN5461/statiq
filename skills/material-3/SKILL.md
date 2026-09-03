---
id: material-3-compliance
name: Material Design 3 UI Assembly
commands:
  - /design
  - /audit-m3
tags: [ui, material-design, compose, tokens]
---

# Material Design 3 Skill Guidelines

## 🗺️ Progressive Disclosure Index
When executing design instructions, refer to these local reference files on-demand:
*   Adaptive UI Maps: `./docs/RESPONSIVE-DESIGN.md`
*   Semantic Motion: `./docs/MOTION-SPEC.md`
*   Accessibility Specs: `./docs/ACCESSIBILITY.md`

## 🎨 Design System Tokens & Semantic Principles
Apply hierarchy through purposeful Material honesty and functional layer management:
*   **Expressive Layouts:** Utilize M3 Expressive layouts, scaffolds, and containment strategies safely without cluttering the screen.
*   **Semantic Component Rules:** Match UI elements to intent:
    *   *Floating Action Buttons (FAB):* Primary, high-emphasis triggers. Pair toolbars with a FAB safely.
    *   *Buttons/Chips:* Differentiate filled, tonal, and outlined styles based on secondary action weight.
    *   *Surfaces & Waveforms:* Show real-time feedback visually utilizing M3 expressive shape states.

## ⚠️ Anti-Patterns to Reject
*   ❌ Do not use dramatic, arbitrary drop shadows; rely entirely on M3 elevation layers and tone mapping.
*   ❌ Reject arbitrary padding rules or hardcoded $2px+$ decorative borders.
*   ❌ Never use inconsistent spacing grids; stick to the standard $8\text{dp}$ base grid system.

## 📝 Required Validation Pipeline (Post-Generation Quality Gates)
Before outputting any code block, evaluate it through these mandatory quality gates:
1.  **Swap Test:** If you replace the generated theme with a generic wireframe, does the application layout retain its structural integrity?
2.  **Squint Test:** Blur your spatial interpretation. Is the hierarchy of primary actions (e.g., FABs vs. Navigation Rails) instantly apparent?
3.  **10-Category Compliance Audit:** Run static checks for contrast tokens, touch target dimensions (minimum $48\text{dp} \times 48\text{dp}$), focus states, keyboard navigation hooks, and localization capabilities.
