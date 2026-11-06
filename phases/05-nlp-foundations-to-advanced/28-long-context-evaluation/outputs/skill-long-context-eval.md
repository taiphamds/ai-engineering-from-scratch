---
name: long-context-eval
description: Design a long-context evaluation battery for a given model and use case.
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

Với một mô hình đích, độ dài ngữ cảnh đích và trường hợp sử dụng, xuất ra:

1. Các kiểm thử. Lưới độ sâu × độ dài NIAH; nhiều bước RULER; tác vụ lĩnh vực tùy chỉnh.
2. Lấy mẫu. Các độ sâu 0, 0.25, 0.5, 0.75, 1.0 ở mỗi độ dài.
3. Các thước đo. Tỷ lệ đạt truy xuất; tỷ lệ đạt suy luận; thời gian đến token đầu; chi phí mỗi truy vấn.
4. Ngưỡng cắt. Độ dài truy xuất hiệu dụng (đạt 90%) và độ dài suy luận hiệu dụng (đạt 70%). Báo cáo cả hai.
5. Hồi quy. Bộ chạy kiểm thử cố định, chạy lại ở mỗi lần nâng cấp mô hình, đưa các chênh lệch lên.

Từ chối tin một cửa sổ ngữ cảnh chỉ từ thẻ mô hình. Từ chối đánh giá chỉ NIAH cho bất kỳ khối lượng công việc nhiều bước nào. Từ chối các điểm ngữ cảnh dài nhà cung cấp tự báo cáo làm bằng chứng độc lập.
