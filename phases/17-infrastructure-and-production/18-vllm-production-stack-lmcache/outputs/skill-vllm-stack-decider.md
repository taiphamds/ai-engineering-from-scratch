---
name: vllm-stack-decider
description: Decide vLLM deployment layout — production-stack Helm chart, KV offload (native CPU or LMCache), router/observability integration — given workload and fleet size.
version: 1.0.0
phase: 17
lesson: 18
tags: [vllm, production-stack, lmcache, kv-offload, connector-api]
---

Với khối lượng công việc (dạng prompt, độ đồng thời, mẫu tái sử dụng tiền tố), tập máy (engine, loại GPU) và bối cảnh vận hành (nguyên bản Kubernetes, đa tenant, ngân sách), tạo một kế hoạch ngăn xếp vLLM.

Tạo:

1. Ngăn xếp. Dùng Helm chart production-stack vLLM (khuyến nghị cho triển khai mới) hoặc tự xây. Nêu operator/CRD nào áp dụng.
2. Chuyển tải KV. Chọn:
   - Không có (prompt ngắn, độ đồng thời thấp — chi phí phụ vượt lợi ích).
   - Chuyển tải CPU vLLM nguyên bản (áp lực HBM một engine, đơn giản).
   - Connector LMCache (tái sử dụng tiền tố nhiều engine, tạm chiếm nhiều, hoặc prompt dùng chung đa tenant).
3. Giám sát mức sử dụng HBM. Đặt `--gpu-memory-utilization` có dư địa; cảnh báo ở 92%+ kéo dài làm tín hiệu trước tạm chiếm.
4. Tích hợp bộ định tuyến. Bộ định tuyến nhận biết bộ nhớ đệm (Giai đoạn 17 · 11). Xác nhận kênh sự kiện KV đã cấu hình.
5. Khả năng quan sát. Thu thập Prometheus theo engine, thuộc tính OTel GenAI (Giai đoạn 17 · 13), mẫu bảng điều khiển Grafana từ production-stack.
6. Tác động dự kiến. Định lượng mức tăng thông lượng dự kiến so với hiện tại — tham chiếu dạng phép đo chuẩn 16x H100 (LMCache giúp khi dung lượng KV vượt HBM).

Các trường hợp loại bỏ dứt khoát:
- Triển khai LMCache không có tiền tố chung hoặc tạm chiếm. Từ chối — chi phí phụ, không lợi ích.
- Chạy vLLM không giám sát áp lực HBM. Từ chối — lần tạm chiếm đầu tiên sẽ là bất ngờ.
- Tự xây production-stack khi Helm chart bao phủ trường hợp sử dụng. Từ chối — chi phí phát minh lại.

Quy tắc từ chối:
- Nếu tập máy có <2 engine, từ chối LMCache — tái sử dụng xuyên engine là điểm mấu chốt; một engine dùng nguyên bản.
- Nếu khối lượng công việc có prompt < 1K token và độ đồng thời < 100, từ chối mọi loại chuyển tải — dư địa HBM là đủ.
- Nếu nhóm không có năng lực K8s, từ chối production-stack — bắt đầu với một engine vLLM + proxy đơn giản.

Đầu ra: một kế hoạch một trang nêu ngăn xếp, lựa chọn chuyển tải KV, giám sát HBM, tích hợp bộ định tuyến, khả năng quan sát, tác động dự kiến. Kết thúc bằng cổng duy nhất: mức sử dụng HBM P99 trong 24 giờ qua.
