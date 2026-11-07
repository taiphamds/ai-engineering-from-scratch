---
id: evidence-id-excludes-the-path
title: Same id on two machines, refused after one deleted line
card: evidence-reverse-engineering
kind: concept
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [screen, debugging]
tags: [reverse-engineering, evidence, content-hash, canonical-json, integrity]
minutes: 8
lessons: [phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns]
manuals: [reverse-engineering-101#s-the-evidence-record, reverse-engineering-101#s-ref-errors]
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/observed-derived-inferred]
updated: 2026-11-03
---

Hai máy phân tích cùng object trong các thư mục khác nhau và nhận cùng id `ev_`. Một đồng nghiệp sao chép một bản ghi, xóa một câu giới hạn để rút ngắn, và file không còn import được. Sau đó một bundle nguyên vẹn do một bản phát hành cũ viết thất bại cùng cách. Giải thích cả ba kết quả từ quy tắc id.

## Short answer

Id là một content hash: `ev_` cộng một SHA-256 trên JSON chuẩn tắc RFC 8785 của một phép chiếu bản ghi, nơi phép chiếu giữ `digest`, `format` và `architecture` của subject, bỏ `name` và `local_path`, và hash mọi thứ khác, gồm `raw_result` và mọi giới hạn. Vì vậy một file được chuyển giữ id, một giới hạn bị bỏ thay đổi nội dung và bộ xác thực từ chối nó với "Evidence semantic identifier does not match its record", và bundle cũ thất bại vì chính quy tắc id đã thay đổi: bản phát hành cũ bỏ một giá trị `null` của `relationship_coverage` khỏi hash và bản hiện tại hash nó, vì vậy bản ghi đầu tiên có độ bao phủ `null` thất bại `evidence_integrity_mismatch`. Bằng chứng đã lưu không được di chuyển; tạo lại nó bằng bản phát hành bạn chạy.

## Full answer

### The recipe

JSON chuẩn tắc sắp xếp các khóa đối tượng, loại khoảng trắng và cố định các dạng số và chuỗi. Với các bản ghi có số là số nguyên, một `json.dumps` thư viện chuẩn với các khóa đã sắp xếp và dấu phân cách gọn tạo ra cùng các byte, là lý do vài dòng Python hoặc Node tính lại mọi id được ghi. Float bị từ chối trước hashing, vì dạng chuẩn tắc và runtime ngôn ngữ có thể in chúng khác nhau. Digest hồ sơ phân tích là một SHA-256 riêng trên `{provider, parameters}`, và một hồ sơ có provider khác provider của bản ghi bị từ chối.

### What is inside and what is outside

Một đường dẫn trong `subject` ở ngoài hash. Một đường dẫn ở bất kỳ nơi khác nằm trong: hai file được ghi không khớp vì bộ capture mask một thư mục bên trong `normalized_result` và `locations`, vì vậy một bản ghi mang đường dẫn ở đó nhận một id khác trên mọi máy. Giữ đường dẫn ngoài kết quả và vị trí trong các bản ghi riêng của bạn. Một giới hạn chủ ý là nội dung: bỏ một giới hạn làm bản ghi trông mạnh hơn các sự kiện cho phép, và một người đọc sau không thể sửa điều đó, vì vậy id hỏng.

### Rebinding without rehashing

Một bản ghi có thể được hiển thị dưới một đường dẫn mới với một rebind từ chối khi digest, định dạng hoặc kiến trúc khác. Phát lại snapshot làm tương tự khi ghi đường dẫn mục tiêu đang mở vào một bản ghi đã lưu: `evidence_id` không thay đổi, vì đường dẫn chưa bao giờ nằm trong nó.

### The error envelope

Mọi lỗi có cùng năm trường: `code`, `category`, `message`, `retryable`, `remediation.action`, và `details` tùy chọn. Bundle bị từ chối nêu bản ghi thất bại theo chỉ số và nói trường nào thất bại. `invalid_request` có thể retry với các đối số đã sửa; `evidence_integrity_mismatch` thì không.

## Follow-ups

- **Level 2:** Tại sao bỏ đường dẫn khỏi hash? Expected: cùng quan sát của cùng các byte nên mang một id trên mọi máy và trong mọi thư mục; định danh thuộc nội dung, không thuộc nơi file nằm.
- **Level 3:** Một bên tạo ghi một đường dẫn tuyệt đối vào `locations`. Điều gì xảy ra khi một đồng nghiệp import bundle? Expected: bundle không đổi vẫn import được, vì đường dẫn đã lưu hash thành id đã lưu; nhưng cùng quan sát được thực hiện trên máy đồng nghiệp mang đường dẫn của họ và nhận một id khác, và bất kỳ chỉnh sửa nào mask đường dẫn làm hỏng id. Locations giữ địa chỉ và đường dẫn artifact tương đối, không phải đường dẫn host.
- **Level 3:** Tại sao một giới hạn tính là nội dung chứ không phải một comment? Expected: không có nó bản ghi tuyên bố nhiều hơn provider, và không ai phía sau có thể biết.
- **Level 4:** Bạn xử lý bundle cũ như thế nào? Expected: tạo lại nó với bản phát hành hiện tại, vì quy tắc thay đổi và các id không được di chuyển; không bao giờ vá một id bằng tay.

## Wrong answers

- "Các id là định danh ngẫu nhiên được gán lúc ghi." Chúng là content hash, là lý do hai máy đồng ý.
- "Cắt các giới hạn để tiết kiệm token ngữ cảnh." Mỗi giới hạn được hash. Một bản ghi bị cắt với `evidence_id` cũ bị từ chối, và người đọc mất điều sự kiện không bao phủ.
- "Sửa trường id để bundle import được." Bộ xác thực tính lại hash từ nội dung, và một id được vá vẫn không khớp.

## Taught in

[Phần bản ghi bằng chứng](../../../manuals/reverse-engineering-101/sections/5-1-the-evidence-record.md) đưa ra phép chiếu và một script tính lại id, [tham chiếu lỗi](../../../manuals/reverse-engineering-101/sections/r-3-errors.md) cho thấy bundle bị từ chối, và [bài học bằng chứng](../../../phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/) tính lại mọi hash được ghi bằng Python.
