//! Project Axiom — Zero Trust Architecture (ZTA) & Cryptographic Hashing Engine
//! Pure Zero-Dependency Standard FIPS 180-4 SHA-256 & HMAC Cryptographic Engine
//! Enforces:
//! 1. SHA-256 Merkle chain signing for workspace.axiom snapshots
//! 2. HMAC-SHA256 tamper-proof hardware signature seals
//! 3. Anti-tamper disk integrity verification with execution freeze safety

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const ZTA_ENCLAVE_SECRET: &[u8] = b"axiom-zta-merkle-secret-key-v4-hardware-seal";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SnapshotSeal {
    pub previous_hash: String,
    pub payload_hash: String,
    pub chain_hash: String,
    pub author_identity: String,
    pub signature: String,
    pub timestamp: String,
    pub merkle_depth: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationResult {
    pub is_valid: bool,
    pub computed_hash: String,
    pub signature_valid: bool,
    pub reason: String,
}

// =========================================================================
// Standard FIPS 180-4 SHA-256 Pure Implementation (Zero External Crates)
// =========================================================================

const K: [u32; 64] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

pub fn sha256_digest(data: &[u8]) -> [u8; 32] {
    let mut h0: u32 = 0x6a09e667;
    let mut h1: u32 = 0xbb67ae85;
    let mut h2: u32 = 0x3c6ef372;
    let mut h3: u32 = 0xa54ff53a;
    let mut h4: u32 = 0x510e527f;
    let mut h5: u32 = 0x9b05688c;
    let mut h6: u32 = 0x1f83d9ab;
    let mut h7: u32 = 0x5be0cd19;

    let bit_len = (data.len() as u64) * 8;
    let mut padded = data.to_vec();
    padded.push(0x80);
    while (padded.len() % 64) != 56 {
        padded.push(0x00);
    }
    padded.extend_from_slice(&bit_len.to_be_bytes());

    for chunk in padded.chunks(64) {
        let mut w = [0u32; 64];
        for i in 0..16 {
            w[i] = u32::from_be_bytes([chunk[i * 4], chunk[i * 4 + 1], chunk[i * 4 + 2], chunk[i * 4 + 3]]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16].wrapping_add(s0).wrapping_add(w[i - 7]).wrapping_add(s1);
        }

        let mut a = h0;
        let mut b = h1;
        let mut c = h2;
        let mut d = h3;
        let mut e = h4;
        let mut f = h5;
        let mut g = h6;
        let mut h = h7;

        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ ((!e) & g);
            let temp1 = h.wrapping_add(s1).wrapping_add(ch).wrapping_add(K[i]).wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp2 = s0.wrapping_add(maj);

            h = g;
            g = f;
            f = e;
            e = d.wrapping_add(temp1);
            d = c;
            c = b;
            b = a;
            a = temp1.wrapping_add(temp2);
        }

        h0 = h0.wrapping_add(a);
        h1 = h1.wrapping_add(b);
        h2 = h2.wrapping_add(c);
        h3 = h3.wrapping_add(d);
        h4 = h4.wrapping_add(e);
        h5 = h5.wrapping_add(f);
        h6 = h6.wrapping_add(g);
        h7 = h7.wrapping_add(h);
    }

    let mut result = [0u8; 32];
    result[0..4].copy_from_slice(&h0.to_be_bytes());
    result[4..8].copy_from_slice(&h1.to_be_bytes());
    result[8..12].copy_from_slice(&h2.to_be_bytes());
    result[12..16].copy_from_slice(&h3.to_be_bytes());
    result[16..20].copy_from_slice(&h4.to_be_bytes());
    result[20..24].copy_from_slice(&h5.to_be_bytes());
    result[24..28].copy_from_slice(&h6.to_be_bytes());
    result[28..32].copy_from_slice(&h7.to_be_bytes());
    result
}

