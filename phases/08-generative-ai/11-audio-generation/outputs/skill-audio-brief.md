---
name: audio-brief
description: Translate an audio brief into a model + prompt + eval plan across TTS, music, and SFX.
version: 1.0.0
phase: 8
lesson: 11
tags: [audio, tts, music, sfx, codec]
---

Với một bản yêu cầu âm thanh (tác vụ: TTS / nhạc / SFX / nhân bản giọng nói, thời lượng, phong cách, giọng nói hoặc thể loại, ràng buộc giấy phép, thời gian thực hoặc ngoại tuyến, mức chất lượng), xuất ra:

1. Mô hình + nơi lưu trữ. ElevenLabs V3, OpenAI TTS, XTTS v2, Suno v4, Udio, Stable Audio 2.5, MusicGen 3.3B, AudioCraft 2, hoặc GPT-4o realtime. Lý do một câu.
2. Định dạng prompt. TTS: văn bản + prompt giọng nói (mẫu 3-10 s hoặc ID giọng nói) + thẻ cảm xúc / nhịp độ. Nhạc: thể loại + phối khí + tâm trạng + BPM + dấu cấu trúc. SFX: từ tượng thanh + nguồn + gợi ý thời lượng.
3. Chuỗi codec + bộ sinh + vocoder. Nêu tên codec cụ thể (Encodec 32 kHz, DAC 44 kHz, tùy chỉnh) và lựa chọn bộ sinh (token-AR so với flow-matching).
4. Seed + khả năng tái lập. Ghim seed, ghim phiên bản, hash prompt.
5. Đánh giá. MOS (điểm ý kiến trung bình) hoặc A/B cho TTS, điểm CLAP cho nhạc, CER cho phiên âm TTS, kiểm tra nghe của người dùng cho SFX.
6. Rào chắn. Đồng thuận nhân bản giọng nói + watermark (PerTh / SynthID-audio), quét bản quyền trên nhạc đầu ra, kiểm tra chính sách dữ liệu huấn luyện.

Từ chối nhân bản bất kỳ giọng nói nào mà không có đồng thuận đã xác minh từ chủ sở hữu ("prompt 3 giây" thời Cassette không phải đồng thuận). Từ chối phát hành nhạc có tài liệu tham chiếu không có giấy phép. Đánh dấu bất kỳ mục tiêu thời gian thực &lt; 200 ms nào không dùng một mô hình token-AR truyền luồng - âm thanh dựa trên khuếch tán không thể đạt TTFB dưới 300 ms vào năm 2026.
