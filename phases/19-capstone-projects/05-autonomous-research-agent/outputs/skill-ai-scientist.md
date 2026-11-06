---
name: ai-scientist
description: Build an autonomous research agent that runs experiment tree search, writes LaTeX papers with vision critique, and passes a sandbox-escape red team.
version: 1.0.0
phase: 19
lesson: 05
tags: [capstone, autonomous-agent, ai-scientist, sakana, langgraph, sandbox, research]
---

Với ý tưởng hạt giống, miền hẹp và ngân sách tính toán $30, xây agent chạy tìm kiếm cây thí nghiệm, viết bài LaTeX có thể phản biện và xuất gói tái lập.

Kế hoạch xây dựng:

1. Lượt tài liệu nghiên cứu: Semantic Scholar Graph API + OpenAlex; lưu bộ nhớ đệm tóm tắt trong FAISS; tạo bản tổng hợp miền 1 trang.
2. Tìm kiếm cây: triển khai mở rộng ưu tiên tốt nhất trên nút thí nghiệm với `expand(node) -> children` (một sửa cấu hình mỗi con) và `score(node) = novelty*0.4 + quality*0.5 + budget*0.1`.
3. Sandbox mỗi nút: mọi thí nghiệm chạy `docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only` hoặc E2B tương đương; seed xác định; trần tài nguyên thực thi.
4. Lập kế hoạch-thực thi-xác minh: bước xác minh kiểm tra mất mát hội tụ, đường cơ sở chạy, loại bỏ cô lập khẳng định.
5. Bộ viết: tạo LaTeX, biên dịch PDF, đưa PDF vào chế độ thị giác Claude Opus 4.7 để phê bình bố cục và phù hợp khẳng định-bằng chứng, lặp tối đa 3 lần.
6. Tổ hợp phản biện: năm giám khảo (Opus 4.7, GPT-5.4, Gemini 3 Pro, DeepSeek R1, Qwen3-Max) chấm theo tiêu chí NeurIPS (tính mới, nghiêm ngặt, rõ ràng, tái lập, tác động); trung bình < 4.0 trả bộ viết.
7. Red team: tích hợp tác vụ đối kháng (fork bomb, thoát hệ thống file, lệnh gọi mạng LLM viết). Xác nhận tất cả bị chặn. Xuất `red_team.md`.
8. Gói tái lập: paper.pdf + review.md + JSON dấu vết tìm kiếm cây + seed + liên kết lần chạy W&B + cấu hình sandbox + lệnh chạy lại một dòng.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Chất lượng bài | Phản biện mù theo tiêu chí so bài workshop công bố trên cùng chủ đề hạt giống |
| 20 | Nghiêm ngặt thí nghiệm | Đường cơ sở, seed, loại bỏ; mọi khẳng định được ô bảng kết quả hỗ trợ |
| 20 | Kỷ luật chi phí và tính toán | Trần $30 mỗi bài thực thi, theo dấu Langfuse |
| 20 | An toàn | Red team sandbox vượt qua; chính sách mạng và công tắc ngắt xác minh với nỗ lực ghi log |
| 15 | Khả năng tái lập | Chạy lại một lệnh tái tạo bài với seed giống hệt |

Các trường hợp loại bỏ dứt khoát:

- Thí nghiệm chạy ngoài sandbox. Toàn luận điểm bài tổng kết là thực thi được kiềm chế.
- Bước viết không đọc lại PDF đã biên dịch (phê bình thị giác đóng vai trò quyết định).
- Bài không có đường cơ sở, seed hoặc phần loại bỏ.
- Ngân sách chi phí chỉ thực thi như cảnh báo hậu nghiệm, không phải trần cứng.

Quy tắc từ chối:

- Từ chối công bố bài có trung bình phản biện dưới 4.0/5 không có ghi đè con người tường minh.
- Từ chối chạy ý tưởng hạt giống cần truy cập mạng từ trong sandbox. Thêm volume tập dữ liệu chỉ đọc riêng thay vào.
- Từ chối chạy lại bài chưa thực hiện và ghi log red-team.

Đầu ra: repo chứa engine tìm kiếm cây, chính sách sandbox, vòng lặp viết/phản biện, ba lần chạy mẫu có gói tái lập, báo cáo red-team, csv sổ chi phí và bài viết nêu chế độ lỗi Sakana v2 nào bạn tái tạo và cách biện pháp giảm thiểu hoạt động.
