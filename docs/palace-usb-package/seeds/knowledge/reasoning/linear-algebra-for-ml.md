# Linear Algebra for Machine Learning

## Purpose
Linear algebra is the mathematical language of machine learning. Every embedding, every attention matrix, every neural network weight update is a linear algebra operation. This seed covers vectors, matrices, eigenvalues, SVD, PCA, and the math behind embeddings and transformers — with intuitive explanations, formal definitions, and Python/NumPy examples.

---

## Vectors: The Foundation

### What Is a Vector?
A vector is an ordered list of numbers. In ML, vectors represent data points in high-dimensional space.

- A word embedding: a vector of 768 or 1536 numbers
- An image: a vector of pixel values (flattened)
- A user profile: a vector of feature values

### Formal Definition
A vector **v** in R^n is an element of n-dimensional real space:
**v** = [v1, v2, ..., vn]

### Key Operations

```python
import numpy as np

# Vector creation
v = np.array([3, 4, 5])
w = np.array([1, 2, 3])

# Addition (element-wise)
v_plus_w = v + w  # [4, 6, 8]

# Scalar multiplication
scaled = 2 * v  # [6, 8, 10]

# Dot product: measures similarity/alignment
dot = np.dot(v, w)  # 3*1 + 4*2 + 5*3 = 26

# Magnitude (L2 norm): length of the vector
magnitude = np.linalg.norm(v)  # sqrt(9 + 16 + 25) = sqrt(50)

# Unit vector (normalization): direction without magnitude
unit_v = v / np.linalg.norm(v)
```

### Why Dot Products Matter for RAG
Cosine similarity between two vectors is their dot product divided by the product of their magnitudes:

```python
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# If vectors are already normalized (unit vectors):
# cosine_similarity = dot product
# This is why many embedding models output normalized vectors
```

When your RAG system retrieves the "most similar" document, it's finding the document vector with the highest dot product against the query vector.

---

## Matrices: Transformations

### What Is a Matrix?
A matrix is a 2D array of numbers. In ML, matrices represent:
- Datasets (rows = samples, columns = features)
- Transformations (rotate, scale, project data)
- Neural network weights

### Key Operations

```python
# Matrix creation
A = np.array([[1, 2], [3, 4], [5, 6]])  # 3x2 matrix

# Transpose: swap rows and columns
A_T = A.T  # 2x3 matrix

# Matrix multiplication: compose transformations
B = np.array([[7, 8], [9, 10]])  # 2x2 matrix
C = A @ B  # 3x2 * 2x2 = 3x2 result

# Shape matters: (m x n) @ (n x p) = (m x p)
# The inner dimensions must match

# Identity matrix: does nothing (like multiplying by 1)
I = np.eye(3)  # 3x3 identity

# Inverse: "undo" a transformation
M = np.array([[2, 1], [5, 3]])
M_inv = np.linalg.inv(M)
# M @ M_inv = Identity (approximately)
```

### Matrix Multiplication in Neural Networks

Every neural network layer is a matrix multiplication:
```
output = input @ weights + bias
```

For a layer with 768 input features and 3072 output features:
- input shape: (batch_size, 768)
- weights shape: (768, 3072)
- output shape: (batch_size, 3072)

```python
# A single transformer feed-forward layer
batch_size = 32
d_model = 768
d_ff = 3072

input_tensor = np.random.randn(batch_size, d_model)
W1 = np.random.randn(d_model, d_ff)
b1 = np.random.randn(d_ff)
W2 = np.random.randn(d_ff, d_model)
b2 = np.random.randn(d_model)

# Forward pass
hidden = np.maximum(0, input_tensor @ W1 + b1)  # ReLU activation
output = hidden @ W2 + b2
```

---

## Eigenvalues and Eigenvectors

### Intuition
An eigenvector of a matrix A is a vector that, when multiplied by A, only gets scaled (not rotated). The scaling factor is the eigenvalue.

**A * v = lambda * v**

Where v is the eigenvector and lambda is the eigenvalue.

### Why It Matters
- **PCA**: Uses eigenvectors of the covariance matrix to find the directions of maximum variance
- **PageRank**: Uses the dominant eigenvector of the link matrix
- **Stability analysis**: Eigenvalues tell you if a system will converge or diverge

