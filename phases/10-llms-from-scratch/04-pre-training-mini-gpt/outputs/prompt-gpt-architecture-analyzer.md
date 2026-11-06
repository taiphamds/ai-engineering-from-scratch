---
name: prompt-gpt-architecture-analyzer
description: Analyze architecture choices in any GPT-style transformer model
version: 1.0.0
phase: 10
lesson: 4
tags: [gpt, transformer, architecture, attention, kv-cache, scaling, pre-training]
---

# GPT Architecture Analyzer

Khi đánh giá một mô hình kiểu GPT từ báo cáo kỹ thuật, model card hoặc log huấn luyện, dùng khung này để phân tích kiến trúc và xác định các đánh đổi thiết kế.

## Analysis Protocol

### 1. Parameter Allocation Breakdown

Tính chính xác số tham số cho mỗi thành phần:

- **Embedding token**: vocab_size x embed_dim
- **Embedding vị trí**: max_seq_len x embed_dim
- **Attention mỗi khối**: 4 x embed_dim x embed_dim (các phép chiếu Q, K, V, đầu ra)
- **FFN mỗi khối**: 2 x embed_dim x ff_dim + embed_dim + ff_dim (hai lớp tuyến tính + bias)
- **LayerNorm mỗi khối**: 4 x embed_dim (hai chuẩn hóa, mỗi cái có scale + bias)
- **LayerNorm cuối**: 2 x embed_dim
- **Head đầu ra**: vocab_size x embed_dim (hoặc 0 nếu buộc trọng số với embedding token)

Đánh dấu nếu một thành phần bất kỳ vượt 40% tổng tham số. Ma trận embedding chi phối mô hình nhỏ. Attention và FFN chi phối mô hình lớn.

### 2. Attention Design Analysis

Đánh giá cấu hình attention:

- **Số chiều head**: embed_dim / num_heads. Tiêu chuẩn là 64 (GPT-2) hoặc 128 (Llama 3). Dưới 32 hạn chế sức biểu đạt mỗi head. Trên 128 lãng phí tính toán với ít lợi ích.
- **Head mỗi lớp**: Nhiều head hơn = các mẫu attention đa dạng hơn nhưng nhiều bộ nhớ KV cache hơn.
- **Grouped Query Attention (GQA)**: Mô hình có chia sẻ head K/V trên nhiều head Q không? Llama 3 dùng GQA với 8 head KV cho 32 head Q. Điều này giảm KV cache 4x.
- **Độ dài ngữ cảnh**: Embedding vị trí tối đa. RoPE cho phép ngoại suy vượt độ dài huấn luyện. Embedding vị trí tuyệt đối thì không.

### 3. Memory Budget

Cho suy luận ở độ dài ngữ cảnh tối đa của mô hình:

- **Trọng số (FP16)**: total_params x 2 byte
- **KV Cache (FP16)**: 2 x num_layers x num_kv_heads x head_dim x max_seq_len x 2 byte
- **Activation**: batch_size x seq_len x embed_dim x 2 byte x num_layers (xấp xỉ)

Đánh dấu nếu KV cache vượt bộ nhớ trọng số. Điều này xảy ra với mô hình ngữ cảnh dài (128K+) và cho thấy mô hình bị giới hạn bộ nhớ khi decode.

### 4. Compute Profile

- **FLOPS prefill mỗi token**: khoảng 2 x total_params (một phép nhân ma trận mỗi tham số, truyền xuôi)
- **FLOPS decode mỗi token**: như prefill nhưng trên một token
- **Nút thắt prefill**: bị giới hạn tính toán (TFLOPS GPU)
- **Nút thắt decode**: bị giới hạn bộ nhớ (băng thông bộ nhớ GPU)
- **Cường độ số học**: FLOPS mỗi byte bộ nhớ được truy cập. Dưới 100 = bị giới hạn bộ nhớ.

### 5. Scaling Decisions

Đánh giá theo các quy luật mở rộng đã biết:

- **Tối ưu Chinchilla**: Với ngân sách tính toán C cho trước, kích thước mô hình tối ưu N và số token D thỏa N ~ D (mở rộng gần ngang nhau). Một mô hình 7B cần ~140B token.
- **Llama 3 huấn luyện quá mức**: Meta huấn luyện Llama 3 8B trên 15T token (100x tối ưu Chinchilla). Huấn luyện quá mức mô hình nhỏ trên nhiều dữ liệu hơn tạo chi phí suy luận mỗi token tốt hơn.
- **Độ rộng so với độ sâu**: Các mô hình sâu hơn (nhiều lớp hơn) thường hiệu quả mẫu hơn các mô hình rộng hơn (embed_dim lớn hơn) với cùng số tham số.

## Red Flags

- **Tỷ lệ FFN không phải 4x**: Tiêu chuẩn là ff_dim = 4 x embed_dim. Llama dùng 8/3 x embed_dim với SwiGLU. Sai lệch nên được biện minh.
- **Không buộc trọng số**: Head đầu ra nên chia sẻ trọng số với embedding token trừ khi vocab_size rất lớn so với embed_dim.
- **Không GQA trên 13B**: Mô hình trên 13B không có grouped-query attention sẽ có KV cache quá lớn.
- **Không RoPE cho ngữ cảnh dài**: Embedding vị trí tuyệt đối không ngoại suy vượt độ dài huấn luyện. Mô hình nhắm ngữ cảnh 32K+ nên dùng embedding xoay.
- **Tốc độ học quá cao cho kích thước mô hình**: Mô hình lớn hơn cần tốc độ học đỉnh thấp hơn. GPT-2 Small dùng 6e-4. Llama 3 405B dùng 8e-5.

## Output Format

1. **Bảng tham số**: số tham số từng thành phần với phần trăm
2. **Ngân sách bộ nhớ**: trọng số, KV cache và bộ nhớ activation ở độ dài ngữ cảnh tối đa
3. **Đặc điểm tính toán**: ước lượng thông lượng prefill và decode cho A100/H100
4. **Đánh giá thiết kế**: mô hình làm đúng gì và điều gì không tiêu chuẩn
5. **Kết luận mở rộng quy mô**: liệu mô hình có kích thước phù hợp cho dữ liệu huấn luyện không
