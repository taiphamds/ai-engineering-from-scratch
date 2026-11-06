# The Reverse Engineering Landscape: History, Tool Families, and How a Decompiler Is Built

> Năm công cụ đọc cùng object và cho bốn địa chỉ, ba số đếm khối và hai câu trả lời cho một switch, và bài học này xây dựng harness cho thấy cái nào là cái nào.

**Type:** Build
**Languages:** Python, C, x86-64 assembly, Java (one Ghidra script)
**Prerequisites:** Phase 13 · 32 (ELF from scratch), Phase 13 · 33 (disassembly and control flow), Phase 13 · 34 (lifting to pseudocode)
**Time:** ~150 minutes

## Learning Objectives

- Đặt các công cụ chính của lĩnh vực lên một dòng thời gian có ngày từ 1973 đến 2026 và nêu tên họ mà mỗi công cụ thuộc về.
- Nêu tên tám giai đoạn của một decompiler và thuật ngữ mà Ghidra, Binary Ninja, Hex-Rays, radare2, rizin và angr sử dụng cho mỗi giai đoạn.
- Nâng một chỉ lệnh vào ESIL, RzIL, P-code và VEX và giải thích những thứ nào ghi cờ ngay và những thứ nào lưu một thunk.
- Quy các địa chỉ của năm công cụ về một offset `.text` và chứng minh phép quy trên một hàm.
- Xây dựng một harness so sánh đọc các đầu ra công cụ đã thu và báo cáo sự đồng nhất về các điểm bắt đầu chỉ lệnh, khối, cạnh và điểm bắt đầu hàm.
- Nêu tên, từ bằng chứng đã thu, nơi mỗi công cụ bịa mã, bỏ lỡ mã hoặc dừng ở một bước nhảy gián tiếp.

## The Problem

Bạn yêu cầu một agent tóm tắt những gì ba công cụ reverse engineering nói về `grade` trong `ledger-x86_64-O1.o`. Agent chạy mỗi công cụ, đọc ba danh sách và báo cáo rằng hàm nằm tại `0x08000050` trong một công cụ, `0x400010` trong một công cụ khác và `0x100010` trong công cụ thứ ba. Nó kết luận rằng các công cụ bất đồng về nơi hàm nằm.

Các công cụ đồng nhất. Object có thể tái định vị và không có địa chỉ tải, nên mỗi công cụ chọn một. Trừ địa chỉ mà mỗi công cụ cho `.text` và mọi câu trả lời là `0x10`. Agent so sánh các địa chỉ thô vì không có gì nói cho nó địa chỉ có nghĩa gì trong mỗi công cụ.

Sau đó cùng agent đọc `grade` trong bản build `-O0` và báo cáo 3, 8, 8 và 9 basic block từ bốn công cụ. Cả bốn con số là thật. Một công cụ dừng tại `jmp rax`. Hai công cụ đọc jump table qua các relocation của nó. Một công cụ tách một khối tại bước nhảy để đặt một nhãn. Một số đếm khối không có lý do đằng sau là một con số không có một khẳng định.

Bài học này là bản đồ bạn cần trước khi tin bất kỳ con số nào trong số đó. Bài 32 đến 36 xây dựng một decoder, một lifter, một bản ghi bằng chứng và một bản dựng lại. Nửa sau của nhánh đặt chúng cạnh các công cụ mà mọi người sử dụng. Để làm điều đó bạn cần lịch sử của lĩnh vực, các họ mà các công cụ thuộc về, pipeline mà mọi decompiler chạy và một harness so sánh những gì các công cụ nói trên các object bạn tự biên dịch.

```figure
re-37-field-map
```

## Fifty-Three Years in Dated Steps

Lĩnh vực lâu đời hơn hầu hết các công cụ của nó. Mỗi ngày bên dưới có một nguồn sơ cấp trong Further Reading.

### 1973 to 1991: debuggers first, then disassemblers

Các luận án decompilation đầu tiên là từ năm 1973. Hollander ở Stanford và Housel ở Purdue viết chúng, và cả hai được biết đến ngày nay qua các trích dẫn. Các công cụ thực tế của thời kỳ là debugger. Maranzano và Bourne viết hướng dẫn `adb` tại Bell Labs năm 1977, và debugger được phát hành với UNIX V7 năm 1979. `DEBUG` của Tim Paterson, với một disassembler 8086, được phát hành trong PC-DOS 1.00 tháng 8 năm 1981. GDB của Richard Stallman được đưa vào phân phối năm 1986. SoftICE đặt một kernel debugger dưới DOS năm 1987.

Các disassembler batch đến tiếp theo. Sourcer, từ V Communications năm 1988, chạy nhiều lượt trên một chương trình DOS và viết một danh sách có bình luận. GNU binutils bắt đầu với các snapshot không đánh số năm 1988, và `objdump` mang bản quyền năm 1990. Ilfak Guilfanov viết dòng đầu của IDA tháng 1 năm 1991 và phát hành IDA 0.1 như shareware ngày 20 tháng 5 năm 1991.

### 1991 to 2009: interactive disassemblers and the first decompilers

Cristina Cifuentes hoàn thành "Reverse Compilation Techniques" tại QUT tháng 7 năm 1994. Decompiler của bà, `dcc`, đưa các chương trình DOS i80286 sang C, và bài báo năm 1995 của bà với Gough đặt các giai đoạn mà mọi decompiler sau giữ lại. REC theo sau năm 1997 và Boomerang năm 2002, decompiler mã nguồn mở đầu tiên, dưới giấy phép BSD.

IDA trở thành một sản phẩm thương mại tại DataRescue năm 1996, có thêm plugin SDK năm 1999 và chuyển đến Hex-Rays, được thành lập năm 2005. Hex-Rays Decompiler 1.0 được phát hành ngày 17 tháng 9 năm 2007. Cùng năm đó, Mike Van Emmerik nộp "Static Single Assignment for Decompilation", luận án đặt SSA ở trung tâm luồng dữ liệu decompiler. "Structural Comparison of Executable Objects" (2004) của Halvar Flake khởi đầu họ diffing, và BinDiff được bán tháng 8 năm 2004.

radare bắt đầu tháng 2 năm 2006 như một trình chỉnh sửa hex pháp chứng với offset 64 bit. radare2, bản viết lại mô-đun dưới LGPL-3.0, có bản phát hành đầu tiên ngày 7 tháng 3 năm 2009.

### 2009 to 2019: frameworks and intermediate representations

LLDB được công bố như một dự án con LLVM ngày 8 tháng 6 năm 2010. BAP, Binary Analysis Platform với ngôn ngữ trung gian BIL của nó, xuất hiện tại CAV 2011. Google mua lại zynamics, những người làm BinDiff, ngày 1 tháng 3 năm 2011. Hopper xuất hiện trên Mac App Store vào khoảng cuối năm 2011. Matt Godbolt khởi đầu Compiler Explorer năm 2012 để một lập trình viên C++ có thể thấy assembly mà một compiler tạo ra.

angr nhận dòng mã đầu tiên tháng 8 năm 2013. Bài báo Phoenix (Schwartz, Lee, Woo, Brumley, USENIX Security 2013) cho thấy cấu trúc hóa bảo toàn ngữ nghĩa với 40 câu lệnh `goto` trên 8,676 hàm. DREAM (Yakdan và những người khác, NDSS 2015) loại các câu lệnh `goto` bằng cấu trúc hóa độc lập mẫu. Vector 35 được thành lập ngày 14 tháng 1 năm 2015, và Binary Ninja được bán ngày 23 tháng 7 năm 2016 với Low Level IL và một API Python. angr được phát hành công khai năm 2015 và đứng thứ ba tại DARPA Cyber Grand Challenge tháng 8 năm 2016. BinDiff trở nên miễn phí tháng 3 năm 2016. Cutter 1.0 cho radare2 một GUI Qt tháng 12 năm 2017. Năm 2018, Guilfanov trình bày "Decompiler internals: microcode" tại Recon, mô tả công khai đầu tiên về IR Hex-Rays.

