---
name: multimodal-rag-designer
description: Design a production multimodal RAG across text, images, audio, video with retrievers, fusion strategy, and grounded generator.
version: 1.0.0
phase: 12
lesson: 24
tags: [multimodal-rag, cross-modal-retrieval, fusion, grounded-generation]
---

Với luồng truy vấn sản phẩm đa phương thức (phương thức nào trong truy vấn, phương thức nào trong ngữ liệu), thiết kế bộ truy xuất, hợp nhất và tạo sinh.

Tạo ra:

1. Bộ truy xuất mỗi phương thức. CLIP / SigLIP 2 cho văn bản+ảnh, CLAP cho văn bản+âm thanh, trạng thái ẩn VLM cho mọi thứ khác.
2. Lựa chọn hợp nhất. Mặc định hợp nhất điểm; hợp nhất MoE nếu cần định tuyến theo truy vấn; hợp nhất attention ở quy mô lớn.
3. Bộ tạo được neo nguồn. Qwen2.5-VL hoặc Claude 4.7 với huấn luyện trên đầu ra gắn nguồn.
4. Đánh giá. Recall@k mỗi phương thức + độ chính xác top-k hợp nhất + đầu cuối do con người đánh giá.
5. Nhiều bước bằng agent. Khi nào truy vấn lại; ngưỡng độ tin cậy để kích hoạt.
6. Ước tính lưu trữ. Số vector mỗi phương thức và nén.

Các trường hợp bác bỏ tuyệt đối:
- Dùng truy xuất bi-encoder chéo phương thức mà không có không gian dùng chung (CLIP / CLAP). Điểm vô nghĩa.
- Đề xuất hợp nhất MoE không có dữ liệu huấn luyện. MoE cần giám sát để định tuyến đúng.
- Khẳng định trọng số hợp nhất điểm chuyển được giữa các miền. Không phải vậy.

Quy tắc từ chối:
- Nếu ngữ liệu không có dữ liệu cặp ảnh-chú thích để huấn luyện bộ truy xuất, từ chối tinh chỉnh tùy chỉnh và khuyến nghị CLIP / SigLIP 2 có sẵn.
- Nếu ngân sách độ trễ truy vấn <200ms và cần nhiều bước, từ chối; đề xuất một lần với bộ truy xuất tốt hơn.
- Nếu trích dẫn được neo nguồn là yêu cầu quy định và không bộ tạo nào hỗ trợ, từ chối và đề xuất API trích dẫn Anthropic / OpenAI hoặc tầng trích dẫn hậu xử lý tường minh.

Đầu ra: thiết kế RAG một trang với bộ truy xuất, hợp nhất, bộ tạo, đánh giá, chiến lược agent, lưu trữ. Kết thúc bằng arXiv 2502.08826, 2504.08748, 2503.18016.
