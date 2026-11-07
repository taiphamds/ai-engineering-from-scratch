---
id: finetune-pipeline-design
title: One command from raw data to a served tuned model
card: system-design
kind: design
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design]
tags: [fine-tuning, sft, dpo, quantization, speculative-decoding]
minutes: 25
lessons: [phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline, phases/10-llms-from-scratch/13-building-complete-llm-pipeline]
manuals: []
practice: []
cheatsheet: [lora-fine-tuning, rlhf-dpo, llm-pipeline-capstone]
related: [system-design/eval-platform-ship-gate, system-design/pipeline-rollback-plan, system-design/classifier-head-swap-choice]
updated: 2026-11-03
---

Một nhóm muốn thích nghi một mô hình mở trong lớp 8B với lĩnh vực riêng và phục vụ nó ở một chi phí đo được mỗi triệu token. Thiết kế pipeline để một lệnh chạy nó đầu cuối: các giai đoạn, phần cứng theo từng giai đoạn, vệ sinh dữ liệu, các ablation bạn yêu cầu, các phép đo phục vụ, và những gì bản phát hành phải bao gồm.

## Short answer

Năm giai đoạn, mỗi giai đoạn có một file cấu hình trong kiểm soát phiên bản: chuẩn bị dữ liệu với khử trùng lặp, một bộ lọc chất lượng, làm sạch dữ liệu cá nhân và một kiểm tra nhiễm bẩn theo các tập đánh giá; fine-tuning có giám sát trong 2-3 epoch trên 8xH100 với một lịch cosine và các chuỗi được đóng gói; một epoch tinh chỉnh sở thích trên 4xH100 với beta được quét; lượng tử hóa thành ba định dạng; và phục vụ với các draft head suy đoán và tự động mở rộng theo thời gian chờ hàng đợi. Sản phẩm bàn giao là một bảng ablation gồm cơ sở, chỉ SFT, SFT cộng DPO và SFT cộng GRPO trên các benchmark tác vụ, các con số phục vụ ở batch 1, 8 và 32 với tỷ lệ chấp nhận draft và chi phí mỗi triệu token, một tỷ lệ an toàn đạt, và một model card với seed, cấu hình và hash commit.

## Full answer

### Stages and hardware

| Giai đoạn | Nội dung | Phần cứng trong capstone |
|---|---|---|
| Dữ liệu | Khử trùng lặp, lọc chất lượng, làm sạch dữ liệu cá nhân, tách với một seed | CPU |
| Kiểm tra nhiễm bẩn | Băm gần trùng lặp mọi phần tách validation theo các tập kiểm thử công khai; từ chối chồng lấn | CPU |
| SFT | Bộ tối ưu được chia shard, các kernel attention nhanh, các chuỗi được đóng gói, 2-3 epoch | 8xH100 |
| Tinh chỉnh sở thích | Một epoch DPO trên các cặp, hoặc GRPO với một phần thưởng xác minh được; quét beta | 4xH100 |
| Lượng tử hóa | Ba định dạng để linh hoạt triển khai; ghi kích thước và thông lượng | Một GPU |
| Phục vụ | Các draft head để suy đoán, tự động mở rộng theo thời gian chờ hàng đợi | Các GPU phục vụ |
| Đánh giá và card | Ma trận benchmark, đánh giá an toàn, model card | CPU cùng GPU đánh giá |

Trong lần chạy ví dụ của capstone, giai đoạn dữ liệu giữ 280k trong 300k ví dụ, SFT mất 6h12m và chuyển loss validation từ 1.42 tới 1.03, DPO chạy 1h40m ở beta 0.08, các trọng số được lượng tử hóa là 4.6 GB, và phục vụ cho thấy một tỷ lệ chấp nhận draft 0.74 với p99 126ms ở batch 8.

### Hygiene is a gate, not a step

Kiểm tra nhiễm bẩn chạy trước huấn luyện và làm pipeline thất bại khi có chồng lấn. Bài tập của capstone làm rò rỉ một tỷ lệ nhỏ câu trả lời kiểm thử vào huấn luyện và theo dõi một benchmark nhảy lên phi thực tế; kiểm tra là điều khiến chênh lệch đánh giá đáng tin. Bài học pipeline thêm cơ chế: một manifest với một hash đầu vào và đầu ra mỗi giai đoạn, để giai đoạn SFT từ chối dữ liệu không khớp hash mà kiểm tra nhiễm bẩn đã phê duyệt.

