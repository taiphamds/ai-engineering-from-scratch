---
id: classifier-head-or-full
title: Train the head only, or fine-tune the whole model
card: post-training
kind: tradeoff
level: 1
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, ml-breadth]
tags: [fine-tuning, classifier, frozen-body, precision-recall]
minutes: 8
lessons: [phases/19-capstone-projects/38-classifier-finetuning]
manuals: []
practice: []
cheatsheet: [llm-pipeline-capstone]
related: [post-training/lora-parameter-count]
updated: 2026-11-03
---

Bạn có một transformer pretrained nhỏ và 800 tin nhắn văn bản có nhãn, một nửa là spam. Bạn cần một bộ phân loại nhị phân trước ngày mai. Bạn chỉ huấn luyện một classification head mới, hay cập nhật mọi trọng số? Bảo vệ lựa chọn.

## Short answer

Đổi head mô hình ngôn ngữ thành một lớp tuyến tính cho hai lớp và bắt đầu với phần thân đóng băng. Huấn luyện chỉ head nhanh, tốn gần như không bộ nhớ, và hiếm khi overfit trên lượng dữ liệu ít này. Chỉ mở đóng băng phần thân khi lần chạy đóng băng còn dư địa độ chính xác và miền xa văn bản pretraining.

## Full answer

### Two regimes, one loop

Phần thân ánh xạ các token thành trạng thái ẩn và giữ nguyên. Head ánh xạ một trạng thái ẩn pooled thành hai logit và là mới. Huấn luyện chỉ head đặt `requires_grad=False` trên phần thân, nên bộ tối ưu chỉ thấy head. Fine-tuning đầy đủ để gradient chảy qua toàn bộ stack, và phần thân trôi về mục tiêu phân loại.

### What each one buys

Trên fixture trong bài học capstone, huấn luyện chỉ head đạt precision gần 0.9 và recall gần 0.85 sau hai mươi epoch. Fine-tuning đầy đủ mất lâu hơn khoảng ba lần và nằm trong một vài điểm về hai phía, tùy seed. Với 800 ví dụ, phần thân có ít thứ để học từ các nhãn, và nhiều thứ để quên.

### Pooling

Một bộ phân loại cần một vector mỗi chuỗi. Mean pooling được đặt trọng số bằng mask attention là lựa chọn đơn giản nhất và cho một tín hiệu ổn định qua các độ dài. Một token CLS cần pretraining của token đó. Last-token pooling là điều các bộ phân loại kiểu decoder dùng.

### Read the numbers, not one accuracy

Báo cáo precision, recall, F1 và confusion matrix trên một phần chia giữ lại có cân bằng đã biết. Bài học chia 80/20 thành 640 tin nhắn huấn luyện và 160 tin nhắn kiểm thử, phân tầng để tập kiểm thử giữ cân bằng.

### When the full update starts to pay

Trên 80,000 ví dụ và một phần thân lớn hơn, phần thân có đủ tín hiệu để thay đổi mà không overfit, và một dịch chuyển miền có thể biện minh chi phí. Một đường trung gian chỉ mở đóng băng block cuối.

## Follow-ups

- **Level 1:** `requires_grad=False` trên phần thân làm gì với bộ tối ưu? Expected: bộ tối ưu chỉ nhận các tham số head, nên các trọng số phần thân không bao giờ thay đổi.
- **Level 2:** Tại sao mean pooling và không phải trạng thái ẩn cuối? Expected: mean pooling với mask ổn định qua các độ dài và không cần token đặc biệt; last-token pooling phù hợp các mô hình decoder đã thấy mẫu đó.
- **Level 2:** Tại sao giữ phần chia kiểm thử phân tầng? Expected: một cân bằng lớp đã biết cho phép bạn đọc precision và recall như các con số trung thực.
- **Level 3:** Cập nhật đầy đủ đạt điểm thấp hơn lần chạy đóng băng trên dữ liệu này. Điều gì đã xảy ra? Expected: phần thân overfit tập nhỏ và mất cấu trúc pretrained; giảm learning rate phần thân, mở đóng băng ít block hơn, hoặc giữ head.

## Wrong answers

- "Huấn luyện một bộ phân loại mới từ đầu, mô hình dù sao cũng nhỏ." Phần thân pretrained đã encode danh tính từ, vị trí và đồng xuất hiện; một mô hình mới từ 800 ví dụ vứt điều đó đi.
- "Cập nhật mọi trọng số luôn chính xác hơn, nên làm vậy." Trên 800 ví dụ, nó nằm trong một vài điểm của lần chạy đóng băng và tốn thời gian huấn luyện khoảng gấp ba, với một rủi ro overfitting thực.
- "Báo cáo độ chính xác, các lớp cân bằng." Precision và recall cho bạn biết bạn mắc lỗi nào, và confusion matrix cho thấy số đếm phía sau điểm.

## Taught in

[Capstone fine-tuning bộ phân loại](../../../phases/19-capstone-projects/38-classifier-finetuning/) xây cả hai chế độ trên một vòng lặp huấn luyện và đọc precision, recall và F1 cho mỗi chế độ.
