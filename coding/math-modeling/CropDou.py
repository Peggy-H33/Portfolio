import pandas as pd
import numpy as np

def bin_a(indices, length=26):
    binary_array = np.zeros(length, dtype=int)
    # 将指定索引位置设置为 1
    binary_array[indices] = 1
    return binary_array

def to_mean(p_range):
    try:
        # 分割范围字符串并计算均值
        lower, upper = map(float, p_range.split('-'))
        return (lower + upper) / 2
    except:
        return None

dou_index = [1, 2, 3, 4, 5, 17, 18, 19]
fd_dou_id = [1, 2, 3, 4, 5]

df_size = pd.read_csv('CropSize.csv')
data_size = df_size[df_size['作物编号'].isin(dou_index)]
df_sale = pd.read_excel('file2.xlsx', sheet_name=1, nrows=108)
data_sale = df_sale[df_sale['作物编号'].isin(dou_index)]

df_d_0 = pd.read_excel('file2.xlsx', sheet_name=0, nrows=88)
df_d_0['种植地块'] = df_d_0['种植地块'].ffill()
df_d = df_d_0[df_d_0['作物类型'].isin(['粮食（豆类）', '蔬菜（豆类）'])]
df_d['Class'] = df_d['种植地块'].str[0]
df_dfd = df_d[df_d['Class'].isin(['A', 'B', 'C'])]
df_dveg = df_d[df_d['Class'].isin(['D', 'E', 'F'])]

dfd_vecs = []
for i in range(5):
    dfd_vec = bin_a(df_dfd[df_dfd['作物编号'] == i + 1].index)
    dfd_vecs.append(dfd_vec)
dfd_vecs = np.array(dfd_vecs)
np.savetxt('dfd_vecs.txt', dfd_vecs, fmt='%d')

rows_abc = []
rows_def = []

# 对作物编号 1, 2, 3, 4, 5 进行处理
for crop_id in [1, 2, 3, 4, 5]:
    crop_data = data_sale[data_sale['作物编号'] == crop_id]
    row = {
        '作物编号': crop_id,
        '作物名称': crop_data['作物名称'].iloc[0],
        'Y(A)': crop_data[crop_data['地块类型'] == '平旱地']['亩产量/斤'].values[0],
        'Y(B)': crop_data[crop_data['地块类型'] == '梯田']['亩产量/斤'].values[0],
        'Y(C)': crop_data[crop_data['地块类型'] == '山坡地']['亩产量/斤'].values[0],
        'C': crop_data['种植成本/(元/亩)'].iloc[0],
        'P': crop_data['销售单价/(元/斤)'].iloc[0]
    }
    rows_abc.append(row)

# 对作物编号 17, 18, 19 进行处理
for crop_id in [17, 18, 19]:
    crop_data = data_sale[data_sale['作物编号'] == crop_id]
    row = {
        '作物编号': crop_id,
        '作物名称': crop_data['作物名称'].iloc[0],
        'Y(D1)': crop_data[crop_data['地块类型'] == '水浇地']['亩产量/斤'].values[0],
        'C(D1)': crop_data[crop_data['地块类型'] == '水浇地']['种植成本/(元/亩)'].values[0],
        'P(D1)': crop_data[crop_data['地块类型'] == '水浇地']['销售单价/(元/斤)'].values[0],
        'Y(E1)': crop_data[crop_data['地块类型'].str.strip() == '普通大棚']['亩产量/斤'].values[0],
        'C(E1)': crop_data[crop_data['地块类型'].str.strip() == '普通大棚']['种植成本/(元/亩)'].values[0],
        'P(E1)': crop_data[crop_data['地块类型'].str.strip() == '普通大棚']['销售单价/(元/斤)'].values[0],
        'Y(F2)': crop_data[crop_data['地块类型'] == '智慧大棚']['亩产量/斤'].values[0],
        'C(F2)': crop_data[crop_data['地块类型'] == '智慧大棚']['种植成本/(元/亩)'].values[0],
        'P(F2)': crop_data[crop_data['地块类型'] == '智慧大棚']['销售单价/(元/斤)'].values[0]
    }
    rows_def.append(row)

df_abc = pd.DataFrame(rows_abc)
df_def = pd.DataFrame(rows_def)

# 计算 Y = A * Y(A) + B * Y(B) + C * Y(C)
merged_df = pd.merge(df_abc, data_size[['作物编号', 'A', 'B', 'C']], on='作物编号')
merged_df['Y'] = merged_df['A'] * merged_df['Y(A)'] + merged_df['B'] * merged_df['Y(B)'] + merged_df['C_y'] * merged_df['Y(C)']
# merged_df['Y'] = merged_df['A'] * merged_df['Y(A)'] + merged_df['B'] * merged_df['Y(B)'] + merged_df['C'] * merged_df['Y(C)']
df_abc['Y'] = merged_df['Y']
df_abc['P'] = df_abc['P'].apply(to_mean)

# 计算 Y = D * Y(D1) + E * Y(E1) + F * Y(E1)
# 注意数据中: 2023 年所有种植在智慧大棚中的豆类作物都是智慧大棚第一季
merged_df = pd.merge(df_def, data_size[['作物编号', 'D', 'E', 'F']], on='作物编号')
merged_df['Y'] = merged_df['D'] * merged_df['Y(D1)'] + merged_df['E'] * merged_df['Y(E1)'] + merged_df['F'] * merged_df['Y(E1)']
df_def['Y'] = merged_df['Y']
df_def['P(D1)'] = df_def['P(D1)'].apply(to_mean)
df_def['P(E1)'] = df_def['P(E1)'].apply(to_mean)
df_def['P(F2)'] = df_def['P(F2)'].apply(to_mean)

# 计算种植 5 种豆类作物的最大 / 最小种植亩数需求
df_abc['S_max'] = (df_abc['Y'] / df_abc['Y(C)']).round(1)
df_abc['S_min'] = (df_abc['Y'] / df_abc['Y(A)']).round(1)
df_abc['S'] = data_size['总种植面积'].iloc[0:5]
# 计算种植 3 类豆类作物的最大 / 最小种植亩数需求
df_def['S_max'] = (df_def['Y'] / df_def['Y(D1)']).round(1)
df_def['S_min'] = (df_def['Y'] / df_def['Y(E1)']).round(1)
df_def['S'] = data_size['总种植面积'].iloc[5:].reset_index(drop=True)

# 结果
df_abc.to_csv('data_dou_abc.txt', sep=' ', encoding='utf-8', index=False)
df_def.to_csv('data_dou_def.txt', sep=' ', encoding='utf-8', index=False)
