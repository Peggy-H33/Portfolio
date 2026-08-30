import pulp
import numpy as np
import pandas as pd

def solve_problem(I, T, S, beta, S_min, S_max, Q_initial):
    # 创建 pulp 的 LpProblem 实例
    prob = pulp.LpProblem("BinaryTensorOptimization", pulp.LpMinimize)
    # 创建决策变量 q_its (I x T x S)
    q = pulp.LpVariable.dicts("q", ((i, t, s) for i in range(I) for t in range(T) for s in range(S)),
                              cat="Binary")
    # 设置目标函数为 0 (没有明确的优化目标)
    prob += 0
    # 添加约束条件：
    # 1. 对于 t=1,...,6 保证 sum(q_{its} for t=t,...,t+2) >= 1
    for i in range(I):
        for s in range(S):
            for t in range(6):  # t=1 到 t=6
                prob += pulp.lpSum([q[i, t_, s] for t_ in range(t, min(t+3, T))]) >= 1
    # 2. 对于 t=1,...,7 保证 sum(q_{its} for t=t,...,t+1) <= 1
    for i in range(I):
        for s in range(S):
            for t in range(7):  # t=1 到 t=7
                prob += pulp.lpSum([q[i, t_, s] for t_ in range(t, min(t+2, T))]) <= 1
    # 3. 对于 i=1,...,I 和 t=2,...,8 保证 S_min <= sum(q_{its} * beta_s for s) <= S_max
    for i in range(I):
        for t in range(1, 8):  # t=2 到 t=8
            prob += pulp.lpSum([q[i, t, s] * beta[s] for s in range(S)]) >= S_min[i]
            prob += pulp.lpSum([q[i, t, s] * beta[s] for s in range(S)]) <= S_max[i]
    
    # 确定 q_{i1s} 的初始值
    for i in range(I):
        for s in range(S):
            prob += q[i, 0, s] == Q_initial[i, 0, s]
    # 为 t=8 添加约束条件 (以确保该步的 q 值存在)
    for i in range(I):
        for s in range(S):
            prob += pulp.lpSum([q[i, T-1, s]]) >= 0  # 添加非负约束
    # 求解问题
    prob.solve()

    # 打印求解器状态
    print(f"Solver Status: {pulp.LpStatus[prob.status]}")
    
    if pulp.LpStatus[prob.status] != 'Optimal':
        print("No optimal solution found.")
        return None
    
    # 提取解并存储在列表中
    solution = np.zeros((I, T, S), dtype=int)
    for i in range(I):
        for t in range(T):
            for s in range(S):
                # 检查 q[i, t, s] 是否有定义值
                q_value = pulp.value(q[i, t, s])
                if q_value is None:
                    print(f"Variable q[{i},{t},{s}] is None, check your constraints.")
                    return None
                solution[i, t, s] = int(q_value)

    return solution

def distribute_values(dou_size, T_row):
    non_zero_indices = np.where(T_row > 0)[0]
    total = dou_size
    new_row = np.zeros_like(T_row)

    # 找到每个非零位置的最大可填充值
    max_fill = T_row[non_zero_indices]

    # 初始化填充值，保证每个位置非零，先分配一个很小的初始值
    initial_fill = np.full(len(non_zero_indices), 0.01)

    # 剩余的值需要分配
    remaining_total = total - np.sum(initial_fill)

    # 分配剩余的值，但保证不超过T_row的相应位置并且总和是dou_size
    fill_values = np.random.rand(len(non_zero_indices))
    fill_values = fill_values / fill_values.sum() * remaining_total

    # 确保填充的值不超过对应位置的最大值
    fill_values = np.minimum(fill_values + initial_fill, max_fill)

    # 如果仍然没达到total，按比例调整填充
    while np.sum(fill_values) < total:
        remaining = total - np.sum(fill_values)
        adjustment = np.random.rand(len(non_zero_indices))
        adjustment = adjustment / adjustment.sum() * remaining
        fill_values = np.minimum(fill_values + adjustment, max_fill)

    # 将计算出的值填充到new_row中
    new_row[non_zero_indices] = fill_values
    return new_row

def create_new_T(dou_size, T_dou):
    new_T = np.zeros_like(T_dou)

    for i in range(len(dou_size)):
        new_T[i] = distribute_values(dou_size[i], T_dou[i])

    return new_T

df = pd.read_csv('../Data/Fields_Size_Vec.csv')
beta = df["地块面积/亩"][:26].values
df_S = pd.read_csv('../Data/data_dou_abc.txt', sep='\s+')
df_dfd = df_S[['S_max', 'S_min', 'S']]
df_dfd['S_'] = (df_dfd['S_max'] + df_dfd['S_min']) / 2
df_Fd = pd.read_csv('../Data/Fields_Fd.txt', sep='\s+')
S_max = df_S["S_max"].values
S_min = df_S["S_min"].values

# 调整 S_max 和 S_min
delta1 = 0.1
delta2 = 20
S_max = S_max * (1 + delta2)
S_min = S_min * (1 - delta1)

I = 5  # 样本数量
T = 8  # 时间步数
S = 26  # 维度

Q_initial = np.loadtxt('../Data/dfd_vecs.txt', dtype=int).reshape(5,1,-1)

# 求解问题
solution = solve_problem(I, T, S, beta, S_min, S_max, Q_initial)
print(solution)

T_dou = []
T_dou_size = []
for i in range(T):
    T_dou.append(solution[:,i,:] * beta)
for i in range(T):
    for j in range(I):
        T_dou_size.append(T_dou[i][j].sum())

dou_size = df_dfd['S_'].values

DouScheme = []
for i in range(1, 8):
    DouScheme.append(create_new_T(dou_size, T_dou[i]))
    print(f'{i} finished')

DouScheme = np.array(DouScheme)
