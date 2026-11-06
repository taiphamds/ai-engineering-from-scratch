---
name: ai-sre-plan
description: Design an AI SRE rollout for a team — multi-agent triage architecture, structured runbooks, adversarial evaluation, narrow auto-remediation, and predictive-detection posture.
version: 1.0.0
phase: 17
lesson: 23
tags: [ai-sre, multi-agent, runbooks, auto-remediation, adversarial-eval, datadog-bits-ai, neubird, predictive]
---

Với quy mô nhóm, lượng sự cố, mức trưởng thành khả năng quan sát và mức chấp nhận rủi ro, tạo một kế hoạch SRE AI.

Tạo:

1. Kiến trúc. Đa agent: giám sát viên + agent log + agent chỉ số + agent cẩm nang vận hành + cổng con người. Ghép agent chuyên biệt với nguồn dữ liệu hiện có (Datadog, Grafana, Loki, Confluence).
2. Chuyển đổi cẩm nang vận hành. Chuyển từ Confluence phi cấu trúc sang markdown có cấu trúc với các phần triệu chứng / giả thuyết / xác minh / hành động. Quản lý phiên bản trong git.
3. Chọn sản phẩm. Datadog Bits AI, Azure SRE Agent, NeuBird Hawkeye, Incident.io Autopilot, hoặc tự làm.
4. Phạm vi tự khắc phục. Tập an toàn hẹp (khởi động lại pod, hoàn nguyên triển khai, mở rộng trong giới hạn). Danh sách cấm tường minh (cấu trúc liên kết, mã, IAM, cơ sở dữ liệu). Chính sách dưới dạng mã.
5. Đánh giá đối kháng. Chỉ định cổng đồng ý hai mô hình cho tự khắc phục. Bất đồng chuyển cấp.
6. Định hướng phát hiện dự đoán. Nếu cân nhắc (kết quả 89% MIT), nêu chính sách hành động — gọi trực, rút công việc trước, tự mở rộng quy mô — nếu không nó chỉ là bảng điều khiển.

Các trường hợp loại bỏ dứt khoát:
- Tự khắc phục không có cổng con người trên thay đổi rộng. Từ chối — nêu tập an toàn tường minh.
- Cẩm nang vận hành phi cấu trúc làm cơ sở tri thức. Từ chối — yêu cầu markdown có cấu trúc, có phiên bản.
- Cách mô tả "thiết lập rồi quên đi". Từ chối — xác định tường minh phạm vi cái gì tự chủ và cái gì không.

Quy tắc từ chối:
- Nếu lượng sự cố <10/tháng, từ chối triển khai SRE AI đầy đủ — chi phí vượt lợi ích. Chỉ khuyến nghị cẩm nang vận hành có cấu trúc.
- Nếu khả năng quan sát của nhóm chưa trưởng thành (log không tìm kiếm được, chỉ số thưa thớt), từ chối — SRE AI khuếch đại dữ liệu xấu.
- Nếu nhóm đề xuất "phát hiện dự đoán → tự khắc phục" làm tính năng đầu tiên, từ chối — xử lý câu hỏi chính sách hành động trước.

Đầu ra: một kế hoạch một trang với kiến trúc, kế hoạch cẩm nang vận hành, chọn sản phẩm, phạm vi tự khắc phục, cổng đối kháng, định hướng dự đoán. Kết thúc bằng lịch triển khai 12 tuần: tuần 1-4 cẩm nang vận hành có cấu trúc, 5-8 agent phân loại, 9-12 tự khắc phục hẹp.
