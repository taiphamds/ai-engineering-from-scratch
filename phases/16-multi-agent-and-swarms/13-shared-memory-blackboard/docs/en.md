# Shared Memory and Blackboard Patterns

> Hai cách tiếp cận cùng tồn tại trong các hệ thống đa agent năm 2026: **bể thông điệp** (mọi bên thấy thông điệp của mọi bên, như trong AutoGen GroupChat hoặc MetaGPT) và **bảng đen có đăng ký** (các agent đăng ký các sự kiện liên quan, như trong Context-Aware MCP hoặc framework Matrix). Cả hai đều là phần có trạng thái duy nhất của một hệ thống đa agent — có nghĩa cả hai là nơi các lỗi thú vị nằm. Chế độ lỗi tham chiếu là **đầu độc bộ nhớ**: một agent ảo giác một “sự kiện”, các agent khác coi nó là đã xác minh, và độ chính xác suy giảm dần theo một cách khó gỡ lỗi hơn nhiều so với một sự cố tức thì. Bài này xây dựng cả hai cấu trúc từ thư viện chuẩn, chèn một cuộc tấn công đầu độc, và cho thấy ba biện pháp giảm thiểu thực sự hoạt động trong sản xuất.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## Problem

Các hệ thống đa agent cần một nơi để các agent chia sẻ các sự kiện. Một lựa chọn theo nghĩa đen là “truyền mọi thứ trong các thông điệp” — nhưng điều đó tái phát minh trạng thái dùng chung với thêm sao chép. Một lựa chọn khác là “cho mọi bên một nhật ký toàn cục” — nhưng các nhật ký toàn cục tăng không giới hạn và dễ bị đầu độc. Lựa chọn thứ ba là “chiếu một góc nhìn theo từng agent” — có khả năng mở rộng nhưng nặng lược đồ.

Khi một trong các agent ảo giác và ghi ảo giác vào trạng thái dùng chung, mọi agent hạ nguồn đọc trạng thái đó tiếp nhận ảo giác như sự kiện. Đến khi con người nhận ra, chuỗi suy luận đã sâu năm bước và nguyên nhân gốc là thông điệp thứ ba từng được ghi. Gỡ lỗi suy giảm độ chính xác đa agent khó hơn gỡ lỗi một sự cố.

Đây là đầu độc bộ nhớ. Nó là họ lỗi được ghi nhận nhiều thứ hai trong hệ phân loại MAST (Cemri và cộng sự, arXiv:2503.13657) và mang tính cấu trúc: bất kỳ thiết kế bộ nhớ dùng chung nào không có nguồn gốc và một bộ xác minh không thể ghi sẽ cuối cùng thể hiện nó.

## Concept

### The two main topologies

**Bể thông điệp đầy đủ.** Mọi agent đọc mọi thông điệp. AutoGen GroupChat và MetaGPT sử dụng cách này. Đơn giản, minh bạch, có thể kiểm tra, nhưng không mở rộng vượt ~10 agent vì ngữ cảnh của mỗi agent đầy công việc của các agent khác.

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**Bảng đen có đăng ký.** Các agent khai báo quan tâm tới các chủ đề; nền tảng chỉ định tuyến các thông điệp liên quan. CA-MCP (arXiv:2601.11595) và framework phi tập trung Matrix (arXiv:2511.21686) sử dụng cách này. Mở rộng xa hơn, nhưng yêu cầu thiết kế lược đồ từ trước để các đăng ký có ý nghĩa.

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### When each wins

- **Bể đầy đủ** thắng khi các agent ít (< 10), không đồng nhất, và hội thoại có tầm thời gian ngắn. Suy luận ai nói gì là đơn giản khi mọi bên thấy mọi thứ.
- **Bảng đen** thắng khi các agent nhiều, đồng nhất về vai trò nhưng đông về số thể hiện (bầy đàn), và hội thoại chạy dài. Định tuyến tiết kiệm chi phí token và ô nhiễm ngữ cảnh.

