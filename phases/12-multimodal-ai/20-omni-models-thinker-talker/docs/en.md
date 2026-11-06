# Omni Models: Qwen2.5-Omni and the Thinker-Talker Split

> Bản trình diễn sản phẩm GPT-4o vào tháng 5 năm 2024 gây đột phá vì hình thái sản phẩm chứ không phải mô hình bên dưới — một giao diện giọng nói nơi bạn nói, mô hình thấy những gì camera thấy và nói lại trong dưới 250ms. Hệ sinh thái mở dành phần còn lại của năm 2024 và 2025 chạy đua để đạt bề mặt sản phẩm đó. Qwen2.5-Omni (tháng 3 năm 2025) là thiết kế mở tham khảo: Thinker (transformer tạo văn bản lớn) cộng với Talker (transformer tạo lời nói song song), được liên kết bằng token lời nói truyền luồng. Mini-Omni đơn giản hóa nó, Moshi ngang độ trễ của nó, GLM-4-Voice mở rộng nó sang tiếng Trung. Bài học này đọc kiến trúc Thinker-Talker và ngân sách độ trễ giúp đối thoại truyền luồng thời gian thực hoạt động.

**Type:** Build
**Languages:** Python (stdlib, streaming pipeline latency simulator + VAD loop)
**Prerequisites:** Phase 12 · 19 (audio-LLMs), Phase 12 · 16 (any-to-any)
**Time:** ~180 minutes

## Learning Objectives

- Chia pipeline suy luận thành Thinker (suy luận văn bản) và Talker (tổng hợp lời nói) và giải thích tại sao truyền luồng song song hoạt động.
- Tính ngân sách thời gian đến byte âm thanh đầu tiên (TTFAB) cho tương tác hội thoại, theo từng thành phần.
- Mô tả mã hóa vị trí căn chỉnh thời gian của TMRoPE trên thị giác, âm thanh và văn bản trong Thinker.
- Nêu tên ba mẫu hội thoại thời gian thực: bán song công, luân phiên lượt, song công toàn phần.

## The Problem

Trợ lý giọng nói thời gian thực phải làm nhiều việc, thật nhanh:

1. Nghe người dùng. Token hóa lời nói thời gian thực, phát hiện hoạt động giọng nói (VAD) để biết khi nào họ nói xong.
2. Tùy chọn nhìn. Đầu vào camera ở 2-4 FPS, truyền luồng vào Thinker cùng âm thanh.
3. Nghĩ. Soạn phản hồi được điều kiện hóa trên lịch sử hội thoại.
4. Nói. Tổng hợp token âm thanh, giải mã thành dạng sóng, truyền luồng đến loa của người dùng.

Mỗi bước thêm độ trễ. Cảm giác hội thoại đòi hỏi tổng thời gian khứ hồi < 500ms — dưới đó, người dùng không còn nhận thấy độ trễ. GPT-4o tuyên bố ~250ms. Moshi ~160ms. Qwen2.5-Omni ~350-500ms.

Mọi thành phần cần truyền luồng. Không thứ gì có thể là "gom mọi thứ thành lô rồi giải mã."

## The Concept

### Thinker and Talker

Cách phân tách của Qwen2.5-Omni:

- Thinker: transformer tạo văn bản 7B-80B. Tiếp nhận token văn bản + ảnh + âm thanh xen kẽ. Xuất token văn bản biểu diễn điều cần nói.
- Talker: transformer tạo lời nói nhỏ hơn (200M-1B). Tiếp nhận token đầu ra văn bản của Thinker cộng với token ngữ cảnh lời nói gần đây. Xuất token lời nói rời rạc (chỉ số residual-VQ).
- Bộ giải mã lời nói: bộ giải mã dạng sóng truyền luồng (SNAC, họ MoVQGAN) chuyển token lời nói thành mẫu âm thanh theo thời gian thực.

Việc tách biệt quan trọng. Thinker phải lớn để suy luận tốt. Talker có thể nhỏ vì công việc của nó cục bộ — chuyển văn bản thành token lời nói. Talker lớn hơn không biểu cảm hơn; nó chậm hơn.

