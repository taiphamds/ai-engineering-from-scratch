# Heritage of FIPA-ACL and Speech Acts

> Trước MCP, trước A2A, đã có FIPA-ACL. Năm 2000, Foundation for Intelligent Physical Agents (FIPA, trở thành một ủy ban tiêu chuẩn của IEEE Computer Society năm 2005) phê chuẩn một ngôn ngữ giao tiếp agent với hai mươi performative, hai ngôn ngữ nội dung và một tập giao thức tương tác — contract net, subscribe/notify, request-when. Nó mờ dần khỏi ngành vì chi phí ontology quá nặng cho web, nhưng sự hồi sinh của các hệ thống đa agent nhờ LLM đang âm thầm triển khai lại cùng những ý tưởng mà không có ngữ nghĩa hình thức: các hợp đồng JSON thay cho performative, ngôn ngữ tự nhiên thay cho ontology. Bài học này đọc FIPA-ACL một cách nghiêm túc để bạn có thể thấy quyết định giao thức năm 2026 nào là phát minh lại, quyết định nào là mới mẻ và làn sóng hiện tại sẽ khám phá lại ở đâu những vấn đề mà những năm 2000 đã giải quyết.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## Problem

Bối cảnh giao thức agent năm 2026 nhộn nhịp: MCP cho công cụ, A2A cho agent, ACP cho kiểm toán doanh nghiệp, ANP cho sự tin cậy phi tập trung, NLIP cho nội dung ngôn ngữ tự nhiên, cộng với CA-MCP và hai chục đề xuất nghiên cứu. Mỗi đặc tả tự tuyên bố là nền tảng.

Cách đọc thẳng thắn là hầu hết chúng đang khám phá lại một cây quyết định rất cụ thể đã hai mươi năm tuổi. Lý thuyết hành vi ngôn ngữ từ Austin (1962) và Searle (1969) cho chúng ta “phát ngôn là hành động.” KQML (1993) biến điều đó thành một giao thức truyền tải. FIPA-ACL (phê chuẩn năm 2000) tạo ra sự tiêu chuẩn hóa tham chiếu: hai mươi hành vi ngôn hành, các ngôn ngữ nội dung SL0/SL1, các giao thức tương tác cho contract-net và subscribe-notify. JADE và JACK là các nền tảng tham chiếu Java. Nỗ lực phai nhạt vào khoảng năm 2010 vì chi phí phụ bản thể học quá nặng và web đang thắng.

Khi bạn nhìn `tools/call` của MCP, vòng đời tác vụ của A2A, hoặc kho ngữ cảnh dùng chung của CA-MCP, bạn đang nhìn một bản làm lại mềm hơn, thuần JSON của các quyết định FIPA. Biết di sản cho bạn biết hai điều: những “đổi mới” mới nào thực ra là tái phát minh, và những chế độ lỗi cũ nào các đặc tả mới sẽ khám phá lại.

## Concept

### Speech acts, in one paragraph

Austin nhận thấy rằng một số câu không mô tả thế giới — chúng thay đổi nó. “Tôi hứa.” “Tôi yêu cầu.” “Tôi tuyên bố.” Ông gọi chúng là các phát ngôn ngôn hành. Searle hình thức hóa năm loại: khẳng định, chỉ dẫn, cam kết, biểu cảm, tuyên bố. KQML (Finin và cộng sự, 1993) làm điều này trở nên vận hành được cho các agent phần mềm: một thông điệp là một hành vi ngôn hành (hành động) cộng với nội dung (hành động nói về điều gì). FIPA-ACL dọn các khoảng trống của KQML và tiêu chuẩn hóa quanh hai mươi hành vi ngôn hành.

### The twenty FIPA performatives (partial list)

| Hành vi ngôn hành | Ý định |
|---|---|
| `inform` | “Tôi nói cho bạn biết P là đúng” |
| `request` | “Tôi yêu cầu bạn làm X” |
| `query-if` | “P có đúng không?” |
| `query-ref` | “Giá trị của X là gì?” |
| `propose` | “Tôi đề xuất chúng ta làm X” |
| `accept-proposal` | “Tôi chấp nhận đề xuất” |
| `reject-proposal` | “Tôi từ chối đề xuất” |
| `agree` | “Tôi đồng ý làm X” |
| `refuse` | “Tôi từ chối làm X” |
| `confirm` | “Tôi xác nhận P là đúng” |
| `disconfirm` | “Tôi phủ nhận P” |
| `not-understood` | “Thông điệp của bạn không phân tích cú pháp được” |
| `cfp` | “Mời đề xuất về X” |
| `subscribe` | “Thông báo cho tôi khi X thay đổi” |
| `cancel` | “Hủy X đang diễn ra” |
| `failure` | “Tôi đã thử X và thất bại” |

Danh sách đầy đủ nằm trong `fipa00037.pdf` (FIPA ACL Message Structure). Mục đích không phải là ghi nhớ nó — mục đích là mỗi mục này tương ứng với một nguyên thủy mà một giao thức LLM cuối cùng bổ sung lại.

### Canonical FIPA-ACL message

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

Bảy trường mang vỏ bọc giao thức; một trường (`content`) mang payload. Phần còn lại của các trường chính xác là những gì bạn tái phát minh mỗi khi gắn thêm thử lại, phân luồng, và bản thể học vào một giao thức JSON.

### The two legacy platforms

**JADE** (Java Agent DEvelopment framework, 1999–những năm 2020) là môi trường chạy tuân thủ FIPA được sử dụng nhiều nhất. Các agent mở rộng một lớp cơ sở, trao đổi các thông điệp ACL, chạy bên trong các container, và phối hợp bằng các “hành vi.” Thư viện giao thức tương tác được cung cấp với contract-net, subscribe-notify, request-when, và propose-accept.

**JACK** (Agent Oriented Software, thương mại) nhấn mạnh suy luận BDI (Niềm tin-Mong muốn-Ý định) trên các thông điệp FIPA. Hình thức hơn, ít được áp dụng hơn.

Cả hai suy giảm một khi ngăn xếp web nuốt các trường hợp sử dụng đa agent. MCP và A2A là các “container” môi trường chạy của năm 2026.

### Why FIPA faded

- **Chi phí phụ bản thể học.** FIPA yêu cầu một bản thể học dùng chung để phân tích cú pháp `content`. Thống nhất các bản thể học là một quá trình tiêu chuẩn kéo dài nhiều năm. Web chỉ dùng HTTP + JSON.
- **Ngữ nghĩa hình thức không ai sử dụng.** SL (Ngôn ngữ ngữ nghĩa) đưa ra các điều kiện chân trị nghiêm ngặt, nhưng hầu hết các hệ thống sản xuất sử dụng nội dung dạng tự do và bỏ qua tính hình thức.
- **Khóa chặt công cụ.** JADE chỉ dành cho Java; JACK là thương mại. Các nhóm đa ngôn ngữ đi vòng qua cả hai.
- **Internet thắng ngăn xếp.** REST, rồi JSON-RPC, rồi gRPC thay thế lớp truyền tải của ACL.

### The LLM revival is FIPA-lite

So sánh một `request` FIPA với một `tools/call` MCP:

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

Cùng vỏ bọc, khác cú pháp. Cả hai mang: ai, tới ai, ý định, payload, id tương quan. Không bên nào là một cuộc cách mạng so với bên kia — chúng là các đánh đổi khác nhau trên cùng thiết kế.

Khảo sát năm 2025 của Liu và cộng sự (“A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP”, arXiv:2505.02279) làm dòng kế thừa này tường minh: MCP tương ứng với các hành vi ngôn ngữ sử dụng công cụ, A2A với các hành vi ngôn ngữ agent ngang hàng, ACP với các hành vi ngôn ngữ dấu vết kiểm toán, ANP với các mở rộng danh tính phi tập trung. Các đặc tả mới là hậu duệ ACL với cú pháp JSON và ngữ nghĩa lỏng hơn.

### The trade-off, stated plainly

**Những gì FIPA cho bạn và các đặc tả hiện đại bỏ:**

- Ngữ nghĩa hình thức — bạn có thể chứng minh `inform` kéo theo người gửi tin nội dung.
- Một danh mục chuẩn các hành vi ngôn hành — bạn không phải tranh luận lại “chúng ta có nên có một `cancel` không?”.
- Nhiều thập kỷ các mẫu giao thức tương tác — contract-net, subscribe-notify, propose-accept — với các thuộc tính đúng đắn đã biết.

**Những gì các đặc tả hiện đại cho bạn và FIPA không có:**

- Các payload thuần JSON tương thích với mọi công cụ hiện đại.
- Nội dung ngôn ngữ tự nhiên mà LLM có thể diễn giải mà không có một bản thể học viết tay.
- Truyền tải ngăn xếp web (HTTP, SSE, WebSocket).
- Khám phá năng lực qua MCP `server/discover` trực tiếp và Agent Card A2A.

Ngữ nghĩa ý định lỏng hơn để triển khai dễ hơn. Đó là đánh đổi chính xác.

### Interaction protocols worth porting

