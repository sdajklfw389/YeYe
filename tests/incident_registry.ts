import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IncidentRegistry } from "../target/types/incident_registry";
import { expect } from "chai";

describe("incident_registry", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.IncidentRegistry as Program<IncidentRegistry>;

  it("Creates an incident record with all text data on-chain", async () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const reporter = provider.wallet.publicKey;
    // Use timestamp-based ID to avoid conflicts with existing accounts on devnet
    const incidentId = new anchor.BN(Date.now());

    // All text data now stored directly on-chain
    const perpetratorName = "John Doe";
    const title = "Test incident report";
    const description = "This is a test description of an incident for testing purposes.";
    const incidentDate = "2026-02-04";
    const location = "Test City, Test Country";
    const species = 0; // dog
    const mediaUris = ["ipfs://QmTestHash123", "ar://TestArweaveId456"];

    const [incidentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("incident"),
        reporter.toBuffer(),
        incidentId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .createIncident(
        incidentId,
        perpetratorName,
        title,
        description,
        incidentDate,
        location,
        species,
        mediaUris
      )
      .accounts({
        incident: incidentPda,
        reporter,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create incident tx:", tx);

    // Fetch and verify the data
    const incident = await program.account.incident.fetch(incidentPda);
    
    expect(incident.incidentId.toNumber()).to.equal(incidentId.toNumber());
    expect(incident.reporter.toBase58()).to.equal(reporter.toBase58());
    expect(incident.perpetratorName).to.equal(perpetratorName);
    expect(incident.title).to.equal(title);
    expect(incident.description).to.equal(description);
    expect(incident.incidentDate).to.equal(incidentDate);
    expect(incident.location).to.equal(location);
    expect(incident.species).to.equal(species);
    expect(incident.mediaUris).to.deep.equal(mediaUris);

    console.log("Verified on-chain data:");
    console.log("  Perpetrator:", incident.perpetratorName);
    console.log("  Title:", incident.title);
    console.log("  Location:", incident.location);
    console.log("  Media URIs:", incident.mediaUris);
  });

  it("Creates an incident without media URIs", async () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const reporter = provider.wallet.publicKey;
    const incidentId = new anchor.BN(Date.now() + 1);

    const [incidentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("incident"),
        reporter.toBuffer(),
        incidentId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .createIncident(
        incidentId,
        "Unknown",
        "Incident without media",
        "Description of incident without any attached media files.",
        "2026-02-05",
        "Another City",
        1, // cat
        [] // no media
      )
      .accounts({
        incident: incidentPda,
        reporter,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create incident (no media) tx:", tx);

    const incident = await program.account.incident.fetch(incidentPda);
    expect(incident.mediaUris).to.deep.equal([]);
    expect(incident.species).to.equal(1);
  });

  it("Updates an incident (only reporter can update)", async () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const reporter = provider.wallet.publicKey;
    const incidentId = new anchor.BN(Date.now() + 2);

    const [incidentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("incident"),
        reporter.toBuffer(),
        incidentId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // First create the incident
    await program.methods
      .createIncident(
        incidentId,
        "Unknown",
        "Original title",
        "Original description.",
        "2026-02-05",
        "Original City",
        0, // dog
        []
      )
      .accounts({
        incident: incidentPda,
        reporter,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Now update it
    const updateTx = await program.methods
      .updateIncident(
        "John Smith",  // perpetrator identified
        "Updated title",
        "Updated description with more details about the incident.",
        "2026-02-04",  // corrected date
        "Updated City, Province",
        0,
        ["ipfs://QmNewMediaHash"]  // added media
      )
      .accounts({
        incident: incidentPda,
        reporter,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Update incident tx:", updateTx);

    // Verify the update
    const incident = await program.account.incident.fetch(incidentPda);
    expect(incident.perpetratorName).to.equal("John Smith");
    expect(incident.title).to.equal("Updated title");
    expect(incident.description).to.equal("Updated description with more details about the incident.");
    expect(incident.incidentDate).to.equal("2026-02-04");
    expect(incident.location).to.equal("Updated City, Province");
    expect(incident.mediaUris).to.deep.equal(["ipfs://QmNewMediaHash"]);

    console.log("Verified updated data:");
    console.log("  Perpetrator:", incident.perpetratorName);
    console.log("  Title:", incident.title);
    console.log("  Media URIs:", incident.mediaUris);
  });
});
