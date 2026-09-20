import re

path = r'd:\Ananya\AgenticAI\SciLens\scratch\create_presentation.py'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace has_bullets in slide 2
code = code.replace(
    'c1 = add_card(s, left_start, top_pos, col_w, card_h, "1. Exponential Literature Overload", "Volume & Fragmentation Dilemma")',
    'c1 = add_card(s, left_start, top_pos, col_w, card_h, "1. Exponential Literature Overload", "Volume & Fragmentation Dilemma", has_bullets=True)'
)
code = code.replace(
    'c2 = add_card(s, left_start + col_w + col_gap, top_pos, col_w, card_h, "2. The Research Gap Dilemma", "Subjectivity & Superficial Novelty")',
    'c2 = add_card(s, left_start + col_w + col_gap, top_pos, col_w, card_h, "2. The Research Gap Dilemma", "Subjectivity & Superficial Novelty", has_bullets=True)'
)
code = code.replace(
    'c3 = add_card(s, left_start + (col_w + col_gap)*2, top_pos, col_w, card_h, "3. Generic LLM Pitfalls", "Ungrounded Generative AI Failures")',
    'c3 = add_card(s, left_start + (col_w + col_gap)*2, top_pos, col_w, card_h, "3. Generic LLM Pitfalls", "Ungrounded Generative AI Failures", has_bullets=True)'
)

# Replace has_bullets in slide 3
code = code.replace(
    'p_left = add_card(s, Inches(0.8), panel_top, panel_w, panel_h, "Conventional Research Workflow (Status Quo)", "Fragmented, Manual, and Unverified", bg_color=CARD_BG, border_color=CARD_BORDER)',
    'p_left = add_card(s, Inches(0.8), panel_top, panel_w, panel_h, "Conventional Research Workflow (Status Quo)", "Fragmented, Manual, and Unverified", bg_color=CARD_BG, border_color=CARD_BORDER, has_bullets=True)'
)
code = code.replace(
    'p_right = add_card(s, Inches(0.8) + panel_w + panel_gap, panel_top, panel_w, panel_h, "SciLens Agentic Research Workflow", "Autonomous, Evidence-Grounded, and Cyclic", bg_color=ACCENT_BG, border_color=ROYAL_BLUE)',
    'p_right = add_card(s, Inches(0.8) + panel_w + panel_gap, panel_top, panel_w, panel_h, "SciLens Agentic Research Workflow", "Autonomous, Evidence-Grounded, and Cyclic", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)'
)

# Replace has_bullets in slide 5
code = code.replace(
    'engine_card = add_card(s, Inches(0.8), core_top, core_w, core_h, "SciLens Core Agentic Intelligence Engine", "Cyclic multi-agent pipeline powered by LangGraph StateGraph & Section-Aware RAG", bg_color=CARD_BG, border_color=ROYAL_BLUE)',
    'engine_card = add_card(s, Inches(0.8), core_top, core_w, core_h, "SciLens Core Agentic Intelligence Engine", "Cyclic multi-agent pipeline powered by LangGraph StateGraph & Section-Aware RAG", bg_color=CARD_BG, border_color=ROYAL_BLUE, has_bullets=True)'
)
code = code.replace(
    'out_card = add_card(s, Inches(0.8), out_top, out_w, Inches(1.2), "Actionable Research Deliverables", "Grounded, verifiable research assets ready for immediate publication or thesis proposal submission.", bg_color=ACCENT_BG, border_color=ROYAL_BLUE)',
    'out_card = add_card(s, Inches(0.8), out_top, out_w, Inches(1.3), "Actionable Research Deliverables", "Grounded, verifiable research assets ready for immediate publication or thesis proposal submission.", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)'
)
code = code.replace(
    'out_top + Inches(0.62)',
    'out_top + Inches(0.70)'
)

