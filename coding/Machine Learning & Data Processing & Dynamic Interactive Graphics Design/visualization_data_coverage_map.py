#!/usr/bin/env python
# coding: utf-8

# In[6]:


import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import Normalize
from mpl_toolkits.axes_grid1 import make_axes_locatable
from matplotlib.lines import Line2D
from adjustText import adjust_text

# 加载数据
df = pd.read_csv('task1.csv')

# 定义议价事件为initial_list_price和sales_price不一致且sales_price不为空
df['bargaining_event'] = (df['initial_list_price'] != df['sales_price']) & (~df['sales_price'].isna())

# 按州统计议价事件数量
state_bargaining = df.groupby('state')['bargaining_event'].sum().reset_index()
state_bargaining['state'] = state_bargaining['state'].str.title()

# 获取美国各州的地理数据
states_gdf = gpd.read_file('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')

# 合并数据
merged = states_gdf.merge(state_bargaining, left_on='name', right_on='state', how='left')
merged['bargaining_event'] = merged['bargaining_event'].fillna(0)

# 创建地图
plt.figure(figsize=(30, 18))
ax = plt.gca()

# 绘制地图
norm = Normalize(vmin=merged['bargaining_event'].min(), vmax=merged['bargaining_event'].max())
merged.plot(column='bargaining_event', cmap='YlOrRd', linewidth=0.8, ax=ax, 
            edgecolor='0.8', legend=False, norm=norm)

# 定义小州列表（需要延长线的州）
small_states = ['Connecticut', 'Delaware', 'Maryland', 'Massachusetts', 
                'New Hampshire', 'New Jersey', 'Rhode Island', 'Vermont', 
                'District of Columbia']

# 准备标注存储
text_objects = []
line_objects = []

def is_position_available(x, y, texts, min_distance=3):
    """检查标注位置是否可用"""
    for t in texts:
        tx, ty = t.get_position()
        if np.sqrt((x - tx)**2 + (y - ty)**2) < min_distance:
            return False
    return True


def add_annotation(ax, x, y, name, value, is_small_state=False):
    if is_small_state:
        # 小州：延长线标注
        offset_multiplier = 6  # 延长线更长
        for angle in np.linspace(0, 2*np.pi, 16, endpoint=False):
            dx, dy = np.cos(angle), np.sin(angle)
            label_x = x + dx * offset_multiplier
            label_y = y + dy * offset_multiplier
            
            if is_position_available(label_x, label_y, text_objects):
                # 绘制延长线
                line = Line2D([x, x + dx*(offset_multiplier-1)], 
                             [y, y + dy*(offset_multiplier-1)],
                             linestyle=(0, (5, 3)), linewidth=0.8, 
                             alpha=0.7, color='gray')
                ax.add_line(line)
                line_objects.append(line)
                
                # 添加标注
                t = ax.text(label_x, label_y, f"{name}\n{value}",
                           ha='center', va='center', fontsize=9,
                           bbox=dict(facecolor='white', alpha=0.95, 
                                    edgecolor='0.4', boxstyle='round,pad=0.3'))
                text_objects.append(t)
                return True
        return False
    else:
        # 大州：直接标注
        if is_position_available(x, y, text_objects):
            t = ax.text(x, y, f"{name}\n{value}",
                       ha='center', va='center', fontsize=10,
                       bbox=dict(facecolor='white', alpha=0.95, 
                                edgecolor='0.4', boxstyle='round,pad=0.3'))
            text_objects.append(t)
            return True
        return False

# 先标注大州
for idx, row in merged.iterrows():
    if row['bargaining_event'] > 0 and row['name'] not in small_states:
        centroid = row['geometry'].centroid
        if not add_annotation(ax, centroid.x, centroid.y, 
                            row['name'], int(row['bargaining_event'])):
            # 备用方案：稍大字号红色标注
            ax.text(centroid.x, centroid.y, f"{row['name']}\n{int(row['bargaining_event'])}",
                   ha='center', va='center', fontsize=10, color='darkred',
                   bbox=dict(facecolor='white', alpha=0.9, edgecolor='darkred'))

# 再标注小州
for idx, row in merged.iterrows():
    if row['bargaining_event'] > 0 and row['name'] in small_states:
        centroid = row['geometry'].centroid
        if not add_annotation(ax, centroid.x, centroid.y, 
                            row['name'], int(row['bargaining_event']), 
                            is_small_state=True):
            # 备用方案：右侧红色标注
            ax.text(centroid.x + 7, centroid.y, f"{row['name']}\n{int(row['bargaining_event'])}",
                   ha='left', va='center', fontsize=8, color='darkred',
                   bbox=dict(facecolor='white', alpha=0.9, edgecolor='darkred'))

# 优化标注位置
adjust_text(text_objects,
           arrowprops=dict(arrowstyle='-', color='gray', lw=0.7, alpha=0.5),
           expand_points=(2, 2),
           expand_text=(2, 2),
           force_text=(0.8, 0.8),
           only_move={'text': 'xy'},
           ax=ax)

# 颜色条添加
divider = make_axes_locatable(ax)
cax = divider.append_axes("right", size="5%", pad=0.02)
sm = plt.cm.ScalarMappable(cmap='YlOrRd', norm=norm)
sm._A = []
cbar = plt.colorbar(sm, cax=cax, label='Number of Bargaining Events')
cbar.ax.yaxis.set_label_position('left')

# 设置标题
plt.title('Geographical Distribution of Bargaining Events in U.S. Real Estate Listings\n', 
          fontsize=22, pad=30, loc='center', x=0.2, weight='bold')
ax.axis('off')

# 保存地图
static_path = r'C:\Users\12539\Desktop\初稿RAtest\bargaining_distribution_final_corrected_1.png'
plt.savefig(static_path, dpi=300, bbox_inches='tight')
plt.close()

print(f"最终地图已保存至: {static_path}")


# In[ ]:




