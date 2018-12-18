const {bluzelle} = require('../bluzelle-js/lib/bluzelle-node');
const assert = require('assert');

let api;

describe('smoke tests', () => {

    context('swarm', () => {

        before('initialize client and createDB', async () => {

            api = bluzelle({
                entry: `ws://${process.env.ADDRESS}:${process.env.PORT}`,
                uuid: process.env.UUID,
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

            before('seed database', async () => {

                await api.create(`key0`, 'abcdef');
                await api.create(`key1`, 'abcdef');
                await api.create(`key2`, 'abcdef');
            });

            after('clear database', async () => {
                await api.delete('key0');
                await api.delete('key1');
                await api.delete('key2');
            });

            it('should be able to return size', async () => {
                assert(await api.size() >= 0);
            });

            it('should be able to has', async () => {
                assert(await api.has('key0'));
                assert(!await api.has('nonExistent'));
            });

            it('should be able to return key list', async () => {
                const result = await api.keys();
                assert.deepEqual(result.sort(), ['key2', 'key1', 'key0'].sort())
            });
        });
    });

    context('database management', () => {

        let api2;

        before('initialize client', async () => {

            api2 = bluzelle({
                entry: `ws://${process.env.ADDRESS}:${process.env.PORT}`,
                uuid: process.env.UUID + 1,
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
