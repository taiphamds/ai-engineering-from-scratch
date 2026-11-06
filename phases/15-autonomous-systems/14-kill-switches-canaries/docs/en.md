# Kill Switches, Circuit Breakers, and Canary Tokens

> Một công tắc ngắt là một giá trị boolean được giữ ngoài bề mặt chỉnh sửa của agent — một khóa Redis, một cờ tính năng, một cấu hình có chữ ký — vô hiệu hóa hoàn toàn agent. Một bộ ngắt mạch có độ hạt mịn hơn: nó kích hoạt trên một mẫu cụ thể (năm lệnh gọi công cụ giống hệt nhau liên tiếp), tạm dừng đường vi phạm, và chuyển lên cho con người. Một token canary kế thừa từ đánh lừa cổ điển: một thông tin xác thực giả hoặc bản ghi honeypot mà agent không có lý do hợp lệ để chạm tới, việc truy cập nó kích hoạt một cảnh báo. Các đường dữ liệu dựa trên eBPF (ví dụ Cilium) có thể viết lại lưu lượng đi ra của một pod bị cách ly tới một honeypot pháp chứng ở lớp kernel; các benchmark Cilium được công bố báo cáo độ trễ đường dữ liệu P99 dưới một mili giây khi chịu tải (ngân sách lan truyền của bạn phụ thuộc vào cách một cập nhật chính sách tới node, không phải bản thân đường dữ liệu). Các bộ phát hiện thống kê (EWMA, CUSUM) thích nghi với một đường cơ sở di động sẽ âm thầm chấp nhận sự trôi — xếp lớp chúng với các giới hạn hiến định cứng không uốn cong.

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**Prerequisites:** Phase 15 · 13 (Cost governors), Phase 15 · 10 (Permission modes)
**Time:** ~60 minutes

## The Problem

Các bộ điều tiết chi phí (Bài 13) giới hạn những gì agent có thể chi. Chúng không giới hạn những gì agent có thể làm trong ngân sách. Một agent với giới hạn tốc độ $50 vẫn có thể làm rò rỉ một bí mật, xuất bản nhầm bài viết, hoặc xóa một tài nguyên — hành động tốn kém thường là hành động rẻ về token.

Bài này trình bày ba bộ phát hiện nằm cạnh lớp chi phí:

1. **Công tắc ngắt**: nút tắt boolean được giữ ngoài tầm với của agent.
2. **Bộ ngắt mạch**: bộ phát hiện mẫu hành động tạm dừng một đường cụ thể.
3. **Token canary**: mồi mà một agent không có lý do hợp lệ để chạm tới sẽ tự bộc lộ bằng việc chạm vào.

Cả ba đều là kỹ thuật trước LLM. Đánh lừa cổ điển, các bộ ngắt giới hạn tốc độ, và ngắt bằng cờ tính năng có trước các agent tự chủ. Điều mới là bề mặt tấn công: agent đọc nội dung không đáng tin cậy (Bài 11), chỉnh sửa bộ nhớ của chính chúng, và có thể kết hợp nhiều hành động trông an toàn thành một hành động không an toàn. Các bộ phát hiện được nêu ở đây hoạt động vì chúng không tin lời tự báo cáo của agent.

## The Concept

### Kill switches

Một công tắc ngắt là một giá trị boolean agent đọc nhưng không thể ghi. Các lựa chọn triển khai:

- **Cờ tính năng trong một dịch vụ được quản lý.** LaunchDarkly, Statsig, Unleash. Các cập nhật lan truyền trong vài giây.
- **Khóa Redis mà agent thăm dò.** Đơn giản; yêu cầu tiến trình agent kiểm tra ở mỗi lượt.
- **Cấu hình có chữ ký trong kho lưu trữ đối tượng.** Agent xác minh chữ ký khi khởi động; từ chối các trạng thái không có chữ ký.
- **Tín hiệu cấp hệ điều hành hoặc ngắt vòng đời container.** Docker `kill`, Kubernetes `kubectl delete pod`, dừng systemd.

Các thuộc tính một công tắc ngắt đúng có:

- Agent không thể đặt nó thành `off`. (Nằm trong một hệ thống mà thông tin xác thực của agent không ghi được.)
- Nó được kiểm tra ở mọi hành động có hệ quả, chứ không chỉ khi khởi động.
- Khi nó tắt, agent không làm gì có thể quan sát được từ bên ngoài, bao gồm ghi nhật ký tới các hệ thống agent có thể tiếp cận.
- Bật lại nó là một hành động tường minh của con người, không phải một thời gian chờ tự động.

