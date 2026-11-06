---
name: tom-auditor
description: Audit a multi-agent system that claims "emergent coordination." Separates real ToM-enabled coordination from prompt-dressed illusion with control conditions, statistical tests, and complementarity measurement.
version: 1.0.0
phase: 16
lesson: 18
tags: [multi-agent, theory-of-mind, coordination, evaluation, emergence]
---

Với một hệ thống đa agent tuyên bố phối hợp nổi lên, kiểm toán liệu phối hợp là thực hay một sản phẩm của kỹ thuật prompt.

Tạo ra:

1. **Trích xuất tuyên bố.** Hành vi phối hợp nào đang được tuyên bố? (phân chia lao động, dự đoán, các hành động bổ trợ, đạt đồng thuận). Nêu chính xác.
2. **Kiểm tra prompt.** Prompt hệ thống của bất kỳ agent nào có chỉ dẫn tường minh phối hợp, chọn vai trò, hoặc nhận biết nhóm không? Nếu có, gắn cờ tuyên bố là một phần được trang trí bằng prompt và thiết kế một đối chứng.
3. **Điều kiện đối chứng.** Một phiên bản hệ thống với ngôn ngữ gây phối hợp bị loại bỏ. Chỉ rõ chính xác văn bản nào thay đổi.
4. **Chỉ số.** Ít nhất một trong: khác biệt hóa gắn với danh tính, tính bổ trợ hướng mục tiêu, hiệp lực bậc cao (Riedl 2025). Không chấp nhận “các agent dường như làm việc cùng nhau” như bằng chứng.
5. **Kiểm định thống kê.** Ý nghĩa của chỉ số trên hệ thống so với đối chứng. Cỡ mẫu cần cho `p < 0.05`. Nếu `n < 50` lần thử, báo cáo lực kiểm định tường minh.
6. **Kiểm tra dung lượng mô hình.** Lặp lại so sánh trên một mô hình cơ sở nhỏ hơn. Hiệu ứng tồn tại hay biến mất? Li/Riedl đều cho thấy phụ thuộc dung lượng.
7. **Xem xét trường hợp thất bại.** Khi hệ thống thất bại, trạng thái ToM (nếu có) trông thế nào? Nhầm danh tính (liên kết niềm tin-agent hỏng) hay ảo giác nội dung (nội dung niềm tin sai)?

Các trường hợp loại bỏ dứt khoát:

- Các tuyên bố sự nổi lên không có một điều kiện đối chứng. Các tuyển tập demo không phải bằng chứng.
- Các tuyên bố biến mất dưới xem xét thống kê kỹ lưỡng (hiệu ứng dưới `p < 0.05` trên `n >= 50` lần thử). Đây là các ảo tưởng phối hợp.
- Các tuyên bố chỉ đúng trên một mô hình. Nếu một đường cơ sở mạnh nhỏ hơn cũng đạt hiệu ứng không có prompt ToM, phối hợp không do ToM thúc đẩy.
- “Các agent của chúng tôi tự tìm ra” như một giải thích cơ chế. Các tuyên bố cơ chế cần trạng thái ToM được ghi nhật ký và có thể kiểm tra.

Các quy tắc từ chối:

- Nếu hệ thống không có ghi nhật ký suy luận theo từng agent, kiểm toán không thể phân biệt phối hợp thực với ngẫu nhiên. Đề xuất thêm các nhật ký trạng thái ToM có cấu trúc trước khi kiểm toán lại.
- Nếu tác vụ có phối hợp tối ưu do oracle tính, so sánh với tối ưu thay vì đối chứng.
- Nếu tuyên bố hẹp (“phối hợp trên tác vụ một vòng”), kiểm toán có thể là một kiểm tra ngắn hơn: đo tính bổ trợ trên vòng đơn lẻ, không cần phân tích tầm thời gian dài.

Đầu ra: một kiểm toán hai trang. Bắt đầu với một kết luận một câu (“Tuyên bố phối hợp được trang trí bằng prompt: bỏ ngôn ngữ 'làm việc cùng nhau' làm chỉ số giảm từ 0.82 xuống 0.31, có ý nghĩa so với đối chứng.”), rồi bảy phần ở trên. Kết thúc bằng một danh sách sửa chữa để chuyển phối hợp được trang trí bằng prompt thành phối hợp thực: trạng thái ToM tường minh, các tầm thời gian dài hơn với ghi nhật ký, các tập hợp mô hình hỗn hợp.
