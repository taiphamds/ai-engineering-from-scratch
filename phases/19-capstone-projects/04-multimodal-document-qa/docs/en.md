# Capstone 04 — Multimodal Document QA (Vision-First PDF, Tables, Charts)

> Biên hỏi đáp tài liệu 2026 chuyển khỏi OCR-rồi-văn-bản sang tương tác muộn ưu tiên thị giác. ColPali, ColQwen2.5 và ColQwen3-omni xem mỗi trang PDF là ảnh, tạo embedding bằng tương tác muộn đa vector, cho truy vấn chú ý trực tiếp patch. Trên 10-K tài chính, bài báo khoa học và ghi chú viết tay, mẫu này thắng OCR-trước với khoảng cách lớn. Xây pipeline đầu cuối trên 10k trang và công bố so sánh cạnh nhau với OCR-rồi-văn-bản.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:** P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 hours

## Problem

Doanh nghiệp giữ PDF bị pipeline OCR làm hỏng: 10-K quét với bảng xoay, bài báo khoa học dày phương trình, biểu đồ chỉ có nghĩa dưới dạng ảnh, chú thích viết tay. Xem chúng ưu tiên văn bản nghĩa là mất nửa tín hiệu. Câu trả lời 2026 là truy xuất đa vector tương tác muộn trên ảnh trang thô. ColPali (Illuin Tech) đưa ra; ColQwen2.5-v0.2 và ColQwen3-omni đẩy độ chính xác. Trên ViDoRe v3, truy xuất ưu tiên thị giác đạt điểm trên OCR-rồi-văn-bản với khoảng cách đáng kể — và khoảng cách rộng hơn ở biểu đồ, bảng, chữ viết tay.

Đánh đổi là lưu trữ và độ trễ. Embedding ColQwen là ~2048 vector patch mỗi trang, không phải một vector 1024 chiều. Lưu trữ thô phình ra. DocPruner (2026) mang cắt tỉa 50% không mất độ chính xác đo được. Bạn sẽ lập chỉ mục 10k trang, đo nDCG@5 ViDoRe v3, phục vụ câu trả lời dưới 2s và so trực tiếp với đường cơ sở OCR-rồi-văn-bản.

## Concept

Tương tác muộn nghĩa là mỗi token truy vấn chấm với mỗi token patch, rồi cộng điểm tối đa mỗi token truy vấn. Bạn có khớp chi tiết không cần một vector gộp. Chỉ mục đa vector (Vespa, Qdrant multi-vector hoặc AstraDB) lưu embedding theo patch và chạy MaxSim lúc truy xuất.

Bộ trả lời là mô hình thị giác-ngôn ngữ nhận truy vấn cộng top-k trang truy xuất dưới dạng ảnh và viết câu trả lời có vùng bằng chứng (hộp bao hoặc tham chiếu trang). Qwen3-VL-30B, Gemini 2.5 Pro và InternVL3 là lựa chọn tiên tiến hàng đầu 2026. Với phương trình và ký hiệu khoa học, dự phòng OCR (Nougat, dots.ocr) được ghép như kênh văn bản tùy chọn.

Đánh giá là ma trận hai chiều. Một trục: loại nội dung (đoạn văn thuần, bảng dày, biểu đồ cột/đường, ghi chú viết tay, phương trình). Trục kia: cách truy xuất (tương tác muộn ưu tiên thị giác so với OCR-rồi-văn-bản so với lai). Mỗi ô có nDCG@5 và độ chính xác câu trả lời. Báo cáo là sản phẩm bàn giao.

## Architecture

```
PDFs -> page renderer (PyMuPDF, 180 DPI)
           |
           v
  ColQwen2.5-v0.2 embed (multi-vector per page, ~2048 patches)
           |
           +------> DocPruner 50% compression
           |
           v
   multi-vector index (Vespa or Qdrant multi-vector)
           |
query ----+----> retrieve top-k pages (MaxSim)
           |
           v
  VLM answerer: Qwen3-VL-30B | Gemini 2.5 Pro | InternVL3
    inputs: query + top-k page images + optional OCR text
           |
           v
  answer with cited page numbers + evidence regions
           |
           v
  Streamlit / Next.js viewer: highlighted boxes on source page
```

