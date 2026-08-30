import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.cm as cm

def expected_value(attr, t=7, num_samples=10000, up=0.10, bot=0.05):
    if np.isscalar(attr):
        Y_values = np.array([attr])
    else:
        Y_values = attr.values
    
    # 随机生成增长率
    r_values = np.random.uniform(0.05, 0.10, num_samples)
    
    # 计算每个 t 的期望值
    expected_results = []
    
    for i in range(0, t + 1):
        # 计算 (1 + r) 的 i 次方的期望值
        factors = (1 + r_values)**i
        E_factor = np.mean(factors)
        expected_results.append(E_factor)
    
    # 计算每个 t 对应的 E(P)
    results = np.array([Y_values * E for E in expected_results]).T
    
    return results

def plwl(data, labels, title='粮食类作物(非豆类) 2023 - 2030 预期销售量变化(相对于 2023 年)', xlabel='时间', ylabel='预期销售量', fn='FutureCFd.png'):
    assert data.shape[0] == len(labels), "标签数量与数据行数不匹配"
    plt.rcParams['font.family'] = 'SimHei'
    plt.figure(figsize=(10, 6))

    for i, line in enumerate(data):
        plt.plot(line, label=labels[i])

    plt.legend()
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.tight_layout()
    plt.savefig(fn, bbox_inches="tight")
    plt.show()

def psb(array, label_array=None, colormap='Paired', title='粮食类作物年预期需求量变化', fn='FdStacked.png'):
    rows, cols = array.shape
    cmap = plt.get_cmap(colormap)
    colors = cmap(np.linspace(0, 1, rows))
    fig, ax = plt.subplots()
    bottom = np.zeros(cols)
    # 堆叠
    for i in range(rows):
        ax.bar(range(cols), array[i], bottom=bottom, color=colors[i], label=label_array[i])
        bottom += array[i]

    ax.legend(loc='upper left')
    ax.set_title(title)
    ax.set_xlabel('时间')
    ax.set_ylabel('值')
    plt.tight_layout()
    plt.savefig(fn, bbox_inches="tight")
    plt.show()

# fd
df_cfd = pd.read_csv('data_common_fd.txt', sep='\s+')
df_dou_fd = pd.read_csv('data_dou_abc.txt',  sep='\s+')
df_rice = pd.read_csv('data_rice_fd.txt',  sep='\s+')

# veg
df_dou_veg = pd.read_csv('data_dou_def.txt', sep='\s+')
df_cveg = pd.read_csv('data_common_veg.txt', sep='\s+')
df_rab = pd.read_csv('data_rab_veg.txt',  sep='\s+')

# fu
df_fu = pd.read_csv('data_fu.txt',  sep='\s+')

# fd 1, 2
df_2fd = df_cfd.iloc[:2]
# fd \neq 1, 2
df_cfd = df_cfd.iloc[2:].reset_index(drop=True) # c for common

df_fu1 = df_fu.iloc[-1]
df_cfu = df_fu.iloc[0:-1]

### 计算 fd 的变化
# 预期销售量
m_2fd = expected_value(df_2fd['Y'])
m_cfd = expected_value(df_cfd['Y'], up=0.05, bot=-0.05)
m_dfd = expected_value(df_dou_fd['Y'], up=0.05, bot=-0.05)
# 标签
l_2fd = df_2fd['作物名称'].values
l_cfd = df_cfd['作物名称'].values
l_dfd = df_dou_fd['作物名称'].values
# 价格, 稳定
p_2fd = df_2fd['P'].values
p_cfd = df_cfd['P'].values
p_dfd = df_dou_fd['P'].values
# 成本, 稳定
c_2fd = df_2fd['C'].values
c_cfd = df_cfd['C'].values
c_dfd = df_dou_fd['C'].values
# 预期亩产量的变动, 基本稳定
y_2fd = expected_value((df_2fd['Y(A)'] + df_2fd['Y(B)'] + df_2fd['Y(C)'])/3, up=0.1, bot=-0.1)
y_cfd = expected_value((df_cfd['Y(A)'] + df_cfd['Y(B)'] + df_cfd['Y(C)'])/3, up=0.1, bot=-0.1)
y_dfd = expected_value((df_dou_fd['Y(A)'] + df_dou_fd['Y(B)'] + df_dou_fd['Y(C)'])/3, up=0.1, bot=-0.1)

m_fd = np.concatenate((m_2fd, m_cfd, m_dfd), axis=0)
db_m_fd = m_fd - m_fd[:, [0]]# diff base
# diff_m_fd = m_fd[:, 1:] - m_fd[:, :-1]
l_fd = np.concatenate((l_2fd, l_cfd, l_dfd), axis=0)
p_fd = np.concatenate((p_2fd, p_cfd, p_dfd), axis=0)
y_fd = np.concatenate((y_2fd, y_cfd, y_dfd), axis=0)
c_fd = np.concatenate((c_2fd, c_cfd, c_dfd), axis=0)

