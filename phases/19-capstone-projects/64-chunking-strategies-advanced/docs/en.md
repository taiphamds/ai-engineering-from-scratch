# Chunking Strategies, Compared

> Chia đoạn quyết định thứ bộ truy xuất của bạn có thể từng đưa ra. Làm sai ranh giới và không mô hình embedding, không bộ xếp hạng lại, không LLM nào có thể sửa thiệt hại ở hạ nguồn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 lessons 04 (embeddings), 06 (RAG), 07 (advanced RAG); Phase 19 Track B foundations (lessons 20-29)
**Time:** ~90 minutes

## Learning Objectives
- Triển khai năm chiến lược chia đoạn từ đầu: cửa sổ cố định, câu, chia đệ quy, phân cụm ngữ nghĩa, và các tiêu đề markdown cấu trúc.
- Đo recall@k trên một corpus fixture với các khoảng đáp án được gắn nhãn chuẩn và giải thích tại sao một chiến lược thắng trên văn xuôi và một chiến lược khác thắng trên các tài liệu kỹ thuật.
- Đọc một phân phối độ dài đoạn và nhận ra các chế độ lỗi mỗi chiến lược đưa vào: câu mồ côi, cắt giữa ký hiệu, đoạn chỉ tiêu đề, độ trôi ngữ nghĩa.
- Chọn một mặc định cho một corpus mới mà không chạy benchmark bằng cách kiểm tra ba thuộc tính: loại tài liệu, độ dài đoạn văn trung bình, và liệu định dạng mang cấu trúc tường minh không.

## The Problem

Mọi pipeline RAG bắt đầu bằng cắt các tài liệu nguồn thành các phần đủ nhỏ để một mô hình embedding chứa được và đủ lớn để mỗi phần mang một ý tưởng tự chứa. Lựa chọn nơi cắt không phải một siêu tham số. Nó là cận trên của thứ bộ truy xuất có thể từng trả về.

Một truy vấn hỏi "ngưỡng hủy do ngân sách trông như thế nào" chỉ có thể thành công nếu đoạn giữ ngưỡng hủy có thể tiếp cận. Nếu bộ chia cửa sổ cố định cắt giá trị ngưỡng khỏi ngữ cảnh xung quanh, embedding chuyển sang một cụm khác, điểm BM25 giảm, các bộ xếp hạng lại thấy nhiễu, và đáp án LLM sinh là sai. Bài báo năm 2024 "LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs" đo một dao động tuyệt đối 35 phần trăm về recall truy xuất chỉ từ lựa chọn chia đoạn. Nghiên cứu tiếp nối năm 2025 về tiêu đề đoạn theo ngữ cảnh thu hẹp khoảng cách nhưng không đóng nó.

Bài này xây dựng năm chiến lược cạnh nhau, chạy chúng với một corpus fixture có các khoảng đáp án được gắn nhãn chuẩn, và để bạn tự đọc các số recall.

## The Concept

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### Fixed-window

Đường cơ sở vét cạn. Cắt mỗi N ký tự. Tùy chọn chồng lấn để một câu bị cắt ở vị trí N xuất hiện nguyên vẹn bên trong đoạn bắt đầu ở vị trí N - overlap. Nhanh, tất định, tệ ở các ranh giới. Dùng nó làm đối chứng, không phải mặc định.

### Sentence

Chia tại các ranh giới câu bằng một regex hoặc một máy trạng thái đơn giản. Đóng gói một hoặc nhiều câu vào một đoạn tới một ngân sách ký tự đích. Ngừng cắt giữa từ. Vẫn cắt giữa đoạn văn và giữa mục. Mặc định trong nhiều pipeline RAG đầu tiên và một lựa chọn hợp lý cho văn xuôi không có cấu trúc khác.

### Recursive split

Chiến lược phân cấp được các thư viện thời 2023 phổ biến. Thử chia theo dấu phân cách mạnh nhất trước (dòng mới kép, đoạn văn), quay về cái tiếp theo (dòng mới đơn), rồi đến câu, rồi đến ký tự. Đệ quy kết thúc khi đoạn vừa ngân sách. Mạnh trên các tài liệu có cấu trúc không nhất quán vì nó thích ứng theo vùng.