# Replace has_bullets in slide 8
code = code.replace(
    'add_card(s, x, p5_top, p5_w, p5_h, title, sub, bg_color=ACCENT_BG if is_hl else CARD_BG, border_color=ROYAL_BLUE if is_hl else CARD_BORDER)',
    'add_card(s, x, p5_top, p5_w, p5_h, title, sub, bg_color=ACCENT_BG if is_hl else CARD_BG, border_color=ROYAL_BLUE if is_hl else CARD_BORDER, has_bullets=True)'
)

# Replace has_bullets in slide 9
code = code.replace(
    'add_card(s, Inches(0.8), top3, w3, h3, "Phase 1: Candidate Gap Ingestion", "Initial Hypothesized Empirical Void")',
    'add_card(s, Inches(0.8), top3, w3, h3, "Phase 1: Candidate Gap Ingestion", "Initial Hypothesized Empirical Void", has_bullets=True)'
)
code = code.replace(
    'add_card(s, Inches(0.8) + w3 + gap3, top3, w3, h3, "Phase 2: Critic-Investigator Loop", "Adversarial Stress-Testing & Search", bg_color=ACCENT_BG, border_color=AMBER_WARN)',
    'add_card(s, Inches(0.8) + w3 + gap3, top3, w3, h3, "Phase 2: Critic-Investigator Loop", "Adversarial Stress-Testing & Search", bg_color=ACCENT_BG, border_color=AMBER_WARN, has_bullets=True)'
)
code = code.replace(
    'add_card(s, Inches(0.8) + (w3 + gap3)*2, top3, w3, h3, "Phase 3: Validated Output Decision", "Rigorous Categorization & Grounding")',
    'add_card(s, Inches(0.8) + (w3 + gap3)*2, top3, w3, h3, "Phase 3: Validated Output Decision", "Rigorous Categorization & Grounding", has_bullets=True)'
)

# Replace has_bullets in slide 11
code = code.replace(
    's1_card = add_card(s, Inches(0.8), stack_top1, stack_w, stack_h, "Backend & Agent Orchestration", "Python 3.11  •  FastAPI  •  LangGraph  •  LangChain")',
    's1_card = add_card(s, Inches(0.8), stack_top1, stack_w, stack_h, "Backend & Agent Orchestration", "Python 3.11  •  FastAPI  •  LangGraph  •  LangChain", has_bullets=True)'
)
code = code.replace(
    's2_card = add_card(s, Inches(0.8) + stack_w + Inches(0.26), stack_top1, stack_w, stack_h, "RAG, Vector Store & PDF Engine", "FAISS  •  SentenceTransformers  •  PyMuPDF  •  PDFPlumber")',
    's2_card = add_card(s, Inches(0.8) + stack_w + Inches(0.26), stack_top1, stack_w, stack_h, "RAG, Vector Store & PDF Engine", "FAISS  •  SentenceTransformers  •  PyMuPDF  •  PDFPlumber", has_bullets=True)'
)
code = code.replace(
    's3_card = add_card(s, Inches(0.8), stack_top2, stack_w, stack_h, "Frontend & Interactive Interfaces", "React 18  •  TypeScript  •  Tailwind CSS  •  Gradio")',
    's3_card = add_card(s, Inches(0.8), stack_top2, stack_w, stack_h, "Frontend & Interactive Interfaces", "React 18  •  TypeScript  •  Tailwind CSS  •  Gradio", has_bullets=True)'
)
code = code.replace(
    's4_card = add_card(s, Inches(0.8) + stack_w + Inches(0.26), stack_top2, stack_w, stack_h, "Academic APIs & Testing Suite", "OpenAlex  •  arXiv  •  CrossRef  •  Pytest")',
    's4_card = add_card(s, Inches(0.8) + stack_w + Inches(0.26), stack_top2, stack_w, stack_h, "Academic APIs & Testing Suite", "OpenAlex  •  arXiv  •  CrossRef  •  Pytest", has_bullets=True)'
)

