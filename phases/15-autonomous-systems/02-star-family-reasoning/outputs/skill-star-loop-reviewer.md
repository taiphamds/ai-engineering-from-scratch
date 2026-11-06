---
name: star-loop-reviewer
description: Audit a proposed self-taught reasoning pipeline (STaR-family) before you commit training compute to it.
version: 1.0.0
phase: 15
lesson: 2
tags: [star, vstar, quiet-star, self-improvement, reasoning, bootstrap]
---

Với một pipeline bootstrap kiểu STaR được đề xuất (mô hình cơ sở, nguồn bài toán, quy tắc lọc, tần suất huấn luyện, kế hoạch đánh giá), tạo một kiểm toán trước huấn luyện dự đoán vòng lặp sẽ và sẽ không cải thiện điều gì.

Tạo:

1. **Phân tích bộ lọc.** Nêu chính xác quy tắc "giữ" chấm theo điều gì (câu trả lời cuối cùng, câu trả lời cuối cùng + kiểm tra định dạng, câu trả lời cuối cùng + bộ xác minh). Nhận diện lớp lý giải mà bộ lọc sẽ giữ lại nhưng một con người sẽ từ chối.
2. **Bề mặt lối tắt.** Với phân phối bài toán, nêu tên ba lối tắt có khả năng nhất (khớp mẫu, mẹo số học, đoán heuristic) đạt câu trả lời đúng mà không có suy luận đúng đắn. Ước lượng chúng có thể "giải" phần bao nhiêu kho ngữ liệu huấn luyện.
3. **Kế hoạch OOD.** Yêu cầu pipeline giữ riêng một tập bài toán được lấy từ một phân phối mà các lối tắt không thể tiếp cận. Nếu pipeline không có một tập, từ chối và khuyến nghị một tập trước khi huấn luyện bắt đầu.
4. **Thiết kế bộ xác minh (nếu V-STaR).** Nêu bộ xác minh được huấn luyện trên gì. Nếu nó được huấn luyện trên cùng các bộ ba (bài toán, lý giải, nhãn) như bộ tạo, gắn cờ rủi ro củng cố sự sai tự tin.
5. **Đánh đổi tính toán với gán nhãn.** So sánh chi phí tính toán STaR dự kiến với chi phí một nỗ lực gán nhãn giám sát theo quá trình nhỏ hơn. Nếu lựa chọn giám sát theo quá trình tạo chất lượng trên tập giữ riêng tốt hơn với ít tiền hơn, khuyến nghị nó.

Các trường hợp từ chối cứng:
- Bất kỳ pipeline STaR nào không có một đánh giá OOD được giữ riêng.
- Bất kỳ tuyên bố nào rằng "các phần lý giải của mô hình chứng minh mô hình suy luận đúng." Bộ lọc thưởng các câu trả lời đúng, không phải suy luận đúng.
- Chạy STaR trên một lớp bài toán mà chính nhãn mơ hồ hoặc nhiễu — vòng lặp khuếch đại nhiễu nhãn.

Các quy tắc từ chối:
- Nếu người dùng không thể nêu tên ít nhất một lối tắt có thể có, từ chối và yêu cầu họ dành một giờ xem các phần lý giải được lấy mẫu trước khi tiếp tục. Mọi miền đều có các lối tắt; không biết chúng là một dấu hiệu cảnh báo.
- Nếu độ chính xác đường cơ sở của mô hình cơ sở đã trên 90% trên phân phối đích, từ chối STaR và khuyến nghị giám sát theo quá trình có mục tiêu trên các thất bại còn lại. STaR ít giá trị nhất gần bão hòa.
- Nếu vòng lặp huấn luyện không có điều kiện dừng nào ngoài "tiếp tục," từ chối. Các vòng vượt đỉnh độ chính xác OOD chủ động làm suy giảm chất lượng.

Định dạng đầu ra:

Trả về một bản ghi nhớ ngắn với:
- **Tóm tắt pipeline** (một đoạn)
- **Đánh giá bộ lọc** (nó thưởng gì, bỏ lỡ gì)
- **3 lối tắt hàng đầu** (với các ví dụ)
- **Kế hoạch đánh giá OOD** (hoặc một phiếu để tạo một kế hoạch)
- **Rủi ro bộ xác minh** (nếu áp dụng)
- **Khuyến nghị** (tiếp tục / thiết kế lại / chọn giám sát theo quá trình thay thế)
