# SigilNet Hackathon Demo 🚀

**A standalone, hackathon-safe demonstration of SigilNet's quantum signal processing and field resonance analysis capabilities.**

> **📦 Standalone Package**: This HackathonApp is completely self-contained. It has no dependencies on the parent SigilNet repository and can be extracted, distributed, and run independently.

## ⚠️ Important: No Execution Mode

This demo package:
- ✅ Standalone signal processing algorithms
- ✅ Analyzes REAL Solana token liquidity data  
- ✅ Performs FFT and coherence calculations
- ✅ Shows efficiency predictions
- ✅ NO external package dependencies
- ❌ NO wallet connection required
- ❌ NO transaction execution
- ❌ NO private keys needed

Perfect for hackathons, demos, and showcasing the "intelligence" without the trading.

## 🌟 The WOW Factor

This demo showcases what makes SigilNet special:

### Traditional Analysis vs Quantum Signals
- **Traditional**: Price charts, candlesticks, moving averages, volume
- **Quantum**: Field coherence, entropy analysis, phase locking, resonance patterns

### What You'll See
1. **Real-time Signal Processing** - FFT spectrum analysis with coherence visualization
2. **Field Resonance States** - Chaos → Transitional → Coherent regime detection
3. **Liquidity Flow Dynamics** - Animated pool visualization with efficiency curves
4. **Anomaly Detection** - Quantum signals catch patterns traditional analysis misses
5. **Execution Planning** - Intelligent chunking based on liquidity depth

## 🏗️ Architecture

```
HackathonApp/
├── packages/
│   ├── mockSwapCore/       # Core engine with standalone algorithms
│   │   ├── src/
│   │   │   ├── liquidityModel.ts      # Standalone liquidity-aware modeling
│   │   │   ├── signalEngine.ts        # FFT + coherence (standalone DFT)
│   │   │   ├── fieldResonator.ts      # Field state analysis
│   │   │   ├── quantumAdapter.ts      # Decision scaffolding
│   │   │   ├── mockData.ts            # Jupiter API integration (read-only)
│   │   │   └── mockSwapEngine.ts      # Main orchestration
│   │   └── package.json
│   ├── api/                 # Express REST API
│   │   ├── src/
│   │   │   └── server.ts              # API endpoints
│   │   └── package.json
│   ├── ui/                  # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── SignalScope.tsx            # FFT visualizer
│   │   │   │   ├── LiquidityFlow.tsx          # Pool dynamics
│   │   │   │   ├── MockSwapPanel.tsx          # Swap interface
│   │   │   │   └── TraditionalVsQuantum.tsx   # Comparison view
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── package.json
│   └── shared/              # Common types & utils
│       ├── types/
│       ├── utils/
│       └── package.json
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
cd HackathonApp
pnpm install
```

### Run the Demo

**Option 1: Full Stack (Recommended)**
```bash
pnpm hackathon:demo
```
This starts:
- API server on `http://localhost:8787`
- UI dev server on `http://localhost:3000`

**Option 2: Separate Windows**
```bash
# Terminal 1 - API
pnpm dev:api

# Terminal 2 - UI
pnpm dev:ui
```

### Open in Browser
Navigate to `http://localhost:3000`

## 🎮 Demo Modes

### 1. DEMO Mode (Synthetic Data)
- Fast, offline operation
- Pre-configured token pairs (SOL, USDC, IMG, BONK)
- Synthetic liquidity pools
- Perfect for presentation without internet

### 2. REAL Mode (Live Solana Data)
- Fetches actual pool data from Jupiter API
- Use any tradeable Solana token address
- Real-time liquidity analysis
- NO execution - read-only queries

**Switching Modes:**
Click the `DEMO MODE` / `REAL MODE` toggle in the UI

## 🎯 Key Features

### Signal Scope Visualizer
- Real-time FFT spectrum display
- Coherence and entropy gauges
- Phase lock detection
- Harmonic analysis
- Matrix-style green theme

