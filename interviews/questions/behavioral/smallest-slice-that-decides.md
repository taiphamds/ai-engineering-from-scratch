---
id: smallest-slice-that-decides
title: Define the first slice so it can change the decision
card: behavioral
kind: design
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, agentic-ai-engineer]
rounds: [behavioral]
tags: [mvp, slicing, stop-rule, product-judgment]
minutes: 10
lessons: [phases/14-agent-engineering/50-choose-the-smallest-testable-slice]
manuals: []
practice: []
cheatsheet: [product-discovery]
related: [behavioral/riskiest-assumption-first, behavioral/prototype-became-production]
updated: 2026-11-03
---

Nhóm của bạn thống nhất phát hành một phiên bản khả dụng tối thiểu của một trợ lý mới. Có ba đề xuất đang được xem xét: một giao diện trau chuốt trên dữ liệu tổng hợp, một pipeline dữ liệu hoạt động được nhưng không có giao diện, và một lần phát lại chỉ đọc trên mười sự cố thực tế. Bạn ủng hộ đề xuất nào, và bạn biện minh cho lựa chọn đó như thế nào?

## Short answer

Tôi ủng hộ lần phát lại trên các sự cố thực tế. Nhỏ chỉ hữu ích khi lát cắt chứng minh được điều gì đó quan trọng, vì vậy trước tiên tôi viết tập hợp bằng chứng cần có từ các giả định chưa được giải quyết có rủi ro cao nhất và loại bỏ mọi ứng viên không bao phủ nó. Trang trau chuốt trên dữ liệu giả và pipeline không có người dùng đều loại bỏ chính sự không chắc chắn mà nhóm cần kiểm chứng.

## Full answer

### Vertical means evidence end to end

Một lát cắt hữu ích đi qua quy trình làm việc thực tế tối thiểu cần thiết để quan sát một kết quả. Nó có thể hẹp về người dùng, dữ liệu, thời lượng và khả năng. Nó không được hẹp bằng cách cắt bỏ sự không chắc chắn đang được kiểm chứng. Lần phát lại qua mười sự cố thực tế kiểm chứng việc xác định dịch vụ và sự tin tưởng của người vận hành cùng lúc. Một trang trau chuốt trên dữ liệu giả có thể kiểm chứng mức độ hiểu nhưng không kiểm chứng tính khả thi của dữ liệu. Một hệ thống tự động khắc phục trên production sẽ kiểm chứng mọi thứ cùng lúc với hậu quả không thể chấp nhận.

### Required proof comes before scoring

Tôi lấy các giả định chưa được giải quyết có rủi ro cao nhất và biến chúng thành một tập hợp bằng chứng. Một ứng viên chỉ đủ điều kiện nếu bao phủ tập hợp đó. Trong số các ứng viên đủ điều kiện tôi so sánh giá trị kết quả, sự không chắc chắn được giảm bớt, công sức, hậu quả và khả năng đảo ngược. Cổng xét điều kiện quan trọng hơn phép tính. Một ứng viên rẻ hơn chứng minh được một giả định bắt buộc vẫn không đủ điều kiện dù có điểm cao.

### False minimums I name in the room

- Mức tối thiểu chỉ có giao diện loại bỏ sự không chắc chắn về dữ liệu và vận hành.
- Mức tối thiểu chỉ có hạ tầng chứng minh khả năng thực hiện mà không có giá trị cho người dùng.
- Mức tối thiểu chỉ có luồng thuận lợi bỏ qua ngoại lệ tạo ra phần lớn rủi ro.
- Mức tối thiểu là demo tạo ra một sản phẩm thuyết phục nhưng không có phép đo lặp lại được.
- Mức tối thiểu là nền tảng xây dựng bộ máy tái sử dụng được trước khi một quy trình làm việc chứng tỏ xứng đáng có nó.

### The stop rule

Trước khi bất kỳ ai xây dựng, tôi viết điều gì xảy ra nếu lát cắt thất bại: từ bỏ kết quả, thay đổi người dùng mục tiêu, kiểm chứng một cơ chế khác, thu thập bằng chứng tốt hơn, hoặc thu hẹp thẩm quyền hơn nữa. Nếu mọi kết quả có thể xảy ra đều dẫn đến "tiếp tục xây dựng", lát cắt không phải là một thử nghiệm.

## Follow-ups

- **Level 2:** Lần phát lại thất bại. Nêu hai bước tiếp theo hợp lệ. Expected: thay đổi người dùng hoặc tình huống mục tiêu, hoặc kiểm chứng một cơ chế khác; cả hai đã được viết trong quy tắc dừng trước khi xây dựng.
- **Level 2:** Tại sao một lần phát lại tốt hơn một pilot trực tiếp ở đây? Expected: nó tạo ra bằng chứng có thể đảo ngược về sự tin tưởng và việc xác định mà không để người dùng thật tiếp xúc với một hệ thống chưa ai đo lường.
- **Level 3:** Một thành phần tái sử dụng được sẽ đẩy nhanh cả ba đề xuất. Khi nào nó được xây dựng? Expected: sau khi lát cắt đã tạo ra bằng chứng mang tính quyết định; xây dựng bộ máy nền tảng trước là mức tối thiểu là nền tảng.
- **Level 3:** Bạn giữ cho lần phát lại không trở thành một bản demo như thế nào? Expected: một phép đo lặp lại được với một ngưỡng được quyết định trước, không phải một lượt trình bày thuyết phục.

## Wrong answers

- "Thứ được xây dựng nhỏ nhất là thứ có ít tính năng nhất." Mức độ nhỏ được đo bằng bằng chứng thu được, không phải bằng số lượng tính năng.
- "Xây dựng giao diện trước để các bên liên quan có thể thấy tiến độ." Một sản phẩm thuyết phục không có phép đo là mức tối thiểu là demo.
- "Nếu lát cắt thất bại chúng ta lặp lại." Không có quy tắc dừng được viết ra, mọi kết quả đều dẫn đến xây dựng thêm và không có gì được kiểm chứng.

## Taught in

[Bài học lát cắt nhỏ nhất](../../../phases/14-agent-engineering/50-choose-the-smallest-testable-slice/) đưa ra cổng bằng chứng bắt buộc, các mức tối thiểu giả và quy tắc dừng.
