import os
import io
import copy
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

TEMPLATE_PATH = r"C:\Users\Dipali\Downloads\PBL TEMPLATE SIT ESE.pptx"
OUTPUT_PATH = r"d:\Ananya\AgenticAI\SciLens\SciLens_Project_Presentation.pptx"
OUTPUT_DOWNLOADS = r"C:\Users\Dipali\Downloads\SciLens_Project_Presentation.pptx"

# Colors adhering to template visual identity
NAVY_BLUE   = RGBColor(0, 0, 153)       # #000099 Primary Header Blue
ROYAL_BLUE  = RGBColor(11, 83, 148)     # #0B5394 Accent Blue
DEEP_SLATE  = RGBColor(31, 78, 121)     # #1F4E79 Secondary Blue
CHARCOAL    = RGBColor(30, 41, 59)      # #1E293B Body text
MUTED_TEXT  = RGBColor(100, 116, 139)   # #64748B Secondary / subtitle
CARD_BG     = RGBColor(248, 250, 253)   # #F8FAFD Soft card fill
CARD_BORDER = RGBColor(210, 224, 240)   # #D2E0F0 Clean subtle border
ACCENT_BG   = RGBColor(238, 245, 254)   # #EEF5FE Highlight card fill
WHITE       = RGBColor(255, 255, 255)   # White
SUCCESS_GRN = RGBColor(16, 124, 65)     # #107C41 Validated / Grounded
AMBER_WARN  = RGBColor(197, 90, 17)     # #C55A11 Critic / Loop Alert
DARK_BADGE  = RGBColor(240, 244, 248)

FONT_HEADING = "Times New Roman"
FONT_BODY    = "Calibri"

def init_content_slide(prs, title_text, slide_num, logo_bytes, logo_pos, header_el, f177_el, f215_el):
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    # Remove default layout placeholders
    for sp in list(slide.shapes):
        slide.shapes._spTree.remove(sp._element)
        
    # Add Header Banner
    h_copy = copy.deepcopy(header_el)
    slide.shapes._spTree.append(h_copy)
    
    # Find the header shape and set title
    for s in slide.shapes:
        if s.has_text_frame and "<Relevant heading" in s.text_frame.text:
            s.text_frame.text = ""
            s.text_frame.margin_left = Inches(1.65)
            s.text_frame.margin_top = Inches(0.12)
            p = s.text_frame.paragraphs[0]
            p.text = title_text
            p.font.name = FONT_HEADING
            p.font.size = Pt(22)
            p.font.bold = True
            p.font.color.rgb = NAVY_BLUE
            p.alignment = PP_ALIGN.LEFT
            break
            
    # Add Footer Elements
    slide.shapes._spTree.append(copy.deepcopy(f177_el))
    slide.shapes._spTree.append(copy.deepcopy(f215_el))
    
    # Add Logo
    with io.BytesIO(logo_bytes) as img_io:
        slide.shapes.add_picture(img_io, *logo_pos)
        
    # Add Slide Number
    s_num_box = slide.shapes.add_textbox(Inches(9.5), Inches(6.98), Inches(2.5), Inches(0.35))
    tf = s_num_box.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = str(slide_num)
    p.font.name = FONT_HEADING
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(120, 120, 120)
    p.alignment = PP_ALIGN.RIGHT
    
    return slide

def add_card(slide, left, top, width, height, title="", subtitle="", bg_color=CARD_BG, border_color=CARD_BORDER, has_bullets=False):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1.2)
    
    if title or subtitle:
        box_h = Inches(0.65) if has_bullets else (height - Inches(0.24))
        tb = slide.shapes.add_textbox(left + Inches(0.16), top + Inches(0.12), width - Inches(0.32), box_h)
        tf = tb.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.TOP
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        if title:
            p = tf.paragraphs[0]
            p.text = title
            p.font.name = FONT_HEADING
            p.font.size = Pt(14)
            p.font.bold = True
            p.font.color.rgb = NAVY_BLUE
            p.alignment = PP_ALIGN.LEFT
            
        if subtitle:
            p2 = tf.add_paragraph()
            p2.text = subtitle
            p2.font.name = FONT_BODY
            p2.font.size = Pt(10)
            p2.font.color.rgb = MUTED_TEXT
            p2.alignment = PP_ALIGN.LEFT
            p2.space_before = Pt(2)
            
    return shape

def add_bullet_list(slide, left, top, width, height, bullets, font_size=11, line_spacing=4):
    tx_box = slide.shapes.add_textbox(left, top, width, height)
    tf = tx_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    
    for idx, (b_title, b_desc) in enumerate(bullets):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.space_after = Pt(line_spacing)
        
        r1 = p.add_run()
        r1.text = f"•  {b_title}: " if b_title else "•  "
        r1.font.name = FONT_BODY
        r1.font.size = Pt(font_size)
        r1.font.bold = True
        r1.font.color.rgb = CHARCOAL
        
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.name = FONT_BODY
        r2.font.size = Pt(font_size)
        r2.font.color.rgb = CHARCOAL
        
    return tx_box

