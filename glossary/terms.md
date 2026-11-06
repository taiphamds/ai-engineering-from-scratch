# AI Engineering Glossary

Hãy dùng bảng thuật ngữ này khi một bài học, bài báo, thẻ mô hình hoặc lượt rà soát mã giới thiệu một thuật ngữ nhanh hơn tốc độ giải thích nó. Hãy tìm theo thuật ngữ chính xác hoặc bí danh, đọc định nghĩa trực tiếp trước, sau đó dùng ghi chú thực tiễn để kết nối thuật ngữ với một hệ thống bạn có thể xây dựng.

Mỗi mục thuộc một danh mục học tập. `Related terms` đưa ra các khái niệm hữu ích tiếp theo mà không ép buộc một lộ trình cố định. Các định nghĩa mô tả ý nghĩa phổ biến trong kỹ thuật, nhưng hành vi cụ thể của từng nhà cung cấp có thể khác nhau. Khi hợp đồng API hoặc thẻ mô hình không đồng nhất với định nghĩa chung, tài liệu chính thức hiện hành sẽ được ưu tiên.

Mười hai danh mục là: Toán học & huấn luyện; Mô hình & suy luận; Dữ liệu & biểu diễn; Truy xuất & tạo sinh; Prompt & ngữ cảnh; Agent & công cụ; Đánh giá & an toàn; Phát triển AI-native; Hạ tầng & phục vụ; Độ tin cậy & vận hành; Bảo mật & quản trị; Hệ thống đa phương thức.

## A

