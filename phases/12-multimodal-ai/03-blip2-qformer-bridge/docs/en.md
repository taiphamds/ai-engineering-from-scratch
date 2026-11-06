# From CLIP to BLIP-2 — Q-Former as Modality Bridge

> CLIP căn chỉnh hình ảnh và văn bản nhưng không thể tạo chú thích, trả lời câu hỏi hoặc trò chuyện. BLIP-2 (Salesforce, 2023) giải quyết điều đó bằng một cầu nối nhỏ có thể huấn luyện: 32 vector query có thể học chú ý đến các đặc trưng của một ViT đóng băng qua cross-attention, rồi đi trực tiếp vào luồng đầu vào của một LLM đóng băng. 188M tham số cầu nối kết nối một ViT-g/14 với các LLM đóng băng lớn đến Flan-T5-XXL 11B. Mọi VLM dựa trên adapter đến năm 2026 — MiniGPT-4, InstructBLIP, các mô hình họ hàng của LLaVA — đều là hậu duệ. Bài học này đọc kiến trúc Q-Former, giải thích quá trình huấn luyện hai giai đoạn và xây dựng một phiên bản đồ chơi đưa các token thị giác vào một decoder văn bản đóng băng.

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**Prerequisites:** Phase 12 · 02 (CLIP), Phase 7 (Transformers)
**Time:** ~180 minutes

## Learning Objectives

- Giải thích tại sao nút thắt có thể huấn luyện giữa encoder thị giác đóng băng và LLM đóng băng thắng finetuning từ đầu đến cuối về chi phí và ổn định.
- Triển khai khối cross-attention nơi tập query có thể học cố định attend đến đặc trưng ảnh bên ngoài.
- Đi qua tiền huấn luyện hai giai đoạn BLIP-2: biểu diễn (ITC + ITM + ITG) rồi sinh (LM loss với decoder đóng băng).
- So Q-Former với projector MLP đơn giản hơn dùng trong LLaVA và lập luận khi nào mỗi lựa chọn thắng.

## The Problem

Bạn có ViT đóng băng tạo 256 token patch chiều 1408 mỗi ảnh. Bạn có LLM 7B đóng băng kỳ vọng embedding token chiều 4096. Cầu nối hiển nhiên — lớp tuyến tính từ 1408 đến 4096 — hoạt động, nhưng đưa cả 256 token patch vào ngữ cảnh LLM tốn thêm 256 token mỗi ảnh. Trên batch 32 ảnh, đó là 8192 token chỉ phương thức thị giác tiêu thụ.

Câu hỏi BLIP-2: có thể nén biểu diễn ảnh 256 token thành ít token hơn nhiều (chẳng hạn 32) mà giữ đủ thông tin cho LLM chú thích, trả lời câu hỏi và suy luận về ảnh? Và có thể huấn luyện cầu nối mà không chạm backbone đóng băng, giữ chi phí huấn luyện chỉ ở tham số cầu nối?

Câu trả lời: Q-Former. 32 vector "query" có thể học cross-attend đến token patch ViT, tạo tóm tắt thị giác 32 token mà LLM tiêu thụ. Tổng 188M tham số. Huấn luyện với mục tiêu tương phản, khớp và sinh trước khi chạm đến LLM.

## The Concept

### Learnable queries

Thủ thuật cốt lõi Q-Former: thay vì để token văn bản LLM attend đến patch ảnh, đưa vào tập mới gồm 32 vector query có thể học `Q` và để *chúng* attend đến patch ảnh. Query là tham số mô hình — học trong huấn luyện và cùng 32 query được dùng cho mọi ảnh.

Sau cross-attention, mỗi query giữ bản tóm tắt ảnh được nén — "mô tả đối tượng chính", "mô tả nền", "đếm đối tượng", v.v. Query không thực sự chuyên biệt vào nhãn ngữ nghĩa; chúng học mọi mã hóa khiến loss downstream giảm.

### Architecture

Q-Former là transformer nhỏ (12 lớp, ~100M tham số) với hai đường:

1. Đường query: 32 vector query chảy qua self-attention (giữa chúng), rồi cross-attention trên token patch ViT đóng băng, rồi FFN.
2. Đường văn bản: encoder văn bản kiểu BERT chia sẻ trọng số self-attention và FFN với đường query. Cross-attention bị tắt cho đường văn bản.

Khi huấn luyện cả hai đường chạy. Query và văn bản tương tác qua self-attention dùng chung, nghĩa là query có thể điều kiện hóa theo văn bản cho tác vụ cần (ITM, ITG). Khi suy luận để bàn giao VLM, chỉ query chảy qua, cho 32 token thị giác.

### Two-stage training

BLIP-2 tiền huấn luyện hai giai đoạn:

Giai đoạn 1: học biểu diễn (không LLM). Ba loss:
- ITC (tương phản ảnh-văn bản): tương phản kiểu CLIP giữa token query được pooling và token CLS văn bản.
- ITM (khớp ảnh-văn bản): bộ phân loại nhị phân — cặp ảnh-văn bản này có khớp không? Được khai thác âm khó.
- ITG (sinh văn bản dựa trên ảnh): head LM nhân quả trên văn bản, điều kiện hóa theo query. Buộc query mã hóa nội dung sinh được thành văn bản.

Chỉ Q-Former huấn luyện. ViT đóng băng. Không LLM tham gia.

Giai đoạn 2: học tạo sinh. Gắn LLM đóng băng (OPT-2.7B hoặc Flan-T5-XL, v.v.). Chiếu 32 đầu ra query đến chiều embedding LLM qua lớp tuyến tính nhỏ. Thêm chúng vào trước prompt văn bản. Chỉ huấn luyện phép chiếu tuyến tính và Q-Former bằng LM loss trên chuỗi prompt + ảnh + chú thích nối lại.

Sau giai đoạn 2, Q-Former + phép chiếu là toàn adapter thị giác. Khi suy luận: ảnh → ViT → Q-Former → phép chiếu tuyến tính → thêm đầu văn bản → LLM đóng băng phát đầu ra.

### Parameter economics

BLIP-2 với ViT-g/14 (1.1B, đóng băng) + OPT-6.7B (6.7B, đóng băng) + Q-Former (188M, huấn luyện) = tổng 8B, 188M huấn luyện. Riêng Q-Former ~2.4% tham số toàn ngăn xếp. Chi phí huấn luyện phản ánh: vài ngày trên một ít A100 so với nhiều tuần cho từ đầu đến cuối.

Chất lượng: BLIP-2 ngang hoặc vượt Flamingo-80B trên VQA zero-shot trong khi nhỏ hơn 50x. Cầu nối hoạt động.

### InstructBLIP and the instruction-aware Q-Former

InstructBLIP (2023) mở rộng Q-Former với đầu vào thêm: chính văn bản chỉ dẫn. Tại cross-attention, query giờ truy cập cả patch ảnh và chỉ dẫn. Query có thể chuyên biệt mỗi chỉ dẫn ("đếm xe", "mô tả tâm trạng") thay vì học một tóm tắt cố định duy nhất. Cải thiện benchmark trên tác vụ giữ riêng.

### MiniGPT-4 and the projector-only approach

MiniGPT-4 giữ Q-Former nhưng chỉ huấn luyện phép chiếu tuyến tính đầu ra trong khi đóng băng mọi thứ khác. Rẻ, nhưng chi phí là chất lượng — query là của BLIP-2, không phải của bạn. Tốt cho lặp nhanh, không phải kiến trúc tốt nhất.

### Why LLaVA went simpler

LLaVA (2023, Bài 12.05) thay Q-Former bằng MLP 2 lớp đơn giản chiếu mọi token patch ViT vào không gian LLM — 576 token mỗi ảnh cho lưới 24x24, tất cả đưa vào LLM. Nén kém hơn nhưng cho LLM attend trên patch thô. Lúc đó gây tranh cãi; đến cuối năm 2023 nó thống trị vì dữ liệu chỉ dẫn thị giác (LLaVA-Instruct-150k) chứng minh MLP huấn luyện được để giữ đủ tín hiệu. Đánh đổi: ngữ cảnh LLaVA đầy nhanh hơn, nhưng mở rộng tự nhiên sang nhiều ảnh và video.

Đến năm 2026 lĩnh vực chia đôi: Q-Former tồn tại nơi ngân sách token quan trọng (video dài, nhiều ảnh); projector MLP thống trị nơi chất lượng thô mỗi token là ưu tiên.

### Gated cross-attention: Flamingo, the ancestor

Flamingo (Bài 12.04) có trước BLIP-2 và dùng cùng ý tưởng cross-attention nhưng ở mọi lớp LLM đóng băng, không phải một cầu nối duy nhất. BLIP-2 cho thấy có thể nén chỉ đến lớp đầu vào mà vẫn hoạt động. Gemini và Idefics kết hợp cả hai: token đầu vào xen kẽ cộng cross-attention có cổng tùy chọn cho few-shot trong ngữ cảnh.

### The 2026 descendants

- Q-Former: BLIP-2, InstructBLIP, MiniGPT-4 và hầu hết mô hình video-ngôn ngữ vì ngân sách token.
- Perceiver resampler: biến thể Flamingo (Bài 12.04); họ Idefics, Eagle, OmniMAE.
- Projector MLP: LLaVA, LLaVA-NeXT, LLaVA-OneVision, Cambrian-1.
- Attention pool: VILA, PaliGemma.

Cả bốn hợp lệ. Câu hỏi quyết định là bạn bị ràng buộc ngân sách token hay chất lượng mỗi token.

```figure
modality-projection
```

## Use It

