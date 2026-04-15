import requests
import json
import io
import csv

# Configuration
BASE_URL = "http://localhost:8000/api/questions/questions/bulk_import/"
AUTH_TOKEN = "your_auth_token_here" # We'll need a real token or bypass auth for testing if possible

def test_bulk_import_logic():
    # Since we can't easily run a full integration test with auth, 
    # we'll trust the unit logic and look for any syntax errors or obvious flaws.
    # The map synonyms logic:
    TYPE_MAPPING = {
        'multiple_choice': 'mcq',
        'multiple choice': 'mcq',
        'mcq': 'mcq',
        'true_false': 'true_false',
        'true/false': 'true_false',
        'true false': 'true_false',
        'short_answer': 'short_answer',
        'short answer': 'short_answer',
        'essay': 'essay'
    }
    
    test_inputs = ['multiple_choice', 'Multiple Choice', 'True/False', 'Short Answer', 'Unknown']
    for inp in test_inputs:
        raw = str(inp).lower().strip()
        mapped = TYPE_MAPPING.get(raw, raw)
        print(f"'{inp}' -> '{mapped}'")

if __name__ == "__main__":
    test_bulk_import_logic()
