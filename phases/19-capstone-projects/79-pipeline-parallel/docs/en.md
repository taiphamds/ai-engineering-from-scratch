# Pipeline Parallel and Bubble Analysis

> Song song tensor chia phép nhân ma trận trên các rank. Song song pipeline chia mô hình trên các rank, một giai đoạn mỗi rank. Các lô vi mô chảy qua pipeline. Thời gian trống ở đầu và cuối là bong bóng; giảm thiểu nó là toàn bộ kỹ nghệ.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 min

## Learning Objectives

- Chia một mô hình tuần tự thành N giai đoạn và mô phỏng một pipeline lượt tiến trên N rank.
- Lập lịch M lô vi mô qua pipeline bằng lịch GPipe (lấp chỉ lượt tiến, rồi lượt ngược) và tính tỷ lệ bong bóng.
- So sánh bong bóng với lịch 1F1B xen kẽ được dùng trong Megatron-LM và PipeDream.
- Bảo vệ phân công giai đoạn: tính toán bằng nhau mỗi giai đoạn quan trọng hơn số tham số bằng nhau mỗi giai đoạn.

## The Problem

Một mô hình 70B tham số trong fp16 cần 140 GB chỉ riêng tham số. Không GPU tiêu dùng nào chứa được nó. ZeRO-3 chia shard các tham số trên các rank nhưng vẫn cần mọi rank allgather lớp đầy đủ cho mỗi bước lượt tiến, trả log(N) bước nhảy mỗi lớp. Song song pipeline đi đường khác: cắt mô hình thành N giai đoạn và đặt một giai đoạn trên mỗi rank. Lượt tiến của lớp 1 hoàn tất trên rank 0 và đưa tensor kích hoạt cho rank 1; rank 1 chạy lớp 2 và đưa cho rank 2; và tiếp tục. Lượt ngược chảy ngược lại. Bộ nhớ giảm tuyến tính vì mỗi rank chỉ giữ một giai đoạn; tính toán tuần tự, là vấn đề bong bóng.

Bong bóng là thời gian nhàn rỗi ở đầu pipeline (đợi lô vi mô đầu đến giai đoạn cuối) và ở cuối (đợi lô vi mô cuối chảy ngược qua). Với M lô vi mô và N giai đoạn tỷ lệ bong bóng theo giai đoạn là (N-1)/(M+N-1). Tại M=8, N=4 đó là 27%. Tại M=64, N=4 là 4.5%. Bong bóng co lại khi bạn có nhiều lô vi mô mỗi bước, nghĩa là các kích thước lô nhỏ theo lô vi mô, là ràng buộc điều khiển thiết kế lô vi mô.

## The Concept

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe schedule

Lấp pipeline về phía trước bằng cả M lô vi mô trước khi bắt đầu bất kỳ lượt ngược nào; rồi xả ngược theo thứ tự đảo. Các kích hoạt từ mọi lô vi mô phải được giữ đến lượt ngược của nó, nên bộ nhớ tăng tuyến tính theo M. Lượt tiến mất M+N-1 chu kỳ, lượt ngược mất thêm M+N-1 chu kỳ. Công việc hữu ích theo giai đoạn là 2M chu kỳ; bong bóng theo giai đoạn là 2(N-1) chu kỳ. Tỷ lệ bong bóng là (N-1)/(M+N-1) khi mỗi lượt tiến và ngược mất một đơn vị thời gian. Chọn M lớn hơn nhiều N ẩn bong bóng.

### 1F1B schedule

Xen kẽ: ngay khi lượt tiến của một lô vi mô đến giai đoạn cuối, bắt đầu lượt ngược của nó và để nó truyền luồng trở lại. Lịch luân phiên một lượt tiến và một lượt ngược mỗi giai đoạn. Bong bóng vẫn N-1 nhưng bộ nhớ kích hoạt bị giới hạn bởi độ sâu pipeline, không phải số lô vi mô. Các pipeline sản xuất dùng 1F1B (Megatron, PipeDream). Bài học triển khai GPipe trước vì nó đơn giản hơn, và 1F1B như một bài tập.

### Why equal compute per stage matters

Nếu giai đoạn 0 mất 50 ms và giai đoạn 1 mất 100 ms, mọi chu kỳ bị chặn bởi giai đoạn 1. Các giai đoạn khác nhàn rỗi 50 ms mỗi chu kỳ đợi giai đoạn 1 giải phóng. Số tham số bằng nhau là trục sai: tính toán transformer bị chi phối bởi attention cộng MLP mỗi lớp, và các lớp embedding có nhiều tham số nhưng ít tính toán. Phân công giai đoạn nên cân bằng FLOP mỗi giai đoạn, không phải trọng số mỗi giai đoạn.

### Microbatch versus batch

Một pipeline chạy M lô vi mô, mỗi lô kích thước B. Kích thước lô hiệu dụng là M*B. Gradient ở cuối một bước pipeline là gradient trên M*B ví dụ kết hợp. Tỷ lệ bong bóng phụ thuộc M; bộ tối ưu thấy M*B. Điều chỉnh M nghĩa là đánh đổi bong bóng (thấp hơn với M cao) với bộ nhớ theo lô vi mô (bộ nhớ kích hoạt cao hơn với M cao cho GPipe).

