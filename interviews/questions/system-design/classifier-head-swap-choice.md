---
id: classifier-head-swap-choice
title: A spam classifier from 800 messages and a pretrained body
card: system-design
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, ml-breadth]
tags: [fine-tuning, head-swap, frozen-body, precision-recall]
minutes: 12
lessons: [phases/19-capstone-projects/38-classifier-finetuning]
manuals: []
practice: []
cheatsheet: [lora-fine-tuning, ml-evaluation-metrics]
related: [system-design/finetune-pipeline-design, system-design/when-not-ml]
updated: 2026-11-03
---

Bạn có một mô hình ngôn ngữ nhỏ được tiền huấn luyện và 800 tin nhắn văn bản được gán nhãn, một nửa spam và một nửa không. Thiết kế bộ phân loại: bạn giữ gì, thay gì, chọn chế độ nào trong hai chế độ huấn luyện, tách và đánh giá bằng cách nào, và khi nào chế độ kia sẽ thắng.

## Short answer

Giữ phần thân được tiền huấn luyện và thay head từ vựng bằng một lớp tuyến tính tới hai lớp trên một vector chuỗi được mean-pool, có trọng số mask. Với 800 ví dụ, chỉ huấn luyện head với phần thân đóng băng: nó nhanh, nhẹ bộ nhớ và hiếm khi overfit, và trên fixture này nó đạt khoảng 0.9 precision và 0.85 recall sau hai mươi epoch. Fine-tuning toàn bộ mất lâu hơn khoảng ba lần và nằm trong khoảng chênh vài điểm theo một trong hai hướng; nó bắt đầu mang lại lợi ích ở quy mô 80,000 ví dụ hoặc khi lĩnh vực trôi xa khỏi văn bản tiền huấn luyện.

## Full answer

### What to keep and replace

Phần thân đã mã hóa định danh từ, vị trí và đồng xuất hiện. Huấn luyện một bộ phân loại mới từ đầu trên 800 ví dụ vứt bỏ điều đó. Head là phần sai: nó chiếu tới từ vựng. Thay nó bằng một lớp tuyến tính từ chiều rộng ẩn tới hai logit trên một vector được pool, và huấn luyện bằng cross-entropy theo nhãn.

### Pooling

Một bộ phân loại cần một vector cho mỗi tin nhắn. Mean pooling có trọng số theo attention mask là lựa chọn ổn định đơn giản nhất qua các độ dài và không cần token đặc biệt. Các lựa chọn khác là một class token ở đầu, mà phần thân phải được tiền huấn luyện với nó, và token không phải padding cuối cùng, được các bộ phân loại kiểu decoder dùng.

### Two regimes, one loop

| Chế độ | Tập có thể huấn luyện | Chi phí | Rủi ro |
|---|---|---|---|
| Chỉ head | Head tuyến tính | Nhanh, gần như miễn phí về bộ nhớ | Underfit khi lĩnh vực xa tiền huấn luyện |
| Fine-tuning toàn bộ | Head và phần thân | Lâu hơn khoảng ba lần | Overfit và quên trên dữ liệu nhỏ |

Cả hai chạy qua cùng hàm huấn luyện; công tắc đổi `requires_grad` trên các tham số phần thân, nên bộ tối ưu chỉ thấy head trong chế độ đầu.

### Data and evaluation

Tách 80/20, phân tầng để tập kiểm thử giữ cân bằng 50/50: 640 huấn luyện, 160 kiểm thử. Báo cáo precision, recall và F1 cho lớp spam với ma trận nhầm lẫn, để các con số có thể được đọc như các ước lượng trung thực. Fixture cân bằng và được sinh, nên dữ liệu thực sẽ nhiễu hơn.

### The decision

Trên 800 ví dụ và một phần thân rất nhỏ, chỉ head là quyết định đúng. Trên 80,000 ví dụ và một phần thân lớn hơn, fine-tuning toàn bộ bắt đầu thắng. Một đường giữa mở đóng băng chỉ block cuối, tốn ít hơn tinh chỉnh toàn bộ và học nhiều hơn chỉ head. Hợp đồng là API, không phải bên thắng: một hàm huấn luyện, một công tắc.

## Follow-ups

- **Level 2:** Tại sao phần thân đóng băng hiếm khi overfit ở đây? Expected: chỉ vài tham số của head di chuyển, nên mô hình không thể ghi nhớ 640 ví dụ qua phần thân.
- **Level 2:** Tại sao phân tầng phần tách? Expected: để tập kiểm thử giữ cân bằng lớp và precision và recall có ý nghĩa như chúng nói.
- **Level 3:** Precision quan trọng hơn recall cho sản phẩm này. Điều gì thay đổi trong thiết kế? Expected: ngưỡng quyết định trên logit spam, được chọn trên một phần tách validation giữ lại từ 640 tin nhắn huấn luyện để đánh đổi recall lấy precision, để 160 tin nhắn kiểm thử không bị chạm tới cho các con số cuối; chế độ huấn luyện giữ nguyên.
- **Level 3:** Các tin nhắn thuộc một lĩnh vực mà phần thân chưa bao giờ thấy. Chế độ nào và tại sao? Expected: fine-tuning toàn bộ hoặc một phần, vì các feature đóng băng không mang lĩnh vực và chỉ head underfit.

## Wrong answers

- "Huấn luyện một bộ phân loại nhỏ từ đầu; dù sao mô hình rất nhỏ." Điều đó lãng phí tiền huấn luyện và 800 ví dụ quá ít để học ngôn ngữ từ không.
- "Luôn fine-tune mọi thứ để có độ chính xác tốt nhất." Trên dữ liệu nhỏ, tinh chỉnh toàn bộ overfit và quên, cho một kết quả trong khoảng chênh vài điểm so với chỉ head ở gấp ba chi phí.
- "Dùng trạng thái ẩn của token cuối mà không có mask." Các chuỗi được padding khi đó pool một vị trí padding; mask phải chọn token thực cuối hoặc đặt trọng số cho trung bình.

## Taught in

[Bài học fine-tuning bộ phân loại](../../../phases/19-capstone-projects/38-classifier-finetuning/) xây dựng cả hai chế độ trên fixture 800 tin nhắn và so sánh precision, recall và chi phí của chúng.
