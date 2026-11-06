# Checkpoints and Rollback

> Mọi chuyển trạng thái đồ thị đều được lưu bền vững. Khi một worker gặp sự cố, lease của nó hết hạn và một worker khác tiếp quản tại checkpoint mới nhất. Cloudflare Durable Objects giữ trạng thái qua hàng giờ hoặc hàng tuần. Đề xuất rồi cam kết (Bài 15) định nghĩa một kế hoạch hoàn tác cho mỗi hành động. Xác minh sau hành động khép vòng lặp. Điều 14 EU AI Act bắt buộc giám sát hiệu quả của con người đối với các hệ thống rủi ro cao — trong thực tế điều này có nghĩa là các checkpoint phải có thể truy vấn, các lần hoàn tác phải được diễn tập, và dấu vết kiểm toán phải tồn tại qua một lần triển khai. Chế độ lỗi nghiêm trọng: không có các khóa lũy đẳng và kiểm tra tiền điều kiện, một lần thử lại sau lỗi thoáng qua có thể thực thi hai lần một hành động đã được phê duyệt. Xác minh sau hành động là thứ bắt được nó.

**Type:** Learn
**Languages:** Python (stdlib, checkpoint and rollback state machine)
**Prerequisites:** Phase 15 · 12 (Durable execution), Phase 15 · 15 (Propose-then-commit)
**Time:** ~60 minutes

## The Problem

Thực thi bền vững (Bài 12) làm cho một agent đã gặp sự cố có thể tiếp tục. Đề xuất rồi cam kết (Bài 15) làm cho một hành động đã được phê duyệt có thể kiểm toán. Bài này kết hợp chúng: điều gì xảy ra khi một hành động đã được phê duyệt thực thi một phần, gặp sự cố, và tiếp tục? Khi nào hoàn tác chạy, và trên trạng thái nào?

Các hệ thống thực kết nối điều này theo các cách khác nhau:

- **LangGraph** tạo checkpoint cho mọi chuyển trạng thái đồ thị vào PostgreSQL. Khi worker gặp sự cố, lease được giải phóng và một worker khác tiếp tục tại checkpoint mới nhất. Các quy trình tạm dừng trên `interrupt()`, vốn tự nó được lưu bền vững.
- **Cloudflare Durable Objects** giữ trạng thái theo từng khóa qua hàng giờ hoặc hàng tuần. Đặt tính toán cùng chỗ với lưu trữ cho hành động đã được phê duyệt.
- **Microsoft Agent Framework** cung cấp các nguyên thủy `Checkpoint` trong API quy trình; phát lại cộng với tính lũy đẳng bao phủ các lần thử lại.

Trong mọi trường hợp, sự kết hợp thực sự hoạt động là: khóa lũy đẳng (ngăn thực thi hai lần) + kiểm tra tiền điều kiện (trạng thái vẫn là điều chúng ta đã dựa vào để phê duyệt) + xác minh sau hành động (tác dụng phụ thực sự xảy ra) + hoàn tác khi xác minh thất bại.

## The Concept

### Every transition persists

Một chuyển trạng thái đồ thị là bất kỳ bước nào chuyển quy trình từ một trạng thái có tên sang trạng thái khác. Các triển khai ngây thơ chỉ lưu bền vững tại các điểm cam kết cụ thể; các triển khai sản xuất lưu bền vững mọi lần chuyển. Chi phí (thêm vài lần ghi) nhỏ so với mức tăng độ tin cậy (phát lại đến được bất cứ đâu, phục hồi lease chính xác).

### Lease recovery

Khi một worker gặp sự cố, quy trình không bị mất; lease (một quyền nhận việc ngắn hạn rằng worker này đang thực thi lần chạy này) đơn giản hết hạn. Một worker khác tiếp quản checkpoint mới nhất và tiếp tục. Cơ chế lease là điều cho phép các hệ thống sản xuất tồn tại qua các lần triển khai cuốn chiếu mà không mất công việc đang diễn ra.

### Idempotency plus preconditions