### Liquidity Flow Animation
- Animated token flow between pools
- Efficiency curve visualization
- Impact ratio calculation
- Pool reserve monitoring

### Traditional vs Quantum Comparison
- Side-by-side chart analysis
- Anomaly detection comparison
- Shows what quantum signals catch that traditional methods miss
- Coherence/entropy overlay on price data

### Mock Swap Panel
- Interactive token selection
- Custom Solana address input (Real Mode)
- Swap simulation with full metrics
- Execution plan with chunking strategy

## 🔧 API Endpoints

### `GET /api/quote`
Get swap quote (demo or real)
```
?inputMint=So11111111111111111111111111111111111111112
&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
&amount=100
&mode=real
```

### `POST /api/simulate`
Full simulation with signal analysis
```json
{
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 100,
  "useRealData": true
}
```

### `GET /api/signals`
Get signal frame data
```
?efficiency=95
```

### `POST /api/mock-trade`
Simulate trade execution (no real tx)

### `GET /api/tokens`
List common tokens

### `GET /api/pools`
List available demo pools

## 🎨 UI Features

### Quantum Mode Toggle
Enable/disable signal processing visualization

### Auto Demo Mode
Automatically cycles through different swaps every 5 seconds

### View Modes
- **Swap View**: Interactive swap interface with signal analysis
- **Comparison View**: Traditional vs Quantum analysis showcase

## 📊 Using Real Solana Tokens

1. Switch to **REAL MODE**
2. Check "Use custom Solana token addresses"
3. Enter any valid Solana token mint address
4. Click "SIMULATE SWAP"

The system will:
- Query Jupiter API for real routes
- Fetch actual pool liquidity
- Run standalone signal processing
- Display efficiency predictions
- **BUT**: No transaction is created or signed

## 🔒 Security & Safety

This demo is 100% safe for hackathons:
- Completely standalone with no external dependencies
- No wallet connection
- No private key handling
- No transaction signing
- No blockchain writes
- Read-only API queries only

## 🎭 Presentation Tips

### For Judges/Audience

1. **Start in Demo Mode**
   - Fast, reliable
   - Show the full interface
   - Explain the signal processing

2. **Switch to Real Mode**
   - Enter a real Solana token address
   - Show live liquidity analysis
   - Emphasize "no execution" safety

3. **Toggle to Comparison View**
   - THE WOW MOMENT
   - Side-by-side traditional vs quantum
   - Point out anomalies quantum catches
   - Explain coherence and entropy

4. **Enable Quantum Mode Toggle**
   - Turn off/on signal visualization
   - Show the difference

5. **Auto Demo Mode**
   - Let it cycle through swaps
   - Great for kiosk/exhibition mode

## 🛠️ Development

### Build All Packages
```bash
pnpm build
```

### Clean Build Artifacts
```bash
pnpm clean
```

### Package Structure
Each package can be developed independently:
```bash
cd packages/mockSwapCore && pnpm dev
cd packages/api && pnpm dev
cd packages/ui && pnpm dev
```

## 📦 Production Build

```bash
pnpm build
cd packages/api && pnpm start  # API on port 8787
cd packages/ui && pnpm preview # UI on port 4173
```

## 🎓 Technical Details

### Signal Processing
- Standalone DFT implementation for spectrum analysis
- Coherence calculated via variance analysis
- Shannon entropy for signal quality
- Phase lock detection via stability metrics
- No external dependencies

### Liquidity Modeling
- Standalone polynomial regression implementation
- Logarithmic decay model for efficiency prediction
- Effective liquidity via geometric mean
- Impact ratio calculation
- No external dependencies

### Field Resonance
- Simplified GreenResonator logic
- Regime detection (chaos/transitional/coherent)
- Phase alignment tracking
- Historical signal buffer

## 🤝 Support

This is a self-contained demo package. For questions about the production SigilNet system, contact the core team.

## 📝 License

SEE LICENSE IN ../LICENSE

---

**Built for hackathons. Powered by real signal processing. Zero execution risk.** 🎯
