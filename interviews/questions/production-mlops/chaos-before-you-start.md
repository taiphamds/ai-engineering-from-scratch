---
id: chaos-before-you-start
title: What must exist before the first chaos experiment
card: production-mlops
kind: concept
level: 1
roles: [ai-evaluation-reliability-engineer, inference-engineer]
rounds: [screen, system-design]
tags: [chaos-engineering, slo, runbooks, on-call]
minutes: 6
lessons: [phases/17-infrastructure-and-production/24-chaos-engineering-llm]
manuals: []
practice: []
cheatsheet: [sre-for-ai]
related: [production-mlops/budget-burn-pauses-chaos, production-mlops/rollback-without-redeploy]
updated: 2026-11-03
---

Một nhóm mới muốn chạy thí nghiệm chaos đầu tiên với dịch vụ mô hình vào tuần tới. Bạn kiểm tra có gì trước khi đồng ý, và điều gì sai khi thiếu một phần?

## Short answer

Năm thứ phải có sẵn: các chỉ báo mức dịch vụ có mục tiêu, khả năng quan sát với trace, chỉ số và log, một rollback tự động, các runbook có cấu trúc và một người phụ trách trực. Mỗi thứ cho phép bạn đo thí nghiệm, dừng nó hoặc sửa thiệt hại. Khi thiếu một thứ, thí nghiệm không phải một kiểm thử. Nó là một sự cố bạn đã lên lịch.

## Full answer

### The five prerequisites

1. **SLI và SLO.** Không có mục tiêu bạn không thể nói liệu thí nghiệm gây hại gì.
2. **Khả năng quan sát.** Trace, chỉ số và log trên một dashboard. Bạn phải thấy tác động trong khi nó xảy ra.
3. **Rollback tự động.** Rollback cờ policy từ bài học triển khai tiến dần. Một rollback cần triển khai lại quá chậm cho một thí nghiệm.
4. **Runbook.** Các phần có cấu trúc: triệu chứng, giả thuyết, xác minh, hành động. Người trực đọc chúng dưới áp lực.
5. **Trực vận hành.** Một người phản ứng khi thí nghiệm tìm thấy gì đó.

### The first experiments

Bắt đầu với một lần giết pod của một replica decode dưới lưu lượng đều, và quan sát định tuyến lại và phục hồi. Nếu điều đó trông an toàn, tiến đến chaos mạng. Thí nghiệm đầu tiên dành riêng mô hình là một nhà cung cấp trả về lỗi giới hạn tốc độ trong vài phút, để thấy fallback hoạt động. Phần lớn nhóm học ở đây rằng fallback chưa từng được kiểm thử đầy đủ.

### The cadence

Các thí nghiệm nhỏ hằng tuần trong staging hoặc trên một tỷ phần nhỏ production. Ngày diễn tập hằng tháng trên một kịch bản với phân tích sau sự cố. Kiểm toán xuyên nhóm hằng quý với một bản đồ phụ thuộc.

## Follow-ups

- **Level 1:** Thí nghiệm nào đi trước, và tại sao? Expected: giết một replica decode dưới lưu lượng đều, vì nó kiểm thử định tuyến lại và phục hồi với một phạm vi ảnh hưởng nhỏ.
- **Level 2:** Nêu một lỗi mà một công cụ chaos mạng tổng quát không thể tái tạo cho một dịch vụ mô hình. Expected: một bão loại bỏ KV cache dưới tải bùng phát, hoặc một prompt làm tokenizer khựng.
- **Level 2:** Tại sao rollback quan trọng hơn dashboard trong một thí nghiệm? Expected: dashboard cho thấy tác hại, và rollback dừng nó. Không có rollback, tác hại tiếp tục đến khi ai đó sửa bằng tay.
- **Level 3:** Nhóm chỉ muốn staging. Khi nào production là nơi đúng? Expected: khi staging không thể tái tạo hình dạng lưu lượng, trạng thái cache hoặc hành vi nhà cung cấp, và chỉ khi các biện pháp bảo vệ an toàn có sẵn.

## Wrong answers

- "Bỏ các điều kiện tiên quyết và học bằng làm." Không có SLO, rollback và người phụ trách trực, thí nghiệm là một gián đoạn bạn cố ý gây ra.
- "Một dashboard là khả năng quan sát." Chaos cần trace, chỉ số và log với tương quan trace-id, để bạn có thể phân biệt lỗi thí nghiệm với lỗi tự nhiên.
- "Chạy thí nghiệm lớn nhất trước để tìm rủi ro lớn nhất." Bắt đầu với một lần giết replica, rồi tăng phạm vi ảnh hưởng.

## Taught in

[Bài học chaos engineering](../../../phases/17-infrastructure-and-production/24-chaos-engineering-llm/) liệt kê năm điều kiện tiên quyết, bốn mặt phẳng và các thí nghiệm đầu.
