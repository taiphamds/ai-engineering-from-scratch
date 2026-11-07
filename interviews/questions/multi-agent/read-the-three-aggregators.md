---
id: read-the-three-aggregators
title: Read the vote aggregators and find the blind spot
card: multi-agent
kind: code-reading
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, debugging]
tags: [consensus, plurality, semantic-clustering, code-reading, monoculture]
minutes: 12
lessons: [phases/16-multi-agent-and-swarms/14-consensus-and-bft, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard]
manuals: []
practice: []
cheatsheet: [multi-agent]
related: [multi-agent/three-copies-of-one-model-voted]
updated: 2026-11-03
---

Đọc việc phân cụm và bộ tổng hợp đa số tương đối từ bài học đồng thuận. Năm agent bỏ phiếu về một tỷ lệ phần trăm từ một nghiên cứu. Ba agent chia sẻ một mô hình nền trả lời `42%`, và hai agent trả lời `4.2%`. Mỗi agent trong hai agent tự tin hơn bất kỳ agent nào trong ba agent, nhưng ba agent vẫn mang tổng độ tự tin lớn hơn. Nói đa số tương đối trả về gì, bộ tổng hợp đặt trọng số mỗi phiếu theo độ tự tin của nó trả về gì, và việc chuẩn hóa làm gì với câu trả lời `4.2 percent`.

```python
@dataclass
class Vote:
    agent: str
    answer: str
    confidence: float

    def canonical(self) -> str:
        return "".join(c for c in self.answer.lower().strip() if c.isalnum() or c == "." or c == "%")


def plurality(votes: list[Vote]) -> tuple[str, dict[str, int]]:
    counts: dict[str, int] = {}
    rep: dict[str, str] = {}
    for v in votes:
        key = v.canonical()
        counts[key] = counts.get(key, 0) + 1
        rep.setdefault(key, v.answer)
    winner_key = max(counts, key=counts.get)
    return rep[winner_key], counts
```

## Short answer

Đa số tương đối đếm ba phiếu cho `42%` và hai cho `4.2%` và trả về đáp án sai, vì nó đếm đầu người và cụm sai có nhiều đầu người hơn. Bộ tổng hợp có trọng số độ tự tin lấy tổng độ tự tin mỗi cụm và so sánh tỷ phần cụm đứng đầu với một ngưỡng. Cụm sai có tổng lớn hơn, nên với ngưỡng 0.5 nó cũng trả về `42%`, và với một ngưỡng cao hơn nó có thể trả về không có bên thắng. Việc chuẩn hóa giữ các chữ cái, chữ số, dấu chấm và dấu phần trăm, nên `4.2 percent` thành `4.2percent` và rơi vào một cụm khác với `4.2%`, chia tách các phiếu của đáp án đúng.

## Full answer

### What the code does

`canonical` chuyển câu trả lời thành chữ thường, loại khoảng trắng hai đầu, và giữ chữ và số, dấu chấm và dấu phần trăm. Đó là phân cụm ngữ nghĩa sơ bộ của bài học. `plurality` xây một số đếm mỗi khóa chuẩn hóa, giữ câu trả lời gốc đầu tiên mỗi khóa làm đại diện, và trả về khóa có nhiều phiếu nhất.

### The monoculture case

| Bộ tổng hợp | Quy tắc | Kết quả ở đây |
|---|---|---|
| Đa số tương đối | Nhiều phiếu nhất | Sai, vì ba phiếu tương quan thắng hai |
| Có trọng số độ tự tin | Tổng độ tự tin mỗi cụm, cụm đứng đầu phải vượt một tỷ phần ngưỡng | Sai, vì ba phiếu mang tổng độ tự tin lớn hơn, hoặc không có khi tỷ phần dưới ngưỡng |
| Kiểu trung vị hình học | Chấm mỗi cụm theo kích thước và độ chặt của các độ tự tin | Sai, vì cụm ba lớn hơn và các độ tự tin của nó cũng chặt |