plwl(db_m_fd, l_fd)
psb(db_m_fd, l_fd)

### 计算 Veg 的变化
# 预期销售量
m_cveg = expected_value(df_cveg['Y'], up=0.05, bot=-0.05)
m_rab = expected_value(df_rab['Y'], up=0.05, bot=-0.05)
m_dou_veg = expected_value(df_dou_veg['Y'], up=0.05, bot=-0.05)
# 标签
l_cveg = df_cveg['作物名称'].values
l_rab = df_rab['作物名称'].values
l_dou_veg = df_dou_veg['作物名称'].values
# 价格
p_cveg = expected_value((df_cveg['P(D1)'] + df_cveg['P(E1)'] + df_cveg['P(F2)'])/ 3, up=0.06, bot=0.04)
p_rab = expected_value(df_rab['P(D2)'], up=0.06, bot=0.04)
p_dou_veg = expected_value((df_cveg['P(D1)'] + df_cveg['P(E1)'] + df_cveg['P(F2)'])/ 3, up=0.06, bot=0.04)
# 成本, 稳定
c_cveg = (df_cveg['C(D1)'] + df_cveg['C(E1)'] + df_cveg['C(F2)'] / 3).values
c_rab = df_rab['C(D2)'].values
c_dou_veg = (df_dou_veg['C(D1)'] + df_dou_veg['C(E1)'] + df_dou_veg['C(F2)'] / 3).values
# 预期亩产量的变动, 基本稳定
y_cveg = expected_value((df_cveg['Y(D1)'] + df_cveg['Y(E1)'] + df_cveg['Y(F2)'])/3, up=0.1, bot=-0.1)
y_rab = expected_value(df_rab['Y(D2)'], up=0.1, bot=-0.1)
y_dou_veg = expected_value((df_dou_veg['Y(D1)'] + df_dou_veg['Y(E1)'] + df_dou_veg['Y(F2)'])/3, up=0.1, bot=-0.1)

m_veg = np.concatenate((m_cveg, m_rab, m_dou_veg), axis=0)
db_m_veg = m_veg - m_veg[:, [0]]# diff base
# diff_m_veg = m_veg[:, 1:] - m_veg[:, :-1]
l_veg = np.concatenate((l_cveg, l_rab, l_dou_veg), axis=0)
p_veg = np.concatenate((p_cveg, p_rab, p_dou_veg), axis=0)
y_veg = np.concatenate((y_cveg, y_rab, y_dou_veg), axis=0)
c_veg = np.concatenate((c_cveg, c_rab, c_dou_veg), axis=0)

plwl(db_m_veg, l_veg, title='蔬菜类作物 2023 - 2030 预期销售量变化(相对于 2023 年)', fn='FutureVeg.png')
psb(db_m_veg, l_veg, title='蔬菜类作物年预期需求量变化', fn='VegStacked.png')

### 计算 Fu 的变化
# 预期销售量
m_fu1 = expected_value(df_fu1['Y(E2)'], up=0.05, bot=-0.05)
m_cfu = expected_value(df_cfu['Y(E2)'], up=0.05, bot=-0.05)
# 标签
l_fu1 = np.array([df_fu1['作物名称']])
l_cfu = df_cfu['作物名称'].values
# 价格
p_fu1 = expected_value(df_fu1['P(E2)'], up=-0.06, bot=-0.04)
p_cfu = expected_value(df_cfu['P(E2)'], up=-0.01, bot=-0.05)
# 成本, 稳定
c_fu1 = np.array([df_fu1['C(E2)']])
c_cfu = df_cfu['C(E2)'].values
# 预期亩产量的变动, 基本稳定
y_fu1 = expected_value(df_fu1['Y(E2)'], up=0.1, bot=-0.1)
y_cfu = expected_value(df_cfu['Y(E2)'], up=0.1, bot=-0.1)

m_fu = np.concatenate((m_fu1, m_cfu), axis=0)
db_m_fu = m_fu - m_fu[:, [0]] # diff base
# diff_m_veg = m_veg[:, 1:] - m_veg[:, :-1]
l_fu = np.concatenate((l_fu1, l_cfu), axis=0)
p_fu = np.concatenate((p_fu1, p_cfu), axis=0)
y_fu = np.concatenate((y_fu1, y_cfu), axis=0)
c_fu = np.concatenate((c_fu1, c_cfu), axis=0)

plwl(db_m_fu, l_fu, title='食用菌作物 2023 - 2030 预期销售量变化(相对于 2023 年)', fn='FutureFu.png')
psb(db_m_fu, l_fu, title='食用菌作物年预期需求量变化', fn='FuStacked.png')

