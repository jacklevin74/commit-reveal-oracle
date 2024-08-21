import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommitReveal } from "../target/types/commit_reveal";
import { sha256 } from "crypto-hash";

describe("commit-reveal", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.CommitReveal as Program<CommitReveal>;
  const provider = anchor.AnchorProvider.env();
  const user = provider.wallet;

  it("Commits a SHA-256 hash of a random number and compares it after 3 seconds", async () => {
    // Generate a random number (between 1 and 1000)
    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    console.log("Random number:", randomNumber);

    // Hash the random number with SHA-256
    const hashBuffer = await sha256(randomNumber.toString());
    const hashArray = Array.from(hashBuffer);
    const hashBytes = Uint8Array.from(hashArray);

    console.log("Hash (SHA-256):", Buffer.from(hashBytes).toString('hex'));

    // Define the PDA for the hash record
    const [hashRecordPda] = await anchor.web3.PublicKey.findProgramAddress(
      [user.publicKey.toBuffer(), Buffer.from("hash_record")],
      program.programId
    );

    // Send the transaction to store the hash
    const tx = await program.methods
      .storeHashAndBlock(hashBytes)
      .accounts({
        hashRecord: hashRecordPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature for storing hash:", tx);

    // Wait for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Send the transaction to compare the hash
    const comparisonResult = await program.methods
      .compareHashWithBigInt(new anchor.BN(randomNumber))
      .accounts({
        hashRecord: hashRecordPda,
        user: user.publicKey,
      })
      .rpc();

    console.log("Transaction signature for comparison:", comparisonResult);

    // Fetch and print the comparison result
    const hashRecord = await program.account.hashRecord.fetch(hashRecordPda);
    const isSuccess = hashRecord.hash.every((byte: number, i: number) => byte === hashBytes[i]);

    console.log("Comparison result:", isSuccess ? "Match" : "No Match");
  });
});

