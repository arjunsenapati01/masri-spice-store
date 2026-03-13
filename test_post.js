const fetch = require('node-fetch');

async function testPOST() {
    const data = {
        name: "Test Spice",
        description: "Test description",
        price: 100,
        weight: 100,
        stock: 50,
        badge: "New",
        benefits: "Good for health",
        image: "../images/logo.png"
    };
    
    try {
        const res = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", json);
    } catch (e) {
        console.error(e);
    }
}

testPOST();
