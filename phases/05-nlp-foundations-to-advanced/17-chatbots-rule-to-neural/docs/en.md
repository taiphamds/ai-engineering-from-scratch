# Chatbots — Rule-Based to Neural to LLM Agents

> ELIZA trả lời bằng khớp mẫu. DialogFlow ánh xạ ý định. GPT trả lời từ trọng số. Claude chạy công cụ và xác minh. Mỗi thời kỳ giải quyết lỗi tệ nhất của thời kỳ trước.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 14 (Information Retrieval)
**Time:** ~75 minutes

## The Problem

Một người dùng nói "Tôi muốn đổi chuyến bay." Hệ thống phải tìm ra họ muốn gì, thông tin nào còn thiếu, làm thế nào lấy nó và làm thế nào hoàn thành hành động. Rồi người dùng nói "chờ đã, nếu thay vào đó tôi hủy thì sao?" và hệ thống phải nhớ ngữ cảnh, chuyển tác vụ và giữ trạng thái.

Hội thoại khó đối với một hệ thống ML. Đầu vào có tính mở. Đầu ra phải mạch lạc qua nhiều lượt. Hệ thống có thể cần tác động lên thế giới (đổi một chuyến bay, tính phí một thẻ). Mọi bước sai đều hiển thị cho người dùng.

Các kiến trúc chatbot đã đi qua bốn mô thức, mỗi mô thức được giới thiệu vì mô thức trước thất bại quá rõ. Bài học này đi qua chúng theo thứ tự. Bức tranh production năm 2026 là sự lai ghép của hai mô thức cuối.

## The Concept

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

### The scripted half-century, 1950-2001

Mô thức đầu không kéo dài năm năm. Nó kéo dài năm mươi năm. Biết quá trình của nó quan trọng vì mọi hệ thống trong đó là cùng một cỗ máy — khớp đầu vào, đưa ra một phản hồi có sẵn, cập nhật một chút trạng thái — và năm mươi năm thêm quy tắc vào cỗ máy đó không bao giờ tạo ra trường hợp tổng quát. Mức trần đó là lý do các mô thức hai đến bốn tồn tại.

**1950.** Turing tránh câu hỏi "máy móc có thể suy nghĩ không?" bằng cách đề xuất một thay thế có tính vận hành: nếu một người thẩm vấn không thể phân biệt máy với người qua máy điện báo, câu hỏi triết học không còn ý nghĩa. Hội thoại trở thành benchmark của lĩnh vực trước khi lĩnh vực có tên.

**1956.** Cái tên xuất hiện — một hội thảo mùa hè tại Dartmouth đặt ra "trí tuệ nhân tạo" dựa trên phỏng đoán rằng mọi đặc điểm của trí thông minh "về nguyên tắc có thể được mô tả chính xác đến mức có thể tạo một cỗ máy mô phỏng nó." Đề xuất dành hai tháng để đạt tiến bộ đáng kể.

**1966.** ELIZA cung cấp thủ thuật phản chiếu mà bạn xây dựng ở Bước 1: các quy tắc phân rã lấy các mảnh từ đầu vào, các quy tắc lắp ghép lặp lại chúng dưới dạng câu hỏi. Tổng cộng khoảng 200 mẫu, không trạng thái, không hiểu biết — và người dùng vẫn tâm sự với nó. Weizenbaum dành phần còn lại của sự nghiệp lo ngại vì chỉ cần ít bộ máy đến thế.

**1972.** PARRY, được xây dựng tại Stanford để mô hình hóa chứng hoang tưởng, thêm phần ELIZA thiếu: trạng thái nội tại. Các biến số cho sợ hãi, giận dữ và nghi ngờ cập nhật ở mỗi lượt và kiểm soát kịch bản nào được kích hoạt tiếp, nên các đầu vào giống nhau tạo các phản hồi khác nhau tùy cuộc hội thoại đến lúc đó. Trong một kiểm thử bản ghi được làm mù, các bác sĩ tâm thần phân biệt PARRY với bệnh nhân người ở mức ngẫu nhiên. Nó là tổ tiên trực tiếp của điều kiện hóa nhân cách — một system prompt được triển khai bằng ba số float. Cùng năm đó, hai bot được hướng vào nhau qua ARPANET: một kịch bản nhà trị liệu phỏng vấn một máy trạng thái hoang tưởng, cuộc hội thoại bot-với-bot đầu tiên trên một mạng.

