---
name: skill-prompt-patterns
description: Decision framework for choosing the right prompt pattern based on task type, reliability requirements, and target model
version: 1.0.0
phase: 11
lesson: 01
tags: [prompt-engineering, patterns, llm, temperature, cross-model, few-shot, chain-of-thought]
---

# Prompt Pattern Selection Guide

Khi xây dựng một tính năng dùng LLM, chọn mẫu prompt trước khi viết prompt. Mẫu quyết định cấu trúc. Nội dung lấp vào nó.

## Pattern Decision Matrix

| Loại tác vụ | Mẫu chính | Mẫu phụ | Temperature | Cần Few-Shot? |
|-----------|----------------|-------------------|-------------|-----------------|
| Trích xuất dữ liệu | Điền khuôn mẫu | Few-Shot | 0.0 | Có (2-3 ví dụ) |
| Phân loại | Few-Shot | Rào chắn | 0.0 | Có (3-5 ví dụ) |
| Tóm tắt | Nhân vật + Khuôn mẫu | Điều chỉnh theo đối tượng đọc | 0.3 | Không |
| Sinh mã | Nhân vật | Chain-of-Thought | 0.0 | Tùy chọn |
| Viết sáng tạo | Nhân vật | Phê bình | 0.7-1.0 | Không |
| Suy luận nhiều bước | Chain-of-Thought | Phân rã | 0.3 | Tùy chọn |
| Trả lời câu hỏi | Nhân vật + Rào chắn | Ranh giới | 0.3 | Không |
| Sinh prompt | Meta-Prompt | Phê bình | 0.7 | Có (1-2 ví dụ) |
| Kiểm duyệt nội dung | Rào chắn + Ranh giới | Few-Shot | 0.0 | Có (5+ ví dụ) |
| Dịch/điều chỉnh | Điều chỉnh theo đối tượng đọc | Few-Shot | 0.3 | Có (2-3 ví dụ) |

## When to Use Each Pattern

**Mẫu nhân vật**: dùng cho mọi prompt làm baseline. Câu hỏi duy nhất là vai trò nên cụ thể đến đâu. Với tác vụ tổng quát, một vai trò rộng là đủ. Với tác vụ chuyên biệt miền, vai trò nên nêu tên miền, mức thâm niên và ngữ cảnh.

**Mẫu Few-Shot**: dùng khi định dạng đầu ra quan trọng hơn nội dung. Nếu mô hình cần tạo một hình dạng JSON, định dạng CSV hoặc nhãn phân loại cụ thể, ví dụ hiệu quả hơn chỉ dẫn. Quy tắc kinh nghiệm: 2-3 ví dụ cho định dạng đơn giản, 5+ cho định dạng phức tạp hoặc mơ hồ.

**Mẫu Chain-of-Thought**: dùng cho toán, logic, phân tích nhiều bước và bất kỳ tác vụ nào mà mô hình cần "trình bày cách làm." Cải thiện độ chính xác 10-40% trên các tác vụ suy luận (Wei và cộng sự, 2022). KHÔNG dùng cho tra cứu sự kiện đơn giản hoặc trích xuất -- nó lãng phí token.

**Mẫu điền khuôn mẫu**: dùng cho trích xuất có cấu trúc mà mọi đầu ra phải có cùng hình dạng. Hoạt động tốt nhất với temperature=0.0 và xử lý "N/A" rõ ràng cho các trường thiếu.

**Mẫu phê bình**: dùng khi chất lượng quan trọng hơn tốc độ. Mô hình tạo, phê bình và cải thiện. Tăng khoảng gấp đôi chi phí token nhưng cải thiện đáng kể độ chính xác và đầy đủ. Tốt nhất cho đầu ra hệ trọng (báo cáo, khuyến nghị, nội dung công khai).

**Mẫu rào chắn**: dùng cho bất kỳ hệ thống nào tiếp xúc với người dùng. Luôn bao gồm: ranh giới phạm vi, hành vi từ chối cho yêu cầu ngoài phạm vi và xử lý "Tôi không biết" rõ ràng. Kết hợp với xác thực đầu vào ở phía ứng dụng.

**Mẫu Meta-Prompt**: dùng để tạo prompt cho tác vụ mới. Thay vì viết prompt từ đầu, mô tả tác vụ và để mô hình viết prompt. Sau đó kiểm thử và lặp lại. Tiết kiệm thời gian phát triển prompt ban đầu.