```python
A = np.array([[4, 1], [2, 3]])

# Compute eigenvalues and eigenvectors
eigenvalues, eigenvectors = np.linalg.eig(A)

print(f"Eigenvalues: {eigenvalues}")      # [5, 2]
print(f"Eigenvectors:\n{eigenvectors}")

# Verify: A @ v = lambda * v
v = eigenvectors[:, 0]  # First eigenvector
lambda_1 = eigenvalues[0]
print(f"A @ v = {A @ v}")
print(f"lambda * v = {lambda_1 * v}")
# These should be equal
```

---

## Singular Value Decomposition (SVD)

### What Is SVD?
Any matrix M can be decomposed into three matrices:

**M = U * Sigma * V^T**

Where:
- U: left singular vectors (orthogonal matrix, m x m)
- Sigma: diagonal matrix of singular values (m x n)
- V^T: right singular vectors (orthogonal matrix, n x n)

### Intuition
SVD decomposes a transformation into three steps:
1. **V^T**: Rotate the input
2. **Sigma**: Scale along each axis (singular values = scale factors)
3. **U**: Rotate the output

### Why It Matters for ML

**Dimensionality reduction**: Keep only the top-k singular values to get a low-rank approximation.

```python
# SVD for dimensionality reduction
M = np.random.randn(1000, 768)  # 1000 documents, 768-dim embeddings

U, sigma, Vt = np.linalg.svd(M, full_matrices=False)

# Keep top 100 dimensions (reduces 768 → 100)
k = 100
M_reduced = U[:, :k] @ np.diag(sigma[:k]) @ Vt[:k, :]

# How much information did we keep?
explained_variance = np.sum(sigma[:k]**2) / np.sum(sigma**2)
print(f"Explained variance with {k} dims: {explained_variance:.2%}")
```

**Latent Semantic Analysis (LSA)**: Apply SVD to a term-document matrix to find latent topics.

**Low-rank adaptation (LoRA)**: Uses low-rank decomposition to fine-tune LLMs efficiently — instead of updating a full weight matrix W (d x d), update two smaller matrices A (d x r) and B (r x d) where r << d.

```python
# LoRA intuition
d = 768   # Model dimension
r = 16    # Low rank

# Original weight: d x d = 589,824 parameters
W = np.random.randn(d, d)

# LoRA adaptation: d*r + r*d = 24,576 parameters (4% of original)
A = np.random.randn(d, r) * 0.01
B = np.random.randn(r, d)

# Effective weight during inference
W_adapted = W + A @ B
```

---

## Principal Component Analysis (PCA)

### What Is PCA?
PCA finds the directions (principal components) along which data varies the most. It's the most common dimensionality reduction technique.

### The Algorithm
1. Center the data (subtract mean)
2. Compute covariance matrix
3. Find eigenvectors of covariance matrix
4. Project data onto top-k eigenvectors

```python
from sklearn.decomposition import PCA

# 1000 documents with 1536-dim embeddings
embeddings = np.random.randn(1000, 1536)

# Reduce to 256 dimensions
pca = PCA(n_components=256)
reduced = pca.fit_transform(embeddings)

print(f"Original shape: {embeddings.shape}")    # (1000, 1536)
print(f"Reduced shape: {reduced.shape}")         # (1000, 256)
print(f"Explained variance: {pca.explained_variance_ratio_.sum():.2%}")

# Manual PCA (to understand what's happening)
def manual_pca(X, n_components):
    # Center data
    mean = np.mean(X, axis=0)
    X_centered = X - mean

    # Covariance matrix
    cov = (X_centered.T @ X_centered) / (X.shape[0] - 1)

    # Eigendecomposition
    eigenvalues, eigenvectors = np.linalg.eigh(cov)

    # Sort by eigenvalue (descending)
    idx = np.argsort(eigenvalues)[::-1]
    eigenvectors = eigenvectors[:, idx[:n_components]]

    # Project
    return X_centered @ eigenvectors
```

