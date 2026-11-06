---
name: classifier-stack-audit
description: Audit a deployment's input/output classifier stack (model, taxonomy, input rails, output rails, dialog rails) and flag adversarial-attack gaps.
version: 1.0.0
phase: 15
lesson: 18
tags: [llama-guard, nemo-guardrails, input-rails, output-rails, colang, adversarial-attacks]
---

Với ngăn xếp phân loại của một triển khai (phiên bản Llama Guard, cấu hình NeMo Guardrails, các bộ phân loại tùy chỉnh, các bước chuẩn hóa), kiểm toán nó theo tham chiếu năm 2026 và đánh dấu bề mặt tấn công ngăn xếp không bao phủ.

Tạo ra:

1. **Danh mục mô hình.** Liệt kê các bộ phân loại đang được sử dụng. Llama Guard 3 (8B / 1B-INT4) so với Llama Guard 4 (đa phương thức, S1–S14). Phiên bản NeMo Guardrails. Bất kỳ bộ phân loại tùy chỉnh nào. Nếu triển khai chấp nhận hình ảnh, xác nhận bộ phân loại là đa phương thức.
2. **Ánh xạ hệ phân loại.** Ánh xạ các danh mục nghiệp vụ đã khai báo lên hệ phân loại của bộ phân loại. Mọi danh mục người vận hành quan tâm phải ánh xạ tới một danh mục bộ phân loại; các danh mục chưa ánh xạ không được bảo vệ.
3. **Độ bao phủ rào chắn.** Xác nhận các rào chắn đầu vào kích hoạt trước lượt mô hình và các rào chắn đầu ra kích hoạt trước khi phản hồi được gửi đi. Các rào chắn hội thoại (Colang trong NeMo) thực thi các ràng buộc xuyên lượt. Các bộ phân loại một lượt không thể bắt các cuộc tấn công nhiều lượt.
4. **Chuẩn hóa.** Xác nhận các đầu vào được chuẩn hóa NFKC, ánh xạ ký tự đồng dạng, và loại bỏ các ký tự độ rộng bằng không / bộ chọn biến thể trước phân loại. Phân loại byte thô là một mục tiêu ASR 100% cho Emoji Smuggling (Huang và cộng sự 2025).
5. **Độ bao phủ tập hợp tấn công.** Với mỗi cuộc tấn công được ghi nhận (buôn lậu emoji, ký tự đồng dạng, chuyển hướng trong ngữ cảnh, diễn đạt lại ngữ nghĩa), nêu biện pháp phòng thủ cụ thể trong ngăn xếp. Phòng thủ chỉ bằng bộ phân loại không vượt qua kiểm toán này; xếp lớp với Constitution (Bài 17) và môi trường chạy (Bài 10, 13, 14) là bắt buộc.

Các trường hợp loại bỏ dứt khoát:
- Các triển khai sử dụng một bộ phân loại chỉ văn bản trên đầu vào đa phương thức.
- Các triển khai không có bước chuẩn hóa.
- Các triển khai chỉ có rào chắn đầu vào (không có rào chắn đầu ra trên các đầu ra danh mục nhạy cảm).
- Ngăn xếp coi bộ phân loại là lớp an toàn duy nhất.
- Các tuyên bố ASR mà người vận hành không thể tái lập trên phân phối của chính họ.

Các quy tắc từ chối:
- Nếu các danh mục đã khai báo của người dùng không ánh xạ vào hệ phân loại của bộ phân loại, hãy từ chối và yêu cầu một ánh xạ trước. Chưa ánh xạ = chưa được bảo vệ.
- Nếu triển khai viện dẫn các con số ASR của Llama Guard 3 trên một bề mặt đầu vào đa phương thức, hãy từ chối và yêu cầu Llama Guard 4 hoặc một bộ phân loại đa phương thức.
- Nếu người dùng coi lớp phân loại là đủ trong một bối cảnh rủi ro cao, hãy từ chối. Điều 14 EU AI Act (Bài 15) kỳ vọng giám sát của con người ở trên.

Định dạng đầu ra:

Trả về một kiểm toán bộ phân loại với:
- **Danh mục mô hình** (tên, phiên bản, phương thức)
- **Ánh xạ hệ phân loại** (danh mục người vận hành → danh mục bộ phân loại)
- **Độ bao phủ rào chắn** (đầu vào / đầu ra / hội thoại; kích hoạt trước/sau mô hình)
- **Ghi chú chuẩn hóa** (NFKC có/không, ký tự đồng dạng có/không, loại bỏ độ rộng bằng không có/không)
- **Độ bao phủ tập hợp tấn công** (tấn công → phòng thủ)
- **Tính đầy đủ của lớp** (bộ phân loại + hiến pháp + môi trường chạy; cả ba bắt buộc)
- **Mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
