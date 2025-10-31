/**
 * Reserve Resolution Module
 * Based on SigilNet's resolve_reserves.ts
 * 
 * Fetches TRUE on-chain reserve data from Raydium pools (AMM v4, CLMM, Registry)
 * Provides accurate liquidity information aligned with signal processing
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import axios from "axios";
import {
  LIQUIDITY_VERSION_TO_STATE_LAYOUT,
  CLMM_PROGRAM_ID,
  Api,
  type Cluster,
  type ClmmKeys,
  PoolUtils,
  clmmComputeInfoToApiInfo,
  type ApiV3Token,
} from "@raydium-io/raydium-sdk-v2";
import Decimal from "decimal.js";

// Default configuration
const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
const DEFAULT_CLUSTER = "mainnet-beta" as Cluster;
const API_TIMEOUT = 5000;

// Initialize Raydium API
const api = new Api({ cluster: DEFAULT_CLUSTER, timeout: API_TIMEOUT });

// RPC Configuration
let cachedConnection: Connection | null = null;
let customRpcUrl: string | undefined = undefined;

/**
 * Set a custom RPC URL for reserve resolution
 * This allows users to provide their own private RPC endpoint
 */
export function setCustomRpcUrl(url: string) {
  customRpcUrl = url;
  cachedConnection = null; // Clear cache to use new URL
}

/**
 * Get the custom RPC URL if set
 */
export function getCustomRpcUrl(): string | undefined {
  return customRpcUrl;
}

export type VaultInfo = {
  address: string;
  amount: bigint;
  mint: string;
};

export type PoolReserves = {
  poolType: "ammV4" | "clmm" | "registry";
  vaultA: VaultInfo;
  vaultB: VaultInfo;
  midPrice: Decimal;
  depth: number;
  lpSupply?: bigint;
  fees?: {
    tradeFeeRate: number;
    protocolFeeRate?: number;
  };
  clmmTicks?: {
    currentPrice: Decimal;
    nearestLowerTick: number;
    nearestUpperTick: number;
    lowerPrice: Decimal;
    upperPrice: Decimal;
    liquidityNet: string;
  };
  rawState: any;
};

/**
 * Get RPC connection with fallback chain:
 * 1. Custom RPC URL (if set via setCustomRpcUrl)
 * 2. Environment variable SOLANA_RPC_URL
 * 3. Default public endpoint
 */
export function getRpcConnection(overrideUrl?: string): Connection {
  // Use cached connection if available and no override
  if (cachedConnection && !overrideUrl && !customRpcUrl) {
    return cachedConnection;
  }

  // Priority: override > custom > env > default
  const rpcUrl = overrideUrl || customRpcUrl || process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL;
  
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  });

  // Cache if using default settings (no override)
  if (!overrideUrl && !customRpcUrl) {
    cachedConnection = connection;
  }

  return connection;
}

/**
 * Clear the cached connection (useful when RPC settings change)
 */
export function clearConnectionCache() {
  cachedConnection = null;
}

/**
 * Defensive conversion to PublicKey
 */
function toPubkey(x: any, label: string): PublicKey {
  try {
    if (x instanceof PublicKey) return x;
    if (typeof x === "string") return new PublicKey(x);
    if (x?.toBase58) return new PublicKey(x.toBase58());
    if (x?.length === 32) return new PublicKey(new Uint8Array(x));
  } catch {}
  throw new Error(`Bad pubkey for ${label}`);
}

/**
 * Safe account fetcher
 */
async function safeGetAccount(conn: Connection, pk: PublicKey) {
  try {
    return await getAccount(conn, pk);
  } catch (e) {
    console.warn("⚠️ Skipping vault", pk.toBase58(), (e as Error).message);
    return null;
  }
}

/**
 * Convert tick index to price
 */
export function tickIndexToPrice(
  tick: number,
  decimalsA: number,
  decimalsB: number
): Decimal {
  const price = Math.pow(1.0001, tick) * Math.pow(10, decimalsA - decimalsB);
  return new Decimal(price);
}

/**
 * Resolve pool ID from mint pair
 */
export async function resolvePoolId(
  inputMint: string,
  outputMint: string
): Promise<string | null> {
  try {
    const url = "https://api-v3.raydium.io/pools/info/mint";
    const params = new URLSearchParams({
      mint1: inputMint,
      mint2: outputMint,
    });
    
    const { data } = await axios.get(`${url}?${params.toString()}`);
    const pool = data?.data?.[0];

    if (!pool) {
      console.warn(`⚠️ No pool found for ${inputMint} ↔ ${outputMint}`);
      return null;
    }

    return pool.id || pool.ammId || null;
  } catch (e: any) {
    console.warn("⚠️ PoolId resolution failed", e.message);
    return null;
  }
}

