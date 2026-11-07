---
id: system-user-prefill
title: The three parts of a chat call and the prefill trick
card: prompting-structured-output
kind: concept
level: 1
roles: [applied-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [system-prompt, prefill, prompt-anatomy, constraints]
minutes: 6
lessons: [phases/11-llm-engineering/01-prompt-engineering]
manuals: []
practice: []
cheatsheet: [prompt-engineering]
related: [prompting-structured-output/json-mode-is-not-a-schema]
updated: 2026-11-03
---

Hãy trình bày cho tôi ba phần của một lệnh gọi chat API và mục đích của từng phần. Sau đó cho tôi biết bạn sẽ khiến một mô hình trả về một đối tượng JSON không có lời dẫn nhập, mà không có structured output API, bằng cách nào.

## Short answer

Thông điệp system thiết lập danh tính, các quy tắc và ràng buộc đầu ra và tồn tại qua các lượt. Thông điệp user mang tác vụ và thay đổi mỗi lượt. Assistant prefill bắt đầu câu trả lời thay cho mô hình, nên một prefill là dấu ngoặc nhọn mở khiến mô hình tiếp tục dưới dạng JSON không có lời dẫn nhập, trên các nhà cung cấp chấp nhận một lượt assistant chưa hoàn chỉnh.

## Full answer

### The three parts

| Phần | Vai trò | Thời gian tồn tại |
|---|---|---|
| Thông điệp system | danh tính, các quy tắc hành vi, các quy tắc đầu ra; mô hình xem nó là ngữ cảnh có ưu tiên cao nhất | tồn tại qua các lượt |
| Thông điệp user | tác vụ hoặc câu hỏi | thay đổi mỗi lượt |
| Assistant prefill | các ký tự đầu tiên của câu trả lời, do bạn viết | một lượt |

Nếu không có thông điệp system, thông điệp user thiếu ràng buộc và mô hình lấp các khoảng trống bằng phỏng đoán.

### The prefill

Gửi một thông điệp cuối với vai trò assistant và nội dung `{`. Mô hình tiếp tục từ đó, nên câu trả lời là phần còn lại của đối tượng, và mã của bạn đặt lại dấu ngoặc ở phía trước. Không lời dẫn nhập, không hàng rào code. Ở nơi nhà cung cấp không chấp nhận một lượt assistant chưa hoàn chỉnh, hãy dùng chế độ structured output của họ thay vào đó.

### Write the instruction, not the wish

Các quy tắc của bài học cho một chỉ dẫn rõ ràng: nêu định dạng, độ dài, đối tượng đọc, những gì cần bao gồm và những gì cần loại trừ, và đưa một ví dụ về đầu ra. Ba loại ràng buộc có tác dụng: các ràng buộc phủ định loại bỏ các vùng của không gian đầu ra, các ràng buộc khẳng định bảo đảm một cấu trúc trong mọi câu trả lời, và các ràng buộc có điều kiện xử lý các trường hợp biên.

### Do not over-constrain

Một system prompt gồm 2,000 từ quy tắc để lại cho mô hình ít chỗ hơn cho tác vụ. Bài học giữ phần lớn system prompt dưới 500 token, và kiểm tra chúng để tìm mâu thuẫn, vì khi hai quy tắc xung đột mô hình chọn ngẫu nhiên một quy tắc.

## Follow-ups

- **Level 1:** Tại sao thông điệp system đứng đầu? Expected: mô hình cho nó ưu tiên cao nhất, và nó giữ nguyên trong khi các lượt user thay đổi.
- **Level 2:** Prefill tiết kiệm điều gì so với một chỉ dẫn trả lời bằng JSON? Expected: lời dẫn nhập và hàng rào code; câu trả lời bắt đầu bên trong đối tượng, nên parser thấy JSON từ ký tự đầu tiên.
- **Level 2:** System prompt của bạn đã tăng lên 2,000 từ quy tắc. Bài học nói gì? Expected: ràng buộc quá mức; mô hình dành năng lực cho các quy tắc thay vì tác vụ, và phần lớn tác vụ cần một system prompt dưới 500 token.
- **Level 3:** Bạn viết một prompt hoạt động giống nhau trên nhiều nhà cung cấp bằng cách nào? Expected: tiếng Anh đơn giản, một định dạng tường minh, các dấu phân cách kiểu XML, các chỉ dẫn ở đầu và cuối, temperature bằng không trong lúc kiểm thử, và hai hoặc ba ví dụ.

## Wrong answers

- "Thông điệp system chỉ là thông điệp user đầu tiên." Nó được xử lý với ưu tiên cao hơn và tồn tại trong khi các lượt user thay đổi.
- "Một prefill hoạt động trên mọi nhà cung cấp." Chỉ một số chấp nhận một lượt assistant chưa hoàn chỉnh; ở nơi khác hãy dùng chế độ structured output.
- "Nhiều quy tắc hơn trong system prompt nghĩa là kiểm soát nhiều hơn." Vượt qua một ngưỡng, mô hình dành năng lực cho các quy tắc; bài học giữ phần lớn system prompt dưới 500 token.

## Taught in

Bài học [prompt engineering](../../../phases/11-llm-engineering/01-prompt-engineering/) cung cấp cấu tạo của một lệnh gọi, prefill và các quy tắc cho chỉ dẫn rõ ràng.
