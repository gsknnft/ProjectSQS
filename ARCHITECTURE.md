# 🏗️ Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     HACKATHON DEMO APP                       │
│                    (Isolated, Safe Mode)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                             │
        ▼                                             ▼
┌──────────────┐                              ┌──────────────┐
│   UI Layer   │◄────── WebSocket/REST ──────►│  API Layer   │
│   (React)    │                              │  (Express)   │
└──────────────┘                              └──────────────┘
        │                                             │
        │ Visualization                               │ Orchestration
        │                                             ▼
        │                                    ┌──────────────────┐
        │                                    │  Mock Swap Core  │
        │                                    │   (Engine)       │
        │                                    └──────────────────┘
        │                                             │
        │                           ┌─────────────────┼─────────────────┐
        │                           │                 │                 │
        │                           ▼                 ▼                 ▼
        │                    ┌──────────┐     ┌──────────┐     ┌──────────┐
        │                    │ Liquidity│     │  Signal  │     │  Field   │
        │                    │  Model   │     │  Engine  │     │Resonator │
        │                    └──────────┘     └──────────┘     └──────────┘
        │                           │                 │                 │
        │                           │                 │                 │
        └───────────────────────────┴─────────────────┴─────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            ┌──────────────┐              ┌──────────────┐
            │ REAL System  │              │ Demo/Mock    │
            │ (Read-Only)  │              │    Data      │
            └──────────────┘              └──────────────┘
                    │                               │
            ┌───────┴────────┐                     │
            │                │                     │
            ▼                ▼                     ▼
      ┌─────────┐     ┌─────────┐          ┌─────────┐
      │ Jupiter │     │ Raydium │          │Synthetic│
      │   API   │     │   API   │          │  Pools  │
      │(No Exec)│     │(No Exec)│          │         │
      └─────────┘     └─────────┘          └─────────┘
```

## Data Flow

### Demo Mode Flow
```
User Input → UI → API → Mock Swap Core
                            │
                            ├─► Liquidity Model (synthetic)
                            ├─► Signal Engine (fallback FFT)
                            └─► Field Resonator (mock)
                                        │
                                        ▼
                            Results ← Back to UI
```

### Real Mode Flow
```
User Input → UI → API → Mock Swap Core
                            │
                            ├─► Jupiter API (read-only)
                            │        │
                            │        ▼
                            ├─► Liquidity Model (REAL algorithm)
                            ├─► Signal Engine (REAL FFT from qtransform)
                            └─► Field Resonator (mock with real data)
                                        │
                                        ▼
                            Results ← Back to UI
```

## Component Responsibilities

### 1. UI Layer (`packages/ui`)
**Responsibility:** Visualization and User Interaction

**Components:**
- `SignalScope.tsx` - FFT spectrum visualization
- `LiquidityFlow.tsx` - Pool dynamics animation
- `MockSwapPanel.tsx` - User input form
- `TraditionalVsQuantum.tsx` - Comparison charts
- `App.tsx` - Main orchestrator

**Key Features:**
- Canvas-based rendering for performance
- Real-time animation loops
- Mode switching (demo/real)
- Responsive layout

### 2. API Layer (`packages/api`)
**Responsibility:** Request Handling and Business Logic

**Endpoints:**
- `GET /api/quote` - Quick quote
- `POST /api/simulate` - Full simulation
- `GET /api/signals` - Signal frame generation
- `POST /api/mock-trade` - Simulated execution
- `GET /api/tokens` - Token list
- `GET /api/pools` - Pool list

**Key Features:**
- CORS enabled
- Error handling
- Mode-aware routing
- No authentication (demo mode)

### 3. Mock Swap Core (`packages/mockSwapCore`)
**Responsibility:** Core Business Logic (Abstracted)

**Modules:**

#### `liquidityModel.ts`
- Imports `buildLiquidityAwareModel` from production
- Fallback polynomial regression
- Impact ratio calculation
- Chunking strategy

#### `signalEngine.ts`
- Imports `FFTProcessor` from qtransform (real)
- Fallback DFT implementation
- Coherence calculation
- Entropy calculation
- Phase analysis

#### `fieldResonator.ts`
- Simplified GreenResonator logic
- Field state detection (chaos/transitional/coherent)
- Phase stability tracking
- Signal history buffer

#### `quantumAdapter.ts`
- Decision making framework
- Confidence scoring
- Parameter tuning
- Quantum measurement simulation

#### `mockData.ts`
- Jupiter API integration (read-only)
- Synthetic pool generation
- Token validation
- Sweep data collection

#### `mockSwapEngine.ts`
- Main orchestrator
- Mode switching
- Result compilation
- Error handling

### 4. Shared (`packages/shared`)
**Responsibility:** Common Types and Utilities

**Contents:**
- Type definitions (SignalFrame, MockSwapResult, etc.)
- Utility functions (formatters, calculators)
- Constants (common tokens)

## Security Boundaries

### ✅ Safe Operations
```
┌────────────────────────────┐
│  Read-Only Operations      │
│                            │
│  • HTTP GET requests       │
│  • Public API queries      │
│  • Local calculations      │
│  • Visualization rendering │
│  • Data formatting         │
└────────────────────────────┘
```

### 🚫 Blocked Operations
```
┌────────────────────────────┐
│  NEVER Performed           │
│                            │
│  • Wallet connection       │
│  • Private key access      │
│  • Transaction signing     │
│  • On-chain writes         │
│  • RPC POST requests       │
└────────────────────────────┘
```

## Import Strategy

### Production Code Integration
```typescript
// In liquidityModel.ts
try {
  const module = require('../../../packages/mse/src/ghost/liquidityAwareModel');
  realFunction = module.buildLiquidityAwareModel;
} catch (e) {
  // Fallback to demo implementation
}
```

**This approach:**
- ✅ Uses real algorithms when available
- ✅ Falls back gracefully
- ✅ Keeps "special sauce" encapsulated
- ✅ Can be built standalone

## Performance Characteristics

### Computational Complexity
- FFT: O(n log n) - Sub-millisecond for 1024 points
- Liquidity Model: O(n) - Linear in sweep points
- Field Analysis: O(1) - Constant time operations
- API Response: ~50-200ms including network

### Memory Usage
- Signal History: ~100KB (100 frames)
- Canvas Rendering: GPU-accelerated
- API Response Cache: Optional
- Total Footprint: <10MB

## Deployment Options

### Development
```bash
pnpm hackathon:demo  # Concurrent API + UI
```

### Production (Static)
```bash
pnpm build           # Build all packages
# Serve static UI + API server
```

### Electron (Optional Future)
```
UI + API bundled as desktop app
Fully offline capable (demo mode only)
```

## Extension Points

### Adding New Visualizations
1. Create component in `packages/ui/src/components/`
2. Import signal data via props
3. Add to `App.tsx` layout

### Adding New Analysis
1. Create module in `packages/mockSwapCore/src/`
2. Export from `index.ts`
3. Wire into `mockSwapEngine.ts`
4. Add API endpoint if needed

### Adding Real Integrations
1. Add read-only API client
2. Update `mockData.ts` with new source
3. Ensure NO execution capability

## Testing Strategy

### Unit Tests (If Added)
- Mock data generators
- Signal calculations
- Liquidity models

### Integration Tests
- API endpoint responses
- Full simulation flow
- Mode switching

### Demo Tests
- Visual regression
- Performance benchmarks
- Real API connectivity

---

This architecture ensures:
✅ Real intelligence without execution risk
✅ Modular, maintainable code
✅ Easy to demo and explain
✅ Production code reuse without exposure
