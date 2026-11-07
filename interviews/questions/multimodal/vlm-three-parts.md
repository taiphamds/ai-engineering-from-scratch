---
id: vlm-three-parts
title: The three parts of a vision-language model
card: multimodal
kind: concept
level: 1
roles: [applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [vlm, projector, vision-encoder, alignment]
minutes: 8
lessons: [phases/04-computer-vision/25-vision-language-models, phases/19-capstone-projects/60-projection-layer-modality-align, phases/12-multimodal-ai/05-llava-visual-instruction-tuning]
manuals: []
practice: []
cheatsheet: [vlm-architectures, vlm-from-scratch]
related: [multimodal/train-only-the-projector, multimodal/image-tokens-per-image]
updated: 2026-11-03
---

Vẽ kiến trúc tiêu chuẩn của một mô hình thị giác-ngôn ngữ trả lời các câu hỏi về một ảnh. Nêu ba phần của nó, nói mỗi phần đóng góp gì, và nói bạn kỳ vọng huấn luyện phần nào khi một nhóm fine-tune trên vài nghìn ảnh có nhãn.

## Short answer

Một encoder thị giác, một projector và một mô hình ngôn ngữ. Encoder, một vision transformer pretrained, biến ảnh thành các token patch. Projector, một MLP nhỏ hai đến bốn lớp hoặc một cầu nối dựa trên query, ánh xạ những token đó vào không gian embedding của mô hình ngôn ngữ, nơi chúng thay một token placeholder trong prompt. Mô hình ngôn ngữ decoder đọc các token ảnh và token văn bản như một chuỗi và viết câu trả lời; trong phần lớn lần fine-tune, encoder và mô hình ngôn ngữ giữ đóng băng hoặc nhận adapter, và projector là nơi huấn luyện xảy ra.

## Full answer

### The three parts

1. Encoder thị giác. Một vision transformer pretrained, được huấn luyện tương phản hoặc tự giám sát, tạo một token mỗi patch. Với một đầu vào 336 pixel và một patch 14 pixel, mô hình tham chiếu nhận 576 token chiều rộng 1024.
2. Projector. Một MLP hai lớp với một GELU giữa các lớp, từ chiều rộng encoder đến chiều rộng mô hình ngôn ngữ, 1024 đến 4096 đến 4096 trong mô hình tham chiếu. Head đồ chơi của capstone, 768 đến 1024 đến 512, có khoảng 1.3M tham số.
3. Mô hình ngôn ngữ. Một mô hình chỉ decoder nhận các token ảnh được chiếu thay cho một placeholder ảnh và các token văn bản sau chúng, rồi sinh văn bản.

### How the pieces meet

Prompt giữ một token ảnh placeholder. Trước lượt forward, các embedding ở những vị trí đó bị ghi đè bằng các token thị giác được chiếu, và batch được pad để mọi mẫu có cùng số lượng. Mô hình ngôn ngữ thấy một chuỗi; không gì khác về nó thay đổi.

### Who trains

- Giai đoạn một, alignment: đóng băng encoder và mô hình ngôn ngữ, và huấn luyện projector trên các cặp ảnh và caption với loss mô hình hóa ngôn ngữ trên caption. Phiên bản capstone dùng một cosine alignment loss giữa một vector ảnh pooled và một vector caption, và loss đó giảm từ khoảng 1.07 xuống khoảng 0.80 trong 200 bước với chỉ projector thay đổi.
- Giai đoạn hai, instruction tuning: mở đóng băng mô hình ngôn ngữ, thường qua adapter, giữ projector huấn luyện được, và huấn luyện trên các bộ ba ảnh, câu hỏi và câu trả lời.
- Pretraining lớn trên dữ liệu ảnh và văn bản xen kẽ nằm giữa chúng trong các công thức tiên phong và ngoài tầm với một nhóm nhỏ.

### Why the projector is enough

Encoder đã biểu diễn ảnh, và mô hình ngôn ngữ đã suy luận bằng từ. Công việc của projector là diễn đạt bên này trong từ vựng bên kia, điều một lần uốn nhỏ của không gian có thể làm. Encoder của capstone có 86M tham số và projector khoảng 1.3M; chỉ huấn luyện projector có nghĩa vài trăm bước trên một GPU.

## Follow-ups

- **Level 1:** Tại sao projector cần hai lớp và không phải một? Expected: một lớp tuyến tính quay và đổi tỷ lệ; phi tuyến giữa hai lớp cho ánh xạ uốn, đủ để căn chỉnh các đặc trưng thị giác tương phản với các embedding của một mô hình ngôn ngữ.
- **Level 2:** Mô hình ngôn ngữ thấy gì ở nơi ảnh từng ở? Expected: một chuỗi embedding, một mỗi token patch được chiếu, thay placeholder; mô hình coi chúng như token mà không xử lý đặc biệt.
- **Level 2:** Một cầu nối có một tập cố định các query được học thay đổi gì? Expected: nó nén các token patch về một số lượng cố định, tiết kiệm ngữ cảnh với cái giá một nút thắt; MLP giữ mọi patch.
- **Level 3:** Phần nào đặt trần chất lượng suy luận? Expected: mô hình ngôn ngữ; encoder chỉ có thể cấp dữ liệu cho nó, nên một mô hình ngôn ngữ lớn hơn nâng benchmark nhiều hơn một cầu nối khéo hơn.

## Wrong answers

- "Mô hình ngôn ngữ nhìn các pixel qua cross-attention vào ảnh." Trong mẫu này, ảnh đi vào như token trong chuỗi đầu vào; các cầu nối cross-attention là một họ khác.
- "Fine-tune encoder thị giác trước; nó là phần nhìn." Encoder pretrained và đóng băng ở giai đoạn một; projector là nơi ngân sách huấn luyện của một nhóm nhỏ đi vào.
- "Projector phải là một mạng lớn để mang ảnh." Nó là một MLP hai lớp nhỏ hơn encoder nhiều trong capstone, và huấn luyện trong vài phút.

## Taught in

[Bài học các mô hình thị giác-ngôn ngữ](../../../phases/04-computer-vision/25-vision-language-models/) trình bày mẫu và ba giai đoạn huấn luyện của nó, [capstone phép chiếu](../../../phases/19-capstone-projects/60-projection-layer-modality-align/) huấn luyện riêng cầu nối, và [bài học LLaVA](../../../phases/12-multimodal-ai/05-llava-visual-instruction-tuning/) đưa ra công thức tham chiếu.
