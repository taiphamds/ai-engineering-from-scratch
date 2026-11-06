# Capstone 12 — Video Understanding Pipeline (Scene, QA, Search)

> Twelve Labs đã sản phẩm hóa Marengo + Pegasus. VideoDB đã phát hành API CRUD cho video. Molmo 2 của AI2 đã công bố các checkpoint VLM mở. Gemini ngữ cảnh dài xử lý hàng giờ video một cách nguyên bản. TimeLens-100K đã định nghĩa định vị thời gian ở quy mô lớn. Pipeline năm 2026 đã ổn định: phân đoạn cảnh, chú thích + embedding theo cảnh, căn chỉnh bản chép lời, chỉ mục đa vector, và một truy vấn trả lời bằng các mốc thời gian (start, end) cùng bản xem trước khung hình. Bài tổng kết là tiếp nhận 100 giờ, đạt các benchmark công khai, và đo ảo giác trên các câu hỏi đếm và hành động.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (UI)
**Prerequisites:** Phase 4 (CV), Phase 6 (speech), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:** P4 · P6 · P7 · P11 · P12 · P17
**Time:** 30 hours

## Problem

Hỏi đáp video dài là vấn đề đa phương thức ngốn băng thông nhất ở quy mô năm 2026. Gemini 2.5 Pro có thể đọc một video 2 giờ một cách nguyên bản, nhưng việc tiếp nhận 100 giờ video vào một corpus có thể truy vấn vẫn đòi hỏi một chỉ mục ở mức cảnh. Hình thức sản xuất kết hợp phân đoạn cảnh (TransNetV2 hoặc PySceneDetect), chú thích theo cảnh bằng một VLM (Gemini 2.5, Qwen3-VL-Max, hoặc Molmo 2), căn chỉnh bản chép lời (Whisper-v3-turbo với mốc thời gian từ), và một chỉ mục đa vector lưu chú thích, embedding khung hình, và bản chép lời cạnh nhau. Pipeline truy vấn trả lời bằng các mốc thời gian (start, end) cùng bản xem trước khung hình.

Các benchmark được công khai (ActivityNet-QA, NeXT-GQA) cùng tập tùy chỉnh 100 truy vấn của riêng bạn. Ảo giác trên các câu hỏi đếm và loại hành động là lớp lỗi được biết là khó; bài tổng kết đo nó một cách rõ ràng.

## Concept

Ba pipeline chạy song song khi tiếp nhận. **Phân đoạn cảnh** cắt video thành các cảnh. **Chú thích VLM** tạo một chú thích cho mỗi cảnh và một embedding khung hình từ một khung hình chính. **Căn chỉnh ASR** tạo các mốc thời gian ở mức từ. Ba luồng được nối theo (scene_id, time range). Mỗi cảnh nhận ba loại vector trong một chỉ mục đa vector (Qdrant): embedding chú thích, embedding khung hình chính, embedding bản chép lời.

Tại thời điểm truy vấn, câu hỏi ngôn ngữ tự nhiên được gửi đến cả ba vector; các kết quả hợp nhất bằng RRF; một adapter định vị thời gian (kiểu TimeLens) tinh chỉnh cửa sổ (start, end) trong cảnh đứng đầu. Bộ tổng hợp VLM (Gemini 2.5 Pro hoặc Qwen3-VL-Max) nhận truy vấn + các cảnh đứng đầu + các khung hình được cắt và trả lời với các mốc thời gian được trích dẫn cùng một bản xem trước khung hình.

Phép đo ảo giác có ý nghĩa. Các câu hỏi đếm ("có bao nhiêu người đi vào phòng?") và loại hành động ("đầu bếp có đổ trước khi khuấy không?") nổi tiếng là không đáng tin cậy. Báo cáo độ chính xác tách biệt với các câu hỏi mô tả.

## Architecture

