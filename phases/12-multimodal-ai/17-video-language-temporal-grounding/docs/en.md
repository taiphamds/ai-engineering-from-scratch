# Video-Language Models: Temporal Tokens and Grounding

> Video không phải chồng ảnh. Một đoạn clip 5 giây có thứ tự nhân quả, động từ hành động và thời điểm sự kiện mà mô hình ảnh không thể biểu diễn. Video-LLaMA (Zhang và cộng sự, tháng 6 năm 2023) phát hành video-LLM mở đầu tiên với khả năng neo nghe-nhìn. VideoChat và Video-LLaVA mở rộng mẫu này. Đến năm 2025, TMRoPE của Qwen2.5-VL thu hẹp khoảng cách với các mô hình độc quyền tiên tiến. Mỗi hệ thống giải quyết token thời gian theo cách khác nhau — Q-former cho mỗi clip, ghép-pool cho mỗi khung hình, TMRoPE cho mỗi token. Bài học này đọc các mẫu, xây dựng bộ lấy mẫu khung hình đồng đều so với động và đánh giá trên các tác vụ định vị theo thời gian.

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## Learning Objectives

- Giải thích tại sao mã hóa vị trí thời gian thay đổi hiệu năng VLM video độc lập với bộ mã hóa thị giác.
- So sánh lấy mẫu khung hình đồng đều, FPS động và theo sự kiện về token mỗi giây so với độ chính xác định vị.
- Mô tả các thiết kế Q-former-mỗi-clip (Video-LLaMA) so với pool-mỗi-khung-hình (Video-LLaVA) so với M-RoPE-mỗi-token (Qwen2.5-VL).
- Nêu tên bốn benchmark video: VideoMME, TempCompass, EgoSchema, Video-MMMU.

## The Problem

Một video 1 phút ở 30 FPS là 1800 khung hình. Ở 196 token thị giác mỗi khung hình (ViT-B ở 224), đó là 352k token — lớn hơn ngữ cảnh của bất kỳ LLM thời 2024 nào.

Có ba chiến lược giảm:

1. Lấy mẫu thưa khung hình (1-8 FPS tùy nội dung).
2. Pool mạnh các token patch của mỗi khung hình (pool song tuyến tính 3x3 hoặc 4x4).
3. Nén qua Q-former nhận clip 16 khung hình và xuất 64 token.

Mỗi đánh đổi khác nhau. Lấy mẫu thưa mất chi tiết thời gian. Pool mất chi tiết không gian. Q-former mất một chút cả hai nhưng tiết kiệm token.

Mã hóa vị trí thời gian là trục còn lại: mô hình biết khung hình 5 đến trước khung hình 6 bằng cách nào? Các lựa chọn gồm RoPE thời gian 1D đơn giản (Video-LLaMA), embedding thời gian học được (Video-LLaVA) và TMRoPE (Qwen2.5-VL, 3D đầy đủ).

## The Concept

### Video-LLaMA: Q-former per clip + audio branch

Video-LLaMA (2023) là video-LLM mở đầu tiên. Kiến trúc:

- Clip 16 khung hình ở 2 FPS (tức 8 giây).
- Đặc trưng ViT mỗi khung hình -> Video Q-former thực hiện cross-attention trên cả 16 khung hình -> 32 truy vấn học được -> LLM.
- Nhánh âm thanh song song: dạng sóng -> bộ mã hóa âm thanh ImageBind -> Audio Q-former -> 32 truy vấn -> LLM.

Điểm mạnh: suy luận nghe-nhìn chung. Điểm yếu: độ dài clip cố định, không định vị thời gian tùy ý.

### VideoChat and Video-LLaVA

VideoChat giữ ý tưởng Video-LLaMA nhưng bỏ âm thanh và đơn giản hóa. Video-LLaVA (Lin và cộng sự, 2023) huấn luyện một bộ mã hóa thị giác duy nhất trên cả ảnh lẫn khung hình video ("căn chỉnh trước phép chiếu"), tạo biểu diễn thống nhất. Cả hai là bộ mã hóa CLIP đóng băng + MLP + LLM.

Không mô hình nào xử lý video dài. Cả hai là hệ thống 8-16 khung hình.

### Qwen2.5-VL and TMRoPE

Qwen2.5-VL giới thiệu TMRoPE — Embedding vị trí quay thời gian-phương thức. Mỗi token patch mang vị trí (t, h, w), trong đó t là dấu thời gian thực (không phải chỉ số khung hình).

Khác biệt then chốt so với embedding thời gian đơn giản:

- Thời gian tuyệt đối, không phải chỉ số. Mô hình thấy "ở 4.2 giây", không phải "ở khung hình 15."
- Phép quay mỗi token, không phải mỗi clip. Mỗi token thị giác quay độc lập theo dấu thời gian của nó.
- Tương thích FPS động. Nếu bạn lấy mẫu ở 2 FPS chỗ này và 4 FPS chỗ kia, TMRoPE xử lý khoảng cách không đều một cách nguyên bản.

TMRoPE cho phép truy vấn "ở giây nào con mèo nhảy?". Mô hình có thể xuất "ở 4.2 giây." Video-LLaMA chỉ có thể nói "ở đầu clip."

### Frame sampling strategies

Đồng đều: lấy mẫu N khung hình đều trên thời lượng. Đơn giản, mất các đỉnh chuyển động.

FPS động: lấy mẫu thích ứng theo cường độ chuyển động. Luồng quang học hoặc sai khác khung hình chọn các đoạn chuyển động mạnh để lấy mẫu dày hơn. Qwen2.5-VL huấn luyện trên cách này.

