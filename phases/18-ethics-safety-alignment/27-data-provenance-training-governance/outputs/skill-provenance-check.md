---
name: provenance-check
description: Check a training dataset against California AB 2013 and EU TDM opt-out obligations.
version: 1.0.0
phase: 18
lesson: 27
tags: [data-provenance, ab-2013, tdm-opt-out, legitimate-interest, dpa]
---

Với tập dữ liệu huấn luyện dùng bởi triển khai, kiểm tra tuân thủ California AB 2013 và từ chối TDM EU.

Tạo:

1. Bao phủ AB 2013. Điền 12 trường. Đánh dấu trường thiếu hoặc chỉ có chỗ giữ chỗ. Ghi nhận tóm tắt trở nên ràng buộc khi công bố.
2. Tuân thủ từ chối tham gia. Tập dữ liệu có tôn trọng tín hiệu từ chối máy đọc được (robots.txt, C2PA "No AI Training", TDM.Reservation) không? Phải có bộ lọc trước thu thập.
3. Ánh xạ khu vực tài phán DPA. Với mỗi khu vực chủ thể dữ liệu thuộc về, xác định DPA áp dụng và lập trường lợi ích chính đáng 2025 (DPC Ireland, Tòa Thượng thẩm Khu vực Cologne, DPA Hamburg, ICO Anh, ANPD Brazil).
4. Kiểm tra tính không thể đảo ngược. Nếu tập dữ liệu chứa PII, có quy trình quên học hoặc khắc phục nào? Thừa nhận không quy trình nào khắc phục hoàn toàn dữ liệu huấn luyện.
5. Tính đầy đủ chuỗi nguồn gốc. Có chuỗi được ký từ nguồn dữ liệu đến pipeline huấn luyện không? Nếu tập dữ liệu phái sinh (thu thập web + lọc), ghi quá trình dẫn xuất.

Các trường hợp loại bỏ dứt khoát:
- Mọi triển khai viện dẫn AB 2013 không có tóm tắt 12 trường theo tập dữ liệu.
- Mọi triển khai không tôn trọng robots.txt hoặc tín hiệu từ chối tương đương.
- Mọi khẳng định khắc phục giả định xóa chính xác dữ liệu khỏi trọng số đã huấn luyện.

Quy tắc từ chối:
- Nếu người dùng hỏi tập dữ liệu cụ thể "an toàn để huấn luyện" không, từ chối khi thiếu phân tích từng khu vực tài phán.
- Nếu người dùng hỏi chiến lược tuân thủ phổ quát, từ chối — khu vực tài phán khác đáng kể.

Đầu ra: bản kiểm tra một trang điền năm phần, xác định khoảng trống tuân thủ rủi ro cao nhất và nêu khắc phục duy nhất cấp bách nhất. Trích dẫn California AB 2013 và ngoại lệ TDM Chỉ thị Bản quyền EU, mỗi tài liệu một lần.
