# Calculus for Optimization

## Purpose
Machine learning IS optimization. Training a model means finding the parameters that minimize a loss function. Gradient descent, the algorithm that makes this possible, is pure calculus. This seed covers gradients, partial derivatives, the chain rule, gradient descent intuition, loss landscapes, learning rates, and convergence — with Python examples and practical ML context.

---

## Derivatives: The Rate of Change

### Intuition
A derivative tells you how fast a function is changing at any point. If f(x) is your loss and x is a model parameter:
- **f'(x) > 0**: Increasing the parameter increases the loss (go lower)
- **f'(x) < 0**: Increasing the parameter decreases the loss (go higher)
- **f'(x) = 0**: You're at a peak, valley, or saddle point

### Formal Definition
```
f'(x) = lim(h→0) [f(x + h) - f(x)] / h
```

### Common Derivatives

```python
import numpy as np

# f(x) = x^2      → f'(x) = 2x
# f(x) = x^3      → f'(x) = 3x^2
# f(x) = e^x      → f'(x) = e^x
# f(x) = ln(x)    → f'(x) = 1/x
# f(x) = sin(x)   → f'(x) = cos(x)
# f(x) = 1/(1+e^-x) (sigmoid) → f'(x) = f(x) * (1 - f(x))

# Numerical derivative (useful for checking)
def numerical_derivative(f, x, h=1e-7):
    return (f(x + h) - f(x - h)) / (2 * h)

# Example
f = lambda x: x**3 - 2*x + 1
x = 2.0

numerical = numerical_derivative(f, x)
analytical = 3 * x**2 - 2  # f'(x) = 3x^2 - 2

print(f"Numerical: {numerical:.6f}")   # 10.000000
print(f"Analytical: {analytical:.6f}") # 10.000000
```

---

## Partial Derivatives and Gradients

### When Functions Have Multiple Inputs
In ML, loss depends on MANY parameters (millions). A partial derivative measures how the loss changes when you tweak ONE parameter while holding all others fixed.

### The Gradient
The gradient is the vector of ALL partial derivatives. It points in the direction of steepest ASCENT.

```python
# f(x, y) = x^2 + 3*y^2
# ∂f/∂x = 2x
# ∂f/∂y = 6y
# Gradient: ∇f = [2x, 6y]

def f(x, y):
    return x**2 + 3*y**2

def gradient_f(x, y):
    return np.array([2*x, 6*y])

# At point (1, 2):
point = (1, 2)
grad = gradient_f(*point)
print(f"f({point}) = {f(*point)}")       # 13
print(f"∇f({point}) = {grad}")           # [2, 12]
# The gradient [2, 12] says: moving in x increases f by ~2, moving in y increases by ~12
# So y has a much steeper slope — adjusting y has more impact

# Numerical gradient (for verification)
def numerical_gradient(f, params, h=1e-7):
    grad = np.zeros_like(params, dtype=float)
    for i in range(len(params)):
        params_plus = params.copy()
        params_minus = params.copy()
        params_plus[i] += h
        params_minus[i] -= h
        grad[i] = (f(*params_plus) - f(*params_minus)) / (2 * h)
    return grad
```

---

## The Chain Rule

### Why It Matters
Neural networks are compositions of functions: layer1(layer2(layer3(input))). The chain rule lets us compute how the output changes with respect to parameters in ANY layer.

### The Rule
If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x)

For multiple compositions:
If y = f(g(h(x))), then dy/dx = f'(g(h(x))) * g'(h(x)) * h'(x)

```python
# Example: Neural network forward pass
# Input x → multiply by w1 → ReLU → multiply by w2 → loss

def relu(x):
    return np.maximum(0, x)

def relu_derivative(x):
    return (x > 0).astype(float)

def mse_loss(prediction, target):
    return np.mean((prediction - target)**2)

# Forward pass
x = np.array([1.0, 2.0, 3.0])
w1 = np.array([0.5, -0.3, 0.8])
w2 = 1.5
target = 2.0

# z1 = x * w1 (element-wise)
z1 = x * w1  # [0.5, -0.6, 2.4]

# a1 = relu(z1)
a1 = relu(z1)  # [0.5, 0.0, 2.4]

# z2 = sum(a1) * w2
z2 = np.sum(a1) * w2  # 4.35

# loss = (z2 - target)^2
loss = (z2 - target)**2  # 5.5225

# Backward pass (chain rule)
# dloss/dz2 = 2 * (z2 - target)
dloss_dz2 = 2 * (z2 - target)  # 4.7

# dz2/dw2 = sum(a1)
dz2_dw2 = np.sum(a1)  # 2.9

# dloss/dw2 = dloss/dz2 * dz2/dw2
dloss_dw2 = dloss_dz2 * dz2_dw2  # 13.63

# dz2/da1 = w2 (for each element)
# da1/dz1 = relu_derivative(z1)
# dz1/dw1 = x

dloss_da1 = dloss_dz2 * w2  # 7.05
da1_dz1 = relu_derivative(z1)  # [1, 0, 1]
dloss_dw1 = dloss_da1 * da1_dz1 * x  # [7.05, 0, 21.15]

print(f"Gradient w.r.t. w2: {dloss_dw2:.4f}")
print(f"Gradient w.r.t. w1: {dloss_dw1}")
```