### Semantic clustering

Nhúng mọi câu. Phân cụm các câu liên tiếp chia sẻ một tâm chủ đề. Cắt bất cứ khi nào độ tương tự đang chạy với tâm giảm dưới một ngưỡng. Các ranh giới phản ánh ý nghĩa, không phải ký tự. Chậm hơn để xây dựng và phụ thuộc mô hình embedding, nhưng bền vững với các tài liệu chuyển chủ đề bên trong một đoạn văn.

### Structural markdown headers

Với các tài liệu mang cấu trúc tường minh (markdown, reStructuredText, các mục đánh số kiểu RFC), cắt tại ranh giới tiêu đề. Mỗi đoạn trở thành tiêu đề cộng mọi thứ bên dưới nó đến tiêu đề tiếp theo ở cùng hoặc cấp cao hơn. Các đoạn nhỏ nhất theo chủ đề, nhưng chỉ có khi corpus đúng cấu trúc.

### How recall@k measures the boundary choice

Một truy vấn được gắn nhãn chuẩn mang các độ lệch ký tự chính xác của khoảng đáp án bên trong tài liệu nguồn. Sau chia đoạn, bạn hỏi: có bất kỳ đoạn nào trong top-k bộ truy xuất trả về chồng lấn khoảng chuẩn không? Nếu có, recall@k cho truy vấn đó là 1. Nếu không, là 0. Lấy trung bình trên tập truy vấn. Chạy cùng đánh giá cho mỗi chiến lược và độ trải cho bạn thấy chính sách ranh giới nào sống sót qua corpus bạn có.

```figure
ci-chunk-boundaries
```

## Build It

`code/main.py` triển khai:

- `fixed_window(text, size, overlap)` - đường cơ sở.
- `sentence_chunks(text, target)` - bộ đóng gói câu đơn giản.
- `recursive_split(text, separators, target)` - đệ quy phân cấp.
- `semantic_chunks(text, similarity_threshold)` - phân cụm dựa trên tâm trên một embedding giả lập tất định.
- `structural_markdown(text)` - bộ chia có nhận thức tiêu đề.
- `mock_embed(text, dim)` - một embedding dựa trên băm để vòng lặp chạy ngoại tuyến.
- `DenseIndex` - cùng hình thức được dùng trong bài truy xuất lai của Phase 19 Track B.
- `eval_recall(strategy, corpus, queries, k)` - vòng lặp so sánh.
- Một `main()` chạy mọi chiến lược trên corpus fixture và in một bảng recall@k.

Chạy nó:

```bash
python3 code/main.py
```

Đầu ra là một bảng nhỏ với một hàng mỗi chiến lược và một cột mỗi k. Câu thua trên fixture có cấu trúc. Markdown cấu trúc thắng trên fixture markdown. Đệ quy tự giữ vị thế trên fixture hỗn hợp vì đệ quy thích ứng. Phân cụm ngữ nghĩa thắng trên fixture văn xuôi nơi không có các dấu hiệu cấu trúc hữu ích.

## Failure modes the table will not hide

**Các câu mồ côi.** Đóng gói câu tạo các đoạn thiếu câu chủ đề. Embedding sau đó trỏ tới sai cụm.

**Cắt giữa ký hiệu.** Cửa sổ cố định bên trong mã hoặc YAML sẽ chia đôi một định danh. Hai nửa nhúng thành nhiễu.

**Các đoạn chỉ tiêu đề.** Markdown cấu trúc phát ra một đoạn không chứa gì ngoài `## Title`. Lọc chúng ra hoặc gắn đoạn văn đầu của đoạn tiếp theo.

**Độ trôi ngữ nghĩa.** Phân cụm ngữ nghĩa cắt thiếu khi corpus đồng đều cùng chủ đề. Một đoạn 5000 ký tự đóng gói nhiều đáp án cụ thể vào một embedding khuếch tán. Kết hợp ngữ nghĩa với một trần ký tự cứng.

**Các embedding cũ.** Phân cụm ngữ nghĩa dùng một mô hình embedding. Nếu bạn thay mô hình, bạn cũng thay các đoạn. Ghim mô hình chia đoạn riêng khỏi mô hình truy xuất hoặc dựng lại chỉ mục cùng nhau.

