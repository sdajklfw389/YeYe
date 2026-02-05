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

// Species mapping (reverse)
const SPECIES_NAMES = ["dog", "cat", "other"];

function formatTimestamp(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toISOString();
}

async function main() {
  const incidentId = requireArg("--incident-id");
  const reporter = requireArg("--reporter");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idlPath = path.resolve(__dirname, "../target/idl/incident_registry.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = new anchor.web3.PublicKey(idl.metadata.address);
  const program = new anchor.Program(idl, programId, provider);

  const incidentIdBn = new anchor.BN(incidentId);
  const reporterPk = new anchor.web3.PublicKey(reporter);

  const [incidentPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("incident"),
      reporterPk.toBuffer(),
      incidentIdBn.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  console.log("Fetching incident from blockchain...\n");

  const incident = await program.account.incident.fetch(incidentPda);

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                    INCIDENT RECORD (ON-CHAIN)                  ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("  PDA:              ", incidentPda.toBase58());
  console.log("  Incident ID:      ", incident.incidentId.toString());
  console.log("  Reporter:         ", incident.reporter.toBase58());
  console.log("  Recorded at:      ", formatTimestamp(incident.timestamp.toNumber()));
  console.log("");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("                         INCIDENT DETAILS                       ");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("");
  console.log("  Perpetrator:      ", incident.perpetratorName);
  console.log("  Title:            ", incident.title);
  console.log("  Incident Date:    ", incident.incidentDate);
  console.log("  Location:         ", incident.location);
  console.log("  Species:          ", SPECIES_NAMES[incident.species] || "unknown");
  console.log("");
  console.log("  Description:");
  console.log("  " + "-".repeat(61));
  // Word wrap description for readability
  const words = incident.description.split(" ");
  let line = "  ";
  for (const word of words) {
    if (line.length + word.length > 65) {
      console.log(line);
      line = "  " + word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line.trim()) console.log(line);
  console.log("  " + "-".repeat(61));
  console.log("");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("                         MEDIA FILES                            ");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("");
  if (incident.mediaUris.length === 0) {
    console.log("  (no media files attached)");
  } else {
    for (let i = 0; i < incident.mediaUris.length; i++) {
      console.log(`  [${i + 1}] ${incident.mediaUris[i]}`);
    }
  }
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("This data is stored permanently on-chain and cannot be censored.");
}

main().catch((error) => {
  console.error("Error:", error.message || error);
  process.exit(1);
});
