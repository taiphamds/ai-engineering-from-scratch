---
name: migration-agent
description: Build a repo-level code migration agent that combines deterministic recipes with an agent fallback loop, passes MigrationBench, and publishes a failure taxonomy.
version: 1.0.0
phase: 19
lesson: 09
tags: [capstone, code-migration, openrewrite, libcst, migrationbench, agent, sandbox]
---

Với một repo Java 8 hoặc Python 2 được cung cấp, tạo một nhánh đã di chuyển (sang Java 17 hoặc Python 3.12) với bộ kiểm thử xanh và mức thoái lui độ bao phủ tối thiểu. Đánh giá trên tập con 50 repo của MigrationBench.

Kế hoạch xây dựng:

1. Lượt tất định: OpenRewrite (Java) hoặc libcst (Python) chạy các phép viết lại cơ học trước. Commit thành commit "recipe" với một diff sạch.
2. Sandbox Daytona: runtime đích được cài sẵn; bản dựng theo nhánh; gắn kết nguồn chỉ đọc.
3. Vòng lặp agent: LangGraph hoặc OpenAI Agents SDK trên Claude Opus 4.7 + GPT-5.4-Codex. Công cụ: `run_build`, `read_file`, `edit_file`, `run_test`, `git_diff`. Phân loại lỗi (phụ thuộc, cú pháp, kiểm thử, công cụ dựng), áp dụng bản sửa có mục tiêu, chạy lại.
4. Trần ngân sách: 30 phút, $8, 20 lượt. Vi phạm bất kỳ giới hạn nào đều dừng và xếp vào `budget_exhausted` kèm diff hiện tại.
5. Cổng kiểm thử + độ bao phủ: bản dựng xanh rồi kiểm thử xanh; độ bao phủ không được giảm hơn 2%.
6. Mở PR với commit công thức + các commit agent + bình luận tóm tắt.
7. Hệ phân loại lỗi: nhãn cho mỗi repo từ `{dep_upgrade_required, build_tool_drift, custom_annotation, test_flake, syntax_edge_case, budget_exhausted, coverage_regression}`.
8. Chạy 50 repo trên MigrationBench; công bố tỷ lệ đạt theo lớp, chi phí trên mỗi repo, và mức bảo toàn độ bao phủ; so sánh với đường cơ sở chỉ dùng công cụ tất định.

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Tỷ lệ đạt MigrationBench | pass@1 trên tập con 50 repo |
| 20 | Bảo toàn độ bao phủ kiểm thử | Chênh lệch độ bao phủ trung bình so với nhánh cơ sở |
| 20 | Chi phí trên mỗi repo đã di chuyển | $/repo trung bình trên các lần chạy đạt |
| 20 | Tích hợp agent / công cụ tất định | Tỷ lệ bản sửa do OpenRewrite xử lý so với agent |
| 15 | Bài viết phân tích lỗi | Mức đầy đủ của hệ phân loại với các ví dụ minh họa |

Các trường hợp loại thẳng:

- Pipeline bỏ qua lượt tất định. OpenRewrite xử lý 70-80% phần cơ học rẻ hơn và đáng tin cậy hơn bất kỳ agent nào.
- Thoái lui độ bao phủ trên 2% được coi là đạt.
- PR gộp các thay đổi cơ học và do agent tạo vào một commit. Phải tách riêng.
- Báo cáo tỷ lệ đạt mà không có đường cơ sở chỉ dùng công cụ tất định tương ứng trên cùng 50 repo.

Quy tắc từ chối:

- Từ chối force-push một nhánh đã di chuyển đè lên nhánh cơ sở. Luôn là nhánh mới + PR.
- Từ chối mở một PR có CI chưa chuyển sang xanh trong sandbox.
- Từ chối chạy trên repo công ty mà không có quyền sửa đổi rõ ràng.

Đầu ra: một repo chứa pipeline di chuyển hai lớp, nhật ký chạy MigrationBench 50 repo, bảng điều khiển hệ phân loại lỗi, một lần chạy đường cơ sở chỉ dùng công cụ tất định tương ứng, và một bài viết về ba lớp lỗi phổ biến nhất cùng thay đổi công thức sẽ loại bỏ từng lớp.
