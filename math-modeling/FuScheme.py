from scipy.optimize import minimize
import numpy as np
import pandas as pd

def surplus_unsold(Y_fu, P_fu, C_fu, M_fu, S_E, delta):
    def objective(S_fu):
        return -np.sum(S_fu * (Y_fu * P_fu - C_fu))  # 最大化收益

    # 约束
    constraints = [
        {'type': 'ineq', 'fun': lambda S_fu: S_E - np.sum(S_fu)},  # ∑S_fu < S_E
        *[
            {'type': 'ineq', 'fun': lambda S_fu, i=i: S_fu[i] * Y_fu[i] - M_fu[i] * (1 - delta)} for i in range(4)
        ],  # M_fu_i(1-δ) < S_fu_i * Y_fu_i
        *[
            {'type': 'ineq', 'fun': lambda S_fu, i=i: M_fu[i] - S_fu[i] * Y_fu[i]} for i in range(4)
        ]  # S_fu_i * Y_fu_i < M_fu_i
    ]

    # 初始值：根据可行区间设置初始值
    S_fu_initial = np.array([1.6, 1.6, 1.6, 3.8])  # 让初始值更接近可行范围

    result = minimize(objective, S_fu_initial, constraints=constraints, method='SLSQP', bounds=[(0, None)] * 4)

    print(result)  # 打印优化结果和状态，便于调试

    if result.success:
        return result.x
    else:
        raise ValueError("Optimization did not converge")

def surplus_discount(Y_fu, P_fu, C_fu, M_fu, S_E, delta):
    # 定义目标函数
    def objective(S_fu):
        profit_normal = np.minimum(S_fu * Y_fu, M_fu) * (P_fu - C_fu / Y_fu)
        profit_discount = np.maximum(S_fu * Y_fu - M_fu, 0) * (0.5 * P_fu - C_fu / Y_fu)
        return -(np.sum(profit_normal) + np.sum(profit_discount))  # 最大化收益

    # 约束条件
    constraints = [
        {'type': 'ineq', 'fun': lambda S_fu: S_E - np.sum(S_fu)},  # ∑S_fu < S_E
        *[
            {'type': 'ineq', 'fun': lambda S_fu, i=i: S_fu[i] * Y_fu[i] - M_fu[i] * (1 - delta)} for i in range(4)
        ],  # M_fu_i(1-δ) < S_fu_i * Y_fu_i
        *[
            {'type': 'ineq', 'fun': lambda S_fu, i=i: M_fu[i] * (1 + delta) - S_fu[i] * Y_fu[i]} for i in range(4)
        ]  # S_fu_i * Y_fu_i < M_fu_i(1+δ)
    ]
    # 初始值
    S_fu_initial = np.ones(4) * (S_E / 4)  # 平均分配的初始值

    # 求解优化问题
    result = minimize(objective, S_fu_initial, constraints=constraints, method='SLSQP', bounds=[(0, None)] * 4)

    if result.success:
        return result.x
    else:
        raise ValueError("Optimization did not converge")

df = pd.read_csv('../Data/data_fu.txt', sep='\s+')

Y_fu = df['Y(E2)'].values
P_fu = df['P(E2)'].values
C_fu = df['C(E2)'].values
M_fu = df['Y'].values
S_E = df['S'].sum()
delta = 1

S_fu_solution = surplus_unsold(Y_fu, P_fu, C_fu, M_fu, S_E, delta=0.3)
print("Solution for surplus unsold problem:", S_fu_solution)

S_fu_solution_discount = surplus_discount(Y_fu, P_fu, C_fu, M_fu, S_E, delta)
print("Solution for surplus with discount problem:", S_fu_solution_discount)

