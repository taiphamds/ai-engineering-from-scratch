---
name: ai-scientist-sandbox-review
description: Two-gate review checklist for research-loop agent outputs before anything leaves the sandbox.
version: 1.0.0
phase: 15
lesson: 5
tags: [ai-scientist, research-agent, sandbox, peer-review, disclosure]
---

Với một đầu ra nghiên cứu tự chủ (giả thuyết, mã, thí nghiệm, hình, bản nháp bài báo) do một vòng lặp kiểu AI-Scientist-v2 tạo, tạo một đánh giá hai cổng: kiểm toán sandbox (có gì rời đi không?) cộng kiểm toán nghiên cứu (công việc có đúng đắn không?).

Hai cổng ánh xạ trực tiếp lên các kiểm toán bên dưới: **Cổng sandbox = mục 1**; **Cổng nghiên cứu = các mục 2 (Kiểm toán thí nghiệm) + 3 (Kiểm toán trau chuốt)**. Các mục 4–5 chi phối điều gì xảy ra sau khi cả hai cổng đạt.

Tạo:

1. **Cổng sandbox.** Trước khi bất kỳ sản phẩm nào rời sandbox:
   - Liệt kê mọi lời gọi mạng vòng lặp đã thực hiện và đích của nó. Gắn cờ bất kỳ lời gọi nào chưa được phê duyệt trước.
   - Kiểm kê mọi file vòng lặp đã ghi ngoài thư mục làm việc của nó.
   - Xác nhận sự cô lập Docker / seccomp / gVisor được giữ trong toàn bộ lần chạy.
   - Xác nhận không tiến trình con nào thoát sự giám sát của sandbox.
   Nếu bất kỳ kiểm tra nào thất bại, chặn xuất; đưa lên một con người.
2. **Kiểm toán thí nghiệm.** Đọc mã thí nghiệm, không phải bài báo:
   - Xác minh mọi thí nghiệm được tuyên bố thực sự đã chạy và các con số được báo cáo của nó có thể tái tạo.
   - Kiểm tra rằng các thí nghiệm thất bại được báo cáo là thất bại, không được định khung lại thành kết quả âm tính sau sự việc.
   - Kiểm tra rằng nhãn "tính mới" trên ý tưởng đứng vững trước một tìm kiếm tài liệu bởi một chuyên gia miền con người.
3. **Kiểm toán trau chuốt.** Đọc các hình:
   - Bảo đảm dữ liệu của mỗi hình đến từ một lần chạy thí nghiệm được ghi log, không phải từ viết lại giai đoạn trau chuốt.
   - Xác nhận các trục, thang đo và chú thích khớp dữ liệu bên dưới.
   - Gắn cờ bất kỳ hình nào có chú thích tuyên bố nhiều hơn dữ liệu hỗ trợ.
4. **Kế hoạch công bố.** Nếu sản phẩm dự định cho phân phối bên ngoài:
   - Công bố rằng sản phẩm do agent soạn.
   - Công bố các công cụ được sử dụng (họ mô hình, phiên bản vòng lặp).
   - Công bố bên đánh giá con người đã kiểm tra nó và họ đã kiểm tra gì.
5. **Quyết định không phát hành.** Nếu sản phẩm thất bại ở bất kỳ bước kiểm toán nào, mặc định là không phát hành. Override mặc định này yêu cầu một con người chịu trách nhiệm được nêu tên.

Các trường hợp từ chối cứng:
- Bất kỳ bài nộp nào bỏ qua một trong hai cổng.
- Bất kỳ sản phẩm nào mà các log thực thi vòng lặp bị thiếu hoặc không hoàn chỉnh.
- Bất kỳ hình nào không thể truy đến một lần chạy thí nghiệm cụ thể.
- Bất kỳ tuyên bố tính mới nào mà một chuyên gia miền chưa xác minh.

Các quy tắc từ chối:
- Nếu lần chạy thiếu Docker hoặc cô lập tương đương, từ chối và yêu cầu chạy lại trong một sandbox cô lập.
- Nếu người dùng không thể cung cấp các log thực thi cho giai đoạn thí nghiệm, từ chối — bài báo không thể đánh giá.
- Nếu kênh phân phối được đề xuất là một nơi công bố có bình duyệt và người dùng đề xuất không công bố tác quyền agent, từ chối và yêu cầu công bố.

Định dạng đầu ra:

Trả về một báo cáo hai cổng:
- **Phán quyết cổng sandbox** (ĐẠT / CHẶN, với lý do)
- **Phán quyết cổng nghiên cứu** (bao phủ Kiểm toán thí nghiệm (2) và Kiểm toán trau chuốt (3)) (ĐẠT / CHẶN / YÊU_CẦU_CHUYÊN_GIA, với các ghi chú cho từng kiểm tra)
- **Kế hoạch công bố** (nơi công bố, văn bản, tên bên đánh giá con người)
- **Quyết định phát hành** (phát hành / giữ / từ chối)
- **Hành động tiếp theo** (ai làm gì trước khi nào)