Điều rút ra của chính bài học là giới hạn: không bộ tổng hợp nào giải quyết một cụm sai vừa lớn hơn vừa tự tin hơn cụm đúng. Trường hợp đó cần sự đa dạng mô hình hoặc xác minh, không phải một phiếu bầu tốt hơn.

### The canonicalization blind spot

Hai agent có cùng ý nghĩa giá trị có thể rơi vào hai cụm. `4.2%` và `4.2 percent` khác nhau sau chuẩn hóa, và `four point two percent` cũng vậy. Mỗi lần chia tách trong cụm đúng giúp cụm sai. Trong production, chuẩn hóa các số với đơn vị của chúng thành một dạng, hoặc phân cụm theo độ tương tự embedding, và giữ khóa chuẩn hóa cạnh câu trả lời gốc trong log để một người đánh giá có thể thấy khi nào một lần chia tách xảy ra.

### Where the two percentages come from

Các giá trị trong kịch bản là những con số đầu độc bộ nhớ từ bài học bộ nhớ dùng chung: một trang nói 4.2 phần trăm và một agent truy xuất ghi 42 phần trăm. Bài học đồng thuận tái sử dụng chúng để phiếu bầu nằm trên một khẳng định có nguồn đã biết, cũng là điều khiến một bộ xác minh khả thi sau bỏ phiếu.

### What the plurality code cannot see

Nó không biết các agent nào chia sẻ một mô hình nền, không có độ tự tin, không có nguồn. Nó trả về câu trả lời có nhiều phiếu nhất và không kiểm tra liệu các bên bỏ phiếu có độc lập hoặc chính xác. Tính độc lập khiến một đa số đúng có khả năng hơn nhưng không bảo đảm nó, và ba agent của prompt chia sẻ một mô hình nền, nên các lỗi của chúng có tương quan.

## Follow-ups

- **Level 3:** Tại sao `plurality` giữ `rep`? Expected: để nó có thể trả về văn bản câu trả lời gốc cho khóa thắng, vì khóa chuẩn hóa là một dạng so sánh và không phải một câu trả lời để hiển thị.
- **Level 3:** Không cụm nào đạt tỷ phần ngưỡng trong phiếu có trọng số. Kết quả là gì? Expected: không có bên thắng, với các trọng số, nên bên gọi thử lại hoặc chuyển lên thay vì chấp nhận một đa số yếu.
- **Level 4:** Trường hợp xu nịnh: hai agent sao chép câu trả lời đầu chúng thấy với độ tự tin thấp. Bộ tổng hợp nào bắt nó và tại sao? Expected: bộ có trọng số độ tự tin, vì các bên sao chép mang ít trọng số, trong khi đa số tương đối đếm chúng như các phiếu đầy đủ.
- **Level 4:** Bạn sẽ kiểm thử một thay thế cho `canonical` như thế nào? Expected: một bảng các cặp câu trả lời phải vào cùng cụm và các cặp không được, gồm các biến thể đơn vị và các số viết bằng chữ, được chạy như một unit test.

## Wrong answers

- "Đa số tương đối ổn miễn là có ít nhất năm agent." Ba agent trên một mô hình là một đa số ở bất kỳ kích thước nào miễn là chúng trên một nửa, và số đếm không bao giờ thấy tương quan.
- "Việc chuẩn hóa đủ tốt vì nó xử lý chữ hoa thường và dấu cách." Nó tách `4.2%` khỏi `4.2 percent`, và mỗi lần chia tách trong cụm đúng là một phiếu cho cụm sai.
- "Độ tự tin cao hơn có nghĩa câu trả lời đúng hơn, nên đặt trọng số theo nó là xong." Đặt trọng số giúp chống sự tuân theo độ tự tin thấp và không làm gì khi cụm sai cũng là cụm tự tin.

## Taught in

[Bài học đồng thuận và chịu lỗi](../../../phases/16-multi-agent-and-swarms/14-consensus-and-bft/) cung cấp các bộ tổng hợp này, và [bài học bộ nhớ dùng chung](../../../phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/) là nguồn của cả hai tỷ lệ phần trăm.