### Activation Checkpointing
- **Danh mục:** Toán học & huấn luyện
- **Ý nghĩa thực tế:** Một kỹ thuật tiết kiệm bộ nhớ khi huấn luyện, chỉ lưu các activation được chọn trong lượt truyền xuôi và tính toán lại những activation bị bỏ qua trong quá trình lan truyền ngược.
- **Vì sao quan trọng:** Kỹ thuật này cho phép bạn huấn luyện các mô hình hoặc chuỗi lớn hơn trong một ngân sách bộ nhớ cố định bằng cách đánh đổi thêm tính toán để giảm dung lượng lưu activation.
- **Trong thực tế:** Đặt checkpoint cho các khối transformer tốn nhiều bộ nhớ, đo thời gian tăng thêm cho mỗi bước và giữ checkpoint khôi phục riêng biệt với các thiết lập tính toán lại activation.
- **Nhầm lẫn thường gặp:** Activation checkpointing không phải checkpoint huấn luyện bền vững. Nó giúp một lượt truyền xuôi và truyền ngược vừa bộ nhớ nhưng không thể tiếp tục một lần chạy bị lỗi.
- **Thuật ngữ liên quan:** Autograd, Backpropagation, Checkpoint, Mixed Precision
- **Nguồn:** [Training Deep Nets with Sublinear Memory Cost](https://arxiv.org/abs/1604.06174)

### Activation Function
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Phép toán phi tuyến giữa các lớp.
- **Ý nghĩa thực tế:** Một hàm được áp dụng sau lớp tuyến tính hoặc affine để đưa tính phi tuyến vào. Nếu không có nó, việc hợp thành các lớp với trọng số và độ lệch sẽ rút gọn thành một phép biến đổi affine duy nhất. ReLU, GELU và SiLU là những lựa chọn phổ biến. Lựa chọn này ảnh hưởng trực tiếp đến việc gradient có lan truyền trong quá trình huấn luyện hay không.
- **Học nội dung này:** [Activation Functions](../phases/03-deep-learning-core/04-activation-functions/)
- **Thuật ngữ liên quan:** ReLU, Gradient, Backpropagation

### Adam (Optimizer)
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Bộ tối ưu hóa mà bạn dùng mà không cần suy nghĩ.
- **Ý nghĩa thực tế:** Adaptive Moment Estimation. Nó kết hợp trung bình theo hàm mũ của gradient với trung bình theo hàm mũ của gradient bình phương, áp dụng hiệu chỉnh độ lệch và điều chỉnh tỷ lệ cập nhật theo từng tham số. Đây là một mốc cơ sở hữu ích, nhưng vẫn cần tốc độ học và lịch trình phù hợp.
- **Nhầm lẫn thường gặp:** Adam là một mốc cơ sở mạnh, không phải bộ tối ưu hóa tốt nhất trong mọi trường hợp.
- **Nguồn:** [Adam paper](https://arxiv.org/abs/1412.6980)
- **Thuật ngữ liên quan:** AdamW, Optimizer, Learning Rate

### AdamW
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Adam với weight decay được sửa lại.
- **Ý nghĩa thực tế:** Một biến thể của Adam tách weight decay khỏi cập nhật tham số dựa trên gradient. Điều đó giúp dễ lý giải hành vi co nhỏ hơn so với việc cộng một khoản phạt L2 vào gradient được điều chỉnh thích nghi của Adam.
- **Nhầm lẫn thường gặp:** Weight decay tách rời không khiến AdamW trở thành lựa chọn tối ưu trong mọi trường hợp. Mô hình, dữ liệu và quy mô huấn luyện vẫn quyết định bộ tối ưu hóa và lịch trình tốt nhất.
- **Nguồn:** [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101)
- **Thuật ngữ liên quan:** Adam (Optimizer), Weight Decay, Optimizer

### Admission Control
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Một cổng trước khi chấp nhận, quyết định liệu một yêu cầu có thể đi vào hàng đợi có giới hạn hoặc dịch vụ dựa trên năng lực, mức ưu tiên và chính sách hiện tại của hệ thống hay không.
- **Vì sao quan trọng:** Từ chối công việc vượt mức tại một ranh giới được kiểm soát sẽ bảo vệ các yêu cầu đã được chấp nhận khỏi hàng đợi phình to, chuỗi timeout và cạn kiệt tài nguyên.
- **Trong thực tế:** Ước tính chi phí của yêu cầu, kiểm tra năng lực của tenant và hệ thống, dành ngân sách cần thiết một cách nguyên tử, đồng thời xác định phạm vi đang quá tải khi từ chối. Chỉ đưa ra hướng dẫn thử lại khi điều kiện là tạm thời và ngân sách thử lại của bên gọi cho phép thêm lần thử.
- **Nhầm lẫn thường gặp:** Admission control hoạt động trước khi chấp nhận. Load shedding có thể từ chối hoặc loại bỏ công việc tại điểm vào, trong hàng đợi, ở các dependency hoặc tại những ranh giới quá tải khác.
- **Thuật ngữ liên quan:** Load Shedding, Backpressure, Rate Limit, Saturation
- **Nguồn:** [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/)

### Agent
- **Danh mục:** Agent & công cụ
- **Mọi người thường nói:** Một mô hình tự chủ, tự suy nghĩ và hành động.
- **Ý nghĩa thực tế:** Một hệ thống phần mềm cho phép mô hình chọn hành động hướng đến mục tiêu, quan sát kết quả từ công cụ hoặc môi trường và tiếp tục theo chính sách điều phối. Agent có thể dùng vòng lặp, máy trạng thái, công cụ quy trình làm việc hoặc phê duyệt của con người. Mô hình là một thành phần, không phải toàn bộ hệ thống.
- **Vì sao quan trọng:** Độ tin cậy đến từ harness, hợp đồng công cụ, trạng thái, quyền hạn và cơ chế xác minh xung quanh mô hình.
- **Trong thực tế:** Một coding agent đọc ngữ cảnh của kho mã, đề xuất bản vá, chạy kiểm thử trong sandbox và dừng để chờ phê duyệt trước khi triển khai.
- **Nhầm lẫn thường gặp:** Tính tự chủ là một mức độ quyền hạn được ủy thác, không phải thuộc tính bắt buộc của mọi agent.
- **Học nội dung này:** [The Agent Loop](../phases/14-agent-engineering/01-the-agent-loop/)
- **Thuật ngữ liên quan:** Agent Harness, Agent State, Tool Contract, Human-in-the-Loop (HITL)

### Agent Harness
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Môi trường chạy xung quanh mô hình, có nhiệm vụ tập hợp ngữ cảnh, cung cấp công cụ, quản lý trạng thái, thực thi giới hạn, ghi lại trace và quyết định khi nào agent nên tiếp tục, thử lại, hỏi hoặc dừng.
- **Vì sao quan trọng:** Hai hệ thống dùng cùng một mô hình có thể hoạt động rất khác nhau vì harness cung cấp ngữ cảnh, công cụ, phản hồi và ranh giới an toàn khác nhau.
- **Trong thực tế:** Harness của bạn có thể giới hạn agent ở năm lần gọi công cụ, lưu checkpoint sau mỗi bản vá được chấp nhận và yêu cầu lệnh kiểm thử chạy thành công trước khi hoàn tất.
- **Nhầm lẫn thường gặp:** Harness rộng hơn một mẫu prompt và hẹp hơn toàn bộ sản phẩm.
- **Học nội dung này:** [Minimal Agent Workbench](../phases/14-agent-engineering/32-minimal-agent-workbench/)
- **Thuật ngữ liên quan:** Agent, Tool Contract, Agent State, Verification Gate, Sandbox

### Agent Memory
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Thông tin được lưu bên ngoài mô hình và được chọn để dùng trong các bước agent sau này, chẳng hạn quyết định trước đó, sở thích người dùng, các diễn tiến của tác vụ hoặc dữ kiện đã xác minh.
- **Vì sao quan trọng:** Nó giúp agent duy trì tính liên tục vượt ra ngoài một cửa sổ ngữ cảnh mà không buộc phải đưa mọi sự kiện trong quá khứ vào từng prompt.
- **Trong thực tế:** Lưu kết quả tác vụ ngắn gọn kèm nguồn gốc, chỉ truy xuất khi có liên quan và cho phép người dùng xem hoặc sửa thông tin cá nhân được lưu bền vững.
- **Nhầm lẫn thường gặp:** Bộ nhớ agent không giống trạng thái agent. Trạng thái theo dõi lần chạy hiện tại; bộ nhớ giữ lại thông tin được chọn để có thể dùng trong các lần chạy sau.
- **Thuật ngữ liên quan:** Agent State, Context Engineering, Checkpoint, Semantic Cache
- **Nguồn:** [Generative Agents](https://arxiv.org/abs/2304.03442)

### Agent State
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Dữ liệu tường minh mà agent mang theo qua các bước, chẳng hạn mục tiêu hiện tại, hành động đã hoàn thành, kết quả công cụ, câu hỏi còn mở, ngân sách, phê duyệt và tham chiếu đến hiện vật.
- **Vì sao quan trọng:** Trạng thái tường minh giúp các tác vụ dài có thể tiếp tục, kiểm tra được và ít phụ thuộc hơn vào việc mô hình dựng lại tiến độ từ bản ghi hội thoại.
- **Trong thực tế:** Lưu vấn đề đã chọn, các tệp đã thay đổi, kết quả kiểm thử mới nhất và những bước kiểm tra còn lại trong một đối tượng có kiểu dữ liệu, được cập nhật sau mỗi hành động.
- **Nhầm lẫn thường gặp:** Trạng thái không giống lịch sử hội thoại. Bản ghi hội thoại là bằng chứng; trạng thái là hồ sơ vận hành cô đọng được dùng để quyết định việc tiếp theo.
- **Học nội dung này:** [Repository Memory and State](../phases/14-agent-engineering/34-repo-memory-and-state/)
- **Thuật ngữ liên quan:** Checkpoint, Durable Execution, Context Engineering, Handoff

### Agent Skill
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Một thư mục chứa hướng dẫn quy trình có thể được khám phá, với tệp điểm vào là `SKILL.md` và tùy chọn có các tài liệu tham khảo, script, tài nguyên mà một môi trường chạy tương thích có thể tải theo từng giai đoạn.
- **Vì sao quan trọng:** Nó đóng gói kiến thức tác vụ có thể tái sử dụng, tách biệt khỏi một cuộc hội thoại, đồng thời giữ cho ngữ cảnh chuyên sâu và các công cụ hỗ trợ có tính xác định luôn sẵn dùng khi cần.
- **Trong thực tế:** Công bố tên ngắn gọn cùng mô tả định tuyến, chỉ tải quy trình làm việc sau khi được kích hoạt và đọc tài liệu tham khảo theo nhánh khi tác vụ đi đến bước tương ứng.
- **Nhầm lẫn thường gặp:** Kích hoạt một skill sẽ cung cấp ngữ cảnh. Việc đó không cung cấp công cụ, cấp quyền, tạo sandbox hay chứng minh rằng kết quả công việc là chính xác.
- **Học nội dung này:** [Agent Skills: Portable Contract and Runtime Boundary](../phases/13-tools-and-protocols/22-skills-and-agent-sdks/)
- **Thuật ngữ liên quan:** Skill Bundle, Skill Catalog, Skill Invocation, Progressive Disclosure, MCP (Model Context Protocol)
- **Nguồn:** [Agent Skills specification](https://agentskills.io/specification)

### AI Risk Assessment
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Một phân tích được ghi chép về cách hệ thống AI có thể ảnh hưởng đến con người, tổ chức và môi trường, bao gồm bối cảnh, mối nguy, khả năng xảy ra, tác động, biện pháp kiểm soát, rủi ro còn lại và trách nhiệm giám sát.
- **Vì sao quan trọng:** Chỉ riêng năng lực mô hình không quyết định rủi ro. Bối cảnh triển khai, các nhóm bị ảnh hưởng, thẩm quyền của con người, dữ liệu và tích hợp hệ thống đều làm thay đổi tác hại cũng như biện pháp kiểm soát cần thiết.
- **Trong thực tế:** Xác định mục đích sử dụng và các bên bị ảnh hưởng, nhận diện những kịch bản lỗi và sử dụng sai có cơ sở, giao người phụ trách các biện pháp kiểm soát, ghi lại rủi ro còn lại và đặt điều kiện rà soát khi có thay đổi trọng yếu.
- **Nhầm lẫn thường gặp:** Đánh giá rủi ro hỗ trợ một quyết định dựa trên các giả định đã nêu. Đây không phải chứng nhận an toàn một lần duy nhất hay bằng chứng rằng mọi mối nguy đều đã được phát hiện.
- **Thuật ngữ liên quan:** Threat Model, Guardrails, Human-in-the-Loop (HITL), Data Classification
- **Nguồn:** [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

### Alignment
- **Danh mục:** Đánh giá & an toàn
- **Mọi người thường nói:** Làm cho AI an toàn.
- **Ý nghĩa thực tế:** Nỗ lực khiến mô hình hoặc hệ thống AI hành xử theo những cách phù hợp với các mục tiêu, ràng buộc dự kiến và sở thích của con người trong cả tình huống được dự liệu lẫn đối kháng.
- **Vì sao quan trọng:** Hệ thống có thể tối ưu chỉ số được nêu ra nhưng vẫn vi phạm ý định thực sự của người dùng, vì vậy alignment cần có đánh giá, giám sát và kiểm soát hệ thống bên cạnh huấn luyện mô hình.
- **Thuật ngữ liên quan:** Guardrails, Evaluation (Eval), Human-in-the-Loop (HITL)

### Approval Gate
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Một điểm kiểm soát chặn hành động có hệ quả cho đến khi người có thẩm quyền hoặc chính sách cấp phép.
- **Vì sao quan trọng:** Nó giới hạn phạm vi ảnh hưởng của các quyết định chưa chắc chắn từ mô hình, đồng thời vẫn tự động hóa những công việc có thể đảo ngược.
- **Trong thực tế:** Cho phép agent soạn bản di trú cơ sở dữ liệu và chạy thử trên cơ sở dữ liệu dùng một lần, nhưng yêu cầu người phụ trách phê duyệt mọi lần thực thi trên môi trường sản xuất.
- **Nhầm lẫn thường gặp:** Cổng phê duyệt hỏi liệu hành động có được cho phép hay không. Cổng xác minh hỏi liệu bằng chứng có cho thấy hành động là chính xác hay không.
- **Học nội dung này:** [Verification Gates](../phases/14-agent-engineering/38-verification-gates/)
- **Thuật ngữ liên quan:** Human-in-the-Loop (HITL), Verification Gate, Least Privilege

### Approximate Nearest Neighbor (ANN)
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Một phương pháp tìm kiếm trả về các vector có khả năng nằm trong số những vector gần nhất với truy vấn mà không cần so sánh đầy đủ truy vấn với mọi vector được lưu trữ.
- **Vì sao quan trọng:** Phép xấp xỉ giúp các chỉ mục vector lớn trở nên khả thi, nhưng tạo ra sự đánh đổi có thể đo lường giữa tốc độ tìm kiếm, bộ nhớ và độ bao phủ truy xuất.
- **Trong thực tế:** Tinh chỉnh tham số chỉ mục và tìm kiếm trên tập truy vấn giữ lại, sau đó báo cáo độ trễ cùng Recall@K thay vì giả định rằng mọi láng giềng thực sự đều được tìm thấy.
- **Nhầm lẫn thường gặp:** ANN mô tả mục tiêu và sự đánh đổi của việc tìm kiếm, còn HNSW là một thuật toán chỉ mục cụ thể có thể triển khai mục tiêu đó.
- **Thuật ngữ liên quan:** Vector Database, HNSW, Cosine Similarity, Recall@K
- **Nguồn:** [Efficient and Robust Approximate Nearest Neighbor Search Using HNSW](https://dl.acm.org/doi/10.1109/TPAMI.2018.2889473)

### Attention
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Cách mô hình tập trung vào các token quan trọng.
- **Ý nghĩa thực tế:** Một cơ chế tạo biểu diễn theo ngữ cảnh bằng cách so sánh vector truy vấn với vector khóa, chuẩn hóa các điểm số thu được và dùng chúng để kết hợp vector giá trị. Mask, quy tắc vị trí hoặc mẫu thưa có thể giới hạn những vị trí tham gia.
- **Vì sao quan trọng:** Attention cho phép mô hình định tuyến thông tin giữa các vị trí trong chuỗi, nhưng tự nó không giải thích hay chứng minh điều mô hình đã hiểu.
- **Nhầm lẫn thường gặp:** Trọng số attention là hệ số tính toán, không phải lời giải thích trung thực cho quá trình suy luận của mô hình.
- **Học nội dung này:** [Self-Attention from Scratch](../phases/07-transformers-deep-dive/02-self-attention-from-scratch/)
- **Nguồn:** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- **Thuật ngữ liên quan:** Self-Attention, Transformer, KV Cache

### Audio Token
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một mã định danh rời rạc do codec hoặc bộ token hóa âm thanh tạo ra cho một đoạn ngắn hoặc đặc trưng của tín hiệu âm thanh, đôi khi trải trên nhiều codebook.
- **Vì sao quan trọng:** Biểu diễn âm thanh rời rạc cho phép mô hình chuỗi xử lý, dự đoán, lưu trữ hoặc tạo âm thanh bằng kiến trúc hướng token.
- **Trong thực tế:** Phiên bản hóa codec cùng mô hình, giữ lại metadata về tần số lấy mẫu và codebook, đo chất lượng tái tạo, đồng thời phân biệt token âm thanh ngữ nghĩa với token nén dạng sóng.
- **Nhầm lẫn thường gặp:** Audio token không tương ứng với một khoảng thời lượng, âm vị hay từ cố định. Ý nghĩa và khoảng thời gian của nó phụ thuộc vào thiết kế bộ token hóa và codebook.
- **Học nội dung này:** [Neural Audio Codecs](../phases/06-speech-and-audio/13-neural-audio-codecs/)
- **Thuật ngữ liên quan:** Token, Embedding, Automatic Speech Recognition (ASR), Multimodal Model
- **Nguồn:** [SoundStream](https://arxiv.org/abs/2107.03312)

### Audit Log
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Bản ghi bền vững, được kiểm soát truy cập, về các sự kiện liên quan đến bảo mật hoặc trách nhiệm giải trình, bao gồm ai hoặc thứ gì đã hành động, điều gì thay đổi, thời điểm diễn ra và trạng thái kết quả.
- **Vì sao quan trọng:** Hành động có hệ quả của agent cần bằng chứng hỗ trợ điều tra, rà soát chính sách và xác định trách nhiệm, vượt ra ngoài việc gỡ lỗi hiệu suất.
- **Trong thực tế:** Ghi lại việc cấp quyền cho công cụ, quyết định phê duyệt, thao tác ghi ra bên ngoài, phiên bản chính sách và mã định danh hiện vật; đồng thời che giấu bí mật và giới hạn quyền truy cập nhật ký.
- **Nhầm lẫn thường gặp:** Trace giúp chẩn đoán một đường thực thi. Audit log lưu giữ sự kiện cần thiết cho trách nhiệm giải trình qua nhiều lần thực thi và theo thời gian.
- **Thuật ngữ liên quan:** Trace, Observability, Approval Gate, Provenance Attestation
- **Nguồn:** [NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final)

### Autograd
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Gradient tự động.
- **Ý nghĩa thực tế:** Một hệ thống ghi lại hoặc biến đổi các phép toán tensor để tính đạo hàm, thường bằng vi phân tự động chế độ ngược. Bạn viết phép tính truyền xuôi và framework suy ra các gradient cần thiết cho backpropagation.
- **Học nội dung này:** [Chain Rule and Automatic Differentiation](../phases/01-math-foundations/05-chain-rule-and-autodiff/)
- **Thuật ngữ liên quan:** Backpropagation, Gradient, Tensor

### Automatic Speech Recognition (ASR)
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Tác vụ và quy trình hệ thống ánh xạ tín hiệu lời nói thành bản chép lời, thường có thêm thông tin tùy chọn về thời gian của token hoặc đoạn và độ tin cậy.
- **Vì sao quan trọng:** Giao diện giọng nói phụ thuộc vào nhiều yếu tố hơn mô hình ngôn ngữ. Biến thiên âm học, phân đoạn, giải mã, từ vựng và điều kiện miền đều ảnh hưởng đến bản chép lời cuối cùng.
- **Trong thực tế:** Đánh giá lỗi từ hoặc ký tự theo ngôn ngữ, người nói, nhiễu và miền; giữ lại dấu thời gian khi việc grounding ở các bước sau cần đến chúng, đồng thời kiểm thử chính xác quy trình tiền xử lý âm thanh được dùng trong môi trường sản xuất.
- **Nhầm lẫn thường gặp:** ASR chép lại điều đã được nói. Xác định ai đã nói cần diarization hoặc nhận dạng người nói, còn dịch thuật và hiểu ý định là các tác vụ riêng.
- **Học nội dung này:** [Speech Recognition and ASR](../phases/06-speech-and-audio/04-speech-recognition-asr/)
- **Thuật ngữ liên quan:** Audio Token, Encoder, Tokenization, Multimodal Model
- **Nguồn:** [Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf)

### Autoregressive
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Mô hình tạo từng từ một.
- **Ý nghĩa thực tế:** Một phép phân tích thừa số trong đó mỗi token đầu ra được dự đoán từ các token đứng trước nó. Trong quá trình tạo sinh, token được chọn được nối vào chuỗi và trở thành một phần ngữ cảnh cho lần dự đoán tiếp theo.
- **Nhầm lẫn thường gặp:** Đơn vị ở đây là token, không nhất thiết là từ; quá trình tạo sinh cũng có thể dùng các phương pháp giải mã khác thay vì luôn chọn token có xác suất cao nhất.
- **Thuật ngữ liên quan:** Token, Temperature, KV Cache

### Autoscaling
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Một vòng lặp điều khiển thay đổi số lượng hoặc năng lực của các worker phục vụ dựa trên nhu cầu quan sát được, mức sử dụng tài nguyên hoặc chỉ số ứng dụng trong các giới hạn đã cấu hình.
- **Vì sao quan trọng:** Khối lượng công việc AI có thể thay đổi nhanh hơn khả năng cấp phát thủ công, nhưng quyết định mở rộng phải tính đến thời gian tải mô hình, khả năng sẵn có của accelerator, xếp hàng và chi phí yêu cầu.
- **Trong thực tế:** Mở rộng dựa trên tín hiệu nhu cầu gắn với công việc hữu ích, đặt mức năng lực tối thiểu luôn sẵn sàng, giới hạn sự biến động khi giảm quy mô và xác minh rằng replica mới vượt qua kiểm tra sẵn sàng trước khi nhận lưu lượng.
- **Nhầm lẫn thường gặp:** Autoscaling thêm hoặc bỏ năng lực. Nó không làm dependency đang quá tải chạy nhanh hơn và không bảo đảm có thể lấy đủ phần cứng kịp thời.
- **Học nội dung này:** [GPU Autoscaling on Kubernetes](../phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/)
- **Thuật ngữ liên quan:** Model Serving, Saturation, Readiness Probe, Backpressure
- **Nguồn:** [Kubernetes Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

### Availability
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Tỷ lệ tương tác dịch vụ đủ điều kiện hoặc các cửa sổ thời gian mà người dùng có thể nhận được dịch vụ đạt yêu cầu đã xác định trong một ranh giới đo lường được nêu rõ.
- **Vì sao quan trọng:** Dịch vụ có thể vẫn đang chạy trong khi người dùng không thể hoàn thành các yêu cầu hữu ích, vì vậy tính sẵn sàng phải gắn với thành công người dùng nhìn thấy, chứ không chỉ với thời gian tiến trình hoạt động.
- **Trong thực tế:** Xác định sự kiện đủ điều kiện và kết quả chấp nhận được, chỉ loại trừ những trường hợp đã được ghi rõ, tính chỉ số trong một cửa sổ cố định và điều tra cả lỗi toàn phần lẫn suy giảm một phần kéo dài.
- **Nhầm lẫn thường gặp:** Availability là một kết quả về độ tin cậy. Nó không mô tả độ trễ, tính đúng đắn, độ an toàn hay trải nghiệm của mọi nhóm người dùng.
- **Thuật ngữ liên quan:** Service Level Indicator (SLI), Service Level Objective (SLO), Error Budget, Incident Response
- **Nguồn:** [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

## B

### Backpressure
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một cơ chế điều khiển luồng làm chậm hoặc từ chối công việc từ phía trên khi thành phần phía dưới không thể xử lý an toàn với tốc độ hiện tại.
- **Vì sao quan trọng:** Nếu không có backpressure, các lượt chạy agent, lần gọi công cụ hoặc sự kiện truyền luồng được xếp hàng có thể làm cạn bộ nhớ, vượt giới hạn tốc độ và khuếch đại việc thử lại.
- **Trong thực tế:** Khi hàng đợi của bộ đánh giá đạt giới hạn, hãy tạm dừng các tác vụ agent mới hoặc trả về phản hồi cho phép thử lại thay vì chấp nhận lượng công việc không giới hạn.
- **Nhầm lẫn thường gặp:** Backpressure bảo vệ năng lực trước khi xảy ra lỗi. Circuit breaker dừng các lần gọi sau khi lỗi cho thấy dependency không khỏe.
- **Thuật ngữ liên quan:** Rate Limit, Retry with Backoff, Circuit Breaker

### Backpropagation
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Cách mạng nơ-ron học.
- **Ý nghĩa thực tế:** Một cách áp dụng hiệu quả quy tắc dây chuyền, truyền đạo hàm ngược từ một hàm mất mát vô hướng qua đồ thị tính toán. Nó tính gradient; bộ tối ưu hóa dùng các gradient đó để cập nhật tham số.
- **Nhầm lẫn thường gặp:** Backpropagation tính gradient. Nó không chọn quy tắc cập nhật hay tốc độ học.
- **Vì sao có tên gọi này:** Thông tin đạo hàm di chuyển ngược từ hàm mất mát về các phép toán trước đó.
- **Học nội dung này:** [Backpropagation from Scratch](../phases/03-deep-learning-core/03-backpropagation/)
- **Thuật ngữ liên quan:** Autograd, Gradient, Optimizer

### Batch Size
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Có bao nhiêu ví dụ được xử lý cùng lúc.
- **Ý nghĩa thực tế:** Số lượng ví dụ có các giá trị mất mát đóng góp vào một ước lượng gradient trước mỗi lần cập nhật của bộ tối ưu hóa. Batch lớn hơn có thể cải thiện mức sử dụng phần cứng và giảm nhiễu gradient, nhưng cần nhiều bộ nhớ hơn và có thể cần lựa chọn tốc độ học hoặc lịch trình khác.
- **Nhầm lẫn thường gặp:** Không có phạm vi batch size phổ quát hay quy tắc nào nói rằng mỗi lần tăng batch đều phải tăng tốc độ học như nhau.
- **Thuật ngữ liên quan:** Learning Rate, Gradient, Optimizer

### Benchmark Contamination
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Sự trùng lặp hoặc rò rỉ thông tin giữa các ví dụ đánh giá với dữ liệu được dùng để tiền huấn luyện, tinh chỉnh, tạo prompt, lựa chọn hoặc cải thiện hệ thống được đánh giá theo cách khác.
- **Vì sao quan trọng:** Nhiễm bẩn có thể khiến điểm benchmark phản ánh việc đã tiếp xúc trước đó thay vì khả năng khái quát hóa sang tác vụ chưa gặp.
- **Trong thực tế:** Theo dõi nguồn gốc tập dữ liệu, tìm bản sao chính xác và gần giống trong nguồn huấn luyện, giữ lại các trường hợp kiểm thử riêng tư và làm mới các đánh giá công khai bằng ví dụ mới được tạo.
- **Nhầm lẫn thường gặp:** Nhiễm bẩn rộng hơn việc sao chép chính xác. Diễn đạt lại, đáp án, metadata benchmark và việc tinh chỉnh prompt lặp đi lặp lại cũng có thể làm rò rỉ thông tin đánh giá.
- **Thuật ngữ liên quan:** Data Leakage, Data Deduplication, Eval Set, Exact Match (EM)
- **Nguồn:** [Investigating Data Contamination in Modern Benchmarks for Large Language Models](https://arxiv.org/abs/2311.09783)

### BM25
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Một hàm xếp hạng từ vựng chấm điểm tài liệu dựa trên mức độ khớp với các từ trong truy vấn, đồng thời tính đến độ hiếm của từ, số lần lặp lại và độ dài tài liệu.
- **Vì sao quan trọng:** Đây là mốc cơ sở mạnh cho truy xuất thuật ngữ chính xác và bổ trợ cho truy xuất dày đặc đối với mã định danh, từ hiếm và cụm từ đặc thù miền.
- **Trong thực tế:** Truy xuất ứng viên bằng BM25 và tìm kiếm dày đặc, kết hợp thứ hạng của chúng, rồi đánh giá kết quả đã gộp trước khi thêm bộ xếp hạng lại tốn kém hơn.
- **Nhầm lẫn thường gặp:** BM25 không trực tiếp hiểu độ tương đồng ngữ nghĩa và điểm số của nó không có ý nghĩa phổ quát giữa các truy vấn hoặc cấu hình chỉ mục khác nhau.
- **Thuật ngữ liên quan:** Hybrid Retrieval, Dense Retrieval, Reranker, RAG (Retrieval-Augmented Generation)
- **Nguồn:** [The Probabilistic Relevance Framework: BM25 and Beyond](https://doi.org/10.1561/1500000019)

### Byte Pair Encoding (BPE)
- **Danh mục:** Dữ liệu & biểu diễn
- **Ý nghĩa thực tế:** Một phương pháp token hóa từ con, liên tục gộp các đơn vị liền kề xuất hiện thường xuyên để tạo từ vựng cố định từ văn bản huấn luyện.
- **Vì sao quan trọng:** Phương pháp này cân bằng kích thước từ vựng với khả năng biểu diễn từ hiếm hoặc chưa từng thấy thành các đơn vị nhỏ hơn.
- **Trong thực tế:** Chỉ huấn luyện bộ token hóa trên các phần chia tập ngữ liệu đã được phê duyệt, phiên bản hóa quy tắc gộp cùng mô hình và kiểm tra cách nó phân đoạn mã, văn bản đa ngôn ngữ và khoảng trắng.
- **Nhầm lẫn thường gặp:** BPE là một họ bộ token hóa, không phải mô tả phổ quát về cách mọi mô hình tạo token.
- **Thuật ngữ liên quan:** Tokenization, Vocabulary, Token, Embedding
- **Nguồn:** [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)

## C

### Calibration
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Mức độ khớp giữa độ tin cậy mà hệ thống nêu ra với tần suất quan sát được mà các dự đoán ở mức tin cậy đó là chính xác.
- **Vì sao quan trọng:** Hệ thống có thể chính xác trung bình nhưng lại quá tự tin một cách nguy hiểm ở những trường hợp mà mọi người dựa vào điểm số của nó.
- **Trong thực tế:** Chia dự đoán thành các nhóm theo độ tin cậy, so sánh độ tin cậy với độ chính xác thực nghiệm, rồi hiệu chỉnh lại hoặc từ chối trả lời khi khoảng chênh lệch không chấp nhận được.
- **Nhầm lẫn thường gặp:** Calibration đo độ tin cậy của mức tin tưởng, không đo độ chính xác tổng thể, tính đúng sự thật hay chất lượng suy luận.
- **Thuật ngữ liên quan:** Softmax, Evaluation (Eval), Precision & Recall, Logits
- **Nguồn:** [On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html)

### Canary Release
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Một chiến lược triển khai đưa phiên bản mới đến một phần nhỏ lưu lượng hoặc hạ tầng trước khi mở rộng đợt phát hành.
- **Vì sao quan trọng:** Nó giới hạn tác động của lỗi và cung cấp bằng chứng từ môi trường sản xuất trước khi mô hình, prompt, agent hoặc dịch vụ mới đến với tất cả mọi người.
- **Trong thực tế:** Định tuyến một nhóm nhỏ đủ điều kiện sang bản phát hành, so sánh chất lượng và chỉ số vận hành với nhóm đối chứng, rồi dừng hoặc quay lui khi xảy ra lỗi đã định trước.
- **Nhầm lẫn thường gặp:** Canary release giới hạn mức phơi nhiễm; nó không thay thế kiểm thử trước triển khai, phê duyệt hay chuẩn bị quay lui.
- **Thuật ngữ liên quan:** Evaluation (Eval), Observability, Rollback, Verification Gate
- **Nguồn:** [Kubernetes Deployments: Canary Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#canary-deployment)

### Chain of Thought (CoT)
- **Danh mục:** Prompt & ngữ cảnh
- **Mọi người thường nói:** Yêu cầu mô hình trình bày mọi bước suy nghĩ.
- **Ý nghĩa thực tế:** Quá trình suy luận trung gian dùng để chia nhỏ một tác vụ trước khi tạo câu trả lời. Prompt có thể yêu cầu lý giải hiển thị, trong khi một số hệ thống sử dụng suy luận nội bộ không được trả về cho người dùng.
- **Vì sao quan trọng:** Việc chia nhỏ có thể giúp ích cho tác vụ nhiều bước, nhưng một lời giải thích trôi chảy không chứng minh câu trả lời chính xác hay văn bản phản ánh trung thực phép tính nội bộ của mô hình.
- **Trong thực tế:** Yêu cầu một kế hoạch ngắn gọn, kiểm tra độc lập kết quả và yêu cầu phép tính hoặc trích dẫn có thể xác minh thay vì dựa vào bản ghi suy luận dài.
- **Nhầm lẫn thường gặp:** Chain of thought không thay thế công cụ, kiểm thử hay xác minh bên ngoài.
- **Học nội dung này:** [Few-Shot and Chain of Thought](../phases/11-llm-engineering/02-few-shot-cot/)
- **Thuật ngữ liên quan:** Prompt Engineering, Verification Gate, Evaluation (Eval)

### Checkpoint
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Một ảnh chụp bền vững dùng để tiếp tục từ một ranh giới đã biết. Trong quy trình làm việc, nó lưu trạng thái vận hành và tham chiếu hiện vật. Trong huấn luyện mô hình, nó có thể lưu tham số, trạng thái bộ tối ưu hóa, trạng thái bộ lập lịch và vị trí huấn luyện.
- **Vì sao quan trọng:** Quy trình làm việc và lần chạy huấn luyện kéo dài có thể khôi phục sau gián đoạn mà không phải chạy lại phần việc đã hoàn tất hoặc mất tiến độ tốn kém.
- **Trong thực tế:** Lưu bản vá đã được chấp nhận của agent và bằng chứng kiểm thử sau một bước đã xác minh, hoặc lưu trọng số, trạng thái bộ tối ưu hóa, trạng thái ngẫu nhiên và vị trí dữ liệu của lần chạy huấn luyện trước khi dừng.
- **Nhầm lẫn thường gặp:** Checkpoint quy trình làm việc và checkpoint huấn luyện mô hình cùng phục vụ mục tiêu khôi phục nhưng lưu các trạng thái khác nhau. Cả hai đều không chỉ là bản ghi hội thoại hay tệp trọng số không có metadata để tiếp tục.
- **Học nội dung này:** [Checkpoint Save and Resume](../phases/19-capstone-projects/47-checkpoint-save-resume/); [Repository Memory and State](../phases/14-agent-engineering/34-repo-memory-and-state/)
- **Thuật ngữ liên quan:** Agent State, Durable Execution, Parameter, Optimizer

### Chunked Prefill
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Một kỹ thuật phục vụ chia công việc prefill của prompt dài thành các phần nhỏ hơn có thể lập lịch, để quá trình xử lý prompt có thể xen kẽ với công việc giải mã từ các yêu cầu khác.
- **Vì sao quan trọng:** Nếu không, một prompt dài có thể chiếm accelerator và làm chậm các lượt tạo sinh đang hoạt động, gây độ trễ đuôi kém dù tổng thông lượng vẫn có vẻ tốt.
- **Trong thực tế:** Chọn chính sách chia phần dựa trên tải công việc đã đo, tính đến chi phí lập lịch và so sánh mức hoàn tất prefill, độ trễ giải mã cùng goodput khi trộn các độ dài prompt khác nhau.
- **Nhầm lẫn thường gặp:** Chunked prefill thay đổi cách lập lịch tính toán prompt. Nó không chia ngữ cảnh của người dùng thành các phần ngữ nghĩa độc lập và không thay đổi cửa sổ ngữ cảnh của mô hình.
- **Học nội dung này:** [vLLM Serving Internals](../phases/17-infrastructure-and-production/04-vllm-serving-internals/)
- **Thuật ngữ liên quan:** Prefill, Decode Phase, Dynamic Batching, Tail Latency
- **Nguồn:** [Sarathi-Serve](https://arxiv.org/abs/2403.02310)

### Chunking
- **Danh mục:** Truy xuất & tạo sinh
- **Mọi người thường nói:** Chia tài liệu thành từng phần.
- **Ý nghĩa thực tế:** Chia tài liệu nguồn thành các đơn vị có thể truy xuất trước khi lập chỉ mục. Ranh giới chunk, phần chồng lấp, metadata và cấu trúc tài liệu quyết định liệu truy xuất có trả về đủ ngữ cảnh mà không làm prompt ngập thông tin hay không.
- **Vì sao quan trọng:** Chiến lược chunking phù hợp phụ thuộc vào hình dạng tài liệu, loại truy vấn, mô hình embedding và kết quả đánh giá. Không có kích thước token hay tỷ lệ chồng lấp phổ quát.
- **Trong thực tế:** Giữ nguyên tiêu đề và khối mã, gắn metadata nguồn, rồi đo chất lượng truy xuất trên câu hỏi thực tế trước khi tinh chỉnh kích thước.
- **Thuật ngữ liên quan:** RAG (Retrieval-Augmented Generation), Reranker, Grounding

### Circuit Breaker
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một cơ chế kiểm soát độ tin cậy tạm dừng các lần gọi đến dependency sau khi số lỗi vượt ngưỡng, rồi thăm dò xem dependency đã phục hồi hay chưa.
- **Vì sao quan trọng:** Nó ngăn các lỗi lặp đi lặp lại của mô hình hoặc công cụ tiêu tốn độ trễ, ngân sách và năng lực của phần còn lại trong hệ thống.
- **Trong thực tế:** Mở breaker sau nhiều lần timeout từ nhà cung cấp, chuyển sang dự phòng hoặc trả về phản hồi có kiểm soát, rồi cho phép một lượt thăm dò tình trạng giới hạn sau thời gian chờ.
- **Nhầm lẫn thường gặp:** Circuit breaker phản ứng với tình trạng của dependency. Rate limit kiểm soát lượng yêu cầu được phép.
- **Thuật ngữ liên quan:** Retry with Backoff, Rate Limit, Model Router, Backpressure

### CNN (Convolutional Neural Network)
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Một mạng nơ-ron dành cho hình ảnh.
- **Ý nghĩa thực tế:** Một mạng nơ-ron dùng phép tích chập (trượt bộ lọc trên đầu vào) để phát hiện các mẫu cục bộ. Xếp chồng các phép tích chập sẽ phát hiện những đặc trưng ngày càng phức tạp: cạnh, kết cấu, vật thể.
- **Nhầm lẫn thường gặp:** Phép tích chập cũng hoạt động trên âm thanh, chuỗi thời gian và dữ liệu dạng lưới khác.
- **Thuật ngữ liên quan:** Feature, Inductive Bias, Activation Function

### Coding Agent
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một agent chuyên về công việc phần mềm, có thể kiểm tra kho mã, chỉnh sửa tệp, chạy công cụ phát triển và dùng đầu ra của chúng để thúc đẩy một tác vụ kỹ thuật có phạm vi xác định.
- **Vì sao quan trọng:** Giá trị của nó phụ thuộc vào ngữ cảnh kho mã, quyền công cụ, ranh giới rà soát và xác minh, chứ không chỉ chất lượng tạo mã.
- **Trong thực tế:** Giao cho agent một issue, hợp đồng phạm vi, hướng dẫn kho mã và lệnh kiểm thử; sau đó rà soát bản vá cùng bằng chứng trước khi chấp nhận.
- **Nhầm lẫn thường gặp:** Trợ lý lập trình chỉ đề xuất văn bản chưa chắc đã là agent. Agent hành động qua công cụ và quan sát kết quả.
- **Học nội dung này:** [Skill Discovery and Progressive Disclosure](../phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/)
- **Thuật ngữ liên quan:** Agent Harness, Repository Map, Patch, Scope Contract, Reviewer Agent

### Compensating Action
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Một thao tác có chủ đích, về mặt ngữ nghĩa chống lại tác dụng phụ đã hoàn tất khi không thể quay lui nguyên tử thao tác ban đầu.
- **Vì sao quan trọng:** Quy trình nhiều bước của agent đi qua cơ sở dữ liệu và dịch vụ bên ngoài, nơi lỗi ở bước sau không thể hoàn tác các lần ghi trước đó bằng một giao dịch duy nhất.
- **Trong thực tế:** Nếu quy trình đặt chỗ tính phí thẻ nhưng việc đặt chỗ thất bại, hãy phát hành khoản hoàn tiền có theo dõi và lưu cả hai sự kiện thay vì xóa lịch sử.
- **Nhầm lẫn thường gặp:** Bù trừ là một hành động nghiệp vụ mới, không phải du hành ngược thời gian. Nó có thể thất bại và vì vậy cần tính idempotent, giám sát và cơ chế chuyển cấp.
- **Thuật ngữ liên quan:** Durable Execution, Idempotency, Checkpoint, Approval Gate
- **Nguồn:** [Sagas](https://dl.acm.org/doi/10.1145/38713.38742)

### Content Provenance
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Thông tin có thể xác minh về nguồn gốc và lịch sử chỉnh sửa của một phần nội dung truyền thông hoặc nội dung số khác, bao gồm các tác nhân, công cụ, phép biến đổi và xác nhận được gắn với nội dung đó.
- **Vì sao quan trọng:** Hệ thống tạo sinh khiến khó suy ra tuyên bố về nguồn gốc chỉ từ diện mạo, vì vậy người tiêu thụ và nền tảng cần bằng chứng có thể kiểm tra về cách nội dung được tạo ra.
- **Trong thực tế:** Gắn các xác nhận nguồn gốc với nội dung, ký chúng bằng danh tính được kiểm soát, giữ lịch sử biến đổi và nêu rõ khi thiếu bằng chứng hoặc không thể xác minh.
- **Nhầm lẫn thường gặp:** Provenance có thể xác lập ai đã đưa ra một lịch sử và liệu bản ghi có bị thay đổi hay không. Nó không chứng minh sự kiện được mô tả là thật hay nội dung vô hại.
- **Học nội dung này:** [Watermarking, SynthID, Stable Signature, and C2PA](../phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/)
- **Thuật ngữ liên quan:** Data Provenance, Provenance Attestation, Audit Log, Grounding
- **Nguồn:** [C2PA Technical Specification](https://c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html)

### Context Compression
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Giảm dung lượng token của tài liệu nguồn trong khi cố gắng giữ lại thông tin cần thiết cho một quyết định tiếp theo của mô hình.
- **Vì sao quan trọng:** Nén có thể giúp tác vụ dài vừa ngân sách, nhưng mỗi chi tiết bị bỏ đi đều tạo ra nguy cơ mô hình mất bằng chứng, ràng buộc hoặc trạng thái chưa giải quyết.
- **Trong thực tế:** Giữ nguyên văn các dữ kiện và mã định danh có thẩm quyền, tóm tắt lịch sử dư thừa, đính kèm tham chiếu nguồn và kiểm thử ngữ cảnh đã nén trên các tác vụ đại diện.
- **Nhầm lẫn thường gặp:** Nén là mất mát thông tin trừ khi giữ lại toàn bộ bản gốc. Bản tóm tắt ngắn hơn không tự động tương đương với ngữ cảnh ban đầu.
- **Thuật ngữ liên quan:** Token Budget, Context Engineering, Progressive Disclosure, Handoff
- **Nguồn:** [LLMLingua](https://arxiv.org/abs/2310.05736)

### Context Engineering
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Thiết kế toàn bộ môi trường thông tin cung cấp cho mô hình ở mỗi bước, bao gồm chỉ dẫn, tệp được chọn, bằng chứng truy xuất, kết quả công cụ, ví dụ, trạng thái và ràng buộc đầu ra.
- **Vì sao quan trọng:** Hiệu suất mô hình thường thất bại vì thiếu bằng chứng liên quan, bằng chứng đã cũ, sắp xếp kém hoặc bị nhiễu lấn át.
- **Trong thực tế:** Tạo một gói tác vụ gọn gồm mục tiêu, quy tắc kho mã, giao diện liên quan, đầu ra công cụ gần đây và quyết định chưa giải quyết, rồi cập nhật khi trạng thái thay đổi.
- **Nhầm lẫn thường gặp:** Prompt engineering tập trung vào cách diễn đạt chỉ dẫn. Context engineering còn quyết định bằng chứng và trạng thái nào được đưa vào ngữ cảnh làm việc của mô hình.
- **Học nội dung này:** [Context Engineering](../phases/11-llm-engineering/05-context-engineering/)
- **Thuật ngữ liên quan:** Context Window, Progressive Disclosure, Agent State, Repository Map

### Context Window
- **Danh mục:** Prompt & ngữ cảnh
- **Mọi người thường nói:** Mô hình nhớ được bao nhiêu.
- **Ý nghĩa thực tế:** Dung lượng token tối đa dành cho một lần suy luận của mô hình theo hợp đồng API và mô hình cụ thể. Dung lượng có thể gồm chỉ dẫn hệ thống, tin nhắn, nội dung truy xuất, trao đổi với công cụ và đầu ra được tạo, với cách tính cũng như giới hạn đầu ra tùy nhà cung cấp.
- **Vì sao quan trọng:** Lịch sử hội thoại chỉ khả dụng khi ứng dụng gửi lại hoặc dựng lại nó. Cửa sổ lớn không bảo đảm mọi chi tiết được đưa vào đều sẽ được sử dụng đáng tin cậy.
- **Nhầm lẫn thường gặp:** Ngữ cảnh là đầu vào tạm thời cho một lần suy luận. Bộ nhớ bền vững được lưu bên ngoài mô hình rồi chọn đưa trở lại ngữ cảnh sau này.
- **Học nội dung này:** [Context Engineering](../phases/11-llm-engineering/05-context-engineering/)
- **Thuật ngữ liên quan:** Token Budget, Context Engineering, Prompt Cache, Agent State

### Continuous Batching
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Một bộ lập lịch phục vụ thêm và loại bỏ yêu cầu tạo sinh tại ranh giới vòng lặp thay vì chờ mọi yêu cầu trong một batch cố định hoàn tất.
- **Vì sao quan trọng:** Các yêu cầu tự hồi quy tạo đầu ra có độ dài khác nhau, nên continuous batching có thể giữ accelerator được sử dụng mà không buộc yêu cầu ngắn chờ yêu cầu dài nhất.
- **Trong thực tế:** Tiếp nhận yêu cầu mới khi có năng lực, theo dõi độ trễ từng yêu cầu và áp dụng backpressure khi batch đang hoạt động hoặc ngân sách KV-cache đã đầy.
- **Nhầm lẫn thường gặp:** Continuous batching là chính sách lập lịch suy luận, không phải gradient accumulation hay kỹ thuật batch size khi huấn luyện.
- **Thuật ngữ liên quan:** Dynamic Batching, Decode Phase, Backpressure, Rate Limit
- **Nguồn:** [Orca](https://www.usenix.org/conference/osdi22/presentation/yu)

### Contrastive Learning
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Học bằng cách so sánh.
- **Ý nghĩa thực tế:** Huấn luyện bằng cách kéo các cặp tương tự lại gần nhau và đẩy các cặp không tương tự ra xa trong không gian embedding. CLIP sử dụng phương pháp này: các cặp ảnh-văn bản khớp nhau so với các cặp không khớp.
- **Thuật ngữ liên quan:** Embedding, Cosine Similarity, Loss Function

### Cosine Similarity
- **Danh mục:** Dữ liệu & biểu diễn
- **Mọi người thường nói:** Hai vector giống nhau đến mức nào.
- **Ý nghĩa thực tế:** Tích vô hướng đã chuẩn hóa của hai vector. Nó so sánh hướng thay vì độ lớn và nằm trong khoảng từ -1 đến 1 đối với vector có giá trị thực.
- **Nhầm lẫn thường gặp:** Độ tương đồng cosine cao chỉ có ý nghĩa tương đối với mô hình embedding và phân phối dữ liệu. Nó không chứng minh sự tương đương về sự thật hay ngữ nghĩa.
- **Thuật ngữ liên quan:** Embedding, Semantic Search, Reranker

### Cost per Successful Task
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Tổng chi phí hệ thống chia cho số tác vụ đáp ứng tiêu chí thành công đã xác định, bao gồm thử lại, lần chạy thất bại, sử dụng công cụ và chi phí đánh giá.
- **Vì sao quan trọng:** Một lần gọi mô hình rẻ có thể tạo ra quy trình tốn kém nếu thường xuyên thất bại hoặc cần con người sửa đi sửa lại.
- **Trong thực tế:** Đo phí nhà cung cấp và chi phí hạ tầng trên 100 tác vụ kho mã, rồi chia cho số tác vụ có bản vá vượt qua kiểm thử và rà soát.
- **Nhầm lẫn thường gặp:** Chi phí mỗi token đo mức sử dụng. Chi phí mỗi tác vụ thành công đo kết quả hữu ích.
- **Thuật ngữ liên quan:** Evaluation (Eval), Retry with Backoff, Model Router, Verification Gate

### Cross-Attention
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Attention trong đó biểu diễn truy vấn đến từ một chuỗi hoặc biểu diễn, còn khóa và giá trị đến từ một chuỗi hoặc biểu diễn khác.
- **Vì sao quan trọng:** Nó cho một luồng cách có thể học để truy xuất thông tin từ luồng khác, chẳng hạn token ngôn ngữ attention đến các đặc trưng thị giác.
- **Trong thực tế:** Nêu rõ luồng nào cung cấp truy vấn, khóa và giá trị; áp dụng mask cho vị trí bị thiếu hoặc không hợp lệ; kiểm tra xem mô hình còn hoạt động khi loại bỏ một phương thức hay không.
- **Nhầm lẫn thường gặp:** Cross-attention không mặc nhiên là đa phương thức. Nó có thể kết nối hai chuỗi văn bản hoặc các biểu diễn khác; ngược lại, self-attention suy ra truy vấn, khóa và giá trị từ cùng một biểu diễn chuỗi.
- **Thuật ngữ liên quan:** Attention, Self-Attention, Vision-Language Model (VLM), Multimodal Fusion
- **Nguồn:** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

### Cross-Entropy
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Hàm mất mát phân loại.
- **Ý nghĩa thực tế:** Hàm mất mát dựa trên log âm của xác suất được gán cho kết quả mục tiêu. Trong huấn luyện dự đoán token tiếp theo, nó phạt mô hình khi gán xác suất thấp cho token tiếp theo đã quan sát.
- **Nhầm lẫn thường gặp:** Perplexity là giá trị nhận được khi áp dụng hàm mũ cho cross-entropy trung bình, chỉ khi cách tính trung bình và cơ số log được xác định nhất quán.
- **Thuật ngữ liên quan:** Loss Function, Softmax, Perplexity

### CUDA
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Lập trình GPU.
- **Ý nghĩa thực tế:** Nền tảng và mô hình lập trình của NVIDIA cho tính toán mục đích chung trên các GPU tương thích. Framework học sâu dùng thư viện và kernel CUDA để thực thi song song nhiều phép toán tensor.
- **Nhầm lẫn thường gặp:** Tăng tốc GPU không đồng nghĩa với CUDA; còn có các ngăn xếp phần cứng và phần mềm khác.
- **Thuật ngữ liên quan:** Tensor, Mixed Precision, JAX

## D

### Data Augmentation
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Tạo thêm dữ liệu huấn luyện.
- **Ý nghĩa thực tế:** Tạo các ví dụ đã biến đổi, chẳng hạn ảnh được chuyển đổi, âm thanh được làm nhiễu hoặc văn bản được diễn đạt lại, nhằm tăng tính đa dạng huấn luyện mà không phải thu thập hoàn toàn dữ liệu nguồn mới. Nó có thể giảm overfitting khi phép biến đổi giữ nguyên tín hiệu của tác vụ.
- **Nhầm lẫn thường gặp:** Phép tăng cường phải giữ nguyên nhãn mục tiêu hoặc hành vi mà bạn muốn mô hình học.
- **Thuật ngữ liên quan:** Overfitting, Epoch, Eval Set

### Data Classification
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Gán dữ liệu vào các lớp nhạy cảm hoặc mức độ ảnh hưởng đã được ghi chép để việc xử lý, truy cập, lưu giữ, chia sẻ và ứng phó sự cố tuân theo hậu quả của việc tiết lộ hoặc mất dữ liệu.
- **Vì sao quan trọng:** Một quy trình AI không thể áp dụng biện pháp kiểm soát tương xứng nếu tài liệu nguồn, prompt, trace và hiện vật được tạo ra đều bị xem là nhạy cảm như nhau.
- **Trong thực tế:** Phân loại dữ liệu khi tiếp nhận, giữ nhãn xuyên suốt các hiện vật phái sinh, giới hạn công cụ và đích đến theo lớp, đồng thời xác định nhãn thay đổi thế nào sau khi biến đổi hoặc tổng hợp.
- **Nhầm lẫn thường gặp:** Phân loại dữ liệu mô tả yêu cầu bảo vệ. Nó không giống tác vụ phân loại trong học máy và cũng không khẳng định dữ liệu là chính xác.
- **Thuật ngữ liên quan:** Data Minimization, Trust Boundary, Least Privilege, Audit Log
- **Nguồn:** [NIST SP 1800-39 Initial Public Draft: Data Classification Practices](https://www.nccoe.nist.gov/sites/default/files/2026-02/nist-sp-1800-39-ipd.pdf); [NIST FIPS 199: Federal Information and Information System Categorization](https://csrc.nist.gov/pubs/fips/199/final)

### Data Deduplication
- **Danh mục:** Dữ liệu & biểu diễn
- **Ý nghĩa thực tế:** Phát hiện và loại bỏ các ví dụ trùng lặp chính xác hoặc gần giống trong hoặc giữa các tập dữ liệu.
- **Vì sao quan trọng:** Sự lặp lại có thể làm méo phân phối huấn luyện, tăng khả năng ghi nhớ, làm rò rỉ dữ liệu kiểm thử và khiến đánh giá có vẻ tốt hơn thực tế.
- **Trong thực tế:** Chuẩn hóa nội dung, dùng hàm băm chính xác và phương pháp tương đồng, rà soát các cụm ở ranh giới và ghi lại phiên bản cùng quy tắc đã loại bỏ từng ví dụ.
- **Nhầm lẫn thường gặp:** Khử trùng lặp không phải làm sạch dữ liệu thông thường. Hai bản ghi khác nhau có thể hợp lệ khi dùng chung văn bản, còn hai cách diễn đạt lại vẫn có thể mang cùng thông tin bị rò rỉ.
- **Thuật ngữ liên quan:** Data Provenance, Benchmark Contamination, Dataset Split, Overfitting
- **Nguồn:** [Deduplicating Training Data Makes Language Models Better](https://arxiv.org/abs/2107.06499)

### Data Exfiltration
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Việc truyền dữ liệu được bảo vệ trái phép từ một hệ thống hoặc vùng tin cậy đến người, công cụ, dịch vụ hoặc vị trí lưu trữ không được phép tiếp nhận dữ liệu đó.
- **Vì sao quan trọng:** Agent có thể làm lộ bí mật qua văn bản được tạo, đối số công cụ, URL, nhật ký hoặc tác dụng phụ ngay cả khi kho dữ liệu gốc vẫn nguyên vẹn.
- **Trong thực tế:** Giảm thiểu dữ liệu có thể đọc, đưa đích đến vào danh sách cho phép, kiểm tra lệnh gọi công cụ ra ngoài, che các trường nhạy cảm và cảnh báo về việc truyền dữ liệu bất thường qua ranh giới tin cậy.
- **Nhầm lẫn thường gặp:** Exfiltration là việc di chuyển hoặc tiết lộ trái phép. Thành phần được ủy quyền truy xuất dữ liệu thông thường không phải exfiltration, dù cách dùng sau đó có thể trở thành như vậy.
- **Học nội dung này:** [EchoLeak and CVEs for AI](../phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/)
- **Thuật ngữ liên quan:** Trust Boundary, Least Privilege, Indirect Prompt Injection, Audit Log
- **Nguồn:** [NIST SP 800-53 Rev. 5: AC-4 Information Flow Enforcement](https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/sp800-53r5-controls.xlsx)

### Data Leakage
- **Danh mục:** Dữ liệu & biểu diễn
- **Ý nghĩa thực tế:** Việc vô tình sử dụng thông tin trong quá trình huấn luyện hoặc xây dựng đặc trưng mà lẽ ra không có sẵn tại thời điểm dự đoán thực tế hoặc thuộc ranh giới đánh giá được giữ riêng.
- **Vì sao quan trọng:** Rò rỉ tạo ra các chỉ số lạc quan nhưng sụp đổ khi hệ thống gặp đầu vào thực sự chưa từng thấy.
- **Trong thực tế:** Chia dữ liệu trước khi khớp bộ tiền xử lý, không đưa thông tin tương lai vào đặc trưng lịch sử và tách biệt nhãn kiểm thử cùng đáp án benchmark khỏi prompt và vòng tinh chỉnh.
- **Nhầm lẫn thường gặp:** Rò rỉ không chỉ giới hạn ở các hàng trùng lặp. Thống kê chuẩn hóa toàn cục, dấu thời gian, đặc trưng suy ra từ mục tiêu và việc chỉnh prompt nhiều lần dựa trên kiểm thử đều có thể làm rò rỉ thông tin.
- **Thuật ngữ liên quan:** Dataset Split, Benchmark Contamination, Eval Set, Data Provenance
- **Nguồn:** [scikit-learn: Data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage)

### Data Lineage
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Bản ghi về cách hiện vật dữ liệu được tạo ra qua các nguồn, phép biến đổi, phép nối, bộ lọc, phiên bản và cách sử dụng ở bước sau.
- **Vì sao quan trọng:** Khi một nguồn được sửa, thu hồi hoặc phát hiện không an toàn, lineage xác định tập dữ liệu, embedding, đánh giá và hiện vật mô hình nào có thể bị ảnh hưởng.
- **Trong thực tế:** Gán mã định danh ổn định cho đầu vào và đầu ra, ghi lại từng phép biến đổi và phiên bản, giữ quan hệ cha-con, đồng thời kiểm thử xem nguồn bị ảnh hưởng có thể được truy vết đến mọi dữ liệu phái sinh hay không.
- **Nhầm lẫn thường gặp:** Data provenance giải thích rộng về nguồn gốc và quyền lưu giữ. Lineage nhấn mạnh đường biến đổi và các dependency giữa những hiện vật dữ liệu.
- **Thuật ngữ liên quan:** Data Provenance, Datasheet for Datasets, Audit Log, Content Provenance
- **Nguồn:** [W3C PROV-O](https://www.w3.org/TR/prov-o/)

### Data Minimization
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Đối với dữ liệu cá nhân, giới hạn việc thu thập, xử lý, để lộ và lưu giữ ở mức cần thiết cho một mục đích xác định. Các nhóm có thể áp dụng cùng kỷ luật này với dữ liệu nhạy cảm không phải dữ liệu cá nhân như một biện pháp kiểm soát kỹ thuật.
- **Vì sao quan trọng:** Mỗi trường không cần thiết được đưa vào prompt, trace, cache hoặc lần gọi công cụ đều làm tăng mức phơi nhiễm quyền riêng tư và tác động có thể xảy ra khi bị lạm dụng hoặc xâm phạm.
- **Trong thực tế:** Xác định các trường cần thiết trước khi thu thập, che hoặc tổng hợp dữ liệu tại ranh giới sớm nhất, đặt giới hạn lưu giữ và xác minh rằng ngữ cảnh tùy chọn cải thiện kết quả tác vụ đã đo trước khi giữ lại.
- **Nhầm lẫn thường gặp:** Tối thiểu hóa không có nghĩa là không lưu dữ liệu nào. Nghĩa là có thể giải trình từng phần tử dữ liệu, cách dùng, người nhận và thời hạn lưu giữ dựa trên mục đích đã nêu.
- **Thuật ngữ liên quan:** Purpose Limitation, Data Classification, Least Privilege, Context Engineering
- **Nguồn:** [General Data Protection Regulation, Article 5(1)(c)](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

### Data Provenance
- **Danh mục:** Dữ liệu & biểu diễn
- **Ý nghĩa thực tế:** Thông tin có thể truy vết về nơi dữ liệu bắt nguồn, ai hoặc thứ gì đã biến đổi nó, phiên bản nào được dùng và các hiện vật phái sinh liên hệ ra sao với nguồn của chúng.
- **Vì sao quan trọng:** Bạn cần provenance để tái tạo kết quả, tuân thủ các ràng buộc sử dụng, điều tra nhiễm bẩn và xóa dữ liệu bị ảnh hưởng khi nguồn thay đổi.
- **Trong thực tế:** Gán phiên bản tập dữ liệu bất biến, ghi lại các tác vụ biến đổi cùng mã định danh nguồn và chuyển metadata lineage vào embedding, trường hợp đánh giá và hiện vật mô hình.
- **Nhầm lẫn thường gặp:** URL nguồn chỉ là một phần của provenance; nó không mô tả thời điểm thu thập, giấy phép, lọc, biến đổi hay cách sử dụng tiếp theo.
- **Thuật ngữ liên quan:** Dataset Split, Data Deduplication, Provenance Attestation, Grounding
- **Nguồn:** [W3C PROV Overview](https://www.w3.org/TR/prov-overview/)

### Dataset Split
- **Danh mục:** Dữ liệu & biểu diễn
- **Ý nghĩa thực tế:** Một cách phân chia ví dụ được ghi chép thành các tập riêng để khớp mô hình, đưa ra quyết định phát triển và đánh giá cuối cùng.
- **Vì sao quan trọng:** Việc tách biệt ngăn bằng chứng dùng để chọn hệ thống đồng thời được xem là bằng chứng độc lập rằng hệ thống đã chọn có thể khái quát hóa.
- **Trong thực tế:** Chia theo đơn vị triển khai thực tế, chẳng hạn người dùng, kho mã, tổ chức hoặc thời gian, thay vì chia ngẫu nhiên các hàng có tương quan.
- **Nhầm lẫn thường gặp:** Chia ngẫu nhiên không tự động tạo ra tính độc lập. Bản sao gần giống, quan sát tương lai hoặc bản ghi từ cùng một thực thể có thể nằm ở hai phía ranh giới.
- **Thuật ngữ liên quan:** Eval Set, Overfitting, Data Leakage, Distribution Shift
- **Nguồn:** [Datasheets for Datasets](https://cacm.acm.org/research/datasheets-for-datasets/)

### Datasheet for Datasets
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Tài liệu có cấu trúc về động cơ, thành phần, quy trình thu thập, tiền xử lý, cách dùng, phân phối, bảo trì và các giới hạn đã biết của tập dữ liệu.
- **Vì sao quan trọng:** Một tập dữ liệu không đương nhiên an toàn hay phù hợp chỉ vì nó sẵn có. Người xây dựng ở bước sau cần bằng chứng về cách nó được tạo ra và những giả định của nó không còn đúng ở đâu.
- **Trong thực tế:** Công bố datasheet cùng tập dữ liệu có phiên bản, nêu ai có thể trả lời câu hỏi, ghi lại các nhóm dân số bị loại trừ và phép biến đổi, đồng thời cập nhật tài liệu khi tập dữ liệu thay đổi.
- **Nhầm lẫn thường gặp:** Datasheet ghi chép bằng chứng và mục đích sử dụng. Nó không phải giấy phép, bảo đảm chất lượng hay vật thay thế cho đánh giá theo triển khai cụ thể.
- **Học nội dung này:** [Model, System, and Dataset Cards](../phases/18-ethics-safety-alignment/26-model-system-dataset-cards/)
- **Thuật ngữ liên quan:** Data Lineage, Data Provenance, Model Card, Dataset Split
- **Nguồn:** [Datasheets for Datasets](https://arxiv.org/abs/1803.09010)

### Deadline Propagation
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Truyền ngân sách thời gian còn lại từ đầu đến cuối cho các lần gọi phía dưới để mỗi dependency biết yêu cầu ban đầu còn có thể chờ trong bao lâu mà việc chờ vẫn hữu ích.
- **Vì sao quan trọng:** Các timeout độc lập có thể vượt quá hạn chót của người dùng và khiến công việc bị bỏ dở vẫn tiêu tốn năng lực sau khi kết quả không còn hữu ích.
- **Trong thực tế:** Đặt một hạn chót yêu cầu tại điểm vào, trừ thời gian đã trôi qua cho mỗi lần gọi phía dưới, hủy công việc hết hạn và ghi lại ranh giới nào đã làm cạn ngân sách.
- **Nhầm lẫn thường gặp:** Deadline là ranh giới hoàn tất tuyệt đối hoặc còn lại. Thời gian chờ thử lại kiểm soát lúc bắt đầu lần thử khác và phải nằm trong cùng ngân sách đó.
- **Thuật ngữ liên quan:** Retry with Backoff, Retry Budget, Tail Latency, Service Level Objective (SLO)
- **Nguồn:** [gRPC Deadlines](https://grpc.io/docs/guides/deadlines/)

### Decode Phase
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Giai đoạn lặp của suy luận tự hồi quy tạo ra các token mới từng bước một sau khi tiền tố đầu vào đã được xử lý.
- **Vì sao quan trọng:** Công việc decode có cách sử dụng tính toán, bộ nhớ và lập lịch khác với prefill, nên một con số độ trễ tổng hợp có thể che giấu điểm nghẽn phục vụ thực sự.
- **Trong thực tế:** Đo riêng độ trễ giữa các token và thông lượng đầu ra, tính đến mức sử dụng KV-cache và kiểm thử tải hỗn hợp trong đó decode đang hoạt động chia sẻ năng lực với prefill mới.
- **Nhầm lẫn thường gặp:** Decode phase không phải thành phần decoder của mô hình encoder-decoder. Đây là tên giai đoạn tạo sinh khi chạy.
- **Học nội dung này:** [Disaggregated Prefill and Decode](../phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/)
- **Thuật ngữ liên quan:** Prefill, Autoregressive, KV Cache, Time per Output Token (TPOT)
- **Nguồn:** [DistServe](https://arxiv.org/abs/2401.09670)

### Decoder
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Phần đầu ra của mô hình.
- **Ý nghĩa thực tế:** Một thành phần ánh xạ biểu diễn thành đầu ra. Trong transformer encoder-decoder, decoder dùng masked self-attention và cross-attention để tạo đầu ra. Ngược lại, mô hình ngôn ngữ chỉ có decoder tạo sinh từ một ngăn xếp nhân quả duy nhất.
- **Thuật ngữ liên quan:** Encoder, Transformer, Autoregressive

### Decoding Strategy
- **Danh mục:** Mô hình & suy luận
- **Ý nghĩa thực tế:** Thuật toán chuyển chuỗi điểm số token tiếp theo của mô hình thành các token được chọn và đầu ra hoàn chỉnh.
- **Vì sao quan trọng:** Chọn tham lam, lấy mẫu, cắt cụt và tìm kiếm có thể tạo chất lượng, tính đa dạng, độ trễ và khả năng lặp lại khác nhau từ cùng các logits.
- **Trong thực tế:** Xác định thiết lập giải mã, quy tắc dừng và hành vi seed của tác vụ trong cấu hình đánh giá để có thể so sánh kết quả công bằng.
- **Nhầm lẫn thường gặp:** Giải mã thay đổi cách chọn đầu ra; nó không thay đổi tham số đã huấn luyện của mô hình hay bổ sung kiến thức.
- **Thuật ngữ liên quan:** Autoregressive, Temperature, Top-k Sampling, Nucleus Sampling (Top-p)
- **Nguồn:** [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)

### Defense in Depth
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Sử dụng các biện pháp kiểm soát phòng ngừa, phát hiện và khắc phục độc lập tại nhiều ranh giới hệ thống để một biện pháp kiểm soát thất bại không quyết định toàn bộ kết quả.
- **Vì sao quan trọng:** Hệ thống AI kết hợp mô hình xác suất, nội dung không đáng tin, công cụ và dịch vụ bên ngoài, khiến bất kỳ bộ lọc hay prompt đơn lẻ nào cũng không đủ làm ranh giới bảo mật.
- **Trong thực tế:** Kết hợp kiểm soát chỉ dẫn với quyền hạn hạn hẹp, sandbox, xác thực schema, phê duyệt hành động có hệ quả, giám sát và đường khôi phục đã kiểm thử.
- **Nhầm lẫn thường gặp:** Nhiều biện pháp kiểm soát hơn không tự động tốt hơn. Các lớp nên xử lý những kiểu lỗi riêng biệt và vẫn có thể kiểm thử, thay vì lặp lại cùng một giả định.
- **Thuật ngữ liên quan:** Guardrails, Sandbox, Least Privilege, Trust Boundary
- **Nguồn:** [NIST Glossary: Defense in Depth](https://csrc.nist.gov/glossary/term/defense_in_depth)

### Delegation
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Giao một tác vụ con có giới hạn cho người hoặc agent khác cùng với ngữ cảnh, thẩm quyền, hợp đồng đầu ra và điều kiện trả kết quả cần thiết.
- **Vì sao quan trọng:** Ủy quyền tường minh cho phép chuyên môn hóa và làm việc song song mà không mất quyền sở hữu, phạm vi hay khả năng tích hợp kết quả.
- **Trong thực tế:** Cung cấp cho reviewer agent chính xác các tệp, tiêu chí, bằng chứng và hạn chót, sau đó yêu cầu trả về phát hiện thay vì âm thầm sửa hiện vật chính.
- **Nhầm lẫn thường gặp:** Gửi một thông điệp mơ hồ cho agent khác không phải ủy quyền đáng tin cậy. Bên nhận cần hợp đồng phạm vi và quy trình bàn giao xác định để trả kết quả.
- **Thuật ngữ liên quan:** Scope Contract, Handoff, Reviewer Agent, Orchestration
- **Nguồn:** [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

### Dense Retrieval
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Truy xuất giai đoạn đầu, nhúng truy vấn và ứng viên thành biểu diễn vector rồi xếp hạng ứng viên bằng một hàm tương đồng.
- **Vì sao quan trọng:** Nó có thể truy xuất cách diễn đạt lại và các kết quả khớp ngữ nghĩa có ít từ trùng khớp chính xác, bổ trợ cho phương pháp từ vựng như BM25.
- **Trong thực tế:** Huấn luyện hoặc chọn mô hình embedding phù hợp với miền, lập chỉ mục vector ứng viên và đánh giá recall truy xuất trước khi nối kết quả với bước tạo sinh.
- **Nhầm lẫn thường gặp:** Dense retrieval không phải reranker. Nó tìm kiếm trong tập dữ liệu, còn reranker chấm điểm lại một tập ứng viên nhỏ hơn.
- **Thuật ngữ liên quan:** Embedding, Semantic Search, BM25, Hybrid Retrieval
- **Nguồn:** [Dense Passage Retrieval](https://aclanthology.org/2020.emnlp-main.550/)

### Diffusion Model
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Một mô hình tạo ảnh từ nhiễu.
- **Ý nghĩa thực tế:** Một mô hình tạo sinh được huấn luyện xoay quanh quá trình thêm nhiễu dần dần và quá trình đảo ngược đã học. Việc lấy mẫu thường bắt đầu từ nhiễu rồi áp dụng nhiều bước khử nhiễu lặp lại, đôi khi trong không gian tiềm ẩn đã học.
- **Nhầm lẫn thường gặp:** Diffusion là một khuôn khổ tạo sinh tổng quát, không phải kỹ thuật chỉ dành cho hình ảnh.
- **Thuật ngữ liên quan:** Latent Space, VAE (Variational Autoencoder), Inference

### Disaggregated Serving
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Một kiến trúc phục vụ chạy công việc prefill và decode trong các nhóm worker được cấp phát riêng biệt, rồi chuyển trạng thái attention cần thiết giữa chúng.
- **Vì sao quan trọng:** Prefill và decode gây áp lực khác nhau lên phần cứng, vì vậy các nhóm riêng có thể được định cỡ và lập lịch theo điểm nghẽn riêng thay vì cạnh tranh trong một hàng đợi.
- **Trong thực tế:** Đo chi phí truyền trạng thái, định tuyến yêu cầu qua các phiên bản mô hình tương thích, mở rộng từng nhóm dựa trên tín hiệu nhu cầu riêng và kiểm thử khôi phục lỗi giữa các giai đoạn.
- **Nhầm lẫn thường gặp:** Tách rời phân chia các giai đoạn khi chạy. Nó không chia một mô hình thành các mảnh song song tensor hoặc pipeline bên trong một giai đoạn.
- **Học nội dung này:** [Disaggregated Prefill and Decode](../phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/)
- **Thuật ngữ liên quan:** Prefill, Decode Phase, Model Serving, Goodput
- **Nguồn:** [DistServe](https://arxiv.org/abs/2401.09670)

### Distribution Shift
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Sự khác biệt giữa phân phối dữ liệu dùng để xây dựng hoặc đánh giá hệ thống với phân phối mà hệ thống gặp phải sau khi triển khai.
- **Vì sao quan trọng:** Mô hình có thể vượt qua các kiểm thử giữ lại nhưng vẫn thất bại khi người dùng, tác vụ, ngôn ngữ, công cụ hoặc điều kiện vận hành thay đổi.
- **Trong thực tế:** Xác định các lát cắt triển khai dự kiến, giám sát hiệu suất và đặc điểm đầu vào theo từng lát cắt, rồi thêm lỗi mới vào tập đánh giá có phiên bản.
- **Nhầm lẫn thường gặp:** Distribution shift không phải lúc nào cũng là model drift. Mô hình có thể không đổi trong khi môi trường hoặc nhóm người dùng thay đổi.
- **Thuật ngữ liên quan:** Dataset Split, Eval Set, Overfitting, Model Card
- **Nguồn:** [WILDS](https://proceedings.mlr.press/v139/koh21a.html)

### DPO (Direct Preference Optimization)
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Huấn luyện theo sở thích mà không cần giai đoạn mô hình phần thưởng riêng.
- **Ý nghĩa thực tế:** Một mục tiêu tối ưu hóa sở thích, huấn luyện trực tiếp chính sách từ các cặp phản hồi được ưu tiên và bị từ chối so với một chính sách tham chiếu. Nó tránh phải chạy mô hình phần thưởng tường minh và vòng lặp học tăng cường trong giai đoạn này.
- **Nhầm lẫn thường gặp:** DPO vẫn phụ thuộc vào chất lượng và phạm vi bao phủ của dữ liệu sở thích, đồng thời không loại bỏ nhu cầu đánh giá hay rủi ro alignment.
- **Học nội dung này:** [Direct Preference Optimization](../phases/10-llms-from-scratch/08-dpo/)
- **Nguồn:** [Direct Preference Optimization paper](https://arxiv.org/abs/2305.18290)
- **Thuật ngữ liên quan:** RLHF (Reinforcement Learning from Human Feedback), SFT (Supervised Fine-Tuning), Alignment

### Dropout
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Tắt ngẫu nhiên các activation.
- **Ý nghĩa thực tế:** Trong quá trình huấn luyện, đặt ngẫu nhiên một phần activation về 0 để khuyến khích mạng không phụ thuộc vào một đường activation duy nhất. Thông thường kỹ thuật này bị tắt khi suy luận tiêu chuẩn, dù Monte Carlo dropout cố ý giữ nó hoạt động để ước lượng độ bất định.
- **Thuật ngữ liên quan:** Overfitting, Weight Decay, Activation Function

### Durable Execution
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Chạy quy trình làm việc sao cho trạng thái và các bước đã hoàn tất vẫn tồn tại sau khi tiến trình lỗi, khởi động lại hoặc chờ lâu mà không phải làm lại tác dụng phụ đã xác nhận.
- **Vì sao quan trọng:** Tác vụ agent thường trải qua nhiều lần gọi mô hình, công cụ, phê duyệt và hệ thống bên ngoài. Một tiến trình tạm thời không nên là bản ghi duy nhất về tiến độ.
- **Trong thực tế:** Lưu từng lần chuyển trạng thái quy trình, dùng khóa idempotency cho thao tác ghi bên ngoài và tiếp tục từ checkpoint mới nhất sau khi worker khởi động lại.
- **Nhầm lẫn thường gặp:** Durable execution không tự động làm mọi thao tác an toàn. Tác dụng phụ vẫn cần quy tắc idempotency và bù trừ.
- **Thuật ngữ liên quan:** Checkpoint, Agent State, Idempotency, Approval Gate

### Dynamic Batching
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Một chính sách lúc chạy tạo batch suy luận từ các yêu cầu đang xếp hàng theo hình dạng tương thích, kích thước tối đa, mức ưu tiên và độ trễ hàng đợi cho phép.
- **Vì sao quan trọng:** Gom nhóm yêu cầu có thể cải thiện mức sử dụng phần cứng, nhưng chờ gom đủ batch có thể làm độ trễ tệ hơn khi lưu lượng thưa hoặc yêu cầu khác nhau đáng kể.
- **Trong thực tế:** Đặt giới hạn độ trễ hàng đợi và batch dựa trên mục tiêu độ trễ đã đo, tách các hình dạng yêu cầu không tương thích và so sánh thông lượng với độ trễ đuôi ở tốc độ yêu cầu thực tế.
- **Nhầm lẫn thường gặp:** Dynamic batching tập hợp batch từ công việc đang chờ. Continuous batching thay đổi thành viên khi quá trình tạo sinh tự hồi quy đã chạy.
- **Học nội dung này:** [vLLM Serving Internals](../phases/17-infrastructure-and-production/04-vllm-serving-internals/)
- **Thuật ngữ liên quan:** Admission Control, Continuous Batching, Saturation, Tail Latency
- **Nguồn:** [NVIDIA Triton: Models and Schedulers](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html#scheduling-and-batching)

## E

### Early Fusion
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Kết hợp các biểu diễn thô hoặc cấp thấp từ nhiều phương thức trước khi phần lớn quá trình mô hình hóa đặc thù tác vụ diễn ra.
- **Vì sao quan trọng:** Tương tác sớm có thể bộc lộ các quan hệ giữa các phương thức ở mức chi tiết, nhưng cũng đòi hỏi biểu diễn tương thích và xử lý cẩn thận việc căn chỉnh cùng đầu vào bị thiếu.
- **Trong thực tế:** Chuyển mỗi phương thức thành biểu diễn token hoặc đặc trưng đã khai báo, giữ dấu nguồn và vị trí, hợp nhất chúng trước backbone dùng chung, rồi so sánh với các mốc cơ sở một phương thức và hợp nhất muộn.
- **Nhầm lẫn thường gặp:** Early fusion mô tả vị trí các luồng được kết hợp trong kiến trúc. Nó không bảo đảm mô hình học được sự căn chỉnh hữu ích giữa chúng.
- **Học nội dung này:** [Chameleon Early-Fusion Tokens](../phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/)
- **Thuật ngữ liên quan:** Late Fusion, Multimodal Fusion, Modality Alignment, Token
- **Nguồn:** [Chameleon: Mixed-Modal Early-Fusion Foundation Models](https://arxiv.org/abs/2405.09818); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Eigenvalue
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Một thuộc tính ma trận dùng trong PCA.
- **Ý nghĩa thực tế:** Một số vô hướng mô tả cách phép biến đổi tuyến tính co giãn vector riêng khác 0 tương ứng mà không đổi hướng của nó. Trong PCA dùng ma trận hiệp phương sai, các trị riêng lớn hơn tương ứng với những hướng có phương sai nhiều hơn.
- **Thuật ngữ liên quan:** Tensor, Feature, Latent Space

### Embedding
- **Danh mục:** Dữ liệu & biểu diễn
- **Mọi người thường nói:** Một vector biểu diễn ý nghĩa.
- **Ý nghĩa thực tế:** Một ánh xạ đã học từ các mục rời rạc (từ, ảnh, người dùng) sang vector dày đặc trong không gian liên tục, nơi các mục tương tự nằm gần nhau
- **Nhầm lẫn thường gặp:** Độ tương đồng phụ thuộc vào mô hình, mục tiêu huấn luyện và metric. Khoảng cách trong một không gian embedding không chuyển nguyên vẹn sang không gian khác.
- **Vì sao có tên gọi này:** Các mục được đặt, hay nhúng, vào một không gian biểu diễn hình học.
- **Học nội dung này:** [Embeddings](../phases/11-llm-engineering/04-embeddings/)
- **Thuật ngữ liên quan:** Cosine Similarity, Semantic Search, Vector Database

### Encoder
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Phần đầu vào của mô hình.
- **Ý nghĩa thực tế:** Một thành phần biến đổi đầu vào thành biểu diễn. Encoder transformer thường dùng self-attention phi nhân quả, tùy theo các mask, để mỗi vị trí có thể kết hợp ngữ cảnh từ toàn bộ đầu vào.
- **Nhầm lẫn thường gặp:** Mô hình chỉ có encoder có thể tạo đầu ra qua các task head dù thường không được dùng để tạo văn bản tự hồi quy.
- **Thuật ngữ liên quan:** Decoder, Transformer, Embedding

### Epoch
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Một lượt đi qua dữ liệu huấn luyện.
- **Ý nghĩa thực tế:** Một lượt duyệt qua tập dữ liệu huấn luyện đã xác định. Trong huấn luyện phân tán hoặc lấy mẫu, cách triển khai chính xác của một epoch phụ thuộc vào bộ nạp dữ liệu và chính sách lấy mẫu.
- **Nhầm lẫn thường gặp:** Nhiều epoch hơn không bảo đảm khái quát hóa tốt hơn; hãy đánh giá trên dữ liệu giữ lại.
- **Thuật ngữ liên quan:** Batch Size, Overfitting, Eval Set

### Error Budget
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Lượng dịch vụ không thành công được cho phép theo một mục tiêu cấp độ dịch vụ trong cửa sổ đo lường trước khi mục tiêu cạn ngân sách.
- **Vì sao quan trọng:** Nó tạo ra một ranh giới quyết định chung cho công việc về độ tin cậy và sản phẩm: các nhóm có thể dùng ngân sách còn lại cho thay đổi, đồng thời giảm tốc độ chấp nhận rủi ro khi lỗi người dùng nhìn thấy tiêu hao ngân sách đó.
- **Trong thực tế:** Suy ra ngân sách từ SLO, theo dõi tốc độ tiêu hao theo nguyên nhân và phân khúc người dùng, xác định hành động phát hành trước khi cạn ngân sách và tránh đặt lại cách hạch toán sau sự cố.
- **Nhầm lẫn thường gặp:** Error budget không phải hạn mức cho phép gây sự cố. Đây là chính sách vận hành được suy ra từ mục tiêu độ tin cậy hướng đến người dùng.
- **Thuật ngữ liên quan:** Service Level Objective (SLO), Service Level Indicator (SLI), Availability, Incident Response
- **Nguồn:** [Google SRE Workbook: Error Budget Policy](https://sre.google/workbook/error-budget-policy/)

### Eval Set
- **Danh mục:** Đánh giá & an toàn
- **Bí danh:** Evaluation set
- **Ý nghĩa thực tế:** Một tập hợp có phiên bản gồm đầu vào, thuộc tính mong đợi, quy tắc chấm điểm và metadata được dùng để đo hệ thống AI theo một năng lực hoặc rủi ro đã xác định.
- **Vì sao quan trọng:** Một tập hợp có thể lặp lại biến các tuyên bố chất lượng mơ hồ thành bằng chứng có thể so sánh và phát hiện hồi quy sau khi prompt, mô hình, công cụ hoặc truy xuất thay đổi.
- **Trong thực tế:** Giữ các câu hỏi hỗ trợ đại diện, chỉ dẫn đối kháng, trích dẫn kỳ vọng và nhãn lỗi trong một tập dữ liệu đã được rà soát, tách biệt với ví dụ phát triển.
- **Nhầm lẫn thường gặp:** Eval phát triển định hướng vòng lặp cải tiến, bài kiểm thử cuối cùng giữ riêng ước tính hiệu suất sau khi đã chốt các lựa chọn, còn benchmark tiêu chuẩn hỗ trợ so sánh theo một quy trình chung. Tinh chỉnh lặp lại dựa trên bất kỳ tập giữ riêng nào đều làm rò rỉ thông tin kiểm thử và thổi phồng kết quả.
- **Học nội dung này:** [Eval-Driven Agent Development](../phases/14-agent-engineering/30-eval-driven-agent-development/)
- **Thuật ngữ liên quan:** Evaluation (Eval), Regression Test, LLM-as-a-Judge, Verification Gate

### Evaluation (Eval)
- **Danh mục:** Đánh giá & an toàn
- **Bí danh:** Eval
- **Ý nghĩa thực tế:** Một quy trình được xác định để đo hành vi của mô hình hoặc hệ thống trên các tác vụ đại diện bằng tiêu chí thành công, dữ liệu, bộ chấm điểm và thủ tục rà soát tường minh.
- **Vì sao quan trọng:** Bạn không thể cải thiện độ tin cậy nếu thành công chỉ là ấn tượng chủ quan từ vài bản demo.
- **Trong thực tế:** Chạy cùng các tình huống hỗ trợ khách hàng trước và sau khi thay đổi truy xuất, chấm điểm tính đúng đắn và mức độ hỗ trợ của trích dẫn, rồi kiểm tra lỗi theo danh mục.
- **Nhầm lẫn thường gặp:** Điểm benchmark là một kết quả đánh giá, không phải bức tranh đầy đủ về chất lượng trong môi trường sản xuất.
- **Học nội dung này:** [LLM Evaluation](../phases/11-llm-engineering/10-evaluation/)
- **Thuật ngữ liên quan:** Eval Set, LLM-as-a-Judge, Cost per Successful Task, Regression Test

### Exact Match (EM)
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Một metric chỉ tính đầu ra là đúng khi biểu diễn đã chuẩn hóa của nó khớp chính xác với một câu trả lời tham chiếu được chấp nhận.
- **Vì sao quan trọng:** Metric này có tính xác định và dễ kiểm tra với tác vụ có một câu trả lời chuẩn tắc, nhưng không ghi nhận mức đúng một phần.
- **Trong thực tế:** Xác định chuẩn hóa và mọi câu trả lời tham chiếu được chấp nhận trước khi đánh giá, rồi kết hợp exact match với các phép kiểm tra đặc thù tác vụ khi có nhiều đầu ra hợp lệ.
- **Nhầm lẫn thường gặp:** Điểm exact-match thấp có thể phản ánh khác biệt định dạng vô hại, trong khi chuỗi khớp vẫn có thể không được hỗ trợ hoặc không an toàn trong ngữ cảnh.
- **Thuật ngữ liên quan:** ROUGE, Eval Set, Structured Output, Pass@k
- **Nguồn:** [SQuAD](https://aclanthology.org/D16-1264/)

### Expert Parallelism
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Phân tán các mạng con mixture-of-experts trên nhiều thiết bị và định tuyến activation của từng token đến thiết bị chứa expert được chọn.
- **Vì sao quan trọng:** Expert thưa làm tăng năng lực mô hình mà không thực thi mọi expert cho mọi token, nhưng định tuyến tạo ra ràng buộc về giao tiếp, cân bằng tải và bố trí.
- **Trong thực tế:** Đo phân phối token theo expert, cấp đủ băng thông giao tiếp, chủ động giới hạn hoặc định tuyến phần tràn và kiểm thử chất lượng khi lưu lượng tạo nhu cầu expert không đồng đều.
- **Nhầm lẫn thường gặp:** Expert parallelism phân vùng các expert được router chọn. Tensor parallelism phân vùng phép toán tensor bên trong các lớp.
- **Học nội dung này:** [Mixture of Experts](../phases/07-transformers-deep-dive/11-mixture-of-experts/)
- **Thuật ngữ liên quan:** MoE (Mixture of Experts), Tensor Parallelism, Pipeline Parallelism, Model Serving
- **Nguồn:** [GShard](https://arxiv.org/abs/2006.16668)

## F

### Feature
- **Danh mục:** Dữ liệu & biểu diễn
- **Mọi người thường nói:** Một cột trong tập dữ liệu.
- **Ý nghĩa thực tế:** Một thuộc tính riêng lẻ có thể đo lường của dữ liệu. Trong ML cổ điển, bạn tự thiết kế feature. Trong học sâu, mạng tự động học feature từ dữ liệu thô.
- **Nhầm lẫn thường gặp:** Một cột được lưu có thể chứa nhiều feature hữu ích, và biểu diễn đã học có thể chứa feature không có nhãn dễ hiểu với con người.
- **Thuật ngữ liên quan:** Embedding, Latent Space, Inductive Bias

### Few-Shot
- **Danh mục:** Prompt & ngữ cảnh
- **Mọi người thường nói:** Đưa cho mô hình một vài ví dụ trong prompt.
- **Ý nghĩa thực tế:** Học trong ngữ cảnh, bao gồm một nhóm nhỏ ví dụ minh họa trước đầu vào mục tiêu để mô hình suy ra tác vụ, định dạng hoặc ranh giới quyết định mong muốn.
- **Vì sao quan trọng:** Chất lượng và độ bao phủ của ví dụ quan trọng hơn một số lượng ví dụ phổ quát. Ví dụ minh họa kém hoặc mâu thuẫn có thể làm giảm độ tin cậy.
- **Thuật ngữ liên quan:** Zero-Shot, In-Context Learning, Prompt Engineering, Context Window

### Fine-tuning
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Huấn luyện mô hình trên dữ liệu của bạn.
- **Ý nghĩa thực tế:** Tiếp tục huấn luyện từ tham số đã tiền huấn luyện trên tập dữ liệu hoặc mục tiêu hẹp hơn. Tùy phương pháp, bạn có thể cập nhật mọi tham số, một số tham số được chọn hoặc tham số adapter được thêm vào.
- **Vì sao quan trọng:** Fine-tuning có thể điều chỉnh hành vi, phong cách, định dạng hoặc hiệu suất tác vụ, nhưng không phải cách thay thế đáng tin cậy cho truy xuất khi sự kiện cần luôn cập nhật hoặc có thể truy vết.
- **Nhầm lẫn thường gặp:** Fine-tuning có thể ảnh hưởng kiến thức được mã hóa, nhưng nó không đơn giản là nối thêm bản ghi vào một cơ sở dữ liệu có thể tìm kiếm bên trong mô hình.
- **Học nội dung này:** [Fine-Tuning and LoRA](../phases/11-llm-engineering/08-fine-tuning-lora/)
- **Thuật ngữ liên quan:** SFT (Supervised Fine-Tuning), LoRA (Low-Rank Adaptation), QLoRA, RAG (Retrieval-Augmented Generation)

### Flaky Test
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một kiểm thử có thể vượt qua hoặc thất bại giữa các lần chạy tương đương dù không có thay đổi liên quan nào trong mã hay môi trường kiểm thử dự kiến.
- **Vì sao quan trọng:** Tính thất thường làm suy yếu cổng xác minh và có thể khiến người hoặc agent bỏ qua lỗi thật hoặc thử lại đến khi nhận được kết quả đạt giả.
- **Trong thực tế:** Giữ lại seed và môi trường gây lỗi, chỉ cách ly kiểm thử khi có người phụ trách và hạn chót, rồi sửa dependency không được kiểm soát về thời gian, đồng thời, mạng, thứ tự hoặc trạng thái dùng chung.
- **Nhầm lẫn thường gặp:** Kiểm thử luôn cho thấy một lỗi sản phẩm xảy ra không thường xuyên là bằng chứng có giá trị, không nhất thiết là kiểm thử thất thường.
- **Thuật ngữ liên quan:** Regression Test, Test Oracle, Retry with Backoff, Verification Gate
- **Nguồn:** [De-Flake Your Tests](https://conferences.computer.org/icsme/pdfs/ICSME2020-1oOutvkGTwF4GyVvNtr3Mm/561900a736/561900a736.pdf)

### FlashAttention
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Một thuật toán attention chính xác, chia phép tính thành các tile để giảm truyền dữ liệu giữa các cấp bộ nhớ accelerator, đồng thời tránh tạo toàn bộ ma trận attention trong bộ nhớ băng thông cao.
- **Vì sao quan trọng:** Attention có thể bị giới hạn bởi việc di chuyển dữ liệu thay vì phép tính, nhất là với chuỗi dài, nên kernel nhận biết I/O có thể cải thiện tốc độ hữu dụng và hiệu quả bộ nhớ.
- **Trong thực tế:** Dùng kernel được hỗ trợ cho hình dạng, mask, dtype và phần cứng của mô hình; xác minh dung sai số học; đo độ trễ đầu-cuối thay vì xem kết quả bài báo là hệ số tăng tốc cố định.
- **Nhầm lẫn thường gặp:** FlashAttention thay đổi cách tính attention, không thay đổi kết quả attention toán học mà nó hướng tới. Nó tách biệt với KV caching và lượng tử hóa.
- **Học nội dung này:** [KV Cache and Flash Attention](../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/)
- **Thuật ngữ liên quan:** Attention, Self-Attention, KV Cache, Mixed Precision
- **Nguồn:** [FlashAttention](https://arxiv.org/abs/2205.14135)

### Function Calling
- **Danh mục:** Agent & công cụ
- **Mọi người thường nói:** Mô hình sử dụng công cụ.
- **Ý nghĩa thực tế:** Một giao diện của nhà cung cấp hoặc ứng dụng, qua đó mô hình phát ra yêu cầu có cấu trúc nêu tên công cụ cùng đối số. Mã ứng dụng xác thực yêu cầu, thực hiện thao tác và có thể trả kết quả để mô hình xử lý ở bước tiếp theo.
- **Nhầm lẫn thường gặp:** Mô hình yêu cầu gọi hàm; mã đáng tin cậy của bạn quyết định có thực thi và thực thi như thế nào. Chỉ riêng function calling chưa phải agent hoàn chỉnh.
- **Học nội dung này:** [Function Calling](../phases/11-llm-engineering/09-function-calling/)
- **Thuật ngữ liên quan:** Structured Output, Tool Contract, Agent, MCP (Model Context Protocol)

## G

### GAN (Generative Adversarial Network)
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Hai mạng nơ-ron cạnh tranh trong quá trình huấn luyện.
- **Ý nghĩa thực tế:** Một mạng generator cố tạo dữ liệu giống thật trong khi mạng discriminator cố phân biệt thật với giả. Chúng được huấn luyện cùng nhau: generator ngày càng đánh lừa discriminator tốt hơn, còn discriminator ngày càng phát hiện dữ liệu giả tốt hơn.
- **Thuật ngữ liên quan:** Loss Function, Latent Space, Diffusion Model

### Goodput
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Tốc độ hoàn thành các yêu cầu đáp ứng ràng buộc dịch vụ đã xác định, chẳng hạn cả mục tiêu thời gian đến token đầu tiên và độ trễ mỗi token, dưới một tải công việc đã nêu.
- **Vì sao quan trọng:** Thông lượng thô có thể tăng trong khi người dùng gặp nhiều yêu cầu chậm hơn. Goodput chỉ tính công việc đáp ứng hợp đồng dịch vụ.
- **Trong thực tế:** Nêu phân phối yêu cầu và ngưỡng độ trễ, chỉ đếm các lần hoàn tất tuân thủ, báo cáo các phân vị bên cạnh tốc độ tổng hợp và tránh so sánh hệ thống theo các mục tiêu khác nhau.
- **Nhầm lẫn thường gặp:** Goodput không phải toàn bộ thông lượng hoàn tất và không phải thuộc tính phổ quát của mô hình. Nó phụ thuộc vào tải công việc và ngưỡng thành công.
- **Học nội dung này:** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **Thuật ngữ liên quan:** Service Level Objective (SLO), Time to First Token (TTFT), Time per Output Token (TPOT), Cost per Successful Task
- **Nguồn:** [DistServe](https://arxiv.org/abs/2401.09670)

### GPT
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Tên gọi chung cho mọi chatbot.
- **Ý nghĩa thực tế:** Generative Pre-trained Transformer, nhãn cho một họ mô hình transformer tạo sinh được tiền huấn luyện theo mục tiêu dự đoán chuỗi và điều chỉnh để sử dụng ở bước sau. Không nên xem tên sản phẩm và kiến trúc mô hình là đồng nghĩa.
- **Vì sao có tên gọi này:** Generative mô tả việc tạo đầu ra, pre-trained mô tả giai đoạn huấn luyện rộng ban đầu, còn transformer xác định họ kiến trúc.
- **Thuật ngữ liên quan:** Transformer, Autoregressive, LLM (Large Language Model)

### Graceful Degradation
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Duy trì một dịch vụ cốt lõi có giới hạn khi năng lực hoặc dependency bị suy giảm bằng cách giảm chất lượng, tính năng, độ mới hoặc khối lượng công việc tùy chọn thay vì làm mọi yêu cầu thất bại.
- **Vì sao quan trọng:** Hệ thống AI thường phụ thuộc vào nhiều thành phần chậm hoặc dễ lỗi, nên một chế độ suy giảm tường minh có thể bảo vệ kết quả thiết yếu cho người dùng trong khi xảy ra lỗi một phần.
- **Trong thực tế:** Xác định trước những năng lực có thể tắt, giữ cho chế độ suy giảm hiển thị với người vận hành, bảo vệ các kiểm tra an toàn, kiểm thử phương án dự phòng khi dependency lỗi và khôi phục đầy đủ một cách chủ động. Thông báo cho người dùng khi tính đúng đắn, an toàn, độ mới hoặc hợp đồng đã hứa thay đổi đáng kể.
- **Nhầm lẫn thường gặp:** Graceful degradation không phải âm thầm trả lời kém hơn như thể không có gì xảy ra. Người vận hành luôn cần khả năng quan sát; người dùng cần được thông báo khi chế độ suy giảm làm thay đổi đáng kể kết quả hoặc hợp đồng dịch vụ.
- **Học nội dung này:** [Production LLM Application](../phases/11-llm-engineering/13-production-app/)
- **Thuật ngữ liên quan:** Circuit Breaker, Load Shedding, Model Router, Availability
- **Nguồn:** [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

### Gradient
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Độ dốc của hàm mất mát.
- **Ý nghĩa thực tế:** Một vector đạo hàm riêng chỉ theo hướng tăng nhanh nhất. Trong ML, bạn đi ngược hướng gradient (gradient descent) để tối thiểu hóa hàm mất mát.
- **Nhầm lẫn thường gặp:** Bộ tối ưu hóa có thể biến đổi, lấy trung bình, cắt hoặc điều chỉnh gradient thay vì thực hiện bước âm gradient thuần túy.
- **Thuật ngữ liên quan:** Backpropagation, Gradient Descent, Optimizer

### Gradient Accumulation
- **Danh mục:** Toán học & huấn luyện
- **Ý nghĩa thực tế:** Cộng hoặc lấy trung bình gradient từ nhiều microbatch trước khi thực hiện một lần cập nhật bộ tối ưu hóa.
- **Vì sao quan trọng:** Nó cho phép xấp xỉ batch hiệu dụng lớn hơn khi một thiết bị không thể chứa đồng thời mọi ví dụ và activation.
- **Trong thực tế:** Điều chỉnh tỷ lệ hàm mất mát nhất quán, chỉ gọi bộ tối ưu hóa sau số microbatch đã chọn và đo xem chuẩn hóa hoặc đồng bộ phân tán có làm thay đổi hành vi hay không.
- **Nhầm lẫn thường gặp:** Tích lũy gradient giảm bộ nhớ activation mỗi bước, nhưng không tái tạo mọi đặc tính của việc xử lý toàn bộ batch cùng lúc.
- **Thuật ngữ liên quan:** Batch Size, Mixed Precision, Optimizer, Backpropagation
- **Nguồn:** [PyTorch AMP examples: Gradient accumulation](https://docs.pytorch.org/docs/stable/notes/amp_examples.html#gradient-accumulation)

### Gradient Clipping
- **Danh mục:** Toán học & huấn luyện
- **Ý nghĩa thực tế:** Giới hạn giá trị gradient hoặc chuẩn tổng hợp của chúng trước lần cập nhật bộ tối ưu hóa khi chúng vượt ngưỡng đã chọn.
- **Vì sao quan trọng:** Nó có thể ngăn gradient lớn bất thường làm mất ổn định một bước huấn luyện và tạo ra giá trị không hữu hạn.
- **Trong thực tế:** Ghi lại chuẩn chưa bị cắt, cắt sau khi khôi phục tỷ lệ gradient mixed-precision và điều tra việc cắt lặp lại thay vì xem đó là vật thay thế cho chẩn đoán bất ổn.
- **Nhầm lẫn thường gặp:** Clipping kiểm soát độ lớn cập nhật; nó không sửa dữ liệu không hợp lệ, hàm mất mát bị hỏng hay tốc độ học liên tục không phù hợp.
- **Thuật ngữ liên quan:** Gradient, NaN (Not a Number), Mixed Precision, Learning Rate
- **Nguồn:** [On the difficulty of training recurrent neural networks](https://arxiv.org/abs/1211.5063)

### Gradient Descent
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Đi xuống dốc trên bề mặt hàm mất mát.
- **Ý nghĩa thực tế:** Một họ phép cập nhật tối ưu hóa di chuyển tham số bằng gradient âm của mục tiêu, thường được ước lượng từ batch thay vì toàn bộ tập dữ liệu.
- **Thuật ngữ liên quan:** Gradient, Learning Rate, Optimizer

### Grounding
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Kết nối câu trả lời hoặc hành động được tạo với bằng chứng, trạng thái hoặc quan sát mà hệ thống có thể xác định và kiểm tra.
- **Vì sao quan trọng:** Grounding cung cấp cho hệ thống cơ sở ngoài việc tạo sinh không ràng buộc và giúp phát hiện tuyên bố không được hỗ trợ dễ hơn.
- **Trong thực tế:** Truy xuất một mục chính sách, yêu cầu câu trả lời trích dẫn mục đó và từ chối các tuyên bố không được đoạn trích dẫn hỗ trợ.
- **Nhầm lẫn thường gặp:** Thêm tài liệu vào prompt tạo cơ hội grounding. Điều đó không bảo đảm mô hình sẽ dùng chúng chính xác.
- **Học nội dung này:** [Retrieval-Augmented Generation](../phases/11-llm-engineering/06-rag/)
- **Thuật ngữ liên quan:** RAG (Retrieval-Augmented Generation), Hallucination, Verification Gate, Reranker

### Guardrails
- **Danh mục:** Đánh giá & an toàn
- **Mọi người thường nói:** Bộ lọc an toàn quanh mô hình.
- **Ý nghĩa thực tế:** Các kiểm soát hệ thống ràng buộc đầu vào, cách dùng công cụ, đầu ra, quyền hạn và chuyển cấp. Chúng có thể gồm schema, kiểm tra chính sách, bộ phân loại, danh sách cho phép, sandbox, phê duyệt và xác minh sau hành động.
- **Vì sao quan trọng:** Không một bộ lọc nào bao phủ được mọi kiểu lỗi, vì vậy các biện pháp kiểm soát cần được xếp lớp theo rủi ro.
- **Nhầm lẫn thường gặp:** Guardrail giảm rủi ro; chúng không chứng minh hệ thống AI an toàn.
- **Học nội dung này:** [Guardrails](../phases/11-llm-engineering/12-guardrails/)
- **Thuật ngữ liên quan:** Least Privilege, Approval Gate, Sandbox, Evaluation (Eval)

## H

### Hallucination
- **Danh mục:** Đánh giá & an toàn
- **Mọi người thường nói:** Mô hình đang nói dối.
- **Ý nghĩa thực tế:** Nội dung được tạo ra là sai, không được bằng chứng sẵn có hỗ trợ hoặc không nhất quán với nguồn chân lý của tác vụ. Điều này có thể xảy ra ngay cả khi đầu ra trôi chảy và mô hình không định lừa dối.
- **Vì sao quan trọng:** Thường bạn không thể kiểm tra một phát biểu có tồn tại trong dữ liệu huấn luyện hay không, vì vậy kiểm tra trong môi trường sản xuất nên tập trung vào mức độ hỗ trợ, tính đúng đắn và khả năng truy vết.
- **Trong thực tế:** Yêu cầu bằng chứng được trích dẫn cho câu trả lời về dữ kiện và đánh giá xem mỗi trích dẫn có thực sự hỗ trợ tuyên bố tương ứng hay không.
- **Nhầm lẫn thường gặp:** Hallucination là lỗi chất lượng đầu ra, không phải chẩn đoán ý định của mô hình.
- **Thuật ngữ liên quan:** Grounding, RAG (Retrieval-Augmented Generation), Verification Gate

### Handoff
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Chuyển giao tác vụ có cấu trúc giữa người hoặc agent, giữ nguyên mục tiêu, trạng thái hiện tại, bằng chứng, quyết định, ràng buộc và công việc còn lại.
- **Vì sao quan trọng:** Bàn giao tốt giúp người làm tiếp theo không phải dựng lại toàn bộ tác vụ từ một bản ghi dài hoặc lặp lại các hành động đã hoàn thành.
- **Trong thực tế:** Chuyển giao kế hoạch đã chấp nhận, tệp đã thay đổi, lệnh và kết quả kiểm thử, rủi ro chưa giải quyết cùng hành động tiếp theo chính xác trong một gói tác vụ gọn.
- **Nhầm lẫn thường gặp:** Bản tóm tắt nêu điều đã xảy ra. Handoff còn nêu trạng thái nào là có thẩm quyền và việc gì nên làm tiếp.
- **Học nội dung này:** [Multi-Session Handoff](../phases/14-agent-engineering/40-multi-session-handoff/)
- **Thuật ngữ liên quan:** Agent State, Checkpoint, Scope Contract, Progressive Disclosure

### HNSW
- **Danh mục:** Truy xuất & tạo sinh
- **Bí danh:** Hierarchical Navigable Small World
- **Ý nghĩa thực tế:** Một chỉ mục láng giềng gần nhất xấp xỉ, sắp xếp vector trong các đồ thị lân cận phân tầng và tìm kiếm từ tầng trên tổng quát đến tầng dưới chi tiết.
- **Vì sao quan trọng:** Đây là cách phổ biến để khiến tìm kiếm vector có recall cao trở nên thực tế ở quy mô mà so sánh đầy đủ quá chậm.
- **Trong thực tế:** Tinh chỉnh tham số dựng chỉ mục và truy vấn theo mục tiêu độ trễ, bộ nhớ và Recall@K, sau đó dựng lại chỉ mục khi phiên bản embedding thay đổi.
- **Nhầm lẫn thường gặp:** HNSW là thuật toán chỉ mục, không phải metric tương đồng, mô hình embedding hay cơ sở dữ liệu vector hoàn chỉnh.
- **Thuật ngữ liên quan:** Approximate Nearest Neighbor (ANN), Vector Database, Embedding, Recall@K
- **Nguồn:** [Efficient and Robust Approximate Nearest Neighbor Search Using HNSW](https://dl.acm.org/doi/10.1109/TPAMI.2018.2889473)

### Human-in-the-Loop (HITL)
- **Danh mục:** Agent & công cụ
- **Bí danh:** Human oversight, human review
- **Ý nghĩa thực tế:** Một thiết kế quy trình làm việc trong đó một người đưa ra phán đoán, chỉnh sửa, phê duyệt hoặc chuyển cấp tại những điểm đã xác định trong quy trình do AI điều khiển.
- **Vì sao quan trọng:** Sự tham gia của con người hữu ích nhất ở ranh giới có tác động cao, mơ hồ hoặc không thể đảo ngược, chứ không phải như phương án dự phòng không xác định sau mọi bước.
- **Trong thực tế:** Cho agent tự động phân loại yêu cầu thường lệ, nhưng chuyển các trường hợp không chắc chắn hoặc giá trị cao đến người rà soát cùng bằng chứng và hành động đề xuất.
- **Nhầm lẫn thường gặp:** HITL không tự động khiến hệ thống an toàn. Người rà soát cần thời gian, ngữ cảnh, thẩm quyền và tiêu chuẩn quyết định rõ ràng.
- **Thuật ngữ liên quan:** Approval Gate, Verification Gate, Agent, Guardrails

### Hybrid Retrieval
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Truy xuất kết hợp tín hiệu từ nhiều phương pháp, thường là khớp từ vựng và độ tương đồng vector dày đặc, trước khi gộp hoặc xếp hạng lại kết quả.
- **Vì sao quan trọng:** Mã định danh chính xác, thuật ngữ hiếm và cách diễn đạt lại theo ngữ nghĩa có hành vi khác nhau, nên một tín hiệu truy xuất duy nhất có thể bỏ lỡ bằng chứng hữu ích.
- **Trong thực tế:** Truy xuất ứng viên bằng tìm kiếm từ khóa kiểu BM25 và embedding, gộp thứ hạng của chúng, rồi xếp hạng lại tập hợp kết quả theo truy vấn của người dùng.
- **Nhầm lẫn thường gặp:** Hybrid retrieval kết hợp tín hiệu ứng viên. Reranker áp dụng mô hình liên quan thứ hai cho những ứng viên đã truy xuất.
- **Học nội dung này:** [Advanced RAG](../phases/11-llm-engineering/07-advanced-rag/)
- **Thuật ngữ liên quan:** Semantic Search, Reranker, RAG (Retrieval-Augmented Generation), Embedding

### Hyperparameter
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Một thiết lập cần tinh chỉnh.
- **Ý nghĩa thực tế:** Lựa chọn cấu hình định hình cấu trúc mô hình, tối ưu hóa, xử lý dữ liệu hoặc suy luận thay vì được học như một tham số mô hình thông thường. Ví dụ gồm tốc độ học, batch size, số lớp và thiết lập giải mã.
- **Nhầm lẫn thường gặp:** Một số hyperparameter được chọn trước khi huấn luyện, còn một số khác có thể thay đổi trong lịch trình hoặc tại thời điểm suy luận.
- **Thuật ngữ liên quan:** Parameter, Learning Rate, Batch Size, Temperature

## I

### Idempotency
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Thuộc tính mà việc lặp lại cùng một thao tác với cùng một danh tính không tạo thêm tác dụng phụ nào ngoài lần áp dụng thành công đầu tiên.
- **Vì sao quan trọng:** Thử lại là chuyện bình thường trong các hệ thống agent phân tán. Nếu không có idempotency, một phản hồi không chắc chắn có thể nhân đôi khoản thanh toán, bình luận, triển khai hoặc bản ghi.
- **Trong thực tế:** Gắn khóa idempotency vào yêu cầu công cụ và lưu kết quả đã hoàn tất để lần thử lại trả về kết quả đó thay vì thực hiện thao tác ghi lần nữa.
- **Nhầm lẫn thường gặp:** Idempotency không có nghĩa mọi phản hồi giống hệt từng byte. Nghĩa là thay đổi trạng thái dự định không bị nhân đôi.
- **Nguồn:** [HTTP Semantics: idempotent methods](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)
- **Thuật ngữ liên quan:** Retry with Backoff, Durable Execution, Checkpoint

### Image Token
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một đơn vị thị giác đặc thù mô hình được biểu diễn dưới dạng vector hoặc mã rời rạc, thường bắt nguồn từ một patch ảnh, vùng ảnh hoặc mục trong codebook thị giác đã học.
- **Vì sao quan trọng:** Biến đầu vào thị giác thành chuỗi cho phép các thành phần kiểu transformer xử lý ảnh cùng văn bản hoặc phương thức khác đã được token hóa.
- **Trong thực tế:** Ghi rõ token là patch liên tục hay mã rời rạc, giữ vị trí không gian, kiểm thử thay đổi độ phân giải và tỷ lệ khung hình, đồng thời tính token thị giác vào ngân sách đầu vào của mô hình.
- **Nhầm lẫn thường gặp:** Image token không nhất thiết là một pixel, một vật thể hay một vùng vật lý cố định. Phạm vi của nó tuân theo encoder hoặc bộ token hóa thị giác.
- **Học nội dung này:** [Vision-Language Models](../phases/04-computer-vision/25-vision-language-models/)
- **Thuật ngữ liên quan:** Patch Embedding, Token, VAE (Variational Autoencoder), Vision Transformer (ViT)
- **Nguồn:** [Vision Transformer](https://arxiv.org/abs/2010.11929); [VQ-VAE](https://arxiv.org/abs/1711.00937)

### In-Context Learning
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Mô hình điều chỉnh hành vi từ chỉ dẫn, ví dụ hoặc mẫu được cung cấp trong đầu vào hiện tại mà không cập nhật tham số theo cách thông thường.
- **Vì sao quan trọng:** Điều này giải thích cách một mô hình đã tiền huấn luyện có thể thực hiện tác vụ mới từ ngữ cảnh trong khi trọng số vẫn không đổi.
- **Trong thực tế:** Đặt ví dụ minh họa đại diện trước đầu vào mục tiêu, kiểm thử các biến thể thứ tự và định dạng, đồng thời giữ các ví dụ đánh giá tách biệt khỏi ví dụ minh họa.
- **Nhầm lẫn thường gặp:** Học trong ngữ cảnh là điều kiện hóa tạm thời, không phải fine-tuning, bộ nhớ bền vững hay bằng chứng rằng mô hình đã suy ra quy tắc dự định.
- **Thuật ngữ liên quan:** Few-Shot, Zero-Shot, Context Window, Prompt Engineering
- **Nguồn:** [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)

### Incident Response
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Quy trình phối hợp để phát hiện, phân tích, khoanh vùng, khôi phục, truyền đạt và rút kinh nghiệm từ một sự kiện đe dọa dịch vụ, dữ liệu, an toàn hoặc bảo mật.
- **Vì sao quan trọng:** Trong sự cố, vai trò và bằng chứng rõ ràng quan trọng hơn những hành động ứng biến anh hùng, nhất là khi hành vi mô hình và dependency phân tán che khuất ranh giới đang lỗi.
- **Trong thực tế:** Xác định mức độ nghiêm trọng và vai trò chỉ huy, bảo toàn trace và bản ghi kiểm toán, dừng hành động gây hại, truyền đạt tác động, xác minh khôi phục và theo dõi công việc khắc phục đến khi hoàn tất.
- **Nhầm lẫn thường gặp:** Ứng phó sự cố quản lý sự kiện và hậu quả của nó. Phân tích nguyên nhân gốc rễ và phòng ngừa dài hạn tiếp tục sau khi dịch vụ đã được khôi phục trước mắt.
- **Học nội dung này:** [SRE for AI](../phases/17-infrastructure-and-production/23-sre-for-ai/)
- **Thuật ngữ liên quan:** Observability, Audit Log, Postmortem, Availability
- **Nguồn:** [Google SRE: Managing Incidents](https://sre.google/sre-book/managing-incidents/); [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)

### Indirect Prompt Injection
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Một cuộc tấn công prompt injection được đưa vào qua nội dung hệ thống truy xuất hoặc quan sát, chẳng hạn trang web, tài liệu, email, văn bản trong ảnh hoặc kết quả công cụ, thay vì trực tiếp qua chỉ dẫn của người dùng.
- **Vì sao quan trọng:** Agent có thể gặp chỉ dẫn do kẻ tấn công kiểm soát trong lúc thực hiện tác vụ được ủy quyền và nhầm nội dung đó là hướng dẫn có thẩm quyền.
- **Trong thực tế:** Gắn nhãn nội dung bên ngoài là dữ liệu không đáng tin, tách nó khỏi chỉ dẫn, giảm thiểu quyền công cụ, yêu cầu phê duyệt hành động có hệ quả và đưa nội dung truy xuất độc hại vào kiểm thử hồi quy.
- **Nhầm lẫn thường gặp:** Indirect mô tả đường đưa tấn công vào, không có nghĩa là tấn công yếu hơn. Chỉ dẫn ẩn trong nội dung truy xuất có thể gây hậu quả ngang với prompt trực tiếp của người dùng.
- **Học nội dung này:** [Indirect Prompt Injection](../phases/18-ethics-safety-alignment/15-indirect-prompt-injection/)
- **Thuật ngữ liên quan:** Prompt Injection, Instruction Hierarchy, Trust Boundary, Data Exfiltration
- **Nguồn:** [Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173)

### Inductive Bias
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Các giả định được tích hợp trong một hệ thống học.
- **Ý nghĩa thực tế:** Các giả định cấu trúc hoặc thống kê ưu tiên một số hàm hoặc biểu diễn hơn những hàm hoặc biểu diễn khác. Tích chập ưu tiên tính cục bộ và bộ lọc dùng chung; causal masking ưu tiên dự đoán từ các vị trí đứng trước.
- **Nhầm lẫn thường gặp:** Transformer vẫn có inductive bias thông qua tokenization, xử lý vị trí, masking, kiến trúc, dữ liệu và mục tiêu.
- **Thuật ngữ liên quan:** CNN (Convolutional Neural Network), Transformer, Feature

### Inference
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Chạy một mô hình đã huấn luyện.
- **Ý nghĩa thực tế:** Thực thi mô hình đã huấn luyện để tạo dự đoán, điểm số, embedding hoặc token được sinh mà không thực hiện cập nhật tham số kiểu huấn luyện thông thường.
- **Nhầm lẫn thường gặp:** Ứng dụng có thể cập nhật cache, trạng thái hội thoại hoặc bộ nhớ bên ngoài trong lúc suy luận dù trọng số mô hình không đổi.
- **Thuật ngữ liên quan:** Autoregressive, Streaming, KV Cache

### Instruction Following
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Năng lực của mô hình ánh xạ chỉ dẫn bằng ngôn ngữ tự nhiên và ngữ cảnh được cung cấp thành hành vi đáp ứng tác vụ cùng ràng buộc đã nêu.
- **Vì sao quan trọng:** Tạo ngôn ngữ trôi chảy không đồng nghĩa tuân thủ thao tác, định dạng, ranh giới hoặc thứ tự ưu tiên mà người dùng yêu cầu.
- **Trong thực tế:** Đánh giá việc tuân thủ chỉ dẫn tách biệt với chất lượng câu trả lời bằng các ràng buộc xung đột, yêu cầu định dạng, ngữ cảnh không liên quan và trường hợp từ chối.
- **Nhầm lẫn thường gặp:** Instruction following không phải tính đúng sự thật, alignment hay việc tuân theo mọi chuỗi văn bản trông giống chỉ dẫn.
- **Thuật ngữ liên quan:** SFT (Supervised Fine-Tuning), Prompt Engineering, Instruction Hierarchy, Alignment
- **Nguồn:** [Finetuned Language Models Are Zero-Shot Learners](https://arxiv.org/abs/2109.01652)

### Instruction Hierarchy
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Một bộ quy tắc để giải quyết xung đột giữa chỉ dẫn từ các nguồn có thẩm quyền khác nhau, chẳng hạn chính sách ứng dụng, người dùng và nội dung truy xuất không đáng tin.
- **Vì sao quan trọng:** Hệ thống agent trộn lẫn mục tiêu đáng tin với văn bản bên ngoài, vì vậy mô hình và harness cần cách ứng phó đã xác định khi nội dung có thẩm quyền thấp xung đột với ràng buộc có thẩm quyền cao hơn.
- **Trong thực tế:** Gắn nhãn đầu ra công cụ không đáng tin là dữ liệu, giữ các ràng buộc ưu tiên cao hơn bên ngoài nội dung đó và kiểm thử các trường hợp xung đột trực tiếp lẫn gián tiếp.
- **Nhầm lẫn thường gặp:** Thứ bậc chỉ dẫn có thể cải thiện hành vi nhưng không phải ranh giới bảo mật; quyền tối thiểu và biện pháp kiểm soát phê duyệt vẫn giới hạn hậu quả.
- **Thuật ngữ liên quan:** System Prompt, Prompt Injection, Least Privilege, Tool Contract
- **Nguồn:** [The Instruction Hierarchy](https://arxiv.org/abs/2404.13208)

### Inter-Token Latency (ITL)
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Thời gian trôi qua giữa hai sự kiện đến liên tiếp của token đầu ra trong một yêu cầu, được tính là `t_i - t_(i-1)` cho token đầu ra sau token đầu tiên.
- **Vì sao quan trọng:** Khoảng trễ riêng lẻ làm lộ tình trạng decode bị khựng và dao động truyền luồng mà mức trung bình mỗi yêu cầu có thể che giấu, nhất là khi batching, bị ngắt ưu tiên hoặc tải công việc hỗn hợp.
- **Trong thực tế:** Ghi lại từng khoảng sau token đầu tiên cùng yêu cầu và vị trí token, rồi báo cáo phân phối theo tải công việc, độ dài đầu ra và mức đồng thời mà không gộp mất ranh giới yêu cầu.
- **Nhầm lẫn thường gặp:** ITL là một khoảng giữa các token liên tiếp. Time per output token là trung bình mỗi yêu cầu trên các khoảng đó, còn time to first token bao gồm thời gian chờ trước khi bắt đầu truyền luồng.
- **Học nội dung này:** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **Thuật ngữ liên quan:** Time per Output Token (TPOT), Time to First Token (TTFT), Decode Phase, Tail Latency
- **Nguồn:** [DistServe](https://arxiv.org/abs/2401.09670)

## J

### Jailbreak
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Một đầu vào đối kháng hoặc chiến lược tương tác nhằm khiến mô hình tạo hành vi mà các biện pháp kiểm soát của quá trình huấn luyện hoặc ứng dụng được thiết kế để ngăn chặn.
- **Vì sao quan trọng:** Jailbreak thành công làm lộ khoảng cách giữa chính sách đã tuyên bố và hành vi thực tế, đồng thời có thể gây hậu quả nghiêm trọng hơn khi mô hình điều khiển công cụ hoặc dữ liệu được bảo vệ.
- **Trong thực tế:** Tạo nhóm kiểm thử từ các hành vi bị cấm, thay đổi định dạng và độ dài tương tác, đo cả việc từ chối lẫn phản hồi gây hại, rồi chuyển lỗi đã xác nhận thành eval đối kháng có phiên bản.
- **Nhầm lẫn thường gặp:** Jailbreak nhắm vào các hạn chế hành vi của mô hình hoặc hệ thống. Prompt injection chuyển hướng việc tuân thủ chỉ dẫn, thường theo mục tiêu của kẻ tấn công; một tương tác có thể bao gồm cả hai.
- **Học nội dung này:** [Jailbreak Taxonomy](../phases/19-capstone-projects/82-jailbreak-taxonomy/)
- **Thuật ngữ liên quan:** Prompt Injection, Red Teaming, Guardrails, Eval Set
- **Nguồn:** [Universal and Transferable Adversarial Attacks on Aligned Language Models](https://arxiv.org/abs/2307.15043)

### JAX
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Một hệ thống giống NumPy cho học máy tăng tốc.
- **Ý nghĩa thực tế:** Một thư viện Python biến đổi hàm số học bằng vi phân tự động, biên dịch, vector hóa và thực thi song song trên accelerator. Các phép biến đổi hoạt động tốt nhất với trạng thái tường minh và mã theo phong cách hàm.
- **Nhầm lẫn thường gặp:** JAX không cấm mọi kiểu lập trình có trạng thái, nhưng thay đổi trạng thái ẩn bên trong các hàm được biến đổi có thể tạo hành vi sai hoặc không được hỗ trợ.
- **Học nội dung này:** [Introduction to JAX](../phases/03-deep-learning-core/12-intro-to-jax/)
- **Nguồn:** [JAX documentation](https://docs.jax.dev/en/latest/)
- **Thuật ngữ liên quan:** Autograd, Tensor, CUDA

## K

### Knowledge Distillation
- **Danh mục:** Toán học & huấn luyện
- **Ý nghĩa thực tế:** Huấn luyện mô hình học viên tái tạo hành vi được chọn hoặc phân phối đầu ra từ mô hình giáo viên có năng lực hơn, thường đi kèm nhãn mục tiêu thông thường.
- **Vì sao quan trọng:** Phương pháp này có thể chuyển hành vi hữu ích sang mô hình nhỏ hơn hoặc rẻ hơn khi việc phục vụ trực tiếp mô hình giáo viên không thực tế.
- **Trong thực tế:** Xác định đầu ra của giáo viên, temperature, hàm mất mát của học viên và tập eval giữ lại, rồi so sánh học viên với cả giáo viên lẫn mốc cơ sở chỉ dùng nhãn.
- **Nhầm lẫn thường gặp:** Chưng cất chuyển hành vi trên phân phối huấn luyện; nó không sao chép mọi năng lực, dữ kiện hay thuộc tính an toàn của giáo viên.
- **Thuật ngữ liên quan:** Fine-tuning, Loss Function, Logits, Quantization
- **Nguồn:** [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531)

### KV Cache
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Bộ nhớ đệm giúp tạo token nhanh hơn.
- **Ý nghĩa thực tế:** Các tensor khóa và giá trị được lưu từ những vị trí trước đó trong quá trình tạo sinh tự hồi quy. Tái sử dụng chúng tránh tính lại phép chiếu attention cho tiền tố không đổi ở mỗi bước giải mã.
- **Vì sao quan trọng:** Nó giảm tính toán lặp lại nhưng tiêu tốn bộ nhớ tăng theo độ dài chuỗi, số lớp, batch và cấu hình mô hình.
- **Nhầm lẫn thường gặp:** KV cache là trạng thái attention lúc chạy cho một chuỗi. Prefix caching tái sử dụng trạng thái KV đủ điều kiện giữa các yêu cầu, còn prompt caching là hợp đồng tái sử dụng rộng hơn của nhà cung cấp hoặc ứng dụng.
- **Học nội dung này:** [KV Cache and Flash Attention](../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/)
- **Thuật ngữ liên quan:** Attention, Autoregressive, Prefix Caching, Prompt Cache

## L

### Late Fusion
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Xử lý các phương thức qua encoder hoặc bộ dự đoán riêng rồi kết hợp biểu diễn cấp cao, điểm số hoặc quyết định của chúng gần đầu ra tác vụ.
- **Vì sao quan trọng:** Các nhánh riêng có thể dùng kiến trúc đặc thù phương thức và chịu được đầu vào thiếu, dù có thể bỏ lỡ tương tác chi tiết sẵn có ở cách hợp nhất sớm hơn.
- **Trong thực tế:** Hiệu chuẩn từng nhánh, xác định phương thức thiếu ảnh hưởng đến phép gộp ra sao, so sánh kết hợp ở mức điểm số và đặc trưng, đồng thời đánh giá riêng từng nhánh như một ablation.
- **Nhầm lẫn thường gặp:** Late fusion mô tả vị trí kết hợp. Nó không có nghĩa là lấy trung bình đơn giản và không bảo đảm các phương thức đóng góp ngang nhau.
- **Học nội dung này:** [Cross-Attention Fusion](../phases/19-capstone-projects/61-cross-attention-fusion/)
- **Thuật ngữ liên quan:** Early Fusion, Multimodal Fusion, Modality, Evaluation (Eval)
- **Nguồn:** [Multimodal Deep Learning](https://ai.stanford.edu/~ang/papers/icml11-MultimodalDeepLearning.pdf); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Latent Space
- **Danh mục:** Dữ liệu & biểu diễn
- **Mọi người thường nói:** Không gian biểu diễn ẩn của mô hình.
- **Ý nghĩa thực tế:** Một không gian biểu diễn đã học, nơi các tọa độ mã hóa những yếu tố hữu ích cho mô hình. Nó có thể có ít chiều hơn đầu vào, nhưng không phải mọi biểu diễn tiềm ẩn đều bắt buộc phải nén.
- **Nhầm lẫn thường gặp:** Các điểm gần nhau chỉ được xem là tương tự có ý nghĩa theo những gì mô hình và mục tiêu huấn luyện đã học.
- **Thuật ngữ liên quan:** Embedding, VAE (Variational Autoencoder), Feature

### Learning Rate
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Độ lớn của mỗi bước tối ưu hóa.
- **Ý nghĩa thực tế:** Hệ số tỷ lệ được bộ tối ưu hóa dùng để kiểm soát độ lớn cập nhật tham số. Giá trị quá lớn có thể làm mất ổn định việc huấn luyện; giá trị quá nhỏ có thể khiến tiến độ hữu ích chậm đến mức không thực tế.
- **Nhầm lẫn thường gặp:** Mức cập nhật hiệu dụng còn phụ thuộc vào bộ tối ưu hóa, lịch trình, tỷ lệ gradient, batch và lịch sử tham số.
- **Thuật ngữ liên quan:** Optimizer, Gradient Descent, Batch Size

### Learning Rate Schedule
- **Danh mục:** Toán học & huấn luyện
- **Ý nghĩa thực tế:** Chính sách thay đổi tốc độ học của bộ tối ưu hóa khi quá trình huấn luyện tiến triển theo bước, epoch, metric hoặc đường cong định trước.
- **Vì sao quan trọng:** Các giai đoạn huấn luyện khác nhau có thể hưởng lợi từ mức cập nhật khác nhau, nên một tốc độ cố định có thể bất ổn lúc đầu hoặc lãng phí lúc sau.
- **Trong thực tế:** Phiên bản hóa lịch trình cùng cấu hình bộ tối ưu hóa, ghi lại tốc độ thực tế ở mỗi bước và so sánh lịch trình theo cùng ngân sách token hoặc lượt cập nhật.
- **Nhầm lẫn thường gặp:** Bộ lập lịch kiểm soát tốc độ học theo thời gian; nó không quyết định khi nào thực hiện bước tối ưu hóa và không bảo đảm hội tụ.
- **Thuật ngữ liên quan:** Learning Rate, Warmup, Optimizer, Epoch
- **Nguồn:** [SGDR](https://arxiv.org/abs/1608.03983); [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

### Least Privilege
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Chỉ cấp cho mô hình, agent, công cụ hoặc người dùng những quyền cần thiết cho tác vụ hiện tại, và chỉ trong thời gian cần các quyền đó.
- **Vì sao quan trọng:** Mô hình có thể mắc lỗi hoặc làm theo chỉ dẫn độc hại. Quyền hạn hẹp làm giảm thiệt hại mà một lỗi bất kỳ có thể gây ra.
- **Trong thực tế:** Cho agent tài liệu quyền đọc tệp nguồn và quyền ghi vào một nhánh, nhưng không cấp thông tin xác thực sản xuất hay quyền hợp nhất.
- **Nhầm lẫn thường gặp:** Xác thực chứng minh danh tính. Least privilege giới hạn những gì danh tính đó có thể làm.
- **Thuật ngữ liên quan:** Sandbox, Approval Gate, Prompt Injection, Tool Contract

### LLM (Large Language Model)
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Bộ não của ứng dụng AI.
- **Ý nghĩa thực tế:** Một mô hình ngôn ngữ có đủ năng lực và huấn luyện rộng để thực hiện nhiều tác vụ ngôn ngữ thông qua prompt hoặc điều chỉnh. Hầu hết LLM hiện nay dùng kiến trúc transformer và mục tiêu dự đoán chuỗi, nhưng ngưỡng kích thước, nguồn dữ liệu và công thức huấn luyện khác nhau.
- **Nhầm lẫn thường gặp:** LLM là một thành phần mô hình. Công cụ, truy xuất, trạng thái, chính sách và logic sản phẩm nằm trong hệ thống xung quanh nó.
- **Thuật ngữ liên quan:** Transformer, Autoregressive, Agent Harness

### LLM-as-a-Judge
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Dùng mô hình ngôn ngữ để chấm điểm, so sánh, phân loại hoặc phê bình đầu ra của hệ thống khác theo tiêu chí.
- **Vì sao quan trọng:** Cách này có thể mở rộng việc đánh giá các phẩm chất khó biểu đạt bằng kiểm thử khớp chính xác, chẳng hạn độ rõ ràng hoặc tuân thủ chỉ dẫn.
- **Trong thực tế:** Cung cấp cho mô hình đánh giá riêng tác vụ, câu trả lời ứng viên, bằng chứng tham chiếu và tiêu chí có cấu trúc, sau đó hiệu chuẩn điểm của nó với các ví dụ đã được con người rà soát.
- **Nhầm lẫn thường gặp:** Mô hình phán xét không phải chân lý tuyệt đối. Nó có thể thiên lệch theo thứ tự, độ dài, phong cách, cách viết prompt hoặc những lỗi mà các mô hình cùng mắc phải.
- **Học nội dung này:** [Eval-Driven Agent Development](../phases/14-agent-engineering/30-eval-driven-agent-development/)
- **Thuật ngữ liên quan:** Evaluation (Eval), Eval Set, Verification Gate, Precision & Recall

### Load Shedding
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Chủ động từ chối, loại bỏ hoặc hủy một số công việc tại một hay nhiều ranh giới quá tải khi nhu cầu vượt quá năng lực sẵn có để tạo kết quả hữu ích.
- **Vì sao quan trọng:** Tiếp tục chấp nhận mọi yêu cầu trong lúc quá tải có thể làm hàng đợi tăng đến mức gần như mọi yêu cầu đều trễ hạn và việc khôi phục trở nên khó hơn.
- **Trong thực tế:** Loại bỏ công việc tại ranh giới sớm nhất có đủ thông tin, giữ lại công việc ưu tiên cao và đã được tiếp nhận khi có thể, xác định phạm vi quá tải, và chỉ đánh dấu phản hồi có thể thử lại khi điều kiện tạm thời và yêu cầu vẫn trong ngân sách thử lại.
- **Nhầm lẫn thường gặp:** Load shedding không chỉ giới hạn ở công việc đã được chấp nhận. Admission control cụ thể là cổng trước khi chấp nhận, còn rate limiting có thể thực thi chính sách sử dụng ngay cả khi vẫn còn năng lực.
- **Thuật ngữ liên quan:** Admission Control, Backpressure, Rate Limit, Graceful Degradation
- **Nguồn:** [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/)

### Logits
- **Danh mục:** Mô hình & suy luận
- **Ý nghĩa thực tế:** Điểm số dạng số chưa chuẩn hóa của mô hình cho các kết quả ứng viên trước khi hàm chuẩn hóa hoặc quy tắc giải mã chuyển chúng thành lựa chọn.
- **Vì sao quan trọng:** Temperature, softmax, top-k và top-p hoạt động trên logits hoặc được suy ra từ chúng, nên logits kết nối phép tính của mô hình với token được tạo.
- **Trong thực tế:** Kiểm tra logits hoặc log probability khi API cung cấp, áp dụng mask trước khi lấy mẫu và tránh diễn giải độ lớn thô thành độ tin cậy đã hiệu chuẩn.
- **Nhầm lẫn thường gặp:** Logits không phải xác suất và không thể so sánh giữa các vị trí, mô hình hoặc tác vụ không liên quan nếu thiếu phép biến đổi được xác định.
- **Thuật ngữ liên quan:** Softmax, Temperature, Token, Cross-Entropy
- **Nguồn:** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

### LoRA (Low-Rank Adaptation)
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Fine-tuning tiết kiệm tham số.
- **Ý nghĩa thực tế:** Một phương pháp giữ cố định trọng số nền và học ma trận cập nhật hạng thấp cho các lớp được chọn. Nó giảm số tham số cần huấn luyện và có thể giảm bộ nhớ huấn luyện so với fine-tuning toàn bộ tham số.
- **Nhầm lẫn thường gặp:** Mức tiết kiệm bộ nhớ và tốc độ thực tế phụ thuộc vào hạng, module đích, trạng thái bộ tối ưu hóa, bộ nhớ activation, lượng tử hóa và cách triển khai.
- **Học nội dung này:** [Fine-Tuning and LoRA](../phases/11-llm-engineering/08-fine-tuning-lora/)
- **Nguồn:** [LoRA paper](https://arxiv.org/abs/2106.09685)
- **Thuật ngữ liên quan:** Fine-tuning, QLoRA, Parameter

### Loss Function
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Một con số đo lỗi huấn luyện.
- **Ý nghĩa thực tế:** Một mục tiêu ánh xạ dự đoán và mục tiêu, đôi khi kèm các hạng tử chính quy hóa, thành một giá trị mà quá trình tối ưu hóa cố giảm. Hàm mất mát quyết định những lỗi nào được quá trình huấn luyện trực tiếp thưởng hoặc phạt.
- **Nhầm lẫn thường gặp:** Hàm mất mát huấn luyện thấp không bảo đảm hành vi hữu ích, an toàn hoặc khái quát hóa trên tác vụ sản xuất.
- **Thuật ngữ liên quan:** Cross-Entropy, Gradient, Evaluation (Eval)

### Lost in the Middle
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Một kiểu lỗi ngữ cảnh dài trong đó hiệu suất mô hình thay đổi theo vị trí bằng chứng và có thể suy giảm khi thông tin liên quan nằm giữa phần đầu và cuối.
- **Vì sao quan trọng:** Đưa bằng chứng vào cửa sổ ngữ cảnh không bảo đảm mô hình sử dụng mọi vị trí với độ tin cậy như nhau.
- **Trong thực tế:** Kiểm thử nhiều vị trí bằng chứng, giảm yếu tố gây nhiễu, đặt các ràng buộc then chốt cho quyết định ở vị trí vẫn nổi bật và xác minh câu trả lời dựa trên nguồn.
- **Nhầm lẫn thường gặp:** Đây là mẫu hành vi đã quan sát, không phải quy luật cố định ảnh hưởng mọi mô hình, tác vụ hay vị trí giống hệt nhau.
- **Thuật ngữ liên quan:** Context Window, Context Engineering, Eval Set, Grounding
- **Nguồn:** [Lost in the Middle](https://aclanthology.org/2024.tacl-1.9/)

## M

### Maximum Marginal Relevance (MMR)
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Một quy tắc lựa chọn cân bằng mức độ liên quan với truy vấn và tính mới so với các mục đã chọn.
- **Vì sao quan trọng:** Nó có thể giảm các chunk dư thừa để ngân sách ngữ cảnh hạn chế bao phủ nhiều bằng chứng riêng biệt hơn.
- **Trong thực tế:** Truy xuất một tập ứng viên, chọn mục tiếp theo bằng trọng số liên quan-đa dạng đã ghi rõ và đánh giá cả chất lượng câu trả lời lẫn độ bao phủ nguồn.
- **Nhầm lẫn thường gặp:** MMR đa dạng hóa tập ứng viên hiện có; nó không truy xuất bằng chứng còn thiếu và không chứng minh đoạn được chọn là chính xác.
- **Thuật ngữ liên quan:** Reranker, Chunking, RAG (Retrieval-Augmented Generation), Grounding
- **Nguồn:** [The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries](https://www.cs.cmu.edu/~jgc/publication/MMR_DiversityBased_Reranking_SIGIR_1998.pdf)

### MCP (Model Context Protocol)
- **Danh mục:** Agent & công cụ
- **Mọi người thường nói:** Một cách tiêu chuẩn để ứng dụng AI kết nối với công cụ và ngữ cảnh.
- **Ý nghĩa thực tế:** Một giao thức JSON-RPC mở cho phép host kết nối đến server cung cấp công cụ, tài nguyên, prompt và phần mở rộng qua hợp đồng xác định cho yêu cầu, kết quả, khám phá và truyền tải. Trong bản sửa đổi 2026-07-28, mỗi yêu cầu mang theo phiên bản giao thức và năng lực client thay vì dựa vào bắt tay khởi tạo hoặc phiên giao thức.
- **Nhầm lẫn thường gặp:** MCP tiêu chuẩn hóa việc khám phá và trao đổi. Nó không quyết định công cụ nào an toàn để gọi, không cấp quyền và không cấm ứng dụng dùng các handle trạng thái tường minh.
- **Học nội dung này:** [Model Context Protocol](../phases/11-llm-engineering/14-model-context-protocol/)
- **Nguồn:** [MCP 2026-07-28 key changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- **Thuật ngữ liên quan:** Stateless MCP, Multi Round-Trip Request (MRTR), Function Calling, Tool Contract, Least Privilege

### Membership Inference
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Một cuộc tấn công ước lượng liệu một bản ghi hoặc ví dụ cụ thể có nằm trong dữ liệu huấn luyện của mô hình hay không bằng cách quan sát đầu ra mô hình hoặc tín hiệu khác có thể truy cập.
- **Vì sao quan trọng:** Ngay cả khi mô hình không tái tạo nguyên văn một bản ghi, hành vi có thể phân biệt được vẫn có thể tiết lộ thông tin về việc tham gia vào một tập dữ liệu nhạy cảm.
- **Trong thực tế:** Kiểm thử các thành viên và không phải thành viên đại diện qua giao diện truy vấn thực tế, hạn chế các tín hiệu độ tin cậy không cần thiết, giảm phơi lộ dữ liệu và đánh giá biện pháp bảo vệ quyền riêng tư so với yêu cầu tiện ích.
- **Nhầm lẫn thường gặp:** Membership inference hỏi một bản ghi có tham gia huấn luyện hay không. Model extraction cố tái tạo hành vi mô hình, còn kiểm tra ghi nhớ trực tiếp xem có thể khôi phục nội dung hay không.
- **Học nội dung này:** [Differential Privacy for LLMs](../phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/)
- **Thuật ngữ liên quan:** Data Leakage, Data Minimization, Eval Set, Data Classification
- **Nguồn:** [Membership Inference Attacks Against Machine Learning Models](https://doi.org/10.1109/SP.2017.41)

### Mixed Precision
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Dùng số học độ chính xác thấp hơn để tăng tốc và tiết kiệm bộ nhớ.
- **Ý nghĩa thực tế:** Một chiến lược số học dùng các kiểu dữ liệu khác nhau cho các phép toán khác nhau, thường dùng độ chính xác thấp hơn cho nhiều phép toán ma trận và độ chính xác cao hơn cho các giá trị cần phạm vi hoặc độ ổn định lớn hơn.
- **Nhầm lẫn thường gặp:** Ảnh hưởng đến tốc độ, bộ nhớ và độ chính xác phụ thuộc vào phần cứng, kiểu dữ liệu, phương pháp scale, kernel và mô hình. Chúng không phải hệ số cố định.
- **Thuật ngữ liên quan:** Tensor, CUDA, NaN (Not a Number), Quantization

### Modality
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một dạng thông tin có cấu trúc và quy trình thu nhận riêng, chẳng hạn văn bản, ảnh, âm thanh, video, độ sâu hoặc phép đo cảm biến.
- **Vì sao quan trọng:** Các phương thức có tốc độ lấy mẫu, nhiễu, cấu trúc không gian hoặc thời gian và đặc điểm khi thiếu dữ liệu khác nhau, nên hiếm khi một giả định tiền xử lý phù hợp với tất cả.
- **Trong thực tế:** Ghi lại nguồn, đơn vị, độ phân giải, thời gian, tiền xử lý và chính sách giá trị thiếu của từng phương thức trước khi thiết kế căn chỉnh hoặc hợp nhất.
- **Nhầm lẫn thường gặp:** Modality không chỉ là phần mở rộng tệp hay cột đặc trưng. Nhiều kiểu mã hóa có thể biểu diễn một phương thức và một mẫu có thể chứa nhiều phương thức.
- **Học nội dung này:** [MIO Any-to-Any Streaming](../phases/12-multimodal-ai/16-mio-any-to-any-streaming/)
- **Thuật ngữ liên quan:** Multimodal Model, Token, Tensor, Embedding
- **Nguồn:** [ImageBind: One Embedding Space To Bind Them All](https://arxiv.org/abs/2305.05665); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Modality Alignment
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Học hoặc thiết lập tương ứng giữa các biểu diễn từ những phương thức khác nhau để có thể khớp các mục liên quan về ngữ nghĩa hoặc thời gian.
- **Vì sao quan trọng:** Hợp nhất và truy xuất xuyên phương thức thất bại khi hệ thống không thể kết nối cùng sự kiện, đối tượng hoặc khái niệm giữa các đầu vào có cấu trúc khác nhau.
- **Trong thực tế:** Xác định cặp dương và âm, giữ metadata thời gian hoặc không gian, đánh giá ví dụ không khớp và đo riêng alignment với độ chính xác tác vụ phía sau.
- **Nhầm lẫn thường gặp:** Alignment khiến các biểu diễn có thể so sánh hoặc tương ứng. Nó không đòi hỏi chúng trở nên giống hệt nhau hay xóa bỏ thông tin riêng của từng phương thức.
- **Học nội dung này:** [Projection Layer Modality Alignment](../phases/19-capstone-projects/60-projection-layer-modality-align/)
- **Thuật ngữ liên quan:** Shared Embedding Space, Contrastive Learning, Grounding, Multimodal Fusion
- **Nguồn:** [Learning Transferable Visual Models From Natural Language Supervision](https://proceedings.mlr.press/v139/radford21a.html)

### Model Card
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Báo cáo có cấu trúc mô tả mục đích sử dụng, điều kiện đánh giá, đặc điểm hiệu suất, giới hạn và các cân nhắc đạo đức hoặc an toàn liên quan của mô hình.
- **Vì sao quan trọng:** Nó cung cấp cho người xây dựng ở bước sau ngữ cảnh để quyết định liệu bằng chứng được báo cáo có áp dụng cho người dùng và điều kiện triển khai của họ hay không.
- **Trong thực tế:** Ghi lại phiên bản mô hình, phạm vi huấn luyện và đánh giá, kết quả theo nhóm con, kiểu lỗi đã biết, mục đích sử dụng bị cấm và ngày của từng tuyên bố.
- **Nhầm lẫn thường gặp:** Model card truyền đạt bằng chứng và giới hạn; nó không phải chứng nhận, bảo hành, mô hình đe dọa hệ thống hay vật thay thế cho đánh giá theo triển khai cụ thể.
- **Thuật ngữ liên quan:** Eval Set, Dataset Split, Distribution Shift, Alignment
- **Nguồn:** [Model Cards for Model Reporting](https://dl.acm.org/doi/10.1145/3287560.3287596)

### Model Router
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một thành phần chọn mô hình hoặc nhà cung cấp cho yêu cầu theo các tiêu chí như năng lực, độ trễ, chi phí, kích thước ngữ cảnh, chính sách và tình trạng sẵn có hiện tại.
- **Vì sao quan trọng:** Các tác vụ và điều kiện lỗi khác nhau cần mô hình khác nhau; định tuyến có thể cải thiện chất lượng kết quả mà không gửi mọi yêu cầu đến lựa chọn lớn nhất.
- **Trong thực tế:** Gửi tác vụ trích xuất rủi ro thấp đến mô hình nhanh, rà soát mã phức tạp đến mô hình mạnh hơn và chỉ chuyển dự phòng sang nhà cung cấp đáp ứng cùng chính sách dữ liệu.
- **Nhầm lẫn thường gặp:** Định tuyến là một quyết định chính sách. Cân bằng tải ngẫu nhiên chỉ phân phối lưu lượng.
- **Thuật ngữ liên quan:** Evaluation (Eval), Circuit Breaker, Rate Limit, Cost per Successful Task

### Model Serving
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Môi trường chạy và lớp API tải hiện vật mô hình có phiên bản, chấp nhận yêu cầu suy luận, lập lịch thực thi, quản lý tài nguyên và trả kết quả theo hợp đồng vận hành.
- **Vì sao quan trọng:** Mô hình có năng lực vẫn có thể tạo ra sản phẩm thiếu tin cậy khi xếp hàng, batching, bố trí, phiên bản hóa, hủy và ranh giới phản hồi không được thiết kế tường minh.
- **Trong thực tế:** Cố định phiên bản mô hình và tokenizer, xác thực giới hạn yêu cầu, cung cấp tín hiệu sẵn sàng và độ trễ, kiểm soát mức đồng thời và kiểm thử quay lui trước khi định tuyến lưu lượng sản xuất.
- **Nhầm lẫn thường gặp:** Model serving rộng hơn một lần gọi suy luận và hẹp hơn toàn bộ ứng dụng, vốn có thể gồm cả truy xuất, công cụ, chính sách và trạng thái người dùng.
- **Học nội dung này:** [Self-Hosted Serving Selection](../phases/17-infrastructure-and-production/28-self-hosted-serving-selection/)
- **Thuật ngữ liên quan:** Inference, Model Router, Autoscaling, Observability
- **Nguồn:** [Clipper](https://arxiv.org/abs/1612.03079)

### MoE (Mixture of Experts)
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Một mô hình lớn chỉ kích hoạt một phần tham số cho mỗi token.
- **Ý nghĩa thực tế:** Một kiến trúc có nhiều mạng con chuyên gia và router đã học để chọn một tập con cho mỗi đơn vị đầu vào, thường là mỗi token. Kích hoạt thưa có thể tăng tổng năng lực tham số mà không dùng mọi chuyên gia trong mỗi lượt truyền xuôi.
- **Vì sao quan trọng:** Tính toán, bộ nhớ, giao tiếp, cân bằng định tuyến và chất lượng phụ thuộc vào kiến trúc cùng hệ thống phục vụ cụ thể.
- **Nhầm lẫn thường gặp:** Tên sản phẩm không chứng minh kiến trúc MoE trừ khi nhà phát triển mô hình công bố điều đó.
- **Học nội dung này:** [Mixture of Experts](../phases/07-transformers-deep-dive/11-mixture-of-experts/)
- **Thuật ngữ liên quan:** Transformer, Model Router, Parameter

### Multimodal Fusion
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Kết hợp bằng chứng hoặc biểu diễn đã học từ nhiều hơn một phương thức để tạo biểu diễn, dự đoán hoặc đầu ra được sinh chung.
- **Vì sao quan trọng:** Các phương thức có thể cung cấp bằng chứng bổ trợ, nhưng kết hợp ngây thơ có thể khuếch đại nhiễu, lỗi thời gian hoặc một luồng chi phối.
- **Trong thực tế:** Thiết lập mốc cơ sở đơn phương thức, nêu rõ điểm hợp nhất và mask, kiểm thử đầu vào thiếu và mâu thuẫn, đồng thời báo cáo phương thức nào tác động đến từng lát cắt được đánh giá.
- **Nhầm lẫn thường gặp:** Fusion là thao tác kết hợp. Alignment thiết lập sự tương ứng, còn việc chỉ đặt hai phương thức trong một yêu cầu không chứng minh rằng một trong hai việc đã diễn ra thành công.
- **Học nội dung này:** [Cross-Attention Fusion](../phases/19-capstone-projects/61-cross-attention-fusion/)
- **Thuật ngữ liên quan:** Early Fusion, Late Fusion, Cross-Attention, Modality Alignment
- **Nguồn:** [Multimodal Deep Learning](https://ai.stanford.edu/~ang/papers/icml11-MultimodalDeepLearning.pdf); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Multimodal Model
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một mô hình học từ, liên hệ hoặc tạo sinh nhiều hơn một phương thức thông qua biểu diễn, căn chỉnh, hợp nhất, chuyển đổi hoặc dự đoán phối hợp.
- **Vì sao quan trọng:** Năng lực đa phương thức phụ thuộc vào cách các phương thức tương tác, không chỉ vào việc chấp nhận nhiều loại đầu vào, và lỗi có thể xảy ra tại từng ranh giới biểu diễn.
- **Trong thực tế:** Ghi lại tổ hợp đầu vào và đầu ra được hỗ trợ, đánh giá riêng từng phương thức và khi kết hợp, kiểm thử đầu vào thiếu hoặc xung đột, đồng thời theo dõi phiên bản tiền xử lý cùng mô hình.
- **Nhầm lẫn thường gặp:** Một pipeline có mô hình ảnh và văn bản riêng là đa phương thức ở cấp hệ thống, nhưng chưa chắc là một mô hình đa phương thức được huấn luyện chung.
- **Học nội dung này:** [MIO Any-to-Any Streaming](../phases/12-multimodal-ai/16-mio-any-to-any-streaming/)
- **Thuật ngữ liên quan:** Modality, Vision-Language Model (VLM), Multimodal Fusion, Transformer
- **Nguồn:** [Flamingo: a Visual Language Model for Few-Shot Learning](https://arxiv.org/abs/2204.14198); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Multi Round-Trip Request (MRTR)
- **Danh mục:** Agent & công cụ
- **Bí danh:** MRTR
- **Ý nghĩa thực tế:** Một mẫu yêu cầu MCP trong đó thao tác trả về `resultType: input_required` cùng một hoặc nhiều `inputRequests`, sau đó client thử lại phương thức ban đầu với `inputResponses` và chính xác `requestState` đã trả về.
- **Vì sao quan trọng:** Nó cho phép server phi trạng thái yêu cầu đầu vào từ người dùng, mô hình hoặc root mà không mở trao đổi JSON-RPC do server khởi tạo hay lưu trạng thái phiên giao thức.
- **Trong thực tế:** Trả về yêu cầu đầu vào từ `tools/call`, thu thập phản hồi đã được cho phép bên trong host, rồi thử lại chính lần gọi công cụ đó với JSON-RPC id mới.
- **Nhầm lẫn thường gặp:** `requestState` là dữ liệu vòng khứ hồi không đáng tin. Hãy bảo vệ tính toàn vẹn của nó trước khi dùng cho quyết định ủy quyền hoặc nghiệp vụ, và đừng xem nó như mã định danh phiên phía server.
- **Học nội dung này:** [MCP Roots and Elicitation](../phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/)
- **Thuật ngữ liên quan:** Stateless MCP, MCP (Model Context Protocol), Human-in-the-Loop (HITL), Tool Contract
- **Nguồn:** [MCP Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)

## N

### NaN (Not a Number)
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Dấu hiệu cho thấy phép tính số học thất bại.
- **Ý nghĩa thực tế:** Một giá trị dấu phẩy động biểu diễn kết quả số học không xác định hoặc không thể biểu diễn. Trong quá trình huấn luyện, NaN có thể đến từ phép toán không hợp lệ, tràn số, chuẩn hóa bất ổn, cập nhật quá lớn hoặc giá trị bị hỏng từ trước.
- **Trong thực tế:** Tìm tensor không hữu hạn đầu tiên, kiểm tra đầu vào của nó và thêm assertion hoặc phát hiện bất thường gần phép toán đó.
- **Thuật ngữ liên quan:** Mixed Precision, Learning Rate, Gradient

### Normalization
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Co giãn dữ liệu về một khoảng chuẩn.
- **Ý nghĩa thực tế:** Một họ phép biến đổi co giãn hoặc định tâm đầu vào, activation hay feature bằng các thống kê được xác định. Batch normalization và layer normalization dùng các trục khác nhau và hoạt động khác nhau giữa huấn luyện và suy luận.
- **Nhầm lẫn thường gặp:** Normalization có thể cải thiện độ ổn định tối ưu hóa, nhưng không phải lúc nào cũng cho phép tốc độ học cao hơn hoặc cải thiện mọi kiến trúc.
- **Thuật ngữ liên quan:** Tensor, Activation Function, Mixed Precision

### Nucleus Sampling (Top-p)
- **Danh mục:** Mô hình & suy luận
- **Bí danh:** Top-p sampling
- **Ý nghĩa thực tế:** Một phương pháp giải mã lấy mẫu từ tập nhỏ nhất các ứng viên token tiếp theo có xác suất tích lũy đạt ngưỡng đã chọn.
- **Vì sao quan trọng:** Kích thước tập ứng viên điều chỉnh theo phân phối, giữ lại nhiều lựa chọn hơn khi độ bất định rộng và ít lựa chọn hơn khi xác suất tập trung.
- **Trong thực tế:** Đánh giá ngưỡng với temperature và thiết lập dừng được giữ cố định, đồng thời ghi lại cấu hình giải mã đầy đủ cùng từng kết quả.
- **Nhầm lẫn thường gặp:** Top-p là ngưỡng khối lượng xác suất, trong khi top-k luôn giữ số ứng viên tối đa cố định.
- **Thuật ngữ liên quan:** Top-k Sampling, Temperature, Decoding Strategy, Softmax
- **Nguồn:** [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)

## O

### Observability
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Khả năng hiểu hành vi hệ thống AI từ đầu vào, đầu ra, chuyển đổi trạng thái, lần gọi công cụ, thời gian, chi phí, lỗi và tín hiệu đánh giá được ghi lại.
- **Vì sao quan trọng:** Lỗi AI thường trải rộng qua mô hình, truy xuất, công cụ và điều phối. Bạn cần bằng chứng có liên kết để xác định ranh giới bị lỗi.
- **Trong thực tế:** Ghi trace ID xuyên suốt truy xuất, lần gọi mô hình, thực thi công cụ, phê duyệt và chấm điểm cuối cùng, đồng thời áp dụng che dữ liệu và kiểm soát truy cập.
- **Nhầm lẫn thường gặp:** Ghi log thu thập sự kiện. Observability khiến các sự kiện đó đủ có cấu trúc và liên kết để trả lời câu hỏi vận hành.
- **Học nội dung này:** [Agent Observability Platforms](../phases/14-agent-engineering/24-agent-observability-platforms/)
- **Thuật ngữ liên quan:** Trace, Evaluation (Eval), Agent State, Time to First Token (TTFT)

### Optimizer
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Thuật toán cập nhật trọng số.
- **Ý nghĩa thực tế:** Thuật toán biến đổi gradient thành cập nhật tham số. Stochastic gradient descent thuần túy là mốc cơ sở đơn giản; momentum, Adam và các bộ tối ưu hóa khác thay đổi cập nhật bằng lịch sử hoặc tỷ lệ thích nghi. Mỗi lựa chọn có đặc tính bộ nhớ, độ ổn định và tinh chỉnh khác nhau.
- **Nhầm lẫn thường gặp:** Bộ tối ưu hóa nhận gradient; backpropagation tính chúng.
- **Thuật ngữ liên quan:** Adam (Optimizer), AdamW, Gradient, Learning Rate

### Orchestration
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Logic điều khiển sắp xếp, phân nhánh, ủy quyền, thử lại, tạm dừng, tiếp tục và chấm dứt công việc qua các bước mô hình và công cụ.
- **Vì sao quan trọng:** Hành vi agent đáng tin cậy phụ thuộc vào quyết định quy trình tường minh bên ngoài mô hình, nhất là khi tác vụ có dependency hoặc tác dụng phụ có hệ quả.
- **Trong thực tế:** Mã hóa các bước ổn định thành quy trình hoặc máy trạng thái, cung cấp cho mô hình các quyết định có giới hạn và lưu chuyển trạng thái trước các lần ghi bên ngoài.
- **Nhầm lẫn thường gặp:** Orchestration không đồng nghĩa với tự chủ hay hệ thống đa agent; một agent có thể được điều phối qua quy trình có tính xác định.
- **Thuật ngữ liên quan:** Agent Harness, Planning, Delegation, Durable Execution
- **Nguồn:** [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

### Overfitting
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Mô hình đã ghi nhớ dữ liệu huấn luyện.
- **Ý nghĩa thực tế:** Khoảng cách khái quát hóa trong đó hiệu suất trên dữ liệu huấn luyện tốt hơn đáng kể so với trên dữ liệu chưa thấy có tính đại diện. Ghi nhớ có thể góp phần, nhưng biểu hiện vận hành là khái quát hóa kém.
- **Trong thực tế:** So sánh metric huấn luyện và giữ lại, kiểm tra lỗi theo nhóm con và thử thay đổi như chất lượng dữ liệu, regularization, dừng sớm hoặc năng lực mô hình.
- **Thuật ngữ liên quan:** Underfitting, Dropout, Weight Decay, Eval Set

## P

### Paged KV Cache
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Một bộ quản lý bộ nhớ KV-cache lưu trạng thái attention trong các khối kích thước cố định và ánh xạ vị trí chuỗi logic đến các khối vật lý thay vì yêu cầu một vùng cấp phát liên tục cho mỗi chuỗi.
- **Vì sao quan trọng:** Độ dài chuỗi biến thiên gây phân mảnh và tăng trưởng khó dự đoán, vì vậy cấp phát theo khối có thể cải thiện bộ nhớ dùng được và cho phép chia sẻ linh hoạt.
- **Trong thực tế:** Chọn kích thước khối từ số đo tải công việc, theo dõi cấp phát và loại bỏ, cô lập trạng thái giữa các yêu cầu và kiểm thử hủy cùng chia sẻ tiền tố khi chịu áp lực bộ nhớ.
- **Nhầm lẫn thường gặp:** Paged KV cache quản lý bộ nhớ trạng thái attention lúc chạy. Nó không chuyển tham số mô hình sang đĩa hay mở rộng giới hạn ngữ cảnh đã huấn luyện của mô hình.
- **Học nội dung này:** [vLLM Serving Internals](../phases/17-infrastructure-and-production/04-vllm-serving-internals/)
- **Thuật ngữ liên quan:** KV Cache, Prefix Caching, Context Window, Model Serving
- **Nguồn:** [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)

### Parameter
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Một con số dùng để mô tả kích thước mô hình.
- **Ý nghĩa thực tế:** Một giá trị được học trong quá trình huấn luyện, thường là trọng số, bias, phần tử embedding hoặc tham số normalization. Số lượng tham số là một thước đo năng lực mô hình, nhưng không trực tiếp quyết định chất lượng, bộ nhớ hay chi phí phục vụ.
- **Nhầm lẫn thường gặp:** Bộ nhớ mỗi tham số phụ thuộc định dạng số, metadata lượng tử hóa, phân mảnh, trạng thái bộ tối ưu hóa, activation và chi phí lúc chạy.
- **Thuật ngữ liên quan:** Weight, MoE (Mixture of Experts), Quantization

### Pass@k
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Trên một tập tác vụ, tỷ lệ tác vụ mà ít nhất một trong k ứng viên được lấy mẫu vượt qua kiểm tra tính đúng đắn đã xác định.
- **Vì sao quan trọng:** Nó đo giá trị của việc lấy mẫu nhiều lần thử cho các tác vụ như tạo mã, nơi bộ xác minh tự động có thể kiểm tra từng ứng viên.
- **Trong thực tế:** Tạo ứng viên độc lập theo cấu hình cố định, chạy cùng kiểm thử cô lập trên từng ứng viên và báo cáo k cùng chi tiết về cách lấy mẫu và ước lượng.
- **Nhầm lẫn thường gặp:** Pass@k không phải độ chính xác của một lần thử; điểm cao hơn có thể phản ánh ngân sách số lần thử lớn hơn thay vì câu trả lời đầu tiên tốt hơn.
- **Thuật ngữ liên quan:** Coding Agent, Regression Test, Eval Set, Test Oracle
- **Nguồn:** [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374)

### Patch
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một biểu diễn có thể rà soát của các thay đổi trên một hoặc nhiều tệp, thường thể hiện phần thêm và xóa so với một phiên bản nền đã biết.
- **Vì sao quan trọng:** Patch cung cấp cho người và agent một hiện vật hẹp để kiểm tra, kiểm thử, áp dụng hoặc từ chối mà không cần chấp nhận toàn bộ thư mục làm việc.
- **Trong thực tế:** Yêu cầu coding agent trả về unified diff, rồi xác minh nó chỉ tác động đến các tệp được phép và áp dụng sạch lên commit dự kiến.
- **Nhầm lẫn thường gặp:** Patch ghi lại thay đổi tệp, không ghi lại lý do, bằng chứng kiểm thử hay phê duyệt cần để phát hành chúng.
- **Học nội dung này:** [Workbench for Real Repositories](../phases/14-agent-engineering/41-workbench-for-real-repos/)
- **Thuật ngữ liên quan:** Coding Agent, Worktree, Scope Contract, Regression Test

### Patch Embedding
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một phép chiếu đã học chuyển patch ảnh thành vector độ rộng cố định, được dùng như một phần tử trong chuỗi đầu vào transformer.
- **Vì sao quan trọng:** Nó tạo giao diện giữa lưới ảnh không gian và mô hình chuỗi, trong đó kích thước patch kiểm soát số token và chi tiết cục bộ được giữ lại.
- **Trong thực tế:** Ghi kích thước patch và ảnh, xử lý padding hoặc đổi kích thước một cách tường minh, thêm thông tin vị trí và đo ảnh hưởng của thay đổi độ phân giải đến cả độ chính xác lẫn chi phí token.
- **Nhầm lẫn thường gặp:** Patch embedding là biểu diễn vector của một patch, không phải bộ phát hiện vật thể ngữ nghĩa và cũng không bảo đảm ranh giới patch khớp với thực thể thị giác.
- **Học nội dung này:** [Vision Transformer Patch Tokens](../phases/12-multimodal-ai/01-vision-transformer-patch-tokens/)
- **Thuật ngữ liên quan:** Vision Transformer (ViT), Image Token, Embedding, Token
- **Nguồn:** [An Image is Worth 16x16 Words](https://arxiv.org/abs/2010.11929)

### Perplexity
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Mức độ mô hình ngôn ngữ ngạc nhiên trước tập dữ liệu.
- **Ý nghĩa thực tế:** Giá trị nhận được khi áp dụng hàm mũ cho log-likelihood âm trung bình theo quy ước token hóa và logarithm đã nêu. Giá trị thấp hơn nghĩa là mô hình gán xác suất cao hơn cho chuỗi được đánh giá.
- **Nhầm lẫn thường gặp:** Không thể so sánh perplexity giữa các bộ token hóa hoặc thiết lập đánh giá khác nhau, và nó không trực tiếp đo tính đúng sự thật hay tính hữu ích.
- **Thuật ngữ liên quan:** Cross-Entropy, Token, Evaluation (Eval)

### Pipeline Parallelism
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Chia các nhóm lớp mô hình tuần tự qua nhiều thiết bị và đưa microbatch hoặc yêu cầu qua các giai đoạn đó như một pipeline.
- **Vì sao quan trọng:** Nó cho phép mô hình vượt quá bộ nhớ của một thiết bị, nhưng mất cân bằng giai đoạn, khoảng trống pipeline, truyền activation và phối hợp lỗi ảnh hưởng đến hiệu suất sử dụng được.
- **Trong thực tế:** Cân bằng chi phí các giai đoạn, chọn lịch microbatch, đo thời gian nhàn rỗi và lưu lượng liên kết, đồng thời phiên bản hóa metadata phân vùng mô hình và checkpoint.
- **Nhầm lẫn thường gặp:** Pipeline parallelism chia lớp theo chiều sâu. Tensor parallelism chia phép toán tensor bên trong một lớp.
- **Học nội dung này:** [Scaling and Distributed Training](../phases/10-llms-from-scratch/05-scaling-distributed/)
- **Thuật ngữ liên quan:** Tensor Parallelism, Expert Parallelism, Batch Size, Model Serving
- **Nguồn:** [GPipe](https://arxiv.org/abs/1811.06965)

### Planning
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Xây dựng, chọn hoặc sửa đổi chuỗi hành động và dependency nhằm chuyển từ trạng thái hiện tại đến mục tiêu.
- **Vì sao quan trọng:** Kế hoạch tường minh làm lộ giả định và thứ tự trước khi agent cam kết với hành động tốn kém hoặc không thể đảo ngược.
- **Trong thực tế:** Yêu cầu một kế hoạch ngắn có xét dependency, xác thực nó dựa trên công cụ và quyền hiện có, rồi lập lại kế hoạch khi quan sát làm mất hiệu lực một giả định.
- **Nhầm lẫn thường gặp:** Kế hoạch được tạo ra là đề xuất, không phải bằng chứng rằng các bước khả thi, đầy đủ hay an toàn.
- **Thuật ngữ liên quan:** Agent State, ReAct, Orchestration, Verification Gate
- **Nguồn:** [LLM+P](https://arxiv.org/abs/2304.11477)

### Postmortem
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Bản ghi sự cố bền vững giải thích tác động, phát hiện, ứng phó, điều kiện góp phần, khôi phục và hành động tiếp theo có người phụ trách mà không đổ lỗi thay cho phân tích.
- **Vì sao quan trọng:** Sự cố đã xử lý vẫn có giá trị như bằng chứng. Ghi lại điều kiện hệ thống và các quyết định biến một sự kiện thành cải tiến giảm tái diễn và thời gian phản hồi.
- **Trong thực tế:** Dựng dòng thời gian từ trace và log, phân biệt sự kiện kích hoạt với điều kiện góp phần, giao việc có hạn ngày và rà soát xem từng hành động có thay đổi biện pháp kiểm soát liên quan hay không.
- **Nhầm lẫn thường gặp:** Postmortem không phải biên bản họp hay cuộc tìm kiếm lỗi của một cá nhân. Nó nên tạo ra cải tiến hệ thống có thể kiểm thử.
- **Thuật ngữ liên quan:** Incident Response, Regression Test, Audit Log, Observability
- **Nguồn:** [Google SRE: Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)

### Precision & Recall
- **Danh mục:** Đánh giá & an toàn
- **Mọi người thường nói:** Hai metric cho chất lượng phân loại hoặc truy xuất.
- **Ý nghĩa thực tế:** Precision hỏi có bao nhiêu mục được gắn cờ là chính xác; recall hỏi đã tìm thấy bao nhiêu mục liên quan. Khi thay đổi ngưỡng quyết định của một mô hình chấm điểm cố định, tăng recall thường làm giảm precision và ngược lại. Mô hình tốt hơn có thể cải thiện cả hai. F1 là trung bình điều hòa của chúng.
- **Nhầm lẫn thường gặp:** Ngưỡng và metric phù hợp phụ thuộc vào chi phí của từng lỗi và tỷ lệ phổ biến của lớp mục tiêu.
- **Thuật ngữ liên quan:** Eval Set, Semantic Search, Guardrails

### Prefill
- **Danh mục:** Hạ tầng & phục vụ
- **Bí danh:** Prefill Phase
- **Ý nghĩa thực tế:** Giai đoạn suy luận ban đầu xử lý toàn bộ token đầu vào được cung cấp để tạo biểu diễn và trạng thái attention cần cho quá trình tạo sinh tự hồi quy tiếp theo.
- **Vì sao quan trọng:** Hình dạng prompt, xếp hàng và tái sử dụng cache ảnh hưởng chi phí prefill; prefill cạnh tranh tài nguyên tính toán khác với decode, nên tác động mạnh đến độ trễ khởi động và lịch phục vụ.
- **Trong thực tế:** Ghi số token prompt và độ trễ prefill, tách thời gian xếp hàng khỏi thời gian thực thi, so sánh tiền tố có và không cache, đồng thời kiểm thử prompt dài bên cạnh lưu lượng decode đang hoạt động.
- **Nhầm lẫn thường gặp:** Prefill là giai đoạn xử lý prompt lúc chạy, không phải chính token được sinh đầu tiên. Token đầu tiên chỉ xuất hiện sau khi prefill và mọi thời gian xếp hàng hoàn tất.
- **Học nội dung này:** [Disaggregated Prefill and Decode](../phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/)
- **Thuật ngữ liên quan:** Decode Phase, KV Cache, Time to First Token (TTFT), Chunked Prefill
- **Nguồn:** [Sarathi-Serve](https://www.usenix.org/system/files/osdi24-agrawal.pdf); [DistServe](https://arxiv.org/abs/2401.09670)

### Prefix Caching
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Tái sử dụng các khối KV-cache được tạo cho tiền tố token đủ điều kiện giống hệt nhau giữa các yêu cầu để môi trường chạy dịch vụ bỏ qua phép tính tiền tố lặp lại.
- **Vì sao quan trọng:** Chỉ dẫn hệ thống, mẫu hoặc tài liệu dùng chung có thể tiêu tốn đáng kể công việc prefill, nhưng việc tái sử dụng chỉ có ích khi chuỗi token và điều kiện cache khớp nhau.
- **Trong thực tế:** Đặt token ổn định trước nội dung riêng cho từng yêu cầu, đưa phiên bản mô hình và tokenizer vào định danh cache, cô lập trạng thái nhạy cảm của tenant, theo dõi tỷ lệ hit và xem việc loại bỏ là bình thường.
- **Nhầm lẫn thường gặp:** Prefix caching tái sử dụng trạng thái attention lúc chạy cho tiền tố token chính xác. Prompt caching là hợp đồng tái sử dụng rộng hơn của nhà cung cấp hoặc ứng dụng, còn semantic caching tái sử dụng kết quả trước đó cho yêu cầu tương tự.
- **Học nội dung này:** [Inference Optimization](../phases/10-llms-from-scratch/12-inference-optimization/)
- **Thuật ngữ liên quan:** Prompt Cache, Semantic Cache, KV Cache, Paged KV Cache
- **Nguồn:** [SGLang](https://arxiv.org/abs/2312.07104)

### Progressive Disclosure
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Cung cấp cho người hoặc mô hình ngữ cảnh hữu ích tối thiểu trước, rồi tiết lộ chi tiết sâu hơn khi tác vụ hoặc bằng chứng yêu cầu.
- **Vì sao quan trọng:** Nó giới hạn nhiễu ngữ cảnh và chi phí trong khi vẫn giữ chi tiết có thẩm quyền sẵn có khi cần.
- **Trong thực tế:** Trước tiên cung cấp cho coding agent quy tắc và sơ đồ kho mã; chỉ tải các tệp triển khai đầy đủ sau khi agent xác định module liên quan.
- **Nhầm lẫn thường gặp:** Progressive disclosure là truy cập chi tiết theo từng giai đoạn, không phải cố ý giữ lại thông tin cần thiết cho quyết định.
- **Học nội dung này:** [Workbench for Real Repositories](../phases/14-agent-engineering/41-workbench-for-real-repos/)
- **Thuật ngữ liên quan:** Context Engineering, Repository Map, Token Budget, Handoff

### Prompt Cache
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Tái sử dụng phép tính phía nhà cung cấp hoặc ứng dụng cho tiền tố prompt giống hệt hoặc đủ điều kiện để suy luận lặp lại tránh được một phần công việc tiền xử lý.
- **Vì sao quan trọng:** Chỉ dẫn ổn định và tài liệu dùng chung lớn có thể rẻ hoặc nhanh hơn qua các lần gọi lặp lại khi đáp ứng hợp đồng cache của nhà cung cấp.
- **Trong thực tế:** Đặt văn bản chính sách ổn định trước nội dung riêng cho từng yêu cầu, theo dõi metadata cache hit và xem cache miss là bình thường vì điều kiện đủ tiêu chuẩn cùng thời hạn thay đổi theo nhà cung cấp.
- **Nhầm lẫn thường gặp:** Prompt cache là hợp đồng tái sử dụng của nhà cung cấp hoặc ứng dụng và có thể dùng prefix caching bên trong. Prefix caching cụ thể tái sử dụng trạng thái KV chính xác theo token đủ điều kiện, còn semantic caching tái sử dụng kết quả trước cho yêu cầu đủ tương tự.
- **Học nội dung này:** [Prompt Caching](../phases/11-llm-engineering/15-prompt-caching/)
- **Thuật ngữ liên quan:** Semantic Cache, Prefix Caching, KV Cache, Time to First Token (TTFT)

### Prompt Engineering
- **Danh mục:** Prompt & ngữ cảnh
- **Mọi người thường nói:** Viết chỉ dẫn sao cho mô hình làm theo tác vụ.
- **Ý nghĩa thực tế:** Thiết kế chỉ dẫn hướng đến mô hình, ví dụ, ràng buộc và yêu cầu đầu ra để cải thiện hành vi trên tác vụ đã xác định.
- **Nhầm lẫn thường gặp:** Cách viết prompt không thể bù cho bằng chứng thiếu, quyền hạn không an toàn, hợp đồng công cụ kém hay việc không đánh giá.
- **Học nội dung này:** [Prompt Engineering](../phases/11-llm-engineering/01-prompt-engineering/)
- **Thuật ngữ liên quan:** Context Engineering, Few-Shot, System Prompt, Structured Output

### Prompt Injection
- **Danh mục:** Đánh giá & an toàn
- **Mọi người thường nói:** Một chỉ dẫn đối kháng chuyển hướng mô hình.
- **Ý nghĩa thực tế:** Một kiểu tấn công hoặc lỗi trong đó nội dung không đáng tin ảnh hưởng đến mô hình khiến nó bỏ qua chỉ dẫn dự định, làm lộ dữ liệu, lạm dụng công cụ hoặc hành động ngoài mục tiêu của người dùng. Nội dung có thể đến trực tiếp từ người dùng hoặc gián tiếp qua trang, tệp, tin nhắn hay đầu ra công cụ được truy xuất.
- **Vì sao quan trọng:** Mô hình xử lý chỉ dẫn và dữ liệu qua cùng một kênh ngôn ngữ, nên chỉ lọc đầu vào không thể phân tách đáng tin mọi chỉ dẫn độc hại khỏi nội dung hợp lệ.
- **Trong thực tế:** Xem nội dung bên ngoài là không đáng tin, tách nó khỏi chỉ dẫn có thẩm quyền, giảm thiểu quyền công cụ, yêu cầu phê duyệt thao tác ghi có hệ quả và xác minh đầu ra cùng hành động.
- **Nhầm lẫn thường gặp:** Prompt injection về mặt kỹ thuật không cùng cơ chế với SQL injection, và system prompt mạnh hơn không phải biện pháp phòng thủ hoàn chỉnh.
- **Học nội dung này:** [Prompt Injection Defense](../phases/14-agent-engineering/27-prompt-injection-defense/)
- **Nguồn:** [OWASP prompt injection guidance](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- **Thuật ngữ liên quan:** Least Privilege, Sandbox, Approval Gate, Tool Contract

### Prompt Sensitivity
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Biến thiên trong đầu ra hoặc hiệu suất đo được của mô hình do thay đổi cách diễn đạt, thứ tự, định dạng hoặc ví dụ trong prompt dù vẫn giữ nguyên tác vụ dự định.
- **Vì sao quan trọng:** Hệ thống thành công với một cách diễn đạt thuận tiện có thể không đáng tin với người dùng thực hoặc tạo kết quả đánh giá sai lệch.
- **Trong thực tế:** Tạo các biến thể prompt tương đương về ngữ nghĩa, đo phương sai theo từng trường hợp và giữ các biến thể trong kiểm thử hồi quy thay vì tối ưu một prompt trên một tập eval duy nhất.
- **Nhầm lẫn thường gặp:** Độ nhạy không phải lúc nào cũng là lỗi prompt; nó có thể cho thấy sự mơ hồ, độ bền mô hình yếu, giải mã bất ổn hoặc quy tắc chấm điểm không phù hợp.
- **Thuật ngữ liên quan:** Prompt Engineering, Eval Set, Regression Test, Few-Shot
- **Nguồn:** [ProSA](https://aclanthology.org/2024.findings-emnlp.108/)

### Provenance Attestation
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Metadata có thể đọc bằng máy và đã xác thực, gắn hiện vật với các tuyên bố về cách thức, nơi chốn, thời điểm và đầu vào đã dùng để tạo ra nó.
- **Vì sao quan trọng:** Nó cho phép chính sách tự động và người rà soát xác minh tuyên bố về chuỗi cung ứng thay vì tin một ghi chú build không chữ ký.
- **Trong thực tế:** Tạo attestation trong hệ thống build, gắn nó với digest hiện vật, ký bằng danh tính được kiểm soát và xác minh trước khi phát hành.
- **Nhầm lẫn thường gặp:** Chữ ký xác định bên chứng thực và bảo vệ tính toàn vẹn; nó không chứng minh mọi tuyên bố trong attestation đều đúng.
- **Thuật ngữ liên quan:** Data Provenance, Reproducible Build, Audit Log, Verification Gate
- **Nguồn:** [SLSA Software Attestations](https://slsa.dev/spec/v1.2/attestation-model)

### Purpose Limitation
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Đối với dữ liệu cá nhân, chỉ thu thập và sử dụng dữ liệu cho mục đích cụ thể, tường minh trừ khi cách dùng mới có cơ sở tương thích hoặc được ủy quyền phù hợp.
- **Vì sao quan trọng:** Dữ liệu phù hợp cho một quy trình có thể tạo rủi ro quyền riêng tư và quản trị khi bị âm thầm tái sử dụng cho huấn luyện mô hình, đánh giá, cá nhân hóa hoặc phân tích không liên quan.
- **Trong thực tế:** Ghi mục đích cho từng tập dữ liệu, kiểm tra pipeline mới với mục đích đó trước khi truy cập, tách biệt các cách dùng không tương thích và yêu cầu quyết định được ghi chép khi mục đích thay đổi.
- **Nhầm lẫn thường gặp:** Giới hạn mục đích điều chỉnh lý do sử dụng dữ liệu. Tối thiểu hóa dữ liệu điều chỉnh lượng dữ liệu mà mục đích đó thực sự cần.
- **Thuật ngữ liên quan:** Data Minimization, Data Classification, AI Risk Assessment, Audit Log
- **Nguồn:** [General Data Protection Regulation, Article 5(1)(b)](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

## Q

### QLoRA
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** LoRA với mô hình nền đã lượng tử hóa.
- **Ý nghĩa thực tế:** Một phương pháp fine-tuning tiết kiệm tham số, giữ nguyên mô hình nền đã tiền huấn luyện ở biểu diễn lượng tử hóa bit thấp trong khi huấn luyện adapter LoRA bằng phép tính độ chính xác cao hơn khi cần.
- **Vì sao quan trọng:** Nó có thể giảm bộ nhớ cần để điều chỉnh mô hình lớn, nhưng mức tiết kiệm và chất lượng phụ thuộc vào mô hình, hạng, bộ tối ưu hóa, độ dài chuỗi, phần cứng và cách triển khai.
- **Nhầm lẫn thường gặp:** QLoRA không bảo đảm mức dùng bộ nhớ cụ thể hay khoảng cách chất lượng cố định so với fine-tuning đầy đủ.
- **Học nội dung này:** [Fine-Tuning and LoRA](../phases/11-llm-engineering/08-fine-tuning-lora/)
- **Nguồn:** [QLoRA paper](https://arxiv.org/abs/2305.14314)
- **Thuật ngữ liên quan:** LoRA (Low-Rank Adaptation), Quantization, Fine-tuning

### Quantization
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Lưu trữ hoặc tính toán giá trị mô hình bằng ít bit hơn.
- **Ý nghĩa thực tế:** Biểu diễn trọng số, activation hoặc cache bằng định dạng độ chính xác thấp hơn để giảm bộ nhớ, băng thông hoặc chi phí tính toán. Các phương pháp khác nhau về hiệu chuẩn, độ hạt, kiểu dữ liệu và việc chuyển đổi diễn ra trước, trong hay sau huấn luyện.
- **Nhầm lẫn thường gặp:** Chuyển từ độ rộng bit danh nghĩa này sang độ rộng khác không bảo đảm cùng tỷ lệ bộ nhớ hay tốc độ đầu-cuối vì metadata, kernel, cache và hỗ trợ phần cứng cũng quan trọng.
- **Thuật ngữ liên quan:** QLoRA, Mixed Precision, Parameter

## R

### RAG (Retrieval-Augmented Generation)
- **Danh mục:** Truy xuất & tạo sinh
- **Mọi người thường nói:** Mô hình trả lời bằng kiến thức được truy xuất.
- **Ý nghĩa thực tế:** Một mẫu hệ thống truy xuất bằng chứng liên quan đến yêu cầu rồi cung cấp nội dung được chọn cho mô hình tạo sinh trước khi mô hình trả lời hoặc hành động. Truy xuất có thể dùng phương pháp từ vựng, vector, có cấu trúc hoặc kết hợp.
- **Vì sao quan trọng:** RAG có thể đưa bằng chứng hiện hành hoặc riêng tư vào sử dụng mà không mã hóa nó trong trọng số mô hình, nhưng cần đánh giá riêng việc truy xuất và grounding.
- **Vì sao có tên gọi này:** Retrieval tìm bằng chứng, augmentation thêm bằng chứng được chọn vào ngữ cảnh, còn generation tạo phản hồi.
- **Học nội dung này:** [Retrieval-Augmented Generation](../phases/11-llm-engineering/06-rag/)
- **Nguồn:** [Retrieval-Augmented Generation paper](https://arxiv.org/abs/2005.11401)
- **Thuật ngữ liên quan:** Grounding, Hybrid Retrieval, Reranker, Hallucination

### Rate Limit
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Chính sách giới hạn yêu cầu, token, công việc đồng thời hoặc tài nguyên khác trong một cửa sổ thời gian hay năng lực đã xác định.
- **Vì sao quan trọng:** Nó bảo vệ nhà cung cấp và hệ thống của bạn khỏi quá tải, chi tiêu không kiểm soát và sử dụng tài nguyên không công bằng.
- **Trong thực tế:** Thực thi giới hạn token và đồng thời theo tenant, đọc metadata thử lại của nhà cung cấp, đồng thời xếp hàng hoặc từ chối công việc vượt mức một cách dự đoán được.
- **Nhầm lẫn thường gặp:** Rate limit kiểm soát mức sử dụng được phép. Backpressure truyền ràng buộc năng lực phía dưới xuyên suốt hệ thống.
- **Thuật ngữ liên quan:** Backpressure, Retry with Backoff, Circuit Breaker

### ReAct
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Một mẫu agent xen kẽ suy luận tác vụ, hành động cụ thể và quan sát từ môi trường trước khi quyết định bước tiếp theo.
- **Vì sao quan trọng:** Phản hồi môi trường có thể sửa giả định và grounding các quyết định tiếp theo thay vì buộc mô hình hoàn thành toàn bộ tác vụ chỉ bằng tạo sinh nội bộ.
- **Trong thực tế:** Cung cấp một nhóm nhỏ công cụ có kiểu, trả về quan sát ngắn gọn, giới hạn vòng lặp và xác minh hiện vật cuối cùng thay vì lưu trace suy luận riêng tư.
- **Nhầm lẫn thường gặp:** ReAct là mẫu prompt và điều khiển, không bảo đảm tính tự chủ, đúng đắn hay sử dụng công cụ an toàn.
- **Thuật ngữ liên quan:** Agent, Function Calling, Planning, Grounding
- **Nguồn:** [ReAct](https://arxiv.org/abs/2210.03629)

### Readiness Probe
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Một phép chẩn đoán cho lớp định tuyến lưu lượng biết liệu một instance dịch vụ hiện có khả năng nhận yêu cầu hay không.
- **Vì sao quan trọng:** Tiến trình có thể còn sống trong khi mô hình chưa được tải, dependency không sẵn có hoặc quá trình warmup chưa xong, nên gửi lưu lượng quá sớm tạo lỗi có thể tránh được.
- **Trong thực tế:** Kiểm tra dependency tối thiểu cần để phục vụ, báo chưa sẵn sàng trong lúc khởi động và rút lưu lượng, giữ phép dò rẻ và không khởi động lại tiến trình chỉ vì readiness là false.
- **Nhầm lẫn thường gặp:** Readiness kiểm soát khả năng đủ điều kiện nhận lưu lượng. Liveness quyết định có nên khởi động lại tiến trình hay không; không phép nào chứng minh mọi phản hồi mô hình đều đúng.
- **Học nội dung này:** [Production LLM Application](../phases/11-llm-engineering/13-production-app/)
- **Thuật ngữ liên quan:** Autoscaling, Model Serving, Availability, Graceful Degradation
- **Nguồn:** [Kubernetes Liveness, Readiness, and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)

### Recall@K
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Với một truy vấn, Recall@K là `|relevant items intersecting the top k| / |relevant items|`. Điểm tập dữ liệu gộp các giá trị theo từng truy vấn bằng một quy tắc đã nêu.
- **Vì sao quan trọng:** Nó cho biết giai đoạn truy xuất có cung cấp đủ ứng viên liên quan cho bước tạo sinh hoặc xếp hạng lại phía sau hay không.
- **Trong thực tế:** Xác định phán đoán mức liên quan, k, phương pháp gộp và chính sách cho truy vấn không có mục liên quan đã được đánh giá, sau đó kiểm tra truy vấn không thu hồi được bằng chứng nào.
- **Nhầm lẫn thường gặp:** Recall@K cao không có nghĩa kết quả đầu tốt, thứ hạng được sắp xếp đúng hay câu trả lời cuối cùng được grounding. Truy vấn không có mục liên quan cần chính sách loại trừ hoặc gán giá trị tường minh vì mẫu số bằng không.
- **Thuật ngữ liên quan:** Precision & Recall, Eval Set, Reranker, Approximate Nearest Neighbor (ANN)
- **Nguồn:** [BEIR](https://openreview.net/forum?id=wCu6T5xFjeJ)

### Reciprocal Rank Fusion (RRF)
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Một phương pháp hợp nhất thứ hạng, kết hợp nhiều danh sách kết quả bằng cách cộng các đóng góp giảm dần theo thứ hạng của từng mục trong mỗi danh sách.
- **Vì sao quan trọng:** Nó có thể gộp thứ hạng từ vựng, dày đặc hoặc nhiều truy vấn mà không giả định điểm thô của chúng dùng cùng thang đo.
- **Trong thực tế:** Truy xuất các danh sách ứng viên độc lập, khử trùng lặp theo danh tính tài liệu ổn định, áp dụng một hằng số hợp nhất có phiên bản và đánh giá so với từng bộ truy xuất riêng lẻ.
- **Nhầm lẫn thường gặp:** RRF kết hợp thứ hạng, không phải embedding hay điểm liên quan, và không thể khôi phục mục vắng mặt trong mọi danh sách đầu vào.
- **Thuật ngữ liên quan:** Hybrid Retrieval, BM25, Dense Retrieval, Reranker
- **Nguồn:** [Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods](https://dl.acm.org/doi/10.1145/1571941.1572114)

### Red Teaming
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Một quy trình kiểm thử đối kháng có cấu trúc, trong đó người kiểm thử được ủy quyền tìm lỗi theo mục tiêu, giả định mối đe dọa, trường hợp và bằng chứng được ghi chép.
- **Vì sao quan trọng:** Kiểm thử chất lượng thông thường hiếm khi khám phá cách hệ thống hành xử trước thao túng, lạm dụng, mục tiêu xung đột hoặc nỗ lực quyết liệt nhằm vượt qua biện pháp kiểm soát.
- **Trong thực tế:** Suy ra các cuộc tấn công từ mô hình mối đe dọa, chạy chúng trong môi trường cô lập, ghi lại trường hợp có thể tái tạo, khắc phục theo từng lớp và chuyển lỗi đã xác nhận thành eval hồi quy.
- **Nhầm lẫn thường gặp:** Danh sách prompt jailbreak không phải chương trình red-team hoàn chỉnh, và red teaming không thể chứng minh không tồn tại lỗi chưa biết.
- **Thuật ngữ liên quan:** Threat Model, Guardrails, Prompt Injection, Eval Set
- **Nguồn:** [Red Teaming Language Models with Language Models](https://arxiv.org/abs/2202.03286)

### Regression Test
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một phép kiểm tra có thể lặp lại, bảo vệ hành vi đã biết là hoạt động đúng, nhất là sau thay đổi mã, prompt, mô hình, truy xuất hoặc công cụ.
- **Vì sao quan trọng:** Thay đổi hệ thống AI có thể cải thiện chất lượng trung bình nhưng âm thầm làm tái xuất lỗi đã từng được sửa.
- **Trong thực tế:** Biến sự cố prompt injection đã khắc phục thành ca eval lâu dài phải vượt qua trước lần triển khai tiếp theo.
- **Nhầm lẫn thường gặp:** Kiểm thử hồi quy bảo vệ một hành vi mong đợi cụ thể. Benchmark rộng ước lượng hiệu suất trên phân phối tác vụ rộng hơn.
- **Học nội dung này:** [Eval-Driven Agent Development](../phases/14-agent-engineering/30-eval-driven-agent-development/)
- **Thuật ngữ liên quan:** Eval Set, Verification Gate, Patch, Evaluation (Eval)

### ReLU
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Một hàm activation đơn giản.
- **Ý nghĩa thực tế:** Rectified Linear Unit, được định nghĩa là `f(x) = max(0, x)`. Nó ít tốn kém và có nhánh dương không bão hòa, dù gradient bằng 0 ở đầu vào âm có thể tạo các đơn vị không hoạt động.
- **Thuật ngữ liên quan:** Activation Function, Gradient, CNN (Convolutional Neural Network)

### Repository Instructions
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Hướng dẫn được quản lý phiên bản, cho coding agent biết cấu trúc kho mã, lệnh và quy ước áp dụng, ranh giới cần tôn trọng và cách xác minh công việc.
- **Vì sao quan trọng:** Nó biến kiến thức ngầm được lặp lại thành ngữ cảnh cục bộ đi cùng mã và có thể khác nhau theo dự án con.
- **Trong thực tế:** Giữ `AGENTS.md` ở thư mục gốc kho mã, thêm tệp hẹp hơn cho thư mục con và đưa vào các quy tắc chính xác về build, kiểm thử, tệp sinh tự động, bảo mật và đóng góp.
- **Nhầm lẫn thường gặp:** Hướng dẫn kho mã bổ trợ cho mã nguồn và tài liệu dành cho con người; chúng không ghi đè yêu cầu hiện tại của người dùng hay bảo đảm agent làm theo chính xác.
- **Thuật ngữ liên quan:** Repository Map, Scope Contract, Coding Agent, Progressive Disclosure
- **Nguồn:** [AGENTS.md specification](https://agents.md/)

### Repository Map
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Mô tả ngắn gọn, được duy trì về các thư mục quan trọng, ranh giới sở hữu, điểm vào, lệnh build, kiểm thử, tệp sinh tự động và chỉ dẫn cục bộ của kho mã.
- **Vì sao quan trọng:** Nó giúp coding agent tìm bằng chứng phù hợp trước khi tải các tệp lớn hoặc chỉnh nhầm hệ thống con.
- **Trong thực tế:** Tạo chỉ mục từ cây thư mục và manifest, rồi bổ sung ghi chú có thẩm quyền về ranh giới module và lệnh xác thực.
- **Nhầm lẫn thường gặp:** Cây tệp thô hiển thị tên. Sơ đồ kho mã giải thích đường dẫn nào quan trọng và chúng liên hệ thế nào với tác vụ.
- **Học nội dung này:** [Repository Memory and State](../phases/14-agent-engineering/34-repo-memory-and-state/)
- **Thuật ngữ liên quan:** Coding Agent, Progressive Disclosure, Scope Contract, Context Engineering

### Reproducible Build
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một bản build có nguồn, môi trường và chỉ dẫn được khai báo, có thể được chạy độc lập lại để tạo ra các hiện vật được chỉ định giống hệt từng bit.
- **Vì sao quan trọng:** Nó khiến hiện vật có thể được xác minh ngoài máy hoặc agent ban đầu tạo ra và làm lộ các đầu vào build bị ẩn.
- **Trong thực tế:** Cố định phiên bản toolchain và dependency, loại bỏ dấu thời gian cùng thứ tự không ổn định, ghi lại môi trường rồi so sánh digest hiện vật được build độc lập.
- **Nhầm lẫn thường gặp:** Build thành công hai lần là bằng chứng có thể lặp lại, nhưng tính tái lập đòi hỏi các điều kiện độc lập đã khai báo và đầu ra giống hệt.
- **Thuật ngữ liên quan:** Repository Instructions, Verification Gate, Provenance Attestation, Software Bill of Materials (SBOM)
- **Nguồn:** [Reproducible Builds definition](https://reproducible-builds.org/docs/definition/)

### Reranker
- **Danh mục:** Truy xuất & tạo sinh
- **Ý nghĩa thực tế:** Mô hình giai đoạn hai hoặc hàm chấm điểm sắp xếp lại một tập ứng viên nhỏ bằng cách so sánh phong phú hơn giữa truy vấn và từng ứng viên.
- **Vì sao quan trọng:** Truy xuất giai đoạn đầu nhanh tối đa hóa độ bao phủ ứng viên, còn xếp hạng lại có thể cải thiện bằng chứng đi vào cửa sổ ngữ cảnh hạn chế.
- **Trong thực tế:** Truy xuất 50 ứng viên bằng tìm kiếm kết hợp, chấm từng cặp truy vấn-tài liệu bằng cross-encoder và chuyển 5 chunk được hỗ trợ hàng đầu sang bước tạo sinh.
- **Nhầm lẫn thường gặp:** Reranker không tìm kiếm toàn bộ kho ngữ liệu. Nó chỉ sắp xếp lại các ứng viên mà truy xuất đã tìm thấy.
- **Thuật ngữ liên quan:** Hybrid Retrieval, Semantic Search, RAG (Retrieval-Augmented Generation)

### Retry Budget
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Giới hạn lưu lượng thử lại, thường biểu diễn tương đối với yêu cầu gốc hoặc trong một cửa sổ thời gian, để ngăn việc thử lại tiêu thụ năng lực không giới hạn.
- **Vì sao quan trọng:** Khi dependency chậm hoặc lỗi, thử lại không giới hạn nhân tải đúng lúc hệ thống có ít năng lực dự phòng nhất.
- **Trong thực tế:** Đếm riêng lần thử lại với lần đầu, giới hạn theo dịch vụ và tenant, tuân thủ deadline, dùng backoff có jitter và dừng thử lại với lỗi không tạm thời hoặc không idempotent.
- **Nhầm lẫn thường gặp:** Ngân sách thử lại giới hạn số lần thử thêm. Ngân sách lỗi đo mức không tin cậy hướng đến người dùng mà SLO cho phép.
- **Thuật ngữ liên quan:** Retry with Backoff, Error Budget, Rate Limit, Admission Control
- **Nguồn:** [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

### Retry with Backoff
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Lặp lại một thao tác bị lỗi tạm thời sau các khoảng chờ tăng dần, thường có jitter ngẫu nhiên và giới hạn thử lại nghiêm ngặt.
- **Vì sao quan trọng:** Thử lại đồng bộ ngay lập tức có thể làm sự cố nặng hơn, tiêu thụ giới hạn tốc độ và nhân đôi tác dụng phụ.
- **Trong thực tế:** Thử lại sau timeout nhà cung cấp với các khoảng trễ theo hàm mũ có giới hạn, tuân theo hướng dẫn thử lại của server và dùng lại khóa idempotency cho mọi thao tác ghi.
- **Nhầm lẫn thường gặp:** Không thử lại các lỗi kiểm tra tính hợp lệ hoặc lỗi quyền hạn vĩnh viễn, và không thử lại thao tác không idempotent nếu chưa có chiến lược chống trùng lặp.
- **Thuật ngữ liên quan:** Idempotency, Rate Limit, Circuit Breaker, Backpressure

### Reviewer Agent
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Một agent được giao kiểm tra hiện vật hoặc quyết định của agent khác theo tiêu chí tường minh rồi trả về phát hiện hoặc kết luận.
- **Vì sao quan trọng:** Tách biệt vai trò có thể phát hiện thiếu sót, nhưng chỉ hữu ích khi reviewer nhận được bằng chứng độc lập và tiêu chí cụ thể.
- **Trong thực tế:** Sau khi một agent tạo bản vá, giao diff, hợp đồng phạm vi, quy tắc kho mã và đầu ra kiểm thử cho reviewer riêng, rồi yêu cầu phát hiện gắn với dòng cụ thể.
- **Nhầm lẫn thường gặp:** Lần gọi mô hình thứ hai không tự động độc lập hay chính xác. Ngữ cảnh dùng chung, thiên kiến mô hình và tiêu chí mơ hồ có thể lặp lại cùng lỗi.
- **Học nội dung này:** [Reviewer Agent](../phases/14-agent-engineering/39-reviewer-agent/)
- **Thuật ngữ liên quan:** Coding Agent, Verification Gate, Scope Contract, LLM-as-a-Judge

### RLHF (Reinforcement Learning from Human Feedback)
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Huấn luyện mô hình từ sở thích của con người.
- **Ý nghĩa thực tế:** Một họ pipeline dùng phản hồi con người để học tín hiệu phần thưởng hoặc sở thích, rồi tối ưu chính sách mô hình theo tín hiệu đó. Cách triển khai khác nhau và không nhất thiết đều dùng cùng thuật toán học tăng cường.
- **Nhầm lẫn thường gặp:** RLHF tối ưu một đại diện được học từ phản hồi đã thu thập. Nó không bảo đảm alignment rộng với mọi người dùng hay mọi tình huống.
- **Học nội dung này:** [Reinforcement Learning from Human Feedback](../phases/10-llms-from-scratch/07-rlhf/)
- **Nguồn:** [InstructGPT paper](https://arxiv.org/abs/2203.02155)
- **Thuật ngữ liên quan:** DPO (Direct Preference Optimization), SFT (Supervised Fine-Tuning), Alignment

### Rollback
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Khôi phục một bản triển khai hoặc cấu hình đã biết trước đó khi bản phát hành hiện tại vi phạm tiêu chí vận hành, chất lượng hoặc an toàn.
- **Vì sao quan trọng:** Thay đổi agent và mô hình có thể thất bại trong môi trường sản xuất dù đã được đánh giá trước khi triển khai, nên cần thiết kế khôi phục trước khi phát hành.
- **Trong thực tế:** Giữ hiện vật và cấu hình có phiên bản, xác định điều kiện kích hoạt quay lui, diễn tập lệnh cùng ảnh hưởng dữ liệu và xác minh tình trạng dịch vụ sau khôi phục.
- **Nhầm lẫn thường gặp:** Quay lui mã không tự động đảo ngược migration cơ sở dữ liệu, tác dụng phụ bên ngoài, đầu ra cache hay dữ liệu do bản phát hành lỗi ghi.
- **Thuật ngữ liên quan:** Canary Release, Checkpoint, Regression Test, Durable Execution
- **Nguồn:** [Kubernetes Deployments: Rolling Back](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment)

### ROUGE
- **Danh mục:** Đánh giá & an toàn
- **Mọi người thường nói:** Một metric độ trùng khớp tham chiếu thường dùng cho tóm tắt.
- **Ý nghĩa thực tế:** Một họ metric so sánh văn bản được tạo với văn bản tham chiếu bằng các đơn vị như độ trùng khớp n-gram hoặc dãy con chung dài nhất.
- **Nhầm lẫn thường gặp:** Độ trùng khớp bề mặt có thể bỏ lỡ tương đương ngữ nghĩa và thưởng cho cách diễn đạt sao chép mà không chứng minh chất lượng sự thật.
- **Thuật ngữ liên quan:** Evaluation (Eval), Precision & Recall, LLM-as-a-Judge

## S

### Sandbox
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Môi trường thực thi cô lập, giới hạn quyền truy cập của agent vào tệp, tiến trình, đích mạng, thông tin xác thực và tài nguyên máy chủ.
- **Vì sao quan trọng:** Mã được tạo và lần gọi công cụ có thể sai hoặc độc hại. Cô lập giới hạn phạm vi ảnh hưởng và giúp xác minh dùng một lần trở nên thực tế.
- **Trong thực tế:** Chạy kiểm thử trong container tạm thời với nền chỉ đọc, workspace có thể ghi trong phạm vi, không có bí mật sản xuất và danh sách cho phép mạng tường minh.
- **Nhầm lẫn thường gặp:** Sandbox giảm tác động. Nó không xác lập mã bên trong đúng hay vô hại.
- **Học nội dung này:** [Production Agent Runtimes](../phases/14-agent-engineering/29-production-runtimes/)
- **Thuật ngữ liên quan:** Least Privilege, Approval Gate, Coding Agent, Guardrails

### Saturation
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Mức độ một tài nguyên hoặc dịch vụ bị giới hạn đã cạn năng lực, bao gồm công việc đang xếp hàng không thể bắt đầu kịp thời.
- **Vì sao quan trọng:** Chỉ riêng mức sử dụng có thể trông chấp nhận được trong khi bộ nhớ, slot accelerator, độ sâu hàng đợi hoặc quota phía dưới đã giới hạn thông lượng hữu ích.
- **Trong thực tế:** Xác định từng tài nguyên trọng yếu, đo công việc đang chạy và đang chờ, liên hệ saturation với độ trễ đuôi cùng lỗi và cảnh báo trước khi hàng đợi bước vào chế độ tăng trưởng bất ổn.
- **Nhầm lẫn thường gặp:** Saturation không phải một tỷ lệ phần trăm phổ quát. Tài nguyên giới hạn và hành vi xếp hàng phụ thuộc tải công việc cùng kiến trúc.
- **Thuật ngữ liên quan:** Observability, Autoscaling, Backpressure, Tail Latency
- **Nguồn:** [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

### Scope Contract
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Thỏa thuận cụ thể xác định mục tiêu tác vụ, bề mặt được phép và bị cấm, hiện vật mong đợi, yêu cầu xác minh và điều kiện dừng.
- **Vì sao quan trọng:** Nó ngăn agent biến bản sửa hẹp thành refactor không thể rà soát hoặc tuyên bố hoàn tất mà không có bằng chứng.
- **Trong thực tế:** Nêu chỉ module parser và kiểm thử của nó được phép thay đổi, API công khai phải tương thích và bộ kiểm thử chỉ định phải vượt qua.
- **Nhầm lẫn thường gặp:** Mô tả tác vụ nêu điều bạn muốn. Hợp đồng phạm vi còn xác định ranh giới và bằng chứng.
- **Học nội dung này:** [Scope Contracts](../phases/14-agent-engineering/36-scope-contracts/)
- **Thuật ngữ liên quan:** Coding Agent, Patch, Verification Gate, Handoff

### Self-Attention
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Token quyết định token khác nào quan trọng.
- **Ý nghĩa thực tế:** Attention trong đó truy vấn, khóa và giá trị được suy ra từ cùng biểu diễn chuỗi. Điểm tương đồng được scale rồi chuẩn hóa và dùng để kết hợp các giá trị, theo các mask nhân quả, padding, cục bộ hoặc khác.
- **Vì sao quan trọng:** Nó xây dựng biểu diễn token nhạy với ngữ cảnh, nhưng mẫu attention được phép phụ thuộc vào kiến trúc.
- **Nhầm lẫn thường gặp:** Không phải lúc nào token nào cũng có thể attention đến mọi token khác. Mô hình nhân quả và thưa cố ý hạn chế kết nối.
- **Học nội dung này:** [Self-Attention from Scratch](../phases/07-transformers-deep-dive/02-self-attention-from-scratch/)
- **Thuật ngữ liên quan:** Attention, Transformer, Context Window

### Semantic Cache
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Cache tái sử dụng kết quả trước đó khi yêu cầu mới được đánh giá là đủ tương tự theo một biểu diễn và ngưỡng được chọn.
- **Vì sao quan trọng:** Nó có thể giảm độ trễ và chi phí cho ý định lặp lại, nhưng khớp sai có thể trả đầu ra cũ hoặc không phù hợp với người dùng.
- **Trong thực tế:** Cache câu trả lời FAQ rủi ro thấp theo ý định đã chuẩn hóa, đưa tenant và phiên bản chính sách vào khóa, đồng thời bỏ qua cache với yêu cầu cá nhân hóa hoặc nhạy thời gian.
- **Nhầm lẫn thường gặp:** Tương đồng ngữ nghĩa không bảo đảm hai yêu cầu có cùng câu trả lời đúng. Semantic cache tái sử dụng kết quả trước, còn prefix caching tái sử dụng trạng thái KV chính xác theo token và prompt caching tuân theo quy tắc đủ điều kiện của nhà cung cấp hoặc ứng dụng.
- **Thuật ngữ liên quan:** Prompt Cache, Embedding, Cost per Successful Task, Grounding

### Semantic Search
- **Danh mục:** Truy xuất & tạo sinh
- **Mọi người thường nói:** Tìm kiếm theo ý nghĩa thay vì từ chính xác.
- **Ý nghĩa thực tế:** Truy xuất biểu diễn truy vấn và ứng viên trong không gian embedding rồi xếp hạng ứng viên bằng hàm tương đồng vector.
- **Vì sao quan trọng:** Nó có thể truy xuất cách diễn đạt lại và văn bản liên quan về khái niệm, nhưng mã định danh chính xác và chuỗi hiếm vẫn có thể cần tìm kiếm từ vựng.
- **Thuật ngữ liên quan:** Embedding, Hybrid Retrieval, Vector Database, Reranker

### Separation of Duties
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Chia trách nhiệm hoặc thẩm quyền xung đột cho các vai trò độc lập để một principal không thể hoàn tất hành động rủi ro cao nếu thiếu quyết định khác được ủy quyền.
- **Vì sao quan trọng:** Tài khoản bị xâm phạm hoặc agent nhầm lẫn không nên có thể đề xuất, phê duyệt, thực thi và che giấu cùng một thay đổi có hệ quả.
- **Trong thực tế:** Tách việc tạo hiện vật khỏi phê duyệt phát hành, dùng danh tính riêng biệt, lưu cả hai quyết định trong audit log và xác định quyền truy cập khẩn cấp kèm rà soát sau đó.
- **Nhầm lẫn thường gặp:** Phân tách nhiệm vụ là về thẩm quyền xung đột, không chỉ là giao việc cho nhiều người hoặc agent dùng chung thông tin xác thực.
- **Thuật ngữ liên quan:** Approval Gate, Reviewer Agent, Audit Log, Least Privilege
- **Nguồn:** [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

### Service Level Indicator (SLI)
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Một phép đo định lượng hành vi dịch vụ tại ranh giới liên quan đến người dùng đã xác định, chẳng hạn tỷ lệ yêu cầu thành công hoặc độ trễ dưới ngưỡng.
- **Vì sao quan trọng:** Thảo luận về độ tin cậy chỉ có thể chuyển thành hành động khi hành vi được quan sát, sự kiện đủ điều kiện và điểm đo được nêu rõ.
- **Trong thực tế:** Xác định tử số, mẫu số, trường hợp loại trừ, nguồn dữ liệu và cửa sổ gộp, rồi xác thực rằng chỉ số theo sát kết quả người dùng thực sự trải nghiệm.
- **Nhầm lẫn thường gặp:** SLI là phép đo. SLO là mục tiêu áp dụng lên phép đo đó trong một khoảng thời gian xác định.
- **Thuật ngữ liên quan:** Service Level Objective (SLO), Availability, Tail Latency, Observability
- **Nguồn:** [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

### Service Level Objective (SLO)
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Khoảng mục tiêu hoặc ngưỡng cho một chỉ số cấp độ dịch vụ trên một nhóm đối tượng và cửa sổ đo lường đã nêu.
- **Vì sao quan trọng:** Nó chuyển kết quả người dùng kỳ vọng thành ranh giới vận hành cho giám sát, năng lực, rủi ro phát hành và quyết định sự cố.
- **Trong thực tế:** Chọn chỉ số người dùng quan tâm, đặt mục tiêu theo nhu cầu sản phẩm thay vì hiệu suất hiện tại, xác định cửa sổ và trường hợp loại trừ, rồi gắn chính sách error budget.
- **Nhầm lẫn thường gặp:** SLO là mục tiêu độ tin cậy nội bộ. Thỏa thuận cấp độ dịch vụ theo hợp đồng có thể bao gồm biện pháp khắc phục và dùng định nghĩa khác.
- **Học nội dung này:** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **Thuật ngữ liên quan:** Service Level Indicator (SLI), Error Budget, Availability, Goodput
- **Nguồn:** [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

### SFT (Supervised Fine-Tuning)
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Huấn luyện bằng ví dụ đầu vào và đầu ra mong muốn.
- **Ý nghĩa thực tế:** Fine-tune mô hình đã tiền huấn luyện trên các cặp đầu vào và phản hồi mong muốn để mô hình học hành vi được minh họa theo phân phối huấn luyện.
- **Nhầm lẫn thường gặp:** SFT có thể điều chỉnh nhiều hành vi ngoài hội thoại, và chất lượng ví dụ quyết định hành vi nào được củng cố.
- **Thuật ngữ liên quan:** Fine-tuning, DPO (Direct Preference Optimization), RLHF (Reinforcement Learning from Human Feedback)

### Shadow Traffic
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Bản sao lưu lượng yêu cầu trực tiếp được gửi đến hệ thống ứng viên để quan sát trong khi phản hồi của ứng viên vẫn nằm ngoài đường phản hồi chính cho người dùng. Vì yêu cầu được sao chép vẫn thực thi, tác dụng phụ của nó phải được cô lập.
- **Vì sao quan trọng:** Nó đưa hệ thống ứng viên tiếp xúc với hình dạng đầu vào và tải thực tế trong khi giới hạn tác động đến người dùng, có thể phát hiện lỗi không xuất hiện trong kiểm thử tổng hợp.
- **Trong thực tế:** Loại bỏ hoặc token hóa trường nhạy cảm, định tuyến công cụ và dependency đến đích sandbox hoặc no-op, chặn thao tác ghi ở ranh giới năng lực, giữ tương quan yêu cầu và ngăn tải shadow cạnh tranh với lưu lượng người dùng.
- **Nhầm lẫn thường gặp:** Giữ phản hồi ứng viên ngoài luồng chính không khiến quá trình thực thi không có tác dụng phụ. Canary release khác ở chỗ phục vụ người dùng thật bằng hệ thống ứng viên trên một phần lưu lượng được kiểm soát.
- **Học nội dung này:** [Shadow, Canary, and Progressive Delivery](../phases/17-infrastructure-and-production/20-shadow-canary-progressive/)
- **Thuật ngữ liên quan:** Canary Release, Evaluation (Eval), Trace, Model Serving
- **Nguồn:** [Istio Traffic Mirroring](https://istio.io/latest/docs/tasks/traffic-management/mirroring/)

### Shared Embedding Space
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một không gian vector chung trong đó có thể so sánh các biểu diễn từ nhiều phương thức bằng cùng một hàm tương đồng.
- **Vì sao quan trọng:** Nó cho phép truy xuất và khớp xuyên phương thức, chẳng hạn tìm ảnh từ văn bản, mà không yêu cầu hai mục dùng chung biểu diễn thô.
- **Trong thực tế:** Huấn luyện có chủ đích với các mẫu âm được ghép cặp và không ghép cặp, chuẩn hóa vector khi mục tiêu yêu cầu, đánh giá cả hai chiều truy xuất và kiểm tra hiệu suất theo nhóm con cũng như ngôn ngữ.
- **Nhầm lẫn thường gặp:** Cùng chiều vector không tạo ra không gian ngữ nghĩa chung. Mục tiêu và dữ liệu huấn luyện phải thiết lập khả năng so sánh xuyên phương thức.
- **Học nội dung này:** [CLIP Contrastive Pretraining](../phases/12-multimodal-ai/02-clip-contrastive-pretraining/)
- **Thuật ngữ liên quan:** Embedding, Cosine Similarity, Modality Alignment, Semantic Search
- **Nguồn:** [Learning Transferable Visual Models From Natural Language Supervision](https://proceedings.mlr.press/v139/radford21a.html)

### Skill Bundle
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Thư mục skill có thể cài đặt hoàn chỉnh, bao gồm `SKILL.md` và mọi tài liệu tham khảo, script, tài nguyên, fixture hoặc tệp đi kèm mà quy trình cần.
- **Vì sao quan trọng:** Chỉ sao chép tệp điểm vào có thể để lại hướng dẫn trông hợp lệ nhưng trỏ đến tài nguyên thiếu hoặc làm mất mã có tính xác định mà quy trình phụ thuộc.
- **Trong thực tế:** Cài đặt toàn bộ cây như một đơn vị, ghi lại hash cùng phiên bản nguồn, xác thực bản đã cài và hiển thị xung đột trước khi thay gói hiện có.
- **Nhầm lẫn thường gặp:** `SKILL.md` là điểm vào, không nhất thiết là toàn bộ hiện vật.
- **Học nội dung này:** [Skill Evals, Packaging, and Portability](../phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/)
- **Thuật ngữ liên quan:** Agent Skill, Skill Catalog, Reproducible Build, Provenance Attestation
- **Nguồn:** [Agent Skills specification](https://agentskills.io/specification)

### Skill Catalog
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Danh mục gọn hiển thị cho mô hình về các skill đủ điều kiện, thường gồm metadata định tuyến như tên, mô tả và mã định danh nguồn nội bộ thay vì toàn bộ nội dung từng skill.
- **Vì sao quan trọng:** Danh mục cho phép agent khám phá quy trình phù hợp mà không tải mọi gói đã cài vào ngữ cảnh làm việc.
- **Trong thực tế:** Xác thực gói trước, áp dụng chính sách trùng tên tường minh, đo ngân sách danh mục đã tuần tự hóa và giữ chẩn đoán cho mục bị rút gọn, bỏ qua hoặc bị che khuất.
- **Nhầm lẫn thường gặp:** Mục danh mục có nghĩa skill có thể được khám phá. Nó không có nghĩa nội dung skill đang hoạt động hay công cụ của nó đã được cấp quyền.
- **Học nội dung này:** [Skill Discovery and Progressive Disclosure](../phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/)
- **Thuật ngữ liên quan:** Skill Discovery, Skill Invocation, Progressive Disclosure, Token Budget
- **Nguồn:** [Agent Skills specification](https://agentskills.io/specification)

### Skill Discovery
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Pipeline lúc chạy tìm kiếm các thư mục gốc đã được cấu hình, nhận diện thư mục skill ứng viên, kiểm tra tính hợp lệ của hợp đồng gói, đính kèm phạm vi và nguồn gốc, giải quyết xung đột và công bố các mục danh mục đủ điều kiện.
- **Vì sao quan trọng:** Quá trình khám phá có tính xác định giúp chẩn đoán gói bị thiếu, sai định dạng, bị che khuất hoặc không an toàn trước khi bắt đầu định tuyến mô hình.
- **Trong thực tế:** Khai báo phạm vi tìm kiếm và cách xử lý trùng lặp, quyết định cách xử lý symlink, từ chối thoát khỏi phạm vi tài nguyên và ghi lý do từng ứng viên được chấp nhận hoặc từ chối.
- **Nhầm lẫn thường gặp:** Skill discovery không phải tìm kiếm đệ quy không giới hạn các tệp tên `SKILL.md`; vị trí cài đặt và thứ tự ưu tiên là chính sách của môi trường chạy.
- **Học nội dung này:** [Skill Discovery and Progressive Disclosure](../phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/)
- **Thuật ngữ liên quan:** Skill Catalog, Skill Bundle, Progressive Disclosure, Trust Boundary
- **Nguồn:** [Agent Skills client implementation guide](https://agentskills.io/client-implementation/adding-skills-support)

### Skill Invocation
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Quy trình do môi trường chạy điều phối, trong đó con người, mô hình, ứng dụng hoặc skill đủ điều kiện chọn một skill và đưa chỉ dẫn của nó vào ngữ cảnh làm việc.
- **Vì sao quan trọng:** Quyền truy cập tường minh của người dùng, định tuyến ngầm của mô hình, kích hoạt, gắn đối số, quyền công cụ và thực thi là các quyết định riêng với kiểu lỗi khác nhau.
- **Trong thực tế:** Xác định chính sách tác nhân, đánh giá mô tả bằng các yêu cầu phù hợp và gần phù hợp, ghi lại danh tính gói được chọn và giữ các trường gọi riêng cho host trong adapter đã kiểm thử.
- **Nhầm lẫn thường gặp:** Invocation kích hoạt chỉ dẫn. Nó không tự động chạy lệnh hoặc vượt qua chính sách phê duyệt và sandbox.
- **Học nội dung này:** [Skill Invocation and Routing](../phases/13-tools-and-protocols/25-skill-invocation-and-routing/)
- **Thuật ngữ liên quan:** Agent Skill, Skill Catalog, Approval Gate, Sandbox
- **Nguồn:** [Evaluating Agent Skills](https://agentskills.io/skill-creation/evaluating-skills)

### Softmax
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Hàm chuyển logits thành giá trị dương đã chuẩn hóa.
- **Ý nghĩa thực tế:** Hàm được định nghĩa là `softmax(x_i) = exp(x_i) / sum(exp(x_j))`, triển khai kèm ổn định số học. Đầu ra dương và có tổng bằng một, nên có thể tham số hóa phân phối phân loại.
- **Nhầm lẫn thường gặp:** Giá trị softmax không tự động là xác suất đã hiệu chuẩn về tính đúng đắn ngoài đời thực.
- **Thuật ngữ liên quan:** Temperature, Cross-Entropy, Attention

### Software Bill of Materials (SBOM)
- **Danh mục:** Bảo mật & quản trị
- **Bí danh:** SBOM
- **Ý nghĩa thực tế:** Danh mục có cấu trúc về các thành phần phần mềm và quan hệ liên quan đến sản phẩm hoặc hiện vật, thường gồm phiên bản, nhà cung cấp, giấy phép và mã định danh.
- **Vì sao quan trọng:** Bạn cần danh mục thành phần để đánh giá dependency bị ảnh hưởng, nghĩa vụ giấy phép và mức phơi lộ chuỗi cung ứng khi phần mềm thay đổi hoặc xuất hiện lỗ hổng.
- **Trong thực tế:** Tạo SBOM trong bản build đáng tin, gắn nó với hiện vật phát hành, xác minh trong kiểm tra chính sách và cập nhật mỗi khi dependency hoặc đóng gói thay đổi.
- **Nhầm lẫn thường gặp:** SBOM là danh mục, không phải bằng chứng các thành phần an toàn, được cấp phép đúng hoặc thực sự có mặt nếu quá trình tạo và nguồn gốc không đáng tin.
- **Thuật ngữ liên quan:** Provenance Attestation, Reproducible Build, Data Provenance, Audit Log
- **Nguồn:** [SPDX 3.0.1 specification](https://spdx.github.io/spdx-spec/v3.0/)

### Speculative Decoding
- **Danh mục:** Mô hình & suy luận
- **Ý nghĩa thực tế:** Phương pháp suy luận trong đó một quy trình nháp rẻ hơn đề xuất nhiều token và mô hình mục tiêu chấm điểm song song các vị trí nháp đó. Trong biến thể lấy mẫu chính xác, quy tắc chấp nhận và hiệu chỉnh giữ nguyên phân phối đầu ra của mô hình mục tiêu.
- **Vì sao quan trọng:** Nó có thể giảm công việc giải mã tuần tự của mô hình mục tiêu khi bản nháp được chấp nhận mà không cần đổi trọng số đã huấn luyện của mô hình mục tiêu.
- **Trong thực tế:** Đo tỷ lệ chấp nhận và độ trễ đầu-cuối trên prompt thực tế, tính chi phí mô hình nháp và xác minh việc triển khai giữ đúng phân phối giải mã dự định.
- **Nhầm lẫn thường gặp:** Speculative decoding không phải định tuyến mô hình thông thường hay tự động hoàn tất chưa xác minh. Biến thể chính xác giữ phân phối mục tiêu qua bước chấp nhận và hiệu chỉnh, còn biến thể xấp xỉ có thể đổi bảo đảm đó lấy tốc độ.
- **Thuật ngữ liên quan:** Autoregressive, KV Cache, Decoding Strategy, Tokens per Second (TPS)
- **Nguồn:** [Fast Inference from Transformers via Speculative Decoding](https://proceedings.mlr.press/v202/leviathan23a.html)

### Stateless MCP
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Mô hình yêu cầu MCP 2026-07-28, trong đó mọi yêu cầu mang phiên bản giao thức và năng lực client trong `params._meta`, còn kết quả mang `resultType` tường minh; không có trạng thái giao thức nào được khóa theo bắt tay khởi tạo, kết nối hay `Mcp-Session-Id`.
- **Vì sao quan trọng:** Bất kỳ worker nào cũng có thể xác thực và xử lý yêu cầu từ nội dung cùng ngữ cảnh ủy quyền của nó, tránh phụ thuộc kết nối ẩn và giúp định tuyến ngang dễ lý giải hơn.
- **Trong thực tế:** Triển khai `server/discover`, dựng metadata yêu cầu ở mỗi lần gọi, xác thực header truyền tải với JSON-RPC body và truyền handle ứng dụng do server cấp như đối số công cụ thông thường khi cần duy trì tính liên tục.
- **Nhầm lẫn thường gặp:** Stateless MCP loại bỏ phiên giao thức, không loại bỏ trạng thái ứng dụng, kết nối truyền tải, phản hồi streaming, tác vụ hay handle tường minh.
- **Học nội dung này:** [MCP Fundamentals](../phases/13-tools-and-protocols/06-mcp-fundamentals/)
- **Thuật ngữ liên quan:** MCP (Model Context Protocol), Multi Round-Trip Request (MRTR), Tool Contract, Idempotency
- **Nguồn:** [MCP 2026-07-28 key changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog); [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

### Stochastic Gradient Descent (SGD)
- **Danh mục:** Toán học & huấn luyện
- **Bí danh:** SGD
- **Ý nghĩa thực tế:** Một họ bộ tối ưu hóa cập nhật tham số từ gradient ước lượng trên ví dụ hoặc minibatch được lấy mẫu thay vì toàn bộ tập dữ liệu huấn luyện.
- **Vì sao quan trọng:** Đây là mốc cơ sở để hiểu nhiễu gradient, momentum, điều chỉnh batch và các bộ tối ưu hóa thích nghi dùng trong huấn luyện hiện đại.
- **Trong thực tế:** Ghi cách lấy mẫu batch, tốc độ học, momentum nếu có và lịch trình, rồi so sánh hành vi khi kiểm định dưới các ngân sách cập nhật hoặc token bằng nhau.
- **Nhầm lẫn thường gặp:** Trong thực tiễn hiện nay, SGD thường có nghĩa là SGD minibatch và tốc độ học hữu ích của nó không tuân theo một quy tắc scale batch phổ quát.
- **Thuật ngữ liên quan:** Gradient Descent, Batch Size, Learning Rate, Optimizer
- **Nguồn:** [Optimization Methods for Large-Scale Machine Learning](https://arxiv.org/abs/1606.04838); [Accurate, Large Minibatch SGD](https://arxiv.org/abs/1706.02677)

### Stop Sequence
- **Danh mục:** Mô hình & suy luận
- **Ý nghĩa thực tế:** Token hoặc mẫu văn bản do ứng dụng chỉ định khiến quá trình tạo sinh dừng khi hệ thống giải mã gặp nó.
- **Vì sao quan trọng:** Stop sequence giới hạn giao thức đầu ra và quá trình sinh nhiều phần mà không cần chờ mô hình tự quyết định về mặt ngữ nghĩa rằng nó đã xong.
- **Trong thực tế:** Chọn dấu phân cách không mơ hồ, kiểm thử tokenization và kết quả khớp một phần khi truyền luồng, đồng thời vẫn thực thi xác thực độ dài đầu ra và schema.
- **Nhầm lẫn thường gặp:** Stop sequence là điều kiện giải mã cơ học, không phải bằng chứng câu trả lời hoàn chỉnh hay mục tiêu agent đã đạt.
- **Thuật ngữ liên quan:** Decoding Strategy, Structured Output, Token, Termination Condition
- **Nguồn:** [Transformers text-generation documentation](https://huggingface.co/docs/transformers/main/en/main_classes/text_generation)

### Streaming
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Hiển thị đầu ra khi nó được tạo.
- **Ý nghĩa thực tế:** Gửi các sự kiện phản hồi tăng dần trước khi có kết quả đầy đủ. Tùy API, luồng có thể chứa văn bản token, delta có cấu trúc, đối số gọi công cụ, metadata sử dụng hoặc sự kiện trạng thái.
- **Vì sao quan trọng:** Nó cải thiện cảm nhận về độ phản hồi, nhưng không giảm thời gian thực tế để mô hình tạo ra câu trả lời hoàn chỉnh.
- **Nhầm lẫn thường gặp:** Truyền tải mạng, hình dạng sự kiện và ranh giới chunk tùy nhà cung cấp, không bảo đảm khớp với từ hay token.
- **Học nội dung này:** [Production LLM Application](../phases/11-llm-engineering/13-production-app/)
- **Thuật ngữ liên quan:** Time to First Token (TTFT), Autoregressive, Observability

### Structured Output
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Đầu ra mô hình bị ràng buộc hoặc xác thực theo schema máy đọc được để mã ứng dụng sử dụng trường mà không phải phân tích văn xuôi tự do.
- **Vì sao quan trọng:** Nó giảm mơ hồ định dạng tại ranh giới mô hình-phần mềm và cho phép xác thực từng trường cùng thử lại.
- **Trong thực tế:** Yêu cầu kết quả phân loại sự cố với enum mức độ nghiêm trọng được phép, mảng bằng chứng và lý do chuyển cấp có thể null, rồi từ chối phản hồi không đạt schema.
- **Nhầm lẫn thường gặp:** Đầu ra hợp lệ theo schema vẫn có thể chứa giá trị sai. Cấu trúc không phải xác minh sự thật.
- **Học nội dung này:** [Structured Outputs](../phases/11-llm-engineering/03-structured-outputs/)
- **Thuật ngữ liên quan:** Function Calling, Tool Contract, Verification Gate

### Swarm
- **Danh mục:** Agent & công cụ
- **Mọi người thường nói:** Nhiều agent hợp tác mà không có một bộ điều khiển cố định.
- **Ý nghĩa thực tế:** Một mẫu đa agent phối hợp lỏng lẻo, trong đó quyết định cục bộ và trao đổi thông điệp tạo ra hành vi cấp hệ thống. Thuật ngữ này được dùng không nhất quán, vì vậy phải nêu rõ cấu trúc kết nối, quyền sở hữu trạng thái và quy tắc chấm dứt thực tế.
- **Nhầm lẫn thường gặp:** Nhiều agent được đặt tên không bảo đảm chuyên môn hóa hữu ích hay phối hợp nổi sinh.
- **Thuật ngữ liên quan:** Agent, Reviewer Agent, Handoff, Agent State

### System Prompt
- **Danh mục:** Prompt & ngữ cảnh
- **Mọi người thường nói:** Chỉ dẫn do nhà phát triển kiểm soát cho một tương tác với mô hình.
- **Ý nghĩa thực tế:** Một thông điệp chỉ dẫn hoặc cấu hình do nhà cung cấp xác định, được ứng dụng cung cấp để thiết lập hành vi và ràng buộc trong thứ bậc chỉ dẫn của nhà cung cấp đó.
- **Vì sao quan trọng:** Chỉ dẫn hệ thống có thể định hướng hành vi, nhưng không bảo đảm được giữ bí mật và không nên xem là ranh giới bảo mật.
- **Nhầm lẫn thường gặp:** Quy tắc ưu tiên, vai trò thông điệp, tính tồn tại và khả năng hiển thị khác nhau giữa các API. Hãy kiểm tra hợp đồng nhà cung cấp hiện hành.
- **Học nội dung này:** [Instructions as Executable Constraints](../phases/14-agent-engineering/33-instructions-as-executable-constraints/)
- **Thuật ngữ liên quan:** Prompt Engineering, Prompt Injection, Context Engineering, Guardrails

## T

### Tail Latency
- **Danh mục:** Độ tin cậy & vận hành
- **Ý nghĩa thực tế:** Độ trễ mà phần yêu cầu chậm nhất trải nghiệm, thường được tóm tắt bằng phân vị cao trong một tải công việc và cửa sổ thời gian đã nêu.
- **Vì sao quan trọng:** Giá trị trung bình có thể trông tốt trong khi một nhóm người dùng đáng kể chờ lâu hơn nhiều vì xếp hàng, tranh chấp tài nguyên, thử lại hoặc chi phí yêu cầu biến thiên.
- **Trong thực tế:** Báo cáo nhiều phân vị theo tuyến và tải công việc, giữ timeout như quan sát bị kiểm duyệt hoặc thất bại theo quy tắc đã ghi và truy vết yêu cầu chậm xuyên các dependency.
- **Nhầm lẫn thường gặp:** Tail latency không phải yêu cầu chậm nhất duy nhất và không có ý nghĩa nếu thiếu phân vị, nhóm đối tượng và ranh giới đo lường.
- **Học nội dung này:** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **Thuật ngữ liên quan:** Time to First Token (TTFT), Time per Output Token (TPOT), Saturation, Goodput
- **Nguồn:** [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/)

### Temperature
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Thiết lập độ sáng tạo.
- **Ý nghĩa thực tế:** Một tham số giải mã scale lại logits trước khi hình thành phân phối xác suất. Giá trị dương cao hơn thường làm phẳng phân phối; giá trị dương thấp hơn làm phân phối sắc hơn.
- **Vì sao quan trọng:** Temperature thay đổi hành vi lấy mẫu, không thay đổi kiến thức hay tính đúng sự thật của mô hình.
- **Nhầm lẫn thường gặp:** Giá trị bằng 0 thường được triển khai như giải mã tham lam, nhưng hành vi chính xác và tính xác định phụ thuộc nhà cung cấp, sampler, hỗ trợ seed và hệ thống phục vụ.
- **Thuật ngữ liên quan:** Softmax, Autoregressive, Token

### Tensor
- **Danh mục:** Dữ liệu & biểu diễn
- **Mọi người thường nói:** Mảng nhiều chiều dùng cho tính toán số.
- **Ý nghĩa thực tế:** Một mảng có kiểu với hình dạng, kiểu dữ liệu và vị trí trên thiết bị mà framework dùng để biểu diễn đầu vào, tham số, activation và gradient. Metadata vi phân tự động phụ thuộc framework và phép toán, không phải thuộc tính vốn có của mọi tensor.
- **Thuật ngữ liên quan:** Autograd, Parameter, Mixed Precision

### Tensor Parallelism
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Chia phép toán tensor bên trong một lớp mô hình trên nhiều thiết bị, với giao tiếp tập thể kết hợp kết quả từng phần trong lúc tính lớp.
- **Vì sao quan trọng:** Nó cho phép một lớp dùng bộ nhớ và năng lực tính toán từ nhiều thiết bị, nhưng giao tiếp thường xuyên có thể chi phối khi liên kết hoặc phân vùng không phù hợp.
- **Trong thực tế:** Khớp chiều phân vùng với hình dạng mô hình, đánh giá lưu lượng giao tiếp tập thể, giữ các rank trên liên kết nhanh và ghi bố cục sharding cùng checkpoint và cấu hình phục vụ.
- **Nhầm lẫn thường gặp:** Tensor parallelism chia công việc bên trong các lớp. Pipeline parallelism đặt các nhóm lớp khác nhau trên những thiết bị khác nhau.
- **Học nội dung này:** [Scaling and Distributed Training](../phases/10-llms-from-scratch/05-scaling-distributed/)
- **Thuật ngữ liên quan:** Tensor, Pipeline Parallelism, Expert Parallelism, Parameter
- **Nguồn:** [Megatron-LM](https://arxiv.org/abs/1909.08053)

### Termination Condition
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Quy tắc tường minh kết thúc hoặc tạm dừng lượt chạy agent khi thành công, thất bại, cạn ngân sách, đến ranh giới an toàn hoặc cần chuyển cấp.
- **Vì sao quan trọng:** Không có điều kiện chấm dứt, agent có thể lặp vòng, lặp tác dụng phụ, lãng phí ngân sách hoặc tuyên bố hoàn tất mà chưa đạt mục tiêu.
- **Trong thực tế:** Xác định bằng chứng thành công, số bước và chi phí tối đa, lỗi không được thử lại cùng trạng thái chuyển cấp trước khi bắt đầu vòng lặp.
- **Nhầm lẫn thường gặp:** Stop sequence kết thúc việc tạo văn bản; termination condition quyết định tác vụ hay quy trình có nên dừng hay không.
- **Thuật ngữ liên quan:** Agent Harness, Token Budget, Verification Gate, Stop Sequence
- **Nguồn:** [AutoGen](https://arxiv.org/abs/2308.08155)

### Test Oracle
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Cơ chế, đặc tả, tham chiếu, bất biến hoặc phán đoán con người dùng để quyết định hành vi chương trình quan sát được có đúng hay không.
- **Vì sao quan trọng:** Tạo đầu vào kiểm thử là chưa đủ; xác minh tự động cần một cơ sở độc lập để phân loại từng kết quả.
- **Trong thực tế:** Ưu tiên bất biến thực thi được, bản triển khai tham chiếu, schema và đầu ra mong đợi có tính xác định, rồi ghi lại nơi vẫn cần phán đoán con người.
- **Nhầm lẫn thường gặp:** Không nên xem mô hình viết mã là oracle độc lập chỉ vì bạn hỏi nó đầu ra của chính nó có đúng hay không.
- **Thuật ngữ liên quan:** Regression Test, Verification Gate, Eval Set, Human-in-the-Loop (HITL)
- **Nguồn:** [The Oracle Problem in Software Testing](https://www.computer.org/csdl/journal/ts/2015/05/06963470/13rRUx0geBw)

### Threat Model
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Mô tả được ghi chép về tài sản cần bảo vệ, ranh giới tin cậy, đối thủ tiềm năng, năng lực giả định, đường tấn công, tác động và biện pháp kiểm soát dự kiến.
- **Vì sao quan trọng:** Không thể đánh giá biện pháp kiểm soát bảo mật nếu không nêu chúng bảo vệ điều gì, chống lại ai và theo những giả định nào.
- **Trong thực tế:** Lập bản đồ dữ liệu và thẩm quyền xuyên mô hình, truy xuất, công cụ, người dùng và dịch vụ bên ngoài, rồi chuyển các đường lạm dụng có cơ sở thành ca red-team cùng biện pháp giảm thiểu.
- **Nhầm lẫn thường gặp:** Mô hình mối đe dọa ưu tiên rủi ro có khả năng xảy ra; nó không phải danh sách kiểm tra chứng minh hệ thống an toàn hay dự đoán mọi cuộc tấn công tương lai.
- **Thuật ngữ liên quan:** Least Privilege, Prompt Injection, Sandbox, Red Teaming
- **Nguồn:** [NIST SP 800-154](https://csrc.nist.gov/pubs/sp/800/154/ipd); [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.600-1.pdf)

### Time per Output Token (TPOT)
- **Danh mục:** Hạ tầng & phục vụ
- **Ý nghĩa thực tế:** Với một yêu cầu có `N > 1` token đầu ra, khoảng trung bình sau token đầu tiên: `(t_N - t_1) / (N - 1)`. Sau đó phân phối của hệ thống gộp các giá trị trung bình theo từng yêu cầu.
- **Vì sao quan trọng:** Người dùng có thể nhận token đầu tiên nhanh nhưng phần còn lại của câu trả lời truyền chậm, nên chỉ độ trễ khởi động không mô tả khả năng phản hồi khi tạo sinh.
- **Trong thực tế:** Tính TPOT riêng cho từng yêu cầu, báo cáo phân vị giữa các yêu cầu theo độ dài đầu ra và mức đồng thời, tránh gộp mọi khoảng token hoặc so sánh hệ thống dùng tokenizer và ranh giới đo lường khác nhau.
- **Nhầm lẫn thường gặp:** TPOT là trung bình theo từng yêu cầu. Độ trễ giữa token là một khoảng đơn giữa các token liên tiếp, còn time to first token gồm thời gian chờ trước khi đầu ra bắt đầu.
- **Học nội dung này:** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **Thuật ngữ liên quan:** Decode Phase, Time to First Token (TTFT), Streaming, Goodput
- **Nguồn:** [DistServe](https://arxiv.org/abs/2401.09670)

### Time to First Token (TTFT)
- **Danh mục:** Mô hình & suy luận
- **Bí danh:** TTFT
- **Ý nghĩa thực tế:** Thời gian trôi qua từ lúc gửi yêu cầu tạo sinh đến khi client nhận token đầu ra hoặc sự kiện nội dung đầu tiên trong ranh giới đo lường đã xác định.
- **Vì sao quan trọng:** TTFT ảnh hưởng mạnh đến cảm nhận về độ phản hồi và có thể làm lộ độ trễ do xếp hàng, xử lý prompt, cache hoặc mạng.
- **Trong thực tế:** Ghi TTFT phía client theo mô hình, độ dài prompt, khu vực và trạng thái cache, rồi tách nó khỏi tổng thời gian hoàn tất.
- **Nhầm lẫn thường gặp:** TTFT không phải token mỗi giây. Một chỉ số đo độ trễ khởi động; chỉ số kia đo thông lượng tạo sinh sau khi đầu ra bắt đầu.
- **Thuật ngữ liên quan:** Streaming, Prompt Cache, Observability, Token Budget

### Token
- **Danh mục:** Dữ liệu & biểu diễn
- **Mọi người thường nói:** Một phần đầu vào hoặc đầu ra của mô hình có kích thước như từ.
- **Ý nghĩa thực tế:** Một mã định danh số nguyên được tokenizer đặc thù mô hình tạo ra từ văn bản, byte, ảnh, âm thanh hoặc biểu diễn đầu vào khác. Token có thể là từ hoàn chỉnh, một phần của từ, dấu câu, khoảng trắng, chuỗi byte hoặc ký hiệu điều khiển đặc biệt.
- **Nhầm lẫn thường gặp:** Tỷ lệ ký tự trên token thay đổi theo ngôn ngữ, nội dung và tokenizer, vì vậy hãy đếm bằng tokenizer của mô hình đích hoặc công cụ nhà cung cấp.
- **Học nội dung này:** [Tokenizers](../phases/10-llms-from-scratch/01-tokenizers/)
- **Thuật ngữ liên quan:** Token Budget, Context Window, Autoregressive

### Token Budget
- **Danh mục:** Prompt & ngữ cảnh
- **Ý nghĩa thực tế:** Phân bổ tường minh dung lượng token cho chỉ dẫn, bằng chứng, lịch sử, kết quả công cụ, không gian suy luận hoặc làm việc và đầu ra.
- **Vì sao quan trọng:** Mỗi token được đưa vào đều cạnh tranh dung lượng ngữ cảnh, độ trễ và chi phí. Lập ngân sách buộc bạn giữ bằng chứng có giá trị cao trước tiên.
- **Trong thực tế:** Dành dung lượng cho đầu ra, giới hạn chunk truy xuất, tóm tắt kết quả công cụ cũ vào trạng thái và dừng hoặc nén trước khi đạt giới hạn mô hình.
- **Nhầm lẫn thường gặp:** Ngân sách token là ràng buộc lập kế hoạch. Nó không giống cửa sổ ngữ cảnh tối đa của mô hình.
- **Học nội dung này:** [Context Engineering](../phases/11-llm-engineering/05-context-engineering/)
- **Thuật ngữ liên quan:** Context Window, Context Engineering, Progressive Disclosure, Cost per Successful Task

### Tokenization
- **Danh mục:** Dữ liệu & biểu diễn
- **Ý nghĩa thực tế:** Chuyển biểu diễn đầu vào thành các mã định danh token có thứ tự mà mô hình hoặc tokenizer cụ thể chấp nhận.
- **Vì sao quan trọng:** Tokenization quyết định độ dài chuỗi, ranh giới từ vựng, cách tính chi phí, hành vi cắt cụt và cách biểu diễn văn bản hoặc mã trước khi embedding.
- **Trong thực tế:** Dùng đúng tokenizer cho mô hình đích, phiên bản hóa nó cùng hiện vật và kiểm thử văn bản đa ngôn ngữ, mã, khoảng trắng cùng token đặc biệt.
- **Nhầm lẫn thường gặp:** Tokenization không phải lúc nào cũng là tách từ, và hai mô hình có thể gán số lượng cùng ID token khác nhau cho cùng đầu vào.
- **Thuật ngữ liên quan:** Token, Vocabulary, Byte Pair Encoding (BPE), Embedding
- **Nguồn:** [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)

### Tokens per Second (TPS)
- **Danh mục:** Hạ tầng & phục vụ
- **Bí danh:** TPS, output token throughput
- **Ý nghĩa thực tế:** Một thước đo thông lượng cho biết hệ thống phục vụ tạo ra bao nhiêu token đầu ra trong một đơn vị thời gian dưới phạm vi và tải công việc đã nêu.
- **Vì sao quan trọng:** Nó bổ sung cho độ trễ khởi động bằng cách cho thấy quá trình tạo sinh tiếp tục nhanh đến đâu sau khi đầu ra bắt đầu và hoạt động phục vụ ra sao khi chịu tải.
- **Trong thực tế:** Nêu TPS tính theo từng yêu cầu hay tổng hợp, loại trừ hoặc xác định prefill, báo cáo batch, mức đồng thời, độ dài chuỗi, phần cứng và độ trễ phân vị.
- **Nhầm lẫn thường gặp:** Không thể so sánh trực tiếp TPS giữa tokenizer, tải công việc, thiết lập chất lượng hoặc ranh giới đo lường khác nhau.
- **Thuật ngữ liên quan:** Time to First Token (TTFT), Streaming, Prefill, Observability
- **Nguồn:** [Sarathi-Serve](https://www.usenix.org/system/files/osdi24-agrawal.pdf)

### Tool Contract
- **Danh mục:** Agent & công cụ
- **Ý nghĩa thực tế:** Thỏa thuận đầy đủ cho một ranh giới công cụ: mục đích, đầu vào có kiểu, đầu ra, kiểm tra tính hợp lệ, quyền hạn, tác dụng phụ, lỗi, timeout, idempotency và bằng chứng trả về cho bên gọi.
- **Vì sao quan trọng:** Schema cho mô hình biết có những trường nào; hợp đồng cho hệ thống biết khi nào công cụ an toàn và phải xử lý lỗi ra sao.
- **Trong thực tế:** Định nghĩa công cụ ghi tệp với thư mục gốc được phép, phiên bản nền kỳ vọng, kích thước tối đa, chế độ chạy thử, lỗi xung đột tường minh và hash bản vá được trả về.
- **Nhầm lẫn thường gặp:** JSON Schema là một phần của hợp đồng công cụ, không phải toàn bộ hợp đồng.
- **Học nội dung này:** [Tool Use and Function Calling](../phases/14-agent-engineering/06-tool-use-and-function-calling/)
- **Thuật ngữ liên quan:** Function Calling, Structured Output, Least Privilege, Idempotency

### Top-k Sampling
- **Danh mục:** Mô hình & suy luận
- **Ý nghĩa thực tế:** Một phương pháp giải mã giới hạn phân phối token tiếp theo ở k ứng viên có điểm cao nhất, chuẩn hóa lại xác suất của chúng rồi lấy mẫu từ tập đó.
- **Vì sao quan trọng:** Nó loại bỏ phần đuôi xác suất thấp dài khi lấy mẫu trong khi vẫn giữ số ứng viên tối đa cố định.
- **Trong thực tế:** Đánh giá k cùng temperature, top-p và thiết lập dừng, đồng thời ghi cấu hình sampler đầy đủ với kết quả được tạo.
- **Nhầm lẫn thường gặp:** Top-k dùng số ứng viên cố định, còn top-p dùng ngưỡng khối lượng xác suất khiến số ứng viên thay đổi theo bước.
- **Thuật ngữ liên quan:** Nucleus Sampling (Top-p), Temperature, Decoding Strategy, Logits
- **Nguồn:** [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)

### Trace
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Bản ghi được liên kết của một yêu cầu hoặc tác vụ xuyên suốt các lần gọi mô hình, truy xuất, công cụ, chuyển trạng thái, thử lại, phê duyệt và đánh giá.
- **Vì sao quan trọng:** Nó cho phép bạn tái dựng những chỗ mà thời gian, chi phí và lỗi phát sinh trong một quy trình nhiều bước.
- **Trong thực tế:** Truyền một mã trace xuyên suốt harness agent và gắn span đã che dữ liệu cho từng thao tác mô hình và công cụ.
- **Nhầm lẫn thường gặp:** Trace nên ghi bằng chứng vận hành, không làm lộ suy luận mô hình ẩn, bí mật hay nội dung nhạy cảm chưa được che.
- **Học nội dung này:** [OpenTelemetry GenAI Conventions](../phases/14-agent-engineering/23-otel-genai-conventions/)
- **Nguồn:** [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- **Thuật ngữ liên quan:** Observability, Agent State, Time to First Token (TTFT), Evaluation (Eval)

### Transfer Learning
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Tái sử dụng mô hình đã tiền huấn luyện cho tác vụ mới.
- **Ý nghĩa thực tế:** Bắt đầu từ các biểu diễn hoặc tham số được học trên một phân phối dữ liệu hay mục tiêu rồi điều chỉnh chúng cho một phân phối hoặc mục tiêu khác. Thành phần có thể chuyển giao và chiến lược cập nhật phụ thuộc kiến trúc cùng tác vụ.
- **Nhầm lẫn thường gặp:** Transfer không chỉ giới hạn ở các lớp sau và không bảo đảm thành công khi tác vụ nguồn và đích khác biệt lớn.
- **Thuật ngữ liên quan:** Fine-tuning, Feature, SFT (Supervised Fine-Tuning)

### Transformer
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Kiến trúc đứng sau nhiều mô hình ngôn ngữ hiện đại.
- **Ý nghĩa thực tế:** Một kiến trúc mạng nơ-ron gồm attention, thông tin vị trí, các lớp con feed-forward, kết nối residual và normalization. Biến thể encoder, decoder và encoder-decoder dùng mask cùng luồng thông tin khác nhau.
- **Vì sao quan trọng:** Huấn luyện có thể xử lý song song nhiều vị trí chuỗi, trong khi tạo sinh tự hồi quy vẫn tạo đầu ra từng bước.
- **Nhầm lẫn thường gặp:** Self-attention không có nghĩa mọi transformer đều cho phép attention tự do giữa tất cả vị trí.
- **Học nội dung này:** [Build a Full Transformer](../phases/07-transformers-deep-dive/05-full-transformer/)
- **Nguồn:** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- **Thuật ngữ liên quan:** Attention, Self-Attention, Encoder, Decoder

### Trust Boundary
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Giao diện nơi dữ liệu, chỉ dẫn, danh tính hoặc thẩm quyền đi qua giữa các thành phần hoặc principal hoạt động theo giả định tin cậy khác nhau.
- **Vì sao quan trọng:** Khi đi qua ranh giới, hệ thống phải xác thực tác nhân, kiểm tra dữ liệu, giới hạn quyền và quyết định tuyên bố nào có thể ảnh hưởng đến hành động.
- **Trong thực tế:** Vẽ ranh giới quanh người dùng, ngữ cảnh mô hình, nguồn truy xuất, công cụ, mạng và kho dữ liệu, rồi quy định việc kiểm tra tính hợp lệ cùng ủy quyền cho mỗi lần đi qua.
- **Nhầm lẫn thường gặp:** Ranh giới mạng chỉ là một loại ranh giới tin cậy. Văn bản tài liệu không đáng tin đi vào ngữ cảnh agent có quyền cao cũng vượt qua một ranh giới như vậy.
- **Học nội dung này:** [Jailbreak Taxonomy](../phases/19-capstone-projects/82-jailbreak-taxonomy/)
- **Thuật ngữ liên quan:** Threat Model, Least Privilege, Sandbox, Indirect Prompt Injection
- **Nguồn:** [Microsoft Learn: Trust Boundary, the Trust Zone Change Element](https://learn.microsoft.com/en-us/training/modules/tm-create-a-threat-model-using-foundational-data-flow-diagram-elements/6-trust-boundary-the-trust-zone-change-element); [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)

## U

### Underfitting
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Mô hình không thể khớp đủ tốt với tác vụ huấn luyện.
- **Ý nghĩa thực tế:** Mô hình hoặc thiết lập huấn luyện có năng lực hiệu dụng, tối ưu hóa, đặc trưng hoặc tín hiệu huấn luyện không đủ để nắm bắt các mẫu hữu ích trong dữ liệu huấn luyện.
- **Trong thực tế:** Trước tiên chẩn đoán dữ liệu và tối ưu hóa, sau đó cân nhắc huấn luyện lâu hơn, thay đổi feature, giảm regularization quá mức hoặc tăng năng lực phù hợp.
- **Thuật ngữ liên quan:** Overfitting, Loss Function, Hyperparameter

## V

### VAE (Variational Autoencoder)
- **Danh mục:** Mô hình & suy luận
- **Mọi người thường nói:** Một autoencoder tạo sinh xác suất.
- **Ý nghĩa thực tế:** Một mô hình biến ẩn được huấn luyện bằng mục tiêu tái tạo và hạng tử regularization giữ posterior xấp xỉ gần với prior đã chọn. Bộ ước lượng reparameterization cho phép gradient đi qua quá trình lấy mẫu latent ngẫu nhiên.
- **Nhầm lẫn thường gặp:** VAE không ép mọi phân phối latent thành một Gaussian cố định; prior chính xác và posterior xấp xỉ là các lựa chọn mô hình hóa.
- **Nguồn:** [Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)
- **Thuật ngữ liên quan:** Latent Space, Encoder, Decoder, Diffusion Model

### Vector Database
- **Danh mục:** Truy xuất & tạo sinh
- **Mọi người thường nói:** Cơ sở dữ liệu được tối ưu cho tìm kiếm tương đồng vector.
- **Ý nghĩa thực tế:** Một hệ thống lưu trữ và lập chỉ mục hỗ trợ truy vấn láng giềng gần nhất trên các biểu diễn vector, thường có lọc metadata, lưu trữ bền vững và chỉ mục xấp xỉ.
- **Nhầm lẫn thường gặp:** Cơ sở dữ liệu vector lưu trữ và tìm kiếm vector. Nó không tạo embedding chất lượng cao hay bảo đảm truy xuất liên quan.
- **Thuật ngữ liên quan:** Embedding, Semantic Search, Hybrid Retrieval

### Verification Gate
- **Danh mục:** Đánh giá & an toàn
- **Ý nghĩa thực tế:** Một điểm kiểm soát chặn tiến trình cho đến khi bằng chứng được xác định đáp ứng tiêu chí đúng đắn hoặc chất lượng.
- **Vì sao quan trọng:** Nó chuyển tuyên bố hoàn tất của mô hình thành quyết định có bằng chứng hỗ trợ.
- **Trong thực tế:** Ngăn tác vụ lập trình hoàn tất cho đến khi bản vá áp dụng được, kiểm thử đúng phạm vi vượt qua, tệp bị cấm vẫn không đổi và hiện vật bắt buộc tồn tại.
- **Nhầm lẫn thường gặp:** Xác minh kiểm tra bằng chứng có đáp ứng tiêu chí không. Phê duyệt cấp thẩm quyền để tiếp tục ngay cả khi bằng chứng đã rõ.
- **Học nội dung này:** [Verification Gates](../phases/14-agent-engineering/38-verification-gates/)
- **Thuật ngữ liên quan:** Approval Gate, Regression Test, Scope Contract, Structured Output

### Vision-Language Model (VLM)
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một mô hình học các mối quan hệ giữa, hoặc xử lý kết hợp, biểu diễn thị giác và ngôn ngữ cho các tác vụ như truy xuất, mô tả, hỏi đáp hoặc tạo sinh có grounding.
- **Vì sao quan trọng:** Hiệu suất VLM phụ thuộc vào encoder thị giác, thành phần ngôn ngữ, cơ chế kết nối, dữ liệu huấn luyện và chính sách độ phân giải chứ không phải một nhãn năng lực chung.
- **Trong thực tế:** Đánh giá các đối chứng chỉ dùng văn bản và chỉ dùng thị giác, thay đổi độ phân giải cùng bố cục ảnh, yêu cầu định vị bằng chứng khi có thể và báo cáo lỗi theo kỹ năng thị giác cùng ngôn ngữ.
- **Nhầm lẫn thường gặp:** Chấp nhận ảnh không chứng minh mô hình dùng ảnh đúng cách, và VLM không nhất thiết tạo được ảnh.
- **Học nội dung này:** [Vision-Language Models](../phases/04-computer-vision/25-vision-language-models/)
- **Thuật ngữ liên quan:** Multimodal Model, Vision Transformer (ViT), Cross-Attention, Visual Grounding
- **Nguồn:** [CLIP](https://arxiv.org/abs/2103.00020); [Flamingo](https://arxiv.org/abs/2204.14198)

### Vision Transformer (ViT)
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Một kiến trúc thị giác biểu diễn ảnh thành chuỗi patch embedding có thông tin vị trí rồi xử lý chuỗi đó bằng các khối encoder transformer.
- **Vì sao quan trọng:** Nó cung cấp giao diện mô hình chuỗi cho dữ liệu thị giác, nhưng hiệu suất và chi phí tính toán phụ thuộc vào kích thước patch, độ phân giải, tiền huấn luyện và inductive bias.
- **Trong thực tế:** Giữ cách chia patch và chuẩn hóa nhất quán với huấn luyện, tính đến hành vi position embedding ở độ phân giải mới và so sánh với mốc cơ sở thị giác phù hợp trên tập dữ liệu đích.
- **Nhầm lẫn thường gặp:** ViT là một họ kiến trúc, không phải mọi transformer nhận ảnh, và các patch của nó không mặc nhiên là những đối tượng ngữ nghĩa.
- **Học nội dung này:** [Vision Transformers](../phases/04-computer-vision/14-vision-transformers/)
- **Thuật ngữ liên quan:** Transformer, Patch Embedding, Self-Attention, Encoder
- **Nguồn:** [An Image is Worth 16x16 Words](https://arxiv.org/abs/2010.11929)

### Visual Grounding
- **Danh mục:** Hệ thống đa phương thức
- **Ý nghĩa thực tế:** Kết nối một biểu thức ngôn ngữ với bằng chứng không gian trong ảnh hoặc video, chẳng hạn vùng, vật thể, mask hoặc thực thể được theo dõi.
- **Vì sao quan trọng:** Câu trả lời thị giác trôi chảy có thể không được hỗ trợ, còn grounding khiến đối tượng được nhắc đến có thể kiểm tra và cho phép đánh giá ở cấp vùng.
- **Trong thực tế:** Yêu cầu kèm câu trả lời một khung giới hạn, mask hoặc đoạn thời gian, kiểm thử đối tượng mơ hồ và vắng mặt, đồng thời chấm định vị riêng với độ chính xác ngôn ngữ.
- **Nhầm lẫn thường gặp:** Visual grounding xác định nơi có bằng chứng được nhắc đến. Mô tả ảnh tổng quát có thể mô tả cảnh mà không định vị từng tuyên bố.
- **Học nội dung này:** [Cross-Attention Fusion](../phases/19-capstone-projects/61-cross-attention-fusion/)
- **Thuật ngữ liên quan:** Grounding, Vision-Language Model (VLM), Attention, Evaluation (Eval)
- **Nguồn:** [MDETR](https://arxiv.org/abs/2104.12763)

### Vocabulary
- **Danh mục:** Dữ liệu & biểu diễn
- **Ý nghĩa thực tế:** Ánh xạ hữu hạn giữa mã định danh token và các đơn vị tokenizer có thể phát ra, gồm token thông thường, cấp byte và token điều khiển đặc biệt.
- **Vì sao quan trọng:** Thiết kế từ vựng ảnh hưởng độ dài chuỗi, độ bao phủ đa ngôn ngữ, biểu diễn mã, kích thước embedding và tính tương thích giữa tokenizer với trọng số mô hình.
- **Trong thực tế:** Phiên bản hóa từ vựng và các phép gán token đặc biệt cùng mô hình, kiểm thử các vòng mã hóa-giải mã và không bao giờ thay tokenizer bằng một tokenizer chỉ có tên token tương tự.
- **Nhầm lẫn thường gặp:** Từ vựng mô hình không phải từ điển gồm các từ của con người; nhiều mục là mảnh từ, byte, mẫu khoảng trắng hoặc ký hiệu điều khiển.
- **Thuật ngữ liên quan:** Tokenization, Byte Pair Encoding (BPE), Token, Embedding
- **Nguồn:** [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)

## W

### Warmup
- **Danh mục:** Toán học & huấn luyện
- **Ý nghĩa thực tế:** Giai đoạn đầu huấn luyện, trong đó tốc độ học tăng từ giá trị nhỏ hơn hướng tới giá trị mục tiêu của lịch trình chính.
- **Vì sao quan trọng:** Gradient và thống kê bộ tối ưu hóa ban đầu có thể bất ổn, đặc biệt trong huấn luyện batch lớn hoặc transformer, nên cập nhật toàn cỡ đột ngột có thể làm hỏng quá trình tối ưu hóa.
- **Trong thực tế:** Xác định warmup theo bước hoặc token đã xử lý, ghi đường cong thực tế và tinh chỉnh với batch, bộ tối ưu hóa cùng tổng ngân sách huấn luyện được giữ hiển thị.
- **Nhầm lẫn thường gặp:** Warmup không bắt buộc cho mọi mô hình và không khiến tốc độ học vốn không phù hợp trở nên an toàn.
- **Thuật ngữ liên quan:** Learning Rate Schedule, Learning Rate, Batch Size, AdamW
- **Nguồn:** [Accurate, Large Minibatch SGD](https://arxiv.org/abs/1706.02677)

### Weight
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Một con số được học bên trong mô hình.
- **Ý nghĩa thực tế:** Một hệ số có thể huấn luyện trong phép biến đổi mô hình. Trọng số thường được tổ chức thành tensor, và quá trình tối ưu hóa điều chỉnh chúng để giảm mục tiêu huấn luyện.
- **Nhầm lẫn thường gặp:** Không phải tham số nào cũng được gọi là weight; bias, embedding và hệ số scale của normalization cũng là tham số.
- **Thuật ngữ liên quan:** Parameter, Tensor, Optimizer

### Weight Decay
- **Danh mục:** Toán học & huấn luyện
- **Mọi người thường nói:** Regularization làm co nhỏ trọng số trong quá trình tối ưu hóa.
- **Ý nghĩa thực tế:** Quy tắc cập nhật giảm độ lớn của các tham số được chọn trong quá trình huấn luyện, thường bằng cách nhân trọng số với hệ số co nhỏ tách biệt khỏi cập nhật gradient.
- **Vì sao quan trọng:** Nó có thể cải thiện khả năng khái quát hóa, nhưng hệ số hữu ích và các nhóm tham số bị loại trừ phụ thuộc vào mô hình, bộ tối ưu hóa, lịch trình và dữ liệu.
- **Nhầm lẫn thường gặp:** Weight decay tách rời tương đương với hạng tử phạt loss L2 ở một số bộ tối ưu hóa đơn giản, nhưng nhìn chung không tương đương trong trường hợp các bộ tối ưu hóa thích nghi như Adam.
- **Thuật ngữ liên quan:** AdamW, Overfitting, Optimizer

### Worktree
- **Danh mục:** Phát triển AI-native
- **Ý nghĩa thực tế:** Trong Git, một thư mục làm việc gắn với kho mã và nhánh hoặc commit, dùng chung kho đối tượng nhưng có các tệp đã checkout và index riêng.
- **Vì sao quan trọng:** Worktree riêng cho phép người và agent làm việc đồng thời mà không phải liên tục chuyển hoặc ghi đè một bản checkout.
- **Trong thực tế:** Cấp cho mỗi coding agent một nhánh tính năng có tên và đường dẫn worktree chính xác, rồi rà soát và tích hợp bản vá qua lịch sử Git thông thường.
- **Nhầm lẫn thường gặp:** Worktree cô lập các tệp đã checkout, không cô lập mọi tiến trình, cổng, cache, cơ sở dữ liệu hay bí mật trên máy.
- **Học nội dung này:** [Workbench for Real Repositories](../phases/14-agent-engineering/41-workbench-for-real-repos/)
- **Nguồn:** [git-worktree documentation](https://git-scm.com/docs/git-worktree)
- **Thuật ngữ liên quan:** Coding Agent, Patch, Scope Contract, Handoff

## Z

### Zero-Shot
- **Danh mục:** Prompt & ngữ cảnh
- **Mọi người thường nói:** Yêu cầu tác vụ mà không có ví dụ trong prompt hiện tại.
- **Ý nghĩa thực tế:** Thực hiện tác vụ dựa trên chỉ dẫn hoặc cách đóng khung tác vụ mà không đưa các minh họa đặc thù tác vụ vào đầu vào trực tiếp.
- **Nhầm lẫn thường gặp:** Zero-shot không có nghĩa mô hình không có tiền huấn luyện, instruction tuning, công cụ hay ngữ cảnh truy xuất liên quan.
- **Thuật ngữ liên quan:** Few-Shot, Prompt Engineering, Transfer Learning

### Zero Trust
- **Danh mục:** Bảo mật & quản trị
- **Ý nghĩa thực tế:** Một mô hình bảo mật không cấp niềm tin ngầm định dựa trên vị trí mạng hay quyền sở hữu tài sản, thay vào đó đánh giá từng yêu cầu truy cập theo danh tính, thiết bị, tài nguyên, chính sách và ngữ cảnh hiện tại.
- **Vì sao quan trọng:** Công cụ và agent AI trải rộng qua tệp cục bộ, dịch vụ đám mây, mô hình và nội dung bên ngoài, nên mạng nội bộ đáng tin là cơ sở quá rộng để cấp thẩm quyền.
- **Trong thực tế:** Xác thực mọi tác nhân và workload, ủy quyền từng thao tác tài nguyên, cấp thông tin xác thực ngắn hạn, phân đoạn quyền truy cập, đồng thời liên tục ghi lại và đánh giá lại các tín hiệu liên quan đến chính sách.
- **Nhầm lẫn thường gặp:** Zero trust không có nghĩa là không tin gì hoặc chặn mọi tự động hóa. Nó có nghĩa là đưa ra quyết định tin cậy tường minh, có phạm vi và có thể xác minh liên tục.
- **Học nội dung này:** [Security, Secrets, and Audit](../phases/17-infrastructure-and-production/25-security-secrets-audit/)
- **Thuật ngữ liên quan:** Least Privilege, Trust Boundary, Approval Gate, Audit Log
- **Nguồn:** [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)
