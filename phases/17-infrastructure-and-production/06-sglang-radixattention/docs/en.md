# Prefix-Cache Serving — RadixAttention and KV Reuse

> Coi bộ nhớ đệm KV như một tài nguyên hạng nhất, có thể tái sử dụng được lưu trong một cây radix, và lập lịch thay đổi cùng nó: thay vì FCFS (đến trước, phục vụ trước) như vLLM lập lịch, một bộ lập lịch nhận biết bộ nhớ đệm ưu tiên các yêu cầu có các tiền tố dùng chung dài hơn — thực chất là một duyệt radix ưu tiên chiều sâu để các nhánh nóng ở lại HBM. SGLang là engine xây dựng phục vụ quanh ý tưởng này. Trên Llama 3.1 8B với các prompt 1K giống ShareGPT, SGLang đạt ~16,200 tok/s so với ~12,500 của vLLM, lợi thế ~29%. Trên các khối lượng công việc RAG nhiều tiền tố, lợi thế đạt 6.4x. Trên các khối lượng công việc dạng nhân bản giọng nói, tỷ lệ trúng bộ nhớ đệm vượt 86%. Được triển khai trên 400,000+ GPU năm 2026 tại xAI, LinkedIn, Cursor, Oracle, GCP, Azure, AWS. Điểm vướng là con số 6.4x bốc hơi khi thứ tự tiền tố không nhất quán — thứ tự là đòn bẩy của kỹ sư.

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 14 (Agentic RAG)
**Time:** ~75 minutes

## Learning Objectives

- Vẽ sơ đồ RadixAttention: cách các tiền tố được lưu trong một cây radix và cách các block KV được dùng chung giữa các chuỗi bắt nguồn ở cùng nhánh.
- Giải thích lập lịch nhận biết bộ nhớ đệm và vì sao FCFS sai cho lưu lượng nhiều tiền tố.
- Tính mức tăng tốc kỳ vọng cho một khối lượng công việc theo tỷ lệ trúng bộ nhớ đệm tiền tố và phân phối độ dài prompt.
- Nêu kỷ luật thứ tự prompt khiến con số 6.4x thành thật thay vì một lợi ích bị mất.

## The Problem

Phục vụ cổ điển coi prompt của mỗi yêu cầu là không trong suốt. Ngay cả khi 5,000 yêu cầu RAG đều bắt đầu với cùng prompt hệ thống 2,000 token cộng cùng phần mở đầu truy xuất, vLLM prefill tiền tố 2,000 token đó 5,000 lần. GPU làm cùng công việc hết lần này tới lần khác.

Quan sát: các prompt trong các khối lượng công việc agentic và RAG gần như luôn chia sẻ các tiền tố dài. Prompt hệ thống, các lược đồ công cụ, các ví dụ few-shot, các header truy xuất, lịch sử hội thoại — tất cả lặp lại giữa các yêu cầu. Nếu bạn lưu bộ nhớ đệm KV cho tiền tố đó một lần và tái sử dụng, bạn sẽ không prefill nó lần nữa.

RadixAttention làm chính xác điều này. Các token được lập chỉ mục trong một cây radix; mỗi node sở hữu các block KV cho chuỗi token trên đường từ gốc của nó. Một yêu cầu mới đi qua cây: bất kỳ node nào có token khớp tái sử dụng các block KV của node đó. Chi phí prefill trở thành tỷ lệ với hậu tố “mới”, không phải toàn prompt.

Thách thức là lập lịch. Nếu hai yêu cầu chia sẻ một tiền tố 2,000 token và yêu cầu thứ ba chỉ chia sẻ 200 token của cùng tiền tố, bạn muốn phục vụ hai yêu cầu chia sẻ dài cùng nhau để tiền tố dài ở lại HBM. FCFS làm ngược lại — nó phục vụ bên đến trước, có khả năng trục xuất nhánh nóng trước khi yêu cầu tiền tố dài tiếp theo tới.

## The Concept

### The radix tree as a KV index

Một cây radix (trie nén) lưu các chuỗi token. Mỗi node sở hữu một dải token và các block KV được tính cho dải đó. Các node con mở rộng chuỗi thêm một hoặc nhiều token.

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