/**
 * Get liquidity for a specific mint from pool reserves
 */
export function getLiquidityForMint(reserves: PoolReserves, mint: string): bigint | null {
  if (reserves.vaultA.mint === mint) return reserves.vaultA.amount;
  if (reserves.vaultB.mint === mint) return reserves.vaultB.amount;
  return null;
}

/**
 * Fetch Raydium pool reserves with TRUE on-chain data
 * Handles AMM v4, CLMM, and Registry fallback
 */
export async function getRaydiumPoolReserves(
  connection: Connection,
  poolId: string,
  mints?: { mintA?: string; mintB?: string }
): Promise<PoolReserves> {
  console.log("Fetching reserves for pool:", poolId);
  const poolPk = new PublicKey(poolId);
  const acc = await connection.getAccountInfo(poolPk);
  if (!acc) throw new Error("Pool account not found on chain");

  // 1) Try AMM v4 layout
  try {
    const parsed = LIQUIDITY_VERSION_TO_STATE_LAYOUT[4].decode(acc.data);

    const tokenVaultA = toPubkey(parsed.baseVault, "ammV4.baseVault");
    const tokenVaultB = toPubkey(parsed.quoteVault, "ammV4.quoteVault");

    console.log("→ AMM v4 tokenVaultA", tokenVaultA.toBase58());
    console.log("→ AMM v4 tokenVaultB", tokenVaultB.toBase58());

    const [va, vb, lpMintAcc] = await Promise.all([
      safeGetAccount(connection, tokenVaultA),
      safeGetAccount(connection, tokenVaultB),
      getMint(connection, toPubkey(parsed.lpMint, "ammV4.lpMint")),
    ]);

    if (!va || !vb) throw new Error("AMM v4 vaults missing");
    
    const midPrice = new Decimal(Number(vb.amount)).div(Number(va.amount));
    const depth = Math.min(Number(va.amount), Number(vb.amount));

    return {
      poolType: "ammV4",
      vaultA: {
        address: tokenVaultA.toBase58(),
        amount: va.amount,
        mint: va.mint.toBase58(),
      },
      vaultB: {
        address: tokenVaultB.toBase58(),
        amount: vb.amount,
        mint: vb.mint.toBase58(),
      },
      midPrice,
      depth,
      lpSupply: lpMintAcc.supply,
      fees: {
        tradeFeeRate:
          Number(parsed.tradeFeeNumerator) / Number(parsed.tradeFeeDenominator),
        protocolFeeRate:
          Number(parsed.swapFeeNumerator) / Number(parsed.swapFeeDenominator),
      },
      rawState: parsed,
    };
  } catch (e) {
    console.warn("AMM v4 decode failed:", (e as Error).message);
  }

  // 2) Try CLMM layout
  try {
    if (!mints?.mintA || !mints?.mintB) {
      throw new Error("CLMM requires mint addresses");
    }

    // Fetch pool keys from API
    const poolKeys = await api.fetchPoolKeysById({ idList: [poolId] });
    const clmmKeys = poolKeys.find((p): p is ClmmKeys => "vault" in p);
    
    if (!clmmKeys) throw new Error("CLMM pool keys not found");

    const tokenVaultA = new PublicKey(clmmKeys.vault.A);
    const tokenVaultB = new PublicKey(clmmKeys.vault.B);

    // Fetch token decimals from on-chain mint accounts
    const [mintAInfo, mintBInfo] = await Promise.all([
      getMint(connection, new PublicKey(mints.mintA)),
      getMint(connection, new PublicKey(mints.mintB)),
    ]);

    // Minimal pool info for fetching compute info
    const poolInfo = {
      id: poolPk.toBase58(),
      programId: CLMM_PROGRAM_ID.toBase58(),
      mintA: { address: mints.mintA, decimals: mintAInfo.decimals } as ApiV3Token,
      mintB: { address: mints.mintB, decimals: mintBInfo.decimals } as ApiV3Token,
      config: {} as any,
      price: 0,
    };

    const computeClmmInfo = await PoolUtils.fetchComputeClmmInfo({
      connection,
      poolInfo,
    });

    if (!computeClmmInfo) throw new Error("CLMM pool not found");

    const apiView = clmmComputeInfoToApiInfo(computeClmmInfo);
    const { ammConfig, liquidity, tickCurrent, currentPrice, tickSpacing, mintA, mintB } = computeClmmInfo;

    const [va, vb] = await Promise.all([
      safeGetAccount(connection, tokenVaultA),
      safeGetAccount(connection, tokenVaultB),
    ]);
    
    if (!va || !vb) throw new Error("CLMM vaults missing");

    return {
      poolType: "clmm",
      vaultA: {
        address: tokenVaultA.toBase58(),
        amount: va.amount,
        mint: va.mint.toBase58(),
      },
      vaultB: {
        address: tokenVaultB.toBase58(),
        amount: vb.amount,
        mint: vb.mint.toBase58(),
      },
      midPrice: new Decimal(currentPrice),
      depth: Math.min(Number(va.amount), Number(vb.amount)),
      fees: {
        tradeFeeRate: ammConfig.tradeFeeRate / 1e6,
        protocolFeeRate: ammConfig.protocolFeeRate / 1e6,
      },
      clmmTicks: {
        currentPrice: new Decimal(currentPrice),
        nearestLowerTick: tickCurrent - tickSpacing,
        nearestUpperTick: tickCurrent + tickSpacing,
        lowerPrice: tickIndexToPrice(
          tickCurrent - tickSpacing,
          mintA.decimals,
          mintB.decimals
        ),
        upperPrice: tickIndexToPrice(
          tickCurrent + tickSpacing,
          mintA.decimals,
          mintB.decimals
        ),
        liquidityNet: liquidity.toString(),
      },
      rawState: apiView,
    };
  } catch (e) {
    console.warn("CLMM decode failed:", (e as Error).message);
  }

  // 3) Fallback: Raydium public registry
  return await getRaydiumPoolReservesRegistry(connection, poolId, mints);
}

