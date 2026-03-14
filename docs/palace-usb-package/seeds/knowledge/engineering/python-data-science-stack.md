# Python Data Science Stack

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 44 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. NumPy — Broadcasting

Broadcasting lets NumPy operate on arrays of different shapes without copying data.

### Broadcasting Rules
1. If arrays differ in ndim, the shape of the smaller is padded with 1s on the left.
2. Arrays with size 1 along a dimension act as if they had the size of the largest array in that dimension.
3. If sizes differ and neither is 1, raise an error.

```python
import numpy as np

# Shape (3,) + shape (3,1) → broadcasts to (3,3)
a = np.array([1, 2, 3])          # shape (3,)
b = np.array([[10], [20], [30]])  # shape (3,1)
result = a + b
# [[11, 12, 13],
#  [21, 22, 23],
#  [31, 32, 33]]

# Normalize columns — subtract column means
data = np.random.randn(1000, 5)
col_means = data.mean(axis=0)    # shape (5,)
normalized = data - col_means    # broadcasts (1000,5) - (5,) → (1000,5)

# Outer product via broadcasting
x = np.arange(5).reshape(5, 1)  # (5,1)
y = np.arange(5).reshape(1, 5)  # (1,5)
outer = x * y                    # (5,5) outer product
```

### Anti-Pattern: Using Python Loops on Arrays

```python
# BAD — 100x slower
result = np.zeros(len(data))
for i in range(len(data)):
    result[i] = data[i] * 2 + 1

# GOOD — vectorized
result = data * 2 + 1
```

---

## 2. NumPy — Vectorization and Universal Functions

```python
# Vectorize a custom function (last resort — still has overhead)
@np.vectorize
def custom_transform(x: float) -> float:
    if x > 0:
        return np.log1p(x)
    return 0.0

# BETTER — use np.where for conditional vectorization
result = np.where(data > 0, np.log1p(data), 0.0)

# Boolean indexing — fully vectorized
positives = data[data > 0]
large_values = data[np.abs(data) > 2.0]

# Fancy indexing
indices = np.array([0, 3, 7, 12])
selected = data[indices]

# Structured operations
a = np.random.randn(10000)
# Clip + scale in one chain — no intermediate arrays with inplace
np.clip(a, -3, 3, out=a)
np.multiply(a, 100, out=a)
```

---

## 3. NumPy — Memory Layout (C vs Fortran Order)

```python
# C order (row-major) — default. Rows are contiguous in memory.
c_array = np.zeros((1000, 1000), order='C')

# Fortran order (column-major). Columns are contiguous.
f_array = np.zeros((1000, 1000), order='F')

# Performance: iterate over contiguous dimension
# For C order, row operations are fast
row_sums = c_array.sum(axis=1)  # Fast — contiguous access

# For Fortran order, column operations are fast
col_sums = f_array.sum(axis=0)  # Fast — contiguous access

# Check layout
print(c_array.flags)
# C_CONTIGUOUS : True
# F_CONTIGUOUS : False

# Views vs copies — views share memory
original = np.arange(12).reshape(3, 4)
view = original[1:3, :]     # View — no copy
copy = original[1:3, :].copy()  # Explicit copy

view[0, 0] = 999  # Modifies original too
copy[0, 0] = 888  # Does NOT modify original

# Structured arrays for heterogeneous data
dt = np.dtype([('name', 'U20'), ('age', 'i4'), ('score', 'f8')])
records = np.array([('Alice', 30, 95.5), ('Bob', 25, 87.3)], dtype=dt)
print(records['name'])   # ['Alice' 'Bob']
print(records['score'].mean())  # 91.4
```

---

## 4. Pandas — GroupBy Operations

