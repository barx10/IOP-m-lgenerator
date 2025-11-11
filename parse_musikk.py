#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import re

# Les Musikk-filen
with open('/Users/kennethbareksten/Downloads/Musikk Kompetansemål 10. trinn.txt', 'r', encoding='cp1252') as f:
    content = f.read()

# Kjerneelementer for Musikk (fra curriculumData.ts)
CORE_ELEMENTS = [
    "Musisere",
    "Komponere",
    "Lytte"
]

def parse_goals():
    result = {
        "name": "Musikk",
        "levels": {
            "2": [],
            "4": [],
            "7": [],
            "10": []
        }
    }
    
    # Split på kompetansemål-seksjoner
    sections = re.split(r'Kompetansem.l etter (\d+)\. trinn', content)
    print(f"Antall seksjoner: {len(sections)}")
    
    for i in range(1, len(sections), 2):
        if i+1 >= len(sections):
            break
            
        level = sections[i]
        goals_text = sections[i+1]
        
        print(f"\n=== Nivå {level} ===")
        
        # Finn alle mål
        lines = goals_text.split('\n')
        goals = []
        current_goal = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if any(skip in line for skip in ['Mål for', 'Side', 'Læreplan', 'https://', 'Læreplankode']):
                continue
                
            # Sjekk om linjen starter med * eller nummer
            match = re.match(r'^(?:\*\s*)?(\d+)\.\s+(.+)', line) or re.match(r'^(\*)\s+(.+)', line)
            if match:
                # Lagre forrige mål
                if current_goal:
                    goals.append(current_goal)
                
                # Start nytt mål
                text = match.group(2)
                current_goal = {
                    "text": text
                }
            elif current_goal and line and not line.startswith('Kompetansem'):
                # Fortsettelse av forrige mål
                current_goal["text"] += " " + line
        
        # Lagre siste mål
        if current_goal:
            goals.append(current_goal)
        
        print(f"Funnet {len(goals)} mål")
        
        # Konverter til riktig format med koder
        goal_objects = []
        base_code = {"2": 1, "4": 5, "7": 10, "10": 19}[level]
        
        for idx, goal in enumerate(goals):
            # Velg 1-2 kjerneelementer
            import random
            num_elements = random.randint(1, 2)
            selected_elements = random.sample(CORE_ELEMENTS, num_elements)
            
            goal_objects.append({
                "code": f"MUS-{base_code + idx:02d}",
                "text": goal["text"],
                "coreElements": selected_elements
            })
        
        result["levels"][level] = goal_objects
        print(f"Nivå {level}: {len(goal_objects)} mål")
    
    return result

# Parse målene
mus_data = parse_goals()

# Les eksisterende JSON
with open('data/competenceGoals.json', 'r', encoding='utf-8') as f:
    all_data = json.load(f)

# Erstatt Musikk
all_data['MUS'] = mus_data

# Skriv tilbake
with open('data/competenceGoals.json', 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print("\n✓ Musikk oppdatert!")
print(f"Totalt: {sum(len(goals) for goals in mus_data['levels'].values())} mål")
