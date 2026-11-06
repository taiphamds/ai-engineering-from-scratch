# Hierarchical Architecture and Its Failure Mode

> Phân cấp là bộ giám sát lồng nhau. Các agent quản lý trên các quản lý con trên các worker. `Process.hierarchical` của CrewAI là phiên bản sách giáo khoa: một `manager_llm` giao tác vụ động và xác thực đầu ra. Dạng tương đương LangGraph là `create_supervisor(create_supervisor(...))`. Nó là mẫu tự nhiên khi tác vụ là một sơ đồ tổ chức thực. Nó cũng là mẫu có khả năng cao nhất sụp thành vòng lặp quản lý — các agent quản lý giao việc kém, diễn giải sai các đầu ra con, hoặc không đạt đồng thuận. Tuần tự thường vượt nó.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern)
**Time:** ~60 minutes

## Problem

Một khi mẫu bộ giám sát trở nên rõ ràng, bước tiếp theo tự nhiên là “nếu bản thân các worker là các bộ giám sát thì sao?” Các nhóm có nhóm con; các công ty có phòng ban của các phòng ban. Các kiến trúc phân cấp phản ánh điều đó.

Vấn đề: các quản lý LLM không giống các quản lý con người. Một quản lý con người có các tiên nghiệm ổn định về những gì cấp dưới của họ biết. Một quản lý LLM suy luận lại tổ chức ở mỗi lượt từ bất cứ thứ gì nằm trong ngữ cảnh. Sự trôi nhỏ trong ngữ cảnh đó, và toàn bộ cây phân bổ sai công việc.

## Concept

### The shape

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

Mọi node nội bộ lập kế hoạch, giao việc, và tổng hợp. Chỉ các lá làm công việc.

### Where it shines

- **Ánh xạ tổ chức rõ ràng.** Nếu tác vụ thực là theo phòng ban (“pháp lý xem xét tài liệu, tài chính xem xét tài liệu, kỹ thuật xem xét tài liệu, rồi tóm tắt cho giám đốc”), hệ thống phân cấp là tường minh.
- **Tóm tắt cục bộ.** Mỗi quản lý con tổng hợp đầu ra nhóm trước khi quản lý cao nhất thấy nó. Quản lý cao nhất thấy ba tóm tắt quản lý con, không phải mười lăm đầu ra worker.

### Where it breaks

Ba chế độ lỗi mà các phân tích hậu sự cố năm 2026 liên tục tìm thấy:

1. **Lỗi giao tác vụ.** Quản lý đọc mục tiêu, ảo giác một phân rã, và giao cho sai quản lý con. Vì quản lý con ngoan ngoãn làm việc trên những gì được giao, lỗi chỉ lộ ra tại tổng hợp cao nhất — cách một cấp so với nơi một người có thể đã bắt được nó.
2. **Diễn giải sai đầu ra.** Quản lý con trả về “không thể xác minh tuyên bố X.” Quản lý cao nhất tóm tắt thành “tuyên bố X chưa được xác nhận.” Ý nghĩa trôi ở mỗi cấp.
3. **Các vòng lặp đồng thuận.** Hai quản lý con bất đồng; quản lý cao nhất yêu cầu họ hòa giải; họ giao lại xuống dưới; các worker chạy lại; các quản lý con trả về các câu trả lời hơi khác; lặp. `Process.hierarchical` của CrewAI bảo vệ chống điều này bằng các giới hạn bước, nhưng bản thân giới hạn giờ là một siêu tham số.

### The deciding question

Tuần tự (pipeline tuyến tính) so với phân cấp: tác vụ của bạn thực sự có các nhóm con độc lập, hay nó là một luồng tuyến tính giả làm cây? Nếu là trường hợp sau, dùng tuần tự. Nếu là trường hợp trước, dùng phân cấp nhưng dự trù các quy tắc hòa giải tường minh.

### Role-framework implementation

`Process.hierarchical` của CrewAI kết nối một LLM quản lý trên các nhóm chuyên gia. Quản lý:

- nhận tác vụ cấp cao nhất,
- giao các tác vụ con cho các nhóm,
- đánh giá các đầu ra nhóm,
- quyết định chấp nhận, giao lại, hay lặp.

Tài liệu: https://docs.crewai.com/en/introduction (tìm “Hierarchical Process” trong Core Concepts).

### Graph-framework implementation

LangGraph sử dụng các lệnh gọi `create_supervisor` lồng nhau. Bộ giám sát bên trong có đồ thị riêng; bộ giám sát bên ngoài coi đồ thị bên trong như một node không trong suốt. Điều này sạch hơn CrewAI cho gỡ lỗi (bạn có thể đi từng bước qua mỗi đồ thị riêng biệt) nhưng khó thể hiện việc định hình lại cây động hơn.

Tham chiếu: https://reference.langchain.com/python/langgraph-supervisor.

```figure
swarm-hierarchy-token
```

## Build It

`code/main.py` chạy một hệ thống phân cấp 3 cấp:

