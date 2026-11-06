---
name: mcp-contract-reviewer
description: Review MCP tool descriptors, results, pagination, completions, and parameter-header policy before exposing tools to a model.
version: 1.0.0
phase: 13
lesson: 28
tags: [mcp, tools, json-schema, pagination, completion, security]
---

Đánh giá bề mặt công cụ MCP cung cấp theo phiên bản giao thức `2026-07-28`.

Hỏi các đầu vào này nếu vắng:

1. Toàn trang bộ mô tả `tools/list`, gồm mọi trường `nextCursor`.
2. Ít nhất một kết quả thành công và một thất bại mỗi công cụ.
3. Ánh xạ header tham số Streamable HTTP, nếu dùng.
4. Tham chiếu completion, lớp bên gọi và gợi ý ví dụ.
5. Ngữ cảnh cấp quyền có thể đổi tập công cụ hiển thị.

Tạo báo cáo gọn với các mục này.

## Descriptor admission

Với mỗi công cụ:

- xác minh tên ổn định không rỗng;
- yêu cầu `inputSchema` đối tượng;
- xác định phương ngữ JSON Schema, mặc định 2020-12 khi bỏ;
- xác thực `outputSchema` khi có;
- liệt kê chú giải như gợi ý không đáng tin, không chính sách;
- trả `ADMIT`, `REJECT` hoặc `CONDITIONAL` với một lý do chính xác.

Từ chối một bộ mô tả sai dạng không từ chối công cụ hợp lệ không liên quan.

## Result contract

Với mọi kết quả đầy đủ, gồm một có `isError: true`:

- yêu cầu `resultType: complete`;
- xác thực mọi khối nội dung theo kiểu;
- coi `structuredContent` là mọi giá trị JSON, không chỉ đối tượng;
- yêu cầu `structuredContent` và tuân thủ `outputSchema` khi có;
- yêu cầu khối văn bản tương thích cho kết quả có cấu trúc;
- phân biệt liên kết tài nguyên với tài nguyên nhúng;
- nêu giới hạn kích thước và media type.

Phân loại yêu cầu sai dạng là lỗi JSON-RPC. Phân loại thất bại thực thi
xử lý được là kết quả đầy đủ với `isError: true`, không bỏ qua
hợp đồng đầu ra công bố.

## Parameter headers

Với mọi `x-mcp-header`:

- yêu cầu token tên trường HTTP hợp lệ, không rỗng;
- yêu cầu duy nhất không phân biệt hoa thường;
- yêu cầu kiểu string, integer hoặc boolean;
- duyệt toàn lược đồ đầu vào, gồm thuộc tính lồng, combinator,
  phần tử mảng và định nghĩa dùng bởi `$ref`;
- chỉ cho chú giải trên thành viên `inputSchema.properties` trực tiếp và
  từ chối mọi chú giải ở nơi khác hoặc trong `outputSchema`;
- từ chối `number` và giá trị integer ngoài `-9007199254740991` đến
  `9007199254740991`;
- từ chối trường thông tin xác thực, token, bí mật, mật khẩu, cấp quyền và PII theo chính sách triển khai;
- chỉ truyền giá trị thuần khi không rỗng, ASCII hiển thị và
  không bắt đầu `=?base64?`;
- nếu không phát đúng `=?base64?{Base64UTF8}?=` không cắt hoặc
  chuẩn hóa giá trị gốc;
- mã hóa chuỗi Unicode, rỗng, khoảng trắng, điều khiển, CR hoặc LF, có đệm và
  giống dấu báo hiệu, kết xuất boolean chữ thường;
- tại ranh giới HTTP, giải mã giá trị `Mcp-Param-*` nhận biết, so tên
  header không phân biệt hoa thường và giá trị giải mã chính xác với phần thân JSON,
  từ chối bản sao thiếu, trùng, ngoài dự kiến, sai dạng hoặc không khớp như
  HTTP `400` cộng JSON-RPC `-32020`;
- ghi tên header cuối và loại từ chối, không bao giờ giá trị đối số
  hoặc payload mã hóa.

## Pagination

Lần vết mọi yêu cầu danh sách. Tiếp tục khi `nextCursor` có và khác null, gồm chuỗi rỗng. Không bao giờ giải mã, sửa, tăng, xếp hoặc suy nghĩa từ con trỏ. Báo công cụ trùng, trang thiếu và thứ tự không ổn định.

## Completion

Với mỗi tham chiếu prompt hoặc tài nguyên:

- xác thực tham chiếu và đối số;
- lọc gợi ý qua cấp quyền bên gọi;
- giới hạn kết quả ở 100 giá trị;
- định nghĩa debounce client và giới hạn tốc độ máy chủ;
- kiểm thử tên tenant, tài nguyên và môi trường ẩn không rò.

## Verification matrix

Trả ít nhất kiểm tra này:

| Kiểm tra | Fixture | Kết quả kỳ vọng |
|------|---------|-----------------|
| Đầu ra có cấu trúc không đối tượng | Lược đồ mảng, scalar hoặc null hợp lệ | Chấp nhận khi tuân thủ |
| Đầu ra không khớp | Sai kiểu JSON hoặc thiếu thuộc tính | Từ chối trước mô hình dùng |
| Đầu ra lỗi không khớp | `isError: true` với nội dung có cấu trúc thiếu hoặc không hợp lệ | Từ chối trước mô hình dùng |
| Con trỏ rỗng | `nextCursor: ""` | Yêu cầu tiếp gửi đúng con trỏ |
| Header không an toàn | Token hoặc tên trường không hợp lệ | Bộ mô tả từ chối |
| Chú giải header lồng | `oneOf`, `items`, đối tượng lồng hoặc định nghĩa `$ref` | Bộ mô tả từ chối khi tiếp nhận toàn cây |
| Giá trị header mã hóa | Unicode, dòng mới, đệm hoặc văn bản giống dấu báo hiệu | Dấu báo hiệu base64 UTF-8 chính xác đi-về giá trị gốc |
| Giá trị header số nguyên | Cả hai biên an toàn và một giá trị ngoài mỗi biên | Biên an toàn đạt; giá trị không an toàn bị từ chối |
| Header và phần thân bằng nhau | Biến thể hoa thường, bản sao thiếu và giải mã không khớp | Biến thể hoa thường đạt; thiếu hoặc không khớp trả HTTP 400 và JSON-RPC -32020 |
| Nội dung hỗn hợp | Văn bản, media, liên kết, tài nguyên nhúng | Mỗi khối xác thực độc lập |
| Cô lập completion | Bên gọi đặc quyền thấp | Không gợi ý đặc quyền trả về |
| Phân tầng lỗi | Công cụ không biết và thất bại nghiệp vụ | Lỗi JSON-RPC và `isError: true` giữ riêng |

Từ chối phê duyệt khi bằng chứng chỉ gồm lời gọi công cụ thành công. Yêu cầu trang khám phá, quyết định tiếp nhận và fixture kết quả đã xác thực.