**1995.** ALICE mở rộng công thức ELIZA bằng AIML, một phương ngữ XML cho các cặp mẫu-khuôn. Khoảng 40,000 danh mục viết tay, ba lần thắng Loebner Prize. Nó chứng minh quy luật mở rộng của các hệ thống dựa trên quy tắc: nhiều quy tắc hơn mua được độ bao phủ, không bao giờ là tính tổng quát. Mỗi quy tắc là một gánh nặng ai đó phải bảo trì.

**2001.** SmarterChild đưa công thức đến trước 30 triệu người dùng nhắn tin tức thời và thêm các tra cứu backend — thời tiết, cổ phiếu, giờ chiếu phim — được ghép vào các khuôn. Nheo mắt nhìn và nó là gọi công cụ trong trang phục năm 2001: phân tích ý định, gọi một dịch vụ, kết xuất kết quả vào lời đáp.

Năm mươi năm, một cơ chế, số quy tắc tăng. Mô thức kết thúc không phải vì ai đó bác bỏ nó mà vì chi phí bảo trì các máy trạng thái viết tay tăng tuyến tính theo độ bao phủ trong khi kỳ vọng người dùng tăng theo bất kỳ thứ gì họ thấy tuần trước.

```figure
chatbot-lineage
```

**Dựa trên quy tắc (ELIZA, AIML, DialogFlow).** Các mẫu viết tay khớp đầu vào người dùng và tạo phản hồi. Các bộ phân loại ý định định tuyến đến các luồng được định nghĩa trước. Các máy trạng thái điền slot thu thập thông tin bắt buộc. Hoạt động xuất sắc trong phạm vi hẹp được thiết kế cho nó. Thất bại ngay lập tức ngoài phạm vi đó. Vẫn được phát hành trong các lĩnh vực an toàn trọng yếu (xác thực ngân hàng, đặt vé máy bay) nơi không chấp nhận ảo giác.

**Dựa trên truy xuất.** Một hệ thống kiểu FAQ. Mã hóa mọi cặp (phát ngôn, phản hồi). Khi chạy, mã hóa tin nhắn người dùng và truy xuất phản hồi được lưu gần nhất. Hãy nghĩ đến tính năng "các bài viết tương tự" cổ điển của Zendesk. Xử lý diễn đạt lại tốt hơn quy tắc. Không sinh, nên không ảo giác.

**Nơ-ron (seq2seq).** Encoder-decoder được huấn luyện trên nhật ký hội thoại. Sinh các phản hồi từ đầu. Trôi chảy nhưng dễ có các đầu ra chung chung ("Tôi không biết") và độ trôi sự kiện. Không bao giờ bám chủ đề một cách đáng tin cậy. Lý do Google, Facebook và Microsoft đều có các chatbot đáng thất vọng trong 2016-2019.

**Các tác tử LLM.** Một mô hình ngôn ngữ được bọc trong một vòng lặp lập kế hoạch, gọi công cụ và xác minh kết quả. Không phải một chatbot với một prompt dài. Một vòng lặp tác tử: lập kế hoạch → gọi công cụ → quan sát kết quả → quyết định bước tiếp. Tạo căn cứ ưu tiên truy xuất (RAG) giữ nó khỏi ảo giác. Các lời gọi công cụ cho phép nó thực sự làm việc. Đây là kiến trúc năm 2026.

Bốn mô thức không phải các thay thế tuần tự. Một chatbot production năm 2026 định tuyến qua cả bốn: dựa trên quy tắc cho xác thực và các hành động phá hủy, truy xuất cho FAQ, sinh nơ-ron cho cách diễn đạt tự nhiên, tác tử LLM cho các truy vấn mở mơ hồ.

## Build It

### Step 1: rule-based pattern matching

```python
import re


class RulePattern:
    def __init__(self, pattern, response_template):
        self.regex = re.compile(pattern, re.IGNORECASE)
        self.template = response_template


PATTERNS = [
    RulePattern(r"my name is (\w+)", "Nice to meet you, {0}."),
    RulePattern(r"i (need|want) (.+)", "Why do you {0} {1}?"),
    RulePattern(r"i feel (.+)", "Why do you feel {0}?"),
    RulePattern(r"(.*)", "Tell me more about that."),
]


def rule_based_respond(user_input):
    for pattern in PATTERNS:
        m = pattern.regex.match(user_input.strip())
        if m:
            return pattern.template.format(*m.groups())
    return "I don't understand."
```

