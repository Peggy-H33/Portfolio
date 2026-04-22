import pandas as pd
import numpy as np

def to_mean(p_range):
    try:
        lower, upper = map(float, p_range.split('-'))
        return (lower + upper) / 2
    except:
        return None

rice_index = [16]
rab_index = list(range(35, 38))
fu_index = list(range(38, 42))
rrf_index = rice_index + rab_index + fu_index

df_size = pd.read_csv('CropSizeExtend.csv')
data_size = df_size[df_size['作物编号'].isin(rrf_index)]
df_sale = pd.read_excel('file2.xlsx', sheet_name=1, nrows=108)
data_sale = df_sale[df_sale['作物编号'].isin(rrf_index)]

rows_rice = []
rows_rab = []
rows_fu = []

# 对于 Fd_11 进行处理
for crop_id in rice_index:
    crop_data = data_sale[data_sale['作物编号'] == crop_id]
    row = {
        '作物编号': crop_id,
        '作物名称': crop_data['作物名称'].iloc[0],
        'Y(D)': crop_data[crop_data['地块类型'] == '水浇地']['亩产量/斤'].values[0],
        'C': crop_data['种植成本/(元/亩)'].iloc[0],
        'P': crop_data['销售单价/(元/斤)'].iloc[0]
    }
    rows_rice.append(row)

df_rice = pd.DataFrame(rows_rice)

# 计算 Y = D2 * Y(D2)
merged_df = pd.merge(df_rice, data_size[['作物编号', 'D']], on='作物编号')
merged_df['Y'] = merged_df['D'] * merged_df['Y(D)']
df_rice['Y'] = merged_df['Y']
df_rice['S_max'] = (df_rice['Y'] / df_rice['Y(D)']).round(1)
df_rice['S_min'] = (df_rice['Y'] / df_rice['Y(D)']).round(1)
df_rice['S'] = data_size['总种植面积'].iloc[0]

# 对于 Veg_16,17,18 进行处理
for crop_id in rab_index:
    crop_data = data_sale[data_sale['作物编号'] == crop_id]
    row = {
        '作物编号': crop_id,
        '作物名称': crop_data['作物名称'].iloc[0],
        'Y(D2)': crop_data[crop_data['地块类型'] == '水浇地']['亩产量/斤'].values[0],
        'C(D2)': crop_data[crop_data['地块类型'] == '水浇地']['种植成本/(元/亩)'].values[0],
        'P(D2)': crop_data[crop_data['地块类型'] == '水浇地']['销售单价/(元/斤)'].values[0],
    }
    rows_rab.append(row)

df_rab = pd.DataFrame(rows_rab)

#计算 Y = D2 * Y(D2)
merged_df = pd.merge(df_rab, data_size[['作物编号', 'D']], on='作物编号')
merged_df['Y'] = merged_df['D'] * merged_df['Y(D2)']
df_rab['Y'] = merged_df['Y']
df_rab['S_max'] = (df_rab['Y'] / df_rab['Y(D2)']).round(1)
df_rab['S_min'] = (df_rab['Y'] / df_rab['Y(D2)']).round(1)
df_rab['S'] = data_size['总种植面积'].iloc[1:4].reset_index(drop=True)

# 对于 Fu_1,2,3,4 进行处理
for crop_id in fu_index:
    crop_data = data_sale[data_sale['作物编号'] == crop_id]
    row = {
        '作物编号': crop_id,
        '作物名称': crop_data['作物名称'].iloc[0],
        'Y(E2)': crop_data[crop_data['地块类型'].str.strip() == '普通大棚']['亩产量/斤'].values[0],
        'C(E2)': crop_data[crop_data['地块类型'].str.strip() == '普通大棚']['种植成本/(元/亩)'].values[0],
        'P(E2)': crop_data[crop_data['地块类型'].str.strip() == '普通大棚']['销售单价/(元/斤)'].values[0],
    }
    rows_fu.append(row)

df_fu = pd.DataFrame(rows_fu)

#计算 E = E * Y(E2)
merged_df = pd.merge(df_fu, data_size[['作物编号', 'E']], on='作物编号')
merged_df['Y'] = merged_df['E'] * merged_df['Y(E2)']
df_fu['Y'] = merged_df['Y']
df_fu['S_max'] = (df_fu['Y'] / df_fu['Y(E2)']).round(1)
df_fu['S_min'] = (df_fu['Y'] / df_fu['Y(E2)']).round(1)
df_fu['S'] = data_size['总种植面积'].iloc[4:].reset_index(drop=True)

df_rice['P'] = df_rice['P'].apply(to_mean)
df_rab['P(D2)'] = df_rab['P(D2)'].apply(to_mean)
df_fu['P(E2)'] = df_fu['P(E2)'].apply(to_mean)

# 结果
df_rice.to_csv('data_rice_fd.txt', sep=' ', encoding='utf-8', index=False)
df_rab.to_csv('data_rab_veg.txt', sep=' ', encoding='utf-8', index=False)
df_fu.to_csv('data_fu.txt', sep=' ', encoding='utf-8', index=False)
