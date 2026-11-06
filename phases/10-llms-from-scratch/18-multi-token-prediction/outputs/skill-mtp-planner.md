---
name: mtp-planner
description: Plan a multi-token prediction integration for a new pre-training run.
version: 1.0.0
phase: 10
lesson: 18
tags: [mtp, multi-token-prediction, deepseek-v3, pre-training, speculative-decoding]
---

Với một đặc tả lượt tiền huấn luyện (quy mô mô hình, kích thước ẩn, số lớp, ngân sách token dữ liệu, cấu trúc liên kết GPU, đích triển khai) và một mục tiêu đã nêu (tín hiệu huấn luyện dày đặc hơn hay bản dự thảo speculative decoding hay cả hai), tạo một kế hoạch tích hợp MTP.

Tạo:

1. Độ sâu D. Chọn 1 hoặc 2. DeepSeek-V3 dùng D=1 và báo cáo tỷ lệ chấp nhận speculative decoding ở độ sâu đầu là 80%+. D=2 là vùng lợi ích giảm dần với hầu hết các lượt chạy. Biện minh lựa chọn theo ngân sách tính toán — mỗi độ sâu bổ sung thêm khoảng một khối transformer tính toán cho mỗi bước huấn luyện.
2. Lịch lambda. Mặc định: 0.3 trong 10% đầu quá trình huấn luyện, 0.1 sau đó. Điều chỉnh lên đến 0.5 ở giai đoạn đầu cho mô hình nhỏ (dưới 7B) nơi tín hiệu dày đặc hơn quan trọng hơn; điều chỉnh giảm nếu bạn quan sát thấy loss MTP lấn át loss chính.
3. Ngân sách tham số. Báo cáo số tham số mỗi mô-đun so với mô hình chính. Xác nhận chi phí bổ sung dưới 5% tham số chính (dense) hoặc dưới 3% (MoE).
4. Chi phí bộ nhớ và tính toán bổ sung. Định lượng FLOPs forward-pass bổ sung mỗi bước (khoảng `D * transformer_block_cost`), bộ nhớ backward-pass bổ sung (bộ nhớ activation cho D mô-đun) và VRAM đỉnh bổ sung (embedding và head dùng chung không tính, phép chiếu và khối transformer có tính).
5. Kết nối khi suy luận. Mô tả cách sử dụng mô-đun MTP làm bản dự thảo speculative decoding khi suy luận. Nêu cách tích hợp quy tắc Leviathan và việc ghi nhận hoàn tác KV. Xác nhận tương thích với ngăn xếp suy luận đích (vLLM, SGLang, TensorRT-LLM).

Các trường hợp loại bỏ dứt khoát:
- Thêm MTP vào mô hình dense đã tiền huấn luyện mà không có nó. Không thể lắp thêm về sau — các mô-đun MTP chưa được huấn luyện.
- D > 2 cho lần tích hợp đầu tiên. Lợi ích so với D=1 nhỏ; độ phức tạp tăng nhanh.
- MTP trên mô hình dưới 1B tham số hoạt động. Tín hiệu yếu hơn chi phí bổ sung ở quy mô đó.
- Dùng các head song song (kiểu Gloeckle) khi mục tiêu là speculative decoding. Chúng không nối chuỗi theo quan hệ nhân quả.

Quy tắc từ chối:
- Nếu dữ liệu tiền huấn luyện chủ yếu là các chuỗi ngắn (dưới 2k), từ chối. Lợi ích MTP giả định các chuỗi đủ dài để giám sát ở độ sâu 2 có ý nghĩa.
- Nếu ngăn xếp suy luận đích hoàn toàn không hỗ trợ speculative decoding, lưu ý rằng MTP vẫn mang lại tín hiệu huấn luyện dày đặc hơn và tiếp tục, nhưng đánh dấu sự không phù hợp.
- Nếu người dùng đang tiếp tục tiền huấn luyện trên checkpoint dense hiện có mà không có MTP, từ chối và khuyến nghị chỉ thêm MTP khi bắt đầu một lượt huấn luyện mới hoàn toàn hoặc tại một lần đặt lại rõ ràng ở ranh giới dữ liệu.

Đầu ra: một kế hoạch tích hợp dài một trang liệt kê D, lịch lambda, chi phí tham số bổ sung (tuyệt đối và phần trăm), chi phí tính toán bổ sung (phần trăm mỗi bước huấn luyện) và kế hoạch kết nối speculative decoding khi suy luận. Kết thúc bằng đoạn "tiêu chí thành công" nêu chỉ số đo được biện minh cho việc giữ MTP: tỷ lệ chấp nhận ở độ sâu 1 sau 50B token huấn luyện phải trên 70%, nếu không thì kiến trúc nên được hoàn tác.
