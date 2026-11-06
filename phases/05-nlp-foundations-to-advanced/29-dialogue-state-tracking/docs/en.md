# Dialogue State Tracking

> "Tôi muốn một nhà hàng rẻ ở phía bắc... thực ra đổi thành giá vừa phải... và thêm món Ý." Ba lượt, ba cập nhật trạng thái. DST giữ dict slot-giá trị đồng bộ để việc đặt chỗ hoạt động.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 20 (Structured Outputs)
**Time:** ~75 minutes

## The Problem

Trong một hệ thống hội thoại hướng tác vụ, mục tiêu người dùng được mã hóa thành một tập các cặp slot-giá trị: `{cuisine: italian, area: north, price: moderate}`. Mỗi lượt người dùng có thể thêm, thay đổi hoặc loại bỏ một slot. Hệ thống phải đọc toàn bộ cuộc hội thoại và xuất đúng trạng thái hiện tại.

Làm sai một slot duy nhất và hệ thống đặt sai nhà hàng, lên lịch sai chuyến bay hoặc tính phí sai thẻ. DST là bản lề giữa điều người dùng nói và điều backend thực thi.

Vì sao nó vẫn quan trọng năm 2026 dù có LLM:

- Các lĩnh vực nhạy cảm tuân thủ (ngân hàng, chăm sóc sức khỏe, đặt vé máy bay) đòi hỏi các giá trị slot tất định, không phải sinh tự do.
- Các tác tử dùng công cụ vẫn cần phân giải slot trước khi gọi API.
- Sửa đổi nhiều lượt khó hơn vẻ ngoài: "thực ra không, đổi thành thứ Năm."

Pipeline hiện đại: các khái niệm DST cổ điển + các bộ trích xuất LLM + các biện pháp bảo vệ đầu ra có cấu trúc.

## The Concept

![DST: dialog history → slot-value state](../assets/dst.svg)

**Cấu trúc tác vụ.** Một schema định nghĩa các miền (nhà hàng, khách sạn, taxi) và các slot của chúng (ẩm thực, khu vực, giá, số người). Mỗi slot có thể rỗng, được điền bằng một giá trị từ một tập đóng (giá: {rẻ, vừa phải, đắt}) hoặc một giá trị tự do (tên: "The Copper Kettle").

**Hai cách phát biểu DST.**

- **Phân loại.** Với mỗi cặp (slot, candidate_value), dự đoán có/không. Hoạt động cho các slot từ vựng đóng. Tiêu chuẩn trước 2020.
- **Sinh.** Với cuộc hội thoại, sinh các giá trị slot dưới dạng văn bản tự do. Hoạt động cho các slot từ vựng mở. Mặc định hiện đại.

**Thước đo.** Joint Goal Accuracy (JGA) — tỷ lệ các lượt mà *mọi* slot đều đúng. Tất cả hoặc không gì. Bảng xếp hạng MultiWOZ 2.4 đạt đỉnh khoảng 83% năm 2026.

**Các kiến trúc.**

1. **Dựa trên quy tắc (regex slot + từ khóa).** Baseline mạnh cho các miền hẹp. Có thể gỡ lỗi.
2. **TripPy / BERT-DST.** Sinh dựa trên sao chép với mã hóa BERT. Tiêu chuẩn trước LLM.
3. **LDST (LLaMA + LoRA).** LLM được tinh chỉnh theo chỉ dẫn với prompting miền-slot. Đạt chất lượng cấp ChatGPT trên MultiWOZ 2.4.
4. **Không ontology (2024–26).** Bỏ schema; sinh trực tiếp tên và giá trị slot. Xử lý các miền mở.
5. **Prompt + đầu ra có cấu trúc (2024–26).** LLM với schema Pydantic + giải mã có ràng buộc. 5 dòng mã, sẵn sàng production.

### The classic failure modes

