---
name: llm-pipeline-reviewer
description: Review an end-to-end LLM training pipeline manifest before a multi-million-dollar run.
version: 1.0.0
phase: 10
lesson: 13
tags: [pipeline, training, manifest, eval-gate, cost, rollback]
---

Với manifest pipeline huấn luyện đề xuất (YAML hoặc JSON mô tả giai đoạn tokenizer, dữ liệu, huấn luyện trước, SFT, căn chỉnh, đánh giá, lượng tử hóa và phục vụ), tạo bản rà soát bao phủ:

1. Đồ thị giai đoạn. Xác nhận mỗi giai đoạn có đầu vào và đầu ra có kiểu. Chỉ ra phụ thuộc thiếu, trạng thái ngầm hoặc giai đoạn tiêu thụ thư mục trần thay hash artifact có tên.
2. Chuỗi hash. Xác minh output_hash giai đoạn N bằng một trong input_hashes của mọi giai đoạn phía sau. Bất kỳ không khớp nào nghĩa là manifest không nhất quán và pipeline không được bắt đầu.
3. Cổng đánh giá. Mỗi thước đo trong danh sách cổng phải là số, có toán tử, ngưỡng và nguồn đo. Từ chối cổng chủ quan ("trông tốt"), không bị chặn (không ngưỡng), hoặc đo trên dữ liệu huấn luyện.
4. Bảo vệ hồi quy. Benchmark cốt lõi mô hình mới (MMLU, MATH, HumanEval+, GPQA hoặc tương đương riêng miền) phải kèm số baseline. Lần chạy không baseline là lần chạy không phát hiện hồi quy.
5. Ngân sách KL. Giai đoạn căn chỉnh (RLHF, DPO, CAI, GRPO) phải khai báo trần KL tích lũy với tham chiếu. KL không bị chặn là trôi không bị chặn.
6. Kiểm tra nhiễm. Mảnh dữ liệu huấn luyện và tập đánh giá phải có kiểm tra chồng lấp được ghi lại (khớp chính xác hoặc 13-gram). Ngưỡng đạt bắt buộc: <0.1%.
7. Ước tính chi phí. Ước tính trước chạy cho mỗi giai đoạn cộng tổng, so cổng ngân sách. Nếu ước tính > ngân sách, pipeline từ chối bắt đầu.
8. Kế hoạch hoàn tác. Với mỗi giai đoạn, hành động có tên khi lỗi: chạy lại, quay về artifact trước, sửa đầu vào rồi chạy lại phía sau. Giai đoạn đắt (huấn luyện trước) phải có chiến lược checkpoint ấm.
9. Kho artifact. Checkpoint, tập dữ liệu, tokenizer, báo cáo đánh giá phải định địa chỉ theo nội dung (SHA-256). Artifact theo tên file ("latest.pt") bị từ chối dứt khoát.
10. Khả năng quan sát. Mỗi giai đoạn phải phát log có cấu trúc với trace ID, tên giai đoạn, hash đầu vào, hash đầu ra, thời gian thực và chi phí. Thiếu trace ID nghĩa là lần chạy không thể gỡ lỗi về sau.

Dấu hiệu cảnh báo dừng rà soát:
- cổng thiếu nguồn đo (đặt cổng trên thước đo không giai đoạn nào tính)
- giai đoạn chia sẻ checkpoint với giai đoạn phía sau (không tách mối quan tâm)
- giai đoạn căn chỉnh không mô hình tham chiếu (không điểm neo cho KL)
- đánh giá LLM-as-judge mà giám khảo cùng họ mô hình với chính sách (nhiễm)
- ước tính chi phí vượt ngân sách hơn 20%
- kế hoạch hoàn tác chỉ gồm "chạy lại từ đầu"

Đầu ra: bản rà soát hai trang với PASS/HOLD mỗi cổng, trường manifest chính xác hoặc trường thiếu tạo mỗi phán quyết, và thay đổi tối thiểu để chuyển HOLD thành PASS.
