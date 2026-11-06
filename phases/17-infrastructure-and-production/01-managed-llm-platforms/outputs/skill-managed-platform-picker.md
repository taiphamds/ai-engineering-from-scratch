---
name: managed-platform-picker
description: Pick a managed LLM platform (Bedrock, Azure OpenAI, Vertex AI) and a second for redundancy, given workload, SLA, and compliance requirements — then produce a FinOps instrumentation plan.
version: 1.0.0
phase: 17
lesson: 01
tags: [bedrock, azure-openai, vertex-ai, ptu, finops, managed-platforms]
---

Với một hồ sơ khối lượng công việc (các mô hình bắt buộc, token hằng tháng, SLA TTFT ở P50/P99, các ràng buộc tuân thủ, hiện diện đám mây hiện có), tạo một khuyến nghị nền tảng.

Tạo ra:

1. Nền tảng chính. Nêu nền tảng, các mô hình cụ thể nó bao phủ, và liệu theo nhu cầu hay các Đơn vị thông lượng được cấp sẵn (PTU) / Provisioned Throughput phù hợp theo mức sử dụng. Trích phép tính hòa vốn (PTU ở mức sử dụng duy trì khoảng 40-60%).
2. Nền tảng thứ cấp. Nêu dự phòng tối thiểu hai nhà cung cấp. Giải thích cặp — dự phòng phải bao phủ chồng lấp mô hình (Claude trên Bedrock + GPT trên Azure OpenAI là cặp phổ biến) và chồng lấp vùng.
3. Gắn đo lường FinOps. Chỉ rõ cần bật gì ngày đầu: Bedrock Application Inference Profiles, các phạm vi Azure + các đặt trước PTU như các đối tượng chi phí, Vertex dự án theo từng nhóm + BigQuery Billing Export. Nêu các chiều quy chi phí — theo từng người dùng, theo từng tác vụ, theo từng tenant.
4. Kiểm tra SLA. So sánh TTFT P99 mục tiêu với các benchmark được công bố (Azure OpenAI PTU ≈ 50 ms P50; Bedrock theo nhu cầu ≈ 75 ms P50). Nếu SLA chặt hơn mức theo nhu cầu có thể cung cấp, yêu cầu PTU.
5. Kiểm tra tuân thủ. Xác minh BAA, SOC 2 Type II, HIPAA, lưu trú dữ liệu EU khi cần. Ghi nhận rằng cả ba đáp ứng đường cơ sở nhưng các chính sách lưu giữ và chọn không tham gia giám sát lạm dụng khác nhau.
6. Lộ trình di chuyển. Nêu một bước có thể đảo ngược nhóm có thể thực hiện tuần này (ví dụ: triển khai qua gateway AI trừu tượng hóa nhà cung cấp; gắn đo lường các header quy chi phí) và một bước dài hạn hơn (cam kết PTU; chuyển đổi dự phòng xuyên vùng).

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị một nền tảng đơn lẻ không có dự phòng được nêu tên. Từ chối và kiên quyết yêu cầu tối thiểu hai nhà cung cấp.
- Chọn PTU không có một ước tính mức sử dụng. Từ chối và yêu cầu dữ liệu mức sử dụng duy trì.
- Bỏ qua Bedrock Application Inference Profiles khi quy chi phí được liệt kê là một yêu cầu — chúng là bề mặt gốc sạch nhất.

Các quy tắc từ chối:
- Nếu khối lượng công việc yêu cầu Claude, Gemini, và GPT đều là P0, nêu thực tế ba nền tảng (Bedrock + Vertex + Azure OpenAI sau một gateway) thay vì giả vờ một nền tảng có thể phục vụ cả ba.
- Nếu SLA là TTFT P99 < 100 ms và ngân sách dự kiến không thể hỗ trợ PTU, từ chối hứa SLA — giải thích mức trần phương sai theo nhu cầu.
- Nếu khách hàng yêu cầu “dùng nhà cung cấp rẻ nhất”, từ chối — giá là đa chiều (giá token + dung lượng chuyên dụng + chi phí phụ quy chi phí + chi phí khóa chặt).

Đầu ra: một quyết định một trang với nền tảng chính, nền tảng thứ cấp, PTU so với theo nhu cầu, danh sách gắn đo lường, xác minh SLA/tuân thủ, và hai bước di chuyển. Kết thúc bằng chỉ số đơn lẻ sẽ bắt sự trôi khỏi kế hoạch (mức sử dụng duy trì, lãng phí PTU, hoặc độ bao phủ quy chi phí).
