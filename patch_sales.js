const fs = require('fs');

const file = 'src/Pages/Sales/Sales.js';
let content = fs.readFileSync(file, 'utf8');

// Add helper functions
const helpers = `
    const getFallbackMetal = (record) => {
        if (!record.purchases) return 'N/A';
        try {
            const purchases = typeof record.purchases === 'string' ? JSON.parse(record.purchases) : record.purchases;
            if (Array.isArray(purchases) && purchases.length > 0) {
                const metal = purchases[0].metal;
                if (metal) {
                    return isNaN(Number(metal)) ? metal : getMetalNameById(metal);
                }
            }
        } catch (e) {}
        return 'N/A';
    };

    const getFallbackProduct = (record) => {
        if (!record.purchases) return 'N/A';
        try {
            const purchases = typeof record.purchases === 'string' ? JSON.parse(record.purchases) : record.purchases;
            if (Array.isArray(purchases) && purchases.length > 0) {
                const product = purchases[0].product;
                if (product) {
                    return isNaN(Number(product)) ? product : getProductNameById(product);
                }
            }
        } catch (e) {}
        return 'N/A';
    };
`;

content = content.replace(
    'const meltProductColumns = [',
    helpers + '\n    const meltProductColumns = ['
);

// Modify render for Metal
content = content.replace(
    `                    <Text>{getMetalNameById(text)}</Text>`,
    `                    <Text>{text ? (getMetalNameById(text) !== 'N/A' ? getMetalNameById(text) : getFallbackMetal(record)) : getFallbackMetal(record)}</Text>`
);

// Modify render for Product
content = content.replace(
    `                    <Text>{getProductNameById(text)}</Text>`,
    `                    <Text>{text ? (getProductNameById(text) !== 'N/A' ? getProductNameById(text) : getFallbackProduct(record)) : getFallbackProduct(record)}</Text>`
);

fs.writeFileSync(file, content);
console.log('Patched Sales.js');
