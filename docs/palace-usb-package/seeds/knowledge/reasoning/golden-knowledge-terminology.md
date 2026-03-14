# K-4: Golden Knowledge — Cross-Domain Terminology
# Terms with multiple meanings across domains
# Format: term → domain → definition → common confusion
# Palace USB Package — Golden Seed

---

## PURPOSE
Many terms mean different things in different contexts. LLMs frequently confuse
domain-specific meanings, especially at 32B scale. This seed provides explicit
disambiguation tables. When the agent encounters an ambiguous term, it retrieves
the correct meaning for the active domain.

---

## DISAMBIGUATION TABLE

### 1. Instance
| Domain | Definition | Example |
|--------|-----------|---------|
| Cloud/Infrastructure | A running virtual machine/server | "Spin up a new EC2 instance" |
| Object-Oriented Programming | A specific object created from a class | "Create an instance of the User class" |
| Database | A running database server process | "Connect to the PostgreSQL instance on port 5432" |
| General/Everyday | An example or occurrence | "In this instance, the error was caused by timeout" |

**Common confusion**: "Scale instances" — cloud (add more servers) vs OOP (create more objects). Context: if discussing infrastructure costs, it's cloud. If discussing memory, likely OOP.

### 2. Pipeline
| Domain | Definition | Example |
|--------|-----------|---------|
| CI/CD | Automated build/test/deploy workflow | "The GitHub Actions pipeline failed" |
| Machine Learning | Sequence of data processing and model steps | "The ML pipeline includes preprocessing, training, evaluation" |
| Data Engineering | ETL flow from source to destination | "The data pipeline ingests from Kafka to the warehouse" |
| Unix/Shell | Chaining commands with stdout→stdin | `cat file | grep pattern | sort` |
| Graphics | GPU rendering stages | "The rendering pipeline handles vertex and fragment shaders" |

### 3. Schema
| Domain | Definition | Example |
|--------|-----------|---------|
| Database | Table structure (columns, types, constraints) | "Add a column to the users schema" |
| API/JSON Schema | Validation rules for data structures | "Validate the request body against the JSON schema" |
| GraphQL | Type definitions for the API | "Define the User type in the GraphQL schema" |
| Prisma | The schema.prisma file defining models | "Update the Prisma schema and run migrate" |
| Psychology | Mental framework for understanding | "Their schema for 'success' differs from yours" |

### 4. Migration
| Domain | Definition | Example |
|--------|-----------|---------|
| Database | SQL script to change database structure | "Run the migration to add the email column" |
| Cloud | Moving from one platform to another | "We're migrating from AWS to GCP" |
| Data | Moving data between systems/formats | "Migrate user data from the old system" |
| Code/Framework | Upgrading from one version to another | "Migrate from Next.js 14 to 15" |
| Biology | Animal movement patterns | (rarely relevant in tech) |

### 5. Token
| Domain | Definition | Example |
|--------|-----------|---------|
| Authentication | Credential for API access (JWT, session) | "Send the auth token in the header" |
| AI/NLP | Smallest unit of text processed by a model | "GPT-4 has a 128K token context window" |
| Cryptocurrency | Digital asset on a blockchain | "The ERC-20 token represents voting rights" |
| Lexical Analysis | Unit of source code (keyword, identifier) | "The parser breaks code into tokens" |
| Security | Physical device for 2FA | "Use your hardware token to authenticate" |

### 6. Build
| Domain | Definition | Example |
|--------|-----------|---------|
| Software | Compile/bundle source into deployable artifact | "Run npm run build" |
| CI/CD | One execution of a pipeline | "Build #142 failed on the test step" |
| Gaming | Character configuration/loadout | "My tank build uses heavy armor" |
| Construction | Physical construction project | (rarely relevant in tech) |
| Versioning | Specific compiled version | "Deploy build 2024.01.15.3" |

### 7. Container
| Domain | Definition | Example |
|--------|-----------|---------|
| Docker/Cloud | Isolated runtime environment for an app | "Run the app in a Docker container" |
| UI/CSS | Element that wraps and constrains content | "The container has max-width: 1200px" |
| Dependency Injection | Object managing dependencies | "Register the service in the DI container" |
| Shipping/Logistics | Physical cargo container | (rarely relevant in tech) |

