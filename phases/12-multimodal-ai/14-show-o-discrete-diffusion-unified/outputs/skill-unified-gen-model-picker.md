---
name: unified-gen-model-picker
description: Pick between Show-o / Transfusion / Emu3 / Janus-Pro families for a product that needs both multimodal understanding and generation with open weights.
version: 1.0.0
phase: 12
lesson: 14
tags: [show-o, masked-diffusion, unified, t2i, inpainting]
---

Với một sản phẩm cần hiểu + tạo sinh thống nhất (VQA, tạo chú thích, T2I, tùy chọn điền khuyết ảnh) với ràng buộc trọng số mở và ngân sách độ trễ, chọn một họ mô hình và đưa ra cấu hình tham khảo.

Tạo ra:

1. Kết luận về họ mô hình. Show-o (khuếch tán rời rạc có mặt nạ), Transfusion / MMDiT (khuếch tán liên tục), Emu3 / Chameleon (rời rạc tự hồi quy), hoặc Janus-Pro (các bộ mã hóa tách rời).
2. Ngân sách bước suy luận. 16 bước cho Show-o, 20 cho Transfusion, 1024+ cho Emu3. Biện minh lựa chọn bằng ngân sách độ trễ của người dùng.
3. Hỗ trợ điền khuyết ảnh. Show-o có miễn phí; Transfusion thêm một kênh mặt nạ; Emu3 cần một lần tinh chỉnh riêng. Nêu rõ điều này cho người dùng.
4. Lựa chọn tokenizer. Với các họ rời rạc, khuyến nghị IBQ / MAGVIT-v2 / SBER; với liên tục, khuyến nghị VAE của SD3.
5. Độ ổn định huấn luyện. Hai hàm mất mát (Transfusion) cần điều chỉnh trọng số; một hàm mất mát của Show-o rõ ràng hơn.
6. Lộ trình chuyển đổi nếu người dùng phát triển. Từ Show-o sang Transfusion khi chất lượng trở thành giới hạn.

Các trường hợp bác bỏ tuyệt đối:
- Đề xuất Emu3 / Chameleon khi độ trễ suy luận là <10s mỗi ảnh. Tự hồi quy trên ~1024 token quá chậm.
- Khẳng định Show-o ngang Transfusion về chất lượng ảnh tiên tiến nhất. Không phải vậy. Tokenizer là giới hạn.
- Khuyến nghị Stable Diffusion cho một sản phẩm cần VQA. SD không thể suy luận về ảnh.

Quy tắc từ chối:
- Nếu người dùng muốn <2s cho mỗi lần tạo ảnh, từ chối Show-o và khuyến nghị Stable Diffusion + một VLM riêng để hiểu. Chấp nhận độ phức tạp nhiều mô hình.
- Nếu người dùng muốn "chất lượng tốt nhất trong phân khúc" với trọng số mở, từ chối Show-o / Emu3 và khuyến nghị họ Transfusion (MMDiT) hoặc JanusFlow.
- Nếu người dùng không thể cam kết với một tokenizer (lo giấy phép, giới hạn chất lượng), từ chối các họ chỉ rời rạc và khuyến nghị Transfusion.

Đầu ra: lựa chọn một trang với kết luận về họ mô hình, ngân sách bước, hỗ trợ điền khuyết ảnh, khuyến nghị tokenizer, kế hoạch ổn định và lộ trình chuyển đổi. Kết thúc bằng arXiv 2408.12528 (Show-o), 2408.11039 (Transfusion), 2501.17811 (Janus-Pro).
