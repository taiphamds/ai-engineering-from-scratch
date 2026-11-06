# Why Multi-Agent?

> Một agent đụng phải bức tường. Bước đi thông minh không phải là một agent lớn hơn - mà là nhiều agent hơn.

**Type:** Learn
**Languages:** TypeScript
**Prerequisites:** Phase 14 (Agent Engineering)
**Time:** ~60 minutes

## Learning Objectives

- Xác định mức trần của một agent đơn lẻ (tràn ngữ cảnh, chuyên môn hỗn hợp, nút thắt tuần tự) và giải thích khi nào chia thành nhiều agent là bước đi đúng
- So sánh các mẫu điều phối (pipeline, fan-out song song, bộ giám sát, phân cấp) và chọn mẫu phù hợp cho một cấu trúc tác vụ nhất định
- Thiết kế một hệ thống đa agent với các ranh giới vai trò rõ ràng, trạng thái dùng chung, và một hợp đồng giao tiếp
- Phân tích các đánh đổi của độ phức tạp đa agent (độ trễ, chi phí, độ khó gỡ lỗi) so với sự đơn giản của một agent đơn lẻ

## The Problem

Bạn đã xây dựng một agent đơn lẻ trong Giai đoạn 14. Nó hoạt động. Nó có thể đọc file, chạy lệnh, gọi API, và suy luận về kết quả. Rồi bạn hướng nó tới một cơ sở mã thực: 200 file, ba ngôn ngữ, các kiểm thử phụ thuộc vào cơ sở hạ tầng, và một yêu cầu nghiên cứu các API bên ngoài trước khi viết mã.

Agent bị nghẹn. Không phải vì LLM ngu ngốc, mà vì tác vụ vượt quá những gì một vòng lặp agent có thể xử lý. Cửa sổ ngữ cảnh đầy nội dung file. Agent quên những gì nó đọc cách đây 40 lệnh gọi công cụ. Nó cố đồng thời là nhà nghiên cứu, người viết mã, và người xem xét, và làm kém cả ba.

Đây là mức trần của một agent đơn lẻ. Bạn chạm tới nó mỗi khi một tác vụ yêu cầu:

- **Nhiều ngữ cảnh hơn mức vừa trong một cửa sổ** - đọc 50 file vượt xa 200k token
- **Chuyên môn khác nhau ở các giai đoạn khác nhau** - nghiên cứu yêu cầu cách prompt khác với sinh mã
- **Công việc có thể diễn ra song song** - vì sao đọc ba file tuần tự khi bạn có thể đọc chúng đồng thời?

## The Concept

### The Single-Agent Ceiling

Một agent đơn lẻ là một vòng lặp, một cửa sổ ngữ cảnh, một prompt hệ thống. Hãy hình dung nó:

```
┌─────────────────────────────────────────┐
│            SINGLE AGENT                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         Context Window            │  │
│  │                                   │  │
│  │  research notes                   │  │
│  │  + code files                     │  │
│  │  + test output                    │  │
│  │  + review feedback                │  │
│  │  + API docs                       │  │
│  │  + ...                            │  │
│  │                                   │  │
│  │  ██████████████████████ FULL ███  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  One system prompt tries to cover       │
│  research + coding + review + testing   │
│                                         │
│  Result: mediocre at everything         │
└─────────────────────────────────────────┘
```

Ba thứ hỏng:

1. **Bão hòa ngữ cảnh** - các kết quả công cụ chồng chất. Đến lượt 30, agent đã tiêu thụ 150k token nội dung file, đầu ra lệnh, và suy luận trước đó. Các chi tiết quan trọng từ lượt 5 bị mất.

2. **Nhầm lẫn vai trò** - một prompt hệ thống nói “bạn là nhà nghiên cứu, người viết mã, người xem xét, và người kiểm thử” tạo ra một agent nghiên cứu nửa vời, viết mã nửa vời, và không bao giờ hoàn thành xem xét.

3. **Nút thắt tuần tự** - agent đọc file A, rồi file B, rồi file C. Ba lệnh gọi LLM nối tiếp. Ba lần thực thi công cụ nối tiếp. Không có tính song song.

### The Multi-Agent Solution

Chia công việc. Cho mỗi agent một công việc, một cửa sổ ngữ cảnh, và một prompt hệ thống được điều chỉnh cho công việc đó:

```
┌──────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│                                                          │
│  "Build a REST API for user management"                  │
│                                                          │
│         ┌──────────┬──────────┬──────────┐               │
│         │          │          │          │               │
│         ▼          ▼          ▼          ▼               │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │RESEARCHER│ │  CODER   │ │ REVIEWER │ │  TESTER  │  │
│   │          │ │          │ │          │ │          │  │
│   │ Reads    │ │ Writes   │ │ Checks   │ │ Runs     │  │
│   │ docs,    │ │ code     │ │ code     │ │ tests,   │  │
│   │ finds    │ │ based on │ │ quality, │ │ reports  │  │
│   │ patterns │ │ research │ │ finds    │ │ results  │  │
│   │          │ │ + spec   │ │ bugs     │ │          │  │
│   └─────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│         │           │            │             │         │
│         └───────────┴────────────┴─────────────┘         │
│                          │                               │
│                     Merge results                        │
└──────────────────────────────────────────────────────────┘
```

Mỗi agent có:
- Một prompt hệ thống tập trung (“Bạn là một người xem xét mã. Công việc duy nhất của bạn là tìm lỗi.”)
- Cửa sổ ngữ cảnh riêng (không bị ô nhiễm bởi công việc của các agent khác)
- Một hợp đồng đầu vào/đầu ra rõ ràng (nhận ghi chú nghiên cứu, xuất mã)

### Real Systems That Do This

**Các agent con của Claude Code** - khi Claude Code tạo một agent con bằng `Task`, nó tạo một agent con với một tác vụ có phạm vi giới hạn. Agent cha giữ ngữ cảnh của nó sạch. Agent con làm công việc tập trung và trả về một bản tóm tắt.

**Devin** - chạy một agent lập kế hoạch, một agent viết mã, và một agent trình duyệt. Bộ lập kế hoạch chia công việc thành các bước. Người viết mã viết mã. Trình duyệt nghiên cứu tài liệu. Mỗi agent có ngữ cảnh riêng.

**Các nhóm lập trình đa agent (SWE-bench)** - các hệ thống có hiệu năng hàng đầu trên SWE-bench sử dụng một nhà nghiên cứu đọc cơ sở mã, một bộ lập kế hoạch thiết kế bản sửa lỗi, và một người viết mã triển khai nó. Các hệ thống một agent đơn lẻ đạt điểm thấp hơn.

**ChatGPT Deep Research** - tạo nhiều agent tìm kiếm song song, mỗi agent khám phá một góc độ khác nhau, rồi tổng hợp kết quả.

### The Spectrum

Đa agent không phải là nhị phân. Nó là một phổ:

```
SIMPLE ──────────────────────────────────────────── COMPLEX

 Single        Sub-         Pipeline      Team         Swarm
 Agent         agents

 ┌───┐       ┌───┐        ┌───┐───┐    ┌───┐───┐    ┌─┐┌─┐┌─┐
 │ A │       │ A │        │ A │ B │    │ A │ B │    │ ││ ││ │
 └───┘       └─┬─┘        └───┘─┬─┘    └─┬─┘─┬─┘    └┬┘└┬┘└┬┘
               │                │        │   │       ┌┴──┴──┴┐
             ┌─┴─┐          ┌───┘───┐    │   │       │shared │
             │ a │          │ C │ D │  ┌─┴───┴─┐    │ state │
             └───┘          └───┘───┘  │  msg   │    └───────┘
                                       │  bus   │
 1 loop      Parent +      Stage by    │       │    N peers,
 1 context   child tasks   stage       └───────┘    emergent
                                       Explicit      behavior
                                       roles
```

**Agent đơn lẻ** - một vòng lặp, một prompt. Tốt cho các tác vụ đơn giản.

**Các agent con** - một agent cha tạo các agent con cho các tác vụ con tập trung. Agent cha duy trì kế hoạch. Các agent con báo cáo lại. Đây là những gì Claude Code làm.

**Pipeline** - các agent chạy theo trình tự. Đầu ra của Agent A trở thành đầu vào của Agent B. Tốt cho các quy trình theo giai đoạn: nghiên cứu -> mã -> xem xét -> kiểm thử.

**Nhóm** - các agent chạy song song với một bus thông điệp dùng chung. Mỗi agent có một vai trò. Một bộ điều phối phối hợp. Tốt khi các kỹ năng khác nhau được cần đồng thời.

