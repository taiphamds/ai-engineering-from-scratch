# Negotiation and Bargaining

> Các agent đàm phán tài nguyên, giá cả, phân bổ tác vụ, và điều khoản. Tập benchmark năm 2026 rõ ràng: NegotiationArena (arXiv:2402.05863) cho thấy các LLM có thể cải thiện lợi ích ~20% qua thao túng nhân cách (“tuyệt vọng”); “Measuring Bargaining Abilities” (arXiv:2402.15813) cho thấy bên mua khó hơn bên bán và quy mô không giúp — **OG-Narrator** của họ (bộ tạo đề nghị xác định + bên diễn đạt LLM) đẩy tỷ lệ thỏa thuận từ 26.67% lên 88.88%; Large-Scale Autonomous Negotiation Competition (arXiv:2503.06416) chạy ~180k cuộc đàm phán và thấy các agent **che giấu chuỗi suy nghĩ** thắng bằng cách giấu suy luận khỏi đối tác; Bhattacharya và cộng sự năm 2025 trên các chỉ số Harvard Negotiation Project xếp Llama-3 hiệu quả nhất, Claude-3 quyết liệt, GPT-4 công bằng nhất. Bài này triển khai Giao thức Contract Net (tổ tiên FIPA, Bài 02), kết nối một bên mua/bên bán kiểu LLM, chạy một phân rã kiểu OG-Narrator, và đo cách tỷ lệ thỏa thuận thay đổi với mỗi lựa chọn cấu trúc.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 02 (FIPA-ACL Heritage), Phase 16 · 09 (Parallel Swarm Networks)
**Time:** ~75 minutes

## Problem

Hai agent cần đồng ý về một mức giá. Để chúng tự xoay xở với các prompt ngôn ngữ thuần túy, các LLM giai đoạn 2024-2026 chốt thỏa thuận ở các tỷ lệ thấp đáng ngạc nhiên (~27% trên các cuộc mặc cả được tham số hóa chặt trong arXiv:2402.15813). Quy mô không sửa điều đó: GPT-4 không tốt hơn về cấu trúc trong mặc cả so với GPT-3.5; nó tốt hơn về *ngôn ngữ* của mặc cả.

Vấn đề gốc là các LLM nhập hai công việc làm một — quyết định đề nghị và diễn đạt đề nghị. OG-Narrator tách chúng: một bộ tạo đề nghị xác định tính các nước đi số; LLM chỉ diễn đạt. Tỷ lệ thỏa thuận nhảy lên ~89%.

Điều này phản ánh một phát hiện đa agent cổ điển: tách cơ chế khỏi lớp giao tiếp thắng. Giao thức Contract Net (FIPA, 1996; Smith, 1980) là cơ chế thị trường tác vụ tham chiếu. Cắm một LLM vào vị trí diễn đạt và bạn có một thị trường tác vụ hiện đại được LLM hỗ trợ.

## Concept

### Contract Net, in one paragraph

Giao thức Contract Net năm 1980 của Smith: một **người quản lý** phát quảng bá một **lời mời đề xuất (cfp)**; các **bên dự thầu** phản hồi bằng các thông điệp **propose** chứa các đề nghị của họ; người quản lý chọn một bên thắng và gửi **accept-proposal** tới bên thắng và **reject-proposal** tới các bên thua. Bên thắng thực hiện công việc. Thông điệp tùy chọn: **refuse** (bên dự thầu từ chối đề xuất). FIPA hệ thống hóa điều này thành giao thức tương tác `fipa-contract-net`.

### Why OG-Narrator wins

“Measuring Bargaining Abilities of Language Models” (arXiv:2402.15813) quan sát rằng:

- Các LLM thường phá các quy tắc mặc cả (đề nghị ở các mức giá vô nghĩa, bỏ qua ZOPA của phía kia).
- Chúng neo kém (chấp nhận các đề nghị đầu tiên tệ; đề nghị đối ứng ở các lượng mang tính biểu tượng thay vì chiến lược).
- Chỉ quy mô không sửa những điều này. Các mô hình lớn hơn tạo ngôn ngữ có vẻ hợp lý hơn với lỗi chiến lược tương tự.

Phân rã OG-Narrator:

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

Bộ tạo đề nghị là một chiến lược đàm phán cổ điển: một mô hình mặc cả Rubinstein, một chiến lược Zeuthen, hoặc một ăn miếng trả miếng đơn giản về giá. LLM diễn đạt. Thông điệp chứa giá xác định và cách định hình bằng ngôn ngữ tự nhiên.

Tỷ lệ thỏa thuận nhảy lên vì:
- Giá ở trong vùng mặc cả.
- Các neo mang tính chiến lược, không cảm xúc.
- LLM làm những gì nó giỏi: viết.

### NegotiationArena findings

arXiv:2402.05863 cung cấp benchmark chuẩn. Các phát hiện nổi bật:

- Các LLM có thể cải thiện lợi ích ~20% bằng cách nhận các nhân cách (“Tôi tuyệt vọng muốn bán thứ này trước thứ Sáu”) — thao túng nhân cách là một chiến thuật thực.
- Các agent công bằng/hợp tác bị các agent đối kháng khai thác; phòng thủ yêu cầu tạo tư thế đối trọng tường minh.
- Các cặp đối xứng hội tụ tới các kết quả không công bằng trong khoảng 40% các kịch bản benchmark.

Đây không phải “LLM là các nhà đàm phán tệ.” Nó là “LLM đàm phán quá giống con người, bao gồm các phần có thể khai thác.”

### Chain-of-thought concealment

Large-Scale Autonomous Negotiation Competition (arXiv:2503.06416) chạy ~180k cuộc đàm phán trên nhiều chiến lược LLM. Các bên thắng che giấu suy luận khỏi các đối tác:

- Nếu một agent in “Tôi sẽ chỉ tới $75; giá bảo lưu của tôi là $70” vào một vùng nháp nhìn thấy công khai, đối thủ đọc nó.
- Các bên thắng tính chiến lược riêng tư; kênh đầu ra chỉ chứa đề nghị và diễn đạt tối thiểu cần thiết.

Đây là một tiếng vọng năm 2026 của lý thuyết trò chơi cổ điển (Aumann 1976 về tính duy lý và thông tin): tiết lộ định giá riêng tư làm mất lợi ích. Các LLM không trực giác được điều này và vui vẻ gõ các mức bảo lưu trong các dấu vết suy luận trở nên nhìn thấy với đối tác.

Điều rút ra về kỹ thuật: tách ngữ cảnh vùng nháp riêng tư khỏi ngữ cảnh thông điệp công khai. Không tùy chọn.

### Bhattacharya et al. 2025 — model rankings

Trên các chỉ số Harvard Negotiation Project (đàm phán có nguyên tắc, tôn trọng BATNA, tương hỗ lợi ích):

- **Llama-3** hiệu quả nhất trong đạt các thỏa thuận (tỷ lệ thỏa thuận + lợi ích).
- **Claude-3** là bên đàm phán quyết liệt nhất (các neo cao, các nhượng bộ muộn).
- **GPT-4** công bằng nhất (phương sai lợi ích nhỏ nhất giữa các cặp).

Đây là một ảnh chụp năm 2025. Mục đích không phải mô hình nào thắng vào tháng 4 năm 2026 — mà là các mô hình cơ sở khác nhau có các phong cách đàm phán bền vững. Các tập hợp không đồng nhất (Bài 15) bao gồm điều này như một nguồn đa dạng.

### Task allocation via Contract Net + LLM

Việc tái sử dụng Contract Net hiện đại cho đa agent LLM:

1. Agent quản lý phân rã một tác vụ thành các đơn vị.
2. Phát quảng bá `cfp` với mô tả tác vụ tới các agent worker.
3. Mỗi worker trả về một đề nghị: `(price, eta, confidence)` nơi giá có thể là token, đơn vị tính toán, hoặc đô la.
4. Người quản lý chọn các bên thắng (một hoặc nhiều, tùy tác vụ) và trao việc.
5. Các worker bị từ chối tự do dự thầu các tác vụ khác.

Điều này mở rộng tốt vượt 100 worker vì phối hợp là quảng bá và phản hồi, không phải trò chuyện đồng bộ. Được sử dụng trong sản xuất: các mẫu điều phối của Microsoft Agent Framework, một số triển khai LangGraph.

### LLM-Stakeholders Interactive Negotiation

NeurIPS 2024 (https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) giới thiệu các trò chơi nhiều bên có thể chấm điểm với **các điểm số bí mật** và **các ngưỡng chấp nhận tối thiểu**. Mỗi bên liên quan có các mức thỏa dụng riêng tư; LLM phải suy ra chúng từ các thông điệp. Đây là khái quát hóa của mặc cả hai bên thành hình thành liên minh N bên. Liên quan tới các thị trường tác vụ sản xuất với các năng lực worker không đồng nhất.

### The narration-vs-mechanism rule

Trên mọi benchmark đàm phán giai đoạn 2024-2026, quy tắc kỹ thuật nhất quán là:

> Để LLM diễn đạt. Đừng để LLM tính đề nghị.

Nếu đề nghị cần là một con số (giá, ETA, số lượng), sinh nó một cách xác định từ trạng thái đàm phán và để LLM tạo cách định hình. Nếu đề nghị cần là một cấu trúc đề xuất (phân rã tác vụ, phân vai), để LLM soạn nó, nhưng xác thực theo một lược đồ và kiểm tra ràng buộc trước khi gửi.

```figure
a5-og-narrator
```

## Build It

`code/main.py` triển khai:

- `ContractNetManager`, `ContractNetTask`, `Bid` — người quản lý + các bên dự thầu, quảng bá cfp, thu các đề xuất, trao việc.
- `og_narrator_bargain(state, rng)` — bên mua OG-Narrator: nhượng bộ xác định kiểu Zeuthen về trung điểm.
- `seller_response(state, rng)` — chính sách đề nghị đối ứng bên bán xác định (chuẩn tham chiếu cấu trúc cho cả hai kiểu).
- `naive_llm_bargain(state, rng)` — mô phỏng một bên mặc cả toàn LLM: chọn các mức giá với phương sai cao, thường ngoài ZOPA.
- Phép đo: tỷ lệ thỏa thuận trên 1000 lần thử với các giá bảo lưu mới được lấy mẫu theo từng lần thử.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: tỷ lệ thỏa thuận LLM ngây thơ ~65-75%; tỷ lệ thỏa thuận OG-Narrator ~85-95%; khoảng cách 15-25 điểm là lợi thế cấu trúc của phân rã tạo đề nghị khỏi diễn đạt. Cộng với một ví dụ phân bổ thị trường tác vụ Contract Net với ba bên dự thầu và một tác vụ.

## Use It

`outputs/skill-bargainer-designer.md` thiết kế một giao thức mặc cả: ai tạo các đề nghị (xác định hoặc LLM), ai diễn đạt, cách các vùng nháp riêng tư tách khỏi các thông điệp công khai, và cách tỷ lệ thỏa thuận được giám sát.

## Ship It

Danh sách kiểm tra mặc cả sản xuất:

- **Vùng nháp riêng.** Trạng thái riêng tư không bao giờ tới ngữ cảnh của đối tác. Điều này không thể thương lượng.
- **Tạo đề nghị xác định.** Giá, số lượng, ETA: tính toán, đừng prompt.
- **Xác thực mọi đề nghị đi vào** theo một lược đồ. Từ chối các đề nghị ngoài ZOPA tại ranh giới giao thức.
- **Giới hạn số vòng.** Tối đa 3-5 vòng; chuyển cấp tới bên hòa giải khi bế tắc.
- **Đo tỷ lệ thỏa thuận và phương sai lợi ích** liên tục. Tỷ lệ thỏa thuận giảm là một triệu chứng — thường là trôi prompt hoặc một cuộc tấn công phía đối tác.
- **Ghi nhật ký mọi đề xuất bị từ chối** với lý do xác định. Với các quản lý Contract Net, các bên dự thầu thua cần hiểu vì sao.

