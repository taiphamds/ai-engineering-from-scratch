---
name: skill-llm-evaluation
description: Decision framework for choosing the right LLM evaluation strategy based on task type, budget, and requirements
version: 1.0.0
phase: 10
lesson: 10
tags: [evaluation, evals, benchmarks, llm-as-judge, elo, metrics]
---

# LLM Evaluation Strategy

Khi đánh giá một hệ thống LLM, áp dụng khung quyết định này để chọn cách tiếp cận đúng.

## When to use each eval type

**Benchmark (MMLU, HumanEval, SWE-bench):** Bạn đang chọn mô hình ban đầu. Bạn cần thu hẹp 10 mô hình ứng viên còn 3. Benchmark cho xếp hạng sơ bộ với chi phí bằng không. Đừng dùng benchmark làm đánh giá cuối.

**Đánh giá tùy chỉnh:** Bạn đang xây cho production. Bạn có tác vụ cụ thể với kiểu thất bại cụ thể. Đánh giá tùy chỉnh là đánh giá duy nhất dự đoán hiệu năng thực tế. Tối thiểu 50 ca kiểm thử cho nguyên mẫu, 200+ cho production.

**LLM-as-judge:** Tác vụ mở (tóm tắt, viết, hội thoại). Thước đo khớp chính xác và chồng lấp token quá cứng. LLM-as-judge tốn ~$0.01 mỗi phán xét và đồng ý con người ~80% trường hợp. Luôn dùng rubric, không prompt mơ hồ.

**Đánh giá con người:** Rủi ro cao và thước đo tự động bất đồng. Đánh giá con người là ground truth nhưng tốn $0.10-$2.00 mỗi phán xét. Dành cho ca mơ hồ và hiệu chuẩn định kỳ thước đo tự động.

**ELO từ so sánh theo cặp:** Bạn đang so nhiều mô hình trên cùng tác vụ. Theo cặp đáng tin hơn chấm tuyệt đối vì con người (và giám khảo LLM) giỏi phán xét tương đối hơn.

## Scoring function selection

- **Khớp chính xác**: phân loại, trích xuất thực thể, đầu ra có cấu trúc với đáp án đã biết
- **Token F1**: tác vụ trích xuất mà điểm từng phần quan trọng
- **ROUGE-L**: tóm tắt, dịch
- **BLEU**: dịch máy
- **LLM-as-judge**: sinh mở, chất lượng hội thoại, hữu ích
- **Dựa trên thực thi**: sinh mã (chạy mã, kiểm tra có vượt kiểm thử không)
- **Tuân thủ schema**: đầu ra có cấu trúc (JSON có khớp schema không?)

## Red flags in eval design

- Tập đánh giá dưới 50 ca: kết quả vô nghĩa thống kê
- Không trường hợp biên: bạn đang đo hiệu năng đường đi thuận lợi, luôn cao hơn thực tế
- Một thước đo: các thước đo kể câu chuyện khác nhau, dùng ít nhất hai
- Không quản lý phiên bản: không thể theo dõi cải thiện nếu không có tập đánh giá quản lý phiên bản
- Nhiễm tập đánh giá: không bao giờ đưa ví dụ đánh giá vào dữ liệu tinh chỉnh hoặc prompt few-shot
- Chỉ kiểm thử một mô hình: cần baseline (dù heuristic đơn giản) để so sánh

## Eval pipeline checklist

1. Định nghĩa tác vụ chính xác (không phải "trả lời câu hỏi" mà "phân loại ticket hỗ trợ vào 5 loại")
2. Tạo ca kiểm thử trên đường đi thuận lợi, trường hợp biên và hồi quy đã biết
3. Chọn 2-3 hàm chấm điểm phù hợp loại tác vụ
4. Đặt ngưỡng đạt/không đạt dựa yêu cầu production
5. Tự động hóa thực thi: một lệnh chạy toàn bộ
6. Quản lý phiên bản mọi thứ: ca kiểm thử, hàm chấm điểm, prompt, phiên bản mô hình
7. Chạy trên mọi thay đổi: cập nhật prompt, đổi mô hình, triển khai mã
8. Theo dõi xu hướng: một điểm đơn lẻ là nhiễu, đường xu hướng là tín hiệu
9. Hiệu chuẩn với phán xét con người hàng quý
10. Thêm ca hồi quy mỗi khi phát hiện thất bại production