FIPA cung cấp ~15 giao thức tương tác. Ba giao thức đáng mang tiếp vào các hệ thống đa agent LLM:

1. **Giao thức Contract Net (CNP).** Người quản lý phát `cfp` (mời đề xuất); các bên dự thầu phản hồi bằng `propose`; người quản lý chấp nhận/từ chối. Đây là mẫu thị trường tác vụ chuẩn (Giai đoạn 16 · 16 Đàm phán).
2. **Đăng ký/Thông báo.** Bên đăng ký gửi `subscribe`; bên xuất bản gửi `inform` mỗi khi chủ đề thay đổi. Đây là mọi bus sự kiện trong năm 2026.
3. **Yêu cầu khi.** “Làm X khi điều kiện Y đúng.” Hành động trì hoãn với các tiền điều kiện. Dạng tương tự năm 2026 là các tác vụ hoãn trong các engine quy trình bền vững (Giai đoạn 16 · 22 Mở rộng quy mô sản xuất).

Mỗi giao thức ánh xạ gọn gàng lên các hàng đợi thông điệp hiện đại, HTTP + thăm dò, hoặc truyền luồng SSE.

### What breaks when you drop the ontology

Không có một bản thể học dùng chung, các agent suy ra ý nghĩa từ nội dung ngôn ngữ tự nhiên. Chế độ lỗi được ghi nhận năm 2026 là **trôi ngữ nghĩa**: hai agent sử dụng cùng từ (`"customer"`) cho các khái niệm khác nhau tinh tế, agent của bên nhận hành động theo diễn giải sai, không bộ xác thực lược đồ nào bắt được nó. Yêu cầu bản thể học của FIPA sẽ từ chối thông điệp tại thời điểm phân tích cú pháp.

Các biện pháp giảm thiểu mà không chuyển hoàn toàn sang bản thể học:

- JSON Schema trên `content` — từ chối các lỗi cấu trúc trên đường truyền.
- Các hiện vật có kiểu (A2A) — từ chối sai phương thức.
- Hành vi ngôn hành tường minh trong vỏ bọc — làm ý định không mơ hồ ngay cả khi nội dung là ngôn ngữ tự nhiên.

### The 2026 specs, mapped to speech-act heritage

| Đặc tả hiện đại | Dạng tương tự FIPA | Những gì nó giữ | Những gì nó bỏ |
|---|---|---|---|
| MCP `tools/call` | `request` | ý định tường minh, id tương quan | ngữ nghĩa hình thức, bản thể học |
| MCP `resources/read` | `query-ref` | ý định tường minh, id tương quan | ngữ nghĩa hình thức |
| Vòng đời Task A2A | contract-net + request-when | vòng đời bất đồng bộ, chuyển trạng thái | các bảo đảm tính đầy đủ hình thức |
| Các sự kiện truyền luồng A2A | subscribe/notify | đẩy bất đồng bộ | đăng ký vị từ có kiểu |
| Ngữ cảnh dùng chung CA-MCP | bảng đen (Hayes-Roth 1985) | bộ nhớ dùng chung nhiều người ghi | mô hình nhất quán logic |
| NLIP | nội dung ngôn ngữ tự nhiên | thuần LLM | lược đồ |

Đọc bảng từ trên xuống dưới, mẫu là: giữ nguyên thủy cấu trúc, bỏ tính hình thức, để LLM che lấp sự mơ hồ.

```figure
sw-contract-net
```

## Build It

`code/main.py` triển khai một bộ chuyển đổi FIPA-ACL thuần thư viện chuẩn. Nó mã hóa và giải mã vỏ bọc ACL chuẩn và cho thấy cách mọi hình dạng thông điệp MCP / A2A quy về cùng bảy trường. Bản demo:

- Mã hóa năm thông điệp kiểu MCP và kiểu A2A dưới dạng FIPA-ACL.
- Giải mã FIPA-ACL trở lại dạng tương đương hiện đại.
- Chạy một cuộc đàm phán Contract Net đồ chơi giữa một người quản lý và ba bên dự thầu sử dụng `cfp`, `propose`, `accept-proposal`, `reject-proposal`.

Chạy:

```
python3 code/main.py
```

Đầu ra là một dấu vết đặt cạnh nhau cho thấy mỗi thông điệp hiện đại trong cả dạng JSON năm 2026 lẫn dạng FIPA-ACL, rồi một vòng khứ hồi của một giá thầu contract-net. Cùng các nguyên thủy giao thức tồn tại qua vòng khứ hồi; chỉ cú pháp khác.

## Use It

