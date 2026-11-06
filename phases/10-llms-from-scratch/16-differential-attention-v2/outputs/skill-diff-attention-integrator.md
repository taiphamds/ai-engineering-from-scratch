---
name: diff-attention-integrator
description: Integration plan for adding Differential Attention V2 to a new pre-training run or LoRA fine-tune.
version: 1.0.0
phase: 10
lesson: 16
tags: [differential-attention, diff-transformer, long-context, flash-attention, pre-training, lora]
---

Với kiến trúc mô hình (hidden, head, head KV, lớp, d_head), ngữ cảnh mục tiêu, đặc điểm ảo giác hoặc ngữ cảnh dài (kiểu thất bại trên đánh giá hiện có), và ngân sách huấn luyện (token sẵn có, giờ GPU), tạo kế hoạch tích hợp DIFF V2.

Tạo:

1. Chế độ tích hợp. Huấn luyện trước từ đầu, đổi kiến trúc giữa huấn luyện, hoặc tinh chỉnh LoRA trên phép chiếu Q. Biện minh lựa chọn theo ngân sách huấn luyện và trọng số hiện có.
2. Diff kiến trúc. Danh sách thay đổi từng trường cụ thể: phép chiếu nào tăng, nào giữ nguyên, số tham số thêm, và phép trừ đặt ở đâu trong khối attention. Gồm lịch `lambda_init` theo độ sâu lớp (`0.8 - 0.6 * exp(-0.3 * (depth - 1))` là mặc định bài báo; điều chỉnh từng độ sâu nếu đo từ xa theo lớp cho thấy bất ổn).
3. Chọn kernel. Xác nhận hỗ trợ FlashAttention 2 hoặc 3 với số head gấp đôi của V2. Từ chối đường kernel tùy chỉnh V1 trừ khi người dùng cần rõ để tái lập.
4. Ngân sách bộ nhớ. KV cache giữ ở baseline (head KV không đổi). Tính độ chênh bộ nhớ activation mỗi token (thêm head Q, thêm tính toán). Báo số tuyệt đối ở ngữ cảnh mục tiêu.
5. Kế hoạch ổn định huấn luyện. Mô tả cần theo dõi gì: trôi `lambda` mỗi lớp, entropy attention mỗi head, phương sai gradient trên phép chiếu Q. Nêu thước đo cụ thể nên kích hoạt hoàn tác về attention cơ sở nếu đo từ xa cho thấy phân kỳ.

Từ chối dứt khoát:
- Thêm DIFF attention vào mô hình huấn luyện trước mà không tiếp tục huấn luyện trước. Phân phối đầu ra trôi — không phải sửa thay trực tiếp.
- DIFF V1 cho mọi lần chạy mới sau tháng 4 năm 2026. V2 tốt hơn hẳn ở mọi chiều đo được.
- Tích hợp DIFF mà không bật dữ liệu huấn luyện ngữ cảnh dài. Lợi ích chỉ hiện quá 32k.
- Đổi `lambda_init` sang âm mà không thử nghiệm có kiểm soát. Khởi tạo âm trừ nhiều hơn nền nhiễu và làm sụp huấn luyện.

Quy tắc từ chối:
- Nếu ngữ cảnh mục tiêu dưới 16k, từ chối tích hợp và đề xuất attention tiêu chuẩn. Chi phí tham số thêm không được biện minh bởi lập luận nền nhiễu.
- Nếu người dùng không cung cấp được dữ liệu đánh giá ngữ cảnh dài (RULER, needle-in-haystack, MultiNeedle), từ chối và yêu cầu dữ liệu hiệu chuẩn trước.
- Nếu người dùng dùng bộ công cụ trước FlashAttention-2, từ chối và đề xuất nâng cấp trước khi tích hợp.

Đầu ra: kế hoạch tích hợp một trang liệt kê chế độ, độ chênh tham số, tác động KV cache, xác nhận FlashAttention, lịch `lambda` và bảng theo dõi 3 thước đo. Kết thúc bằng đoạn "tiêu chí thành công" nêu con số đánh giá ngữ cảnh dài cụ thể (chênh điểm phần trăm trên RULER 64k hoặc tương đương) biện minh giữ DIFF V2 trong kiến trúc thay vì quay lại.
