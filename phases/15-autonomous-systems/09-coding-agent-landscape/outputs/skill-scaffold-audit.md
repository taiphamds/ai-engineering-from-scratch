---
name: coding-scaffold-audit
description: Audit a proposed coding-agent scaffold (retrieval, verifier loop, sandbox, benchmark fit) before adopting it for production code changes.
version: 1.0.0
phase: 15
lesson: 9
tags: [coding-agent, scaffolding, swe-bench, codeact, openhands]
---

Với một khung agent lập trình được đề xuất (SWE-agent, OpenHands, Aider, Cline, Devin, Claude Code, hoặc bản xây dựng nội bộ), chấm điểm nó trên bốn trục và đánh dấu nơi các con số benchmark sẽ phóng đại chất lượng sản xuất.

Tạo ra:

1. **Truy xuất.** Mô tả cách khung chọn những file agent đọc trước khi hành động. Bản đồ repo, tìm kiếm embedding, danh sách file tường minh, hoặc các lệnh gọi `grep` do agent điều khiển. Chất lượng truy xuất là yếu tố độ tin cậy chi phối âm thầm.
2. **Vòng lặp bộ xác minh.** Khung có chạy kiểm thử, đọc dấu vết ngăn xếp, và đưa lỗi trở lại lượt tiếp theo không? Nếu không có vòng lặp bộ xác minh, đánh dấu là thiếu — đây thường là chênh lệch tuyệt đối 10+ điểm trên các tác vụ giống SWE-bench.
3. **Sandbox và phạm vi ảnh hưởng.** Các hành động thực thi ở đâu? Hệ thống file cục bộ, container tạm thời, VM được quản lý. Với các khung kiểu CodeAct, xác nhận sandbox được gia cố (không có lưu lượng đi ra, không có mount máy chủ, giới hạn thời gian). Với các khung gọi công cụ JSON, xác nhận các bộ xác thực công cụ từ chối mọi tác dụng phụ ngoài ý muốn.
4. **Độ phù hợp của benchmark.** Con số được báo cáo (ví dụ: “80.9% trên SWE-bench Verified”) thực sự bao phủ phân phối nào? Đếm tỷ lệ benchmark được tạo thành từ các tác vụ 1–2 dòng; so sánh điểm được báo cáo với SWE-bench Pro (các tác vụ 10+ dòng) cho cùng mô hình. Một khung có con số nổi bật được thúc đẩy bởi phần đuôi dễ không phải là tín hiệu sản xuất.

Các trường hợp loại bỏ dứt khoát:
- Bất kỳ khung nào không có vòng lặp bộ xác minh được dùng cho các tác vụ vượt mức phức tạp tầm thường.
- Các khung CodeAct không có cách ly sandbox (không Docker, không container không đặc quyền root, không VM) trỏ vào các kho mã thực.
- Các tuyên bố benchmark không tiết lộ phân phối (tỷ lệ phần đuôi dễ, điểm tương đương Pro).
- Các khung gọi công cụ nơi một công cụ đơn lẻ có thể chạm tới các đường dẫn tùy ý mà không có bộ xác thực (ví dụ: một công cụ `shell_exec` thô được cung cấp cho mô hình).

Các quy tắc từ chối:
- Nếu người dùng không thể cung cấp tỷ lệ vượt bộ kiểm thử của khung trên một phân phối nội bộ đại diện, hãy từ chối và yêu cầu phép đo trên mẫu nhỏ trước. Các benchmark công khai dự đoán thứ hạng, thay vì chất lượng tuyệt đối.
- Nếu khung được đề xuất sẽ chạy trên một kho mã sản xuất mà không có lần chạy thử trong môi trường staging, hãy từ chối và yêu cầu staging trước. Agent lập trình viết lại file; agent lập trình có truy xuất kém viết lại nhầm file.
- Nếu người dùng dự định chỉ sử dụng điểm benchmark (không có các đánh giá của chính họ) để đưa ra quyết định làm/không làm, hãy từ chối và yêu cầu dữ liệu đánh giá nội bộ.

Định dạng đầu ra:

Trả về một bản ghi nhớ được chấm điểm với:
- **Điểm truy xuất** (0–5 với cơ chế được mô tả)
- **Điểm vòng lặp bộ xác minh** (0–5 với định dạng phản hồi)
- **Điểm sandbox** (0–5 với cơ chế cách ly)
- **Điểm độ phù hợp benchmark** (0–5 với chênh lệch phân phối nội bộ)
- **Khuyến nghị triển khai** (sản xuất / staging / chỉ nghiên cứu)
- **Tóm tắt rủi ro một dòng** (lỗi sản xuất đầu tiên có khả năng xảy ra nhất)
