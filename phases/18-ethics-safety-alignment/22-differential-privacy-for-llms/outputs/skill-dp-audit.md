---
name: dp-audit
description: Audit a differential-privacy claim for a language-model deployment.
version: 1.0.0
phase: 18
lesson: 22
tags: [differential-privacy, dp-sgd, lora, mia, pmixed]
---

Với khẳng định riêng tư cho triển khai mô hình ngôn ngữ, kiểm tra khẳng định.

Tạo:

1. Giá trị (ε, δ). ε và δ nào dùng? Bộ tính nào tính chúng (Moments Accountant, Rényi DP, GDP)? ε không có bộ tính là vô nghĩa.
2. Mục tiêu DP. Bảo đảm DP trên toàn mô hình hay adapter (LoRA)? Nếu LoRA, ghi nhớ mô hình nền không được bao phủ.
3. Giao thức MIA. Suy luận thành viên được kiểm thử bằng canary (Duan 2024) hay trích xuất (Carlini 2021, Nasr 2025)? Theo Kowalczyk và cộng sự 2025, hai cách đo điều khác nhau.
4. Kiểm tra lộ độ tin cậy. Triển khai có cung cấp điểm tin cậy không? Nếu có, tấn công Đảo ngược DP qua Phản hồi LLM áp dụng; cần cắt bớt/lượng tử hóa bổ sung.
5. So sánh cơ chế thay thế. PMixED hoặc dữ liệu tổng hợp DP có được cân nhắc không? Phương án này có thể cho mức thỏa dụng tốt hơn trên mô hình đe dọa cụ thể.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định DP không có cặp ε, δ và bộ tính.
- Mọi khẳng định DP chỉ dựa trên MIA canary.
- Mọi triển khai cung cấp điểm tin cậy không giải quyết Đảo ngược DP.

Quy tắc từ chối:
- Nếu người dùng hỏi "epsilon=8 đủ an toàn không," từ chối trả lời số; an toàn phụ thuộc mô hình đe dọa và phân phối dữ liệu dễ trích xuất nhất.
- Nếu người dùng hỏi ε khuyến nghị cho triển khai LLM, từ chối mục tiêu số phổ quát; yêu cầu mô hình đe dọa, độ nhạy dữ liệu, ràng buộc mức thỏa dụng và chi tiết bộ tính trước bàn khoảng ứng viên.

Đầu ra: bản kiểm tra một trang điền năm phần, đánh dấu thiếu bộ tính hoặc đánh giá MIA và nêu khắc phục giá trị cao nhất. Trích dẫn Abadi và cộng sự 2016 (DP-SGD) và Kowalczyk và cộng sự 2025, mỗi bài một lần.