**Bầy đàn** - nhiều agent giống hệt hoặc gần giống hệt nhau với trạng thái dùng chung. Không có bộ điều phối cố định. Các agent nhận công việc từ một hàng đợi. Tốt cho các tác vụ song song có thông lượng cao.

### The Four Multi-Agent Patterns

#### Pattern 1: Pipeline

```
Input ──▶ Agent A ──▶ Agent B ──▶ Agent C ──▶ Output
          (research)  (code)      (review)
```

Mỗi agent biến đổi dữ liệu và chuyển nó về phía trước. Đơn giản để suy luận. Thất bại ở một giai đoạn chặn phần còn lại.

#### Pattern 2: Fan-out / Fan-in

```
                ┌──▶ Agent A ──┐
                │              │
Input ──▶ Split ├──▶ Agent B ──├──▶ Merge ──▶ Output
                │              │
                └──▶ Agent C ──┘
```

Chia công việc giữa các agent song song, rồi hợp nhất kết quả. Tốt cho các tác vụ phân rã thành các tác vụ con độc lập.

#### Pattern 3: Orchestrator-Worker

```
                    ┌──────────┐
                    │  Orch.   │
                    └──┬───┬───┘
                  task │   │ task
                 ┌─────┘   └─────┐
                 ▼               ▼
           ┌──────────┐   ┌──────────┐
           │ Worker A │   │ Worker B │
           └──────────┘   └──────────┘
```

Một bộ điều phối thông minh quyết định làm gì, giao việc cho các worker, và tổng hợp kết quả. Bản thân bộ điều phối là một agent có các công cụ để tạo worker.

#### Pattern 4: Peer Swarm

```
         ┌───┐ ◄──── msg ────▶ ┌───┐
         │ A │                  │ B │
         └─┬─┘                  └─┬─┘
           │                      │
      msg  │    ┌───────────┐     │ msg
           └───▶│  Shared   │◄────┘
                │  State    │
           ┌───▶│  / Queue  │◄────┐
           │    └───────────┘     │
      msg  │                      │ msg
         ┌─┴─┐                  ┌─┴─┐
         │ C │ ◄──── msg ────▶ │ D │
         └───┘                  └───┘
```

Không có bộ điều phối trung tâm. Các agent giao tiếp ngang hàng. Các quyết định nảy sinh từ tương tác. Khó gỡ lỗi hơn, nhưng mở rộng tới nhiều agent.

### When NOT to Use Multi-Agent

Đa agent bổ sung độ phức tạp. Mỗi thông điệp giữa các agent là một điểm lỗi tiềm năng. Gỡ lỗi chuyển từ “đọc một cuộc hội thoại” sang “theo dấu các thông điệp qua năm agent.”

**Giữ một agent đơn lẻ khi:**
- Tác vụ vừa trong một cửa sổ ngữ cảnh (dưới ~100k token dữ liệu làm việc)
- Bạn không cần các prompt hệ thống khác nhau cho các giai đoạn khác nhau
- Thực thi tuần tự đủ nhanh
- Tác vụ đủ đơn giản để việc chia nó tạo ra nhiều chi phí phụ hơn giá trị

**Chi phí độ phức tạp:**
- Mỗi ranh giới agent là một bước nén mất mát: ngữ cảnh đầy đủ của agent A được tóm tắt thành một thông điệp cho agent B
- Logic phối hợp (ai làm gì, khi nào, theo thứ tự nào) tự nó là một nguồn lỗi
- Độ trễ tăng: N agent có nghĩa là tối thiểu N lệnh gọi LLM nối tiếp, nhiều hơn nếu chúng cần nói qua lại
- Chi phí nhân lên: mỗi agent đốt token độc lập

Quy tắc kinh nghiệm: nếu một tác vụ cần ít hơn 20 lệnh gọi công cụ và vừa trong 100k token, giữ nó ở một agent đơn lẻ.

```figure
swarm-messages
```

## Build It

### Step 1: The Overloaded Single Agent

Đây là một agent đơn lẻ cố làm mọi thứ. Nó có một prompt hệ thống khổng lồ và một cửa sổ ngữ cảnh chứa nghiên cứu, mã, và các bản xem xét:

```typescript
type AgentResult = {
  content: string;
  tokensUsed: number;
  toolCalls: number;
};

async function singleAgentApproach(task: string): Promise<AgentResult> {
  const systemPrompt = `You are a full-stack developer. You must:
1. Research the requirements
2. Write the code
3. Review the code for bugs
4. Write tests
Do ALL of these in a single conversation.`;

  const contextWindow: string[] = [];
  let totalTokens = 0;
  let totalToolCalls = 0;

  const research = await fakeLLMCall(systemPrompt, `Research: ${task}`);
  contextWindow.push(research.output);
  totalTokens += research.tokens;
  totalToolCalls += research.calls;

  const code = await fakeLLMCall(
    systemPrompt,
    `Given this research:\n${contextWindow.join("\n")}\n\nNow write code for: ${task}`
  );
  contextWindow.push(code.output);
  totalTokens += code.tokens;
  totalToolCalls += code.calls;

  const review = await fakeLLMCall(
    systemPrompt,
    `Given all previous context:\n${contextWindow.join("\n")}\n\nReview the code.`
  );
  contextWindow.push(review.output);
  totalTokens += review.tokens;
  totalToolCalls += review.calls;

  return {
    content: contextWindow.join("\n---\n"),
    tokensUsed: totalTokens,
    toolCalls: totalToolCalls,
  };
}
```

Các vấn đề với cách tiếp cận này:
- Cửa sổ ngữ cảnh tăng với mỗi giai đoạn. Đến bước xem xét, nó chứa ghi chú nghiên cứu VÀ mã VÀ suy luận trước đó.
- Prompt hệ thống chung chung. Nó không thể được điều chỉnh cho mỗi giai đoạn.
- Không có gì chạy song song.

### Step 2: Specialist Agents

Bây giờ chia nó. Mỗi agent nhận một công việc:

```typescript
type SpecialistAgent = {
  name: string;
  systemPrompt: string;
  run: (input: string) => Promise<AgentResult>;
};

function createSpecialist(name: string, systemPrompt: string): SpecialistAgent {
  return {
    name,
    systemPrompt,
    run: async (input: string) => {
      const result = await fakeLLMCall(systemPrompt, input);
      return {
        content: result.output,
        tokensUsed: result.tokens,
        toolCalls: result.calls,
      };
    },
  };
}

const researcher = createSpecialist(
  "researcher",
  "You are a technical researcher. Read documentation, find patterns, and summarize findings. Output only the facts needed for implementation."
);

const coder = createSpecialist(
  "coder",
  "You are a senior TypeScript developer. Given requirements and research notes, write clean, tested code. Nothing else."
);

const reviewer = createSpecialist(
  "reviewer",
  "You are a code reviewer. Find bugs, security issues, and logic errors. Be specific. Cite line numbers."
);
```

Mỗi chuyên gia có một prompt tập trung. Mỗi agent nhận một cửa sổ ngữ cảnh sạch chỉ với đầu vào nó cần.

### Step 3: Coordinate Through Messages

Kết nối các chuyên gia với nhau bằng truyền thông điệp tường minh:

```typescript
type AgentMessage = {
  from: string;
  to: string;
  content: string;
  timestamp: number;
};

async function multiAgentApproach(task: string): Promise<AgentResult> {
  const messages: AgentMessage[] = [];
  let totalTokens = 0;
  let totalToolCalls = 0;

  const researchResult = await researcher.run(task);
  messages.push({
    from: "researcher",
    to: "coder",
    content: researchResult.content,
    timestamp: Date.now(),
  });
  totalTokens += researchResult.tokensUsed;
  totalToolCalls += researchResult.toolCalls;

  const coderInput = messages
    .filter((m) => m.to === "coder")
    .map((m) => `[From ${m.from}]: ${m.content}`)
    .join("\n");

  const codeResult = await coder.run(coderInput);
  messages.push({
    from: "coder",
    to: "reviewer",
    content: codeResult.content,
    timestamp: Date.now(),
  });
  totalTokens += codeResult.tokensUsed;
  totalToolCalls += codeResult.toolCalls;

  const reviewerInput = messages
    .filter((m) => m.to === "reviewer")
    .map((m) => `[From ${m.from}]: ${m.content}`)
    .join("\n");

  const reviewResult = await reviewer.run(reviewerInput);
  messages.push({
    from: "reviewer",
    to: "orchestrator",
    content: reviewResult.content,
    timestamp: Date.now(),
  });
  totalTokens += reviewResult.tokensUsed;
  totalToolCalls += reviewResult.toolCalls;

  return {
    content: messages.map((m) => `[${m.from} -> ${m.to}]: ${m.content}`).join("\n\n"),
    tokensUsed: totalTokens,
    toolCalls: totalToolCalls,
  };
}
```