- quản lý cao nhất: chia một tác vụ thành các nhánh “kỹ thuật” và “pháp lý”,
- quản lý con kỹ thuật: chia thành các worker “frontend” và “backend”,
- quản lý con pháp lý: một worker.

Demo đối chiếu luồng thuận lợi (mọi bên đồng ý) với một **luồng bị nhiễu** nơi phân rã của quản lý cao nhất gắn nhầm nhãn “pháp lý” thành “tài chính” và quan sát lỗi lan truyền — quản lý con ngoan ngoãn làm công việc tài chính, bộ tổng hợp cao nhất báo cáo các phát hiện tài chính, câu hỏi pháp lý gốc không được trả lời.

Chạy:

```
python3 code/main.py
```

Đầu ra cho thấy cả hai luồng với một đối chiếu đặt cạnh nhau rõ ràng của “những gì được yêu cầu” so với “những gì được bàn giao.”

## Use It

`outputs/skill-hierarchy-fitness.md` đánh giá liệu một tác vụ nhất định nên sử dụng phân cấp, tuần tự, hay bộ giám sát phẳng. Đầu vào: mô tả tác vụ, cấu trúc tổ chức, ngân sách hòa giải. Đầu ra: khuyến nghị mẫu với các chế độ lỗi cụ thể cần phòng ngừa.

## Ship It

Nếu bạn đưa phân cấp ra sử dụng:

- **Giới hạn độ sâu cây ở 2.** Ba cấp đã che giấu hầu hết lỗi khỏi khả năng quan sát.
- **Ngân sách hòa giải tường minh.** Đặt số vòng tối đa trước khi quản lý cao nhất phải cam kết. Thường là 2.
- **Nguồn gốc trên mọi tổng hợp.** Tóm tắt của mỗi node phải dẫn những đầu ra lá nào đã tạo ra nó.
- **Cảnh báo khi phân rã trôi.** Ghi nhật ký phân rã của quản lý theo từng bước; so sánh khác biệt với truy vấn người dùng. Nếu phân rã không còn bao phủ truy vấn, kích hoạt một cảnh báo.

## Exercises

1. Chạy `code/main.py` và so sánh thuận lợi với bị nhiễu. Cần bao nhiêu cấp bàn giao quản lý trước khi đầu ra cao nhất hoàn toàn lệch khỏi câu hỏi người dùng?
2. Thêm một cấp thứ ba (cao nhất → con → con-con → worker). Đo tần suất luồng bị nhiễu tự sửa so với phân kỳ hoàn toàn khi độ sâu tăng.
3. Triển khai một worker “canary” ở mỗi quản lý con luôn được hỏi nguyên câu hỏi gốc của người dùng. Sử dụng câu trả lời canary để phát hiện trôi phân rã. Quản lý nên phản ứng thế nào khi canary bất đồng với câu trả lời được tổng hợp?
4. Đọc tài liệu `Process.hierarchical` của CrewAI. Xác định một rào chắn cụ thể CrewAI áp dụng (giới hạn bước, ràng buộc manager_llm) và mô tả nó nhắm tới chế độ lỗi nào.
5. So sánh các bộ giám sát LangGraph lồng nhau với phân cấp CrewAI. Cách nào làm các vòng lặp hòa giải ít tốn kém hơn để phát hiện?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Hierarchical (Phân cấp) | “Mẫu sơ đồ tổ chức” | Các bộ giám sát trên các bộ giám sát; chỉ các lá làm công việc. |
| Manager LLM (LLM quản lý) | “Sếp” | LLM phân rã, giao việc, và xác thực tại một node nội bộ. |
| Decomposition drift (Trôi phân rã) | “Sếp mất mạch” | Phép chia của quản lý cao nhất không còn bao phủ câu hỏi gốc. |
| Reconciliation loop (Vòng lặp hòa giải) | “Các cuộc họp bất tận” | Các quản lý con bất đồng; cấp trên giao lại; các worker chạy lại; lặp cho đến khi hết ngân sách. |
| Depth-2 ceiling (Mức trần độ sâu 2) | “Đừng đi sâu hơn 2 cấp” | Rào chắn thực nghiệm: 3+ cấp làm sụp đổ khả năng quan sát. |
| Canary question (Câu hỏi canary) | “Chuẩn tham chiếu ở mỗi cấp” | Một worker luôn được hỏi nguyên truy vấn gốc, để phát hiện sự trôi. |
| Provenance chain (Chuỗi nguồn gốc) | “Ai nói gì” | Dấu vết từ mỗi tổng hợp trở lại các đầu ra lá tạo ra nó. |

## Further Reading

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) — phân cấp sách giáo khoa với một LLM quản lý
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) — bộ giám sát lồng nhau qua `create_supervisor`
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) — vì sao Anthropic chủ ý chọn bộ giám sát phẳng thay vì phân cấp
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — hệ phân loại MAST; phần về các lỗi phối hợp ghi nhận trôi phân rã
