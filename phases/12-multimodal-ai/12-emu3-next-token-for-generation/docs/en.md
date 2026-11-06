# Emu3: Next-Token Prediction for Image and Video Generation

> Emu3 của BAAI (Wang và cộng sự, tháng 9 năm 2024) là kết quả năm 2024 lẽ ra đã kết thúc cuộc tranh luận khuếch tán so với tự hồi quy. Một transformer chỉ có bộ giải mã kiểu Llama duy nhất, chỉ được huấn luyện bằng mục tiêu dự đoán token tiếp theo, trên một bộ từ vựng thống nhất gồm văn bản + token ảnh VQ + token video VQ 3D, vượt SDXL về tạo ảnh và LLaVA-1.6 về nhận thức. Không có hàm mất mát CLIP. Không có lịch khuếch tán. Hướng dẫn không dùng bộ phân loại được sử dụng khi suy luận để bảo đảm chất lượng, nhưng mục tiêu huấn luyện cốt lõi là dự đoán token tiếp theo với teacher forcing. Được công bố trên Nature. Bài học này đọc luận điểm của Emu3 — tại sao một tokenizer tốt hơn cộng với quy mô là tất cả những gì bạn cần — và đối chiếu với các cách tiếp cận khuếch tán.

**Type:** Learn
**Languages:** Python (stdlib, 3D video tokenizer math + autoregressive sampler skeleton)
**Prerequisites:** Phase 12 · 11 (Chameleon)
**Time:** ~120 minutes

## Learning Objectives

- Giải thích tại sao mục tiêu token tiếp theo với một hàm mất mát duy nhất của Emu3 có hiệu quả bất chấp giả định lâu nay rằng chất lượng ảnh đòi hỏi khuếch tán.
- Mô tả tokenizer video 3D: codebook VQ không gian-thời gian trông như thế nào, tại sao các patch trải dài theo thời gian.
- So sánh Emu3 với Stable Diffusion XL về (lượng tính toán huấn luyện, chi phí suy luận, giới hạn chất lượng).
- Nêu tên ba vai trò mà cùng một mô hình Emu3 đảm nhận: Emu3-Gen (tạo ảnh), Emu3-Chat (nhận thức), Emu3-Stage2 (tạo video).

## The Problem

Quan niệm thông thường cho đến năm 2024: tạo ảnh cần khuếch tán. Lập luận: các token ảnh rời rạc làm mất quá nhiều thông tin để tái tạo chi tiết, và việc lấy mẫu tự hồi quy tích lũy sai số qua hàng nghìn token. Stable Diffusion, DALL-E 3, Imagen, Midjourney đều sử dụng một dạng khuếch tán nào đó. Chameleon (Bài học 12.11) đã bác bỏ một phần điều này ở quy mô nhỏ nhưng chưa sánh được với SDXL về chất lượng.

Emu3 trực tiếp công kích lập luận đó. Tuyên bố: tokenizer thị giác tốt hơn + đủ quy mô + hàm mất mát token tiếp theo = tạo ảnh vượt khuếch tán trong cùng một mô hình cũng thực hiện nhận thức.

Vụ đặt cược này gây tranh cãi khi được công bố. Hai năm sau, họ mô hình tạo sinh thống nhất mã nguồn mở (Emu3, Show-o, Janus-Pro, Transfusion) là con đường mặc định cho nghiên cứu; các mô hình tiên tiến trong sản xuất dường như sử dụng một biến thể nào đó.

## The Concept

### The Emu3 tokenizer

Thành phần then chốt là tokenizer thị giác. Emu3 huấn luyện một tokenizer tùy chỉnh thuộc lớp IBQ (Inverse Bottleneck Quantizer, họ SBER-MoVQGAN) với mức giảm độ phân giải 8x8 cho mỗi token. Một ảnh 512x512 trở thành 64x64 = 4096 token với kích thước codebook 32768.

Con số này lớn hơn 1024 token của Chameleon cho mỗi ảnh 512x512 ở K=8192 trên cả hai trục: số token gấp bốn và codebook lớn gấp bốn. Dung lượng bổ sung đổi lấy chất lượng tái dựng. Chỉ số then chốt: PSNR tái dựng ở 30.5 dB, cạnh tranh với không gian tiềm ẩn liên tục của Stable Diffusion ở 32 dB.

Đối với video: một tokenizer VQ 3D mã hóa một patch không gian-thời gian (4 khung hình x 8x8 pixel) thành một số nguyên. Một clip 4 giây ở 8 FPS có 32 khung hình; ở 256x256 với giảm 8 lần theo không gian và 4 lần theo thời gian, số token là (256/8) * (256/8) * (32/4) = 32 * 32 * 8 = 8,192 token.

