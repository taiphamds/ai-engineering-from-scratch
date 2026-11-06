---
name: prompt-reasoning-chain
description: Production-ready few-shot CoT prompt with self-consistency support for multi-step reasoning tasks
phase: 11
lesson: 02
---

Bạn là một người giải quyết vấn đề chính xác. Bạn chia các bài toán phức tạp thành các bước rõ ràng, có thể xác minh trước khi đưa ra câu trả lời cuối.

## Instructions

Với mỗi bài toán:

1. Xác định mọi đại lượng đã cho và các quan hệ của chúng
2. Xác định điều đang được hỏi
3. Giải từng bước một
4. Thể hiện rõ mọi phép tính số học
5. Nêu câu trả lời cuối theo đúng định dạng được chỉ định bên dưới

## Examples

<example>
Q: Vịt của Janet đẻ 16 quả trứng mỗi ngày. Cô ăn ba quả cho bữa sáng mỗi sáng và nướng bánh muffin cho bạn bè mỗi ngày bằng bốn quả. Cô bán mọi quả trứng còn lại ở chợ nông sản với giá $2. Cô kiếm được bao nhiêu mỗi ngày ở chợ nông sản?

A: Để tôi giải từng bước.

Đã cho: 16 quả trứng mỗi ngày, ăn 3, nướng bánh với 4, bán phần còn lại với giá $2 mỗi quả.

Bước 1: Trứng đã dùng = 3 + 4 = 7
Bước 2: Trứng còn lại = 16 - 7 = 9
Bước 3: Doanh thu = 9 * $2 = $18

Câu trả lời là 18.
</example>

<example>
Q: Một chiếc áo choàng cần 2 cuộn sợi màu xanh và lượng sợi trắng bằng một nửa số đó. Tổng cộng cần bao nhiêu cuộn?

A: Để tôi giải từng bước.

Đã cho: 2 cuộn xanh, trắng = một nửa xanh.

Bước 1: Sợi trắng = 2 / 2 = 1 cuộn
Bước 2: Tổng = 2 + 1 = 3 cuộn

Câu trả lời là 3.
</example>

<example>
Q: Josh quyết định thử mua sửa rồi bán một căn nhà. Anh mua một căn nhà với giá $80,000 và bỏ $50,000 vào sửa chữa. Điều này tăng giá trị căn nhà 150%. Anh kiếm được bao nhiêu lợi nhuận?

A: Để tôi giải từng bước.

Đã cho: Giá mua $80,000, sửa chữa $50,000, giá trị tăng 150%.

Bước 1: Tổng đầu tư = $80,000 + $50,000 = $130,000
Bước 2: Giá trị tăng = $80,000 * 1.5 = $120,000
Bước 3: Giá trị nhà mới = $80,000 + $120,000 = $200,000
Bước 4: Lợi nhuận = $200,000 - $130,000 = $70,000

Câu trả lời là 70000.
</example>

## Your Task

Giải bài toán sau bằng cùng cách tiếp cận từng bước được thể hiện trong các ví dụ trên.

<problem>
{problem}
</problem>

## Output Format

Phản hồi của bạn phải:
- Bắt đầu bằng "Để tôi giải từng bước."
- Liệt kê mọi đại lượng đã cho
- Thể hiện các bước đánh số với phép tính số học rõ ràng
- Kết thúc chính xác bằng: "Câu trả lời là [số]."

## Self-Consistency Protocol

Khi dùng prompt này với self-consistency (N > 1 mẫu):
- Đặt temperature thành 0.7
- Lấy mẫu N=5 phản hồi
- Trích xuất số sau "Câu trả lời là" từ mỗi phản hồi
- Lấy phiếu đa số
- Nếu độ tin cậy (số phiếu đa số / N) dưới 0.6, đánh dấu để con người xem xét

## Adaptation Guide

Để điều chỉnh prompt này cho các miền không phải toán:

**Phân loại**: Thay các bước số học bằng các bước thu thập bằng chứng. Thay "Câu trả lời là [số]" bằng "Phân loại là [nhãn]."

**Gỡ lỗi mã**: Thay số học bằng các bước theo dấu mã. Thay câu trả lời cuối bằng "Lỗi là [mô tả]."

**Phân tích pháp lý/y tế**: Thay số học bằng các bước suy luận từ bằng chứng. Thêm một từ hạn định độ tin cậy vào câu trả lời cuối.

Bất biến chính trên mọi miền: thể hiện suy luận trung gian trước câu trả lời cuối, và dùng định dạng câu trả lời cuối nhất quán cho phép trích xuất tự động.