## Stack

- Render trang: PyMuPDF (fitz) ở 180 DPI, chuẩn hóa hướng dọc
- Mô hình tương tác muộn: ColQwen2.5-v0.2 hoặc ColQwen3-omni (nhóm vidore trên Hugging Face)
- Chỉ mục: Vespa với trường đa vector, hoặc Qdrant multi-vector, hoặc AstraDB với MaxSim
- Cắt tỉa: chính sách DocPruner 2026 (giữ patch phương sai cao, nén 50% ở mất độ chính xác < 0.5%)
- Dự phòng OCR (phương trình / bảng dày): dots.ocr hoặc Nougat
- VLM trả lời: Qwen3-VL-30B tự lưu trữ hoặc Gemini 2.5 Pro được lưu trữ; InternVL3 dự phòng
- Đánh giá: phép đo chuẩn ViDoRe v3, M3DocVQA cho suy luận nhiều trang
- UI trình xem: Next.js 15 với lớp phủ canvas cho vùng bằng chứng

```figure
ce-late-interaction
```

## Build It

1. **Thu nạp.** Duyệt corpus 10k trang PDF gồm 10-K, bài báo khoa học và tài liệu quét. Render mỗi trang thành PNG 1536x2048. Lưu bền `{doc_id, page_num, image_path}`.

2. **Tạo embedding.** Chạy ColQwen2.5-v0.2 trên từng ảnh trang. Hình dạng đầu ra ~2048 embedding patch chiều 128. Áp dụng DocPruner giữ nửa tín hiệu cao nhất. Ghi vào trường đa vector Vespa hoặc Qdrant multi-vector.

3. **Truy vấn.** Với mỗi truy vấn đến, tạo embedding bằng tháp truy vấn (embedding cấp token). Chạy MaxSim với chỉ mục: mỗi token truy vấn, lấy tích vô hướng tối đa trên embedding patch trang, cộng. Trả top-k trang.

4. **Tổng hợp.** Gọi Qwen3-VL-30B với truy vấn và ảnh top-5 trang. Prompt: "Trả lời chỉ bằng trang được cung cấp. Trích mỗi khẳng định bằng (doc_id, page) và nêu vùng (hình, bảng, đoạn)."

5. **Vùng bằng chứng.** Hậu xử lý câu trả lời để trích vùng được dẫn. Nếu VLM xuất hộp bao (Qwen3-VL có), render thành lớp phủ trong trình xem.

6. **Dự phòng OCR.** Với trang xác định dày phương trình (heuristic trên phương sai ảnh), chạy Nougat hoặc dots.ocr và truyền văn bản OCR làm kênh thêm cùng ảnh.

7. **Đánh giá.** Chạy ViDoRe v3 (nDCG@5 truy xuất) và M3DocVQA (độ chính xác QA nhiều trang). Cũng chạy pipeline OCR-rồi-văn-bản trên cùng corpus với cùng bộ tổng hợp. Tạo ma trận loại-nội-dung × cách-tiếp-cận.

8. **UI.** Nguyên mẫu Streamlit trước; trình xem sản xuất Next.js 15 với lớp phủ vùng bằng chứng từng trang.

## Use It

```
$ doc-qa ask "what was the 2024 operating margin change for segment EMEA?"
[retrieve]   top-5 pages in 320ms (ColQwen2.5, MaxSim, Vespa)
[synth]      qwen3-vl-30b, 1.4s, cited (form-10k-2024, p. 88) + (..., p. 92)
answer:
  EMEA operating margin moved from 18.2% to 16.8%, a 140bp decline.
  cited: 10-K-2024.pdf p.88 (Table 4, Segment Operating Margin)
         10-K-2024.pdf p.92 (MD&A, Operating Performance)
[viewer]     open with highlighted bounding boxes overlaid on p.88 Table 4
```

