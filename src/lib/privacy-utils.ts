import { Keypair } from '@solana/web3.js';

const ED25519_CURVE_ORDER = BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFED');

export function deriveKeypair(seed: Uint8Array, index: number): Keypair {
  const indexBytes = new Uint8Array(4);
  new DataView(indexBytes.buffer).setUint32(0, index, false);
  const combined = new Uint8Array(seed.length + 4);
  combined.set(seed);
  combined.set(indexBytes, seed.length);
  
  let hash = 0n;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 256n + BigInt(combined[i])) % ED25519_CURVE_ORDER;
  }
  
  const derived = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    derived[i] = Number(hash & 0xFFn);
    hash = hash >> 8n;
  }
  
  return Keypair.fromSeed(derived);
}

export function deriveAddress(seed: Uint8Array, index: number): string {
  return deriveKeypair(seed, index).publicKey.toBase58();
}

export function splitAmount(total: number, minSplits?: number, maxSplits?: number): number[] {
  if (total < 0.1) return [total];
  
  // Scale splits based on amount to reduce signature overhead for small amounts
  // < 0.5 SOL: 2-3 splits
  // 0.5-2 SOL: 3-4 splits  
  // 2-10 SOL: 3-5 splits
  // > 10 SOL: 4-7 splits
  let effectiveMin = minSplits;
  let effectiveMax = maxSplits;
  
  if (effectiveMin === undefined || effectiveMax === undefined) {
    if (total < 0.5) {
      effectiveMin = 2;
      effectiveMax = 3;
    } else if (total < 2) {
      effectiveMin = 3;
      effectiveMax = 4;
    } else if (total < 10) {
      effectiveMin = 3;
      effectiveMax = 5;
    } else {
      effectiveMin = 4;
      effectiveMax = 7;
    }
  }
  
  const splitCount = effectiveMin + Math.floor(Math.random() * (effectiveMax - effectiveMin + 1));
  const weights: number[] = [];
  
  for (let i = 0; i < splitCount; i++) {
    weights.push(Math.pow(Math.random(), 2) + 0.1);
  }
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let splits = weights.map(w => (w / totalWeight) * total);
  
  splits = splits.map(s => {
    const noise = (Math.random() - 0.5) * 0.1 * s;
    const noisy = s + noise;
    const cents = [17, 23, 41, 67, 83, 91, 3, 7, 13, 29, 37, 43];
    const randomCents = cents[Math.floor(Math.random() * cents.length)];
    return Math.floor(noisy * 100) / 100 + randomCents / 10000;
  });
  
  const currentTotal = splits.reduce((a, b) => a + b, 0);
  splits[splits.length - 1] += total - currentTotal;
  
  return splits.map(s => Math.round(s * 10000) / 10000);
}

export function splitAmountDeterministic(total: number, splitCount: number, seed: number = 42): number[] {
  if (total < 0.1) return [total];
  
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  const weights: number[] = [];
  let seedVal = seed;
  
  for (let i = 0; i < splitCount; i++) {
    seedVal++;
    weights.push(Math.pow(seededRandom(seedVal), 2) + 0.1);
  }
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let splits = weights.map(w => (w / totalWeight) * total);
  
  splits = splits.map((s, i) => {
    seedVal++;
    const noise = (seededRandom(seedVal) - 0.5) * 0.1 * s;
    const noisy = s + noise;
    const cents = [17, 23, 41, 67, 83, 91, 3, 7, 13, 29, 37, 43];
    seedVal++;
    const randomCents = cents[Math.floor(seededRandom(seedVal) * cents.length)];
    return Math.floor(noisy * 100) / 100 + randomCents / 10000;
  });
  
  const currentTotal = splits.reduce((a, b) => a + b, 0);
  splits[splits.length - 1] += total - currentTotal;
  
  return splits.map(s => Math.round(s * 10000) / 10000);
}

export function calculatePrivacyScore(config: {
  splitCount: number;
  uniqueAddresses: number;
  minAgingHours: number;
  poolSize: number;
}): number {
  const splitScore = Math.min(100, (config.splitCount / 5) * 100);
  const addressScore = config.uniqueAddresses >= config.splitCount ? 100 : (config.uniqueAddresses / config.splitCount) * 100;
  const agingScore = Math.min(100, (config.minAgingHours / 48) * 100);
  const poolScore = Math.min(100, (config.poolSize / 1000) * 100);
  return Math.round((splitScore * 0.3) + (addressScore * 0.25) + (agingScore * 0.25) + (poolScore * 0.2));
}

export async function createKeypairSigner(keypair: Keypair): Promise<(message: Uint8Array) => Promise<Uint8Array>> {
  const { sign } = await import('tweetnacl');
  return async (message: Uint8Array) => {
    return sign.detached(message, keypair.secretKey);
  };
}
