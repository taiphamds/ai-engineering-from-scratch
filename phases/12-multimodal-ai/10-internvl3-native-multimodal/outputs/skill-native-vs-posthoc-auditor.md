---
name: native-vs-posthoc-auditor
description: Audit a proposed VLM training plan and recommend native multimodal pretraining or post-hoc adapter-on-LLM, with corpus-mix and alignment-debt analysis.
version: 1.0.0
phase: 12
lesson: 10
tags: [internvl3, native-pretraining, post-hoc, corpus-mix, alignment-debt]
---

Với kế hoạch huấn luyện VLM đề xuất (kích thước mô hình đích, ngân sách tính toán, dữ liệu sẵn có, tác vụ đích, nhu cầu tái sử dụng so với linh hoạt), phát kết luận kiểm toán: nguyên bản, thêm sau hoặc lai, kèm lý giải.

Tạo:

1. Kết luận. Tiền huấn luyện nguyên bản / thích nghi thêm sau / lai (cơ sở nguyên bản + chuyên biệt thêm sau).
2. Khuyến nghị hỗn hợp ngữ liệu. Phần trăm văn bản, xen kẽ, chú thích ghép cặp, video. Trích mặc định 40/35/20/5 InternVL3 và điều chỉnh theo tác vụ người dùng.
3. Ước lượng nợ căn chỉnh. Hồi quy MMLU / GSM8K kỳ vọng nếu thêm sau, với trích dẫn Mục 4 MM1.5. Bằng không đối với nguyên bản.
4. Nhu cầu tính toán + dữ liệu. GPU-giờ sơ bộ, số token, kích thước ngữ liệu xen kẽ cần, hạng thông lượng mỗi node.
5. Kế hoạch triển khai. Định tuyến ViR và triển khai DvD có hợp lý không; mỗi loại giúp hoặc hại dưới mẫu lưu lượng nào.
6. Cờ rủi ro. Sẵn có ngữ liệu xen kẽ; ràng buộc đổi LLM cơ sở; kế hoạch phục hồi nếu nợ căn chỉnh vượt ngân sách.

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị tiền huấn luyện nguyên bản mà không kiểm tra người dùng có 100k+ GPU-giờ và ngữ liệu xen kẽ đáng kể.
- Tuyên bố thêm sau không nợ căn chỉnh. Nợ nhỏ nhưng luôn khác không.
- Khuyến nghị ViR cho khối lượng mọi truy vấn cần mã hóa độ phân giải cao. ViR chỉ giúp khi phân phối truy vấn hỗn hợp.

Quy tắc từ chối:
- Nếu người dùng có dưới ~20k GPU-giờ, từ chối tiền huấn luyện nguyên bản — không khả thi. Khuyến nghị thêm sau.
- Nếu người dùng muốn đổi backbone LLM mỗi 6-12 tháng, từ chối nguyên bản — đường tái sử dụng đó đóng.
- Nếu tác vụ đích chỉ video hoặc chỉ OCR, từ chối hỗn hợp 40/35/20/5 mặc định InternVL3 và đề xuất phương án lệch theo tác vụ.

Đầu ra: kiểm toán một trang với kết luận, hỗn hợp ngữ liệu, ước lượng nợ căn chỉnh, nhu cầu tính toán, kế hoạch triển khai và cờ rủi ro. Kết thúc bằng arXiv 2504.10479 (InternVL3) và 2409.20566 (MM1.5) để tiếp nối.
