---
id: train-only-the-projector
title: Why the first VLM stage trains only the bridge
card: multimodal
kind: concept
level: 1
roles: [applied-ai-engineer]
rounds: [screen, ml-depth]
tags: [projector, frozen-backbone, alignment, vlm]
minutes: 8
lessons: [phases/19-capstone-projects/60-projection-layer-modality-align, phases/12-multimodal-ai/05-llava-visual-instruction-tuning, phases/12-multimodal-ai/03-blip2-qformer-bridge]
manuals: []
practice: []
cheatsheet: [vlm-from-scratch, vlm-architectures]
related: [multimodal/vlm-three-parts]
updated: 2026-11-03
---

Trong giai đoạn huấn luyện đầu của phần lớn mô hình thị giác-ngôn ngữ mở, cả encoder thị giác và decoder đóng băng, và chỉ projector nhỏ học. Một kỹ sư mới hỏi tại sao ai đó lại huấn luyện phần nhỏ nhất trước thay vì các phần quan trọng. Trả lời họ.

## Short answer

Hai phần lớn đã hoạt động: encoder biểu diễn ảnh, và mô hình ngôn ngữ viết văn bản. Điều thiếu là một phép dịch giữa hai không gian vector của chúng, và phép dịch đó nhỏ. Chỉ huấn luyện cầu nối tốn vài trăm bước trên một GPU, không thể làm hại phần pretrained nào, và cho mô hình ngôn ngữ các đầu vào nó có thể đọc trước khi ai đó mở đóng băng nó. Mở đóng băng mô hình ngôn ngữ đến ở giai đoạn thứ hai, một khi cầu nối tạo các token trông như ngôn ngữ.

## Full answer

### What the projector is

Một MLP hai lớp: tuyến tính, GELU, tuyến tính. Head của capstone ánh xạ 768 đến 1024 đến 512 và giữ khoảng 1.3M tham số cạnh một encoder 86M. Head của công thức mở tham chiếu ánh xạ 1024 đến 4096 đến 4096, khoảng 22M tham số cạnh một encoder 303M và một mô hình ngôn ngữ 7B.

### Why the frozen big parts are the point

- Ổn định. Các gradient từ vài nghìn cặp nhiễu sẽ ghi đè các đặc trưng encoder đã học từ hàng trăm triệu ảnh.
- Chi phí. Giai đoạn alignment của công thức tham chiếu huấn luyện trên 558k cặp caption trong vài giờ ở batch 128. Phiên bản capstone đẩy loss từ khoảng 1.07 xuống khoảng 0.80 trong 200 bước.
- Một tín hiệu sạch. Với cả hai phần lớn cố định, loss chỉ di chuyển qua cầu nối, nên bạn có thể đọc liệu hai không gian có căn chỉnh.
- Khả năng hoán đổi. Thay mô hình ngôn ngữ và huấn luyện lại cầu nối; encoder ở lại.

### What the loss is

Công thức tham chiếu dùng loss mô hình hóa ngôn ngữ trên caption, được điều kiện hóa trên các token ảnh được chiếu. Capstone dùng một cosine alignment loss mỗi cặp, một trừ cosine giữa một vector ảnh pooled và một embedding caption mean-pooled, để động lực giữ nhìn thấy; một phiên bản batch tương phản là bài học tiếp theo.

### What comes after

Giai đoạn hai mở đóng băng mô hình ngôn ngữ, đầy đủ hoặc qua adapter, giữ cầu nối huấn luyện được, và huấn luyện trên dữ liệu instruction. Một cầu nối chưa từng được căn chỉnh trước cho mô hình ngôn ngữ nhiễu ở đầu giai đoạn đó.

### The other kind of bridge

Một cầu nối dựa trên query với một tập cố định các vector được học nén ảnh thành một số token cố định. Nó lớn hơn, 188M tham số trong bản gốc, và nó vẫn huấn luyện với các backbone đóng băng; nguyên tắc giống nhau.

## Follow-ups

- **Level 1:** Một tham số đóng băng có nghĩa gì trong mã? Expected: `requires_grad=False`, nên bộ tối ưu không bao giờ thấy nó, và không bộ nhớ nào dành cho gradient hoặc trạng thái bộ tối ưu của nó.
- **Level 2:** Tại sao pool các token ảnh trước cosine loss trong capstone? Expected: phía caption là một vector, nên phía ảnh cũng cần một vector; token đầu tiên hoặc trung bình trên tất cả token là các lựa chọn thông thường.
- **Level 2:** Một lớp tuyến tính sẽ còn nhỏ hơn. Tại sao hai? Expected: một ánh xạ tuyến tính duy nhất có thể quay và đổi tỷ lệ nhưng không thể uốn; GELU giữa hai lớp cho một lần uốn phi tuyến căn chỉnh các đặc trưng thị giác tương phản với embedding ngôn ngữ.
- **Level 3:** Điều gì hỏng nếu bạn bỏ giai đoạn alignment và bắt đầu bằng instruction tuning với mọi thứ mở đóng băng? Expected: mô hình ngôn ngữ nhận các đầu vào chưa căn chỉnh, và các gradient của nó trên một tập nhỏ làm hại khả năng văn bản; hai giai đoạn tồn tại để cho nó các đầu vào đọc được trước.

## Wrong answers

- "Huấn luyện encoder; nó là phần nhìn." Nó đã nhìn, và một tập dữ liệu nhỏ không thể dạy nó nhiều hơn lượng nó mất do ghi đè đặc trưng; phần thiếu là phép dịch.
- "Projector quá nhỏ để mang một ảnh." Nó không mang ảnh; nó ánh xạ các token đã encode ảnh vào không gian mô hình ngôn ngữ đọc.
- "Đóng băng chỉ là một thủ thuật bộ nhớ." Bộ nhớ là một lợi ích; các lợi ích lớn hơn là ổn định, một tín hiệu huấn luyện sạch, và khả năng đổi mô hình ngôn ngữ.

## Taught in

[Capstone phép chiếu](../../../phases/19-capstone-projects/60-projection-layer-modality-align/) huấn luyện riêng cầu nối bằng một cosine loss, [bài học LLaVA](../../../phases/12-multimodal-ai/05-llava-visual-instruction-tuning/) đưa ra công thức hai giai đoạn và số tham số của nó, và [bài học BLIP-2](../../../phases/12-multimodal-ai/03-blip2-qformer-bridge/) giải thích tính kinh tế của backbone đóng băng.
