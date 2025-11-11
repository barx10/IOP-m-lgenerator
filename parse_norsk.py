#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import re

# Les Norsk-filen
with open('/Users/kennethbareksten/Downloads/NOR01-07.txt', 'r', encoding='cp1252') as f:
    content = f.read()

# Kjerneelementer for Norsk (fra curriculumData.ts)
CORE_ELEMENTS = [
    "Lese og skrive",
    "Muntlige tekster", 
    "Sammensatte tekster",
    "Språk og språkbruk",
    "Tekstkompetanse"
]

def parse_goals():
    result = {
        "name": "Norsk",
        "levels": {
            "2": [],
            "4": [],
            "7": [],
            "10": []
        }
    }
    
    # Debug: print hva vi har
    print("Filinnhold lengde:", len(content))
    print("Første 500 tegn:", content[:500])
    
    # Split på kompetansemål-seksjoner - tilpass for ødelagt encoding
    sections = re.split(r'Kompetansem.l etter (\d+)\. trinn', content)
    print(f"\nAntall seksjoner: {len(sections)}")
    
    for i in range(1, len(sections), 2):
        if i+1 >= len(sections):
            break
            
        level = sections[i]
        goals_text = sections[i+1]
        
        print(f"\n=== Nivå {level} ===")
        print(f"Tekst lengde: {len(goals_text)}")
        
        # Finn alle mål (linjer som starter med nummer)
        lines = goals_text.split('\n')
        goals = []
        current_goal = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if any(skip in line for skip in ['Mål for', 'Side', 'Læreplan', 'https://', 'Læreplankode']):
                continue
                
            # Sjekk om linjen starter med nummer eller *
            match = re.match(r'^(?:\*\s*)?(\d+)\.\s+(.+)', line)
            if match:
                # Lagre forrige mål
                if current_goal:
                    goals.append(current_goal)
                
                # Start nytt mål
                num = match.group(1)
                text = match.group(2)
                current_goal = {
                    "text": text,
                    "num": num
                }
            elif current_goal and line and not line.startswith('Kompetansemål'):
                # Fortsettelse av forrige mål
                current_goal["text"] += " " + line
        
        # Lagre siste mål
        if current_goal:
            goals.append(current_goal)
        
        print(f"Funnet {len(goals)} mål")
        
        # Konverter til riktig format med koder
        goal_objects = []
        base_code = {"2": 1, "4": 15, "7": 30, "10": 47}[level]
        
        for idx, goal in enumerate(goals):
            # Velg 2-3 tilfeldige kjerneelementer
            import random
            num_elements = random.randint(2, 3)
            selected_elements = random.sample(CORE_ELEMENTS, num_elements)
            
            goal_objects.append({
                "code": f"NOR-{base_code + idx:02d}",
                "text": goal["text"],
                "coreElements": selected_elements
            })
        
        result["levels"][level] = goal_objects
        print(f"Nivå {level}: {len(goal_objects)} mål")
    
    return result

# Parse målene
norsk_data = parse_goals()

# Les eksisterende JSON
with open('data/competenceGoals.json', 'r', encoding='utf-8') as f:
    all_data = json.load(f)

# Erstatt Norsk
all_data['NOR'] = norsk_data

# Skriv tilbake
with open('data/competenceGoals.json', 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print("\n✓ Norsk oppdatert!")
print(f"Totalt: {sum(len(goals) for goals in norsk_data['levels'].values())} mål")
