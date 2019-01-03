const {bluzelle} = require('../bluzelle-js/lib/bluzelle-node');
const assert = require('assert');

let api;

(async (numberOfKeys) => {

        const ARRAY_OF_NUM_OF_KEYS_SIZE = [...Array(numberOfKeys).keys()];

        const PERFORMANCE_TEST_UUID = process.env.UUID + '-performance-test';

        console.log(
            'Using uuid: ' + PERFORMANCE_TEST_UUID +
            '\nUsing address: ' + process.env.ADDRESS +
            '\nUsing port: ' + process.env.PORT +
            '\nNumber of keys: ' + process.env.NUMBER_OF_KEYS
        );

        api = bluzelle({
            entry: `ws://${process.env.ADDRESS}:${process.env.PORT}`,
            uuid: PERFORMANCE_TEST_UUID,
            private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg=='
        });

        await api.createDB();

        const options = {api, arr: ARRAY_OF_NUM_OF_KEYS_SIZE, numberOfKeys, delayBetweenBatch: 100, batchSize: 10};

        const initialValue = 'hello';
        const updatedValue = 'newValue';

        await profiler(createTest, {...options, value: initialValue});

        await profiler(readTest, {...options, value: initialValue});

        await profiler(updateTest, {...options, value: updatedValue});

        await profiler(deleteTest, {...options});

        process.exit(0)

})(parseInt(process.env.NUMBER_OF_KEYS)).catch((err) => {
    console.error(err);
    process.exit(1)
});

const createTest = async (args) => {

    const {api, numberOfKeys} = args;

    await batchOperation({...args, operation: 'create'});

    const keys = await api.keys();

    assert(keys.length === numberOfKeys);
};

const readTest = async (args) => {

    const {numberOfKeys} = args;

    const {value, ...argsWithoutValue} = args;

    const results = await batchOperation({...argsWithoutValue, operation: 'read', batchSize: 10});

    assert(results.length === numberOfKeys);

    assert(results.every((val) => val === value))
};

const updateTest = async (args) => {

    const {value, arr} = args;

    await batchOperation({...args, operation: 'update'});

    assert((await api.read(`batch-key${arr.length - 1}`)) === value);
};

const deleteTest = async (args) => {

    const {api} = args;

    await batchOperation({...args, operation: 'delete'});

    assert((await api.keys()).length === 0);
};

const profiler = async (fn, arguments) => {
    const startTime = new Date();

    await fn(arguments);

    const endTime = new Date();
    console.log(`Total time elapsed: ${endTime - startTime}ms`);
};


const batchOperation = async ({api, arr, operation, value, delayBetweenBatch, batchSize} = {}) => {

    const batched = chunk(arr, batchSize);

    const delayedBatch = injectDelays(batched);

    return await processMixedTypeArray({api, batch: delayedBatch, delayBetweenBatch, operation, value, batchSize});
};

const chunk = (arr, batchSize = 5) => {
    const batched = [];

    for (let i = 0; i < arr.length; i += batchSize) {
        batched.push(arr.slice(i, i + batchSize))
    }

    return batched;
};

const injectDelays = (array) => array.reduce((acc, currentValue) => {
    acc.push(currentValue);
    acc.push(delay);
    return acc
}, []);

const delay = ms => new Promise((resolve => setTimeout(resolve, ms)));


const processMixedTypeArray = async ({api, batch, delayBetweenBatch, operation, value, batchSize}) => {

    console.log(`\nRunning ${operation}s, processing ${batchSize} keys per batch`);
    if (delayBetweenBatch > 0) {
        console.log(`Delaying ${delayBetweenBatch}ms between batch calls`)
    }

    let results = [];
    let returnValue;

    for (element of batch) {

        let batchStartTime = new Date();

        if (typeof(element) === 'function') {
            await element(delayBetweenBatch)
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