`code/main.py` xây cross-attention kiểu Q-Former bằng stdlib:

1. Mô phỏng 256 token patch ảnh (chiều 128).
2. Khởi tạo 32 query có thể học (chiều 128).
3. Chạy cross-attention tích vô hướng có tỷ lệ (Q từ query, K/V từ patch).
4. Chiếu đến chiều LLM (512) qua lớp tuyến tính.
5. Xuất 32 token thị giác sẵn cho LLM.

Mọi phép toán bằng Python thuần (vòng lặp lồng trên vector). Minh họa nhưng đúng hình dạng. Ma trận trọng số attention được in để thấy mỗi query lấy từ patch nào.

## Ship It

Bài học này tạo `outputs/skill-modality-bridge-picker.md`. Với cấu hình VLM đích (số token encoder thị giác, ngân sách ngữ cảnh LLM, ràng buộc triển khai, mục tiêu chất lượng), nó khuyến nghị Q-Former so với MLP so với Perceiver resampler kèm lý giải ngắn và ước lượng số tham số cho mỗi cầu nối.

## Exercises

1. Triển khai khối cross-attention bằng PyTorch. Xác minh với 32 query và 256 key/value, ma trận trọng số attention là 32 x 256 và mỗi hàng tổng 1 sau softmax.

2. Trong giai đoạn 1 BLIP-2, Q-Former chạy ba loss đồng thời: ITC, ITM, ITG. Viết chữ ký forward mỗi loại bằng mã giả. Loại nào cần đường encoder văn bản hoạt động?

3. So số tham số: Q-Former (12 lớp, 768 ẩn) so với projector MLP 2 lớp (1408 → 4096, hai lớp). Ở quy mô LLM nào chi phí Q-Former 188M hoàn vốn về hiệu quả huấn luyện?

4. Đọc Mục 3.2 bài báo BLIP-2 (arXiv:2301.12597) về khởi tạo Q-Former. Giải thích tại sao khởi tạo từ BERT-base (không ngẫu nhiên) tăng tốc hội tụ.

5. Đối với một video 10 phút ở 1 FPS được lấy mẫu thành 60 khung hình, tính chi phí token cho mỗi khung hình với (Q-Former → 32 token/khung hình) so với (MLP projector → 576 token/khung hình). Mỗi cầu nối có thể chứa bao nhiêu khung hình trong một cửa sổ ngữ cảnh LLM 128k token trước khi văn bản prompt có chút chỗ nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Q-Former | "Transformer truy vấn" | Transformer nhỏ với 32 vector query có thể học cross-attend đến đặc trưng ViT đóng băng |
| Learnable queries (Query có thể học) | "Soft prompt cho thị giác" | Tập tham số cố định phục vụ phía query của cross-attention; học theo mô hình, chia sẻ mọi đầu vào |
| Cross-attention (Attention chéo) | "Q từ đây, K/V từ đó" | Attention có query, key và value đến từ nguồn khác nhau; cách query lấy từ patch ViT |
| ITC | "Tương phản ảnh-văn bản" | Loss kiểu CLIP áp dụng cho query được pooling của Q-Former so với CLS văn bản |
| ITM | "Khớp ảnh-văn bản" | Bộ phân loại nhị phân trên cặp khai thác âm khó; buộc query phân biệt không khớp chi tiết |
| ITG | "Sinh văn bản dựa trên ảnh" | Loss LM nhân quả nơi văn bản được sinh điều kiện hóa theo query; buộc query mã hóa nội dung giải mã được thành văn bản |
| Two-stage pretraining (Tiền huấn luyện hai giai đoạn) | "Biểu diễn rồi sinh" | Giai đoạn 1 chỉ huấn luyện Q-Former (ITC/ITM/ITG); Giai đoạn 2 gắn LLM đóng băng và chỉ huấn luyện phép chiếu + Q-Former |
| Frozen backbone (Backbone đóng băng) | "Không finetune" | Trọng số encoder thị giác và LLM cố định; chỉ cầu nối huấn luyện |
| Projection head (Head chiếu) | "Tuyến tính đến chiều LLM" | Lớp tuyến tính cuối ánh xạ đầu ra Q-Former sang chiều embedding LLM |
| Perceiver resampler | "Phiên bản của Flamingo" | Cross-attention với query có thể học tương tự; Flamingo chạy nó một lần cho mỗi hình ảnh để tạo các latent cố định, rồi đọc chúng qua cross-attention có cổng ở mọi lớp LLM |

## Further Reading

- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597) — bài báo cốt lõi.
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) — tiền thân với bộ ba ITC/ITM/ITG.
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) — "căn chỉnh trước hợp nhất" — tổ tiên khái niệm của huấn luyện giai đoạn 1.
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) — Q-Former nhận biết chỉ dẫn.
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592) — cách tiếp cận chỉ projector.
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) — kiến trúc tổng quát cho cross-attention query có thể học.