## Ship It

`outputs/skill-doc-qa.md` mô tả sản phẩm bàn giao: hệ thống QA tài liệu đa phương thức ưu tiên thị giác chỉnh cho corpus cụ thể và đánh giá so đường cơ sở OCR-rồi-văn-bản trên ViDoRe v3.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Độ chính xác ViDoRe v3 / M3DocVQA | Số phép đo chuẩn so với đường cơ sở OCR-văn bản và bảng xếp hạng công bố |
| 20 | Căn cứ vùng bằng chứng | Tỷ phần vùng được trích thực sự chứa khoảng câu trả lời |
| 20 | Kỹ thuật lưu trữ và độ trễ | Tỷ lệ nén DocPruner, p95 chỉ mục, p95 câu trả lời |
| 20 | Suy luận nhiều trang | Độ chính xác trên tập nhiều trang 100 câu hỏi gắn nhãn tay |
| 15 | UX xem nguồn | Độ rõ trình xem, độ trung thực lớp phủ, công cụ so sánh cạnh nhau |
| **100** | | |

## Exercises

1. Đo ColQwen2.5-v0.2 so ColQwen3-omni trên cùng corpus. Trang nào một bên đúng còn bên kia bỏ sót? Thêm thẻ "content class" vào chỉ mục để định tuyến theo loại.

2. Cắt tỉa embedding mạnh (75%, 90%). Tìm vách nén: điểm nDCG@5 ViDoRe giảm dưới đường cơ sở OCR.

3. Xây dạng lai: chạy OCR-rồi-văn-bản và ColQwen song song, hợp bằng RRF, xếp lại bằng cross-encoder. Dạng lai có thắng mỗi loại riêng không? Giúp nhiều nhất ở đâu?

4. Đổi Qwen3-VL-30B sang VLM nhỏ hơn (Qwen2.5-VL-7B). Đo đường cong độ chính xác-mỗi-đô-la.

5. Thêm hỗ trợ ghi chú viết tay. Render corpus viết tay, tạo embedding bằng ColQwen, đo truy xuất. So với pipeline OCR chữ viết tay.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Late interaction (Tương tác muộn) | "Truy xuất kiểu ColPali" | Token truy vấn chấm độc lập với patch trang; MaxSim tổng hợp |
| Multi-vector (Đa vector) | "Embedding theo patch" | Mỗi tài liệu có nhiều vector, không phải một vector gộp |
| MaxSim | "Chấm tương tác muộn" | Mỗi token truy vấn, lấy tương đồng tối đa trên vector tài liệu; cộng |
| DocPruner | "Nén patch" | Cắt tỉa 2026 giữ 50% patch với mất độ chính xác không đáng kể |
| ViDoRe v3 | "Phép đo chuẩn truy xuất tài liệu" | Tiêu chuẩn 2026 đo truy xuất tài liệu thị giác |
| Evidence region (Vùng bằng chứng) | "Hộp bao trích dẫn" | Bbox trên trang nguồn định vị khoảng câu trả lời |
| OCR fallback (Dự phòng OCR) | "Kênh phương trình" | Pipeline văn bản dùng cùng thị giác cho trang nặng phương trình hoặc bảng |

## Further Reading

- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) — truy xuất tài liệu tương tác muộn tham chiếu
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) — bài phương pháp nền tảng
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) — checkpoint sẵn sàng sản xuất
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) — đường cơ sở RAG đa phương thức nhiều trang
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) — ngăn xếp phục vụ tham chiếu
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) — chỉ mục thay thế
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) — chỉ mục được quản lý thay thế
- [Nougat OCR](https://github.com/facebookresearch/nougat) — dự phòng OCR có khả năng phương trình
