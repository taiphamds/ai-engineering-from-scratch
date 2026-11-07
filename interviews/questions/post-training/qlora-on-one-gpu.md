---
id: qlora-on-one-gpu
title: Fit a 7B fine-tune on a 24 GB GPU
card: post-training
kind: estimate
level: 2
roles: [applied-ai-engineer, inference-engineer]
rounds: [screen, system-design]
tags: [qlora, lora, gpu-memory, nf4, fine-tuning]
minutes: 10
lessons: [phases/11-llm-engineering/08-fine-tuning-lora]
manuals: []
practice: [lora-forward]
cheatsheet: [lora-fine-tuning, quantization]
related: [post-training/lora-parameter-count]
updated: 2026-11-03
---

Bạn có một GPU với 24 GB bộ nhớ và muốn fine-tune một mô hình 7B trên dữ liệu instruction riêng. Trình bày bộ nhớ cho một cập nhật đầy đủ, cho LoRA và cho QLoRA, và nói điều gì khiến loại cuối vừa.

## Short answer

Một cập nhật đầy đủ của một mô hình 7B cần khoảng 56 GB: trọng số ở half precision, các gradient, và hai trạng thái bộ tối ưu mỗi tham số, tất cả ở half precision. LoRA giữ các trọng số half-precision nhưng chỉ huấn luyện các adapter nhỏ, nên các gradient và trạng thái bộ tối ưu thu nhỏ và lần chạy chiếm khoảng 18 GB. QLoRA lưu bản nền đóng băng trong 4-bit, khoảng 3.5 GB trọng số, và huấn luyện các adapter ở half precision, nên lần chạy chiếm khoảng 6 GB và để lại chỗ cho activation trên một card 24 GB.

## Full answer

### The memory table

| Phương pháp | Trọng số | Tổng huấn luyện | Vừa trên |
|---|---|---|---|
| Cập nhật đầy đủ, FP16 | 14 GB | khoảng 56 GB trước activation, phụ thuộc workload | một GPU trung tâm dữ liệu 80 GB |
| LoRA trên bản nền FP16 | 14 GB | khoảng 18 GB | một GPU 40 GB |
| QLoRA, bản nền 4-bit | 3.5 GB | khoảng 6 GB | một GPU tiêu dùng 24 GB |

Con số 56 GB đến từ hai byte mỗi trọng số, hai byte mỗi gradient, và hai trạng thái bộ tối ưu mỗi tham số; activation đến thêm trên đó. Ước lượng này cũng giữ các trạng thái bộ tối ưu trong half precision. Adam tiêu chuẩn giữ các trạng thái trong FP32, nên một cập nhật đầy đủ điển hình cần nhiều bộ nhớ hơn như vậy, không phải ít hơn. Các adapter loại bỏ các gradient và trạng thái cho mọi trọng số đóng băng, là phần lớn.

### What QLoRA adds

1. NF4. Một kiểu 4-bit có 16 mức nằm ở các phân vị của một phân phối chuẩn, khớp cách trọng số được phân phối và mất ít hơn các số nguyên 4-bit đều.
2. Lượng tử hóa kép. Mỗi block 64 trọng số cần một scale trong FP32, khoảng 0.4 GB cho một mô hình 7B; lượng tử hóa các scale xuống 8 bit giảm nó xuống khoảng 0.1 GB.
3. Paged optimizer. Các trạng thái bộ tối ưu phân trang sang bộ nhớ CPU khi GPU hết chỗ, đánh đổi một ít thông lượng để không crash hết bộ nhớ do trạng thái bộ tối ưu. Activation ở lại trên GPU, nên một chuỗi dài vẫn có thể hết bộ nhớ.

### What it costs in quality

Bảng của bài học đặt LoRA ở rank 16 trong khoảng một điểm của một cập nhật đầy đủ, QLoRA ở rank 16 kém một phần điểm, và QLoRA ở rank 64 ngang cập nhật đầy đủ trên các benchmark được liệt kê.

### What it costs in time and money

Trên bảng chi phí của bài học, QLoRA ở rank 16 trên một card tiêu dùng 24 GB mất khoảng 6 giờ và khoảng 5 đô la cho 50,000 ví dụ qua ba epoch. Cập nhật đầy đủ mất khoảng 8 giờ trên hai GPU trung tâm dữ liệu 80 GB và khoảng 32 đô la. Các kernel hợp nhất giảm lần chạy QLoRA xuống khoảng 2.5 giờ.

## Follow-ups

- **Level 2:** Tại sao LoRA giảm bộ nhớ huấn luyện nhiều hơn bộ nhớ trọng số rất nhiều? Expected: các gradient và hai trạng thái bộ tối ưu chỉ tồn tại cho các tham số adapter, là một phần của một phần trăm mô hình.
- **Level 2:** Các adapter huấn luyện ở half precision trong khi bản nền là 4-bit. Lượt forward tính ở đâu? Expected: các trọng số nền được giải lượng tử từng block về compute dtype cho mỗi tích ma trận, và đường adapter chạy ở half precision.
- **Level 3:** Khi nào bạn vẫn trả cho cập nhật đầy đủ? Expected: khi tác vụ cần các thay đổi mà một cập nhật rank thấp không thể diễn đạt, khi bạn có dữ liệu và GPU, hoặc khi đánh giá cho thấy một khoảng cách mà rank cao hơn không khép.
- **Level 3:** Bạn phục vụ nhiều bản fine-tune QLoRA từ một bản nền như thế nào? Expected: giữ các adapter riêng và nạp chúng trên một bản sao nền; chỉ merge khi bạn phát hành một mô hình chuyên biệt duy nhất.

## Wrong answers

- "Lượng tử hóa toàn bộ mô hình thành 4-bit và fine-tune trực tiếp nó." Các gradient và trạng thái bộ tối ưu vẫn cần precision cao hơn; bản nền giữ đóng băng trong 4-bit, và chỉ các adapter huấn luyện.
- "QLoRA giảm một nửa chất lượng." Bảng của bài học cho thấy mất một phần của một điểm ở rank 16 và ngang bằng ở rank 64.
- "Nạp bản nền trong 8-bit với LoRA; đó là cùng một thứ." Trọng số tám bit chiếm bộ nhớ gấp đôi NF4, và lượng tử hóa kép cùng paged optimizer là những gì tạo con số 6 GB.

## Taught in

[Bài học LoRA](../../../phases/11-llm-engineering/08-fine-tuning-lora/) đưa ra các bảng bộ nhớ và chi phí và giải thích NF4, lượng tử hóa kép và paged optimizer.
