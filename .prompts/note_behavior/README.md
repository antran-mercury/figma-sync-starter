# 📋 Note Behavior — Hướng dẫn cho Designer

## Mục đích

Folder này chứa các ghi chú behavior/interaction từ team Design.
Designer chỉ định Figma node ID và mô tả behavior UI mong muốn.
AI sẽ đọc file này để hiểu và implement đúng behavior UI.

## Quy tắc

1. **1 node-id = 1 file**, tên file là `<node-id>.md` (thay `:` bằng `-`)
   - Ví dụ: node `148:4463` → file `148-4463.md`
2. Khi **tạo mới**: copy template bên dưới, điền vào
3. Khi **update**:
   - Di chuyển block `Latest` cũ xuống `History`
   - Viết block `Latest` mới lên trên
   - AI sẽ luôn đọc block **Latest** để implement
4. **Không xóa History** — giữ lại để AI hiểu context thay đổi

## Template

Xem file [TEMPLATE.md](./TEMPLATE.md) để copy khi tạo behavior mới.

## Change types

| Type                 | Khi nào dùng                                      |
| -------------------- | ------------------------------------------------- |
| `initial`            | Lần đầu tạo behavior                              |
| `interaction-update` | Thay đổi cách tương tác (click, hover, swipe...)   |
| `layout-change`      | Thay đổi vị trí, kích thước tooltip/hotspot        |
| `state-change`       | Thêm/bớt state (loading, error, disabled...)       |
| `animation-update`   | Thay đổi animation, transition                     |

## Cấu trúc folder

```
note_behavior/
├── README.md          ← File này — hướng dẫn cho Designer
├── TEMPLATE.md        ← Template để copy khi tạo behavior mới
├── 148-4463.md        ← Ví dụ: behavior cho node 148:4463
├── 200-1234.md        ← Ví dụ: behavior cho node khác
└── ...
```
