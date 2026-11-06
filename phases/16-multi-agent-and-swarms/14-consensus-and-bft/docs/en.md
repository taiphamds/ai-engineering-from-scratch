# Consensus and Byzantine Fault Tolerance for Agents

> BFT của hệ thống phân tán cổ điển gặp các LLM ngẫu nhiên. Trong giai đoạn 2025-2026 ba hướng nghiên cứu xuất hiện: **CP-WBFT** (arXiv:2511.10400) đặt trọng số mỗi phiếu theo một phép dò độ tự tin; **DecentLLMs** (arXiv:2507.14928) bỏ lãnh đạo với các đề xuất worker song song và tổng hợp trung vị hình học; **WBFT** (arXiv:2505.05103) kết hợp bỏ phiếu có trọng số với Phân cụm cấu trúc phân cấp để chia các node Lõi và Biên. Kết quả thực nghiệm thẳng thắn từ “Can AI Agents Agree?” (arXiv:2603.01213) là ngay cả đồng ý về đại lượng vô hướng cũng mong manh hiện nay — một agent lừa dối đơn lẻ có thể làm tổn hại một Mixture-of-Agents. BFT là cần thiết nhưng không đủ. Bài này xây dựng một giao thức BFT tối thiểu, chèn ba cuộc tấn công riêng cho agent (lời nói dối Byzantine, thuận theo xu nịnh, đơn văn hóa lỗi tương quan), và đo cách mỗi biến thể đồng thuận ứng phó.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 07 (Society of Mind and Debate), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## Problem

Bạn có N agent LLM, mỗi agent tạo ra một câu trả lời. Chúng bất đồng. Bỏ phiếu đa số chọn câu trả lời sai vì hai agent tương quan (cùng mô hình cơ sở, cùng dữ liệu huấn luyện, cùng các chế độ lỗi). Một agent thứ ba tình cờ sai theo một cách mới — nên đa số là một đa số giả.

Bây giờ thêm một agent lừa dối: nó nói dối có chủ đích. Hoặc một agent xu nịnh: nó đồng ý với bên nói cuối cùng. Trong BFT cổ điển, giả định là các node Byzantine là một tỷ lệ `f < n/3` và hành xử tùy ý. Thực tế năm 2026 là các node LLM ngẫu nhiên ngay cả khi trung thực, tương quan xuyên mô hình, và bị ảnh hưởng bởi các đầu ra của nhau. Bạn không thể coi chúng là các bên bỏ phiếu Bernoulli độc lập.

BFT cổ điển (PBFT, 1999) không sai — nó không đầy đủ. Nó xử lý đảo bit tùy ý. Nó không xử lý “ba agent trung thực chia sẻ một ảo giác vì chúng chia sẻ dữ liệu huấn luyện.” Bài này xây dựng từ nền tảng PBFT và xếp lên ba điều chỉnh giai đoạn 2025-2026.

## Concept

### What classical BFT gives you

Khả năng chịu lỗi Byzantine thực tế (Castro & Liskov, OSDI 1999) chịu được `f < n/3` node Byzantine. Giao thức có ba giai đoạn (tiền chuẩn bị, chuẩn bị, cam kết) và hai nguyên thủy (các thông điệp có chữ ký, các chứng chỉ quorum). Thỏa thuận về một giá trị đơn lẻ giữa `n >= 3f + 1` node trung thực hoặc độc hại.

Các bảo đảm mạnh nhưng giả định:

1. **Các lỗi độc lập.** Các node Byzantine không phối hợp.
2. **Các node trung thực thực sự trung thực.** Tính đúng đắn của các đầu ra trung thực không phải là vấn đề; giao thức chỉ căn chỉnh bất đồng.
3. **Câu hỏi có một câu trả lời chuẩn tham chiếu.** Đồng thuận về một sự kiện sai vẫn là đồng thuận.

