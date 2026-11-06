---
name: workbench-audit
description: Audit a repo for the seven agent workbench surfaces and report which are missing, partial, or healthy before any agent work begins.
version: 1.0.0
phase: 14
lesson: 31
tags: [workbench, audit, reliability, agent-engineering]
---

Với một đường dẫn kho mã và sản phẩm agent sẽ chạy bên trong nó, kiểm toán bảy bề mặt workbench và tạo một báo cáo sự sẵn sàng.

Bảy bề mặt:

1. Chỉ dẫn: một file gốc mà agent đọc đầu tiên (ví dụ `AGENTS.md`), ngắn, định tuyến đến các quy tắc sâu hơn.
2. Trạng thái: một file bền vững, máy đọc được ghi lại tác vụ, các file đã chạm, trở ngại, hành động tiếp theo.
3. Phạm vi: một hợp đồng cho từng tác vụ liệt kê các file được phép, file bị cấm, tiêu chí nghiệm thu, kế hoạch khôi phục.
4. Phản hồi: một trình chạy ghi lại lệnh, stdout, stderr, mã thoát và đưa kết quả trở lại vòng lặp.
5. Xác minh: một cổng chạy kiểm thử, lint, kiểm tra kiểu, chạy smoke và xác nhận các tiêu chí nghiệm thu.
6. Đánh giá: một lượt thứ hai với một vai trò khác, bên xây dựng không thể tự chấm công việc của mình.
7. Bàn giao: một sản phẩm tóm tắt điều gì thay đổi, vì sao, điều gì còn lại và hành động tốt nhất tiếp theo.

Tạo:

- Một điểm cho mỗi bề mặt: 0 thiếu, 1 một phần, 2 tốt. Gắn mỗi điểm với một file hoặc tiến trình bạn đã quan sát.
- Ba ưu tiên được sắp theo tác động: bề mặt bị thiếu nào, nếu được thêm trước, loại bỏ nhiều chế độ lỗi nhất.
- Một báo cáo `workbench_audit.json` máy đọc được cộng một bản tóm tắt `workbench_audit.md` cho con người đọc.
- Một bản vá khởi đầu cho bề mặt yếu nhất: thay đổi file nhỏ nhất chuyển điểm từ 0 lên 1.

Các trường hợp từ chối cứng:

- Các điểm "Tốt" không có một đường dẫn file hoặc tham chiếu tiến trình. Các cuộc kiểm toán không có bằng chứng mục nát.
- Một bề mặt "cấu hình agent" kết hợp duy nhất. Kết hợp các bề mặt che giấu bề mặt nào thất bại khi một tác vụ hỏng.
- Bỏ qua xác minh vì các kiểm thử chậm. Nếu xác minh không ở trên workbench, các bên xây dựng tự chấm bài của mình.

Các quy tắc từ chối:

- Nếu repo hoàn toàn không có lệnh kiểm thử, từ chối điểm xác minh và hiển thị nó như một phát hiện chặn.
- Nếu repo không có lịch sử quản lý phiên bản, từ chối điểm bàn giao và hiển thị nó như một phát hiện chặn.
- Nếu sản phẩm agent chạy dưới quyền root hoặc có truy cập file không hạn chế, từ chối điểm phạm vi cho đến khi một sandbox hoặc danh sách ghi được định nghĩa.

Cấu trúc đầu ra:

```
workbench-audit/
├── workbench_audit.json
├── workbench_audit.md
├── patches/
│   └── <weakest-surface>.patch
└── README.md
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 32 cho bố cục repo tối thiểu.
- Bài 33 cho bề mặt chỉ dẫn chuyên sâu.
- Bài 38 cho cổng xác minh.
