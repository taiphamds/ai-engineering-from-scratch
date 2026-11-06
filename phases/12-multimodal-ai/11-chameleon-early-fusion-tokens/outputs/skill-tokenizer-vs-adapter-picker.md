---
name: tokenizer-vs-adapter-picker
description: Pick between Chameleon-style early fusion (shared-vocab tokenizer) and LLaVA-style late fusion (adapter on frozen LLM) for a VLM project.
version: 1.0.0
phase: 12
lesson: 11
tags: [chameleon, early-fusion, vq-vae, late-fusion, adapter]
---

Với đặc tả sản phẩm (chỉ hiểu hoặc hiểu+sinh), chất lượng ảnh đích (bài đăng mạng xã hội / tạp chí / in / phát sóng) và ngân sách chi phí (huấn luyện + suy luận), khuyến nghị họ Chameleon hoặc họ LLaVA với phác kiến trúc cụ thể.

Tạo:

1. Kết luận. Họ hợp nhất sớm (Chameleon / Emu3 / AnyGPT) hoặc hợp nhất muộn (LLaVA / BLIP-2 / Qwen-VL).
2. Chọn tokenizer (cho kết luận hợp nhất sớm). VQ-VAE (Chameleon), MAGVIT-v2, IBQ hoặc SBER-MoVQGAN; trích trần tái dựng kỳ vọng theo PSNR.
3. Kế hoạch ổn định huấn luyện. QK-Norm, vị trí dropout, thứ tự LayerNorm cho hợp nhất sớm ở quy mô lớn.
4. Ước lượng chi phí. GPU-giờ huấn luyện và độ trễ suy luận mỗi ảnh so với phương án hợp nhất muộn.
5. Trần chất lượng sinh. Khoảng PSNR / FID người dùng kỳ vọng; mức chất lượng sản phẩm có đạt với token rời rạc hay cần sinh liên tục (kiểu Transfusion).
6. Lộ trình chuyển đổi. Nếu người dùng phát triển và hợp nhất muộn thành giới hạn (cần đầu ra ảnh), chuyển đổi trông thế nào.

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị kiểu Chameleon cho sản phẩm chỉ hiểu. Hợp nhất muộn đơn giản hơn, rẻ hơn và trần cao hơn cho hiểu thuần.
- Đề xuất VQ-VAE với K<4096 cho sinh ảnh sản xuất. Codebook quá nhỏ, artifact thấy được.
- Tuyên bố suy luận hợp nhất sớm miễn phí. Decoder VQ thêm 50-200ms mỗi ảnh sinh, thường nhiều hơn thời gian đầu ra LLM.

Quy tắc từ chối:
- Nếu người dùng muốn sinh ảnh chất lượng tiên tiến nhất (FID < 15, sẵn in), từ chối token rời rạc và chỉ đến Transfusion / Stable Diffusion 3 / MMDiT (Bài 12.13).
- Nếu sản phẩm không bao giờ cần đầu ra ảnh, từ chối hợp nhất sớm — độ phức tạp không có cơ sở.
- Nếu người dùng muốn cắm trọng số LLM Llama / Qwen hiện có, từ chối hợp nhất sớm — cần tiền huấn luyện mô hình mới.

Đầu ra: kế hoạch một trang với kết luận, chọn tokenizer, danh sách ổn định, ước lượng chi phí, trần chất lượng, lộ trình chuyển đổi. Kết thúc bằng arXiv 2405.09818 (Chameleon) và 2408.11039 (Transfusion) để đọc so sánh.