Chỉ tính lũy đẳng là không đủ. Xét: một quy trình được phê duyệt để “chuyển $100 từ A sang B khi số dư > $1000.” Quy trình được cam kết, gặp sự cố giữa lúc thực thi, và tiếp tục. Nếu chỉ khóa lũy đẳng được kiểm tra, và việc thực thi tiếp tục, việc chuyển chạy một lần (đúng). Nhưng xét rằng giữa sự cố và tiếp tục, số dư của A giảm xuống $500 thông qua một quy trình khác. Kiểm tra tính lũy đẳng vẫn vượt qua; tiền điều kiện thì không. Không có kiểm tra tiền điều kiện, chúng ta đưa ra một khoản thấu chi.

Mọi hành động có hệ quả đều cần cả hai:

- **Khóa lũy đẳng**: ngăn thực thi hai lần.
- **Kiểm tra tiền điều kiện**: xác nhận trạng thái vẫn nhất quán với những gì đã được phê duyệt.

### Post-action verification

“Công cụ trả về 200” không phải là xác minh. Xác minh thực đọc lại trạng thái đích và xác nhận tác dụng phụ thực sự xảy ra. Các mẫu:

- Cập nhật cơ sở dữ liệu: `UPDATE ... RETURNING *` rồi khẳng định hàng trả về khớp trạng thái dự định.
- Gửi email: kiểm tra thư mục đã gửi tìm ID thư sau khi gửi.
- Ghi file: đọc lại file và băm nó.
- Lệnh gọi API: `GET` tiếp theo trên tài nguyên đích.

Nếu xác minh thất bại, quy trình ở trong một trạng thái xấu đã biết. Hoàn tác được kích hoạt.

### Rollback plans

Mọi hành động có hệ quả trong đề xuất rồi cam kết (Bài 15) mang theo một kế hoạch hoàn tác. Các loại:

- **Hoàn tác trong băng**: đảo ngược trực tiếp tác dụng phụ (`DELETE` sau `INSERT`, `Send-correction-email` sau gửi).
- **Giao dịch bù trừ**: một hành động mới trung hòa hành động gốc (mẫu SAGA chuẩn).
- **Hoàn tác ngoài băng**: cảnh báo một người, tạm dừng quy trình, để lại trạng thái xấu cho điều tra.

Hoàn tác không làm gì (“chúng tôi không thể đảo ngược điều này”) phải được nêu trong đề xuất. Các hành động không có hoàn tác yêu cầu HITL mạnh hơn tại thời điểm cam kết (thách thức và đáp ứng Bài 15).

### EU AI Act Article 14 operational reading

Điều 14 yêu cầu “giám sát hiệu quả của con người” đối với các hệ thống rủi ro cao. Theo thuật ngữ vận hành, những người triển khai đọc nó là:

- Các checkpoint có thể được truy vấn bởi một kiểm toán viên.
- Các lần hoàn tác được diễn tập (được kiểm thử đầu cuối ít nhất một lần).
- Dấu vết kiểm toán tồn tại qua một lần triển khai (backend checkpoint không tạm thời).
- Các xác minh thất bại được cảnh báo, không âm thầm ghi nhật ký.

Một quy trình gặp sự cố giữa cam kết, tiếp tục, và hoàn thành tác dụng phụ mà không có đường xác minh + hoàn tác không vượt qua phép kiểm tra Điều 14.

### The sharp failure mode: the double-execute

Sự cố sản xuất phổ biến nhất trong lĩnh vực này:

1. Hành động được phê duyệt, khóa lũy đẳng k.
2. Cam kết bắt đầu, thực thi, trả về 200.
3. Quy trình gặp sự cố trước khi lưu bền vững trạng thái “đã cam kết”.
4. Quy trình tiếp tục; thấy “đã phê duyệt nhưng chưa cam kết”; thực thi lại.
5. Tác dụng phụ kích hoạt hai lần.