```
video file / URL
      |
      v
PySceneDetect / TransNetV2  (scene segmentation)
      |
      +--- per-scene keyframe --- VLM caption + frame embedding
      |                            (Gemini 2.5 Pro / Qwen3-VL-Max / Molmo 2)
      |
      +--- audio channel --- Whisper-v3-turbo ASR + word timestamps
      |
      v
multi-vector Qdrant: {caption_emb, keyframe_emb, transcript_emb}
      |
query:
  dense queries against all three -> RRF merge -> top-k scenes
      |
      v
TimeLens / VideoITG temporal grounding (refine start/end within scene)
      |
      v
VLM synth: query + top scenes + frame previews
      |
      v
answer + (start, end) timestamps + frame thumbs + citations
```

## Stack

- Phân đoạn cảnh: TransNetV2 (tiên tiến nhất 2024-26) hoặc PySceneDetect
- ASR: Whisper-v3-turbo qua faster-whisper với mốc thời gian từ
- Bộ chú thích + trả lời VLM: Gemini 2.5 Pro hoặc Qwen3-VL-Max hoặc Molmo 2
- Định vị thời gian: adapter được huấn luyện bằng TimeLens-100K hoặc VideoITG
- Chỉ mục: Qdrant với hỗ trợ đa vector (chú thích / khung hình / bản chép lời)
- UI: Next.js 15 với trình phát video HTML5 và hình thu nhỏ cảnh
- Đánh giá: ActivityNet-QA, NeXT-GQA, tập tùy chỉnh 100 câu hỏi gắn nhãn thủ công
- Benchmark ảo giác: các tập con đếm và loại hành động với nhãn thủ công

```figure
cf-scene-index
```

## Build It

1. **Trình duyệt tiếp nhận.** Nhận các URL YouTube hoặc MP4 cục bộ. Giảm độ phân giải xuống 720p nếu cần. Lưu bền vững `{video_id, file_path}`.

2. **Phân đoạn cảnh.** Chạy TransNetV2 hoặc PySceneDetect để tạo `[{scene_id, start_ms, end_ms, keyframe_path}]`. Mục tiêu 100 giờ: ~6k-8k cảnh.

3. **Lượt ASR.** Chạy Whisper-v3-turbo trên âm thanh; xuất các mốc thời gian ở mức từ; chia thành các phần bản chép lời theo cảnh.

4. **Chú thích VLM.** Với mỗi cảnh, gọi Gemini 2.5 Pro (hoặc Qwen3-VL-Max) với khung hình chính và một mẫu chú thích ngắn. Tạo chú thích + embedding khung hình.

5. **Chỉ mục đa vector.** Collection Qdrant với ba vector có tên. Payload: `{video_id, scene_id, start_ms, end_ms, keyframe_url}`.

6. **Truy vấn.** Câu hỏi ngôn ngữ tự nhiên gửi ba truy vấn dense; hợp nhất bằng hợp nhất thứ hạng nghịch đảo; top-k=5 cảnh.

7. **Định vị thời gian.** Chạy adapter kiểu TimeLens trên cảnh đứng đầu để tinh chỉnh cửa sổ (start, end) trong cảnh.

8. **Tổng hợp VLM.** Gọi Gemini 2.5 Pro với truy vấn + top-3 đoạn cảnh (dưới dạng ảnh hoặc đoạn phim ngắn) + bản chép lời. Yêu cầu các trích dẫn `(video_id, start_ms, end_ms)`.

9. **Đánh giá.** Chạy ActivityNet-QA và NeXT-GQA. Xây dựng một tập tùy chỉnh 100 truy vấn. Báo cáo độ chính xác tổng thể + phân tích theo lớp (đếm, hành động, mô tả).

## Use It

```
$ video-qa ask --url=https://youtube.com/watch?v=X "how many cars pass the intersection in the first minute?"
[scene]    23 scenes detected
[asr]      transcript complete, 4m12s
[index]    69 vectors written (23 scenes x 3)
[query]    top scene: scene 3 [01:32-01:54], confidence 0.84
[ground]   refined window: [00:12-00:58]
[synth]    gemini 2.5 pro, 1.4s
answer:    5 cars pass the intersection between 00:12 and 00:58.
citations: [scene 3: 00:12-00:58]
          [frame preview at 00:14, 00:27, 00:44, 00:51, 00:57]
```