Các agent LLM vi phạm cả ba. Hai agent chạy cùng mô hình cơ sở chia sẻ lỗi. Một LLM “trung thực” vẫn ảo giác. Và trên các câu hỏi mơ hồ, “sự thật” là những gì các agent quyết định — không có oracle bên ngoài.

### The three LLM-specific attacks

**Lời nói dối Byzantine.** Một agent xuất một câu trả lời cố ý sai. BFT cổ điển xử lý điều này nếu `f < n/3`.

**Thuận theo xu nịnh.** Một agent đọc các câu trả lời khác trước khi bỏ phiếu và thuận theo bên nói cuối cùng. Không độc hại, nhưng tương quan với tiếng nói to nhất. BFT cổ điển không ngăn điều này vì agent vượt qua mọi kiểm tra chữ ký.

**Đơn văn hóa lỗi tương quan.** Ba agent chia sẻ một mô hình cơ sở. Chúng ảo giác cùng câu trả lời sai. Đa số sai. BFT cổ điển không giúp vì cả ba đồng ý “trung thực.”

### The 2025-2026 responses

**CP-WBFT** (arXiv:2511.10400) — BFT có trọng số được dò độ tự tin. Mỗi bên bỏ phiếu gắn một phép dò độ tự tin vào câu trả lời (một xác suất tự báo cáo, hoặc dự đoán của một mô hình hiệu chuẩn riêng). Trọng số phiếu tăng theo độ tự tin. Báo cáo cải thiện BFT +85.71% trên các đồ thị đầy đủ. Giảm thiểu cho: thuận theo xu nịnh (các agent thuận theo có xu hướng có độ tự tin thấp về quan điểm chúng tự đưa ra).

**DecentLLMs** (arXiv:2507.14928) — Không lãnh đạo. Các agent worker đề xuất song song, các agent đánh giá chấm điểm các đề xuất, câu trả lời cuối cùng là trung vị hình học của các vị trí đã chấm điểm. Vững chắc khi `f < n/2`. Giảm thiểu cho: lời nói dối Byzantine và các lỗi tương quan (trung vị hình học vững chắc trước các ngoại lệ và kéo về cụm dày đặc, không phải trung bình lệch theo mô hình).

**WBFT** (arXiv:2505.05103) — BFT có trọng số với Phân cụm cấu trúc phân cấp. Trọng số phiếu được gán theo chất lượng phản hồi cộng với một điểm tin cậy học từ lịch sử. Phân cụm các agent thành Lõi và Biên; các agent Lõi phải đạt đồng thuận trước, các agent Biên theo sau. Giảm thiểu cho: khả năng mở rộng (đồng thuận Lõi nhỏ và nhanh) và một phần cho đơn văn hóa (Lõi có thể được chọn vì đa dạng).

### Empirical: "Can AI Agents Agree?" (arXiv:2603.01213)

Bài báo đo đồng ý về đại lượng vô hướng (các agent LLM đồng ý về một giá trị số đơn lẻ) trên nhiều mô hình tiên tiến nhất. Phát hiện không dễ chịu:

- Ngay cả không có đối thủ, các agent LLM bất đồng về các câu hỏi vô hướng ở tỷ lệ trên 30% trên nhiều benchmark.
- Một agent đơn lẻ nhận một nhân cách lừa dối có thể kéo đồng thuận Mixture-of-Agents lệch 40+ điểm phần trăm khỏi đường cơ sở trung thực.
- Các tỷ lệ bất đồng tương quan với đa dạng mô hình — các tập hợp không đồng nhất bất đồng nhiều hơn các tập hợp đồng nhất (tốt: các lỗi không tương quan) nhưng cũng trôi chậm hơn (xấu: thời gian tới thỏa thuận dài hơn).

Điều rút ra: BFT cho bạn cơ chế để căn chỉnh các đầu ra, nhưng nó không cho biết liệu đầu ra đã căn chỉnh có đúng hay không. Kết hợp với xác minh (Giai đoạn 16 · 08 chuyên biệt hóa vai trò), đa dạng (Giai đoạn 16 · 15 các biến thể tranh luận), và các agent đánh giá (Giai đoạn 16 · 24 benchmark).

