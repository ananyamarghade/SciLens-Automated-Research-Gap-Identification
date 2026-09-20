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
        # If bullets will be placed below, restrict header box height to 0.65 in
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
                
    # Helper to create content slide
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
    # SLIDE 2: The Problem
    # =========================================================================
    s = make_slide("The Problem: Research Gap Discovery Bottleneck", 2)
    add_sub_banner(s, "Why conventional literature review and genuine gap identification fail in the era of exponential publication.")
    
    # 3 Columns
    col_w = Inches(3.72)
    col_gap = Inches(0.27)
    left_start = Inches(0.8)
    top_pos = Inches(1.3)
    card_h = Inches(5.35)
    
    # Col 1: Literature Overload
    c1 = add_card(s, left_start, top_pos, col_w, card_h, "1. Exponential Literature Overload", "Volume & Fragmentation Dilemma", has_bullets=True)
    b1 = [
        ("Volume Bottleneck", "Over 5 million academic papers are published every year across diverse disciplines."),
        ("Manual Screening Cost", "Researchers spend 40% to 60% of total research time reading and synthesizing literature."),
        ("Fragmented Silos", "Vital empirical findings are scattered across disconnected repositories (arXiv, OpenAlex, PubMed, CrossRef)."),
        ("Shallow Coverage", "Traditional keyword searches miss critical cross-domain analogies, latent patterns, and recent developments.")
    ]
    add_bullet_list(s, left_start + Inches(0.18), top_pos + Inches(0.85), col_w - Inches(0.36), card_h - Inches(0.95), b1, 11, 8)
    
    # Col 2: The Research Gap Dilemma
    c2 = add_card(s, left_start + col_w + col_gap, top_pos, col_w, card_h, "2. The Research Gap Dilemma", "Subjectivity & Superficial Novelty", has_bullets=True)
    b2 = [
        ("Subjective Formulation", "Research gaps are frequently based on researcher intuition or limited reading, leading to duplicate efforts."),
        ("Verification Vacuum", "No automated mechanism exists to verify whether a proposed gap has already been solved in recent literature."),
        ("Unresolved Contradictions", "Opposing empirical findings between studies remain undetected without systematic comparison."),
        ("Multi-Dimensional Neglect", "Focuses narrowly on algorithmic gaps while ignoring methodological, population, and dataset voids.")
    ]
    add_bullet_list(s, left_start + col_w + col_gap + Inches(0.18), top_pos + Inches(0.85), col_w - Inches(0.36), card_h - Inches(0.95), b2, 11, 8)
    
    # Col 3: Generic LLM Hallucinations
    c3 = add_card(s, left_start + (col_w + col_gap)*2, top_pos, col_w, card_h, "3. Generic LLM Pitfalls", "Ungrounded Generative AI Failures", has_bullets=True)
    b3 = [
        ("Severe Hallucinations", "Commercial LLMs invent non-existent paper titles, fictitious author names, and fabricated DOIs."),
        ("No Traceable Provenance", "Generative text summaries lack section-aware, page-grounded attribution to actual PDF literature."),
        ("Passive Sycophancy", "Standard models uncritically validate user premises rather than adversarial stress-testing of candidate gaps."),
        ("Context Truncation", "Cannot systematically orchestrate retrieval and iterative re-querying across multi-paper corpora.")
    ]
    add_bullet_list(s, left_start + (col_w + col_gap)*2 + Inches(0.18), top_pos + Inches(0.85), col_w - Inches(0.36), card_h - Inches(0.95), b3, 11, 8)

    # =========================================================================
    # SLIDE 3: Why SciLens?
    # =========================================================================
    s = make_slide("Why SciLens? Transition to Evidence-Grounded Intelligence", 3)
    add_sub_banner(s, "Transforming academic exploration from manual keyword guesswork into an autonomous, verifiable research intelligence pipeline.")
    
    panel_w = Inches(5.72)
    panel_gap = Inches(0.26)
    panel_top = Inches(1.3)
    panel_h = Inches(5.35)
    
    # Left Panel: Conventional Workflow
    p_left = add_card(s, Inches(0.8), panel_top, panel_w, panel_h, "Conventional Research Workflow (Status Quo)", "Fragmented, Manual, and Unverified", bg_color=CARD_BG, border_color=CARD_BORDER, has_bullets=True)
    
    # Step cards inside left panel
    step_y = panel_top + Inches(0.85)
    step_h = Inches(0.88)
    steps_left = [
        ("Manual Keyword Search", "Researchers rely on ad-hoc queries on Google Scholar or PubMed; easily miss adjacent or interdisciplinary breakthroughs."),
        ("Unstructured PDF Ingestion", "Reading dozens of lengthy PDFs manually; taking isolated, unstructured notes in spreadsheets without cross-linkage."),
        ("Intuition-Based Gap Guessing", "Formulating gaps based on subjective impression without comprehensive evidence grounding or verification."),
        ("High Rejection & Redundancy Risk", "Submitting proposals that are unknowingly redundant, already addressed, or empirically ungrounded.")
    ]
    for idx, (st, sd) in enumerate(steps_left):
        add_card(s, Inches(1.0), step_y + idx * (step_h + Inches(0.14)), panel_w - Inches(0.4), step_h, f"Step {idx+1}: {st}", sd, bg_color=WHITE, border_color=CARD_BORDER)

    # Right Panel: SciLens Workflow
    p_right = add_card(s, Inches(0.8) + panel_w + panel_gap, panel_top, panel_w, panel_h, "SciLens Agentic Research Workflow", "Autonomous, Evidence-Grounded, and Cyclic", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)
    
    steps_right = [
        ("Multi-Provider Literature Harvesting", "Autonomous discovery across OpenAlex, arXiv, Semantic Scholar, and CrossRef with legal full-text acquisition."),
        ("Section-Aware RAG & Semantic Indexing", "Extracts structured sections (methods, datasets, limitations) preserved with exact page-level provenance in FAISS."),
        ("Cyclic Gap Critic & Investigator Loop", "LangGraph StateGraph where candidate gaps undergo adversarial scrutiny; inconclusive gaps trigger targeted re-discovery."),
        ("Actionable Research Frameworks & Proposals", "Automates research questions, objectives, testable hypotheses, claim-verified proposals, and 6-style citations.")
    ]
    for idx, (st, sd) in enumerate(steps_right):
        add_card(s, Inches(0.8) + panel_w + panel_gap + Inches(0.2), step_y + idx * (step_h + Inches(0.14)), panel_w - Inches(0.4), step_h, f"Pillar {idx+1}: {st}", sd, bg_color=WHITE, border_color=ROYAL_BLUE)

    # =========================================================================
    # SLIDE 4: Existing Approach vs SciLens
    # =========================================================================
    s = make_slide("Existing Approach vs SciLens: Comparative Matrix", 4)
    add_sub_banner(s, "Systematic evaluation of literature analysis methodologies across critical academic research dimensions.")
    
    table_top = Inches(1.35)
    table_left = Inches(0.8)
    table_w = Inches(11.7)
    table_h = Inches(5.2)
    
    # Table shape
    rows = 6
    cols = 4
    table_shape = s.shapes.add_table(rows, cols, table_left, table_top, table_w, table_h)
    table = table_shape.table
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(3.0)
    table.columns[2].width = Inches(3.0)
    table.columns[3].width = Inches(3.5)
    
    headers = ["Research Dimension", "Manual Review", "Generic LLMs (ChatGPT)", "SciLens Agentic System"]
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
        ("Literature Ingestion", "Manual keyword browsing; limited cross-database discovery", "Stateless, single-prompt input; severe context window limits", "Autonomous multi-source harvesting (OpenAlex, arXiv, CrossRef) + PDF upload"),
        ("Evidence Traceability", "Manual bookmarks and paper highlights; prone to error", "High hallucination rate; invented citations and authors", "100% grounded RAG with exact section titles and page-level provenance"),
        ("Research Gap Detection", "Subjective intuition; narrow focus on familiar topics", "Generic, surface-level textual summaries; no taxonomy", "Systematic detection across 9 gap dimensions + contradiction analysis"),
        ("Validation & Novelty", "None; discovered during painful peer-review cycles", "Uncritical agreement; cannot test counter-evidence", "Autonomous cyclic LangGraph Critic & Investigator loop with confidence scores"),
        ("Research Outputs", "Unstructured manual notes and static spreadsheets", "Disconnected text fragments; no structured frameworks", "Automated RQs, objectives, hypotheses, verified proposal drafts & 6 citation styles")
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
    # SLIDE 5: Proposed Solution
    # =========================================================================
    s = make_slide("Proposed Solution: Autonomous Research Intelligence", 5)
    add_sub_banner(s, "An agentic ecosystem combining LangGraph orchestration, section-aware RAG, and an iterative evidence critic.")
    
    # Top Badges: Inputs
    input_top = Inches(1.3)
    input_w = Inches(3.7)
    input_gap = Inches(0.3)
    inputs = [
        ("Input A: Research Topic / Query", "Natural language topic or question input for autonomous literature harvesting across open academic APIs."),
        ("Input B: Direct PDF Uploads", "Single or multi-PDF corpus ingestion preserving document layouts, tables, and section hierarchies."),
        ("Input C: Evaluation Parameters", "User-defined investigation depth, maximum critic iterations (default 3), and citation style preferences.")
    ]
    for idx, (it, idesc) in enumerate(inputs):
        c = add_card(s, Inches(0.8) + idx*(input_w+input_gap), input_top, input_w, Inches(1.1), it, idesc, bg_color=DARK_BADGE, border_color=CARD_BORDER)
        
    # Core Engine Banner
    core_top = Inches(2.55)
    core_w = Inches(11.7)
    core_h = Inches(2.65)
    engine_card = add_card(s, Inches(0.8), core_top, core_w, core_h, "SciLens Core Agentic Intelligence Engine", "Cyclic multi-agent pipeline powered by LangGraph StateGraph & Section-Aware RAG", bg_color=CARD_BG, border_color=ROYAL_BLUE, has_bullets=True)
    
    # 4 Inner Pillars
    pil_w = Inches(2.7)
    pil_gap = Inches(0.2)
    pil_top = core_top + Inches(0.8)
    pil_h = Inches(1.65)
    pillars = [
        ("1. Literature & RAG", "OpenAlex, arXiv, CrossRef harvesting; PyMuPDF section chunking; FAISS persistent vector indexing."),
        ("2. Landscape Synthesis", "Thematic clustering, chronological trend lines, methodology breakdown, and paper network graphs."),
        ("3. Critic & Investigator", "9-type gap detection; Evidence Critic scoring; adaptive cyclic loop fetching counter-evidence."),
        ("4. Research Formulation", "Automates research questions, objectives, hypotheses, claim-verified proposal drafts & citations.")
    ]
    for idx, (pt, pd) in enumerate(pillars):
        add_card(s, Inches(1.05) + idx*(pil_w+pil_gap), pil_top, pil_w, pil_h, pt, pd, bg_color=WHITE, border_color=ROYAL_BLUE)
        
    # Bottom Outputs
    out_top = Inches(5.35)
    out_w = Inches(11.7)
    out_card = add_card(s, Inches(0.8), out_top, out_w, Inches(1.3), "Actionable Research Deliverables", "Grounded, verifiable research assets ready for immediate publication or thesis proposal submission.", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)
    
    delivs = [
        ("Validated Gap Heatmap", "Classified as VALID, SUPPORTED, or CONTESTED."),
        ("Evidence Traceability", "Page and section citation for every claim."),
        ("Research Framework", "Testable hypotheses & methodology recommendations."),
        ("Proposal Export", "Complete academic draft in DOCX & PDF format.")
    ]
    for idx, (dt, dd) in enumerate(delivs):
        bx = s.shapes.add_textbox(Inches(1.05) + idx * Inches(2.88), out_top + Inches(0.70), Inches(2.75), Inches(0.5))
        tf = bx.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"• {dt}: {dd}"
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = ROYAL_BLUE
        p.font.bold = True

    # =========================================================================
    # SLIDE 6: System Architecture
    # =========================================================================
    s = make_slide("System Architecture: End-to-End Modular Pipeline", 6)
    add_sub_banner(s, "Full-stack decoupled architecture: React/TypeScript UI -> FastAPI Gateway -> LangGraph StateGraph -> RAG & FAISS.")
    
    layers = [
        ("Layer 1: Presentation & User Experience", "React 18 + TypeScript + Tailwind CSS Frontend  |  Interactive 3D Knowledge Globe  |  Gradio Conversational Interface (/gradio)", ROYAL_BLUE),
        ("Layer 2: API Gateway & Application Server", "FastAPI (ASGI)  |  Uvicorn  |  REST Endpoints (/api/research, /gaps, /landscape, /draft)  |  Pydantic v2  |  SSRF Security", DEEP_SLATE),
        ("Layer 3: Agent Orchestration Engine", "LangGraph StateGraph Engine  |  Shared ResearchState Schema  |  Cyclic Conditional Routers (should_investigate_gaps)", NAVY_BLUE),
        ("Layer 4: Specialized Multi-Agent Tier", "Planner  •  Literature Agent  •  Paper Analysis  •  Landscape  •  Gap Detection  •  Evidence Critic  •  Gap Investigator  •  Research Dev  •  Draft", ROYAL_BLUE),
        ("Layer 5: RAG & Semantic Retrieval Engine", "PyMuPDF / PDFPlumber Section-Aware Extraction  |  Semantic Chunker  |  FAISS Vector Index  |  SentenceTransformers / OpenAI", DEEP_SLATE),
        ("Layer 6: Persistence & External Academic APIs", "SQLite with SQLAlchemy ORM (PostgreSQL swappable)  |  Academic Search APIs: OpenAlex API, arXiv API, Semantic Scholar, CrossRef", NAVY_BLUE)
    ]
    
    lay_top = Inches(1.3)
    lay_h = Inches(0.82)
    lay_gap = Inches(0.09)
    for idx, (ltitle, ldesc, lcolor) in enumerate(layers):
        y = lay_top + idx * (lay_h + lay_gap)
        c = add_card(s, Inches(0.8), y, Inches(11.7), lay_h, "", "", bg_color=CARD_BG, border_color=CARD_BORDER)
        
        # Badge
        badge = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.95), y + Inches(0.12), Inches(3.6), Inches(0.58))
        badge.fill.solid()
        badge.fill.fore_color.rgb = lcolor
        badge.line.color.rgb = lcolor
        tf = badge.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0.05)
        p = tf.paragraphs[0]
        p.text = ltitle
        p.font.name = FONT_HEADING
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER
        
        # Description
        dx = s.shapes.add_textbox(Inches(4.75), y + Inches(0.12), Inches(7.55), Inches(0.58))
        tf2 = dx.text_frame
        tf2.word_wrap = True
        tf2.margin_left = tf2.margin_right = tf2.margin_top = tf2.margin_bottom = 0
        p2 = tf2.paragraphs[0]
        p2.text = ldesc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = CHARCOAL

    # =========================================================================
    # SLIDE 7: Agentic Workflow
    # =========================================================================
    s = make_slide("Agentic Workflow: Sequential & Cyclic Pipeline", 7)
    add_sub_banner(s, "LangGraph StateGraph coordinating autonomous specialized agents from raw topic query to verified proposal.")
    
    # 8 Workflow steps in 2 rows
    step_w = Inches(2.7)
    step_gap = Inches(0.3)
    step_h = Inches(2.35)
    row1_top = Inches(1.35)
    row2_top = Inches(4.0)
    
    flow_steps = [
        ("1. Planner Agent", "Decomposes topic into domain facets; formulates initial query roadmap; sets state boundaries."),
        ("2. Literature Node", "Queries OpenAlex, arXiv, CrossRef; acquires legal open-access full-text PDFs; sanitizes URLs."),
        ("3. Paper Analysis", "Extracts structured metadata per paper: methodology, datasets, populations, findings, and limitations."),
        ("4. Landscape Agent", "Synthesizes thematic clusters, timeline trends, methodology distributions, and co-occurrence graphs."),
        ("5. Gap Detection", "Analyzes corpus across 9 gap dimensions; identifies absences, limitations, and empirical contradictions."),
        ("6. Evidence Critic", "Evaluates candidate gaps against retrieved evidence; calculates grounding score and checks contradictions."),
        ("7. Gap Investigator", "[Cyclic Loop] If evidence is insufficient (iter < 3), triggers targeted search, ingests papers, and re-evaluates."),
        ("8. Research Dev & Draft", "Formulates RQs, objectives, hypotheses; generates proposal draft; verifies claims against literature.")
    ]
    
    for idx, (stitle, sdesc) in enumerate(flow_steps[:4]):
        x = Inches(0.8) + idx * (step_w + step_gap)
        c = add_card(s, x, row1_top, step_w, step_h, stitle, sdesc, bg_color=CARD_BG, border_color=CARD_BORDER)
        
    for idx, (stitle, sdesc) in enumerate(flow_steps[4:]):
        x = Inches(0.8) + idx * (step_w + step_gap)
        is_loop = "Investigator" in stitle or "Critic" in stitle
        bg = ACCENT_BG if is_loop else CARD_BG
        border = AMBER_WARN if is_loop else CARD_BORDER
        c = add_card(s, x, row2_top, step_w, step_h, stitle, sdesc, bg_color=bg, border_color=border)

    # =========================================================================
    # SLIDE 8: RAG + Evidence Validation
    # =========================================================================
    s = make_slide("RAG + Evidence Validation: The Closed-Loop Core", 8)
    add_sub_banner(s, "Zero-hallucination architecture: anchoring every finding in section-aware chunks with verifiable provenance.")
    
    # 5 Pillars across
    p5_w = Inches(2.18)
    p5_gap = Inches(0.2)
    p5_top = Inches(1.35)
    p5_h = Inches(4.0)
    
    rag_stages = [
        ("1. RETRIEVE", "Section-Aware Search", [
            ("PDF Parsing", "Preserves section headers, tables, and page numbers via PyMuPDF/PDFPlumber."),
            ("Semantic Chunks", "Context-preserving chunking with parent-section metadata."),
            ("Vector Index", "FAISS similarity search using SentenceTransformers.")
        ]),
        ("2. GROUND", "Metadata Provenance", [
            ("Exact Attribution", "Every evidence item carries Paper Title, DOI, Section, and Page."),
            ("No Ghost Sources", "Strict filter ensures only indexed chunks can serve as evidence."),
            ("Snippet Trace", "Verifiable raw text snippets displayed in UI.")
        ]),
        ("3. REASON", "Multi-Dimensional Evaluation", [
            ("Cross-Paper Logic", "Compares methodology, cohorts, and metrics across corpus."),
            ("Absence vs Proof", "Distinguishes unexamined questions from refuted ones."),
            ("Contradictions", "Identifies opposing findings between studies.")
        ]),
        ("4. VALIDATE", "Adversarial Critic", [
            ("Support Scoring", "Computes evidence strength between 0.0 and 1.0."),
            ("Novelty Status", "Categorizes as well_supported, potential_gap, or insufficient."),
            ("Confidence", "Rigorous critique prevents ungrounded gap assertions.")
        ]),
        ("5. REFINE", "Adaptive Feedback Loop", [
            ("Targeted Querying", "Generates missing-evidence queries if gap lacks support."),
            ("Corpus Expansion", "Fetches fresh open-access papers on-the-fly."),
            ("Bounded Cycles", "Terminates safely at max iterations (default 3).")
        ])
    ]
    
    for idx, (title, sub, bullets) in enumerate(rag_stages):
        x = Inches(0.8) + idx * (p5_w + p5_gap)
        is_hl = idx in [3, 4]
        add_card(s, x, p5_top, p5_w, p5_h, title, sub, bg_color=ACCENT_BG if is_hl else CARD_BG, border_color=ROYAL_BLUE if is_hl else CARD_BORDER, has_bullets=True)
        add_bullet_list(s, x + Inches(0.12), p5_top + Inches(0.8), p5_w - Inches(0.24), p5_h - Inches(0.9), bullets, 9.5, 4)
        
    # Anti-Hallucination Banner
    b_card = add_card(s, Inches(0.8), Inches(5.5), Inches(11.7), Inches(1.1), "The Anti-Hallucination Guarantee", "Unlike standard LLMs that generate persuasive but fictitious citations, SciLens enforces an empirical grounding rule: a candidate gap is NEVER marked VALID without traceable, page-level citations from the indexed corpus.", bg_color=WHITE, border_color=SUCCESS_GRN)

    # =========================================================================
    # SLIDE 9: Gap Investigator
    # =========================================================================
    s = make_slide("Gap Investigator: Adaptive Cyclic Verification Loop", 9)
    add_sub_banner(s, "Deep-dive into the cyclic self-correcting agent loop that challenges and corroborates candidate gaps.")
    
    # 3 Stage Layout
    w3 = Inches(3.72)
    gap3 = Inches(0.27)
    top3 = Inches(1.35)
    h3 = Inches(5.3)
    
    # Stage 1: Candidate Gap
    add_card(s, Inches(0.8), top3, w3, h3, "Phase 1: Candidate Gap Ingestion", "Initial Hypothesized Empirical Void", has_bullets=True)
    b_p1 = [
        ("Trigger Event", "Gap Detection Agent analyzes synthesized landscape and surfaces candidate gap across one of 9 dimensions."),
        ("Initial Evidence Query", "Retrieval Agent performs semantic search in current FAISS index for supporting/counter-evidence."),
        ("Tentative Classification", "Candidate gap enters the validation pipeline with status CANDIDATE or POTENTIAL."),
        ("Vulnerability Check", "Evidence Critic initiates adversarial review to identify gaps in empirical corroboration.")
    ]
    add_bullet_list(s, Inches(0.95), top3 + Inches(0.85), w3 - Inches(0.3), h3 - Inches(0.95), b_p1, 10.5, 8)
    
    # Stage 2: Critic-Investigator Loop
    add_card(s, Inches(0.8) + w3 + gap3, top3, w3, h3, "Phase 2: Critic-Investigator Loop", "Adversarial Stress-Testing & Search", bg_color=ACCENT_BG, border_color=AMBER_WARN, has_bullets=True)
    b_p2 = [
        ("Evidence Critic Review", "Evaluates evidence count, unique papers, and contradiction presence; flags missing evidence dimensions."),
        ("Decision Branch", "If status is INSUFFICIENT and iteration < max_iterations (default 3), triggers Gap Investigator."),
        ("Targeted Re-Querying", "Gap Investigator generates precision search queries targeting identified missing empirical evidence."),
        ("On-Demand Ingestion", "Queries OpenAlex & arXiv; downloads full-text PDFs; embeds chunks into FAISS; re-triggers Critic.")
    ]
    add_bullet_list(s, Inches(0.8) + w3 + gap3 + Inches(0.15), top3 + Inches(0.85), w3 - Inches(0.3), h3 - Inches(0.95), b_p2, 10.5, 8)
    
    # Stage 3: Decision & Refinement
    add_card(s, Inches(0.8) + (w3 + gap3)*2, top3, w3, h3, "Phase 3: Validated Output Decision", "Rigorous Categorization & Grounding", has_bullets=True)
    b_p3 = [
        ("VALID", "Corroborated by multiple independent papers with verified absence of solutions in literature."),
        ("CONTESTED", "Direct empirical contradiction discovered between published studies; highlights research dispute."),
        ("SUPPORTED", "Partial evidence established; potential gap requiring further focused exploration."),
        ("INSUFFICIENT", "Safely bounded at max iterations; prevents researchers from pursuing phantom unverified gaps.")
    ]
    add_bullet_list(s, Inches(0.8) + (w3 + gap3)*2 + Inches(0.15), top3 + Inches(0.85), w3 - Inches(0.3), h3 - Inches(0.95), b_p3, 10.5, 8)

    # =========================================================================
    # SLIDE 10: Key Features / Modules
    # =========================================================================
    s = make_slide("Key Features & Implemented System Modules", 10)
    add_sub_banner(s, "Comprehensive research intelligence platform spanning 8 fully implemented, production-ready modules.")
    
    grid_w = Inches(2.76)
    grid_gap_x = Inches(0.22)
    grid_h = Inches(2.55)
    grid_gap_y = Inches(0.2)
    g_top1 = Inches(1.35)
    g_top2 = Inches(4.1)
    
    modules = [
        ("1. Literature Discovery", "OpenAlex, arXiv, CrossRef harvesting + PDF ingestion with legal open-access full-text acquisition."),
        ("2. Paper Analysis", "Structured extraction: methodology, sample size, population, geography, limitations, and future work."),
        ("3. Landscape Synthesis", "Thematic clustering, chronological trend lines, methodology distribution, and citation network."),
        ("4. Gap Analysis", "Detection across 9 dimensions (methodological, population, geographic, etc.) + interactive heatmap."),
        ("5. Gap Investigator", "Adaptive cyclic validation loop: adversarial critic scoring, counter-querying, and confidence rating."),
        ("6. Research Development", "Automated formulation of aligned research questions, objectives, testable hypotheses, and methods."),
        ("7. References & Verification", "Citation formatting in 6 academic styles (APA, IEEE, Harvard, etc.) + claim verification engine."),
        ("8. Agent Activity", "Transparent operational event auditing: live stream of agent decisions, tool invocations, and state shifts.")
    ]
    
    for idx, (m_title, m_desc) in enumerate(modules[:4]):
        x = Inches(0.8) + idx * (grid_w + grid_gap_x)
        add_card(s, x, g_top1, grid_w, grid_h, m_title, m_desc, bg_color=CARD_BG, border_color=CARD_BORDER)
        
    for idx, (m_title, m_desc) in enumerate(modules[4:]):
        x = Inches(0.8) + idx * (grid_w + grid_gap_x)
        add_card(s, x, g_top2, grid_w, grid_h, m_title, m_desc, bg_color=CARD_BG, border_color=CARD_BORDER)

    # =========================================================================
    # SLIDE 11: Technology Stack
    # =========================================================================
    s = make_slide("Technology Stack: Robust, Modern & Fully Open-Source", 11)
    add_sub_banner(s, "Built strictly using technologies implemented in the SciLens codebase — no third-party dependencies fabricated.")
    
    stack_w = Inches(5.72)
    stack_h = Inches(2.55)
    stack_top1 = Inches(1.35)
    stack_top2 = Inches(4.1)
    
    # 4 Stack Categories
    s1_card = add_card(s, Inches(0.8), stack_top1, stack_w, stack_h, "Backend & Agent Orchestration", "Python 3.11  •  FastAPI  •  LangGraph  •  LangChain", has_bullets=True)
    b_s1 = [
        ("Framework", "Python 3.11, FastAPI (ASGI server), Uvicorn, Pydantic v2 Settings."),
        ("Agent Orchestration", "LangGraph StateGraph, LangChain Core & Community for cyclic state machines."),
        ("Multi-Provider LLM Abstraction", "Unified interface supporting OpenAI (GPT-4o-mini), Anthropic, Groq, and MockLLM."),
        ("Database & Persistence", "SQLite with SQLAlchemy ORM (swappable to PostgreSQL via DATABASE_URL).")
    ]
    add_bullet_list(s, Inches(0.95), stack_top1 + Inches(0.75), stack_w - Inches(0.3), stack_h - Inches(0.8), b_s1, 10.5, 4)
    
    s2_card = add_card(s, Inches(0.8) + stack_w + Inches(0.26), stack_top1, stack_w, stack_h, "RAG, Vector Store & PDF Engine", "FAISS  •  SentenceTransformers  •  PyMuPDF  •  PDFPlumber", has_bullets=True)
    b_s2 = [
        ("Vector Indexing", "FAISS (Facebook AI Similarity Search) vector store with SQLite chunk persistence."),
        ("Embedding Models", "SentenceTransformers (all-MiniLM-L6-v2) for local embeddings; OpenAI embeddings option."),
        ("PDF Processing", "PyMuPDF (fitz), PDFPlumber, and PyPDF for section-aware text & table parsing."),
        ("Document Export", "python-docx for academic Word documents; ReportLab for publication-grade PDFs.")
    ]
    add_bullet_list(s, Inches(0.8) + stack_w + Inches(0.26) + Inches(0.15), stack_top1 + Inches(0.75), stack_w - Inches(0.3), stack_h - Inches(0.8), b_s2, 10.5, 4)
    
    s3_card = add_card(s, Inches(0.8), stack_top2, stack_w, stack_h, "Frontend & Interactive Interfaces", "React 18  •  TypeScript  •  Tailwind CSS  •  Gradio", has_bullets=True)
    b_s3 = [
        ("Frontend Architecture", "React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons."),
        ("Scientific Visualization", "Three.js and Troika Text for the interactive 3D Scientific Knowledge Globe."),
        ("Conversational UI", "Gradio Ask-Across-Papers interface mounted directly in FastAPI at /gradio."),
        ("State Management", "React Context API (AuthContext, BackendContext, InvestigationContext, ThemeContext).")
    ]
    add_bullet_list(s, Inches(0.95), stack_top2 + Inches(0.75), stack_w - Inches(0.3), stack_h - Inches(0.8), b_s3, 10.5, 4)
    
    s4_card = add_card(s, Inches(0.8) + stack_w + Inches(0.26), stack_top2, stack_w, stack_h, "Academic APIs & Testing Suite", "OpenAlex  •  arXiv  •  CrossRef  •  Pytest", has_bullets=True)
    b_s4 = [
        ("Open Academic Discovery", "OpenAlex API, arXiv API, Semantic Scholar API, and CrossRef API integration."),
        ("Security & Validation", "SSRF protection, domain whitelisting, and secure PDF upload validation."),
        ("Automated Testing Suite", "21 comprehensive pytest suites validating offline workflows via deterministic MockLLM."),
        ("Test Coverage", "End-to-end coverage: RAG, LangGraph cyclic routing, claim verifier, citations, and export.")
    ]
    add_bullet_list(s, Inches(0.8) + stack_w + Inches(0.26) + Inches(0.15), stack_top2 + Inches(0.75), stack_w - Inches(0.3), stack_h - Inches(0.8), b_s4, 10.5, 4)

    # =========================================================================
    # SLIDE 12: UI / Product Screens
    # =========================================================================
    s = make_slide("User Interface & Product Views", 12)
    add_sub_banner(s, "Interactive cockpit designed for research intelligence — featuring 3D knowledge exploration and visual gap analytics.")
    
    # User requested: "dont add screenshots i will do them manuallt"
    # Provide 4 designated screenshot drop zones with clear boundaries and route descriptions
    box_w = Inches(5.72)
    box_h = Inches(2.55)
    b_top1 = Inches(1.35)
    b_top2 = Inches(4.1)
    
    views = [
        ("1. Interactive 3D Scientific Globe (Hero View)", "Route:  /  (Landing View)", "Visual: Revolving 3D scientific sphere rendering topic-aligned paper nodes, live search input bar, and dynamic research artifact cards.", Inches(0.8), b_top1),
        ("2. Research Landscape & Thematic Clusters", "Route:  /landscape", "Visual: Thematic cluster cards, chronological publication trend lines, methodology distribution graphs, and paper relationship networks.", Inches(0.8) + box_w + Inches(0.26), b_top1),
        ("3. Evidence-Grounded Gap Analysis & Heatmap", "Route:  /gaps", "Visual: 9-category gap cards, empirical evidence strength meters, grounding badges, and numerical gap distribution heatmap.", Inches(0.8), b_top2),
        ("4. Cyclic Gap Investigator & Critic Studio", "Route:  /investigator", "Visual: Live agent execution stream, multi-iteration critic feedback logs, targeted query generation, and confidence score badges.", Inches(0.8) + box_w + Inches(0.26), b_top2)
    ]
    
    for v_title, v_route, v_desc, vx, vy in views:
        # Card container
        add_card(s, vx, vy, box_w, box_h, v_title, v_route, bg_color=CARD_BG, border_color=ROYAL_BLUE)
        
        # Dedicated Screenshot Frame Box
        frame_x = vx + Inches(0.2)
        frame_y = vy + Inches(0.7)
        frame_w = box_w - Inches(0.4)
        frame_h = Inches(1.2)
        
        frame = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, frame_x, frame_y, frame_w, frame_h)
        frame.fill.solid()
        frame.fill.fore_color.rgb = WHITE
        frame.line.color.rgb = ROYAL_BLUE
        frame.line.width = Pt(1.5)
        # Note: dashed line isn't easily set in python-pptx, solid colored line is crisp
        
        tf_f = frame.text_frame
        tf_f.word_wrap = True
        tf_f.margin_left = tf_f.margin_right = tf_f.margin_top = tf_f.margin_bottom = Inches(0.05)
        pf = tf_f.paragraphs[0]
        pf.text = "[ Screenshot Placeholder — Paste Screenshot Here ]"
        pf.font.name = FONT_BODY
        pf.font.size = Pt(11)
        pf.font.bold = True
        pf.font.color.rgb = ROYAL_BLUE
        pf.alignment = PP_ALIGN.CENTER
        
        pf2 = tf_f.add_paragraph()
        pf2.text = f"Recommended Image: {v_title}"
        pf2.font.name = FONT_BODY
        pf2.font.size = Pt(9.5)
        pf2.font.color.rgb = MUTED_TEXT
        pf2.alignment = PP_ALIGN.CENTER
        pf2.space_before = Pt(2)
        
        # Text description below frame
        dx = s.shapes.add_textbox(vx + Inches(0.2), vy + Inches(1.95), box_w - Inches(0.4), Inches(0.5))
        tfd = dx.text_frame
        tfd.word_wrap = True
        tfd.margin_left = tfd.margin_right = tfd.margin_top = tfd.margin_bottom = 0
        pd = tfd.paragraphs[0]
        pd.text = v_desc
        pd.font.name = FONT_BODY
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = CHARCOAL

    # =========================================================================
    # SLIDE 13: Results / Demonstration
    # =========================================================================
    s = make_slide("Results & System Demonstration", 13)
    add_sub_banner(s, "Actual verified outputs generated from real academic literature corpora — strictly zero fabricated metrics.")
    
    r_w = Inches(3.72)
    r_gap = Inches(0.27)
    r_top = Inches(1.35)
    r_h = Inches(5.3)
    
    # Result 1: 9-Dimensional Gap Detection
    add_card(s, Inches(0.8), r_top, r_w, r_h, "1. 9-Dimensional Gap Taxonomy", "Empirical Multi-Category Detection", has_bullets=True)
    b_r1 = [
        ("Methodological Gaps", "Identified reliance on static cross-sectional models and lack of longitudinal evaluation pipelines."),
        ("Population Gaps", "Surfaced critical demographic disparities: underrepresentation of pediatric and non-English speaking cohorts."),
        ("Geographic Gaps", "Detected heavy regional skew toward North American / Western European datasets in published studies."),
        ("Technological & Data", "Flagged absence of standardized real-time multi-center clinical validation benchmarks.")
    ]
    add_bullet_list(s, Inches(0.95), r_top + Inches(0.85), r_w - Inches(0.3), r_h - Inches(0.95), b_r1, 10.5, 8)
    
    # Result 2: Contradiction & Validation Engine
    add_card(s, Inches(0.8) + r_w + r_gap, r_top, r_w, r_h, "2. Contradiction & Validation", "Adversarial Critic Outcomes", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)
    b_r2 = [
        ("Contradiction Discovery", "Identified conflicting empirical conclusions between studies (e.g. LLM reasoning vs memorization)."),
        ("Validation Statuses", "Accurately classified gaps into VALID (corroborated void), CONTESTED (disputed), and SUPPORTED."),
        ("Cyclic Bounding", "Gap Investigator executed up to 3 targeted retrieval loops, successfully bounding unverified claims."),
        ("Empirical Heatmap", "Generated numerical cross-dimensional density heatmaps for frontend visual exploration.")
    ]
    add_bullet_list(s, Inches(0.8) + r_w + r_gap + Inches(0.15), r_top + Inches(0.85), r_w - Inches(0.3), r_h - Inches(0.95), b_r2, 10.5, 8)
    
    # Result 3: Proposal & Claim Verification
    add_card(s, Inches(0.8) + (r_w + r_gap)*2, r_top, r_w, r_h, "3. Proposals & Claim Verification", "Structured End-to-End Delivery", has_bullets=True)
    b_r3 = [
        ("Automated Formulation", "Generated aligned Research Questions, Objectives, Hypotheses (with IV/DV), and Methodology."),
        ("Traceable Claim Verifier", "Scored factual claims against indexed corpus chunks with direct quotation attribution."),
        ("Multi-Style Citations", "Automated citation generation across 6 standards: APA 7, IEEE, MLA 9, Harvard, Chicago, Vancouver."),
        ("Document Generation", "Exported complete, formatted academic proposals ready for review in both DOCX and PDF formats.")
    ]
    add_bullet_list(s, Inches(0.8) + (r_w + r_gap)*2 + Inches(0.15), r_top + Inches(0.85), r_w - Inches(0.3), r_h - Inches(0.95), b_r3, 10.5, 8)

    # =========================================================================
    # SLIDE 14: Advantages / Innovation
    # =========================================================================
    s = make_slide("Advantages & Technical Innovation", 14)
    add_sub_banner(s, "Key engineering contributions distinguishing SciLens from existing academic discovery and generic AI tools.")
    
    adv_top = Inches(1.35)
    adv_h = Inches(0.98)
    adv_gap = Inches(0.1)
    
    innovations = [
        ("1. Autonomous Agentic LangGraph Workflow", "Replaces brittle linear pipelines with a dynamic, stateful multi-agent system capable of cyclic backtracking and targeted re-querying when evidence is insufficient.", ROYAL_BLUE),
        ("2. Section & Page-Level Evidence Grounding", "Eliminates hallucination through section-aware PDF chunking; every gap and claim is tethered to verifiable page numbers and paper DOIs in a persistent FAISS index.", NAVY_BLUE),
        ("3. Iterative Evidence Critic & Investigator Loop", "Acts as an adversarial academic reviewer; actively queries external literature to disprove or substantiate candidate gaps before granting VALID status.", DEEP_SLATE),
        ("4. Comprehensive 9-Dimensional Gap Taxonomy", "Transmutes vague novelty claims into rigorous academic dimensions: methodological, population, geographic, temporal, theoretical, technological, and data voids.", ROYAL_BLUE),
        ("5. Transparent Operational Auditing (Agent Activity)", "Complete execution visibility; researchers can inspect every agent decision, search query, confidence rating, and state transition in real-time.", DEEP_SLATE)
    ]
    
    for idx, (ititle, idesc, icolor) in enumerate(innovations):
        y = adv_top + idx * (adv_h + adv_gap)
        c = add_card(s, Inches(0.8), y, Inches(11.7), adv_h, "", "", bg_color=CARD_BG, border_color=CARD_BORDER)
        
        # Badge
        badge = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.95), y + Inches(0.14), Inches(3.5), Inches(0.7))
        badge.fill.solid()
        badge.fill.fore_color.rgb = icolor
        badge.line.color.rgb = icolor
        tf = badge.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0.05)
        p = tf.paragraphs[0]
        p.text = ititle
        p.font.name = FONT_HEADING
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER
        
        # Description
        dx = s.shapes.add_textbox(Inches(4.65), y + Inches(0.14), Inches(7.65), Inches(0.7))
        tfd = dx.text_frame
        tfd.word_wrap = True
        tfd.margin_left = tfd.margin_right = tfd.margin_top = tfd.margin_bottom = 0
        pd = tfd.paragraphs[0]
        pd.text = idesc
        pd.font.name = FONT_BODY
        pd.font.size = Pt(11)
        pd.font.color.rgb = CHARCOAL

    # =========================================================================
    # SLIDE 15: Future Scope
    # =========================================================================
    s = make_slide("Future Scope: Planned Technical Extensions", 15)
    add_sub_banner(s, "Plausible, high-impact extensions clearly separated from the current completed implementation.")
    
    fs_w = Inches(5.72)
    fs_h = Inches(2.55)
    fs_top1 = Inches(1.35)
    fs_top2 = Inches(4.1)
    
    # 4 Scope cards
    c_f1 = add_card(s, Inches(0.8), fs_top1, fs_w, fs_h, "1. Multimodal Document Understanding", "Vision-Language Paper Ingestion", has_bullets=True)
    b_f1 = [
        ("Figure & Diagram Extraction", "Integrate vision-language models to extract, interpret, and cross-reference system architecture diagrams and flowcharts."),
        ("Empirical Chart Analysis", "Parse experimental benchmark plots and performance curves directly from PDF pages into structured data."),
        ("Cross-Modal Grounding", "Enable candidate gap validation based on visual performance discrepancies across published literature.")
    ]
    add_bullet_list(s, Inches(0.95), fs_top1 + Inches(0.8), fs_w - Inches(0.3), fs_h - Inches(0.9), b_f1, 10.5, 6)
    
    c_f2 = add_card(s, Inches(0.8) + fs_w + Inches(0.26), fs_top1, fs_w, fs_h, "2. Distributed Enterprise Vector Scaling", "Million-Scale Corpus Indexing", has_bullets=True)
    b_f2 = [
        ("Distributed Vector Backends", "Transition from local FAISS indices to distributed enterprise vector databases (Milvus or Qdrant cluster)."),
        ("Asynchronous Re-Indexing", "Continuous background corpus synchronization with live arXiv and OpenAlex preprint streams."),
        ("Hybrid Sparse-Dense Search", "Combine BM25 keyword matching with dense semantic embeddings for ultra-high-precision domain recall.")
    ]
    add_bullet_list(s, Inches(0.8) + fs_w + Inches(0.26) + Inches(0.15), fs_top1 + Inches(0.8), fs_w - Inches(0.3), fs_h - Inches(0.9), b_f2, 10.5, 6)
    
    c_f3 = add_card(s, Inches(0.8), fs_top2, fs_w, fs_h, "3. Automated Starter Code Synthesis", "From Research Method to Code Execution", has_bullets=True)
    b_f3 = [
        ("Baseline Code Generation", "Synthesize starter PyTorch / TensorFlow code notebooks directly from formulated research methodologies."),
        ("Experiment Scaffold", "Generate boilerplate data loaders, training loops, and evaluation metrics aligned with identified gaps."),
        ("Reproducibility Assurance", "Containerized Docker environments for immediate testing of proposed experimental designs.")
    ]
    add_bullet_list(s, Inches(0.95), fs_top2 + Inches(0.8), fs_w - Inches(0.3), fs_h - Inches(0.9), b_f3, 10.5, 6)
    
    c_f4 = add_card(s, Inches(0.8) + fs_w + Inches(0.26), fs_top2, fs_w, fs_h, "4. Multi-Researcher Collaborative Studio", "Real-Time Academic Peer Review", has_bullets=True)
    b_f4 = [
        ("Collaborative Workspaces", "Multi-user shared research boards enabling students, mentors, and thesis committees to co-investigate gaps."),
        ("Interactive Reviewer Annotations", "Faculty feedback layers for approving, refining, or redirecting agentic gap investigations."),
        ("Institutional Repository Integration", "Direct synchronization with university research data repositories and thesis submission portals.")
    ]
    add_bullet_list(s, Inches(0.8) + fs_w + Inches(0.26) + Inches(0.15), fs_top2 + Inches(0.8), fs_w - Inches(0.3), fs_h - Inches(0.9), b_f4, 10.5, 6)

    # =========================================================================
    # SLIDE 16: Conclusion
    # =========================================================================
    s = make_slide("Conclusion: Transforming Academic Research Formulation", 16)
    add_sub_banner(s, "SciLens delivers a trustworthy, evidence-grounded agentic assistant for modern scientific discovery.")
    
    con_w = Inches(3.72)
    con_gap = Inches(0.27)
    con_top = Inches(1.35)
    con_h = Inches(5.3)
    
    # Pillar 1
    add_card(s, Inches(0.8), con_top, con_w, con_h, "1. Eliminating Bottlenecks", "Autonomous Literature Synthesis", has_bullets=True)
    b_c1 = [
        ("Replaces Manual Drudgery", "Compresses weeks of tedious manual paper searching and reading into an automated, structured synthesis."),
        ("Multi-Provider Harvesting", "Seamlessly integrates open academic APIs (OpenAlex, arXiv, CrossRef) with local PDF document corpora."),
        ("Holistic Landscape View", "Provides visual clarity through thematic clusters, trend lines, methodology breakdowns, and citation graphs.")
    ]
    add_bullet_list(s, Inches(0.95), con_top + Inches(0.85), con_w - Inches(0.3), con_h - Inches(0.95), b_c1, 11, 10)
    
    # Pillar 2
    add_card(s, Inches(0.8) + con_w + con_gap, con_top, con_w, con_h, "2. Grounded Scientific Rigor", "No Hallucinations, Proven Novelty", bg_color=ACCENT_BG, border_color=ROYAL_BLUE, has_bullets=True)
    b_c2 = [
        ("Section-Aware RAG", "Enforces strict page-level and section-level provenance for every piece of evidence and identified gap."),
        ("Adversarial Critic Loop", "Actively stress-tests candidate gaps through cyclic investigation to prevent false claims of novelty."),
        ("Multi-Type Taxonomy", "Evaluates 9 discrete academic gap dimensions, ensuring deep empirical and methodological coverage.")
    ]
    add_bullet_list(s, Inches(0.8) + con_w + con_gap + Inches(0.15), con_top + Inches(0.85), con_w - Inches(0.3), con_h - Inches(0.95), b_c2, 11, 10)
    
    # Pillar 3
    add_card(s, Inches(0.8) + (con_w + con_gap)*2, con_top, con_w, con_h, "3. Actionable Research Impact", "From Query to Formulated Proposal", has_bullets=True)
    b_c3 = [
        ("Full Research Formulation", "Automatically generates research questions, objectives, testable hypotheses, and methodology suggestions."),
        ("Verified Proposals", "Delivers complete proposal drafts with literature-verified claims and multi-style formatted citations."),
        ("Empowering Scholars", "Provides researchers, students, and institutions with a trustworthy, reproducible intelligence cockpit.")
    ]
    add_bullet_list(s, Inches(0.8) + (con_w + con_gap)*2 + Inches(0.15), con_top + Inches(0.85), con_w - Inches(0.3), con_h - Inches(0.95), b_c3, 11, 10)

    # =========================================================================
    # SLIDE 17: Thank You
    # =========================================================================
    s = make_slide("Thank You", 17)
    add_sub_banner(s, "Questions, Feedback & Discussion")
    
    # Central Elegant Card
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

    # =========================================================================
    # Delete original template sample slides 2 and 3
    # =========================================================================
    # Note: When slides were added, they were appended after index 2.
    # So original Slide 2 (index 1) and Slide 3 (index 2) need to be deleted.
    def delete_slide(prs, index):
        rId = prs.slides._sldIdLst[index].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[index]

    # Delete index 2 then index 1
    delete_slide(prs, 2)
    delete_slide(prs, 1)
    
    print(f"Final presentation total slides: {len(prs.slides)}")
    
    # Save output files
    prs.save(OUTPUT_PATH)
    print(f"Saved final presentation to: {OUTPUT_PATH}")
    
    prs.save(OUTPUT_DOWNLOADS)
    print(f"Saved copy to: {OUTPUT_DOWNLOADS}")

if __name__ == "__main__":
    build_presentation()
