---
name: tool-registry
description: Build a production tool catalog and registry with JSON Schema validation, parallel dispatch, and observability.
version: 1.0.0
phase: 14
lesson: 06
tags: [function-calling, tools, schema, validation, bfcl, parallel-tools]
---

Với một miền tác vụ, tạo một danh mục công cụ mà một agent có thể sử dụng đáng tin cậy trên các trục BFCL V4 (agentic, nhiều lượt, live, non-live, ảo giác).

Tạo:

1. Các định nghĩa công cụ. Với mỗi công cụ: `name` (snake_case), `description` (cho mô hình biết khi nào sử dụng nó và khi nào KHÔNG), đầu vào JSON Schema với các thuộc tính có kiểu, các trường bắt buộc, enum ở nơi áp dụng, tối thiểu/tối đa cho các giá trị số, thời gian chờ cho từng công cụ, chính sách sandbox cho từng công cụ (bề mặt fs, mạng, giới hạn bộ nhớ).
2. Kiểm tra chất lượng mô tả. Đưa mỗi mô tả qua "điều này có cho mô hình biết khi nào chọn công cụ này thay cho những công cụ khác không?" Nếu hai công cụ có mô tả chồng lấp, từ chối và viết lại.
3. Kế hoạch phân phối song song. Với mỗi tác vụ thực tế, xác định những lời gọi công cụ nào độc lập (có thể song song hóa) và những lời gọi nào phải tuần tự. Phát ra một đồ thị phân phối được mong đợi.
4. Chính sách xác thực. Các kiểm tra enum, quy tắc ép kiểu (ví dụ "chấp nhận int dưới dạng chuỗi, từ chối float dưới dạng chuỗi"), thực thi trường bắt buộc. Mọi lỗi trả về một chuỗi quan sát có cấu trúc, không bao giờ phát sinh lên vòng lặp.
5. Khả năng quan sát. Mỗi công cụ phát ra một span OpenTelemetry GenAI `tool_call` với các thuộc tính `gen_ai.tool.name`, `gen_ai.tool.call.id`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result` (tham chiếu, không nội tuyến, khi chính sách nội dung yêu cầu).

Các trường hợp từ chối cứng:

- Công cụ shell/thực thi lệnh tổng quát. Từ chối và tách thành các động từ cụ thể (`git_status`, `fs_read`, `npm_test`).
- Thiếu enum khi tham số có một tập giá trị đóng. Xác thực enum là cách rẻ nhất để bắt sự trôi dạt.
- Cùng mô tả cho hai công cụ khác nhau. Mô hình không thể chọn giữa chúng một cách đáng tin cậy.
- `description` chỉ nêu công cụ ("Cộng hai số"). Bao gồm KHI NÀO chọn nó thay cho các lựa chọn khác.
- Không có thời gian chờ. Mọi lời gọi công cụ phải có một mức trần.

Các quy tắc từ chối:

- Nếu danh sách công cụ vượt quá 30 công cụ cho một agent đơn lẻ, từ chối và khuyến nghị ủy nhiệm cho agent phụ (Bài 17).
- Nếu bất kỳ công cụ nào thực hiện một hành động phá hủy mà không có một cổng xác nhận, từ chối và chỉ đến Bài 09 (quyền, sandbox).
- Nếu tác vụ là sử dụng máy tính (nhấp, nhập, ảnh chụp màn hình), từ chối và chỉ đến Bài 21 — đó là một hình dạng công cụ riêng với các hành động dựa trên thị giác.

Đầu ra: một danh mục công cụ JSON sẵn sàng dán vào các lời gọi SDK Anthropic / OpenAI / Gemini, một sơ đồ đồ thị phân phối, một tài liệu chính sách xác thực và một đánh giá nhỏ kiểu BFCL mà sổ đăng ký nên vượt qua.

Kết thúc bằng một chỉ dẫn "đọc gì tiếp theo": Bài 09 (sandbox), Bài 23 (các span OTel GenAI) hoặc Bài 30 (dựa trên đánh giá).
