# Designer Brief

<!--
  ============================================================
  WELCOME, DESIGNER! 👋
  ============================================================

  This file is YOUR place to describe the project to the AI.
  You don't need to know JSON or code — just fill in the
  sections below using plain text.

  HOW IT WORKS:
    1. Edit this file (you're looking at it right now)
    2. Save it
    3. Ask the developer to run:  yarn designer:brief
    4. The script will automatically update all the config files

  RULES:
    - Keep the "- Key: Value" format in each section
    - Node IDs come from Figma → right-click a frame → "Copy link"
      or look in Dev Mode (the number after "node-id=" in the URL,
      e.g. "node-id=148-4463" → write as "148:4463")
    - Sections marked (optional) can be left out if not needed
    - Don't change the section headings (lines starting with ## or ###)
  ============================================================
-->

## Project

<!--
  Fill in your project details below.
  - Name: the display name of your project
  - Framework: what JS framework is used (e.g. Next.js, React, Vue, Nuxt)
  - Language: TypeScript or JavaScript
  - Styling: how the app is styled (e.g. Tailwind CSS, CSS Modules, styled-components)
  - UI Library: any component library used (e.g. shadcn/ui, MUI, Ant Design) — write "none" if not applicable
  - Font: the fonts used in the design (body font first, then heading font)
-->

- Name: My Project Name
- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS
- UI Library: none
- Font: Inter (body), Playfair Display (heading)

## Figma

<!--
  Paste your Figma file URL here.
  - File URL: the full URL from your browser when the Figma file is open
    e.g. https://www.figma.com/design/XXXXX/Project-Name
  - Pages: the Figma page names that are in scope (comma-separated)
    These are the tab names at the bottom of Figma
-->

- File URL: https://www.figma.com/design/XXXXX/Project-Name
- Pages: Home Page, About Page

## Colors

<!--
  (Optional) List your design tokens / brand colors.
  These will be noted for the AI to use when writing code.
  Format: - Color Name: #hexcode
-->

- Primary: #1A1A2E
- Accent: #E94560
- Background: #F5F5F5

## Pages

<!--
  List every Figma frame that should become a React/Vue/etc. component.

  For each frame, create a "### Page Name" subsection and fill in:
  - Node ID:   the Figma node ID (e.g. 148:4463)
               How to find it: open Figma → click the frame → look at Dev Mode
               or copy the frame link — the node ID is after "node-id=" in the URL
               (replace the dash with a colon: "148-4463" → "148:4463")
  - Component: the PascalCase name for the React component (e.g. HomeDesktop)
  - File:      the file path where the component will live
               (e.g. src/pages/home/HomeDesktop.tsx)
  - Breakpoint: (optional) the CSS breakpoint this frame targets
               (e.g. ">= 1280px", "< 768px", "768px – 1279px")
  - Notes:     (optional) short design notes for the developer / AI
               (layout hints, special interactions, important details)
-->

### Home Page - Desktop
- Node ID: 148:4463
- Component: HomeDesktop
- File: src/pages/home/HomeDesktop.tsx
- Breakpoint: >= 1280px
- Notes: Hero section with interactive hotspot markers.

### Home Page - Mobile
- Node ID: 200:1234
- Component: HomeMobile
- File: src/pages/home/HomeMobile.tsx
- Breakpoint: < 768px
- Notes: Single column layout. Hotspots replaced with scrollable cards.

## Behavior: 148:4463

<!--
  (Optional) Describe the interaction / animation behavior for a specific frame.

  Create one "## Behavior: <node-id>" section for EACH frame that has
  special interactions (tooltips, modals, animations, etc.).

  The node ID must match one of the Node IDs listed in the ## Pages section.

  Fill in each subsection:
  - Trigger:    what the user does to start the interaction
  - Behavior:   what happens on screen (step by step if needed)
  - States:     list the UI states, format "- state-name: description"
  - Animation:  timing and easing details (skip if no animation)
  - Notes for AI: technical details, edge cases, constraints

  You can add as many "## Behavior: <node-id>" sections as you need.
-->

### Trigger

User clicks hotspot marker on hero image

### Behavior

Show tooltip with product name, price, CTA button. Only 1 tooltip open at a time.

### States

- default: Hotspot visible with pulse animation
- active: Hotspot highlighted, tooltip visible

### Animation

Fade in 200ms ease-out, fade out 150ms ease-in

### Notes for AI

Tooltip position relative to marker. Handle viewport overflow by flipping direction. z-index must be high.
