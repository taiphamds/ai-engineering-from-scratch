---
id: chat-template-garbage
title: The notebook works and the service never stops talking
card: tokenization-decoding
kind: debug
level: 2
roles: [applied-ai-engineer, inference-engineer, forward-deployed-ai-engineer]
rounds: [debugging, screen]
tags: [chat-template, special-tokens, end-of-sequence, tokenizer, deployment]
minutes: 8
lessons: [phases/10-llms-from-scratch/02-building-a-tokenizer, phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/05-nlp-foundations-to-advanced/19-subword-tokenization]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/pre-tokenization-regex]
updated: 2026-11-03
---

Một mô hình chat được fine-tune trả lời tốt trong notebook huấn luyện. Dịch vụ đã triển khai, với các trọng số giống hệt, trả về văn bản lan man chạy đến giới hạn token. Bạn xem ở đâu trước, và mong đợi tìm thấy gì?

## Short answer

Ở chuỗi token phẳng mà mô hình thực sự nhận, không phải danh sách thông điệp. Một mô hình chat được huấn luyện trên một bố trí chính xác của các dấu vai trò, token đặc biệt và xuống dòng; một xuống dòng thiếu, một dấu bị đổi hoặc một dấu cách thừa đặt đầu vào ngoài phân phối huấn luyện, và token kết thúc lượt ngừng được dự đoán. In các id token của cùng yêu cầu từ cả hai đường và diff chúng, và kiểm tra các token đặc biệt đến dưới dạng các id dành riêng chứ không dưới dạng các byte đánh vần chúng.

## Full answer

### The model never sees the JSON

Dịch vụ giữ một danh sách các cặp vai trò và nội dung. Mô hình thấy một chuỗi phẳng được chat template xây, chèn các dấu như một token bắt đầu văn bản, một header cho mỗi vai trò và một token kết thúc lượt sau mỗi thông điệp, với các xuống dòng cụ thể giữa chúng. Mỗi họ mô hình bố trí điều này khác nhau. Template là một phần của mô hình, theo cùng cách từ vựng là như vậy.

### The three ways it breaks

1. **Một template khác.** Dịch vụ dùng một bố trí chung hoặc một phiên bản cũ hơn. Mỗi thông điệp giờ nằm trong một khung mô hình chưa bao giờ thấy, và dấu kết thúc lượt nó đã học vắng mặt hoặc sai chỗ, nên nó không bao giờ dự đoán token dừng.
2. **Các token đặc biệt được viết ra.** Các token đặc biệt phải được khớp chính xác trước vòng lặp gộp và ánh xạ tới các id cố định. Nếu dịch vụ xây prompt như văn bản thuần và mã hóa nó với cờ allow tắt, chuỗi dấu trở thành các byte và mảnh thông thường. Mô hình thấy văn bản trông như một dấu nhưng không phải dấu.
3. **Không khớp token dừng.** Dịch vụ dừng trên id kết thúc chuỗi chung trong khi mô hình phát ra id kết thúc lượt. Quá trình sinh tiếp tục vượt kết thúc thực.

### The check that settles it

```text
ids_notebook = tokenizer(chat_template(messages))
ids_service  = ids the service sent to the engine
diff the two lists; the first difference is the bug
```

Rồi giải mã mỗi id trở lại chuỗi và tìm một dấu được giải mã thành nhiều mảnh thay vì một id dành riêng. Nếu hai danh sách khớp, đầu vào ổn và token dừng là thứ tiếp theo: so sánh các id dừng trong cấu hình dịch vụ với id kết thúc lượt mà template đặt sau mỗi thông điệp.

### The fix

Dùng hàm template riêng của mô hình, truyền các token đặc biệt qua đường id dành riêng, và cấu hình token dừng thành id mà template kết thúc một lượt bằng nó. Đóng băng file tokenizer và template cùng với các trọng số.

## Follow-ups

- **Level 2:** Token kết thúc lượt làm gì ở suy luận? Expected: nó là tín hiệu của mô hình rằng câu trả lời hoàn chỉnh; server phải dừng trên id đó, nếu không quá trình sinh chạy đến giới hạn.
- **Level 3:** Một người dùng gõ chuỗi nguyên văn của một token đặc biệt vào hộp chat. Điều gì nên xảy ra? Expected: với cờ allow tắt nó trở thành các byte thông thường, đó là mặc định an toàn cho văn bản người dùng; với cờ bật, người dùng có thể chèn một dấu điều khiển.
- **Level 3:** Bạn kiểm thử một triển khai template bằng cách nào? Expected: xây chuỗi cho một danh sách thông điệp cố định và so từng id với đầu ra của mã template riêng của mô hình.
- **Level 4:** Template đúng và các id vẫn khác giữa notebook và dịch vụ. Còn gì nữa? Expected: một phiên bản file tokenizer khác, một bước chuẩn hóa khác, hoặc một thiết lập khác cho thêm các token đặc biệt ở đầu; băm file tokenizer và so các cờ.

## Wrong answers

- "Temperature lấy mẫu quá cao trong dịch vụ." Temperature thay đổi token nào được chọn, không thay đổi liệu token dừng có bao giờ được dự đoán không; các id khác trước khi lấy mẫu.
- "Fine-tune đã overfit." Cùng các trọng số hành xử trong notebook; khác biệt nằm trong bố trí đầu vào.
- "Cắt đầu ra trên client." Điều đó giấu triệu chứng và mô hình vẫn lãng phí tính toán trên văn bản nó không nên sinh.

## Taught in

[Bài học xây tokenizer](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) cho thấy các template và đường token đặc biệt, [capstone BPE](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) giải thích cờ allow, và [bài học subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) liệt kê các cạm bẫy drift và khoảng trắng.
