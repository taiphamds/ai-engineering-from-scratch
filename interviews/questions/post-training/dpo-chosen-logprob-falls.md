---
id: dpo-chosen-logprob-falls
title: Margin up, chosen answers down, in a DPO run
card: post-training
kind: debug
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [dpo, degraded-chosen, over-optimization, length-bias]
minutes: 12
lessons: [phases/18-ethics-safety-alignment/03-direct-preference-optimization-family, phases/19-capstone-projects/40-dpo-from-scratch, phases/10-llms-from-scratch/08-dpo]
manuals: []
practice: [dpo-loss]
cheatsheet: [alignment-training, rlhf-dpo]
related: [post-training/dpo-implicit-reward]
updated: 2026-11-03
---

Trong một lần chạy DPO, loss giảm và reward margin trainer ghi log tăng mỗi epoch. Tuy nhiên các mẫu của mô hình ngắn hơn và kém trôi chảy hơn, và policy giờ cho các câu trả lời huấn luyện chosen một xác suất thấp hơn chúng có dưới reference. Giải thích cơ chế và những gì bạn thay đổi.

## Short answer

DPO loss chỉ quan tâm hiệu của hai tỷ số log. Nó có thể giảm xác suất câu trả lời chosen miễn là câu trả lời rejected giảm nhanh hơn, và margin vẫn tăng. Đây là lỗi phản hồi chosen suy giảm: policy chuyển khối lượng xác suất xa cả hai câu trả lời huấn luyện, thường về các đầu ra suy biến ngắn. Ghi log log xác suất chosen tuyệt đối, thêm một hình phạt trên các di chuyển xuống của số hạng chosen như biến thể bảo tồn hành vi làm hoặc chuyển sang một loss có margin bị chặn, và giữ một đánh giá sinh cạnh margin.

## Full answer

### Why the margin can lie

Gradient DPO đẩy tỷ số log chosen lên và tỷ số log rejected xuống, nhưng chỉ hiệu của chúng đi vào loss. Nếu các câu trả lời rejected dễ kìm xuống, cách rẻ nhất để tăng margin là kìm chúng mạnh trong khi các câu trả lời chosen cũng trôi xuống. Khoảng cách reward ngầm cũng không bị chặn: một preference yếu có thể tạo một khoảng cách lớn tùy ý. Không gì trong loss yêu cầu policy tiếp tục sinh các câu trả lời chosen.

### What you log

- Log xác suất chosen tuyệt đối dưới policy, mỗi epoch, cạnh margin. Hàm margin của capstone báo cáo hiệu; thêm riêng số hạng chosen.
- Độ dài mẫu và một đánh giá sinh nhỏ. Một margin tăng trong khi các mẫu suy giảm là dấu hiệu.
- KL đến reference. Di chuyển xa cả hai câu trả lời xuất hiện như một khoảng cách tăng.

### The fixes

1. Một hình phạt trên các di chuyển xuống của log xác suất chosen. Biến thể bảo tồn hành vi của họ thêm một hiệu chỉnh đó và báo cáo một mức tăng so với DPO thông thường trên các tác vụ suy luận.
2. Một margin bị chặn. Biến thể ánh xạ đồng nhất thay log sigmoid bằng một sai số bình phương trên một mục tiêu một chia hai beta, để khoảng cách và độ mạnh preference giữ tỷ lệ.
3. Một beta thận trọng và early stopping, được chọn theo một đánh giá sinh, không phải theo margin huấn luyện.
4. Các cặp tốt hơn. Các cặp mà cả hai câu trả lời hiếm dưới reference tạo reward ngầm tùy ý; lọc chúng.

### Why this is still over-optimization

Các phương pháp direct alignment loại bỏ reward model tường minh, không phải proxy. Đại lượng chúng tối ưu là một tỷ số đối chiếu reference, và tỷ số đó có thể bị đẩy đến những nơi dữ liệu preference chưa bao giờ bao phủ. Cùng đường cong đỉnh-rồi-sụp mà reward model cho thấy xuất hiện ở đây qua các ngân sách KL.

## Follow-ups

- **Level 3:** Tại sao độ dài quan trọng trong lỗi này? Expected: một câu trả lời rejected dài có tổng log xác suất âm hơn theo cấu tạo, nên kìm nó xuống rẻ và khoảng cách tăng vì lý do sai; chuẩn hóa độ dài loại bỏ động cơ đó.
- **Level 3:** Một loss không có reference, chuẩn hóa độ dài thay đổi bức tranh như thế nào? Expected: nó chấm log xác suất trung bình mỗi token với một margin, loại bỏ bias độ dài và reference, nhưng nó cũng loại bỏ neo, nên sự trôi cần biện pháp bảo vệ riêng.
- **Level 4:** Bạn chọn biến thể nào khi các độ mạnh preference thay đổi rộng giữa các cặp? Expected: biến thể bị chặn; nó giữ khoảng cách tỷ lệ với preference, nên các cặp mạnh không bão hòa loss và các cặp yếu không bùng nổ.
- **Level 4:** Một beta thấp hơn có giúp ở đây không? Expected: không; một beta thấp hơn để policy di chuyển xa reference hơn cho cùng margin, khiến suy giảm tệ hơn.

## Wrong answers

- "Margin tăng, nên huấn luyện hoạt động; các mẫu là một vấn đề decoding." Margin có thể tăng trong khi cả hai câu trả lời mất xác suất; đánh giá sinh là mục tiêu, không phải margin.
- "Tăng beta đến khi các mẫu phục hồi." Một beta cao hơn làm chậm sự trôi nhưng không thay hướng gradient trên số hạng chosen; hình phạt trên số hạng đó thì có.
- "Huấn luyện thêm epoch; xác suất chosen sẽ trở lại." Loss không có số hạng tự nó thưởng xác suất chosen cao hơn, nên thêm epoch đẩy xa hơn cùng hướng.

## Taught in

[Bài học họ DPO](../../../phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/) nêu lỗi câu trả lời chosen này và các biến thể sửa nó, và [capstone DPO](../../../phases/19-capstone-projects/40-dpo-from-scratch/) suy ra gradient đẩy chosen lên và rejected xuống.