Chạy cả hai song song:

1. Thinker phát token văn bản t_i.
2. Talker tiếp nhận t_i (qua truyền luồng) và phát token lời nói s_i, s_{i+1}, ..., s_{i+k}.
3. Bộ giải mã lời nói tiếp nhận token lời nói khi chúng đến và phát mẫu âm thanh.
4. Đến khi Thinker ở token văn bản t_{i+3}, Talker đã truyền luồng âm thanh cho t_0..t_{i+2}.

### TMRoPE — time-aligned multimodal positions

Thinker cần tích hợp khung hình ảnh (đến ở, chẳng hạn, 4 FPS), khung âm thanh (đến ở 50 khung/giây) và văn bản từ lịch sử hội thoại. Thứ tự chuỗi sơ khai (mọi ảnh, rồi mọi âm thanh, rồi văn bản) làm mất căn chỉnh thời gian.

TMRoPE gán dấu thời gian tuyệt đối cho mọi token. Token thị giác ở t=2.3s. Token âm thanh ở t=2.32s. Token văn bản từ người dùng "dừng" ở t=2.35s. RoPE quay attention theo dấu thời gian; mô hình thấy chúng đồng thời về thời gian.

Đây là hạ tầng để "anh ấy vẫy tay trong khi nói xin chào" hoạt động — mô hình thấy khung hình video và âm thanh tại cùng thời điểm về mặt khái niệm.

### Streaming speech synthesis

Token lời nói phải truyền luồng. Mini-Omni (Xie & Wu, 2024) giới thiệu "mô hình ngôn ngữ có thể nghe, nói trong khi suy nghĩ theo luồng": token đầu ra Thinker và token đầu ra Talker xen kẽ trong cùng chuỗi. Talker chạy ngay khi Thinker chốt token văn bản tiếp theo. Không có ranh giới lô.

Moshi (Défossez và cộng sự, tháng 10 năm 2024) là triển khai mở nhanh nhất. TTFAB 160ms trên một A100. Kiến trúc: một transformer 7B duy nhất phát token văn bản và lời nói ở các vị trí luân phiên, với "độc thoại nội tâm" tách luồng suy nghĩ khỏi luồng nói. Về thực chất, đây là Thinker + Talker hợp nhất thành một mô hình với huấn luyện cẩn thận.

### VAD and turn-taking

Phát hiện hoạt động giọng nói chạy ở phía đầu vào. Hai mẫu:

- Bán song công: người dùng nói, mô hình nghe. Mô hình nói, người dùng nghe. Chuyển giao rõ ràng qua phát hiện im lặng VAD (~200ms).
- Song công toàn phần: cả hai có thể nói đồng thời. Mô hình có thể phản hồi phụ ("ừ-hử") hoặc ngắt lời. Khó hơn nhiều. Moshi hỗ trợ điều này.

Qwen2.5-Omni mặc định hỗ trợ bán song công, với luân phiên lượt qua ngưỡng im lặng. Song công toàn phần đòi hỏi xử lý ở tầng ứng dụng.

### Qwen3-Omni (November 2025)

Phiên bản kế nhiệm. Thinker Qwen3-80B, Talker lớn hơn, TMRoPE-v2 cải tiến. Độ trễ gần 250ms của GPT-4o. Trọng số mở. Benchmark trên OmniBench cạnh tranh với Gemini 2.0 Live.

### Production latency budget

Với tương tác truyền luồng điển hình:

- Mic -> token âm thanh: 40-80ms.
- Nạp trước (prompt + lịch sử): 100-200ms ở 7B, nhiều hơn nhiều ở 70B.
- Token văn bản Thinker đầu tiên: 40ms.
- Talker xử lý token văn bản đầu tiên: 20ms.
- Chốt các token lời nói đầu tiên: 40ms.
- Giải mã residual-VQ: 30ms.
- Giải mã dạng sóng lời nói: 50-80ms.

Tổng TTFAB: 320-510ms ở 7B, 600-900ms ở 70B. Chất lượng tiên tiến nhất thường có nghĩa 70B+; vì vậy có khoảng cách độ trễ ở mức tiên tiến nhất.

