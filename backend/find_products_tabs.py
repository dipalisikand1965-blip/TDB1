import re
import sys

files = [
    ('CareManager', '/app/frontend/src/components/admin/CareManager.jsx', 'care', 'Care'),
    ('FitManager', '/app/frontend/src/components/admin/FitManager.jsx', 'fit', 'Fit'),
    ('StayManager', '/app/frontend/src/components/admin/StayManager.jsx', 'stay', 'Stay'),
    ('TravelManager', '/app/frontend/src/components/admin/TravelManager.jsx', 'travel', 'Travel'),
    ('EnjoyManager', '/app/frontend/src/components/admin/EnjoyManager.jsx', 'enjoy', 'Enjoy'),
    ('LearnManager', '/app/frontend/src/components/admin/LearnManager.jsx', 'learn', 'Learn'),
    ('FarewellManager', '/app/frontend/src/components/admin/FarewellManager.jsx', 'farewell', 'Farewell'),
    ('EmergencyManager', '/app/frontend/src/components/admin/EmergencyManager.jsx', 'emergency', 'Emergency'),
    ('AdvisoryManager', '/app/frontend/src/components/admin/AdvisoryManager.jsx', 'advisory', 'Advisory'),
    ('PaperworkManager', '/app/frontend/src/components/admin/PaperworkManager.jsx', 'paperwork', 'Paperwork'),
]

for name, path, pillar, pillar_name in files:
    try:
        with open(path, 'r') as f:
            lines = f.readlines()
        
        # Find the products TabsContent start
        start_line = None
        for i, line in enumerate(lines):
            if 'value="products"' in line and '<TabsContent' in line:
                start_line = i
                break
        
        if start_line is None:
            print(f"{name}: NO products TabsContent found")
            continue
        
        # Find the matching closing </TabsContent>
        depth = 0
        end_line = None
        for i in range(start_line, len(lines)):
            if '<TabsContent' in lines[i]:
                depth += 1
            if '</TabsContent>' in lines[i]:
                depth -= 1
                if depth == 0:
                    end_line = i
                    break
        
        if end_line is None:
            print(f"{name}: Could not find end of products tab")
            continue
        
        print(f"{name}: lines {start_line+1}-{end_line+1} (0-indexed: {start_line}-{end_line})")
        print(f"  START: {lines[start_line].rstrip()}")
        print(f"  END:   {lines[end_line].rstrip()}")
        
    except Exception as e:
        print(f"{name}: Error - {e}")