/**
 * Fallback: Fetch reserves from Raydium registry
 */
async function getRaydiumPoolReservesRegistry(
  connection: Connection,
  poolId: string,
  mints?: { mintA?: string; mintB?: string }
): Promise<PoolReserves> {
  const url = "https://api-v3.raydium.io/pools/info/ids";
  const params = new URLSearchParams({ ids: poolId });
  
  const { data } = await axios.get(`${url}?${params.toString()}`);
  const pool = data?.data?.[0];

  if (!pool) {
    // Try by mints
    if (mints?.mintA && mints?.mintB) {
      const mintUrl = "https://api-v3.raydium.io/pools/info/mint";
      const mintParams = new URLSearchParams({
        mint1: mints.mintA,
        mint2: mints.mintB,
      });
      const { data: mintData } = await axios.get(`${mintUrl}?${mintParams.toString()}`);
      const mintPool = mintData?.data?.[0];
      if (!mintPool) {
        throw new Error("Pool not found in Raydium registry");
      }
      return parseRegistryPool(connection, mintPool);
    }
    throw new Error("Pool not found in Raydium registry");
  }

  return parseRegistryPool(connection, pool);
}

/**
 * Parse pool data from registry
 */
async function parseRegistryPool(connection: Connection, pool: any): Promise<PoolReserves> {
  const tokenVaultA = new PublicKey(pool.vaultA || pool.baseVault);
  const tokenVaultB = new PublicKey(pool.vaultB || pool.quoteVault);

  const [va, vb] = await Promise.all([
    getAccount(connection, tokenVaultA),
    getAccount(connection, tokenVaultB),
  ]);

  return {
    poolType: "registry",
    vaultA: {
      address: tokenVaultA.toBase58(),
      amount: va.amount,
      mint: va.mint.toBase58(),
    },
    vaultB: {
      address: tokenVaultB.toBase58(),
      amount: vb.amount,
      mint: vb.mint.toBase58(),
    },
    midPrice: new Decimal(Number(vb.amount)).div(Number(va.amount)),
    depth: Math.min(Number(va.amount), Number(vb.amount)),
    rawState: pool,
  };
}

/**
 * Get reserves for a specific token mint
 */
export async function getRaydiumReservesForMint(
  connection: Connection,
  mint: string
): Promise<{ liquidity: bigint; price: Decimal; poolId: string } | null> {
  try {
    const url = "https://api-v3.raydium.io/pools/info/mint";
    const params = new URLSearchParams({ mint1: mint });
    const { data } = await axios.get(`${url}?${params.toString()}`);
    const pool = data?.data?.[0];

    if (!pool) {
      console.warn(`⚠️ No Raydium pool found for mint ${mint}`);
      return null;
    }

    const poolId = pool.id || pool.ammId;
    const reserves = await getRaydiumPoolReserves(connection, poolId, {
      mintA: pool.mintA?.address,
      mintB: pool.mintB?.address,
    });

    const liquidity = getLiquidityForMint(reserves, mint);
    if (liquidity === null) {
      console.warn(`⚠️ Mint ${mint} not found in pool ${poolId}`);
      return null;
    }

    return {
      liquidity,
      price: reserves.midPrice,
      poolId,
    };
  } catch (e: any) {
    console.warn("⚠️ Failed to fetch Raydium reserves for mint", mint, e.message);
    return null;
  }
}
