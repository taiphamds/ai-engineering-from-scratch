---
name: control-protocol-audit
description: Audit a deployment protocol under the AI Control threat model.
version: 1.0.0
phase: 18
lesson: 10
tags: [ai-control, subversion, trusted-editing, untrusted-monitoring, safety-case]
---

Với mô tả giao thức triển khai, kiểm tra dưới mô hình đe dọa AI Control: U (mạnh không đáng tin), T (yếu đáng tin), H (con người đáng tin), và đo vị trí giao thức trên biên hữu ích-an toàn.

Tạo:

1. Phân vai. Xác định mô hình nào đóng U và T. Nếu T là phiên bản khác của U, đánh dấu rủi ro thông đồng ngay.
2. Tính ngân sách kiểm tra. H được phân bổ thế nào? Đồng đều, ngẫu nhiên, theo cờ? Tỷ phần đầu ra được kiểm tra kỳ vọng là bao nhiêu?
3. Liệt kê hướng thông đồng. Với mọi cặp thành phần không đáng tin (U-tạo + U-giám sát, U-tạo + U-chỉnh sửa), liệt kê hướng thông đồng: tín hiệu giấu tin, khai thác tiên nghiệm huấn luyện chung, kênh thời gian.
4. Phân tích khoảng cách năng lực. T yếu hơn U bao nhiêu? Ở điểm nào tín hiệu chỉnh sửa T thành nhiễu (ví dụ: T không phát hiện đáng tin cậy cửa hậu U tạo)?
5. Mô hình đe dọa trường hợp xấu nhất. Dưới giả định U đối kháng với kiến thức hoàn hảo về giao thức, chiến lược tốt nhất của đối thủ là gì? Tỷ phần nỗ lực red-team thành công là bao nhiêu?

Các trường hợp loại bỏ dứt khoát:
- Mọi mô tả giao thức dùng U làm bộ giám sát chính nó không có cơ chế chống thông đồng.
- Mọi khẳng định giao thức "tỷ lệ cửa hậu gần không" không có đánh giá red-team nơi red team thấy giao thức.
- Mọi kiểm tra giao thức không trình bày khoảng cách năng lực T-đến-U và ngân sách H.

Quy tắc từ chối:
- Nếu người dùng hỏi "giao thức này an toàn không," từ chối khi thiếu bằng chứng ba phần: (a) kết quả red-team, (b) ước tính khoảng cách năng lực, (c) ngân sách H.
- Nếu người dùng nhập nhằng căn chỉnh và kiểm soát ("chúng tôi căn chỉnh U nên không cần giao thức"), từ chối và trỏ Bài 9 (giả vờ căn chỉnh) — căn chỉnh là thuộc tính U; kiểm soát là thuộc tính giao thức.

Đầu ra: bản kiểm tra một trang điền năm phần trên, nêu mắt xích yếu nhất (thường là khoảng cách năng lực T-đến-U hoặc chống thông đồng), và nêu chế độ lỗi chưa giải quyết lớn nhất duy nhất. Trích dẫn Greenblatt và cộng sự (arXiv:2312.06942) một lần làm nguồn mô hình đe dọa.
