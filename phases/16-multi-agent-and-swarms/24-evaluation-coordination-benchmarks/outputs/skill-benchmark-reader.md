---
name: benchmark-reader
description: Read a multi-agent benchmark claim skeptically. Grades the claim on benchmark selection, contamination, baselines, statistical significance, task diversity, and cost disclosure.
version: 1.0.0
phase: 16
lesson: 24
tags: [multi-agent, benchmarks, evaluation, SWE-bench, MARBLE]
---

Với một tuyên bố được công bố hoặc nội bộ về hiệu năng benchmark đa agent, chấm tuyên bố và trình bày các lưu ý.

Tạo ra:

1. **Nhận diện benchmark + phần chia.** Benchmark nào (MARBLE, COMMA, MedAgentBoard, AgentArch, SWE-bench Pro, SWE-bench Verified, tùy chỉnh)? Phần chia nào (đầy đủ, giữ riêng, làm sạch nhiễm bẩn)? Các phần chia chưa biết làm bị loại.
2. **Tình trạng nhiễm bẩn.** Benchmark có sau mốc cắt huấn luyện cho mô hình đang kiểm thử không? Nếu benchmark có trước mốc cắt huấn luyện, gắn cờ rủi ro nhiễm bẩn và giảm giá trị tuyên bố.
3. **Chất lượng đường cơ sở.** So với một LLM đơn lẻ, so với ngẫu nhiên, so với công trình đa agent trước. So với cùng hệ thống chưa điều chỉnh không tính; đó là một thí nghiệm loại bỏ, không phải một đường cơ sở.
4. **Ý nghĩa thống kê.** N lần thử, khoảng tin cậy hoặc sai số chuẩn, giá trị p hoặc tương đương. Các tuyên bố không có thống kê trên N < 50 lần thử thiếu hỗ trợ.
5. **Đa dạng tác vụ.** Một tác vụ, một lĩnh vực, hay nhiều? Các tuyên bố một tác vụ không ngụ ý khái quát hóa.
6. **Tiết lộ chi phí.** Token theo từng tác vụ, thời gian thực theo từng tác vụ, chi phí đô la theo từng tác vụ. Một lời giải 90% ở chi phí 20x là một quyết định kinh doanh; không có chi phí, tuyên bố không đầy đủ.
7. **Điểm chữ + kết luận một câu.**

   - **A:** Cả sáu kiểm tra đạt; tuyên bố có khả năng vững chắc.
   - **B:** Một điểm yếu; tuyên bố hợp lý với các lưu ý được ghi nhận.
   - **C:** Hai điểm yếu; tuyên bố mang tính gợi ý nhưng cần tái lập.
   - **D:** Ba điểm yếu trở lên; tuyên bố không phải bằng chứng.
   - **F:** Vấn đề làm bị loại (nhiễm bẩn trên phần chia không tiết lộ, không thống kê, không đường cơ sở).

Các trường hợp loại bỏ dứt khoát:

- Các tuyên bố viện dẫn “SWE-bench” mà không chỉ rõ Verified so với Pro. Khoảng cách 40+ điểm khiến báo cáo mơ hồ này không thể chấp nhận.
- Các tuyên bố không có so sánh đường cơ sở. “Hệ thống của chúng tôi làm X%” là một con số, không phải một kết quả.
- Các tuyên bố dựa trên ít hơn 20 lần thử cho các hệ thống đa agent. Phương sai quá cao.
- Các tuyên bố không báo cáo chi phí cho các hệ thống đa agent. Thuế phối hợp đáng kể.

Các quy tắc từ chối:

- Nếu benchmark không có sẵn công khai và người dùng không có dấu vết kiểm toán nội bộ, không thể gán điểm. Đề xuất phát hành các hiện vật đánh giá.
- Nếu tuyên bố từ một bài báo hiện đang bình duyệt (bản tiền ấn phẩm arXiv, chưa nộp), hạ một điểm chữ như biện pháp thận trọng cho đến khi tái lập.
- Nếu người dùng chính là bên tuyên bố yêu cầu kiểm toán, chạy kiểm toán thẳng; gắn cờ khi tuyên bố chưa sẵn sàng công bố.

Đầu ra: một thẻ điểm một trang. Bắt đầu với một tóm tắt một câu (“Điểm: C — lựa chọn benchmark tốt, các đường cơ sở đầy đủ, nhưng không kiểm tra nhiễm bẩn và không tiết lộ chi phí.”), rồi bảy phần ở trên. Kết thúc bằng một danh sách theo ưu tiên về “cần sửa gì để nâng điểm.”
