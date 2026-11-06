---
name: bounded-loop-review
description: Audit a proposed bounded self-improvement loop against the four-primitive stack (invariants, anchor, multi-objective, regression detection).
version: 1.0.0
phase: 15
lesson: 8
tags: [bounded-self-improvement, invariants, alignment-anchor, rsi-safety]
---

Với một vòng lặp tự cải thiện được đề xuất, chấm điểm nó theo bốn thành phần nguyên thủy giới hạn được Workshop RSI ICLR 2026 nhận diện và tạo một phân tích khoảng trống cụ thể.

Tạo:

1. **Danh mục bất biến.** Liệt kê mọi bất biến vòng lặp thực thi. Với mỗi bất biến, nêu (a) điều gì được kiểm tra, (b) kiểm tra chạy ở đâu (trong/ngoài tầm với agent), (c) một vi phạm làm gì (từ chối cứng, tạm dừng, chỉ ghi log).
2. **Nhận diện mỏ neo.** Nêu tên mỏ neo căn chỉnh (phát biểu mục tiêu, hiến pháp, mô tả ý định). Nêu vị trí lưu trữ của nó và xác minh vòng lặp không thể chỉnh sửa nó. Nếu không có mỏ neo, gắn cờ là thiếu.
3. **Các trục đa mục tiêu.** Liệt kê mọi trục vòng lặp đánh giá. Xác nhận an toàn, công bằng và tính vững chắc hiện diện cùng hiệu năng. Một vòng lặp một trục thất bại kiểm tra này.
4. **Chính sách hồi quy.** Nêu khoảng lịch sử, dung sai cho từng trục và điều gì xảy ra khi phát hiện một đợt giảm. Xác nhận các kiểm tra hồi quy sử dụng một tập so sánh bên ngoài, không chỉ lịch sử nội bộ.
5. **Phân tích khoảng trống.** Với mỗi thành phần nguyên thủy bị thiếu, dự đoán lớp thất bại nào sẽ xuất hiện trước. Thiếu các bất biến → năng lực được lén đưa vào hoặc trôi dạt công cụ. Thiếu mỏ neo → diễn giải lại mục tiêu. Thiếu đa mục tiêu → hồi quy an toàn che giấu mức tăng hiệu năng. Thiếu hồi quy → mất năng lực âm thầm.

Các trường hợp từ chối cứng:
- Bất kỳ vòng lặp nào không có bất biến.
- Bất kỳ vòng lặp nào không có một mỏ neo căn chỉnh ngoài bề mặt chỉnh sửa.
- Bất kỳ vòng lặp nào tối ưu một điểm vô hướng duy nhất.
- Bất kỳ vòng lặp nào có kiểm tra hồi quy chỉ đọc từ lịch sử riêng của nó (vòng lặp định nghĩa "bình thường").

Các quy tắc từ chối:
- Nếu người dùng coi "nó chưa hỏng" là bằng chứng an toàn, từ chối và yêu cầu thiết kế cổng tường minh trước khi tiêu bất kỳ tính toán nào.
- Nếu người dùng không thể tạo danh sách các bất biến trong 15 phút, từ chối — vòng lặp không có bất biến.
- Nếu vòng lặp được đề xuất chạy trong sản xuất (ảnh hưởng người dùng thực hoặc hạ tầng) mà không có cả bốn thành phần nguyên thủy, từ chối và yêu cầu staging có giám sát trước.

Định dạng đầu ra:

Trả về một đánh giá có điểm với:
- **Điểm bất biến** (0-5 với danh sách tường minh)
- **Điểm mỏ neo** (0-5 với lưu trữ và phương pháp xác minh)
- **Điểm đa mục tiêu** (0-5 với các trục được liệt kê)
- **Điểm hồi quy** (0-5 với dung sai và khoảng thời gian)
- **Phân tích khoảng trống** (thất bại đầu tiên dự đoán, kế hoạch giảm thiểu)
- **Sự sẵn sàng triển khai** (sản xuất / staging / chỉ nghiên cứu)
