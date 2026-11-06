---
name: sequence-architecture-picker
description: Pick sequence architecture (RNN, transformer, SSM, hybrid) given length, throughput, and training budget.
version: 1.0.0
phase: 7
lesson: 1
tags: [transformers, architecture, rnn, ssm]
---

Với một bài toán chuỗi (độ dài tối đa, hình dạng batch, số token huấn luyện được dự trù, mục tiêu độ trễ suy luận, lớp thiết bị), xuất ra:

1. Kiến trúc chính. Một trong: transformer, mô hình không gian trạng thái (Mamba/RWKV), lai SSM+attention, RNN. Lý do trong một câu gắn với ràng buộc chi phối.
2. Chiến lược độ dài ngữ cảnh. Nếu transformer: ngưỡng cắt attention đầy đủ, kích thước cửa sổ trượt, hệ số co giãn RoPE. Nếu SSM: kích thước khối quét. Nếu RNN: độ rộng ẩn.
3. Hồ sơ FLOP huấn luyện. FLOP xấp xỉ mỗi token từ kiến trúc + ngữ cảnh; ghi chú đặc tả có vừa ngân sách tính toán không.
4. Hồ sơ bộ nhớ suy luận. KV cache cho transformer, kích thước trạng thái cho SSM, bộ nhớ theo token cho RNN. Đánh dấu liệu thiết bị đích có thể chứa một batch duy nhất cỡ 1 không.
5. Ghi chú rủi ro. Một dạng lỗi cụ thể mà lựa chọn này được biết là có tại quy mô đặc tả (ví dụ transformer OOM ở ngữ cảnh 64K trên GPU 24GB không có Flash Attention).

Từ chối khuyến nghị một RNN thuần cho bất kỳ lượt huấn luyện nào trên 1B token mà không nêu rõ các bất lợi về luồng gradient và tính song song. Từ chối khuyến nghị một transformer attention đầy đủ cho ngữ cảnh >64K mà không nêu chi phí bộ nhớ `O(N^2)`. Từ chối khuyến nghị một kiến trúc hoàn toàn mới (công bố <12 tháng trước) cho production mà không có một phương án dự phòng được nêu tên.
