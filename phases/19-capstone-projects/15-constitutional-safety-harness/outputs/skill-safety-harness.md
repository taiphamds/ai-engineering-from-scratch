---
name: safety-harness
description: Wire a layered safety pipeline around a target LLM app, run a six-family red-team range, and run a constitutional self-critique for a measurable harmlessness delta.
version: 1.0.0
phase: 19
lesson: 15
tags: [capstone, safety, red-team, llama-guard, x-guard, garak, pyrit, constitutional-ai]
---

Với một ứng dụng LLM đích được cung cấp (mô hình 8B được tinh chỉnh theo chỉ dẫn hoặc một chatbot RAG), gia cố nó bằng một pipeline an toàn nhiều lớp và chạy một thao trường red-team tự trị trên sáu họ tấn công. Tạo một báo cáo tính vô hại trước/sau.

Kế hoạch xây dựng:

1. Pipeline năm lớp: làm sạch đầu vào (bỏ ký tự độ rộng bằng không, giải mã mã hóa, chuẩn hóa Unicode) -> các rail NeMo Guardrails v0.12 -> cổng bộ phân loại (Llama Guard 4 / X-Guard / ShieldGemma-2 / Nemotron 3) -> LLM đích -> bộ lọc đầu ra (Llama Guard 4 + PII Presidio + kiểm tra trích dẫn). Các đầu ra được gắn cờ đi đến một hàng đợi HITL Slack.
2. Phát ra một span Langfuse cho mỗi lớp để việc quy nguồn có thể quan sát từ đầu đến cuối.
3. Bộ lập lịch red-team chạy garak, PyRIT, PAIR, TAP, GCG, nhân vật nhiều lượt, và các tấn công chuyển đổi đa ngôn ngữ theo cron.
4. Mỗi jailbreak thành công: điểm CVSS 4.0, cách tái hiện, kế hoạch giảm thiểu, lịch trình công bố.
5. Phép thăm dò prompt lành tính XSTest chạy liên tục để phát hiện các lỗi thoái lui từ chối quá mức.
6. Lần chạy tự phê bình theo hiến pháp: 1k prompt thử gây hại -> đích nháp -> bộ phê bình chấm theo một hiến pháp được viết ra -> các cặp được viết lại -> SFT. Đo trước/sau trên đánh giá tính vô hại được giữ riêng.
7. Cảnh báo: cảnh báo Slack khi thoái lui lành tính, PagerDuty nghiêm trọng khi có họ jailbreak mới.

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Độ bao phủ bề mặt tấn công | 6+ họ tấn công được thực thi, 2+ ngôn ngữ |
| 20 | Đánh đổi dương tính thật / dương tính giả | Tỷ lệ chặn tấn công so với tỷ lệ đạt lành tính XSTest |
| 20 | Chênh lệch tự phê bình | Tính vô hại trước/sau trên đánh giá được giữ riêng |
| 20 | Tài liệu và công bố | Các phát hiện được chấm CVSS với lịch trình |
| 15 | Tự động hóa và khả năng lặp lại | Do cron điều khiển, các cảnh báo được thực thi từ đầu đến cuối |

Các trường hợp loại thẳng:

- Các ngăn xếp an toàn một lớp. Luận điểm của bài tổng kết này là phòng thủ theo chiều sâu.
- Các lần chạy red-team báo cáo tỷ lệ thành công mà không có số liệu từ chối quá mức XSTest.
- Tự phê bình theo hiến pháp mà không có đánh giá được giữ riêng (báo cáo độ chính xác tập huấn luyện, không phải khả năng khái quát hóa).
- Thiếu chấm điểm CVSS trên các phát hiện jailbreak.

Quy tắc từ chối:

- Từ chối báo cáo một số liệu an toàn mà không có đối chiếu thăm dò lành tính. Có một mà không có cái còn lại là gây hiểu lầm.
- Từ chối tự động huấn luyện lại trên các thành công red-team mà không có con người tuyển chọn các cặp phê bình.
- Từ chối tuyên bố độ bao phủ đa ngôn ngữ mà không chạy X-Guard trên ít nhất hai ngôn ngữ không phải tiếng Anh.

Đầu ra: một repo chứa pipeline năm lớp, bộ lập lịch red-team, các trình chạy PAIR/TAP/GCG, harness huấn luyện tự phê bình theo hiến pháp, bảng điều khiển từ chối quá mức XSTest, bộ theo dõi phát hiện CVSS, và một bài viết nêu tên ba họ tấn công có tỷ lệ thành công cao nhất trước khi gia cố cùng lớp pipeline cụ thể đã giảm thiểu từng họ.
