import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

old_buy = """        setOpeningChest(null);
        showAlert("Сундук Открыт! 📦", `Вы открыли сундук и нашли там ${reward} монет! 🎉`);"""

new_buy = """        setOpeningChest({ reward });
        fireConfetti();"""

content = content.replace(old_buy, new_buy)

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
