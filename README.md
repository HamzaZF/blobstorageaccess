## Azure Blob Storage Configuration for Backend

### 1. Enable Managed Identity

Enable the **Managed Identity** for the Web App:

- In the Azure Portal, navigate to your backend resource.
- Under **Identity**, turn **System-assigned managed identity** to **On**.

### 2. Assign IAM Role on Blob Storage

Grant the managed identity read access to the Blob Storage:

- Navigate to your **Storage Account** in the Azure Portal.
- Go to **Access Control (IAM)**.
- Click **Add role assignment**.
- Select the **"Storage Blob Data Reader"** role.
- Assign it to the managed identity associated with your backend.

### 3. Set Required Environment Variables

Configure the following environment variables in your backend environment:

```bash
AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>
AZURE_STORAGE_BLOB_CONTAINER_NAME=<your-container-name>
