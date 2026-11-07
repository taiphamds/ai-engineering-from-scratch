---
id: llm-size-sets-ceiling
title: Which knob moves a multimodal reasoning score
card: multimodal
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth, design-review]
tags: [vlm-recipes, ablation, llm-size, encoder]
minutes: 10
lessons: [phases/12-multimodal-ai/07-open-weight-vlm-recipes, phases/04-computer-vision/25-vision-language-models]
manuals: []
practice: []
cheatsheet: [vlm-model-families, vlm-architectures]
related: [multimodal/qformer-or-mlp]
updated: 2026-11-03
---

Mô hình thị giác-ngôn ngữ 7B của bạn kém một đối thủ trên một benchmark suy luận đa phương thức vài điểm. Kế hoạch của nhóm là một thiết kế connector mới. Lập luận ủng hộ hoặc phản đối, dùng những gì tài liệu ablation nói về nguồn gốc điểm số.

## Short answer

Phản đối. Qua các nghiên cứu có kiểm soát, đổi connector làm một benchmark suy luận thay đổi dưới một điểm ở số token cố định, trong khi đổi encoder làm thay đổi ba điểm hoặc hơn, và tăng gấp đôi mô hình ngôn ngữ từ 7B lên 13B thêm hai đến bốn điểm. Trần suy luận của một mô hình như vậy là trần suy luận văn bản của mô hình ngôn ngữ của nó; phía thị giác chỉ có thể cấp dữ liệu cho nó. Dành nỗ lực cho kích thước mô hình ngôn ngữ, encoder, số token và dữ liệu trước connector.

## Full answer

### The decomposition

Một nghiên cứu giữ mọi trục cố định trừ một thấy rằng số token thị giác mỗi ảnh giải thích khoảng 60 phần trăm variance trong điểm, encoder khoảng 20 phần trăm, connector khoảng 5 phần trăm, và mọi thứ khác khoảng 15 phần trăm.

### The language model sets the ceiling

Chuyển từ một mô hình ngôn ngữ 7B sang 13B thêm một cách đáng tin cậy 2 đến 4 điểm trên benchmark suy luận chủ lực qua các bài báo trong bài học, và ở 70B phần lớn benchmark bão hòa. Lý do mang tính cấu trúc: encoder tạo đặc trưng và connector dịch chúng, nhưng suy luận xảy ra trong mô hình ngôn ngữ. Một mô hình 7B không thể thay cho một mô hình 70B thông qua một connector khéo hơn.

### The encoder is the second lever

Đổi encoder tương phản thông dụng sang một encoder mạnh hơn thêm 3 điểm hoặc hơn trên benchmark suy luận trong một nghiên cứu, và các encoder tự giám sát dẫn một benchmark tập trung thị giác khoảng 5 đến 7 điểm so với encoder tương phản thông dụng. Mặc định năm 2026 ghép một encoder tương phản mạnh với một encoder tự giám sát cho các đặc trưng dày đặc khi grounding quan trọng.

### The connector is a wash

Ở một số token cố định, một MLP, một cầu nối query và một resampler nằm trong khoảng 1 điểm của nhau trong nhiều nghiên cứu độc lập. Connector là một câu hỏi chi phí về token, không phải một câu hỏi chất lượng.

### What to do instead

1. Kiểm tra số token mỗi ảnh; thêm token thị giác đến điểm tối ưu giúp nhiều hơn bất kỳ connector nào.
2. Kiểm tra encoder và lịch trình độ phân giải.
3. Kiểm tra dữ liệu: các caption người viết chi tiết thắng các caption tổng hợp chưng cất ở cùng số token.
4. Nếu khoảng cách nằm ở suy luận, cách sửa trung thực là một mô hình ngôn ngữ lớn hơn, và câu hỏi ngân sách theo sau.

## Follow-ups

- **Level 2:** Tại sao một mô hình ngôn ngữ lớn hơn giúp một tác vụ thị giác? Expected: benchmark yêu cầu suy luận trên những gì encoder thấy, và suy luận xảy ra trong mô hình ngôn ngữ; phía thị giác đặt điều nó biết, không phải nó nghĩ tốt thế nào.
- **Level 2:** Khi nào một thay đổi connector vẫn là bước đi đúng? Expected: khi ngân sách token ràng buộc, vì khi đó connector quyết định bạn có thể trả cho bao nhiêu token, là trục quan trọng nhất.
- **Level 3:** Những benchmark nào thay đổi với encoder và những benchmark nào không? Expected: các benchmark tập trung thị giác, đếm và grounding, thay đổi với một encoder tự giám sát, khoảng 5 đến 7 điểm trong một nghiên cứu; benchmark suy luận cũng thay đổi, 3 điểm hoặc hơn với một encoder tương phản mạnh hơn, nên encoder quan trọng cho cả hai loại.
- **Level 3:** Thiết kế ablation nhỏ nhất giải quyết điều này cho mô hình của bạn. Expected: giữ dữ liệu, encoder, số token, lịch trình độ phân giải và lịch trình huấn luyện cố định, đổi kích thước mô hình ngôn ngữ trong một lần chạy và connector trong lần khác, và so sánh cả hai với baseline trên cùng đánh giá.

## Wrong answers

- "Connector là nơi các phương thức gặp nhau, nên nó hẳn quan trọng nhất." Tỷ phần đo được của nó khoảng 5 phần trăm variance; số token và encoder chi phối.
- "Một connector tốt hơn cho phép một mô hình ngôn ngữ nhỏ suy luận như một mô hình lớn." Trần suy luận là của mô hình ngôn ngữ; không cầu nối nào thêm suy luận mà mô hình ngôn ngữ không có.
- "Nhiều token thị giác hơn luôn giúp." Chúng giúp đến điểm tối ưu rồi cho lợi ích giảm dần với chi phí tính toán tăng; mức tăng nằm ở số token, không phải kiến trúc phát ra chúng.

## Taught in

[Bài học các công thức trọng số mở](../../../phases/12-multimodal-ai/07-open-weight-vlm-recipes/) phân rã variance qua năm trục thiết kế, và [bài học các mô hình thị giác-ngôn ngữ](../../../phases/04-computer-vision/25-vision-language-models/) trình bày mẫu mà các trục thuộc về.
