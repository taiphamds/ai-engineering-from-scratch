---
name: evidence-ledger
description: Ghi các phát hiện phân tích binary dưới dạng bằng chứng observed, derived hoặc inferred với các id hash nội dung, và từ chối nêu một kết quả không có một lần chạy observed.
version: 1.0.0
phase: 13
lesson: 35
tags: [reverse-engineering, evidence, confidence, unknowns, ghidra, rea]
---

Với một chương trình bạn tự biên dịch và một tập câu hỏi về nó, giữ một sổ các bản ghi bằng chứng và một danh sách các điều chưa biết còn lại. Mỗi câu trong báo cáo cuối trích một id bằng chứng. Sử dụng skill này với Claude, Cursor, Codex, OpenClaw, Hermes hoặc bất kỳ agent nào đọc SKILL.md.

## Required inputs

- Tệp mục tiêu, SHA-256 của nó, định dạng và kiến trúc của nó.
- Provider cho mỗi quan sát: một tên công cụ và phiên bản, hoặc nhà phân tích.
- Analysis profile của mỗi lần chạy provider, bao gồm mọi chuỗi phiên bản hợp đồng.
- Các câu hỏi cần trả lời, mỗi câu với thẩm quyền và độ tin cậy sẽ giải quyết nó.
- Một compiler host và một chương trình kiểm tra khi các câu hỏi về hành vi.
- Sự cho phép bao phủ mục tiêu. Chỉ phân tích các chương trình bạn sở hữu hoặc có quyền bằng văn bản để phân tích.

## Procedure

1. Hash mục tiêu. Đặt digest, định dạng và kiến trúc trong mọi subject. Giữ tên và đường dẫn ngoài danh tính.
2. Cho mọi bản ghi một độ tin cậy. `observed` nghĩa là đọc từ byte hoặc từ một lần chạy. `derived` nghĩa là được tính từ các bản ghi observed. `inferred` nghĩa là một kỳ vọng.
3. Cho mọi bản ghi một thẩm quyền. `shipped-artifact` nghĩa là một lần đọc tệp. `controlled-replay` nghĩa là một lần chạy bạn kiểm soát. `analyst-inference` nghĩa là phán đoán của riêng bạn.
4. Tính `evidence_id` là `ev_` cộng SHA-256 trên JSON chính tắc (RFC 8785) của bản ghi. Bỏ id, tên và đường dẫn.
5. Ghi các giới hạn provider nguyên văn. Thêm giới hạn của riêng bạn khi một lần chạy sử dụng một bản build khác với tệp đang phân tích.
6. Liên kết mọi bản ghi derived và inferred đến các bản ghi mà nó dựa vào qua `evidence_links`.
7. Mở một điều chưa biết mỗi câu hỏi. Lưu câu hỏi, scope digest, mức nghiêm trọng, độ tin cậy được yêu cầu, thẩm quyền được yêu cầu và một thăm dò được khuyến nghị.
8. Làm mọi thay đổi với một điều chưa biết thành một revision mới nêu tên digest của revision trước nó. Từ chối một thay đổi có revision kỳ vọng đã cũ.
9. Chỉ kiểm tra một khẳng định hành vi với các bản ghi chạy observed nêu tên cùng hàm và đối số. Đếm các đầu vào có một lần chạy.
10. Báo cáo `pass` khi mọi đầu vào có một lần chạy đồng nhất. Báo cáo `fail` khi bất kỳ lần chạy nào bất đồng. Báo cáo `unknown` khi một số đầu vào không có lần chạy. Báo cáo `unsupported` khi không đầu vào nào có.
11. Chỉ giải quyết một điều chưa biết bằng các id bằng chứng có độ tin cậy và thẩm quyền được yêu cầu. Một câu không đóng một điều chưa biết.
12. Cache các câu trả lời provider dưới một khóa bao phủ mục tiêu, provider, digest profile, thao tác và các tham số. Từ chối một snapshot có digest profile hoặc phiên bản định dạng khác.

## Required ledger

Với mọi khẳng định, báo cáo:

- văn bản khẳng định và hàm cùng đối số mà nó bao phủ
- id bản ghi dự đoán và các bản ghi derived mà nó dựa vào
- các đầu vào có lần chạy observed, trên các đầu vào mà khẳng định bao phủ
- các id bằng chứng hỗ trợ và mâu thuẫn
- các giới hạn được mang theo từ các bản ghi hỗ trợ
- trạng thái: `pass`, `fail`, `unknown` hoặc `unsupported`
- id điều chưa biết, trạng thái hiện tại và revision của nó

Với mọi điều chưa biết, báo cáo câu hỏi, mức nghiêm trọng, thẩm quyền được yêu cầu, trạng thái hiện tại và số revision.

## Hard rejects

- Một kết quả được nêu từ mã giả hoặc một danh sách disassembly không có lần chạy observed.
- Một `pass` cho một khẳng định có các đầu vào chỉ được các lần chạy bao phủ một phần.
- Một `fail` hoặc một `pass` được viết từ một danh sách rỗng. Một danh sách rỗng là `unknown`.
- Một id bằng chứng được tính trên đường dẫn cục bộ hoặc tên tệp.
- Một bản ghi có analysis profile nêu tên một provider khác với bản ghi.
- Một điều chưa biết được giải quyết bằng bằng chứng derived hoặc inferred, hoặc không có id bằng chứng.
- Một điều chưa biết được thay đổi không có số revision hiện tại.
- Một snapshot được phát lại sau khi một chuỗi phiên bản hợp đồng thay đổi.
- Một bản ghi bỏ một giới hạn provider.
- Một bản ghi chạy che giấu sự kiện rằng nó thực thi một bản build khác của cùng nguồn.
- Một khẳng định gọi phân tích tĩnh là một quan sát thực thi.

## Produce

Trả về những phần này:

1. Mục tiêu: digest, định dạng, kiến trúc, lệnh build và sự cho phép.
2. Bằng chứng: mọi bản ghi với id, độ tin cậy, thẩm quyền, thao tác và giới hạn.
3. Khẳng định: sổ được yêu cầu ở trên, một hàng mỗi khẳng định.
4. Điều chưa biết: mở, đang điều tra, bị chặn, bị mâu thuẫn và đã giải quyết, mỗi điều với chuỗi revision của nó.
5. Cache: các trường khóa snapshot, các mục được tái sử dụng và mọi lần import bị từ chối với lý do của nó.
6. Hoàn thành: id `ecl_`, số đếm theo trạng thái và liệu mọi khẳng định đã qua hay chưa.

Kết thúc bằng điều chưa biết đầu tiên vẫn chặn một câu trả lời đầy đủ, và thăm dò sẽ đóng nó.
