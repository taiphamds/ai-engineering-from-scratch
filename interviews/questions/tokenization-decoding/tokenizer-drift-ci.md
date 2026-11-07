---
id: tokenizer-drift-ci
title: The weights did not change and the score fell
card: tokenization-decoding
kind: debug
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [debugging, design-review]
tags: [tokenizer-drift, normalization, prefix-space, ci, evaluation]
minutes: 10
lessons: [phases/05-nlp-foundations-to-advanced/19-subword-tokenization, phases/10-llms-from-scratch/02-building-a-tokenizer]
manuals: []
practice: []
cheatsheet: [tokenization]
related: [tokenization-decoding/chat-template-garbage, tokenization-decoding/pre-tokenization-regex]
updated: 2026-11-03
---

Sau một nâng cấp phụ thuộc thường lệ, một điểm đánh giá cho một mô hình đã triển khai giảm mạnh. Không trọng số mô hình nào thay đổi. Đưa tôi một kế hoạch chẩn đoán bắt đầu ở tokenizer, và biện pháp kiểm soát bạn thêm để điều đó không thể xảy ra lại.

## Short answer

Một mô hình được huấn luyện với một từ vựng và phục vụ với một từ vựng khác nhận các id khác cho cùng văn bản và tạo rác, nên trước tiên băm file tokenizer trong cả hai môi trường và so sánh. Nếu các hash khớp, kiểm tra các thiết lập thay đổi id mà không thay từ vựng: liệu các token đặc biệt được thêm, liệu một dấu cách tiền tố được thêm, và bước chuẩn hóa, vì một dấu cách đầu hoặc một chữ ghép chuẩn hóa khác làm dịch chuyển toàn bộ token. Rồi đóng băng hash tokenizer trong CI và giữ các id token chuẩn cho một kho ngữ liệu cố định để bất kỳ thay đổi nào làm thất bại một kiểm thử trước khi phát hành.

## Full answer

### Step one: the file

Bảng gộp và từ vựng là tokenizer. Một nâng cấp thư viện có thể kéo một file khác, hoặc phân giải một tên mô hình tới một bản sửa đổi mới hơn. So hash của file tokenizer trong môi trường đánh giá với file mà mô hình được huấn luyện cùng.

### Step two: the settings around the file

| Thiết lập | Điều thay đổi | Triệu chứng |
|---|---|---|
| Thêm các token đặc biệt | một id bắt đầu văn bản xuất hiện hoặc biến mất ở đầu | mọi vị trí dịch một |
| Thêm dấu cách tiền tố | từ đầu nhận một id đầu từ hoặc một id trong từ | token đầu của mọi prompt khác |
| Chuẩn hóa | một chữ ghép như "fi" hai chữ cái trở thành hai ký tự, hoặc một chữ cái toàn chiều rộng trở thành ASCII | cùng từ nhận các mảnh khác trong hai môi trường |
| Engine tiền token hóa | mẫu nhận biết Unicode quay về các lớp ASCII | văn bản không Latin tách khác |

Mỗi thứ này là một mặc định mà một phiên bản thư viện có thể thay đổi. Không thứ nào chạm file từ vựng, nên chỉ hash không bắt được.

### Step three: prove it

Lấy một mẫu prompt cố định từ đánh giá. Mã hóa chúng trong cả hai môi trường và diff các danh sách id. Vị trí đầu khác cho bạn biết thiết lập nào dịch chuyển. Giải mã các id khác để thấy các mảnh.

### The controls

1. Ghim file tokenizer theo hash trong triển khai và làm build thất bại khi nó thay đổi.
2. Lưu các id token chuẩn cho một kho ngữ liệu cố định bao phủ tiếng Anh, các hệ chữ không Latin, mã, emoji và một prompt có dấu cách đầu; kiểm thử mã hóa kho ngữ liệu và so sánh.
3. Khẳng định một round trip, mã hóa rồi giải mã, trên cùng kho ngữ liệu. So với văn bản mà bộ chuẩn hóa được cấu hình tạo, và yêu cầu bằng nhau chính xác từng byte cho văn bản mà bộ chuẩn hóa để nguyên.
4. Ghi các thiết lập tokenizer cạnh các trọng số, để cấu hình phục vụ không thể trôi khỏi cấu hình huấn luyện.

### The validation plan from the lesson

Số token trung bình mỗi từ trên một tập giữ lại, tỷ lệ không biết, tỷ lệ nén và sự bằng nhau round trip. Bốn con số đó, được theo dõi theo thời gian, cho thấy drift trước khi một đánh giá làm vậy.

## Follow-ups

- **Level 3:** Một dấu cách tiền tố thay đổi các id bằng cách nào? Expected: dấu cách là một phần của token đầu từ, nên có nó từ đầu nhận một id và không có nó nhận một id khác, và sự dịch có thể tiếp tục qua các phép gộp.
- **Level 3:** Chuẩn hóa tương thích làm gì, và khi nào nó có hại? Expected: nó ánh xạ các ký tự tương thích về các dạng thuần, như một chữ ghép thành hai chữ cái hoặc một chữ cái toàn chiều rộng thành ASCII; nó có mất mát, nên mã hoặc văn bản phụ thuộc dạng chính xác thay đổi ý nghĩa.
- **Level 4:** Các hash khớp và các id vẫn khác chỉ trên văn bản không Latin. Điều gì dịch chuyển? Expected: engine tiền token hóa; môi trường không có mô-đun nhận biết Unicode quay về mẫu ASCII.
- **Level 4:** Thiết kế cổng CI trong hai câu. Expected: một kiểm thử mã hóa một kho ngữ liệu đa ngôn ngữ cố định và so với các id chuẩn đã lưu và một hash tokenizer đã lưu; bất kỳ khác biệt nào làm build thất bại và in vị trí khác đầu tiên.

## Wrong answers

- "Các trọng số không thay đổi, nên mô hình giống nhau." Mô hình là các trọng số và ánh xạ từ văn bản tới id; thay ánh xạ và mô hình thấy các đầu vào khác.
- "Huấn luyện lại mô hình trên tokenizer mới." Một cách sửa nhiều tuần cho một bug cấu hình; khôi phục tokenizer và các thiết lập lúc huấn luyện.
- "Chuyển mọi thứ thành chữ thường để chuẩn hóa không quan trọng." Điều đó thay các id lần nữa và vứt thông tin mà mô hình được huấn luyện cùng.

## Taught in

[Bài học token hóa subword](../../../phases/05-nlp-foundations-to-advanced/19-subword-tokenization/) liệt kê các cạm bẫy drift và khoảng trắng cùng kế hoạch xác thực, và [bài học xây tokenizer](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) bao phủ chuẩn hóa và các engine regex.
