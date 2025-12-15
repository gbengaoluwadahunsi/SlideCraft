import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('Testing Cloudinary Connection...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Loaded' : '❌ Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Loaded' : '❌ Missing');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Missing environment variables. Please check .env.local');
    process.exit(1);
}

// Configure
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Upload
async function testUpload() {
    try {
        console.log('Attempting to upload a test image...');
        // Upload a remote sample image
        const result = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
            folder: 'test-connection',
            public_id: `test-${Date.now()}`
        });
        
        console.log('✅ Upload Successful!');
        console.log('URL:', result.secure_url);
        console.log('Public ID:', result.public_id);
        
        // Clean up
        await cloudinary.uploader.destroy(result.public_id);
        console.log('✅ Cleanup Successful (Deleted test image)');
        
    } catch (error) {
        console.error('❌ Connection Failed:', error);
    }
}

testUpload();

