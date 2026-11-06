---
name: topology-picker
description: Pick a multi-agent debate topology (star / chain / tree / graph), an N of agents, a heterogeneity profile, and a round bound for a given task.
version: 1.0.0
phase: 16
lesson: 15
tags: [multi-agent, debate, topology, voting, self-consistency]
---

Với một mô tả tác vụ, đề xuất một cấu trúc liên kết đa agent và quy mô.

Tạo ra:

1. **Dấu vân tay tác vụ.** Nghiên cứu (tầm thời gian dài, mở), sự kiện nhanh (câu trả lời dạng đóng), tinh chỉnh từng bước (pipeline theo giai đoạn), hoặc ý kiến (không có chuẩn tham chiếu). Chọn một; nếu trải hai loại, chọn hình dạng chi phối.
2. **Cấu trúc liên kết.** Hình sao, chuỗi, cây, hoặc đồ thị. Giải thích từ dấu vân tay:
   - nghiên cứu → đồ thị (phê bình bất kỳ bên nào với bất kỳ bên nào)
   - sự kiện nhanh → hình sao (trung tâm tổng hợp)
   - tinh chỉnh từng bước → chuỗi (hoặc cây nếu chia để trị)
   - ý kiến → không loại nào ở trên; đề xuất một agent đơn lẻ + quyết định con người
3. **N agent.** 3 là tập hợp hữu ích rẻ nhất; 5 là điểm cân bằng phổ biến; 7+ là chuyên biệt. Trên 5 ở cấu trúc liên kết đồ thị, cảnh báo về thuế phối hợp.
4. **Hồ sơ tính không đồng nhất.** Ít nhất một agent phải đến từ một họ mô hình cơ sở khác nếu đơn văn hóa quan trọng (nghiên cứu, suy luận). Ưu tiên 3 mô hình cơ sở khác nhau ở N=5.
5. **Giới hạn số vòng.** 1 vòng = bỏ phiếu. 2 vòng = một tinh chỉnh. 3 vòng = tối đa trước khi thuận theo chi phối. Không bao giờ không giới hạn.
6. **Tổng hợp.** Bỏ phiếu theo số phiếu cao nhất (rẻ), có trọng số độ tự tin (CP-WBFT từ Bài 14), trung vị hình học (DecentLLMs), hoặc giám khảo chấm điểm. Mặc định dùng trọng số độ tự tin trừ khi các ràng buộc chi phí đòi bỏ phiếu theo số phiếu cao nhất.
7. **Chuyển cấp.** Đồng thuận dưới ngưỡng → chuyển cấp đi đâu? Con người, một tập hợp khác với các mô hình cơ sở khác nhau, hay bỏ phiếu trắng?

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ khuyến nghị 10+ agent nào trên cấu trúc liên kết đồ thị. Thuế phối hợp chi phối; đo trước.
- Cấu trúc liên kết hình sao cho các câu hỏi nghiên cứu mở. Hình sao mất lợi ích phê bình bất kỳ bên nào với bất kỳ bên nào.
- Bất kỳ khuyến nghị nào chạy cùng mô hình cơ sở N lần và gọi đó là đa agent. Đó là tự nhất quán trá hình; gắn nhãn đúng.
- Các vòng không giới hạn. Thưởng thuận theo; tranh luận chạy càng lâu, các agent càng đồng ý vì áp lực thay vì logic.

Các quy tắc từ chối:

- Nếu tác vụ không có chuẩn tham chiếu (ý kiến, tổng hợp, sáng tạo), nêu rằng bỏ phiếu mang tính tư vấn. Đề xuất một agent đơn lẻ + quyết định con người.
- Nếu người dùng thiếu quyền truy cập nhiều mô hình cơ sở, gắn cờ mức trần đơn văn hóa và đề xuất tự nhất quán với biến thiên temperature làm dự phòng.
- Nếu tác vụ đơn giản (một tra cứu sự kiện đơn lẻ, < 100 token suy luận), đề xuất một agent đơn lẻ với tự nhất quán N=5.

Đầu ra: một bản tóm lược một trang. Bắt đầu với một khuyến nghị một câu (“Cấu trúc liên kết đồ thị, N=5 agent từ 3 mô hình cơ sở khác nhau, 2 vòng, tổng hợp có trọng số độ tự tin, chuyển cấp tới con người khi dưới ngưỡng.”), rồi bảy phần ở trên. Kết thúc bằng một ước tính ngân sách: token kỳ vọng mỗi truy vấn và độ trễ kỳ vọng bằng giây.
