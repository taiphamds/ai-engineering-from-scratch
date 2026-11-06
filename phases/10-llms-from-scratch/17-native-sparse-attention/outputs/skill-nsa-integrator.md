---
name: nsa-integrator
description: Integration plan for Native Sparse Attention in a long-context pre-training run.
version: 1.0.0
phase: 10
lesson: 17
tags: [nsa, sparse-attention, long-context, pre-training, kernel-aligned, deepseek]
---

Với đặc tả lần huấn luyện trước ngữ cảnh dài (ngữ cảnh mục tiêu, kiến trúc cơ sở, token huấn luyện sẵn có, cấu trúc GPU, đích triển khai), tạo kế hoạch tích hợp NSA.

Tạo:

1. Kích thước khối nén `l`. Chọn 32, 64 hoặc 128. Biện minh theo ngữ cảnh mục tiêu: `l = 32` cho 16k-32k, `l = 64` cho 64k-128k, `l = 128` cho 256k trở lên. `l` lớn hơn nghĩa là ít key nén hơn nhưng tín hiệu định tuyến thô hơn.
2. Số chọn top-k. Chọn giữa 8 và 32. Mặc định bài báo là 16. Biện minh theo hỗn hợp tác vụ mục tiêu: tác vụ nhiều suy luận (toán, mã) có lợi từ `k` cao vì chính xác lựa chọn quan trọng hơn. Tác vụ nhiều truy xuất hoạt động với `k` thấp hơn.
3. Cửa sổ trượt `W`. Chọn 256, 512 hoặc 1024. Mặc định 512. Ngắn hơn cho nội dung cấu trúc mạnh (mã) nơi ngữ cảnh cục bộ đủ; dài hơn cho văn xuôi.
4. MLP cổng. Chỉ rõ độ rộng và khởi tạo. Mặc định: lớp tuyến tính từ `hidden` đến 3, với kích hoạt `sigmoid` hoặc `softplus`. Cảnh báo nếu trọng số cổng sụp ưu ái một nhánh — cho thấy `l`, `k` hoặc `W` điều chỉnh sai.
5. Chọn kernel. Xác nhận kernel Triton hoặc CUDA sẵn có cho bộ tăng tốc mục tiêu. Từ chối quay về attention dense lúc suy luận (toàn điểm chính NSA là tiết kiệm tính toán decode). Nếu chỉ có kernel xuôi không ngược, từ chối huấn luyện trước và đề xuất tiếp tục huấn luyện trên checkpoint dense hiện có.

Từ chối dứt khoát:
- NSA trên mô hình huấn luyện trước attention dense mà không tiếp tục huấn luyện trước. Không thể gắn thêm lúc suy luận.
- Ngữ cảnh mục tiêu dưới 16k. Chi phí ba nhánh chi phối.
- Triển khai chỉ suy luận trên bộ công cụ không hỗ trợ kernel NSA. Đề xuất MLA hoặc attention cửa sổ trượt thay thế.

Quy tắc từ chối:
- Nếu không có dữ liệu đánh giá ngữ cảnh dài (RULER, LongBench, needle-in-haystack), từ chối và yêu cầu dữ liệu hiệu chuẩn trước.
- Nếu phân phối ngữ cảnh dữ liệu huấn luyện bị chuỗi ngắn chi phối, từ chối và đề xuất đặt lại trọng số dữ liệu trước tích hợp NSA.
- Nếu bộ tăng tốc cũ hơn A100, từ chối — ưu điểm kernel NSA giả định phân cấp bộ nhớ H100/H200/MI300.

Đầu ra: kế hoạch tích hợp một trang liệt kê `l`, `k`, `W`, cấu hình cổng, đường kernel và tiết kiệm tính toán kỳ vọng ở ngữ cảnh mục tiêu. Kết thúc bằng đoạn "tiêu chí thành công": con số RULER hoặc LongBench cụ thể (điểm phần trăm so baseline attention dense khớp) biện minh giữ NSA. Gồm điều kiện hoàn tác — ngưỡng thước đo mà dưới đó kiến trúc nên quay về MLA hoặc GQA dense.
