#!/usr/bin/env python3
"""
Creates beautiful HTML documentation for The Doggy Company
"""

import markdown
from datetime import datetime

def convert_to_html():
    # Read the owner's guide
    with open('/app/memory/OWNERS_GUIDE_DIPALI.md', 'r', encoding='utf-8') as f:
        owners_guide = f.read()
    
    # Convert markdown to HTML
    md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
    content_html = md.convert(owners_guide)
    
    # Beautiful HTML template
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Doggy Company - Owner's Guide</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px 60px;
        }}
        
        h1 {{
            color: #6b46c1;
            border-bottom: 3px solid #e9d5ff;
            padding-bottom: 15px;
            margin-bottom: 30px;
            font-size: 2.5em;
        }}
        
        h2 {{
            color: #7c3aed;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9d5ff;
            font-size: 1.8em;
        }}
        
        h3 {{
            color: #8b5cf6;
            margin-top: 25px;
            margin-bottom: 15px;
        }}
        
        h4 {{
            color: #a78bfa;
            margin-top: 20px;
            margin-bottom: 10px;
        }}
        
        p {{
            margin-bottom: 15px;
        }}
        
        ul, ol {{
            margin-left: 30px;
            margin-bottom: 20px;
        }}
        
        li {{
            margin-bottom: 8px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #faf5ff;
            border-radius: 10px;
            overflow: hidden;
        }}
        
        th {{
            background: linear-gradient(135deg, #7c3aed, #6b46c1);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }}
        
        td {{
            padding: 12px 15px;
            border-bottom: 1px solid #e9d5ff;
        }}
        
        tr:last-child td {{
            border-bottom: none;
        }}
        
        tr:hover td {{
            background: #f3e8ff;
        }}
        
        code {{
            background: #f3e8ff;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            color: #6b46c1;
        }}
        
        pre {{
            background: #1e1b4b;
            color: #e9d5ff;
            padding: 20px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 20px 0;
        }}
        
        pre code {{
            background: transparent;
            color: inherit;
            padding: 0;
        }}
        
        blockquote {{
            border-left: 4px solid #7c3aed;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #6b46c1;
            background: #faf5ff;
            padding: 15px 20px;
            border-radius: 0 10px 10px 0;
        }}
        
        hr {{
            border: none;
            height: 2px;
            background: linear-gradient(90deg, transparent, #7c3aed, transparent);
            margin: 40px 0;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        
        .header img {{
            width: 100px;
            height: 100px;
            border-radius: 50%;
            margin-bottom: 20px;
        }}
        
        .footer {{
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e9d5ff;
            color: #888;
        }}
        
        .emoji {{
            font-size: 1.2em;
        }}
        
        strong {{
            color: #6b46c1;
        }}
        
        a {{
            color: #7c3aed;
            text-decoration: none;
        }}
        
        a:hover {{
            text-decoration: underline;
        }}
        
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            .container {{
                box-shadow: none;
                padding: 20px;
            }}
        }}
        
        @media (max-width: 768px) {{
            .container {{
                padding: 20px;
                border-radius: 10px;
            }}
            h1 {{
                font-size: 1.8em;
            }}
            h2 {{
                font-size: 1.4em;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐕 The Doggy Company</h1>
            <p><em>Owner's Guide - Created with love for Dipali</em></p>
            <p style="color: #888; font-size: 0.9em;">Generated: {datetime.now().strftime('%B %d, %Y')}</p>
        </div>
        
        {content_html}
        
        <div class="footer">
            <p>💜 Built in loving memory of <strong>Mystique</strong> 🐾</p>
            <p style="margin-top: 10px; font-size: 0.85em;">The Doggy Company - Pet Life Operating System</p>
        </div>
    </div>
</body>
</html>'''
    
    # Save HTML file
    output_path = '/app/frontend/public/owners-guide.html'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ HTML guide created: {output_path}")
    return html

if __name__ == "__main__":
    convert_to_html()
