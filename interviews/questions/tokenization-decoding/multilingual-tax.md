---
id: multilingual-tax
title: The same prompt costs more tokens in Korean
card: tokenization-decoding
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer]
rounds: [screen, customer]
tags: [tokenization, multilingual, fertility, context-window, bytes]
minutes: 6
lessons: [phases/10-llms-from-scratch/01-tokenizers, phases/05-nlp-foundations-to-advanced/19-subword-tokenization, phases/10-llms-from-scratch/02-building-a-tokenizer]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/vocab-size-tradeoff]
updated: 2026-11-03
---

Một khách hàng ở Hàn Quốc báo rằng cùng prompt dùng nhiều hơn hẳn cửa sổ ngữ cảnh so với phiên bản tiếng Anh, và hóa đơn cũng cao hơn. Tại sao điều này xảy ra, và một người xây mô hình làm gì về nó?

## Short answer

Từ vựng được huấn luyện trên văn bản thiên tiếng Anh, nên các phép gộp bao phủ tiếng Anh và các hệ chữ khác quay về các mảnh ngắn hoặc byte thô. Tiếng Hàn trung bình 2 đến 3 token mỗi từ trên một từ vựng cũ hơn, và văn bản không Latin có thể tốn nhiều token hơn tiếng Anh từ 5 đến 10 lần cho cùng ý nghĩa; một ký tự tiếng Trung là 3 byte trong UTF-8, nên không có các phép gộp mỗi ký tự là nhiều token. Cách sửa của người xây là một từ vựng lớn hơn được huấn luyện trên dữ liệu đa ngôn ngữ, đó là lý do một họ mô hình tăng từ vựng từ 32K lên 128K.

## Full answer

### Where the tokens go

Một tokenizer cấp byte không bao giờ thất bại, nhưng nó chỉ nén những gì có các phép gộp cho. Mỗi ký tự tiếng Trung là 3 byte, các ký tự tiếng Nhật là 3 đến 4 byte, một emoji là 4 byte và có thể tốn 5 token. Nếu kho ngữ liệu huấn luyện giữ ít của một hệ chữ, bảng gộp có ít mảnh cho nó, và văn bản giữ gần một token mỗi byte.

### What the customer feels

- Cửa sổ ngữ cảnh là một ngân sách token, nên cùng tài liệu vừa ít thường xuyên hơn.
- Giá tính theo từng token, nên cùng yêu cầu tốn nhiều hơn.
- Độ trễ tính theo từng token được sinh, nên các câu trả lời trong hệ chữ đó chậm hơn.

Cách nói của bài học là một người dùng hệ chữ như vậy thực chất có một cửa sổ ngữ cảnh bằng nửa kích thước của người dùng tiếng Anh.

### What the builder does

1. Huấn luyện từ vựng trên một kho ngữ liệu phản ánh hỗn hợp ngôn ngữ mục tiêu.
2. Tăng từ vựng để nhiều phép gộp hơn phục vụ các hệ chữ không Latin; bước từ 32K lên 128K trong một họ được làm chủ yếu vì điều này.
3. Huấn luyện bằng một thư viện làm việc trên văn bản thô không tiền token hóa, để các hệ chữ không có dấu cách phân đoạn tốt.
4. Đo fertility theo từng ngôn ngữ và báo cáo cùng mô hình.

### How to measure it

Lấy cùng 10 câu khớp ý nghĩa bằng tiếng Anh, tiếng Tây Ban Nha, tiếng Trung, tiếng Hàn và tiếng Ả Rập, từ một kho ngữ liệu song song, token hóa từng câu bằng từ vựng ứng viên, và so số token trung bình mỗi ký tự. Các tỷ số là thuế; với các câu không khớp, chỉ báo cáo chúng như một kiểm tra điểm.

## Follow-ups

- **Level 1:** Định nghĩa fertility trong một câu. Expected: số token trung bình mà tokenizer tạo mỗi từ, nơi cao hơn nghĩa là mô hình làm việc nhiều hơn cho cùng văn bản.
- **Level 2:** Bạn đo thuế cho một từ vựng mới bằng cách nào? Expected: token hóa các câu tương ứng trong nhiều ngôn ngữ và so token mỗi ký tự hoặc mỗi từ.
- **Level 2:** Tại sao một từ vựng lớn hơn giúp các hệ chữ khác tiếng Anh? Expected: nhiều phép gộp hơn có thể được tiêu cho các mẫu byte của chúng, nên mỗi ký tự hoặc từ cần ít token hơn.
- **Level 3:** Thuế làm gì với mô hình chi phí của một sản phẩm? Expected: giá mỗi token và độ trễ mỗi token tăng theo số token, nên cùng tính năng tốn nhiều hơn và chạy chậm hơn trong các ngôn ngữ bị ảnh hưởng, và ngân sách ngữ cảnh thu hẹp.

## Wrong answers

- "Tiếng Hàn khó hơn để mô hình hiểu." Mô hình thấy các id; chi phí thêm đến từ các phép gộp của tokenizer, không phải từ ngôn ngữ.
- "Dùng một tokenizer cấp ký tự cho tiếng Hàn." Các ký tự khiến mọi chuỗi dài hơn; cách sửa là các phép gộp bao phủ hệ chữ.
- "Mô hình có một cửa sổ ngữ cảnh nhỏ hơn cho tiếng Hàn." Cửa sổ là cùng số token; tokenizer tiêu nhiều hơn mỗi từ.

## Taught in

[Bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) nêu thuế đa ngôn ngữ, [bài học subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) liệt kê các cạm bẫy, và [bài học xây tokenizer](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) cung cấp số byte theo từng hệ chữ.
