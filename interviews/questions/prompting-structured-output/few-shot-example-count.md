---
id: few-shot-example-count
title: How many examples go in the prompt, and which ones
card: prompting-structured-output
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-depth]
tags: [few-shot, example-selection, context-budget, classification]
minutes: 7
lessons: [phases/11-llm-engineering/02-few-shot-cot, phases/11-llm-engineering/01-prompt-engineering, phases/11-llm-engineering/15-prompt-caching]
manuals: []
practice: []
cheatsheet: [prompt-engineering]
related: [prompting-structured-output/cot-when-it-hurts]
updated: 2026-11-03
---

Một prompt phân loại có tám nhãn đầu ra. Một kỹ sư muốn hai mươi ví dụ trong prompt cho chắc, một người khác muốn không ví dụ và một instruction dài hơn. Bạn bao gồm bao nhiêu ví dụ, những ví dụ nào, và điều gì quyết định?

## Short answer

Ba đến năm cho phần lớn tác vụ, và với một bộ phân loại nhiều nhãn, một ví dụ mỗi nhãn, nên tám ở đây. Chọn các ví dụ gần ngữ nghĩa với đầu vào và bao phủ mọi nhãn, vì các ví dụ tương tự thắng các ví dụ ngẫu nhiên 5 đến 15 phần trăm trên phân loại. Dưới ba, mô hình có quá ít tín hiệu để trích xuất mẫu; trên năm, bạn trả token ngữ cảnh trên mọi lời gọi cho lợi ích giảm dần.

## Full answer

### Examples are compressed instructions

Thay vì mô tả định dạng, bạn cho thấy nó. Thay vì giải thích suy luận, bạn minh họa nó. Mô hình khớp một mẫu đáng tin cậy hơn diễn giải một quy tắc trừu tượng. Trên các tác vụ sentiment đơn giản, zero-shot và few-shot nằm trong 2 phần trăm của nhau; trên số học nhiều bước và suy luận ký hiệu, các ví dụ thêm 10 đến 25 phần trăm.

### Which examples

1. **Độ tương tự ngữ nghĩa.** Chọn các ví dụ gần đầu vào nhất trong không gian embedding. Lúc yêu cầu, điều này có nghĩa một pool ví dụ có nhãn và một lựa chọn láng giềng gần nhất mỗi truy vấn.
2. **Đa dạng nhãn.** Bao phủ mọi nhóm đầu ra, nếu không mô hình không bao giờ thấy một nhãn tồn tại.
3. **Khớp độ khó.** Khớp độ phức tạp vấn đề mục tiêu.

### The cost side

Few-shot thêm 200 đến 500 token vào mọi lời gọi. Hai điều giữ nó rẻ. Giữ số lượng ở điểm gối, ba đến năm. Và nếu các ví dụ là một tập cố định, đặt chúng trong phần ổn định của prompt, sau system message và các định nghĩa công cụ và trước bất cứ thứ gì thay đổi mỗi yêu cầu, để một prefix cache phục vụ chúng ở giá giảm. Các ví dụ được chọn mỗi truy vấn bằng láng giềng gần nhất thay đổi giữa các yêu cầu, và một prefix cache dừng ở token khác biệt đầu tiên. Đặt chúng dưới cache breakpoint: system message và các định nghĩa công cụ phía trên vẫn cache hit, và các ví dụ trả giá đầy đủ.

### When zero-shot wins

Các câu hỏi sự thật đơn giản, các tác vụ sáng tạo nơi ví dụ ràng buộc đầu ra, và các tác vụ nơi tìm ví dụ tốt khó hơn viết một instruction tốt. Bài học prompt engineering vẫn khuyến nghị hai hoặc ba ví dụ cho một prompt phải hành xử giống nhau giữa các nhà cung cấp, vì các ví dụ chuyển tốt hơn chỉ instruction.

## Follow-ups

- **Level 2:** Khi nào zero-shot thắng? Expected: các câu hỏi sự thật đơn giản, các tác vụ sáng tạo nơi ví dụ ràng buộc, và các tác vụ nơi khó tìm ví dụ tốt hơn một instruction tốt.
- **Level 2:** Các ví dụ làm gì mà một instruction không thể? Expected: chúng cho thấy định dạng và suy luận thay vì mô tả, và mô hình khớp một mẫu được cho thấy đáng tin cậy hơn diễn giải một quy tắc.
- **Level 3:** Bạn chọn các ví dụ lúc yêu cầu như thế nào? Expected: embed một pool có nhãn và chọn các ví dụ gần đầu vào nhất trong khi giữ bao phủ nhãn; bài học đo mức tăng 5 đến 15 phần trăm so với lựa chọn ngẫu nhiên.
- **Level 3:** Các ví dụ tốn 200 đến 500 token trên mọi lời gọi. Bạn hạn chế điều đó như thế nào? Expected: giữ số lượng ở ba đến năm; đặt một tập ví dụ cố định trong prefix ổn định để prompt cache phục vụ ở giá giảm, và đặt các ví dụ chọn mỗi truy vấn dưới breakpoint, vì chúng thay đổi trên mọi yêu cầu.

## Wrong answers

- "Nhiều ví dụ hơn luôn an toàn hơn." Trên năm, lợi ích giảm dần và mọi ví dụ tốn ngữ cảnh trên mọi lời gọi.
- "Các ví dụ ngẫu nhiên ổn, mô hình tổng quát hóa." Các ví dụ tương tự thắng các ví dụ ngẫu nhiên 5 đến 15 phần trăm trên phân loại.
- "Mô tả các nhãn chi tiết và bỏ ví dụ." Với một tác vụ nhạy định dạng có nhiều nhãn, các ví dụ truyền mẫu tốt hơn một mô tả, và cả giữa các nhà cung cấp.

## Taught in

Bài học [few-shot và chain-of-thought](../../../phases/11-llm-engineering/02-few-shot-cot/) đưa ra các số lượng và nguyên tắc lựa chọn, bài học [prompt engineering](../../../phases/11-llm-engineering/01-prompt-engineering/) khuyến nghị các ví dụ cho các prompt xuyên nhà cung cấp, và bài học [prompt caching](../../../phases/11-llm-engineering/15-prompt-caching/) đặt chúng trong prefix có thể cache.