This is EXACTLY what backpropagation does — it applies the chain rule layer by layer, from output back to input.

---

## Gradient Descent

### The Algorithm
1. Compute gradient of loss with respect to all parameters
2. Update each parameter in the OPPOSITE direction of the gradient (gradient points uphill; we want downhill)
3. Repeat until convergence

```
θ_new = θ_old - learning_rate * gradient
```

### Basic Implementation

```python
def gradient_descent(f, grad_f, x0, learning_rate=0.01, num_steps=1000):
    """Minimize f starting from x0."""
    x = x0.copy()
    history = [x.copy()]

    for step in range(num_steps):
        g = grad_f(x)
        x = x - learning_rate * g
        history.append(x.copy())

    return x, history

# Minimize f(x, y) = (x-3)^2 + (y-1)^2
# Minimum at (3, 1)
def f(params):
    x, y = params
    return (x - 3)**2 + (y - 1)**2

def grad_f(params):
    x, y = params
    return np.array([2*(x-3), 2*(y-1)])

x0 = np.array([0.0, 0.0])
result, history = gradient_descent(f, grad_f, x0, learning_rate=0.1, num_steps=50)
print(f"Minimum found at: ({result[0]:.4f}, {result[1]:.4f})")  # ~(3, 1)
```

---

## Learning Rate: The Most Important Hyperparameter

### Too High vs Too Low

```
Learning rate too HIGH:
  Step 0: loss = 10.0
  Step 1: loss = 25.0  ← overshooting!
  Step 2: loss = 100.0 ← diverging!

Learning rate too LOW:
  Step 0: loss = 10.0
  Step 1: loss = 9.998
  Step 2: loss = 9.996  ← will take forever

Learning rate just RIGHT:
  Step 0: loss = 10.0
  Step 1: loss = 7.5
  Step 2: loss = 5.2   ← converging nicely
```

### Learning Rate Schedules

```python
def constant_lr(step, initial_lr):
    return initial_lr

def step_decay(step, initial_lr, drop_factor=0.5, drop_every=100):
    return initial_lr * drop_factor ** (step // drop_every)

def cosine_annealing(step, initial_lr, total_steps):
    return initial_lr * (1 + np.cos(np.pi * step / total_steps)) / 2

def warmup_cosine(step, initial_lr, warmup_steps, total_steps):
    if step < warmup_steps:
        return initial_lr * step / warmup_steps
    remaining = total_steps - warmup_steps
    progress = (step - warmup_steps) / remaining
    return initial_lr * (1 + np.cos(np.pi * progress)) / 2

# Visualize
steps = np.arange(1000)
for name, fn, kwargs in [
    ("Constant", constant_lr, {"initial_lr": 0.001}),
    ("Step Decay", step_decay, {"initial_lr": 0.001}),
    ("Cosine", cosine_annealing, {"initial_lr": 0.001, "total_steps": 1000}),
    ("Warmup+Cosine", warmup_cosine, {"initial_lr": 0.001, "warmup_steps": 100, "total_steps": 1000}),
]:
    lrs = [fn(s, **kwargs) for s in steps]
    print(f"{name}: start={lrs[0]:.6f}, mid={lrs[500]:.6f}, end={lrs[-1]:.6f}")
```

---

## Advanced Optimizers

### SGD with Momentum
Adds "velocity" — the update accumulates direction over time, like a ball rolling downhill.

