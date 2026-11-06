---
name: speculative-tuning
description: Profile a decode workload and pick draft model, draft length K, temperature gate, and fallback policy for speculative decoding.
version: 1.0.0
phase: 10
lesson: 25
tags: [speculative-decoding, draft-model, alpha, throughput, inference, decode-latency]
---

Với mô hình đích (kích thước, họ, tokenizer), số liệu đo khối lượng công việc (hỗn hợp tác vụ, tỷ lệ token prompt so với decode, độ trễ giải mã p50/p99, dung lượng dư của bộ tăng tốc và HBM, batch size trung bình, phân phối temperature lấy mẫu) và các checkpoint dự thảo sẵn có, xuất:

1. Lựa chọn bản dự thảo. Chọn từ mô hình nhỏ cùng họ (Llama-3.2-1B cho Llama-70B), bản dự thảo chưng cất được huấn luyện trên đầu ra của đích, các head Medusa gắn thêm vào đích, hoặc "không spec decode" nếu không có bản dự thảo nào gần hơn tỷ lệ chi phí FLOP 30 phần trăm. Xác nhận tokenizer khớp với đích từng byte; từ chối tokenizer không khớp.
2. Độ dài dự thảo K. Argmax của E[tokens] / (1 + K x c) trong đó c là tỷ lệ chi phí dự thảo trên đích. Trình bày phép tính cho K thuộc 2, 3, 4, 5, 6 bằng alpha đo được từ một lượt hiệu chuẩn trên 5_000 token dữ liệu trong phân phối. Mặc định K=4 cho chat, K=6 cho mã, K=2 cho viết sáng tạo temperature cao.
3. Ngưỡng temperature. Đặt một ngưỡng temperature mà trên đó spec decode bị tắt. Mặc định 0.8; giảm xuống 0.6 nếu hiệu chuẩn cho thấy alpha sụp đổ sớm hơn. Loại bỏ bất kỳ ngưỡng temperature nào phụ thuộc vào việc kiểm tra từng yêu cầu làm tăng hơn 50 micro giây.
4. Ngân sách cây. Nếu ngăn xếp phục vụ hỗ trợ dự thảo cây, chọn một cây cố định nhỏ (độ sâu 2, nhánh 3-2) cho batch dưới 8; chuỗi phẳng cho batch trên 32. Nêu kích thước vùng KV tạm của bộ xác minh tính bằng byte và xác nhận nó vừa phần HBM còn dư.
5. Chính sách dự phòng. Nêu tên chỉ số (alpha đo theo cửa sổ trượt trên 1_000 lần xác minh gần nhất) và ngưỡng (alpha dưới 0.4) mà tại đó máy chủ quay về giải mã tự hồi quy thông thường cho luồng yêu cầu đó. Gồm thời hạn của quyết định dự phòng trên mỗi yêu cầu.

Từ chối spec decode ở batch size cao hơn điểm mà bộ xác minh bị giới hạn bởi tính toán. Trên điểm đó, FLOPs chưa được sử dụng mà bộ suy đoán được kỳ vọng tận dụng không còn tồn tại; thông lượng giảm. Từ chối spec decode cho bất kỳ họ tác vụ nào có alpha đo được dưới 0.4; chi phí dự thảo chiếm ưu thế và độ trễ thời gian thực tệ hơn. Từ chối bản dự thảo chưa được xác thực trên mẫu 1_000 token giữ riêng so với đích: một bản dự thảo chưa xác thực là sự trôi KL âm thầm.

Đầu vào ví dụ: "Llama-3.3-70B trên 8xH100, khối lượng công việc chat, batch 16, giải mã p50 28 ms, p99 60 ms, phân phối temperature trung bình 0.4 / tối đa 1.2, hiệu chuẩn cho thấy alpha 0.78 trên chat, 0.61 trên mã."

Đầu ra ví dụ:
- Bản dự thảo: Llama-3.2-1B-Instruct. Cùng tokenizer, cùng họ, tỷ lệ c xấp xỉ 0.03.
- K: 4. E[tokens/verify] = 3.4 chat, 2.5 mã. K=5 tăng 0.1 token chat và trả thêm 0.03 c; loại bỏ.
- Ngưỡng temperature: 0.8. Trên 0.8, alpha giảm xuống dưới 0.45 trên tập hiệu chuẩn.
- Ngân sách cây: độ sâu 2 nhánh (3, 2). Vùng KV tạm 480 MB ở batch 16 vừa.
- Dự phòng: alpha cửa sổ trượt trên 1_000 lần xác minh gần nhất dưới 0.40 sẽ tắt spec decode cho luồng đó trong 30 s, rồi thăm dò lại.
