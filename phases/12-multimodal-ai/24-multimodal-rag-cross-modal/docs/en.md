# Multimodal RAG and Cross-Modal Retrieval

> RAG tài liệu thị giác nguyên bản là một lát cắt. RAG đa phương thức trong sản xuất đi rộng hơn — truy xuất trên văn bản, ảnh, âm thanh và video cho các quy trình như lập kế hoạch chuyến đi ("tìm cho tôi bữa sáng muộn thuần chay yên tĩnh với ánh sáng tự nhiên"), phân loại y tế ("chấn thương nào khớp ảnh này + các ghi chú này"), thương mại điện tử ("trang phục tương tự ảnh selfie này, đúng cỡ của tôi") và dịch vụ hiện trường ("chẩn đoán tiếng động cơ này cộng ảnh bộ phận"). Ba khảo sát năm 2025 — Abootorabi và cộng sự, Mei và cộng sự, Zhao và cộng sự — hệ thống hóa các bài toán con: truy xuất chéo phương thức, hợp nhất truy xuất, neo tạo sinh, đánh giá đa phương thức. Bài học này đọc các khảo sát và thiết kế pipeline sản xuất.

**Type:** Build
**Languages:** Python (stdlib, cross-modal retriever with fusion + grounded generator)
**Prerequisites:** Phase 12 · 23 (ColPali), Phase 11 (RAG basics)
**Time:** ~180 minutes

## Learning Objectives

- Thiết kế truy xuất chéo phương thức: văn bản → ảnh, ảnh → văn bản, âm thanh → video, v.v.
- So sánh ba chiến lược hợp nhất: hợp nhất điểm, hợp nhất dựa trên attention, hợp nhất MoE.
- Giải thích neo tạo sinh: "trích dẫn nguồn của bạn" trông như thế nào khi nguồn là hỗn hợp các phương thức.
- Nêu tên ba khảo sát RAG đa phương thức kinh điển năm 2025 và hệ phân loại bài toán con của chúng.

## The Problem

RAG một phương thức là mẫu đã được giải quyết: embedding truy vấn, embedding đoạn, truy xuất, nhét vào LLM. RAG đa phương thức đòi hỏi:

1. Nhiều head truy xuất (mỗi phương thức cần embedding trong không gian tương thích).
2. Hợp nhất kết quả truy xuất trên các phương thức.
3. Neo tạo sinh trích dẫn nguồn trên các phương thức.
4. Chỉ số đánh giá bao phủ tín hiệu chéo phương thức.

Các khảo sát năm 2025 đều đi đến cùng hệ phân loại.

## The Concept

### Cross-modal retrieval

Truy xuất tài liệu phương thức B với truy vấn phương thức A. Ba mẫu:

1. Không gian embedding dùng chung. CLIP và CLAP tạo embedding văn bản + ảnh / văn bản + âm thanh trong không gian dùng chung. Độ tương đồng cosine chéo phương thức hoạt động trực tiếp. Giới hạn ở các cặp được huấn luyện bằng CLIP.

2. Bộ mã hóa mỗi phương thức + chuyển đổi. Bộ mã hóa văn bản + bộ mã hóa ảnh + mô-đun chuyển đổi nhỏ ánh xạ giữa các không gian. Sen2Sen của Gupta và cộng sự và các thiết kế năm 2024 khác. Linh hoạt nhưng thêm độ phức tạp.

3. VLM làm bộ mã hóa. Dùng trạng thái ẩn VLM làm biểu diễn truy xuất. Bất kỳ phương thức nào VLM hỗ trợ đều hoạt động. Chất lượng cao hơn, tốn kém hơn.

Lựa chọn: CLIP / SigLIP 2 cho văn bản+ảnh; CLAP cho văn bản+âm thanh; trạng thái ẩn VLM cho chéo phương thức ở chất lượng tiên tiến nhất.

### Fusion strategies

Bạn đã truy xuất 10 kết quả: 5 ảnh, 3 đoạn văn bản, 2 clip âm thanh. Bạn gộp thế nào?

