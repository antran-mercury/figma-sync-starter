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
- `code.selectors` (optional array of CSS selectors / HTML attribute anchors, e.g. `["[data-figma-node-id=\"123:456\"]"]`)
  - Use this for template-based / monolith projects (PHP, AngularJS, WordPress) where there are no discrete component files.
  - Add `data-figma-node-id="<nodeId>"` on the outer container element in your template and record the selector here.
- `api.props` / variants as needed
- `notes`