Một yêu cầu mới đi vào với prompt hệ thống + "Context: <doc A>" + "Question: Carol". Bộ lập lịch duyệt: tiền tố hệ thống khớp (124 block được tái sử dụng), nhánh doc-A khớp (31 block được tái sử dụng), rồi chỉ cấp phát các block mới cho "Question: Carol" (4 block). Chi phí prefill: 4 block token mới. Không có cây: 160 block. Tiết kiệm ~40x trên prefill.

### Cache-aware scheduling

Tái sử dụng dựa trên cây radix vô nghĩa nếu bộ nhớ đệm xáo trộn liên tục. Hai chính sách then chốt:

1. **Phân công ưu tiên chiều sâu**. Khi chọn yêu cầu tiếp theo từ hàng đợi, ưu tiên các yêu cầu bắt nguồn ở cùng nhánh với tập đang chạy hiện tại. Điều này giữ nhánh nóng được ghim.
2. **LRU ở cấp nhánh, không phải cấp block**. Trục xuất toàn bộ các nhánh (bắt đầu từ các lá được dùng ngắn nhất) thay vì các block riêng lẻ, để hình dạng bộ nhớ đệm khớp hình dạng radix.

FCFS vi phạm cả hai. Một yêu cầu chia sẻ 2,000 token nằm sau một yêu cầu chia sẻ 50, rồi nhánh 2,000 token bị trục xuất để nhận yêu cầu 50 token.

### Benchmark numbers you should memorize

- Llama 3.1 8B, H100, các prompt ShareGPT 1K: SGLang ~16,200 tok/s so với vLLM ~12,500 (lợi thế ~29%).
- RAG nhiều tiền tố (cùng hệ thống + cùng tài liệu, câu hỏi thay đổi): tới 6.4x trên SGLang.
- Các khối lượng công việc nhân bản giọng nói: tỷ lệ trúng bộ nhớ đệm tiền tố 86.4%.
- Các tỷ lệ trúng sản xuất trên các khách hàng SGLang: 50-99% tùy kỷ luật prompt.
- Được triển khai trên 400,000+ GPU năm 2026.

### The ordering gotcha

Con số 6.4x dựa vào thứ tự mẫu prompt nhất quán. Nếu máy khách xây các prompt như `[system, tools, context, history, question]` trong một số yêu cầu và `[system, context, tools, history, question]` trong các yêu cầu khác, cây không thể tìm tiền tố dùng chung. Những gì trông như một tiền tố dùng chung với con người là hai chuỗi riêng biệt với cây radix.

Đòn bẩy của kỹ sư: mẫu prompt của bạn là một khóa bộ nhớ đệm. Cố định thứ tự. Đặt mọi thứ bất biến (hệ thống, công cụ, lược đồ) trước. Đặt ngữ cảnh truy xuất tiếp theo. Đặt câu hỏi người dùng cuối cùng. Đừng xen nội dung động vào tiền tố.

Trường hợp thực từ nghiên cứu: chuyển nội dung động ra khỏi tiền tố có thể lưu đệm đưa một triển khai từ tỷ lệ trúng bộ nhớ đệm 7% lên 74% trong một thay đổi.

### Where RadixAttention wins and loses

Thắng:
- RAG (cùng phần mở đầu truy xuất, câu hỏi thay đổi).
- Các agent (cùng các lược đồ công cụ, truy vấn thay đổi).
- Trò chuyện với prompt hệ thống dài.
- Các khối lượng công việc giọng nói / thị giác với các phần mở đầu lặp lại.

Thua (trở về thông lượng mức vLLM):
- Sinh một lần với các prompt độc nhất (hoàn thành mã, trò chuyện mở không có prompt hệ thống).
- Các prompt động nơi mọi yêu cầu xen nội dung độc nhất vào tiền tố.

### Why this is a scheduler problem, not just a kernel problem

Bạn có thể triển khai tái sử dụng KV như một mẹo kernel. Nhận thức của SGLang là tái sử dụng chỉ có lợi nếu bộ lập lịch giữ nhánh nóng thường trú. Một chính sách “tái sử dụng nếu có” ngây thơ sẽ xáo trộn bộ nhớ đệm dưới tải hỗn hợp. Bộ lập lịch được lập chỉ mục cây radix là thứ biến mẹo kernel thành lợi thế sản xuất 29%.

### Interplay with vLLM

