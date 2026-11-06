# Show-o and Discrete-Diffusion Unified Models

> Transfusion kết hợp biểu diễn liên tục và rời rạc. Show-o (Xie và cộng sự, tháng 8 năm 2024) đi theo hướng khác: token văn bản sử dụng dự đoán token tiếp theo nhân quả, token ảnh sử dụng khuếch tán rời rạc có mặt nạ theo tinh thần MaskGIT. Cả hai nằm trong một transformer với mặt nạ attention lai. Kết quả thống nhất VQA, văn bản thành ảnh, điền khuyết ảnh và tạo sinh hỗn hợp phương thức trên một backbone, một tokenizer cho mỗi phương thức, một dạng hàm mất mát (token tiếp theo được mở rộng sang dự đoán có mặt nạ). Bài học này đi qua thiết kế Show-o — tại sao khuếch tán rời rạc có mặt nạ là bộ tạo ảnh song song, ít bước — và đối chiếu với Transfusion và Emu3.

**Type:** Learn
**Languages:** Python (stdlib, masked-discrete-diffusion sampler)
**Prerequisites:** Phase 12 · 13 (Transfusion)
**Time:** ~120 minutes

## Learning Objectives

- Giải thích khuếch tán rời rạc có mặt nạ: lịch che token đồng đều rồi yêu cầu transformer khôi phục chúng.
- So sánh giải mã ảnh song song (Show-o, MaskGIT) với giải mã ảnh tự hồi quy (Chameleon, Emu3) về tốc độ và chất lượng.
- Nêu tên ba tác vụ Show-o xử lý trong một checkpoint: T2I, VQA, điền khuyết ảnh.
- Chọn một lịch che (cosine, tuyến tính, cắt cụt) và suy luận về ảnh hưởng của nó đến chất lượng mẫu.

## The Problem

Huấn luyện hai hàm mất mát của Transfusion có hiệu quả nhưng có động lực khó xử lý hơn — hàm mất mát khuếch tán liên tục nằm trên thang số khác với hàm mất mát NTP rời rạc. Cân bằng trọng số hàm mất mát là một cuộc tìm kiếm siêu tham số. Kiến trúc hiệu quả nhưng phức tạp.

Câu trả lời của Show-o: giữ cả hai phương thức rời rạc (như Chameleon), nhưng tạo ảnh song song qua khuếch tán rời rạc có mặt nạ thay vì tuần tự. Mục tiêu huấn luyện trở thành một phép dự đoán token bị che duy nhất khái quát hóa dự đoán token tiếp theo một cách tự nhiên.

## The Concept

### Masked discrete diffusion (MaskGIT)

Thủ thuật MaskGIT gốc của Chang và cộng sự (2022) rất tinh tế. Bắt đầu từ một ảnh bị che hoàn toàn (mọi token đều là id đặc biệt `<MASK>`). Ở mỗi bước, dự đoán song song mọi token bị che, rồi giữ lại top-K dự đoán tự tin nhất và che lại phần còn lại. Sau ~8-16 vòng lặp, mọi token được điền. Lịch số token cần bỏ che mỗi bước được điều chỉnh — lịch cosine hoạt động tốt.

Huấn luyện đơn giản: lấy mẫu đồng đều một tỷ lệ che từ [0, 1], áp dụng nó cho các token VQ của ảnh, huấn luyện transformer để khôi phục những token bị che. Chính xác là điều BERT đã làm cho văn bản, được mở rộng sang tạo ảnh.

### Show-o: one transformer, hybrid mask

Show-o đặt MaskGIT bên trong một transformer mô hình ngôn ngữ nhân quả. Mặt nạ attention là:

- Token văn bản: nhân quả (LLM tiêu chuẩn).
- Token ảnh: hai chiều đầy đủ trong khối ảnh (để các token bị che có thể nhìn thấy mọi token ảnh khác trong lúc dự đoán).
- Văn bản thành ảnh: văn bản chú ý đến ảnh trước đó, ảnh chú ý đến văn bản trước đó.

