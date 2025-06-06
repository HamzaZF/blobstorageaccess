const {
    DefaultAzureCredential
} = require('@azure/identity');
const {
    ContainerClient,
    BlobServiceClient,
    ContainerSASPermissions,
    generateBlobSASQueryParameters,
    SASProtocol
} = require('@azure/storage-blob');

// used for local environment variables
require('dotenv').config();

// Server creates User Delegation SAS Token for container
async function createContainerSas() {

    // Get environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const containerName = process.env.AZURE_STORAGE_BLOB_CONTAINER_NAME;

    // Best practice: create time limits
    const TEN_MINUTES = 10 * 60 * 1000;
    const NOW = new Date();

    // Best practice: set start time a little before current time to 
    // make sure any clock issues are avoided
    const TEN_MINUTES_BEFORE_NOW = new Date(NOW.valueOf() - TEN_MINUTES);
    const TEN_MINUTES_AFTER_NOW = new Date(NOW.valueOf() + TEN_MINUTES);

    // Best practice: use managed identity - DefaultAzureCredential
    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
      );

    // Best practice: delegation key is time-limited  
    // When using a user delegation key, container must already exist 
    const userDelegationKey = await blobServiceClient.getUserDelegationKey(
        TEN_MINUTES_BEFORE_NOW, 
        TEN_MINUTES_AFTER_NOW
    );

    // Need only list permission to list blobs 
    const containerPermissionsForAnonymousUser = "rl";

    // Best practice: SAS options are time-limited
    const sasOptions = {
        containerName,                                           
        permissions: ContainerSASPermissions.parse(containerPermissionsForAnonymousUser), 
        protocol: SASProtocol.HttpsAndHttp,
        startsOn: TEN_MINUTES_BEFORE_NOW,
        expiresOn: TEN_MINUTES_AFTER_NOW
    };
 
    const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        userDelegationKey,
        accountName 
    ).toString();

    return sasToken;
}

// // Client or another process uses SAS token to use container
// async function listBlobs(sasToken){

//     // Get environment variables
//     const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
//     const containerName = process.env.AZURE_STORAGE_BLOB_CONTAINER_NAME;
    
//     // Create Url
//     // SAS token is the query string with typical `?` delimiter
//     const sasUrl = `https://${accountName}.blob.core.windows.net/${containerName}?${sasToken}`;
//     console.log(`\nContainerUrl = ${sasUrl}\n`);

//     // Create container client from SAS token url
//     const containerClient = new ContainerClient(sasUrl);

//     let i = 1;

//     // List blobs in container
//     for await (const blob of containerClient.listBlobsFlat()) {
//         console.log(`Blob ${i++}: ${blob.name}`);
//     }    
// }

// Create Express app

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 80;

// Enable CORS (adjust origins if you want to lock it down)
app.use(cors());

// Define a GET endpoint at "/api/containersas"
app.get('/api/containersas', async (req, res) => {
  try {
    const sasToken = await createContainerSas();
    // Return just the raw SAS token string:
    return res.json({ sasToken });
  } catch (err) {
    console.error('Error generating container SAS:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`SAS‐backend listening on port ${port}`);
});

// sasToken = createContainerSas()

// console.log(`SAS Token: ${sasToken}`);

// listBlobs(sasToken)
//     .then(() => console.log("Blob listing completed."))
//     .catch(err => console.error("Error listing blobs:", err));