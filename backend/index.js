// index.js
const { DefaultAzureCredential } = require('@azure/identity');
const {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  SASProtocol
} = require('@azure/storage-blob');
require('dotenv').config();

async function createBlobSasForFilename(filename) {
  // 1. Read env vars
  const accountName   = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const containerName = process.env.AZURE_STORAGE_BLOB_CONTAINER_NAME;

  if (!accountName || !containerName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_BLOB_CONTAINER_NAME must be set.");
  }
  if (!filename) {
    throw new Error("Filename is required.");
  }

  // 2. Compute time window (10 minutes before → 10 minutes after now)
  const TEN_MINUTES = 10 * 60 * 1000;
  const now = new Date();
  const startsOn = new Date(now.valueOf() - TEN_MINUTES);
  const expiresOn = new Date(now.valueOf() + TEN_MINUTES);

  // 3. Create BlobServiceClient via Managed Identity
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );

  // 4. Get a user delegation key for our time window
  const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);

  // 5. Build the blob‐scoped SAS options
  const fullBlobName = filename;

  const sasOptions = {
    containerName,
    blobName: fullBlobName,
    permissions: BlobSASPermissions.parse("r"), // read‐only
    protocol: SASProtocol.HttpsAndHttp,
    startsOn,
    expiresOn
  };

  // 6. Generate the SAS query string
  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    userDelegationKey,
    accountName
  ).toString();

  // 7. Return the full URL
  const sasUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(fullBlobName)}?${sasToken}`;
  return sasUrl;
}

// --------------------- EXPRESS SETUP ---------------------

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 80;

// (Allow only CORS requests from the frontend for prod)
app.use(cors());

/**
 * GET /api/blob-sas?filename=<theBlobName>
 * 
 * Returns JSON: { sasUrl: "<full_blob_sas_url>" }
 */
app.get('/api/blob-sas', async (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ error: "Query parameter 'filename' is required." });
    }
    const sasUrl = await createBlobSasForFilename(filename);
    return res.json({ sasUrl });
  } catch (err) {
    console.error('Error generating blob SAS:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`SAS‐backend listening on port ${port}`);
});
