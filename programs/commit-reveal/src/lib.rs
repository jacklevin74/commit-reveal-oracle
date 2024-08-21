use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};

declare_id!("ApZkb8Ui4yH3cw86v42uCZnDZb4LUhhyQff6Bagre1Na");

#[program]
pub mod commit_reveal {
    use super::*;

    pub fn store_hash_and_block(ctx: Context<StoreHashAndBlock>, hash: [u8; 32]) -> Result<()> {
        let hash_record = &mut ctx.accounts.hash_record;
        hash_record.hash = hash;
        hash_record.block_id = Clock::get()?.slot; // Storing the current block ID
        Ok(())
    }

    pub fn compare_hash_with_big_int(ctx: Context<CompareHashWithBigInt>, big_int: u64) -> Result<bool> {
        let hash_record = &ctx.accounts.hash_record;
        let current_block_id = Clock::get()?.slot;

        // Ensure at least 6 blocks have passed
        if current_block_id < hash_record.block_id + 6 {
            return Ok(false);
        }

        // Compute SHA-256 of the big_int
        let mut hasher = Sha256::new();
        hasher.update(big_int.to_le_bytes());
        let result_hash = hasher.finalize();

        // Compare the hashes
        if result_hash.as_slice() == hash_record.hash {
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

#[account]
pub struct HashRecord {
    pub hash: [u8; 32],
    pub block_id: u64,
}

#[derive(Accounts)]
pub struct StoreHashAndBlock<'info> {
    #[account(mut, seeds = [user.key.as_ref(), b"hash_record"], bump)]
    pub hash_record: Account<'info, HashRecord>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompareHashWithBigInt<'info> {
    #[account(mut, seeds = [user.key.as_ref(), b"hash_record"], bump)]
    pub hash_record: Account<'info, HashRecord>,
    #[account(mut)]
    pub user: Signer<'info>,
}

