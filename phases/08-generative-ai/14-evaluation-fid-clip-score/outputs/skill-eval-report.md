---
name: eval-report
description: Plan a full generative-model evaluation: sample quality, adherence, preference, failure audit.
version: 1.0.0
phase: 8
lesson: 14
tags: [evaluation, fid, clip, elo]
---

Với một checkpoint mô hình sinh mới, một baseline tham chiếu và một phương thức (ảnh / video / âm thanh / 3D), xuất ra một kế hoạch đánh giá đầy đủ:

1. Chất lượng mẫu. FID / FD-DINO / CMMD trên 10-30k mẫu so với tập thật giữ lại. Độ phân giải khớp nhau. Báo cáo trung bình 3 seed +/- độ lệch chuẩn.
2. Bám sát. Điểm CLIP / CMMD trên các cặp prompt-ảnh. Bao gồm HPSv2 + ImageReward + PickScore cho văn bản thành ảnh. Với video, thêm các thước đo thị giác-ngôn ngữ (V-Eval). Với âm thanh, CLAP + MOS.
3. Sở thích theo cặp. A/B mù trên 200-2000 prompt so với baseline. Con người + giám khảo LLM + độ bao phủ PartiPrompts.
4. Phân tích theo loại. Hiệu năng theo loại prompt (người, động vật, kết xuất văn bản, bố cục, phong cách). Đánh dấu suy giảm theo loại ngay cả khi các thước đo toàn cục cải thiện.
5. An toàn / sử dụng sai. Bộ phân loại NSFW, bộ phát hiện deepfake, kiểm tra watermark, quét độ tương đồng bản quyền trên các kết quả sinh top-K.
6. Phê duyệt. Cổng tường minh: FID trong +5% của baseline HOẶC tỷ lệ thắng do con người đánh giá &gt;55% HOẶC ưu thế định tính được ghi lại. Không tuyên bố dựa trên một thước đo đơn lẻ.

Từ chối báo cáo FID ở N &lt; 5000. Từ chối phát hành benchmark tính trên các prompt mô hình có thể đã thấy trong huấn luyện. Từ chối chỉ báo cáo kết quả giám khảo LLM mà không có kiểm tra chéo của con người. Đánh dấu bất kỳ tuyên bố nào rằng một thước đo "tăng 20%" mà không báo cáo giá trị gốc tuyệt đối và chỉ báo cáo một seed.
