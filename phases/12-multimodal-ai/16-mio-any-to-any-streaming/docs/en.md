# MIO and Any-to-Any Streaming Multimodal Models

> GPT-4o cung cấp một sản phẩm mà phần lớn mô hình mở không thể tái hiện: một agent nghe giọng nói, nhìn video và nói lại theo thời gian thực. Câu trả lời của hệ sinh thái mở vào cuối năm 2024 là MIO (Wang và cộng sự, tháng 9 năm 2024). MIO token hóa văn bản, ảnh, lời nói và âm nhạc, huấn luyện một transformer nhân quả trên các chuỗi xen kẽ và tạo sinh từ bất kỳ phương thức nào sang bất kỳ phương thức nào. AnyGPT (Zhan và cộng sự, tháng 2 năm 2024) là minh chứng khái niệm; MIO là phiên bản mở rộng quy mô; Unified-IO 2 (Allen AI, tháng 12 năm 2023) là họ hàng với thị giác + neo hành động. Bài học này đọc mẫu any-to-any — bốn tokenizer, một transformer, giải mã thuận lợi cho truyền luồng.

**Type:** Learn
**Languages:** Python (stdlib, four-modality token allocator + streaming decode loop)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 6 (Speech and Audio)
**Time:** ~120 minutes

## Learning Objectives

- Thiết kế bộ từ vựng dùng chung chứa token văn bản, ảnh, lời nói và âm nhạc mà không xung đột.
- So sánh SEED-Tokenizer (ảnh) và residual-VQ của SpeechTokenizer (lời nói) về đánh đổi nén + tái tạo.
- Giải thích chương trình bốn giai đoạn xây dựng dần khả năng tạo sinh any-to-any.
- Nêu tên ba công thức any-to-any mở và các đánh đổi chính: MIO, AnyGPT, Unified-IO 2.

## The Problem

Một mô hình đa phương thức thống nhất dễ tuyên bố và khó xây dựng ở quy mô lớn. Phần lớn hệ thống "any-to-any" cho đến năm 2024 là pipeline: mô hình thị giác → biểu diễn văn bản → mô hình lời nói → âm thanh. Mỗi bước chuyển làm mất thông tin, thêm độ trễ và làm phức tạp huấn luyện. Video trình diễn GPT-4o cho thấy phương án một mô hình với phản hồi dưới một giây; các hệ thống mở chậm sau nhiều tháng.

Các thách thức kỹ thuật:

- Tokenizer phải tồn tại cho mọi phương thức, nén đủ ít mất mát để tái tạo và tạo token ở tốc độ transformer có thể tiếp nhận.
- Một từ vựng duy nhất phải phân bổ chỗ cho văn bản (32k+), hình ảnh (8k+), lời nói (4k+), âm nhạc (8k+). Tối thiểu hơn năm mươi nghìn phần tử.
- Dữ liệu huấn luyện phải bao phủ mọi cặp đầu vào-đầu ra (văn bản→ảnh, ảnh→lời nói, lời nói→ảnh, v.v.) hoặc mô hình phải kết hợp.
- Suy luận phải truyền luồng token đầu ra đủ nhanh cho độ trễ hội thoại (<500ms đến byte âm thanh đầu tiên).

## The Concept

### Four tokenizers for four modalities

Ngăn xếp tokenizer của MIO:

- Văn bản: BPE tiêu chuẩn, bộ từ vựng ~32000.
- Hình ảnh: SEED-Tokenizer (2023), một tokenizer hình ảnh rời rạc với một codebook 8192 phần tử xuất ra 32 token mỗi hình ảnh.
- Lời nói: SpeechTokenizer residual-VQ (2023), mã hóa một dạng sóng 16kHz thành 8 codebook phân cấp; cấp đầu là nội dung thô, các cấp sau thêm ngữ điệu và danh tính người nói. MIO giữ cấp nội dung cộng ba cấp âm sắc đầu tiên, mỗi cấp 1024 mã, vì vậy có 4096 ID lời nói.
- Âm nhạc: residual-VQ tương tự (họ MusicGen / Encodec của Meta), 4-8 codebook. Bản thân MIO không cung cấp một tokenizer âm nhạc (phương thức thứ tư của nó là video, dưới dạng các khung hình qua tokenizer hình ảnh); ví dụ đồ chơi của bài học này thêm âm nhạc để cho thấy một phương thức mới chiếm một khoảng ID như thế nào.

Mỗi phương thức tạo token số nguyên. Các token nhận các dải ID không giao nhau trong bộ từ vựng dùng chung:

```
text:   0..31999
image:  32000..40191  (8192 image tokens)
speech: 40192..44287  (4 codebooks x 1024 speech tokens)
music:  44288..52479  (8192 music tokens, the toy's extension)
sep:    52480..52485  (<image>, <speech>, <music>, </...>)
```