Biện pháp giảm thiểu: lưu bền vững một ý định “đang diễn ra” trước thực thi, thực thi với một khóa lũy đẳng, rồi đánh dấu “đã cam kết” chỉ sau khi xác minh sau hành động thành công. Nếu hành động kích hoạt và việc ghi trạng thái thất bại, bạn biết cần xác minh và (nếu cần) kích hoạt lại. Nếu việc ghi trạng thái thành công và hành động thất bại, bạn xác minh và kích hoạt đúng một lần thông qua đường phục hồi.

```figure
checkpoint-replay
```

## Use It

`code/main.py` triển khai một quy trình có checkpoint với tính lũy đẳng, tiền điều kiện, xác minh, và hoàn tác. Trình điều khiển mô phỏng bốn kịch bản: lần chạy sạch, thử lại sau sự cố (tính lũy đẳng bắt được), tiền điều kiện thất bại (quy trình hủy mà không kích hoạt), xác minh thất bại (hoàn tác kích hoạt).

## Ship It

`outputs/skill-rollback-rehearsal.md` thiết kế một kiểm thử diễn tập hoàn tác cho một quy trình được đề xuất và kiểm toán backend checkpoint về tính bền vững của dấu vết kiểm toán.

## Exercises

1. Chạy `code/main.py`. Xác minh bốn kịch bản. Với trường hợp gặp sự cố trong lúc cam kết, xác nhận hành động kích hoạt đúng một lần qua các lần thử lại.

2. Sửa mẫu “đánh dấu là xong trước, rồi làm nó” để việc ghi trạng thái kích hoạt sau hành động. Chạy lại kịch bản sự cố. Đo có bao nhiêu hành động trùng lặp kích hoạt.

3. Thiết kế một kế hoạch hoàn tác cho một hành động sản xuất cụ thể (ví dụ: “đăng lên một kênh Slack”). Phân loại là trong băng, bù trừ, hoặc ngoài băng. Giải thích lựa chọn.

4. Lấy một quy trình bạn biết. Xác định mọi chuyển trạng thái. Đánh dấu mỗi chuyển với một yêu cầu tính bền vững (lưu bền vững / không lưu bền vững). Đếm những chuyển bạn hiện chưa lưu bền vững.

5. Kiểm thử hoàn tác được diễn tập: thiết kế một kiểm thử đầu cuối chạy một quy trình thực, làm nó gặp sự cố, và xác nhận đường hoàn tác kích hoạt. Kiểm thử khẳng định điều gì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Checkpoint (Điểm kiểm tra) | “Điểm lưu” | Mọi chuyển trạng thái đồ thị lưu bền vững vào một kho lưu trữ bền vững |
| Lease (Quyền thuê) | “Quyền nhận việc của worker” | Quyền nhận việc ngắn hạn rằng một worker đang thực thi một lần chạy; hết hạn khi gặp sự cố |
| Precondition (Tiền điều kiện) | “Cổng trạng thái” | Khẳng định rằng trạng thái vẫn nhất quán với hành động đã được phê duyệt |
| Post-action verify (Xác minh sau hành động) | “Kiểm tra đọc lại” | Xác nhận tác dụng phụ thực sự xảy ra trong hệ thống đích |
| In-band rollback (Hoàn tác trong băng) | “Đảo ngược trực tiếp” | Đảo ngược tác dụng phụ bằng thao tác nghịch đảo |
| Compensating transaction (Giao dịch bù trừ) | “Đảo ngược SAGA” | Một hành động mới trung hòa hành động gốc |
| Mark-as-done-first (Đánh dấu là xong trước) | “Thứ tự ghi trạng thái” | Lưu bền vững trạng thái đã cam kết trước khi trả về từ cam kết |
| Article 14 (Điều 14) | “Giám sát của con người theo EU AI Act” | Vận hành: các checkpoint có thể truy vấn, các lần hoàn tác được diễn tập, dấu vết có thể kiểm toán |

## Further Reading

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — các nguyên thủy checkpoint và phục hồi lease.
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) — Durable Objects như một nền tảng trạng thái.
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) — đường cơ sở quy định.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — cách định hình độ tin cậy cho các quy trình có tầm thời gian dài.
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) — hình dạng quy trình cho Claude Code Routines.
