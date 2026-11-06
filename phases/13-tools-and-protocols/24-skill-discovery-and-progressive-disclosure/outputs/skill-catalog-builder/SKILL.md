---
name: skill-catalog-builder
description: Build a bounded Agent Skill catalog across explicit discovery scopes and report collisions before loading instruction bodies.
license: MIT
metadata:
  lesson: "24"
---

# Skill catalog builder

Dùng skill này khi host agent cần khám phá tất định qua hơn một thư mục skill.

1. Đọc `references/discovery-contract.md`.
2. Đánh giá chính sách host ví dụ trong `assets/scope-policy.json`; không giả định thứ tự phổ quát.
3. Chạy `python3 scripts/build_catalog.py project=PATH user=PATH` với phạm vi liệt kê từ ưu tiên cao đến thấp.
4. Kiểm tra mảng JSON `collisions` và `omitted` trước kích hoạt skill.
5. Chỉ tải phần thân SKILL.md chọn. Chỉ tải tham chiếu trực tiếp khi phần thân nêu tên.

Không bao giờ thực thi script đi kèm lúc khám phá. Không bao giờ chọn bản trùng cùng ưu tiên theo thứ tự hệ thống file tình cờ.

Trả ngân sách danh mục, mục chọn, giải quyết xung đột và bỏ sót.
