const {BluzelleClient} = require('../bluzelle-js/lib/bluzelle-node');
const assert = require('assert');

(async (numberOfKeys) => {

    const startTime = new Date();

    console.log(
        '$ Using uuid: ' + process.env.UUID +
        '\n$ Using address: ' + process.env.ADDRESS +
        '\n$ Using port: ' + process.env.PORT +
        '\n$ Number of keys: ' + process.env.NUMBER_OF_KEYS +
        '\n$ Start time: ' + new Date() + '\n'
    );

    const api = new BluzelleClient(`ws://${process.env.ADDRESS}:${process.env.PORT}`, `${process.env.UUID}`, false);

    await api.connect();

    try {
        await createKeys(api, {numberOfKeys: numberOfKeys, batchSize: 10, delayBetweenBatch: 500});
    } catch (err) {
        throw err;
        process.exit(1);
    }

    const keys = await api.keys();

    assert(keys.length === numberOfKeys);

    const endTime = new Date();

    console.log(`$ End time: ${endTime}`);
    console.log(`Total time elapsed: ${endTime - startTime}ms`);

    process.exit(0)

})(parseInt(process.env.NUMBER_OF_KEYS));


const createKeys = async (client, {numberOfKeys, delayBetweenBatch, batchSize} = {numberOfKeys: 5, delayBetweenBatch: 500, batchSize: 5}) => {

    const ARRAY_OF_NUM_OF_KEYS_SIZE = [...Array(numberOfKeys).keys()];

    const batched = chunk(ARRAY_OF_NUM_OF_KEYS_SIZE, batchSize);

    const delayedBatch = batched.reduce((acc, currentValue) => {
        acc.push(currentValue);
        acc.push(delay);
        return acc
    }, []);

    await processMixedTypeArray(delayedBatch, client, delayBetweenBatch);
};

const delay = ms => new Promise((resolve => setTimeout(resolve, ms)));

const chunk = (array, batchSize = 5) => {
    const batched = [];

    for (let i = 0; i < array.length; i += batchSize) {
        batched.push(array.slice(i, i + batchSize))
    }

    return batched;
};

const processMixedTypeArray = async (array, api, delay) => {

    for (element of array) {

        console.log(`Processing: ${element}`);
        let batchStartTime = new Date();

        if (typeof(element) === 'function') {
            await element(delay)
        } else {

            try {
                await Promise.all(element.map((v) => api.create('batch-key' + v, 'value')))
            } catch (err) {
                throw new Error(`Failed to create keys in batch: ${element}`);
            }
        }

        let batchTimeElapsed = new Date() - batchStartTime;
        console.log(`\tProcessed in: ${batchTimeElapsed}ms`);

    }
};
