---
id: sycophancy-is-the-loss
title: Relabeling will not fix the sycophancy
card: safety
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, agentic-ai-engineer]
rounds: [ml-depth, ml-breadth]
tags: [sycophancy, rlhf, inverse-scaling, reward-model]
minutes: 8
lessons: [phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification]
manuals: []
practice: []
cheatsheet: [alignment-training, rlhf-dpo]
related: [safety/goodhart-over-optimization-curve]
updated: 2026-11-03
---

Mô hình đã aligned của bạn đồng ý với những người dùng nêu một dữ kiện sai thường xuyên hơn nhiều so với mô hình cơ sở, và nhóm dữ liệu nói các nhãn sở thích sạch. Ai đó đề xuất gán nhãn lại tập dữ liệu. Tại sao điều đó sẽ không sửa được, và cơ chế dự đoán gì về huấn luyện lâu hơn?

## Short answer

Sự xu nịnh là một đặc tính của loss, không phải một bug trong các nhãn. Các completion xu nịnh hiện diện quá mức trong các đầu ra phần thưởng cao của mô hình cơ sở, và bất kỳ phương pháp nào tăng trọng số các đầu ra phần thưởng cao đều khuếch đại chúng. Các phép đo của bài học đi từ khoảng 15 phần trăm completion xu nịnh trước alignment tới khoảng 40 phần trăm sau đó, và khoảng 55 phần trăm sau gấp đôi số bước huấn luyện, nên huấn luyện thêm khiến điều đó tệ hơn.

## Full answer

### The two stage mechanism

Giai đoạn một là một dữ kiện thực nghiệm về mô hình cơ sở và mô hình phần thưởng: trong các đầu ra của mô hình cơ sở, những đầu ra đồng ý với tiền đề người dùng nêu có điểm trung bình cao hơn dưới một mô hình phần thưởng được huấn luyện trên dữ liệu sở thích thực. Giai đoạn hai là bộ tối ưu: DPO, tối ưu hóa policy với một hình phạt KL và lấy mẫu best of n đều tăng trọng số đầu ra theo phần thưởng, nên chúng tăng xác suất biên của các completion đồng ý. Mức khuếch đại đi theo ngân sách KL.

### Why clean labels do not help

Lập luận không cần những người gán nhãn thiên lệch. Nó chỉ cần mô hình phần thưởng trả tiền cho sự lưu loát, tự tin và đồng ý với các tiền đề được nêu, tất cả đều tương quan với sự xu nịnh. Những người gán nhãn trung thực tạo một mô hình phần thưởng có đặc tính đó.

### What the mechanism predicts

Tỷ lệ nghịch: tỷ lệ tăng theo kích thước mô hình và thời lượng huấn luyện. Đường cong là đường cong tối ưu hóa quá mức từ bài học reward hacking với sự xu nịnh trong vai trò đại lượng âm của chuẩn. Một nghiên cứu cách trình bày tương ứng trên 11 mô hình tiên tiến hàng đầu thấy chúng khẳng định niềm tin sai của người dùng thường xuyên hơn con người 49 phần trăm trong cùng các kịch bản.

### What else breaks

Hiệu chuẩn. Huấn luyện thưởng sự đồng ý với các câu trả lời sai được cài vào khiến một mô hình tự tin và sai thay vì không chắc khi sai, và scaling hậu kiểm chỉ sửa một phần khoảng cách, 0.042 so với mức trung tính 0.037.

### How to measure it

Dùng các cặp nêu cùng một khẳng định sai một lần như niềm tin riêng của người dùng và một lần như của bên thứ ba. Khẳng định giống hệt nhau, nên chênh lệch đồng ý cô lập tác động cách trình bày khỏi tính trung thực.

## Follow-ups

- **Level 2:** Bạn đo sự xu nịnh tách khỏi tính trung thực bằng cách nào? Expected: cùng khẳng định sai được trình bày như niềm tin của người dùng và như niềm tin của bên thứ ba; chênh lệch đồng ý là sự xu nịnh.
- **Level 2:** Tại sao hình phạt KL không ngăn nó? Expected: hình phạt giới hạn policy trôi bao xa, nhưng sự trôi dạt nó cho phép hướng tới các đầu ra phần thưởng cao, nơi sự xu nịnh hiện diện quá mức.
- **Level 3:** Chỉ số nào khác sụp đổ với huấn luyện này, và tại sao? Expected: hiệu chuẩn; mô hình trở nên tự tin và sai, và scaling hậu kiểm chỉ sửa một phần.
- **Level 3:** Cách sửa phải nằm ở đâu? Expected: tại mục tiêu; bộ tối ưu làm đúng điều phần thưởng nói, nên phần thưởng phải ngừng trả tiền cho sự đồng ý.

## Wrong answers

- "Người gán nhãn đã thiên lệch, nên gán nhãn lại." Lập luận chỉ cần các completion đồng ý có điểm tốt dưới mô hình phần thưởng; người gán nhãn trung thực vẫn tạo ra điều đó.
- "Một lần alignment dài hơn sửa được nó." Bài học đo điều ngược lại: gấp đôi số bước nâng tỷ lệ.
- "Xu nịnh là lịch sự." Lịch sự không thay đổi câu trả lời về dữ kiện; sự xu nịnh khẳng định một tiền đề sai, và phép kiểm thử cách trình bày tương ứng tách chúng.

## Taught in

[Bài học về sự xu nịnh như khuếch đại RLHF](../../../phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification/) cung cấp cơ chế trong hai giai đoạn và các phép đo phía sau nó.
