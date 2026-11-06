# Serving Engine Internals — PagedAttention, Continuous Batching, Chunked Prefill

> Thông lượng engine phục vụ hiện đại dựa trên ba mặc định cộng dồn, không phải một mẹo đơn lẻ. PagedAttention luôn bật. Gom lô liên tục đưa các yêu cầu mới vào lô hoạt động giữa các lần lặp decode. Prefill chia khối cắt các prompt dài để các token decode không bao giờ bị đói. Bật cả ba và một Llama 3.3 70B FP8 trên một H100 SXM5 đẩy 2,200-2,400 tok/s ở 128 đồng thời — cao hơn khoảng 25% so với mặc định riêng của vLLM và 3-4x một vòng lặp PyTorch ngây thơ. Bài này đọc bộ lập lịch và kernel attention của vLLM — engine tham chiếu cho cả ba kỹ thuật — ở mức bạn có thể vẽ sơ đồ, và kết thúc bằng một bộ gom lô liên tục đồ chơi trong `code/main.py` lập lịch prefill và decode theo cách vLLM làm.

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**Prerequisites:** Phase 17 · 01 (Model Serving), Phase 11 (LLM Engineering)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích PagedAttention như một bộ cấp phát bộ nhớ đệm KV: các block, các bảng block, và vì sao phân mảnh ở dưới 4% tại tải sản xuất.
- Vẽ sơ đồ gom lô liên tục ở cấp lần lặp: cách các chuỗi đã xong rời lô và các chuỗi mới tham gia mà không làm cạn lô.
- Mô tả prefill chia khối trong một câu và nêu chỉ số độ trễ nào nó bảo vệ (gợi ý: đó là đuôi TTFT, không phải thông lượng trung bình).
- Kiểm tra một tổ hợp tính năng vLLM theo ma trận tương thích cho phiên bản của bạn trước khi bật mọi tối ưu hóa cùng lúc.

## The Problem

Một vòng lặp phục vụ PyTorch ngây thơ chạy từng yêu cầu một: token hóa, prefill, decode cho tới EOS, trả về. Ở một người dùng điều này hoạt động. Ở một trăm, nó là một hàng đợi những người kiên nhẫn. Cách sửa hiển nhiên — gom lô tĩnh — đệm mọi yêu cầu tới prompt dài nhất trong cửa sổ, đệm mọi decode tới đầu ra dự kiến dài nhất, và làm đình trệ cả lô trên chuỗi chậm nhất. Bạn trả cho phần đệm không bao giờ dùng, và các yêu cầu nhanh chờ các yêu cầu chậm.

vLLM giải quyết ba vấn đề cùng lúc. PagedAttention ngăn phân mảnh bộ nhớ đệm KV ăn 60-80% bộ nhớ GPU như cấp phát liên tục cổ điển. Gom lô liên tục cho các yêu cầu tham gia và rời lô giữa mỗi lần lặp decode, nên lô luôn đầy công việc thực. Prefill chia khối tách một prompt 32k token thành các lát ~512 token xen kẽ với decode, nên một prompt dài không đóng băng mọi token decode trên GPU.

Mặc định sản xuất năm 2026 là bật cả ba. Bạn cần hiểu mỗi kỹ thuật làm gì vì các chế độ lỗi đều nằm ở bộ lập lịch, không phải mô hình.

## The Concept

### PagedAttention as a virtual memory system

Một bộ nhớ đệm KV là `num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element` theo từng chuỗi. Với Llama 3.3 70B ở 8192 token, đó là khoảng 1.25 GB mỗi chuỗi trong BF16. Nếu bạn đặt trước 8192 vị trí cho mọi yêu cầu nhưng yêu cầu trung bình chỉ dùng 1500 token, bạn lãng phí khoảng 82% HBM đã đặt trước. Gom lô cổ điển trả sự lãng phí này.

PagedAttention mượn ý tưởng từ bộ nhớ ảo hệ điều hành. Bộ nhớ đệm KV không liên tục theo từng chuỗi. Nó được cấp phát trong các block kích thước cố định (mặc định 16 token). Mỗi chuỗi có một bảng block ánh xạ các vị trí token logic tới các ID block vật lý. Khi một chuỗi tăng vượt các block đã cấp phát, thêm một block được thêm vào. Khi nó kết thúc, các block trở lại bể.

Phân mảnh giảm từ 60-80% (cổ điển) xuống dưới 4% (PagedAttention). Bạn không bật PagedAttention bằng một cờ — nó là bộ cấp phát duy nhất vLLM cung cấp. Núm điều chỉnh là `--gpu-memory-utilization` (mặc định 0.9), cho vLLM biết cần dành bao nhiêu HBM cho các block KV sau khi tải trọng số và các kích hoạt.