### The core protocol, stripped down

Một vòng BFT tối thiểu cho các agent LLM:

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

Bước phân cụm ngữ nghĩa là nét riêng của LLM. Hai câu trả lời “nghiên cứu báo cáo 4.2%” và “cải thiện 4.2%” thuộc cùng cụm. Một kiểm tra bằng nhau chuỗi ngây thơ sẽ bỏ sót điều này. Trong sản xuất, sử dụng một mô hình embedding rẻ hoặc chuẩn hóa tường minh.

### Threshold tuning

Tham số `threshold` quyết định khi nào chấp nhận và khi nào thử lại. Quá thấp: bạn chấp nhận các đa số yếu. Quá cao: bạn không bao giờ chấp nhận bất cứ thứ gì. Khoảng thực nghiệm: 0.5-0.67 cho `n=5-7` agent, cao hơn cho `n` nhỏ hơn. Dưới một ngưỡng, chuyển cấp tới một người hoặc tới một tập hợp agent khác.

### Where consensus does not help

- **Các câu hỏi mơ hồ.** Nếu câu hỏi không có chuẩn tham chiếu, đồng thuận là một ý kiến. Hãy gọi nó như vậy.
- **Các câu hỏi ghép.** “Viết mã và giải thích nó” — hai câu trả lời. Bỏ phiếu cho mỗi câu độc lập.
- **Đối kháng nhiều vòng.** Nếu các agent có thể quan sát các vòng trước và bắt chước (tranh luận Du 2023), chúng bắt đầu đồng ý với nhau bất kể sự thật. Giới hạn các vòng (thường 2-3).

```figure
swarm-consensus-wave
```

## Build It

`code/main.py` triển khai:

- `AgentVoter` — một chính sách được viết kịch bản với (câu trả lời, độ tự tin).
- `MajorityVote` — bỏ phiếu theo số phiếu cao nhất cổ điển.
- `CPWBFT` — bỏ phiếu có trọng số độ tự tin với phân cụm ngữ nghĩa.
- `DecentLLMs` — tổng hợp trung vị hình học trên các đề xuất đã chấm điểm.
- `Scenario` — chạy mỗi bộ tổng hợp dưới ba mẫu tấn công.

Các mẫu tấn công được triển khai:

1. `byzantine`: một agent nói dối với độ tự tin cao.
2. `sycophancy`: một agent sao chép câu trả lời đầu tiên nó thấy, với độ tự tin khớp.
3. `monoculture`: ba agent chia sẻ một câu trả lời sai (lỗi tương quan) với độ tự tin vừa phải.

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: một bảng (tấn công, bộ tổng hợp) -> câu trả lời cuối cùng, với câu trả lời đúng được làm nổi bật. Bỏ phiếu theo số phiếu cao nhất thất bại trong trường hợp đơn văn hóa. Trọng số độ tự tin của CPWBFT giảm thiểu xu nịnh. Trung vị hình học của DecentLLMs kéo về cụm trung thực khi đơn văn hóa ít hơn nửa quần thể.

## Use It

`outputs/skill-consensus-designer.md` thiết kế một giao thức đồng thuận cho một tập hợp đa agent: phương pháp phân cụm, trọng số, ngưỡng, và chính sách chuyển cấp cho các vòng dưới ngưỡng.

## Ship It

Trước khi đưa bất kỳ cơ chế đồng thuận nào ra sử dụng:

- **Kiểm thử tấn công với ít nhất ba mẫu** ở trên. Giao thức của bạn nên thất bại có thể dự đoán, không âm thầm.
- **Ghi nhật ký mọi cụm thiểu số** kèm nguồn gốc. Các cụm thiểu số là hệ thống cảnh báo sớm của bạn cho các lỗi tương quan.
- **Thực thi các vòng bị giới hạn.** Không “tiếp tục tranh luận cho đến khi đồng ý” — điều đó thưởng xu nịnh.
- **Tách đồng ý khỏi tính đúng đắn.** Đầu ra đồng thuận đi tới một bộ xác minh; bộ xác minh độc lập với tập hợp.
- **Giám sát tỷ lệ đồng ý.** Một mức tăng mạnh có nghĩa là thiên lệch thuận theo; một mức giảm mạnh có nghĩa là trôi mô hình.

## Exercises

1. Chạy `code/main.py`. Xác nhận bỏ phiếu theo số phiếu cao nhất thất bại trước cuộc tấn công đơn văn hóa nhưng CPWBFT giảm thiểu một phần khi độ tự tin đơn văn hóa dưới 0.7.
2. Thêm một mẫu tấn công thứ tư: **bỏ phiếu trắng âm thầm** — một agent từ chối trả lời (“Tôi không biết”). Mỗi bộ tổng hợp nên xử lý các phiếu trắng như thế nào? Triển khai lựa chọn của bạn.
3. Đổi phân cụm ngữ nghĩa từ chuẩn hóa chuỗi sang tương đồng embedding (sử dụng bất kỳ mô hình embedding mã nguồn mở nào). Điều gì xảy ra với cuộc tấn công xu nịnh?
4. Đọc CP-WBFT (arXiv:2511.10400). Triển khai bước hiệu chuẩn phép dò độ tự tin (một mô hình hiệu chuẩn riêng kiểm tra độ tự tin tự báo cáo của mỗi agent). Đo mức tăng độ chính xác trên kịch bản đơn văn hóa.
5. Đọc “Can AI Agents Agree?” (arXiv:2603.01213). Tái tạo một thí nghiệm đồng ý vô hướng đơn giản hóa: ba agent, một câu hỏi vô hướng, prompt nhân cách lừa dối. CPWBFT hay DecentLLMs có bắt nó không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| BFT | “Khả năng chịu lỗi Byzantine” | Giao thức Castro-Liskov 1999 cho đồng thuận với `f < n/3` lỗi tùy ý. |
| Byzantine | “Bất kỳ hành vi xấu nào” | Một node có thể nói dối, bỏ thông điệp, thất bại âm thầm — bất cứ điều gì ngoại trừ gặp sự cố an toàn. |
| Confidence probe (Phép dò độ tự tin) | “Bạn chắc đến đâu?” | Xác suất tự báo cáo hoặc do bộ hiệu chuẩn dự đoán gắn vào một phiếu. |
| Semantic clustering (Phân cụm ngữ nghĩa) | “Cùng câu trả lời, khác từ” | Nhóm các câu trả lời tương đương trước khi đếm phiếu. |
| Geometric median (Trung vị hình học) | “Tâm vững chắc” | Điểm tối thiểu hóa tổng khoảng cách tới các điểm mẫu. Vững chắc trước các ngoại lệ, khác với trung bình. |
| Monoculture (Đơn văn hóa) | “Cùng mô hình, cùng thất bại” | Các lỗi tương quan khi các agent chia sẻ dữ liệu huấn luyện hoặc mô hình cơ sở. |
| Sycophantic conformity (Thuận theo xu nịnh) | “Đồng ý với tiếng nói to” | Phiếu của một agent lệch về bên nói đầu tiên/to nhất. |
| Core/Edge (Lõi/Biên) | “BFT phân cấp” | Phân chia WBFT: đồng thuận Lõi nhỏ trước, các node Biên theo sau. Giới hạn độ trễ. |

## Further Reading

- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance) — nền tảng
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) — đặt trọng số phiếu theo độ tự tin
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928) — tổng hợp trung vị hình học
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) — phân chia Lõi/Biên cho độ trễ bị giới hạn
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213) — tính mong manh của đồng ý vô hướng và cuộc tấn công nhân cách lừa dối
