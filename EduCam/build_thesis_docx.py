# -*- coding: utf-8 -*-
"""
Script tạo luận văn tổng quan dự án Webshare-PMCA theo chuẩn văn bản Luận văn Việt Nam.
Bao gồm:
- Khổ giấy A4, lề chuẩn (Trái 30mm, Phải 20mm, Trên 20mm, Dưới 20mm).
- Font Times New Roman, cỡ 13pt, dãn dòng 1.4 lines, thụt đầu dòng 1.25cm, căn đều hai bên.
- Trang bìa chuẩn có khung viền đôi, trang bìa phụ, lời cam đoan, mục lục, danh mục từ viết tắt.
- Các chương phân cấp khoa học: Chương 1 đến Chương 6.
- Bảng biểu và sơ đồ hình vẽ độ phân giải cao (300 DPI) vẽ bằng Matplotlib.
- Định dạng caption chuẩn (Tên bảng ở trên, tên hình ở dưới).
"""

import os
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import docx
from docx.shared import Inches, Pt, RGBColor, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Thư mục làm việc
WORKDIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# 1. HÀM TẠO SƠ ĐỒ HÌNH VẼ (MATPLOTLIB)
# ---------------------------------------------------------------------------

def generate_diagrams():
    print("Đang tạo các sơ đồ độ nét cao (300 DPI)...")
    
    # ---------------------------------------------------------
    # Hình 2.1: Sơ đồ kiến trúc công nghệ đa tầng
    # ---------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    # Background
    ax.add_patch(patches.Rectangle((0, 0), 100, 100, facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1.5, zorder=0))
    
    # Tầng 1: Client Layer (Trình duyệt)
    ax.add_patch(patches.FancyBboxPatch((5, 68), 90, 26, boxstyle="round,pad=1.2,rounding_size=2",
                                        facecolor='#eff6ff', edgecolor='#3b82f6', lw=2))
    ax.text(8, 90, 'TẦNG GIAO DIỆN & TRÌNH DUYỆT (CLIENT BROWSER LAYER)', fontsize=11, fontweight='bold', color='#1e3a8a')
    
    # Box con trong Client
    sub_clients = [
        (8, 71, 26, 15, 'React 19 & TypeScript\n• Quản lý State & Router\n• Responsive Design', '#dbeafe', '#2563eb'),
        (37, 71, 26, 15, 'Core UI & Animation\n• Tailwind CSS v4\n• Lucide Icons & Motion', '#dbeafe', '#2563eb'),
        (66, 71, 26, 15, 'Bảo vệ & Tiện ích\n• XOR Link Encoder (/go)\n• QRCode Vector Generator', '#dbeafe', '#2563eb'),
    ]
    for x, y, w, h, text, fc, ec in sub_clients:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8,rounding_size=1.5",
                                            facecolor=fc, edgecolor=ec, lw=1.2))
        ax.text(x + w/2, y + h/2, text, fontsize=8.5, ha='center', va='center', color='#0f172a', fontweight='semibold')

    # Mũi tên 1 <-> 2
    ax.annotate('', xy=(30, 62), xytext=(30, 68),
                arrowprops=dict(arrowstyle="<->", color='#475569', lw=2))
    ax.text(32, 64.5, 'HTTP / JSON APIs', fontsize=8, color='#475569', fontweight='bold')
    
    ax.annotate('', xy=(70, 62), xytext=(70, 68),
                arrowprops=dict(arrowstyle="<->", color='#475569', lw=2))
    ax.text(72, 64.5, 'Apps Script Web App', fontsize=8, color='#475569', fontweight='bold')

    # Tầng 2: Serverless & Hosting
    ax.add_patch(patches.FancyBboxPatch((5, 36), 42, 26, boxstyle="round,pad=1.2,rounding_size=2",
                                        facecolor='#faf5ff', edgecolor='#8b5cf6', lw=2))
    ax.text(8, 58, 'TẦNG SERVERLESS & HOSTING', fontsize=10.5, fontweight='bold', color='#581c87')
    ax.text(26, 46, 'Vercel Serverless Function\n• Endpoint: /api/go/[code].ts\n• Giải mã Base64URL + XOR\n• Render Brand Frame (Iframe)',
            fontsize=8.5, ha='center', va='center', color='#0f172a', fontweight='semibold',
            bbox=dict(boxstyle='round,pad=0.6', facecolor='#f3e8ff', edgecolor='#a855f7', lw=1))

    # Tầng 3: Database & Cloud Storage
    ax.add_patch(patches.FancyBboxPatch((53, 36), 42, 26, boxstyle="round,pad=1.2,rounding_size=2",
                                        facecolor='#ecfdf5', edgecolor='#10b981', lw=2))
    ax.text(56, 58, 'TẦNG CƠ SỞ DỮ LIỆU ĐÁM MÂY', fontsize=10.5, fontweight='bold', color='#064e3b')
    ax.text(74, 46, 'Google Cloud Sheets Headless DB\n• Bảng Submissions (Chờ duyệt)\n• Bảng WebProjects (Đã duyệt)\n• Đồng bộ View/Like thời gian thực',
            fontsize=8.5, ha='center', va='center', color='#0f172a', fontweight='semibold',
            bbox=dict(boxstyle='round,pad=0.6', facecolor='#d1fae5', edgecolor='#34d399', lw=1))

    # Tầng 4: Hạ tầng bảo mật & Quản trị
    ax.add_patch(patches.FancyBboxPatch((5, 5), 90, 25, boxstyle="round,pad=1.2,rounding_size=2",
                                        facecolor='#fffbeb', edgecolor='#f59e0b', lw=2))
    ax.text(8, 26, 'HẠ TẦNG BẢO MẬT & QUẢN TRỊ VIÊN (SECURITY & REPOSITORY)', fontsize=10.5, fontweight='bold', color='#78350f')
    
    sub_secs = [
        (8, 8, 26, 15, 'Private GitHub Repo\n• Giấu mã nguồn dự án\n• CI/CD Vercel an toàn', '#fef3c7', '#d97706'),
        (37, 8, 26, 15, 'Cổng Admin (@1122@)\n• Kiểm duyệt bài nộp\n• Điều phối & Sao lưu JSON', '#fef3c7', '#d97706'),
        (66, 8, 26, 15, 'Offline Storage\n• LocalStorage dự phòng\n• Cache bài nộp & cài đặt', '#fef3c7', '#d97706'),
    ]
    for x, y, w, h, text, fc, ec in sub_secs:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8,rounding_size=1.5",
                                            facecolor=fc, edgecolor=ec, lw=1.2))
        ax.text(x + w/2, y + h/2, text, fontsize=8.5, ha='center', va='center', color='#0f172a', fontweight='semibold')
        
    plt.tight_layout()
    fig1_path = os.path.join(WORKDIR, "hinh_2_1_kien_truc_he_thong.png")
    plt.savefig(fig1_path, bbox_inches='tight')
    plt.close()

    # ---------------------------------------------------------
    # Hình 3.1: Sơ đồ luồng hoạt động tổng thể
    # ---------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    ax.add_patch(patches.Rectangle((0, 0), 100, 100, facecolor='#ffffff', edgecolor='#e2e8f0', lw=1.5))
    
    # 5 Nodes chính
    nodes = [
        (10, 80, 80, 13, '1. TÁC GIẢ NỘP BÀI (SubmitModal)\nĐiền link web, môn học, cấp học, tác giả → Hệ thống tự sinh goLink & mã hóa XOR', '#e0e7ff', '#4f46e5', '#312e81'),
        (10, 61, 80, 13, '2. HÀNG ĐỢI XÉT DUYỆT (Google Sheets Submissions)\nĐẩy bản ghi an toàn lên Google Sheets qua Apps Script (Trạng thái Pending)', '#ede9fe', '#7c3aed', '#4c1d95'),
        (10, 42, 80, 13, '3. ADMIN KIỂM DUYỆT (Admin Portal @1122@)\nQuản trị viên đăng nhập, thẩm định nội dung, bấm "Duyệt" (Trạng thái Approved)', '#fef3c7', '#d97706', '#78350f'),
        (10, 23, 80, 13, '4. XUẤT BẢN CỘNG ĐỒNG (WebHub Showcase Main Feed)\nĐồng bộ đa thiết bị, hiển thị Mockup, lọc môn học, sinh mã QR tức thì', '#ecfdf5', '#059669', '#064e3b'),
        (10, 4, 80, 13, '5. HỌC SINH TRẢI NGHIỆM (/go/<code> Brand Frame)\nQuét QR hoặc bấm xem: Vercel giải mã Serverless, chạy iframe an toàn, giấu URL gốc', '#f1f5f9', '#475569', '#0f172a'),
    ]
    
    for x, y, w, h, text, fc, ec, tc in nodes:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=1.2,rounding_size=2.2",
                                            facecolor=fc, edgecolor=ec, lw=2))
        ax.text(x + w/2, y + h/2, text, fontsize=9.5, ha='center', va='center', color=tc, fontweight='bold')
        
    # Mũi tên kết nối
    for y_arrow in [78, 59, 40, 21]:
        ax.annotate('', xy=(50, y_arrow - 4), xytext=(50, y_arrow + 2),
                    arrowprops=dict(arrowstyle="-|>", color='#4f46e5', lw=2.5, mutation_scale=15))

    plt.tight_layout()
    fig2_path = os.path.join(WORKDIR, "hinh_3_1_luong_hoat_dong.png")
    plt.savefig(fig2_path, bbox_inches='tight')
    plt.close()

    # ---------------------------------------------------------
    # Hình 4.1: Cơ chế mã hóa và giải mã bảo vệ URL gốc (/go/<code>)
    # ---------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    ax.add_patch(patches.Rectangle((0, 0), 100, 100, facecolor='#f8fafc', edgecolor='#cbd5e1', lw=1.5))
    
    # Bước mã hóa (Client)
    ax.add_patch(patches.FancyBboxPatch((4, 52), 42, 40, boxstyle="round,pad=1,rounding_size=2",
                                        facecolor='#eff6ff', edgecolor='#2563eb', lw=1.8))
    ax.text(25, 87, 'QUY TRÌNH MÃ HÓA (CLIENT-SIDE)', fontsize=10, fontweight='bold', color='#1e40af', ha='center')
    ax.text(25, 68, '1. Payload: {url, title, author, email}\n2. Thuật toán: Bitwise XOR với Key:\n   "webhub-go-v2#sbx7q"\n3. Chuyển đổi: Byte Array → Base64URL\n4. Link sinh ra: /go/<code_hash>',
            fontsize=8.5, ha='center', va='center', color='#0f172a', fontweight='semibold')
    
    # Mũi tên sang Serverless
    ax.annotate('', xy=(55, 72), xytext=(48, 72),
                arrowprops=dict(arrowstyle="-|>", color='#2563eb', lw=2.5, mutation_scale=15))
    ax.text(51.5, 75, 'Truy cập Link', fontsize=8, color='#1e40af', fontweight='bold', ha='center')

    # Bước giải mã (Serverless)
    ax.add_patch(patches.FancyBboxPatch((54, 52), 42, 40, boxstyle="round,pad=1,rounding_size=2",
                                        facecolor='#faf5ff', edgecolor='#9333ea', lw=1.8))
    ax.text(75, 87, 'QUY TRÌNH GIẢI MÃ (SERVERLESS)', fontsize=10, fontweight='bold', color='#6b21a8', ha='center')
    ax.text(75, 68, '1. Vercel Route: /api/go/[code].ts\n2. Base64URL → Byte Array\n3. Giải mã ngược XOR cùng Key bí mật\n4. Lấy lại {u, t, a, e} dạng JSON an toàn',
            fontsize=8.5, ha='center', va='center', color='#0f172a', fontweight='semibold')

    # Kết quả bảo mật (Bottom Bar)
    ax.add_patch(patches.FancyBboxPatch((4, 8), 92, 36, boxstyle="round,pad=1,rounding_size=2",
                                        facecolor='#ecfdf5', edgecolor='#059669', lw=2))
    ax.text(50, 38, 'KẾT QUẢ BẢO VỆ TUYỆT ĐỐI BẢN QUYỀN VÀ TRÁNH LỘ URL GỐC', fontsize=11, fontweight='bold', color='#065f46', ha='center')
    ax.text(50, 21, '• Trả về trang Brand Frame (Khung trình duyệt có logo, tên tác giả, nút Fullscreen và email liên hệ).\n• Nhúng mô phỏng qua Iframe Sandbox bảo mật — Thanh địa chỉ KHÔNG chuyển hướng 302 sang URL gốc.\n• Người học, học sinh chỉ nhìn thấy URL của hệ thống: https://webshare-pmca.vercel.app/go/...',
            fontsize=9, ha='center', va='center', color='#0f172a', fontweight='medium')

    plt.tight_layout()
    fig3_path = os.path.join(WORKDIR, "hinh_4_1_co_che_ma_hoa.png")
    plt.savefig(fig3_path, bbox_inches='tight')
    plt.close()
    
    print("Đã tạo xong 3 sơ đồ hình vẽ thành công.")
    return fig1_path, fig2_path, fig3_path

