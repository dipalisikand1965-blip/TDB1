"""
Script to update all pillar managers to use PillarProductsTab component.
Replaces the legacy products tab content with the new unified component.
"""

files = [
    ('CareManager', '/app/frontend/src/components/admin/CareManager.jsx', 'care', 'Care', 820, 959),
    ('FitManager', '/app/frontend/src/components/admin/FitManager.jsx', 'fit', 'Fit', 723, 791),
    ('StayManager', '/app/frontend/src/components/admin/StayManager.jsx', 'stay', 'Stay', 761, 881),
    ('TravelManager', '/app/frontend/src/components/admin/TravelManager.jsx', 'travel', 'Travel', 778, 885),
    ('EnjoyManager', '/app/frontend/src/components/admin/EnjoyManager.jsx', 'enjoy', 'Enjoy', 736, 814),
    ('LearnManager', '/app/frontend/src/components/admin/LearnManager.jsx', 'learn', 'Learn', 797, 882),
    ('FarewellManager', '/app/frontend/src/components/admin/FarewellManager.jsx', 'farewell', 'Farewell', 664, 766),
    ('EmergencyManager', '/app/frontend/src/components/admin/EmergencyManager.jsx', 'emergency', 'Emergency', 584, 631),
    ('AdvisoryManager', '/app/frontend/src/components/admin/AdvisoryManager.jsx', 'advisory', 'Advisory', 571, 621),
    ('PaperworkManager', '/app/frontend/src/components/admin/PaperworkManager.jsx', 'paperwork', 'Paperwork', 648, 698),
]

IMPORT_LINE = "import PillarProductsTab from './PillarProductsTab';"

for name, path, pillar, pillar_name, start_0, end_0 in files:
    try:
        with open(path, 'r') as f:
            lines = f.readlines()
        
        # Check if import already exists
        has_import = any(IMPORT_LINE in line for line in lines)
        
        # 1. Add import after PillarServicesTab import if not already there
        if not has_import:
            for i, line in enumerate(lines):
                if "import PillarServicesTab from './PillarServicesTab'" in line:
                    lines.insert(i + 1, IMPORT_LINE + '\n')
                    # Adjust start/end by 1 since we inserted a line
                    start_0 += 1
                    end_0 += 1
                    break
        
        # 2. Replace the products TabsContent content
        # The section is from start_0 to end_0 (0-indexed, inclusive)
        new_tab_content = (
            f'        <TabsContent value="products" className="space-y-4">\n'
            f'          <PillarProductsTab pillar="{pillar}" pillarName="{pillar_name}" />\n'
            f'        </TabsContent>\n'
        )
        
        # Verify the section bounds
        start_line = lines[start_0].strip()
        end_line = lines[end_0].strip()
        
        if '<TabsContent' not in start_line or 'value="products"' not in start_line:
            print(f"  {name}: WARNING - start line mismatch: {lines[start_0].rstrip()}")
        if '</TabsContent>' not in end_line:
            print(f"  {name}: WARNING - end line mismatch: {lines[end_0].rstrip()}")
        
        new_lines = lines[:start_0] + [new_tab_content] + lines[end_0 + 1:]
        
        with open(path, 'w') as f:
            f.writelines(new_lines)
        
        print(f"✅ {name}: Updated (import={'added' if not has_import else 'already exists'}, replaced lines {start_0+1}-{end_0+1})")
        
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
