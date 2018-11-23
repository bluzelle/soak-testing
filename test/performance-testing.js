const {BluzelleClient} = require('../bluzelle-js/lib/bluzelle-node');
const assert = require('assert');

let api;

(async (numberOfKeys) => {

        const ARRAY_OF_NUM_OF_KEYS_SIZE = [...Array(numberOfKeys).keys()];

        console.log(
            'Using uuid: ' + process.env.UUID +
            '\nUsing address: ' + process.env.ADDRESS +
            '\nUsing port: ' + process.env.PORT +
            '\nNumber of keys: ' + process.env.NUMBER_OF_KEYS
        );

        api = new BluzelleClient(`ws://${process.env.ADDRESS}:${process.env.PORT}`, `${process.env.UUID}`, false);

        await api.connect();

        const options = {api, array: ARRAY_OF_NUM_OF_KEYS_SIZE, numberOfKeys};

        await profiler(createTest, {...options, numberOfKeys, value: 'hello'});

        await profiler(readTest, {...options, numberOfKeys});

        await profiler(updateTest, {...options, numberOfKeys, value: 'newValue'});

        await profiler(removeTest, {...options});

        process.exit(0)

})(parseInt(process.env.NUMBER_OF_KEYS)).catch((err) => {
    console.error(err);
    api.disconnect();
    process.exit(1)
});

const removeTest = async ({api, array}) => {

    await batchOperation({client: api, array, operation: 'remove'});

    assert((await api.keys()).length === 0);
};

const readTest = async ({api, array, numberOfKeys}) => {

    const results = await batchOperation({client: api, array, operation: 'read', delayBetweenBatch: 0, batchSize: 30});

    assert(results.length === numberOfKeys);

    assert(results.every((value) => value === 'hello'))
};

const createTest = async ({api, array, numberOfKeys, value}) => {

    await batchOperation({client: api, array, operation: 'create', value});

    const keys = await api.keys();

    assert(keys.length === numberOfKeys);
};

const updateTest = async ({api, array, numberOfKeys, value}) => {

    await batchOperation({client: api, array, operation: 'update', value});

    assert((await api.read(`batch-key${array.length - 1}`)) === value);
};

const batchOperation = async ({client, array, operation, value, delayBetweenBatch = 300, batchSize = 10} = {}) => {

    const batched = chunk(array, batchSize);

    const delayedBatch = injectDelays(batched);

    return await processMixedTypeArray({api: client, array: delayedBatch, delay: delayBetweenBatch, operation, value});
};

const injectDelays = (array) => array.reduce((acc, currentValue) => {
    acc.push(currentValue);
    acc.push(delay);
    return acc
}, []);

const delay = ms => new Promise((resolve => setTimeout(resolve, ms)));

const chunk = (array, batchSize = 5) => {
    const batched = [];

    for (let i = 0; i < array.length; i += batchSize) {
        batched.push(array.slice(i, i + batchSize))
    }

    return batched;
};

const processMixedTypeArray = async ({api, array, delay, operation, value}) => {

    console.log(`\nRunning ${operation}s`);

    let results = [];
    let returnValue;

    for (element of array) {

        if (typeof(element) === 'object') {
            console.log(`  Processing: ${element.length} keys`)
        } else {
            console.log(`  Awaiting delay`)
        }

        let batchStartTime = new Date();

        if (typeof(element) === 'function') {
            await element(delay)
        } else {

            try {
                if (value === undefined) {

                    returnValue = await Promise.all(element.map((v) => api[operation]('batch-key' + v)));

                    if (returnValue !== undefined) {
                        results = [...results, ...returnValue]
                    }
                } else {
                    await Promise.all(element.map((v) => api[operation]('batch-key' + v, value)))
                }
            } catch (err) {
                throw new Error(`Failed to ${operation} keys in batch: ${element} \n${err}`);
            }
        }

        let batchTimeElapsed = new Date() - batchStartTime;
        console.log(`    Completed in: ${batchTimeElapsed}ms`);
    }

    return results;
};

const profiler = async (fn, arguments) => {
    const startTime = new Date();

    await fn(arguments);

    const endTime = new Date();
    console.log(`Total time elapsed: ${endTime - startTime}ms`);
};