### 2019 to 2026: open decompilers and the research turn

Ghidra 9.0 được NSA phát hành tại RSA Conference ngày 5 tháng 3 năm 2019 dưới Apache-2.0, với toàn bộ nguồn trên GitHub một tháng sau. angr 8.19.2.4 thêm một decompiler sơ bộ cùng năm. Binary Ninja 2.0 phát hành decompiler High Level IL ngày 20 tháng 5 năm 2020. Rizin được công bố như một fork của radare2 ngày 8 tháng 12 năm 2020, và nhóm Cutter chuyển sang nó. IDA Freeware 7.6 thêm một decompiler x64 đám mây tháng 5 năm 2021.

BinDiff 8 được mở nguồn dưới Apache-2.0 ngày 25 tháng 9 năm 2023. SAILR (Basque và những người khác, USENIX Security 2024) trở thành structurer mặc định của angr và lập luận rằng chỉ các câu lệnh `goto` thừa mới nên bị loại, vì Linux 6.1 có 3,754 câu trong nguồn của nó. Binary Ninja 4.0 thêm một phiên bản Free tháng 2 năm 2024, và IDA 9.0 thêm `idalib` để sử dụng headless. Các bài báo decompiler được học trải từ SLaDe (2023) qua LLM4Decompile (2024) đến DecompileBench (2025) và hai nghiên cứu năm 2026 về khả năng đọc có agent hỗ trợ và về các decompiler biên dịch lại nhiều hơn và bảo toàn ít hơn.

Các phiên bản bài học này chạy là những phiên bản hiện hành ngày 14 tháng 10 năm 2026: Ghidra 12.1.4 (21 tháng 9 năm 2026), radare2 6.2.4 (5 tháng 10 năm 2026), rizin 0.9.1 (29 tháng 6 năm 2026) và angr 10.0.3 (10 tháng 10 năm 2026). Binary Ninja 6.0 "Krypton" (3 tháng 9 năm 2026) và IDA 9.4 (13 tháng 7 năm 2026) là các công cụ đóng hiện hành. Bài học này không chạy chúng.

## The Tool Families

Một công cụ thuộc một họ theo thứ nó tạo ra. Các họ chồng lấp trong một chương trình, và sự chồng lấp là nơi phần lớn nhầm lẫn bắt đầu.

### Disassemblers

Một linear sweep giải mã từ byte đầu của một code section đến byte cuối. GNU `objdump -d` và `llvm-objdump -d` hoạt động theo cách này, và không công cụ nào xây dựng một đồ thị luồng điều khiển. GNU `objdump` coi các symbol là các ranh giới chỉ lệnh và quét giữa chúng. binutils 2.47 (26 tháng 7 năm 2026) là GPL-3.0-or-later. LLVM 23.1.3 là Apache-2.0 với ngoại lệ LLVM. Command Line Tools của Apple phát hành `llvm-objdump` dưới dạng "Apple LLVM version 17.0.0", và đó là bản sao mà bài học này thu.

Một disassembler tương tác chạy recursive descent từ các điểm vào đã biết, thêm heuristic cho các điểm bắt đầu hàm và giữ một cơ sở dữ liệu. IDA Pro (các mô-đun bộ xử lý, hàng đợi autoanalysis, chữ ký FLIRT), Ghidra (`Disassembler` cộng các analyzer Auto Analysis), Binary Ninja (recursive descent, rồi linear sweep trên các vùng chưa biết), Hopper, radare2 và rizin (`aa`, `aaa`, `af`), với Cutter và iaito làm GUI, đều thuộc họ này. Andriesse và những người khác (USENIX Security 2016) đo chín công cụ trên các binary do compiler tạo. Độ chính xác chỉ lệnh gần 100 phần trăm, và primitive khó là các điểm bắt đầu hàm, với tỷ lệ âm tính giả 20 phần trăm trở lên.

### Decompilers

Các decompiler thương mại: Hex-Rays Decompiler (mười hai họ mục tiêu từ x86 đến RISC-V), HLIL của Binary Ninja với cách kết xuất Pseudo C và góc nhìn pseudo-code của Hopper. Các decompiler mở: decompiler Ghidra, một engine C++ dưới Apache-2.0 mà r2ghidra và rz-ghidra tái sử dụng như một plugin và pypcode tái sử dụng như một lifter; decompiler angr trên AIL với cấu trúc hóa SAILR dưới BSD-2-Clause; r2dec và jsdec trong JavaScript; Boomerang và `dcc` như lịch sử. radare2 cũng có một `pdc` tích hợp, "đầu ra pseudo disassembler theo cú pháp giống C". rizin không có decompiler tích hợp. Lệnh `pdc` không tồn tại trong rizin 0.9.1, và `pdg` cần plugin rz-ghidra.

### Debuggers

GDB (1986) với các front-end GEF và pwndbg, LLDB (2010), WinDbg với Time Travel Debugging (2017), OllyDbg (đóng băng năm 2014), x64dbg (GPL-3.0, 2014), Ghidra Debugger với các connector Python của nó, debugger Binary Ninja và các debugger tích hợp của radare2 và rizin. Bài 42 sử dụng hai trong số đó trên các bản build của riêng bạn.

### Binary analysis frameworks

angr (VEX IR, thực thi ký hiệu, `CFGFast` và `CFGEmulated`, decompiler), BAP (BIL, OCaml), Dyninst, Jakstab và ByteWeight là các framework mà Andriesse nêu tên. Ghidra là một thư viện qua PyGhidra, Binary Ninja qua `import binaryninja` và IDA qua `idalib`.

### Format and engine libraries

LIEF 1.0.0 (12 tháng 7 năm 2026, Apache-2.0) phân tích ELF, PE, Mach-O, COFF và các định dạng Android. CLE, "CLE Loads Everything", là loader của angr. Capstone 5.0.9 (28 tháng 5 năm 2026, BSD-3-Clause) giải mã; Keystone 0.9.2 (GPL-2.0) hợp dịch; Unicorn 2.1.4 (GPL-2.0) giả lập. radare2 6.2.4 đóng gói Capstone 5, và rizin 0.9.1 đưa kèm Capstone, Zydis và tree-sitter.

### Diffing tools and compiler-side viewers

BinDiff 8 (Apache-2.0) với plugin BinExport 12 cho IDA Pro, Binary Ninja và Ghidra; Diaphora 3.4.3 (11 tháng 10 năm 2026, AGPL-3.0) như một plugin IDA; `radiff2` và `rz-diff`. Compiler Explorer (BSD-2-Clause) cho thấy assembly mà một compiler phát ra cho một đoạn nguồn, chính là chiều xuôi của mọi thứ khác trong danh sách này. Bài 44 sử dụng họ diffing.

### Versions, licences, and what this lesson ran

| Công cụ | Phiên bản đọc ngày 2026-10-14 | Giấy phép | Điểm vào headless | Đã chạy ở đây |
|---|---|---|---|---|
| Ghidra | 12.1.4 | Apache-2.0 | `analyzeHeadless`, `pyghidra.start()` | có, trên cả bốn object |
| radare2 | 6.2.4 | LGPL-3.0 | `r2 -qc '<cmds>' file`, `rabin2` | có |
| rizin | 0.9.1 | LGPL-3.0 | `rizin -qc '<cmds>' file`, `rz-bin` | có |
| angr | 10.0.3 | BSD-2-Clause | `angr.Project` trong Python | có |
| llvm-objdump | Apple LLVM 17.0.0 | Apache-2.0 với ngoại lệ LLVM | `llvm-objdump -d -r` | có |
| Binary Ninja | 6.0 "Krypton" | thương mại; phiên bản Free cho sử dụng phi thương mại | `binaryninja.load()` với giấy phép Commercial, Ultimate hoặc headless | không, chỉ tài liệu |
| IDA Pro | 9.4 | thuê bao thương mại; IDA Free cho x86 và x86-64 phi thương mại | `idat`, `ida -A -S`, `idalib` | không, chỉ tài liệu |
| Hopper | 6.6.0 | thương mại, vĩnh viễn | không có được ghi tài liệu | không, chỉ tài liệu |
| Cutter | 2.5.0 | GPL-3.0 | GUI trên rizin | không |

