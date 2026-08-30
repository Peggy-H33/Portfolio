import random
import pandas as pd
import numpy as np
from deap import base, creator, tools, algorithms

df = pd.read_csv('../Data/data_rab_veg.txt', sep='\s+')

Y = df['Y(D2)'].values
P = df['P(D2)'].values
C = df['C(D2)'].values
M = df['Y'].values
S_D = df['S'].sum()
delta = 0.1

# 创建最小化目标
creator.create("FitnessMax", base.Fitness, weights=(1.0,))
creator.create("Individual", list, fitness=creator.FitnessMax)

toolbox = base.Toolbox()
toolbox.register("attr_float", random.uniform, 0, S_D)
toolbox.register("individual", tools.initRepeat, creator.Individual, toolbox.attr_float, n=3)
toolbox.register("population", tools.initRepeat, list, toolbox.individual)

# 定义第一个问题的适应度函数
def fitness_1(individual):
    profit = sum(individual[i] * (Y[i] * P[i] - C[i]) for i in range(3))
    # 约束条件: M[i](1 - delta) < individual[i] * Y[i] < M[i]
    for i in range(3):
        if not (M[i] * (1 - delta) < individual[i] * Y[i] < M[i]):
            return -1e6,  # 惩罚违反约束的个体
    if sum(individual) >= S_D:
        return -1e6,  # 总和超过 S_D 的情况也要惩罚
    return profit,

# 定义第二个问题的适应度函数
def fitness_2(individual):
    profit_full = sum(min(individual[i] * Y[i], M[i]) * (P[i] - C[i] / Y[i]) for i in range(3))
    profit_discount = sum(max((individual[i] * Y[i] - M[i]), 0) * (0.5 * P[i] - C[i] / Y[i]) for i in range(3))
    total_profit = profit_full + profit_discount
    # 约束条件: M[i](1 - delta) < individual[i] * Y[i] < M[i]
    for i in range(3):
        if not (M[i] * (1 - delta) < individual[i] * Y[i] < M[i] * (1 + delta)):
            return -1e6,
    if sum(individual) >= S_D:
        return -1e6,
    return total_profit,

# 注册遗传算法工具
toolbox.register("evaluate", fitness_1)  # 选择 fitness_1 或 fitness_2
toolbox.register("mate", tools.cxBlend, alpha=0.5)
toolbox.register("mutate", tools.mutGaussian, mu=0, sigma=0.1, indpb=0.2)
toolbox.register("select", tools.selTournament, tournsize=3)

# 遗传算法主循环
def main():
    pop = toolbox.population(n=100)
    hof = tools.HallOfFame(1)
    stats = tools.Statistics(lambda ind: ind.fitness.values)
    stats.register("avg", lambda x: sum(x) / len(x))
    stats.register("max", max)
    
    algorithms.eaSimple(pop, toolbox, cxpb=0.7, mutpb=0.2, ngen=50, stats=stats, halloffame=hof, verbose=True)
    
    return hof[0]  # 返回最优个体

if __name__ == "__main__":
    best_ind = main()
    print("最优解决方案:", best_ind)

