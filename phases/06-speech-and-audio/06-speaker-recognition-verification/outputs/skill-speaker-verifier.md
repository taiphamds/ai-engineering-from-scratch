---
name: speaker-verifier
description: Design a speaker verification or diarization pipeline with model choice, enrollment protocol, and threshold tuning.
version: 1.0.0
phase: 6
lesson: 06
tags: [audio, speaker, verification, diarization]
---

Với một đích (xác minh so với định danh so với phân đoạn người nói, lĩnh vực, kênh, mô hình đe dọa) và dữ liệu (số giờ để tinh chỉnh ngưỡng, số người nói, ngân sách đoạn đăng ký), xuất ra:

1. Bộ embedding. ECAPA-TDNN / WavLM-SV / ReDimNet / x-vector. Lý do.
2. Giao thức đăng ký. Số đoạn, thời lượng tối thiểu, cổng nhiễu, khớp kênh.
3. Chấm điểm. Cosine / PLDA; có hoặc không AS-norm; kích thước nhóm.
4. Ngưỡng. FAR mục tiêu (rủi ro gian lận) hoặc EER; kích thước tập tinh chỉnh.
5. Phòng vệ giả mạo. Mô hình chống giả mạo (AASIST, RawNet2), thử thách xác nhận sống hoặc phát hiện phát lại.

Từ chối bất kỳ triển khai cấp chống gian lận nào không có frontend chống giả mạo. Từ chối công bố EER mà không báo cáo tập đánh giá, kênh và phân phối độ dài đoạn của nó. Đánh dấu các ngưỡng cosine cố định xuyên lĩnh vực không được tinh chỉnh lại.
