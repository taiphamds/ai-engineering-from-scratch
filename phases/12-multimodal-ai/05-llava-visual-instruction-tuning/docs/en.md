# LLaVA and Visual Instruction Tuning

> LLaVA (tháng 4 năm 2023) là kiến trúc đa phương thức được sao chép nhiều nhất hành tinh. Nó thay Q-Former của BLIP-2 bằng một MLP 2 lớp, thay cross-attention có cổng của Flamingo bằng việc nối token ngây thơ và huấn luyện trên 158k lượt chỉ dẫn thị giác do GPT-4 tạo từ các chú thích chỉ có văn bản. Bất kỳ người thực hành nào xây dựng một VLM giữa năm 2023 và 2026 đều xây dựng một biến thể nào đó của LLaVA. LLaVA-1.5 chuyển sang một MLP projector và một encoder 336px. LLaVA-NeXT thêm chia ô AnyRes cho đầu vào độ phân giải cao. LLaVA-OneVision thống nhất hình ảnh, nhiều hình ảnh và video trong một công thức. Bài học này đọc công thức, triển khai projector và giải thích vì sao "đơn giản hơn đã thắng."

**Type:** Build
**Languages:** Python (stdlib, projector + instruction-template builder)
**Prerequisites:** Phase 12 · 02 (CLIP), Phase 11 (LLM Engineering — instruction tuning)
**Time:** ~180 minutes

## Learning Objectives

- Xây projector MLP 2 lớp ánh xạ embedding patch ViT (chiều 1024) sang chiều embedding LLM (chiều 4096).
- Đi qua công thức hai giai đoạn LLaVA: (1) căn chỉnh projector trên 558k cặp chú thích, (2) visual instruction tuning trên 158k lượt GPT-4 sinh.
- Xây prompt định dạng LLaVA với chỗ giữ token ảnh, system prompt và lượt người dùng/trợ lý.
- Giải thích tại sao cộng đồng chuyển từ Q-Former sang MLP dù Q-Former thắng về ngân sách token.

## The Problem

Q-Former của BLIP-2 (Bài 12.03) nén ảnh thành 32 token. Gọn, hiệu quả, tốt cho benchmark. Nhưng có hai vấn đề.

Thứ nhất, Q-Former có thể huấn luyện nhưng loss không phải tác vụ cuối. Giai đoạn 1 huấn luyện ITC+ITM+ITG. Giai đoạn 2 huấn luyện LM loss. Query học một biểu diễn trung gian nào đó mà LLM rồi phải giải mã. Thông tin mất trong nút thắt.

Thứ hai, Q-Former tốn 188M tham số, và ở quy mô LLaVA năm 2023 bạn phải đồng thiết kế với LLM đích. Đổi LLM, huấn luyện lại Q-Former. Đổi encoder thị giác, huấn luyện lại. Mọi tổ hợp là dự án R&D riêng.

Câu trả lời LLaVA đơn giản đến ngượng: lấy 576 token patch ViT, đưa mỗi token qua MLP 2 lớp (`1024 → 4096 → 4096`) và đổ cả 576 vào chuỗi đầu vào LLM. Không nút thắt. Không tiền huấn luyện giai đoạn 1 trên mục tiêu lạ. Chỉ huấn luyện MLP bằng LM loss trực tiếp.

Dữ liệu đến từ đâu? Nhận thức thứ hai LLaVA: dùng GPT-4 (chỉ văn bản) để sinh dữ liệu chỉ dẫn. Đưa GPT-4 chú thích COCO và dữ liệu hộp giới hạn của ảnh, yêu cầu tạo hội thoại, mô tả và câu hỏi suy luận phức tạp. 158k lượt chỉ dẫn-phản hồi miễn phí. Không chú giải con người.

Kết quả: VLM chạy trên 8 A100 trong một ngày, vượt Flamingo trên MMMU và phát hành checkpoint mở mà cộng đồng mở rộng được. Đến cuối năm 2023 nó sinh 50+ fork.

## The Concept

### The architecture

LLaVA-1.5 ở 7B:
- Encoder thị giác: CLIP ViT-L/14 @ 336 (đóng băng giai đoạn 1, tùy chọn mở băng giai đoạn 2).
- Projector: MLP 2 lớp với kích hoạt GELU, `1024 → 4096 → 4096`.
- LLM: Vicuna-7B v1.5 (một biến thể 13B sử dụng Vicuna-13B; các bản fork sau này chuyển sang Llama-3.1-8B).

Forward pass trên ảnh + prompt văn bản:

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

Ảnh chiếm 576 token ngữ cảnh LLM. Ở ngữ cảnh 2048, còn 1472 token cho văn bản. Ở ngữ cảnh 32k, đó là sai số làm tròn.

### Stage 1: projector alignment

Đóng băng ViT. Đóng băng LLM. Chỉ huấn luyện MLP 2 lớp. Bộ dữ liệu: 558k cặp ảnh-chú thích (LAION-CC-SBU). Loss: mô hình hóa ngôn ngữ trên chú thích, điều kiện hóa theo token ảnh đã chiếu.

