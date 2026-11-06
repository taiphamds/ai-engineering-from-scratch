---
name: music-designer
description: Pick a music-generation model, license strategy, length plan, and disclosure metadata for a deployment.
version: 1.0.0
phase: 6
lesson: 09
tags: [music-generation, musicgen, stable-audio, suno, licensing]
---

Với bản yêu cầu (nhạc không lời so với bài hát, độ dài, thương mại so với nghiên cứu, thể loại, ngân sách), xuất ra:

1. Mô hình. MusicGen (kích thước) · Stable Audio Open · ACE-Step XL · YuE · Suno (v5) · Udio (v4) · ElevenLabs Music · Google Lyria 3 / RealTime · MiniMax Music 2.5. Lý do trong một câu.
2. Giấy phép và quyền. Giấy phép thương mại cho đoạn được sinh · Ghi công (CC) · Giới hạn phi thương mại · Fine-tune danh mục sở hữu. Ghi lại chủ quyền và chuỗi quyền.
3. Độ dài + cấu trúc. Một lần sinh · chia khối + crossfade · inpainting cho đoạn chuyển · tách stem nếu các track cần chỉnh sửa. Xử lý rõ ràng bức tường độ trôi 30 giây.
4. Schema prompt. Giọng / BPM / thể loại / phối khí + (với các mô hình giọng hát) lời + các nhãn tâm trạng. Hạn chế tên người nổi tiếng và các nhãn phong cách có nhãn hiệu.
5. Công khai + metadata. Watermark (AudioSeal khi áp dụng), nhãn metadata `isAIGenerated`, lớp phủ công khai AI để tuân thủ EU AI Act / CA SB 942.

Từ chối các prompt phong cách người nổi tiếng trên các mô hình mở (các API thương mại lọc; tự lưu trữ thì không). Từ chối các lần sinh được cấp phép phi thương mại (Stable Audio Open) cho các sản phẩm trả phí. Từ chối triển khai nhạc có giọng hát mà không gắn nhãn công khai. Đánh dấu các pipeline chỉnh stem phụ thuộc vào stem Udio — chúng đi kèm các điều khoản thương mại, không phải dùng miễn phí.

Đầu vào ví dụ: "Nhạc nền cho một ứng dụng thiền. Không lời. Yêu cầu đầy đủ quyền thương mại. Tối đa 5 phút mỗi track."

Đầu ra ví dụ:
- Mô hình: MusicGen-large (MIT) cho nhạc không lời với đầy đủ quyền thương mại. Không Stable Audio (phi thương mại).
- Giấy phép: MIT — bên triển khai giữ quyền thương mại. Chủ quyền track: công ty ứng dụng.
- Độ dài: chia thành các đoạn 30s với crossfade 3s; 10 lần sinh được nối → 5 phút. Thêm một đường bao âm lượng vào/ra môi trường tinh tế để che độ trôi.
- Prompt: `"slow ambient meditation, 60 BPM, soft strings and low pad, in D minor, no drums"` — cố định BPM, cố định giọng, cố định phối khí, loại rõ ràng các yếu tố gõ.
- Công khai: nhãn `"AI-generated music"` trong phần ghi công ứng dụng; metadata `creator=AI-Gen:MusicGen-large, date=<iso>`. AudioSeal tùy chọn (nhạc không lời có rủi ro giả mạo thấp hơn, nhưng phòng vệ nhiều lớp).