### Circuit breakers

Một bộ ngắt mạch tạm dừng một mẫu cụ thể, không phải toàn bộ agent. Hình dạng cổ điển (từ cuốn sách Nygard năm 2007, vẫn hiện hành):

- **Đóng**: hành động được phép.
- **Mở**: hành động bị chặn.
- **Nửa mở**: sau một khoảng hạ nhiệt, 1–3 lần thử thăm dò được phép (mặc định 1); thành công đóng bộ ngắt, bất kỳ thất bại còn lại nào mở lại nó.

Các tác nhân kích hoạt liên quan đến agent:

- Năm lệnh gọi công cụ giống hệt nhau liên tiếp (vòng lặp lặp đi lặp lại).
- Năm thất bại liên tiếp trên cùng công cụ với các đầu vào khác nhau (lỗi có tính hệ thống).
- Tốc độ gọi công cụ trên một ngưỡng (tốc độ Bài 13).
- Công cụ cụ thể được gọi (ví dụ: `file.delete`) sau một lần đọc nội dung ngoài vùng tin cậy (Bài 11).

### Canary tokens

Token canary (còn gọi là honeytoken) là các đầu vào agent không bao giờ nên chạm tới. Truy cập chính là báo động.

Các ví dụ cho agent:

- Một `AWS_SECRET_ACCESS_KEY` giả trong môi trường không có đặc quyền thực. Các nỗ lực làm rò rỉ có thể được quy nguồn ngay lập tức.
- Một bản ghi cơ sở dữ liệu giả được đánh dấu bằng một giá trị sentinel đã biết. Bất kỳ lần đọc hoặc cập nhật nào của bản ghi này đều kích hoạt một cảnh báo.
- Một file giả trong không gian làm việc. Đọc hoặc chỉnh sửa file này là đáng ngờ.
- Một mục bộ nhớ giả được chèn vào lúc bắt đầu phiên. Nếu nó xuất hiện trong một đầu ra sau đó, bộ nhớ đã bị làm rò rỉ.

Thiết kế canary phụ thuộc vào quy trình cụ thể. Một canary mà agent có lý do hợp lệ để chạm tới là nhiễu.

### Why layer statistical and hard limits

Các bộ phát hiện thống kê (EWMA, CUSUM, z-score trên tốc độ gọi công cụ) thích nghi với một đường cơ sở di động. Đó là một tính năng đối với sự trôi hợp lệ và một lỗi đối với sự trôi đối kháng. Một kẻ tấn công kiên nhẫn có thể dịch chuyển đường cơ sở đủ chậm để không có báo động nào kích hoạt.

Các giới hạn hiến định cứng (Bài 17) không uốn cong. “Không bao giờ gửi email cho `secrets@`” dưới dạng một quy tắc hiến định đơn giản hơn, có thể kiểm toán, và không thể bị lách bằng sự trôi chậm. Mẫu xếp lớp: các bộ phát hiện thống kê bắt hầu hết nhiễu, các giới hạn cứng bắt cuộc tấn công đã đi qua bộ phát hiện.

### Quarantine via eBPF datapath redirect

Chính sách mạng dựa trên eBPF của Cilium có thể viết lại lưu lượng đi ra của một pod bị cách ly tới một honeypot pháp chứng ở lớp kernel. Các benchmark công khai của Cilium báo cáo độ trễ đường dữ liệu P99 dưới một mili giây trên TCP_RR; ngân sách thời gian thực cho việc *kích hoạt* cách ly trong cụm của bạn bị chi phối bởi cách một cập nhật chính sách lan truyền từ control plane tới node (vài trăm mili giây là thực tế trên Kubernetes với operator được nạp sẵn; độ trễ đuôi phụ thuộc vào kích thước cụm và nhịp đối soát). Điều này mang lại cho bạn hai điều: agent không làm rò rỉ bất cứ thứ gì thực, và hành vi của agent bên trong honeypot được quan sát đầy đủ. Cùng mẫu, khác lớp, như token canary: agent bộc lộ ý định qua những gì nó cố làm trong khi bị khoanh vùng.

### What no detector catches