ELIZA trong 20 dòng. Thủ thuật phản chiếu ("Tôi cảm thấy buồn" → "Tại sao bạn cảm thấy buồn") là bản minh họa nhà trị liệu tâm lý kinh điển từ Weizenbaum 1966. Vẫn mang tính hướng dẫn.

### Step 2: retrieval-based (FAQ)

Đoạn minh họa này yêu cầu `pip install sentence-transformers` (kéo theo torch). Thay vào đó, `code/main.py` chạy được của bài học này dùng độ tương đồng Jaccard từ stdlib, nên bài học chạy không có phụ thuộc bên ngoài.

```python
from sentence_transformers import SentenceTransformer
import numpy as np


FAQ = [
    ("how do i reset my password", "Go to Settings > Security > Reset Password."),
    ("how do i cancel my order", "Go to Orders, find the order, click Cancel."),
    ("what is your return policy", "30-day returns on unused items, original packaging."),
]


encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
faq_questions = [q for q, _ in FAQ]
faq_embeddings = encoder.encode(faq_questions, normalize_embeddings=True)


def faq_respond(user_input, threshold=0.5):
    q_emb = encoder.encode([user_input], normalize_embeddings=True)[0]
    sims = faq_embeddings @ q_emb
    best = int(np.argmax(sims))
    if sims[best] < threshold:
        return None
    return FAQ[best][1]
```

Từ chối dựa trên ngưỡng là lựa chọn thiết kế then chốt. Nếu kết quả khớp tốt nhất không đủ gần, trả `None` và để hệ thống chuyển cấp.

### Step 3: neural generation (baseline)

Dùng một encoder-decoder nhỏ được tinh chỉnh theo chỉ dẫn (FLAN-T5) hoặc một mô hình hội thoại được fine-tune. Riêng nó không dùng được cho production năm 2026 (mâu thuẫn, trôi khỏi chủ đề, vô nghĩa về sự kiện), nhưng được phát hành bên trong các hệ thống lai cho cách diễn đạt tự nhiên. Các mô hình chỉ decoder kiểu DialoGPT cần các dấu phân cách lượt tường minh và xử lý EOS để tạo các lời đáp mạch lạc; một pipeline text2text FLAN-T5 hoạt động ngay khi dùng cho một ví dụ giảng dạy.

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### Step 4: LLM agent loop

Hình dạng production năm 2026:

```python
def agent_loop(user_message, tools, llm, max_steps=5):
    history = [{"role": "user", "content": user_message}]
    for _ in range(max_steps):
        response = llm(history, tools=tools)
        tool_call = response.get("tool_call")
        if tool_call:
            tool_name = tool_call.get("name")
            args = tool_call.get("arguments")
            if not isinstance(tool_name, str) or tool_name not in tools:
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": str(tool_name), "content": f"error: unknown tool {tool_name!r}"})
                continue
            if not isinstance(args, dict):
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": tool_name, "content": f"error: arguments must be a dict, got {type(args).__name__}"})
                continue
            fn = tools[tool_name]
            result = fn(**args)
            history.append({"role": "assistant", "tool_call": tool_call})
            history.append({"role": "tool", "name": tool_name, "content": result})
        else:
            return response["content"]
    return "I could not complete the task in the step budget."
```

Ba điều cần nêu tên. Các công cụ là các hàm có thể gọi mà LLM có thể gọi đến. Vòng lặp kết thúc khi LLM trả một câu trả lời cuối thay cho một lời gọi công cụ. Ngân sách bước ngăn các vòng lặp vô hạn trên các tác vụ mơ hồ.

Production thực thêm: tạo căn cứ ưu tiên truy xuất (chèn các tài liệu liên quan trước mỗi lời gọi LLM), các biện pháp bảo vệ (từ chối các hành động phá hủy không có xác nhận), khả năng quan sát (ghi nhật ký mọi bước) và các đánh giá (các kiểm tra tự động rằng hành vi tác tử vẫn đúng đặc tả).

### Step 5: hybrid routing

```python
def hybrid_chat(user_input):
    if is_destructive_action(user_input):
        return structured_flow(user_input)

    faq_answer = faq_respond(user_input, threshold=0.6)
    if faq_answer:
        return faq_answer

    return agent_loop(user_input, tools, llm)


def is_destructive_action(text):
    danger_words = ["delete", "cancel", "charge", "refund", "transfer"]
    return any(w in text.lower() for w in danger_words)
```