### 8. Worker
| Domain | Definition | Example |
|--------|-----------|---------|
| Web/Browser | Background thread (Web Worker, Service Worker) | "Offload heavy computation to a Web Worker" |
| Cloud/Queue | Process that handles background jobs | "The worker picks up jobs from the Redis queue" |
| Cloudflare | Edge function runtime (Cloudflare Workers) | "Deploy the API as a Cloudflare Worker" |
| OS | Thread or process | "Spawn 4 worker processes" |
| HR/Business | Employee | (rarely relevant in tech context) |

### 9. Environment
| Domain | Definition | Example |
|--------|-----------|---------|
| Deployment | Stage: development, staging, production | "Deploy to the staging environment" |
| OS/Shell | Environment variables (PATH, NODE_ENV) | "Set the environment variable API_KEY" |
| Runtime | Execution context (Node.js, browser, Deno) | "This code only works in the browser environment" |
| Python | Virtual environment (venv, conda) | "Activate the Python environment" |
| Physical | Surrounding conditions | (rarely relevant in tech) |

### 10. Driver
| Domain | Definition | Example |
|--------|-----------|---------|
| Database | Client library for connecting to a DB | "Install the PostgreSQL driver for Node.js" |
| OS/Hardware | Software that controls hardware | "Update the GPU driver" |
| Testing | Test runner or test framework | "The Selenium WebDriver automates the browser" |
| Business | Key factor causing change | "User growth is the main driver of revenue" |

### 11. Hook
| Domain | Definition | Example |
|--------|-----------|---------|
| React | Functions for state/lifecycle (useState, useEffect) | "Use the useEffect hook for side effects" |
| Git | Scripts triggered by git events | "The pre-commit hook runs linting" |
| WordPress | Extension point for plugins | "Add a filter hook to modify the output" |
| Webhooks | HTTP callback on events | "Set up a webhook hook for payment events" |
| General | Something that catches attention | "The landing page needs a better hook" |

### 12. Port
| Domain | Definition | Example |
|--------|-----------|---------|
| Networking | Logical endpoint for communication (0-65535) | "The server listens on port 3000" |
| Software | Adapting code for different platform | "Port the app from iOS to Android" |
| Hardware | Physical connector | "The USB-C port on the laptop" |
| Docker | Port mapping between host and container | "Map port 8080:80 in Docker" |

### 13. Key
| Domain | Definition | Example |
|--------|-----------|---------|
| Cryptography | Secret used for encryption/decryption | "Store the AES-256 encryption key securely" |
| API | Authentication credential for API access | "Set the API key in headers" |
| Database | Primary key, foreign key, unique key | "Add a foreign key constraint" |
| React | Unique identifier for list items | "Each list item needs a unique key prop" |
| Object/Map | Property name in key-value pair | "Access the value by its key" |
| SSH | Public/private key pair for authentication | "Add your SSH key to GitHub" |
| Keyboard | Physical input device key | (context usually obvious) |

### 14. State
| Domain | Definition | Example |
|--------|-----------|---------|
| React/UI | Component data that triggers re-render | "Update the state with setState" |
| Redux/Store | Global application data | "The Redux state holds user info" |
| State Machine | Current position in a finite automaton | "The state machine transitions from 'idle' to 'loading'" |
| HTTP | Stateless (no session) vs stateful (maintains session) | "REST is stateless; WebSocket is stateful" |
| Infrastructure | Current condition of a system | "The server is in a degraded state" |

### 15. Scope
| Domain | Definition | Example |
|--------|-----------|---------|
| JavaScript | Variable visibility (block, function, global) | "let has block scope; var has function scope" |
| OAuth | Permissions requested from user | "Request the 'email' and 'profile' scopes" |
| Project Management | Boundaries of what's included | "Feature X is out of scope for v1" |
| CSS | Scope of style application | "CSS Modules scope styles to the component" |

### 16. Middleware
| Domain | Definition | Example |
|--------|-----------|---------|
| Express/Next.js | Function that intercepts request/response | "Add auth middleware to check the JWT" |
| Redux | Function that intercepts dispatched actions | "Redux middleware for logging actions" |
| Message Queue | Broker between producers and consumers | "RabbitMQ acts as middleware between services" |
| Enterprise | Integration layer between systems | "The middleware connects the legacy system to the API" |