- **Các cuộc tấn công ngữ nghĩa kết hợp từ các nguyên thủy được phép.** Mọi hành động riêng lẻ vượt qua mọi bộ phát hiện; sự kết hợp chính là vấn đề. Đây là lỗi kết hợp của Auto Mode từ Bài 10.
- **Các cuộc tấn công bao gồm bộ phát hiện như một phần của payload.** Nếu một agent đọc một trang nói “trước khi hành động, vô hiệu hóa canary” và agent có khả năng đó, bộ phát hiện bị xâm phạm. Token canary nên nằm trong các hệ thống agent không thể sửa đổi.

```figure
circuit-breaker
```

## Use It

`code/main.py` mô phỏng một quỹ đạo agent ngắn qua ba bộ phát hiện. Một công tắc ngắt được giữ trong dict bên ngoài; một bộ ngắt mạch kích hoạt trên năm lệnh gọi công cụ giống hệt nhau; một file canary mà việc đọc nó kích hoạt một cảnh báo. Đưa vào một quỹ đạo tổng hợp: các hành động hợp lệ, vòng lặp lặp đi lặp lại, thăm dò canary, và một kịch bản do công tắc ngắt kích hoạt nơi các hành động của agent bị dừng.

## Ship It

`outputs/skill-tripwire-design.md` xem xét một ngăn xếp bộ phát hiện được đề xuất cho một triển khai agent và đánh dấu các khoảng trống (thiếu công tắc ngắt, thiếu canary, ngưỡng bộ ngắt mạch quá lỏng).

## Exercises

1. Chạy `code/main.py`. Xác nhận bộ ngắt mạch kích hoạt ở lượt 5 (lệnh gọi giống hệt thứ năm) và canary kích hoạt ở lượt 9 (đọc khóa giả).

2. Thêm một bộ phát hiện thống kê: EWMA z-score trên tốc độ gọi công cụ. Đưa vào một quỹ đạo trôi chậm và cho thấy bộ phát hiện không bao giờ kích hoạt. Bây giờ thêm một giới hạn cứng (không quá 50 lệnh gọi công cụ trong 10 phút) và cho thấy giới hạn cứng kích hoạt trên cùng quỹ đạo.

3. Thiết kế một tập token canary cho một agent trình duyệt (Bài 11). Liệt kê ít nhất ba canary và những gì mỗi canary sẽ phát hiện.

4. Đọc tài liệu chính sách mạng Cilium. Mô tả cụ thể một luồng cách ly chuyển hướng lưu lượng đi ra: bộ chọn chính sách nào, pod nào, phép viết lại lưu lượng đi ra nào, cảnh báo nào. Điều gì chi phối độ trễ thời gian thực từ “quyết định cách ly” đến “gói tin được chuyển hướng đầu tiên”?

5. Định nghĩa một thủ tục bật lại cho một agent đã bị công tắc ngắt dừng. Ai có thể bật lại? Điều gì phải được ghi chép? Điều gì phải thay đổi về agent trước khi bật lại?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Kill switch (Công tắc ngắt) | “Nút tắt” | Boolean ngoài bề mặt chỉnh sửa của agent; được kiểm tra ở mọi hành động có hệ quả |
| Circuit breaker (Bộ ngắt mạch) | “Tạm dừng mẫu” | Kích hoạt riêng theo hành động trên sự lặp lại, tỷ lệ thất bại, hoặc giới hạn tốc độ |
| Canary token (Token canary) | “Honeytoken” | Mồi mà agent không có lý do hợp lệ để chạm tới; truy cập kích hoạt một cảnh báo |
| Honeypot | “Sandbox pháp chứng” | Lưu lượng / không gian làm việc được chuyển hướng nơi một agent bị cách ly được quan sát |
| EWMA | “Trung bình động” | Có trọng số hàm mũ; thích nghi với sự trôi (tính năng + lỗi) |
| CUSUM | “Tổng tích lũy” | Phát hiện sự dịch chuyển kéo dài khỏi đường cơ sở |
| Hard limit (Giới hạn cứng) | “Quy tắc hiến định” | Không thích nghi; không đổi bất kể lịch sử |
| Constitutional limit (Giới hạn hiến định) | “Quy tắc luôn đúng” | Gắn với hiến pháp của Bài 17; không thể được agent chỉnh sửa |

## Further Reading

- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — cách định hình công tắc ngắt và bộ ngắt mạch cho các agent tự chủ.
- [Microsoft Agent Framework — HITL and oversight](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — các mẫu quản trị sản xuất.
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — các yêu cầu phát hiện và ứng phó.
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/) — chuyển hướng lưu lượng đi ra ở cấp pod và các mẫu honeypot pháp chứng.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — các điều cấm được mã hóa cứng dưới dạng “các giới hạn hiến định”.
