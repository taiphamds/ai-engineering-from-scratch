---
name: audio-evaluator
description: Pick metrics, benchmarks, normalization rules, and reporting format for any audio model release.
version: 1.0.0
phase: 6
lesson: 17
tags: [evaluation, wer, mos, utmos, eer, der, fad, mmau, leaderboard]
---

Với tác vụ (ASR / TTS / nhân bản / xác minh người nói / phân đoạn người nói / phân loại / âm nhạc / LALM / S2S luồng), xuất ra:

1. Thước đo chính. WER · MOS · UTMOS · SECS · EER · DER · mAP · FAD · accuracy MMAU-Pro · độ trễ P95. Một lựa chọn.
2. Các thước đo phụ. 1-3 trục bổ sung (tốc độ, đa dạng, độ vững) và lý do.
3. Quy tắc chuẩn hóa. Chữ thường, bỏ dấu câu, mở rộng số, thu gọn khoảng trắng. Dùng Whisper-normalizer hoặc tùy chỉnh, ghi lại nó.
4. Benchmark công khai. Bảng xếp hạng kinh điển để báo cáo so với (Open ASR, TTS Arena, MMAU-Pro, VoxCeleb1-O, AudioSet, LongAudioBench, v.v.).
5. Tập nội bộ. Dữ liệu lĩnh vực được giữ lại với N mẫu; phân tích các lát cắt nhân khẩu học / âm học.
6. Định dạng báo cáo. Phân phối (P50/P95/P99 cho độ trễ; recall theo lớp cho phân loại; theo nhóm cho MMAU). Khuôn ghi chú phát hành.

Từ chối đánh giá một con số duy nhất cho độ trễ (báo cáo các phân vị). Từ chối chỉ tổng hợp cho phân loại (báo cáo theo lớp). Từ chối các bản phát hành TTS không có cả MOS/UTMOS và SECS (khi nhân bản). Từ chối các bản phát hành ASR không có đặc tả chuẩn hóa WER. Từ chối các bản phát hành âm nhạc chỉ có FAD — luôn ghép với hội đồng MOS con người.

Đầu vào ví dụ: "Phát hành một TTS hội thoại tiếng Anh-Tây Ban Nha mới. Cần thuyết phục nhóm nó tốt hơn baseline Cartesia-Sonic hiện có."

Đầu ra ví dụ:
- Chính: UTMOS (các mẫu âm thanh theo cặp trên 50 prompt mỗi ngôn ngữ) + MOS hội đồng con người (20 người nghe mỗi ngôn ngữ, A/B mù so với baseline).
- Phụ: trung vị & P95 TTFA (phải khớp baseline); SECS &gt; 0.80 so với một tham chiếu giọng cố định (không suy giảm người nói); CER trên ASR vòng đi-về (Whisper-large-v3-turbo) &lt; 2%.
- Chuẩn hóa: Whisper-normalizer tiếng Anh + multilingual-normalizer tiếng Tây Ban Nha của Hugging Face cho WER vòng đi-về.
- Benchmark công khai: TTS Arena (tiếng Anh) và Artificial Analysis Speech để định vị ELO tương đối. Mục tiêu: trong 50 ELO của đối thủ gần nhất.
- Nội bộ: 200 prompt được giữ lại (100 mỗi ngôn ngữ) bao phủ tiền, ngày, tên sản phẩm, tường thuật 2 câu, đọc có cảm xúc, chuyển mã ngôn ngữ. 10 giọng nhân khẩu học.
- Báo cáo: ghi chú phát hành với tiêu điểm (UTMOS + MOS), histogram P50/P95 TTFA, CDF SECS, phân tích CER theo nhóm, các điểm nêu dạng lỗi (các prompt chuyển mã ngôn ngữ thất bại ở X%).
