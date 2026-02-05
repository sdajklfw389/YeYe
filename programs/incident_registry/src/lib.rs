use anchor_lang::prelude::*;

declare_id!("DpJ2bA7az2WgKcpcxC63ALY7B9K31NCckQdEfaG9R9Nx");

// Maximum lengths for string fields (in bytes)
const MAX_PERPETRATOR_NAME_LEN: usize = 100;
const MAX_TITLE_LEN: usize = 200;
const MAX_DESCRIPTION_LEN: usize = 2000;
const MAX_DATE_LEN: usize = 10; // "YYYY-MM-DD"
const MAX_LOCATION_LEN: usize = 200;
const MAX_MEDIA_URI_LEN: usize = 128;
const MAX_MEDIA_URIS: usize = 10;

#[program]
pub mod incident_registry {
    use super::*;

    pub fn create_incident(
        ctx: Context<CreateIncident>,
        incident_id: u64,
        perpetrator_name: String,
        title: String,
        description: String,
        incident_date: String,
        location: String,
        species: u8,
        media_uris: Vec<String>,
    ) -> Result<()> {
        require!(
            perpetrator_name.len() <= MAX_PERPETRATOR_NAME_LEN,
            IncidentError::PerpetratorNameTooLong
        );
        require!(
            title.len() <= MAX_TITLE_LEN,
            IncidentError::TitleTooLong
        );
        require!(
            description.len() <= MAX_DESCRIPTION_LEN,
            IncidentError::DescriptionTooLong
        );
        require!(
            incident_date.len() <= MAX_DATE_LEN,
            IncidentError::DateTooLong
        );
        require!(
            location.len() <= MAX_LOCATION_LEN,
            IncidentError::LocationTooLong
        );
        require!(
            species <= 2,
            IncidentError::InvalidSpecies
        );
        require!(
            media_uris.len() <= MAX_MEDIA_URIS,
            IncidentError::TooManyMediaUris
        );
        for uri in &media_uris {
            require!(
                uri.len() <= MAX_MEDIA_URI_LEN,
                IncidentError::MediaUriTooLong
            );
        }

        let incident = &mut ctx.accounts.incident;
        incident.incident_id = incident_id;
        incident.reporter = ctx.accounts.reporter.key();
        incident.timestamp = Clock::get()?.unix_timestamp;
        incident.perpetrator_name = perpetrator_name;
        incident.title = title;
        incident.description = description;
        incident.incident_date = incident_date;
        incident.location = location;
        incident.species = species;
        incident.media_uris = media_uris;
        incident.bump = ctx.bumps.incident;
        Ok(())
    }

    /// Update an existing incident (only the original reporter can update)
    pub fn update_incident(
        ctx: Context<UpdateIncident>,
        perpetrator_name: String,
        title: String,
        description: String,
        incident_date: String,
        location: String,
        species: u8,
        media_uris: Vec<String>,
    ) -> Result<()> {
        require!(
            perpetrator_name.len() <= MAX_PERPETRATOR_NAME_LEN,
            IncidentError::PerpetratorNameTooLong
        );
        require!(
            title.len() <= MAX_TITLE_LEN,
            IncidentError::TitleTooLong
        );
        require!(
            description.len() <= MAX_DESCRIPTION_LEN,
            IncidentError::DescriptionTooLong
        );
        require!(
            incident_date.len() <= MAX_DATE_LEN,
            IncidentError::DateTooLong
        );
        require!(
            location.len() <= MAX_LOCATION_LEN,
            IncidentError::LocationTooLong
        );
        require!(
            species <= 2,
            IncidentError::InvalidSpecies
        );
        require!(
            media_uris.len() <= MAX_MEDIA_URIS,
            IncidentError::TooManyMediaUris
        );
        for uri in &media_uris {
            require!(
                uri.len() <= MAX_MEDIA_URI_LEN,
                IncidentError::MediaUriTooLong
            );
        }

        let incident = &mut ctx.accounts.incident;
        incident.perpetrator_name = perpetrator_name;
        incident.title = title;
        incident.description = description;
        incident.incident_date = incident_date;
        incident.location = location;
        incident.species = species;
        incident.media_uris = media_uris;
        // Note: incident_id, reporter, timestamp, and bump remain unchanged
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(
    incident_id: u64,
    perpetrator_name: String,
    title: String,
    description: String,
    incident_date: String,
    location: String,
    species: u8,
    media_uris: Vec<String>
)]
pub struct CreateIncident<'info> {
    #[account(
        init,
        payer = reporter,
        space = Incident::space(&perpetrator_name, &title, &description, &incident_date, &location, &media_uris),
        seeds = [b"incident", reporter.key().as_ref(), &incident_id.to_le_bytes()],
        bump
    )]
    pub incident: Account<'info, Incident>,
    #[account(mut)]
    pub reporter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    perpetrator_name: String,
    title: String,
    description: String,
    incident_date: String,
    location: String,
    species: u8,
    media_uris: Vec<String>
)]
pub struct UpdateIncident<'info> {
    #[account(
        mut,
        realloc = Incident::space(&perpetrator_name, &title, &description, &incident_date, &location, &media_uris),
        realloc::payer = reporter,
        realloc::zero = false,
        seeds = [b"incident", reporter.key().as_ref(), &incident.incident_id.to_le_bytes()],
        bump = incident.bump,
        has_one = reporter @ IncidentError::UnauthorizedReporter
    )]
    pub incident: Account<'info, Incident>,
    #[account(mut)]
    pub reporter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Incident record stored fully on-chain (censorship-resistant)
