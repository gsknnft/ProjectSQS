# 🚀 Quick Start Guide

## 1-Minute Setup

### Install and Run
```bash
cd HackathonApp
pnpm install
pnpm hackathon:demo
```

That's it! The demo will open at `http://localhost:3000`

## What Just Happened?

1. **API Server Started** (port 8787)
   - Express REST API
   - Mock swap endpoints
   - Signal processing endpoints
   - NO execution, NO wallet

2. **UI Dev Server Started** (port 3000)
   - React + Vite
   - Real-time visualizations
   - Interactive swap simulator

## First Demo Steps

### 1. Try Demo Mode (Default)
- Select "SOL" → "USDC"
- Enter amount: 100
- Click "SIMULATE SWAP"
- Watch the signal scope light up! 🟢

### 2. Switch to Real Mode
- Click "REAL MODE" button
- Check "Use custom Solana token addresses"
- Input any Solana token address
- Simulate - it fetches REAL liquidity data!
- Still NO execution 🔒

### 3. See The WOW Factor
- Click "Comparison" tab
- See traditional vs quantum analysis side-by-side
- Notice quantum catches more anomalies
- Field coherence overlay shows hidden patterns

### 4. Toggle Features
- ☑️ Quantum Mode - Show/hide signal processing
- ☑️ Auto Demo - Cycles through swaps automatically

## Demo Presentation Flow

**For judges/audience (5 minutes):**

1. **Intro** (30s)
   - "This is SigilNet's signal processing engine"
   - "No wallet, no execution, pure intelligence"

2. **Demo Mode** (1m)
   - Run a simple SOL→USDC swap
   - Point out the signal scope
   - Explain coherence and entropy

3. **Real Mode** (1.5m)
   - Switch to REAL MODE
   - Use any Solana token (e.g., BONK address)
   - Show live liquidity analysis
   - Emphasize safety: "Look, no wallet connection"

4. **Comparison View** (2m) ⭐ THE WOW MOMENT
   - Switch to Comparison tab
   - "Traditional analysis misses these patterns"
   - Point to quantum anomalies
   - "This is why we use field resonance"

5. **Q&A** (30s)
   - Answer questions about the tech

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 8787 or 3000
lsof -ti:8787 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Then restart
pnpm hackathon:demo
```

### CORS Error
Make sure both API and UI are running. The UI proxies API requests.

### Real Mode Not Working
Check internet connection - Real mode fetches from Jupiter API.

## Common Demo Tokens

Use these in Real Mode:
- SOL: `So11111111111111111111111111111111111111112`
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- BONK: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- IMG: `imGNhoP6i8z7MqZmZwXgZQFdwDG7JHFUA9cRCJrGG4e`

## Tips for Best Effect

1. **Use a big screen** - The visualizations are detailed
2. **Dark room** - The green signal scope pops better
3. **Enable auto demo** - Great for booth/kiosk mode
4. **Pre-load comparison view** - It generates on first view

## Need Help?

Check the full README.md for detailed documentation.

---

**You're ready to WOW them! 🎯**