```python
import pandas as pd

df = pd.DataFrame({
    'department': ['eng', 'eng', 'sales', 'sales', 'eng', 'sales'],
    'name': ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'],
    'salary': [120000, 110000, 90000, 95000, 130000, 85000],
    'tenure_years': [5, 3, 7, 2, 8, 1],
})

# Basic groupby with multiple aggregations
summary = df.groupby('department').agg(
    avg_salary=('salary', 'mean'),
    max_salary=('salary', 'max'),
    headcount=('name', 'count'),
    avg_tenure=('tenure_years', 'mean'),
)

# Named aggregation with custom functions
def salary_range(series: pd.Series) -> float:
    return series.max() - series.min()

summary2 = df.groupby('department').agg(
    salary_spread=('salary', salary_range),
    top_earner=('salary', 'idxmax'),
)

# Transform — returns same-shaped output (useful for normalization)
df['salary_zscore'] = df.groupby('department')['salary'].transform(
    lambda x: (x - x.mean()) / x.std()
)

# Filter — keep groups meeting a condition
big_departments = df.groupby('department').filter(lambda g: len(g) >= 3)

# Apply — flexible but slower
def rank_within_group(group: pd.DataFrame) -> pd.DataFrame:
    group = group.copy()
    group['rank'] = group['salary'].rank(ascending=False, method='dense')
    return group

ranked = df.groupby('department').apply(rank_within_group, include_groups=False)
```

---

## 5. Pandas — Merge Operations

```python
orders = pd.DataFrame({
    'order_id': [1, 2, 3, 4],
    'customer_id': [101, 102, 101, 103],
    'amount': [50.0, 75.0, 30.0, 120.0],
})

customers = pd.DataFrame({
    'customer_id': [101, 102, 104],
    'name': ['Alice', 'Bob', 'Dave'],
    'tier': ['gold', 'silver', 'gold'],
})

# Inner join — only matching rows
inner = pd.merge(orders, customers, on='customer_id', how='inner')

# Left join — keep all orders, NaN for missing customers
left = pd.merge(orders, customers, on='customer_id', how='left')

# Anti-join — orders with no matching customer
anti = orders[~orders['customer_id'].isin(customers['customer_id'])]

# Merge with different column names
pd.merge(orders, customers, left_on='customer_id', right_on='customer_id')

# Merge indicator — debug which rows matched
debug = pd.merge(orders, customers, on='customer_id', how='outer', indicator=True)
print(debug['_merge'].value_counts())
# both          3
# left_only     1
# right_only    1
```

### Anti-Pattern: Chained `merge()` Without Index Reset

```python
# BAD — can produce duplicate indices causing silent bugs
result = df1.merge(df2, on='a').merge(df3, on='b')

# GOOD — reset index between merges
result = (
    df1.merge(df2, on='a')
    .reset_index(drop=True)
    .merge(df3, on='b')
    .reset_index(drop=True)
)
```

---

## 6. Pandas — Window Functions

```python
# Rolling windows — time-series smoothing
df = pd.DataFrame({
    'date': pd.date_range('2025-01-01', periods=100, freq='D'),
    'value': np.random.randn(100).cumsum() + 100,
})
df = df.set_index('date')

# Simple moving average
df['sma_7'] = df['value'].rolling(window=7).mean()
df['sma_30'] = df['value'].rolling(window=30).mean()

# Exponential moving average — more weight to recent values
df['ema_7'] = df['value'].ewm(span=7).mean()

# Rolling standard deviation for volatility
df['volatility'] = df['value'].rolling(window=20).std()

# Expanding window — cumulative statistics
df['cummax'] = df['value'].expanding().max()
df['cumulative_mean'] = df['value'].expanding().mean()

# Rank within a rolling window
df['rolling_rank'] = df['value'].rolling(window=10).rank(pct=True)

# Shift for lag features
df['prev_day'] = df['value'].shift(1)
df['pct_change'] = df['value'].pct_change()
df['7d_return'] = df['value'].pct_change(periods=7)
```

---

## 7. Pandas — Performance Best Practices

