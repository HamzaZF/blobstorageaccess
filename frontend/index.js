const express = require('express');
const cors = require('cors');
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

const sasToken = ""

// Client or another process uses SAS token to use container
async function listBlobs(sasToken){

    // get sasToken from backend (secure-access-blob-backend-h9ffekhedeczfjcr.centralus-01.azurewebsites.net/api/containersas)
    sasToken = await fetch('https://secure-access-blob-backend-h9ffekhedeczfjcr.centralus-01.azurewebsites.net/api/containersas')
    .then(res => res.json())
    .then(body => body.sasToken);

    console.log(`SAS Token: ${sasToken}`);

    // Get environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const containerName = process.env.AZURE_STORAGE_BLOB_CONTAINER_NAME;
    
    // Create Url
    // SAS token is the query string with typical `?` delimiter
    const sasUrl = `https://${accountName}.blob.core.windows.net/${containerName}?${sasToken}`;
    console.log(`\nContainerUrl = ${sasUrl}\n`);

    // Create container client from SAS token url
    const containerClient = new ContainerClient(sasUrl);

    let i = 1;

    // List blobs in container
    for await (const blob of containerClient.listBlobsFlat()) {
        console.log(`Blob ${i++}: ${blob.name}`);
    }    
}

listBlobs(sasToken)
    .then(() => console.log("Blob listing completed."))
    .catch(err => console.error("Error listing blobs:", err));