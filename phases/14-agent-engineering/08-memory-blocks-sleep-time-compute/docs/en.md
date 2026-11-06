# Memory Blocks and Sleep-Time Compute

> Các khối bộ nhớ chức năng rời rạc mà mô hình có thể chỉnh sửa trực tiếp, và một agent lúc ngủ hợp nhất bộ nhớ bất đồng bộ trong khi agent chính nhàn rỗi. Hai ý tưởng này là cách bạn mở rộng bộ nhớ vượt một hội thoại.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## Learning Objectives

- Nêu tên ba tầng bộ nhớ Letta sử dụng (cốt lõi, hồi tưởng, lưu trữ) và vai trò của từng tầng.
- Giải thích mẫu khối bộ nhớ: khối Human, khối Persona và các khối do người dùng định nghĩa như các đối tượng có kiểu hạng nhất.
- Mô tả tính toán lúc ngủ là gì, vì sao nó nằm ngoài đường tới hạn và vì sao nó có thể chạy một mô hình mạnh hơn agent chính.
- Triển khai một vòng lặp hai agent được viết kịch bản trong đó một agent chính phục vụ các phản hồi và một agent lúc ngủ hợp nhất các khối giữa các lượt.

## The Problem

MemGPT (Bài 07) giải quyết luồng điều khiển bộ nhớ ảo. Ba vấn đề sản xuất xuất hiện:

1. **Độ trễ.** Mọi thao tác bộ nhớ nằm trên đường tới hạn. Nếu agent phải cắt tỉa, tóm tắt hoặc hòa giải trong khi người dùng chờ, độ trễ đuôi tăng vọt.
2. **Bộ nhớ mục nát.** Các lần ghi tích lũy. Các sự thật bị mâu thuẫn vẫn còn. Truy xuất chìm trong nội dung cũ.
3. **Mất cấu trúc.** Một kho lưu trữ phẳng không thể biểu đạt "khối Human luôn ở trong prompt; khối Persona luôn ở trong prompt; khối Task thay đổi theo phiên."

Letta (letta.com) là tên nền tảng mà dự án MemGPT gốc nhận vào năm 2024 — mẫu của bài báo giữ tên MemGPT — và bản viết lại Letta V1 năm 2026 là một bước riêng, về sau. Các khối bộ nhớ làm cho cấu trúc tường minh; tính toán lúc ngủ chuyển việc hợp nhất ra ngoài đường tới hạn.

## The Concept

### Three tiers

| Tầng | Phạm vi | Nơi nó tồn tại | Được ghi bởi |
|------|-------|----------------|------------|
| Cốt lõi | Luôn hiển thị | Bên trong prompt chính | Lời gọi công cụ agent + các lần viết lại lúc ngủ |
| Hồi tưởng | Lịch sử hội thoại | Có thể truy xuất | Ghi log lượt tự động |
| Lưu trữ | Các sự thật tùy ý | Vector + KV + đồ thị | Lời gọi công cụ agent + nạp dữ liệu lúc ngủ |

Cốt lõi là phần cốt lõi của MemGPT. Hồi tưởng là bộ đệm hội thoại với phần đuôi bị loại bỏ của nó. Lưu trữ là kho bên ngoài. Sự phân tách làm rõ việc quá tải hai tầng của MemGPT.

### Memory blocks

Một khối là một phần có kiểu, lưu giữ, có thể chỉnh sửa của tầng cốt lõi. Bài báo MemGPT gốc định nghĩa hai khối:

- **Khối Human** — các sự thật về người dùng (tên, vai trò, sở thích, mục tiêu).
- **Khối Persona** — quan niệm về bản thân của agent (danh tính, giọng điệu, các ràng buộc).

Letta khái quát hóa thành các khối tùy ý do người dùng định nghĩa: một khối `Task` cho mục tiêu hiện tại, một khối `Project` cho các sự thật về cơ sở mã, một khối `Safety` cho các ràng buộc cứng. Mỗi khối có một `id`, `label`, `value`, `limit` (giới hạn ký tự), `description` (để mô hình biết khi nào chỉnh sửa nó).

