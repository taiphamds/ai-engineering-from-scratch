# InternVL3: Native Multimodal Pretraining

> Mọi VLM mở trước InternVL3 theo cùng công thức ba bước: lấy LLM văn bản huấn luyện trên hàng nghìn tỷ token văn bản, gắn encoder thị giác rồi fine-tune chỗ nối. Hoạt động nhưng có nợ căn chỉnh — LLM văn bản dành toàn ngân sách tiền huấn luyện cho văn bản thuần và không hiểu token thị giác nguyên bản. Khi thêm thị giác về sau, LLM phải học lại cách liên hệ đầu vào thị giác với suy luận văn bản mà không quên văn bản. InternVL3 (Zhu và cộng sự, tháng 4 năm 2025) bác cách thêm sau: một lượt tiền huấn luyện, văn bản và đa phương thức xen từ bước đầu. Kết quả ngang Gemini 2.5 Pro trên MMMU-Pro ở 78B tham số mở. Bài học này đọc lập luận cho tiền huấn luyện nguyên bản và điều thay đổi khi thực hiện.

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## Learning Objectives

- Giải thích tại sao huấn luyện VLM thêm sau tích lũy nợ căn chỉnh, trích ba triệu chứng đo được (quên thảm khốc, trôi câu trả lời, không nhất quán thị giác-văn bản).
- Mô tả hỗn hợp ngữ liệu tiền huấn luyện nguyên bản InternVL3 và tại sao tỷ lệ văn bản : xen kẽ : chú thích quan trọng.
- So V2PE (mã hóa vị trí thị giác thay đổi) với M-RoPE Qwen2-VL.
- Nêu tên tối ưu triển khai Visual Resolution Router (ViR) và Decoupled Vision-Language (DvD).

## The Problem

Huấn luyện VLM thêm sau là mặc định. LLaVA, BLIP-2, Qwen-VL, Idefics — đều lấy LLM đã tiền huấn luyện (Llama, Vicuna, Qwen, Mistral) và thêm thị giác. Các giai đoạn thường như:

1. LLM đóng băng + encoder thị giác đóng băng + projector có thể huấn luyện, huấn luyện trên cặp chú thích để căn chỉnh embedding.
2. Mở băng LLM, huấn luyện trên dữ liệu chỉ dẫn (LLaVA-Instruct, ShareGPT4V).
3. Fine-tune riêng tác vụ tùy chọn.

Ba triệu chứng nợ căn chỉnh xuất hiện:

- Quên thảm khốc. VLM thêm sau quên kỹ năng chỉ văn bản. Điểm GSM8K giảm 5-10 điểm. Điểm Hellaswag giảm. Tác tử văn bản thuần hồi quy.
- Trôi câu trả lời. Cách diễn đạt nhỏ của cùng câu hỏi thị giác nhận câu trả lời khác nhau. Encoder thị giác nối LLM bằng liên kết yếu hơn token riêng của LLM.
- Không nhất quán thị giác-văn bản. VLM có thể mô tả đúng ảnh rồi trả lời câu hỏi mâu thuẫn mô tả của chính nó. Token thị giác không tham gia kiểm tra nhất quán nội bộ LLM giống văn bản.

Các triệu chứng được ghi nhận rõ. Mục 4 MM1.5 định lượng. Thí nghiệm loại bỏ thành phần LLaVA-OneVision gợi chúng. Tiền huấn luyện nguyên bản là câu trả lời.

## The Concept

### Native multimodal pretraining

InternVL3 huấn luyện từ đầu trên ngữ liệu đa phương thức nguyên bản từ bước một. Hỗn hợp là:

- 40% dữ liệu chỉ văn bản (FineWeb, Proof-Pile-2, v.v.)
- 35% dữ liệu ảnh-văn bản xen kẽ (OBELICS, kiểu MMC4)
- 20% dữ liệu ảnh-chú thích ghép cặp
- 5% dữ liệu video-văn bản

Token thị giác, token văn bản và tương tác xuyên phương thức đều tham gia cùng loss từ bước gradient đầu. Không tiền huấn luyện căn chỉnh, không giai đoạn đóng băng projector, không quên thảm khốc để phục hồi.

Huấn luyện một giai đoạn cho mô hình cơ sở. Instruction tuning theo sau, nhưng mô hình cơ sở đã hiểu token thị giác như thành phần hạng nhất.