- **Đồng tham chiếu xuyên lượt.** "Hãy giữ lựa chọn đầu tiên." Cần phân giải lựa chọn nào.
- **Ghi đè so với nối thêm.** Người dùng nói "thêm món Ý." Bạn thay ẩm thực hay nối thêm?
- **Các xác nhận ngầm.** "OK tuyệt" — điều đó có chấp nhận việc đặt chỗ được đề xuất không?
- **Sửa đổi.** "Thực ra đổi thành 7 giờ tối." Phải cập nhật thời gian mà không xóa các slot khác.
- **Đồng tham chiếu đến phát ngôn hệ thống trước.** "Đúng, cái đó." "Cái đó" nào?

```figure
n5-slot-tracker
```

## Build It

### Step 1: rule-based slot extractor

Xem `code/main.py`. Regex + các từ điển đồng nghĩa bao phủ 70% các phát ngôn kinh điển trong các miền hẹp:

```python
CUISINE_SYNONYMS = {
    "italian": ["italian", "pasta", "pizza", "italy"],
    "chinese": ["chinese", "chow mein", "noodles"],
}


def extract_cuisine(utterance):
    for canonical, synonyms in CUISINE_SYNONYMS.items():
        if any(syn in utterance.lower() for syn in synonyms):
            return canonical
    return None
```

Mong manh ngoài từ vựng kinh điển. Hoạt động cho các xác nhận slot tất định.

### Step 2: state update loop

```python
def update_state(state, utterance):
    new_state = dict(state)
    for slot, extractor in SLOT_EXTRACTORS.items():
        value = extractor(utterance)
        if value is not None:
            new_state[slot] = value
    for slot in NEGATION_CLEARS:
        if is_negated(utterance, slot):
            new_state[slot] = None
    return new_state
```

Ba bất biến:

- Không bao giờ đặt lại một slot người dùng không đụng đến.
- Phủ định tường minh ("thôi không cần quan tâm loại ẩm thực") phải xóa.
- Sửa đổi của người dùng ("thực ra...") phải ghi đè, không nối thêm.

### Step 3: LLM-driven DST with structured output

```python
from pydantic import BaseModel
from typing import Literal, Optional
import instructor

class RestaurantState(BaseModel):
    cuisine: Optional[Literal["italian", "chinese", "indian", "thai", "any"]] = None
    area: Optional[Literal["north", "south", "east", "west", "center"]] = None
    price: Optional[Literal["cheap", "moderate", "expensive"]] = None
    people: Optional[int] = None
    day: Optional[str] = None


def llm_dst(history, llm):
    prompt = f"""You track the slot values of a restaurant booking across turns.
Dialogue so far:
{render(history)}

Update the state based on the latest user turn. Output only the JSON state."""
    return llm(prompt, response_model=RestaurantState)
```

Instructor + Pydantic bảo đảm một đối tượng trạng thái hợp lệ. Không regex, không sự không khớp schema, không slot bị ảo giác.

### Step 4: JGA evaluation

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

Hiệu chuẩn: ở tỷ lệ lượt nào hệ thống lấy đúng TẤT CẢ các slot? Với MultiWOZ 2.4, các hệ thống hàng đầu năm 2026: 80-83%. Hệ thống trong miền của bạn nên vượt mức đó trên từ vựng hẹp của bạn nếu không baseline LLM thắng bạn.

### Step 5: handling correction

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

Khi phát hiện một sửa đổi, ghi đè slot được cập nhật cuối thay vì nối thêm. Khó làm đúng nếu không có trợ giúp LLM. Mẫu hiện đại: luôn để LLM sinh lại toàn bộ trạng thái từ lịch sử thay vì cập nhật tăng dần — điều này tự nhiên xử lý các sửa đổi.

## Pitfalls

