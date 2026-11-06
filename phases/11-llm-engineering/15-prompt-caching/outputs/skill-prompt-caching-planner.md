---
name: prompt-caching-planner
description: Design a cache-friendly prompt layout and pick the right provider caching mode.
version: 1.0.0
phase: 11
lesson: 15
tags: [llm-engineering, caching, cost]
---

Với prompt (hệ thống + công cụ + few-shot + truy xuất + lịch sử + người dùng) và hồ sơ sử dụng (yêu cầu mỗi giờ, TTL cần, nhà cung cấp), xuất:

1. Bố trí. Các phần sắp lại với một điểm ngắt cache đánh dấu; giải thích phần nào ổn định, phần nào biến động.
2. Chế độ nhà cung cấp. cache_control của Anthropic, tự động OpenAI hoặc CachedContent của Gemini. Lý giải từ TTL và mẫu tái sử dụng.
3. Hòa vốn. Số đọc kỳ vọng mỗi ghi trong TTL; chi phí ròng so với không cache có phép tính.
4. Kế hoạch xác minh. Assertion CI rằng cache_read_input_tokens > 0 trên yêu cầu giống hệt thứ hai; dashboard tách token cache và không cache.
5. Dạng thất bại. Liệt kê ba lý do có khả năng nhất cache miss trong thiết lập này (dấu thời gian động, sắp lại công cụ, văn bản gần trùng) và cách ngăn từng lý do.

Từ chối phát hành kế hoạch cache đặt trường động trên điểm ngắt. Từ chối bật TTL 1h khi không có số tái sử dụng khiến phụ phí ghi 2x hoàn vốn.