Các khối có thể chỉnh sửa qua bề mặt công cụ:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)` — cô đọng một khối gần giới hạn của nó.

### Sleep-time compute

Phần bổ sung Letta năm 2025: chạy một agent thứ hai ở nền, ngoài đường tới hạn. Các agent lúc ngủ xử lý các bản ghi hội thoại và ngữ cảnh cơ sở mã, ghi `learned_context` vào các khối dùng chung, và hợp nhất hoặc vô hiệu hóa các bản ghi lưu trữ.

Các thuộc tính phát sinh:

- **Không có chi phí độ trễ.** Các phản hồi chính không chờ các thao tác bộ nhớ.
- **Cho phép mô hình mạnh hơn.** Agent lúc ngủ có thể là một mô hình đắt hơn, chậm hơn vì nó không bị ràng buộc độ trễ.
- **Cửa sổ hợp nhất tự nhiên.** Loại trùng, tóm tắt, vô hiệu hóa các sự thật bị mâu thuẫn khi người dùng không chờ.

Hình dạng này khớp với cách con người làm việc: bạn làm tác vụ, bạn ngủ để suy ngẫm về nó, bộ nhớ dài hạn ổn định qua đêm.

### Native reasoning

Letta V1 (`letta_v1_agent`, 2026) ngừng dùng `send_message`/heartbeat và các token `Thought:` nội tuyến để chuyển sang suy luận gốc. Responses API (OpenAI) và Messages API với tư duy mở rộng (Anthropic) phát ra suy luận trên một kênh riêng, được chuyển tiếp qua các lượt (được mã hóa xuyên các nhà cung cấp trong sản xuất). Vòng lặp điều khiển vẫn là ReAct. Trace suy nghĩ mang tính cấu trúc, không có dạng prompt.

### Where this pattern goes wrong

- **Khối phình to.** `block_append` vô hạn chạm giới hạn nhanh chóng. Nối một bộ tóm tắt khối trước lần ghi đẩy vượt giới hạn.
- **Trôi dạt âm thầm.** Agent lúc ngủ viết lại một khối và agent chính không bao giờ nhận thấy. Đánh phiên bản các khối và hiển thị các diff trong trace.
- **Hợp nhất bị đầu độc.** Agent lúc ngủ xử lý nội dung mà kẻ tấn công có thể tiếp cận vào phần cốt lõi. Bài 27 cũng áp dụng cho bề mặt lúc ngủ.

```figure
memory-blocks
```

## Build It

`code/main.py` triển khai:

- `Block` — id, label, value, limit, description.
- `BlockStore` — CRUD + hàm trợ giúp `near_limit(label)`.
- Hai agent được viết kịch bản — `PrimaryAgent` phục vụ một lượt, `SleepTimeAgent` hợp nhất giữa các lượt.
- Một trace cho thấy một hội thoại ba lượt với các lần ghi khối, cộng một lượt lúc ngủ tóm tắt một khối và vô hiệu hóa một sự thật cũ.

Chạy nó:

```
python3 code/main.py
```

Bản ghi cho thấy sự phân tách: các lượt chính nhanh và tạo các lần ghi thô; lượt ngủ cô đọng và dọn dẹp.

## Use It

- **Letta** (letta.com) cho triển khai tham chiếu. Tự host hoặc đám mây được quản lý.
- **Các skill Claude Agent SDK** như tri thức có dạng khối — một skill là một khối chỉ dẫn có tên, có phiên bản, có thể truy xuất mà agent tải theo yêu cầu.
- **Các bản dựng tùy chỉnh** cho các nhóm muốn kiểm soát backend lưu trữ. Sử dụng hợp đồng Letta API để bạn có thể di chuyển sau này.

## Ship It

`outputs/skill-memory-blocks.md` tạo một hệ thống khối có dạng Letta với các hook lúc ngủ cho bất kỳ runtime nào, bao gồm các quy tắc an toàn và kết nối trích dẫn.

## Exercises

1. Thêm một công cụ `block_summarize` thay thế giá trị khối bằng một bản tóm tắt do mô hình tạo khi `near_limit` trả về true. Ngưỡng kích hoạt nào giảm thiểu cả các lời gọi tóm tắt lẫn tràn khối?
2. Triển khai loại trùng lúc ngủ trên kho lưu trữ: hai bản ghi có văn bản chồng lấp token >90% gộp thành một. Chỉ làm điều đó trong lượt ngủ, không bao giờ trên đường tới hạn.
3. Đánh phiên bản các khối. Trên mọi lần ghi, ghi lại giá trị cũ và một diff. Cung cấp `block_history(label)` để người vận hành có thể gỡ lỗi "vì sao agent quên X."
4. Coi các agent lúc ngủ là những bên ghi không đáng tin cậy. Khi chúng chạm khối Persona hoặc Safety, yêu cầu một đánh giá của agent thứ hai trước khi ghi nhận.
5. Chuyển ví dụ sang sử dụng Letta API (`letta_v1_agent`). Điều gì thay đổi trong schema khối, và suy luận gốc thay đổi hình dạng trace như thế nào?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Memory block (Khối bộ nhớ) | "Phần prompt có thể chỉnh sửa" | Đoạn bộ nhớ cốt lõi có kiểu, lưu giữ, có thể chỉnh sửa bởi LLM |
| Human block (Khối Human) | "Bộ nhớ người dùng" | Các sự thật về người dùng, được ghim trong phần cốt lõi |
| Persona block (Khối Persona) | "Danh tính agent" | Quan niệm về bản thân, giọng điệu, các ràng buộc, được ghim trong phần cốt lõi |
| Sleep-time compute (Tính toán lúc ngủ) | "Công việc bộ nhớ bất đồng bộ" | Agent thứ hai thực hiện hợp nhất ngoài đường tới hạn |
| Core / Recall / Archival (Cốt lõi / Hồi tưởng / Lưu trữ) | "Các tầng" | Sự phân tách bộ nhớ ba lớp: luôn hiển thị / hội thoại / bên ngoài |
| Block limit (Giới hạn khối) | "Giới hạn" | Giới hạn ký tự cho mỗi khối; buộc tóm tắt |
| Native reasoning (Suy luận gốc) | "Kênh suy nghĩ" | Đầu ra suy luận ở cấp nhà cung cấp, không phải `Thought:` ở cấp prompt |
| Learned context (Ngữ cảnh đã học) | "Đầu ra lúc ngủ" | Các sự thật mà agent lúc ngủ ghi vào các khối dùng chung |

## Further Reading

- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) — mẫu khối
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) — hợp nhất bất đồng bộ
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) — bản viết lại suy luận gốc
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) — nguồn gốc