### 17. Seed
| Domain | Definition | Example |
|--------|-----------|---------|
| Database | Initial data loaded into tables | "Run the seed script to populate test data" |
| Random | Initial value for random number generator | "Set the seed for reproducible results" |
| AI/RAG | Knowledge document embedded for retrieval | "Load the golden seed into the vector store" |
| Torrent | Peer sharing a complete file | (rarely relevant) |
| Business | Initial funding | "Seed round raised $2M" |

### 18. Deployment
| Domain | Definition | Example |
|--------|-----------|---------|
| Software | Releasing code to a server/platform | "Deploy to Vercel with git push" |
| Military | Positioning of forces | (rarely relevant) |
| Kubernetes | Resource configuration for running pods | "Create a Deployment with 3 replicas" |
| ML | Putting a model into production serving | "Deploy the model to an inference endpoint" |

### 19. Domain
| Domain | Definition | Example |
|--------|-----------|---------|
| DNS/Web | Website address (stone-ai.net) | "Configure the domain's DNS records" |
| DDD | Business area/problem space | "The billing domain handles payments" |
| Math | Input set of a function | "The domain of sqrt(x) is x >= 0" |
| Email | Part after @ in email address | "Verify the email domain" |
| Active Directory | Network of computers and users | "Join the computer to the domain" |

### 20. Commit
| Domain | Definition | Example |
|--------|-----------|---------|
| Git | Saved snapshot of changes | "Make a commit with your changes" |
| Database | Finalize a transaction | "COMMIT the transaction to persist changes" |
| Social/Business | Promise to do something | "We commit to shipping by Friday" |

### 21. Branch
| Domain | Definition | Example |
|--------|-----------|---------|
| Git | Parallel line of development | "Create a feature branch" |
| Database (Neon) | Copy of database for dev/testing | "Create a Neon branch for the migration" |
| Logic | Conditional path in code | "The if/else branch handles errors" |
| Business | Physical office location | (rarely relevant in tech) |

### 22. Index
| Domain | Definition | Example |
|--------|-----------|---------|
| Database | Data structure for faster queries | "Add an index on the email column" |
| Array | Position of an element (0-based or 1-based) | "Access array[0] for the first element" |
| Search | Inverted index for full-text search | "Elasticsearch builds an inverted index" |
| Web | index.html / index.tsx — default page | "The index page is the homepage" |

### 23. Cache
| Domain | Definition | Example |
|--------|-----------|---------|
| Browser | Stored copies of web resources | "Clear the browser cache" |
| Server | In-memory data store (Redis) | "Cache the API response in Redis for 60 seconds" |
| CPU | Fast memory layers (L1, L2, L3) | "L1 cache access is ~1ns" |
| CDN | Edge-stored copies of content | "Cloudflare caches static assets at the edge" |
| Next.js | Request memoization and data cache | "Next.js caches fetch requests by default" |
| DNS | Locally stored DNS resolutions | "DNS cache TTL is 300 seconds" |

### 24. Proxy
| Domain | Definition | Example |
|--------|-----------|---------|
| Network | Intermediary server for requests | "Route traffic through a reverse proxy" |
| JavaScript | ES6 Proxy object for metaprogramming | "Use a Proxy to intercept property access" |
| Cloudflare | DNS proxy mode (orange cloud) | "Enable Cloudflare proxy for DDoS protection" |
| Design Pattern | Wrapper that controls access to an object | "The proxy pattern adds lazy loading" |

### 25. Service
| Domain | Definition | Example |
|--------|-----------|---------|
| Microservices | Independent deployable unit | "The auth service handles all authentication" |
| OS | Background process (daemon) | "Start the PostgreSQL service" |
| Cloud | Managed offering (S3, Lambda, etc.) | "Use the S3 service for file storage" |
| Service Worker | Browser background script for offline/caching | "Register the service worker for PWA" |
| Business | Work done for customers | "Our service includes 24/7 support" |

### 26. Runtime
| Domain | Definition | Example |
|--------|-----------|---------|
| Execution | Engine that runs code (V8, Node.js, Deno, Bun) | "Node.js is a JavaScript runtime" |
| Performance | Time taken during execution | "The runtime of this algorithm is O(n log n)" |
| Configuration | Settings read at startup vs compile time | "Load the config at runtime from env vars" |
| Edge | Serverless execution environment | "Cloudflare Workers uses the V8 runtime" |