Trong một epoch ở batch 128, việc này xong trong vài giờ. Projector học ánh xạ không gian ViT sang không gian LLM. Không giám sát riêng tác vụ.

### Stage 2: visual instruction tuning

Mở băng projector (vẫn có thể huấn luyện). Mở băng LLM (thường toàn phần, đôi khi LoRA). Huấn luyện trên 158k lượt chỉ dẫn thị giác.

Dữ liệu chỉ dẫn là thủ thuật. Liu và cộng sự sinh bằng:
1. Lấy ảnh COCO.
2. Trích mô tả văn bản (5 chú thích con người + danh sách hộp giới hạn).
3. Gửi GPT-4 với ba khuôn mẫu prompt:
   - Hội thoại: "Sinh đối thoại qua lại giữa người dùng và trợ lý về ảnh này."
   - Mô tả chi tiết: "Đưa mô tả phong phú, chi tiết về ảnh."
   - Suy luận phức tạp: "Đặt câu hỏi cần suy luận về ảnh, rồi trả lời."
4. Phân tích đầu ra GPT-4 thành cặp (chỉ dẫn, phản hồi).

Không phần nào chạm trực tiếp ảnh — chỉ mô tả văn bản. GPT-4 ảo giác nội dung ảnh hợp lý. Có nhiễu, nhưng hoạt động: 158k lượt đủ mở khóa đối thoại.

### Why the community copied this

- Không loss riêng giai đoạn 1 để tinh chỉnh. LM loss xuyên suốt.
- Projector huấn luyện trong vài giờ, không phải nhiều ngày.
- Có thể đổi LLM (LLaVA-Llama2, LLaVA-Mistral, LLaVA-Llama3) bằng chỉ huấn luyện lại projector.
- Pipeline dữ liệu chỉ dẫn thị giác dùng GPT-4 và rẻ để sinh lại cho miền mới.

### LLaVA-1.5 and LLaVA-NeXT

LLaVA-1.5 (tháng 10 năm 2023) thêm:
- Dữ liệu tác vụ học thuật (VQA, OKVQA, RefCOCO) trộn vào instruction tuning.
- System prompt tốt hơn.
- Một MLP projector 2 lớp thay cho lớp tuyến tính đơn ban đầu, và CLIP ViT-L/14 ở 336px (576 token) thay cho 224px (256 token). Các chuỗi huấn luyện giữ ở 2048 token.
- Một biến thể HD chia lưới trong bài báo, mà LLaVA-NeXT sau đó phát hành dưới tên AnyRes.

LLaVA-NeXT (tháng 1 năm 2024) thêm:
- AnyRes: chia các hình ảnh độ phân giải cao thành một lưới 2x2 hoặc 1x3 các ảnh cắt 336x336, cộng một ảnh thu nhỏ toàn cục độ phân giải thấp. Mỗi ảnh cắt trở thành 576 token. Một lưới 2x2 cộng ảnh thu nhỏ cho khoảng 2880 token thị giác mỗi hình ảnh. Một lưới 1x3 có ít ảnh cắt hơn, vì vậy tốn ít token hơn. Các tác vụ OCR và biểu đồ cải thiện mạnh.
- Hỗn hợp dữ liệu chỉ dẫn tốt hơn với ShareGPT4V (chú thích GPT-4V chất lượng cao).
- LLM cơ sở mạnh hơn (Mistral-7B, Yi-34B).

### LLaVA-OneVision

Bài 12.08 trình bày sâu OneVision. Bản ngắn: cùng projector, nhưng huấn luyện theo giáo trình bao quát một ảnh, nhiều ảnh và video trong một mô hình với ngân sách token thị giác dùng chung.

### The comparison to Q-Former

| | Q-Former (BLIP-2) | MLP (LLaVA) |
|---|---|---|
| Token thị giác mỗi hình ảnh | 32 | 576 (cơ sở) hoặc khoảng 2880 (AnyRes, lưới 2x2) |
| Tham số có thể huấn luyện | 188M + LM | ~22M (7B) + LM |
| Loss giai đoạn 1 | ITC+ITM+ITG | Chỉ LM |
| Thay LLM trực tiếp | Cần huấn luyện lại | Đổi với huấn luyện lại tối thiểu |
| Nhiều ảnh | Khó xử lý | Tự nhiên (nối) |
| Video | Khó xử lý | Tự nhiên (nối mỗi khung) |
| Ngân sách token | Nhỏ | Lớn |

MLP thắng về đơn giản và linh hoạt token. Q-Former thắng về ngân sách token. Đến cuối năm 2023 ngân sách token không còn ràng buộc chi phối (ngữ cảnh LLM tăng đến 32k-128k+) và đơn giản thống trị.