### PCA for Embedding Compression in RAG
If your embeddings are 1536-dimensional but you have millions of them, PCA to 256 dimensions can:
- Reduce storage by 6x
- Speed up vector search significantly
- Often lose less than 5% retrieval quality

---

## The Math Behind Attention (Transformers)

### Scaled Dot-Product Attention

```
Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V
```

Where:
- Q (Query): what am I looking for? (n x d_k)
- K (Key): what do I contain? (m x d_k)
- V (Value): what information do I provide? (m x d_v)
- d_k: dimension of keys (used for scaling)

```python
def scaled_dot_product_attention(Q, K, V):
    d_k = K.shape[-1]

    # Step 1: Compute attention scores
    scores = Q @ K.T / np.sqrt(d_k)  # (n x m)

    # Step 2: Softmax to get attention weights
    # Subtract max for numerical stability
    scores_stable = scores - np.max(scores, axis=-1, keepdims=True)
    weights = np.exp(scores_stable) / np.sum(np.exp(scores_stable), axis=-1, keepdims=True)

    # Step 3: Weighted sum of values
    output = weights @ V  # (n x d_v)

    return output, weights

# Example: 4 tokens, embedding dim 8
seq_len = 4
d_model = 8

Q = np.random.randn(seq_len, d_model)
K = np.random.randn(seq_len, d_model)
V = np.random.randn(seq_len, d_model)

output, attention_weights = scaled_dot_product_attention(Q, K, V)
print(f"Attention weights shape: {attention_weights.shape}")  # (4, 4)
print(f"Output shape: {output.shape}")  # (4, 8)

# Each row in attention_weights shows how much each token
# attends to every other token
```

### Why sqrt(d_k)?
Without scaling, dot products grow with dimension — for large d_k, the dot products become very large, pushing softmax into regions where gradients are tiny (saturation). Dividing by sqrt(d_k) keeps the variance stable.

---

## Practical Applications for Stone AI

### Embedding Distance Metrics

```python
# Cosine distance (most common for text embeddings)
def cosine_distance(a, b):
    return 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Euclidean distance (L2)
def euclidean_distance(a, b):
    return np.linalg.norm(a - b)

# Inner product distance (for normalized vectors, same ranking as cosine)
def inner_product_distance(a, b):
    return -np.dot(a, b)  # Negative because we want to minimize

# For pgvector:
# <=> is cosine distance
# <-> is Euclidean (L2) distance
# <#> is negative inner product
```

### Matrix Operations for Batch Processing

```python
# Compute all pairwise similarities in one operation
def batch_cosine_similarity(embeddings):
    # Normalize all vectors
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized = embeddings / norms

    # All pairwise similarities = one matrix multiplication
    similarity_matrix = normalized @ normalized.T
    return similarity_matrix

# 1000 documents, 768 dims
docs = np.random.randn(1000, 768)
sim_matrix = batch_cosine_similarity(docs)
# sim_matrix[i][j] = cosine similarity between doc i and doc j
```

---

## Common Pitfalls

| Pitfall | Why It Happens | Fix |
|---------|---------------|-----|
| Comparing unnormalized embeddings with dot product | Different magnitudes bias results | Normalize or use cosine similarity |
| Ignoring the curse of dimensionality | In very high dimensions, all distances converge | PCA or use specialized ANN indexes |
| Inverting singular matrices | Determinant near zero = numerical instability | Use pseudoinverse (np.linalg.pinv) |
| Wrong matrix multiplication order | A @ B != B @ A | Always check shapes: (m,n) @ (n,p) = (m,p) |
| Float32 vs Float64 precision | Accumulation errors in large matrix ops | Use float64 for eigendecomposition, float32 OK for inference |

---

## Key Takeaways

- Vectors ARE embeddings. Every RAG retrieval is a vector operation.
- Matrix multiplication is the core computation of every neural network layer.
- SVD enables dimensionality reduction (PCA), low-rank approximation (LoRA), and latent semantic analysis.
- Attention is just matrix multiplication with softmax — Q*K^T gives relevance scores, multiply by V gives weighted output.
- Cosine similarity = normalized dot product. Most embedding models pre-normalize, so dot product = cosine.
- Understanding these operations lets you debug retrieval failures, optimize storage, and reason about model behavior.
