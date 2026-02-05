const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }
  return process.argv[index + 1];
}

function requireArg(flag) {
  const value = getArg(flag);
  if (!value) {
    throw new Error(`Missing required argument: ${flag}`);
  }
  return value;
}

// Species mapping
const SPECIES_MAP = {
  dog: 0,
  cat: 1,
  other: 2,
};

async function main() {
  const incidentId = requireArg("--incident-id");
  const jsonPath = requireArg("--json-path");

  const rawJson = fs.readFileSync(jsonPath, "utf8");
  const json = JSON.parse(rawJson);

  // Validate required fields
  const requiredFields = [
    "perpetrator_name",
    "title",
    "description",
    "incident_date",
    "location",
    "species",
  ];
  for (const field of requiredFields) {
    if (json[field] === undefined || json[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Parse species
  const speciesValue = SPECIES_MAP[json.species.toLowerCase()];
  if (speciesValue === undefined) {
    throw new Error(`Invalid species: ${json.species}. Must be: dog, cat, or other`);
  }

  // Parse media URIs (optional, defaults to empty array)
  const mediaUris = json.media_uris || [];
  if (!Array.isArray(mediaUris)) {
    throw new Error("media_uris must be an array");
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "../target/idl/incident_registry.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = new anchor.web3.PublicKey(idl.metadata.address);
  const program = new anchor.Program(idl, programId, provider);

  const reporter = provider.wallet.publicKey;
  const incidentIdBn = new anchor.BN(incidentId);
  const [incidentPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("incident"),
      reporter.toBuffer(),
      incidentIdBn.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  console.log("Submitting incident to blockchain...");
  console.log("  Perpetrator:", json.perpetrator_name);
  console.log("  Title:", json.title);
  console.log("  Date:", json.incident_date);
  console.log("  Location:", json.location);
  console.log("  Species:", json.species);
  console.log("  Media URIs:", mediaUris.length > 0 ? mediaUris : "(none)");

  const tx = await program.methods
    .createIncident(
      incidentIdBn,
      json.perpetrator_name,
      json.title,
      json.description,
      json.incident_date,
      json.location,
      speciesValue,
      mediaUris
    )
    .accounts({
      incident: incidentPda,
      reporter,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("\nIncident submitted successfully!");
  console.log("  PDA:", incidentPda.toBase58());
  console.log("  Transaction:", tx);
  console.log("\nAll text data is now stored on-chain and censorship-resistant.");
}

main().catch((error) => {
  console.error("Error:", error.message || error);
  process.exit(1);
});
