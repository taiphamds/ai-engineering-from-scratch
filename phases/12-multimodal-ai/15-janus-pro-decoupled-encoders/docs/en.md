# Janus-Pro: Decoupled Encoders for Unified Multimodal Models

> Các mô hình đa phương thức thống nhất có một mâu thuẫn không thể tránh khỏi. Hiểu cần đặc trưng ngữ nghĩa — vector đầu ra SigLIP hoặc DINOv2 giàu thông tin ở cấp khái niệm. Tạo sinh cần mã thuận lợi cho tái tạo — token VQ ghép trở lại thành pixel sắc nét. Hai mục tiêu không tương thích trong một bộ mã hóa duy nhất. Janus (DeepSeek, tháng 10 năm 2024) và Janus-Pro (DeepSeek, tháng 1 năm 2025) lập luận rằng cách khắc phục là ngừng cố gắng: tách rời hai bộ mã hóa. Dùng chung phần thân transformer giữa các tác vụ, nhưng định tuyến hiểu qua SigLIP và tạo sinh qua tokenizer VQ. Ở 7B, Janus-Pro vượt DALL-E 3 trên GenEval trong khi ngang LLaVA trên MMMU. Bài học này đọc tại sao hai bộ mã hóa hoạt động ở nơi một bộ thất bại.

**Type:** Build
**Languages:** Python (stdlib, dual-encoder routing + shared-body signal)
**Prerequisites:** Phase 12 · 13 (Transfusion), Phase 12 · 14 (Show-o)
**Time:** ~120 minutes

## Learning Objectives

- Giải thích tại sao một bộ mã hóa dùng chung duy nhất làm giảm chất lượng hiểu hoặc tạo sinh.
- Mô tả cách định tuyến của Janus-Pro: đặc trưng SigLIP ở phía đầu vào để hiểu, token VQ ở cả đầu vào và đầu ra để tạo sinh.
- Lần theo việc mở rộng hỗn hợp dữ liệu giúp Janus-Pro thành công ở nơi Janus không thành công.
- So sánh các kiến trúc tách rời (Janus-Pro), ghép liên tục (Transfusion) và ghép rời rạc (Show-o).

## The Problem

Các mô hình thống nhất dùng chung phần thân transformer cho hiểu và tạo sinh. Các thử nghiệm trước đây (Chameleon, Show-o, Transfusion) đều dùng một tokenizer thị giác cho cả hai hướng. Tokenizer là một sự thỏa hiệp:

- Tối ưu cho tái tạo (tạo sinh): VQ-VAE nắm bắt chi tiết pixel tinh mịn nhưng tạo ra token có tính nhất quán ngữ nghĩa yếu.
- Tối ưu cho ngữ nghĩa (hiểu): embedding SigLIP nhóm các ảnh "mèo" gần token "mèo" nhưng không cho phép tái tạo tốt.

Show-o và Transfusion trả giá cho điều này bằng sự suy giảm chất lượng rõ rệt ở một hướng. Janus-Pro đặt câu hỏi: tại sao yêu cầu một tokenizer khi các tác vụ có nhu cầu khác nhau?

## The Concept

### Decoupled visual encoding

Kiến trúc của Janus-Pro tách hai bộ mã hóa:

- Nhánh hiểu. Ảnh đầu vào → SigLIP-SO400m → MLP 2 lớp → phần thân transformer.
- Nhánh tạo sinh. Ảnh đầu vào (nếu điều kiện hóa trên ảnh có sẵn) → tokenizer VQ → ID token → phần thân transformer.
- Tạo sinh đầu ra. Token ảnh do transformer dự đoán → bộ giải mã VQ → pixel.

Phần thân transformer được dùng chung. Mọi thứ phía trước và phía sau phần thân đều riêng cho từng tác vụ.

Đầu vào được phân biệt bằng định dạng prompt: thẻ `<understand>` định tuyến qua SigLIP; `<generate>` định tuyến qua VQ. Hoặc việc định tuyến được ngầm xác định từ tác vụ.

### Why this works

