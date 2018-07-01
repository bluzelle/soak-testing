const api = require('../bluzelle-js/src/api');
const assert = require('assert');


describe('js api', () => {

    context('swarm', () => {

        beforeEach(() =>
            api.connect(`ws://${process.env.address}:${process.env.port}`, 'a23160bb-b2fb-45e5-85ec-156f8de5b89f'));

        it('should be responsive', () => {
            // ping
        });

        context('non crud operations', () => {

            const arr = [0,1,2];

            before(async () => {
                api.connect(`ws://${process.env.address}:${process.env.port}`, 'a23160bb-b2fb-45e5-85ec-156f8de5b89f');

                await Promise.all(arr.map((v, i) => api.create('key' + i, 'abcdef')));
            });

            after(async () => {
                await Promise.all(arr.map((v,i) => api.remove('key' + i)));
            });

            it('should be able to return key list', async () => {
                const result = await api.keys();
                assert.deepEqual(result, [ 'key2', 'key1', 'key0' ])
            });

            it('should be able to return size', async () => {
                assert(await api.size() >= 0);
            });

            it('should be able to has', async () => {
                assert(await api.has('key0'));
                assert(!await api.has('nonExistent'));
            })
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

        context('should be able to handle number fields', () => {

            it('should be able to create', async () => {
                await api.create(`numKey`, 123);
            });

            it('should be able to read', async () => {
                assert(await api.read(`numKey`) === 123);
            });

            it('should be able to update', async () => {
                await api.update(`numKey`, 123456);
                assert(await api.read(`numKey`) === 123456);
            });

            it('should be able to remove', async () => {
                await api.remove(`numKey`);
                assert(!await api.has(`numKey`));
            });
        });

        context('should be able to handle object fields', () => {

            it('should be able to create', async () => {
                await api.create(`objKey`, {a: 'abc'});
            });

            it('should be able to read', async () => {
                assert((await api.read(`objKey`)).a === 'abc');
            });

            it('should be able to update', async () => {
                await api.update(`objKey`, {b: 123});

                assert((await api.read(`objKey`)).b === 123);
            });

            it('should be able to remove', async () => {
                await api.remove(`objKey`);
                assert(!await api.has(`objKey`));
            });
        });
    });
});
