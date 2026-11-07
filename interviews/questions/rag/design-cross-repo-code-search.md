---
id: design-cross-repo-code-search
title: Design code search across ten repositories that stays fresh
card: rag
kind: design
level: 4
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer]
rounds: [system-design]
tags: [code-search, ast-chunking, symbol-graph, incremental-index, citations]
minutes: 30
lessons: [phases/19-capstone-projects/02-rag-over-codebase, phases/11-llm-engineering/07-advanced-rag]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/design-rag-over-company-docs, rag/hyde-invents-a-symbol]
updated: 2026-11-03
---

Thiết kế một dịch vụ tìm kiếm mã trả lời các câu hỏi như "ngân sách thử lại upload được thực thi như thế nào" trên 10 repository với khoảng 2M dòng mã, và giữ cập nhật trên mỗi lần push. Điều gì khác với truy xuất tài liệu, và nó hỏng ở đâu?

## Short answer

Chia chunk tại các nút cây cú pháp, hàm và lớp, không phải tại các cửa sổ cố định, và cho mỗi chunk ba dạng có thể truy xuất: một embedding mã dense, các thuật ngữ BM25 với tên symbol có trọng số cao hơn phần thân, và một bản tóm tắt ngôn ngữ tự nhiên một câu. Truy xuất lai, xếp hạng lại bằng một cross-encoder, và tổng hợp với các trích dẫn file và dòng bắt buộc mà một bộ lọc sau thực thi. Độ tươi là phần khó: một lần push kích hoạt một diff ở cấp symbol để chỉ các chunk thay đổi được nhúng lại và chỉ các cạnh liên file bị ảnh hưởng được tính lại.

## Full answer

### Why fixed windows fail on code

Một cửa sổ cố định cắt đôi một định danh và tách thân hàm khỏi chữ ký của nó. Capstone parse mỗi file bằng một parser cây cú pháp, trích xuất các nút hàm và lớp, và phát ra một chunk mỗi nút với repository, đường dẫn, dòng bắt đầu, dòng kết thúc, symbol và phần thân của nó. Ranh giới chunk là đơn vị mà người dùng muốn được trích dẫn.

### Three representations per chunk

| Dạng | Bắt được |
|---|---|
| Embedding dense của mã | các câu hỏi diễn đạt lại về hành vi |
| BM25 với trọng số trường, tên symbol 4, tóm tắt 2, phần thân 1 | các tên symbol nguyên văn và "tìm hàm tên X" |
| Một bản tóm tắt một câu từ một mô hình nhỏ được cache | một người dùng nói "được ủy quyền" khi mã nói `check_permission` |

Người dùng hỏi bằng tiếng Anh về mã dùng những từ khác. Bản tóm tắt thêm phương thức mà cả embedding mã lẫn chỉ mục từ vựng đều không bao phủ.

### The symbol graph

Ghi các cạnh cho import, lời gọi và kế thừa qua các file và repository. Ở thời điểm truy vấn, mở rộng truy xuất theo các cạnh để một câu hỏi đi qua bốn repository vẫn tìm thấy chuỗi từ bên gọi đến cấu hình ngân sách.

### The query path

Truy xuất dense và BM25 song song, khử trùng lặp theo repository, đường dẫn và symbol, xếp hạng lại top 50 và giữ top 10, tổng hợp với một system prompt được cache, và yêu cầu một điểm neo repository, đường dẫn và khoảng dòng trên mọi khẳng định. Một khẳng định không có điểm neo bị đánh dấu để hỏi lại hoặc bị bỏ.

### Incremental freshness

Một lần push kích hoạt một diff của các file thay đổi và các symbol thay đổi. Chỉ các chunk có văn bản thay đổi được nhúng lại. Các cạnh liên file của các chunk thay đổi được tính lại, bao gồm import, lời gọi và kế thừa, nên một lời gọi hoặc lớp cơ sở thay đổi không để lại một cạnh lỗi thời. Một file hoặc symbol bị xóa loại các chunk của nó khỏi các chỉ mục dense và từ vựng và các cạnh của nó khỏi đồ thị, nên tìm kiếm không thể trả về nó sau lần push. Mục tiêu của capstone là một lần push 50 file có thể tìm kiếm trong dưới 60 giây trên tập repository 2M dòng.

### Evaluation

Gán nhãn 100 câu hỏi liên repository với các đáp án file và dòng chuẩn. Đo MRR ở 10, nDCG ở 10, độ trung thực trích dẫn là tỷ lệ khẳng định có một điểm neo xác minh được, và độ trễ p50 và p99. Chạy lại tập hàng tuần và cảnh báo khi MRR ở 10 giảm trên 5 phần trăm.

### Where it breaks

- **Mã được sinh.** Mã khuôn mẫu từ các bộ sinh mã đầu độc truy xuất bằng các bản gần trùng lặp; đánh dấu các chunk được sinh trong payload và giảm trọng số của chúng. Capstone đưa vào 20 phần trăm mã được sinh để cho thấy tác động.
- **Trùng lặp monorepo.** Mã tiện ích lặp lại phân tán tín hiệu từ vựng qua các bản sao; khử trùng lặp theo symbol.
- **Đuôi dài.** Các symbol hiếm khi được import có embedding yếu; phía từ vựng và bản tóm tắt gánh chúng.
- **Một lần push lớn.** Một commit chạm lại một nửa các file là nơi đường gia tăng được kiểm thử; đo thời gian từ push tới có thể tìm kiếm, không chỉ trung bình.

## Follow-ups

- **Level 3:** Tại sao ba dạng cho mỗi chunk mà không phải một embedding tốt? Expected: người dùng hỏi một thứ được ủy quyền như thế nào trong khi mã nói `check_permission`; bản tóm tắt nối một khoảng cách từ vựng mà cả embedding mã lẫn BM25 đều không bao phủ.
- **Level 3:** Đồ thị symbol mang lại gì ở thời điểm truy vấn? Expected: mở rộng qua các ranh giới repository, từ một hàm tới các bên gọi và import của nó, để một câu hỏi trải qua nhiều repository tìm thấy toàn bộ chuỗi.
- **Level 4:** Mã khuôn mẫu được sinh đi vào kho ngữ liệu. Điều gì xảy ra và bạn làm gì? Expected: mã gần trùng lặp đầu độc truy xuất; đánh dấu các chunk được sinh trong payload và giảm trọng số của chúng.
- **Level 4:** Mục tiêu độ tươi là gì và bạn giữ nó bằng cách nào? Expected: một lần push 50 file có thể tìm kiếm trong dưới 60 giây trên tập repository 2M dòng, bằng cách chỉ nhúng lại các chunk thay đổi và chỉ tính lại các cạnh bị ảnh hưởng.

## Wrong answers

- "Chia mã mỗi 512 token như văn xuôi." Các cửa sổ cố định cắt đôi định danh và tách một hàm khỏi chữ ký của nó; cắt tại các nút cây cú pháp.
- "Lập chỉ mục lại toàn bộ tập repository trên mỗi lần push." Hai triệu dòng mỗi commit không bao giờ theo kịp; diff ở cấp symbol.
- "Trích dẫn là tùy chọn cho câu trả lời về mã." Capstone từ chối mọi khẳng định không có một điểm neo file và dòng; bộ lọc sau bỏ hoặc hỏi lại.

## Taught in

Capstone [RAG trên codebase](../../../phases/19-capstone-projects/02-rag-over-codebase/) đặt ra các chunk nhận biết cú pháp, ba dạng, đồ thị symbol, lập chỉ mục lại gia tăng và đánh giá, và bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) cung cấp tìm kiếm lai và xếp hạng lại.