### V2PE (variable visual position encoding)

Qwen2-VL dùng M-RoPE với phân bổ trục cố định. InternVL3 đưa V2PE: mã hóa vị trí thay đổi theo loại phương thức (văn bản, ảnh, video) với co giãn có thể học. Trong thực tế:

- Token văn bản nhận vị trí 1D (chỉ số văn bản).
- Patch ảnh nhận vị trí 2D (hàng, cột).
- Khung video nhận vị trí 3D (thời gian, hàng, cột).

Cả ba chia sẻ cơ sở tần số RoPE, nhưng phân bổ chiều ẩn mỗi dải là tham số được học thay vì chia cố định. Tự do đánh đổi độ phân giải tần số thời gian so với không gian trong tiền huấn luyện.

Tuyên bố thí nghiệm loại bỏ thành phần V2PE: 1-2 điểm trên benchmark video hơn M-RoPE ở cùng tính toán. Không cách mạng, nhưng gọn hơn.

### Visual Resolution Router (ViR)

Tối ưu triển khai. Không phải mọi ảnh cần mã hóa độ phân giải đầy đủ. Ảnh một đối tượng ít chi tiết lãng phí token khi mã hóa ở 1280px nguyên bản. ViR là bộ phân loại nhỏ dự đoán độ phân giải tối thiểu cần để trả lời trước mã hóa.

Định tuyến ba tầng: độ phân giải thấp (256 token), trung bình (576), cao (2048+). Với 60% truy vấn trong lưu lượng sản xuất, thấp hoặc trung bình là đủ. Hiệu quả ròng: thông lượng 2-3x ở chất lượng bằng nhau.

### Decoupled Vision-Language deployment (DvD)

Khi phục vụ VLM lớn, encoder thị giác chạy một lần mỗi ảnh nhưng LLM chạy tự hồi quy cho mọi token đầu ra. Hai thành phần có nút thắt khác (thị giác = băng thông bộ nhớ GPU cho conv + attention; LLM = KV cache). DvD tách lên GPU riêng với streaming ở giữa.

Với mô hình encoder 8B + 400M, DvD tăng khoảng gấp đôi thông lượng mỗi node so với cùng đặt một nơi.

### Single-stage vs multi-stage quality

Tuyên bố benchmark chính InternVL3: ở 78B tham số, ngang MMMU-Pro Gemini 2.5 Pro. Ở 38B, ngang GPT-4o. Ở 8B, dẫn bảng mở 8B. Tất cả trên công thức tiền huấn luyện một giai đoạn + instruction-tune.

Giả thuyết nợ căn chỉnh đo được: InternVL3-8B mất ít điểm benchmark văn bản (MMLU, GSM8K) hơn Qwen2.5-VL-7B mỗi đơn vị tăng benchmark thị giác. Mô hình tổng quát hơn vì huấn luyện một khối, không hai.

### InternVL3.5 and InternVL-U

InternVL3.5 (tháng 8 năm 2025) mở rộng công thức. Cùng tiền huấn luyện nguyên bản, nhiều dữ liệu hơn, nhiều tham số hơn. Cải thiện MMMU gia tăng.

InternVL-U (2026) thêm sinh thống nhất — đầu ra ảnh qua head MMDiT trên cùng backbone. "U" là "Hiểu + sinh", đuổi theo mô hình thống nhất kiểu Transfusion (Bài 12.13). Cùng backbone tiền huấn luyện nguyên bản hỗ trợ cả head hiểu và sinh.

### Trade-offs of native pretraining

Tiền huấn luyện nguyên bản không miễn phí:

- Tính toán. Huấn luyện VLM mới từ đầu tốn như huấn luyện LLM văn bản — hàng triệu GPU-giờ. Thích nghi thêm sau tái sử dụng trọng số LLM hiện có, tiết kiệm phần lớn chi phí.
- Dữ liệu. Ngữ liệu ảnh-văn bản xen kẽ ở quy mô lớn hiếm. OBELICS là 141M tài liệu; MMC4 là 571M. Riêng văn bản có ở 15T token. Khan hiếm dữ liệu tiền huấn luyện đa phương thức là ràng buộc cứng.
- Tái sử dụng LLM cơ sở. Tiền huấn luyện nguyên bản bỏ lựa chọn thay LLM mới sau. Thêm sau cho đổi Llama-3.1 sang Llama-4 bằng chỉ huấn luyện lại adapter.

