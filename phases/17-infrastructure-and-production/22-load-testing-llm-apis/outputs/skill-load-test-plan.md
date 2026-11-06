---
name: load-test-plan
description: Design a realistic LLM load test — pick tool (LLMPerf, k6, GenAI-Perf, guidellm), build four patterns (steady, ramp, spike, soak), and gate in CI.
version: 1.0.0
phase: 17
lesson: 22
tags: [load-testing, llmperf, k6, genai-perf, guidellm, llm-locust, ci-gate]
---

Với khối lượng công việc (endpoint, SLA cho TTFT/TPOT/lỗi), quy mô mục tiêu (độ đồng thời, RPS) và định hướng CI (cổng PR hoặc chỉ khi phát hành), tạo một kế hoạch kiểm thử tải.

Tạo:

1. Công cụ. LLMPerf cho các lần chạy cơ sở; k6 + phần mở rộng truyền theo luồng cho cổng CI; GenAI-Perf cho các lần chạy tham chiếu NVIDIA; guidellm cho tổng hợp lớn. LLM-Locust chỉ khi đã dùng Locust.
2. Phân phối prompt. Trung bình + độ lệch chuẩn token đầu vào từ lưu lượng thực (nếu có) hoặc phân phối được công bố (ShareGPT / HumanEval). Cấm vòng lặp một prompt.
3. Bốn mẫu. Ổn định, tăng dần, đột biến, kéo dài. Với mỗi mẫu: RPS mục tiêu, thời lượng, chế độ lỗi dự kiến.
4. Cổng CI. Ngưỡng cụ thể: TTFT P95 < X, 5xx < 5%, TPOT < Y. Thời gian chạy mỗi PR: 3-5 phút.
5. Thống nhất chỉ số. Ghi nhận công cụ báo cáo theo kiểu GenAI-Perf (ITL loại TTFT) hay kiểu LLMPerf (ITL bao gồm TTFT). Chọn một và duy trì nhất quán.
6. Đầu ra. Một file script (JS k6, CLI LLMPerf) được commit vào repo.

Các trường hợp loại bỏ dứt khoát:
- Kiểm thử tải với prompt đồng nhất. Từ chối — số liệu nói dối.
- Kiểm thử tải không hỗ trợ truyền theo luồng. Từ chối — endpoint LLM truyền theo luồng theo mặc định.
- So sánh số liệu giữa các công cụ mà không thừa nhận khác biệt định nghĩa chỉ số. Từ chối.

Quy tắc từ chối:
- Nếu nhóm định chạy Locust nguyên bản không có phần mở rộng LLM-Locust, từ chối — bẫy GIL.
- Nếu ngân sách cổng CI < 60s mỗi PR, từ chối kiểm thử kéo dài đầy đủ — đề xuất trạng thái ổn định nhanh cộng kiểm thử kéo dài hằng đêm riêng.
- Nếu không có dữ liệu phân phối prompt, yêu cầu một phân phối được công bố có tài liệu (ShareGPT) và ghi nhận giả định.

Đầu ra: một kế hoạch một trang với công cụ, phân phối prompt, bốn mẫu có mục tiêu, ngưỡng cổng CI, thống nhất chỉ số. Kết thúc bằng đầu ra CI duy nhất: PR chỉ xanh nếu đáp ứng mọi ngưỡng, ổn định 3 lần chạy.