- **Chi phí sinh lại toàn lịch sử.** Để LLM sinh lại trạng thái mỗi lượt tốn tổng $O(n^2)$ token. Giới hạn lịch sử hoặc tóm tắt các lượt cũ.
- **Độ trôi schema.** Thêm các slot mới sau đó phá dữ liệu huấn luyện cũ. Quản lý phiên bản schema của bạn.
- **Phân biệt hoa thường.** "Italian" so với "italian" so với "ITALIAN" — chuẩn hóa ở mọi nơi.
- **Kế thừa ngầm.** Nếu người dùng trước đó chỉ định "cho 4 người", một yêu cầu mới cho thời gian khác không nên xóa số người. Luôn truyền toàn bộ lịch sử.
- **Tự do so với tập đóng.** Tên, thời gian và địa chỉ cần các slot tự do; ẩm thực và khu vực là đóng. Trộn cả hai trong schema.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Cách tiếp cận |
|-----------|----------|
| Miền hẹp (một hoặc hai ý định) | Dựa trên quy tắc + regex |
| Miền rộng, có dữ liệu gán nhãn | LDST (LLaMA + LoRA trên dữ liệu kiểu MultiWOZ) |
| Miền rộng, không nhãn, sẵn sàng production | LLM + Instructor + schema Pydantic |
| Lời nói / giọng nói | ASR + bộ chuẩn hóa + LLM-DST |
| Luồng đặt chỗ nhiều miền | LLM được hướng dẫn bằng schema với các mô hình Pydantic theo miền |
| Nhạy cảm tuân thủ | Chính dựa trên quy tắc, dự phòng LLM với luồng xác nhận |

## Ship It

Lưu thành `outputs/skill-dst-designer.md`:

```markdown
---
name: dst-designer
description: Design a dialogue state tracker — schema, extractor, update policy, evaluation.
version: 1.0.0
phase: 5
lesson: 29
tags: [nlp, dialogue, task-oriented]
---

Given a use case (domain, languages, vocab openness, compliance needs), output:

1. Schema. Domain list, slots per domain, open vs closed vocabulary per slot.
2. Extractor. Rule-based / seq2seq / LLM-with-Pydantic. Reason.
3. Update policy. Regenerate-whole-state / incremental; correction handling; negation handling.
4. Evaluation. Joint Goal Accuracy on a held-out dialogue set, slot-level precision/recall, confusion on the hardest slot.
5. Confirmation flow. When to explicitly ask the user to confirm (destructive actions, low-confidence extractions).

Refuse LLM-only DST for compliance-sensitive slots without a rule-based secondary check. Refuse any DST that cannot roll back a slot on user correction. Flag schemas without version tags.
```

## Exercises

1. **Dễ.** Xây dựng bộ theo dõi trạng thái dựa trên quy tắc trong `code/main.py` cho 3 slot (ẩm thực, khu vực, giá). Kiểm thử trên 10 cuộc hội thoại tạo thủ công. Đo JGA.
2. **Trung bình.** Cùng tập dữ liệu với Instructor + Pydantic + một LLM nhỏ. So sánh JGA. Kiểm tra các lượt khó nhất.
3. **Khó.** Triển khai cả hai và định tuyến: chính dựa trên quy tắc, dự phòng LLM khi phần dựa trên quy tắc đưa ra <2 slot với độ tin cậy. Đo JGA kết hợp và chi phí suy luận mỗi lượt.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| DST | Theo dõi trạng thái hội thoại | Duy trì dict slot-giá trị qua các lượt hội thoại. |
| Slot | Đơn vị ý định người dùng | Tham số có tên mà backend cần (ẩm thực, ngày). |
| Domain (Miền) | Khu vực tác vụ | Nhà hàng, khách sạn, taxi — các tập slot. |
| JGA | Độ chính xác Mục tiêu Đồng thời | Tỷ lệ các lượt mà mọi slot đều đúng. Tất cả hoặc không gì. |
| MultiWOZ | Benchmark | Tập dữ liệu WOZ nhiều miền; đánh giá DST tiêu chuẩn. |
| Ontology-free DST (DST không ontology) | Không schema | Sinh trực tiếp tên và giá trị slot, không có danh sách cố định. |
| Correction (Sửa đổi) | "Thực ra..." | Lượt ghi đè một slot được điền trước đó. |

## Further Reading

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) — benchmark kinh điển.
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) — tinh chỉnh theo chỉ dẫn LLaMA + LoRA cho DST.
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) — thành phần chủ lực DST dựa trên sao chép.
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753) — TOD không giám sát dựa trên EM.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) — các kết quả DST chuẩn.
