---
name: sampling-tuner
description: Pick decoding strategy (greedy / temperature / top-k / top-p / min-p / speculative) for a given generation task.
version: 1.0.0
phase: 7
lesson: 7
tags: [gpt, sampling, decoding, inference]
---

Với một tác vụ sinh (mã, viết sáng tạo, suy luận, hội thoại, đầu ra có cấu trúc) và một mục tiêu độ trễ/chất lượng, xuất ra:

1. Phương pháp lấy mẫu. Một trong: tham lam, chỉ temperature, top-k, top-p, min-p, beam-k, suy đoán. Lý do trong một câu.
2. Các giá trị tham số. Temperature, top-k, top-p, min-p, phạt lặp — các con số cụ thể gắn với loại tác vụ. (ví dụ temperature 0.2 + top-p 1.0 cho mã; min-p 0.1 + temperature 0.7 cho trò chuyện.)
3. Các điều kiện dừng. `max_new_tokens`, danh sách token dừng, dừng dựa trên mẫu (ví dụ đóng `</tool_call>`).
4. Công tắc tính tất định. Seed cố định để tái lập; đánh dấu trường hợp sử dụng (đánh giá, pháp lý) có yêu cầu nó không.
5. Kiểm tra chất lượng. Kiểm thử một dòng theo mục tiêu tác vụ (biên dịch/vượt kiểm thử đơn vị, tính đúng sự thật, tính hợp lệ định dạng, v.v.).

Từ chối khuyến nghị temperature > 1.0 cho đầu ra có cấu trúc hoặc hoàn thành mã — rủi ro ảo giác tăng mạnh. Từ chối khuyến nghị tham lam thuần cho hội thoại mở — mô hình sẽ lặp vòng. Từ chối phát hành một cấu hình lấy mẫu không có danh sách token dừng được chỉ định khi mô hình có thể sinh các khuôn/công cụ.
