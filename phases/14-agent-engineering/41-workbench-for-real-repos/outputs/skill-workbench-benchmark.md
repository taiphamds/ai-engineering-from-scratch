---
name: workbench-benchmark
description: Run the same task through prompt-only and workbench-guided pipelines on a project's own sample app and emit a five-outcome before/after report.
version: 1.0.0
phase: 14
lesson: 41
tags: [benchmark, before-after, evaluation, workbench, sample-app]
---

Với một repo, một sản phẩm agent và một ứng dụng mẫu nhỏ, tạo một bộ đánh giá có tính di động so sánh các pipeline chỉ có prompt với được workbench hướng dẫn.

Tạo:

1. `eval/sample_app/` — một ứng dụng mẫu khả dụng tối thiểu lấy từ miền của dự án.
2. `eval/run_prompt_only.py` và `eval/run_workbench.py` mà mỗi cái nhận một mô tả tác vụ và trả về một `TaskOutcome`.
3. `eval/report.py` chạy cả hai pipeline và ghi `before-after-report.md` cộng `comparison.json`.
4. Workflow CI thất bại khi các kết quả workbench hồi quy trên một bộ tác vụ cố định.
5. `docs/benchmark.md` giải thích năm kết quả và điều gì được tính là một hồi quy.

Các trường hợp từ chối cứng:

- Một benchmark chỉ có một pipeline. So sánh là toàn bộ mục đích.
- Các kết quả được diễn đạt như các tỷ lệ phần trăm không có mẫu số. Luôn báo cáo `n / m`.
- Một ứng dụng mẫu mà sản phẩm agent đã được huấn luyện trên đó. Sử dụng một mẫu được điều chỉnh theo miền.
- Các báo cáo che giấu các âm tính giả. Các tác vụ mà chỉ có prompt nhanh hơn phải được liệt kê.

Các quy tắc từ chối:

- Nếu dự án không có lệnh nghiệm thu, từ chối cung cấp benchmark. Không có gì để đo.
- Nếu pipeline workbench mất hơn 3 lần pipeline chỉ có prompt trên tác vụ trung vị, hiển thị phát hiện đó; workbench cần đơn giản hóa, không phải mô hình.
- Nếu bộ kiểm thử không thể chạy ngoại tuyến, từ chối nối nó vào CI. Sự chập chờn mạng sẽ làm hỏng so sánh.

Cấu trúc đầu ra:

```
<repo>/
├── eval/
│   ├── sample_app/
│   ├── run_prompt_only.py
│   ├── run_workbench.py
│   └── report.py
├── outputs/eval/
│   ├── before-after-report.md
│   └── comparison.json
├── docs/benchmark.md
└── .github/workflows/benchmark.yml
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 42 cho bộ capstone đóng gói mọi bề mặt được pipeline workbench sử dụng.
- Bài 19 (SWE-bench, GAIA, AgentBench) cho các benchmark vĩ mô mà điều này bổ sung.
- Bài 30 (Phát triển agent dựa trên đánh giá) cho các vòng lặp đánh giá liên tục khi benchmark được nối.