/// 
/// All critical text data is stored directly on-chain so it cannot be censored
/// even if external sources are taken down. Media files (images/videos) are stored
/// on decentralized storage (IPFS/Arweave) with URIs stored here.
#[account]
pub struct Incident {
    /// Unique identifier for this incident (e.g., 1, 2, 3...)
    pub incident_id: u64,
    
    /// Wallet public key of the person who reported this incident
    pub reporter: Pubkey,
    
    /// Unix timestamp (seconds) when this incident was recorded on-chain
    pub timestamp: i64,
    
    /// Name of the perpetrator (person who committed the act)
    pub perpetrator_name: String,
    
    /// Title/summary of the incident
    pub title: String,
    
    /// Full description of what happened
    pub description: String,
    
    /// Date when the incident occurred (format: "YYYY-MM-DD")
    pub incident_date: String,
    
    /// Location where the incident occurred
    pub location: String,
    
    /// Species of animal: 0 = dog, 1 = cat, 2 = other
    pub species: u8,
    
    /// URIs to media files on decentralized storage (IPFS/Arweave)
    /// e.g., ["ipfs://Qm...", "ar://..."]
    pub media_uris: Vec<String>,
    
    /// PDA bump seed
    pub bump: u8,
}

impl Incident {
    pub fn space(
        perpetrator_name: &str,
        title: &str,
        description: &str,
        incident_date: &str,
        location: &str,
        media_uris: &[String],
    ) -> usize {
        8  // discriminator
        + 8                              // incident_id
        + 32                             // reporter
        + 8                              // timestamp
        + 4 + perpetrator_name.len()     // perpetrator_name
        + 4 + title.len()                // title
        + 4 + description.len()          // description
        + 4 + incident_date.len()        // incident_date
        + 4 + location.len()             // location
        + 1                              // species
        + 4 + media_uris.iter().map(|u| 4 + u.len()).sum::<usize>() // media_uris
        + 1                              // bump
    }
}

#[error_code]
pub enum IncidentError {
    #[msg("Perpetrator name exceeds maximum length (100 chars)")]
    PerpetratorNameTooLong,
    #[msg("Title exceeds maximum length (200 chars)")]
    TitleTooLong,
    #[msg("Description exceeds maximum length (2000 chars)")]
    DescriptionTooLong,
    #[msg("Date exceeds maximum length (10 chars)")]
    DateTooLong,
    #[msg("Location exceeds maximum length (200 chars)")]
    LocationTooLong,
    #[msg("Invalid species value (must be 0, 1, or 2)")]
    InvalidSpecies,
    #[msg("Too many media URIs (maximum 10)")]
    TooManyMediaUris,
    #[msg("Media URI exceeds maximum length (128 chars)")]
    MediaUriTooLong,
    #[msg("Only the original reporter can update this incident")]
    UnauthorizedReporter,
}
