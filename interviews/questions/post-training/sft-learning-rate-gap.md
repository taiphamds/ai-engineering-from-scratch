---
id: sft-learning-rate-gap
title: Reusing the pretraining learning rate for SFT
card: post-training
kind: concept
level: 2
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, debugging]
tags: [sft, learning-rate, catastrophic-forgetting, epochs]
minutes: 8
lessons: [phases/10-llms-from-scratch/06-instruction-tuning-sft]
manuals: []
practice: []
cheatsheet: [llm-pipeline-capstone]
related: [post-training/sft-data-quality-wins]
updated: 2026-11-03
---

Một đồng nghiệp sao chép cấu hình pretraining vào một lần chạy SFT: cùng learning rate đỉnh, cùng warmup, ba epoch trên 27,000 ví dụ. Loss trên tập SFT giảm nhanh và mọi người vui. Bạn kỳ vọng thấy gì khi kiểm thử mô hình, và bạn thay đổi gì?

## Short answer

Kỳ vọng quên thảm họa: mô hình trả lời theo định dạng huấn luyện, nhưng loss trên văn bản thô tăng và nó kém hơn ở mã, toán và mọi thứ ngoài tập. Pretraining dùng rate đỉnh cao hơn khoảng mười lăm lần giá trị SFT trong bài học, 3e-4 so với 2e-5. Giảm rate vào khoảng 1e-5 đến 5e-5, giữ một đến ba epoch, và theo dõi raw-text loss cạnh SFT loss.

## Full answer

### Two very different regimes

| Thiết lập | Pretraining | SFT |
|---|---|---|
| Learning rate đỉnh | 3e-4 | 2e-5 |
| Epoch | 1 | 2 |
| Các bước warmup | 2,000 | 0 đến 100 |
| Dữ liệu | 2T token | 27,000 ví dụ |

Lần chạy SFT điều chỉnh một mô hình đã hoạt động. Một bước lớn ghi đè các đặc trưng pretrained bằng các mẫu của một tập nhỏ.

### How to see the damage

Giữ lại một phần văn bản thô và đo next-token loss trước và sau SFT. Quy tắc của bài học: tăng hơn 10 đến 15 phần trăm có nghĩa lần chạy quá mạnh. Giảm rate hoặc epoch. Cũng chạy một đánh giá nhỏ trên các tác vụ ngoài tập SFT.

### Three mitigations

1. Một learning rate thấp, 1e-5 đến 5e-5.
2. Huấn luyện ngắn, 1 đến 3 epoch. Hơn 3 epoch trên một tập nhỏ dẫn đến ghi nhớ, và mô hình lặp các ví dụ huấn luyện từng từ.
3. Một hỗn hợp 2 đến 5 phần trăm văn bản pretraining thô trong các batch SFT, không có mask, để mô hình giữ khả năng chung.

### Why the loss curve misleads

Một mức giảm nhanh trong SFT loss ở rate cao là overfit tập, không phải học. Bài tập của bài học so sánh 1e-4, 2e-5 và 1e-6: rate cao giảm nhanh và kết thúc cao hơn, rate thấp hầu như không thay đổi, và giá trị giữa là điểm tối ưu.

## Follow-ups

- **Level 2:** Tại sao một rate hoạt động cho pretraining phá một lần chạy SFT? Expected: pretraining bắt đầu từ nhiễu và lấy trung bình trên hàng nghìn tỷ token; SFT bắt đầu từ một mô hình hoạt động và một tập nhỏ, nên mỗi bước lớn ghi đè các đặc trưng tập không bao phủ.
- **Level 2:** Bao nhiêu epoch, và bạn quyết định như thế nào? Expected: một đến ba; dừng khi instruction loss giữ lại ngừng cải thiện và raw-text loss chưa tăng qua ngân sách.
- **Level 3:** Raw-text loss tăng một phần tư, nhưng nhóm sản phẩm thích các câu trả lời. Triển khai? Expected: không ở trạng thái đó; mô hình mất khả năng chung mà người dùng sẽ chạm đến; chạy lại với rate thấp hơn hoặc một hỗn hợp pretraining và so sánh trên một đánh giá ngoài tập.
- **Level 3:** LoRA thay đổi bức tranh này như thế nào? Expected: các trọng số nền giữ đóng băng, nên thiệt hại bị chặn trong adapter và một merge có thể đảo ngược; adapter cũng chịu được rate cao hơn một cập nhật đầy đủ.

## Wrong answers

- "SFT loss đã giảm, nên lần chạy hoạt động." Loss trên tập không nói gì về những gì mô hình quên; đo raw-text loss và một đánh giá ngoài tập.
- "Warm up trong 2,000 bước, như pretraining." Tập SFT cho ít tổng bước; bài học dùng 0 đến 100 bước warmup.
- "Dùng rate cao hơn để xong nhanh hơn, dữ liệu nhỏ." Một rate cao trên một tập nhỏ overfit và ghi đè tri thức pretrained; dữ liệu nhỏ cần các bước nhỏ hơn, không phải lớn hơn.

## Taught in

[Bài học SFT](../../../phases/10-llms-from-scratch/06-instruction-tuning-sft/) so sánh các siêu tham số pretraining và SFT và đo quên bằng một raw-text loss.