### 27. Query
| Domain | Definition | Example |
|--------|-----------|---------|
| Database | SQL statement to retrieve/modify data | "Write a query to get all active users" |
| URL | Parameters after ? in a URL | "Parse the query string for search filters" |
| React Query | Client-side data fetching operation | "The useQuery hook fetches user data" |
| GraphQL | Read operation (vs mutation) | "Define a GraphQL query for the user list" |
| DNS | Domain name resolution request | "The DNS query resolved to 104.26.1.5" |

### 28. Model
| Domain | Definition | Example |
|--------|-----------|---------|
| Database/ORM | Representation of a database table | "Define a User model in Prisma" |
| AI/ML | Trained neural network | "The GPT-4 model has 1.7T parameters" |
| MVC | Business logic layer | "The model handles data validation" |
| 3D Graphics | Mesh/object in a scene | "Load the 3D model from a .glb file" |
| Business | Revenue/pricing structure | "Our subscription model has 4 tiers" |

### 29. Render
| Domain | Definition | Example |
|--------|-----------|---------|
| React/UI | Convert component to DOM elements | "The component renders a list of items" |
| Server (SSR) | Generate HTML on the server | "Server-render the page for SEO" |
| 3D/Graphics | Generate pixels from 3D data | "Render the scene at 60 FPS" |
| Video | Produce final video output from editing timeline | "Render the video in 4K" |

### 30. Endpoint
| Domain | Definition | Example |
|--------|-----------|---------|
| API | URL path that accepts requests | "The /api/users endpoint returns user data" |
| Network | Device or service at the end of a connection | "The endpoint is the client's browser" |
| Security | Device to protect (laptop, phone) | "Install endpoint detection on all devices" |
| AWS | Service endpoint URL | "The S3 endpoint for us-east-1" |

### 31. Pool
| Domain | Definition | Example |
|--------|-----------|---------|
| Database | Set of reusable connections | "The connection pool allows 20 concurrent connections" |
| Thread/Process | Set of worker threads | "The thread pool has 4 workers" |
| Object | Pre-allocated reusable objects | "Use an object pool to reduce GC pressure" |
| Mining | Group of miners sharing work | (crypto context) |

### 32. Agent
| Domain | Definition | Example |
|--------|-----------|---------|
| AI | Autonomous entity that performs tasks | "The AI agent handles customer support" |
| Stone AI | One of 44 specialized task performers | "Agent #12 handles code review" |
| HTTP | User-Agent header identifying the client | "Check the User-Agent for bot detection" |
| Business | Sales or service representative | "Contact your insurance agent" |

### 33. Artifact
| Domain | Definition | Example |
|--------|-----------|---------|
| CI/CD | Build output (binary, package, image) | "Upload the build artifact to the registry" |
| AI (Claude) | Rich content block in conversation | "Claude generated a code artifact" |
| Data | Unintended distortion in data | "The spike is an artifact of the sampling method" |
| Archaeology | Physical historical object | (rarely relevant) |

### 34. Resolution
| Domain | Definition | Example |
|--------|-----------|---------|
| DNS | Converting domain name to IP | "DNS resolution took 50ms" |
| Display | Pixel dimensions (1920x1080) | "The display resolution is 4K" |
| Package | Determining which version to install | "npm resolution picked version 3.2.1" |
| Conflict | Solving a disagreement or issue | "The merge conflict resolution took 10 minutes" |
| Image | Detail level (DPI/PPI) | "Export at 300 DPI for print" |

### 35. Session
| Domain | Definition | Example |
|--------|-----------|---------|
| Web/Auth | Period of user activity (tracked by cookie/token) | "The session expires after 24 hours" |
| Database | Active connection to database | "The database session was terminated" |
| Terminal | Active shell/terminal instance | "Open a new tmux session" |
| AI | Conversation context window | "This session started 5 minutes ago" |

### 36. Cluster
| Domain | Definition | Example |
|--------|-----------|---------|
| Kubernetes | Set of nodes running containers | "Deploy to the production cluster" |
| Database | Group of replicated DB servers | "The PostgreSQL cluster has 3 nodes" |
| Computing | Group of connected computers | "The compute cluster has 100 GPUs" |
| Data Science | Group of similar data points | "K-means found 5 clusters in the data" |

