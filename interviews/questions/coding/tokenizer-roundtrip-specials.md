---
id: tokenizer-roundtrip-specials
title: A byte-level tokenizer with protected special tokens
card: coding
kind: take-home
level: 4
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, take-home]
tags: [bpe, special-tokens, round-trip, pre-tokenization]
minutes: 45
lessons: [phases/19-capstone-projects/30-bpe-tokenizer-from-scratch, phases/10-llms-from-scratch/02-building-a-tokenizer]
manuals: []
practice: [bpe-merge-step]
cheatsheet: [tokenization]
related: [coding/bpe-train-loop, coding/bpe-merge-no-overlap]
updated: 2026-11-03
---

Thiết kế và triển khai một tokenizer cho một mô hình ngôn ngữ nhỏ: huấn luyện nó trên một corpus, mã hóa văn bản mới, giải mã các id trở lại, và dành riêng hai token đặc biệt cho ranh giới tài liệu và padding. Nêu các bảo đảm mà bộ kiểm thử phải cố định, và giải thích các token đặc biệt sống sót qua cả huấn luyện và suy luận mà không bao giờ bị gộp như thế nào.

## Short answer

Các ký hiệu cơ sở là 256 byte thô, vì vậy mọi đầu vào đều có một cách mã hóa trước bất kỳ phép gộp nào và giải mã luôn kết thúc ở các byte. Huấn luyện chạy trên các đoạn đã tiền tokenize không bao giờ chứa các chuỗi đặc biệt, vì vậy không phép gộp nào có thể tạo ra hoặc tiêu thụ một id đặc biệt. Lúc suy luận một bộ khớp tách văn bản theo các chuỗi đặc biệt trước, ánh xạ mỗi chuỗi sang id dành riêng của nó, và chạy bảng gộp trên văn bản giữa chúng theo thứ tự huấn luyện. Bộ kiểm thử cố định phép khứ hồi trên văn bản chưa thấy, trên văn bản có các ký tự nhiều byte, và trên văn bản chứa một chuỗi đặc biệt theo nghĩa đen khi cờ tắt.

## Full answer

### The pipeline

1. Chuẩn hóa văn bản về một dạng Unicode để cùng một từ nhìn thấy được nhận cùng các byte.
2. Tách theo các chuỗi đặc biệt khi bên gọi cho phép chúng, và ánh xạ mỗi lần khớp sang id dành riêng của nó.
3. Tiền tokenize văn bản còn lại thành các đoạn tại các ranh giới khoảng trắng và dấu câu.
4. Áp dụng bảng gộp cho các byte của mỗi đoạn theo thứ tự huấn luyện, với phép thay thế từ trái sang phải không chồng lấn.
5. Nối các id.

Giải mã đảo ngược các bước hai đến năm: mở rộng mỗi id thành các byte của nó, trong đó một id đã gộp mở rộng thành các byte của hai cha của nó và một id đặc biệt dành riêng mở rộng thành các byte UTF-8 của chuỗi của nó, và giải mã chuỗi byte. Chuẩn hóa không thể đảo ngược. Một dấu thanh ở dạng phân rã trở lại thành ký tự ở dạng tổ hợp, vì vậy phép khứ hồi chỉ chính xác đối với văn bản vốn đã ở dạng chuẩn hóa.

### Why pre-tokenization

Không có việc tách, các phép gộp vượt qua ranh giới từ và từ vựng đầy lên với các cụm phổ biến không khái quát hóa được. Việc tách giữ các phép gộp bên trong một từ. Các ranh giới đoạn cũng ngăn một phép gộp trải từ cuối một từ đến đầu từ tiếp theo lúc suy luận, là cách huấn luyện và suy luận giữ được tính nhất quán.

### Special tokens

