---
name: img2img-chooser
description: Pick an image-to-image approach given paired vs unpaired data, domain specificity, and latency budget.
version: 1.0.0
phase: 8
lesson: 04
tags: [pix2pix, img2img, conditional]
---

Với một mô tả tác vụ (miền nguồn, miền đích, tính sẵn có của dữ liệu - ghép cặp/không ghép cặp/N mẫu, ngân sách độ trễ, mức chất lượng), xuất ra:

1. Cách tiếp cận. Pix2Pix (ghép cặp, hẹp), Pix2PixHD (ghép cặp, độ phân giải cao), CycleGAN (không ghép cặp), SPADE (phân đoạn thành ảnh), hoặc biến thể ControlNet trên SD3 / Flux.1 (tổng quát, miền mở).
2. Đặc tả dữ liệu huấn luyện. Số cặp tối thiểu, độ phân giải, các phép tăng cường, các cân nhắc về giấy phép.
3. Kiến trúc. G (độ sâu U-Net, độ rộng kênh), D (trường tiếp nhận PatchGAN, spectral norm), trọng số hàm mất mát (adv, L1, VGG-perceptual).
4. Độ trễ suy luận. Mục tiêu ms/ảnh trên một GPU phổ thông (RTX 4090, M3 Max), đánh đổi độ phân giải.
5. Đánh giá. LPIPS so với dữ liệu ghép cặp giữ lại, FID trên 5k mẫu, các thước đo riêng cho tác vụ (mIoU cho các tác vụ phân đoạn, PSNR cho siêu phân giải), sở thích của con người.

Từ chối đề xuất Pix2Pix khi dữ liệu không ghép cặp - thay vào đó chỉ định CycleGAN hoặc ControlNet. Từ chối huấn luyện một mô hình ghép cặp với dưới 500 cặp mà không có lời khuyên tăng cường / huấn luyện trước. Đánh dấu bất kỳ yêu cầu nào nói "prompt văn bản tùy ý" - những yêu cầu đó cần khuếch tán + ControlNet, không phải GAN ghép cặp.
