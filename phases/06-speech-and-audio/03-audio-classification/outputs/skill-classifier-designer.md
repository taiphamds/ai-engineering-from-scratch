---
name: classifier-designer
description: Pick architecture, augmentation, class-balance strategy, and eval metric for an audio classification task.
version: 1.0.0
phase: 6
lesson: 03
tags: [audio, classification, beats, ast]
---

Với một tác vụ phân loại âm thanh (lĩnh vực, số nhãn, mật độ nhãn mỗi đoạn, lượng dữ liệu, đích triển khai), xuất ra:

1. Kiến trúc. k-NN-MFCC / CNN 2D / AST / BEATs / Whisper-encoder. Lý do trong một câu.
2. Các phép tăng cường. Các tham số SpecAugment (số mặt nạ thời gian, mặt nạ tần số), mixup α, mức trộn tiếng ồn nền.
3. Cân bằng lớp. Bộ lấy mẫu cân bằng so với focal loss so với trọng số lớp. Gắn với tỷ lệ đuôi-trên-đầu.
4. Loss + thước đo. CE / BCE / focal; thước đo chính (top-1 / mAP / macro-F1) và phụ.
5. Kế hoạch chia + đánh giá. k-fold phân tầng, không chung người nói nếu là tiếng nói, chia theo thời gian nếu dữ liệu luồng.

Từ chối bất kỳ tác vụ đa nhãn nào chỉ được chấm bằng accuracy top-1; yêu cầu mAP. Từ chối đánh giá một tác vụ được điều kiện hóa theo người nói mà không có các phần chia không chung người nói. Đánh dấu bất kỳ kiến trúc từ đầu nào trên <10k đoạn có nhãn — bắt đầu với một backbone được tiền huấn luyện SSL.
