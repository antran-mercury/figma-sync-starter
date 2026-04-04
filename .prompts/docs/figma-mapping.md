# Figma → Code Mapping (Source of Truth)

- Machine mapping: `figma-mapping.json`
- Snapshots for diffing: `figma/exports/<timestamp>-nodes.json`
- Diff reports: `figma/reports/<date>-diff.json`

## Mapping rules
- Primary key is **Figma nodeId**.
- Never delete mappings blindly:
  - If nodeId disappears from Figma snapshot → mark entry `status=deprecated`.
  - Preserve manual fields (notes, ownership, code linkage).

## What goes into each entry
Minimum recommended fields per entry:
- `nodeId`
- `status` (active|deprecated)
- `node.name`, `node.type`, `node.pageName`, `node.frameName`
- `code.componentName`, `code.filePath`
- `api.props` / variants as needed
- `notes`