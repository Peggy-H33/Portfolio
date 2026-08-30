import numpy as np
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns

matplotlib.rcParams['font.family'] = 'SimHei'

# 附件 1
file_path = 'file1.xlsx'
df = pd.read_excel(file_path, sheet_name=0, usecols="A:C")
df2 = pd.read_excel(file_path, sheet_name=1)

# 分类地块为 A, B, C, D, E, F
df['Class'] = df['地块名称'].str[0]
df_Fd = df[df['Class'].isin(['A', 'B', 'C'])].sort_values(by='地块面积/亩', ascending=False)
df_Fd_A = df_Fd[df_Fd['Class'] == 'A']
df_Fd_B = df_Fd[df_Fd['Class'] == 'B']
df_Fd_C = df_Fd[df_Fd['Class'] == 'C']
df_Fd.to_csv('Fields_Fd.txt', sep=' ', encoding='utf-8', index=False)

# 不同地块类型的总面积、块数
total_area_df = df.groupby('Class')['地块面积/亩'].sum().reset_index()
total_area_df.rename(columns={'地块面积/亩': '总地块面积'}, inplace=True)
count_df = df.groupby('Class').size().reset_index(name='地块个数')
grouped_df = pd.merge(total_area_df, count_df, on='Class')
grouped_df.to_csv('Fields_Size_Nums.txt', sep=' ', encoding='utf-8', index=False)

# 不同地块面积占比
plt.figure(figsize=(10, 6))
sns.boxplot(x='Class', y='地块面积/亩', data=df)
plt.title('不同地块类别的面积分布')
plt.xlabel('地块类别')
plt.ylabel('面积 (亩)')
plt.savefig("BlocksSize.png", bbox_inches="tight")
plt.show()

# 创建区间边界
bin_edges = np.linspace(df_Fd['地块面积/亩'].min(), df_Fd['地块面积/亩'].max(), num=5)

plt.rcParams['font.family'] = 'SimHei'

# 直方图
plt.figure(figsize=(10, 6))
sns.histplot(df_Fd['地块面积/亩'], kde=False, bins=bin_edges, color=sns.color_palette('Paired')[0])
plt.title('地块面积/亩 直方图')
plt.xlabel('地块面积/亩')
plt.ylabel('地块数量')
plt.savefig('FieldsFdSize.png', bbox_inches="tight")
plt.show()
