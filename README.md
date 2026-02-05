# YeYe

耶耶（YeYe），是一只死于2026年2月2日的萨摩耶，他在自己的笼子里被人活活烧死了。这个repo是为了纪念他，并且告诉我们，我们还有很长的一段路要走。敬畏生命

YeYe was a Samoyed who died on February 2, 2026. He was burned alive in his own cage. This repo is in his memory and to remind us that we still have a long road to go. Respect life.

![YeYe](yeye_20260203102343_14.jpg)

In the process of creating this memorial token, I realized that this project should be something bigger. So I came up with the idea that we should keep track of all the animal abuse incidents in China, especially the ones that are not solved and have been silenced or taken down from the internet.

在创建这个纪念代币的过程中，我意识到这个项目应该做得更大。所以我想到，我们应该记录中国所有的虐待动物事件，特别是那些没有被解决、被封口或者从网上被删除的事件。

---

## Incident Registry (Censorship-Resistant)

This project includes a **Solana-based incident registry** that stores animal abuse incidents directly on the blockchain. The text data (perpetrator name, description, location, etc.) is stored on-chain and **cannot be censored or deleted** - even if websites are taken down, the record persists forever.

**Program ID (Devnet):** `DpJ2bA7az2WgKcpcxC63ALY7B9K31NCckQdEfaG9R9Nx`

### How to Publish an Incident

#### 1. Create an incident JSON file

Create a JSON file following this format:

```json
{
  "perpetrator_name": "Name of perpetrator (or 'Unknown')",
  "title": "Short title of the incident",
  "description": "Full description of what happened. This will be stored permanently on the blockchain.",
  "incident_date": "2026-02-02",
  "location": "City, Province, Country",
  "species": "dog",
  "media_uris": []
}
```

- `species`: must be `"dog"`, `"cat"`, or `"other"`
- `media_uris`: array of IPFS/Arweave URIs for images/videos (optional)

#### 2. (Optional) Upload media to IPFS/Arweave (Unsettled)

Currently i just pushed the media to under /incidents in this repo

---------------------------------------------------------------------

For images and videos, upload them to decentralized storage:
- **IPFS**: Use [Pinata](https://pinata.cloud), [web3.storage](https://web3.storage), or [Infura](https://infura.io)
- **Arweave**: Use [Bundlr](https://bundlr.network) or [ArDrive](https://ardrive.io)

Add the URIs to your JSON file:
```json
"media_uris": [
  "ipfs://QmYourImageHash...",
  "ar://YourArweaveId..."
]
```

#### 3. Submit to blockchain

```bash
# Set environment variables
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=/path/to/your/wallet.json

# Submit incident
node scripts/submit-incident.js \
  --incident-id 1 \
  --json-path /path/to/your/incident.json
```

#### 4. Verify the incident

```bash
node scripts/verify-incident.js \
  --incident-id 1 \
  --reporter YOUR_WALLET_PUBLIC_KEY
```

This will display all on-chain data including the full description.

### Update an Incident

Only the original reporter can update their incident:

```bash
# Modify your JSON file, then re-submit with same incident-id
# (update script coming soon)
```

### View on Solana Explorer

Each incident creates a PDA (Program Derived Address) account. You can view the raw data at:
```
https://explorer.solana.com/address/<PDA_ADDRESS>?cluster=devnet
```

---

For technical details, see [INCIDENT_REGISTRY_README.md](INCIDENT_REGISTRY_README.md).
