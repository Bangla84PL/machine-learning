# JAX Best Practices Guide

A comprehensive guide for writing efficient, maintainable, and performant code with JAX, Python, NumPy, and Machine Learning.

---

## Table of Contents

1. [Code Style and Structure](#code-style-and-structure)
2. [JAX Best Practices](#jax-best-practices)
3. [Optimization and Performance](#optimization-and-performance)
4. [Error Handling and Validation](#error-handling-and-validation)
5. [Testing and Debugging](#testing-and-debugging)
6. [Documentation](#documentation)
7. [Key Conventions](#key-conventions)
8. [JAX Transformations](#jax-transformations)
9. [Performance Tips](#performance-tips)
10. [Additional Best Practices](#additional-best-practices)

---

## Code Style and Structure

- **Write concise, technical Python code** with accurate examples.
- **Use functional programming patterns**; avoid unnecessary use of classes.
- **Prefer vectorized operations** over explicit loops for performance.
- **Use descriptive variable names** (e.g., `learning_rate`, `weights`, `gradients`).
- **Organize code into functions and modules** for clarity and reusability.
- **Follow PEP 8 style guidelines** for Python code.

### Example: Functional vs. Object-Oriented

```python
# Good: Functional approach
def compute_loss(params, x, y):
    predictions = forward_pass(params, x)
    return jnp.mean((predictions - y) ** 2)

# Avoid: Unnecessary class structure
class LossComputer:
    def __init__(self):
        pass

    def compute(self, params, x, y):
        predictions = self.forward_pass(params, x)
        return jnp.mean((predictions - y) ** 2)
```

---

## JAX Best Practices

### Use JAX's Functional API

- **Leverage JAX's functional API** for numerical computations.
- **Use `jax.numpy`** instead of standard NumPy to ensure compatibility.

```python
import jax.numpy as jnp  # Always use jax.numpy
import numpy as np  # Avoid for JAX operations

# Good
x = jnp.array([1.0, 2.0, 3.0])
y = jnp.sin(x)

# Bad - mixing NumPy with JAX
x = np.array([1.0, 2.0, 3.0])  # NumPy array
y = jnp.sin(x)  # May cause issues with transformations
```

### Automatic Differentiation

- **Utilize automatic differentiation** with `jax.grad` and `jax.value_and_grad`.
- **Write functions suitable for differentiation** (i.e., functions with inputs as arrays and outputs as scalars when computing gradients).

```python
import jax

# Good: Function designed for differentiation
def loss_fn(params, x, y):
    predictions = params['w'] @ x + params['b']
    return jnp.mean((predictions - y) ** 2)

# Compute gradient
grad_fn = jax.grad(loss_fn)
gradients = grad_fn(params, x, y)

# Better: Get both value and gradient
value_and_grad_fn = jax.value_and_grad(loss_fn)
loss, gradients = value_and_grad_fn(params, x, y)
```

### Just-In-Time Compilation

- **Apply `jax.jit`** for just-in-time compilation to optimize performance.
- **Ensure functions are compatible with JIT** (e.g., avoid Python side-effects and unsupported operations).

```python
import jax

# Good: JIT-compiled function
@jax.jit
def fast_computation(x, y):
    return jnp.dot(x, y) + jnp.sum(x)

# Bad: Function with Python side-effects
@jax.jit
def bad_jit_function(x):
    print(f"Computing with {x}")  # Side effect - won't work as expected
    return jnp.sum(x)
```

### Vectorization with vmap

- **Use `jax.vmap`** for vectorizing functions over batch dimensions.
- **Replace explicit loops** with `vmap` for operations over arrays.

```python
import jax

# Bad: Explicit loop
def compute_batch_loss(params, batch_x, batch_y):
    losses = []
    for x, y in zip(batch_x, batch_y):
        loss = compute_single_loss(params, x, y)
        losses.append(loss)
    return jnp.array(losses)

# Good: Vectorized with vmap
compute_batch_loss = jax.vmap(compute_single_loss, in_axes=(None, 0, 0))
losses = compute_batch_loss(params, batch_x, batch_y)
```

### Immutability

- **Avoid in-place mutations**; JAX arrays are immutable.
- **Refrain from operations** that modify arrays in place.

```python
# Bad: Attempting in-place modification
x = jnp.array([1, 2, 3])
x[0] = 10  # TypeError: JAX arrays are immutable

# Good: Create new array
x = jnp.array([1, 2, 3])
x = x.at[0].set(10)  # Returns new array
```

### Pure Functions

- **Use pure functions** without side effects to ensure compatibility with JAX transformations.

```python
# Good: Pure function
def pure_function(x, y):
    return x * y + jnp.sum(x)

# Bad: Function with side effects
global_state = []

def impure_function(x, y):
    global_state.append(x)  # Side effect
    return x * y + jnp.sum(x)
```

---

## Optimization and Performance

### JIT Compilation Compatibility

- **Write code compatible with JIT compilation**; avoid Python constructs that JIT cannot compile.
- **Minimize Python loops and dynamic control flow**; use JAX's control flow operations like `jax.lax.scan`, `jax.lax.cond`, and `jax.lax.fori_loop`.

```python
from jax import lax

# Bad: Python loop in JIT function
@jax.jit
def sum_with_loop(x):
    total = 0.0
    for i in range(len(x)):
        total += x[i]
    return total

# Good: Use jax.lax.fori_loop
@jax.jit
def sum_with_fori_loop(x):
    def body_fun(i, val):
        return val + x[i]
    return lax.fori_loop(0, len(x), body_fun, 0.0)

# Better: Use JAX operations
@jax.jit
def sum_vectorized(x):
    return jnp.sum(x)
```

### Memory Optimization

- **Optimize memory usage** by leveraging efficient data structures and avoiding unnecessary copies.
- **Use appropriate data types** (e.g., `float32`) to optimize performance and memory usage.

```python
# Good: Use float32 for better performance
x = jnp.array([1.0, 2.0, 3.0], dtype=jnp.float32)

# Less optimal: float64 uses more memory
x = jnp.array([1.0, 2.0, 3.0], dtype=jnp.float64)
```

### Profiling

- **Profile code** to identify bottlenecks and optimize accordingly.

```python
import jax
import time

# Simple profiling
@jax.jit
def expensive_operation(x):
    return jnp.dot(x, x.T)

# Warm up JIT
x = jnp.ones((1000, 1000))
_ = expensive_operation(x)

# Time the operation
start = time.time()
result = expensive_operation(x).block_until_ready()
end = time.time()
print(f"Time taken: {end - start:.4f} seconds")
```

---

## Error Handling and Validation

### Input Validation

- **Validate input shapes and data types** before computations.
- **Use assertions or raise exceptions** for invalid inputs.

```python
def matrix_multiply(a, b):
    """Multiply two matrices with shape validation."""
    if a.ndim != 2 or b.ndim != 2:
        raise ValueError(f"Expected 2D arrays, got shapes {a.shape} and {b.shape}")

    if a.shape[1] != b.shape[0]:
        raise ValueError(
            f"Incompatible shapes for matrix multiplication: "
            f"{a.shape} and {b.shape}"
        )

    return jnp.dot(a, b)
```

### Informative Error Messages

- **Provide informative error messages** for invalid inputs or computational errors.

```python
def compute_accuracy(predictions, labels):
    """Compute classification accuracy."""
    if predictions.shape != labels.shape:
        raise ValueError(
            f"Shape mismatch: predictions have shape {predictions.shape} "
            f"but labels have shape {labels.shape}"
        )

    if predictions.dtype != jnp.int32 and predictions.dtype != jnp.int64:
        raise TypeError(
            f"Predictions must be integer type, got {predictions.dtype}"
        )

    return jnp.mean(predictions == labels)
```

### Graceful Exception Handling

- **Handle exceptions gracefully** to prevent crashes during execution.

```python
def safe_division(a, b, eps=1e-10):
    """Perform division with numerical stability."""
    return a / (b + eps)

def load_and_process_data(filepath):
    """Load data with proper error handling."""
    try:
        data = jnp.load(filepath)
        return preprocess(data)
    except FileNotFoundError:
        print(f"Error: File {filepath} not found")
        return None
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return None
```

---

## Testing and Debugging

### Unit Testing

- **Write unit tests** for functions using testing frameworks like `pytest`.
- **Ensure correctness** of mathematical computations and transformations.

```python
import pytest
import jax.numpy as jnp

def test_matrix_multiply():
    """Test matrix multiplication function."""
    a = jnp.array([[1, 2], [3, 4]])
    b = jnp.array([[5, 6], [7, 8]])

    result = matrix_multiply(a, b)
    expected = jnp.array([[19, 22], [43, 50]])

    assert jnp.allclose(result, expected)

def test_matrix_multiply_shape_error():
    """Test that incompatible shapes raise ValueError."""
    a = jnp.array([[1, 2, 3]])
    b = jnp.array([[4, 5]])

    with pytest.raises(ValueError):
        matrix_multiply(a, b)
```

### Debugging JIT Functions

- **Use `jax.debug.print`** for debugging JIT-compiled functions.

```python
from jax import debug

@jax.jit
def debug_function(x, y):
    debug.print("x: {}, y: {}", x, y)
    result = x + y
    debug.print("result: {}", result)
    return result
```

### Pure Functions Warning

- **Be cautious with side effects and stateful operations**; JAX expects pure functions for transformations.

```python
# Bad: Stateful operation
counter = 0

@jax.jit
def bad_stateful_function(x):
    global counter
    counter += 1  # This won't work as expected with JIT
    return x * counter

# Good: Pass state explicitly
@jax.jit
def good_stateful_function(x, counter):
    return x * counter, counter + 1
```

---

## Documentation

### Docstrings

- **Include docstrings** for functions and modules following PEP 257 conventions.
- **Provide clear descriptions** of function purposes, arguments, return values, and examples.

```python
def train_model(params, x, y, learning_rate=0.01, num_epochs=100):
    """
    Train a model using gradient descent.

    Args:
        params: Dictionary containing model parameters (weights and biases)
        x: Input features, shape (n_samples, n_features)
        y: Target values, shape (n_samples,)
        learning_rate: Step size for gradient descent (default: 0.01)
        num_epochs: Number of training iterations (default: 100)

    Returns:
        Trained parameters dictionary with same structure as input params

    Example:
        >>> params = {'w': jnp.zeros(10), 'b': 0.0}
        >>> x = jnp.random.normal(size=(100, 10))
        >>> y = jnp.random.normal(size=(100,))
        >>> trained_params = train_model(params, x, y)
    """
    for epoch in range(num_epochs):
        loss, grads = jax.value_and_grad(loss_fn)(params, x, y)
        params = update_params(params, grads, learning_rate)

    return params
```

### Code Comments

- **Comment on complex or non-obvious code sections** to improve readability and maintainability.

```python
def complex_transformation(x):
    """Apply a complex data transformation."""
    # Normalize to zero mean and unit variance
    x_normalized = (x - jnp.mean(x)) / jnp.std(x)

    # Apply non-linear transformation
    # Using tanh to bound values between -1 and 1
    x_transformed = jnp.tanh(x_normalized)

    # Scale back to original range for interpretability
    x_final = x_transformed * jnp.std(x) + jnp.mean(x)

    return x_final
```

---

## Key Conventions

### Naming Conventions

- **Use `snake_case`** for variable and function names.
- **Use `UPPERCASE`** for constants.

```python
# Constants
LEARNING_RATE = 0.01
MAX_ITERATIONS = 1000
DEFAULT_BATCH_SIZE = 32

# Variables and functions
def compute_loss_function(model_parameters, input_data, target_labels):
    batch_size = input_data.shape[0]
    predictions = forward_pass(model_parameters, input_data)
    return jnp.mean((predictions - target_labels) ** 2)
```

### Function Design

- **Keep functions small** and focused on a single task.
- **Avoid global variables**; pass parameters explicitly.

```python
# Bad: Large function doing multiple things
def train_and_evaluate(data):
    # Data loading
    x_train, y_train = data['train']
    x_test, y_test = data['test']

    # Preprocessing
    x_train = normalize(x_train)
    x_test = normalize(x_test)

    # Training
    params = initialize_params()
    for epoch in range(100):
        params = update(params, x_train, y_train)

    # Evaluation
    predictions = predict(params, x_test)
    accuracy = compute_accuracy(predictions, y_test)

    return params, accuracy

# Good: Separate concerns
def load_data(data):
    return data['train'], data['test']

def preprocess_data(x_train, x_test):
    x_train = normalize(x_train)
    x_test = normalize(x_test)
    return x_train, x_test

def train(params, x_train, y_train, num_epochs=100):
    for epoch in range(num_epochs):
        params = update(params, x_train, y_train)
    return params

def evaluate(params, x_test, y_test):
    predictions = predict(params, x_test)
    return compute_accuracy(predictions, y_test)
```

### File Structure

- **Organize code into modules and packages** logically.
- **Separate utility functions, core algorithms, and application code**.

```
project/
├── src/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── neural_network.py
│   │   └── linear_model.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── data_processing.py
│   │   └── metrics.py
│   └── training/
│       ├── __init__.py
│       ├── optimizer.py
│       └── trainer.py
├── tests/
│   ├── test_models.py
│   ├── test_utils.py
│   └── test_training.py
└── examples/
    └── train_example.py
```

---

## JAX Transformations

### Pure Functions

- **Ensure functions are free of side effects** for compatibility with `jit`, `grad`, `vmap`, etc.

```python
# Good: Pure function
@jax.jit
def pure_loss(params, x, y):
    pred = params['w'] @ x + params['b']
    return jnp.mean((pred - y) ** 2)

# Bad: Impure function
results_log = []

@jax.jit  # This will not work as expected
def impure_loss(params, x, y):
    pred = params['w'] @ x + params['b']
    loss = jnp.mean((pred - y) ** 2)
    results_log.append(loss)  # Side effect!
    return loss
```

### Control Flow

- **Use JAX's control flow operations** (`jax.lax.cond`, `jax.lax.scan`) instead of Python control flow in JIT-compiled functions.

```python
from jax import lax

# Bad: Python if statement in JIT
@jax.jit
def bad_conditional(x, threshold):
    if x > threshold:  # Won't work as expected with JIT
        return x * 2
    else:
        return x / 2

# Good: Use lax.cond
@jax.jit
def good_conditional(x, threshold):
    return lax.cond(
        x > threshold,
        lambda x: x * 2,
        lambda x: x / 2,
        x
    )

# Example: Using lax.scan for loops
def cumsum_scan(x):
    """Compute cumulative sum using lax.scan."""
    def scan_fn(carry, x_i):
        new_carry = carry + x_i
        return new_carry, new_carry

    _, result = lax.scan(scan_fn, 0.0, x)
    return result
```

### Random Number Generation

- **Use JAX's PRNG system**; manage random keys explicitly.

```python
import jax.random as random

# Good: Explicit key management
key = random.PRNGKey(0)
key, subkey = random.split(key)
random_data = random.normal(subkey, shape=(100, 10))

# Generate multiple random arrays
key, *subkeys = random.split(key, num=3)
x1 = random.normal(subkeys[0], shape=(100,))
x2 = random.uniform(subkeys[1], shape=(100,))

# Bad: Reusing the same key
key = random.PRNGKey(0)
x1 = random.normal(key, shape=(100,))
x2 = random.normal(key, shape=(100,))  # Will produce same values as x1!
```

### Parallelism with pmap

- **Utilize `jax.pmap`** for parallel computations across multiple devices when available.

```python
import jax

# Check available devices
devices = jax.devices()
print(f"Available devices: {devices}")

# Parallel computation across devices
@jax.pmap
def parallel_computation(x):
    return jnp.sum(x ** 2)

# Reshape data to have leading dimension = number of devices
n_devices = len(devices)
x = jnp.arange(n_devices * 100).reshape(n_devices, 100)
results = parallel_computation(x)
```

---

## Performance Tips

### Benchmarking

- **Use tools like `timeit`** and JAX's built-in benchmarking utilities.

```python
import jax
import jax.numpy as jnp
from jax import random
import timeit

def benchmark_function(f, *args, n_runs=100):
    """Benchmark a JAX function."""
    # Warm up
    _ = f(*args).block_until_ready()

    # Time multiple runs
    times = []
    for _ in range(n_runs):
        start = timeit.default_timer()
        _ = f(*args).block_until_ready()
        end = timeit.default_timer()
        times.append(end - start)

    return {
        'mean': jnp.mean(jnp.array(times)),
        'std': jnp.std(jnp.array(times)),
        'min': jnp.min(jnp.array(times)),
        'max': jnp.max(jnp.array(times))
    }

# Example usage
key = random.PRNGKey(0)
x = random.normal(key, (1000, 1000))

@jax.jit
def matrix_op(x):
    return jnp.dot(x, x.T)

stats = benchmark_function(matrix_op, x)
print(f"Mean time: {stats['mean']:.6f}s ± {stats['std']:.6f}s")
```

### Avoiding Common Pitfalls

#### Data Transfers

- **Be mindful of unnecessary data transfers** between CPU and GPU.

```python
# Bad: Frequent host-device transfers
@jax.jit
def compute_on_device(x):
    return jnp.sum(x ** 2)

result = 0
for i in range(1000):
    x = jnp.array([i])  # Creates new array each iteration
    result += float(compute_on_device(x))  # Transfer to host each time

# Good: Minimize transfers
@jax.jit
def compute_batch(indices):
    return jnp.sum(indices ** 2)

indices = jnp.arange(1000)
result = compute_batch(indices)  # Single computation, single transfer
```

#### Compilation Overhead

- **Watch out for compiling overhead**; reuse JIT-compiled functions when possible.

```python
# Bad: Recompiling in loop
for i in range(100):
    @jax.jit  # Compiles every iteration!
    def f(x):
        return x ** 2
    result = f(jnp.array(i))

# Good: Compile once
@jax.jit
def f(x):
    return x ** 2

for i in range(100):
    result = f(jnp.array(i))  # Reuses compiled function
```

#### Static vs Dynamic Shapes

```python
# Bad: Dynamic shapes cause recompilation
@jax.jit
def sum_array(x):
    return jnp.sum(x)

for size in [10, 20, 30, 40]:  # Recompiles for each size
    x = jnp.ones(size)
    result = sum_array(x)

# Good: Use consistent shapes or padding
@jax.jit
def sum_array_padded(x, length):
    # Pad to consistent size
    padded = jnp.pad(x, (0, length - x.shape[0]))
    return jnp.sum(padded)

max_length = 100
for size in [10, 20, 30, 40]:
    x = jnp.ones(size)
    result = sum_array_padded(x, max_length)  # Single compilation
```

---

## Additional Best Practices

### Immutability

- **Embrace functional programming principles**; avoid mutable states.

```python
# Bad: Mutable state
class MutableModel:
    def __init__(self):
        self.params = {'w': jnp.zeros(10), 'b': 0.0}

    def update(self, grads, lr):
        self.params['w'] -= lr * grads['w']  # Mutation
        self.params['b'] -= lr * grads['b']

# Good: Immutable updates
def update_params(params, grads, learning_rate):
    """Return new params dict without mutating input."""
    return {
        'w': params['w'] - learning_rate * grads['w'],
        'b': params['b'] - learning_rate * grads['b']
    }

# Usage
params = {'w': jnp.zeros(10), 'b': 0.0}
grads = compute_gradients(params, x, y)
params = update_params(params, grads, 0.01)  # Creates new dict
```

### Reproducibility

- **Manage random seeds carefully** for reproducible results.

```python
import jax.random as random

def reproducible_experiment(seed=42):
    """Run experiment with reproducible randomness."""
    key = random.PRNGKey(seed)

    # Split key for different random operations
    key, subkey1, subkey2 = random.split(key, 3)

    # Initialize model parameters
    w = random.normal(subkey1, (10, 5))
    b = random.normal(subkey2, (5,))

    params = {'w': w, 'b': b}

    # Train model...
    return params

# Will produce same results every time
params1 = reproducible_experiment(seed=42)
params2 = reproducible_experiment(seed=42)
assert jnp.allclose(params1['w'], params2['w'])
```

### Version Control

- **Keep track of library versions** (`jax`, `jaxlib`, etc.) to ensure compatibility.

```python
# requirements.txt
# jax==0.4.20
# jaxlib==0.4.20
# flax==0.7.5
# optax==0.1.7

# Check versions in code
import jax
print(f"JAX version: {jax.__version__}")

# Or create a reproducible environment
"""
conda env create -f environment.yml

# environment.yml
name: jax-env
channels:
  - conda-forge
dependencies:
  - python=3.10
  - pip
  - pip:
    - jax==0.4.20
    - jaxlib==0.4.20
"""
```

### Using pytrees for Complex Data Structures

```python
import jax
from jax import tree_util

# Params can be nested dictionaries, lists, tuples
params = {
    'layer1': {'w': jnp.ones((10, 5)), 'b': jnp.zeros(5)},
    'layer2': {'w': jnp.ones((5, 2)), 'b': jnp.zeros(2)}
}

# tree_map applies function to all leaves
params_scaled = tree_util.tree_map(lambda x: x * 0.1, params)

# Works with grad, jit, etc.
@jax.jit
def loss_fn(params, x, y):
    # Use nested params
    h = jnp.dot(x, params['layer1']['w']) + params['layer1']['b']
    h = jax.nn.relu(h)
    out = jnp.dot(h, params['layer2']['w']) + params['layer2']['b']
    return jnp.mean((out - y) ** 2)

grad_fn = jax.grad(loss_fn)
grads = grad_fn(params, x, y)  # Returns pytree with same structure
```

### Gradient Clipping

```python
def clip_gradients(grads, max_norm):
    """Clip gradients by global norm."""
    # Compute global norm across all parameters
    global_norm = jnp.sqrt(sum(
        jnp.sum(g ** 2) for g in tree_util.tree_leaves(grads)
    ))

    # Clip if necessary
    clip_factor = jnp.minimum(1.0, max_norm / (global_norm + 1e-6))

    return tree_util.tree_map(lambda g: g * clip_factor, grads)

# Usage in training loop
grads = jax.grad(loss_fn)(params, x, y)
grads = clip_gradients(grads, max_norm=1.0)
params = update_params(params, grads, learning_rate)
```

---

## References

For the latest best practices and API documentation, refer to the official JAX documentation:

- **JAX Documentation**: [https://jax.readthedocs.io](https://jax.readthedocs.io)
- **JAX GitHub**: [https://github.com/google/jax](https://github.com/google/jax)
- **JAX Tutorials**: [https://jax.readthedocs.io/en/latest/notebooks/quickstart.html](https://jax.readthedocs.io/en/latest/notebooks/quickstart.html)

---

## Quick Reference Checklist

- [ ] Use `jax.numpy` instead of `numpy`
- [ ] Ensure functions are pure (no side effects)
- [ ] Use `@jax.jit` for performance-critical functions
- [ ] Use `jax.vmap` instead of explicit loops
- [ ] Use `jax.lax` control flow in JIT functions
- [ ] Manage JAX PRNG keys explicitly
- [ ] Validate input shapes and types
- [ ] Use `float32` for better performance
- [ ] Write comprehensive docstrings
- [ ] Add unit tests for all functions
- [ ] Profile and benchmark critical code paths
- [ ] Use `tree_util` for nested parameter structures
- [ ] Handle errors gracefully with informative messages
- [ ] Keep functions small and focused
- [ ] Follow PEP 8 style guidelines

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Maintained by**: ML Insights Platform Team
