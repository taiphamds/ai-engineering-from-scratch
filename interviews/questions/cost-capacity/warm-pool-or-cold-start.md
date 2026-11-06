---
id: warm-pool-or-cold-start
title: A warm replica all night, or a cold start at eight
card: cost-capacity
kind: tradeoff
level: 2
roles: [inference-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, ml-breadth]
tags: [cold-start, warm-pool, serverless, scale-to-zero]
minutes: 10
lessons: [phases/17-infrastructure-and-production/10-cold-start-mitigation]
manuals: [vllm-101#s-run-vllm-in-production]
practice: []
cheatsheet: [llm-cost-caching, serving-engines-compared]
related: [cost-capacity/batch-lane-triage]
updated: 2026-11-03
---

Endpoint serverless của bạn thu về không qua đêm. Request đầu tiên buổi sáng chờ nhiều phút trong khi một mô hình 70B nạp, và bộ phận sản phẩm muốn token đầu tiên trong vòng hai giây. Một kỹ sư muốn một replica không bao giờ ngủ. Người khác gọi đó là một GPU đốt tiền cả đêm. Phân định điều đó.

## Short answer

Cả hai đều đúng, và quyết định là phép tính theo từng đường. Một replica ấm tốn một giờ GPU mỗi giờ dù có ai gọi hay không, và nó loại bỏ một cold start vài phút cho một mô hình lớn. Một đường tương tác với một mục tiêu token đầu tiên chặt trên một mô hình lớn cần replica ấm, trong khi một mô hình nhỏ với cold start vài giây, hoặc một đường nền chịu được nhiều phút, thu về không. Rồi thu nhỏ chính cold start, để ít đường hơn cần một replica ấm.

## Full answer

### What a cold start is made of

Các phần cold start của bài học cho một mô hình 70B trên một node mới: cấp node 45 đến 60 giây, kéo image 120 đến 300 giây, trọng số vào bộ nhớ GPU 45 đến 120 giây, khởi tạo engine 10 đến 30 giây. Tổng là 220 đến 510 giây, tức 3 đến 8 phút trước một token. Tài liệu vLLM đo một phần của điều đó trên máy riêng của nó: 330 giây để nạp 57 GiB trọng số.

### The warm-pool arithmetic

Bài học gọi phép tính là khắc nghiệt trên các mô hình nhỏ và dễ chịu trên các mô hình lớn. Bạn trả 0.85 đến 1.50 đô la một giờ để tránh một lần khởi động 30 giây trên một mô hình nhỏ, và khoảng 4 đô la một giờ để tránh một lần khởi động 5 phút trên một mô hình lớn. Năm sản phẩm với mỗi sản phẩm một replica ấm là 3,600 giờ GPU một tháng, được gọi hay không. Ngưỡng của bài học: một warm pool trở thành bắt buộc khi mục tiêu token đầu tiên tại P99 dưới 60 giây trên một mô hình 70B hoặc hơn.

### Tier the paths

| Đường | Chính sách |
|---|---|
| chat trực tiếp, voice agent | một hoặc hai replica ấm |
| phân loại hằng đêm, batch | thu về không, một cold start nhiều phút là ổn |
| tenant cao cấp | năng lực ấm chuyên dụng |

### Shrink the cold start

Năm lớp, mỗi lớp loại bỏ một giai đoạn: một node image được chuẩn bị sẵn loại bỏ việc kéo image, model streaming giảm một nửa thời gian nạp trọng số, một snapshot bộ nhớ GPU khôi phục trạng thái đã nạp trong một phần nhỏ thời gian, các warm pool giấu phần còn lại, và nạp phân tầng giữ các trọng số trong bộ nhớ host. Bảng của bài học đưa một cold start 328 giây xuống khoảng 15 giây khi các lớp được kết hợp, giảm 22 lần. Tài liệu vLLM thêm nửa vận hành: giữ trọng số trên đĩa cục bộ, giữ compile cache trên một persistent volume, và đo một lần khởi động lạnh và một lần ấm cho mọi image mới.

## Follow-ups

- **Level 2:** Những đường nào nhận một replica ấm trước? Expected: các đường tương tác có một mục tiêu token đầu tiên chặt trên một mô hình lớn, chẳng hạn chat trực tiếp hoặc một voice agent.
- **Level 2:** Cold start của bên nào rẻ hơn để giấu, của một mô hình nhỏ hay một mô hình lớn? Expected: theo tỷ lệ, của mô hình lớn. Với một mô hình nhỏ bạn trả một giờ GPU đầy đủ để tránh vài giây, và với một mô hình lớn cùng giờ đó tránh nhiều phút.
- **Level 3:** Nêu hai biện pháp giảm thiểu loại bỏ cả các giai đoạn của cold start. Expected: một node image được chuẩn bị sẵn loại bỏ việc kéo image, và một snapshot bộ nhớ GPU loại bỏ phần lớn việc nạp trọng số và khởi tạo.
- **Level 3:** Tốc độ request hòa vốn cho một replica ấm là gì? Expected: rate mà trên đó chi phí của các cold start, tính bằng các request trượt mục tiêu, vượt giá theo giờ của GPU nhàn rỗi. Bộ mô phỏng của bài học tính nó.

## Wrong answers

- "Giữ một replica ấm ở mọi nơi, đó là câu trả lời đơn giản." Đó là một giờ GPU mỗi giờ cho mỗi sản phẩm. Năm sản phẩm nhàn rỗi cả đêm tốn hàng nghìn giờ GPU một tháng.
- "Thu về không ở mọi nơi và để người dùng đầu tiên chờ." Một lần chờ token đầu tiên nhiều phút trên một đường tương tác là một lần gián đoạn, không phải một lần chờ.
- "Một GPU lớn hơn nạp nhanh hơn." Việc nạp bị giới hạn bởi bộ lưu trữ và đường sao chép. Cách sửa là nơi các trọng số nằm và liệu một snapshot có tồn tại không.

## Taught in

[Bài học cold start](../../../phases/17-infrastructure-and-production/10-cold-start-mitigation/) đưa ra chi phí một replica ấm và năm lớp giảm thiểu, và [phần production của vLLM 101](../../../manuals/vllm-101/sections/7-2-run-vllm-in-production.md) đo việc nạp trọng số và giữ compile cache.
