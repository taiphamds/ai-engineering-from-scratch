# Agent Economies, Token Incentives, Reputation

> Các agent tự chủ có tầm thời gian dài (đường cong công việc 1 giờ đến 8 giờ của METR) cần năng lực hành động kinh tế. **Ngăn xếp 5 lớp** đang nổi lên là: **DePIN** (tính toán vật lý) → **Danh tính** (W3C DID + vốn danh tiếng) → **Nhận thức** (RAG + MCP) → **Thanh toán** (trừu tượng hóa tài khoản) → **Quản trị** (các DAO agentic). Các mạng khuyến khích agent trong sản xuất bao gồm **Bittensor** (các mạng con TAO thưởng các mô hình riêng theo tác vụ), **Fetch.ai / ASI Alliance** (ASI-1 Mini LLM + token FET), và **Gonka** (PoW dựa trên transformer phân bổ lại tính toán tới các tác vụ AI hữu ích). Công trình học thuật: LaMAS phi tập trung tại AAMAS 2025 sử dụng **quy công trạng bằng giá trị Shapley** để thưởng công bằng các agent đóng góp; “Mechanism design for large language models” của Google Research đề xuất **đấu giá token** với thanh toán giá thứ hai dưới tổng hợp đơn điệu. Bài này xây dựng một chợ agent tối thiểu, áp dụng quy công trạng bằng giá trị Shapley cho một pipeline đa agent, và chạy một đấu giá token giá thứ hai để cơ chế lý thuyết trò chơi trở nên cụ thể.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 16 (Negotiation and Bargaining), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## Problem

Các hệ thống đa agent trở nên phức tạp khi các agent cùng tạo giá trị nhưng cần được thưởng riêng. Các cơ chế cổ điển — chia đều, bên đóng góp cuối lấy tất cả — không công bằng hoặc có thể bị lách. Thưởng dựa trên liên minh qua các giá trị Shapley công bằng do cách xây dựng nhưng tốn kém để tính. Tài liệu giai đoạn 2025-2026 thúc đẩy các xấp xỉ hữu ích: lấy mẫu Shapley, các đấu giá tổng hợp đơn điệu, và danh tiếng trên chuỗi tích lũy từ các đóng góp được xác nhận.

Ngoài quy công trạng, lĩnh vực đã chuyển sang các agent kinh tế thực: Bittensor TAO thưởng tính toán khai thác để tinh chỉnh các mô hình riêng theo mạng con, Fetch.ai/ASI thưởng sử dụng ASI-1 Mini LLM bằng các token FET, Gonka phân bổ lại bằng chứng công việc transformer về các tác vụ AI hữu ích. Các agent giao dịch tự chủ tồn tại ngày nay; câu hỏi là cách căn chỉnh các khuyến khích.

Bài này coi các nền kinh tế agent như một họ vấn đề cụ thể — quy công trạng, thiết kế cơ chế, và danh tiếng — và xây dựng từng phần với toán tối thiểu để các ý tưởng bám lại.

## Concept

### The 5-layer agent-economy stack

1. **DePIN (tính toán vật lý).** Cơ sở hạ tầng phi tập trung cho thuê GPU, lưu trữ, băng thông. Các mạng con Bittensor, Render Network, Akash. Không riêng cho agent; các agent sử dụng nó.
2. **Danh tính.** W3C Decentralized Identifiers (DID) cho mỗi agent một ID bền vững độc lập với bất kỳ nền tảng nào. Danh tiếng tích lũy vào DID. Agent Network Protocol (ANP) sử dụng DID làm lớp khám phá.
3. **Nhận thức.** Vòng lặp suy luận của agent: LLM + RAG + MCP. Đây là những gì các giai đoạn khác xây dựng.
4. **Thanh toán.** Trừu tượng hóa tài khoản (ERC-4337) cho phép các agent trả gas từ số dư riêng mà không giữ ETH. Các agent có thể trả cho dịch vụ, cho nhau, hoặc tính toán.
5. **Quản trị.** Các DAO agentic: các cấu trúc quản trị nơi con người *và* các agent bỏ phiếu về các thay đổi giao thức, với quyền bỏ phiếu gắn với danh tiếng.