### The prompt format

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>` là một token placeholder. Trước khi tách token, nó được thay bằng 576 token thị giác (hoặc khoảng 2880 với một lưới AnyRes 2x2). Tokenizer nhìn thấy một chuỗi dài hơn một chút so với chuỗi nó đã được huấn luyện, nhưng LLM xử lý đầu vào mới lạ vì giai đoạn 1 đã dạy nó làm vậy.

### Parameter economy

Phân tích LLaVA-1.5-7B:
- CLIP ViT-L/14 @ 336: 303M (đóng băng giai đoạn 1, thường mở băng giai đoạn 2).
- Projector (2x tuyến tính): ~22M có thể huấn luyện.
- Llama-7B: 7B.
- Tổng: 7.3B tham số. Có thể huấn luyện trong giai đoạn 2: toàn 7B + projector 22M.

Chi phí huấn luyện giai đoạn 2: ~20 giờ trên 8xA100. Đây là con số chính — một ngày, một node, tái lập được. Đó là lý do LLaVA lan rộng.

```figure
mm-llava-projector
```

## Use It

`code/main.py` triển khai:

1. Projector MLP 2 lớp (chiều 16 → 32 → 32 cho quy mô minh họa) bằng Python thuần.
2. Pipeline xây prompt: system prompt + `<image>` thay bằng N token đã chiếu + lượt người dùng + chỗ giữ sinh trợ lý.
3. Bộ trực quan hóa khối thị giác 576 token trông thế nào trong ngữ cảnh LLM (phần trăm ngữ cảnh 2k / 32k / 128k tiêu thụ).

## Ship It

Bài học này tạo `outputs/skill-llava-vibes-eval.md`. Với checkpoint họ LLaVA, nó chạy bộ đánh giá cảm tính 10 prompt (3 chú thích, 3 VQA, 2 suy luận, 2 từ chối) và báo bảng điểm dễ đọc. Không phải benchmark; kiểm thử khói để xác nhận projector và LLM kết nối tốt.

## Exercises

1. Tính số tham số có thể huấn luyện của projector MLP 2 lớp ở `1024 → 4096 → 4096`. Với GELU và bias, nó chiếm tỷ phần nào của LLaVA-13B?

2. Xây prompt LLaVA cho trường hợp "từ chối" — ảnh chứa cá nhân riêng tư. Viết phản hồi trợ lý kỳ vọng. Tại sao LLaVA nên từ chối zero-shot điều này và cần dữ liệu huấn luyện nào củng cố từ chối?

3. Đọc phần AnyRes của blog LLaVA-NeXT. Tính số token thị giác cho ảnh 1344x672 ở AnyRes. So với 576 token cơ sở ở 336x336.

4. Projector giai đoạn 1 LLaVA huấn luyện bằng LM loss trên chú thích. Điều gì xảy ra nếu bỏ giai đoạn 1 và đi thẳng giai đoạn 2 (visual instruction tuning)? Trích thí nghiệm loại bỏ thành phần Prismatic VLMs (arXiv:2402.07865) để trả lời.

5. LLaVA-Instruct-150k dùng GPT-4 với chú thích COCO để sinh chỉ dẫn. Với miền mới (X-quang y tế, ảnh vệ tinh), mô tả pipeline dữ liệu bốn bước sinh chỉ dẫn miền. Điều gì có thể sai ở mỗi bước?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Projector (Bộ chiếu) | "Cầu nối MLP" | MLP 2 lớp với GELU ánh xạ chiều ViT sang chiều LLM |
| Image token (Token ảnh) | "Chỗ giữ <image>" | Dấu prompt được thay bằng N token thị giác đã chiếu trước suy luận |
| Visual instruction tuning (Tinh chỉnh chỉ dẫn thị giác) | "Giai đoạn 2 LLaVA" | Huấn luyện trên bộ ba (ảnh, chỉ dẫn, phản hồi) do GPT-4 sinh |
| Stage 1 alignment (Căn chỉnh giai đoạn 1) | "Tiền huấn luyện projector" | Đóng băng ViT và LLM, huấn luyện projector bằng LM loss trên chú thích |
| AnyRes | "Chia ô nhiều crop" | Chia ảnh độ phân giải cao thành lưới ô và nối token thị giác mỗi ô |
| LLaVA-Instruct | "Do GPT-4 sinh" | 158k cặp chỉ dẫn-phản hồi tổng hợp từ chú thích COCO + GPT-4 |
| Vision encoder freeze (Đóng băng encoder thị giác) | "Backbone khóa" | Trọng số CLIP không cập nhật giai đoạn 1, đôi khi cả giai đoạn 2 |
| ShareGPT4V | "Chú thích tốt hơn" | 1M chú thích dày đặc do GPT-4V sinh, dùng cho căn chỉnh chất lượng cao hơn |
| VQA | "Trả lời câu hỏi thị giác" | Tác vụ trả lời câu hỏi dạng tự do về ảnh |
| Prismatic VLMs | "Bài báo không gian thiết kế" | Thí nghiệm loại bỏ thành phần Karamcheti 2024 kiểm thử có hệ thống lựa chọn projector và dữ liệu |

## Further Reading

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) — bài báo LLaVA.
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) — LLaVA-1.5.
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793) — bộ dữ liệu chú thích dày đặc.
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) — thí nghiệm loại bỏ thành phần không gian thiết kế.
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) — thống nhất một ảnh, nhiều ảnh, video.
