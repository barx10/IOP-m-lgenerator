#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os

# Mapping av filnavn til fagkoder
FILE_TO_CODE = {
    'norsk.txt': 'NOR',
    'matematikk.txt': 'MAT',
    'engelsk.txt': 'ENG',
    'krle.txt': 'KRL',
    'kroppsoving.txt': 'KRO',
    'kunst.txt': 'KHV',
    'musikk.txt': 'MUS',
    'mat.txt': 'MAH',
    'naturfag.txt': 'NAT',
    'samfunnsfag.txt': 'SAF'
}

# Les alle filer og kombiner til ett objekt
all_subjects = {}

for filename, code in FILE_TO_CODE.items():
    filepath = os.path.join('data', 'curriculum_sources', filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8-sig', errors='replace') as f:
            content = f.read()
            
        # Fjern eventuelle ledende/trailing komma og whitespace
        content = content.strip()
        
        # Fjern ledende }, og whitespace (men behold { hvis den finnes)
        while content and content[0] in '},\n\r\t ' and content[0] != '{':
            content = content[1:]
            
        # Wrap i krøllparenteser hvis ikke allerede
        if not content.startswith('{'):
            content = '{' + content.strip() + '}'
            
        # Parse JSON
        data = json.loads(content)
        
        # Finn fagdata (kan være direkte eller nested)
        if code in data:
            all_subjects[code] = data[code]
        elif len(data) == 1:
            # Ta det første (og eneste) objektet
            key = list(data.keys())[0]
            all_subjects[code] = data[key]
        else:
            print(f"⚠️  Kunne ikke finne data for {code} i {filename}")
            
        print(f"✓ Lastet {code} ({filename})")
        
    except Exception as e:
        print(f"✗ Feil ved lesing av {filename}: {e}")

# Skriv til competenceGoals.json
output_path = os.path.join('data', 'competenceGoals.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_subjects, f, ensure_ascii=False, indent=2)

print(f"\n✓ Alle fag kombinert til {output_path}")
print(f"Totalt {len(all_subjects)} fag:")
for code in sorted(all_subjects.keys()):
    name = all_subjects[code].get('name', code)
    total_goals = sum(len(goals) for goals in all_subjects[code]['levels'].values())
    print(f"  - {code}: {name} ({total_goals} kompetansemål)")
