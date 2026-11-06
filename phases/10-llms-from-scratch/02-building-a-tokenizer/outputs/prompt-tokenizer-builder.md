---
name: prompt-tokenizer-builder
description: Build and debug production-quality tokenizers for LLM projects
version: 1.0.0
phase: 10
lesson: 2
tags: [tokenizer, bpe, byte-level, special-tokens, chat-template, multilingual]
---

# Production Tokenizer Builder

Khi xây dựng hoặc gỡ lỗi một tokenizer cho một dự án LLM, làm theo khung này.

## Pipeline Checklist

Mọi tokenizer production cần năm giai đoạn này. Nếu thiếu một, bạn sẽ gặp trường hợp biên trong production.

1. **Chuẩn hóa** -- Áp dụng chuẩn hóa Unicode NFKC. Điều này gộp chữ ghép ("fi" -> "fi"), chuẩn hóa ký tự toàn chiều rộng và chuẩn hóa khoảng trắng. Bỏ qua điều này và cùng từ nhận các ID token khác nhau tùy cách nó được gõ.

2. **Tiền token hóa** -- Tách văn bản thành các khối trước BPE. Dùng mẫu regex GPT-2 cho mô hình tập trung tiếng Anh. Dùng cách byte thô của SentencePiece cho mô hình đa ngôn ngữ. Lựa chọn quyết định liệu BPE có thể gộp xuyên ranh giới từ không.

3. **Gộp BPE** -- Áp dụng bảng gộp đã học lên các chuỗi byte trong mỗi khối. Bảng gộp CHÍNH LÀ kiến thức được học của tokenizer. Mọi thứ khác là phần kết nối.

4. **Chèn token đặc biệt** -- Khớp chính xác token đặc biệt trước khi BPE chạy. [BOS], [EOS], [PAD], các dấu chat template nhận ID cố định. Chúng không bao giờ tham gia gộp.

5. **Ánh xạ ID** -- Chuyển chuỗi token thành số nguyên. Mô hình chỉ thấy số nguyên.

## Debugging Tokenizer Issues

**Triệu chứng: mô hình tạo rác trên đầu vào chat**
- Kiểm tra chat template. Mỗi mô hình có định dạng khác. Llama 3 dùng các dấu `<|start_header_id|>`. ChatGPT dùng các dấu `<|im_start|>`. Một template sai đưa đầu vào ra ngoài phân phối huấn luyện.

**Triệu chứng: văn bản phi tiếng Anh dùng quá nhiều token**
- Kiểm tra fertility (token mỗi từ). Trên 2.0 nghĩa là tokenizer lãng phí cửa sổ ngữ cảnh cho ngôn ngữ đó. Giải pháp: huấn luyện lại với nhiều dữ liệu đa ngôn ngữ hơn, tăng kích thước từ vựng, hoặc dùng SentencePiece với Unigram.

**Triệu chứng: số và số học thất bại**
- Kiểm tra cách các chữ số được token hóa. "1234" là một token nghĩa là mô hình không thể làm phép toán cấp chữ số. Tách từng chữ số riêng trong tiền token hóa.

**Triệu chứng: token mã kém hiệu quả**
- Kiểm tra cách xử lý thụt lề. Tokenizer GPT-2 lãng phí token cho khoảng trắng. Codex và StarCoder dùng token thụt lề đặc biệt (4 khoảng trắng = 1 token).

## Vocabulary Size Decision

- 32K token: đơn ngôn ngữ, mô hình nhỏ, tính toán hạn chế. Lớp embedding là 32K * d_model tham số.
- 50K-64K: đa ngôn ngữ hoặc nhiều mã. Cân bằng tốt cho hầu hết dự án.
- 100K+ (GPT-4, Llama 3): chỉ với dữ liệu huấn luyện khổng lồ. Chuỗi ngắn hơn nhưng 100K * d_model tham số embedding.

Với một mô hình 4096 chiều: từ vựng 32K = 131M tham số embedding. Từ vựng 128K = 524M tham số embedding. Đó là 400M tham số chỉ trong lớp embedding.

## Speed Requirements

- Token hóa dữ liệu huấn luyện: dùng các thư viện dựa trên Rust (tiktoken, HuggingFace tokenizers). Python thuần chậm hơn 10-100x.
- Token hóa suy luận: độ trễ ít quan trọng hơn (một chuỗi), nhưng vẫn dùng triển khai được biên dịch.
- Benchmark: token hóa 1GB văn bản và đo thời gian thực. Nếu mất hơn 60 giây, chuyển sang backend Rust.

## Chat Template Validation

Trước khi triển khai bất kỳ mô hình chat nào, xác minh template:

1. Mã hóa một cuộc hội thoại đã biết bằng tokenizer
2. Giải mã nó trở lại văn bản
3. So sánh từng ký tự với định dạng kỳ vọng từ tài liệu mô hình
4. Chú ý: xuống dòng sau token header, khoảng trắng trước nội dung, dấu kết thúc lượt
5. Kiểm thử trường hợp biên: tin nhắn hệ thống rỗng, tin nhắn người dùng rất dài, nhiều lượt trợ lý

Làm sai chat template là nguồn phổ biến nhất gây suy giảm hiệu năng mô hình chat.
