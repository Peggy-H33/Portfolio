import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns

# 附件 2
file_path = 'file2.xlsx'
df = pd.read_excel(file_path, sheet_name=0)
df['种植地块'] = df['种植地块'].ffill()

# 提取地块类型（A,B,C,D,E,F）
df['地块类型'] = df['种植地块'].str[0]
df[['种植地块', '地块类型']].to_csv('FieldIndex.csv', index=False)

# 按作物编号和地块类型分类并计算种植面积
area_by_crop = df.groupby(['作物编号', '地块类型'])['种植面积/亩'].sum().unstack(fill_value=0)

plt.rcParams['font.family'] = 'SimHei'

# 热力图
sns.set(style="whitegrid")
plt.figure(figsize=(10, 6))
sns.heatmap(area_by_crop, annot=True, cmap="YlGnBu", cbar=True)
# plt.title('不同地块类型上各作物编号的种植面积分布')
# plt.xlabel('地块类型')
# plt.ylabel('作物编号')
plt.title('Block\'s Size')
plt.xlabel('Block Types')
plt.ylabel('Crop Types')
plt.tight_layout()
plt.show()

area_by_crop['总种植面积'] = area_by_crop.sum(axis=1)
output_file = 'CropSize.txt'
area_by_crop.round(1).to_csv(output_file, sep='\t', encoding='utf-8')
area_by_crop.round(1).to_csv('CropSize.csv', encoding='utf-8')

plt.rcParams['font.family'] = 'SimHei'

# 层叠图
plt.figure(figsize=(10, 6))
area_by_crop.drop(columns=['总种植面积']).plot(kind='bar', stacked=True, colormap='Paired', figsize=(12, 7))
plt.title('各作物在不同地块上的种植面积层叠图')
plt.xlabel('作物编号')
plt.ylabel('种植面积 (亩)')
plt.xticks(rotation=45, ha='right')
plt.legend(title="地块类型", bbox_to_anchor=(1.05, 1), loc='upper left')
plt.tight_layout()
plt.savefig("CropSize.png", bbox_inches="tight")
plt.show()
