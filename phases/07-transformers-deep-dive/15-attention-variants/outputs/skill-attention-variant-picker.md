---
name: attention-variant-picker
description: Pick a full / sliding-window / sparse / differential attention topology for a new model given context length, retrieval demands, and compute profile.
version: 1.0.0
phase: 7
lesson: 15
tags: [attention, transformer, long-context, inference, memory]
---

# Attention Variant Picker

Giúp một nhà phát triển chọn và giải thích một cấu trúc liên kết attention cho một transformer mới, hoặc cho một transformer hiện có họ đang mở rộng sang ngữ cảnh dài hơn.

## Inputs to gather

1. **Độ dài ngữ cảnh đích** khi huấn luyện và khi suy luận (thường khác nhau — nhiều mô hình huấn luyện tại 16K và mở rộng khi suy luận).
2. **Nhu cầu truy xuất** trên thang 1–5: 1 = trò chuyện thuần, 5 = kim-trong-đống-cỏ / RAG / mã với ngữ cảnh kho dài.
3. **Ngân sách bộ nhớ suy luận** mức chịu đựng KV cache theo yêu cầu (byte mỗi token mỗi tầng là đơn vị đúng).
4. **Khả năng chịu chi phí huấn luyện** — huấn luyện SWA từ đầu rẻ; lắp attention vi sai vào một mô hình tiền huấn luyện tốn kém.
5. **Phần cứng đích** — Hopper+ có FlashAttention-3 đầy đủ, Ada có FA2, GPU cũ hơn bị giới hạn mặt nạ.

## Decision rules

- **Ngữ cảnh ≤ 16K và truy xuất ≤ 3**: attention đầy đủ với FlashAttention. Đừng tối ưu sớm.
- **Ngữ cảnh 16–128K và truy xuất ≤ 3**: SWA + toàn cục hỗn hợp tại 5:1, cửa sổ 1024 (dạng Gemma 3). Giữ truy xuất hoạt động được trong khi thu gọn KV.
- **Ngữ cảnh > 128K**: SWA đầy đủ với một tầng toàn cục mỗi 4–6 tầng, cộng nội suy vị trí / co giãn YaRN (Bài 04).
- **Truy xuất = 5 và ngân sách huấn luyện cho phép**: cân nhắc attention vi sai chỉ trong 4 tầng trên cùng (một nửa phần KV tăng gấp đôi, hầu hết lợi ích triệt tiêu sink).
- **Bạn đang phát hành một API công khai**: ưu tiên các mẫu ổn định (đầy đủ, SWA, hỗn hợp Gemma-3). Bỏ native-sparse / DIFF trừ khi bạn có các kỹ sư kernel.
- **Bạn không thể thay đổi mô hình cơ sở**: SWA có thể được lắp thêm khi suy luận qua masking; vi sai và thưa thì không.

## Always flag

- Các mô hình chỉ SWA dưới 7B thường thua đo được trên các benchmark suy luận. Khuyến nghị không dùng.
- Kích thước cửa sổ < 512 gần như không bao giờ đúng. Tăng lên hoặc dùng một cấu trúc liên kết khác.
- Các báo cáo attention vi sai trong bài báo nằm trên các mô hình nhỏ (3–7B). Bằng chứng mở rộng còn mỏng tính đến đầu năm 2026.
- Mọi biến thể tương tác với co giãn RoPE / YaRN (Bài 04). Nêu rõ hệ vị trí.

## Output format

Trả về:

1. **Khuyến nghị** — một cấu trúc liên kết duy nhất được nêu tên (ví dụ "hỗn hợp Gemma-3, W=1024, SWA:toàn cục 5:1").
2. **Giải thích** — ánh xạ mỗi đầu vào sang quy tắc quyết định ở trên.
3. **Ước lượng KV cache** — tại ngữ cảnh đích, bằng byte mỗi token mỗi tầng và GB tại batch 1.
4. **Đường di chuyển** — nếu mô hình cơ sở đã huấn luyện, cách lắp thêm.
5. **Các rủi ro đã biết** — những benchmark / khối lượng công việc nào có thể suy giảm.
