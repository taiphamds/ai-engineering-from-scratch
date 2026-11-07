---
id: tool-call-security-rules
title: Design the executor behind an agent's tool calls
card: prompting-structured-output
kind: design
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [function-calling, security, allowlist, sandbox, argument-validation]
minutes: 15
lessons: [phases/11-llm-engineering/09-function-calling]
manuals: []
practice: [tool-call-parser]
cheatsheet: [tool-calling]
related: [prompting-structured-output/tool-description-is-a-prompt, prompting-structured-output/structured-output-vs-function-call]
updated: 2026-11-03
---

Thiết kế tầng thực thi cho một agent có thể truy vấn cơ sở dữ liệu, chạy các đoạn mã nhỏ và đọc file thay mặt người dùng. Mô hình quyết định gọi công cụ nào. Bộ thực thi áp dụng các quy tắc gì, và nó không bao giờ làm gì?

## Short answer

Bộ thực thi không bao giờ chuyển thẳng SQL hoặc văn bản shell do mô hình sinh tới một hệ thống. Nó cung cấp một danh sách cho phép các hàm có tên với các tham số có kiểu, xác thực mọi đối số theo schema trước khi thực thi, làm sạch kết quả công cụ trước khi chúng trở về mô hình, và giới hạn số lệnh gọi mỗi hội thoại ở mức 10 đến 20. Đối với mã, một bộ lọc trong tiến trình là công cụ giảng dạy chứ không phải một ranh giới; mã không đáng tin cậy chạy trong một tiến trình hoặc container riêng.

## Full answer

### The five rules

1. **Không bao giờ chuyển SQL được sinh tới cơ sở dữ liệu.** Mô hình có thể và sẽ tạo ra các câu lệnh phá hoại và injection. Bài tập của bài học định hình công cụ để chấp nhận một tên bảng và các điều kiện lọc, với các bảng nằm trong danh sách cho phép và các toán tử bị giới hạn vào một tập nhỏ; mã của bạn xây dựng truy vấn.
2. **Đưa các hàm vào danh sách cho phép.** Mô hình chỉ gọi những gì bạn định nghĩa. Nếu có năm mươi hàm nội bộ, hãy cung cấp năm hàm mà người dùng cần. Không bao giờ xây dựng một công cụ gọi theo tên tổng quát.
3. **Xác thực các đối số.** Kiểm tra các trường bắt buộc, các trường không xác định, các kiểu và tư cách phần tử enum theo schema trước khi thực thi; một tên thành phố có thể mang một chuỗi injection.
4. **Làm sạch các kết quả.** Một kết quả công cụ quay lại prompt nguyên văn, nên hãy loại bỏ các khóa, dữ liệu cá nhân và các lỗi nội bộ, và xem các chỉ dẫn bên trong một kết quả là tool poisoning.
5. **Giới hạn các lệnh gọi.** Một vòng lặp có thể gọi một công cụ hàng trăm lần; 10 đến 20 lệnh gọi mỗi hội thoại là khoảng của bài học, với số lần thử lại có giới hạn cho mỗi lệnh gọi thất bại.

### The file tool

Từ chối mọi đường dẫn có tham chiếu cha hoặc một dấu gạch chéo ở đầu, và trả về một lỗi có cấu trúc với danh sách các file tồn tại. Hình dạng lỗi quan trọng: một thông điệp, một mã và các gợi ý cho phép mô hình sửa các đối số; một phản hồi trống hoặc một lỗi chung chung thì không.

### The code tool

Một danh sách chặn chuỗi con đọc mã như văn bản và bỏ sót bất cứ thứ gì nó không viết ra theo nghĩa đen. Parse mã thành một cây cú pháp cho phép biện pháp bảo vệ từ chối import, truy cập thuộc tính dunder và các tên không an toàn theo cấu trúc. Ngay cả khi đó, biện pháp bảo vệ dùng chung trình thông dịch với mã nó chạy, và một bên gọi quyết tâm sẽ tìm ra các đối tượng có thể tiếp cận. Production chạy mã không đáng tin cậy trong một tiến trình riêng với đặc quyền bị giảm, trong một sandbox hoặc trong một runner được lưu trữ, nên một lần thoát ra sẽ rơi vào một máy dùng xong bỏ.

### What the model never does

Nó không bao giờ thực thi bất cứ thứ gì. Nó phát ra một tên và các đối số. Mọi thứ sau đó là mã của bạn, và mọi quy tắc ở trên nằm ở đó.

## Follow-ups

- **Level 3:** Tại sao một danh sách chặn chuỗi con không đủ cho công cụ mã? Expected: nó khớp cách viết, không khớp cấu trúc; một cây cú pháp đã parse từ chối import, truy cập dunder và các tên không an toàn theo hình dạng, và ngay cả điều đó cũng dùng chung trình thông dịch với mã.
- **Level 3:** Bạn định hình công cụ cơ sở dữ liệu để mô hình không bao giờ viết SQL bằng cách nào? Expected: chấp nhận một tên bảng và các điều kiện lọc, đưa các bảng vào danh sách cho phép, giới hạn các toán tử, và xây dựng truy vấn trong mã của bạn.
- **Level 4:** Tool poisoning là gì và biện pháp kiểm soát nằm ở đâu? Expected: các kết quả mang chỉ dẫn cho mô hình; làm sạch mọi kết quả trước khi nó trở về, và loại bỏ dữ liệu nhạy cảm như các khóa và lỗi nội bộ.
- **Level 4:** Agent lặp trên một công cụ thất bại. Điều gì chặn nó? Expected: một số lệnh gọi tối đa mỗi hội thoại, 10 đến 20 trong bài học, các lỗi có cấu trúc cho phép mô hình sửa các đối số, và một trần thử lại khoảng 3 cho mỗi lệnh gọi.

## Wrong answers

- "Mô hình hành xử tốt, tham số hóa sau." Mô hình có thể và sẽ sinh các truy vấn phá hoại hoặc injection; quy tắc là không bao giờ chuyển SQL của nó qua.
- "Một công cụ chạy-bất-kỳ-hàm-nào tổng quát đơn giản hơn." Danh sách cho phép là quy tắc: cung cấp năm hàm mà người dùng cần, không phải cả năm mươi.
- "Bộ lọc mã chặn import, nên nó an toàn." Nó dùng chung trình thông dịch với mã nó chạy; production dùng một tiến trình hoặc container riêng.

## Taught in

Bài học [function calling](../../../phases/11-llm-engineering/09-function-calling/) nêu năm quy tắc bảo mật, xây dựng bộ xác thực đối số và các biện pháp bảo vệ file và mã, và đặt ngân sách lệnh gọi.
