---
name: skill-context-engineering
description: Decision framework for designing context assembly pipelines based on task type, window size, and latency budget
version: 1.0.0
phase: 11
lesson: 05
tags: [context-engineering, context-window, rag, memory, tool-selection, lost-in-the-middle]
---

# Context Engineering

Khi xây dựng một ứng dụng LLM, áp dụng khung này để thiết kế pipeline lắp ráp ngữ cảnh.

## Core principles

1. **Ngữ cảnh khan hiếm.** Cửa sổ 128K nghe lớn nhưng đầy nhanh. Lập ngân sách rõ ràng cho mỗi thành phần.
2. **Attention không đồng đều.** Mô hình attend nhiều hơn đến đầu và cuối. Đặt thông tin then chốt ở đó. Phần giữa là vùng chết.
3. **Động thắng tĩnh.** Các truy vấn khác nhau cần ngữ cảnh khác nhau. Lắp ráp mỗi truy vấn, không phải một lần khi khởi động.
4. **Ít hơn là nhiều hơn.** Ngữ cảnh 10K được tuyển chọn vượt trội hơn ngữ cảnh 100K đổ vào. Tỷ số tín hiệu trên nhiễu quan trọng hơn tổng thông tin.
5. **Đo mọi thứ.** Bạn không thể tối ưu thứ không đo. Đếm token mỗi thành phần trên mọi yêu cầu.

## Context budget guidelines

| Thành phần | Phạm vi điển hình | Ưu tiên | Chiến lược nén |
|-----------|-------------|----------|---------------------|
| System prompt | 200-1,000 token | Cố định, cao | Viết gọn, bỏ dư thừa |
| Định nghĩa công cụ | 500-3,000 token | Động, trung bình | Cắt tỉa theo ý định truy vấn |
| Ngữ cảnh truy xuất | 1,000-5,000 token | Động, cao | Xếp hạng lại + ngưỡng + loại trùng lặp |
| Lịch sử hội thoại | 500-5,000 token | Động, trung bình | Tóm tắt lượt cũ |
| Ví dụ few-shot | 500-2,000 token | Động, cao | Chọn theo tương đồng tác vụ |
| Truy vấn người dùng | 50-500 token | Cố định, cao nhất | N/A |
| Phần dành cho sinh | 2,000-8,000 token | Cố định | Điều chỉnh theo độ dài đầu ra kỳ vọng |

## When to use each memory type

**Ngắn hạn (lịch sử hội thoại):** Phiên hiện tại. Quản lý bằng tóm tắt. Nén các lượt cũ hơn 5-10 lần trao đổi. Giữ nguyên văn 3-4 lượt cuối.

**Dài hạn (cơ sở dữ liệu sự kiện):** Sở thích và sự kiện dự án tồn tại qua các phiên. Truy xuất khi phiên bắt đầu. Ví dụ: "người dùng thích Python", "dự án dùng PostgreSQL", "nhóm theo phát triển dựa trên trunk". Lưu trong CLAUDE.md, cơ sở dữ liệu hoặc hệ thống bộ nhớ có cấu trúc.

**Tình tiết (tương tác quá khứ):** Hội thoại quá khứ cụ thể liên quan đến tác vụ hiện tại. Lưu dưới dạng embedding, truy xuất theo độ tương đồng. "Tuần trước chúng ta gỡ một lỗi xác thực tương tự" là bộ nhớ tình tiết.

## Tool selection strategy

Không bao gồm mọi công cụ trong mọi yêu cầu. Điều này lãng phí token và khiến mô hình bối rối.

1. Phân loại ý định truy vấn (mã, email, lịch, nghiên cứu, dữ liệu)
2. Ánh xạ ý định sang các loại công cụ
3. Chỉ bao gồm công cụ khớp
4. Nếu ý định mơ hồ, bao gồm công cụ từ 2 loại hàng đầu
5. Luôn bao gồm một công cụ "tổng quát" (như tìm kiếm web) làm dự phòng

Tiết kiệm kỳ vọng: 60-80% token định nghĩa công cụ trên truy vấn có ý định rõ ràng.

## Retrieval best practices

- **Xếp hạng lại sau truy xuất.** Tương đồng vector là một bộ lọc thô. Bộ xếp hạng lại (cross-encoder hoặc dựa trên LLM) cải thiện precision đáng kể.
- **Đặt ngưỡng liên quan.** Không bao gồm chunk dưới cosine similarity 0.3. Chúng thêm nhiễu.
- **Loại trùng lặp.** Nếu hai chunk có chung 80%+ nội dung, chỉ giữ chunk điểm cao hơn.
- **Áp dụng thứ tự lost-in-the-middle.** Đặt các chunk liên quan nhất ở đầu và cuối.
- **Giới hạn tổng token truy xuất.** 3-5 chunk rất liên quan thắng 15 chunk tầm thường.

## History management

- Giữ nguyên văn 3-4 lượt cuối (mô hình cần ngữ cảnh gần đây)
- Tóm tắt các lượt cũ thành một bản lược ("Chúng ta đã thảo luận X, quyết định Y và bị chặn ở Z")
- Bỏ các lượt do hệ thống tạo không thêm thông tin (lời gọi công cụ không có nội dung cho người dùng)
- Kích hoạt nén khi lịch sử vượt 30% ngân sách sẵn có

## Red flags

- System prompt vượt 2,000 token: có lẽ chứa thông tin nên là động
- Mọi công cụ được bao gồm trên mọi yêu cầu: triển khai lựa chọn theo ý định
- Không lọc mức liên quan trong truy xuất: bạn đang đổ nhiễu vào cửa sổ
- Lịch sử tăng không giới hạn: chưa triển khai tóm tắt
- Không có phần dành cho sinh: mô hình cắt ngắn phản hồi
- Cùng thông tin ở 3 nơi (system prompt, tài liệu truy xuất, lịch sử): loại trùng lặp
- Mức sử dụng ngữ cảnh trên 60%: bạn để lại quá ít chỗ cho mô hình "suy nghĩ"
