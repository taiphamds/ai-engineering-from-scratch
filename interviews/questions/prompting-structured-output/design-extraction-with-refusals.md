---
id: design-extraction-with-refusals
title: Design an extraction service for purchase-order emails
card: prompting-structured-output
kind: design
level: 3
roles: [applied-ai-engineer, forward-deployed-ai-engineer, agentic-ai-engineer]
rounds: [system-design, design-review]
tags: [structured-outputs, json-schema, strict-mode, refusal, extraction]
minutes: 20
lessons: [phases/13-tools-and-protocols/04-structured-output, phases/11-llm-engineering/03-structured-outputs, phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: [prompting-structured-output/three-failure-modes-structured, prompting-structured-output/schema-valid-value-wrong]
updated: 2026-11-03
---

Thiết kế dịch vụ trích xuất cho các email đơn mua hàng. Đầu vào là văn bản tự do; đầu ra là một bản ghi có kiểu với khách hàng, các dòng hàng và tổng. Bao phủ schema, chế độ thực thi, xử lý thử lại và từ chối, và cách bạn chứng minh nó hoạt động trước khi chạm hệ thống kế toán.

## Short answer

Viết một JSON Schema 2020-12 với các ràng buộc quan trọng: các trường bắt buộc, enum cho các tập đóng, giá trị tối thiểu không trên tổng, cấm thuộc tính bổ sung, và bất kỳ trường suy luận nào đứng trước bất kỳ trường quyết định nào. Chạy nó trong chế độ schema nghiêm ngặt của nhà cung cấp để một phản hồi kết thúc không thể có lỗi phân tích hoặc vi phạm schema, kiểm tra lý do dừng để một phản hồi bị cắt ở giới hạn token đến đường lỗi, và xem từ chối là một kết quả có kiểu đến hàng đợi đánh giá. Chứng minh bằng một tập email thật có nhãn được chấm theo trường, một kiểm tra từ chối trên các đầu vào không được trích xuất, và một lần chạy cạnh quy trình con người trước khi bất kỳ bản ghi nào được ghi.

## Full answer

### The schema

- `type`, `properties` và `required` cho hình dạng; mọi thuộc tính được liệt kê là bắt buộc, với null được phép nơi nguồn có thể thiếu một giá trị.
- `enum` cho các tập đóng như tiền tệ hoặc trạng thái; `minimum` trên tổng; `pattern`, `minLength` và `maxLength` trên định danh; `items` cho các dòng hàng.
- `additionalProperties: false` ở mọi nơi, chặn các trường bịa và là điều chế độ nghiêm ngặt yêu cầu.
- Thứ tự trường như logic: bất kỳ trường `reasoning` nào trước `total` hoặc `status`, vì mô hình chốt trường đầu nó viết.

Trong Python, một mô hình Pydantic sinh schema này; dịch vụ giữ schema làm hợp đồng và mô hình làm binding của nó.

### The enforcement mode

| Tình huống | Lựa chọn |
|---|---|
| Một mô hình tiên phong được host, một schema phẳng | chế độ schema nghiêm ngặt của nhà cung cấp |
| Nhiều nhà cung cấp, chấp nhận thử lại | một thư viện thử lại trên mô hình Pydantic, di chuyển được và không chạm logit |
| Một mô hình cục bộ, yêu cầu tính hợp lệ | một grammar engine, trạng thái hữu hạn cho một schema phẳng và phi ngữ cảnh cho một schema đệ quy |

Chế độ nghiêm ngặt là mặc định ở đây: một đầu ra hoàn tất phân tích và xác thực theo cấu tạo. Hai lỗi còn lại: từ chối, và một phản hồi bị cắt ở giới hạn token, vẫn có thể không phân tích được. Kiểm tra lý do dừng trước khi đọc đầu ra, và gửi một phản hồi chưa hoàn tất đến đường lỗi.

### Retry and refusal

Ngoài chế độ nghiêm ngặt: sinh, phân tích, xác thực, chèn các lỗi có kiểu và thử lại, tối đa ba lần. Hơn ba có nghĩa schema hoặc prompt sai cho một số đầu vào. Trong mọi chế độ: một từ chối là một kết quả hạng nhất có lý do gắn kèm. Ghi log, trả nó có kiểu, gửi đến hàng đợi đánh giá, và không bao giờ thử lại, vì ép một bản ghi trên đầu vào không phù hợp tạo một bản ghi bịa.

### Proof before accounting sees a record

1. **Một tập có nhãn** các email thật với các bản ghi chuẩn; bài học đầu ra có cấu trúc dùng 50 tài liệu. Báo cáo exact match, độ chính xác mỗi trường và tuân thủ kiểu.
2. **Một kiểm tra từ chối.** Tạo các đầu vào không được trích xuất, như một lời bài hát, một chứng minh hoặc một email trống, và đếm các từ chối đối chiếu các đầu ra bịa.
3. **Một độ tự tin mỗi trường** từ trích xuất lặp hoặc xác suất token, với các bản ghi độ tự tin thấp được định tuyến đến một người.
4. **Một phiên bản schema** trên mọi bản ghi, và một schema diff tách các thay đổi phá vỡ khỏi các thay đổi không phá vỡ trước bất kỳ deploy nào.
5. **Một lần chạy cạnh nhau** đối chiếu quy trình con người trên tập có nhãn, với dịch vụ không ghi gì đến khi các con số cấp trường vượt mốc bạn đặt với tài chính.

## Follow-ups

- **Level 3:** Tại sao cấm thuộc tính bổ sung? Expected: nó chặn các trường bịa, và chế độ nghiêm ngặt yêu cầu ở mọi nơi.
- **Level 3:** Bạn kỳ vọng đổi nhà cung cấp năm sau. Bạn chọn chế độ nào? Expected: một thư viện thử lại trên mô hình Pydantic cho khả năng di chuyển, hoặc giữ schema giống hệt giữa các nhà cung cấp để mỗi chế độ nghiêm ngặt nhận cùng hợp đồng.
- **Level 4:** Bạn quản lý phiên bản schema một khi các bản ghi tồn tại như thế nào? Expected: một trường phiên bản trên mỗi bản ghi và một schema diff tách các thay đổi phá vỡ khỏi không phá vỡ. Chế độ nghiêm ngặt khiến mọi trường bắt buộc, nên một trường thêm cũng phá vỡ, vì các bản ghi viết trước không chứa nó; các trường bị bỏ và kiểu thay đổi phá vỡ, và các ràng buộc nới lỏng không phá vỡ.
- **Level 4:** Thiết kế này không thể loại bỏ lỗi nào, và nó đi đâu? Expected: một giá trị sai với kiểu đúng; nó đến đánh giá cấp trường và các cờ độ tự tin, và các bản ghi độ tự tin thấp đến đánh giá.

## Wrong answers

- "Prompt cho JSON và phân tích nó, mô hình tốt." Điều đó hoạt động 85 đến 95 phần trăm thời gian và thất bại sáu cách khác nhau; kế toán cần hợp đồng.
- "Thử lại các từ chối đến khi mô hình cho một bản ghi." Một từ chối nói đầu vào không phù hợp; ép một bản ghi bịa ra một bản ghi.
- "Xác thực sau sinh tốt như chế độ nghiêm ngặt." Nó đáng tin cậy nhưng trả cho mọi lần thử lại, và một đầu ra bị cắt tốn một lượt mỗi lần.

## Taught in

Bài học [đầu ra có cấu trúc](../../../phases/13-tools-and-protocols/04-structured-output/) đưa ra các cấu trúc schema, các quy tắc chế độ nghiêm ngặt, mẫu thử lại và xử lý từ chối, bài học [các đầu ra có cấu trúc](../../../phases/11-llm-engineering/03-structured-outputs/) đặt đánh giá có nhãn và schema diff, và bài học [constrained decoding](../../../phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/) đưa ra bảng chế độ và quy tắc thứ tự trường.
