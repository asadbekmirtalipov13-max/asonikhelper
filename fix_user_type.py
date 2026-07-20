import re

with open('src/types.ts', 'r') as f:
    content = f.read()

user_def = """  restoresUsedThisMonth?: number;
  lastRestoreMonth?: string;"""

new_user_def = """  restoresUsedThisMonth?: number;
  lastRestoreMonth?: string;
  chestsCount?: number;"""

content = content.replace(user_def, new_user_def)

with open('src/types.ts', 'w') as f:
    f.write(content)
