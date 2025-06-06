// frontend.js
// Node.js script to request a PDF download link (SAS TOKEN) from the backend

async function getPdfSasLink(filename) {
  if (!filename) {
    console.error('Usage: node frontend.js <filename>');
    process.exit(1);
  }

  // Replace with the actual backend URL
  const BACKEND_URL = 'https://sec-access-hmd7g8c2crhggnbs.canadacentral-01.azurewebsites.net';

  const endpoint = `${BACKEND_URL}/api/blob-sas?filename=${encodeURIComponent(filename)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`Backend returned ${res.status} ${res.statusText}`);
    }

    const { sasUrl } = await res.json();
    if (!sasUrl) {
      throw new Error('No sasUrl field in backend response');
    }

    console.log(`Access link for "${filename}": `);
    console.log(sasUrl);
    console.log('\n↳ Valid for 10 minutes.');
  } catch (err) {
    console.error(`Error fetching SAS link: ${err.message}`);
    process.exit(1);
  }
}

// Read filename from command-line argument
const filename = process.argv[2];
getPdfSasLink(filename);