## Choosing a default without running the benchmark

Ba thuộc tính quyết định bộ chia đoạn mặc định cho một corpus mới.

| Thuộc tính | Giá trị | Mặc định |
|----------|-------|---------|
| Loại tài liệu | Văn xuôi không cấu trúc | Chia đệ quy, mục tiêu 800 |
| Loại tài liệu | Markdown / RFC / tài liệu API | Markdown cấu trúc |
| Loại tài liệu | Mã | Có nhận thức AST (ngoài phạm vi; xem Phase 19 bài 02) |
| Độ dài đoạn văn | Dài, một chủ đề | Câu, mục tiêu 500 |
| Độ dài đoạn văn | Ngắn, chủ đề hỗn hợp | Ngữ nghĩa, ngưỡng 0.6 |

Khi nghi ngờ, chọn chia đệ quy. Nó là đường cơ sở một chiến lược mạnh nhất.

## Use It

Các mẫu sản xuất:

- Chạy đánh giá trước khi bạn cung cấp một pipeline mới; đừng tin chiến lược thư viện của bạn mặc định.
- Chạy lại đánh giá bất cứ khi nào bạn đổi mô hình embedding hoặc hỗn hợp corpus; người thắng phụ thuộc corpus.
- Lưu bền vững tên chiến lược trong siêu dữ liệu của mỗi đoạn để bạn có thể quy nguồn các lỗi thoái lui sau này.

## Ship It

Hệ thống RAG đầu cuối Track F trong bài 69 dùng bộ chia đoạn được chọn ở đây làm giai đoạn đầu. Harness đánh giá trong bài 68 đọc recall@k từ cùng hình thức mà `eval_recall` trả về trong bài này. Chọn chiến lược thắng trên corpus của bạn và cấp nó về phía trước.

## Exercises

1. Thêm một chiến lược thứ sáu: cửa sổ token dùng `tiktoken` thay vì số ký tự. So sánh với cửa sổ cố định trên cùng fixture.
2. Chèn một tỷ lệ 30 phần trăm các khối mã vào fixture văn xuôi. Chạy lại bảng. Giải thích tại sao mọi chiến lược trừ markdown cấu trúc mất recall.
3. Thay embedding tất định bằng embedding từ nhà cung cấp thực của dự án bạn. Đo chênh lệch recall phân cụm ngữ nghĩa. Báo cáo liệu độ trải giữa các chiến lược mở rộng hay thu hẹp.
4. Thêm một trường `summary` mỗi đoạn: một mô tả tâm một câu. Chạy lại đánh giá với tóm tắt được thêm vào thân đoạn. Đo mức tăng recall.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Recall@k | "Chúng ta có lấy được đoạn đúng không?" | Tỷ lệ truy vấn mà bất kỳ đoạn nào trong top-k chồng lấn khoảng đáp án chuẩn |
| Chunk overlap (Chồng lấn đoạn) | "Cửa sổ trượt" | Đưa lại N ký tự cuối của đoạn trước vào đoạn tiếp theo |
| Structural splitter (Bộ chia cấu trúc) | "Các đoạn có nhận thức tiêu đề" | Cắt tại các ranh giới H1/H2/H3; văn bản tiêu đề là một phần của đoạn |
| Semantic chunker (Bộ chia đoạn ngữ nghĩa) | "Các đoạn có nhận thức chủ đề" | Nhúng các câu, phân cụm theo độ tương tự tâm, cắt khi trôi |
| Centroid drift (Độ trôi tâm) | "Chuyển chủ đề" | Độ tương tự cosine giữa trung bình đang chạy và câu tiếp theo giảm qua một ngưỡng |

## Further Reading

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [Anthropic, Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex, Chunking strategies for production RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- Phase 11 bài 06 - các nền tảng RAG
- Phase 11 bài 07 - RAG nâng cao
- Phase 19 bài 65 - truy xuất lai xếp hạng các đoạn được tạo ở đây
- Phase 19 bài 68 - harness đánh giá chấm lựa chọn chiến lược trong sản xuất