# ---------------------------------------------------------------------------
# 2. HÀM ĐỊNH DẠNG VĂN BẢN CHUẨN LUẬN VĂN VIỆT NAM
# ---------------------------------------------------------------------------

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Đặt lề trong ô bảng (dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    """Đặt viền thanh mảnh chuẩn bảng biểu khoa học."""
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for b in ['top', 'left', 'bottom', 'right', 'insideH']:
        border = OxmlElement(f'w:{b}')
        border.set(qn('w:val'), val)
        border.set(qn('w:sz'), sz)
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tblBorders.append(border)
    border = OxmlElement('w:insideV')
    border.set(qn('w:val'), 'none')
    tblBorders.append(border)
    tblPr.append(tblBorders)

def add_title_page(doc):
    """Trang bìa chính chuẩn Luận văn Việt Nam với khung viền đôi."""
    section = doc.sections[0]
    section.top_margin = Mm(20)
    section.bottom_margin = Mm(20)
    section.left_margin = Mm(30)
    section.right_margin = Mm(20)
    
    # Thêm viền trang cho bìa (thông qua border XML)
    sectPr = section._sectPr
    pgBorders = parse_xml(r'''
        <w:pgBorders %s>
            <w:top w:val="double" w:sz="12" w:space="24" w:color="1E3A8A"/>
            <w:left w:val="double" w:sz="18" w:space="24" w:color="1E3A8A"/>
            <w:bottom w:val="double" w:sz="12" w:space="24" w:color="1E3A8A"/>
            <w:right w:val="double" w:sz="12" w:space="24" w:color="1E3A8A"/>
        </w:pgBorders>
    ''' % nsdecls('w'))
    sectPr.append(pgBorders)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run("DỰ ÁN PHÁT TRIỂN NỀN TẢNG GIÁO DỤC SỐ")
    run.font.name = "Times New Roman"
    run.font.size = Pt(13)
    run.font.bold = True
    run.font.color.rgb = RGBColor(30, 58, 138)

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(40)
    run2 = p2.add_run("PMCA SHOW & SHARE 2026")
    run2.font.name = "Times New Roman"
    run2.font.size = Pt(12)
    run2.font.bold = True
    run2.font.color.rgb = RGBColor(71, 85, 105)

    # Biểu tượng / đường kẻ
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(45)
    run_line = p_line.add_run("-------------------- *** --------------------")
    run_line.font.name = "Times New Roman"
    run_line.font.size = Pt(11)
    run_line.font.color.rgb = RGBColor(148, 163, 184)

    # Loại hình văn bản
    p_doc_type = doc.add_paragraph()
    p_doc_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_doc_type.paragraph_format.space_after = Pt(15)
    r_type = p_doc_type.add_run("BÁO CÁO KHOA HỌC / THUYẾT MINH DỰ ÁN")
    r_type.font.name = "Times New Roman"
    r_type.font.size = Pt(15)
    r_type.font.bold = True
    r_type.font.color.rgb = RGBColor(15, 23, 42)

    # Tên đề tài
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.line_spacing = 1.3
    p_title.paragraph_format.space_after = Pt(65)
    r_title = p_title.add_run("NGHIÊN CỨU XÂY DỰNG NỀN TẢNG CHIA SẺ MÔ PHỎNG GIÁO DỤC, THÍ NGHIỆM ẢO VÀ BẢO VỆ BẢN QUYỀN NỘI DUNG SỐ TRÊN HỆ THỐNG WEBSHARE-PMCA")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 58, 138)

    # Thông tin tác giả
    p_author = doc.add_paragraph()
    p_author.paragraph_format.left_indent = Inches(1.5)
    p_author.paragraph_format.line_spacing = 1.35
    p_author.paragraph_format.space_after = Pt(85)
    
    fields = [
        ("Tác giả phát triển:", "LÊ THANH LIÊM"),
        ("Lĩnh vực nghiên cứu:", "Giáo dục STEM · Công nghệ Trí tuệ nhân tạo (AI)"),
        ("Đơn vị công tác:", "Cần Thơ, Việt Nam"),
        ("Tài liệu tích hợp:", "SimBot Universal Prompt Guide v26"),
        ("Địa chỉ truy cập:", "https://webshare-pmca.vercel.app")
    ]
    for lbl, val in fields:
        r1 = p_author.add_run(f"{lbl} ")
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(13)
        r1.font.bold = True
        
        r2 = p_author.add_run(f"{val}\n")
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(13)

    # Địa điểm & năm
    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_before = Pt(30)
    r_loc = p_loc.add_run("CẦN THƠ, NĂM 2026")
    r_loc.font.name = "Times New Roman"
    r_loc.font.size = Pt(13)
    r_loc.font.bold = True

    # Sang trang
    doc.add_page_break()

