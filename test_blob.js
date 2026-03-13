
import { put } from '@vercel/blob';

const token = 'vercel_blob_rw_PYmm9SeRejDtgFY8_PYYIELzU1ACBgSjPmNWB60UKUDZXu7';

async function testUpload() {
    try {
        console.log('Testing upload with provided token...');
        const blob = await put('test.txt', 'Hello from validation script', {
            access: 'public',
            token: token
        });
        console.log('✅ Upload successful!');
        console.log('URL:', blob.url);
    } catch (err) {
        console.error('❌ Upload failed:', err.message);
    }
}

testUpload();