Huấn luyện luân phiên giữa:
1. NTP tiêu chuẩn trên chuỗi văn bản.
2. Mẫu T2I: văn bản → ảnh với token ảnh bị che, hàm mất mát dự đoán token bị che.
3. Mẫu VQA: ảnh → văn bản với token văn bản bị che (thực ra chỉ là NTP).

Hàm mất mát thống nhất là cross-entropy trên các token `<MASK>`, bao phủ cả NTP văn bản (chỉ token cuối cùng bị "che") và khuếch tán có mặt nạ trên ảnh (một tập con ngẫu nhiên bị che).

### Parallel sampling

Show-o tạo một ảnh trong ~16 bước thay vì ~1000 (tự hồi quy từng token) hoặc ~20 (khuếch tán). Ở mỗi bước, dự đoán song song mọi token bị che; chốt top-K tự tin; lặp lại.

So sánh:
- Chameleon / Emu3 (tự hồi quy trên token): N_tokens lượt truyền xuôi, thường là 1024-4096 trên mỗi ảnh.
- Transfusion (khuếch tán liên tục): ~20 bước, mỗi bước là một lượt transformer đầy đủ.
- Show-o (khuếch tán rời rạc có mặt nạ): ~16 bước, mỗi bước là một lượt transformer đầy đủ.

Show-o nhanh hơn Chameleon ở các mô hình quy mô tương tự, gần tương đương số bước của Transfusion với chi phí mỗi bước thấp hơn (logit từ vựng rời rạc so với hàm mất mát MSE liên tục).

### Tasks in one checkpoint

Show-o hỗ trợ bốn tác vụ khi suy luận, được chọn bằng định dạng prompt:

- Tạo văn bản: đầu ra văn bản tự hồi quy tiêu chuẩn.
- VQA: ảnh vào, văn bản ra.
- T2I: văn bản vào, ảnh ra qua khuếch tán rời rạc có mặt nạ.
- Điền khuyết ảnh: ảnh có một số token bị che, điền vào.

Khả năng điền khuyết ảnh có được miễn phí từ huấn luyện dự đoán có mặt nạ. Che một vùng của lưới token VQ, đưa phần còn lại cùng một prompt văn bản vào, dự đoán các token bị che.

### Masking schedule

Lịch số token cần bỏ che mỗi bước định hình chất lượng. Show-o khuyến nghị cosine:

```
mask_ratio(t) = cos(pi * t / (2 * T))   # t = 0..T
```

Ở bước 0, mọi token bị che (tỷ lệ 1.0). Ở bước T, không token nào bị che. Cosine tập trung khối lượng vào các tỷ lệ tầm trung nơi dự đoán mang nhiều thông tin nhất. Lịch tuyến tính cũng hoạt động nhưng chững lại nhanh hơn.

### Show-o2

Show-o2 (phần tiếp nối năm 2025, arXiv 2506.15564) mở rộng Show-o: LLM nền lớn hơn, tokenizer tốt hơn, lịch che cải tiến. Cùng một mẫu kiến trúc.

### Where Show-o sits

Trong hệ phân loại năm 2026:

- Token rời rạc + NTP: Chameleon, Emu3. Đơn giản nhưng suy luận chậm.
- Token rời rạc + khuếch tán có mặt nạ: Show-o, MaskGIT, LlamaGen, Muse. Lấy mẫu song song, vẫn mất mát do tokenizer.
- Liên tục + khuếch tán: Transfusion, MMDiT, DiT. Chất lượng cao nhất, huấn luyện phức tạp hơn.
- Liên tục + flow matching trong một VLM: JanusFlow, InternVL-U. Mới nhất.

Chọn theo tác vụ: Show-o khi bạn muốn T2I + điền khuyết ảnh + VQA trong một mô hình mở với tốc độ hợp lý; Transfusion khi chất lượng là tối quan trọng và bạn đủ khả năng xử lý phần kết nối hai hàm mất mát.

```figure
masked-diffusion-unmask
```