Mẫu này: các quy tắc tất định cho mọi thứ có tính phá hủy, truy xuất cho các FAQ có sẵn, các tác tử LLM cho mọi thứ khác. Đây là những gì được phát hành trong các hệ thống hỗ trợ khách hàng năm 2026.

## Use It

Ngăn xếp năm 2026:

| Trường hợp sử dụng | Kiến trúc |
|---------|---------------|
| Đặt chỗ, thanh toán, xác thực | Các máy trạng thái dựa trên quy tắc + điền slot |
| FAQ hỗ trợ khách hàng | Truy xuất trên các câu trả lời được tuyển chọn |
| Trò chuyện trợ giúp mở | Tác tử LLM với RAG + các lời gọi công cụ |
| Công cụ nội bộ / trợ lý IDE | Tác tử LLM với các lời gọi công cụ (tìm kiếm, đọc, ghi) |
| Chatbot bạn đồng hành / nhân vật | LLM được tinh chỉnh với system prompt nhân cách, truy xuất kiến thức |

Luôn dùng định tuyến lai trong production. Không kiến trúc đơn lẻ nào xử lý tốt mọi yêu cầu. Bản thân tầng định tuyến thường là một bộ phân loại ý định nhỏ.

## Failure modes that still ship

- **Bịa đặt tự tin.** Tác tử LLM tuyên bố đã hoàn thành một hành động nó chưa làm. Giảm thiểu: xác minh kết quả, ghi nhật ký các lời gọi công cụ, không bao giờ để LLM tuyên bố đã làm điều gì mà không có một kết quả công cụ trả về thành công.
- **Prompt injection.** Người dùng chèn văn bản ghi đè system prompt. Xếp hạng LLM01 trong OWASP Top 10 cho các ứng dụng LLM năm 2025. Hai dạng: chèn trực tiếp (dán vào trò chuyện) và chèn gián tiếp (ẩn trong các tài liệu, email hoặc đầu ra công cụ tác tử đọc).

  Tỷ lệ tấn công thay đổi theo kịch bản. Các tỷ lệ thành công đo được dao động ~0.5-8.5% trên các mô hình tiên phong trong các benchmark dùng công cụ và lập trình tổng quát. Các thiết lập rủi ro cao cụ thể (các cuộc tấn công thích nghi vào các tác tử lập trình AI, điều phối dễ bị tấn công) đã đạt ~84%. Các CVE production bao gồm EchoLeak (CVE-2025-32711, CVSS 9.3) — một lỗ hổng đánh cắp dữ liệu không cần nhấp chuột trong Microsoft 365 Copilot được kích hoạt bởi một email do kẻ tấn công kiểm soát.

  Các biện pháp giảm thiểu: coi đầu vào người dùng là không đáng tin suốt vòng lặp; làm sạch trước các lời gọi công cụ; cô lập các đầu ra công cụ khỏi prompt chính; dùng mẫu Plan-Verify-Execute (PVE) nơi tác tử lập kế hoạch trước, rồi xác minh mỗi hành động theo kế hoạch đó trước khi thực hiện (điều này ngăn các kết quả công cụ chèn các hành động mới không có trong kế hoạch); yêu cầu xác nhận người dùng cho các hành động phá hủy; áp dụng quyền tối thiểu cho các phạm vi công cụ.

  Không lượng kỹ thuật prompt nào loại bỏ hoàn toàn rủi ro này. Các tầng phòng vệ runtime bên ngoài (LLM Guard, xác thực danh sách cho phép, phát hiện bất thường ngữ nghĩa) là bắt buộc.
- **Mở rộng phạm vi.** Tác tử đi chệch tác vụ vì một lời gọi công cụ trả thông tin có liên quan bên lề. Giảm thiểu: thu hẹp các hợp đồng công cụ; giữ system prompt tập trung; thêm các đánh giá tỷ lệ chệch tác vụ.
- **Các vòng lặp vô hạn.** Tác tử liên tục gọi cùng công cụ. Giảm thiểu: ngân sách bước, khử trùng lặp lời gọi công cụ, LLM đánh giá "chúng ta có đang tiến bộ không."
- **Cạn cửa sổ ngữ cảnh.** Các cuộc hội thoại dài đẩy các lượt sớm nhất khỏi ngữ cảnh. Giảm thiểu: tóm tắt các lượt cũ, truy xuất các lượt trước liên quan theo độ tương đồng hoặc dùng một mô hình ngữ cảnh dài.