Phiên bản Free của Binary Ninja chỉ decompile x86, x86-64, ARMv7 và AArch64 và không có API. IDA Free không có IDAPython, không SDK và không `idalib`, và decompiler của nó chạy trên đám mây. Mọi phát biểu về hai công cụ đó trong bài học này đến từ tài liệu và ghi chú phát hành của chúng, và hình đánh dấu chúng là chưa chạy.

## The Decompiler Pipeline, Stage by Stage

Cifuentes đặt tên các giai đoạn năm 1994: phân tích cú pháp, phân tích ngữ nghĩa, tạo mã trung gian, tạo đồ thị luồng điều khiển, phân tích luồng dữ liệu, phân tích luồng điều khiển và tạo mã. Bà chia chúng thành một front end phụ thuộc máy, một phần giữa độc lập máy và ngôn ngữ, và một back end phụ thuộc ngôn ngữ. Mọi decompiler kể từ đó giữ dạng đó và đổi tên các phần. Bảng bên dưới cho tám giai đoạn bài học này sử dụng và tên mà mỗi công cụ cho chúng. Hình hiển thị cùng bảng với các cột công cụ có thể chọn.

| Giai đoạn | Ghidra | Binary Ninja | Hex-Rays / IDA | radare2 | rizin | angr |
|---|---|---|---|---|---|---|
| Loader | `ElfLoader`, `MachoLoader`, `PeLoader`; `.ldefs` chọn ngôn ngữ | `BinaryView`, `BinaryViewType` | mô-đun loader (`LDSC`) | RBin (`rabin2`) | RzBin (`rz-bin`) | CLE (`cle.Loader`, `main_object`) |
| Disassembly | `Disassembler`; SLEIGH `.slaspec` được biên dịch thành `.sla`; analyzer "Disassemble Entry Points", "Function Start Search" | plugin kiến trúc; Recursive Descent, rồi các giai đoạn linear sweep | mô-đun bộ xử lý (`ana.cpp`, `emu.cpp`, `out.cpp`); hàng đợi autoanalysis; FLIRT | plugin RArch sang `RAnalOp`; `aa`, `aaa`, `af` | plugin RzAnalysis; `aa`, `aaa`, `af` | các khối Capstone; tìm điểm bắt đầu hàm `CFGFast` |
| Khôi phục CFG | "Generate Basic Blocks and the CFG"; `BlockGraph`; "Decompiler Switch Analysis" | `Function`, `BasicBlock`; giai đoạn "Control Flow Graph (CFG) Analysis" | `mbl_graph_t`, sẵn sàng tại `MMAT_LOCOPT` | `afb`, `agf`, `aab` | `afb`, `agf`, `aab` (Nucleus) | `CFGFast`, `CFGEmulated`; `kb.functions`; IRSB |
| Nâng | "Generate Raw P-code"; Varnode trong `ram`, `register`, `const`, `unique` | Lifted IL, LLIL, Mapped MLIL, MLIL | microcode (`minsn_t`, `mop_t`); `MMAT_GENERATED` | ESIL (`asm.esil`, `ae`) | RzIL (`aoi`, `aez`) | VEX (`pyvex.lift`, IRSB), rồi AIL |
| SSA | `Heritage`, `ActionHeritage`; `MULTIEQUAL`, `INDIRECT` | LLIL SSA, MLIL SSA, HLIL SSA; `HLIL_VAR_PHI` | không có SSA được đặt tên; luồng dữ liệu use-def trong `MMAT_GLBOPT1` đến `3` | không có; ESIL được xây dựng để giả lập | không có; RzIL được xây dựng để giả lập | `_stage_transform_to_ssa_level0` và `level1`; `SeqNodeDephication` |
| Luồng dữ liệu và kiểu | `ActionDeadCode`, `ActionInferTypes`, pool `Rule`; prototype từ `.cspec` | lan truyền hằng số MLIL, biến và kiểu; `analyzeReturns` | "Transform microcode"; `MMAT_CALLS`, `MMAT_GLBOPT`, `MMAT_LVARS`; TIL | `afv`, `afc`, `aaft`; giả lập ESIL | `afv`, `afc`, `aft` | `CallingConventionAnalysis`, `VariableRecoveryFast`, `Typehoon` |
| Cấu trúc hóa | `CollapseStructure`; `BlockIf`, `BlockWhileDo`, `BlockSwitch`, `BlockGoto` | `HLIL_IF`, `HLIL_WHILE`, `HLIL_SWITCH`; AST tại `root` | "Generate ctree"; phân tích cấu trúc; các vùng goto | `pdc`; `pdd` (r2dec); `pdg` (r2ghidra) | `pdg` (rz-ghidra); jsdec | `RegionIdentifier`; `RecursiveStructurer` với `SAILRStructurer` |
| Phát ra | "Emit Final C Tokens"; `PrintC`, `ActionNameVars`, `ActionSetCasts` | kết xuất HLIL; Pseudo C, Pseudo Rust, Pseudo Python | "Beautify ctree; Print ctree"; `cfunc_t` | văn bản của `pdc`, `pdd`, `pdg` | văn bản `pdg` | `CStructuredCodeGenerator`; `codegen.text` |

### Loader

Loader phân tích container, ánh xạ các section và đọc symbol cùng relocation. Trong một object có thể tái định vị chưa có gì có địa chỉ, nên loader chọn một. radare2 và rizin ánh xạ tệp tại `0x08000000`, đặt `.text` tại `0x08000040` vì section bắt đầu ở file offset `0x40`. CLE đặt `.text` tại `0x400000`. `ElfLoader` của Ghidra đặt nó tại `0x100000`. `llvm-objdump` in offset section và hoàn toàn không có địa chỉ cơ sở.

Các loader cũng khác về relocation. Ghidra xử lý chúng khi import, và CLE áp dụng chúng. radare2 in một gợi ý khi nó mở object: relocation chưa được áp dụng, và `bin.relocs.apply=true` thay đổi điều đó. Điều một loader làm với relocation quyết định mọi giai đoạn sau có thể thấy gì, và bạn sẽ gặp hiệu ứng trong jump table `-O0` bên dưới.

### Disassembly

Bài 33 xây dựng cả hai phương pháp. Mọi công cụ trong bảng trừ `llvm-objdump` chạy recursive descent rồi thêm một tìm kiếm các điểm bắt đầu hàm. Tài liệu Binary Ninja nêu tên các giai đoạn theo thứ tự: Recursive Descent, Call Target Analysis, CFG Analysis như "disassembly tuyến tính của các vùng chưa biết" và Tail Call Analysis. Ghidra chạy các analyzer theo độ ưu tiên, với "Disassemble Entry Points" và "Function Start Search" sớm. IDA giữ các hàng đợi autoanalysis, mỗi hàng có một độ ưu tiên, và các chữ ký FLIRT cho mã thư viện. `CFGFast` của angr ghi tài liệu bốn nguồn điểm bắt đầu hàm: symbol, một phép quét prologue, các đích gọi và một phép quét đầy đủ các byte còn lại. Nguồn cuối đó là nơi angr bịa các hàm ở padding.

### CFG recovery

Mỗi công cụ cắt các khối theo cách bài 33 làm, với một khác biệt bạn sẽ đo. angr kết thúc một khối tại một `call`, vì IRSB của nó là một khối một điểm vào, nhiều điểm ra và một lần gọi là một điểm ra. Ghidra, radare2 và rizin đi xuyên qua một lần gọi. Trên `grade_label` ở `-O0`, gọi `grade`, angr báo cáo 2 khối và ba công cụ kia báo cáo 1. Các chỉ lệnh giống nhau.