Các id sau khối byte được dành riêng bằng tay. Vòng lặp huấn luyện không bao giờ thấy các chuỗi đặc biệt, vì corpus được tách và các chuỗi được loại bỏ trước khi đếm cặp, vì vậy không mục tiêu gộp nào có thể là một id đặc biệt và không phép gộp nào có thể chứa một id như vậy. Lúc suy luận bộ mã hóa nhận một cờ. Khi cờ tắt, các ký tự của một chuỗi đặc biệt là các byte thông thường và được tokenize như vậy. Khi cờ bật, chuỗi chính xác ánh xạ sang id dành riêng của nó và không chịu bất kỳ phép gộp nào. Bộ khớp thử các chuỗi đặc biệt dài hơn trước để một chuỗi chứa một chuỗi khác được khớp toàn bộ.

### The guarantees to pin

| Bảo đảm | Kiểm thử |
|---|---|
| Khứ hồi trên văn bản chưa thấy | mã hóa rồi giải mã trả về chính xác các byte của đầu vào đã chuẩn hóa |
| Các ký tự nhiều byte | một câu có một emoji bốn byte thực hiện khứ hồi được |
| Chuỗi đặc biệt theo nghĩa đen, cờ tắt | chuỗi giải mã trở lại thành văn bản, không phải thành một ranh giới |
| Chuỗi đặc biệt, cờ bật | chính xác một id, id dành riêng, xuất hiện |
| Thứ tự gộp | cùng danh sách gộp cho cùng các id trong các lần mã hóa lặp lại |
| Phạm vi dành riêng | không phép gộp nào trong bảng có một id đặc biệt làm cha hoặc con |

### The compression curve

Số id cho một câu giữ lại giảm khi ngân sách gộp tăng. Huấn luyện với một từ vựng mục tiêu 300 rồi 600 id trên corpus của bài học cho thấy trực tiếp mức giảm; đường cong đó là phép đo biện minh cho kích thước từ vựng.

## Follow-ups

- **Level 3:** Tại sao 256 id đầu tiên được dành cho các byte thay vì cho các ký tự của corpus? Expected: bất kỳ đầu vào nào, gồm cả văn bản trong các hệ chữ mà corpus chưa từng có, khi đó đều có thể được mã hóa mà không có token không biết.
- **Level 4:** Các marker chat template nằm ở đâu trong thiết kế này? Expected: chúng là các token đặc biệt như token ranh giới, được khớp chính xác trước các phép gộp, với các id cố định mà mô hình đã được huấn luyện trên; một template sai đặt đầu vào ra ngoài phân phối huấn luyện.
- **Level 4:** Bạn bảo vệ một mô hình đã triển khai khỏi một tokenizer thay đổi dần như thế nào? Expected: băm bảng gộp và ánh xạ token đặc biệt, và kiểm tra hash trong pipeline trước huấn luyện và trước phục vụ; một bảng khác giải mã các id khác.

## Wrong answers

- "Thêm các token đặc biệt vào corpus để mô hình học chúng." Khi đó chúng có thể bị gộp với các phần tử lân cận và không còn là các id đơn lẻ.
- "Khớp các chuỗi đặc biệt sau các phép gộp." Các phép gộp đã tách chuỗi thành các mảnh byte, vì vậy bộ khớp không bao giờ thấy nó.
- "Giải mã bằng cách tra cứu một chuỗi cho mỗi id trong một dictionary." Các id là các byte, và một ký tự nhiều byte có thể bị tách qua các id; nối các byte trước, rồi giải mã.

## Taught in

[Bài học BPE từ đầu](../../../phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/) đưa ra mức nền byte, các token đặc biệt dành riêng và các kiểm thử khứ hồi, [bài học tokenizer production](../../../phases/10-llms-from-scratch/02-building-a-tokenizer/) thêm chuẩn hóa, tiền tokenize và khớp chính xác các chuỗi đặc biệt, và [bài thực hành BPE](../../../practice/bpe-merge-step/) là bước gộp bên trong nó.
