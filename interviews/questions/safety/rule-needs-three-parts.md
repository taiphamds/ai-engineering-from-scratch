---
id: rule-needs-three-parts
title: Constraints a classifier cannot see
card: safety
kind: design
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [rules-engine, constitution, predicates, fixer, yaml]
minutes: 9
lessons: [phases/19-capstone-projects/86-constitutional-rules-engine]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/output-router-severity]
updated: 2026-11-03
---

Một trợ lý hỗ trợ không bao giờ được kết thúc một lời từ chối mà không đưa ra một bước tiếp theo, và một trợ lý lập trình phải kết thúc mọi câu trả lời mã bằng một block chạy được hoặc một giả định được nêu. Không điều nào là thứ một bộ phân loại nội dung nhận ra. Thiết kế thành phần thực thi các ràng buộc như vậy, và nói điều xảy ra sau một vi phạm.

## Short answer

Đặt các ràng buộc này trong một file quy tắc khai báo nằm trong kiểm soát phiên bản cạnh mã và có lần review riêng. Mỗi quy tắc có một tên, một mức nghiêm trọng, một giải thích, một vị từ nói khi nào quy tắc nằm trong phạm vi và một vị từ mà phản hồi phải thỏa mãn, với các kiểm tra nguyên tử được kết hợp bằng all of, any of và not. Sau một vi phạm, một bộ sửa áp dụng một chỉnh sửa khai báo cục bộ, bộ máy kiểm tra lại bản sửa, và một diff có cấu trúc của hai phiên bản đi vào trace.

## Full answer

### Why not a classifier

Đây là các ràng buộc hợp đồng: các vị từ trên phản hồi, hội thoại và chính sách. Một người không phải kỹ sư nên có thể đọc chúng. Một bộ phân loại nhận ra các mẫu; một quy tắc nêu một hợp đồng.

### The rule shape

```yaml
- name: end-with-runnable-or-assumption
  severity: medium
  applies_when:
    contains_regex: '```python'
  must:
    any_of:
      - ends_with_regex: '```\s*$'
      - contains_regex: 'assumption:'
  explanation: "Code responses must end in a closing fence or an explicit assumption."
  fix:
    append_if_missing: "\n\nAssumption: example inputs are valid."
```

Các vị từ nguyên tử: chứa regex, không chứa regex, kết thúc bằng regex, bắt đầu bằng regex, số từ tối đa, số từ tối thiểu. Các tổ hợp: all of, any of, not. Bộ máy đánh giá vị từ phạm vi trước; nếu quy tắc không áp dụng, nó ghi không áp dụng, để báo cáo cho thấy quy tắc đã được đánh giá. Nếu không, vị từ must cho đạt hoặc vi phạm. Các mức nghiêm trọng là low, medium và high, và cổng xem một vi phạm quy tắc cao như một phán quyết bộ phân loại cao: chặn.

### The shipped constitution

Sáu quy tắc: một lời từ chối phải bao gồm một gợi ý hoặc một hướng chuyển; các phản hồi mã phải đóng gọn; dữ liệu ví dụ không được chứa email hoặc các dạng điện thoại; các dòng bắt đầu bằng một cụm trích dẫn phải mang một trích dẫn trong ngoặc; hai tên thư viện nội bộ không bao giờ được xuất hiện; các phản hồi không được vượt 800 từ. Hai quy tắc cuối trong năm quy tắc đầu là cao; phần còn lại là thấp hoặc trung bình.

### After a violation

Bộ sửa là một danh sách các thao tác khai báo được ánh xạ theo tên quy tắc: thêm cuối nếu thiếu, thêm đầu nếu thiếu, thay thế regex. Nó chỉ thực hiện các chỉnh sửa cục bộ; một lần viết lại cấu trúc thuộc một lớp riêng. Bộ máy chạy lại trên bản sửa, và một diff gồm các bản ghi thêm, xóa và chỉnh sửa giữa bản nháp và bản sửa được ghi nhật ký để một người review có thể kiểm toán bộ sửa theo thời gian.

## Follow-ups

- **Level 2:** Tại sao tách vị từ thành một phần phạm vi và một phần must? Expected: để một quy tắc có thể ngoài phạm vi và nói như vậy; một quy tắc mã trên một phản hồi không có mã ghi không áp dụng thay vì đạt, và báo cáo cho thấy bộ máy đã xem.
- **Level 2:** Tại sao file nằm trong YAML mà không trong mã? Expected: một người không phải kỹ sư có thể đọc và review nó, nó có review và lịch sử riêng, và bộ máy giữ tổng quát.
- **Level 3:** Bộ sửa không thể làm gì, và tại sao đó là một tính năng? Expected: các lần viết lại cấu trúc; các chỉnh sửa khai báo cục bộ giữ hành vi của nó có thể dự đoán và kiểm toán qua diff.
- **Level 3:** Cổng xử lý một vi phạm quy tắc mức nghiêm trọng cao như thế nào? Expected: giống một phán quyết bộ phân loại cao, đó là block.

## Wrong answers

- "Huấn luyện bộ phân loại để phát hiện các bước tiếp theo bị thiếu." Ràng buộc là một vị từ trên phản hồi; một quy tắc có giải thích là đọc được và kiểm thử được, còn một bộ phân loại thì không.
- "Để mô hình sửa vi phạm của chính nó." Bộ sửa là xác định để diff có thể được kiểm toán; một lần viết lại bằng mô hình thuộc một lớp riêng.
- "Một quy tắc là một regex." Một quy tắc là một tên, một vị từ và một giải thích; bất cứ thứ gì thiếu một trong ba chỉ là cảm giác.

## Taught in

[Capstone bộ máy quy tắc hiến pháp](../../../phases/19-capstone-projects/86-constitutional-rules-engine/) cung cấp ngữ pháp quy tắc, bộ sửa và diff.
