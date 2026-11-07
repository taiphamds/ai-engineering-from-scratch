---
id: which-knob-first
title: Three runs to close a VLM benchmark gap
card: multimodal
kind: tradeoff
level: 3
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [design-review, system-design]
tags: [vlm-recipes, ablation, resolution, data-quality]
minutes: 15
lessons: [phases/12-multimodal-ai/07-open-weight-vlm-recipes, phases/12-multimodal-ai/05-llava-visual-instruction-tuning]
manuals: []
practice: []
cheatsheet: [vlm-model-families, vlm-architectures]
related: [multimodal/llm-size-sets-ceiling]
updated: 2026-11-03
---

Bạn dẫn một nhóm nhỏ huấn luyện một mô hình thị giác-ngôn ngữ mở. Lần chạy đầu nằm thấp hơn nhiều các mô hình trọng số mở cùng kích thước trên một benchmark tổng quát và một benchmark đọc tài liệu. Bạn có đủ tài nguyên cho thêm ba lần chạy đầy đủ. Bạn thực hiện ba thay đổi nào, theo thứ tự nào, và kỳ vọng mỗi thay đổi làm gì thay đổi?

## Short answer

Sắp thứ tự các lần chạy theo variance mỗi trục giải thích. Đầu tiên, lịch trình độ phân giải và số token: tăng dần từ độ phân giải thấp lên cao và thêm chia ảnh cho benchmark tài liệu, nơi chuyển từ 448 lên 980 pixel thêm 3 đến 5 điểm trong các ablation. Thứ hai, encoder: đổi encoder tương phản thông dụng sang loại mạnh hơn, thêm 3 điểm hoặc hơn trên benchmark tổng quát, và nối một encoder tự giám sát nếu grounding quan trọng. Thứ ba, dữ liệu: thay các caption tổng hợp chưng cất bằng các caption người viết dày đặc, thắng tập chưng cất trên mọi benchmark trong so sánh tham chiếu; để connector nguyên, vì ở một số token cố định nó làm điểm thay đổi khoảng một điểm.

## Full answer

### The evidence behind the order

| Trục | Các ablation tìm thấy gì | Thay đổi kỳ vọng |
|---|---|---|
| Token thị giác và độ phân giải | khoảng 60 phần trăm variance; 384 lên 448 thêm 1 đến 2 điểm; 448 lên 980 với chia thêm 3 đến 5 trên các tác vụ đọc | benchmark tài liệu |
| Encoder | khoảng 20 phần trăm; một encoder tương phản mạnh hơn thêm 3 hoặc hơn; các đặc trưng tự giám sát dẫn các kiểm thử tập trung thị giác 5 đến 7 | benchmark tổng quát, đếm và grounding |
| Dữ liệu | các caption người viết dày đặc thắng chưng cất trên 11 trong 11 benchmark trong so sánh tham chiếu | cả hai benchmark, chi tiết có grounding nhiều nhất |
| Connector | khoảng 5 phần trăm; trong 1 điểm ở một số token cố định | không gì đáng một lần chạy |
| Mô hình ngôn ngữ | 7B lên 13B thêm 2 đến 4 điểm | cả hai, nếu ngân sách cho phép một mô hình lớn hơn |

### Run 1: resolution and tokens

Huấn luyện độ phân giải thấp phẳng đạt bình nguyên ở độ chính xác trung bình. Tăng dần từ 224 lên 448 hoặc độ phân giải gốc, rồi thêm chia cho các tác vụ đọc đến khoảng 1280 pixel trên cạnh dài. Số token giải thích nhiều variance nhất, và tài liệu cần pixel.

### Run 2: encoder

Đổi sang encoder tương phản mạnh hơn ở độ phân giải gốc. Nếu benchmark gồm đếm hoặc câu hỏi không gian, nối các đặc trưng của một encoder tự giám sát, như các công thức tập trung thị giác làm. Huấn luyện lại projector; mô hình ngôn ngữ giữ các adapter của nó.

### Run 3: data

Thay các caption chưng cất bằng các caption con người dày đặc ở nơi bạn có thể có chúng, và bổ sung dữ liệu instruction theo tác vụ cho các câu hỏi tài liệu. Kết quả tham chiếu: một mô hình được huấn luyện trên 712K ảnh có caption dày đặc không có dữ liệu chưng cất thắng một đối thủ lớn hơn nhiều trên mọi benchmark được liệt kê. Mật độ caption thắng số lượng caption, thứ thắng sự tiện lợi chưng cất.

### What you do not run

Một ablation connector. Nhiều nghiên cứu có kiểm soát đặt nó trong một điểm ở một số token cố định; số token là núm điều chỉnh, và lần chạy 1 đã chỉnh nó.

### How to keep the runs comparable

Một trục mỗi lần chạy, cùng đánh giá, cùng seed nơi framework cho phép, và một bản ghi hỗn hợp dữ liệu cùng lịch trình độ phân giải cho mỗi lần. Một lần chạy thay hai thứ không thể được ghi công cho bên nào.

## Follow-ups

- **Level 3:** Tại sao benchmark tài liệu phản ứng với độ phân giải còn benchmark tổng quát ít hơn? Expected: đọc cần pixel mỗi ký tự; các câu hỏi tổng quát cần ngữ nghĩa encoder đã mang ở độ phân giải thấp.
- **Level 3:** Một lịch trình tăng độ phân giải mang lại gì so với độ phân giải cao phẳng? Expected: alignment nhanh hơn ở đầu và một điểm cuối cao hơn; các ablation cho thấy các lịch trình phẳng đạt bình nguyên ở độ chính xác trung bình.
- **Level 4:** Bạn không thể có các caption con người kịp thời. Thay đổi dữ liệu tốt tiếp theo là gì? Expected: lọc các caption chưng cất để có grounding đối chiếu ảnh bằng một bộ kiểm tra tương phản và bỏ phần đuôi không grounding; mật độ quan trọng, nhưng mật độ không grounding dạy ảo giác.
- **Level 4:** Nếu một lần chạy thứ tư xuất hiện, đó là connector hay mô hình ngôn ngữ? Expected: mô hình ngôn ngữ, nếu bộ nhớ cho phép một mô hình lớn hơn; nó nâng suy luận bằng nhiều điểm, nơi connector thay đổi một phần của một điểm.

## Wrong answers

- "Bắt đầu với connector; nó rẻ nhất để huấn luyện lại." Rẻ và vô dụng: ở số token cố định nó làm điểm thay đổi khoảng một điểm trong mọi nghiên cứu có kiểm soát.
- "Sinh thêm caption bằng một mô hình độc quyền mạnh hơn." Các caption chưng cất kế thừa ảo giác; so sánh tham chiếu cho thấy các caption con người dày đặc thắng chưng cất trên mọi mặt.
- "Huấn luyện lâu hơn ở cùng thiết lập." Các ablation đặt khoảng cách ở độ phân giải, encoder và dữ liệu, không phải số bước; thêm bước ở độ phân giải thấp phẳng đạt bình nguyên.

## Taught in

[Bài học các công thức trọng số mở](../../../phases/12-multimodal-ai/07-open-weight-vlm-recipes/) đưa ra không gian thiết kế năm trục và các bảng ablation, và [bài học LLaVA](../../../phases/12-multimodal-ai/05-llava-visual-instruction-tuning/) cho thấy sơ đồ chia ô mà lần chạy độ phân giải thêm.