Tổng: từ vựng ~52k. Embedding đầu vào và phép chiếu đầu ra bao phủ toàn bộ nó.

### Streaming decode

Tạo lời nói sử dụng residual-VQ. Transformer dự đoán các token lời nói cơ sở (lớp 0); một bộ lượng tử hóa phần dư được giải mã song song dự đoán các lớp tiếp theo. Mỗi token lớp 0 tương đương khoảng 50ms âm thanh ở 16kHz.

Mẫu truyền luồng:

1. Người dùng nói vào mic; tokenizer âm thanh thời gian thực phát token lời nói mỗi 50ms.
2. MIO tiếp nhận token khi chúng đến (nạp trước prompt + truyền xuôi tăng dần).
3. Token đầu ra được truyền luồng khi tạo ra; một bộ giải mã lời nói song song chuyển chúng thành mẫu âm thanh với độ trễ ~50-150ms.
4. Thời gian đến byte âm thanh đầu tiên: bài báo MIO không báo cáo con số độ trễ. Ngân sách bên dưới đặt thiết kế này ở xấp xỉ 300ms trong trường hợp tốt nhất, so với ~250ms của GPT-4o.

Mini-Omni (arXiv:2408.16725), GLM-4-Voice (arXiv:2412.02612) và Moshi (arXiv:2410.00037) là các thiết kế LLM lời nói truyền luồng bổ trợ. Riêng Moshi đạt thời gian khứ hồi 160ms trên một GPU.

### Four-stage curriculum

Chương trình huấn luyện của MIO:

1. Giai đoạn 1 — căn chỉnh. Các tập ngữ liệu cặp phương thức quy mô lớn: văn bản-ảnh, văn bản-lời nói, văn bản-âm nhạc. Mỗi cặp dùng phân đoạn từ vựng token riêng. Huấn luyện bộ từ vựng dùng chung.
2. Giai đoạn 2 — xen kẽ. Tài liệu xen kẽ nhiều phương thức (blog có ảnh + video, podcast có bản chép lời, v.v.). Huấn luyện ngữ cảnh chéo phương thức.
3. Giai đoạn 3 — tăng cường lời nói. Dữ liệu âm thanh bổ sung để nâng chất lượng lời nói mà không mất khả năng văn bản.
4. Giai đoạn 4 — SFT. Tinh chỉnh chỉ dẫn trên các phương thức: VQA, tạo chú thích, tường thuật, đối thoại lời nói sang lời nói.

Thiếu một giai đoạn làm suy giảm các khả năng cụ thể: bỏ giai đoạn 2 thì mô hình mất ngữ cảnh chéo phương thức; bỏ giai đoạn 3 thì lời nói kém.

### Chain-of-visual-thought

MIO giới thiệu chuỗi suy nghĩ thị giác: mô hình phát token ảnh trung gian như một bước suy luận. Với "con mèo có đang trèo cây không?", mô hình:

1. Phát token `<image>` kết xuất cảnh (từ ảnh đầu vào hoặc một bản phác họa).
2. Phát văn bản phân tích bản phác họa.
3. Phát câu trả lời cuối cùng.

Ảnh trung gian được kết xuất đóng vai trò trang nháp. Benchmark cải thiện trên các tác vụ suy luận không gian. Ý tưởng phản chiếu chuỗi suy nghĩ cho suy luận văn bản.

### Competitors in any-to-any

- AnyGPT (arXiv:2402.12226): 4 phương thức (văn bản, ảnh, lời nói, âm nhạc), thiết kế tương tự.
- Unified-IO 2 (arXiv:2312.17172): thêm đầu ra hành động thị giác, độ sâu, pháp tuyến. Tác vụ đa dạng hơn, quy mô nhỏ hơn.
- NExT-GPT (arXiv:2309.05519): LLM + bộ giải mã khuếch tán riêng cho từng phương thức. Không phải cách tiếp cận một mô hình.
- CoDi (arXiv:2305.11846): khuếch tán có thể kết hợp; any-to-any qua biến tiềm ẩn dùng chung.

MIO gần nhất với any-to-any thuần token. AnyGPT là tổ tiên khái niệm của nó.

### Latency budget

Với sản phẩm hội thoại, độ trễ của mọi thành phần đều quan trọng:

- Mic đến token âm thanh: ~50ms.
- Nạp trước (token âm thanh + lịch sử): ~100ms trên mô hình 8B.
- Token đầu ra đầu tiên: ~50ms.
- Residual-VQ song song + bộ giải mã lời nói: ~100-150ms.

