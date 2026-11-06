# ColPali and Vision-Native Document RAG

> RAG truyền thống phân tích PDF thành văn bản, chia thành đoạn, embedding các đoạn, lưu vector. Mỗi bước mất tín hiệu: OCR bỏ dữ liệu biểu đồ, chia đoạn phá hàng bảng, embedding văn bản bỏ qua hình. ColPali (Faysse và cộng sự, tháng 7 năm 2024) đặt câu hỏi đơn giản hơn: tại sao phải trích xuất văn bản? Embedding ảnh trang trực tiếp qua PaliGemma, dùng tương tác muộn kiểu ColBERT để truy xuất và giữ mọi tín hiệu bố cục, hình, phông chữ và định dạng mà tài liệu mang theo. Benchmark công bố: độ chính xác đầu cuối tốt hơn RAG văn bản 20-40% trên tài liệu giàu thị giác. ColQwen2, ColSmol và VisRAG mở rộng mẫu này. Bài học này đọc luận điểm RAG thị giác nguyên bản và xây dựng bộ lập chỉ mục nhỏ giống ColPali.

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**Prerequisites:** Phase 11 (LLM Engineering — RAG basics), Phase 12 · 05 (LLaVA)
**Time:** ~180 minutes

## Learning Objectives

- Giải thích khác biệt giữa truy xuất bi-encoder (một vector mỗi tài liệu) và truy xuất tương tác muộn (nhiều vector mỗi tài liệu).
- Mô tả phép toán MaxSim của ColBERT và cách ColPali khái quát nó từ token văn bản sang patch ảnh.
- Xây dựng bộ lập chỉ mục nhỏ giống ColPali: trang → embedding patch → MaxSim trên embedding từ truy vấn → top-k trang.
- So sánh ColPali + bộ tạo Qwen2.5-VL với RAG văn bản + GPT-4 trên trường hợp sử dụng hóa đơn / báo cáo tài chính.

## The Problem

RAG văn bản trên PDF vứt bỏ phần lớn tài liệu. Tăng trưởng doanh thu Q3 của báo cáo tài chính thường nằm trong biểu đồ; phát hiện của báo cáo y tế nằm trong ảnh có chú giải; khối chữ ký của hợp đồng pháp lý là sự kiện bố cục, không phải sự kiện văn bản.

Pipeline RAG văn bản:

1. PDF → văn bản qua OCR / pdftotext.
2. Văn bản → đoạn 300-500 token.
3. Đoạn → embedding bi-encoder (một vector).
4. Truy vấn người dùng → embedding → độ tương đồng cosine → top-k đoạn.
5. Đoạn + truy vấn → LLM.

Năm bước có mất mát. Biểu đồ không được nắm bắt. Bảng bị chia qua các đoạn. Bố cục nhiều cột bị làm phẳng. Chú giải hình biến mất.

Cách khắc phục của ColPali: bỏ OCR, embedding ảnh trang trực tiếp. Dùng tương tác muộn kiểu ColBERT để truy xuất nhằm cho mô hình chú ý đến patch tinh mịn lúc truy vấn.

## The Concept

### ColBERT (2020)

ColBERT (Khattab & Zaharia, arXiv:2004.12832) là phương pháp truy xuất văn bản. Thay vì một vector mỗi tài liệu, nó tạo một vector mỗi token. Lúc truy vấn:

- Token truy vấn nhận embedding riêng ($N_q$ vector).
- Token tài liệu nhận embedding ($N_d$ vector, thường được lưu đệm).
- Điểm = tổng trên token truy vấn của giá trị cực đại trên token tài liệu về độ tương đồng cosine: $\sum_i \max_j \cos(q_i, d_j)$.

Đây là phép toán MaxSim. Mỗi token truy vấn "chọn" token tài liệu khớp tốt nhất. Điểm cuối cùng là tổng.

