#!/usr/bin/env python3
"""
Documentation Compiler for The Doggy Company
Creates a single comprehensive document from all markdown files
"""

import os
from datetime import datetime
from pathlib import Path

OUTPUT_FILE = "/app/COMPLETE_DOCUMENTATION.md"
MEMORY_DIR = "/app/memory"
ROOT_DIR = "/app"

def compile_docs():
    """Compile all documentation into one file"""
    
    sections = []
    total_files = 0
    total_lines = 0
    
    # Header
    sections.append(f"""# The Doggy Company - Complete Documentation
## Compiled: {datetime.now().strftime('%B %d, %Y at %H:%M')}

---

# TABLE OF CONTENTS

""")
    
    # Prioritized files to include first
    priority_files = [
        "/app/memory/OWNERS_GUIDE_DIPALI.md",
        "/app/memory/PRD.md",
        "/app/memory/PREVIEW_SETUP.md",
        "/app/memory/SOUL_PHILOSOPHY_SSOT.md",
        "/app/philosophy.md",
        "/app/README.md",
    ]
    
    toc_entries = []
    content_sections = []
    
    # Process priority files first
    for filepath in priority_files:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            filename = os.path.basename(filepath)
            lines = len(content.split('\n'))
            total_files += 1
            total_lines += lines
            
            toc_entries.append(f"- [{filename}](#{filename.lower().replace('.', '-').replace('_', '-')})")
            content_sections.append(f"""
---

<a name="{filename.lower().replace('.', '-').replace('_', '-')}"></a>
# 📄 {filename}
**Path:** `{filepath}`
**Lines:** {lines}

{content}
""")
    
    # Then process /app/memory/ folder
    memory_files = []
    if os.path.exists(MEMORY_DIR):
        for root, dirs, files in os.walk(MEMORY_DIR):
            for file in sorted(files):
                if file.endswith('.md'):
                    filepath = os.path.join(root, file)
                    if filepath not in priority_files:
                        memory_files.append(filepath)
    
    toc_entries.append("\n## Memory Folder Documents\n")
    
    for filepath in memory_files[:100]:  # Limit to first 100 to avoid huge file
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            filename = os.path.basename(filepath)
            rel_path = os.path.relpath(filepath, ROOT_DIR)
            lines = len(content.split('\n'))
            total_files += 1
            total_lines += lines
            
            anchor = f"memory-{filename.lower().replace('.', '-').replace('_', '-')}"
            toc_entries.append(f"- [{filename}](#{anchor}) ({lines} lines)")
            content_sections.append(f"""
---

<a name="{anchor}"></a>
# 📄 {filename}
**Path:** `{rel_path}`
**Lines:** {lines}

{content}
""")
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
    
    # Build final document
    sections.append('\n'.join(toc_entries))
    sections.append(f"""

---

# STATISTICS
- **Total Files Included:** {total_files}
- **Total Lines:** {total_lines:,}
- **Compiled:** {datetime.now().isoformat()}

---

# FULL DOCUMENTATION

""")
    sections.extend(content_sections)
    
    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sections))
    
    print(f"✅ Documentation compiled!")
    print(f"   Files: {total_files}")
    print(f"   Lines: {total_lines:,}")
    print(f"   Output: {OUTPUT_FILE}")
    
    return OUTPUT_FILE

if __name__ == "__main__":
    compile_docs()
