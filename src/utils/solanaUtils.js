import { Connection, PublicKey } from "@solana/web3.js";

const DEX_PROGRAMS = {
    ORCA: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
    RAYDIUM: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    JUPITER: "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",
};

// Use environment variable for RPC URL
const connection = new Connection(import.meta.env.VITE_HELIUS_RPC_URL);

function calculateProfit(transaction) {
    if (!transaction || !transaction.meta) return 0;

    try {
        // Get SOL balance changes
        const preBalances = transaction.meta.preBalances;
        const postBalances = transaction.meta.postBalances;

        // Calculate total SOL difference across all accounts
        let totalSolChange = 0;
        transaction.transaction.message.accountKeys.forEach(
            (account, index) => {
                const solChange =
                    (postBalances[index] - preBalances[index]) / 1e9; // Convert lamports to SOL
                totalSolChange += solChange;
            }
        );

        // If it's a sale and we received SOL (positive change), that's our profit
        // We subtract any transaction fees
        const transactionFee = transaction.meta.fee / 1e9; // Convert lamports to SOL
        const profit = totalSolChange + transactionFee; // Add back the fee since it was deducted from the balance

        // Round to 4 decimal places
        return Math.round(profit * 10000) / 10000;
    } catch (error) {
        console.error("Error calculating profit:", error);
        return 0;
    }
}

export async function processTransactions(tokenEntries) {
    const addressMap = new Map();

    for (const { token, startTimestamp, endTimestamp } of tokenEntries) {
        let tokenPublicKey;
        try {
            tokenPublicKey = new PublicKey(token);
        } catch (error) {
            console.error(`Invalid token address: ${token}`);
            continue;
        }

        let lastSignature = null;
        let signatures = [];

        try {
            do {
                // Create options object for getSignaturesForAddress
                const options = {
                    limit: 1000
                };

                // Only add before if we have a lastSignature
                if (lastSignature) {
                    options.before = lastSignature;
                }

                // Get signatures
                signatures = await connection.getSignaturesForAddress(
                    tokenPublicKey,
                    options
                );

                // Filter signatures by time range
                signatures = signatures.filter(sig => {
                    const blockTime = sig.blockTime || 0;
                    return blockTime >= startTimestamp/1000 && 
                           blockTime <= endTimestamp/1000;
                });

                // Process filtered signatures
                for (const sig of signatures) {
                    const tx = await connection.getTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0
                    });

                    if (!tx || !tx.meta || !tx.transaction || !tx.transaction.message) continue;

                    const accountKeys = tx.transaction.message.accountKeys;
                    if (!Array.isArray(accountKeys)) continue;

                    const isDex = accountKeys.some(key =>
                        Object.values(DEX_PROGRAMS).includes(key.toString())
                    );

                    if (isDex) {
                        const preBalances = new Map();
                        const postBalances = new Map();

                        tx.meta.preTokenBalances?.forEach(balance => {
                            if (balance.mint === token) {
                                preBalances.set(balance.owner, balance.uiTokenAmount.uiAmount);
                            }
                        });

                        tx.meta.postTokenBalances?.forEach(balance => {
                            if (balance.mint === token) {
                                postBalances.set(balance.owner, balance.uiTokenAmount.uiAmount);
                            }
                        });

                        for (const [wallet, postAmount] of postBalances) {
                            const preAmount = preBalances.get(wallet) || 0;
                            const difference = postAmount - preAmount;

                            if (difference !== 0) {
                                if (!addressMap.has(wallet)) {
                                    addressMap.set(wallet, new Set());
                                }
                                addressMap.get(wallet).add(token);
                            }
                        }
                    }
                }

                if (signatures.length > 0) {
                    lastSignature = signatures[signatures.length - 1].signature;
                    
                    // Break if we've reached transactions before our start time
                    const lastBlockTime = signatures[signatures.length - 1].blockTime || 0;
                    if (lastBlockTime < startTimestamp/1000) {
                        break;
                    }
                } else {
                    break; // No more signatures to process
                }

                await new Promise(resolve => setTimeout(resolve, 50));
            } while (signatures.length > 0);

        } catch (error) {
            console.error(`Error processing token ${token}:`, error);
        }
    }

    // Find overlapping addresses
    const overlappingAddresses = [];
    for (const [wallet, tokens] of addressMap.entries()) {
        if (tokens.size > 1) {
            overlappingAddresses.push(wallet);
        }
    }

    return overlappingAddresses;
}