```python
def sgd_momentum(grad_fn, x0, lr=0.01, momentum=0.9, num_steps=1000):
    x = x0.copy()
    v = np.zeros_like(x)

    for step in range(num_steps):
        g = grad_fn(x)
        v = momentum * v - lr * g  # Update velocity
        x = x + v                   # Update position

    return x
```

### Adam (Adaptive Moment Estimation)
The go-to optimizer. Adapts learning rate per-parameter using running averages of gradients and squared gradients.

```python
def adam(grad_fn, x0, lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8, num_steps=1000):
    x = x0.copy()
    m = np.zeros_like(x)  # First moment (mean of gradients)
    v = np.zeros_like(x)  # Second moment (mean of squared gradients)

    for step in range(1, num_steps + 1):
        g = grad_fn(x)

        m = beta1 * m + (1 - beta1) * g          # Update biased first moment
        v = beta2 * v + (1 - beta2) * g**2        # Update biased second moment

        m_hat = m / (1 - beta1**step)             # Bias correction
        v_hat = v / (1 - beta2**step)

        x = x - lr * m_hat / (np.sqrt(v_hat) + eps)

    return x
```

**Why Adam works well**: It automatically handles different gradient scales across parameters, uses momentum to smooth noisy gradients, and adapts the effective learning rate as training progresses.

---

## Loss Landscapes

### Convex vs Non-Convex

```
Convex (easy):         Non-Convex (reality):
    \      /               /\    /\
     \    /               /  \  /  \
      \  /               /    \/    \___
       \/               /              \
   One global          Multiple local
   minimum             minima + saddle points
```

### What This Means for ML
- Simple linear regression: convex — gradient descent finds the global minimum
- Neural networks: highly non-convex — gradient descent finds A local minimum (hopefully a good one)
- In practice: most local minima in large networks are "good enough" (similar loss values)

### Saddle Points
In high-dimensional spaces, saddle points are more common than local minima. A saddle point has zero gradient but is a minimum in some directions and a maximum in others.

```python
# Saddle point example: f(x, y) = x^2 - y^2
# At (0, 0): gradient = [0, 0] but it's NOT a minimum
# It's a minimum along x but a maximum along y

# Second derivative test:
# ∂²f/∂x² = 2 (positive — curves up in x)
# ∂²f/∂y² = -2 (negative — curves down in y)
# Determinant of Hessian = 2 * (-2) - 0 = -4 < 0 → saddle point
```

---

## Convergence Diagnostics

```python
def train_with_diagnostics(
    loss_fn, grad_fn, x0, lr, num_steps,
    patience=50, min_improvement=1e-6
):
    x = x0.copy()
    losses = []
    best_loss = float('inf')
    steps_without_improvement = 0

    for step in range(num_steps):
        loss = loss_fn(x)
        losses.append(loss)

        # Check for improvement
        if loss < best_loss - min_improvement:
            best_loss = loss
            steps_without_improvement = 0
        else:
            steps_without_improvement += 1

        # Early stopping
        if steps_without_improvement >= patience:
            print(f"Converged at step {step} (no improvement for {patience} steps)")
            break

        # Check for divergence
        if loss > 1e10 or np.isnan(loss):
            print(f"Diverged at step {step}! Reduce learning rate.")
            break

        # Gradient step
        g = grad_fn(x)

        # Gradient clipping (prevents explosion)
        grad_norm = np.linalg.norm(g)
        max_norm = 1.0
        if grad_norm > max_norm:
            g = g * max_norm / grad_norm

        x = x - lr * g

    return x, losses
```

---

## Practical Rules of Thumb

| Situation | What To Do |
|---|---|
| Loss not decreasing | Reduce learning rate by 10x |
| Loss oscillating wildly | Learning rate too high — reduce it |
| Loss decreasing then plateaus | Try learning rate schedule (cosine annealing) |
| Loss NaN or Inf | Gradient explosion — add gradient clipping |
| Training loss drops but validation doesn't | Overfitting — add regularization or stop early |
| Different parameters need different rates | Use Adam (adapts per-parameter) |

---

## Key Takeaways

- The gradient tells you the direction of steepest ascent. Negate it to descend toward the minimum.
- The chain rule is what makes backpropagation possible — it propagates error signals backward through composed functions.
- Learning rate is the most critical hyperparameter. Too high = divergence. Too low = no progress.
- Adam optimizer is the default choice — it handles most situations well out of the box.
- Real loss landscapes are non-convex with many local minima, but in high dimensions most are "good enough."
- Always monitor loss curves, clip gradients, and implement early stopping.
