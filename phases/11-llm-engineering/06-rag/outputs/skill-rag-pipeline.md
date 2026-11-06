---
name: skill-rag-pipeline
description: Build and debug RAG pipelines from first principles
version: 1.0.0
phase: 11
lesson: 6
tags: [rag, retrieval, embeddings, vector-search, llm-engineering]
---

# RAG Pipeline Pattern

Mọi hệ thống RAG tuân mẫu này:

```
documents -> chunk -> embed -> store
query -> embed -> search(top_k) -> build_prompt -> generate
```

Lập chỉ mục xảy ra một lần mỗi tài liệu. Truy vấn xảy ra trên mỗi yêu cầu người dùng.

## When to use RAG

- LLM cần truy cập tài liệu riêng tư hoặc gần đây
- Fine-tuning quá đắt hoặc cập nhật quá chậm
- Bạn cần trích dẫn nguồn cho câu trả lời
- Cơ sở kiến thức thay đổi thường xuyên

## When NOT to use RAG

- Câu trả lời là kiến thức chung LLM đã có
- Tác vụ sáng tạo (viết, động não) không phải sự kiện
- Bạn cần mô hình tiếp nhận phong cách suy luận cụ thể (dùng fine-tuning)

## Implementation checklist

1. Chia tài liệu thành đoạn 256-512 token với chồng lấp 50 token
2. Nhúng mỗi chunk bằng một mô hình embedding nhất quán
3. Lưu embedding trong cơ sở dữ liệu vector cùng văn bản gốc
4. Khi truy vấn, nhúng câu hỏi người dùng bằng cùng mô hình
5. Truy xuất top-k (5-10) chunk tương tự nhất qua cosine similarity
6. Xây prompt: chỉ dẫn hệ thống + ngữ cảnh truy xuất + câu hỏi người dùng
7. Sinh câu trả lời, đặt nó trên ngữ cảnh truy xuất
8. Trả về câu trả lời với tham chiếu nguồn

## Common mistakes

- Dùng các mô hình embedding khác nhau cho lập chỉ mục và truy vấn (vector không tương thích)
- Chunk quá nhỏ (mất ngữ cảnh) hoặc quá lớn (làm loãng liên quan)
- Không bao gồm chồng lấp giữa các chunk (chia câu tại ranh giới)
- Quên lập chỉ mục lại khi tài liệu thay đổi
- Trả chunk truy xuất cho người dùng mà không sinh câu trả lời mạch lạc
- Không đặt temperature=0 cho truy vấn RAG sự kiện (temperature cao hơn = nhiều ảo giác hơn)

## Debugging retrieval

Nếu các chunk đúng không được truy xuất:
1. In embedding truy vấn và xác minh nó khác không
2. Kiểm tra cosine similarity thủ công cho chunk đã biết liên quan
3. Thử diễn đạt lại truy vấn để khớp từ vựng tài liệu
4. Xác minh mô hình embedding khớp giữa thời điểm lập chỉ mục và truy vấn
5. Kiểm tra liệu nội dung liên quan có bị mất khi chia chunk không

## Production parameters

- Kích thước chunk: 256-512 token
- Chồng lấp: 50 token (10-20% kích thước chunk)
- Top-k: 5-10 cho hầu hết trường hợp sử dụng
- Temperature: 0 cho câu trả lời sự kiện
- Mô hình embedding: text-embedding-3-small (hiệu quả chi phí) hoặc text-embedding-3-large (độ chính xác cao hơn)