```python
# 1. Use categorical dtype for low-cardinality string columns
df['department'] = df['department'].astype('category')
# Memory: "sales" stored once, referenced by integer codes

# 2. Use PyArrow backend (Pandas 2.0+) for massive speedups
df = pd.read_csv('large.csv', dtype_backend='pyarrow')

# 3. Vectorized string operations instead of apply
# BAD
df['upper'] = df['name'].apply(lambda x: x.upper())
# GOOD
df['upper'] = df['name'].str.upper()

# 4. Use query() for readable filtering
# BAD — creates intermediate boolean arrays
result = df[(df['salary'] > 100000) & (df['department'] == 'eng')]
# GOOD — uses numexpr under the hood, faster for large DataFrames
result = df.query('salary > 100000 and department == "eng"')

# 5. Avoid iterrows — always vectorize
# BAD — 100-1000x slower
for idx, row in df.iterrows():
    df.at[idx, 'bonus'] = row['salary'] * 0.1
# GOOD
df['bonus'] = df['salary'] * 0.1

# 6. Read only needed columns
df = pd.read_csv('huge.csv', usecols=['id', 'name', 'value'])

# 7. Chunk processing for files that don't fit in memory
chunks = pd.read_csv('massive.csv', chunksize=50000)
results = []
for chunk in chunks:
    processed = chunk.groupby('category')['amount'].sum()
    results.append(processed)
final = pd.concat(results).groupby(level=0).sum()
```

---

## 8. Matplotlib + Seaborn — Publication-Quality Plots

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Set global style
sns.set_theme(style="whitegrid", font_scale=1.2)
plt.rcParams.update({
    'figure.figsize': (10, 6),
    'figure.dpi': 150,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'font.family': 'sans-serif',
})

# Multi-panel figure
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Panel 1: Distribution
sns.histplot(data=df, x='salary', hue='department', kde=True, ax=axes[0, 0])
axes[0, 0].set_title('Salary Distribution by Department')

# Panel 2: Scatter with regression
sns.regplot(data=df, x='tenure_years', y='salary', ax=axes[0, 1],
            scatter_kws={'alpha': 0.5}, line_kws={'color': 'red'})
axes[0, 1].set_title('Salary vs Tenure')

# Panel 3: Box plot
sns.boxplot(data=df, x='department', y='salary', ax=axes[1, 0])
axes[1, 0].set_title('Salary Spread')

# Panel 4: Time series
axes[1, 1].plot(ts_df.index, ts_df['value'], linewidth=1, alpha=0.7, label='Raw')
axes[1, 1].plot(ts_df.index, ts_df['sma_30'], linewidth=2, label='30-day SMA')
axes[1, 1].fill_between(ts_df.index,
                         ts_df['value'] - ts_df['volatility'],
                         ts_df['value'] + ts_df['volatility'],
                         alpha=0.2, label='Volatility Band')
axes[1, 1].legend()
axes[1, 1].set_title('Time Series')

plt.tight_layout()
plt.savefig('analysis.png')
plt.show()
```

### Heatmap for Correlation Matrix

```python
corr = df.select_dtypes(include='number').corr()
mask = np.triu(np.ones_like(corr, dtype=bool))  # Upper triangle mask

fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(corr, mask=mask, annot=True, fmt='.2f', cmap='RdBu_r',
            center=0, square=True, linewidths=0.5, ax=ax,
            vmin=-1, vmax=1)