Hàm mất mát hiểu nhận đặc trưng SigLIP, vốn được tiền huấn luyện kiểu CLIP điều chỉnh cho độ tương đồng ngữ nghĩa. Các benchmark nhận thức của mô hình cải thiện so với Show-o / Transfusion vì đặc trưng đầu vào tốt hơn cho tác vụ.

Hàm mất mát tạo sinh nhận token VQ, vốn được tokenizer điều chỉnh cho tái tạo. Chất lượng ảnh cải thiện so với Show-o vì mã VQ ghép trở lại thành pixel một cách rõ nét.

Phần thân transformer dùng chung thấy hai phân phối đầu vào (SigLIP và VQ) và học làm việc với cả hai. Tuyên bố: đủ dữ liệu + đủ tham số, phần thân hấp thụ việc chuyển đổi.

### Data scaling — Janus vs Janus-Pro

Janus (bản gốc, arXiv 2410.13848) giới thiệu việc tách rời nhưng ở quy mô nhỏ (1.3B tham số, dữ liệu hạn chế). Janus-Pro (arXiv 2501.17811) mở rộng:

- 7B tham số (so với 1.3B).
- 90M cặp ảnh-văn bản cho giai đoạn 1 (căn chỉnh), tăng từ 72M.
- 72M cho giai đoạn 2 (thống nhất), tăng từ 26M.
- Thêm 200k mẫu chỉ dẫn tạo ảnh cho giai đoạn 3.

Kết quả: Janus-Pro-7B ngang LLaVA trên MMMU (60.3 so với ~58) và vượt DALL-E 3 trên GenEval (0.80 so với 0.67). Một mô hình mở, cạnh tranh ở cả hai phía của phổ thống nhất.

### JanusFlow — the rectified flow variant

JanusFlow (arXiv 2411.07975) thay nhánh tạo sinh VQ bằng nhánh tạo sinh rectified flow (liên tục). Sự phân chia trở thành SigLIP-để-hiểu + rectified-flow-để-tạo-sinh. Giới hạn chất lượng được nâng cao hơn nữa. Kiến trúc vẫn là các bộ mã hóa tách rời-phần thân dùng chung.

### The shared body's job

Phần thân transformer xử lý một chuỗi thống nhất nhưng với hai phân phối đầu vào. Nhiệm vụ của nó là:

- Để hiểu: tiếp nhận đặc trưng SigLIP + token văn bản → phát ra văn bản tự hồi quy.
- Để tạo sinh: tiếp nhận token văn bản + (token VQ ảnh tùy chọn) → phát ra token VQ ảnh tự hồi quy.

Phần thân không có trọng số riêng cho từng phương thức ở mỗi khối. Nó là transformer kiểu văn bản mà bạn mong đợi tìm thấy bên trong Qwen hoặc Llama, cộng với hai adapter đầu vào.

Điều thú vị là điều này có nghĩa phần thân Janus-Pro có thể được khởi tạo từ một LLM đã tiền huấn luyện. Janus-Pro thực sự khởi tạo từ DeepSeek-MoE-7B. Lựa chọn đó quan trọng: LLM đóng góp khả năng suy luận mà các mô hình thống nhất hoàn toàn từ đầu khó đạt được.

### Compared to InternVL-U

InternVL-U (Bài học 12.10) là phần tiếp nối năm 2026. Nó kết hợp:

- Tiền huấn luyện đa phương thức nguyên bản (backbone InternVL3).
- Định tuyến bộ mã hóa tách rời (SigLIP vào, head VQ + khuếch tán ra).
- Hiểu + tạo sinh + chỉnh sửa thống nhất.

InternVL-U bao hàm lựa chọn kiến trúc của Janus-Pro trong một khuôn khổ lớn hơn. Ý tưởng bộ mã hóa tách rời hiện là mặc định cho mô hình thống nhất ở quy mô lớn.

### Limitations

Các bộ mã hóa tách rời làm tăng độ phức tạp kiến trúc. Hai tokenizer cần huấn luyện, hai nhánh đầu vào cần duy trì, hai tập dạng lỗi. Với sản phẩm không cần tạo sinh, Janus-Pro được thiết kế quá mức — chọn mô hình hiểu thuộc họ LLaVA.