Ưu điểm: độ thu hồi mạnh, xử lý ngữ nghĩa cấp từ. Nhược điểm: $N_d$ vector mỗi tài liệu, lưu trữ tốn kém.

### ColPali

ColPali (Faysse và cộng sự, arXiv:2407.01449) áp dụng mẫu ColBERT cho ảnh.

- Mỗi trang được PaliGemma (ViT + ngôn ngữ) mã hóa thành embedding patch: $N_p$ vector mỗi trang.
- Mỗi truy vấn người dùng (văn bản) được mã hóa thành embedding token truy vấn: $N_q$ vector.
- Điểm = $\sum_i \max_j \cos(q_i, p_j)$, tức MaxSim trên token văn bản truy vấn và patch ảnh trang.
- Truy xuất top-k trang theo tổng điểm.

Lúc tiếp nhận tài liệu: embedding mọi trang bằng PaliGemma, lưu toàn bộ embedding patch. Lúc truy vấn: embedding token truy vấn, tính MaxSim với mọi embedding trang đã lưu, trả top-k trang.

Ưu điểm: đầu cuối vượt RAG văn bản 20-40% trên tài liệu giàu thị giác. Mỗi vector patch nắm bắt bố cục và nội dung cục bộ.

Nhược điểm: $N_p$ patch × số thực 4 byte × vector $D$ chiều mỗi trang = lưu trữ tăng nhanh. Giảm nhẹ bằng lượng tử hóa PQ / OPQ.

### ColQwen2 and ColSmol

ColQwen2 (illuin-tech, 2024-2025) thay PaliGemma bằng Qwen2-VL. Bộ mã hóa nền tốt hơn, truy xuất tốt hơn.

ColSmol là biến thể quy mô nhỏ hơn cho sử dụng cục bộ / biên. Bộ truy xuất ColSmol ở ~1B tham số chạy trên GPU phổ thông.

### VisRAG

VisRAG (Yu và cộng sự, arXiv:2410.10594) là biến thể khác: thay vì MaxSim trên patch, pool mỗi trang thành một vector duy nhất bằng VLM rồi truy xuất bi-encoder. Lập chỉ mục nhanh hơn + lưu trữ nhỏ hơn, độ thu hồi yếu hơn.

Đánh đổi chất lượng so với chi phí: ColPali cho chất lượng, VisRAG cho quy mô.

### M3DocRAG

M3DocRAG (Cho và cộng sự, arXiv:2411.04952) mở rộng truy xuất đa phương thức sang suy luận nhiều trang nhiều tài liệu. Truy xuất trang trên các tài liệu, ghép ngữ cảnh nhiều trang cho VLM.

### ViDoRe — the benchmark

Benchmark đi kèm của ColPali. Đánh giá truy xuất tài liệu thị giác. Tác vụ gồm báo cáo tài chính, bài báo khoa học, tài liệu hành chính, hồ sơ y tế, hướng dẫn sử dụng. Chỉ số: nDCG@5.

ColPali-v1 đạt ~80% nDCG@5 trên ViDoRe; RAG văn bản trên cùng tài liệu đạt ~50-60%.

### The end-to-end RAG pipeline

Với RAG thị giác nguyên bản:

1. Tiếp nhận: PDF → ảnh trang → mã hóa PaliGemma → lưu toàn bộ embedding patch.
2. Truy vấn: văn bản người dùng → embedding token truy vấn → MaxSim với mọi trang đã lập chỉ mục → top-k trang.
3. Tạo sinh: top-k ảnh trang + truy vấn → VLM (Qwen2.5-VL hoặc Claude) → câu trả lời.

Không OCR ở bất kỳ đâu. Hình, biểu đồ, phông chữ, bố cục đều đi vào câu trả lời.

### Storage math

Báo cáo tài chính 50 trang với 729 patch mỗi trang và embedding 128 chiều:

- ColPali: 50 * 729 * 128 * 4 byte = ~18 MB thô, ~2.3 MB sau PQ 8 lần.
- RAG văn bản: 50 đoạn * 768 chiều * 4 byte = ~150 kB.

