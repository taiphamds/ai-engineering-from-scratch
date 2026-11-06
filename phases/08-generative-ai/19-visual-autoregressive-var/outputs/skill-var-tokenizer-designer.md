---
name: var-tokenizer-designer
description: Design a multi-scale residual VQ tokenizer for next-scale visual autoregressive image generation.
version: 1.0.0
phase: 8
lesson: 19
tags: [var, next-scale-prediction, vq-vae, residual-vq, image-generation, tokenizer]
---

Với mục tiêu ảnh (độ phân giải, kênh, màu so với thang xám, kích thước tập dữ liệu, ngân sách tính toán LM phía sau, FID mục tiêu), xuất ra:

1. Lịch thang. Liệt kê K mức độ phân giải từ 1x1 lên đến (H/p) x (W/p). Mặc định 10 thang cho 256x256, 14 cho 512x512. Biện minh K theo độ dài chuỗi hiệu dụng của LM (tổng diện tích các thang) và ngân sách song song trong thang mỗi lượt.
2. Codebook. Một codebook dùng chung kích thước V trên tất cả các thang (điển hình 4096 / 8192 / 16384). Chọn V từ kích thước tập dữ liệu và năng lực decoder. Xác nhận mức sử dụng codebook giữ trên 50 phần trăm trên một batch hiệu chuẩn hoặc thu nhỏ V.
3. Chia sẻ phần dư. Xác nhận các thang 1..K cùng nhau tái dựng latent qua tổng các embedding được tăng mẫu (VQ phần dư). Nêu kích thước patch p và backbone VAE (bật / tắt bộ phân biệt kiểu VQGAN, trọng số hàm mất mát cảm nhận).
4. Decoder. Decoder VAE ánh xạ latent được cộng trở lại pixel. Chọn từ decoder VQGAN, decoder bài báo VAR, hoặc một decoder kiểu MAGVIT nhẹ hơn. Biện minh theo FID mục tiêu và VRAM decoder.
5. Embedding vị trí. Xác nhận bộ ba (scale_index, row, col) với một embedding được học mỗi thang và sin-cos 2D trong thang. Từ chối các vị trí 1D phẳng; LM cần nhãn thang để áp dụng phân phối có điều kiện đúng.

Từ chối một tokenizer đa thang không phần dư cho VAR. Không có các phần dư được cộng, phân phối có điều kiện thang tiếp theo trở nên không được định nghĩa tốt và LM tối ưu một mục tiêu khác với điều bài báo chứng minh. Từ chối các codebook riêng theo thang trừ khi V được hiệu chuẩn theo số pixel của thang nhỏ hơn và sụp đổ codebook được giảm nhẹ. Từ chối hoàn toàn dự đoán thang tiếp theo khi K x diện tích-thang-trung-bình vượt độ dài chuỗi tối đa của LM trừ dư địa cho điều kiện hóa bằng văn bản.

Đầu vào ví dụ: "ImageNet có điều kiện theo lớp 256x256, tập dữ liệu 1.2M, ngân sách LM 1.5B tham số, FID mục tiêu dưới 5.0."

Đầu ra ví dụ:
- Lịch thang: K=10, kích thước 1, 2, 3, 4, 5, 6, 8, 10, 13, 16. Tổng token 671.
- Codebook: dùng chung, V=4096. Kỳ vọng mức sử dụng 70-80 phần trăm trên ImageNet ở 256.
- Chia sẻ phần dư: đã xác nhận; p=16, backbone VQGAN với các hàm mất mát cảm nhận + đối kháng, tổng phần dư tái dựng f.
- Decoder: decoder VQGAN, 4 khối tăng mẫu, không có bộ tinh chỉnh bổ sung.
- Embedding vị trí: bộ ba (thang, hàng, cột), token thang được học + sin-cos 2D trong thang.
