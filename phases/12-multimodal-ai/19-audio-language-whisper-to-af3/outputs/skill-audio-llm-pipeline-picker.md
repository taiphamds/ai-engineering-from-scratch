---
name: audio-llm-pipeline-picker
description: Pick cascaded (Whisper + LLM) or end-to-end (AF3 / Qwen-Audio) for an audio task, plus the encoder and bridge config.
version: 1.0.0
phase: 12
lesson: 19
tags: [whisper, audio-flamingo-3, qwen-audio, cascaded, end-to-end]
---

Với tác vụ âm thanh (chép lời, tóm tắt, phân tách người nói, cảm xúc, âm nhạc, âm thanh môi trường, deepfake, định vị theo thời gian) và ràng buộc triển khai, chọn pipeline và đưa ra cấu hình.

Tạo ra:

1. Lựa chọn pipeline. Nối tầng nếu chỉ chép lời hoặc chỉ tóm tắt lời nói sạch; đầu cuối (AF3 / Qwen-Audio) cho bất kỳ tác vụ âm học nào.
2. Ngăn xếp bộ mã hóa. Whisper-large-v3 (mạnh lời nói), BEATs (mạnh âm nhạc), AF-Whisper ghép (cân bằng).
3. Cấu hình cầu nối. Q-former 32-64 truy vấn cho không truyền luồng; token RVQ cho truyền luồng.
4. Lựa chọn LLM. Qwen2.5-7B cho chi phí, Qwen2.5-72B hoặc backbone AF3 cho chất lượng.
5. CoT theo yêu cầu. Bật cho tác vụ suy luận kiểu MMAU; tắt cho thông lượng chép lời.
6. Độ chính xác MMAU kỳ vọng. Nối tầng ~0.50, Qwen-Audio ~0.60, AF3 ~0.72, Gemini 2.5 Pro ~0.78.

Các trường hợp bác bỏ tuyệt đối:
- Khuyến nghị nối tầng cho tác vụ âm nhạc hoặc cảm xúc. Tín hiệu âm học bị mất.
- Dùng Q-former với <32 truy vấn cho âm thanh đa tác vụ. Không đủ token cho suy luận.
- Khẳng định chỉ Whisper xử lý được âm nhạc. Nó được huấn luyện trên dữ liệu chủ yếu là lời nói.

Quy tắc từ chối:
- Nếu người dùng cần âm thanh hội thoại truyền luồng (lời nói vào / lời nói ra theo thời gian thực), từ chối AF3 dựa trên Q-former và khuyến nghị Moshi hoặc Qwen-Omni (Bài học 12.20).
- Nếu ngân sách độ trễ <500ms và mục tiêu là chép lời đơn giản, khuyến nghị nối tầng với Whisper truyền luồng.
- Nếu tác vụ là tác vụ âm thanh mới (deepfake, phát hiện artifact nén), từ chối giải pháp có sẵn và đề xuất tinh chỉnh AF3 với dữ liệu tổng hợp.

Đầu ra: kế hoạch một trang với lựa chọn pipeline, ngăn xếp bộ mã hóa, cấu hình cầu nối, lựa chọn LLM, cờ CoT, độ chính xác kỳ vọng. Kết thúc bằng arXiv 2212.04356 (Whisper) và 2507.08128 (AF3) để đọc sâu hơn.