### Continuous batching at the iteration level

“Gom lô động” cũ chờ một cửa sổ (chẳng hạn 10 ms) để lấp đầy một lô, rồi chạy prefill + decode + decode + decode cho tới khi mọi chuỗi kết thúc. Các chuỗi nhanh rời sớm và nằm nhàn rỗi trong khi GPU hoàn thành các chuỗi chậm.

Gom lô liên tục hoạt động giữa mỗi bước decode. Gọi tập các chuỗi đang chạy là danh sách `RUNNING`. Ở mỗi lần lặp:

1. Bất kỳ chuỗi nào trong `RUNNING` vừa chạm EOS hoặc max_tokens được bỏ ra.
2. Bộ lập lịch nhìn hàng đợi đang chờ. Nếu có các block KV trống, nó nhận các chuỗi mới (prefill hoặc được tiếp tục).
3. Lượt truyền xuôi chạy trên bất cứ thứ gì hiện trong `RUNNING`, phát một token mới mỗi chuỗi.

Kích thước lô không bao giờ được đệm tới một con số cố định. Các chuỗi ở các vị trí khác nhau trong đầu ra chia sẻ một lượt truyền xuôi hợp nhất. Trong vLLM năm 2026 điều này được gọi là `V1 scheduler`. Bất biến then chốt: bộ lập lịch chạy một lần mỗi lần lặp decode, không phải một lần mỗi yêu cầu.

### Chunked prefill protects TTFT tail

Prefill bị giới hạn bởi tính toán. Một prompt 32k token trên Llama 3.3 70B mất ~800 ms prefill thuần trên một H100. Trong khi prefill chạy, các token decode cho mọi chuỗi khác trong lô chờ. Trong một vòng lặp phục vụ, độ trễ token đầu tiên (TTFT) của một prompt dài trở thành cú nhô độ trễ giữa token (ITL) cho hàng chục người dùng khác.

Prefill chia khối chia prefill thành các khối kích thước cố định (mặc định 512 token) và lập lịch mỗi khối như một đơn vị. Giữa các khối, bộ lập lịch có thể đẩy các chuỗi decode tiến một token. Bạn đổi một tác động độ trễ prefill tuyệt đối nhỏ (vài ms mỗi khối) lấy dao động thời gian decode thấp hơn nhiều. P99 ITL dưới tải hỗn hợp giảm từ ~50 ms xuống ~15 ms trong các benchmark được công bố.

### The three defaults interact

Cả ba tính năng giả định lẫn nhau. PagedAttention cho bộ lập lịch một tài nguyên KV độ hạt mịn để đánh đổi. Gom lô liên tục cần tài nguyên độ hạt mịn đó để nhận một chuỗi mới không buộc xáo trộn toàn cục. Prefill chia khối là một quyết định bộ lập lịch đưa ra trên cùng danh sách `RUNNING` — nó là thêm một chính sách bộ lập lịch, không phải một hệ thống riêng.

Bạn không cần biết mọi cờ. Bạn cần biết bộ lập lịch tối ưu gì: goodput dưới ngân sách block KV, chịu ràng buộc cắt prefill chia khối.

### Check the compatibility matrix

Kiểm tra mọi tổ hợp tính năng theo ma trận tương thích cho đúng phiên bản vLLM trước khi bật tất cả cùng lúc, vì những gì kết hợp được thay đổi giữa các bản phát hành. Trong v0.18.0 ma trận tính năng đánh dấu giải mã suy đoán tương thích với prefill chia khối và lưu đệm tiền tố, và trang giải mã suy đoán liệt kê hai không tương thích đã biết: song song pipeline tới hết v0.15.0, và suy đoán mô hình nháp tới hết v0.10.0. Với chính phương pháp nháp, mặc định năm 2026 thường là EAGLE-3 (`"method": "eagle3"`), được trình bày trong Giai đoạn 17 · 05.

### Numbers you should remember

- Llama 3.3 70B FP8, H100 SXM5, 128 đồng thời, bật cả ba: 2,200-2,400 tok/s.
- Cùng mô hình, vLLM mặc định (không prefill chia khối): ~1,800 tok/s.
- Cùng mô hình, vòng lặp truyền xuôi PyTorch ngây thơ: ~600 tok/s.
- Lãng phí phân mảnh KV dưới PagedAttention ở tải sản xuất: <4%.
- P99 ITL dưới tải hỗn hợp: ~15 ms với prefill chia khối, ~50 ms nếu không có.