Với sản phẩm không cần hiểu, Janus-Pro vượt quá nhu cầu — chọn mô hình Stable Diffusion 3 / Flux.

Với sản phẩm cần cả hai, Janus-Pro hiện là kiến trúc mở tham khảo.

```figure
l5-janus-decouple
```

## Use It

`code/main.py` mô phỏng định tuyến Janus-Pro:

- Hai bộ mã hóa mô phỏng: giống SigLIP (tạo vector ngữ nghĩa 256 chiều) và giống VQ (tạo mã số nguyên).
- Một bộ định tuyến prompt chọn bộ mã hóa dựa trên thẻ tác vụ.
- Một phần thân dùng chung (thay thế) xử lý chuỗi token bất kể bộ mã hóa nào đã tạo ra chúng.
- Một sự chuyển đổi từ lịch lấy mẫu có trọng số giai đoạn 1 (căn chỉnh) sang giai đoạn 3 (tinh chỉnh chỉ dẫn).

In các nhánh được định tuyến cho 3 ví dụ: hỏi đáp ảnh, T2I, chỉnh sửa ảnh.

## Ship It

Bài học này tạo ra `outputs/skill-decoupled-encoder-picker.md`. Với một sản phẩm muốn tạo sinh + hiểu thống nhất ở chất lượng gần tiên tiến nhất, nó chọn Janus-Pro, JanusFlow hoặc InternVL-U với một khuyến nghị quy mô dữ liệu cụ thể.

## Exercises

1. Janus-Pro-7B vượt DALL-E 3 trên GenEval. Giải thích tại sao một mô hình mở 7B có thể ngang một mô hình độc quyền tiên tiến về tạo sinh nhưng không về hiểu.

2. Triển khai một hàm định tuyến: với văn bản prompt, phân loại là `understand` hoặc `generate`. Bạn xử lý prompt mơ hồ như "mô tả rồi phác họa" như thế nào?

3. JanusFlow thay nhánh VQ bằng rectified flow. Phần thân transformer giờ xuất ra gì, và hàm mất mát thay đổi gì?

4. Đề xuất tác vụ thứ tư mà kiến trúc Janus-Pro có thể xử lý với thêm một bộ mã hóa tách rời. Ví dụ: phân đoạn ảnh (kiểu DINO), độ sâu (kiểu MiDaS).

5. Đọc Mục 4.2 của Janus-Pro về mở rộng dữ liệu. Giai đoạn dữ liệu nào đóng góp nhiều nhất cho mức tăng chất lượng T2I so với Janus?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Decoupled encoding (Mã hóa tách rời) | "Hai bộ mã hóa thị giác" | Tokenizer hoặc bộ mã hóa riêng cho mỗi hướng: ngữ nghĩa để hiểu, tái tạo để tạo sinh |
| Shared body (Phần thân dùng chung) | "Một transformer" | Một transformer duy nhất xử lý đầu ra của một trong hai bộ mã hóa; không có trọng số riêng cho từng phương thức |
| SigLIP for understanding (SigLIP để hiểu) | "Đặc trưng ngữ nghĩa" | Tháp thị giác họ CLIP cung cấp đặc trưng khái niệm phong phú nhưng tái tạo kém |
| VQ for generation (VQ để tạo sinh) | "Mã tái tạo" | Token được lượng tử hóa vector giải mã rõ nét trở lại thành pixel |
| JanusFlow | "Biến thể rectified flow" | Janus-Pro với head tạo sinh flow matching liên tục thay vì VQ |
| Routing tag (Thẻ định tuyến) | "Thẻ tác vụ" | Dấu đánh dấu prompt (`<understand>` / `<generate>`) chọn bộ mã hóa đầu vào |

## Further Reading

- [Wu et al. — Janus (arXiv:2410.13848)](https://arxiv.org/abs/2410.13848)
- [Chen et al. — Janus-Pro (arXiv:2501.17811)](https://arxiv.org/abs/2501.17811)
- [Ma et al. — JanusFlow (arXiv:2411.07975)](https://arxiv.org/abs/2411.07975)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Dong et al. — DreamLLM (arXiv:2309.11499)](https://arxiv.org/abs/2309.11499)
