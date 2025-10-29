flowchart TD
    A[External Client] --> B[NextJS Middleware]
    B --> C{Api Key Valid}
    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Endpoint Router]
    E --> F{Endpoint Type}
    F -->|balance| G[Balance Handler]
    F -->|pay| H[Pay Handler]
    F -->|trx| I[Transactions Handler]
    F -->|mut| J[Mutations Handler]
    G --> K[Validate Input]
    H --> K
    I --> K
    J --> K
    K --> L{Input Valid}
    L -->|No| M[Return 400 Bad Request]
    L -->|Yes| N[Call Supabase RPC]
    N --> O{RPC Result}
    O -->|Error| P[Return Error Response]
    O -->|Success| Q[Return 200 Response]