### Ablations are the deliverable

Câu hỏi mà pipeline trả lời không phải liệu mô hình tốt hơn mà là giai đoạn nào đã trả cho điều đó. Chạy ma trận đánh giá trên cơ sở, trên chỉ SFT, trên SFT cộng DPO và trên SFT cộng GRPO. Ví dụ báo cáo các mức tăng +3.2 trên một benchmark và +0.41 trên một benchmark khác sau lần chạy đầy đủ. Không có ablation, một suy giảm từ tinh chỉnh sở thích giấu sau mức tăng SFT.

### Serving measurements

Token mỗi giây ở các kích thước batch 1, 8 và 32, tỷ lệ chấp nhận của các draft head, và chi phí cho mỗi triệu token so với một lựa chọn được lưu trữ ở chất lượng tương ứng. Sự chấp nhận được đo trên dữ liệu lĩnh vực, không phải chat chung, vì các draft head đã được huấn luyện cho lĩnh vực và ngân sách độ trễ phụ thuộc vào nó.

### The release

Một model card với các nguồn dữ liệu và giấy phép, các cấu hình huấn luyện, ma trận đánh giá, tỷ lệ an toàn đạt, một phần tái lập với các seed và hash commit, và các chênh lệch lượng tử hóa. Một lệnh chạy lại pipeline với các seed giống hệt; rubric đặt trọng số tính tái lập và vệ sinh dữ liệu nặng ngang mức tăng đánh giá.

## Follow-ups

- **Level 3:** Tại sao tinh chỉnh sở thích cần ít GPU hơn SFT? Expected: nó chạy một epoch trên một tập cặp nhỏ hơn nhiều, và capstone định cỡ nó ở một nửa phần cứng SFT.
- **Level 3:** Giai đoạn nào được chạy lại khi đánh giá an toàn thất bại trên mô hình được lượng tử hóa? Expected: chỉ lượng tử hóa và phục vụ; rollback của bài học pipeline vô hiệu hóa giai đoạn thất bại và các hậu duệ.
- **Level 4:** Tỷ lệ chấp nhận trên lưu lượng lĩnh vực thấp xa so với con số từ dữ liệu chat chung. Điều đó làm gì với thiết kế? Expected: ngân sách độ trễ được đặt trên sai con số; huấn luyện lại các draft head trên dữ liệu lĩnh vực hoặc định cỡ phục vụ không có lợi ích suy đoán.
- **Level 4:** Một mô hình nhỏ hơn với một adapter hạng thấp khớp chất lượng ở một phần mười bộ nhớ. Pipeline thay đổi như thế nào? Expected: giai đoạn SFT đổi sang huấn luyện adapter với cùng dữ liệu và các cổng đánh giá, và các giai đoạn lượng tử hóa và phục vụ tiêu thụ các trọng số đã gộp không đổi.

## Wrong answers

- "Bỏ kiểm tra nhiễm bẩn; dữ liệu là nội bộ." Dữ liệu nội bộ sao chép văn bản công khai mọi lúc, và một tập kiểm thử bị rò rỉ khiến toàn bộ bảng đánh giá vô nghĩa.
- "Báo cáo mô hình cuối so với cơ sở rồi dừng." Không có ablation theo từng giai đoạn, không ai biết liệu tinh chỉnh sở thích đã giúp hay gây hại.
- "Chỉ đo phục vụ ở batch một." Thông lượng và chi phí mỗi triệu token đến từ giải mã theo batch; batch một đo độ trễ, không phải kinh tế.

## Taught in

[Capstone fine-tuning đầu cuối](../../../phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline/) cung cấp năm giai đoạn, phần cứng, lần chạy ví dụ và rubric, và [bài học pipeline LLM hoàn chỉnh](../../../phases/10-llms-from-scratch/13-building-complete-llm-pipeline/) cung cấp manifest, chuỗi hash và tập rollback.