## Ship It

`outputs/skill-video-qa.md` là sản phẩm bàn giao. Với một URL YouTube hoặc video tải lên được cung cấp, pipeline lập chỉ mục các cảnh và trả lời câu hỏi với các trích dẫn có mốc thời gian.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | IoU định vị thời gian | Giao trên hợp trên tập định vị được giữ riêng |
| 20 | Độ chính xác hỏi đáp | NeXT-GQA và 100 truy vấn tùy chỉnh |
| 20 | Thông lượng tiếp nhận | Số giờ video trên mỗi đô la đã chi |
| 20 | UI và UX trích dẫn | Liên kết mốc thời gian, dải hình thu nhỏ, nhảy đến khung hình |
| 15 | Tỷ lệ ảo giác | Độ chính xác đếm và loại hành động riêng biệt |
| **100** | | |

## Exercises

1. Thay Gemini 2.5 Pro bằng Qwen3-VL-Max ở lượt chú thích. Báo cáo chênh lệch chất lượng chú thích trên một mẫu 50 cảnh do con người chấm.

2. Giảm embedding khung hình theo cảnh xuống một vector gộp thay vì đa vector. Đo sự thoái lui truy xuất.

3. Xây dựng chế độ "đếm nghiêm ngặt": bộ tổng hợp trích xuất mỗi đối tượng được đếm với một mốc thời gian và người dùng nhấp để xác minh. Đo xem việc xác minh của người dùng có giảm ảo giác không.

4. Đo benchmark chi phí tiếp nhận: số giờ video trên mỗi đô la trên ba lựa chọn VLM. Chọn điểm tối ưu.

5. Thêm bản chép lời phân biệt người nói: chạy phân biệt người nói pyannote trên âm thanh và nhúng các bản chép lời theo người nói. Minh họa các truy vấn "Alice đã nói gì về X?".

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Scene segmentation (Phân đoạn cảnh) | "Phát hiện cảnh quay" | Cắt video thành các cảnh tại ranh giới cảnh quay |
| Multi-vector index (Chỉ mục đa vector) | "Chú thích + khung hình + bản chép lời" | Collection Qdrant với các vector có tên cho mỗi dạng biểu diễn |
| Temporal grounding (Định vị thời gian) | "Chính xác nó xảy ra khi nào" | Tinh chỉnh cửa sổ (start, end) cho một câu trả lời truy vấn |
| Frame embedding (Embedding khung hình) | "Biểu diễn thị giác" | Một embedding vector của một khung hình chính; dùng cho độ tương tự thị giác cảnh |
| RRF fusion (Hợp nhất RRF) | "Hợp nhất thứ hạng nghịch đảo" | Chiến lược hợp nhất trên nhiều danh sách được xếp hạng; một thủ thuật truy xuất lai kinh điển |
| Counting hallucination (Ảo giác đếm) | "Đếm sai" | Chế độ lỗi đã biết của VLM trên các câu hỏi "bao nhiêu X" |
| ActivityNet-QA | "Benchmark hỏi đáp video" | Benchmark độ chính xác hỏi đáp video dài |

## Further Reading

- [AI2 Molmo 2](https://allenai.org/blog/molmo2) — các checkpoint VLM mở
- [TimeLens (CVPR 2026)](https://github.com/TencentARC/TimeLens) — định vị thời gian ở quy mô lớn
- [Gemini Video long-context](https://deepmind.google/technologies/gemini) — tham chiếu được lưu trữ
- [VideoDB](https://videodb.io) — tham chiếu API CRUD cho video
- [Twelve Labs Marengo + Pegasus](https://www.twelvelabs.io) — tham chiếu thương mại
- [TransNetV2](https://github.com/soCzech/TransNetV2) — mô hình phân đoạn cảnh
- [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) — lựa chọn thay thế mở kinh điển
- [ActivityNet-QA](https://arxiv.org/abs/1906.02467) — benchmark đánh giá tham chiếu