Không phải mọi hệ thống sản xuất dùng cả năm. Bittensor dùng 1, 2, một phần 3, một phần 4, không dùng 5. Các agent OpenAI không dùng phần nào ngoài 3. Ngăn xếp là một bản đồ tham chiếu, không phải một yêu cầu.

### Bittensor, Fetch.ai, Gonka — what runs

**Bittensor (TAO).** Các mạng con là các tác vụ chuyên biệt (mô hình hóa ngôn ngữ, sinh hình ảnh, dự báo). Các thợ đào nộp các đầu ra mô hình. Các bộ xác thực xếp hạng chúng; chấm điểm có trọng số theo stake phân phối các phần thưởng TAO. Mỗi mạng con có đánh giá riêng. Bài học kinh tế: trả cho chất lượng đầu ra riêng theo tác vụ, không phải tính toán được dùng.

**Fetch.ai / ASI Alliance.** ASI-1 Mini LLM chạy trên mạng Fetch.ai; người dùng trả các token FET cho suy luận. Câu chuyện agent như các bên ngang hàng mạnh hơn ở đây: một agent trên Fetch có thể gọi agent khác cho một tác vụ và trả bằng FET.

**Gonka.** Bằng chứng công việc transformer: “công việc” là các lượt truyền xuôi của một transformer. Các thợ đào kiếm bằng cách chạy các tác vụ suy luận có các đầu ra đúng đã biết (từ dữ liệu huấn luyện). PoW tạo giá trị tài nguyên thay vì PoW dựa trên hàm băm.

Cả ba đạt mức sản xuất tính đến tháng 4 năm 2026. Phân phối lợi ích khác nhau. Bittensor thưởng chất lượng tương đối với các bộ xác thực mạng con; Fetch thưởng mức thỏa dụng được đo bằng người dùng trả tiền; Gonka thưởng công việc suy luận có thể xác minh.

### Shapley-value credit attribution

Ba agent cộng tác trên một tác vụ. Đầu ra đạt 0.8. Ai đóng góp gì?

Giá trị Shapley: phân bổ công trạng duy nhất thỏa bốn tiên đề (hiệu quả, đối xứng, tuyến tính, null). Với agent `i`:

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

trong đó `S_i_O` là tập các agent trước `i` trong thứ tự `O`. Trong thực tế: liệt kê mọi hoán vị, ghi lại đóng góp biên của mỗi agent trong mỗi hoán vị, lấy trung bình.

Với N=3 agent, có 6 hoán vị. Với N=10, 3.6M — nên trong thực tế bạn lấy mẫu các thứ tự thay vì liệt kê.

### Second-price auction for aggregation

Google Research (“Mechanism design for large language models”) đề xuất các đấu giá token giá thứ hai để tổng hợp các đầu ra LLM. Thiết lập: N agent mỗi agent đề xuất một phần hoàn thành; mỗi agent có một giá trị riêng tư cho việc được chọn. Bên đấu giá chọn đề xuất giá trị cao nhất và trả giá trị *cao thứ hai*. Dưới tổng hợp đơn điệu (giá trị phụ thuộc đề xuất nào được chọn, không phải bao nhiêu đề xuất được đặt giá), điều này trung thực — các agent đặt giá trị thực của chúng.

Vì sao điều này quan trọng cho các hệ thống LLM: bạn có thể thuê ngoài các tác vụ hoàn thành cho nhiều agent với định giá khác nhau; đấu giá chọn tốt nhất + trả công bằng, và các agent không có động cơ báo sai.

### Reputation capital

Một điểm danh tiếng gắn DID tích lũy từ các đóng góp được xác nhận. Một quy tắc cập nhật đơn giản:

```math
\text{rep}(i, t+1) = \alpha \cdot \text{rep}(i, t) + (1 - \alpha) \cdot \text{contribution\_quality}(i, t)
```

Với hệ số suy giảm `alpha` gần 1. Danh tiếng:

- Rẻ để đọc cho các quyết định định tuyến (“gửi các tác vụ khó tới các agent danh tiếng cao”).
- Đắt để giả mạo (tích lũy theo thời gian, gắn DID).
- Có thể bị cắt giảm: các đóng góp thất bại xác minh bị trừ.

### AAMAS 2025 decentralized LaMAS

Đề xuất LaMAS (AAMAS 2025) kết hợp: danh tính DID, quy công trạng bằng giá trị Shapley, và một cơ chế đấu giá đơn giản. Tuyên bố then chốt: phi tập trung hóa bước quy công trạng làm hệ thống có thể kiểm toán và miễn nhiễm với thao túng điểm đơn.

### Where the economics falls apart

- **Thao túng oracle giá.** Nếu hàm công trạng có thể bị lách, các agent sẽ lách nó. Mọi cơ chế cần một kiểm thử đối kháng.
- **Các cuộc tấn công Sybil.** Một người vận hành tạo N agent giả để thổi phồng đóng góp riêng. DID làm chậm nhưng không ngăn điều này; chi phí giả mạo danh tiếng là biện pháp giảm thiểu.
- **Chi phí xác minh.** Quy công trạng chỉ công bằng ngang bộ xác minh. Nếu xác minh rẻ (LLM nhỏ), nó có thể bị lách; nếu đắt (hội đồng con người), hệ thống không mở rộng.
- **Bất định quy định.** Các nền kinh tế agent giao với quy định tài chính. Bittensor, Fetch, và Gonka đều hoạt động trong các vùng xám pháp lý ở một số khu vực tài phán tính đến năm 2026.

### When agent economies make sense

- **Các mạng mở với những người vận hành không đồng nhất.** Không một nhóm đơn lẻ nào kiểm soát mọi agent.
- **Các đầu ra có thể xác minh.** Không có xác minh, quy công trạng là một phỏng đoán.
- **Các quy trình tầm thời gian dài.** Các tác vụ một lần không hưởng lợi từ tích lũy danh tiếng.
- **Các thanh toán token hóa khả thi về pháp lý** trong khu vực tài phán của bạn.

Trong các hệ thống doanh nghiệp đóng, kinh tế nhường chỗ cho phân bổ đơn giản hơn (các quản lý giao việc, các chỉ số nội bộ). Tài liệu kinh tế áp dụng chủ yếu cho các mạng mở.

```figure
swarm-auction
```

## Build It

`code/main.py` triển khai:

- `shapley(value_fn, agents)` — tính Shapley chính xác bằng liệt kê cho N nhỏ.
- `second_price_auction(bids)` — cơ chế trung thực; bên thắng trả cao thứ hai.
- `Reputation` — danh tiếng gắn DID với suy giảm hàm mũ và cắt giảm.
- Demo 1: ba agent cộng tác, Shapley chính xác quy công trạng.
- Demo 2: năm agent đặt giá cho một vị trí tác vụ; đấu giá giá thứ hai chọn bên thắng + khoản thanh toán.
- Demo 3: 100 vòng phân công tác vụ tới các agent có danh tiếng không đồng nhất; định tuyến có trọng số danh tiếng vượt ngẫu nhiên.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: các giá trị Shapley cho mỗi agent; kết quả đấu giá cho thấy cân bằng đặt giá trung thực; định tuyến có trọng số danh tiếng cho thấy mức tăng chất lượng 10-20% so với ngẫu nhiên sau khởi động.

## Use It

`outputs/skill-economy-designer.md` thiết kế một nền kinh tế agent tối thiểu: lựa chọn lớp danh tính, cơ chế quy công trạng, cơ chế thanh toán, quy tắc danh tiếng.

## Ship It

Vận hành một nền kinh tế agent năm 2026:

- **Bắt đầu bằng danh tiếng, không phải token.** Danh tiếng rẻ để triển khai và tự nó có giá trị; token thêm độ phức tạp pháp lý và kinh tế.
- **Xác minh trước khi thưởng.** Không bao giờ phân phối công trạng không có một bước xác minh độc lập. Chất lượng tự báo cáo tích lũy các trò Sybil.
- **Lấy mẫu Shapley, không tính Shapley chính xác.** Lấy mẫu 100-1000 thứ tự; liệt kê chính xác không mở rộng.
- **Giới hạn hệ số suy giảm và đặt sàn danh tiếng.** Suy giảm không giới hạn xóa sạch các bên đóng góp hợp lệ; suy giảm quá chậm thưởng các agent danh tiếng cao lỗi thời.
- **Kiểm toán cơ chế theo cách đối kháng.** Chạy các kịch bản red-team trước khi mở mạng. Mọi cơ chế có một lý thuyết trò chơi; bạn muốn tìm các lỗ hổng, không phải các kẻ tấn công.

## Exercises

1. Chạy `code/main.py`. Xác nhận các giá trị Shapley cộng thành tổng giá trị (tiên đề hiệu quả). Thay đổi hàm giá trị; các phân bổ Shapley có thay đổi theo hướng kỳ vọng không?
2. Triển khai *lấy mẫu* Shapley (Monte Carlo trên K thứ tự). K ảnh hưởng độ chính xác xấp xỉ như thế nào? So sánh với chính xác cho N=4.
3. Triển khai một bước hình thành liên minh trước đấu giá: các agent có thể hợp nhất thành các nhóm và đặt giá như một đơn vị. Các liên minh nào hình thành? Kết quả có tốt hơn theo Pareto so với đặt giá cá nhân không?
4. Đọc bài viết thiết kế cơ chế của Google Research. Xác định một giả định mà nếu bị vi phạm sẽ phá tính trung thực. Chế độ lỗi đó trông như thế nào trong một bối cảnh LLM?
5. Đọc bài báo LaMAS phi tập trung AAMAS 2025. Triển khai bước Shapley của họ trên 10 agent trên một tác vụ tổng hợp. Tính chính xác mất bao lâu? Lấy mẫu tiến gần đến đâu với 100 lần rút?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| DePIN | “Cơ sở hạ tầng vật lý phi tập trung” | Tính toán/lưu trữ/băng thông được khuyến khích bằng token. Bittensor, Akash, Render. |
| DID | “Định danh phi tập trung” | Đặc tả W3C cho các ID di động. Danh tiếng agent gắn với DID, không với một nền tảng. |
| ERC-4337 | “Trừu tượng hóa tài khoản” | Các tài khoản hợp đồng có thể tài trợ gas, cho phép các thanh toán agent. |
| Shapley value (Giá trị Shapley) | “Quy công trạng công bằng” | Phân bổ duy nhất thỏa hiệu quả, đối xứng, tuyến tính, null. |
| Second-price auction (Đấu giá giá thứ hai) | “Đấu giá Vickrey” | Cơ chế trung thực: bên thắng trả giá thầu cao thứ hai. Tương thích tổng hợp đơn điệu. |
| Reputation capital (Vốn danh tiếng) | “Điểm chất lượng tích lũy” | Điểm gắn DID từ các đóng góp được xác nhận; suy giảm theo thời gian. |
| Agentic DAO (DAO agentic) | “Các agent + con người quản trị” | DAO với các bên bỏ phiếu agent như hạng nhất, quyền bỏ phiếu gắn danh tiếng. |
| TAO / FET / GPU credits (TAO / FET / tín dụng GPU) | “Các đơn vị token” | Bittensor TAO, Fetch.ai FET, các token DePIN khác nhau. |

## Further Reading

- [The Agent Economy](https://arxiv.org/abs/2602.14219) — khảo sát năm 2026 về ngăn xếp kinh tế agent 5 lớp
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/) — các đấu giá token với tổng hợp đơn điệu
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) — quy công trạng bằng giá trị Shapley
- [Bittensor TAO documentation](https://docs.bittensor.com/) — cấu trúc mạng con và phân phối phần thưởng
- [Fetch.ai / ASI Alliance](https://fetch.ai/) — ASI-1 Mini LLM và token FET
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) — nền tảng danh tính
