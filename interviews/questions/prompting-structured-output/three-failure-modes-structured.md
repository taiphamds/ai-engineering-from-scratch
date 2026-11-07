---
id: three-failure-modes-structured
title: The three ways a structured output call fails
card: prompting-structured-output
kind: concept
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-depth]
tags: [structured-outputs, refusal, retry, strict-mode]
minutes: 7
lessons: [phases/13-tools-and-protocols/04-structured-output, phases/11-llm-engineering/03-structured-outputs]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: [prompting-structured-output/json-mode-is-not-a-schema, prompting-structured-output/design-extraction-with-refusals]
updated: 2026-11-03
---

Một dịch vụ trích xuất chuyển email đơn đặt hàng thành các bản ghi có kiểu. Nêu những cách một lệnh gọi structured output có thể thất bại, cho biết những cách nào biến mất dưới cơ chế thực thi schema nghiêm ngặt, và mô tả mã nên xử lý những gì còn lại ra sao.

## Short answer

Ba cách: một lỗi parse, trong đó đầu ra không phải JSON; một vi phạm schema, trong đó nó parse được nhưng vi phạm một kiểu, một trường bắt buộc, một enum hoặc một khoảng; và một lần từ chối, trong đó mô hình quyết định đầu vào không phù hợp với schema. Cơ chế thực thi nghiêm ngặt loại bỏ hai cách đầu ngay từ cách xây dựng đối với một phản hồi hoàn tất. Sự từ chối vẫn còn, và nó phải là một kết quả có kiểu mà mã ghi nhật ký và trả về, không bao giờ là một lần thử lại. Một phản hồi bị cắt ở giới hạn token vẫn có thể không parse được, nên hãy kiểm tra lý do dừng trước khi đọc đầu ra.

## Full answer

### Three approaches, three failure profiles

1. **Prompt yêu cầu JSON.** Hoạt động 85 đến 95 phần trăm số lần trên một mô hình tiên tiến hàng đầu. Thất bại theo sáu cách: thiếu một dấu ngoặc nhọn, dấu phẩy ở cuối, sai kiểu, các trường bịa ra, bị cắt ở giới hạn token, và văn xuôi lọt ra như "đây là JSON của bạn".
2. **Xác thực sau khi sinh.** Sinh tự do, parse, xác thực theo schema, và khi thất bại chèn lỗi vào rồi thử lại. Đáng tin cậy nhưng bạn trả tiền cho mỗi lần thử lại.
3. **Constrained decoding.** Nhà cung cấp áp mask các token không hợp lệ tại thời điểm giải mã, nên một đầu ra hoàn tất parse và xác thực được ngay từ cách xây dựng. Lỗi phía mô hình thu về một chế độ, từ chối; một phản hồi bị cắt ở giới hạn token và một lỗi yêu cầu vẫn cần đường xử lý lỗi riêng.

### The retry loop, when you are outside strict mode

```text
generate -> parse -> validate -> if fail, inject the error and retry, at most 3 times
```

Một lần thử lại thường là đủ. Ba lần bắt được các lỗi chập chờn của mô hình yếu. Vượt quá ba nghĩa là schema hoặc prompt không phù hợp với một số đầu vào, và chỗ sửa nằm ở đó, không phải ở lần thử thứ tư. Bộ xác thực nên trả về một danh sách lỗi có kiểu với một đường dẫn và một thông điệp cho mỗi lỗi, đó là hình dạng mà prompt thử lại cần.

### The refusal branch

Mô hình từ chối vì đầu vào không phù hợp, chẳng hạn email là một bài thơ chứ không phải một đơn hàng, hoặc vì một lý do an toàn. Sự từ chối mang theo lý do. Ghi nhật ký nó, trả về nó với kiểu, và không thử lại. Bài học cũng sử dụng các lần từ chối như một tín hiệu an toàn ở phía sau.

### One schema setting that matters

`additionalProperties: false` cấm các trường mà schema không nêu tên, đó là cách chế độ nghiêm ngặt đóng cửa với các trường bịa ra. Chế độ nghiêm ngặt yêu cầu nó ở mọi nơi.

## Follow-ups

- **Level 2:** Bao nhiêu lần thử lại, và việc cần nhiều hơn cho bạn biết gì? Expected: nhiều nhất ba; một thường là đủ, và vượt quá ba thì schema hoặc prompt không phù hợp với một số đầu vào.
- **Level 2:** Tại sao nhánh từ chối không được thử lại? Expected: mô hình đã từ chối vì một lý do, thường là sự phù hợp hoặc an toàn; một lần thử lại lãng phí chi phí và có thể đẩy một lần trích xuất sai đi qua.
- **Level 3:** Prompt thử lại cần gì từ bộ xác thực? Expected: một danh sách lỗi có kiểu với một đường dẫn và một thông điệp cho mỗi lỗi, để mô hình biết trường nào cần sửa.
- **Level 3:** Thiết lập schema nào chặn các trường bịa ra? Expected: additional properties đặt thành false, điều mà chế độ nghiêm ngặt yêu cầu ở mọi nơi.

## Wrong answers

- "Một lần từ chối là một lệnh gọi thất bại, hãy thử lại nó." Nó là một kết quả hạng nhất với một lý do đính kèm; ghi nhật ký nó và trả về nó với kiểu.
- "Chế độ nghiêm ngặt loại bỏ mọi lỗi." Nó loại bỏ lỗi parse và vi phạm schema đối với một phản hồi hoàn tất; các lần từ chối, phản hồi bị cắt và các giá trị sai với đúng kiểu vẫn còn.
- "Thử lại cho đến khi xác thực được." Quá ba lần thử lại thì chi phí tăng lên và schema là vấn đề thực sự.

## Taught in

Bài học [structured output](../../../phases/13-tools-and-protocols/04-structured-output/) nêu tên ba chế độ lỗi, mẫu thử lại và nhánh từ chối, và bài học [structured outputs](../../../phases/11-llm-engineering/03-structured-outputs/) trình bày việc xác thực với phản hồi lỗi.
