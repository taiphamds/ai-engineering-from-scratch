---
name: encoding-audit
description: Audit a jailbreak-defense report across encoding-family attacks.
version: 1.0.0
phase: 18
lesson: 14
tags: [artprompt, ascii-art, encoding-attack, utes, structural-sleight]
---

Với báo cáo phòng vệ jailbreak, liệt kê tấn công họ mã hóa được bao phủ và lớp phòng vệ bắt từng loại.

Tạo:

1. Bao phủ mã hóa. Liệt kê từng họ tấn công được đánh giá: ASCII art (ArtPrompt), base64, leet-speak, ký tự đồng hình UTF-8, JSON / YAML / CSV lồng nhau, UTES cây/đồ thị, phương thức ảnh. Đánh dấu họ thiếu.
2. Ánh xạ lớp phòng vệ. Với mỗi họ, xác định lớp phòng vệ nào (lọc từ khóa, lọc perplexity, diễn đạt lại, tách token lại, bộ phân loại đầu ra, bộ kiểm duyệt đa phương thức) bắt được và lớp nào không.
3. Khoảng trống nhận diện thị giác. Theo Jiang và cộng sự 2024, PPL và Tách token lại thất bại trước ArtPrompt vì nhận diện diễn ra ở cấp thị giác. Phòng vệ báo cáo có gì hoạt động ở cấp thị giác/cấu trúc không?
4. Kiểm thử khái quát hóa. UTES (StructuralSleight) khái quát sang cấu trúc hiếm tùy ý. Báo cáo có kiểm thử cấu trúc không nằm trong tập phòng vệ huấn luyện không?
5. Đánh đổi năng lực-an toàn. Mô hình có năng lực thị giác-văn bản mạnh hơn (điểm ViTC cao) dễ bị ArtPrompt hơn. Ghi điểm ViTC nếu báo cáo; yêu cầu nếu không.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định phòng vệ chỉ dựa trên lọc chuỗi con/từ khóa.
- Mọi khẳng định phòng vệ bao phủ một họ mã hóa và ngoại suy sang "tấn công mã hóa."
- Mọi khẳng định phòng vệ không có tỷ lệ tấn công thành công theo họ.

Quy tắc từ chối:
- Nếu người dùng hỏi ArtPrompt đã "vá" chưa, từ chối và giải thích khoảng trống phòng vệ cấp nhận diện so với cấp văn bản.
- Nếu người dùng hỏi phòng vệ mọi mã hóa được khuyến nghị, từ chối một khuyến nghị duy nhất — phòng vệ phải phân lớp trên mọi họ triển khai có thể đối mặt.

Đầu ra: bản kiểm tra một trang điền năm phần trên, đánh dấu khoảng trống mã hóa chính và nêu lớp phòng vệ duy nhất cấp bách nhất cần thêm. Trích dẫn Jiang và cộng sự (arXiv:2402.11753) và StructuralSleight, mỗi bài một lần.
