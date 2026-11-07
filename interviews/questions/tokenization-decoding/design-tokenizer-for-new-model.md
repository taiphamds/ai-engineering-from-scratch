---
id: design-tokenizer-for-new-model
title: Design the tokenizer for a multilingual coding model
card: tokenization-decoding
kind: design
level: 4
roles: [ai-data-engineer, applied-ai-engineer, inference-engineer]
rounds: [system-design, design-review]
tags: [tokenizer-design, vocabulary-size, character-coverage, multilingual, code]
minutes: 15
lessons: [phases/05-nlp-foundations-to-advanced/19-subword-tokenization, phases/10-llms-from-scratch/01-tokenizers, phases/10-llms-from-scratch/02-building-a-tokenizer]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/vocab-size-tradeoff, tokenization-decoding/multilingual-tax, tokenization-decoding/tokenizer-drift-ci]
updated: 2026-11-03
---

Bạn đang bắt đầu một mô hình 7B phải phục vụ nhiều ngôn ngữ và cũng mạnh về mã. Thiết kế tokenizer của nó: thuật toán, thư viện, kích thước từ vựng, các thiết lập độ bao phủ, và kế hoạch xác thực mà bạn sẽ dùng làm cổng cho lần huấn luyện.

## Short answer

Huấn luyện một từ vựng subword có byte fallback trên một kho ngữ liệu phản ánh hỗn hợp ngôn ngữ và mã mục tiêu, với một bộ tiền token hóa giữ dấu cách đầu và tách các chữ số và dấu câu để mã được token hóa gọn. Với một mô hình trong khoảng 1 đến 10B, heuristic là 50 đến 100k token, và yêu cầu đa ngôn ngữ đẩy lên đầu trên khoảng đó hoặc vượt nó; đặt độ bao phủ ký tự gần 0.9995 để các hệ chữ hiếm được giữ thay vì ánh xạ thành không biết. Đặt cổng theo token mỗi từ mỗi ngôn ngữ, tỷ lệ không biết, tỷ lệ nén so với một bộ mã hóa tham chiếu và một round trip chính xác từng byte, và đóng băng hash file tokenizer trong CI trước bước huấn luyện đầu.

## Full answer

### Algorithm and library

Bảng của bài học chỉ tới thuật toán dựa trên cắt được huấn luyện trên văn bản thô cho công việc đa ngôn ngữ, vì nó không cần tiền token hóa riêng theo ngôn ngữ và xử lý các hệ chữ không có dấu cách, và tới thuật toán dựa trên gộp cho các kho ngữ liệu đơn ngữ. Với một yêu cầu hỗn hợp, cách nào cũng hoạt động nếu kho ngữ liệu đúng; hỗn hợp kho ngữ liệu quyết định nhiều hơn thuật toán. Dùng một thư viện có huấn luyện, không phải một thư viện chỉ mã hóa theo từ vựng của người khác. Giữ byte fallback bật trong cả hai trường hợp để không đầu vào nào không biết.

### Vocabulary size

| Quy mô mô hình | Heuristic |
|---|---|
| dưới 1B | khoảng 32k |
| 1 đến 10B | 50 đến 100k |
| đa ngôn ngữ hoặc tiên tiến hàng đầu | 200k trở lên |

Một mô hình 7B với nhiều hệ chữ nằm ở đầu trên của dòng giữa. Mỗi dòng thêm là một embedding phải học, và ma trận embedding ở 128,000 dòng nhân 4,096 chiều là khoảng 524M tham số, nên kích thước là một quyết định ngân sách chứ không phải một hằng số. Lợi ích là fertility: một từ vựng thiên tiếng Anh cho các hệ chữ khác 2 đến 3 token mỗi từ hoặc tệ hơn, và văn bản không Latin có thể tốn nhiều token hơn 5 đến 10 lần; từ vựng đa ngôn ngữ lớn hơn là thứ sửa điều đó.

### Coverage and code