Hai hệ thống không phải các đối thủ tuyệt đối. Năm 2026 vLLM thêm lưu đệm tiền tố (`--enable-prefix-caching`) và một bộ định tuyến nhận biết bộ nhớ đệm (vLLM Router bằng Rust). Khoảng cách thu hẹp nhưng không biến mất hoàn toàn — toàn ngăn xếp SGLang ưu tiên radix; vLLM ghép nó vào. Với các khối lượng công việc bị tái sử dụng tiền tố chi phối, SGLang vẫn là mặc định. Với phục vụ đa dụng không có các mẫu tiền tố mạnh, vLLM vẫn ngang hoặc tốt hơn.

```figure
roofline
```

## Use It

`code/main.py` triển khai một bộ nhớ đệm KV cây radix đồ chơi cộng một bộ lập lịch với hai chính sách: FCFS và nhận biết bộ nhớ đệm. Chạy cùng khối lượng công việc qua cả hai, báo cáo tỷ lệ trúng bộ nhớ đệm tiền tố và chênh lệch thông lượng. Rồi chạy một khối lượng công việc “thứ tự xáo trộn” để cho thấy sự sụp đổ 6.4x.

## Ship It

Bài này tạo ra `outputs/skill-radix-scheduler-advisor.md`. Với một mô tả khối lượng công việc (hình dạng mẫu prompt, mẫu truy xuất, số tenant đồng thời), nó tạo một chỉ dẫn thứ tự prompt và quyết định làm/không làm cho áp dụng SGLang.

## Exercises

1. Chạy `code/main.py`. So sánh FCFS và nhận biết bộ nhớ đệm trên cùng khối lượng công việc. Chênh lệch đến từ đâu — tiết kiệm prefill, tiết kiệm decode, hay độ trễ hàng đợi?
2. Sửa khối lượng công việc để các prompt hoán vị ngẫu nhiên `[system, tools, context]`. Chạy lại. Điều gì xảy ra với tỷ lệ trúng? Vì sao?
3. Tính chi phí HBM của việc giữ một prompt hệ thống 2,000 token thường trú như một nhánh radix trên Llama 3.1 8B. So sánh với chi phí của một lô 16 chuỗi không có tái sử dụng tiền tố.
4. Đọc bài báo SGLang RadixAttention. Giải thích trong ba câu vì sao trục xuất LRU dạng cây vượt LRU dạng block dưới tải nhiều tiền tố.
5. Một khách hàng báo tỷ lệ trúng bộ nhớ đệm chỉ 8%. Nêu ba nguyên nhân có khả năng và chẩn đoán bạn sẽ chạy cho mỗi nguyên nhân.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| RadixAttention | “thứ SGLang” | Bộ nhớ đệm KV được lập chỉ mục như một cây radix để các tiền tố dùng chung tái sử dụng các block |
| Radix tree (Cây radix) | “trie nén” | Cây nơi mỗi node sở hữu một dải token và các block KV của nó |
| Cache-aware scheduler (Bộ lập lịch nhận biết bộ nhớ đệm) | “nhánh nóng trước” | Bộ lập lịch ưu tiên các yêu cầu chia sẻ nhánh thường trú |
| Prefix-cache hit rate (Tỷ lệ trúng bộ nhớ đệm tiền tố) | “bao nhiêu prompt của bạn miễn phí” | Tỷ lệ token prompt được phục vụ từ các block KV tái sử dụng |
| FCFS | “đến trước phục vụ trước” | Lập lịch mặc định phá tính cục bộ tiền tố |
| Branch-level LRU (LRU cấp nhánh) | “trục xuất lá” | Chính sách trục xuất khớp hình dạng radix |
| Prompt template ordering (Thứ tự mẫu prompt) | “khóa bộ nhớ đệm” | Thứ tự thành phần của prompt quyết định cây có thể chia sẻ gì |
| System prompt pinning (Ghim prompt hệ thống) | “tiền tố thường trú” | Giữ phần hệ thống bất biến được ghim để tránh xáo trộn trục xuất |

## Further Reading

- [SGLang GitHub](https://github.com/sgl-project/sglang) — mã nguồn và tài liệu.
- [SGLang documentation](https://sgl-project.github.io/) — chi tiết RadixAttention và lập lịch.
- [SGLang paper — Efficiently Programming Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) — tham chiếu thiết kế.
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) — các con số benchmark và lý do bộ lập lịch.
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/) — triển khai giống radix riêng của vLLM, để so sánh.