### Lifting

Binary Ninja định nghĩa lifting là "dịch từ một ngôn ngữ mức thấp hơn sang một ngôn ngữ trung gian được coi là cao hơn". Các IR khác nhau về mục đích của chúng. P-code và VEX được xây dựng để phân tích và decompilation. ESIL và RzIL được xây dựng để giả lập, và không cái nào có giai đoạn SSA. Microcode Hex-Rays bắt đầu như mã giống RISC với 72 opcode và đi qua các mức trưởng thành từ `MMAT_GENERATED` đến `MMAT_LVARS`. Binary Ninja nâng sang Lifted IL, rồi gộp cờ thành điều kiện trong LLIL, và MLIL "dịch các thanh ghi và truy cập bộ nhớ thành các biến". Phần tiếp theo đặt bốn IR này cạnh nhau trên một chỉ lệnh.

### SSA

Luận án của Van Emmerik liệt kê những gì SSA mang lại cho một decompiler: lan truyền biểu thức, xác định tham số và giá trị trả về không có giả định ABI, phân tích bảo toàn, phân tích kiểu như một bài toán luồng dữ liệu thưa và phân tích các bước nhảy cùng lần gọi gián tiếp. Ghidra gọi việc xây dựng SSA của nó là `Heritage` và thêm hai thao tác chỉ tồn tại trong đồ thị, `MULTIEQUAL` cho phi và `INDIRECT` cho tác dụng phụ. Binary Ninja cung cấp một dạng SSA ở mọi mức IL. angr có hai giai đoạn SSA bên trong `Clinic`. Hex-Rays không đặt tên một dạng SSA và làm luồng dữ liệu use-def trong các lượt tối ưu hóa toàn cục của nó. ESIL và RzIL không có.

### Data flow and types

Vòng lặp đơn giản hóa chính của Ghidra chạy "Eliminate Dead Code", "Propagate Local Types" và "Perform Term Rewriting" cho đến khi không có gì thay đổi, với việc viết lại do một pool các đối tượng `Rule` thực hiện. Hex-Rays biến đổi microcode, phát hiện các đối số gọi tại `MMAT_CALLS` và cấp phát các biến cục bộ tại `MMAT_LVARS`. angr chạy `CallingConventionAnalysis`, `VariableRecoveryFast` và `Typehoon`, một triển khai suy luận kiểu đa hình của Noonan, Loginov và Cok. Bài 41 nói về giai đoạn này.

### Structuring

`CollapseStructure` của Ghidra tìm các đồ thị con khớp một cấu trúc, thu gọn chúng thành một nút và khi mắc kẹt loại một cạnh và đánh dấu nó không có cấu trúc. Hex-Rays rút CFG về `if`, `while`, `do` và `switch` và để phần còn lại thành các vùng goto. angr xác định các vùng một điểm vào, một điểm ra và cấu trúc hóa chúng bằng `SAILRStructurer` mặc định, với `PhoenixStructurer` và `DreamStructurer` làm các phương án thay thế. Bài 34 viết một structurer bằng tay.

### Emission

Ghidra phát ra các token C qua `PrintC` với một pretty-printer Oppen sau `ActionNameVars` và `ActionSetCasts`. Hex-Rays làm đẹp và in ctree. Binary Ninja kết xuất HLIL thành Pseudo C, Pseudo Rust hoặc Pseudo Python. angr trả về `codegen.text`. radare2 in `pdc`, `pdd` hoặc `pdg`.

## One Instruction in Four IRs

Lấy `48 83 ec 10`, `subq $0x10, %rsp`. Giải mã nó trên giấy bằng các quy tắc từ bài 33.

1. `48` là REX với `W = 1`. Toán hạng là 64 bit.
2. `83` là opcode số học nhóm 1 với một immediate 8 bit. Trường reg ModRM chọn phép toán.
3. `ec` là ModRM `11 101 100`. `mod = 11` là dạng thanh ghi. `reg = 101` là `/5`, tức `sub`. `r/m = 100` là `%rsp`.
4. `10` là immediate, 16.

Bốn lifter được cung cấp bốn byte đó. Các fixture chứa các lệnh chính xác và văn bản đầy đủ.

ESIL từ radare2 6.2.4 là một chuỗi phân tách bằng dấu phẩy gồm 30 token:

```text
16,0x8000000000000000,-,!,16,rsp,-=,63,$o,^,of,:=,63,$s,sf,:=,$z,zf,:=,$p,pf,:=,64,$b,cf,:=,4,$b,af,:=
```

Nó là một máy stack. `16,rsp,-=` trừ tại chỗ. Mỗi cờ sau đó được ghi bằng một toán tử nội bộ: `$o` tràn, `$s` dấu, `$z` không, `$p` parity, `$b` mượn.

RzIL từ rizin 0.9.1 là một S-expression với 14 hiệu ứng `set`:

```text
(seq (set op1 (var rsp)) (set op2 (bv 64 0x10)) (set sub (- (var op1) (var op2))) (set rsp (var sub))
     (set _result (var sub)) (set pf (! (lsb (let _val (cast 8 false (var _result)) ...))))
     (set zf (is_zero (var _result))) (set sf (msb (var _result))) ... (set cf (|| ...)) (set of (|| ...)) (set af (|| ...)))
```

Mỗi cờ là một biểu thức boolean trên các bitvector. Riêng cờ parity là một `let` bốn mức.

P-code từ đặc tả SLEIGH `x86:LE:64:default` qua pypcode 4.0.1 là chín thao tác sau `IMARK`:

```text
CF = RSP < 0x10
OF = sborrow(RSP, 0x10)
RSP = RSP - 0x10
SF = RSP s< 0x0
ZF = RSP == 0x0
unique[58300:8] = RSP & 0xff
unique[58400:1] = popcount(unique[58300:8])
unique[58500:1] = unique[58400:1] & 0x1
PF = unique[58500:1] == 0x0
```

Các chuyển thanh ghi với biến tạm trong không gian `unique`. Các cờ được tính tại chỉ lệnh, ngay lập tức, và `CF` cùng `OF` được tính trước khi phép trừ ghi đè `RSP`.

VEX từ pyvex 10.0.3 là bảy câu lệnh sau `IMark`:

```text
t2 = GET:I64(offset=48)
t0 = Sub64(t2,0x0000000000000010)
PUT(offset=144) = 0x0000000000000008
PUT(offset=152) = t2
PUT(offset=160) = 0x0000000000000010
PUT(offset=168) = 0x0000000000000000
PUT(offset=48) = t0
```

Không cờ nào xuất hiện. VEX đặt tên các thanh ghi theo offset của chúng trong trạng thái guest, và offset 48 là `rsp`. Các offset 144 đến 168 là `cc_op`, `cc_dep1`, `cc_dep2` và `cc_ndep`. Lifter lưu mã thao tác 8, tức phép trừ 64 bit, và hai toán hạng. Một nhánh sau đọc một cờ tính nó từ thunk. Đó là lý do `pcode.writesFlags` đúng và `vex.computesFlags` sai trong báo cáo harness, và vì sao VEX ngắn nhất trong bốn dạng.

Cùng bốn lifter trên `48 63 c7`, `movslq %edi, %rax`, chỉ lệnh đầu của `grade` ở `-O1`, cho 5 token ESIL (`32,edi,~,rax,=`), 1 `set` RzIL, 1 thao tác P-code (`RAX = sext(EDI)`) và 4 câu lệnh VEX. Không lifter nào ghi một cờ, vì chỉ lệnh không có cờ nào. Danh sách riêng của Ghidra cho chỉ lệnh đó, được thu qua script headless, in cùng thao tác là `(register, 0x0, 8) INT_SEXT (register, 0x38, 4)`: offset thanh ghi 0 là `RAX`, offset `0x38` là `RDI`, và kích thước là 8 cùng 4 byte.

