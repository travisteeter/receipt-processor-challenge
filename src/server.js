// server.js

// Import libraries
const express = require('express');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const fs = require('fs');
const { load } = require('js-yaml');
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;

// Import middleware
const errorHandler = require('../middleware/errorHandler');

// Define schemas
const schema = load(fs.readFileSync('src/api.yml', 'utf8'));
const receiptSchema = schema.components.schemas.Receipt;
const itemSchema = schema.components.schemas.Item;

// Define ajv instance for validating request body
const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addFormat("purchase-time", {
    type: "string",
    validate: (inputString) => {
        const purchaseTimeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
        return purchaseTimeRegex.test(inputString);
    },
})

ajv.addSchema(itemSchema, '#/components/schemas/Item');
ajv.addSchema(receiptSchema, '#/components/schemas/Receipt');

const receiptValidate = ajv.getSchema('#/components/schemas/Receipt');

// Instantiate express app
const app = express();
const PORT = process.env.PORT || 3000;

// Use body-parser middleware
app.use(bodyParser.json());

// In-memory store for receipts and points
const receiptPoints = {};

/**
 * POST /receipts/process
 * Process a receipt and return a receipt id
 * @returns {object} - receipt id
 */
app.post('/receipts/process', 
    body().custom((data) => {
        const isValid = receiptValidate(data);

        if (!isValid) {
            console.error("Validation errors:", receiptValidate.errors);
            throw new Error('The receipt is invalid');
        }
        return true;
    }),
    (req, res, next) => {
        try {
            // Validate receipt
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                throw new Error('The receipt is invalid');
            } else {
                const receipt = req.body;

                // Generate receipt id
                const receiptId = generateReceiptId();

                // Process the receipt and return point total
                const points = processReceipt(receipt);

                // Add id and points to in-memory store
                receiptPoints[receiptId] = points;

                return res.status(200).json({ id: receiptId });
            }
        } catch (error) {
            return next(error);
        }
});

/**
 * GET /receipts/{id}/points
 * Get points for receipt with given id
 * @param {string} id - receipt id
 * @returns {object} - receipt points
 */
app.get('/receipts/:id/points', (req, res, next) => {
    try {
        const id = req.params.id;

        if (receiptPoints[id] !== undefined) {
            return res.status(200).json({ points: receiptPoints[id] });
        } else {
            throw new Error('No receipt found for that id');
        }
    } catch (error) {
        return next(error);
    }
});


/**
 * Utility function: generates random receipt id
 * @returns {string} - receipt id
 */
function generateReceiptId() {
    const chars = '0123456789abcdef';
    
    // Helper function to generate a random string of a given length
    const randomStringGenerator = (length) => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    };

    const randomString1 = randomStringGenerator(8);
    const randomString2 = randomStringGenerator(4);
    const randomString3 = randomStringGenerator(4);
    const randomString4 = randomStringGenerator(4);
    const randomString5 = randomStringGenerator(12);

    // Construct and return 36-character receipt id
    return `${randomString1}-${randomString2}-${randomString3}-${randomString4}-${randomString5}`;
}

/**
 * Utility function: calculates points for receipt
 * @returns {number} - points
 */
function processReceipt(receipt) {
    // Parse receipt
    const receiptRetailer = receipt.retailer;
    const receiptPurchaseDate = receipt.purchaseDate;
    const receiptPurchaseTime = receipt.purchaseTime;
    const receiptItems = receipt.items;
    const receiptTotal = receipt.total;

    // One point for every alphanumeric character in the retailer name
    const retailerNamePoints = (receiptRetailer.match(/[a-zA-Z0-9]/g) || []).length;

    // 50 points if the total is a round dollar amount with no cents
    const roundTotalPoints = /(.00)$/.test(receiptTotal) ? 50 : 0;

    // 25 points if the total is a multiple of 0.25
    const multipleTotalPoints = parseFloat(receiptTotal) % 0.25 === 0 ? 25 : 0;

    // 5 points for every two items on the receipt
    const itemPairPoints = Math.floor(receiptItems.length / 2) * 5;

    // For each item: if trimmed description length is multiple of 3, multiply price by 0.2 & round up
    // Result is number of points earned
    const itemDescriptionPoints = receiptItems.reduce((sum, item) => {
        const trimmedDesc = item.shortDescription.trim().length;
    
        const descPoints = trimmedDesc % 3 === 0 ? Math.ceil(item.price * 0.2) : 0;

        return sum + descPoints;
    }, 0);

    // 6 points if the day in the purchase date is odd
    const oddDatePoints = parseInt(receiptPurchaseDate.slice(-1)) % 2 === 0 ? 0 : 6;

    // 10 points if the time of purchase is after 2:00pm and before 4:00pm
    const purchaseTimePoints = parseFloat(receiptPurchaseTime.replace(/:/g, '')) > 1400 && parseFloat(receiptPurchaseTime) < 1600 ? 10 : 0;

    // Sum total points
    const totalReceiptPoints = retailerNamePoints + roundTotalPoints + multipleTotalPoints + itemPairPoints + itemDescriptionPoints + oddDatePoints + purchaseTimePoints;

    return totalReceiptPoints;
}

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