Hợp nhất điểm (rẻ nhất). Mỗi phương thức có bộ truy xuất riêng, mỗi bộ trả điểm. Chuẩn hóa điểm trong từng phương thức rồi cộng. Đơn giản, thường hoạt động.

Hợp nhất dựa trên attention. Ghép mọi mục truy xuất, để mạng attention nhỏ gán trọng số cho chúng. Cần huấn luyện.

Hợp nhất MoE. Mạng cổng định tuyến đến chuyên gia riêng cho từng phương thức. Các loại truy vấn khác nhau định tuyến khác nhau — câu hỏi thị giác gán trọng số ảnh cao hơn.

Mặc định trong sản xuất: hợp nhất điểm với thiên lệch nhẹ về phương thức chủ đạo của truy vấn. Nâng cấp sang MoE nếu A/B cho thấy lợi ích rõ trên miền của bạn.

### Generation grounding

LLM nên trích dẫn mục truy xuất nào dẫn đến mỗi khẳng định. Với đa phương thức:

- Nguồn văn bản: trích dẫn tiêu chuẩn `[1]`.
- Nguồn ảnh: `[img 3]` với chú thích ngắn.
- Âm thanh: `[audio 2 at 0:34]`.

Huấn luyện bộ tạo với dữ liệu nhận biết neo nguồn: mỗi khẳng định trong mục tiêu huấn luyện được gắn chỉ số nguồn. Khi suy luận, mô hình tự nhiên phát trích dẫn.

### The 2025 surveys

Abootorabi và cộng sự (arXiv:2502.08826, "Ask in Any Modality"): hệ phân loại RAG đa phương thức. Bao phủ truy xuất, hợp nhất, tạo sinh. Phạm vi rộng nhất.

Mei và cộng sự (arXiv:2504.08748, "A Survey of Multimodal RAG"): tập trung benchmark tác vụ con và dạng lỗi. Hữu ích cho thiết kế đánh giá.

Zhao và cộng sự (arXiv:2503.18016): khảo sát tập trung thị giác. Mạnh về các công trình họ ColPali.

Đọc cả ba cho bạn hiện trạng tiên tiến nhất tính đến mùa xuân năm 2025. Phần lớn bài toán con vẫn còn mở.

### MuRAG — the foundational paper

MuRAG (Chen và cộng sự, 2022) là RAG đa phương thức đầu tiên. Truy xuất ảnh + văn bản từ KB đa phương thức, tạo câu trả lời. Cho thấy tính khả thi trước làn sóng VLM. Các hệ thống hiện đại (REACT, VisRAG, M3DocRAG) xây dựng trên nó.

### A production trip-planner example

Truy vấn: "tìm cho tôi bữa sáng muộn thuần chay yên tĩnh với ánh sáng tự nhiên."

Pipeline:

1. Phân rã truy vấn. "yên tĩnh" → từ khóa âm thanh/đánh giá; "bữa sáng muộn thuần chay" → mục thực đơn; "ánh sáng tự nhiên" → đặc trưng ảnh.
2. Truy xuất theo từng phương thức:
   - Truy xuất văn bản trên đánh giá: "bữa sáng muộn thuần chay, không khí yên tĩnh."
   - Truy xuất ảnh trên ảnh nhà hàng: "ánh sáng tự nhiên, thoáng đãng."
   - Truy xuất âm thanh trên clip âm thanh xung quanh: "decibel thấp, không nhạc."
3. Hợp nhất điểm. Mỗi nhà hàng có điểm tổng hợp.
4. Top-k nhà hàng → bộ tạo VLM với mọi bằng chứng → câu trả lời có trích dẫn.

Điều này vượt xa RAG văn bản. Mỗi phương thức thêm tín hiệu mà chỉ văn bản bỏ lỡ.

### Agentic multimodal RAG

Nhiều bước: nếu truy xuất đầu tiên không trả câu trả lời độ tin cậy cao, LLM diễn đạt lại và truy xuất lần nữa. Các mẫu RAG bằng agent từ Giai đoạn 14 áp dụng ở đây. Ví dụ:

- Truy xuất top-10 ban đầu → LLM hỏi "quá ồn, lọc <40 dB" → truy xuất lại.
- Truy xuất ảnh → LLM thấy một ảnh có thực đơn → truy xuất văn bản thực đơn → trả lời.

Thêm độ phức tạp nhưng xử lý truy vấn mà truy xuất một lần không thể.

### Evaluation

Đánh giá chéo phương thức vẫn chưa trưởng thành. Các thước đo thay thế phổ biến:

- Recall@k mỗi phương thức.
- Độ chính xác top-k hợp nhất.
- Mức hài lòng đầu cuối do con người đánh giá.
- Riêng cho tác vụ (đặt chỗ hoàn tất, giao dịch mua được thực hiện).

Không benchmark tiêu chuẩn nào trải trên mọi phương thức. Phần lớn bài báo đánh giá trên tác vụ riêng cho miền.

```figure
contrastive-matrix
```

## Use It

`code/main.py`:

- Ba bộ truy xuất giả lập (văn bản, ảnh, âm thanh) hoạt động trên ngữ liệu nhà hàng dùng chung.
- Hợp nhất điểm kết hợp điểm phương thức với trọng số có thể cấu hình.
- Bộ tạo khung phát câu trả lời cuối cùng có trích dẫn.
- Vòng lặp agent đơn giản diễn đạt lại truy vấn nếu độ tin cậy thấp.

## Ship It

Bài học này tạo ra `outputs/skill-multimodal-rag-designer.md`. Với đặc tả sản phẩm có luồng truy vấn đa phương thức, thiết kế bộ truy xuất, hợp nhất, bộ tạo và đánh giá.

## Exercises

1. Đề xuất RAG đa phương thức phân loại y tế: truy vấn = ảnh chấn thương + triệu chứng văn bản. Các phương thức nào truy xuất từ KB nào?

2. Hợp nhất điểm là tổng có trọng số đơn giản. Nó có dạng lỗi nào mà hợp nhất MoE tránh được?

3. Đọc hệ phân loại của Abootorabi và cộng sự (Mục 3). Ba bài toán con kinh điển là gì và chúng ánh xạ vào sản phẩm bạn chọn thế nào?

4. Thiết kế đặc tả đánh giá cho RAG đa phương thức lập kế hoạch chuyến đi. Chỉ số nào bao phủ độ thu hồi ảnh, độ thu hồi âm thanh và tính đúng tổng hợp?

5. RAG nhiều bước bằng agent có chi phí độ trễ mỗi lượt khứ hồi. Ở độ khó truy vấn nào mức tăng độ chính xác biện minh cho độ trễ?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Cross-modal retrieval (Truy xuất chéo phương thức) | "Truy vấn một phương thức, truy xuất phương thức khác" | Truy vấn văn bản truy xuất ảnh; truy vấn ảnh truy xuất văn bản; cần không gian dùng chung hoặc bộ chuyển đổi |
| Score fusion (Hợp nhất điểm) | "Kết hợp điểm" | Tổng có trọng số các điểm truy xuất mỗi phương thức; hợp nhất đơn giản nhất |
| MoE fusion (Hợp nhất MoE) | "Chuyên gia được định tuyến theo phương thức" | Mạng cổng chọn điểm của phương thức nào để tin theo từng truy vấn |
| Grounded generation (Tạo sinh được neo nguồn) | "Trích dẫn nguồn của bạn" | Mỗi khẳng định trong câu trả lời được gắn chỉ số nguồn |
| MuRAG | "RAG đa phương thức đầu tiên" | Bài báo năm 2022 xác lập mẫu RAG đa phương thức |
| Agentic multi-hop (Nhiều bước bằng agent) | "Diễn đạt lại và thử lại" | LLM truy vấn lại bộ truy xuất khi độ tin cậy lượt đầu thấp |

## Further Reading

- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
