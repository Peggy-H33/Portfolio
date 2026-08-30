import pandas as pd
import numpy as np

def to_mean(p_range):
    try:
        # 分割范围字符串并计算均值
        lower, upper = map(float, p_range.split('-'))
        return (lower + upper) / 2
    except:
        return None

def get_land_plot_type(row):
    if row['地块基础类型'] == 'F':
        return f"{row['地块基础类型']}{1 if row['种植季次'] == '第一季' else 2}"
    else:
        return row['地块基础类型']

file_path = 'file2.xlsx'
df = pd.read_excel(file_path, sheet_name=0)
df['种植地块'] = df['种植地块'].ffill()
df['地块基础类型'] = df['种植地块'].str[0]
df['地块类型'] = df.apply(get_land_plot_type, axis=1)

df_1 = pd.read_csv('Fields_Size_Vec.csv')
mapping = dict(zip(df_1['地块名称'], df_1['地块面积/亩']))
df['地块面积/亩'] = df['种植地块'].map(mapping)
df[['种植地块', '地块类型', '地块基础类型', '地块面积/亩']].to_csv('Fields_Size_Vec_Extend.csv', index=False)

area_by_crop = df.groupby(['作物编号', '地块类型'])['种植面积/亩'].sum().unstack(fill_value=0)
area_by_crop['总种植面积'] = area_by_crop.sum(axis=1)
area_by_crop.round(1).to_csv('CropSizeExtend.csv', encoding='utf-8')

fv_index = list(range(6, 16)) + list(range(20, 35))
fd_index = list(range(6, 16))
veg_index = list(range(20, 35))

df_size = pd.read_csv('CropSizeExtend.csv')
data_size = df_size[df_size['作物编号'].isin(fv_index)]
df_sale = pd.read_excel('file2.xlsx', sheet_name=1, nrows=108)
data_sale = df_sale[df_sale['作物编号'].isin(fv_index)]

rows_abc = []
rows_def = []

# 对于常规 Fd 进行处理
for crop_id in fd_index:
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

# 对于常规 Veg 进行处理
for crop_id in veg_index:
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

df_fd = pd.DataFrame(rows_abc)
df_veg = pd.DataFrame(rows_def)

# 计算 Y = A * Y(A) + B * Y(B) + C * Y(C)
merged_df = pd.merge(df_fd, data_size[['作物编号', 'A', 'B', 'C']], on='作物编号')
merged_df['Y'] = merged_df['A'] * merged_df['Y(A)'] + merged_df['B'] * merged_df['Y(B)'] + merged_df['C_y'] * merged_df['Y(C)']
# merged_df['Y'] = merged_df['A'] * merged_df['Y(A)'] + merged_df['B'] * merged_df['Y(B)'] + merged_df['C'] * merged_df['Y(C)']
df_fd['Y'] = merged_df['Y']

# 计算 Y = D * Y(D1) + E * Y(E1) + F1 * Y(E1) + F2 * Y(F2)
# 注意 Y(E1) = Y(F1)
merged_df = pd.merge(df_veg, data_size[['作物编号', 'D', 'E', 'F1', 'F2']], on='作物编号')
merged_df['Y'] = merged_df['D'] * merged_df['Y(D1)'] + merged_df['E'] * merged_df['Y(E1)'] + merged_df['F1'] * merged_df['Y(E1)'] + merged_df['F2'] * merged_df['Y(F2)']
df_veg['Y'] = merged_df['Y']

data_size = data_size.reset_index(drop=True)
# 计算种植 作物的最大 / 最小种植亩数需求
# 这里仍然可以发现 Y(C) 最小 Y(A) 最大; Y(D1) 最小 Y(E1) 最大
df_fd['S_max'] = (df_fd['Y'] / df_fd['Y(C)']).round(1)
df_fd['S_min'] = (df_fd['Y'] / df_fd['Y(A)']).round(1)
df_fd['S'] = data_size['总种植面积'].iloc[0:10]
df_veg['S_max'] = (df_veg['Y'] / df_veg['Y(D1)']).round(1)
df_veg['S_min'] = (df_veg['Y'] / df_veg['Y(E1)']).round(1)
df_veg['S'] = data_size['总种植面积'].iloc[10:].reset_index(drop=True)

# 销售区间转化为平均值
df_fd['P'] = df_fd['P'].apply(to_mean)
df_veg['P(D1)'] = df_veg['P(D1)'].apply(to_mean)
df_veg['P(E1)'] = df_veg['P(E1)'].apply(to_mean)
df_veg['P(F2)'] = df_veg['P(F2)'].apply(to_mean)

# 结果
df_fd.to_csv('data_common_fd.txt', sep=' ', encoding='utf-8', index=False)
df_veg.to_csv('data_common_veg.txt', sep=' ', encoding='utf-8', index=False)
