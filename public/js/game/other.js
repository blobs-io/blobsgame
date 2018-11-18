// Display all blobs
for (const blob of blobs) {
    blob.setBlob().then(() => blob.display(true, true));
}

// Own blob
const ownBlob = new BlobObj();
ownBlob.ready = false;
ownBlob.setBlob().then(() => ownBlob.display(true, true));

// Initialize blob images
objects.images.blobnom = new Image();
objects.images.blobnom.src = BlobCode.blobnom;
objects.images.blobnom.onload = () => {
    objects.images.blobnom._ready = true;
};