Mỗi agent chỉ nhận các thông điệp được gửi tới nó. Không ô nhiễm ngữ cảnh. 50k token đọc tài liệu của nhà nghiên cứu không bao giờ đi vào ngữ cảnh của người xem xét.

### Step 4: Compare

```typescript
async function compare() {
  const task = "Build a rate limiter middleware for an Express.js API";

  console.log("=== Single Agent ===");
  const single = await singleAgentApproach(task);
  console.log(`Tokens: ${single.tokensUsed}`);
  console.log(`Tool calls: ${single.toolCalls}`);

  console.log("\n=== Multi-Agent ===");
  const multi = await multiAgentApproach(task);
  console.log(`Tokens: ${multi.tokensUsed}`);
  console.log(`Tool calls: ${multi.toolCalls}`);
}
```

Phiên bản đa agent sử dụng nhiều token tổng cộng hơn (ba agent, ba lệnh gọi LLM riêng biệt) nhưng ngữ cảnh của mỗi agent vẫn sạch. Chất lượng của mỗi giai đoạn cải thiện vì prompt hệ thống được chuyên biệt hóa.

## Use It

Bài này tạo ra một prompt có thể tái sử dụng để quyết định khi nào chuyển sang đa agent. Xem `outputs/prompt-multi-agent-decision.md`.

## Exercises

1. Thêm một chuyên gia thứ tư: một agent “kiểm thử” nhận mã từ người viết mã và phản hồi xem xét từ người xem xét, rồi viết kiểm thử
2. Sửa pipeline để người xem xét có thể gửi phản hồi trở lại người viết mã cho một vòng lặp sửa đổi (tối đa 2 vòng)
3. Chuyển pipeline tuần tự thành một fan-out: chạy nhà nghiên cứu và một agent “phân tích yêu cầu” song song, rồi hợp nhất các đầu ra trước khi chuyển tới người viết mã

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Swarm (Bầy đàn) | “Một trí óc tổ ong của các agent AI” | Một tập agent ngang hàng với trạng thái dùng chung và không có lãnh đạo cố định. Hành vi nảy sinh từ các tương tác cục bộ. |
| Orchestrator (Bộ điều phối) | “Agent sếp” | Một agent có các công cụ bao gồm tạo và quản lý các agent khác. Nó lập kế hoạch và giao việc nhưng có thể không làm công việc thực tế. |
| Coordinator (Bộ phối hợp) | “Cảnh sát giao thông” | Một thành phần không phải agent (thường chỉ là mã, không phải LLM) định tuyến các thông điệp giữa các agent dựa trên quy tắc. |
| Consensus (Đồng thuận) | “Các agent đồng ý” | Một giao thức mà nhiều agent phải đạt thỏa thuận trước khi tiếp tục. Được dùng khi các đầu ra xung đột cần được giải quyết. |
| Emergent behavior (Hành vi nổi lên) | “Các agent tự tìm ra” | Các mẫu cấp hệ thống nảy sinh từ tương tác agent nhưng không được lập trình tường minh. Có thể hữu ích hoặc có hại. |
| Fan-out / fan-in | “Map-reduce cho agent” | Chia một tác vụ giữa các agent song song (fan-out), rồi kết hợp các kết quả của chúng (fan-in). |
| Message passing (Truyền thông điệp) | “Các agent nói chuyện với nhau” | Cơ chế giao tiếp giữa các agent: dữ liệu có cấu trúc được gửi từ agent này sang agent khác, thay thế các cửa sổ ngữ cảnh dùng chung. |

## Further Reading

- [The Landscape of Emerging AI Agent Architectures](https://arxiv.org/abs/2409.02977) - khảo sát các mẫu đa agent
- [AutoGen: Enabling Next-Gen LLM Applications](https://arxiv.org/abs/2308.08155) - framework hội thoại đa agent của Microsoft
- [Claude Code subagents documentation](https://docs.anthropic.com/en/docs/claude-code) - cách Claude Code giao việc với Task
- [CrewAI documentation](https://docs.crewai.com/) - framework đa agent dựa trên vai trò
