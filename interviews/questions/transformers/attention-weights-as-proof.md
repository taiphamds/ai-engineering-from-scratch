---
id: attention-weights-as-proof
title: A heatmap is not an explanation
card: transformers
kind: concept
level: 3
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, inference-engineer]
rounds: [ml-depth, design-review]
tags: [interpretability, attention-weights, ablation, induction-heads, probing]
minutes: 10
lessons: [phases/05-nlp-foundations-to-advanced/10-attention-mechanism, phases/07-transformers-deep-dive/03-multi-head-attention, phases/19-capstone-projects/33-multihead-self-attention]
manuals: []
practice: []
cheatsheet: [transformers-attention]
related: [transformers/heads-are-nearly-free]
updated: 2026-11-03
---

Một bản thảo bài báo cho thấy các heatmap attention như bằng chứng rằng mô hình "suy luận trên các token đúng". Bạn là người review. Bạn nói gì về các heatmap, và điều gì sẽ thuyết phục bạn rằng một head cụ thể làm một việc cụ thể?

## Short answer

Các trọng số attention là một phân phối trên các vị trí, và riêng chúng không phải một giải thích: với một số tác vụ chúng có thể được hoán vị hoặc thay bằng các lựa chọn tùy ý mà không thay dự đoán, nên một heatmap cho thấy khối xác suất đã đi đâu, không phải rằng nó quan trọng. Yêu cầu một ablation hoặc một phản thực, đặt head về không hoặc xáo trộn và cho thấy dự đoán dịch chuyển. Các vai trò head đã sống sót qua probing là cụ thể và kiểm thử được: các head chú ý tới token trước, các copy head, và các induction head tìm một lần xuất hiện trước của token hiện tại và sao chép thứ theo sau nó.

## Full answer

### The caveat from the literature

Một nghiên cứu năm 2019 cho thấy trên một số tác vụ phân phối attention có thể được hoán vị, hoặc thay bằng một lựa chọn đối kháng, trong khi đầu ra giữ nguyên. Quy tắc của bài học theo đó: không bao giờ báo cáo các trọng số attention như bằng chứng suy luận nếu không có một ablation hoặc kiểm tra phản thực. Người review thích heatmap vì chúng dễ đọc; đó là một lý do để cẩn thận, không phải lý do để chấp nhận.

### What a head can show you

Hook kiểm tra trong block của bài học trả về các trọng số theo từng head có shape `(B, H, T, T)`. Trong một mô hình đã huấn luyện, các mẫu khác theo head: một số chú ý tới token ngay trước, một số tới đầu chuỗi, một số trải gần đồng đều. Đó là các mô tả. Biến một mô tả thành một khẳng định cần một can thiệp.

### The evidence that convinces

1. **Ablation.** Đặt đầu ra head về không hoặc thay các trọng số bằng một dòng đồng đều và đo thay đổi loss hoặc dự đoán cụ thể. Một head quan trọng làm con số dịch chuyển.
2. **Đầu vào phản thực.** Thay token mà heatmap chỉ vào và cho thấy đầu ra thay đổi theo hướng câu chuyện dự đoán.
3. **Một kiểm thử hành vi cho vai trò được khẳng định.** Với một induction head, đưa một chuỗi token ngẫu nhiên lặp hai lần và cho thấy head chú ý từ mỗi token tới token theo sau lần xuất hiện đầu của nó, và rằng ablation head loại việc sao chép.
4. **Tái lập qua các seed và prompt.** Một heatmap trên một ví dụ là một giai thoại.

### What to write in the review

Yêu cầu các tác giả giữ heatmap làm minh họa và thêm các kết quả can thiệp làm bằng chứng. Nếu ablation không làm dự đoán dịch chuyển, heatmap chỉ là trang trí.

## Follow-ups

- **Level 3:** Một head chú ý gần đồng đều qua các vị trí. Điều đó cho bạn biết gì? Expected: ít khi đứng riêng; nó có thể mang một trung bình hoặc không gì, và chỉ một ablation nói cái nào.
- **Level 3:** Mô tả một kiểm thử cho một induction head trong một câu. Expected: lặp một chuỗi token ngẫu nhiên và kiểm tra head chú ý từ mỗi token tới token sau lần xuất hiện trước, với ablation loại hành vi sao chép.
- **Level 4:** Tại sao các trọng số có thể được hoán vị mà không thay đầu ra? Expected: các value ở các vị trí được chú ý có thể mang thông tin gần giống hệt, các head khác có thể dư thừa, và các lớp sau có thể bù.
- **Level 4:** Điều gì thay heatmap làm hình chính? Expected: thay đổi loss hoặc xác suất mục tiêu dưới ablation và các chỉnh sửa phản thực, với một dải qua các seed.

## Wrong answers

- "Một trọng số cao nghĩa là token gây ra đầu ra." Trọng số cho thấy phép tra đã đi đâu; quan hệ nhân quả cần một can thiệp.
- "Lấy trung bình các head để có attention của mô hình." Các head làm những việc khác nhau; trung bình giấu các vai trò và vẫn không phải bằng chứng.
- "Nếu heatmap khớp trực giác con người, mô hình suy luận như con người." Đồng ý với trực giác không phải một kiểm thử; kết quả hoán vị cho thấy các bản đồ trực quan có thể không liên quan tới đầu ra.

## Taught in

[Bài học cơ chế attention](../../../phases/05-nlp-foundations-to-advanced/10-attention-mechanism/) nêu bẫy giải thích, [bài học multi-head](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) liệt kê các vai trò head được probe, và [capstone attention](../../../phases/19-capstone-projects/33-multihead-self-attention/) cung cấp các trọng số để kiểm tra.