`outputs/skill-fipa-mapper.md` là một skill đọc bất kỳ đặc tả giao thức agent nào và tạo ánh xạ FIPA-ACL. Sử dụng nó trước khi áp dụng một giao thức mới để trả lời: “Điều này thực sự mới, hay nó là `inform` với cú pháp JSON?”

## Ship It

Đừng mang FIPA-ACL trở lại. Mang danh sách kiểm tra của nó trở lại:

- Nguyên thủy ý định (hành vi ngôn hành) của mỗi thông điệp là gì?
- Có một id tương quan cho yêu cầu-phản hồi và hủy không?
- Có một ngôn ngữ nội dung tường minh (JSON-RPC, văn bản thuần, hiện vật có kiểu có cấu trúc) không?
- Các giao thức tương tác có là hạng nhất, hay bạn đang triển khai lại contract-net từ đầu?
- Điều gì xảy ra khi hai agent không đồng ý về ý nghĩa nội dung (trôi ngữ nghĩa)?

Ghi lại năm câu hỏi này cho bất kỳ giao thức mới nào trước khi bạn đưa nó vào sản xuất.

## Exercises

1. Chạy `code/main.py`. Quan sát mã hóa khứ hồi. Xác định hành vi ngôn hành FIPA nào tương ứng với `tools/call`, `resources/read`, và tạo tác vụ A2A.
2. Mở rộng demo contract-net với một hành vi ngôn hành `cancel` cho phép người quản lý rút tác vụ giữa lúc đấu thầu. `cancel` giải quyết trường hợp lỗi nào mà chỉ thử lại không giải quyết được?
3. Đọc FIPA ACL Message Structure (http://www.fipa.org/specs/fipa00037/) các mục 4.1–4.3. Chọn một hành vi ngôn hành không được trình bày trong bài này và mô tả dạng tương tự JSON-RPC hiện đại của nó.
4. Đọc Liu và cộng sự, arXiv:2505.02279. Với mỗi giao thức MCP, A2A, ACP, ANP, liệt kê các họ hành vi ngôn hành FIPA mà chúng giữ và bỏ.
5. Thiết kế một JSON-Schema tối thiểu cho trường `content` của một hành vi ngôn hành `request` trong hệ thống của chính bạn. Lược đồ đó cho bạn điều gì mà ngôn ngữ tự nhiên thuần túy không cho, và nó tốn gì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Speech act (Hành vi ngôn ngữ) | “Một phát ngôn làm điều gì đó” | Austin/Searle: phát ngôn như hành động. Cha mẹ lý thuyết của ACL. |
| FIPA | "Thứ XML cũ đó" | Foundation for Intelligent Physical Agents. Chuẩn hóa ACL năm 2000; trở thành một ủy ban tiêu chuẩn của IEEE Computer Society năm 2005. |
| ACL | “Ngôn ngữ giao tiếp agent” | Định dạng vỏ bọc của FIPA: hành vi ngôn hành + nội dung + siêu dữ liệu. |
| Performative (Hành vi ngôn hành) | “Động từ” | Loại ý định của một thông điệp: `inform`, `request`, `propose`, `cfp`, v.v. |
| KQML | “Tiền thân của FIPA” | Ngôn ngữ truy vấn và thao tác tri thức (1993). Đơn giản hơn, hẹp hơn. |
| Ontology (Bản thể học) | “Bộ từ vựng dùng chung” | Một định nghĩa hình thức về các khái niệm mà ngôn ngữ nội dung nói tới. |
| SL0 / SL1 | “Các ngôn ngữ nội dung FIPA” | Các cấp Ngôn ngữ ngữ nghĩa 0 và 1 — họ ngôn ngữ nội dung hình thức. |
| Contract Net (Mạng hợp đồng) | “Thị trường tác vụ” | Người quản lý phát cfp; các bên dự thầu đề xuất; người quản lý chấp nhận. Giao thức tương tác chuẩn. |
| Interaction protocol (Giao thức tương tác) | “Mẫu thông điệp” | Một chuỗi các hành vi ngôn hành với tính đúng đắn đã biết: request-when, subscribe-notify, v.v. |

## Further Reading

- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) — khảo sát chuẩn năm 2025 kết nối các đặc tả hiện đại với di sản FIPA
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) — định dạng vỏ bọc được phê chuẩn năm 2000
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) — danh mục hành vi ngôn hành đầy đủ
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) — dạng tương đương sử dụng công cụ không trạng thái hiện tại của `request`/`query-ref`
- [A2A specification](https://a2a-protocol.org/latest/specification/) — dạng tương đương agent ngang hàng hiện đại của contract-net và subscribe-notify