Các hệ thống sản xuất thường kết hợp: một bể đầy đủ nhỏ ở trên cùng (lớp lập kế hoạch), các bảng đen bên dưới (lớp worker).

### Memory poisoning, in one scenario

Ba agent làm việc trên một tác vụ nghiên cứu. Agent A là một agent truy xuất. Agent B là một bộ tóm tắt. Agent C là một nhà phân tích.

1. A lấy một trang và ghi một thông điệp vào trạng thái dùng chung: “Nghiên cứu báo cáo cải thiện độ chính xác 42%.”
2. Trang được lấy thực sự nói “cải thiện 4.2%.” A ảo giác một dấu thập phân.
3. B, đọc trạng thái dùng chung, viết: “Mức tăng độ chính xác lớn 42% được báo cáo (nguồn: A).”
4. C, đọc trạng thái dùng chung, viết: “Khuyến nghị áp dụng — mức tăng 42% mang tính chuyển đổi.”
5. Báo cáo cuối cùng trích một con số 42% chưa bao giờ tồn tại.

Không agent nào gặp sự cố. Không kiểm thử nào thất bại. Hệ thống “hoạt động.” Ảo giác vượt từ ngữ cảnh một agent vào suy luận của mọi agent hạ nguồn qua trạng thái dùng chung.

### Why this is structural

Không có trạng thái dùng chung, ảo giác của agent A ở lại ngữ cảnh của A. Các agent hạ nguồn sẽ lấy lại hoặc suy ra lại và có thể bắt lỗi. Với trạng thái dùng chung ngây thơ, ngữ cảnh của A trở thành ngữ cảnh của mọi bên, và ảo giác được rửa thành sự kiện.

Vấn đề không phải là bản thân trạng thái dùng chung — mà là trạng thái dùng chung **không có nguồn gốc và không có một bộ xác minh độc lập**. Ba biện pháp giảm thiểu giải quyết điều này:

1. **Gắn nguồn gốc trên mọi lần ghi.** Mọi mục trong trạng thái dùng chung ghi lại ai viết nó, khi nào, dưới prompt nào, và (nếu áp dụng) agent trích nguồn nào. Các agent hạ nguồn đọc với sự hoài nghi theo nguồn gốc.
2. **Đặt phiên bản các lần ghi; coi chúng là chỉ thêm.** Một sửa chữa là một mục mới thay thế mục cũ, không phải một cập nhật tại chỗ. Dấu vết kiểm toán được bảo toàn.
3. **Giữ ít nhất một agent không thể ghi vào trạng thái chung.** Một agent xác minh chỉ đọc lấy mẫu các mục, tìm nạp lại nguồn và gắn cờ các điểm không nhất quán. Nó vẫn đọc kho chung, nên có thể bị một mục xấu đánh lừa, nhưng nó kiểm tra mỗi mục với nguồn gốc và không thể ghi, nên các phán quyết của nó không bao giờ đưa một sự kiện bị đầu độc trở lại trạng thái chung.

### Blackboard precedent (Hayes-Roth, 1985)

Mẫu bảng đen có trước các agent LLM bốn thập kỷ. Hayes-Roth (1985, “A Blackboard Architecture for Control”) mô tả các Nguồn tri thức chuyên gia quan sát một bảng đen toàn cục, đóng góp các lời giải một phần, và kích hoạt các nguồn khác. Bảng đen năm 2026 (CA-MCP, Matrix) là cùng mẫu với các agent LLM như các Nguồn tri thức và các khối JSON như các lời giải một phần. Tài liệu cũ có các giải pháp được ghi nhận cho tranh chấp ghi, điều khiển cơ hội, và tính nhất quán mà các hệ thống hiện đại khám phá lại.

### Projection vs full view

