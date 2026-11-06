# Human-in-the-Loop: Propose-Then-Commit

> Sự đồng thuận năm 2026 về HITL là cụ thể. Nó không phải là “agent hỏi, người dùng nhấp Approve.” Nó là đề xuất rồi cam kết: hành động được đề xuất được lưu bền vững vào một kho lưu trữ bền vững với một khóa lũy đẳng; được trình cho một người xem xét với ý định, nguồn gốc dữ liệu, các quyền được chạm tới, phạm vi ảnh hưởng, và một kế hoạch hoàn tác; chỉ được cam kết sau xác nhận tích cực; được xác minh sau thực thi để xác nhận tác dụng phụ thực sự xảy ra. `interrupt()` của LangGraph cộng với checkpoint PostgreSQL, `RequestInfoEvent` của Microsoft Agent Framework, và `waitForApproval()` của Cloudflare đều triển khai cùng hình dạng. Chế độ lỗi điển hình là phê duyệt máy móc: “Approve?” được nhấp mà không xem xét. Biện pháp giảm thiểu được ghi nhận là thách thức và đáp ứng với một danh sách kiểm tra tường minh.

**Type:** Learn
**Languages:** Python (stdlib, propose-then-commit state machine with idempotency)
**Prerequisites:** Phase 15 · 12 (Durable execution), Phase 15 · 14 (Tripwires)
**Time:** ~60 minutes

## The Problem

Một agent thực hiện một hành động. Người dùng phải quyết định: phê duyệt hay không. Nếu quyết định là tức thì, có lẽ đó không phải là xem xét. Nếu quyết định có cấu trúc, nó chậm nhưng đáng tin cậy. Câu hỏi kỹ thuật là làm thế nào để việc xem xét có cấu trúc trở thành con đường ít trở lực nhất.

Mẫu HITL thời kỳ 2023 là một lời nhắc đồng bộ: “Agent muốn gửi email tới X với nội dung Y — phê duyệt?” Người dùng nhấp Approve. Mọi người cảm thấy hệ thống an toàn. Trong thực tế bề mặt này bị phê duyệt máy móc rất nhiều: người dùng phê duyệt nhanh, các phê duyệt dự đoán được ít, và khi agent đi sai, dấu vết kiểm toán cho thấy một lịch sử dài các phê duyệt mà người dùng không thể nhớ lại.

Mẫu năm 2026 — đề xuất rồi cam kết — chuyển HITL lên một nền tảng bền vững, gắn siêu dữ liệu có cấu trúc, và yêu cầu cam kết tích cực. Mỗi SDK agent được quản lý đều cung cấp một phiên bản: LangGraph `interrupt()`, Microsoft Agent Framework `RequestInfoEvent`, Cloudflare `waitForApproval()`. Các tên API khác nhau; hình dạng thì không.

## The Concept

### The propose-then-commit state machine

1. **Đề xuất.** Agent tạo ra một hành động được đề xuất. Được lưu bền vững vào một kho lưu trữ bền vững (PostgreSQL, Redis, Durable Object). Bao gồm:
   - ý định (vì sao agent làm điều này)
   - nguồn gốc dữ liệu (nguồn nào dẫn tới đề xuất này)
   - các quyền được chạm tới (những phạm vi / file / endpoint nào)
   - phạm vi ảnh hưởng (trường hợp xấu nhất là gì)
   - kế hoạch hoàn tác (nếu được cam kết, chúng ta đảo ngược nó như thế nào)
   - khóa lũy đẳng (duy nhất cho mỗi đề xuất; gửi lại trả về cùng bản ghi)
2. **Trình bày.** Người xem xét thấy đề xuất với mọi siêu dữ liệu. Người xem xét là một người (không phải agent tự xem xét chính nó).
3. **Cam kết.** Xác nhận tích cực. Hành động thực thi.
4. **Xác minh.** Sau thực thi, tác dụng phụ được đọc lại và xác nhận. Nếu bước xác minh thất bại, hệ thống ở trong một trạng thái xấu đã biết và cảnh báo được kích hoạt.

