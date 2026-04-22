import pandas as pd
from scipy.optimize import minimize
import numpy as np

def surplus_unsold_veg(Y_veg, P_veg, C_veg, M_veg, S_D, delta):
    # 目标函数
    def objective(S_veg):
        return -np.sum(S_veg * (Y_veg * P_veg - C_veg))  # 最大化收益
    # 约束
    constraints = [
        {'type': 'ineq', 'fun': lambda S_veg: S_D - np.sum(S_veg)},  # ∑S_veg < S_D
        *[
            {'type': 'ineq', 'fun': lambda S_veg, i=i: S_veg[i] * Y_veg[i] - M_veg[i] * (1 - delta)} for i in range(3)
        ],  # M_veg_i(1-δ) < S_veg_i * Y_veg_i
        *[
            {'type': 'ineq', 'fun': lambda S_veg, i=i: M_veg[i] - S_veg[i] * Y_veg[i]} for i in range(3)
        ]  # S_veg_i * Y_veg_i < M_veg_i
    ]
    # 初始值
    S_veg_initial = np.array([29.0, 24.0, 10.0])  # 让初始值更接近可行范围
    # 求解
    result = minimize(objective, S_veg_initial, constraints=constraints, method='SLSQP', bounds=[(0, None)] * 3)

    if result.success:
        return result.x
    else:
        raise ValueError("Optimization did not converge")

def surplus_discount_veg(Y_veg, P_veg, C_veg, M_veg, S_D, delta):
    # 目标函数
    def objective(S_veg):
        profit_normal = np.minimum(S_veg * Y_veg, M_veg) * (P_veg - C_veg / Y_veg)
        profit_discount = np.maximum(S_veg * Y_veg - M_veg, 0) * (0.5 * P_veg - C_veg / Y_veg)
        return -(np.sum(profit_normal) + np.sum(profit_discount))  # 最大化收益

    # 约束条件
    constraints = [
        {'type': 'ineq', 'fun': lambda S_veg: S_D - np.sum(S_veg)},  # ∑S_veg < S_D
        *[
            {'type': 'ineq', 'fun': lambda S_veg, i=i: S_veg[i] * Y_veg[i] - M_veg[i] * (1 - delta)} for i in range(3)
        ],  # M_veg_i(1-δ) < S_veg_i * Y_veg_i
        *[
            {'type': 'ineq', 'fun': lambda S_veg, i=i: M_veg[i] * (1 + delta) - S_veg[i] * Y_veg[i]} for i in range(3)
        ]  # S_veg_i * Y_veg_i < M_veg_i(1+δ)
    ]

    # 初始值
    S_veg_initial = np.ones(3) * (S_D / 3)  # 平均分配的初始值

    # 求解
    result = minimize(objective, S_veg_initial, constraints=constraints, method='SLSQP', bounds=[(0, None)] * 3)

    if result.success:
        return result.x
    else:
        raise ValueError("Optimization did not converge")

df = pd.read_csv('../Data/data_rab_veg.txt', sep='\s+')

Y_rab = df['Y(D2)'].values
P_rab = df['P(D2)'].values
C_rab = df['C(D2)'].values
M_rab = df['Y'].values
S_D = df['S'].sum()
delta = 2

S_veg_solution_discount = surplus_discount_veg(Y_rab, P_rab, C_rab, M_rab, S_D, delta)
print("Solution for surplus with discount vegetable problem:", S_veg_solution_discount)

S_veg_solution = surplus_unsold_veg(Y_rab, P_rab, C_rab, M_rab, S_D, delta)
print("Solution for surplus unsold vegetable problem:", S_veg_solution)
