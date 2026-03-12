#!/usr/bin/env python3
"""
Script to add CMS integration to pillar pages
"""
import re
import os

# Pillar configurations
PILLAR_CONFIGS = {
    'Fit': {
        'title': "Keep {petName} fit and active",
        'subtitle': 'Exercise, activities, fitness goals & wellness routines',
        'buttonColor': 'bg-green-500',
        'placeholder': "Exercise ideas for my breed... weight loss tips"
    },
    'Travel': {
        'title': "Adventures await {petName}",
        'subtitle': 'Pet-friendly travel, flights, road trips & destinations',
        'buttonColor': 'bg-cyan-500',
        'placeholder': "Pet-friendly hotels in Goa... airline pet policy"
    },
    'Dine': {
        'title': "Meals {petName} will love",
        'subtitle': 'Fresh food, treats, nutrition plans & dietary guidance',
        'buttonColor': 'bg-orange-500',
        'placeholder': "Best food for puppies... homemade treats recipe"
    },
    'Enjoy': {
        'title': "Fun times for {petName}",
        'subtitle': 'Activities, playdates, events & enrichment experiences',
        'buttonColor': 'bg-pink-500',
        'placeholder': "Dog parks near me... playdate ideas"
    },
    'Celebrate': {
        'title': "Celebrate {petName}'s special moments",
        'subtitle': 'Birthdays, gotcha days, milestones & celebrations',
        'buttonColor': 'bg-purple-500',
        'placeholder': "Birthday party ideas... gotcha day gifts"
    },
    'Emergency': {
        'title': "Emergency help for {petName}",
        'subtitle': '24/7 emergency vets, first aid & urgent care resources',
        'buttonColor': 'bg-red-500',
        'placeholder': "Emergency vet near me... poison control"
    },
    'Advisory': {
        'title': "Expert advice for {petName}",
        'subtitle': 'Behavior, nutrition, training & health consultations',
        'buttonColor': 'bg-teal-500',
        'placeholder': "Behavior issues... nutrition advice"
    },
    'Farewell': {
        'title': "Honoring {petName}'s memory",
        'subtitle': 'End-of-life care, memorials & grief support',
        'buttonColor': 'bg-slate-500',
        'placeholder': "Cremation services... memorial ideas"
    },
    'Adopt': {
        'title': "Find your perfect companion",
        'subtitle': 'Adoption, fostering, rescue support & new pet prep',
        'buttonColor': 'bg-amber-500',
        'placeholder': "Adopt a dog near me... rescue shelters"
    },
    'Shop': {
        'title': "Everything for {petName}",
        'subtitle': 'Essentials, toys, accessories & curated collections',
        'buttonColor': 'bg-blue-500',
        'placeholder': "Best toys for puppies... essential gear"
    }
}

CMS_STATE_TEMPLATE = '''
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/{pillar_lower}/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({{
    title: "{title}",
    subtitle: '{subtitle}',
    askMira: {{
      enabled: true,
      placeholder: "{placeholder}",
      buttonColor: '{buttonColor}'
    }},
    sections: {{
      askMira: {{ enabled: true }},
      miraPrompts: {{ enabled: true }},
      categories: {{ enabled: true }},
      bundles: {{ enabled: true }},
      products: {{ enabled: true }},
      conciergeServices: {{ enabled: true }},
      personalized: {{ enabled: true }}
    }}
  }});
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsConciergeServices, setCmsConciergeServices] = useState([]);
  const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{{petName}}', activePet?.name || 'your pet') || 
    `{title_fallback}`;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {{
    try {{
      const response = await fetch(`${{API_URL}}/api/{pillar_lower}/page-config`);
      if (response.ok) {{
        const data = await response.json();
        if (data.config && Object.keys(data.config).length > 0) {{
          setCmsConfig(prev => ({{ ...prev, ...data.config }}));
        }}
        if (data.categories?.length > 0) {{
          setCmsCategories(data.categories);
        }}
        if (data.conciergeServices?.length > 0) {{
          setCmsConciergeServices(data.conciergeServices);
        }}
        if (data.miraPrompts?.length > 0) {{
          setCmsMiraPrompts(data.miraPrompts);
        }}
        console.log('[{pillar}Page] CMS config loaded');
      }}
    }} catch (error) {{
      console.error('[{pillar}Page] Failed to fetch CMS config:', error);
    }}
  }};
'''

def add_cms_to_page(pillar):
    """Add CMS integration to a pillar page"""
    filepath = f'/app/frontend/src/pages/{pillar}Page.jsx'
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already has CMS
    if 'fetchCMSConfig' in content:
        print(f"{pillar}Page already has CMS integration")
        return True
    
    config = PILLAR_CONFIGS.get(pillar)
    if not config:
        print(f"No config for {pillar}")
        return False
    
    pillar_lower = pillar.lower()
    title_fallback = config['title'].replace('{petName}', '${activePet?.name || "your pet"}')
    
    cms_state = CMS_STATE_TEMPLATE.format(
        pillar=pillar,
        pillar_lower=pillar_lower,
        title=config['title'],
        subtitle=config['subtitle'],
        placeholder=config['placeholder'],
        buttonColor=config['buttonColor'],
        title_fallback=title_fallback
    )
    
    # Find the position to insert - after "// Scroll to top" useEffect or after useState declarations
    # Look for pattern: useEffect(() => { window.scrollTo(0, 0); }, []);
    scroll_pattern = r'(// Scroll to top.*?\n\s*useEffect\(\(\) => \{\s*window\.scrollTo\(0, 0\);\s*\}, \[\]\);)'
    
    if re.search(scroll_pattern, content, re.DOTALL):
        # Replace the scroll useEffect with CMS state + updated useEffect
        new_scroll = cms_state + '''
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);'''
        content = re.sub(scroll_pattern, new_scroll, content, flags=re.DOTALL)
    else:
        # Try to find just the useEffect with scrollTo
        simple_pattern = r'(useEffect\(\(\) => \{\s*window\.scrollTo\(0, 0\);\s*\}, \[\]\);)'
        if re.search(simple_pattern, content):
            new_scroll = cms_state + '''
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);'''
            content = re.sub(simple_pattern, new_scroll, content)
        else:
            print(f"Could not find scroll useEffect in {pillar}Page")
            return False
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Added CMS integration to {pillar}Page")
    return True

if __name__ == '__main__':
    for pillar in PILLAR_CONFIGS.keys():
        add_cms_to_page(pillar)
