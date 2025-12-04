#!/usr/bin/env python3
"""
Code Efficiency and Logic Contradiction Audit
Analyzes backend code for efficiency improvements and logic issues
"""

import os
import re
from pathlib import Path

class CodeAuditor:
    def __init__(self):
        self.issues = []
        self.suggestions = []
        self.backend_path = Path("/app/backend")
        
    def audit(self):
        """Run all audit checks"""
        print("🔍 Starting Code Efficiency & Logic Audit...\n")
        
        # Analyze main files
        self.analyze_server()
        self.analyze_ae_engine()
        self.analyze_config()
        
        # Generate report
        self.generate_report()
    
    def analyze_server(self):
        """Analyze server.py for efficiency issues"""
        print("📄 Analyzing server.py...")
        server_path = self.backend_path / "server.py"
        
        with open(server_path, 'r') as f:
            content = f.read()
            lines = content.split('\n')
        
        # Check 1: Redundant database calls
        db_calls = re.findall(r'await db\.\w+\.', content)
        if len(db_calls) > 50:
            self.suggestions.append({
                'file': 'server.py',
                'type': 'Efficiency',
                'issue': f'High number of DB calls ({len(db_calls)})',
                'suggestion': 'Consider adding caching layer for frequently accessed data'
            })
        
        # Check 2: Missing indexes hints in queries
        if 'find_one' in content:
            find_one_count = content.count('find_one')
            self.suggestions.append({
                'file': 'server.py',
                'type': 'Info',
                'issue': f'{find_one_count} find_one queries found',
                'suggestion': 'Ensure all queried fields are indexed in MongoDB'
            })
        
        # Check 3: Error handling consistency
        try_blocks = content.count('try:')
        endpoints_count = content.count('@app.post') + content.count('@app.get')
        
        if try_blocks < endpoints_count * 0.5:
            self.issues.append({
                'file': 'server.py',
                'type': 'Logic',
                'issue': f'Only {try_blocks} try blocks for {endpoints_count} endpoints',
                'suggestion': 'Consider adding error handling to more endpoints'
            })
        
        # Check 4: Duplicate code patterns
        get_user_patterns = re.findall(r'db\.users\.find_one.*"email"', content)
        if len(get_user_patterns) > 3:
            self.suggestions.append({
                'file': 'server.py',
                'type': 'Efficiency',
                'issue': f'User lookup by email repeated {len(get_user_patterns)} times',
                'suggestion': 'Consider creating a helper function get_user_by_email()'
            })
    
    def analyze_ae_engine(self):
        """Analyze ae_engine_v2.py for efficiency"""
        print("📄 Analyzing ae_engine_v2.py...")
        ae_path = self.backend_path / "ae_engine_v2.py"
        
        with open(ae_path, 'r') as f:
            content = f.read()
            lines = content.split('\n')
        
        # Check 1: JSON loading efficiency
        json_loads = content.count('json.load')
        if json_loads > 3:
            self.suggestions.append({
                'file': 'ae_engine_v2.py',
                'type': 'Efficiency',
                'issue': f'{json_loads} JSON files loaded',
                'suggestion': 'Consider loading JSON files once at module level or caching'
            })
        
        # Check 2: List comprehension vs loops
        for_loops = content.count('for ')
        list_comps = content.count('[') - content.count('[]')
        
        if for_loops > 10:
            self.suggestions.append({
                'file': 'ae_engine_v2.py',
                'type': 'Efficiency',
                'issue': f'{for_loops} for loops found',
                'suggestion': 'Review if any can be replaced with list comprehensions or numpy operations'
            })
        
        # Check 3: Logic contradictions in age handling
        age_checks = re.findall(r'age\s*[<>=!]+\s*\d+', content)
        if len(age_checks) > 0:
            self.suggestions.append({
                'file': 'ae_engine_v2.py',
                'type': 'Info',
                'issue': f'{len(age_checks)} age comparisons found',
                'suggestion': f'Verify age logic consistency. Using MINIMUM_USER_AGE from config: {age_checks[:3]}'
            })
    
    def analyze_config(self):
        """Analyze config.py"""
        print("📄 Analyzing config.py...")
        config_path = self.backend_path / "config.py"
        
        if not config_path.exists():
            self.issues.append({
                'file': 'config.py',
                'type': 'Logic',
                'issue': 'Config file not found',
                'suggestion': 'Ensure config.py exists and is properly imported'
            })
            return
        
        with open(config_path, 'r') as f:
            content = f.read()
        
        # Check for proper constant definitions
        if 'MINIMUM_USER_AGE' not in content:
            self.issues.append({
                'file': 'config.py',
                'type': 'Logic',
                'issue': 'MINIMUM_USER_AGE not defined',
                'suggestion': 'Add MINIMUM_USER_AGE constant'
            })
    
    def generate_report(self):
        """Generate audit report"""
        print("\n" + "="*80)
        print("📊 CODE EFFICIENCY & LOGIC AUDIT REPORT")
        print("="*80 + "\n")
        
        if self.issues:
            print("❌ ISSUES FOUND:\n")
            for i, issue in enumerate(self.issues, 1):
                print(f"{i}. [{issue['file']}] {issue['type']}")
                print(f"   Issue: {issue['issue']}")
                print(f"   Fix: {issue['suggestion']}\n")
        else:
            print("✅ NO CRITICAL ISSUES FOUND\n")
        
        if self.suggestions:
            print("💡 EFFICIENCY SUGGESTIONS:\n")
            for i, sug in enumerate(self.suggestions, 1):
                print(f"{i}. [{sug['file']}] {sug['type']}")
                print(f"   Finding: {sug['issue']}")
                print(f"   Suggestion: {sug['suggestion']}\n")
        else:
            print("✅ CODE IS OPTIMALLY EFFICIENT\n")
        
        # Summary
        print("="*80)
        print("📈 SUMMARY")
        print("="*80)
        print(f"Critical Issues: {len(self.issues)}")
        print(f"Suggestions: {len(self.suggestions)}")
        print(f"\nOverall Status: {'⚠️ NEEDS ATTENTION' if self.issues else '✅ HEALTHY'}")

if __name__ == "__main__":
    auditor = CodeAuditor()
    auditor.audit()
