---
name: prompt-data-quality-checker
description: Validate and debug data quality in LLM pre-training pipelines
version: 1.0.0
phase: 10
lesson: 3
tags: [data-pipeline, deduplication, quality-filter, pre-training, llm, data-cleaning]
---

# Data Quality Checker for LLM Pre-Training

Khi xây dựng hoặc kiểm tra một pipeline dữ liệu cho huấn luyện trước LLM, dùng khung này để bắt vấn đề trước khi chúng đến mô hình.

## Red Flags in Pipeline Output

**Khử trùng lặp loại dưới 20% dữ liệu web.** Common Crawl thường chứa 30-40% bản trùng. Nếu bước khử trùng lặp loại dưới 20%, tham số MinHash quá bảo thủ hoặc ngưỡng quá cao. Kiểm tra: kích thước shingle k, số hàm băm, số dải LSH, ngưỡng Jaccard.

**Tỷ lệ nén dưới 2.0 ký tự/token.** Điều này nghĩa là tokenizer tách quá mạnh. Hoặc huấn luyện lại với nhiều phép gộp hơn, tăng kích thước từ vựng, hoặc kiểm tra tiền token hóa không phân mảnh văn bản không cần thiết.

**Tỷ lệ nén trên 6.0 ký tự/token.** Tokenizer đã học các phép gộp rất riêng cho miền có thể không khái quát hóa. Điều này phù hợp cho mô hình riêng miền nhưng là dấu hiệu cảnh báo cho mô hình tổng quát.

**Mức sử dụng chuỗi dưới 90%.** Quá nhiều đệm. Hoặc tài liệu rất ngắn (lọc chúng hoặc tăng độ dài tài liệu tối thiểu) hoặc đóng gói chuỗi kém hiệu quả (chuyển từ đệm đơn giản sang đóng gói nhiều tài liệu).

**Mức sử dụng từ vựng dưới 50%.** Hơn nửa từ vựng không được dùng trên corpus này. Hoặc từ vựng quá lớn cho miền của bạn hoặc tokenizer được huấn luyện trên dữ liệu rất khác.

## Quality Filter Calibration

Chạy các kiểm tra này trên một mẫu ngẫu nhiên 1,000 tài liệu ở mỗi giai đoạn pipeline:

1. **Đọc 20 tài liệu ngẫu nhiên sau làm sạch.** Chúng có chứa HTML, JavaScript, văn bản điều hướng hoặc nội dung mẫu còn sót không? Nếu có, loại HTML chưa đầy đủ.

2. **Đọc 20 tài liệu ngẫu nhiên ĐÃ VƯỢT bộ lọc chất lượng.** Có tài liệu nào là spam, danh sách từ khóa hoặc do máy sinh không? Nếu có, siết ngưỡng lọc.

3. **Đọc 20 tài liệu ngẫu nhiên KHÔNG VƯỢT bộ lọc chất lượng.** Có tài liệu nào thực sự là nội dung tốt không? Nếu có, bộ lọc quá mạnh. Nới ngưỡng hoặc thêm ngoại lệ cho các mẫu cụ thể.

4. **Đọc 20 cặp gần trùng lặp ngẫu nhiên từ khử trùng lặp.** Chúng thực sự tương đồng không? Nếu không, hạ ngưỡng Jaccard hoặc tăng số hàm băm.

## Data Mixing Ratios

Không có công thức phổ quát. Bắt đầu với các baseline này và điều chỉnh dựa trên đánh giá:

| Loại | Tỷ lệ Llama 3 | Điểm khởi đầu |
|----------|--------------|----------------|
| Văn bản web | 50% | 50% |
| Mã | 25% | 15-25% |
| Sách/học thuật | 13% | 10-15% |
| Toán | 8% | 5-10% |
| Web đa ngôn ngữ | 4% | 5-10% |

Tăng tỷ lệ mã nếu mô hình cần mạnh về lập trình. Tăng tỷ lệ toán nếu suy luận quan trọng. Giảm tỷ lệ web nếu cần ít nhiễu hơn. Luôn đánh giá trên benchmark sau khi thay đổi tỷ lệ.

## Scaling Estimates

Với một số token mục tiêu cho trước:

- 1T token từ web: dự kiến ~3-5TB văn bản thô, ~1.5-2TB sau làm sạch và khử trùng lặp
- Tốc độ token hóa (Rust): ~100M token/giây mỗi lõi
- Tốc độ token hóa (Python): ~1-10M token/giây mỗi lõi
- Khử trùng lặp MinHash ở 128 hàm băm, 16 dải: ~10K tài liệu/giây mỗi lõi
- Đóng gói chuỗi: bị giới hạn I/O, dùng file ánh xạ bộ nhớ cho corpus trên 10GB

Với 15T token (quy mô Llama 3), dự trù ~30-50TB dữ liệu đầu vào thô, 1-2 tuần tiền xử lý trên máy 64 lõi, và 100TB+ ổ đĩa cho các file trung gian.

## Checklist Before Training

1. Tổng số token khớp ngân sách tính toán (dùng mở rộng Chinchilla hoặc tỷ lệ huấn luyện quá mức Llama 3 làm hướng dẫn)
2. Khử trùng lặp loại 30-40% dữ liệu web
3. Bộ lọc chất lượng loại 10-20% dữ liệu còn lại
4. Tỷ lệ nén là 3-5 ký tự/token cho tiếng Anh
5. Mức sử dụng chuỗi trên 95%
6. Các kiểm tra ngẫu nhiên cho thấy văn bản sạch, mạch lạc ở mỗi giai đoạn pipeline
7. Các tỷ lệ trộn dữ liệu đã được xác thực trên một lần huấn luyện quy mô nhỏ
8. Loại PII đã được xác minh trên một mẫu
9. Mọi định dạng nhị phân (chuỗi đóng gói, mảng ID token) vượt các kiểm thử mã hóa/giải mã khứ hồi
10. Pipeline có thể tái lập: cùng đầu vào tạo đầu ra giống hệt với seed ngẫu nhiên cố định