Tổng thời gian đến byte âm thanh đầu tiên: tối thiểu ~300ms. GPT-4o tuyên bố ~250ms. Moshi tuyên bố 160ms. Cả MIO lẫn AnyGPT đều không công bố số liệu đo được, vì vậy hãy xem ngân sách này là một ước tính, không phải một benchmark.

### Why any-to-any stays hard

Ngay cả năm 2026, các mô hình any-to-any mở vẫn kém các mô hình đóng trên hai trục:

- Chất lượng lời nói. Tokenizer residual-VQ có mất mát; lời nói hội thoại nghe như robot so với giọng nói hạng ElevenLabs.
- Suy luận chéo phương thức. Yêu cầu mô hình "hát về những gì bạn nhìn thấy" vẫn thất bại thường xuyên hơn các tác vụ thuần thị giác.

Đây là các vấn đề nghiên cứu còn mở. Qwen3-Omni (Bài học 12.20) là thử nghiệm mở tiên tiến nhất năm 2025.

```figure
any-to-any-stream
```

## Use It

`code/main.py`:

- Định nghĩa phân bổ bộ từ vựng bốn phương thức và in nó.
- Định tuyến một danh sách đầu vào đa phương thức (văn bản, ảnh, đoạn âm thanh, âm nhạc) qua bộ định tuyến tokenizer.
- Mô phỏng giải mã truyền luồng cho phản hồi văn bản thành lời nói với việc đếm độ trễ.
- Tính thời gian kỳ vọng đến byte âm thanh đầu tiên với độ trễ bộ mã hóa, nạp trước và bộ giải mã đã cho.

## Ship It

Bài học này tạo ra `outputs/skill-any-to-any-pipeline-auditor.md`. Với một đặc tả sản phẩm hội thoại (các phương thức vào, các phương thức ra, mục tiêu độ trễ), nó kiểm tra các lựa chọn thiết kế họ MIO và tính ngân sách độ trễ.

## Exercises

1. Sản phẩm của bạn nhận đầu vào lời nói và trả đầu ra lời nói. Mục tiêu ngân sách độ trễ đầu cuối là gì? Liệt kê các thành phần tiêu tốn thời gian.

2. Residual-VQ của SpeechTokenizer dùng 8 codebook. Đề xuất lý do việc giải mã song song các cấp phần dư là cần thiết (so với tuần tự) và mức tiết kiệm độ trễ nó mang lại.

3. Từ vựng của bạn có 32k văn bản + 8k hình ảnh + 4k lời nói. Thêm 8k âm nhạc và ~10 dấu phân cách. Chi phí tham số của ma trận embedding ở chiều ẩn 4096 là bao nhiêu?

4. Chuỗi suy nghĩ thị giác phát ra một ảnh trung gian. Những loại câu hỏi nào được lợi? Những loại nào bị ảnh hưởng xấu bởi token bổ sung?

5. Đọc Moshi (arXiv:2410.00037). Mô tả kỹ thuật "độc thoại nội tâm" của nó và so sánh với chuỗi suy nghĩ thị giác của MIO.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Any-to-any (Bất kỳ phương thức nào sang bất kỳ phương thức nào) | "Đa phương thức vào/ra" | Một mô hình duy nhất nhận và phát văn bản, ảnh, lời nói và âm nhạc theo bất kỳ hướng nào |
| Residual-VQ | "Ngăn xếp tokenizer lời nói" | Token hóa nhiều codebook trong đó mỗi lớp thêm thông tin; lớp cơ sở là nội dung, các lớp sau là ngữ điệu |
| SEED-Tokenizer | "Mã hình ảnh" | Tokenizer hình ảnh rời rạc với một codebook 8192 phần tử và 32 token mỗi hình ảnh, được MIO sử dụng |
| Chain-of-visual-thought (Chuỗi suy nghĩ thị giác) | "Trang nháp thị giác" | Mô hình tạo một ảnh trung gian như bước suy luận trước câu trả lời cuối cùng |
| Time-to-first-audio-byte (Thời gian đến byte âm thanh đầu tiên) | "TTFAB" | Độ trễ từ giọng nói người dùng đến đầu ra âm thanh đầu tiên; <500ms để có cảm giác hội thoại |
| Four-stage curriculum (Chương trình bốn giai đoạn) | "Công thức huấn luyện" | Căn chỉnh -> xen kẽ -> tăng cường lời nói -> SFT, theo thứ tự đó |

## Further Reading

- [Wang et al. — MIO (arXiv:2409.17692)](https://arxiv.org/abs/2409.17692)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Lu et al. — Unified-IO 2 (arXiv:2312.17172)](https://arxiv.org/abs/2312.17172)
- [Wu et al. — NExT-GPT (arXiv:2309.05519)](https://arxiv.org/abs/2309.05519)
- [Tang et al. — CoDi (arXiv:2305.11846)](https://arxiv.org/abs/2305.11846)
