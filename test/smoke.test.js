const {bluzelle} = require('../bluzelle-js/lib/bluzelle-node');
const assert = require('assert');

let api;
const SMOKE_TEST_UUID = process.env.UUID + '-smoke-test';

describe('smoke tests', () => {

    context('swarm', () => {

        before('initialize client and createDB', async () => {

            api = bluzelle({
                entry: `ws://${process.env.ADDRESS}:${process.env.PORT}`,
                uuid: SMOKE_TEST_UUID,
                private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg=='
            });

            await api.createDB();
        });

        context('crud operations', () => {

            it('should be able to create', async () => {
                await api.create(`strKey`, 'abc');
            });

            it('should be able to read', async () => {
                assert(await api.read(`strKey`) === 'abc');
            });

            it('should be able to update', async () => {
                await api.update(`strKey`, 'abc def');
                assert(await api.read(`strKey`) === 'abc def');
            });

            it('should be able to delete', async () => {
                await api.delete(`strKey`);
                assert(!await api.has(`strKey`))
            });
        });

        context('non crud operations', () => {

            const ARRAY_OF_NUMS = [...Array(10).keys()];

            before('seed database', async () => {
                await Promise.all(ARRAY_OF_NUMS.map(num => api.create('key' + num, 'abcdef')));
            });

            it('should be able to return size', async () => {
                assert(await api.size() >= 0);
            });

            it('should be able to has', async () => {
                assert(await api.has('key0'));
                assert(!await api.has('nonExistent'));
            });

            it('should be able to return key list', async () => {

                const sortedKeys = ARRAY_OF_NUMS.reduce((acc, num) => {
                    acc.push('key' + num);
                    return acc
                }, []).sort();

                const result = await api.keys();

                assert(result.length === ARRAY_OF_NUMS.length);
                assert.deepEqual(result.sort(), sortedKeys);
            });
        });
    });

    context('database management', () => {

        let api2;
        const SMOKE_TEST_DB_MGMT_UUID = process.env.UUID + '-smoke-test-db-management';

        before('initialize client', async () => {

            api2 = bluzelle({
                entry: `ws://${process.env.ADDRESS}:${process.env.PORT}`,
                uuid: SMOKE_TEST_DB_MGMT_UUID,
                private_pem: 'MHQCAQEEIFH0TCvEu585ygDovjHE9SxW5KztFhbm4iCVOC67h0tEoAcGBSuBBAAKoUQDQgAE9Icrml+X41VC6HTX21HulbJo+pV1mtWn4+evJAi8ZeeLEJp4xg++JHoDm8rQbGWfVM84eqnb/RVuIXqoz6F9Bg=='
            });
        });

        it('should be able to createDB', async () => {
            await api2.createDB();
        });

        it('should be able to hasDB', async () => {
            assert(await api2.hasDB());
        });

        it('should be able to deleteDB', async () => {
            await api2.deleteDB();
            assert(!await api2.hasDB());
        });

    })
});