## Use It

`code/main.py` mô phỏng lấy mẫu Show-o:

- Một lưới đơn giản gồm 16 token VQ.
- Một "transformer" mô phỏng dự đoán logit dựa trên prompt và các token hiện đã được bỏ che.
- Lấy mẫu có mặt nạ song song qua 8 bước với lịch cosine.
- In các trạng thái trung gian (sự tiến triển của mẫu mặt nạ) và các token cuối cùng.

Chạy nó, quan sát mặt nạ tan dần từng bước.

## Ship It

Bài học này tạo ra `outputs/skill-unified-gen-model-picker.md`. Với một sản phẩm cần cả hiểu (VQA, tạo chú thích) và tạo sinh (T2I, điền khuyết ảnh) với ràng buộc trọng số mở, chọn giữa họ Show-o, họ Transfusion/MMDiT và họ Emu3 / Chameleon với các đánh đổi cụ thể.

## Exercises

1. Khuếch tán rời rạc có mặt nạ lấy mẫu trong ~16 bước. Tại sao không phải 1? Điều gì hỏng nếu bạn bỏ che mọi thứ ở bước 0?

2. Điền khuyết ảnh có được miễn phí với khuếch tán có mặt nạ. Đề xuất một trường hợp sử dụng sản phẩm (thực hoặc giả định) trong đó khả năng điền khuyết ảnh của Show-o vượt một mô hình chuyên biệt.

3. Lịch cosine so với lịch tuyến tính: lần theo số token được bỏ che mỗi bước cho T=8. Lịch nào cân bằng hơn?

4. Một ảnh Show-o 512x512 là 1024 token. Ở bộ từ vựng K=16384, mô hình phát ra 1024 * log2(16384) = 14,336 bit (~1.75 KiB) dữ liệu. Stable Diffusion xuất 512*512*24 bit = 6,291,456 bit (~768 KiB) pixel thô. Tỷ lệ nén là bao nhiêu và nó mang lại chất lượng gì?

5. Đọc LlamaGen (arXiv:2406.06525). Mô hình ảnh tự hồi quy có điều kiện theo lớp của LlamaGen khác cách tiếp cận có mặt nạ của Show-o như thế nào?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Masked discrete diffusion (Khuếch tán rời rạc có mặt nạ) | "Kiểu MaskGIT" | Huấn luyện để dự đoán token bị che; khi suy luận, lặp lại việc bỏ che các dự đoán tự tin nhất |
| Cosine schedule (Lịch cosine) | "Lịch bỏ che" | Sự suy giảm tỷ lệ che qua các bước suy luận; tập trung sự gia tăng độ tự tin ở tầm trung |
| Parallel decoding (Giải mã song song) | "Mọi token cùng lúc" | Mỗi bước dự đoán toàn bộ chuỗi token bị che trong một lượt truyền xuôi, rồi chốt top-K |
| Hybrid attention (Attention lai) | "Nhân quả + hai chiều" | Mặt nạ có tính nhân quả trên token văn bản và hai chiều trong các khối ảnh |
| Inpainting (Điền khuyết ảnh) | "Tạo sinh điền vào" | Điều kiện hóa trên ảnh có một số token bị che, dự đoán những token còn thiếu; có được miễn phí từ mục tiêu huấn luyện |
| Commitment rate (Tỷ lệ chốt) | "Top-K mỗi bước" | Có bao nhiêu token được tuyên bố "xong" mỗi vòng lặp; kiểm soát đánh đổi suy luận so với chất lượng |

## Further Reading

- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
- [Show-o2 (arXiv:2506.15564)](https://arxiv.org/abs/2506.15564)
- [Chang et al. — MaskGIT (arXiv:2202.04200)](https://arxiv.org/abs/2202.04200)
- [Sun et al. — LlamaGen (arXiv:2406.06525)](https://arxiv.org/abs/2406.06525)
- [Chang et al. — Muse (arXiv:2301.00704)](https://arxiv.org/abs/2301.00704)
