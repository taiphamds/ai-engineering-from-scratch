---
name: alm-picker
description: Pick an audio-language model, benchmark subset, output modality (text vs speech), and guardrails for an audio-understanding task.
version: 1.0.0
phase: 6
lesson: 10
tags: [alm, lalm, qwen-omni, audio-flamingo, gemini-audio, mmau]
---

Với tác vụ (tiếng nói / âm thanh / âm nhạc / nhiều âm thanh / âm thanh dài, phương thức đầu ra, độ trễ, giấy phép), xuất ra:

1. Mô hình. Qwen2.5-Omni-7B · Qwen3-Omni · SALMONN · Audio Flamingo 3 · AF-Next · LTU · GAMA · Gemini 2.5 Pro (API) · GPT-4o Audio (API). Lý do trong một câu.
2. Tập con benchmark để xác thực. Tiếng nói / âm thanh / âm nhạc / nhiều âm thanh MMAU-Pro · LongAudioBench · AudioCaps · ClothoAQA. Chọn trục khớp tác vụ người dùng.
3. Phương thức đầu ra. Chỉ văn bản · văn bản + tiếng nói (Qwen-Omni, GPT-4o Audio). Dành ngân sách cho một decoder tiếng nói bổ sung nếu cần.
4. Các biện pháp bảo vệ. Từ chối các prompt yêu cầu so sánh nhiều âm thanh khi điểm nhiều âm thanh của mô hình &lt; 30% (gần ngẫu nhiên). Phân đoạn người nói trước LALM cho các đầu vào &gt; 10 phút.
5. Chuyển cấp. Khi nào tác vụ này nên quay về một mô hình chuyên biệt — Whisper để chép lời, BEATs để phân loại, pyannote để phân đoạn người nói. LALM không phải tốt nhất ở từng việc.

Từ chối phát hành các tác vụ so sánh nhiều âm thanh mà chưa xác minh mô hình đạt điểm &gt; 40% trên tập con nhiều âm thanh MMAU-Pro. Từ chối âm thanh dài (&gt; 10 phút) không có phân đoạn người nói phía trước. Đánh dấu bất kỳ triển khai nào dùng các con số nhà cung cấp báo cáo mà không có xác minh lại độc lập.

Đầu vào ví dụ: "Kiểm toán tuân thủ: chép lời các bản ghi cuộc gọi ngân hàng 10 phút + phát hiện nhân viên có đọc thông báo bắt buộc không."

Đầu ra ví dụ:
- Mô hình: Whisper-large-v3-turbo để chép lời + Gemini 2.5 Pro (qua API) cho QA kiểm tra thông báo trên bản chép lời. LALM trực tiếp trên âm thanh thô hấp dẫn nhưng accuracy LALM âm thanh dài giảm sau 10 phút.
- Tập con benchmark: tập con tiếng nói MMAU-Pro (Gemini 2.5 Pro = 73.4%) — bao phủ trục suy luận tiếng nói. Cũng kiểm tra ngẫu nhiên trên tập chuẩn 50 cuộc gọi của riêng bạn.
- Phương thức đầu ra: chỉ văn bản. Đầu ra tiếng nói không cần thiết cho một báo cáo kiểm toán.
- Các biện pháp bảo vệ: phân đoạn người nói bằng pyannote 3.1 trước; gửi riêng các đoạn theo người nói; ghi nhật ký điểm độ tin cậy cho mỗi cuộc gọi.
- Chuyển cấp: nếu một cuộc gọi không vượt kiểm tra thông báo, chuyển đến người rà soát thay vì tự động đánh dấu.