## Exercises

1. Chạy `code/main.py`. Xác nhận OG-Narrator vượt LLM ngây thơ về tỷ lệ thỏa thuận. Bao nhiêu?
2. Triển khai **cải thiện lợi ích dựa trên nhân cách** (arXiv:2402.05863) — bên mua nhận một nhân cách “tuyệt vọng muốn mua tuần này” chỉ trong diễn đạt, bộ tạo đề nghị không đổi. Tỷ lệ thỏa thuận hoặc lợi ích có thay đổi không?
3. Triển khai **che giấu** chuỗi suy nghĩ: duy trì một chuỗi vùng nháp riêng tư không được chuyển tới đối tác. Điều gì xảy ra nếu bạn vô tình làm rò rỉ nó (mô phỏng bằng cách đổi các kênh)?
4. Mở rộng Contract Net thành đấu giá N bên dự thầu với giá dự trữ. Khi mọi giá thầu vượt giá dự trữ, quản lý quyết định giữa giá thấp nhất và chất lượng cao nhất như thế nào? Bạn chọn quy tắc trao việc nào và vì sao?
5. Đọc Bhattacharya và cộng sự năm 2025 về các chỉ số Harvard Negotiation Project. Triển khai hai bên mặc cả với các phong cách khác nhau (quyết liệt so với công bằng). Đo phương sai lợi ích dưới các cặp đối xứng và bất đối xứng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Contract Net (Mạng hợp đồng) | “Thị trường tác vụ” | Smith 1980, FIPA 1996. cfp + propose + accept/reject. Thị trường tác vụ chuẩn. |
| ZOPA | “Vùng có thể đạt thỏa thuận” | Chồng lấp giữa mức tối đa bên mua và mức tối thiểu bên bán. Các đề nghị ngoài nó không thể chốt. |
| BATNA | “Phương án thay thế tốt nhất cho một thỏa thuận được đàm phán” | Dự phòng của bạn nếu thỏa thuận này thất bại. Đặt giá bảo lưu của bạn. |
| OG-Narrator | “Bộ tạo đề nghị + bên diễn đạt” | Phân rã: đề nghị xác định, diễn đạt LLM. |
| Zeuthen strategy (Chiến lược Zeuthen) | “Nhượng bộ tối thiểu hóa rủi ro” | Bộ tạo đề nghị cổ điển nhượng bộ dựa trên các giới hạn rủi ro. |
| Rubinstein bargaining (Mặc cả Rubinstein) | “Cân bằng đề nghị luân phiên” | Mô hình lý thuyết trò chơi cho mặc cả tầm thời gian vô hạn có chiết khấu. |
| CoT concealment (Che giấu CoT) | “Giấu suy luận của bạn” | Các bên thắng trong arXiv:2503.06416 giữ các vùng nháp riêng tư; kênh công khai chỉ cho thấy đề nghị. |
| Persona manipulation (Thao túng nhân cách) | “Tạo tư thế cảm xúc” | arXiv:2402.05863: mức tăng lợi ích ~20% từ các nhân cách tuyệt vọng/khẩn cấp. |

## Further Reading

- [NegotiationArena](https://arxiv.org/abs/2402.05863) — benchmark; các phát hiện thao túng nhân cách và khai thác
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) — OG-Narrator và kết quả bên mua khó hơn bên bán
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416) — ~180k cuộc đàm phán; che giấu chuỗi suy nghĩ thắng
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) — các trò chơi nhiều bên có thể chấm điểm với các mức thỏa dụng bí mật
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) — cơ chế cổ điển, IEEE Transactions on Computers