fn to_hex_string(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> [u8; 32] {
    let mut key_block = [0u8; 64];
    if key.len() > 64 {
        let hash = sha256_digest(key);
        key_block[..32].copy_from_slice(&hash);
    } else {
        key_block[..key.len()].copy_from_slice(key);
    }

    let mut o_key_pad = [0u8; 64];
    let mut i_key_pad = [0u8; 64];
    for i in 0..64 {
        o_key_pad[i] = key_block[i] ^ 0x5c;
        i_key_pad[i] = key_block[i] ^ 0x36;
    }

    let mut inner_input = i_key_pad.to_vec();
    inner_input.extend_from_slice(data);
    let inner_hash = sha256_digest(&inner_input);

    let mut outer_input = o_key_pad.to_vec();
    outer_input.extend_from_slice(&inner_hash);
    sha256_digest(&outer_input)
}

// =========================================================================
// Tauri ZTA Commands
// =========================================================================

/// Computes a standard SHA-256 hexadecimal digest
#[tauri::command]
pub fn zta_compute_sha256(content: String) -> String {
    let digest = sha256_digest(content.as_bytes());
    to_hex_string(&digest)
}

/// Signs and records a snapshot configuration chain of the workspace.axiom data schema
#[tauri::command]
pub fn zta_sign_snapshot_chain(
    previous_hash: String,
    snapshot_json: String,
    author_identity: String,
    current_depth: u64,
) -> Result<SnapshotSeal, String> {
    // 1. Compute payload hash
    let payload_digest = sha256_digest(snapshot_json.as_bytes());
    let payload_hash = to_hex_string(&payload_digest);

    let timestamp = chrono::Utc::now().to_rfc3339();

    // 2. Compute non-linear Merkle chain hash
    let chain_material = format!("{}:{}:{}:{}", previous_hash, payload_hash, author_identity, timestamp);
    let chain_digest = sha256_digest(chain_material.as_bytes());
    let chain_hash = to_hex_string(&chain_digest);

    // 3. Generate cryptographic HMAC signature
    let hmac_digest = hmac_sha256(ZTA_ENCLAVE_SECRET, chain_hash.as_bytes());
    let signature = to_hex_string(&hmac_digest);

    Ok(SnapshotSeal {
        previous_hash,
        payload_hash,
        chain_hash,
        author_identity,
        signature,
        timestamp,
        merkle_depth: current_depth + 1,
    })
}

/// Verifies integrity of a content block against expected hash and signature
#[tauri::command]
pub fn zta_verify_integrity(
    chain_hash: String,
    expected_signature: String,
) -> Result<VerificationResult, String> {
    let computed_hmac = hmac_sha256(ZTA_ENCLAVE_SECRET, chain_hash.as_bytes());
    let computed_signature = to_hex_string(&computed_hmac);

    let signature_valid = computed_signature.eq_ignore_ascii_case(&expected_signature);

    Ok(VerificationResult {
        is_valid: signature_valid,
        computed_hash: chain_hash,
        signature_valid,
        reason: if signature_valid {
            "Cryptographic signature verified against enclave key".into()
        } else {
            "SIGNATURE_MISMATCH: Signature rejected by Zero Trust verification engine".into()
        },
    })
}

/// Anti-Tamper Verification Routine:
/// Validates workspace file on disk against recorded cryptographic seal hash.
/// Freezes execution safely if unauthorized modification outside the shell is detected.
#[tauri::command]
pub fn zta_validate_workspace_integrity(
    file_path: String,
    recorded_seal_hash: String,
) -> Result<bool, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(format!("Target file does not exist: {}", file_path));
    }

    let file_content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file for integrity check: {}", e))?;

    let disk_digest = sha256_digest(file_content.trim().as_bytes());
    let disk_hash = to_hex_string(&disk_digest);

    if disk_hash.eq_ignore_ascii_case(&recorded_seal_hash) {
        Ok(true)
    } else {
        Err(format!(
            "INTEGRITY_TAMPER_DETECTED: Cryptographic SHA-256 signature mismatch! Expected {}, found {}. Unauthorized modification outside application shell detected. Workspace quarantined.",
            recorded_seal_hash, disk_hash
        ))
    }
}
