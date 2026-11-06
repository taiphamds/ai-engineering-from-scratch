---
name: workflow-picker
description: Pick the right pattern (prompt chain, router, parallel, orchestrator-workers, evaluator-optimizer, or full agent) for a given task and produce the minimal implementation.
version: 1.0.0
phase: 14
lesson: 12
tags: [anthropic, workflows, agents, patterns, minimal]
---

Với một mô tả tác vụ, chọn mẫu tối thiểu phù hợp và tạo triển khai đúng nhỏ nhất.

Cây quyết định:

1. Bạn có thể liệt kê các bước không? -> **chuỗi prompt** hoặc **định tuyến**.
2. Đầu ra có cần tổng hợp xuyên các lần chạy độc lập không? -> **song song hóa** (chia phần hoặc bỏ phiếu).
3. Bạn có cần một nhóm chuyên gia có thành viên thay đổi theo tác vụ không? -> **bộ điều phối-worker**.
4. Bạn có cần tinh chỉnh lặp cho đến khi một giám khảo cho đạt không? -> **bộ đánh giá-bộ tối ưu** (hình dạng Self-Refine).
5. Không điều nào ở trên, hoặc số bước phụ thuộc các kết quả trung gian? -> **vòng lặp agent** (Bài 01).

Tạo:

- Với các workflow: các hàm thuần kết hợp LLM + các lời gọi công cụ. Không framework.
- Với các agent: vòng lặp ReAct từ Bài 01 cộng bất kỳ sổ đăng ký công cụ nào mà tác vụ yêu cầu.
- Một `README.md` với lý do quyết định, số bước, chi phí token được mong đợi và tiêu chí thành công có thể quan sát.

Các trường hợp từ chối cứng:

- Chọn một framework (LangGraph, AutoGen, CrewAI) khi tác vụ là một chuỗi prompt 3 bước. Thiết kế quá mức che giấu vấn đề thực.
- Mô tả một bộ điều phối-worker 3 worker là "nhiều agent." Các worker không phải agent; chúng là các lời gọi LLM. Sử dụng "bộ điều phối-worker" cho rõ ràng.
- Bộ đánh giá-bộ tối ưu không có điều kiện dừng. Không có `max_iter` và một phương án dự phòng "cho qua khi thất bại," vòng lặp có thể quay vô hạn.

Các quy tắc từ chối:

- Nếu người dùng yêu cầu "nhiều agent" khi tác vụ thực ra là một bộ định tuyến, từ chối và đổi tên. Nhãn nhiều agent mang chi phí vận hành (phối hợp, gỡ lỗi, đánh giá) mà định tuyến không cần.
- Nếu người dùng muốn các workflow cho một tác vụ nghiên cứu mở, từ chối và đề xuất một agent với một ngân sách lượt. Các workflow dành cho các quỹ đạo có thể dự đoán.
- Nếu người dùng muốn một agent cho một tác vụ 2 bước, từ chối và đề xuất nối chuỗi prompt. Các agent thêm độ trễ và các chế độ lỗi; chỉ sử dụng chúng khi bạn cần chúng.

Đầu ra: lựa chọn mẫu + mã tối thiểu + README. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 13 (LangGraph) nếu trạng thái bền vững quan trọng, Bài 16 (OpenAI Agents SDK) cho các bàn giao và chốt bảo vệ hoặc Bài 01 nếu rốt cuộc bạn chọn một agent.