### The idempotency key

Không có khóa lũy đẳng, một lần thử lại sau một lỗi thoáng qua có thể thực thi hai lần một hành động đã được phê duyệt. Ví dụ cụ thể: người dùng phê duyệt “chuyển $100 từ A sang B.” Mạng chập chờn. Quy trình thử lại. Người dùng đã phê duyệt một lần nhưng việc chuyển thực thi hai lần. Khóa lũy đẳng gắn phê duyệt với một tác dụng phụ đơn lẻ, duy nhất; lần thực thi thứ hai không làm gì.

Đây là cùng mẫu lũy đẳng mà các API Stripe và AWS sử dụng. Việc tái sử dụng nó cho phê duyệt agent được nêu tường minh trong tài liệu Microsoft Agent Framework.

### Durability: why approvals outlast processes

Phòng chờ phê duyệt là một phần trạng thái mà agent không sở hữu. Quy trình được tạm dừng (Bài 12). Khi phê duyệt đến, quy trình tiếp tục từ đúng điểm đó. Đây là lý do LangGraph ghép `interrupt()` với checkpoint PostgreSQL và không chỉ trạng thái trong bộ nhớ — một phê duyệt hai ngày sau vẫn tìm thấy quy trình nguyên vẹn.

### Rubber-stamp approvals and the challenge-and-response mitigation

Giao diện mặc định cho HITL (các nút “Approve” / “Reject”) tạo ra các phê duyệt nhanh mà không có xem xét thực chất. Biện pháp giảm thiểu được ghi nhận: một danh sách kiểm tra thách thức và đáp ứng yêu cầu các câu trả lời tích cực cho các câu hỏi cụ thể trước khi nút Approve được bật. Hình dạng cụ thể:

- “Bạn có hiểu việc này chạm tới tài nguyên nào không? [ ]”
- “Bạn đã xác minh phạm vi ảnh hưởng có thể chấp nhận được chưa? [ ]”
- “Bạn có kế hoạch hoàn tác nếu việc này thất bại không? [ ]”

Không phải thủ tục vì chính thủ tục — một cơ chế buộc thực hiện. Người xem xét không thể đánh dấu các ô hoặc hỏi để làm rõ (chuyển cấp) hoặc từ chối (mặc định an toàn). Nghiên cứu an toàn agent của Anthropic viện dẫn rõ ràng HITL dựa trên danh sách kiểm tra như một biện pháp giảm thiểu cho các mẫu phê duyệt máy móc.

### What counts as consequential

Không phải mọi hành động đều cần đề xuất rồi cam kết. Hướng dẫn năm 2026:

- **Các hành động có hệ quả** (luôn HITL): ghi không thể đảo ngược, giao dịch tài chính, giao tiếp đi ra ngoài, thay đổi cơ sở dữ liệu sản xuất, các thao tác hệ thống file phá hủy.
- **Các hành động có thể đảo ngược** (đôi khi HITL): chỉnh sửa các file cục bộ, thay đổi môi trường staging, ghi có thể đảo ngược với hoàn tác rõ ràng.
- **Đọc và kiểm tra** (không bao giờ HITL): đọc một file, liệt kê tài nguyên, gọi một API chỉ đọc.

### Post-action verification

“Cam kết đã chạy” không giống “tác dụng phụ đã xảy ra.” Phân vùng mạng và các điều kiện tranh chấp có thể tạo ra một quy trình nghĩ rằng nó thành công trong khi backend không lưu bền vững. Bước xác minh đọc lại tài nguyên đích sau cam kết để xác nhận. Đây là cùng mẫu với các giao dịch cơ sở dữ liệu có mệnh đề `RETURNING` hoặc AWS `GetObject` sau `PutObject`.

### EU AI Act Article 14

Điều 14 bắt buộc sự giám sát hiệu quả của con người cho các hệ thống AI rủi ro cao tại EU. “Hiệu quả” không phải là trang trí. Ngôn ngữ quy định loại trừ cụ thể các mẫu phê duyệt máy móc. Đề xuất rồi cam kết với thách thức và đáp ứng là hình dạng vượt qua sự xem xét kỹ lưỡng theo Điều 14 trong tài liệu tuân thủ Microsoft Agent Governance Toolkit.