Đặt cược InternVL3: nợ căn chỉnh tệ hơn mất tái sử dụng. Benchmark ủng hộ. Chi phí sản xuất ngăn phòng thí nghiệm tương lai sao chép rẻ. VLM thêm sau sẽ còn vì vẫn rẻ hơn cho hầu hết dự án.

```figure
l5-native-pretrain
```

## Use It

`code/main.py` là bộ trộn ngữ liệu huấn luyện và mô phỏng router ViR. Nó:

- Nhận hỗn hợp ngữ liệu đích (%văn bản, %xen kẽ, %chú thích, %video) và tính bước kỳ vọng mỗi phương thức.
- Mô phỏng định tuyến ViR trên batch truy vấn (phân phối: 50% ít chi tiết, 30% trung bình, 20% nhiều chi tiết) và báo số token trung bình.
- Báo ước lượng thông lượng DvD với FLOPs encoder so với LLM cho trước.
- In đối chiếu tiền huấn luyện thêm sau với nguyên bản về tham số, tính toán, dữ liệu và triệu chứng nợ căn chỉnh kỳ vọng.

## Ship It

Bài học này tạo `outputs/skill-native-vs-posthoc-auditor.md`. Với kế hoạch huấn luyện VLM đề xuất, nó kiểm toán nên chọn nguyên bản hay thêm sau, đánh dấu rủi ro nợ căn chỉnh và khuyến nghị hỗn hợp ngữ liệu. Dùng khi định cỡ dự án VLM mở mới và cần chọn chiến lược huấn luyện.

## Exercises

1. Ước lượng chênh lệch tính toán giữa InternVL3-8B (tiền huấn luyện nguyên bản) và LLaVA-OneVision-7B (thêm sau). Tỷ lệ GPU-giờ xấp xỉ? Điều gì giải thích khoảng cách?

2. InternVL3 báo 40% văn bản / 35% xen kẽ / 20% chú thích / 5% video. Nếu tác vụ đích nặng video, đề xuất tỷ lệ mới và lập luận tại sao mô hình cơ sở vẫn cần đáng kể dữ liệu văn bản và chú thích.

3. Đọc Mục 4 MM1.5 về quên. Nêu đúng benchmark huấn luyện thêm sau có hồi quy lớn nhất. Hồi quy tốn bao nhiêu?

4. ViR định tuyến 60% lưu lượng sang mã hóa độ phân giải thấp. Truy vấn nào nó định tuyến sai (gửi thấp khi cần cao)? Đề xuất ba dạng thất bại router.

5. DvD tách thị giác và LLM lên GPU riêng. Dưới mẫu lưu lượng nào DvD hại thông lượng thay vì giúp?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Native multimodal pretraining (Tiền huấn luyện đa phương thức nguyên bản) | "Từ đầu cùng nhau" | Token văn bản + ảnh + video tham gia loss từ bước 1, không gắn về sau |
| Alignment debt (Nợ căn chỉnh) | "Phạt thêm sau" | Hồi quy đo được về kỹ năng văn bản và nhất quán câu trả lời do gắn thị giác vào LLM đóng băng |
| V2PE | "Mã hóa vị trí thị giác thay đổi" | Phân bổ mã hóa vị trí có thể học theo phương thức; kế nhiệm M-RoPE của InternVL3 |
| ViR | "Router độ phân giải" | Bộ phân loại nhỏ chọn độ phân giải tối thiểu mỗi truy vấn trước mã hóa, tiết kiệm token suy luận |
| DvD | "Triển khai tách rời" | Encoder thị giác trên một GPU, LLM trên GPU khác, bàn giao stream; tăng gấp đôi thông lượng VLM lớn |
| InternVL-U | "Hiểu + sinh thống nhất" | Bản tiếp nối 2026 thêm head sinh ảnh vào backbone tiền huấn luyện nguyên bản |
| Interleaved corpus (Ngữ liệu xen kẽ) | "OBELICS / MMC4" | Tài liệu có văn bản và ảnh theo thứ tự đọc tự nhiên; nguyên liệu cho tiền huấn luyện nguyên bản |

## Further Reading

- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