ColPali tốn lưu trữ thô cho mỗi tài liệu nhiều hơn ~120 lần. Ở quy mô lớn, OPQ / PQ 8 lần đưa nó xuống ~15 lần, thường có thể chấp nhận.

### When text-RAG still wins

- Tài liệu thuần văn bản không có tín hiệu bố cục (bài wiki, nhật ký trò chuyện). RAG văn bản đơn giản hơn và rẻ hơn về lưu trữ.
- Kho lưu trữ nhiều triệu trang nơi lưu trữ chiếm phần lớn chi phí.
- Yêu cầu quy định nghiêm ngặt đòi hỏi văn bản OCR có thể trích xuất đi kèm truy xuất.

Với mọi thứ khác năm 2026 — báo cáo tài chính, bài báo khoa học, hợp đồng pháp lý, hồ sơ y tế, tài liệu UX — RAG thị giác nguyên bản thắng.

```figure
mm-maxsim
```

## Use It

`code/main.py`:

- Bộ mã hóa patch đơn giản: ánh xạ một "trang" (lưới nhỏ các vector đặc trưng) thành mảng embedding patch.
- Bộ chấm điểm MaxSim: tính điểm kiểu ColBERT giữa tập embedding token truy vấn và tập patch trang.
- Lập chỉ mục 5 trang đơn giản, chạy 3 truy vấn, trả top-k kèm điểm.

## Ship It

Bài học này tạo ra `outputs/skill-vision-rag-designer.md`. Với dự án RAG tài liệu, chọn ColPali / ColQwen2 / VisRAG / RAG văn bản và xác định dung lượng lưu trữ.

## Exercises

1. Báo cáo thường niên 200 trang ở 729 patch mỗi trang, embedding 128 chiều, số thực 4 byte. Tính lưu trữ thô và lưu trữ nén PQ (8x).

2. MaxSim là $\sum_i \max_j \cos(q_i, p_j)$. Tổng này nắm bắt điều gì mà độ tương đồng trung bình đơn giản không nắm bắt?

3. ColPali lập chỉ mục trang thành tập patch. Điều gì thay đổi nếu thay vào đó lập chỉ mục ở cấp từ (như ColBERT)? Các đánh đổi?

4. Thiết kế pipeline đầu cuối cho ngữ liệu 1M trang với ngân sách độ trễ 500ms mỗi truy vấn. Chọn ColQwen2 / VisRAG và biện minh.

5. Đọc M3DocRAG (arXiv:2411.04952). Mô tả mẫu attention nhiều trang và cách nó khác truy xuất ColPali một trang.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Late interaction (Tương tác muộn) | "Kiểu ColBERT" | Truy xuất dùng embedding mỗi token hoặc mỗi patch + MaxSim, thay vì một vector tài liệu |
| MaxSim | "Cực đại trên patch" | Với mỗi token truy vấn, chọn token tài liệu có độ tương đồng cao nhất; cộng trên truy vấn |
| Bi-encoder | "Một vector" | Một vector mỗi tài liệu; nhanh hơn nhưng mất độ chi tiết |
| Multi-vector (Đa vector) | "Nhiều vector mỗi tài liệu" | Lưu $N_p$ vector mỗi tài liệu / trang; chi phí lưu trữ tăng nhưng độ thu hồi cải thiện |
| Patch embedding (Embedding patch) | "Đặc trưng trang" | Một vector mỗi patch ảnh từ bộ mã hóa VLM, lưu đệm theo trang |
| ViDoRe | "Benchmark tài liệu thị giác" | Bộ benchmark ColPali cho truy xuất tài liệu thị giác |
| PQ quantization (Lượng tử hóa PQ) | "Lượng tử hóa tích" | Nén duy trì độ tương đồng vector trong khi giảm lưu trữ ~8x |

## Further Reading

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)
