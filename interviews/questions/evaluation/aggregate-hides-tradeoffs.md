---
id: aggregate-hides-tradeoffs
title: The leaderboard winner is worst on code
card: evaluation
kind: tradeoff
level: 4
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [design-review, system-design]
tags: [aggregation, weights, per-category, leaderboard]
minutes: 10
lessons: [phases/19-capstone-projects/41-eval-pipeline, phases/19-capstone-projects/74-leaderboard-aggregation, phases/05-nlp-foundations-to-advanced/28-long-context-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/paired-difference-interval, evaluation/eval-pipeline-take-home]
updated: 2026-11-03
---

Một bảng xếp hạng xếp các mô hình ứng viên của bạn theo một điểm tổng hợp, và mô hình đứng đầu thắng với một khoảng cách nhỏ. Một đồng nghiệp trong nhóm mã nguồn nói mô hình đứng đầu là mô hình tệ nhất trong ba mô hình trên công việc của họ. Cả hai đọc cùng báo cáo. Điều này có thể xảy ra như thế nào, điểm tổng hợp che giấu điều gì, và bạn công bố như thế nào để phục vụ cả hai người đọc?

## Short answer

Điểm tổng hợp là một trung bình có trọng số, vì vậy một mô hình có thể thắng tổng thể và thua trong một hạng mục, và một khoảng cách nhỏ có thể nằm trong khoảng của trung bình. Công bố các trung bình theo hạng mục cạnh điểm tổng hợp, với các khoảng, và in các trọng số. Nếu bảng xếp hạng cũng trộn các thang đo, một nhiệm vụ có phạm vi rộng hơn chi phối trung bình mà không ai nhận ra.

## Full answer

### Where the aggregate comes from

Pipeline đánh giá chuẩn hóa mỗi đánh giá vào khoảng đơn vị và lấy một trung bình có trọng số; cơ cấu mặc định ở đó là 0.2 cho perplexity, 0.3 cho exact match, 0.3 cho token F1 và 0.2 cho bộ chấm. Bộ tổng hợp trong bài học bảng xếp hạng lấy trung bình thông thường trên các nhiệm vụ. Trong cả hai trường hợp con số nổi bật là một cách gán trọng số cho nhiều con số, và một cách gán trọng số khác là một người thắng khác.

### What it hides

- **Điểm yếu theo hạng mục.** Cột theo hạng mục, chẳng hạn toán, suy luận, mã nguồn và an toàn, là nơi duy nhất một mô hình mạnh tổng thể và yếu về mã nguồn hiện ra.
- **Mất cân bằng nhiệm vụ và ngoại lệ.** Trung bình nhạy cảm với cả hai; tỷ lệ thắng ít nhạy cảm hơn và mất độ lớn.
- **Rò rỉ thang đo.** Một nhiệm vụ chấm từ 0 đến 100 cạnh các nhiệm vụ trong khoảng đơn vị chi phối trung bình, vì vậy bộ tổng hợp từ chối các điểm ngoài khoảng đơn vị.
- **Khoảng cách.** Một khoảng cách nhỏ giữa hai mô hình đứng đầu không có nghĩa gì cho đến khi bootstrap ghép cặp của chênh lệch theo nhiệm vụ của chúng loại trừ không.

Bài học ngữ cảnh dài nêu cùng quy tắc từ một góc khác: báo cáo độ chính xác theo hạng mục, vì các điểm tổng hợp che giấu các khác biệt lớn ở cấp nhiệm vụ.

### How to publish

Ba lớp trên một trang. Điểm tổng hợp ở đầu với các trọng số được in. Bên dưới nó, mọi con số theo đánh giá hoặc theo hạng mục với các khoảng và tỷ lệ thắng. Bên dưới nữa, các bản ghi theo ví dụ mà một người rà soát cần để truy tìm một sự thoái lui. Thêm khoảng chênh lệch ghép cặp cho hai mô hình đứng đầu, và nếu một hạng mục quan trọng với sản phẩm, một quy tắc chặn trên hạng mục đó.

## Follow-ups

- **Level 3:** Nhóm mã nguồn muốn hạng mục mã nguồn được tính gấp đôi. Bạn có thay đổi con số nổi bật không? Expected: không; giữ bảng không trọng số và, nếu được thống nhất, thêm một chế độ xem có trọng số thứ hai với các trọng số được in, vì capstone để việc gán trọng số là một điểm mở rộng tường minh.
- **Level 3:** Hai trung bình đứng đầu khác nhau ít hơn các khoảng của chúng. Bảng xếp hạng cho thấy gì? Expected: bootstrap ghép cặp của chênh lệch theo nhiệm vụ; nếu nó chứa không thì hai mô hình hòa và thứ tự xếp hạng là một lần tung đồng xu.
- **Level 4:** Thay đổi đơn lẻ nào cho báo cáo đã có thể ngăn cuộc tranh luận này? Expected: các trung bình theo hạng mục với các khoảng dưới con số nổi bật, để điểm yếu mã nguồn hiện rõ trên cùng trang.

## Wrong answers

- "Điểm tổng hợp là câu trả lời khách quan." Nó là câu trả lời cho một cách gán trọng số; một cách gán trọng số khác là một người thắng khác.
- "Bỏ điểm tổng hợp và chỉ hiển thị các hạng mục." Con số nổi bật tồn tại để mọi người có thể quyết định; giữ nó, gắn nhãn các trọng số và đặt các hạng mục dưới nó.
- "Thay vào đó xếp hạng theo tỷ lệ thắng." Tỷ lệ thắng che giấu độ lớn; công bố cả hai và khoảng ghép cặp.

## Taught in

[Capstone pipeline đánh giá](../../../phases/19-capstone-projects/41-eval-pipeline/) cho thấy ba lớp của một báo cáo và điểm tổng hợp có trọng số, [capstone tổng hợp bảng xếp hạng](../../../phases/19-capstone-projects/74-leaderboard-aggregation/) thêm các hạng mục và khoảng, và [bài học đánh giá ngữ cảnh dài](../../../phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/) cảnh báo rằng một điểm tổng hợp che giấu điều mỗi loại nhiệm vụ làm.
