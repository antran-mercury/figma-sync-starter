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
  - Font: the fonts used in the design (body font first, then heading font)

  NOTE: Technical stack decisions (framework, language, styling approach,
  component library) are the developer's responsibility and are defined in
  `.prompts/figma-to-react-spec.md`. You do not need to fill these in here.
-->

- Name: My Project Name
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
  List every page/screen that should become a React/Vue/etc. component.

  TWO-LEVEL FORMAT (recommended for responsive pages):
  ─────────────────────────────────────────────────────
  Use "### Page Name" for the component (shared across breakpoints), then
  "#### Breakpoint Label" for each Figma frame variant:

    ### Home Page
    - Component: HomePage
    - File: src/pages/home/HomePage.tsx
    - Notes: (optional) design notes shared across all breakpoints

    #### Desktop
    - Node ID: 148:4463
    - Breakpoint: >= 1280px

    #### Tablet
    - Node ID: 200:5678
    - Breakpoint: 768px – 1279px

    #### Mobile
    - Node ID: 200:1234
    - Breakpoint: < 768px

  The script will group these into ONE figma-mapping.json entry with a
  "responsiveVariants" array — all node IDs are tracked automatically.

  SINGLE-FRAME FORMAT (for pages with no responsive variants):
  ─────────────────────────────────────────────────────────────
  Just put "- Node ID:" directly under the "###" heading:

    ### About Page
    - Node ID: 300:5678
    - Component: AboutPage
    - File: src/pages/about/AboutPage.tsx
    - Notes: (optional)

  ─────────────────────────────────────────────────────────────
  How to find a Node ID:
    Open Figma → click the frame → look at Dev Mode, or copy the frame link —
    the node ID is after "node-id=" in the URL (replace dash with colon:
    "148-4463" → "148:4463")
-->

### Home Page
- Component: HomePage
- File: src/pages/home/HomePage.tsx
- Notes: Hero section with interactive hotspot markers. Mobile uses scrollable cards.

#### Desktop
- Node ID: 148:4463
- Breakpoint: >= 1280px

#### Tablet
- Node ID: 200:5678
- Breakpoint: 768px – 1279px

#### Mobile
- Node ID: 200:1234
- Breakpoint: < 768px

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
