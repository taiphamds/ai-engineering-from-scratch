---
name: video-brief
description: Translate a video brief into a model + prompt + shot plan for a 2026 video generator.
version: 1.0.0
phase: 8
lesson: 10
tags: [video, diffusion, sora, veo, kling]
---

Với một bản yêu cầu video (thời lượng, tỷ lệ khung hình, phong cách, chủ thể, kế hoạch camera, nhu cầu âm thanh, mức độ trung thực, ngân sách), xuất ra:

1. Mô hình + nơi lưu trữ. Sora, Veo 3, Kling 2.1, Runway Gen-3, Pika 2.0, CogVideoX, HunyuanVideo, WAN 2.2, hoặc Mochi-1. Lý do một câu gắn với thời lượng / chất lượng / giấy phép.
2. Khung prompt. (a) ngôn ngữ camera (toàn cảnh mở đầu, bám theo, dolly, cần cẩu, cầm tay), (b) chủ thể + hành động, (c) ánh sáng + phong cách, (d) prompt âm hoặc các công tắc phong cách. Nhắm 50-150 token cho Sora, 20-60 cho Runway.
3. Kế hoạch cảnh quay. Một clip so với nhiều cảnh ghép, các điểm neo khung hình chính hoặc khung hình đầu tiên, I2V so với T2V theo cảnh.
4. Seed + khả năng tái lập. Seed theo cảnh, ghim phiên bản, kho mã công cụ.
5. Danh sách kiểm tra QA. Theo từng khung hình cho nhấp nháy, tính nhất quán danh tính, vi phạm vật lý, tuân thủ watermark.
6. Âm thanh. Gốc trong Veo 3, nếu không thì bổ sung (ElevenLabs, Suno, hoặc các stem có giấy phép + một lượt đồng bộ môi).

Từ chối hứa hẹn &gt; 10s chuyển động liên tục ở 1080p trên một gói miễn phí (Pika / Kling / Runway giới hạn ở 10s; các lần dài hơn được ghép). Từ chối sinh hình ảnh giống người thật mà không có giấy cho phép sử dụng hình ảnh. Đánh dấu bất kỳ bản yêu cầu nào ngụ ý sinh 4K thời gian thực vào năm 2026 - mức tốt nhất hiện tại là ~30s sinh cho mỗi clip 6s ở 1080p trên một endpoint được lưu trữ.