### What the scheduler looks like

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py` chính xác là vòng lặp này bằng thư viện chuẩn Python với các số đếm token giả và độ trễ truyền xuôi giả. Chạy nó cho thấy cách prefill chia khối giữ các chuỗi decode sống trong một prefill dài.

```figure
tensor-parallel
```

## Use It

`code/main.py` mô phỏng một bộ lập lịch kiểu vLLM với các tính năng có thể bật tắt. Chạy nó để thấy:

- Chế độ `NAIVE`: từng yêu cầu một, không gom lô.
- Chế độ `STATIC`: đệm và chờ, gom lô cổ điển.
- Chế độ `CONTINUOUS`: nhận và giải phóng ở cấp lần lặp.
- Chế độ `CONTINUOUS + CHUNKED`: các lát prefill xen kẽ với decode.

Đầu ra cho thấy tổng thông lượng (token mỗi giây ảo), TTFT trung bình, và P99 ITL. Hàng `CONTINUOUS + CHUNKED` nên chiếm ưu thế trên lưu lượng hỗn hợp.

## Ship It

Bài này tạo ra `outputs/skill-vllm-scheduler-reader.md`. Với một cấu hình phục vụ (kích thước lô, mức sử dụng bộ nhớ KV, kích thước prefill chia khối, cấu hình suy đoán), nó tạo một chẩn đoán bộ lập lịch nêu mặc định nào trong ba mặc định đang gây nút thắt và cần điều chỉnh gì.

## Exercises

1. Chạy `code/main.py`. So sánh `STATIC` với `CONTINUOUS` trên một khối lượng công việc trộn các yêu cầu ngắn và dài. Khoảng cách thông lượng đến từ đâu — hiệu quả prefill, hiệu quả decode, hay độ trễ đuôi?
2. Sửa bộ lập lịch đồ chơi để thêm `--max-num-batched-tokens`. Giá trị phù hợp cho một H100 chạy Llama 3.3 70B FP8 là gì? (Gợi ý: nó là một hàm của kích thước block KV và số block trống, không phải HBM thô.)
3. Đọc lại ghi chú phát hành vLLM v0.18.0. Những tổ hợp cờ nào loại trừ lẫn nhau? Liệt kê chúng.
4. Tính lãng phí phân mảnh bộ nhớ đệm KV cho một dấu vết 1,000 yêu cầu với trung bình 1,500 token đầu ra, độ lệch chuẩn 600 token, dưới (a) cấp phát liên tục theo từng yêu cầu ở tối đa 8192, (b) PagedAttention với các block 16 token.
5. Giải thích trong một đoạn vì sao prefill chia khối giúp P99 ITL nhưng không giúp thông lượng khi xét riêng. Lợi ích thông lượng đến từ đâu trong thực tế?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| PagedAttention | “mẹo KV” | Bộ cấp phát block kích thước cố định cho bộ nhớ đệm KV; phân mảnh <4% |
| Block table (Bảng block) | “bảng trang” | Ánh xạ theo từng chuỗi từ vị trí token logic tới block KV vật lý |
| Continuous batching (Gom lô liên tục) | “gom lô động, nhưng đúng” | Các quyết định nhận/giải phóng được đưa ra mỗi lần lặp decode |
| Chunked prefill (Prefill chia khối) | “chia prefill” | Tách prefill dài thành các lát 512 token xen kẽ với decode |
| TTFT | “thời gian token đầu tiên” | Prefill + hàng đợi + mạng; bị prefill chi phối ở các prompt dài |
| ITL | “độ trễ giữa token” | Thời gian giữa các token decode liên tiếp; bị kích thước lô chi phối |
| Goodput | “thông lượng đáp ứng SLO” | Token/giây nơi mọi yêu cầu vẫn đạt các mục tiêu TTFT và ITL |
| V1 scheduler (Bộ lập lịch V1) | “bộ lập lịch mới” | Bộ lập lịch năm 2026 của vLLM; chạy gom lô liên tục với prefill chia khối |
| `--gpu-memory-utilization` | “núm bộ nhớ” | Tỷ lệ HBM dành cho các block KV sau trọng số và các kích hoạt |

## Further Reading

- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) — nguồn chính thức về tương thích prefill chia khối và giải mã suy đoán.
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) — nhịp phát hành năm 2026 và hành vi riêng theo phiên bản.
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) — bài viết gốc vẫn định nghĩa cách suy nghĩ về bộ cấp phát.
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) — phân tích phân mảnh và thiết kế bộ lập lịch.
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) — hướng dẫn chi tiết bộ lập lịch V1 với các flame graph.
