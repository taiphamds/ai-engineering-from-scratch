---
name: debate-configurator
description: Configure a multi-agent debate for a given task, estimating quality gain and token cost before running.
version: 1.0.0
phase: 16
lesson: 07
tags: [multi-agent, debate, society-of-mind, consensus]
---

Với một câu hỏi hoặc tác vụ, tạo một cấu hình tranh luận sẵn sàng chạy trên bất kỳ framework agent nào (LangGraph, AutoGen, vòng lặp tùy chỉnh).

Tạo ra:

1. **Kiểm tra độ phù hợp tác vụ.** Tác vụ này có thể cải thiện bằng đồng thuận không? Tranh luận giúp suy luận, tính xác thực, và phân rã; nó không giúp các tác vụ vốn đã xác định (số học, biên dịch mã) hoặc thuần sinh (viết sáng tạo).
2. **Số agent.** 3, 4, hoặc 5. Mặc định 3; 4+ chỉ nếu không nhạy chi phí và tác vụ cần các quan điểm đa dạng hơn.
3. **Số vòng.** 2 hoặc 3. Mặc định 3; hiếm khi nhiều hơn. Trích dẫn cao nguyên của Du và cộng sự.
4. **Tính không đồng nhất.** Cùng mô hình cơ sở (đơn giản hơn, rẻ hơn, nhiều lỗi tương quan hơn) hoặc họ hỗn hợp (Llama + Claude + GPT; khử tương quan; đắt hơn, cần một lớp định tuyến).
5. **Phân vai.** Đối xứng (mọi agent có cùng vai trò) so với một đối kháng (một agent được chỉ dẫn bất đồng). Vị trí đối kháng là bảo hiểm rẻ chống các chuỗi lan truyền xu nịnh.
6. **Phương pháp tổng hợp.** Bỏ phiếu đa số (các câu trả lời rời rạc), trung bình có trọng số (số), hoặc tổng hợp giám khảo LLM (mở).
7. **Ước tính chi phí.** N agent × R vòng × token trung vị mỗi lượt. Nêu ước tính đô la theo giá nhà cung cấp hiện tại.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ cấu hình nào có hơn 5 agent hoặc hơn 3 vòng mà không có một lý giải chi phí cụ thể.
- Các cuộc tranh luận chỉ đối xứng trên các tác vụ có rủi ro xu nịnh đã biết.
- Sử dụng tranh luận cho các tác vụ có một bộ xác minh xác định (biên dịch, kiểm thử, toán chính xác) — thay vào đó chạy bộ xác minh.

Các quy tắc từ chối:

- Nếu tác vụ là tra cứu sự kiện đơn giản, từ chối và đề xuất một agent đơn lẻ được tăng cường truy xuất.
- Nếu tác vụ mang tính sinh (viết một bài thơ), từ chối — tranh luận kéo các đầu ra về trung bình.
- Nếu người dùng chưa đặt ngân sách token/đô la, từ chối và yêu cầu một ngân sách. Tranh luận tốn 5-15× chi phí một agent đơn lẻ.

Đầu ra: bản tóm lược cấu hình một trang. Bắt đầu bằng kiểm tra độ phù hợp tác vụ, kết thúc bằng ước tính tổng chi phí.
