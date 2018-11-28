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

        const options = {api, array: ARRAY_OF_NUM_OF_KEYS_SIZE, numberOfKeys, delay: 100};

        const initialValue = 'hello';
        const updatedValue = 'newValue';

        await profiler(createTest, {...options, value: initialValue});

        await profiler(readTest, {...options, value: initialValue});

        await profiler(updateTest, {...options, value: updatedValue});

        await profiler(removeTest, {...options});

        api.disconnect();
        process.exit(0)

})(parseInt(process.env.NUMBER_OF_KEYS)).catch((err) => {
    console.error(err);
    api.disconnect();
    process.exit(1)
});

const removeTest = async (...args) => {

    const {api} = args;

    await batchOperation({...args, operation: 'remove'});

    assert((await api.keys()).length === 0);
};

const readTest = async (...args) => {

    const {numberOfKeys, value} = args;

    const results = await batchOperation({...args, operation: 'read', delayBetweenBatch: 0, batchSize: 30});

    assert(results.length === numberOfKeys);

    assert(results.every((val) => val === value))
};

const createTest = async (...args) => {

    const {api, numberOfKeys} = args;

    await batchOperation({...args, operation: 'create'});

    const keys = await api.keys();

    assert(keys.length === numberOfKeys);
};

const updateTest = async (...args) => {

    const {value, array} = args;

    await batchOperation({...args, operation: 'update'});

    assert((await api.read(`batch-key${array.length - 1}`)) === value);
};

const batchOperation = async ({api, array, operation, value, delayBetweenBatch = 0, batchSize = 10} = {}) => {

    // debug undefined: api, array, operation, value, are all undefined here
    console.log(array);

    const batched = chunk(array, batchSize);

    const delayedBatch = injectDelays(batched);

    return await processMixedTypeArray({api, array: delayedBatch, delay: delayBetweenBatch, operation, value});
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

const processMixedTypeArray = async ({api, array, delay, operation, value, batchSize}) => {

    console.log(`\nRunning ${operation}s, processing ${batchSize} keys per batch`);
    if (delay > 0) {
        console.log(`Delaying ${delay}ms between batch calls`)
    }

    let results = [];
    let returnValue;

    for (element of array) {

        // if (typeof(element) === 'object') {
        //     console.log(`  Processing: ${element.length} keys`)
        // } else {
        //     // console.log(`  Awaiting delay`)
        // }

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

        if (typeof(element) === 'object') { console.log(`    Completed in: ${batchTimeElapsed}ms`) }
    }

    return results;
};

const profiler = async (fn, arguments) => {
    const startTime = new Date();

    await fn(arguments);

    const endTime = new Date();
    console.log(`Total time elapsed: ${endTime - startTime}ms`);
};
