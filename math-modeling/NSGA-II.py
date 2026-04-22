import numpy as np
from deap import base, creator, tools, algorithms
import json

# 创建适应度函数和个体类
creator.create("FitnessMin", base.Fitness, weights=(-1.0,))  
creator.create("Individual", np.ndarray, fitness=creator.FitnessMin)

# 定义问题参数
I = 10  # 对象数量
T = 8   # 时间步长
S = 5   # 特征维度
S_max = np.random.randint(5, 15, size=I)
S_min = np.random.randint(1, 5, size=I)
beta = np.random.rand(S)

# 定义初始种群
def init_individual():
    Q = np.random.randint(0, 2, (I, T, S))  # 初始化为随机的 0-1 张量
    return creator.Individual(Q)

# 适应度函数
def evaluate(ind):
    # 提取 Q
    Q = np.array(ind)
    penalty = 0

    # 检查约束 1 和 2
    for i in range(I):
        for s in range(S):
            for t in range(6):
                if np.sum(Q[i, t:t+3, s]) < 1:
                    penalty += 100  # 违反约束 1
            for t in range(7):
                if np.sum(Q[i, t:t+2, s]) > 1:
                    penalty += 100  # 违反约束 2

    # 检查约束 3
    for i in range(I):
        for t in range(1, 8):
            total_weighted_sum = np.sum(Q[i, t, :] * beta)
            if total_weighted_sum < S_min[i] or total_weighted_sum > S_max[i]:
                penalty += 100  # 违反约束 3

    # 返回带有惩罚的适应度
    return penalty,

# 自定义变异函数，针对三维数组的每个元素进行随机位翻转
def mutFlip3D(individual, indpb):
    I, T, S = individual.shape
    for i in range(I):
        for t in range(T):
            for s in range(S):
                if np.random.rand() < indpb:  # 以 indpb 概率翻转位
                    individual[i, t, s] = 1 - individual[i, t, s]  # 0 -> 1 或 1 -> 0
    return individual,

# 遗传算法的操作
toolbox = base.Toolbox()
toolbox.register("individual", init_individual)
toolbox.register("population", tools.initRepeat, list, toolbox.individual)
toolbox.register("mate", tools.cxTwoPoint)
toolbox.register("mutate", mutFlip3D, indpb=0.1)  # 使用自定义的 3D 变异函数
toolbox.register("select", tools.selNSGA2)
toolbox.register("evaluate", evaluate)

# 运行NSGA-II算法
def run_nsga2():
    population = toolbox.population(n=100)  # 初始种群
    algorithms.eaMuPlusLambda(population, toolbox, mu=100, lambda_=200, cxpb=0.7, mutpb=0.2, ngen=100, verbose=True)

    # 提取 Pareto 前沿解
    pareto_front = tools.sortNondominated(population, len(population), first_front_only=True)[0]

    # 打印每个解及其适应度
    print("Pareto Front Solutions:")
    for ind in pareto_front:
        print("Solution (Q):", ind)
        print("Fitness:", ind.fitness.values)

    # 将 Pareto 前沿解保存到文件中
    with open("solutions.json", "w") as f:
        solutions = [{"solution": ind.tolist(), "fitness": ind.fitness.values} for ind in pareto_front]
        json.dump(solutions, f, indent=4)
        print("Solutions saved to 'solutions.json'")

run_nsga2()
