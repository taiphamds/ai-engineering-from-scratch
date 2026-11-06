# Batch APIs — the 50% Discount as Industry Standard

> Mọi nhà cung cấp lớn đều cung cấp API xử lý theo lô bất đồng bộ với giảm giá 50% và thời gian hoàn thành ~24 giờ. OpenAI, Anthropic, Google và hầu hết nền tảng suy luận (gói xử lý theo lô Fireworks, xử lý theo lô Together) triển khai cùng mẫu. Kết hợp xử lý theo lô với lưu bộ nhớ đệm prompt và pipeline qua đêm giảm xuống ~10% chi phí đồng bộ không lưu bộ nhớ đệm. Quy tắc cực kỳ đơn giản: nếu không tương tác, nó thuộc xử lý theo lô. Pipeline tạo nội dung, phân loại tài liệu, trích xuất dữ liệu, tạo báo cáo, gắn nhãn hàng loạt, gắn thẻ danh mục — bất cứ thứ gì chịu được độ trễ 24 giờ đều là tiền bị bỏ phí cho đến khi chuyển sang xử lý theo lô. Mẫu sản xuất năm 2026 là phân loại mọi khối lượng công việc LLM mới vào ba làn: tương tác (đồng bộ có lưu bộ nhớ đệm), bán tương tác (hàng đợi bất đồng bộ có dự phòng), theo lô (qua đêm, kết hợp đầu vào được lưu bộ nhớ đệm). Khối lượng công việc giả là tương tác nhưng chịu được độ trễ tính bằng phút lãng phí nhiều nhất.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**Prerequisites:** Phase 17 · 14 (Prompt & Semantic Caching)
**Time:** ~45 minutes

## Learning Objectives

- Nêu ba API xử lý theo lô của nhà cung cấp (OpenAI, Anthropic, Google) và các bảo đảm chung giảm giá 50% + hoàn thành 24 giờ.
- Tính chi phí khi kết hợp xử lý theo lô + đầu vào được lưu bộ nhớ đệm trên một khối lượng công việc phân loại qua đêm và so sánh với đường cơ sở đồng bộ không lưu bộ nhớ đệm.
- Phân loại một khối lượng công việc vào tương tác / bán tương tác / theo lô và giải thích làn đó.
- Nêu hai bẫy: tương tác một phần (người dùng mong đợi nhanh hơn 24 giờ) và độ trôi schema đầu ra (định dạng file theo lô khác nhau theo nhà cung cấp).

## The Problem

Nhóm của bạn triển khai một pipeline tạo báo cáo hằng đêm. 50,000 tài liệu, tóm tắt từng tài liệu, phân cụm các bản tóm tắt, soạn bản báo cáo ngắn cho lãnh đạo. Chạy đồng bộ mất 4 giờ với $2,000/đêm. Bạn nghe nói về API xử lý theo lô.

Xử lý theo lô giảm cho bạn 50%. Bạn cũng bật lưu bộ nhớ đệm prompt trên system prompt (dùng chung cho cả 50k lệnh gọi). Kết hợp lại, hóa đơn giảm xuống $180/đêm — ~9% đường cơ sở. Cùng pipeline, ba thay đổi cấu hình.

Xử lý theo lô là đòn bẩy rẻ nhất trong bộ công cụ chi phí LLM mà không ai kéo. Lý do chủ yếu thuộc tổ chức: các nhóm nghĩ "thời gian thực" khi SLA thực sự là "trước buổi sáng." Bài học này nói về việc không bỏ phí 90% hóa đơn.

## The Concept

### The three batch APIs

**OpenAI Batch API**: tải lên file JSONL với danh sách yêu cầu. Hứa hẹn hoàn thành trong 24 giờ (thực tế thường ~2-8 giờ). Giảm giá 50% token đầu vào và đầu ra. Endpoint `/v1/batches`. Đầu vào đủ điều kiện lưu bộ nhớ đệm cũng được thêm mức giá đầu vào được lưu bộ nhớ đệm.

**Anthropic Message Batches**: tải lên JSONL. Hoàn thành trong 24 giờ. Giảm giá 50%. Hỗ trợ `cache_control` — ghi bộ nhớ đệm là tường minh, đọc tự động diễn ra trong lô.

**Google Vertex AI Batch Prediction**: đầu vào BigQuery hoặc GCS. Giảm giá 50% tương tự cho Gemini. Tích hợp với pipeline Vertex.

### Semantic: asynchronous, not slow

Xử lý theo lô là "tôi hứa trả về trong vòng 24 giờ" — không phải "việc này sẽ mất 24 giờ." P50 điển hình là 2-6 giờ. Nhà cung cấp lên lịch lô của bạn trong khung thấp điểm khi lượng GPU chưa được tận dụng hết.

### Stack with caching

Tóm tắt 50k tài liệu với cùng system prompt 4K token:

- Đồng bộ không lưu bộ nhớ đệm: 50000 × ($input × 4000 + $output × 200) ở giá đầy đủ.
- Đồng bộ có lưu bộ nhớ đệm: system prompt được lưu bộ nhớ đệm sau lần ghi đầu tiên; 49999 còn lại có đầu vào rẻ hơn 10x.
- Theo lô có lưu bộ nhớ đệm: tất cả những điều trên cộng giảm giá 50% cho cả đọc và ghi.

Sự kết hợp: theo lô + bộ nhớ đệm = ~10% hóa đơn đồng bộ không lưu bộ nhớ đệm. Mọi khối lượng công việc chạy qua đêm và có system prompt chung nên dùng cách này.

### Workload triage

**Tương tác** — người dùng chờ phản hồi. TTFT quan trọng. Lệnh gọi đồng bộ với lưu bộ nhớ đệm prompt. Không thể xử lý theo lô.

