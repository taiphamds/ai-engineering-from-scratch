---
name: wmdp-eval
description: Audit a dual-use capability claim against WMDP, unlearning evaluation, and elicitation studies.
version: 1.0.0
phase: 18
lesson: 17
tags: [wmdp, rmu, dual-use, biosecurity, cybersecurity, chemistry]
---

Với khẳng định năng lực lưỡng dụng ("mô hình chúng tôi không giúp đáng kể với vũ khí sinh học / tấn công mạng / hóa học"), kiểm tra đánh giá hỗ trợ.

Tạo:

1. Bao phủ phép đo chuẩn. WMDP (hoặc phép đo chuẩn vùng vàng tương đương) đã chạy chưa? Báo cáo điểm theo miền (sinh, mạng, hóa). Khẳng định không có số liệu theo miền không đánh giá được.
2. Dấu vết quên học. Nếu áp dụng quên học (RMU hoặc thay thế), báo cáo chênh lệch năng lực chung (MMLU, HELM, HumanEval). Quên học không báo cáo năng lực chung không đáng tin.
3. Kiểm tra đường từ chối. Phép đo chuẩn được thực hiện qua hoàn thành thô hay ngăn xếp an toàn sản xuất? Mô hình chỉ điểm thấp vì ngăn xếp an toàn vẫn có năng lực lưỡng dụng khi ngăn xếp bị vượt qua.
4. Nghiên cứu gợi năng lực. Năng lực trắc nghiệm không bằng năng lực được gia cố chống gợi. Có tham chiếu thử nghiệm thu nhận kiểu Anthropic hoặc nghiên cứu người mới trong vòng lặp tương đương không? Nếu không, khẳng định giới hạn ở bằng chứng kiểu WMDP.
5. Phân tách người mới-với-chuyên gia. Mức nâng tương đối cho người mới và năng lực tuyệt đối cho chuyên gia là đại lượng khác nhau. Cả hai có được giải quyết không?

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định an toàn lưỡng dụng không có đo năng lực tương đương WMDP.
- Mọi khẳng định quên học không có chênh lệch năng lực chung.
- Mọi khẳng định "không có mức nâng đáng kể" không có nghiên cứu người mới trong vòng lặp.

Quy tắc từ chối:
- Nếu người dùng hỏi mô hình của họ có vượt ASL-3 không, từ chối trả lời trực tiếp; ngưỡng riêng theo phòng thí nghiệm (Bài 18) và phụ thuộc gợi năng lực.
- Nếu người dùng hỏi ngưỡng WMDP "an toàn", từ chối — ngưỡng phụ thuộc khả năng chống gợi năng lực, rào cản kiến thức ngầm và bề mặt triển khai.

Đầu ra: bản kiểm tra một trang điền năm phần trên, đánh dấu bằng chứng thiếu quan trọng nhất và xác định khẳng định cấp WMDP hay cấp triển khai. Trích dẫn Li và cộng sự (arXiv:2403.03218) một lần làm nguồn phép đo chuẩn.
