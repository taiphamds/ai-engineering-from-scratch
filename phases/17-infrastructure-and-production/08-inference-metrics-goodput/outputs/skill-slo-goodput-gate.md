---
name: slo-goodput-gate
description: Produce a CI/CD-ready benchmark recipe that gates LLM deploys on goodput, not throughput, with P50/P90/P99 percentiles and a documented tool choice.
version: 1.0.0
phase: 17
lesson: 08
tags: [inference-metrics, goodput, ttft, tpot, itl, slo, benchmarking]
---

Với một khối lượng công việc (mô hình, phần cứng, mức đồng thời mục tiêu, loại tương tác hướng người dùng — trò chuyện truyền luồng / một lần / giọng nói / agent), tạo một cổng SLO dựa trên goodput cho CI/CD.

Tạo ra:

1. Đặc tả SLO. Ba ngưỡng: giới hạn TTFT P99, giới hạn TPOT P99, giới hạn E2E P99. Chọn các giá trị có thể bảo vệ từ loại tương tác (trò chuyện truyền luồng: TTFT 500 ms, TPOT 25 ms, E2E 3 s; giọng nói: TTFT 300 ms chặt hơn; agent: E2E 5 s lỏng hơn).
2. Công thức benchmark. Lựa chọn công cụ (LLMPerf hoặc GenAI-Perf — nêu bạn chọn cái nào và vì sao). Phân phối prompt (trung bình + độ lệch chuẩn của token đầu vào và đầu ra). Quét mức đồng thời (25%, 50%, 100%, 150% mục tiêu).
3. Tính goodput. Công thức: tỷ lệ các yêu cầu đáp ứng cả ba ràng buộc đồng thời. Mục tiêu >= 99% cho sản xuất, >= 95% cho canary.
4. Báo cáo phân vị. Với mọi chỉ số, báo cáo P50, P90, P99 (không bao giờ chỉ trung bình). Chỉ chú thích các trung bình để kiểm tra tính hợp lý.
5. Ghi chú bẫy công cụ. Nêu liệu công cụ bao gồm hay loại TTFT khỏi ITL. Cố định định nghĩa trước khi so sánh giữa các nhóm.
6. Logic cổng kiểm soát. CI đạt nếu goodput >= mục tiêu TẠI mức đồng thời mục tiêu. Gắn cờ nếu goodput suy giảm hơn 5 điểm giữa mức đồng thời 100% và 150% — chỉ ra thiếu khoảng dự phòng kiểm thử tải.

Các trường hợp loại bỏ dứt khoát:
- Đặt cổng chỉ theo thông lượng. Từ chối và yêu cầu goodput.
- Báo cáo trung bình không có P99. Từ chối.
- Bỏ tên công cụ và phiên bản công cụ. Từ chối.
- Chỉ benchmark ở mức đồng thời mục tiêu; luôn thực hiện lượt quét.

Các quy tắc từ chối:
- Nếu người dùng không có SLO được viết xuống, từ chối và trước tiên viết một SLO dựa trên loại tương tác.
- Nếu phân phối prompt là “các prompt giống hệt trong một vòng lặp”, từ chối — đây là bẫy đồng nhất prompt. Yêu cầu tổng hợp thực tế.
- Nếu benchmark < 30 lần chạy hoặc <100 yêu cầu mỗi lần chạy, từ chối vì không đủ về thống kê.

Đầu ra: một đặc tả cổng SLO một trang liệt kê các ngưỡng, công thức benchmark, lựa chọn công cụ, mẫu báo cáo phân vị, và quy tắc đạt/không đạt CI. Kết thúc bằng một đoạn “đo gì tiếp theo” nêu một trong đường cong goodput theo mức đồng thời, độ nhạy phân phối prompt, hoặc đối chiếu đuôi bật/tắt prefill chia khối tùy điểm yếu đã biết.