# Replace has_bullets in slide 13
code = code.replace(
    'add_card(s, Inches(0.8), r_top, r_w, r_h, "1. 9-Dimensional Gap Taxonomy", "Empirical Multi-Category Detection")',
    'add_card(s, Inches(0.8), r_top, r_w, r_h, "1. 9-Dimensional Gap Taxonomy", "Empirical Multi-Category Detection", has_bullets=True)'
)
code = code.replace(
    'add_card(s, Inches(0.8) + r_w + r_gap, r_top, r_w, r_h, "2. Contradiction & Validation", "Adversarial Critic Outcomes", bg_color=ACCENT_BG, border_color=ROYAL_BLUE)',
    'add_card(s, Inches(0.8) + r_w + r_gap, r_top, r_w, r_h, "2. Contradiction & Validation", "Adversarial Critic Outcomes", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)'
)
code = code.replace(
    'add_card(s, Inches(0.8) + (r_w + r_gap)*2, r_top, r_w, r_h, "3. Proposals & Claim Verification", "Structured End-to-End Delivery")',
    'add_card(s, Inches(0.8) + (r_w + r_gap)*2, r_top, r_w, r_h, "3. Proposals & Claim Verification", "Structured End-to-End Delivery", has_bullets=True)'
)

# Replace has_bullets in slide 15
code = code.replace(
    'c_f1 = add_card(s, Inches(0.8), fs_top1, fs_w, fs_h, "1. Multimodal Document Understanding", "Vision-Language Paper Ingestion")',
    'c_f1 = add_card(s, Inches(0.8), fs_top1, fs_w, fs_h, "1. Multimodal Document Understanding", "Vision-Language Paper Ingestion", has_bullets=True)'
)
code = code.replace(
    'c_f2 = add_card(s, Inches(0.8) + fs_w + Inches(0.26), fs_top1, fs_w, fs_h, "2. Distributed Enterprise Vector Scaling", "Million-Scale Corpus Indexing")',
    'c_f2 = add_card(s, Inches(0.8) + fs_w + Inches(0.26), fs_top1, fs_w, fs_h, "2. Distributed Enterprise Vector Scaling", "Million-Scale Corpus Indexing", has_bullets=True)'
)
code = code.replace(
    'c_f3 = add_card(s, Inches(0.8), fs_top2, fs_w, fs_h, "3. Automated Starter Code Synthesis", "From Research Method to Code Execution")',
    'c_f3 = add_card(s, Inches(0.8), fs_top2, fs_w, fs_h, "3. Automated Starter Code Synthesis", "From Research Method to Code Execution", has_bullets=True)'
)
code = code.replace(
    'c_f4 = add_card(s, Inches(0.8) + fs_w + Inches(0.26), fs_top2, fs_w, fs_h, "4. Multi-Researcher Collaborative Studio", "Real-Time Academic Peer Review")',
    'c_f4 = add_card(s, Inches(0.8) + fs_w + Inches(0.26), fs_top2, fs_w, fs_h, "4. Multi-Researcher Collaborative Studio", "Real-Time Academic Peer Review", has_bullets=True)'
)

# Replace has_bullets in slide 16
code = code.replace(
    'add_card(s, Inches(0.8), con_top, con_w, con_h, "1. Eliminating Bottlenecks", "Autonomous Literature Synthesis")',
    'add_card(s, Inches(0.8), con_top, con_w, con_h, "1. Eliminating Bottlenecks", "Autonomous Literature Synthesis", has_bullets=True)'
)
code = code.replace(
    'add_card(s, Inches(0.8) + con_w + con_gap, con_top, con_w, con_h, "2. Grounded Scientific Rigor", "No Hallucinations, Proven Novelty", bg_color=ACCENT_BG, border_color=ROYAL_BLUE)',
    'add_card(s, Inches(0.8) + con_w + con_gap, con_top, con_w, con_h, "2. Grounded Scientific Rigor", "No Hallucinations, Proven Novelty", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)'
)
code = code.replace(
    'add_card(s, Inches(0.8) + (con_w + con_gap)*2, con_top, con_w, con_h, "3. Actionable Research Impact", "From Query to Formulated Proposal")',
    'add_card(s, Inches(0.8) + (con_w + con_gap)*2, con_top, con_w, con_h, "3. Actionable Research Impact", "From Query to Formulated Proposal", has_bullets=True)'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated create_presentation.py successfully!")