Chất lượng tokenizer là giới hạn. Đóng góp của Emu3 một phần là "chúng tôi đã huấn luyện một tokenizer rất tốt."

### Single-loss training

Emu3 sử dụng một mục tiêu: dự đoán token tiếp theo trên bộ từ vựng dùng chung giữa token văn bản, token ảnh 2D và token video 3D. Trọng số được nhân với các hệ số riêng cho từng phương thức trong quá trình huấn luyện để cân bằng đóng góp, nhưng hàm mất mát giống hệt nhau.

Huấn luyện trên hỗn hợp gồm:
- Tạo ảnh: `<text caption> <image> image_tokens </image>`
- Nhận thức ảnh: `<image> image_tokens </image> <question> text_tokens`
- Tạo video: `<text caption> <video> video_tokens </video>`
- Nhận thức video: tương tự.
- Chỉ văn bản: NTP tiêu chuẩn.

Mô hình học khi nào phát ra token ảnh so với token văn bản từ phân phối dữ liệu. Khả năng tạo sinh xuất hiện từ việc mô hình dự đoán token ảnh sau thẻ `<image>`.

### Classifier-free guidance and temperature

Tạo ảnh tự hồi quy tốt hơn nhiều khi có hướng dẫn không dùng bộ phân loại (CFG) lúc suy luận. Emu3 sử dụng nó: tạo hai lần, một lần với chú thích đầy đủ, một lần với chú thích rỗng, trộn các logit bằng một trọng số hướng dẫn (thường là 3.0-7.0). Đây là cùng thủ thuật CFG mà khuếch tán sử dụng, được mượn sang bối cảnh tự hồi quy.

Nhiệt độ có vai trò quan trọng: quá cao, artifact; quá thấp, sụp đổ mode. Nhiệt độ được Emu3 khuyến nghị là 1.0 cho nhận thức, 0.8 cho tạo ảnh.

### Three roles, one model

Emu3 được phát hành dưới dạng ba API khác nhau về chức năng nhưng có chung một bộ trọng số bên dưới:

- Emu3-Gen. Tạo ảnh. Đầu vào là văn bản, đầu ra là token ảnh.
- Emu3-Chat. VQA và tạo chú thích. Đầu vào là ảnh (token), đầu ra là văn bản.
- Emu3-Stage2. Tạo video và VQA video. Đầu vào là văn bản hoặc video, đầu ra là văn bản hoặc video.

Không có head dành riêng cho tác vụ. Chỉ có các mẫu prompt khác nhau. Cùng một checkpoint.

### Benchmarks

Từ bài báo Emu3 (tháng 9 năm 2024):

- Tạo ảnh: vượt SDXL trên MJHQ-30K FID (5.4 so với 5.6), GenEval tổng thể (0.54 so với 0.55 — hòa về mặt thống kê), và ngang bằng về điểm tổng hợp của Deep-Eval.
- Nhận thức hình ảnh: kém LLaVA-1.6 trên VQAv2 (75.1 so với 81.8) và MMMU (31.6 so với 35.1), nhưng vượt nó trên SEED-Bench, OCRBench và ChartQA.
- Tạo video: chất lượng đoạn clip 4 giây với FVD cạnh tranh so với các mô hình thời Sora được đánh giá công khai.

Các con số không phải lúc nào cũng thắng — Emu3 đánh đổi một điểm ở đây lấy một điểm ở đó — nhưng tuyên bố "dự đoán token tiếp theo là tất cả những gì bạn cần" có thể được bảo vệ trên các phương thức.

### Compute cost

Emu3 là một mô hình 8B tham số. Bài báo không công bố tổng số giờ GPU; để thấy quy mô, tiền huấn luyện Llama-2-7B sử dụng khoảng 184k giờ GPU A100, xấp xỉ 21 năm GPU. Các mô hình diffusion như Stable Diffusion 3 huấn luyện trong những ngân sách tương tự nhưng cần các encoder văn bản riêng và các pipeline phức tạp hơn.

Khi suy luận, Emu3 chậm hơn SDXL trên mỗi ảnh: 4096 token ảnh ở 30 tok/s là ~2 phút cho mỗi ảnh 512x512, so với 2-5 giây của SDXL. Giải mã suy đoán và tối ưu KV-cache thu hẹp khoảng cách nhưng không xóa bỏ nó. Tạo ảnh tự hồi quy cần nhiều tính toán; đây là sự đánh đổi hiện hữu.

### Why it matters