# ---------------------------------------------------------------------------
# 3. NỘI DUNG CHÍNH CỦA BÁO CÁO LUẬN VĂN
# ---------------------------------------------------------------------------

def build_full_thesis():
    fig1, fig2, fig3 = generate_diagrams()
    
    doc = docx.Document()
    
    # Áp dụng trang bìa
    add_title_page(doc)
    
    # Cấu hình lại Section 2 (phần nội dung: bỏ viền trang bìa)
    sec2 = doc.add_section()
    sec2.top_margin = Mm(20)
    sec2.bottom_margin = Mm(20)
    sec2.left_margin = Mm(30)
    sec2.right_margin = Mm(20)
    
    # Helper styles
    def p_body(text, bold_prefix="", indent=True):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.35
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        if indent:
            p.paragraph_format.first_line_indent = Mm(12.5)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix + " ")
            r_pre.font.name = "Times New Roman"
            r_pre.font.size = Pt(13)
            r_pre.font.bold = True
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(13)
        return p

    def p_chapter(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(title.upper())
        run.font.name = "Times New Roman"
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def p_h1(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title)
        run.font.name = "Times New Roman"
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def p_h2(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(title)
        run.font.name = "Times New Roman"
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.italic = True
        return p

    def add_fig_image(img_path, caption_text, width_inch=6.2):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(3)
        p_img.add_run().add_picture(img_path, width=Inches(width_inch))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run(caption_text)
        r_cap.font.name = "Times New Roman"
        r_cap.font.size = Pt(11.5)
        r_cap.font.bold = True
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(51, 65, 85)

    def add_table_custom(headers, rows, caption=""):
        if caption:
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p_cap.paragraph_format.space_before = Pt(8)
            p_cap.paragraph_format.space_after = Pt(3)
            r = p_cap.add_run(caption)
            r.font.name = "Times New Roman"
            r.font.size = Pt(12)
            r.font.bold = True
            r.font.color.rgb = RGBColor(30, 58, 138)
            
        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table)

        # Header Row
        hdr_cells = table.rows[0].cells
        for idx, title in enumerate(headers):
            hdr_cells[idx].text = title
            hdr_cells[idx].paragraphs[0].runs[0].font.bold = True
            hdr_cells[idx].paragraphs[0].runs[0].font.size = Pt(11.5)
            hdr_cells[idx].paragraphs[0].runs[0].font.name = "Times New Roman"
            hdr_cells[idx].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            set_cell_margins(hdr_cells[idx], top=120, bottom=120, left=140, right=140)
            shading = parse_xml(r'<w:shd %s w:fill="E2E8F0"/>' % nsdecls('w'))
            hdr_cells[idx]._tc.get_or_add_tcPr().append(shading)

        # Data Rows
        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            for c_idx, val in enumerate(row_data):
                row_cells[c_idx].text = str(val)
                row_cells[c_idx].paragraphs[0].runs[0].font.size = Pt(11)
                row_cells[c_idx].paragraphs[0].runs[0].font.name = "Times New Roman"
                if c_idx == 0:
                    row_cells[c_idx].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    row_cells[c_idx].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
                set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=140, right=140)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(8)

    # ---------------------------------------------------------
    # LỜI CAM ĐOAN
    # ---------------------------------------------------------
    p_camdoan = doc.add_paragraph()
    p_camdoan.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cd = p_camdoan.add_run("LỜI CAM ĐOAN")
    r_cd.font.name = "Times New Roman"
    r_cd.font.size = Pt(14)
    r_cd.font.bold = True
    
    p_body("Tôi xin cam đoan toàn bộ công trình nghiên cứu và phát triển nền tảng Webshare-PMCA (WebHub Showcase) được trình bày trong tài liệu này là kết quả nghiên cứu độc lập của tôi, được thực hiện dưới sự tuân thủ nghiêm ngặt các quy định về liêm chính học thuật và bản quyền công nghệ.")
    p_body("Các dữ liệu khoa học, mô hình phân tích, giải thuật mã hóa link che (/go/<code>), kiến trúc Serverless Function và các mã nguồn tích hợp trong dự án đều có nguồn gốc rõ ràng, trung thực và chưa từng được công bố trái phép ở bất kỳ ấn phẩm nào khác. Tôi hoàn toàn chịu trách nhiệm trước pháp luật về tính chính xác và tính pháp lý của toàn bộ nội dung trong công trình này.")
    
    p_sign = doc.add_paragraph()
    p_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sign.paragraph_format.space_before = Pt(15)
    r_s1 = p_sign.add_run("Cần Thơ, ngày 15 tháng 10 năm 2026\n")
    r_s1.font.italic = True
    r_s1.font.name = "Times New Roman"
    r_s1.font.size = Pt(12)
    r_s2 = p_sign.add_run("Tác giả nghiên cứu\n\n\n")
    r_s2.font.bold = True
    r_s2.font.name = "Times New Roman"
    r_s2.font.size = Pt(13)
    r_s3 = p_sign.add_run("LÊ THANH LIÊM")
    r_s3.font.bold = True
    r_s3.font.name = "Times New Roman"
    r_s3.font.size = Pt(13)
    
    doc.add_page_break()

    # ---------------------------------------------------------
    # DANH MỤC TỪ VIẾT TẮT
    # ---------------------------------------------------------
    p_abbr = doc.add_paragraph()
    p_abbr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ab = p_abbr.add_run("DANH MỤC CÁC KÝ HIỆU VÀ CHỮ VIẾT TẮT")
    r_ab.font.name = "Times New Roman"
    r_ab.font.size = Pt(14)
    r_ab.font.bold = True
    
    abbr_data = [
        ("1", "AI", "Artificial Intelligence (Trí tuệ nhân tạo)"),
        ("2", "STEM", "Science, Technology, Engineering, Mathematics (Giáo dục tích hợp Khoa học - Công nghệ - Kỹ thuật - Toán học)"),
        ("3", "UI / UX", "User Interface / User Experience (Giao diện người dùng / Trải nghiệm người dùng)"),
        ("4", "DOM", "Document Object Model (Mô hình đối tượng tài liệu HTML)"),
        ("5", "API", "Application Programming Interface (Giao diện lập trình ứng dụng)"),
        ("6", "QR Code", "Quick Response Code (Mã phản hồi nhanh / Mã vạch ma trận 2D)"),
        ("7", "ROM", "Requirements & Operations Manual (Đặc tả thiết kế sản phẩm mô phỏng)"),
        ("8", "XOR", "Exclusive OR (Phép toán logic nhị phân tuyển loại phục vụ mã hóa đối xứng)"),
        ("9", "CI / CD", "Continuous Integration / Continuous Deployment (Tích hợp và Triển khai liên tục)"),
        ("10", "SSL / TLS", "Secure Sockets Layer / Transport Layer Security (Giao thức bảo mật truyền thông mạng)")
    ]
    add_table_custom(["STT", "Chữ viết tắt", "Ý nghĩa / Tên đầy đủ"], abbr_data)
    
    doc.add_page_break()

    # ---------------------------------------------------------
    # CHƯƠNG 1
    # ---------------------------------------------------------
    p_chapter("CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ BỐI CẢNH THỰC TIỄN")
    
    p_h1("1.1. Đặt vấn đề và tính cấp thiết của đề tài")
    p_body("Sự chuyển đổi mạnh mẽ của giáo dục trong kỷ nguyên số đòi hỏi các phương pháp dạy học trực quan, tương tác cao nhằm phát triển năng lực tư duy khoa học và giải quyết vấn đề cho học sinh. Sự xuất hiện của các công cụ Trí tuệ nhân tạo tạo sinh (Generative AI) tiên tiến như Google AI Studio, Gemini và ChatGPT đã mở ra cơ hội chưa từng có: giáo viên và học sinh phổ thông có thể nhanh chóng xây dựng các ứng dụng mô phỏng toán học, thí nghiệm vật lý, mô hình hóa phân tử hóa học hay đồ thị sinh học mà không đòi hỏi kỹ năng lập trình chuyên sâu.")
    p_body("Tuy nhiên, việc đưa các sản phẩm mô phỏng này vào ứng dụng thực tiễn trong lớp học hiện nay đang đối mặt với những rào cản mang tính hệ thống. Các sản phẩm sau khi tạo ra thường nằm rải rác trên các đường link cá nhân, không có cơ chế lưu trữ tập trung, thiếu sự thẩm định sư phạm và đặc biệt là tiềm ẩn nguy cơ lộ mã nguồn, lộ liên kết máy chủ cá nhân khi chia sẻ công khai.")
    
    p_h1("1.2. Mục tiêu nghiên cứu và phạm vi ứng dụng")
    p_body("Đề tài tập trung nghiên cứu và xây dựng nền tảng Webshare-PMCA (WebHub Showcase) với các mục tiêu trọng tâm sau:")
    p_body("Thứ nhất, thiết lập một cổng thông tin tập trung, hiện đại và chuẩn mực để giáo viên, học sinh và các nhà giáo dục có thể đăng tải, chia sẻ và lan tỏa các ứng dụng mô phỏng giáo dục chất lượng cao.", "•")
    p_body("Thứ hai, phát triển giải pháp bảo vệ quyền tác giả và bảo mật liên kết thông qua cơ chế link che an toàn (/go/<code>), ngăn chặn hoàn toàn việc lộ URL gốc và mã nguồn của tác giả trên thanh địa chỉ trình duyệt.", "•")
    p_body("Thứ ba, tích hợp công nghệ mã QR tức thì (Instant QR Code) nhằm tối ưu hóa việc phân phối bài học trong môi trường lớp học thực tế, cho phép học sinh tương tác trực tiếp qua thiết bị thông minh cá nhân.", "•")
    p_body("Thứ tư, xây dựng kiến trúc Serverless kết hợp cơ sở dữ liệu Google Cloud Sheets, mang lại khả năng vận hành ổn định, đồng bộ dữ liệu hai chiều theo thời gian thực với chi phí hạ tầng máy chủ bằng không (Zero Cost).", "•")
    
    p_h1("1.3. Khảo sát thực trạng và các thách thức thực tế")
    p_body("Qua khảo sát thực tế tại các trường phổ thông và diễn đàn giáo viên STEM, công trình đã xác định 5 thách thức cốt lõi cần phải giải quyết:")
    
    challenges_data = [
        ("1", "Thiếu kho lưu trữ chuẩn hóa", "Các bài tập mô phỏng bị phân tán trên nhiều nền tảng lưu trữ cá nhân, không có công cụ tìm kiếm và phân loại theo môn học, cấp học."),
        ("2", "Nỗi sợ lộ URL & mã nguồn", "Giáo viên e ngại việc chia sẻ link trực tiếp từ Vercel hay GitHub Pages sẽ bị sao chép ý tưởng, can thiệp mã nguồn hoặc lộ tài khoản cá nhân."),
        ("3", "Rào cản thiết bị lớp học", "Học sinh thao tác trên điện thoại hoặc máy tính bảng gặp khó khăn khi phải gõ các đường link URL phức tạp trong thời gian giới hạn của tiết học."),
        ("4", "Gánh nặng chi phí hạ tầng", "Các hệ thống quản lý web truyền thống sử dụng cơ sở dữ liệu SQL đắt đỏ và yêu cầu quy trình bảo trì phức tạp, không phù hợp với dự án giáo dục cộng đồng."),
        ("5", "Rào cản ngôn ngữ khu vực", "Thiếu sự kết nối và chia sẻ tài nguyên giáo dục với các quốc gia láng giềng trong khu vực Đông Nam Á (ASEAN).")
    ]
    add_table_custom(["STT", "Thách thức thực tiễn", "Biểu hiện cụ thể"], challenges_data, "Bảng 1.1: Tổng hợp các thách thức thực tiễn trong chia sẻ mô phỏng giáo dục")
    
    # ---------------------------------------------------------
    # CHƯƠNG 2
    # ---------------------------------------------------------
    p_chapter("CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ ÁP DỤNG")
    
    p_h1("2.1. Tổng quan kiến trúc hệ thống đa tầng")
    p_body("Hệ thống Webshare-PMCA được thiết kế theo mô hình kiến trúc phân tầng hiện đại (Multi-tier Architecture), tối ưu hóa việc xử lý phía máy khách (Client-side) kết hợp với các dịch vụ điện toán không máy chủ (Serverless Computing) nhằm đảm bảo hiệu năng cao, khả năng chịu lỗi và tính an toàn thông tin.")
    
    add_fig_image(fig1, "Hình 2.1: Sơ đồ kiến trúc công nghệ đa tầng của nền tảng Webshare-PMCA")
    
    p_h1("2.2. Ngăn xếp công nghệ phía máy khách (Frontend Stack)")
    p_body("Giao diện người dùng được xây dựng dựa trên React 19 và TypeScript, kết hợp cùng trình biên dịch Vite 6 mang lại tốc độ phản hồi tức thì và khả năng kiểm soát kiểu dữ liệu nghiêm ngặt ngay trong quá trình phát triển:")
    p_body("Tailwind CSS v4: Được áp dụng để xây dựng hệ thống thiết kế (Design System) hiện đại, hỗ trợ Responsive Layout toàn diện trên cả máy tính để bàn (Desktop), máy tính bảng (Tablet) và điện thoại thông minh (Mobile).", "•")
    p_body("Lucide React & Motion: Cung cấp hệ thống biểu tượng đồ họa vector sắc nét và các hiệu ứng chuyển cảnh mượt mà, giúp nâng cao tính tương tác trực quan cho người học.", "•")
    p_body("QRCode Generator: Thư viện sinh mã vạch ma trận 2D chuẩn công nghiệp, cho phép kết xuất trực tiếp các mã QR có độ phân giải cao tại trình duyệt mà không cần phụ thuộc vào dịch vụ bên thứ ba.", "•")
    
    p_h1("2.3. Giải pháp Backend Serverless trên nền tảng Vercel")
    p_body("Thay vì duy trì một máy chủ Node.js truyền thống hoạt động 24/7, hệ thống ứng dụng mô hình Vercel Serverless Function thông qua tệp xử lý api/go/[code].ts. Mỗi khi có yêu cầu truy cập vào đường dẫn /go/:code, môi trường Serverless sẽ tự động khởi tạo hàm thực thi trong vài mili-giây, tiến hành giải mã dữ liệu và kết xuất mã HTML của trang khung Brand Frame.")
    p_body("Mô hình này mang lại ưu điểm vượt trội về khả năng mở rộng tự động (Auto-scaling), tự động cân bằng tải khi số lượng học sinh truy cập tăng đột biến trong các giờ học cao điểm, đồng thời loại bỏ hoàn toàn chi phí vận hành máy chủ tĩnh.")
    
    p_h1("2.4. Mô hình cơ sở dữ liệu phân tán (Distributed Storage Model)")
    p_body("Để đạt được sự cân bằng tối ưu giữa tốc độ truy xuất cục bộ và khả năng đồng bộ đám mây đa thiết bị, hệ thống sử dụng mô hình lưu trữ kép:")
    p_body("LocalStorage (Client Cache): Lưu trữ tạm thời danh sách mô phỏng, trạng thái bộ lọc, lịch sử tương tác và tùy chọn ngôn ngữ của người dùng. Nhờ đó, trang web có khả năng tải dữ liệu tức thì và hoạt động ngay cả khi mất kết nối Internet tạm thời.", "•")
    p_body("Google Cloud Sheets Headless Database: Đóng vai trò là trung tâm dữ liệu đám mây hai chiều. Thông qua Google Apps Script Web App (API chuẩn /exec), hệ thống tự động ghi nhận các bài nộp mới vào bảng 'Submissions' và cập nhật số liệu bài đã duyệt từ bảng 'WebProjects'.", "•")
    
    p_h1("2.5. Đặc tả mô hình dữ liệu cốt lõi (WebProject Data Model)")
    p_body("Mỗi đối tượng mô phỏng học tập được quản lý chặt chẽ theo cấu trúc dữ liệu chuẩn hóa:")
    
    fields_model = [
        ("id", "string", "Khóa chính duy nhất định danh sản phẩm (vd: proj-phet, proj-user-102)"),
        ("title", "string", "Tiêu đề mô phỏng hoặc tên đề tài bài giảng tương tác"),
        ("url", "string", "Đường dẫn thực tế của website (được giấu kín tuyệt đối)"),
        ("description", "string", "Tóm tắt nội dung khoa học, mục tiêu bài học và hướng dẫn thao tác"),
        ("category", "CategoryId", "Môn học trực thuộc (Toán, Vật lý, Hóa học, Sinh học, Tin học, STEM...)"),
        ("educationLevel", "EducationLevelId", "Cấp học phù hợp (Tiểu học, THCS, THPT, Đại học, Nghề...)"),
        ("status", "string", "Trạng thái kiểm duyệt: 'approved' (Đã duyệt), 'pending' (Chờ duyệt)"),
        ("authorName", "string", "Họ tên tác giả hoặc tập thể giáo viên sáng tạo"),
        ("goLink", "string", "Đường dẫn link che an toàn có dạng /go/<code_hash>"),
        ("views / likes", "number", "Thống kê số lượt truy cập học tập và lượt yêu thích từ cộng đồng")
    ]
    add_table_custom(["Thuộc tính", "Kiểu dữ liệu", "Mô tả ý nghĩa chức năng"], fields_model, "Bảng 2.1: Đặc tả các trường thông tin trong mô hình dữ liệu WebProject")
    
    # ---------------------------------------------------------
    # CHƯƠNG 3
    # ---------------------------------------------------------
    p_chapter("CHƯƠNG 3: CÁC CHỨC NĂNG VÀ CƠ CHẾ HOẠT ĐỘNG CỐT LÕI")
    
    p_h1("3.1. Khung xem thử trình duyệt giả lập (Browser Mockup Frame)")
    p_body("Nhằm mang lại trải nghiệm trực quan sống động, mỗi mô phỏng trên giao diện được trình bày bên trong một khung trình duyệt thu nhỏ (Browser Mockup Frame). Khung hiển thị bao gồm thanh điều khiển cửa sổ chuẩn MacOS, biểu tượng khóa bảo mật SSL, tên miền ảo hóa (preview.web) và huy hiệu vinh danh tác giả (Author Badge) được gắn tinh tế ở góc dưới bức ảnh.")
    p_body("Đặc biệt, hệ thống sử dụng thuật toán tạo ảnh chụp màn hình tự động kết hợp với link che /go/<code>. Nhờ đó, đường dẫn URL gốc của mô phỏng hoàn toàn không bị xuất hiện trong thuộc tính src của thẻ <img> khi người dùng kiểm tra mã nguồn trang (F12).")
    
    p_h1("3.2. Cơ chế Link che và Trang Khung Brand Frame (/go/<code>)")
    p_body("Đây là một trong những phát minh công nghệ quan trọng nhất của dự án nhằm giải quyết triệt để bài toán bảo vệ bản quyền. Khi người dùng bấm nút 'Truy cập website' hoặc quét mã QR, trình duyệt sẽ nạp đường dẫn có cấu trúc:")
    p_body("https://webshare-pmca.vercel.app/go/<code_ma_hoa>", indent=False)
    p_body("Tại đây, Serverless Function sẽ trả về một trang khung Brand Frame đặc thù với các thuộc tính:")
    p_body("Thanh địa chỉ trình duyệt luôn giữ nguyên tên miền của hệ sinh thái Webshare-PMCA, tuyệt đối không thực hiện chuyển hướng HTTP 302 sang liên kết gốc.", "1.")
    p_body("Ứng dụng mô phỏng được nhúng bên trong một Iframe bảo mật toàn màn hình, hỗ trợ đầy đủ các thao tác đồ họa, âm thanh và tương tác cảm ứng.", "2.")
    p_body("Thanh công cụ trên cùng tích hợp đầy đủ thông tin tác giả, nút thu nhỏ thanh công cụ, nút kích hoạt chế độ Toàn màn hình (Fullscreen) và nút quay trở về trang chủ.", "3.")
    
    p_h1("3.3. Module tạo mã QR tức thì phục vụ lớp học thông minh")
    p_body("Mã QR được khởi tạo theo thời gian thực dựa trên đường dẫn link che an toàn. Giáo viên có thể trình chiếu trực tiếp mã QR lên màn hình lớn hoặc máy chiếu trong phòng học. Học sinh chỉ cần sử dụng ứng dụng chụp ảnh trên điện thoại thông minh để quét mã và bước vào bài học ngay lập tức, loại bỏ hoàn toàn các phiền toái khi nhập liệu thủ công.")
    
    p_h1("3.4. Hệ thống phân loại, tìm kiếm và bộ lọc đa chiều")
    p_body("Giao diện chính được chia thành 2 không gian nội dung tách biệt rõ ràng:")
    p_body("Tab 'Bài đăng tải': Nơi hội tụ các công trình sáng tạo của giáo viên và học sinh khắp mọi miền, được phân loại chi tiết theo 12 môn học và 6 cấp học.", "•")
    p_body("Tab 'Nổi tiếng': Thư viện liên kết trực tiếp tới các nền tảng mô phỏng kinh điển đã được quốc tế công nhận như PhET Colorado (Mỹ), GeoGebra (Áo), BioDigital Human 3D, Wolfram Demonstrations và Google Earth.", "•")
    
    p_h1("3.5. Quy trình và luồng hoạt động tổng thể của hệ thống")
    p_body("Toàn bộ chu trình từ khi người dùng đóng góp sản phẩm cho đến khi học sinh trải nghiệm được khái quát thông qua sơ đồ sau:")
    
    add_fig_image(fig2, "Hình 3.1: Sơ đồ luồng hoạt động tổng thể của hệ thống Webshare-PMCA")
    
    # ---------------------------------------------------------
    # CHƯƠNG 4
    # ---------------------------------------------------------
    p_chapter("CHƯƠNG 4: GIẢI PHÁP BẢO MẬT VÀ BẢO VỆ NGƯỜI DÙNG ĐĂNG BÀI")
    
    p_h1("4.1. Cơ chế mã hóa và ẩn giấu tuyệt đối URL gốc")
    p_body("Nhằm bảo vệ tài nguyên số cho các nhà giáo dục, hệ thống đã triển khai thuật toán mã hóa đối xứng kết hợp chuyển đổi cơ số:")
    
    add_fig_image(fig3, "Hình 4.1: Sơ đồ thuật toán mã hóa và giải mã bảo vệ URL gốc (/go/<code>)")
    
    p_body("Cụ thể, chuỗi JSON chứa siêu dữ liệu của sản phẩm bao gồm URL thực tế (u), tiêu đề (t), tên tác giả (a) và email liên hệ (e) được mã hóa từng byte thông qua phép toán logic XOR với khóa bí mật dài ('webhub-go-v2#sbx7q'). Dãy byte sau đó được mã hóa sang định dạng chuỗi an toàn Base64URL.")
    p_body("Nhờ quy trình này, người dùng thông thường và học sinh không thể suy đoán được địa chỉ máy chủ thực tế, ngăn ngừa hiệu quả các hành vi tải lậu mã nguồn hoặc tấn công phá hoại hạ tầng cá nhân của tác giả.")
    
    p_h1("4.2. Bảo vệ quyền riêng tư và danh tính tác giả (Author Privacy)")
    p_body("Hệ thống thiết lập chính sách quyền riêng tư linh hoạt: người dùng khi đăng bài không bắt buộc phải cung cấp địa chỉ email cá nhân hay số điện thoại. Trường thông tin liên hệ được đặt ở chế độ Tùy chọn (Optional).")
    p_body("Trong trường hợp tác giả có cung cấp email để nhận góp ý chuyên môn, hệ thống áp dụng cơ chế hiển thị thích ứng: trên màn hình điện thoại di động, email sẽ được ẩn giấu sau biểu tượng hộp thư tử tế (✉) và chỉ mở cửa sổ popup khi có thao tác chạm có chủ đích, bảo vệ tác giả khỏi các công cụ tự động quét thư rác (Spam Bots).")
    
    p_h1("4.3. Quy trình kiểm duyệt phòng chống mã độc và liên kết xấu")
    p_body("Để đảm bảo một môi trường giáo dục an toàn và lành mạnh, 100% các bài nộp từ cộng đồng đều phải đi qua hàng đợi kiểm duyệt (Pending Queue). Quản trị viên hệ thống sẽ trực tiếp thẩm định tính khoa học, kiểm tra mã nguồn trang web đích để đảm bảo không chứa mã độc, không có nội dung thương mại hóa tiêu cực hay lừa đảo trước khi cấp phép xuất bản công khai.")
    
    p_h1("4.4. Bảo mật hạ tầng quản trị và kho lưu trữ mã nguồn")
    p_body("Bảo mật hệ thống được củng cố toàn diện thông qua 3 lớp phòng vệ:")
    p_body("Lớp 1 - Mật khẩu Quản trị @1122@: Cơ chế xác thực tại cổng quản trị Admin Portal loại bỏ hoàn toàn các gợi ý mật khẩu công khai, ngăn chặn các cuộc tấn công dò mật khẩu tự động.", "1.")
    p_body("Lớp 2 - Kho lưu trữ GitHub Private: Toàn bộ mã nguồn phát triển của Webshare-PMCA đã được chuyển sang chế độ Riêng tư (Private Repository). Người ngoài hoàn toàn không thể truy cập, phân tích cấu trúc mã nguồn hay khóa giải mã nội bộ.", "2.")
    p_body("Lớp 3 - Khóa cứng Endpoint kết nối: Địa chỉ Web App Google Apps Script được cố định trực tiếp trong mã nguồn biên dịch, ngăn chặn các hành vi giả mạo yêu cầu đồng bộ từ bên ngoài.", "3.")
    
    # ---------------------------------------------------------
    # CHƯƠNG 5
    # ---------------------------------------------------------
    p_chapter("CHƯƠNG 5: HỆ THỐNG CẨM NANG AI V26 VÀ HỖ TRỢ ĐA NGÔN NGỮ ĐÔNG NAM Á")
    
    p_h1("5.1. Tích hợp cẩm nang SimBot Universal Prompt Guide v26")
    p_body("Webshare-PMCA tích hợp trực tiếp bản hướng dẫn độc quyền SIMBOT_UNIVERSAL_PROMPT_GUIDE_V26.md, đóng vai trò là 'bộ não điều khiển' giúp giáo viên hợp tác cùng AI để tạo ra các mô phỏng chuẩn mực quốc tế:")
    
    steps_guide = [
        ("Bước 1", "Lắng nghe nỗi đau học sinh", "Xác định các khái niệm trừu tượng, khó hiểu mà phương pháp dạy học truyền thống chưa truyền tải hiệu quả."),
        ("Bước 2", "Thu thập kiến thức nguồn", "Cung cấp tài liệu giáo khoa, định luật vật lý, công thức toán học chuẩn xác làm ngữ cảnh cho AI."),
        ("Bước 3", "Tải Prompt Guide v26", "Tải tệp cẩm nang chuẩn (.md) từ hệ thống làm kim chỉ nam điều khiển quy trình tư duy của AI."),
        ("Bước 4", "Trao quyền cho AI", "Khởi động phiên làm việc, cấp quyền cho AI tự động đặt câu hỏi khảo sát và xây dựng bản thiết kế ROM."),
        ("Bước 5", "Tạo app với AI Studio", "Lắp ráp giao diện tương tác, thanh điều khiển, canvas 2D/3D trên nền tảng Google AI Studio."),
        ("Bước 6", "Kiểm thử sư phạm", "Rà soát tính chính xác của công thức khoa học, trải nghiệm người dùng và tính tương thích trên thiết bị di động."),
        ("Bước 7", "Lưu trữ mã nguồn", "Xuất mã nguồn và lưu trữ dự án an toàn trên nền tảng quản lý phiên bản GitHub."),
        ("Bước 8", "Xuất bản lên Vercel", "Triển khai ứng dụng lên đám mây Vercel và chia sẻ ngược lại lên cộng đồng Webshare-PMCA.")
    ]
    add_table_custom(["Thứ tự", "Tên bước quy trình", "Mục tiêu và hành động chính"], steps_guide, "Bảng 5.1: Quy trình 8 bước kiến tạo mô phỏng giáo dục theo chuẩn SimBot v26")
    
    p_h1("5.2. Chuẩn điều hướng không gian mô phỏng linh hoạt (v26 Specification)")
    p_body("Điểm nâng cấp mang tính đột phá của phiên bản v26 là việc chuẩn hóa không gian làm việc mô phỏng linh hoạt (Flexible Workspace Navigation). Các sản phẩm đạt chuẩn v26 bắt buộc phải hỗ trợ các tính năng điều hướng chuyên nghiệp:")
    p_body("Zoom & Pan: Cho phép phóng to, thu nhỏ và di chuyển vùng quan sát mượt mà bằng con trỏ chuột hoặc thao tác chạm hai ngón tay trên màn hình cảm ứng.", "•")
    p_body("Fit-to-View & Reset: Cung cấp nút định tâm nhanh giúp đưa toàn bộ thí nghiệm về góc nhìn tối ưu ban đầu khi người học thao tác quá mức.", "•")
    p_body("Direct Object Manipulation: Cho phép người học cầm nắm, kéo thả các vật thể thí nghiệm trực tiếp trên không gian mô phỏng.", "•")
    
    p_h1("5.3. Hệ sinh thái 10 ngôn ngữ khu vực Đông Nam Á")
    p_body("Hướng tới mục tiêu hòa nhập giáo dục khu vực và thúc đẩy tinh thần cộng đồng ASEAN, nền tảng hỗ trợ chuyển đổi giao diện tức thì giữa 10 ngôn ngữ phổ biến nhất tại Đông Nam Á:")
    
    langs_data = [
        ("1", "Tiếng Việt (vi)", "Việt Nam", "Ngôn ngữ giao diện mặc định, tối ưu hóa thuật ngữ chương trình GDPT 2018"),
        ("2", "English (en)", "Singapore / Quốc tế", "Ngôn ngữ tiêu chuẩn toàn cầu phục vụ giao lưu học thuật quốc tế"),
        ("3", "ไทย (th)", "Thái Lan", "Bản địa hóa đầy đủ hệ thống môn học và hướng dẫn cẩm nang"),
        ("4", "မြန်မာ (my)", "Myanmar", "Hỗ trợ chuẩn phông chữ Myanmar và thuật ngữ khoa học"),
        ("5", "ລາວ (lo)", "Lào", "Hỗ trợ giáo viên và học sinh các trường hữu nghị Việt - Lào"),
        ("6", "ខ្មែរ (km)", "Campuchia", "Chuẩn ký tự tiếng Khmer cho hệ thống lọc và danh mục bài học"),
        ("7", "Bahasa Indonesia (id)", "Indonesia", "Ngôn ngữ của quốc gia đông dân nhất khu vực Đông Nam Á"),
        ("8", "Bahasa Melayu (ms)", "Malaysia / Brunei", "Hệ thống bản dịch chuẩn hóa cho khối trường học Malaysia và Brunei"),
        ("9", "Filipino / Tagalog (tl)", "Philippines", "Bản địa hóa phục vụ cộng đồng giáo viên STEM tại Philippines"),
        ("10", "Tetun (tet)", "Đông Timor", "Hỗ trợ giáo dục cho đất nước Đông Timor với bản dịch chuẩn xác")
    ]
    add_table_custom(["STT", "Ngôn ngữ & Mã ISO", "Quốc gia chính", "Đặc điểm bản địa hóa"], langs_data, "Bảng 5.2: Danh mục 10 ngôn ngữ khu vực Đông Nam Á được tích hợp trên hệ thống")

    # ---------------------------------------------------------
    # CHƯƠNG 6
    # ---------------------------------------------------------
    p_chapter("CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN")
    
    p_h1("6.1. Các kết quả chính đã đạt được")
    p_body("Sau quá trình nghiên cứu, thiết kế và thử nghiệm thực tế, dự án Webshare-PMCA đã hoàn thành xuất sắc các mục tiêu đề ra:")
    p_body("Xây dựng thành công nền tảng WebHub Showcase hoàn chỉnh, ổn định và thẩm mỹ cao, phục vụ hiệu quả nhu cầu học tập và giảng dạy trực quan.", "1.")
    p_body("Thiết lập thành công giải pháp link che /go/<code> độc quyền, bảo vệ an toàn 100% URL gốc của các tác giả tham gia đóng góp sản phẩm.", "2.")
    p_body("Triển khai quy trình tạo và quét mã QR tức thì, xóa bỏ rào cản kỹ thuật trong các giờ dạy học ứng dụng công nghệ tại lớp học.", "3.")
    p_body("Đồng bộ hóa cẩm nang SimBot Universal Prompt Guide v26 và hệ sinh thái đa ngôn ngữ 10 nước Đông Nam Á, nâng tầm sản phẩm thành một nền tảng giáo dục mang tầm vóc khu vực.", "4.")
    p_body("Củng cố vững chắc an ninh hệ thống: kho lưu trữ GitHub được bảo vệ ở chế độ Private, mật khẩu quản trị @1122@ được bảo mật nghiêm ngặt.", "5.")
    
    p_h1("6.2. Hạn chế hiện tại và bài học kinh nghiệm")
    p_body("Bên cạnh các thành tựu nổi bật, dự án cũng ghi nhận một số điểm cần tiếp tục hoàn thiện trong thời gian tới:")
    p_body("Tốc độ đồng bộ bài nộp phụ thuộc vào thời gian phản hồi của dịch vụ Google Apps Script khi có lượng truy cập đồng thời lớn.", "•")
    p_body("Một số trang web đích từ bên thứ ba áp dụng chính sách bảo mật X-Frame-Options hoặc CSP nghiêm ngặt, gây hạn chế việc nhúng bên trong thẻ Iframe của trang khung Brand Frame.", "•")
    
    p_h1("6.3. Định hướng nghiên cứu và phát triển trong tương lai")
    p_body("Trong các giai đoạn tiếp theo, công trình sẽ tập trung mở rộng theo các hướng nghiên cứu:")
    p_body("Phát triển ứng dụng di động độc lập (PWA - Progressive Web App) có khả năng cài đặt trực tiếp lên màn hình chính của điện thoại mà không cần thông qua kho ứng dụng.", "1.")
    p_body("Tích hợp trợ lý ảo AI thông minh ngay trên trang web để gợi ý các bài mô phỏng phù hợp với từng đơn vị bài học trong sách giáo khoa của học sinh.", "2.")
    p_body("Mở rộng hợp tác với các tổ chức giáo dục STEM quốc tế để tổ chức các cuộc thi sáng tạo mô phỏng trực tuyến thường niên.", "3.")

    # ---------------------------------------------------------
    # TÀI LIỆU THAM KHẢO
    # ---------------------------------------------------------
    p_ref = doc.add_paragraph()
    p_ref.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ref.paragraph_format.space_before = Pt(25)
    r_rf = p_ref.add_run("TÀI LIỆU THAM KHẢO")
    r_rf.font.name = "Times New Roman"
    r_rf.font.size = Pt(14)
    r_rf.font.bold = True
    
    refs = [
        "[1] Bộ Giáo dục và Đào tạo (2018), Chương trình Giáo dục phổ thông 2018 - Hoạt động trải nghiệm và giáo dục STEM, Nhà xuất bản Giáo dục Việt Nam.",
        "[2] Lê Thanh Liêm (2026), SimBot Universal Prompt Guide v26: Cẩm nang toàn năng kiến tạo ứng dụng mô phỏng giáo dục và thí nghiệm ảo bằng Trí tuệ nhân tạo, Cần Thơ.",
        "[3] PhET Interactive Simulations (2026), Research Base for PhET Simulations, University of Colorado Boulder, truy cập tại: https://phet.colorado.edu.",
        "[4] Vercel Inc. (2025), Serverless Functions Architecture and Deployment Patterns, Vercel Documentation.",
        "[5] Google Developers (2025), Google Apps Script Web Apps Guide & Sheets API Integration, Google Cloud Documentation.",
        "[6] World Wide Web Consortium (W3C) (2024), HTML5 Living Standard - Embedded Content and Iframe Sandboxing Specifications."
    ]
    for rf in refs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.left_indent = Mm(12.5)
        p.paragraph_format.first_line_indent = Mm(-12.5)
        r = p.add_run(rf)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)

    # Lưu tập tin
    out_path = os.path.join(WORKDIR, "TONG_QUAN_DU_AN_WEBSHARE_PMCA.docx")
    doc.save(out_path)
    print(f"Đã xuất thành công tài liệu Luận văn tại: {out_path}")
    return out_path

if __name__ == "__main__":
    build_full_thesis()