**Bán tương tác** — người dùng gửi một tác vụ, quay lại kiểm tra sau vài phút. Hàng đợi bất đồng bộ với dự phòng sang đồng bộ nếu xử lý theo lô không khả dụng. Hãy nghĩ đến lập chỉ mục RAG khối lượng vừa phải.

**Theo lô** — người dùng mong đợi kết quả "trước buổi sáng" hoặc "giờ tới." Pipeline nội dung, phân loại ở quy mô lớn, phân tích ngoại tuyến. Luôn xử lý theo lô, luôn kết hợp lưu bộ nhớ đệm.

Sai lầm phổ biến: phân loại mọi thứ là tương tác vì pipeline đang trong sản xuất. Sản xuất không phải đặc tả độ trễ — SLA mới là.

### The partial-interactivity trap

Một số tính năng trông có tính tương tác nhưng chịu được 5-10 phút. Ví dụ: báo cáo sức khỏe khách hàng hằng đêm với nút "làm mới". Người dùng bấm làm mới; chờ 10 phút là ổn. Nhóm triển khai nó dưới dạng đồng bộ. 50 lượt làm mới đồng thời tốn 10x chi phí xử lý theo lô và gửi qua email.

Câu hỏi cần đặt ra: "24 giờ có ý nghĩa gì với người dùng này?" Nếu câu trả lời là "họ sẽ không nhận ra," hãy xử lý theo lô.

### The output-schema trap

Định dạng file theo lô khác nhau theo nhà cung cấp:

- OpenAI: JSONL, một yêu cầu mỗi dòng.
- Anthropic: JSONL, một thông điệp mỗi dòng; định dạng phản hồi được nhúng.
- Vertex: bảng BigQuery hoặc tiền tố GCS với TFRecord.

Viết "một client xử lý theo lô" xuyên nhà cung cấp nghĩa là mã adapter cho mỗi nhà cung cấp. Các gateway quảng cáo xử lý theo lô đa nhà cung cấp (Portkey, một số gói LiteLLM) vẫn chỉ bọc mỏng định dạng thô.

### Numbers you should remember

- Giảm giá xử lý theo lô trên các nhà cung cấp: đồng mức 50% cho đầu vào + đầu ra.
- SLA hoàn thành: bảo đảm 24 giờ, P50 điển hình 2-6 giờ.
- Kết hợp theo lô + đầu vào được lưu bộ nhớ đệm: ~10% chi phí đồng bộ không lưu bộ nhớ đệm.
- Quy tắc phân loại khối lượng công việc: nếu chấp nhận độ trễ 24 giờ, luôn xử lý theo lô.

```figure
batch-lane-triage
```

## Use It

`code/main.py` tính chi phí trên đồng bộ, đồng bộ+bộ nhớ đệm, theo lô và theo lô+bộ nhớ đệm cho khối lượng công việc 50k tài liệu. Báo cáo tiết kiệm theo $ và phần trăm.

## Ship It

Bài học này tạo ra `outputs/skill-batch-triager.md`. Với đặc điểm khối lượng công việc, phân loại vào tương tác/bán tương tác/theo lô và ước tính tiết kiệm.

## Exercises

1. Chạy `code/main.py`. Với pipeline 100k tài liệu có system prompt 3K token và đầu ra 500 token, tính tiết kiệm của kết hợp đầy đủ (theo lô + bộ nhớ đệm) so với đường cơ sở đồng bộ.
2. Chọn ba tính năng trong một sản phẩm thực tế bạn biết. Phân loại từng tính năng vào tương tác/bán tương tác/theo lô.
3. Một người dùng phàn nàn báo cáo của họ mất 3 giờ. Đó là phân loại sai vào theo lô hay là tương tác hợp lý? Viết tiêu chí quyết định.
4. SLA trả về của API xử lý theo lô của bạn là 24 giờ nhưng P99 là 20 giờ. Bạn truyền đạt điều này cho người dùng như thế nào — hành vi của hệ thống hạ nguồn trong trường hợp biên là gì?
5. Tính điểm hòa vốn: ở độ dài tiền tố chung nào theo lô + bộ nhớ đệm trở nên rẻ hơn chạy qua đêm trên GPU đặt trước của chính bạn?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Batch API (API xử lý theo lô) | "giảm giá bất đồng bộ" | Giảm 50% với thời gian hoàn thành 24 giờ |
| JSONL | "định dạng theo lô" | Một yêu cầu JSON mỗi dòng; tiêu chuẩn OpenAI/Anthropic |
| Message Batches | "theo lô Anthropic" | Tên sản phẩm API xử lý theo lô của Anthropic |
| Batch prediction (Dự đoán theo lô) | "theo lô Vertex" | Sản phẩm API xử lý theo lô của Vertex AI |
| Turnaround SLA (SLA hoàn thành) | "lời hứa 24 giờ" | Bảo đảm, không phải điển hình; điển hình là 2-6 giờ |
| Workload triage (Phân loại khối lượng công việc) | "quyết định tính tương tác" | Quyết định định tuyến tương tác / bán tương tác / theo lô |
| Output schema (Schema đầu ra) | "định dạng phản hồi" | Bố cục JSONL theo từng nhà cung cấp; không có tính di động |
| Stacked discount (Giảm giá kết hợp) | "theo lô + bộ nhớ đệm" | ~10% hóa đơn đồng bộ không lưu bộ nhớ đệm khi cả hai áp dụng |

## Further Reading

- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) — định dạng JSONL và ngữ nghĩa `/v1/batches`.
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) — định dạng theo lô và tương tác `cache_control`.
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/batch-prediction-gemini) — ngữ nghĩa xử lý theo lô Gemini.
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