```figure
mx-propose-then-commit
```

## Use It

`code/main.py` triển khai một máy trạng thái đề xuất rồi cam kết bằng thư viện chuẩn Python. Kho lưu trữ bền vững là một file JSON. Khóa lũy đẳng là một hàm băm của (thread_id, action_signature). Trình điều khiển mô phỏng ba trường hợp: một luồng phê duyệt sạch, một lần thử lại sau lỗi thoáng qua (không được thực thi hai lần), và một mặc định phê duyệt máy móc so với một luồng thách thức và đáp ứng.

## Ship It

`outputs/skill-hitl-design.md` xem xét một quy trình HITL được đề xuất về hình dạng đề xuất rồi cam kết và đánh dấu các lớp siêu dữ liệu, tính lũy đẳng, xác minh, hoặc thách thức và đáp ứng còn thiếu.

## Exercises

1. Chạy `code/main.py`. Xác nhận một lần thử lại của một đề xuất đã được phê duyệt sử dụng bản ghi bền vững và không thực thi lại. Bây giờ thay đổi khóa lũy đẳng để bao gồm một dấu thời gian và cho thấy lần thử lại thực thi hai lần.

2. Mở rộng bản ghi đề xuất với một trường `rollback`. Mô phỏng một lần thực thi có bước xác minh thất bại. Cho thấy hoàn tác tự động kích hoạt.

3. Đọc tài liệu `RequestInfoEvent` của Microsoft Agent Framework. Xác định một trường siêu dữ liệu API bao gồm mà engine đồ chơi còn thiếu. Thêm nó và giải thích nó bảo vệ chống lại điều gì.

4. Thiết kế một danh sách kiểm tra thách thức và đáp ứng cho một hành động cụ thể (ví dụ: “đăng lên một tài khoản Twitter công khai”). Người xem xét phải trả lời ba câu hỏi nào? Vì sao là ba câu đó?

5. Chọn một trường hợp mà một lời nhắc “Phê duyệt?” đồng bộ sẽ đủ (không cần kho lưu trữ bền vững). Giải thích vì sao, và nêu loại rủi ro bạn đang chấp nhận.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Propose-then-commit (Đề xuất rồi cam kết) | “Phê duyệt hai giai đoạn” | Đề xuất được lưu bền vững + cam kết tích cực + xác minh |
| Idempotency key (Khóa lũy đẳng) | “Token an toàn khi thử lại” | Duy nhất cho mỗi đề xuất; lần thực thi thứ hai không làm gì |
| Data lineage (Nguồn gốc dữ liệu) | “Nó đến từ đâu” | Nội dung nguồn cụ thể dẫn tới đề xuất |
| Blast radius (Phạm vi ảnh hưởng) | “Trường hợp xấu nhất” | Phạm vi tác động nếu hành động đi sai |
| Rubber-stamp (Phê duyệt máy móc) | “Phê duyệt nhanh” | “Approve” được nhấp mà không có xem xét thực chất |
| Challenge-and-response (Thách thức và đáp ứng) | “Danh sách kiểm tra buộc thực hiện” | Người xem xét phải xác nhận tích cực các câu hỏi cụ thể |
| RequestInfoEvent | “Nguyên thủy MS Agent Framework” | Yêu cầu HITL bền vững với siêu dữ liệu có cấu trúc |
| `interrupt()` / `waitForApproval()` | “Các nguyên thủy framework” | Các dạng tương đương của LangGraph / Cloudflare với cùng hình dạng |

## Further Reading

- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — `RequestInfoEvent`, các phê duyệt bền vững.
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) — `waitForApproval()` và Durable Objects.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — HITL như một biện pháp giảm thiểu cho rủi ro tầm thời gian dài.
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) — đường cơ sở quy định cho các hệ thống rủi ro cao.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — cách định hình hiến định xoay quanh sự giám sát.
