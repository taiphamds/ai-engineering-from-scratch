---
id: human-captions-beat-distillation
title: Dense human captions or two million distilled ones
card: multimodal
kind: tradeoff
level: 3
roles: [ai-data-engineer, applied-ai-engineer]
rounds: [system-design, ml-breadth]
tags: [data-quality, captions, distillation, grounding]
minutes: 12
lessons: [phases/12-multimodal-ai/07-open-weight-vlm-recipes, phases/04-computer-vision/25-vision-language-models, phases/12-multimodal-ai/05-llava-visual-instruction-tuning]
manuals: []
practice: []
cheatsheet: [vlm-model-families]
related: [multimodal/which-knob-first]
updated: 2026-11-03
---

Bạn có thể dùng ngân sách dữ liệu cho một trong hai thứ: để một mô hình độc quyền mạnh viết caption cho hai triệu ảnh, hoặc trả tiền cho người mô tả chi tiết bảy trăm nghìn ảnh bằng cách nói một phút hoặc hơn về mỗi ảnh. Bạn chọn cách nào cho một mô hình thị giác-ngôn ngữ mới, và bằng chứng là gì?

## Short answer

Trả tiền cho con người. Kết quả tham chiếu là một mô hình được huấn luyện trên 712K ảnh có caption dày đặc và không có caption chưng cất thắng một mô hình lớn hơn nhiều trên 11 trong 11 benchmark. Các caption người viết dày đặc mang thông tin gấp 5 đến 10 lần một caption web ngắn và giữ bám ảnh, trong khi các caption chưng cất kế thừa các ảo giác của mô hình viết chúng; khoảng 12 phần trăm các cặp được thu thập đã mô tả những thứ không có trong ảnh. Mật độ caption thắng số lượng caption, thứ thắng sự tiện lợi chưng cất.

## Full answer

### The evidence

- Công thức caption dày đặc: những người gán nhãn mô tả mỗi ảnh trong một đến ba phút bằng lời nói, được chép thành văn bản, cho 712K ảnh có caption dày đặc. Mô hình 72B được huấn luyện trên chúng thắng một đối thủ 90B trên mọi benchmark trong 11 benchmark. Khác biệt không phải kiến trúc.
- Hai tập dữ liệu khác theo cùng đường với caption người và tổng hợp trộn lẫn, và xu hướng giữa chúng là mật độ thắng.
- Tập chỉ dẫn thị giác đầu tiên được viết bởi một mô hình chỉ văn bản từ caption và box mà không thấy ảnh, 158k lượt; nó hoạt động để mở khóa hội thoại, với nhiễu.

### Why density beats volume

Một caption dày đặc 80 đến 300 token nêu các đối tượng, số đếm, quan hệ, văn bản trong ảnh và ngữ cảnh; một alt text web nêu một thứ. Với alignment và instruction tuning, mô hình học từ những gì caption nói về ảnh, nên thông tin mỗi ảnh là đơn vị giá trị, không phải số ảnh.

### Why distillation is risky

Mô hình viết không thấy điều nó không thấy. Nó ảo giác nội dung hợp lý, và student học ảo giác với cùng độ tự tin. Một benchmark được xây từ dữ liệu tương tự không phạt nó; người dùng production thì có.

### When distillation still has a place

- Khởi tạo một miền mới nhanh, trước khi dữ liệu con người đến.
- Sinh câu hỏi và câu trả lời từ một caption do người viết, giữ grounding trong caption.
- Được lọc: chấm mỗi caption tổng hợp đối chiếu ảnh bằng một bộ kiểm tra tương phản và bỏ phần đuôi không grounding.

### What to do with the budget

Các caption con người dày đặc cho các giai đoạn alignment và instruction, dữ liệu instruction theo tác vụ ở trên, và dữ liệu tổng hợp chỉ nơi một caption con người neo nó. Đo grounding trên một tập giữ lại do người gán nhãn, không chỉ độ chính xác benchmark.

## Follow-ups

- **Level 3:** Tại sao việc thu thập dựa trên lời nói quan trọng? Expected: con người nói nhiều hơn nhiều trong một phút so với gõ, nên các caption dài và cụ thể ở một chi phí mở rộng được.
- **Level 3:** Bạn kiểm tra một caption tổng hợp có grounding như thế nào? Expected: embed ảnh và caption bằng một bộ kiểm tra tương phản và gắn cờ độ tương tự thấp, rồi đọc một mẫu; bỏ hoặc viết lại phần đuôi.
- **Level 4:** Bạn sẽ chứng minh với một người hoài nghi mức tăng là dữ liệu chứ không phải kích thước mô hình như thế nào? Expected: so sánh tham chiếu thắng một mô hình lớn hơn; lặp lại ở một kích thước với hai hỗn hợp dữ liệu và cùng encoder, connector và lịch trình.
- **Level 4:** Trong pipeline ba giai đoạn, các caption dày đặc có lợi nhất ở đâu? Expected: alignment và giai đoạn instruction đầu, nơi projector và mô hình ngôn ngữ học một ảnh chứa gì; dữ liệu theo tác vụ có lợi trong giai đoạn cuối.

## Wrong answers

- "Hai triệu caption thắng bảy trăm nghìn; nhiều dữ liệu hơn thắng." Kết quả tham chiếu thắng một mô hình lớn hơn với ít caption hơn, dày đặc hơn, có grounding; khối lượng caption mỏng hoặc ảo giác không thể thay thế.
- "Caption của mô hình mạnh tốt hơn những gì người gán nhãn viết." Chúng dài hơn caption web nhưng không có grounding; mô hình mô tả điều nó kỳ vọng, và student học cùng thói quen.
- "Chất lượng caption chỉ quan trọng cho các tác vụ caption." Mô hình tham chiếu tăng trên mọi benchmark, gồm cả suy luận và đọc, vì giai đoạn alignment học nhiều hơn về mỗi ảnh.

## Taught in

[Bài học các công thức trọng số mở](../../../phases/12-multimodal-ai/07-open-weight-vlm-recipes/) đưa ra kết quả caption dày đặc và trục dữ liệu, [bài học các mô hình thị giác-ngôn ngữ](../../../phases/04-computer-vision/25-vision-language-models/) định lượng các cặp không grounding, và [bài học LLaVA](../../../phases/12-multimodal-ai/05-llava-visual-instruction-tuning/) cho thấy dữ liệu instruction được sinh đã bắt đầu lĩnh vực.
