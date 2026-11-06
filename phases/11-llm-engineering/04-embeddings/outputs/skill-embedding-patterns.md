---
name: skill-embedding-patterns
description: Production patterns for embeddings, vector search, and similarity
version: 1.0.0
phase: 11
lesson: 4
tags: [embeddings, vectors, similarity, search, chunking, quantization]
---

# Embedding Patterns

Mọi quy trình embedding tuân theo hợp đồng này:

```
text -> embed(text) -> vector (float array)
similarity(vector_a, vector_b) -> score (float)
```

Mô hình embedding và thước đo độ tương đồng là hai quyết định duy nhất quan trọng. Mọi thứ khác là phần kết nối.

## When to use embeddings

- Tìm kiếm ngữ nghĩa trên các tài liệu (tìm ý nghĩa, không phải từ khóa)
- Phân cụm các mục tương tự (phiếu hỗ trợ, đánh giá sản phẩm, báo cáo lỗi)
- Phân loại bằng láng giềng gần nhất (gán nhãn mục mới theo độ tương đồng với ví dụ đã gán nhãn)
- Hệ thống khuyến nghị (tìm các mục tương tự những gì người dùng thích)
- Loại trùng lặp (tìm nội dung gần trùng lặp bằng ngưỡng độ tương đồng)

## When NOT to use embeddings

- Khớp từ khóa chính xác (dùng tìm kiếm toàn văn)
- Truy vấn có cấu trúc (dùng SQL, bộ lọc)
- Bộ dữ liệu nhỏ mà gán nhãn thủ công nhanh hơn (<100 mục)
- Tác vụ mà khả năng giải thích quan trọng hơn độ chính xác (embedding không minh bạch)

## Model selection

Chọn dựa trên các ràng buộc của bạn:

- **Cần API, giá trị tốt nhất**: OpenAI text-embedding-3-small (1536d, $0.02/1M token)
- **Cần độ chính xác tối đa**: Voyage-3 (1024d, $0.06/1M token, MTEB cao nhất)
- **Cần cục bộ/riêng tư**: BGE-M3 (1024d, miễn phí, đa ngôn ngữ, khuyến nghị GPU)
- **Cần tạo mẫu cục bộ nhanh**: all-MiniLM-L6-v2 (384d, miễn phí, chạy trên CPU)
- **Cần đa ngôn ngữ**: Cohere embed-v3 (1024d) hoặc BGE-M3 (cả hai mạnh về đa ngôn ngữ)

Quy tắc: không bao giờ trộn mô hình embedding giữa lập chỉ mục và truy vấn. Vector từ các mô hình khác nhau nằm trong các không gian không tương thích.

## Chunking rules

1. Nhắm đến 256-512 token mỗi chunk với chồng lấp 50 token
2. Không bao giờ chia giữa câu nếu bạn có thể tránh
3. Bao gồm metadata (file nguồn, tiêu đề phần, vị trí) với mọi chunk
4. Với tài liệu có cấu trúc (Markdown, HTML), chia tại ranh giới tiêu đề trước
5. Kiểm thử chất lượng chunk bằng cách tìm các câu trả lời đã biết và kiểm tra truy xuất

## Similarity metric selection

- **Cosine similarity**: lựa chọn mặc định, xử lý văn bản độ dài thay đổi, được chuẩn hóa
- **Tích vô hướng**: dùng khi vector đã được chuẩn hóa đơn vị (các mô hình OpenAI đã như vậy), nhanh hơn chút
- **Khoảng cách Euclid**: dùng cho phân cụm, khi vị trí tuyệt đối quan trọng

Cả ba cho cùng thứ hạng khi vector được chuẩn hóa. Lựa chọn chỉ quan trọng cho vector không được chuẩn hóa.

## Storage optimization

Ba mức nén, có thể xếp chồng:

1. **Cắt ngắn Matryoshka**: giảm số chiều (1536 -> 256 = tiết kiệm 6x, mất độ chính xác 3-5%)
2. **Lượng tử hóa Float16**: giảm một nửa lưu trữ mỗi chiều (tiết kiệm 2x, mất độ chính xác <1%)
3. **Lượng tử hóa nhị phân**: 1 bit mỗi chiều (tiết kiệm 32x, mất độ chính xác 5-10%, dùng với chấm điểm lại)

Mẫu sản xuất: tìm kiếm nhị phân trên toàn ngữ liệu, chấm điểm lại top-1000 bằng vector float32.

## Retrieve-then-rerank

Pipeline hai giai đoạn cho độ chính xác tốt nhất:

1. Bi-encoder truy xuất top-100 ứng viên (nhanh, dùng embedding tính trước)
2. Cross-encoder xếp hạng lại thành top-10 (chậm, xử lý mỗi cặp truy vấn-tài liệu)

Điều này vượt truy xuất một giai đoạn 10-15% trên các thước đo precision. Dùng khi độ chính xác quan trọng hơn độ trễ.

## Common mistakes

- Dùng các mô hình embedding khác nhau cho lập chỉ mục và truy vấn
- Nhúng toàn bộ tài liệu thay vì chunk (embedding trở thành trung bình của mọi thứ)
- Không chuẩn hóa vector trước cosine similarity (hầu hết mô hình chuẩn hóa trước, nhưng hãy xác minh)
- Bỏ qua chồng lấp chunk (câu bị chia tại ranh giới mất ngữ cảnh)
- Chỉ lưu vector mà không có văn bản gốc (bạn cần cả hai để truy xuất)
- Không nhúng lại khi mô hình thay đổi (vector cũ không tương thích)
- Chọn số chiều chỉ theo độ chính xác (lưu trữ và độ trễ tăng tuyến tính theo số chiều)

## Debugging embeddings

Nếu kết quả tìm kiếm kém:

1. Xác minh embedding truy vấn khác không (đầu vào rỗng hoặc khoảng trắng tạo vector không)
2. Kiểm tra thủ công điểm tương đồng của một tài liệu đã biết là liên quan
3. Thử diễn đạt lại truy vấn để khớp từ vựng tài liệu
4. Kiểm tra ranh giới chunk để bảo đảm nội dung liên quan không bị chia qua các chunk
5. So sánh kết quả top-k giữa các thước đo (cosin, tích vô hướng, Euclid) để phát hiện vấn đề chuẩn hóa
6. Kiểm thử với một truy vấn khớp hiển nhiên (sao chép một câu từ tài liệu) để xác nhận pipeline hoạt động

## Production parameters

- Kích thước chunk: 256-512 token
- Chồng lấp chunk: 50 token (10-20% kích thước chunk)
- Truy xuất top-k: 5-10 cho dùng trực tiếp, 50-100 cho xếp hạng lại
- Ngưỡng độ tương đồng: 0.7+ cho cosin (dưới mức này, kết quả thường không liên quan)
- Nhúng theo batch: xử lý 100-500 văn bản mỗi lệnh gọi API để có thông lượng
- Xây dựng lại chỉ mục: nhúng lại khi mô hình thay đổi hoặc tài liệu cập nhật đáng kể