`83 f9 04`, `cmpl $0x4, %ecx`, từ kiểm tra biên trong `grade`, cho 30 token ESIL, 13 hiệu ứng `set` RzIL, 10 thao tác P-code và 7 câu lệnh VEX với `cc_op` 7, phép trừ 32 bit. Không có gì ghi `%ecx`. Hai chiều rộng phép trừ bạn sẽ gặp trong VEX là 7 cho 32 bit và 8 cho 64 bit, và trình dịch bạn xây dựng mang bảng đó.

## Four Address Bases for One Function

Trước khi harness có thể so sánh bất cứ thứ gì, nó phải đồng nhất với chính nó về nơi một hàm nằm. Làm phép tính một lần bằng tay cho `grade` trong `ledger-x86_64-O1.o`.

| Công cụ | Địa chỉ của `.text` | Địa chỉ của `grade` | Offset |
|---|---|---|---|
| `llvm-objdump` | `0x0` | `0x10` | `0x10 - 0x0 = 0x10` |
| radare2, rizin | `0x08000040` | `0x08000050` | `0x08000050 - 0x08000040 = 0x10` |
| angr | `0x400000` | `0x400010` | `0x400010 - 0x400000 = 0x10` |
| Ghidra | `0x100000` | `0x100010` | `0x100010 - 0x100000 = 0x10` |

Bảng symbol nói `grade` ở `.text + 0x10` với kích thước 46. Mọi công cụ đồng nhất khi địa chỉ cơ sở được loại bỏ. Harness đọc địa chỉ cơ sở từ mỗi bản thu: `iSj` trong radare2 và rizin, mục section `.text` trong bản thu angr, khối bộ nhớ `.text` trong bản thu Ghidra và không cho sweep. Bài kiểm tra `test_every_tool_places_grade_at_offset_0x10_from_its_own_base` cố định sự kiện đó.

## Where the Tools Agree and Where They Split

Harness trong `code/main.py` đọc các bản thu, quy mọi địa chỉ và so sánh. Đây là các con số nó báo cáo, và các bài kiểm tra khẳng định mỗi con số.

### The agreement case: ledger at -O1

Bốn hàm, 56 chỉ lệnh trong sweep, 54 bên trong các symbol và 2 trong padding. Mọi công cụ báo cáo cùng các điểm bắt đầu chỉ lệnh trong mọi hàm: 9, 14, 13 và 18. Bốn bộ dựng đồ thị báo cáo 3, 3, 5 và 4 khối cùng 2, 3, 5 và 4 cạnh, và các tập cạnh giống hệt, từng cặp, trên radare2, rizin, angr và Ghidra. Năm khối và năm cạnh của `total` là những khối và cạnh mà bài 33 vẽ bằng tay.

Một khác biệt nằm ở padding. 3 byte giữa các hàm (`66 90` sau `grade`, `90` sau `total`) được giải mã bởi sweep, vốn không có lý do để dừng, và bởi angr, tạo `sub_40003e` và `sub_40005f` không có symbol. radare2, rizin và Ghidra không nhận byte nào trong số đó.

### The vectorised case: ledger at -O2

`total` là 41 chỉ lệnh trong 10 khối với 13 cạnh, trong mọi bộ dựng đồ thị trong bốn bộ. Vòng lặp SSE2 và vòng lặp phần dư vô hướng từ bài 33 được cắt theo cùng cách ở mọi nơi. angr lại thêm hai hàm ở padding.

### The jump table: grade at -O0

Ở đây các công cụ phân tách, và sự phân tách là bài học.

| Công cụ | Khối | Cạnh | Bản thu nói gì |
|---|---|---|---|
| radare2 | 3 | 2 | khối tại `0x62` không có kế nhiệm; các byte `0x76` đến `0x9a` không bao giờ được tới; thiếu 8 điểm bắt đầu chỉ lệnh |
| rizin | 8 | 11 | khối tại `0x62` mang một `switch_op` với 5 case và 4 đích phân biệt |
| angr | 8 | 7 | các khối case tồn tại, và chuyển giao tại `0x62` đi đến một nút đích không thể phân giải |
| Ghidra | 9 | 12 | nhãn `switchD` tại `0x74` chia khối; bốn luồng `COMPUTED_JUMP` tới `0x76`, `0x7f`, `0x88`, `0x91` |

Cả bốn giải mã cùng 33 chỉ lệnh khi chúng tới được chúng. radare2 dừng tại `jmp rax` và để 36 byte không được nhận, và harness nêu tên phạm vi đó là mã bị bỏ lỡ. rizin và Ghidra tìm bốn đích phân biệt mà bài 33 đọc từ năm relocation trong `.rela.rodata`. angr liệt kê các khối case bên trong `grade` và vẫn không có cạnh từ khối nhảy tới chúng; bản thu của nó ghi chuyển giao tại `0x62` là dẫn đến một nút đích không thể phân giải, và decompiler của nó in một `goto` tính toán. Ghidra có thêm một khối và một cạnh so với rizin cho cùng luồng điều khiển vì phân tích switch của nó đặt một nhãn trên `jmp rax` và mô hình khối bắt đầu một khối mới tại một nhãn.

Đồ thị bài 33 có 8 khối và 11 cạnh. rizin khớp nó chính xác. Điểm chính là thấy rằng 9 và 11 và 7 và 2 không phải bốn phép đo mã được tìm thấy. Chúng là bốn câu trả lời cho việc một công cụ đi theo một bước nhảy gián tiếp xa đến đâu và nó chọn cắt ở đâu.

### Data in code: sweep-trap

`lookup` là 24 byte với 4 byte bảng `31 c0 90 48` tại `0x10`. Sweep báo cáo 8 điểm bắt đầu chỉ lệnh trong phạm vi đó. Harness liệt kê các khác biệt của nó với đa số: các điểm bắt đầu thừa tại `0x10`, `0x12` và `0x13`, và một điểm bắt đầu thiếu tại `0x14`. Đó là `addq $0x1, %rax` từ bài 33 sớm một byte. radare2, rizin và Ghidra báo cáo 6 điểm bắt đầu, 2 khối, 1 cạnh và để `0x10` đến `0x14` không được nhận. angr báo cáo cùng 2 khối và 1 cạnh cho `lookup` rồi bịa `sub_400010` trên các byte bảng: 2 chỉ lệnh trong một khối 4 byte kết thúc tại `0x14`, nơi khối thứ hai của `lookup` bắt đầu, nên byte REX tại `0x13` không thuộc chỉ lệnh nào. Phát hiện cuối của harness cho object này là không bộ dựng đồ thị nào giải mã `0x10` đến `0x14`, nên những byte đó nằm bên trong một hàm và là dữ liệu.

### Invented and missed, by tool

Trên bốn object, harness nêu tên 9 hàm mà angr bịa không có symbol, mọi hàm ở padding hoặc ở bảng bẫy. Nó nêu tên một phạm vi mà radare2 bỏ lỡ, 36 byte case của `grade` ở `-O0`. Nó nêu tên 9 phạm vi mà linear sweep giải mã và không bộ dựng đồ thị nào coi là mã: tám khoảng trống padding cộng bảng bẫy. Nó không nêu tên hàm bị bỏ lỡ nào trong bất kỳ công cụ nào.

## Three Decompilers on grade

Ba trong số các công cụ được thu phát ra văn bản giống C cho `grade` ở `-O1`. Nguồn là `switch (score / 10)` với năm case, được biên dịch thành một kiểm tra biên và một bảng các giá trị trả về.

Ghidra 12.1.4:

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

angr 10.0.3:

```c
extern unsigned int g_4000b4[4];

unsigned int grade(int a0)
{
    unsigned int v1;  // ecx
    unsigned int v2;  // eax

    v1 = (unsigned int)((long long)(a0 * 1717986919) >> 0x22) + (unsigned int)(a0 * 1717986919 >> 63) - 6;
    v2 = 0;
    if (v1 <= 4)
        v2 = g_4000b4[v1];
    return v2;
}
```

radare2 6.2.4, `pdc`:

```c
void sym.grade (int64_t arg1) {
    rax = edi
    rax = rax * 0x66666667
    rcx = rax
    rcx >>= 0x22
    rax >>>= 0x3f
    ecx += eax
    ecx += 0xfffffffa
    eax = 0
    v = ecx - 4
    if (((unsigned) v) <= 0) {
        eax = ecx
        rcx = rip
        eax = dword [rcx + rax*4]
    }
    return
}
```

Đọc ba văn bản đối chiếu pipeline. Việc viết lại số hạng của Ghidra gộp phép nhân với `0x66666667` và độ dịch 34 trở lại thành `param_1 / 10`, chính là mẫu của bài 34. angr nâng cùng các byte và để phép toán là `a0 * 1717986919 >> 0x22`. `pdc` của radare2 là giả lập ESIL cộng cú pháp giả: tên thanh ghi, không biến, không kiểu và kiểm tra biên được in là `<= 0` sau một phép trừ không dấu. Ghidra gán kiểu lần tải bảng qua `DAT_001000b4`; angr khai báo `g_4000b4[4]`, bốn phần tử nơi nguồn có năm. Không Ghidra lẫn angr khôi phục việc liệt kê các case, vì ở `-O1` không còn switch trong các byte. Ở `-O0`, nơi jump table tồn tại, Ghidra in `switch(param_1 / 10)` với case 6 đến 10 và một mặc định, và angr in một `goto` tính toán.

rizin không có decompiler riêng, và bản thu ghi rằng `pdc` không tồn tại ở đó. HLIL của Binary Ninja và ctree Hex-Rays là hai đầu ra mà bài học này không thể thu.

## Build It

Chạy demo:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
```

Đầu ra là một báo cáo JSON. Nó mở bằng các phiên bản công cụ được ghi lúc thu và các công cụ hiện diện trên máy bạn, có thể đều vắng mặt. Rồi với mỗi trong bốn object, nó cho các phạm vi symbol, các khoảng trống padding, địa chỉ cơ sở mà mỗi công cụ sử dụng, các điểm bắt đầu hàm mà mỗi công cụ tìm hoặc bịa, và với mỗi hàm, sự đồng nhất điểm bắt đầu chỉ lệnh, số khối, số cạnh và các cạnh mà mỗi công cụ thiếu. Nó kết thúc bằng hạch toán byte theo công cụ, các ghi chú riêng của công cụ, một danh sách phát hiện trong các câu thông thường và phần IR: đầu ra của trình dịch cho ba chỉ lệnh cạnh các số đếm đo được trên các bản nâng đã thu.

Dạng kỳ vọng:

```json
{
  "captureTools": {"llvm-objdump": "Apple LLVM version 17.0.0", "radare2": "radare2 6.2.4 ...", "rizin": "rizin 0.9.1 ...", "angr": "10.0.3", "ghidra": "12.1.4"},
  "localTools": {"radare2": "absent", "...": "..."},
  "fixtures": {
    "ledger-x86_64-O0.o": {
      "bases": {"llvm-objdump": "0x0", "radare2": "0x8000040", "angr": "0x400000", "ghidra": "0x100000", "...": "..."},
      "functions": {"grade": {"blocks": {"radare2": 3, "rizin": 8, "angr": 8, "ghidra": 9}, "edges": {"radare2": 2, "rizin": 11, "angr": 7, "ghidra": 12}, "...": "..."}},
      "findings": ["radare2 never reaches bytes 0x76-0x9a inside grade that the other graph builders decode", "..."]
    }
  },
  "ir": {"translator": [{"text": "subq $0x10, %rsp", "flags": {"pcodeLike": "eager", "vexLike": "thunk"}, "...": "..."}], "observed": {"...": "..."}}
}
```

Đọc `code/main.py` theo thứ tự này:

1. `read_text_symbols()` đọc các section header và các symbol `STT_FUNC` của `.text`. Bảng symbol là ground truth duy nhất mà harness có, và `TextSection.gaps()` suy ra padding từ nó.
2. `parse_objdump()`, `parse_r2_family()`, `parse_angr()` và `parse_ghidra()`, mỗi hàm biến một bản thu thành một `ToolView`: một địa chỉ cơ sở, các chỉ lệnh dưới dạng offset tới độ dài, và một `FunctionView` mỗi hàm với khối, cạnh và mọi văn bản được decompile. Mỗi parser biết bộ từ vựng của một công cụ và không gì khác.
3. `majority()` và `ranges()` là hai hàm hỗ trợ mà mọi phép so sánh sử dụng.
4. `function_report()` so sánh các điểm bắt đầu chỉ lệnh với đa số các bộ dựng đồ thị, rồi số khối, rồi các tập cạnh và liệt kê những gì mỗi công cụ thiếu.
5. `byte_report()` hạch toán mỗi byte là mã bên trong một symbol, padding, không được nhận, được bịa hoặc bị bỏ lỡ, và nêu tên các byte bên trong symbol mà không bộ dựng đồ thị nào giải mã.
6. `findings()` biến những điều đó thành các câu, và `compare()` lắp ráp một báo cáo mỗi object.
7. `decode_small()`, `to_pcode_like()` và `to_vex_like()` là trình dịch: ba mã hóa ở dạng thanh ghi, một kiểu ngay lập tức, một kiểu thunk.
8. `observed_ir()` đo các bản nâng đã thu, và `figure_data()` lắp ráp dòng thời gian, bảng giai đoạn và bằng chứng mà hình hiển thị.

Có thêm ba lệnh. `python3 code/main.py compare FIXTURE.o` in báo cáo của một object. `python3 code/main.py ir 4883ec10` in hai dạng của trình dịch cho một chỉ lệnh. `python3 code/main.py figure-data` in dữ liệu được nhúng trong hình.

Các bản thu được tạo một lần bởi `code/fixtures/capture_tools.py`, ghi mọi lệnh và phiên bản trong `captures.json`. Harness và các bài kiểm tra không bao giờ khởi động một công cụ. Nếu bạn có các công cụ, chạy script thu để làm mới các tệp, và đọc README fixture về môi trường nó cần.

## Use It

Sử dụng harness trên một object mới theo thứ tự này.

1. Tự dựng object và giữ lệnh compiler. Đọc bảng symbol của nó trước khi mở bất kỳ công cụ nào, để bạn biết có bao nhiêu hàm và padding ở đâu.
2. Thu mỗi công cụ một lần ở chế độ headless. Lưu đầu ra thô và lệnh chính xác cạnh object. Một bất đồng bạn không thể đọc lại không phải một phát hiện.
3. Kiểm tra địa chỉ cơ sở. Chọn một hàm và xác nhận rằng mọi công cụ đặt nó tại cùng offset sau khi bạn trừ địa chỉ `.text` của nó. Nếu một công cụ không như vậy, dừng và tìm hiểu công cụ đó đã tải gì.
4. So sánh các điểm bắt đầu chỉ lệnh trước. Nếu các bộ dựng đồ thị bất đồng ở đây, phần còn lại của phép so sánh là về giải mã chứ không về phân tích.
5. So sánh khối và cạnh, và đọc các ghi chú của mỗi công cụ trước khi phán đoán một số đếm. Một `switch_op`, một `COMPUTED_JUMP` hoặc một nút đích không thể phân giải giải thích hầu hết các khác biệt.
6. Hạch toán byte. Padding mà một công cụ nhận là một heuristic đang hoạt động. Các byte symbol mà một công cụ để lại là một phép duyệt đã dừng. Các byte symbol mà không bộ dựng đồ thị nào nhận là dữ liệu.
7. Viết ra các công cụ nào bạn chưa chạy. Một mô tả từ tài liệu hữu ích và là một loại bằng chứng khác với một bản thu.

## Interactive Lab

### Lab A: one function, four bases

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape/code
python3 -q
```

Chạy:

```python
from main import *
views = load_views("ledger-x86_64-O1.o")
{tool: hex(view.base) for tool, view in views.items()}
{tool: hex(view.functions["grade"].start + view.base) for tool, view in views.items()}
```

Viết ra bốn địa chỉ thô trước khi chạy dòng thứ hai và kiểm tra chúng với bảng trong bài học này. Rồi thay `grade` bằng `grade_label` và tính bằng tay nơi nó nằm trong Ghidra.

### Lab B: the jump table from four sides

```python
report = compare("ledger-x86_64-O0.o")
report["functions"]["grade"]["blocks"]
report["functions"]["grade"]["edgesMissingPerTool"]["radare2"]
report["notes"]["rizin"]
report["notes"]["ghidra"]
report["bytes"]["radare2"]["misses"]
```

Đếm các cạnh radare2 thiếu và khớp mỗi cạnh với một dòng của danh sách `-O0` từ bài 33. Rồi đọc ghi chú Ghidra và tìm nhãn `switchD` trong bản thu Ghidra.

### Lab C: eager flags against a thunk

```python
translate("48 83 ec 10")["pcodeLike"]
translate("48 83 ec 10")["vexLike"]
translate("83 f9 04")["vexLike"]
{row["name"]: (row["pcode"]["ops"], row["vex"]["statements"]) for row in observed_ir()["instructions"]}
```

Tìm hằng số `cc_op` trong cả hai đầu ra và giải thích vì sao một là 8 và cái kia 7. Rồi thử `translate("48 01 c8")` và đọc `TranslateError`.

### Lab D: the trap under five tools

```python
report = compare("sweep-trap.o")
report["functions"]["lookup"]["instructionStarts"]
report["bytes"]["dataInsideSymbols"]
report["functionStarts"]["angr"]
```

Giải mã các byte `31 c0 90 48 83 c0 01` trên giấy như một sweep sẽ làm, rồi như một descent sẽ làm sau `jmp`. Khớp hai danh sách của bạn với các điểm bắt đầu thừa và thiếu mà harness báo cáo.

## Practice Lab

Thêm một bản thu thứ năm và mở rộng harness.

Yêu cầu:

- Chọn một công cụ bài học này chưa thu và bạn có thể chạy trên máy mình: GNU `objdump`, LIEF với Capstone, một phiên Binary Ninja Free được xuất thủ công hoặc Ghidra với một tập analyzer khác. Thu đầu ra của nó trên cả bốn object với lệnh và phiên bản chính xác trong `captures.json`.
- Viết một parser biến bản thu thành một `ToolView` với địa chỉ cơ sở, chỉ lệnh, hàm của công cụ, khối nơi công cụ có chúng và cạnh nơi nó có chúng.
- Thêm công cụ vào `TOOLS` và, nếu nó dựng một đồ thị, vào `DESCENT_TOOLS`. Chạy demo và đọc điều thay đổi trong các tập đa số.
- Viết một bài kiểm tra khẳng định số khối của công cụ trên `ledger-x86_64-O1.o` và một bài kiểm tra khẳng định điều nó làm với bảng bẫy.
- Viết một đoạn cho bài học nói, bằng từ ngữ riêng của công cụ, nó gọi loader, disassembler và CFG là gì.

Thành công nghĩa là `python3 code/main.py` báo cáo công cụ mới trong `captureTools`, mọi hàm trong `ledger-x86_64-O1.o` giữ `allDescentToolsAgree` đúng và các phát hiện cho `sweep-trap.o` nói điều công cụ mới làm với các byte `0x10` đến `0x14`.

## Lesson Artifact

Bài học này bao gồm `outputs/skill-the-reverse-engineering-landscape.md`. Sử dụng nó để chạy nhiều công cụ trên một object bạn đã dựng, quy các địa chỉ của chúng về một địa chỉ cơ sở và báo cáo, theo hàm, nơi chúng đồng nhất về điểm bắt đầu chỉ lệnh, khối và cạnh, và các byte nào mỗi công cụ bịa hoặc bỏ lỡ. Nó yêu cầu các bản thu với các lệnh và phiên bản được ghi lại, một bảng symbol được đọc từ tệp và một phát biểu về các công cụ nào chỉ được mô tả từ tài liệu.

## Verify It

Chạy demo và bộ kiểm tra tất định:

```bash
cd phases/13-tools-and-protocols/37-the-reverse-engineering-landscape
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Xác minh nên chứng minh:

- trình đọc ELF tìm bốn function symbol trong `ledger-x86_64-O1.o` với kích thước 16, 46, 31 và 63, và hai khoảng trống padding
- các bản thu sweep chứa 86, 56, 84 và 11 chỉ lệnh cho bốn object
- radare2 và rizin báo cáo cùng chỉ lệnh, khối và cạnh trên `ledger-x86_64-O1.o`, và chỉ radare2 có văn bản `pdc`
- angr đánh dấu `sub_40003e` và `sub_40005f` là các hàm không có symbol
- các khối của Ghidra cho `total` là năm khối của bài 33 và các luồng gọi của nó không phải các cạnh đồ thị
- mọi công cụ đặt `grade` tại offset `0x10` sau khi địa chỉ cơ sở của nó được loại bỏ
- mọi công cụ đồng nhất trên mọi điểm bắt đầu chỉ lệnh trong mọi hàm của `ledger-x86_64-O1.o`
- bốn bộ dựng đồ thị báo cáo 3, 3, 5, 4 khối và 2, 3, 5, 4 cạnh ở đó, với các tập cạnh giống hệt
- `total` ở `-O2` có 10 khối và 13 cạnh trong mọi bộ dựng đồ thị
- `grade` ở `-O0` có 3, 8, 8 và 9 khối và 2, 11, 7 và 12 cạnh trong radare2, rizin, angr và Ghidra, với các lý do trong các ghi chú của mỗi công cụ
- `grade_label` ở `-O0` là một khối ở mọi nơi trừ angr, kết thúc một khối tại lần gọi
- angr bịa một hàm mỗi khoảng trống padding cộng một trên bảng bẫy, và không công cụ nào khác bịa hoặc bỏ lỡ một hàm
- sweep thêm các điểm bắt đầu `0x10`, `0x12`, `0x13` và mất `0x14` trên bẫy, và không bộ dựng đồ thị nào giải mã `0x10` đến `0x14`
- các phát hiện nêu tên phạm vi bị bỏ lỡ trong radare2 và mọi hàm được bịa trong angr
- manifest ghi một phiên bản và một lệnh cho cả 21 tệp thu
- ba công cụ decompile `grade`, và chỉ Ghidra gộp mẫu phép chia
- trình dịch ghi CF, OF, SF, ZF, PF ngay lập tức trong một kiểu và một thunk `cc_op` trong kiểu kia, không ghi thanh ghi nào cho `cmp` và không cờ nào cho `movslq`
- trình dịch từ chối các dạng bộ nhớ, các opcode khác, các bit REX thừa và độ dài sai
- các số `cc_op` 8 và 7 của trình dịch bằng các số trong VEX đã thu
- các bản nâng đã thu cho 9, 1, 10 thao tác P-code và 7, 4, 7 câu lệnh VEX cho ba chỉ lệnh
- dòng thời gian chạy từ 1973 đến 2026 theo thứ tự, pipeline có tám giai đoạn và sáu công cụ với một thuật ngữ trong mọi ô, và hai công cụ đóng được đánh dấu là chưa chạy
- hình tương tác nhúng cùng dữ liệu mà harness tạo ra

## Production Failure Modes

| Lỗi | Báo cáo yếu nói gì | Harness phải chứng minh gì |
|---|---|---|
| Các địa chỉ thô từ các công cụ khác nhau | "các công cụ bất đồng về nơi grade nằm" | một offset sau khi mỗi địa chỉ cơ sở được loại bỏ, được kiểm tra trên một hàm |
| Số khối như một phép đo mã được tìm thấy | "Ghidra tìm thấy nhiều mã nhất" | cùng các điểm bắt đầu chỉ lệnh, với khối thừa được giải thích bằng một nhãn |
| Một công cụ làm oracle | "objdump cho thấy các byte bảng là chỉ lệnh" | sweep là một linear sweep; ba bộ dựng đồ thị để các byte không được nhận |
| Các hàm padding được tính là phát hiện | "angr tìm thấy thêm bảy hàm" | mọi hàm nằm trong một khoảng trống padding hoặc trên dữ liệu, và không hàm nào có một symbol |
| Một phép duyệt đã dừng được báo cáo là mã chết | "bốn khối case không thể tới" | 36 byte bị một công cụ bỏ lỡ và được ba công cụ tới |
| Các số cạnh được so sánh không có các ghi chú | "rizin và Ghidra bất đồng về grade" | cùng bốn đích tính toán, thêm một lần tách tại một nhãn |
| Phép toán của một decompiler được đọc như chương trình | "hàm nhân với 1717986919" | mẫu từ bài 34, được một công cụ gộp và một công cụ khác để lại |
| Một công cụ đóng được mô tả như đã chạy | "Binary Ninja báo cáo năm khối" | hình và bảng đánh dấu nó là chỉ tài liệu |
| Các bản thu không có lệnh | "chúng tôi đã chạy radare2" | manifest với phiên bản, lệnh và ngày cho mỗi tệp |
| Một IR không có cờ được đọc như một bản nâng mất mát | "VEX bỏ các cờ" | thunk trong `cc_op`, `cc_dep1`, `cc_dep2`, được đánh giá tại nhánh |

## Operational Rule

Thu mọi công cụ một lần với lệnh và phiên bản của nó, quy mọi địa chỉ về một địa chỉ cơ sở và so sánh các điểm bắt đầu chỉ lệnh trước các khối và các khối trước các cạnh. Hạch toán mỗi byte là được nhận, padding, dữ liệu hoặc bị bỏ lỡ. Đọc ghi chú riêng của một công cụ trước khi phán đoán số đếm của nó, và nói các công cụ nào bạn chỉ đọc về chúng.

## Further Reading

- [Cifuentes, "Reverse Compilation Techniques", PhD thesis, QUT (1994)](https://eprints.qut.edu.au/36820/)
- [Cifuentes and Gough, "Decompilation of Binary Programs", Software: Practice and Experience (1995)](https://doi.org/10.1002/spe.4380250706)
- [Van Emmerik, "Static Single Assignment for Decompilation", PhD thesis, University of Queensland (2007)](https://espace.library.uq.edu.au/view/UQ:158682)
- [Schwartz, Lee, Woo, Brumley, "Native x86 Decompilation Using Semantics-Preserving Structural Analysis and Iterative Control-Flow Structuring" (USENIX Security 2013)](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/schwartz)
- [Yakdan et al., "No More Gotos" (NDSS 2015)](https://www.ndss-symposium.org/ndss2015/ndss-2015-programme/no-more-gotos-decompilation-using-pattern-independent-control-flow-structuring-and-semantics/)
- [Basque et al., "Ahoy SAILR! There is No Need to DREAM of C" (USENIX Security 2024)](https://www.usenix.org/conference/usenixsecurity24/presentation/basque)
- [Andriesse et al., "An In-Depth Analysis of Disassembly on Full-Scale x86/x64 Binaries" (USENIX Security 2016)](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/andriesse)
- [Flake, "Structural Comparison of Executable Objects" (DIMVA 2004)](https://dl.gi.de/items/7f573931-cb51-49ef-a12c-0452a9fb0ea4)
- [Maranzano and Bourne, "A Tutorial Introduction to ADB", Bell Labs (1977)](http://squoze.net/UNIX/v7/files/doc/18_adb.pdf)
- [Stallman, KTH lecture on GDB entering distribution (30 October 1986)](https://www.gnu.org/philosophy/stallman-kth.html)
- [Hex-Rays, "IDA: celebrating 30 years of binary analysis innovation"](https://hex-rays.com/blog/ida-celebrating-30-years-of-binary-analysis-innovation)
- [Guilfanov, "Decompiler internals: microcode", Recon Brussels 2018 (slides)](https://www.recon.cx/2018/brussels/resources/slides/RECON-BRX-2018-Decompiler-internals-microcode.pdf)
- [Hex-Rays, microcode view and maturity levels](https://docs.hex-rays.com/core/decompiler/how-tos/microcode-view)
- [Hex-Rays, IDA 9.4 release notes](https://docs.hex-rays.com/release-notes/9_4)
- [Hex-Rays, IDA Free](https://hex-rays.com/ida-free)
- [Ghidra releases (12.1.4)](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Ghidra P-code reference](https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/languages/html/pcoderef.html)
- [Ghidra decompiler source, main work flow and Action classes](https://github.com/NationalSecurityAgency/ghidra/tree/master/Ghidra/Features/Decompiler/src/decompile/cpp)
- [Ghidra analyzeHeadless README](https://github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/RuntimeScripts/support/analyzeHeadlessREADME.md)
- [Binary Ninja, BNIL overview](https://docs.binary.ninja/dev/bnil-overview.html)
- [Binary Ninja, "Architecture Agnostic Function Detection in Binaries" (2017)](https://binary.ninja/2017/11/06/architecture-agnostic-function-detection-in-binaries.html)
- [Binary Ninja, batch processing and headless licences](https://docs.binary.ninja/dev/batch.html)
- [Binary Ninja 6.0 "Krypton" release post](https://binary.ninja/2026/09/03/binary-ninja-6.0-krypton.html)
- [Binary Ninja Free](https://binary.ninja/free/)
- [radare2 book, ESIL](https://book.rada.re/emulation/esil.html)
- [radare2 book, decompilers](https://book.rada.re/arch/decompile.html)
- [radare2 releases (6.2.4)](https://github.com/radareorg/radare2/releases)
- [rizin, RzIL design notes](https://github.com/rizinorg/rizin/blob/dev/doc/rzil.md)
- [rizin releases (0.9.1)](https://github.com/rizinorg/rizin/releases)
- [Announcing Rizin (8 December 2020)](https://rizin.re/posts/announcing-rizin/)
- [Cutter releases (2.5.0)](https://github.com/rizinorg/cutter/releases)
- [angr documentation, CFG recovery](https://docs.angr.io/en/latest/analyses/cfg.html)
- [angr documentation, the decompiler and its analysis passes](https://docs.angr.io/en/latest/analyses/decompiler.html)
- [angr documentation, intermediate representation (VEX)](https://docs.angr.io/en/latest/advanced-topics/ir.html)
- [angr on PyPI (10.0.3)](https://pypi.org/project/angr/)
- [pypcode on PyPI](https://pypi.org/project/pypcode/)
- [llvm-objdump command guide](https://llvm.org/docs/CommandGuide/llvm-objdump.html)
- [GNU objdump manual](https://sourceware.org/binutils/docs/binutils/objdump.html)
- [LIEF documentation](https://lief.re/doc/stable/index.html)
- [Capstone releases](https://github.com/capstone-engine/capstone/releases)
- [BinDiff releases (v8, open source)](https://github.com/google/bindiff/releases/tag/v8)
- [Diaphora](https://github.com/joxeankoret/diaphora)
- [Hopper Disassembler downloads](https://www.hopperapp.com/download.html)
- [Compiler Explorer](https://github.com/compiler-explorer/compiler-explorer)
- [LLDB announced as an LLVM subproject (2010)](https://blog.llvm.org/2010/06/new-lldb-debugger.html)
- [Boomerang decompiler](https://boomerang.sourceforge.net/)
- [Tan et al., "LLM4Decompile" (EMNLP 2024)](https://aclanthology.org/2024.emnlp-main.203/)
- [Gao et al., "DecompileBench" (Findings of ACL 2025)](https://aclanthology.org/2025.findings-acl.1194/)
- [Liu, Raff, Micinski, "When LLM Decompilers Recompile More and Preserve Less" (2026)](https://arxiv.org/abs/2609.05370)
