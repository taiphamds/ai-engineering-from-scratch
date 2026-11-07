---
id: structured-output-vs-function-call
title: Typed data or an action, and why the difference matters
card: prompting-structured-output
kind: tradeoff
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, system-design]
tags: [structured-outputs, function-calling, tool-use, json-schema]
minutes: 7
lessons: [phases/11-llm-engineering/09-function-calling, phases/11-llm-engineering/03-structured-outputs]
manuals: []
practice: []
cheatsheet: [structured-outputs, tool-calling]
related: [prompting-structured-output/tool-description-is-a-prompt, prompting-structured-output/json-mode-is-not-a-schema]
updated: 2026-11-03
---

Bạn cần hai thứ từ cùng một mô hình: một bản tóm tắt có kiểu của một phiếu hỗ trợ, và khả năng tra cứu tài khoản khách hàng trong cuộc hội thoại. Một đồng đội muốn xây dựng cả hai dưới dạng công cụ. Cơ chế nào phù hợp với từng thứ, và tại sao sự phân biệt này quan trọng?

## Short answer

Bản tóm tắt phiếu là structured output: dữ liệu có kiểu là sản phẩm cuối cùng, nên dùng chế độ schema và xác thực nó. Việc tra cứu tài khoản là một function call: mô hình khai báo ý định hành động, mã của bạn thực thi nó và đưa kết quả trở lại, nên đầu ra là một bước trung gian. Cả hai dùng chung cơ chế JSON Schema nhưng khác nhau ở điều xảy ra tiếp theo, và trộn lẫn chúng che khuất đầu ra nào là dữ liệu và đầu ra nào là hành động mà mã của bạn chạy.

## Full answer

### Two uses of one mechanism

| | Đầu ra có cấu trúc | Lệnh gọi hàm |
|---|---|---|
| Mô hình phát ra gì | một bản ghi khớp với một schema | một tên hàm và các đối số có kiểu |
| Điều gì xảy ra tiếp theo | mã của bạn xác thực và lưu nó | mã của bạn thực thi nó và trả kết quả về mô hình |
| Đầu ra là | sản phẩm cuối cùng | một bước trung gian |
| Phù hợp với | trích xuất, phân loại, các bản tóm tắt có kiểu | tra cứu, ghi, bất cứ thứ gì chạm vào hệ thống khác |

Bài học về function calling nêu quy tắc: dùng structured outputs khi bạn muốn dữ liệu, dùng function calling khi bạn muốn mô hình tương tác với một hệ thống bên ngoài. Mô hình không bao giờ thực thi bất cứ thứ gì; nó chỉ quyết định gọi gì và với những đối số nào.

### When tool use is the right way to get data

Bài học về structured outputs đưa ra ngoại lệ. Khi mô hình phải chọn giữa nhiều schema dựa trên đầu vào, chẳng hạn 10 schema trích xuất, việc dùng công cụ cho bạn cả sự lựa chọn và cấu trúc trong một bước. Một nhà cung cấp cũng cung cấp chế độ schema thông qua việc dùng công cụ, với schema trên đầu vào của công cụ. Trong trường hợp đó, đặt tên công cụ theo dữ liệu nó trả về, không bao giờ thực thi nó, và chuyển thẳng các đối số của nó tới bộ xác thực.

### Why the distinction matters in code

Một bản ghi được xác thực schema và kiểm tra ngữ nghĩa. Một hành động được xác thực đối số, áp dụng danh sách cho phép, làm sạch kết quả và ngân sách lệnh gọi trước khi bất cứ thứ gì chạy, vì mô hình đã chọn thứ sẽ thực thi. Nếu bản tóm tắt và việc tra cứu nằm trong một registry, các quy tắc bảo mật cho hành động hoặc bao phủ dữ liệu mà chúng không cần bao phủ, hoặc bỏ sót một hành động mà chúng nên bao phủ.

## Follow-ups

- **Level 2:** Khi nào dùng công cụ là cách phù hợp để lấy dữ liệu có cấu trúc? Expected: khi mô hình phải chọn một trong nhiều schema từ đầu vào; ví dụ của bài học là 10 schema trích xuất, trong đó việc dùng công cụ cho cả sự lựa chọn và cấu trúc cùng nhau.
- **Level 2:** Trong trường hợp tra cứu, ai chạy hàm? Expected: mã của bạn; mô hình phát ra tên và các đối số, và kết quả quay lại dưới dạng một thông điệp.
- **Level 3:** Việc xác thực giữa hai thứ khác nhau ở đâu? Expected: dữ liệu được xác thực schema và kiểm tra ngữ nghĩa; một hành động được xác thực đối số, áp dụng danh sách cho phép và ngân sách lệnh gọi trước khi nó chạy.
- **Level 3:** Một nhà cung cấp chỉ cung cấp đầu ra schema thông qua việc dùng công cụ. Bạn giữ sự phân biệt bằng cách nào? Expected: đặt tên công cụ theo dữ liệu nó trả về, không bao giờ thực thi nó, gửi các đối số của nó tới bộ xác thực như bản ghi cuối cùng, và giữ các hành động thực sự trong một registry riêng.

## Wrong answers

- "Chúng là cùng một thứ với các tên khác nhau." Chúng dùng chung cơ chế schema; một thứ tạo ra dữ liệu cuối cùng, thứ còn lại yêu cầu một hành động mà mã của bạn thực hiện.
- "Dùng function calling cho mọi thứ, nó linh hoạt hơn." Mọi công cụ là một bề mặt có thể thực thi với các quy tắc bảo mật; trích xuất dữ liệu không cần một thứ như vậy.
- "Mô hình tự chạy việc tra cứu." Mô hình không bao giờ thực thi bất cứ thứ gì; nó phát ra một lệnh gọi và mã của bạn là bộ thực thi.

## Taught in

Bài học [function calling](../../../phases/11-llm-engineering/09-function-calling/) tách dữ liệu khỏi hành động và cung cấp vòng lặp năm bước, và bài học [structured outputs](../../../phases/11-llm-engineering/03-structured-outputs/) trình bày việc dùng công cụ như một cách chọn giữa các schema.
