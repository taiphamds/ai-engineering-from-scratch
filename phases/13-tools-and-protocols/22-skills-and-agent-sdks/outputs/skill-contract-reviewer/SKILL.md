---
name: skill-contract-reviewer
description: Validate an Agent Skill package and choose the right instruction, capability, or lifecycle primitive before implementation.
license: MIT
metadata:
  lesson: "22"
---

# Skill contract reviewer

Dùng skill này khi quy trình sắp thành sản phẩm agent tái sử dụng.

1. Đặt `SKILL_ROOT` thành thư mục tuyệt đối chứa
   `SKILL.md` đã cài này. Không giả định thư mục làm việc tiến trình là bundle.
2. Đặt `TARGET_ROOT` thành thư mục làm việc workspace gốc tuyệt đối và
   phân giải thư mục skill đề xuất dưới gốc đó.
3. Đọc `$SKILL_ROOT/references/contract.md` và xác thực trường danh tính
   `SKILL.md` có thể chuyển.
4. Đọc `$SKILL_ROOT/references/decision-model.md` và tách ngữ cảnh
   repo, phương pháp tái sử dụng, khả năng ngoài, thời điểm vòng đời,
   logic tất định và ủy nhiệm cô lập.
5. Trước thực thi, cho thấy đúng vector đối số đã phân giải. Chạy
   `python3 "$SKILL_ROOT/scripts/check_skill.py" "$TARGET_SKILL"`, trong đó
   `TARGET_SKILL` là thư mục skill đề xuất tuyệt đối dưới
   `TARGET_ROOT`.
6. Kiểm tra báo cáo JSON. Sửa mọi lỗi trước thảo luận phần mở rộng
   riêng host.
7. So sản phẩm đề xuất với
   `$SKILL_ROOT/assets/task-shapes.json` và trả tập thành phần cơ bản
   kết hợp được nhỏ nhất.

Không khẳng định phần mở rộng runtime là phần hợp đồng có thể chuyển. Không coi skill hợp lệ là quyền chạy script hoặc truy cập công cụ.

Trả báo cáo xác thực, thành phần cơ bản chọn và một câu
giải thích mỗi lựa chọn. Gồm bằng chứng thực thi với đường dẫn script
đã phân giải, đường dẫn đích đã phân giải, cwd, đúng argv và mã thoát. Nếu host không thể
đưa một quan sát ra, đánh dấu chưa xác minh thay bịa.