### Token-rate math

Với lời nói 16kHz cùng token lời nói cơ sở 50 Hz, bạn cần 50 token lời nói mỗi giây đầu ra. Talker phải phát ≥50 tok/s để theo kịp. Ở thông lượng LLM điển hình 30-80 tok/s trên H100, Talker nhỏ (200-300M) đủ nhanh; Talker 7B sẽ tụt lại.

Đây là lý do các mô hình Talker chuyên dụng nhỏ tồn tại thay vì "chỉ dùng mô hình chính."

```figure
l5-thinker-talker
```

## Use It

`code/main.py`:

- Mô phỏng pipeline Thinker-Talker với tốc độ phát token giả lập.
- Tính TTFAB cho kích thước mô hình và tốc độ lấy mẫu mic có thể cấu hình.
- Minh họa luân phiên lượt bán song công với ngưỡng im lặng VAD.

## Ship It

Bài học này tạo ra `outputs/skill-omni-streaming-budget.md`. Với TTFAB mục tiêu và tập tính năng (thị giác đầu vào, song ngữ, song công toàn phần) của sản phẩm giọng nói thời gian thực, chọn Qwen2.5-Omni, Qwen3-Omni, Moshi hoặc Mini-Omni và xác định kích thước Thinker/Talker.

## Exercises

1. TTFAB mục tiêu của bạn là 300ms. Trên Thinker 7B và Talker 300M, viết ra độ trễ của mọi thành phần.

2. Qwen2.5-Omni dùng TMRoPE. Mô tả những gì mô hình thấy với prompt nơi người dùng bắt đầu nói ở t=1s và camera bắt được cử chỉ ở t=1.2s.

3. Hỗ trợ song công toàn phần đòi hỏi mô hình phát âm thanh trong khi nghe. Đề xuất định dạng dữ liệu huấn luyện dạy điều này.

4. Đọc Mục 4 của bài báo Moshi. Mô tả sự tách biệt "độc thoại nội tâm" và tại sao nó tránh việc chia Thinker-Talker.

5. Tính ngân sách thông lượng: Talker phải phát token nhanh đến đâu để theo kịp lời nói 16kHz ở 50 token lớp cơ sở/giây?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Thinker (Bộ suy nghĩ) | "Bộ não suy luận" | Transformer tạo văn bản lớn tạo ra điều cần nói |
| Talker (Bộ nói) | "Miệng tạo lời nói" | Transformer nhỏ tạo token lời nói rời rạc từ văn bản Thinker |
| TTFAB | "Ngân sách độ trễ" | Thời gian đến byte âm thanh đầu tiên: từ lúc người dùng nói xong đến mẫu âm thanh đầu tiên ra |
| TMRoPE | "RoPE căn chỉnh thời gian" | Mã hóa vị trí dùng dấu thời gian tuyệt đối trên thị giác, âm thanh, văn bản |
| Half-duplex (Bán song công) | "Luân phiên lượt" | Người dùng và mô hình luân phiên; im lặng VAD phát hiện người dùng nói xong |
| Full-duplex (Song công toàn phần) | "Đồng thời" | Mô hình có thể nói và nghe cùng lúc; có khả năng phản hồi phụ |
| Inner monologue (Độc thoại nội tâm) | "Sự tách biệt của Moshi" | Thiết kế một mô hình trong đó luồng suy nghĩ và luồng nói xen kẽ |

## Further Reading

- [Xu et al. — Qwen2.5-Omni (arXiv:2503.20215)](https://arxiv.org/abs/2503.20215)
- [Qwen Team — Qwen3-Omni (arXiv:2509.17765)](https://arxiv.org/html/2509.17765v1)
- [Xie & Wu — Mini-Omni (arXiv:2408.16725)](https://arxiv.org/abs/2408.16725)
- [Défossez et al. — Moshi (arXiv:2410.00037)](https://arxiv.org/abs/2410.00037)
- [Zeng et al. — GLM-4-Voice (arXiv:2412.02612)](https://arxiv.org/abs/2412.02612)
