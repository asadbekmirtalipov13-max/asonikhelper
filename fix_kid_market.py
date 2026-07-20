import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace('doc(db, "market", promo.productId)', 'doc(db, "marketplace", promo.productId)')

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