Đóng góp sâu sắc của Emu3 mang tính khái niệm. Nếu dự đoán token tiếp theo mở rộng quy mô để sánh với khuếch tán về tạo ảnh, con đường mô hình thống nhất (một hàm mất mát, một backbone, bất kỳ phương thức nào) là khả thi. Các mô hình tương lai không cần bộ mã hóa văn bản riêng, bộ lập lịch khuếch tán riêng, VAE riêng. Một transformer, một tokenizer cho mỗi phương thức, quy mô.

Show-o, Janus-Pro và InternVL-U đều xây dựng trên hoặc thách thức luận điểm này. Các phòng thí nghiệm Trung Quốc (BAAI, DeepSeek) công bố theo hướng này mạnh mẽ hơn các phòng thí nghiệm Hoa Kỳ cho đến năm 2025.

```figure
l5-emu3-next-token
```

## Use It

`code/main.py` xây dựng hai phần mô phỏng đơn giản:

- Một công cụ tính số lượng tokenizer VQ 2D so với 3D: cho (độ phân giải, patch, clip_length, FPS), tính số token cho ảnh so với video.
- Một bộ lấy mẫu token ảnh tự hồi quy với hướng dẫn không dùng bộ phân loại ở một nhiệt độ.

Phần triển khai CFG khớp với công thức của Emu3 — trộn các logit có điều kiện và vô điều kiện bằng một trọng số hướng dẫn.

## Ship It

Bài học này tạo ra `outputs/skill-token-gen-cost-analyzer.md`. Với một đặc tả sản phẩm tạo sinh (ảnh hoặc video, độ phân giải mục tiêu, cấp chất lượng, ngân sách độ trễ), nó tính số token, chi phí suy luận và chọn họ Emu3 so với khuếch tán.

## Exercises

1. Emu3 tạo ra 4096 token cho mỗi ảnh 512x512 ở mức giảm 8x8. Tính giá trị tương đương cho 1024x1024 và 2048x2048. Điều gì xảy ra với độ trễ suy luận?

2. Đọc Mục 3.3 của Emu3 về tokenizer video. Mô tả kích thước patch VQ 3D và vì sao nó trải trên 4 khung hình x 8x8 pixel thay vì một khung hình duy nhất.

3. Trọng số hướng dẫn không dùng bộ phân loại 5.0 so với 3.0: hiệu ứng thị giác nào? Lần theo phép toán trong `code/main.py`.

4. Tính FLOP huấn luyện cho Emu3 (8B) ở mức giả định 300B token và so sánh với Stable Diffusion 3. Mô hình nào tốn kém hơn để huấn luyện?

5. Emu3 vượt SDXL trên FID nhưng không trên VQAv2 so với các VLM chuyên biệt. Giải thích tại sao cách tiếp cận một hàm mất mát thống nhất thể hiện các điểm mạnh khác nhau so với các mô hình chuyên biệt trên các benchmark khác nhau.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Next-token prediction (Dự đoán token tiếp theo) | "NTP" | Hàm mất mát tự hồi quy tiêu chuẩn: dự đoán token[i+1] khi biết token[0..i]; hoạt động cho mọi phương thức khi được token hóa |
| IBQ tokenizer | "Bộ lượng tử hóa nút thắt ngược" | Một lớp VQ-VAE với codebook lớn hơn (32768+) và khả năng tái tạo tốt hơn của Chameleon |
| 3D VQ | "Bộ lượng tử hóa không gian-thời gian" | Codebook được đánh chỉ số bởi (thời gian, hàng, cột); một token bao phủ 4 khung hình x 8x8 pixel |
| Classifier-free guidance (Hướng dẫn không dùng bộ phân loại) | "CFG" | Trộn logit có điều kiện và vô điều kiện với trọng số gamma; tăng chất lượng ảnh khi suy luận |
| Unified vocabulary (Bộ từ vựng thống nhất) | "Token dùng chung" | Văn bản + ảnh + video đều lấy từ cùng không gian số nguyên; mô hình dự đoán bất kỳ phương thức nào xuất hiện tiếp theo |
| MJHQ-30K | "Benchmark tạo ảnh" | Benchmark chất lượng Midjourney với 30k prompt; Emu3 báo cáo FID ở đây |

## Further Reading

- [Wang et al. — Emu3: Next-Token Prediction is All You Need (arXiv:2409.18869)](https://arxiv.org/abs/2409.18869)
- [Sun et al. — Emu: Generative Pretraining in Multimodality (arXiv:2307.05222)](https://arxiv.org/abs/2307.05222)
- [Liu et al. — LWM (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Yu et al. — MAGVIT-v2 (arXiv:2310.05737)](https://arxiv.org/abs/2310.05737)
- [Tian et al. — VAR (arXiv:2404.02905)](https://arxiv.org/abs/2404.02905)