Một bảng đen thuần túy cho mọi bên đăng ký cùng phép chiếu (giới hạn theo chủ đề). Một thiết kế mạnh hơn là **phép chiếu theo từng agent**: mỗi agent nhận một góc nhìn tùy chỉnh theo vai trò. Các reducer trạng thái của LangGraph là triển khai chuẩn năm 2026 — hàm reducer gộp trạng thái toàn cục thành một lát riêng theo vai trò.

Phép chiếu theo từng agent mở rộng xa hơn nhưng cần một lược đồ. Không có lược đồ, bạn xây dựng lại phép chiếu tùy hứng trong prompt của mỗi agent.

### Write-contention patterns

Nhiều agent ghi đồng thời là một vấn đề đồng thời, không chỉ một vấn đề LLM. Ba mẫu hoạt động:

- **Bên ghi tuần tự (một bên sản xuất).** Mọi lần ghi đi qua một agent phối hợp tuần tự hóa. Đơn giản, nhưng là một nút thắt.
- **Đồng thời lạc quan có quản lý phiên bản.** Mỗi mục có một phiên bản; các bên ghi thất bại khi phiên bản không khớp và thử lại. Kỹ thuật cơ sở dữ liệu cổ điển.
- **Phân vùng chủ đề.** Các agent khác nhau sở hữu các chủ đề khác nhau. Không tranh chấp xuyên chủ đề. Yêu cầu các ranh giới phân vùng được thiết kế.

Hầu hết các framework năm 2026 mặc định dùng bên ghi tuần tự vì các lệnh gọi LLM đủ chậm để tranh chấp hiếm và nút thắt không gây hại.

### The unwritable verifier

Biện pháp giảm thiểu chịu lực nhất là bộ xác minh chỉ đọc. Các quy tắc triển khai:

- Bộ xác minh chia sẻ trạng thái với nhóm (đọc bảng đen hoặc bể).
- Bộ xác minh không có handle ghi tới trạng thái dùng chung — chỉ tới một kênh xác minh riêng.
- Bộ xác minh độc lập lấy các nguồn được trích trong các lần ghi. Gắn cờ bất đồng.
- Các đầu ra của chính bộ xác minh được định tuyến tới một người hoặc một agent quyết định riêng, không bao giờ đưa trở lại bể.

Không có sự tách biệt này, các đầu ra bộ xác minh trở thành các mục mới trong bể, có nghĩa một bể bị đầu độc đầu độc bộ xác minh, rồi đầu độc các xác minh của nó.

```figure
swarm-blackboard
```

## Build It

`code/main.py` triển khai cả hai cấu trúc liên kết bằng thư viện chuẩn Python cộng với một cuộc tấn công đầu độc đồ chơi và ba biện pháp giảm thiểu.

- `MessagePool` — nhật ký chỉ thêm an toàn luồng với đọc ra đầy đủ.
- `Blackboard` — pub/sub định khóa theo chủ đề với các đăng ký theo từng agent.
- `ProvenanceEntry` — mọi lần ghi ghi lại (writer, timestamp, prompt_hash, source_uri).
- `PoisoningScenario` — chạy một tác vụ nghiên cứu ba agent nơi agent A ảo giác một dấu thập phân. In báo cáo cuối cùng.
- `Verifier` — một agent chỉ đọc lấy lại các nguồn và gắn cờ các điểm không nhất quán. Chạy cùng kịch bản với bộ xác minh hiện diện.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng:
- Lần chạy 1 (không bộ xác minh): 42% bị ảo giác lan tới báo cáo cuối cùng.
- Lần chạy 2 (có bộ xác minh): bộ xác minh gắn cờ sự không nhất quán, bể được gắn nhãn “đã gắn cờ”, báo cáo cuối cùng bao gồm một rút lại.

## Use It

`outputs/skill-memory-auditor.md` là một skill kiểm toán thiết kế bộ nhớ dùng chung của bất kỳ hệ thống đa agent nào về nguồn gốc, quản lý phiên bản, và tách biệt bộ xác minh. Chạy nó trên các kiến trúc đa agent mới trước sản xuất.

