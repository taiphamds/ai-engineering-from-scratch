---
id: two-cache-layers
title: Two caches, and why one did not move the bill
card: cost-capacity
kind: concept
level: 1
roles: [applied-ai-engineer, forward-deployed-ai-engineer, inference-engineer]
rounds: [screen, ml-breadth]
tags: [prompt-caching, semantic-cache, cost, hit-rate]
minutes: 5
lessons: [phases/17-infrastructure-and-production/14-prompt-semantic-caching, phases/11-llm-engineering/11-caching-cost]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/cache-break-even, cost-capacity/parallel-calls-miss-the-cache]
updated: 2026-11-03
---

Một đồng đội nói dịch vụ đã có caching, vì prompt cache của nhà cung cấp đang bật. Hóa đơn gần như không thay đổi. Hai loại cache nào tồn tại trong một dịch vụ mô hình, mỗi loại bỏ qua điều gì, và tại sao một trong số chúng không làm gì cho một câu hỏi mà người dùng tiếp tục hỏi?

## Short answer

Có hai lớp. Prefix cache của nhà cung cấp tái sử dụng trạng thái attention của một tiền tố prompt mà một request trước đã tính, vì vậy các token mở đầu lặp lại rẻ hơn, nhưng mô hình vẫn chạy. Một semantic cache ở cấp ứng dụng embed request và trả về một câu trả lời đã lưu khi một câu hỏi tương tự đã được trả lời trước, vì vậy lời gọi mô hình được bỏ qua. Prefix cache không thể phục vụ một câu hỏi lặp lại, vì phần của người dùng trong prompt vẫn khác từng token và mô hình vẫn sinh câu trả lời.

## Full answer

### The provider prefix cache

Nhà cung cấp lưu các key và value của một tiền tố có thể cache. Request tiếp theo có cùng tiền tố trả một giá đọc thay vì một lần prefill đầy đủ. Phép khớp chỉ là tiền tố: token đầu tiên khác kết thúc nó, vì vậy các phần ổn định của prompt đi trước và tin nhắn người dùng đi cuối. Cache giảm chi phí đầu vào và thời gian đến token đầu tiên. Các token đầu ra tốn như trước.

### The semantic cache

Trước lời gọi, ứng dụng embed request và tìm một request đã lưu trên một ngưỡng tương đồng, thường là 0.95 hoặc cao hơn. Khi hit, nó trả về câu trả lời đã lưu và không mô hình nào chạy. Hit rate phụ thuộc vào lưu lượng. Các con số cộng đồng của bài học đặt chat mở gần 10 đến 15 phần trăm và hỗ trợ có cấu trúc gần 40 đến 70 phần trăm. Một exact cache đơn giản hơn hash mô hình, các tin nhắn và temperature, và nó chỉ phục vụ các lời gọi có tính xác định.

### Why the bill did not move

Prefix cache giảm giá các token đầu vào trên một tiền tố lặp lại. Nếu tiền tố ngắn, nếu thứ gì đó trong nó thay đổi trên mỗi request, hoặc nếu các token đầu ra chiếm phần lớn hóa đơn, có ít thứ để nó tiết kiệm. Các câu hỏi lặp lại là một loại tái sử dụng khác, và chỉ semantic cache xử lý chúng.

### Stack them

Caching nhà cung cấp xử lý tái sử dụng giống hệt token. Semantic caching xử lý tái sử dụng giống hệt ý nghĩa. Bài học caching trước kết hợp cả hai, và đặt mức giảm kết hợp ở 50 đến 95 phần trăm trên một ứng dụng điển hình.

## Follow-ups

- **Level 1:** Cache nào trả về một câu trả lời mà không chạy mô hình? Expected: semantic cache. Prefix cache vẫn chạy mô hình trên các token chưa cache và sinh đầu ra.
- **Level 2:** Mỗi người dùng hỏi một câu hỏi khác dưới cùng system prompt. Cache nào giúp? Expected: prefix cache, vì tiền tố dùng chung giống hệt và các câu hỏi thì không.
- **Level 2:** Điều gì quyết định liệu một semantic cache có đáng thêm không? Expected: hit rate trên lưu lượng riêng của bạn, trải từ khoảng 10 phần trăm trên chat mở đến khoảng 70 phần trăm trên hỗ trợ có cấu trúc, và chi phí một hit sai.
- **Level 3:** Tại sao exact cache từ chối phục vụ một lời gọi trên temperature bằng không? Expected: câu trả lời đã lưu là một mẫu. Một lời gọi yêu cầu sự biến thiên sẽ nhận một lần phát lại thay vào đó, thay đổi hành vi mà bên gọi yêu cầu.

## Wrong answers

- "Prefix cache trả về cùng câu trả lời cho cùng câu hỏi." Nó tái sử dụng trạng thái attention của tiền tố. Mô hình vẫn sinh mọi token.
- "Một semantic cache là một prefix cache với khớp mờ." Nó nằm trong ứng dụng của bạn, dùng embedding làm khóa và bỏ qua mô hình. Prefix cache nằm ở nhà cung cấp và dùng các token chính xác làm khóa.
- "Một cache là đủ." Chúng bao phủ các kiểu tái sử dụng khác nhau, token giống hệt so với ý nghĩa giống hệt, và bài học kết hợp chúng.

## Taught in

[Bài học kinh tế caching](../../../phases/17-infrastructure-and-production/14-prompt-semantic-caching/) tách hai lớp, và [bài học caching và chi phí](../../../phases/11-llm-engineering/11-caching-cost/) xây dựng các exact cache và semantic cache.