ax.set_title('Feature Correlation Matrix')
plt.savefig('correlation_matrix.png')
```

---

## 9. Scikit-learn — Pipeline Patterns

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score, GridSearchCV

# Define feature groups
numeric_features = ['age', 'income', 'tenure']
categorical_features = ['department', 'region']

# Build preprocessing pipeline
numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
])

categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
])

preprocessor = ColumnTransformer([
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features),
])

# Full pipeline — preprocessing + model
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', GradientBoostingClassifier(random_state=42)),
])

# Cross-validation
scores = cross_val_score(pipeline, X, y, cv=5, scoring='f1_weighted')
print(f"F1: {scores.mean():.3f} ± {scores.std():.3f}")

# Hyperparameter search — use __ to reach nested params
param_grid = {
    'classifier__n_estimators': [100, 200, 500],
    'classifier__max_depth': [3, 5, 7],
    'classifier__learning_rate': [0.01, 0.1, 0.2],
    'preprocessor__num__imputer__strategy': ['mean', 'median'],
}

search = GridSearchCV(
    pipeline, param_grid, cv=5,
    scoring='f1_weighted', n_jobs=-1, verbose=1,
)
search.fit(X_train, y_train)
print(f"Best params: {search.best_params_}")
print(f"Best score: {search.best_score_:.3f}")

# Use best model
best_model = search.best_estimator_
y_pred = best_model.predict(X_test)
```

---

## 10. Scikit-learn — Feature Engineering Patterns

```python
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_selection import SelectKBest, f_classif
import numpy as np

class DateFeatureExtractor(BaseEstimator, TransformerMixin):
    """Custom transformer — extract features from datetime columns."""

    def __init__(self, date_column: str = 'date'):
        self.date_column = date_column

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        dt = pd.to_datetime(X[self.date_column])
        X['day_of_week'] = dt.dt.dayofweek
        X['month'] = dt.dt.month
        X['is_weekend'] = (dt.dt.dayofweek >= 5).astype(int)
        X['quarter'] = dt.dt.quarter
        X = X.drop(columns=[self.date_column])
        return X

class InteractionFeatures(BaseEstimator, TransformerMixin):
    """Create interaction features between numeric columns."""

    def __init__(self, columns: list[tuple[str, str]] | None = None):
        self.columns = columns

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        if self.columns:
            for col_a, col_b in self.columns:
                X[f'{col_a}_x_{col_b}'] = X[col_a] * X[col_b]
                X[f'{col_a}_div_{col_b}'] = X[col_a] / X[col_b].replace(0, np.nan)
        return X

# Feature selection in pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('selector', SelectKBest(f_classif, k=20)),
    ('classifier', GradientBoostingClassifier()),
])
```

---

## 11. Cross-Validation Strategies

```python
from sklearn.model_selection import (
    StratifiedKFold,
    TimeSeriesSplit,
    GroupKFold,
    RepeatedStratifiedKFold,
)

# Stratified — preserves class distribution (default for classifiers)
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Time series — no leakage from future to past
tscv = TimeSeriesSplit(n_splits=5, gap=7)  # 7-sample gap between train/test
for train_idx, test_idx in tscv.split(X):
    # train always before test, with gap
    pass

# Group — ensure same group (e.g., same user) never in both train and test
gkf = GroupKFold(n_splits=5)
scores = cross_val_score(pipeline, X, y, cv=gkf, groups=user_ids)

# Repeated — more stable estimate
rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42)
scores = cross_val_score(pipeline, X, y, cv=rskf, scoring='roc_auc')
print(f"AUC: {scores.mean():.3f} ± {scores.std():.3f}")
```

---

## 12. Anti-Patterns in Data Science

| Anti-Pattern | Fix |
|---|---|
| Fitting scaler on full data before split | Fit only on training data (use Pipeline) |
| Using accuracy for imbalanced data | Use F1, precision-recall, AUC |
| Ignoring data leakage in features | Audit feature creation timing |
| Not setting random seeds | Set `random_state` everywhere |
| `df.apply()` on every operation | Vectorize with built-in methods |
| Loading entire CSV when only 3 cols needed | Use `usecols` parameter |
| Plotting without labels/titles | Always label axes and title |
| Ignoring dtype optimization | Use `.astype('category')`, downcast ints |
| Not using pipelines | Always use `Pipeline` + `ColumnTransformer` |
| Manual train/test splits | Use `cross_val_score` or proper splitters |