Theo sự kiện: chạy bộ phát hiện nhẹ, lấy mẫu nhiều hơn nơi hành động diễn ra. Được VideoAgent sử dụng.

Khung hình chính + ngữ cảnh: lấy mẫu tại ranh giới cảnh quay + vài khung hình liền kề. Dùng cho nội dung điện ảnh.

### Pooling per frame

Ở 1 FPS và 576 token mỗi khung hình, clip 5 phút là 172,800 token. Khả thi với ngữ cảnh 128k của Qwen2.5-VL-72B nhưng tốn kém.

Pool song tuyến tính 3x3 giảm còn 64 token mỗi khung hình -> 19,200 token cho 5 phút. Điểm cân bằng cho phần lớn tác vụ.

Pool mạnh hơn (6x6 -> 16 token mỗi khung hình) cho quy trình agent nơi chi tiết không gian ít quan trọng hơn.

### The four video benchmarks

- VideoMME: hiểu video toàn diện, ngắn + trung bình + dài.
- TempCompass: suy luận thời gian tinh mịn, câu hỏi "trước" / "sau".
- EgoSchema: video góc nhìn thứ nhất với khoảng thời gian dài.
- Video-MMMU: câu hỏi video đa phương thức đa lĩnh vực.

Đánh giá VLM video đầy đủ bao phủ cả bốn. Chúng gây áp lực lên các trục khác nhau — TempCompass hoàn toàn về thứ tự, EgoSchema về suy luận 3+ phút, VideoMME trải trên nhiều thời lượng.

### Grounding output formats

Định dạng đầu ra cho định vị theo thời gian:

- Văn bản tự do: "Con mèo nhảy vào khoảng mốc 4 giây." Dễ phân tích cú pháp nhưng thiếu chính xác.
- JSON có cấu trúc: `{"event": "jump", "start": 4.1, "end": 4.3}`. Qwen2.5-VL huấn luyện điều này.
- Dựa trên token: token đặc biệt `<time>4.1</time>` xen kẽ với câu trả lời. Định dạng nội bộ của Qwen2.5-VL.

Dựa trên token là chính xác nhất cho sử dụng phía sau. Định dạng đầu ra JSON của Qwen2.5-VL được phân tích cú pháp trực tiếp.

### 2026 best practice

Đối với VLM video năm 2026:

- Bộ mã hóa: SigLIP 2 với M-RoPE hoặc TMRoPE (Qwen2.5-VL).
- Lấy mẫu khung hình: FPS động (1-4 tùy chuyển động) với giới hạn số khung hình tối đa.
- Pool mỗi khung hình: song tuyến tính 3x3.
- Đầu ra: JSON có cấu trúc với các trường thời gian + sự kiện.
- Benchmark: VideoMME + TempCompass cho tổng quát; EgoSchema cho khoảng thời gian dài.

```figure
video-temporal-patches
```

## Use It

`code/main.py` gồm:

- Bộ lấy mẫu khung hình đồng đều và FPS động.
- Bộ đánh giá định vị theo thời gian đơn giản: với một sự kiện "chuẩn thực tế" tại thời điểm T và đầu ra mô hình, chấm độ chính xác với dung sai.
- So sánh giữa Video-LLaMA (16 khung hình, Q-former), Video-LLaVA (8 khung hình, MLP), Qwen2.5-VL (FPS động + TMRoPE).

## Ship It

Bài học này tạo ra `outputs/skill-video-vlm-frame-planner.md`. Với một tác vụ video (giám sát, nhận dạng hành động, định vị theo thời gian, tóm tắt), nó chọn bộ lấy mẫu khung hình, hệ số pool, định dạng đầu ra và mức độ chính xác kỳ vọng.

## Exercises

1. Với một video trình diễn nấu ăn 3 phút, chọn FPS đồng đều so với động. Biện minh bằng số token.

2. TMRoPE bổ sung cụ thể điều gì mà bảng embedding thời gian đơn giản không làm được?

3. Viết lược đồ JSON cho định vị theo thời gian mà VLM có thể học phát ra. Bao gồm các trường hợp lỗi.

4. Đọc Mục 3 của Video-LLaVA về "Alignment Before Projection." Tại sao cách này tốt hơn huấn luyện bộ mã hóa ảnh và video riêng?

5. Với bảng xếp hạng VideoMME, khoảng cách giữa mô hình mở đứng đầu và mô hình độc quyền đứng đầu tính đến năm 2026 là bao nhiêu? Bao nhiêu phần khoảng cách đó do mã hóa thời gian so với quy mô LLM nền?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Temporal grounding (Định vị theo thời gian) | "Câu trả lời được định vị thời gian" | VLM xuất khoảng dấu thời gian cụ thể khi sự kiện xảy ra |
| TMRoPE | "RoPE thời gian-đa phương thức" | Vị trí quay 3D với dấu thời gian tuyệt đối, được Qwen2.5-VL sử dụng |
| Dynamic FPS (FPS động) | "Lấy mẫu nhận biết chuyển động" | Lấy mẫu nhiều khung hình hơn ở đoạn chuyển động mạnh, ít hơn ở đoạn tĩnh |
| Frame pooling (Pool khung hình) | "Nén không gian mỗi khung hình" | Giảm patch mỗi khung hình bằng nội suy song tuyến tính trước LLM |
| Video Q-former | "Bộ nén clip" | Nút thắt cross-attention ánh xạ N khung hình thành K truy vấn học được |
| VideoMME | "Benchmark video" | Benchmark video ngắn/trung bình/dài toàn diện, 2500+ mẫu |

## Further Reading

- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
