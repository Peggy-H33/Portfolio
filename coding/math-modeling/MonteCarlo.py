import numpy as np

def monte_carlo_generate(I, T, S, beta, S_min, S_max, Q_init, max_iterations=1000):
    solutions = []
    
    for _ in range(max_iterations):
        # Initialize Q with the given Q_init for t=1
        Q = np.zeros((I, T, S), dtype=int)
        Q[:, 0, :] = Q_init  # Set the first slice of Q based on Q_init
        
        # Randomly initialize the remaining elements of Q
        for i in range(I):
            for t in range(1, T):
                for s in range(S):
                    Q[i, t, s] = np.random.choice([0, 1])
        
        # Check the constraints
        valid = True
        
        # Constraint 1: Sum over t, t+2 should be at least 1
        for i in range(I):
            for t in range(T-2):  # Ensure no out-of-bounds access
                for s in range(S):
                    if np.sum(Q[i, t:t+3, s]) < 1:
                        valid = False
                        break
            if not valid:
                break
        
        # Constraint 2: Sum over t, t+1 should be at most 1
        for i in range(I):
            for t in range(T-1):  # Ensure no out-of-bounds access
                for s in range(S):
                    if np.sum(Q[i, t:t+2, s]) > 1:
                        valid = False
                        break
            if not valid:
                break
        
        # Constraint 3: Weighted sum must be within bounds
        for i in range(I):
            for t in range(1, T):
                weighted_sum = np.sum(Q[i, t, :] * beta)
                if not (S_min[i] <= weighted_sum <= S_max[i]):
                    valid = False
                    break
            if not valid:
                break
        
        if valid:
            solutions.append(Q.copy())
    
    return solutions

# Example usage:
I, T, S = 5, 8, 3  # Dimensions
beta = np.array([0.5, 0.3, 0.2])  # Weight vector
S_min = np.array([1, 2, 1, 3, 2])  # Min sum constraints for each i
S_max = np.array([3, 3, 2, 4, 3])  # Max sum constraints for each i
Q_init = np.random.choice([0, 1], size=(I, S))  # Initial Q for t=1

solutions = monte_carlo_generate(I, T, S, beta, S_min, S_max, Q_init)
print(f"Found {len(solutions)} solutions.")

