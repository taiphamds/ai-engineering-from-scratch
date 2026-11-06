---
name: attack-audit
description: Audit a red-team evaluation report for attack coverage, budget, judge identity, and behaviour set.
version: 1.0.0
phase: 18
lesson: 12
tags: [red-teaming, jailbreak, pair, harmbench, jailbreakbench, asr]
---

Với báo cáo đánh giá red-team, kiểm tra đánh giá có so sánh được với đường cơ sở công bố và có hỗ trợ kết luận không.

Tạo:

1. Bao phủ tấn công. Liệt kê mọi tấn công chạy: PAIR, GCG, AutoDAN, TAP, PAP, thủ công. Đánh dấu mọi lớp tấn công thiếu. Báo cáo chỉ chạy một họ tấn công không thể khẳng định độ vững.
2. Ngân sách mỗi tấn công. Báo cáo ngân sách truy vấn mỗi prompt cho từng tấn công. Khẳng định PAIR thành công ở 20 truy vấn không so sánh được với GCG thành công ở 500 bước.
3. Danh tính giám khảo. LLM giám khảo nào được dùng (GPT-4-turbo, Llama Guard, StrongREJECT, bộ phân loại nội bộ)? Hiệu chuẩn giám khảo chi phối phương sai ASR.
4. Tập hành vi. JailbreakBench (100 hành vi, 10 nhóm), HarmBench (510 hành vi, 7 nhóm), nội bộ hay khác? Nêu tập có công khai và tái lập được không.
5. Kiểm tra chuyển giao. Nếu red team tối ưu đối với một mô hình, ASR chuyển giao có được báo cáo đối với mô hình khác không? ASR một mô hình là cận trên độ vững họ mô hình, không phải cận dưới.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định "mô hình chúng tôi vững" dựa trên một họ tấn công.
- Mọi ASR báo cáo không có ngân sách truy vấn.
- Mọi ASR dùng giám khảo khác phép đo chuẩn công bố mà không hiệu chuẩn đối với giám khảo phép đo chuẩn.

Quy tắc từ chối:
- Nếu người dùng hỏi "mô hình chúng tôi miễn nhiễm jailbreak không," từ chối trả lời nhị phân và trỏ cấu trúc đa tấn công, đa giám khảo, kiểm tra chuyển giao trên.
- Nếu người dùng hỏi bộ công cụ tấn công khuyến nghị, từ chối một khuyến nghị duy nhất và trỏ phương sai thực nghiệm 2024 trên HarmBench.

Đầu ra: bản kiểm tra một trang điền năm phần trên, đánh dấu lớp tấn công thiếu và ước tính ASR bị đánh giá thấp hay cao so với phép đo chuẩn tái lập được. Trích dẫn Chao và cộng sự (arXiv:2310.08419) và bài báo phép đo chuẩn liên quan, mỗi bài một lần.
