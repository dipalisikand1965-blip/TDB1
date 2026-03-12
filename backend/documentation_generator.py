"""
Documentation Generator for The Doggy Company
Auto-generates readable HTML documentation from all markdown files
"""

import os
import markdown
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

MEMORY_DIR = "/app/memory"
ROOT_DIR = "/app"
OUTPUT_DIR = "/app/frontend/public"

def generate_owners_guide():
    """Generate the simple Owner's Guide HTML"""
    try:
        guide_path = os.path.join(MEMORY_DIR, "OWNERS_GUIDE_DIPALI.md")
        if not os.path.exists(guide_path):
            logger.warning("Owner's guide markdown not found")
            return False
        
        with open(guide_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
        content_html = md.convert(content)
        
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Doggy Company - Owner's Guide</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6; color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; padding: 20px;
        }}
        .container {{
            max-width: 900px; margin: 0 auto; background: white;
            border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 40px 60px;
        }}
        h1 {{ color: #6b46c1; border-bottom: 3px solid #e9d5ff; padding-bottom: 15px; margin-bottom: 30px; font-size: 2.5em; }}
        h2 {{ color: #7c3aed; margin-top: 40px; margin-bottom: 20px; padding-top: 20px; border-top: 1px solid #e9d5ff; font-size: 1.8em; }}
        h3 {{ color: #8b5cf6; margin-top: 25px; margin-bottom: 15px; }}
        h4 {{ color: #a78bfa; margin-top: 20px; margin-bottom: 10px; }}
        p {{ margin-bottom: 15px; }}
        ul, ol {{ margin-left: 30px; margin-bottom: 20px; }}
        li {{ margin-bottom: 8px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; background: #faf5ff; border-radius: 10px; overflow: hidden; }}
        th {{ background: linear-gradient(135deg, #7c3aed, #6b46c1); color: white; padding: 15px; text-align: left; font-weight: 600; }}
        td {{ padding: 12px 15px; border-bottom: 1px solid #e9d5ff; }}
        tr:last-child td {{ border-bottom: none; }}
        tr:hover td {{ background: #f3e8ff; }}
        code {{ background: #f3e8ff; padding: 2px 8px; border-radius: 4px; font-family: Monaco, Consolas, monospace; font-size: 0.9em; color: #6b46c1; }}
        pre {{ background: #1e1b4b; color: #e9d5ff; padding: 20px; border-radius: 10px; overflow-x: auto; margin: 20px 0; }}
        pre code {{ background: transparent; color: inherit; padding: 0; }}
        blockquote {{ border-left: 4px solid #7c3aed; padding-left: 20px; margin: 20px 0; font-style: italic; color: #6b46c1; background: #faf5ff; padding: 15px 20px; border-radius: 0 10px 10px 0; }}
        hr {{ border: none; height: 2px; background: linear-gradient(90deg, transparent, #7c3aed, transparent); margin: 40px 0; }}
        a {{ color: #7c3aed; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        .header {{ text-align: center; margin-bottom: 40px; }}
        .footer {{ text-align: center; margin-top: 50px; padding-top: 30px; border-top: 2px solid #e9d5ff; color: #888; }}
        .timestamp {{ background: #f0fdf4; padding: 10px 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; font-size: 0.9em; color: #166534; }}
        @media print {{ body {{ background: white; padding: 0; }} .container {{ box-shadow: none; padding: 20px; }} }}
        @media (max-width: 768px) {{ .container {{ padding: 20px; border-radius: 10px; }} h1 {{ font-size: 1.8em; }} h2 {{ font-size: 1.4em; }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐕 The Doggy Company</h1>
            <p><em>Owner's Guide - Created with love for Dipali</em></p>
        </div>
        <div class="timestamp">
            📅 Last Updated: {datetime.now().strftime('%B %d, %Y at %H:%M')} | 🔄 Auto-generated
        </div>
        {content_html}
        <div class="footer">
            <p>💜 Built in loving memory of <strong>Mystique</strong> 🐾</p>
            <p style="margin-top: 10px; font-size: 0.85em;">The Doggy Company - Pet Life Operating System</p>
        </div>
    </div>
</body>
</html>'''
        
        output_path = os.path.join(OUTPUT_DIR, "owners-guide.html")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        logger.info(f"Owner's guide generated: {output_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to generate owner's guide: {e}")
        return False


def generate_complete_documentation():
    """Generate complete documentation from all markdown files"""
    try:
        total_files = 0
        total_lines = 0
        
        # Priority files - AGENT_START_HERE must be FIRST
        priority_files = [
            "/app/memory/AGENT_START_HERE.md",
            "/app/memory/OWNERS_GUIDE_DIPALI.md",
            "/app/memory/PRD.md",
            "/app/memory/PILLAR_AUDIT.md",
            "/app/memory/DEPLOYMENT_GUIDE.md",
            "/app/memory/PERSONALIZATION_VISION.md",
            "/app/memory/PREVIEW_SETUP.md",
            "/app/memory/SOUL_PHILOSOPHY_SSOT.md",
            "/app/philosophy.md",
            "/app/README.md",
        ]
        
        toc_entries = ["<h2>📑 Table of Contents</h2><div class='toc'>"]
        content_sections = []
        
        # Process priority files
        for filepath in priority_files:
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                filename = os.path.basename(filepath)
                lines = len(content.split('\n'))
                total_files += 1
                total_lines += lines
                
                md = markdown.Markdown(extensions=['tables', 'fenced_code'])
                content_html = md.convert(content)
                
                anchor = filename.lower().replace('.', '-').replace('_', '-')
                toc_entries.append(f'<a href="#{anchor}">⭐ {filename}</a>')
                content_sections.append(f'''
                    <div class="doc-section" id="{anchor}">
                        <h2>📄 {filename}</h2>
                        <p class="meta">Path: {filepath} | Lines: {lines}</p>
                        {content_html}
                    </div>
                ''')
        
        # Process memory folder
        toc_entries.append("<br><strong>Memory Folder:</strong>")
        memory_files = []
        if os.path.exists(MEMORY_DIR):
            for root, dirs, files in os.walk(MEMORY_DIR):
                for file in sorted(files):
                    if file.endswith('.md'):
                        filepath = os.path.join(root, file)
                        if filepath not in priority_files:
                            memory_files.append(filepath)
        
        memory_files = sorted(memory_files, key=lambda path: os.path.relpath(path, ROOT_DIR).lower())

        for filepath in memory_files:
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                filename = os.path.basename(filepath)
                rel_path = os.path.relpath(filepath, ROOT_DIR)
                lines = len(content.split('\n'))
                total_files += 1
                total_lines += lines
                
                md = markdown.Markdown(extensions=['tables', 'fenced_code'])
                content_html = md.convert(content)
                
                anchor = f"memory-{filename.lower().replace('.', '-').replace('_', '-')}"
                toc_entries.append(f'<a href="#{anchor}">{filename} ({lines})</a>')
                content_sections.append(f'''
                    <div class="doc-section" id="{anchor}">
                        <h2>📄 {filename}</h2>
                        <p class="meta">Path: {rel_path} | Lines: {lines}</p>
                        {content_html}
                    </div>
                ''')
            except Exception as e:
                logger.warning(f"Error reading {filepath}: {e}")
        
        toc_entries.append("</div>")
        
        # Build HTML
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Doggy Company - Complete Documentation</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }}
        .container {{ max-width: 1000px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 5px 30px rgba(0,0,0,0.1); padding: 40px; }}
        h1 {{ color: #6b46c1; border-bottom: 3px solid #e9d5ff; padding-bottom: 15px; margin-bottom: 20px; }}
        h2 {{ color: #7c3aed; margin-top: 40px; margin-bottom: 20px; padding-top: 20px; border-top: 1px solid #e9d5ff; }}
        h3 {{ color: #8b5cf6; margin-top: 25px; }}
        h4 {{ color: #a78bfa; margin-top: 20px; }}
        p {{ margin-bottom: 15px; }}
        ul, ol {{ margin-left: 25px; margin-bottom: 15px; }}
        li {{ margin-bottom: 5px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th {{ background: #7c3aed; color: white; padding: 12px; text-align: left; }}
        td {{ padding: 10px; border-bottom: 1px solid #e9d5ff; }}
        tr:hover td {{ background: #faf5ff; }}
        code {{ background: #f3e8ff; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }}
        pre {{ background: #1e1b4b; color: #e9d5ff; padding: 15px; border-radius: 8px; overflow-x: auto; margin: 15px 0; }}
        pre code {{ background: transparent; color: inherit; }}
        blockquote {{ border-left: 4px solid #7c3aed; padding-left: 15px; margin: 15px 0; font-style: italic; background: #faf5ff; padding: 10px 15px; }}
        hr {{ border: none; height: 2px; background: linear-gradient(90deg, transparent, #7c3aed, transparent); margin: 30px 0; }}
        a {{ color: #7c3aed; }}
        .toc {{ background: #faf5ff; padding: 20px; border-radius: 10px; margin-bottom: 30px; max-height: 400px; overflow-y: auto; }}
        .toc a {{ display: block; padding: 3px 0; font-size: 0.9em; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .stats {{ background: #f0fdf4; padding: 15px 20px; border-radius: 10px; margin-bottom: 30px; text-align: center; }}
        .timestamp {{ background: #fef3c7; padding: 10px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; font-size: 0.9em; color: #92400e; }}
        .doc-section {{ margin-bottom: 40px; padding-bottom: 20px; }}
        .meta {{ font-size: 0.85em; color: #888; margin-bottom: 15px; font-style: italic; }}
        @media print {{ body {{ background: white; }} .container {{ box-shadow: none; }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐕 The Doggy Company</h1>
            <h2 style="border: none; margin-top: 0; padding-top: 0;">Complete Documentation</h2>
        </div>
        <div class="timestamp">
            📅 Last Updated: {datetime.now().strftime('%B %d, %Y at %H:%M')} | 🔄 Auto-generated
        </div>
        <div class="stats">
            <strong>📊 Statistics:</strong> {total_files} documents | {total_lines:,} lines | Everything you've built!
        </div>
        {''.join(toc_entries)}
        {''.join(content_sections)}
        <div style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 2px solid #e9d5ff; color: #888;">
            <p>💜 The Doggy Company - Pet Life Operating System 🐾</p>
        </div>
    </div>
</body>
</html>'''
        
        output_path = os.path.join(OUTPUT_DIR, "complete-documentation.html")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        logger.info(f"Complete documentation generated: {output_path} ({total_files} files, {total_lines} lines)")
        return {"files": total_files, "lines": total_lines, "path": output_path}
    
    except Exception as e:
        logger.error(f"Failed to generate complete documentation: {e}")
        return None


def regenerate_all_documentation():
    """Regenerate both documentation files"""
    results = {
        "owners_guide": generate_owners_guide(),
        "complete_docs": generate_complete_documentation(),
        "timestamp": datetime.now().isoformat()
    }
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = regenerate_all_documentation()
    print(f"✅ Documentation regenerated: {results}")
