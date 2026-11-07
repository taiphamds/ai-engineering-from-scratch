---
id: schema-valid-value-wrong
title: Zero validation errors and wrong invoice totals
card: prompting-structured-output
kind: debug
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, forward-deployed-ai-engineer]
rounds: [debugging, design-review]
tags: [structured-outputs, hallucination, extraction-eval, enum]
minutes: 10
lessons: [phases/11-llm-engineering/03-structured-outputs, phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding, phases/13-tools-and-protocols/04-structured-output]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: [prompting-structured-output/json-mode-is-not-a-schema, prompting-structured-output/design-extraction-with-refusals]
updated: 2026-11-03
---

Một pipeline trích xuất với cơ chế thực thi schema nghiêm ngặt đã báo cáo không có lỗi xác thực nào trong một tháng. Một đợt rà soát tài chính phát hiện rằng một phần các tổng tiền hóa đơn được trích xuất không khớp với tài liệu nguồn, và một trường trạng thái thường chứa một giá trị được enum cho phép nhưng sai đối với tài liệu. Các kỹ sư nói schema bảo đảm tính đúng đắn. Bạn nói gì với họ, và bạn xây dựng gì?

## Short answer

Thực thi schema bảo đảm hình dạng, không bảo đảm sự thật. Một tổng tiền có đúng kiểu nhưng sai số vượt qua mọi kiểm tra định dạng, và một phần tử enum có thể được cho phép mà vẫn là phần tử sai. Xây dựng một đánh giá ngữ nghĩa: một tập tài liệu được gán nhãn với các bản ghi chuẩn, độ khớp chính xác và độ chính xác ở cấp trường cho từng trường, cùng một tín hiệu độ tin cậy từ việc trích xuất lặp lại hoặc xác suất token để chuyển các trường có độ tin cậy thấp cho con người xem xét.

## Full answer

### The failures a schema cannot see

Bài học về structured outputs liệt kê chúng ngay cả khi đã bật thực thi:

| Lỗi | Ví dụ | Tại sao schema cho nó qua |
|---|---|---|
| Giá trị bịa ra | văn bản nói một số tiền và bản ghi chứa số tiền khác | đúng kiểu, sai nội dung |
| Nhầm lẫn enum | mô hình chọn một phần tử được cho phép nhưng không phù hợp với tài liệu | phần tử nằm trong tập hợp |
| Độ dài mảng | quá nhiều hoặc quá ít mục hàng | không phải nhà cung cấp nào cũng thực thi giới hạn số mục tại thời điểm giải mã |
| Bỏ sót trường tùy chọn | một trường bị bỏ đi khi nó bất tiện | tùy chọn nghĩa là được phép vắng mặt |

Bài học về constrained decoding bổ sung hai nguyên nhân làm các giá trị tệ hơn: một ngữ pháp quá nghiêm ngặt đối với dữ liệu thiếu, đẩy mô hình đến việc bịa ra, và một trường quyết định được đặt trước phần suy luận.

### What to build

1. **Một tập được gán nhãn.** Bài tập của bài học sử dụng 50 tài liệu với các bản ghi được gán nhãn thủ công. Gán nhãn các hóa đơn thực tế, bao gồm các trường hợp khó.
2. **Các chỉ số ở cấp trường.** Độ khớp chính xác trên bản ghi, độ chính xác theo từng trường, và mức tuân thủ kiểu như một dòng kiểm tra hợp lý nên nằm gần 100 phần trăm.
3. **Độ tin cậy cho từng trường.** Chạy trích xuất ba lần và đo mức đồng thuận, hoặc đọc các xác suất token, và đánh dấu các trường không thống nhất.
4. **Một hàng đợi xem xét.** Các bản ghi có độ tin cậy thấp được chuyển đến con người trước khi đến bộ phận kế toán.
5. **Các sửa chữa schema.** Đặt một trường suy luận trước trạng thái, cung cấp cho các phần tử enum những mô tả làm rõ ý nghĩa của chúng, và thêm null hoặc một phần tử "khác" nếu nguồn có các trường hợp không phù hợp với bất kỳ phần tử nào.

### Why size does not fix it

Bài học về structured output lưu ý rằng thực thi ngữ pháp cho phép một mô hình nhỏ đánh bại một mô hình lớn hơn nhiều trên các tác vụ có cấu trúc, vì định dạng được tách khỏi kích thước mô hình. Các giá trị thì không. Chỉ một đánh giá được gán nhãn mới cho bạn biết chúng đúng thường xuyên đến mức nào.

## Follow-ups

- **Level 3:** Một schema không bao giờ thấy được lỗi nào? Expected: một giá trị đúng kiểu nhưng sai nội dung, chẳng hạn một tổng tiền được sao chép từ sai dòng.
- **Level 3:** Bạn lấy độ tin cậy cho từng trường mà không có mô hình mới bằng cách nào? Expected: chạy trích xuất ba lần và đo mức đồng thuận, hoặc đọc các xác suất token, và đánh dấu các trường không thống nhất để xem xét.
- **Level 4:** Enum trạng thái có một phần tử mà mô hình liên tục chọn sai. Các cách sửa có thể là gì? Expected: mô tả các phần tử để ý nghĩa của chúng rõ ràng, đặt một trường suy luận trước trạng thái, và kiểm tra xem nguồn có các trường hợp không phần tử nào phù hợp hay không, điều này đòi hỏi null hoặc một phần tử "khác".
- **Level 4:** Báo cáo đánh giá hoàn chỉnh trông như thế nào? Expected: mức tuân thủ schema gần 100 phần trăm như một dòng kiểm tra hợp lý, sau đó là độ khớp chính xác và độ chính xác ở cấp trường cho từng trường trên tập được gán nhãn, với tên các trường khó nhất.

## Wrong answers

- "Không có lỗi xác thực nghĩa là không có lỗi trích xuất." Xác thực kiểm tra hình dạng; đợt rà soát phát hiện các lỗi giá trị mà không kiểm tra hình dạng nào thấy được.
- "Chuyển sang một mô hình lớn hơn và các giá trị sẽ đúng." Kích thước thay đổi tỷ lệ lỗi, không thay đổi điểm mù; nếu không có đánh giá được gán nhãn, bạn không thể biết thay đổi bao nhiêu.
- "Thêm một mẫu chặt chẽ hơn vào trường tổng tiền." Một ngữ pháp chặt chẽ hơn không khiến con số trở thành đúng; một ngữ pháp quá nghiêm ngặt thậm chí đẩy mô hình đến việc bịa ra một con số.

## Taught in

Bài học [structured outputs](../../../phases/11-llm-engineering/03-structured-outputs/) liệt kê các lỗi vẫn tồn tại sau một schema và đặt ra đánh giá trích xuất được gán nhãn, bài học [constrained decoding](../../../phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/) trình bày các nguyên nhân từ ngữ pháp nghiêm ngặt và thứ tự trường, và bài học [structured output](../../../phases/13-tools-and-protocols/04-structured-output/) tách độ tin cậy của định dạng khỏi kích thước mô hình.