## Ship It

Lưu thành `outputs/skill-chatbot-architect.md`:

```markdown
---
name: chatbot-architect
description: Design a chatbot stack for a given use case.
version: 1.0.0
phase: 5
lesson: 17
tags: [nlp, agents, chatbot]
---

Given a product context (user need, compliance constraints, available tools, data volume), output:

1. Architecture. Rule-based, retrieval, neural, LLM agent, or hybrid (specify which paths go where).
2. LLM choice if applicable. Name the model family (Claude, GPT-4, Llama-3.1, Mixtral). Match to tool-use quality and cost.
3. Grounding strategy. RAG sources, retrieval method (see lesson 14), tool contracts.
4. Evaluation plan. Task success rate, tool-call correctness, off-task rate, hallucination rate on held-out dialogs.

Refuse to recommend a pure-LLM agent for any destructive action (payments, account deletion, data modification) without a structured confirmation flow. Refuse to skip the prompt-injection audit if the agent has write access to anything.
```

## Exercises

1. **Dễ.** Triển khai hàm phản hồi dựa trên quy tắc ở trên với 10 mẫu cho một bot đặt món quán cà phê. Kiểm thử các trường hợp biên: đặt hai đơn, sửa đổi, hủy, ý định không rõ.
2. **Trung bình.** Xây dựng một dạng lai FAQ + phương án dự phòng LLM. 50 mục FAQ có sẵn cho một sản phẩm SaaS, phương án dự phòng LLM với truy xuất trên trang tài liệu. Đo tỷ lệ từ chối và accuracy trên 100 câu hỏi hỗ trợ thực.
3. **Khó.** Triển khai vòng lặp tác tử ở trên với ba công cụ (search, read-user-data, send-email). Chạy một đánh giá với 50 kịch bản kiểm thử bao gồm các nỗ lực prompt injection. Báo cáo tỷ lệ chệch tác vụ, tỷ lệ tác vụ thất bại và bất kỳ lần chèn thành công nào.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Intent (Ý định) | Điều người dùng muốn | Nhãn phân loại (book_flight, reset_password). Được định tuyến đến một bộ xử lý. |
| Slot | Một mẩu thông tin | Tham số bot cần (ngày, điểm đến). Điền slot là chuỗi các câu hỏi. |
| RAG | Truy xuất cộng sinh | Truy xuất các tài liệu liên quan, rồi tạo căn cứ cho phản hồi của LLM. |
| Tool call (Lời gọi công cụ) | Gọi hàm | LLM đưa ra một lời gọi có cấu trúc với tên + tham số. Runtime thực thi, trả kết quả. |
| Agent loop (Vòng lặp tác tử) | Lập kế hoạch, hành động, xác minh | Bộ điều khiển chạy các lời gọi LLM xen kẽ các lời gọi công cụ đến khi tác vụ hoàn thành. |
| Prompt injection | Người dùng tấn công prompt | Đầu vào độc hại cố ghi đè system prompt. |

## Further Reading

- [Turing (1950). Computing Machinery and Intelligence](https://academic.oup.com/mind/article/LIX/236/433/986238) — bài báo biến hội thoại thành benchmark của lĩnh vực.
- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) — bài báo chatbot dựa trên quy tắc gốc.
- [Colby, Weber, Hilf (1971). Artificial Paranoia](https://doi.org/10.1016/0004-3702(71)90002-6) — kiến trúc biến cảm xúc của PARRY, chatbot có trạng thái đầu tiên.
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) — bài báo chatbot nơ-ron muộn của Google, ngay trước khi các tác tử LLM tiếp quản.
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — bài báo đặt tên mẫu vòng lặp tác tử.
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) — hướng dẫn production năm 2024 vẫn đúng trong năm 2026.
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) — bài báo prompt injection.
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — bảng xếp hạng khiến prompt injection trở thành mối lo bảo mật hàng đầu.
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/) — các biện pháp phòng vệ tầng điều phối thực tế bao gồm Plan-Verify-Execute và các luồng xác nhận người dùng.
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) — CVE đánh cắp dữ liệu không cần nhấp chuột kinh điển từ prompt injection gián tiếp. Trường hợp tham chiếu cho lý do các tác tử có quyền ghi cần các biện pháp phòng vệ runtime.
