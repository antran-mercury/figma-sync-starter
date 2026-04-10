# 📋 Note Behavior — Designer Guide

## Purpose

This folder contains behavior/interaction notes from the Design team.
Designers specify a Figma node ID and describe the desired UI behavior.
AI reads these files to understand and implement the correct UI behavior.

## Rules

1. **1 node-id = 1 file**, filename is `<node-id>.md` (replace `:` with `-`)
   - Example: node `148:4463` → file `148-4463.md`
2. **Creating a new file**: copy the template below and fill it in
3. **Updating an existing file**:
   - Move the current `Latest` block down into `History`
   - Write the new `Latest` block at the top
   - AI always reads the **Latest** block to implement
4. **Never delete History** — keep it so AI understands the context of changes

## Template

See [TEMPLATE.md](./TEMPLATE.md) to copy when creating a new behavior file.

## Change types

| Type                 | When to use                                           |
| -------------------- | ----------------------------------------------------- |
| `initial`            | First time creating this behavior                     |
| `interaction-update` | Changing how users interact (click, hover, swipe...)  |
| `layout-change`      | Changing position or size of tooltip/hotspot          |
| `state-change`       | Adding or removing states (loading, error, disabled…) |
| `animation-update`   | Changing animation or transition                      |

## Folder structure

```
note_behavior/
├── README.md          ← This file — Designer guide
├── TEMPLATE.md        ← Template to copy when creating a new behavior file
├── 148-4463.md        ← Example: behavior for node 148:4463
├── 200-1234.md        ← Example: behavior for another node
└── ...
```
