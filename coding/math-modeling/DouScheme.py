import numpy as np
import pandas as pd

def generate_initial_Q(I, S):
    Q_initial = np.zeros((I, 1, S), dtype=int)  # 只生成第一个时间步的 q_{i1s}

    # 在每个 i 中只生成 2 个 1
    for i in range(I):
        indices = np.random.choice(S, 10, replace=False)  # 随机选择 S 中的 2 个位置
        Q_initial[i, 0, indices] = 1

    return Q_initial

def generate_tensor(I, T, S, beta, S_min, S_max, Q_initial):
    solutions = []
    
    # 递归函数
    def backtrack(Q, i, t, s):
        if i == I:
            solutions.append(np.copy(Q))
            return
        
        # 确定下一个递归的位置
        next_i, next_t, next_s = i, t, s + 1
        if next_s == S:
            next_s = 0
            next_t += 1
        if next_t == T:
            next_t = 0
            next_i += 1
        
        # 如果是初始给定的 q_its，跳过赋值
        if t == 0:
            backtrack(Q, next_i, next_t, next_s)
            return
        
        # 约束条件1: 连续3个时间步内至少有一个q值为1
        def constraint_1(Q, i, t, s):
            if t > 5:  # 不适用
                return True
            valid = sum(Q[i, t:t+3, s]) >= 1
            if not valid:
                print(f"约束1失败: Q[{i}, {t}:{t+3}, {s}] = {Q[i, t:t+3, s]}")
            return valid
        
        # 约束条件2: 连续2个时间步内最多有一个q值为1
        def constraint_2(Q, i, t, s):
            if t > 6:  # 不适用
                return True
            valid = sum(Q[i, t:t+2, s]) <= 1
            if not valid:
                print(f"约束2失败: Q[{i}, {t}:{t+2}, {s}] = {Q[i, t:t+2, s]}")
            return valid
        
        # 约束条件3: 权重和在 S_min 和 S_max 之间
        def constraint_3(Q, i, t):
            if t < 1:  # 不适用，因为从 t=2 开始
                return True
            weighted_sum = np.dot(Q[i, t, :], beta)
            valid = S_min[i] <= weighted_sum <= S_max[i]
            if not valid:
                print(f"约束3失败: Q[{i}, {t}, :] 的加权和 {weighted_sum} 不在 [{S_min[i]}, {S_max[i]}] 范围内")
            return valid
        
        # 尝试为 q_its 赋值
        for value in [0, 1]:
            Q[i, t, s] = value
            
            # 检查约束条件
            if (constraint_1(Q, i, t, s) and
                constraint_2(Q, i, t, s) and
                constraint_3(Q, i, t)):
                backtrack(Q, next_i, next_t, next_s)
        
        # 回溯时恢复
        Q[i, t, s] = 0
    
    # 初始化 Q 张量，扩展为 (I, T, S)
    Q = np.zeros((I, T, S), dtype=int)
    Q[:, 0, :] = Q_initial[:, 0, :]  # 仅复制第一个时间步的值
    
    # 从初始状态开始递归
    backtrack(Q, 0, 1, 0)  # 从 t=1 开始填充
    
    return solutions

# 数据读取
df = pd.read_csv('../Data/Fields_Size_Vec.csv')
beta = df["地块面积/亩"][:26].values
df_S = pd.read_csv('../Data/data_dou_abc.txt', sep='\s+')
S_max = df_S["S_max"].values
S_min = df_S["S_min"].values

# 调整 S_max 和 S_min
delta1 = 0.1
delta2 = 100
S_max = S_max * (1 + delta2)
S_min = S_min * (1 - delta1)

I = 5  # 样本数量
T = 8  # 时间步数
S = 26  # 维度

# 生成初始 Q
Q_initial = generate_initial_Q(I, S)

# 生成满足约束的 Q 张量
solutions = generate_tensor(I, T, S, beta, S_min, S_max, Q_initial)

# 输出结果
print(f"找到 {len(solutions)} 个解")
for solution in solutions:
    print(solution)