### 37. Payload
| Domain | Definition | Example |
|--------|-----------|---------|
| HTTP | Body content of a request/response | "The JSON payload contains user data" |
| JWT | Claims section of the token | "Store the user role in the JWT payload" |
| Webhook | Data sent with the webhook notification | "Parse the Stripe webhook payload" |
| Security | Malicious code delivered by an exploit | "The payload executes a reverse shell" |

### 38. Sink
| Domain | Definition | Example |
|--------|-----------|---------|
| Security | Location where tainted data ends up | "The innerHTML is an XSS sink" |
| Data | Destination for data flow | "The data sink is the analytics warehouse" |
| Logging | Output destination for logs | "Configure the log sink to CloudWatch" |
| Kitchen | Physical basin | (never relevant in tech) |

### 39. Reflection
| Domain | Definition | Example |
|--------|-----------|---------|
| Programming | Inspecting/modifying code at runtime | "Java reflection accesses private fields" |
| AI | Model examining its own reasoning | "Reflection improves answer quality" |
| Personal | Thinking about experiences | "Time for reflection on the sprint" |

### 40. Primitive
| Domain | Definition | Example |
|--------|-----------|---------|
| Programming | Basic data type (string, number, boolean) | "Primitives are passed by value in JS" |
| UI/Design | Basic reusable component (button, input) | "Build from design primitives" |
| Cryptography | Basic cryptographic operation | "AES is a symmetric primitive" |
| Graphics | Basic shape (point, line, triangle) | "The GPU renders primitives" |

### 41-50: Additional Terms (Compact Format)

| Term | Domains & Meanings |
|------|-------------------|
| **Manifest** | Package (package.json), PWA (manifest.json), Kubernetes (YAML config), Shipping (cargo list) |
| **Registry** | npm (package registry), Docker (image registry), Windows (system registry), Domain (domain registrar) |
| **Vault** | HashiCorp (secrets management), Obsidian (knowledge base folder), Physical (secure storage) |
| **Channel** | Slack/Discord (communication), Go (goroutine communication), TV (broadcast), Marketing (distribution) |
| **Thread** | OS (execution unit), Forum (conversation), Email (conversation chain), CPU (hardware thread) |
| **Ticket** | Jira (work item), Support (help request), Kerberos (authentication), Transport (admission) |
| **Dispatch** | Redux (send action), Event (trigger event), Stone AI (send to agent), Logistics (send vehicle) |
| **Handshake** | TLS (connection setup), TCP (SYN/ACK), Business (agreement), Protocol (initialization exchange) |
| **Snapshot** | Database (point-in-time backup), VM (saved state), Testing (reference output), Git (commit state) |
| **Orchestration** | Kubernetes (container management), Workflow (task coordination), Music (arrangement) |

### 51-55: Terms That Cause Specific LLM Errors

| Term | Frequent Mistake | Correct Usage |
|------|-----------------|---------------|
| **Authorization vs Authentication** | Used interchangeably | Authentication = "who are you?" (login). Authorization = "what can you do?" (permissions). 401 = not authenticated. 403 = not authorized. |
| **Encryption vs Hashing** | Used interchangeably | Encryption is reversible (AES — encrypt/decrypt). Hashing is one-way (bcrypt — cannot retrieve original). Passwords are HASHED, not encrypted. |
| **Concurrency vs Parallelism** | Used interchangeably | Concurrency = handling multiple tasks (may switch between them). Parallelism = executing simultaneously (requires multiple cores). Node.js is concurrent but single-threaded. |
| **Library vs Framework** | Used interchangeably | Library = you call it (lodash, axios). Framework = it calls you (Next.js, Express). Inversion of control is the distinction. |
| **Parameter vs Argument** | Used interchangeably | Parameter = variable in function definition. Argument = value passed when calling. `function foo(param)` → `foo(argument)` |

---

## USAGE GUIDE

When an agent encounters an ambiguous term:
1. Identify the active domain (what is the user talking about?)
2. Look up the term in this table
3. Use the domain-specific definition
4. If still ambiguous, ask the user which domain they mean

**Embedding hint**: Each term entry (###) is a retrieval unit. The term name is the retrieval key.
For terms 41-55, the full table row is the unit.
