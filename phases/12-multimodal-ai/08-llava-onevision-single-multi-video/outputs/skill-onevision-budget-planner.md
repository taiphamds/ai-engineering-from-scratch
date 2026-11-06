---
name: onevision-budget-planner
description: Allocate LLaVA-OneVision-style unified visual-token budgets across single-image, multi-image, and video scenarios for a target product mix.
version: 1.0.0
phase: 12
lesson: 08
tags: [llava-onevision, token-budget, curriculum, multi-image, video]
---

Với phân phối tác vụ kỳ vọng của sản phẩm — phần trăm yêu cầu một ảnh, nhiều ảnh và video — cùng ngân sách token thị giác mỗi mẫu, phát kế hoạch phân bổ mỗi kịch bản và giáo trình huấn luyện.

Tạo:

1. Cấu hình mỗi kịch bản. Một ảnh: số ô AnyRes + ảnh thu nhỏ + hệ số pooling; nhiều ảnh: ảnh mỗi mẫu + pooling mỗi ảnh; video: số khung + pooling mỗi khung.
2. Cân bằng ngân sách token. Tổng token mỗi kịch bản nên trong ±30% ngân sách đích; đánh dấu kịch bản dưới 70% đích (thiếu token) hoặc trên 130% (rủi ro ngữ cảnh).
3. Kế hoạch giáo trình. Ba giai đoạn (SI → OV → TT) với trọng số dữ liệu. Với TT, dùng hỗn hợp sản phẩm người dùng.
4. Kỹ năng tự phát kỳ vọng. Theo hỗn hợp sản phẩm người dùng, dự đoán năng lực tự phát kiểu LLaVA-OneVision nào có thể xuất hiện (nhiều camera, set-of-mark, tác tử ảnh chụp màn hình hoặc biến thể riêng sản phẩm).
5. Ước lượng sơ bộ dữ liệu huấn luyện. Số token / ảnh / khung xấp xỉ cần mỗi giai đoạn với LLM cơ sở 7B, trích quy mô dữ liệu OneVision-1.5.

Các trường hợp loại bỏ dứt khoát:
- Đề xuất thứ tự giai đoạn đặt video hoặc nhiều ảnh trước một ảnh. OneVision cho thấy mất 2-4 MMMU.
- Phân toàn ngân sách cho video khi sản phẩm 80% một ảnh. Lãng phí, không cân bằng.
- Giả định AnyRes-16 (lưới 4x4) vừa ngân sách 4k token không pooling mạnh. Không vừa.

Quy tắc từ chối:
- Nếu ngân sách token mỗi mẫu dưới 1024, từ chối cho nhiều ảnh hoặc video — dưới sàn đó kịch bản sụp đổ.
- Nếu người dùng muốn 5+ khung video ở độ phân giải đủ 729 token, từ chối; khuyến nghị pooling 3x hoặc ít khung hơn.
- Nếu phân phối sản phẩm bỏ hoàn toàn một ảnh, từ chối và khuyến nghị M-RoPE kiểu Qwen2.5-VL — giáo trình OneVision giả định một ảnh làm nền tri giác.

Đầu ra: kế hoạch một trang với cấu hình token mỗi kịch bản, trọng số giai đoạn giáo trình, dự đoán kỹ năng tự phát và ước lượng quy mô dữ liệu. Kết thúc bằng chỉ dẫn đến arXiv 2408.03326 (OneVision) và arXiv 2509.23661 (OneVision-1.5 hoàn toàn mở).
