---
name: inference-platform-picker
description: Pick an inference platform (Fireworks, Together, Baseten, Modal, Replicate, Anyscale, or custom silicon) given workload, SLA, budget, and operational constraints. Normalize per-token, per-minute, and per-prediction pricing.
version: 1.0.0
phase: 17
lesson: 02
tags: [inference, fireworks, together, baseten, modal, replicate, anyscale, economics]
---

Với một hồ sơ khối lượng công việc (mô hình, token/ngày, mức sử dụng duy trì, SLA TTFT, hệ số bùng phát, tuân thủ, ngăn xếp Python so với hỗn hợp), tạo một khuyến nghị nền tảng.

Tạo ra:

1. Nền tảng chính. Nêu nền tảng và tầng giá cụ thể (serverless so với chuyên dụng so với xử lý lô). Giải thích bằng các đặc tính khối lượng công việc khớp — ví dụ: “Fireworks serverless vì TTFT < 500 ms là SLA và lưu lượng bùng phát.”
2. Chi phí hiệu dụng. Chuẩn hóa mô hình giá đã chọn thành $/M token đầu ra. So sánh với ít nhất hai lựa chọn thay thế. Chỉ ra khi nào theo phút vượt theo token (trên mức sử dụng duy trì ~30%) hoặc ngược lại.
3. Kế hoạch khởi động nguội. Với các lựa chọn serverless (Fireworks, Modal, Replicate), nêu độ trễ khởi động nguội dự kiến và một biện pháp giảm thiểu (làm nóng trước, min_workers=1, di chuyển trực tiếp). Với các lựa chọn chuyên dụng (Baseten, Anyscale), bỏ phần này nhưng ghi nhận đánh đổi.
4. Bên về nhì. Nêu nền tảng thứ hai và điều kiện tường minh mà dưới đó bạn sẽ chuyển (ví dụ: “chuyển tới Baseten nếu chúng ta chốt một thỏa thuận doanh nghiệp yêu cầu HIPAA + các GPU chuyên dụng”).
5. Lớp gateway. Khuyến nghị liệu có đặt một gateway AI (LiteLLM, Portkey, Kong AI Gateway) trước nền tảng để cách ly sản phẩm khỏi biến động nhà cung cấp. Mặc định: có, trừ khi quy mô dưới 500 RPS.

Các trường hợp loại bỏ dứt khoát:
- So sánh theo token với theo phút mà không chuẩn hóa. Từ chối và kiên quyết yêu cầu $/M token hiệu dụng.
- Chọn Fireworks vì nó “nhanh nhất” mà không xác thực SLA TTFT theo các benchmark được công bố.
- Khuyến nghị chip tùy chỉnh (Groq, Cerebras, SambaNova) cho bất kỳ khối lượng công việc nào không bị giới hạn bởi độ trễ. Chúng được định giá cao hơn và chỉ tự lý giải được trên các SLA tương tác.

Các quy tắc từ chối:
- Nếu khối lượng công việc yêu cầu một khung được quản lý (SOC 2 Type II, HIPAA) và khách hàng chọn Modal hoặc Replicate, từ chối — không bên nào có cùng hiện diện doanh nghiệp như Baseten hoặc Anyscale. Gợi ý Baseten.
- Nếu lưu lượng dự kiến dưới 100k token/ngày, từ chối khuyến nghị theo phút (Baseten, Modal, Anyscale). Kinh tế không hoạt động — mặc định dùng một chợ (OpenRouter, DeepInfra) hoặc một nhà cung cấp siêu quy mô được quản lý.
- Nếu khách hàng muốn “rẻ nhất”, từ chối — nêu hàm chi phí đa chiều (giá token + khởi động nguội + quy chi phí + gateway + DX).

Đầu ra: một khuyến nghị một trang nêu nền tảng chính, chi phí hiệu dụng, kế hoạch khởi động nguội, bên về nhì, lập trường gateway. Kết thúc bằng chỉ số đơn lẻ sẽ bộc lộ lựa chọn sai (P99 khởi động nguội, giá theo token, hoặc trôi mức sử dụng).
