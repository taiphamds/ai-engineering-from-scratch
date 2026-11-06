---
name: rollout-runbook
description: Design a shadow → canary → A/B → 100% rollout plan for a new LLM model or prompt template, with five canary gates, noise-floor-aware thresholds, and a seconds-fast rollback path.
version: 1.0.0
phase: 17
lesson: 20
tags: [rollout, canary, shadow, progressive-delivery, feature-flags, argo-rollouts, flagger, kserve]
---

Với một thay đổi ứng viên (mô hình mới, mẫu prompt mới, chính sách bộ định tuyến mới), chỉ số sản xuất cơ sở và mức chấp nhận rủi ro, tạo một cẩm nang triển khai.

Tạo:

1. Kế hoạch bóng. Thời lượng (24-72 giờ). Chỉ số được ghi log: đầu ra, số lượng token, độ trễ, từ chối, lỗi. Cảnh báo khi: dịch chuyển chi phí >20%, dịch chuyển độ dài đầu ra >30%, bất kỳ vi phạm schema nào.
2. Tiến trình canary. Các giai đoạn (1% → 10% → 25% → 50% → 75% → 100%). Thời lượng mỗi giai đoạn (30 phút-24 giờ theo lượng lưu lượng; bảo đảm mỗi giai đoạn đủ dữ liệu cho độ tin cậy thống kê).
3. Năm cổng. Chỉ định ngưỡng chính xác cho P99 độ trễ, chi phí/yêu cầu, lỗi/từ chối, P99 độ dài đầu ra, tỷ lệ không tán thành. Đặt trên sàn nhiễu (dự kiến biến thiên không thể loại bỏ 15%).
4. Công cụ. Nêu bộ điều khiển triển khai (Argo Rollouts, Flagger, KServe) và hệ thống cờ tính năng để hoàn tác tức thì.
5. Đường hoàn tác. Ghi lại ba hành động: đổi cờ → hoàn nguyên digest được ghim → xác minh. Thời gian mục tiêu: dưới 60 giây đầu cuối.
6. Bỏ qua A/B? Giải thích. Thay đổi biến thể cải tiến bỏ qua A/B; thay đổi khác biệt rõ rệt (hành vi mới, đường cong chi phí mới) yêu cầu A/B.

Các trường hợp loại bỏ dứt khoát:
- Bỏ qua chế độ bóng. Từ chối — đột biến chi phí và suy giảm độ dài lọt qua đánh giá ngoại tuyến.
- Cổng chặt hơn biến thiên 15%. Từ chối — báo động giả sẽ dừng các đợt triển khai hợp lệ.
- Hoàn tác yêu cầu triển khai lại. Từ chối — đó không phải hoàn tác, đó là báo cáo thiệt hại.

Quy tắc từ chối:
- Nếu thay đổi quan trọng về an toàn (ví dụ: thay đổi xử lý PII), yêu cầu cổng bổ sung tường minh: không rò rỉ PII trong mẫu bóng trước khi bắt đầu canary.
- Nếu lượng lưu lượng <100 yêu cầu/giờ, yêu cầu kéo dài các giai đoạn canary — nếu không nhiễu cổng lấn át tín hiệu.
- Nếu nhóm không cung cấp được chỉ số cơ sở cho năm cổng canary, từ chối triển khai — đường cơ sở là điều kiện tiên quyết.

Đầu ra: một cẩm nang một trang với bóng, canary, cổng, công cụ, hoàn tác, định hướng A/B. Kết thúc bằng yêu cầu diễn tập hoàn tác: diễn tập hoàn tác một lần trước lần triển khai thực đầu tiên.
