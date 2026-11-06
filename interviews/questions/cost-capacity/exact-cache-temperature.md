---
id: exact-cache-temperature
title: Read the exact-match cache before it ships
card: cost-capacity
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, debugging]
tags: [exact-cache, hashing, eviction, temperature]
minutes: 10
lessons: [phases/11-llm-engineering/11-caching-cost]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/two-cache-layers]
updated: 2026-11-03
---

Đọc exact-match cache này từ bài học caching. Tại sao nó từ chối mọi request có temperature dương, những gì đi vào khóa và tại sao, và bạn sẽ thay đổi gì trước khi nó chạy trong production?

```python
class ExactCache:
    def __init__(self, max_size=1000, ttl_seconds=3600):
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl_seconds
        self.hits = 0
        self.misses = 0

    def _hash(self, model, messages, temperature):
        key_data = json.dumps({"model": model, "messages": messages, "temperature": temperature}, sort_keys=True)
        return hashlib.sha256(key_data.encode()).hexdigest()

    def get(self, model, messages, temperature=0.0):
        if temperature > 0:
            self.misses += 1
            return None
        key = self._hash(model, messages, temperature)
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl:
                self.hits += 1
                entry["access_count"] += 1
                return entry["response"]
            del self.cache[key]
        self.misses += 1
        return None

    def put(self, model, messages, temperature, response):
        if temperature > 0:
            return
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache, key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
        key = self._hash(model, messages, temperature)
        self.cache[key] = {"response": response, "timestamp": time.time(), "access_count": 1}
```

## Short answer

Cache chỉ phục vụ các lời gọi có tính xác định. Một temperature dương yêu cầu sự biến thiên do lấy mẫu, và một câu trả lời được phát lại sẽ loại bỏ sự biến thiên đó mà không báo cho bên gọi, vì vậy cache coi các lời gọi đó là miss và không bao giờ lưu chúng. Khóa là một hash của mô hình, toàn bộ danh sách tin nhắn và temperature, được tuần tự hóa với các khóa đã sắp xếp để cùng request luôn tạo ra cùng các byte. Trước production, khóa cần mọi trường khác làm thay đổi câu trả lời, việc loại bỏ cần một chính sách ít được dùng gần đây nhất thay vì một lượt quét đầy đủ tìm mục cũ nhất, và việc hết hạn cần một lượt quét, vì một mục đã hết hạn chỉ bị loại khi ai đó đọc nó.

## Full answer

### The temperature guard

Cả `get` và `put` đều trả về sớm khi trên không. Quy tắc của bài học là exact caching hoạt động cho các lời gọi có tính xác định: cùng mô hình, cùng prompt, temperature bằng không. Phục vụ một mẫu đã lưu cho một bên gọi yêu cầu sự biến thiên thay đổi hành vi âm thầm, điều này tệ hơn một miss.

### What the key holds, and what it misses

Khóa bao phủ mô hình, vì cùng prompt trên một mô hình khác là một câu trả lời khác, toàn bộ danh sách tin nhắn, vì system prompt và ngữ cảnh là một phần của request, và temperature. `sort_keys=True` làm việc tuần tự hóa ổn định, để hai bên gọi xây dựng cùng dictionary theo một thứ tự khác vẫn hash giống nhau. Khóa không bao phủ các trường khác thay đổi câu trả lời: các tham số lấy mẫu ngoài temperature, giới hạn đầu ra, các định nghĩa công cụ và định dạng phản hồi. Thêm chúng, nếu không cache trả về một câu trả lời được tạo dưới các thiết lập khác.

### Expiry is lazy

Thời gian tồn tại được kiểm tra khi đọc. Một mục quá thời gian tồn tại vẫn ở trong bộ nhớ cho đến khi một lần đọc tìm thấy nó hoặc một lần loại bỏ bỏ nó. Một lượt quét định kỳ, hoặc một phép kiểm tra hết hạn trong `put`, giữ cho bộ nhớ trung thực.

### Eviction is a full scan, oldest first

Khi đạt dung lượng, `put` quét mọi mục để tìm dấu thời gian cũ nhất. Đó là công việc tuyến tính trên mọi lần chèn khi cache đã đầy, và nó loại bỏ theo thời gian chèn, vì vậy một mục phổ biến được chèn sớm đi trước. Bài tập đầu tiên của bài học yêu cầu loại bỏ ít được dùng gần đây nhất theo thời gian truy cập cuối cùng, điều mà trường `access_count` gợi ý nhưng không triển khai.

### Prove that it pays

Cache đếm hit và miss. Bộ theo dõi chi phí của bài học ghi log một trạng thái cache trên mọi lời gọi và tính chi phí tiết kiệm từ các hit với bảng giá. Kết nối điều đó trước khi bạn tranh luận về hit rate.

## Follow-ups

- **Level 2:** Tại sao tuần tự hóa với các khóa đã sắp xếp? Expected: thứ tự của một dictionary có thể khác giữa các bên gọi, và một thứ tự byte khác cho một hash khác cho cùng request.
- **Level 3:** Các trường request nào bị thiếu khỏi khóa? Expected: bất cứ thứ gì khác thay đổi câu trả lời, chẳng hạn các tham số lấy mẫu khác, giới hạn đầu ra, các định nghĩa công cụ và định dạng phản hồi.
- **Level 3:** Việc loại bỏ làm gì khi đạt dung lượng, và bài tập yêu cầu gì thay vào đó? Expected: nó quét tất cả các mục tìm dấu thời gian cũ nhất và bỏ nó. Bài tập yêu cầu loại bỏ ít được dùng gần đây nhất theo thời gian truy cập cuối cùng.
- **Level 4:** Bạn sẽ cho thấy cache này tự bù chi phí như thế nào? Expected: ghi log trạng thái cache trên mọi lời gọi và tính chi phí tiết kiệm từ các hit với bảng giá, như bộ theo dõi chi phí của bài học thực hiện.

## Wrong answers

- "Phép kiểm tra temperature vô nghĩa, một câu trả lời đã cache là một câu trả lời tốt." Một temperature dương nghĩa là bên gọi muốn sự biến thiên. Một lần phát lại loại bỏ nó mà không báo cho ai.
- "Chỉ hash tin nhắn người dùng." Cùng câu hỏi dưới một system prompt, mô hình hoặc bộ công cụ khác có một câu trả lời đúng khác.
- "Thời gian tồn tại loại bỏ các mục hết hạn." Nó chỉ giấu chúng khi đọc. Mục vẫn ở trong bộ nhớ cho đến khi một lần đọc hoặc một lần loại bỏ xóa nó.

## Taught in

[Bài học caching và chi phí](../../../phases/11-llm-engineering/11-caching-cost/) xây dựng exact cache, và bài tập đầu tiên của nó thay thế chính sách loại bỏ.
