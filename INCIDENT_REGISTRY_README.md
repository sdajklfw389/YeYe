# Incident Registry (Censorship-Resistant On-Chain Storage)

This project records animal abuse incidents with **all critical text data stored directly on the Solana blockchain**. This ensures the information cannot be censored or deleted, even if external sources are taken down.

## Design Philosophy

- **Text data on-chain**: Perpetrator name, title, description, date, location - all stored directly on Solana
- **Media on decentralized storage**: Images/videos stored on IPFS or Arweave (URIs stored on-chain)
- **Censorship-resistant**: Even if websites are taken down, the record persists on the blockchain

## Data Model (On-Chain)

| Field | Type | Description |
|-------|------|-------------|
| `incident_id` | u64 | Unique identifier |
| `reporter` | Pubkey | Wallet that submitted the incident |
| `timestamp` | i64 | Unix timestamp when recorded |
| `perpetrator_name` | String (max 100) | Name of person who committed the act |
| `title` | String (max 200) | Title/summary of incident |
| `description` | String (max 2000) | Full description of what happened |
| `incident_date` | String (10) | Date of incident (YYYY-MM-DD) |
| `location` | String (max 200) | Where it happened |
| `species` | u8 | 0=dog, 1=cat, 2=other |
| `media_uris` | Vec\<String\> (max 10) | IPFS/Arweave URIs for images/videos |

## JSON Schema

Schema: `offchain/incident.schema.json`  
Example: `offchain/incident.example.json`

```json
{
  "perpetrator_name": "Unknown / John Doe",
  "title": "Incident title",
  "description": "Full description stored on-chain...",
  "incident_date": "2026-02-01",
  "location": "City, Province, Country",
  "species": "dog",
  "media_uris": ["ipfs://Qm...", "ar://..."]
}
```

## Build & Deploy

1. Ensure `ANCHOR_PROVIDER_URL` and `ANCHOR_WALLET` are set.
2. Build the program:

   ```bash
   anchor build
   ```

3. Deploy (cluster from `Anchor.toml`):

   ```bash
   anchor deploy
   ```

## Submit an Incident

1. Create a JSON file following the schema.
2. (Optional) Upload images/videos to IPFS or Arweave and add URIs to `media_uris`.
3. Submit on-chain:

   ```bash
   node scripts/submit-incident.js \
     --incident-id 1 \
     --json-path incidents/example/incident.json
   ```

## View an Incident

```bash
node scripts/verify-incident.js \
  --incident-id 1 \
  --reporter <REPORTER_PUBKEY>
```

This will display all on-chain data including the full description.

## Media Storage Options

For images and videos, use decentralized storage:

- **IPFS**: Use services like Pinata, Infura, or web3.storage
- **Arweave**: Use Bundlr or ArDrive for permanent storage

Example media URIs:
- `ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`
- `ar://abc123def456...`

## Notes

- All text is stored permanently on Solana - **it cannot be deleted or modified**
- The PDA seed is: `["incident", reporter, incident_id_le]`
- Storage cost is approximately 0.00089 SOL per KB
- A typical incident with 500-char description costs ~0.003 SOL