```figure
cd-pipeline-bubble
```

## Build It

`code/main.py` triển khai:

- `PipelineStage`: một `nn.Module` nhỏ giữ các tham số của một giai đoạn và cung cấp `forward(activation)`.
- `Pipeline(stages, num_microbatches)`: điều phối lịch GPipe trên các giai đoạn mô phỏng bằng thời gian thực mô phỏng theo giai đoạn.
- `bubble_fraction(num_stages, num_microbatches)`: dạng đóng (N-1)/(M+N-1).
- Một demo 4 giai đoạn in trace theo lô vi mô và tỷ lệ bong bóng đo được.

Chạy nó:

```bash
python3 code/main.py
```

Đầu ra: một biểu đồ Gantt giai đoạn-theo-lô-vi-mô và phần trăm bong bóng so với dự đoán dạng đóng.

## Production patterns in the wild

Ba mẫu gia cố song song pipeline đủ để cung cấp.

**Checkpoint kích hoạt ghép với pipeline.** Với M lô vi mô đang xử lý trên GPipe, bộ nhớ kích hoạt bằng M lần một lô vi mô. Checkpoint kích hoạt tính lại lượt tiến lúc lượt ngược, đánh đổi tính toán lấy bộ nhớ; tổ hợp là thứ khiến pipeline khả thi cho các chuỗi dài.

**Cân bằng giai đoạn được đo, không giả định.** Các nhóm sản xuất chạy một lượt đo hiệu năng đo tính toán theo lớp thực (FLOP và thời gian thực) trên phần cứng đích, rồi phân vùng theo phép đo đó. Cờ `--num-layers-per-stage` của Megatron-LM nhận một danh sách để cho phép số lớp không đều khi các giai đoạn có chi phí theo lớp khác nhau.

**Lịch gửi-nhận phải tránh deadlock.** Một pipeline có mọi giai đoạn gửi trước nhận sẽ deadlock trên đường truyền. Cách sửa tiêu chuẩn là xen kẽ: các giai đoạn rank chẵn gửi trước rồi nhận, các giai đoạn rank lẻ nhận trước rồi gửi. Bài học lập lịch các rank rõ ràng để mẫu có thể thấy.

## Use It

Các mẫu sản xuất:

- **Megatron-LM.** Tham chiếu cho song song pipeline ở quy mô lớn. Dùng 1F1B và hỗ trợ tensor + pipeline + song song dữ liệu kết hợp.
- **DeepSpeed Pipeline.** Tích hợp với ZeRO; ZeRO-1 + pipeline là một tổ hợp phổ biến cho các mô hình mở lớn nhất.
- **PyTorch Pipe.** Lớp bọc pipeline bản địa PyTorch, được xây trên `torch.distributed.pipeline.sync.Pipe`.

## Ship It

Bài 80 lưu các shard tham số theo giai đoạn trong checkpoint chia shard. Bài 81 kết hợp DDP + ZeRO + pipeline trên demo đầu cuối (về tinh thần; demo giữ pipeline mô phỏng vì runtime).

## Exercises

1. Triển khai 1F1B và xác minh tỷ lệ bong bóng khớp GPipe nhưng bộ nhớ kích hoạt có giới hạn.
2. Đo hiệu năng thời gian theo giai đoạn thực trên một mô hình sâu hơn và cân bằng lại các giai đoạn theo thời gian thực đo được.
3. Thêm tích lũy gradient trên các lô vi mô pipeline và kiểm tra gradient bằng gradient của lượt tiến lô đầy đủ tương đương.
4. Ghép pipeline với checkpoint kích hoạt và đo mức giảm bộ nhớ so với chi phí tính toán.
5. Kết hợp pipeline với DDP (mỗi rank pipeline được sao chép trên một nhóm song song dữ liệu) và suy luận qua lịch 2D.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Pipeline | "Song song mô hình dọc độ sâu" | Một giai đoạn mỗi rank, các kích hoạt chảy từ giai đoạn này sang giai đoạn khác |
| Bubble (Bong bóng) | "Thời gian nhàn rỗi pipeline" | (N-1) bước ở đầu + cuối nơi một số giai đoạn không có việc |
| Microbatch (Lô vi mô) | "Phần cắt của lô" | Một đơn vị lượt tiến/ngược; bong bóng co khi M tăng |
| GPipe | "Lấp rồi xả" | Cả M lượt tiến trước bất kỳ lượt ngược nào; bộ nhớ kích hoạt cao |
| 1F1B | "Lịch xen kẽ" | Một lượt tiến một lượt ngược mỗi giai đoạn; bộ nhớ kích hoạt có giới hạn |

## Further Reading

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- Phase 19 Bài 76 - các thành phần cơ sở send/recv mà lịch sử dụng
- Phase 19 Bài 78 - ZeRO trực giao với pipeline và thường được kết hợp