**Mẫu phân rã**: dùng cho các bài toán phức tạp hưởng lợi từ chia để trị. Mô hình chia bài toán thành các phần, giải từng phần và kết hợp. Hiệu quả nhất với tác vụ có 3-7 bài toán con.

**Mẫu điều chỉnh theo đối tượng đọc**: dùng khi cùng nội dung cần phục vụ các đối tượng đọc khác nhau. Chỉ định đối tượng đọc rõ ràng -- không dựa vào việc mô hình đoán từ ngữ cảnh.

**Mẫu ranh giới**: dùng cho hệ thống sản xuất KHÔNG BAO GIỜ được trả lời một số loại câu hỏi. Mạnh hơn rào chắn vì nó định nghĩa phạm vi cứng với thông điệp từ chối chính xác. Thiết yếu cho các miền nhạy cảm về tuân thủ.

## Cross-Model Compatibility

Các mẫu được xếp hạng theo mức nhất quán khi hoạt động trên GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro và Llama 3:

| Mẫu | Tính nhất quán xuyên mô hình | Ghi chú |
|---------|------------------------|-------|
| Few-Shot | Rất cao | Ví dụ chuyển giao tốt trên mọi mô hình |
| Điền khuôn mẫu | Rất cao | Cấu trúc rõ ràng để lại ít chỗ cho sai lệch |
| Chain-of-Thought | Cao | Mọi mô hình lớn hỗ trợ "suy nghĩ từng bước" |
| Nhân vật | Cao | Hoạt động ở mọi nơi nhưng các mô hình khác nhau phản hồi với các mức cụ thể vai trò khác nhau |
| Rào chắn | Trung bình | Claude tuân theo rào chắn nghiêm ngặt nhất; GPT-4o đôi khi lệch trong hội thoại dài |
| Phê bình | Trung bình | Chất lượng tự phê bình khác nhau đáng kể theo mô hình |
| Meta-Prompt | Trung bình | GPT-4o và Claude tạo các phong cách prompt khác nhau |
| Ranh giới | Thấp-Trung bình | Hành vi từ chối khác nhau; kiểm thử theo mô hình |

## Common Mistakes

1. **Dùng Chain-of-Thought cho mọi thứ**: CoT thêm token và độ trễ. Chỉ dùng khi cần các bước suy luận.
2. **Quá nhiều ràng buộc**: hơn 5-7 ràng buộc và mô hình bắt đầu bỏ một số. Ưu tiên 3 ràng buộc quan trọng nhất.
3. **Nhân vật + ràng buộc mâu thuẫn**: "Bạn là nhà văn sáng tạo" + "Không bao giờ dùng ẩn dụ" khiến mô hình bối rối.
4. **Không chỉ định temperature**: để temperature mặc định (thường là 1.0) khi bạn cần đầu ra tất định.
5. **Sao chép và dán prompt giữa các mô hình**: luôn kiểm thử. Một prompt được tinh chỉnh cho GPT-4o có thể hoạt động kém trên Claude và ngược lại.
6. **Bỏ qua thông điệp hệ thống**: đặt mọi thứ trong thông điệp người dùng thay vì dùng thông điệp hệ thống cho các quy tắc lâu dài.
7. **Dựa quá nhiều vào ràng buộc phủ định**: "KHÔNG làm X, Y, Z, A, B, C" kém hiệu quả hơn "CHỈ làm W." Cách diễn đạt khẳng định cho mô hình một mục tiêu rõ ràng.

## Reliability Targets

| Trường hợp sử dụng | Tổ hợp mẫu | Độ chính xác kỳ vọng | Chi phí token |
|----------|-------------------|-------------------|------------|
| Trích xuất trong sản xuất | Khuôn mẫu + Few-Shot | 95%+ | Thấp (500-1K) |
| Hỏi đáp tiếp xúc với người dùng | Nhân vật + Rào chắn + Ranh giới | 90%+ | Trung bình (1-2K) |
| Sinh mã | Nhân vật + Chain-of-Thought | 85%+ | Trung bình (1-3K) |
| Sinh nội dung | Nhân vật + Phê bình | Chất lượng 90%+ | Cao (2-4K, hai lượt) |
| Phân loại | Few-Shot + Rào chắn | 95%+ | Thấp (300-800) |
| Phân tích phức tạp | Phân rã + Chain-of-Thought | 85%+ | Cao (3-5K) |
