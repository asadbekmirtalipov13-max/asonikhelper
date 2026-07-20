import re

with open('src/types.ts', 'r') as f:
    content = f.read()

chore_def_regex = r'executionLimitMinutes\?: number; // Completion time limit set by parent \(defaults to 60\)'
new_chore_def = """executionLimitMinutes?: number; // Completion time limit set by parent (defaults to 60)
  isWeekly?: boolean;
  weeklyProgress?: string[]; // Array of image URLs
  weeklyDaysLogged?: number; // Count of completed days
  lastWeeklySubmission?: string; // YYYY-MM-DD string to track if submitted today"""

content = content.replace(chore_def_regex, new_chore_def)

with open('src/types.ts', 'w') as f:
    f.write(content)