- Độ bao phủ ký tự gần 0.9995 cho một kho ngữ liệu hỗn hợp; từ chối bất cứ thứ gì dưới 0.995 khi các hệ chữ hiếm hiện diện.
- Byte fallback cho mọi thứ độ bao phủ vẫn bỏ lỡ.
- Một bộ tiền token hóa giữ dấu cách đầu trên các từ, tách các chuỗi chữ số và dấu câu, và xử lý các chuỗi khoảng trắng, để thụt lề và các toán tử trong mã trở thành các mảnh ổn định. Các ký tự tiếng Trung dài 3 byte mỗi ký tự và cần các phép gộp riêng, nên kho ngữ liệu phải chứa đủ chúng.
- Dành riêng các token đặc biệt và các dấu chat ở đầu, với các id cố định mà không phép gộp nào có thể tạo.

### The corpus

Lấy mẫu văn bản huấn luyện cho tokenizer theo các tỷ lệ mà bạn muốn mô hình giỏi. Một từ vựng lĩnh vực cũng có thể được huấn luyện trên kho mã và gộp với từ vựng cơ sở. Một tokenizer được huấn luyện trên một mẫu thiên tiếng Anh sẽ phục vụ thiếu mọi hệ chữ khác trong suốt đời mô hình.

### The validation plan

1. Token mỗi từ, theo từng ngôn ngữ và cho mã, trên văn bản giữ lại; đây là bảng fertility bạn công bố.
2. Tỷ lệ không biết, phải bằng không với byte fallback.
3. Tỷ lệ nén so với một bộ mã hóa tham chiếu trên cùng văn bản giữ lại.
4. Round trip, mã hóa rồi giải mã, trên tất cả, bao gồm emoji và các chuỗi token đặc biệt nguyên văn. Chính xác từng byte khi tokenizer không có bộ chuẩn hóa; với một bộ chuẩn hóa như NFKC, so với văn bản đã chuẩn hóa.
5. Một hash file tokenizer đóng băng và các id token chuẩn trong CI, để không gì trôi giữa huấn luyện và phục vụ.

Đánh dấu một từ vựng đơn ngữ dưới 16k là chưa được đặc tả đủ, và từ chối phát hành một từ vựng không có kiểm tra hash.

## Follow-ups

- **Level 3:** Tại sao hỗn hợp kho ngữ liệu quan trọng hơn lựa chọn thuật toán? Expected: các phép gộp hoặc các mảnh được cắt đi theo các tần suất trong văn bản huấn luyện, nên một hệ chữ hiếm trong mẫu nhận ít mảnh bất kể thuật toán.
- **Level 4:** Xử lý khoảng trắng làm gì với mã? Expected: thụt lề là các chuỗi dấu cách hoặc tab; một bộ tiền token hóa giữ các chuỗi khoảng trắng như các chunk riêng cho phép chúng trở thành các token ổn định thay vì bị dính vào từ tiếp theo.
- **Level 4:** Nhóm muốn thay từ vựng sau sáu tháng huấn luyện. Bạn nói gì với họ? Expected: các embedding và mọi trọng số được huấn luyện theo các id hiện tại; một thay đổi nghĩa là một lần huấn luyện lại, đó là lý do quyết định tokenizer được đặt cổng trước bước đầu.
- **Level 4:** Bạn báo cáo tokenizer cùng mô hình bằng cách nào? Expected: bảng fertility theo từng ngôn ngữ, kích thước và độ bao phủ từ vựng, danh sách token đặc biệt và hash file.

## Wrong answers

- "Chọn 32k vì các mô hình trước đã dùng." Kích thước đó phục vụ các mô hình đơn ngữ dưới 1B; một mô hình lập trình đa ngôn ngữ 7B trả thuế ở mọi ngôn ngữ.
- "Đặt độ bao phủ ký tự thành 1.0 cho an toàn." Độ bao phủ đầy đủ tiêu từ vựng vào các ký tự thấy một lần; gần 0.9995 với byte fallback giữ các hệ chữ hiếm mà không lãng phí dòng.
- "Huấn luyện trên tiếng Anh bây giờ và thêm các ngôn ngữ khác sau." Từ vựng không thể thay đổi sau huấn luyện nếu không huấn luyện lại; các ngôn ngữ phải nằm trong kho ngữ liệu tokenizer từ đầu.

## Taught in

[Bài học token hóa subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) cung cấp bảng lựa chọn, heuristic kích thước, quy tắc độ bao phủ và kế hoạch xác thực, [bài học tokenizer](../../../phases/10-llms-from-scratch/01-tokenizers/) làm các phép tính embedding và fertility, và [bài học xây tokenizer](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) bao phủ tiền token hóa, số byte và các token đặc biệt.
