---
name: provenance-audit
description: Audit a content deployment's provenance chain across watermarking and C2PA metadata.
version: 1.0.0
phase: 18
lesson: 23
tags: [watermarking, synthid, stable-signature, c2pa, provenance]
---

Với triển khai nội dung có khẳng định nguồn gốc, kiểm tra chuỗi nguồn gốc.

Tạo:

1. Kiểm kê watermark. Liệt kê mọi phương thức (văn bản, ảnh, âm thanh, video) và watermark áp dụng mỗi loại. Không watermark = không đường phát hiện.
2. Độ vững watermark. Với mỗi watermark, nêu lớp đối kháng nó sống sót (nén, cắt ảnh, diễn đạt lại, tinh chỉnh). Đánh dấu hạn chế theo Phần 6 Kirchenbauer 2023 (diễn đạt lại) và "Stable Signature is Unstable" 2024 (tinh chỉnh).
3. Bao phủ C2PA. Có đính metadata C2PA không? Chuỗi ký có từ danh tính đáng tin không? Metadata có thể bị gỡ; hiện diện không đủ.
4. Bộ phát hiện xuyên phương thức. Có bộ phát hiện hợp nhất xuyên phương thức (SynthID 2025) hay chỉ riêng theo phương thức?
5. Phù hợp quy định. Triển khai có đáp ứng nghĩa vụ minh bạch Điều 50 EU AI Act (hiệu lực tháng 8 năm 2026) không? Có tuân Bộ quy tắc Minh bạch (phiên bản cuối tháng 6 năm 2026) không?

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định "watermark" không nêu cơ chế và bộ phát hiện.
- Mọi khẳng định "xác thực" chỉ dựa vào vắng watermark (mô hình không có watermark ≠ xác thực).
- Mọi khẳng định nguồn gốc ảnh không có đánh giá tấn công loại bỏ Fernandez 2024.

Quy tắc từ chối:
- Nếu người dùng hỏi "điều này phát hiện mọi nội dung AI không," từ chối khẳng định nhị phân; watermark riêng theo mô hình.
- Nếu người dùng hỏi giải pháp nguồn gốc phổ quát, từ chối và trỏ cách tiếp cận phân lớp watermark + C2PA.

Đầu ra: bản kiểm tra một trang điền năm phần, đánh dấu khoảng trống độ vững theo phương thức và nêu kiểm soát bổ sung duy nhất giá trị cao nhất. Trích dẫn SynthID (Google DeepMind), Stable Signature (Fernandez và cộng sự 2023) và C2PA, mỗi tài liệu một lần.
