const {BluzelleClient} = require('../bluzelle-js/lib/bluzelle-node');
const assert = require('assert');

let api;

describe('smoke tests', () => {

    before('initialize client and connect', async () => {
        api = new BluzelleClient(`ws://${process.env.ADDRESS}:${process.env.PORT}`, `${process.env.UUID}`, false);
        await api.connect();
    });

    context('swarm', () => {

        context('non crud operations', () => {

            before('seed database', async () => {

                await api.create(`key0`, 'abcdef');
                await api.create(`key1`, 'abcdef');
                await api.create(`key2`, 'abcdef');
            });

            after('clear database', async () => {
                await api.remove('key0');
                await api.remove('key1');
                await api.remove('key2');
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

        context('should be able to handle string fields', () => {

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

            it('should be able to remove', async () => {
                await api.remove(`strKey`);
                assert(!await api.has(`strKey`))
            });
        });
    });
});
