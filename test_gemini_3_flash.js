
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Key from lib/apiConfig.js
const API_KEY = 'AIzaSyAXMPk2O7sv-ym6BdV5JhdC8PN12xo3UcM';
const MODEL_NAME = 'gemini-3.0-flash';

async function test() {
    console.log(`Testing model: ${MODEL_NAME}`);
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent('Hello, are you a 3.0 flash model? Reply with a short confirmation.');
        console.log('Success:', result.response.text());
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Full Error Response:', JSON.stringify(error.response, null, 2));
        }
    }
}

test();