## Ship It

Cho bất kỳ thiết kế bộ nhớ dùng chung nào:

- Ghi lại nguồn gốc trên mọi lần ghi: `(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`.
- Làm nhật ký chỉ thêm. Các sửa chữa là các mục mới tham chiếu mục bị thay thế.
- Triển khai ít nhất một agent xác minh chỉ đọc với truy cập nguồn độc lập.
- Định tuyến đầu ra bộ xác minh tới một kênh riêng, không trở lại bể dùng chung.
- Ghi nhật ký tỷ lệ các lần ghi là thay thế — một tỷ lệ tăng là bằng chứng sớm của các mẫu ảo giác.

## Exercises

1. Chạy `code/main.py`. Xác nhận lần chạy 1 lan truyền ảo giác và lần chạy 2 bắt nó.
2. Thêm một ảo giác thứ hai: agent B bịa một kích thước tập dữ liệu. Bộ xác minh nên bắt cả hai mà không được điều chỉnh tay cho loại nào.
3. Chuyển bể đầy đủ sang một bảng đen có các phân vùng chủ đề (`prices`, `summaries`, `analyses`). Phân vùng chủ đề khiến những kịch bản đầu độc nào khó thực hiện hơn, và không giúp với những kịch bản nào?
4. Đọc Hayes-Roth (1985, “A Blackboard Architecture for Control”). Xác định hai mẫu điều khiển từ bài báo không được thảo luận trong bài này mà các hệ thống năm 2026 sẽ hưởng lợi.
5. Đọc CA-MCP (arXiv:2601.11595). Ánh xạ Shared Context Store của nó tới lớp MessagePool hoặc Blackboard trong `code/main.py`. CA-MCP thêm các nguyên thủy nào lên trên?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Message pool (Bể thông điệp) | “Lịch sử trò chuyện dùng chung” | Nhật ký chỉ thêm mà mọi agent đọc. Minh bạch đầy đủ, mở rộng kém. |
| Blackboard (Bảng đen) | “Không gian làm việc dùng chung” | Pub/sub định khóa theo chủ đề. Các agent đăng ký các chủ đề liên quan. Mở rộng xa hơn. |
| Provenance (Nguồn gốc) | “Ai viết gì” | Siêu dữ liệu trên mỗi lần ghi: bên ghi, dấu thời gian, prompt, các nguồn. |
| Memory poisoning (Đầu độc bộ nhớ) | “Ảo giác lan truyền” | Lỗi của một agent đi vào trạng thái dùng chung, các agent hạ nguồn tiếp nhận nó như sự kiện. |
| Append-only (Chỉ thêm) | “Không cập nhật tại chỗ” | Các sửa chữa là các mục mới thay thế. Bảo toàn dấu vết kiểm toán. |
| Unwritable verifier (Bộ xác minh không thể ghi) | “Kiểm toán viên độc lập” | Agent chỉ đọc lấy lại các nguồn và gắn cờ các điểm không nhất quán. |
| Projection (Phép chiếu) | “Góc nhìn có phạm vi giới hạn” | Góc nhìn theo từng agent được tính từ trạng thái toàn cục. Các reducer LangGraph là trường hợp chuẩn. |
| Knowledge Source (Nguồn tri thức) | “Agent chuyên gia” | Thuật ngữ năm 1985 của Hayes-Roth cho một bên tham gia bảng đen. |

## Further Reading

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — hệ phân loại MAST; đầu độc bộ nhớ là một họ con lỗi phối hợp
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) — Shared Context Store cho các máy chủ MCP được phối hợp
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686) — bảng đen dựa trên hàng đợi thông điệp không có một bộ điều phối trung tâm
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — mẫu phép chiếu theo từng agent trong sản xuất
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — các ghi chú nguồn gốc và xác minh từ một triển khai sản xuất
