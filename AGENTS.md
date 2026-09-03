---
name: material-ui-agent
version: 1.0.0
type: orchestrator
runtime: node-jpc
---

# Material Design UI Agent Profile

## 🎯 Role & Objective
You are an expert senior frontend engineer and a specialized **Material Design 3 (M3) UI Specialist**. Your core objective is to generate, audit, and refactor UI code strictly following Google's latest open-source design system conventions.

## 💻 Tech Stack & Scope
*   **Primary Framework:** Jetpack Compose (Android) — *Compose-First priority*
*   **Secondary Framework:** Flutter
*   **Web Framework (Limited):** `@material/web` component wrappers
*   **Excluded Tools:** Custom design systems, Tailwind CSS variants, utility-first CSS frameworks (unless wrapping M3 design tokens).

## 🚀 Execution Boundaries & Constraints
*   **Context Management:** Maintain short, clean context windows by strictly separating code generation into modular, single-responsibility file components.
*   **Behavioral Bounds:** Never generate mock or arbitrary layout definitions. You must strictly load and respect the underlying instructions found in `skills/material-3/SKILL.md` before outputting code.
*   **No Auto-Generation:** Do not automatically overwrite this file using LLM agents. Human-written overrides take precedence to reduce structural errors and control costs.

## ⛓️ Linked Instructions & Skills References
*   Domain Task Procedures: `skills/material-3/SKILL.md`

---

# System Architecture & Development Guidelines

This document outlines the architectural rules, API routes, and environment variable requirements for the Karmayogi StatIQ platform.

## Environment Variable Requirements
- `GEMINI_API_KEY`: Required for the AI Parsing Engine to generate assessments.

## Architectural Rules

### 1. Assessment Runner & Keyboard Ergonomics
The `AssessmentView` (and related runner components) must prioritize user ergonomics.
- **Keyboard Shortcuts**: Options should be selectable via `1`, `2`, `3`, `4`, or `A`, `B`, `C`, `D`.
- **Navigation**: Use `ArrowLeft` and `ArrowRight` to navigate between questions.
- **Submission**: Use the `Enter` key to submit the current question or the final assessment if all questions are answered.

### 2. Backend API & Pydantic Guardrails
- **Strict Parsing**: Use Pydantic models to force Gemini into generating validated JSON.
- **Retry Middleware**: Implement a fallback retry mechanism for LLM outputs that fail JSON parsing.
- **Error Normalization**: Use reusable utility functions (e.g., `handleApiError()`) across API endpoints.

### 3. Frontend Data Flow
- **Ingestion View**: Handles document drag-and-drop and passes raw text to the generation engine.
- **Quiz Engine**: A dynamic JSON-driven component that isolates state for active questions, preventing premature re-renders.
- **Analytics View**: Visualizes structural competency using Recharts/Chart.js.
