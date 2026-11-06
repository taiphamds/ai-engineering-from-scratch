---
name: mcp-reliability-reviewer
description: Review MCP cancellation races, deadlines, retries, idempotency, SSE flow control, and reconnect behavior.
version: 1.0.0
phase: 13
lesson: 29
tags: [mcp, reliability, cancellation, idempotency, sse, backpressure]
---

Đánh giá một thao tác MCP từ bắt đầu yêu cầu đến phục hồi thất bại.

Hỏi đầu vào này nếu vắng:

1. Vận chuyển: stdio hoặc Streamable HTTP.
2. Ngữ nghĩa thao tác và tác dụng phụ.
3. Thời gian chờ nhàn và tối đa tuyệt đối.
4. Hành vi token tiến độ và giới hạn tốc độ.
5. Chính sách thử lại và lưu lũy đẳng nghiệp vụ.
6. Thiết lập bộ đệm SSE, proxy, keepalive và kết nối lại.
7. Hành vi Task bền vững nếu thao tác dùng phần mở rộng Tasks.

Tạo các mục sau.

## Cancellation wire

- Với stdio, yêu cầu thông báo `notifications/cancelled` client gửi tham chiếu id yêu cầu hoạt động.
- Với Streamable HTTP, yêu cầu đóng luồng phản hồi yêu cầu đó. Từ chối POST hủy thường.
- Yêu cầu không phản hồi JSON-RPC cho thông báo hủy.
- Dành `notifications/cancelled` máy chủ gửi cho gỡ `subscriptions/listen` stdio.
- Nêu điều gì xảy ra khi hủy không biết, sai dạng, trễ hoặc không thể.

## Race table

Cho kết quả tất định cho:

| Thứ tự sự kiện | Trạng thái kết thúc máy chủ | Phản hồi cuối | Hành vi client |
|------------|-----------------------|----------------|-----------------|
| Hủy rồi hoàn tất | Đã hủy | Bị chặn | Tiếp tục phục hồi |
| Hoàn tất rồi hủy | Hoàn tất | Giữ | Bỏ hủy trễ |
| Hết thời gian rồi phản hồi trễ | Hủy phụ thuộc vận chuyển | Bỏ hoặc chặn theo thứ tự quan sát | Đối soát trước thử lại không an toàn |
| Ngắt kết nối khi tiến độ | Yêu cầu đang xử lý bị hủy | Không luồng tiếp tục được | Kết nối lại và lấy lại |

## Deadline policy

Yêu cầu cả thời gian chờ nhàn và tối đa tuyệt đối. Tiến độ chỉ được đặt lại nhàn khi hợp lệ, đơn điệu và giới hạn tốc độ. Bình luận keepalive không tính là tiến độ ngữ nghĩa. Thời gian chờ tối đa không bao giờ đặt lại.

## Retry classification

Trả một lớp mỗi thao tác:

- `SAFE`: hợp đồng ứng dụng chứng minh không tác dụng phụ.
- `CONDITIONAL`: thay đổi có một khóa lũy đẳng bền vững dùng lại với đối số giống hệt.
- `UNSAFE`: thay đổi thiếu khử trùng có thẩm quyền.

Không bao giờ coi id JSON-RPC mới, chú giải công cụ hoặc kết nối lại vận chuyển là lũy đẳng nghiệp vụ.

Với thử lại có điều kiện, yêu cầu dấu vân tay đối số lưu và kết quả commit. Từ chối một khóa dùng lại với đối số đổi.

Yêu cầu một ranh giới sổ nguyên tử, bền vững cho chiếm khóa, dấu vân tay
đối số, bản ghi hiệu ứng nghiệp vụ và kết quả commit. Từ điển
hoặc khóa cục bộ tiến trình không bền và không điều phối bản sao. Chấp nhận
giao dịch cơ sở dữ liệu chung, transactional outbox hoặc nhà cung cấp phía trước
cưỡng chế cùng khóa. Nêu hiệu ứng nào thực sự trong ranh giới đó.

Trả bản sao phòng vệ của kết quả commit. Không bao giờ đưa đối tượng thay đổi được
sổ giữ ra. Chứng minh cả hai thuộc tính bằng fixture cùng khóa đồng thời,
fixture mở lại và fixture bí danh thay đổi.

## Flow control

- Đặt sức chứa mỗi luồng hoặc client tường minh.
- Gộp tiến độ thay thế được.
- Đánh dấu tiến độ bỏ là cần lấy lại có thẩm quyền.
- Giữ phản hồi JSON-RPC cuối.
- Đặt `Content-Type: text/event-stream`, `Cache-Control: no-cache` và `X-Accel-Buffering: no` cho SSE.
- Định nghĩa nhịp keepalive riêng tiến độ thao tác.
- Từ chối hàng đợi vô hạn.

## Reconnect plan

- Mở yêu cầu mới với id mới.
- Khôi phục bộ lọc đăng ký.
- Không dùng `Last-Event-ID` cho MCP 2026-07-28.
- Lấy lại tài nguyên, danh sách, prompt hoặc Tasks bị ảnh hưởng.
- Không tự phát lại thay đổi không an toàn.
- Dùng backoff hàm mũ có trần với jitter.

## Durable Tasks

Khi có Task, giữ `tasks/cancel` riêng hủy yêu cầu. Xác nhận đầy đủ chỉ chứng minh ý định hủy được nhận. Thăm dò hoặc nghe đến khi tác vụ bền vững đạt trạng thái kết thúc.

## Required fixtures

Trả ít nhất kịch bản thực thi được này:

1. stdio hủy trước hoàn tất;
2. stdio hoàn tất trước hủy trễ;
3. đóng luồng HTTP trước hoàn tất;
4. tiến độ đặt lại chờ nhàn trong khi chờ tối đa vẫn kích hoạt;
5. thay đổi trùng với hai id JSON-RPC và không khóa lũy đẳng;
6. thay đổi trùng với một khóa và đối số giống hệt;
7. dùng lại khóa với đối số đổi;
8. bên tiếp nhận chậm vượt bộ đệm tiến độ;
9. rớt luồng theo sau đăng ký mới và lấy lại có thẩm quyền;
10. xác nhận `tasks/cancel` theo sau hủy worker trì hoãn.
11. hai kết nối sổ độc lập tranh một khóa và đối số giống hệt;
12. bên gọi sửa kết quả trả theo sau phát lại sạch từ bản ghi bền vững.

Từ chối kết luận sẵn sàng sản xuất khi chính sách thử lại chỉ mô tả là
"thử lại khi hết thời gian", sổ cục bộ tiến trình, hiệu ứng ngoài nằm
ngoài ranh giới nguyên tử tuyên bố không outbox hoặc khóa phía trước, bản ghi trả
là bí danh lưu trữ thay đổi được hoặc sức chứa hàng đợi chưa chỉ định.
