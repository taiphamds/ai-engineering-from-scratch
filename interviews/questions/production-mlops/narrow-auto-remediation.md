---
id: narrow-auto-remediation
title: Which fixes an operations agent may run alone
card: production-mlops
kind: tradeoff
level: 3
roles: [ai-evaluation-reliability-engineer, inference-engineer]
rounds: [system-design, design-review]
tags: [ai-sre, auto-remediation, runbooks, human-approval]
minutes: 12
lessons: [phases/17-infrastructure-and-production/23-sre-for-ai]
manuals: []
practice: []
cheatsheet: [sre-for-ai]
related: [production-mlops/two-models-disagree, production-mlops/prediction-without-action]
updated: 2026-11-03
---

Một demo nhà cung cấp cho thấy một agent vận hành tự sửa các sự cố. Giám đốc của bạn hỏi bạn sẽ cho một agent như vậy thực hiện các hành động nào trên dịch vụ mô hình không có con người trong vòng lặp. Vạch ranh giới và bảo vệ nó.

## Short answer

Cho phép một tập hẹp được phê duyệt trước: khởi động lại một pod, hoàn nguyên một deployment được nêu tên, scale một pool trong các giới hạn được phê duyệt, và bật tắt một feature flag được phê duyệt. Giữ mọi thứ thay đổi hình dạng hệ thống sau một người: cấu trúc liên kết, giới hạn tài nguyên, mã mới, quyền truy cập và cơ sở dữ liệu. Agent đề xuất, một người phê duyệt các quyết định cần phán xét, và tập an toàn chỉ tăng khi agent xây một hồ sơ.

## Full answer

### The two sets

| An toàn, tự động | Không an toàn, chỉ con người |
|---|---|
| khởi động lại một pod | thay đổi cấu trúc liên kết dịch vụ |
| hoàn nguyên một deployment cụ thể | sửa đổi các giới hạn tài nguyên |
| scale một pool trong các giới hạn được phê duyệt trước | triển khai mã mới |
| bật một feature flag được phê duyệt trước | thay đổi quyền truy cập |
| | thay đổi một cơ sở dữ liệu |

### What makes an action safe

Nó đảo ngược được, phạm vi ảnh hưởng bị chặn trước, và nó khớp một bước trong một runbook do người viết. Sự cố ví dụ của bài học là một đợt tăng KV cache đẩy một engine phục vụ hết bộ nhớ. Khởi động lại pod xóa nó, và khởi động lại nằm trên danh sách an toàn. Tăng giới hạn bộ nhớ cũng có thể xóa nó, và thay đổi đó thay cách mọi pod chạy từ đó về sau, nên nó ở với một người.

### How an action earns automation

1. Viết runbook ở dạng có cấu trúc: triệu chứng, giả thuyết, xác minh, hành động.
2. Cho hành động một tiêu chí thành công và một bước xác minh chạy sau nó.
3. Ghi mọi đề xuất và mọi quyết định con người.
4. Nâng hành động từ đề xuất lên tự động sau một chuỗi sự cố nơi đề xuất khớp điều con người chọn.

### The approval gate stays

Kiến trúc là một supervisor trên các agent log, chỉ số và runbook, một giả thuyết có bằng chứng, một phê duyệt con người, và sau đó một hành động từ tập hẹp. Ngay cả khi hai mô hình độc lập đồng ý nguyên nhân, phê duyệt ở lại cho bất cứ thứ gì ngoài tập an toàn. Bài học nói thẳng về các nhà cung cấp bán một hệ thống không cần giám sát: họ đang quảng cáo quá mức.

## Follow-ups

- **Level 3:** Tại sao một scale-up trong giới hạn an toàn trong khi một thay đổi giới hạn tài nguyên không an toàn? Expected: các giới hạn được phê duyệt trước và hành động đảo ngược sạch. Một thay đổi giới hạn thay cách mọi pod chạy và có thể kích hoạt sự cố tiếp theo.
- **Level 3:** Điều gì phải đúng trước khi agent được chạy một hành động không giám sát? Expected: một runbook có cấu trúc, một bước xác minh với một tiêu chí thành công, một bản ghi kiểm toán, và một hồ sơ các đề xuất khớp quyết định con người.
- **Level 4:** Agent khởi động lại pod bận nhất trong một đợt tải tăng vì một probe thất bại. Điều đó có nằm trong quy tắc? Expected: hành động được phép và trigger sai. Một khởi động lại dưới tải bỏ các yêu cầu đang chạy, nên quy tắc cần một điều kiện về tải và loại probe, không chỉ về hành động.

## Wrong answers

- "Nếu agent đủ chính xác, để nó làm mọi thứ." Độ chính xác trên các sự cố trước không chặn thiệt hại của một hành động rộng sai.
- "Không tự động hóa đến khi agent hoàn hảo." Một khởi động lại và một hoàn nguyên an toàn hôm nay, và chúng loại bỏ phần đầu của phần lớn cuộc điều tra.
- "Một bước phê duyệt khiến agent vô dụng ban đêm." Agent vẫn làm điều tra. Con người phê duyệt một hành động được đề xuất thay vì bắt đầu từ dashboard.

## Taught in

[Bài học SRE cho AI](../../../phases/17-infrastructure-and-production/23-sre-for-ai/) vạch ranh giới giữa khắc phục hẹp và rộng và giữ cổng phê duyệt con người.