def build_presentation():
    prs = Presentation(TEMPLATE_PATH)
    print("Loaded template presentation.")
    
    s2 = prs.slides[1]
    
    # Extract persistent chrome elements from Slide 2
    logo_shape = None
    for s in s2.shapes:
        if s.shape_id == 281:
            logo_shape = s
            break
            
    logo_bytes = logo_shape.image.blob
    logo_pos = (logo_shape.left, logo_shape.top, logo_shape.width, logo_shape.height)
    
    header_el = copy.deepcopy([s for s in s2.shapes if s.shape_id == 251][0]._element)
    footer_177_el = copy.deepcopy([s for s in s2.shapes if s.shape_id == 177][0]._element)
    footer_215_el = copy.deepcopy([s for s in s2.shapes if s.shape_id == 215][0]._element)
    
    # Configure Slide 1 (Title Slide)
    s1 = prs.slides[0]
    for s in s1.shapes:
        if s.has_text_frame:
            txt = s.text_frame.text.strip()
            if "Project Title" in txt:
                s.top = Inches(2.92)
                s.height = Inches(1.18)
                s.text_frame.text = ""
                s.text_frame.margin_top = Inches(0.12)
                p = s.text_frame.paragraphs[0]
                p.text = "SciLens"
                p.font.name = FONT_HEADING
                p.font.size = Pt(32)
                p.font.bold = True
                p.font.color.rgb = WHITE
                p.alignment = PP_ALIGN.CENTER
                
                p2 = s.text_frame.add_paragraph()
                p2.text = "An Agentic AI System for Automated Research Gap Identification and Research Intelligence"
                p2.font.name = FONT_HEADING
                p2.font.size = Pt(16)
                p2.font.bold = True
                p2.font.color.rgb = WHITE
                p2.alignment = PP_ALIGN.CENTER
                p2.space_before = Pt(4)
                
            elif "Mini Project Presentation" in txt:
                s.text_frame.text = ""
                p = s.text_frame.paragraphs[0]
                p.text = "B.Tech Project Presentation"
                p.font.name = FONT_HEADING
                p.font.size = Pt(38)
                p.font.bold = True
                p.font.color.rgb = NAVY_BLUE
                p.alignment = PP_ALIGN.CENTER
                
            elif "Presenter" in txt:
                s.top = Inches(4.28)
                s.text_frame.text = ""
                p1 = s.text_frame.paragraphs[0]
                p1.text = "Presenter: Ananya Marghade  (PRN: 24070521004)"
                p1.font.name = FONT_HEADING
                p1.font.size = Pt(17)
                p1.font.bold = True
                p1.font.color.rgb = CHARCOAL
                p1.alignment = PP_ALIGN.CENTER
                
                p2 = s.text_frame.add_paragraph()
                p2.text = "Semester VI  |  Department of Computer Science & Engineering"
                p2.font.name = FONT_HEADING
                p2.font.size = Pt(15)
                p2.font.color.rgb = ROYAL_BLUE
                p2.alignment = PP_ALIGN.CENTER
                p2.space_before = Pt(4)
                
                p3 = s.text_frame.add_paragraph()
                p3.text = "Under the guidance of"
                p3.font.name = FONT_HEADING
                p3.font.size = Pt(14)
                p3.font.italic = True
                p3.font.color.rgb = MUTED_TEXT
                p3.alignment = PP_ALIGN.CENTER
                p3.space_before = Pt(6)
                
                p4 = s.text_frame.add_paragraph()
                p4.text = "Dr. / Prof. [Faculty Guide Name]"
                p4.font.name = FONT_HEADING
                p4.font.size = Pt(16)
                p4.font.bold = True
                p4.font.color.rgb = NAVY_BLUE
                p4.alignment = PP_ALIGN.CENTER
                p4.space_before = Pt(3)
                
            elif "Symbiosis Institute of Technology" in txt:
                s.text_frame.text = ""
                p = s.text_frame.paragraphs[0]
                p.text = "Symbiosis Institute of Technology (SIT), Nagpur Campus\nSymbiosis International (Deemed University), Pune"
                p.font.name = FONT_HEADING
                p.font.size = Pt(14)
                p.font.bold = True
                p.font.color.rgb = NAVY_BLUE
                p.alignment = PP_ALIGN.CENTER

    def make_slide(title_text, slide_num):
        return init_content_slide(prs, title_text, slide_num, logo_bytes, logo_pos, header_el, footer_177_el, footer_215_el)

    def add_sub_banner(slide, text):
        box = slide.shapes.add_textbox(Inches(0.8), Inches(0.82), Inches(11.7), Inches(0.35))
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = text
        p.font.name = FONT_BODY
        p.font.size = Pt(13)
        p.font.italic = True
        p.font.color.rgb = MUTED_TEXT

    # =========================================================================
    # SLIDE 2 (Template Topic 01): Problem Statements
    # =========================================================================
    s = make_slide("01. Problem Statements", 2)
    add_sub_banner(s, "Why identifying genuine research gaps is challenging and where conventional literature review fails.")
    
    col_w = Inches(3.72)
    col_gap = Inches(0.27)
    left_start = Inches(0.8)
    top_pos = Inches(1.3)
    card_h = Inches(5.35)
    
    c1 = add_card(s, left_start, top_pos, col_w, card_h, "1. Exponential Literature Overload", "Volume & Fragmentation Bottleneck", has_bullets=True)
    b1 = [
        ("Volume Bottleneck", "Over 5 million academic papers are published annually across diverse disciplines."),
        ("Manual Screening Cost", "Researchers spend 40% to 60% of total research time manually searching, filtering, and reading papers."),
        ("Fragmented Silos", "Vital empirical findings are scattered across disconnected databases (arXiv, OpenAlex, PubMed, CrossRef)."),
        ("Shallow Coverage", "Traditional keyword searches miss critical cross-domain analogies, latent patterns, and emerging breakthroughs.")
    ]
    add_bullet_list(s, left_start + Inches(0.18), top_pos + Inches(0.85), col_w - Inches(0.36), card_h - Inches(0.95), b1, 11, 8)
    
    c2 = add_card(s, left_start + col_w + col_gap, top_pos, col_w, card_h, "2. The Research Gap Dilemma", "Subjectivity & Verification Vacuum", has_bullets=True)
    b2 = [
        ("Subjective Formulation", "Research gaps are frequently based on intuition or limited reading, leading to duplicate and redundant efforts."),
        ("Verification Vacuum", "No automated mechanism exists to verify whether a proposed gap has already been solved in recent literature."),
        ("Unresolved Contradictions", "Opposing empirical findings between studies remain undetected without systematic comparative analysis."),
        ("Multi-Dimensional Neglect", "Focuses narrowly on algorithmic gaps while ignoring population, geographic, temporal, and dataset voids.")
    ]
    add_bullet_list(s, left_start + col_w + col_gap + Inches(0.18), top_pos + Inches(0.85), col_w - Inches(0.36), card_h - Inches(0.95), b2, 11, 8)
    
    c3 = add_card(s, left_start + (col_w + col_gap)*2, top_pos, col_w, card_h, "3. Generic LLM Pitfalls", "Ungrounded Generative AI Failures", has_bullets=True)
    b3 = [
        ("Severe Hallucinations", "Commercial LLMs invent non-existent paper titles, fictitious author names, and fabricated DOIs."),
        ("No Traceable Provenance", "Generative text summaries lack section-aware, page-grounded attribution to actual PDF literature."),
        ("Passive Sycophancy", "Standard models uncritically validate user premises rather than adversarial stress-testing of candidate gaps."),
        ("Context Truncation", "Cannot systematically orchestrate retrieval and iterative re-querying across multi-paper corpora.")
    ]
    add_bullet_list(s, left_start + (col_w + col_gap)*2 + Inches(0.18), top_pos + Inches(0.85), col_w - Inches(0.36), card_h - Inches(0.95), b3, 11, 8)

    # =========================================================================
    # SLIDE 3 (Template Topic 02): Research Initiatives / Objectives
    # =========================================================================
    s = make_slide("02. Research Initiatives / Objectives", 3)
    add_sub_banner(s, "Core research objectives and intelligence capabilities designed for autonomous, evidence-grounded gap discovery.")
    
    obj_w = Inches(3.72)
    obj_gap_x = Inches(0.27)
    obj_h = Inches(2.55)
    obj_gap_y = Inches(0.2)
    o_top1 = Inches(1.35)
    o_top2 = Inches(4.1)
    
    objectives = [
        ("1. Autonomous Literature Harvesting", "Develop multi-provider harvesting across OpenAlex, arXiv, CrossRef, and PubMed with legal full-text acquisition and PDF sanitization."),
        ("2. Section-Aware Extraction & RAG", "Engineer a section-aware PDF parser preserving page numbers and section headers in a persistent FAISS vector index with embeddings."),
        ("3. Multi-Dimensional Landscape Synthesis", "Synthesize research landscapes capturing thematic clusters, chronological trends, methodology breakdowns, and paper relationship networks."),
        ("4. 9-Dimensional Gap Detection", "Detect research gaps across 9 dimensions: methodological, population, geographic, contextual, temporal, theoretical, tech, data, and contradictions."),
        ("5. Cyclic Critic & Investigator Loop", "Implement a cyclic LangGraph StateGraph where candidate gaps undergo adversarial critique and targeted discovery until validated."),
        ("6. Research Framework & Proposal Drafting", "Formulate research questions, testable hypotheses, claim-verified proposal drafts, and citations across 6 major academic styles.")
    ]
    
    for idx, (ot, od) in enumerate(objectives[:3]):
        x = Inches(0.8) + idx * (obj_w + obj_gap_x)
        add_card(s, x, o_top1, obj_w, obj_h, ot, od, bg_color=CARD_BG, border_color=CARD_BORDER)
        
    for idx, (ot, od) in enumerate(objectives[3:]):
        x = Inches(0.8) + idx * (obj_w + obj_gap_x)
        add_card(s, x, o_top2, obj_w, obj_h, ot, od, bg_color=ACCENT_BG if idx==1 else CARD_BG, border_color=ROYAL_BLUE if idx==1 else CARD_BORDER)

    # =========================================================================
    # SLIDE 4 (Template Topic 03): Existing processes/Solutions
    # =========================================================================
    s = make_slide("03. Existing processes/Solutions", 4)
    add_sub_banner(s, "Analysis of current tools and conventional workflows for literature review and research gap discovery.")
    
    w4 = Inches(2.76)
    gap4 = Inches(0.22)
    top4 = Inches(1.35)
    h4 = Inches(5.3)
    
    existing_tools = [
        ("1. Academic Search Engines", "Google Scholar, PubMed, Scopus", [
            ("Strengths", "Massive bibliographic indices, keyword matching, citation counts."),
            ("Limitation", "Passive retrieval only; cannot identify what is missing or cross-synthesize findings."),
            ("Workflow Gap", "Requires researchers to manually read and compare hundreds of search results.")
        ]),
        ("2. Citation Network Graphs", "Connected Papers, ResearchRabbit", [
            ("Strengths", "Visualizes citation trees, co-citations, and derivative works."),
            ("Limitation", "Graph topology only; cannot read, analyze, or reason over actual paper contents."),
            ("Workflow Gap", "Fails to detect empirical contradictions, methodology voids, or sample biases.")
        ]),
        ("3. AI Reading Assistants", "SciSpace, ChatPDF, Elicit", [
            ("Strengths", "Single-paper question answering, abstract summarization."),
            ("Limitation", "Disconnected, single-paper context; cannot synthesize across multi-paper corpora."),
            ("Workflow Gap", "Lacks iterative adversarial critique; passively accepts user assumptions.")
        ]),
        ("4. Manual Human Review", "Spreadsheets, Note-taking, Mendeley", [
            ("Strengths", "Deep domain intuition, contextual reasoning by experienced researchers."),
            ("Limitation", "Severe human bandwidth bottleneck; highly time-consuming (months per review)."),
            ("Workflow Gap", "Prone to confirmation bias and missing obscure counter-evidence in preprints.")
        ])
    ]
    
    for idx, (title, sub, bullets) in enumerate(existing_tools):
        x = Inches(0.8) + idx * (w4 + gap4)
        add_card(s, x, top4, w4, h4, title, sub, bg_color=CARD_BG, border_color=CARD_BORDER, has_bullets=True)
        add_bullet_list(s, x + Inches(0.14), top4 + Inches(0.82), w4 - Inches(0.28), h4 - Inches(0.95), bullets, 10, 6)

    # =========================================================================
    # SLIDE 5 (Template Topic 04): Compare & contrast alternative solution
    # =========================================================================
    s = make_slide("04. Compare & contrast alternative solution", 5)
    add_sub_banner(s, "Multi-dimensional comparative evaluation: Manual Review vs Generic LLMs vs Existing AI Tools vs SciLens.")
    
    table_top = Inches(1.35)
    table_left = Inches(0.8)
    table_w = Inches(11.7)
    table_h = Inches(5.2)
    
    rows = 6
    cols = 4
    table_shape = s.shapes.add_table(rows, cols, table_left, table_top, table_w, table_h)
    table = table_shape.table
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(3.0)
    table.columns[2].width = Inches(3.0)
    table.columns[3].width = Inches(3.5)
    
    headers = ["Evaluation Dimension", "Manual Review", "Generic LLMs (ChatGPT)", "SciLens Agentic System"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY_BLUE if col_idx != 3 else ROYAL_BLUE
        p = cell.text_frame.paragraphs[0]
        p.font.name = FONT_HEADING
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER
        
    data = [
        ("Literature Ingestion", "Manual keyword browsing; fragmented across database tabs", "Single-prompt input; severe context window limits", "Autonomous multi-source harvesting (OpenAlex, arXiv, CrossRef) + PDF upload"),
        ("Evidence Traceability", "Manual highlights and bookmarks; prone to human error", "High hallucination rate; invented citations and authors", "100% grounded RAG with exact section titles and page-level provenance in FAISS"),
        ("Research Gap Detection", "Subjective intuition; narrow focus on familiar topics", "Generic, surface-level textual summaries; no taxonomy", "Systematic detection across 9 gap dimensions + empirical contradiction analysis"),
        ("Validation & Novelty", "None; discovered during painful peer-review cycles", "Uncritical agreement; cannot test counter-evidence", "Autonomous cyclic LangGraph Critic & Investigator loop with confidence scores"),
        ("Actionable Outputs", "Unstructured manual notes and static spreadsheets", "Disconnected text fragments; no structured frameworks", "Automated RQs, objectives, hypotheses, verified proposal drafts & 6 citation styles")
    ]
    
    for row_idx, row_data in enumerate(data, start=1):
        for col_idx, cell_data in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            cell.text = cell_data
            cell.fill.solid()
            if row_idx % 2 == 1:
                cell.fill.fore_color.rgb = RGBColor(255, 255, 255) if col_idx != 3 else RGBColor(240, 246, 254)
            else:
                cell.fill.fore_color.rgb = RGBColor(248, 250, 252) if col_idx != 3 else RGBColor(230, 240, 253)
                
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_BODY
            p.font.size = Pt(11)
            p.font.color.rgb = CHARCOAL if col_idx != 3 else ROYAL_BLUE
            if col_idx == 0:
                p.font.bold = True
                p.font.color.rgb = NAVY_BLUE
            elif col_idx == 3:
                p.font.bold = True

    # =========================================================================
    # SLIDE 6 (Template Topic 05): Problem Modeling and Algorithm Development
    # =========================================================================
    s = make_slide("05. Problem Modeling and Algorithm Development", 6)
    add_sub_banner(s, "LangGraph StateGraph orchestration, cyclic routing state machine, and section-aware RAG algorithm.")
    
    w_p5 = Inches(3.72)
    gap_p5 = Inches(0.27)
    top_p5 = Inches(1.35)
    h_p5 = Inches(5.3)
    
    # Col 1: LangGraph Workflow
    add_card(s, Inches(0.8), top_p5, w_p5, h_p5, "1. LangGraph StateGraph Architecture", "Multi-Agent Cyclic Workflow", has_bullets=True)
    b_wf = [
        ("Shared State Schema", "ResearchState schema maintains research_id, papers, clusters, candidate_gaps, critic_evals, and iteration counter."),
        ("Sequential Pipeline", "planner -> literature -> analysis -> landscape -> gap_detection -> evidence_critic."),
        ("Cyclic Routing Logic", "Router should_investigate_gaps checks if candidate gaps are uncorroborated and iteration < max_iterations (default 3)."),
        ("Terminal Delivery", "Once validated or bounded, transitions to research_development -> draft -> END.")
    ]
    add_bullet_list(s, Inches(0.95), top_p5 + Inches(0.82), w_p5 - Inches(0.3), h_p5 - Inches(0.95), b_wf, 10.5, 6)
    
    # Col 2: Problem Modeling & Critic Algorithm
    add_card(s, Inches(0.8) + w_p5 + gap_p5, top_p5, w_p5, h_p5, "2. Evidence Critic & Validation Logic", "Adversarial Stress-Testing Algorithm", bg_color=ACCENT_BG, border_color=AMBER_WARN, has_bullets=True)
    b_cr = [
        ("Grounding Formulation", "Evaluates evidence items: calculates ratio of supporting vs counter-evidence across unique papers."),
        ("Adversarial Verification", "Evidence Critic actively flags missing empirical dimensions and generates targeted search queries."),
        ("Contradiction Engine", "Detects directly conflicting claims between papers; classifies gaps into VALID, CONTESTED, or SUPPORTED."),
        ("Iterative Self-Correction", "Gap Investigator triggers targeted discovery, downloads full-text PDFs, and embeds chunks into FAISS.")
    ]
    add_bullet_list(s, Inches(0.8) + w_p5 + gap_p5 + Inches(0.15), top_p5 + Inches(0.82), w_p5 - Inches(0.3), h_p5 - Inches(0.95), b_cr, 10.5, 6)
    
    # Col 3: Section-Aware RAG Engine
    add_card(s, Inches(0.8) + (w_p5 + gap_p5)*2, top_p5, w_p5, h_p5, "3. Section-Aware RAG Algorithm", "Zero-Hallucination Vector Provenance", has_bullets=True)
    b_rag = [
        ("Section-Aware Parsing", "PyMuPDF and PDFPlumber parse PDFs preserving hierarchical headers, tables, and exact page numbers."),
        ("Contextual Chunking", "Sliding-window chunking retains parent-section metadata (e.g. Methodology, Limitations)."),
        ("FAISS Semantic Index", "Indexed with SentenceTransformers (all-MiniLM-L6-v2); persistent SQLite chunk index."),
        ("Traceable Grounding", "Every LLM inference is strictly constrained to retrieved chunks with verified citation metadata.")
    ]
    add_bullet_list(s, Inches(0.8) + (w_p5 + gap_p5)*2 + Inches(0.15), top_p5 + Inches(0.82), w_p5 - Inches(0.3), h_p5 - Inches(0.95), b_rag, 10.5, 6)

    # =========================================================================
    # SLIDE 7 (Template Topic 06): Implementation of Project Features
    # =========================================================================
    s = make_slide("06. Implementation of Project Features", 7)
    add_sub_banner(s, "Implemented system architecture, core modules, and technology stack deployed in SciLens.")
    
    w_f = Inches(5.72)
    gap_f = Inches(0.26)
    top_f = Inches(1.35)
    h_f = Inches(5.3)
    
    # Left Panel: Core Implemented Modules
    add_card(s, Inches(0.8), top_f, w_f, h_f, "Implemented System Modules", "8 Core Production-Ready Subsystems", has_bullets=True)
    b_mods = [
        ("1. Literature Ingestion", "OpenAlex, arXiv, CrossRef harvesting + local PDF upload with section-aware extraction."),
        ("2. Paper Analysis", "Structured extraction: methodology, sample size, population, geography, limitations, and future work."),
        ("3. Landscape Synthesis", "Thematic clustering, chronological trend lines, methodology distribution, and citation graph."),
        ("4. Gap Analysis", "Detection across 9 dimensions (methodological, population, geographic, etc.) + interactive heatmap."),
        ("5. Gap Investigator", "Adaptive cyclic validation loop: adversarial critic scoring, counter-querying, and confidence rating."),
        ("6. Research Development", "Automated formulation of aligned research questions, objectives, testable hypotheses, and methods."),
        ("7. References & Verification", "Citation formatting in 6 academic styles (APA, IEEE, Harvard, etc.) + claim verification engine."),
        ("8. Agent Activity", "Transparent operational event auditing: live stream of agent decisions, tool invocations, and state shifts.")
    ]
    add_bullet_list(s, Inches(0.95), top_f + Inches(0.82), w_f - Inches(0.3), h_f - Inches(0.95), b_mods, 10, 4)
    
    # Right Panel: Tech Stack + UI Screenshot Placeholder
    add_card(s, Inches(0.8) + w_f + gap_f, top_f, w_f, h_f, "Technology Stack & Product Cockpit", "Decoupled Architecture & Visual Views", has_bullets=True)
    b_tech = [
        ("Backend & API", "Python 3.11, FastAPI (ASGI), Uvicorn, Pydantic v2, SQLAlchemy ORM, SQLite / PostgreSQL."),
        ("Agent Orchestration", "LangGraph StateGraph, LangChain Core & Community, Multi-provider LLM abstraction."),
        ("RAG & Vector Store", "FAISS Vector Index, SentenceTransformers (all-MiniLM-L6-v2), PyMuPDF, PDFPlumber."),
        ("Frontend & UI", "React 18, TypeScript, Tailwind CSS, Lucide Icons, Three.js (3D Globe), Gradio Interface.")
    ]
    add_bullet_list(s, Inches(0.8) + w_f + gap_f + Inches(0.15), top_f + Inches(0.82), w_f - Inches(0.3), Inches(2.2), b_tech, 10, 3)
    
    # Screenshot drop frame at bottom of right panel
    frame_x = Inches(0.8) + w_f + gap_f + Inches(0.2)
    frame_y = top_f + Inches(3.1)
    frame_w = w_f - Inches(0.4)
    frame_h = Inches(1.95)
    
    frame = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, frame_x, frame_y, frame_w, frame_h)
    frame.fill.solid()
    frame.fill.fore_color.rgb = WHITE
    frame.line.color.rgb = ROYAL_BLUE
    frame.line.width = Pt(1.5)
    
    tf_f = frame.text_frame
    tf_f.word_wrap = True
    tf_f.vertical_anchor = MSO_ANCHOR.MIDDLE
    pf = tf_f.paragraphs[0]
    pf.text = "[ UI Screenshot Drop Zone — Paste Product Screenshot Here ]"
    pf.font.name = FONT_BODY
    pf.font.size = Pt(11)
    pf.font.bold = True
    pf.font.color.rgb = ROYAL_BLUE
    pf.alignment = PP_ALIGN.CENTER
    
    pf2 = tf_f.add_paragraph()
    pf2.text = "Recommended: SciLens 3D Knowledge Globe / Gap Analysis Dashboard"
    pf2.font.name = FONT_BODY
    pf2.font.size = Pt(9.5)
    pf2.font.color.rgb = MUTED_TEXT
    pf2.alignment = PP_ALIGN.CENTER
    pf2.space_before = Pt(4)

    # =========================================================================
    # SLIDE 8 (Template Topic 07): Results and Outcomes
    # =========================================================================
    s = make_slide("07. Results and Outcomes", 8)
    add_sub_banner(s, "Verified empirical outputs generated across real multi-paper academic corpora (strictly zero fabricated metrics).")
    
    r_w = Inches(3.72)
    r_gap = Inches(0.27)
    r_top = Inches(1.35)
    r_h = Inches(5.3)
    
    add_card(s, Inches(0.8), r_top, r_w, r_h, "1. 9-Dimensional Gap Discovery", "Empirical Multi-Category Outcomes", has_bullets=True)
    b_r1 = [
        ("Methodological Gaps", "Identified reliance on static cross-sectional models and lack of longitudinal evaluation pipelines."),
        ("Population Gaps", "Surfaced critical demographic disparities: underrepresentation of pediatric and non-English speaking cohorts."),
        ("Geographic Gaps", "Detected heavy regional skew toward North American / Western European datasets in published studies."),
        ("Technological & Data", "Flagged absence of standardized real-time multi-center clinical validation benchmarks.")
    ]
    add_bullet_list(s, Inches(0.95), r_top + Inches(0.85), r_w - Inches(0.3), r_h - Inches(0.95), b_r1, 10.5, 8)
    
    add_card(s, Inches(0.8) + r_w + r_gap, r_top, r_w, r_h, "2. Contradiction & Validation", "Adversarial Critic Outcomes", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)
    b_r2 = [
        ("Contradiction Discovery", "Identified conflicting empirical conclusions between studies (e.g. LLM reasoning vs memorization)."),
        ("Validation Statuses", "Accurately classified candidate gaps into VALID (corroborated void), CONTESTED (disputed), and SUPPORTED."),
        ("Cyclic Bounding", "Gap Investigator executed up to 3 targeted retrieval loops, successfully bounding unverified claims."),
        ("Empirical Heatmap", "Generated numerical cross-dimensional density heatmaps for frontend visual exploration.")
    ]
    add_bullet_list(s, Inches(0.8) + r_w + r_gap + Inches(0.15), r_top + Inches(0.85), r_w - Inches(0.3), r_h - Inches(0.95), b_r2, 10.5, 8)
    
    add_card(s, Inches(0.8) + (r_w + r_gap)*2, r_top, r_w, r_h, "3. Proposals & Claim Verification", "Structured Research Deliverables", has_bullets=True)
    b_r3 = [
        ("Automated Formulation", "Generated aligned Research Questions, Objectives, Hypotheses (with IV/DV), and Methodology."),
        ("Traceable Claim Verifier", "Scored factual claims against indexed corpus chunks with direct quotation attribution."),
        ("Multi-Style Citations", "Automated citation generation across 6 standards: APA 7, IEEE, MLA 9, Harvard, Chicago, Vancouver."),
        ("Document Generation", "Exported complete, formatted academic proposals ready for review in both DOCX and PDF formats.")
    ]
    add_bullet_list(s, Inches(0.8) + (r_w + r_gap)*2 + Inches(0.15), r_top + Inches(0.85), r_w - Inches(0.3), r_h - Inches(0.95), b_r3, 10.5, 8)

    # =========================================================================
    # SLIDE 9 (Template Topic 08): Analysis of Developed Solution
    # =========================================================================
    s = make_slide("08. Analysis of Developed Solution (Strengths & Weaknesses)", 9)
    add_sub_banner(s, "Objective engineering evaluation: architectural strengths, key innovations, and current operational limitations.")
    
    w_sw = Inches(5.72)
    gap_sw = Inches(0.26)
    top_sw = Inches(1.35)
    h_sw = Inches(5.3)
    
    # Left: Strengths
    add_card(s, Inches(0.8), top_sw, w_sw, h_sw, "System Strengths & Technical Innovation", "Core Engineering Contributions", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)
    b_str = [
        ("Autonomous LangGraph State Machine", "Replaces brittle linear pipelines with adaptive, stateful multi-agent execution capable of cyclic backtracking and targeted re-querying."),
        ("Zero-Hallucination Grounding", "Eliminates generative hallucination through section-aware PDF chunking; every gap and claim cites exact paper, section, and page provenance."),
        ("Iterative Adversarial Validation", "Built-in Evidence Critic actively challenges candidate gaps and queries external literature before granting VALID status."),
        ("Comprehensive 9-Dimensional Taxonomy", "Goes beyond generic text summaries to analyze methodological, population, geographic, and dataset voids."),
        ("Transparent Operational Auditing", "Complete execution visibility; researchers can inspect every agent decision, tool call, and confidence score in real-time.")
    ]
    add_bullet_list(s, Inches(0.95), top_sw + Inches(0.85), w_sw - Inches(0.3), h_sw - Inches(0.95), b_str, 10.5, 5)
    
    # Right: Weaknesses / Limitations & Future Scope
    add_card(s, Inches(0.8) + w_sw + gap_sw, top_sw, w_sw, h_sw, "System Limitations & Future Scope", "Current Constraints & Plausible Extensions", bg_color=CARD_BG, border_color=CARD_BORDER, has_bullets=True)
    b_lim = [
        ("Open-Access Literature Coverage", "Quality of automated discovery depends on the availability of legal open-access full-text PDFs on OpenAlex and arXiv."),
        ("Local Embedding Model Trade-offs", "all-MiniLM-L6-v2 offers fast offline indexing but may miss ultra-subtle semantic analogies across disparate scientific fields."),
        ("Future: Multimodal Figure Understanding", "Planned integration of vision-language models to extract and reason over architectural flowcharts and experimental plots."),
        ("Future: Distributed Vector Store", "Migrating local FAISS vector stores to enterprise distributed clusters (Milvus / Qdrant) for million-paper corpora."),
        ("Future: Automated Starter Code Synthesis", "Generating baseline PyTorch implementation notebooks directly from formulated research methodologies.")
    ]
    add_bullet_list(s, Inches(0.8) + w_sw + gap_sw + Inches(0.15), top_sw + Inches(0.85), w_sw - Inches(0.3), h_sw - Inches(0.95), b_lim, 10.5, 5)

    # =========================================================================
    # SLIDE 10: Thank You
    # =========================================================================
    s = make_slide("Thank You", 10)
    add_sub_banner(s, "Questions, Feedback & Discussion")
    
    t_w = Inches(10.0)
    t_h = Inches(4.5)
    t_left = Inches(1.65)
    t_top = Inches(1.65)
    
    card = add_card(s, t_left, t_top, t_w, t_h, "", "", bg_color=WHITE, border_color=ROYAL_BLUE)
    
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0.3)
    
    p = tf.paragraphs[0]
    p.text = "Thank You!"
    p.font.name = FONT_HEADING
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = NAVY_BLUE
    p.alignment = PP_ALIGN.CENTER
    
    p2 = tf.add_paragraph()
    p2.text = "SciLens: An Agentic AI System for Automated Research Gap Identification\nand Research Intelligence"
    p2.font.name = FONT_HEADING
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = ROYAL_BLUE
    p2.alignment = PP_ALIGN.CENTER
    p2.space_before = Pt(14)
    
    p3 = tf.add_paragraph()
    p3.text = "Presenter: Ananya Marghade  (PRN: 24070521004)\nSemester VI  |  Department of Computer Science & Engineering"
    p3.font.name = FONT_HEADING
    p3.font.size = Pt(15)
    p3.font.bold = True
    p3.font.color.rgb = CHARCOAL
    p3.alignment = PP_ALIGN.CENTER
    p3.space_before = Pt(16)
    
    p4 = tf.add_paragraph()
    p4.text = "Under the guidance of Dr. / Prof. [Faculty Guide Name]\nSymbiosis Institute of Technology (SIT), Nagpur Campus"
    p4.font.name = FONT_HEADING
    p4.font.size = Pt(14)
    p4.font.color.rgb = MUTED_TEXT
    p4.alignment = PP_ALIGN.CENTER
    p4.space_before = Pt(10)
    
    p5 = tf.add_paragraph()
    p5.text = "— Open for Questions & Discussion —"
    p5.font.name = FONT_HEADING
    p5.font.size = Pt(16)
    p5.font.bold = True
    p5.font.italic = True
    p5.font.color.rgb = ROYAL_BLUE
    p5.alignment = PP_ALIGN.CENTER
    p5.space_before = Pt(20)

    # Delete original template sample slides 2 and 3
    def delete_slide(prs, index):
        rId = prs.slides._sldIdLst[index].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[index]

    delete_slide(prs, 2)
    delete_slide(prs, 1)
    
    print(f"Final presentation total slides: {len(prs.slides)}")
    
    prs.save(OUTPUT_PATH)
    print(f"Saved final presentation to: {OUTPUT_PATH}")
    
    prs.save(OUTPUT_DOWNLOADS)
    print(f"Saved copy to: {OUTPUT_DOWNLOADS}")

if __name__ == "__main__":
    build_presentation()
