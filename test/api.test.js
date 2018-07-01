const api = require('../bluzelle-js/src/api');
const assert = require('assert');
const {expect} = require('chai');

const today = () => new Date().toJSON().slice(0, 10); // returns YYYY-MM-DD

describe('js api', () => {

    context('swarm', () => {

        beforeEach(() =>
            api.connect(`ws://${process.env.address}:${process.env.port}`));

        it('should be responsive', () => {
            // ping
        });

        context('should be able to handle string fields', () => {

            it('should be able to create', async () => {
                await api.create(`strKey-${today}`, 'abc');
            });

            it('should be able to read', async () => {
                assert(await api.read(`strKey-${today}`) === 'abc');
            });

            it('should be able to update', async () => {
                await api.update(`strKey-${today}`, 'abc def');
                assert(await api.read(`strKey-${today}`) === 'abc def');
            });

            it('should be able to remove', async () => {
                await api.remove(`strKey-${today}`);
                assert(!await api.has(`strKey-${today}`))
            });

        });

        context('should be able to handle number fields', () => {

            it('should be able to create', async () => {
                await api.create(`numKey-${today}`, 123);
            });

            it('should be able to read', async () => {
                assert(await api.read(`numKey-${today}`) === 123);
            });

            it('should be able to update', async () => {
                await api.update(`numKey-${today}`, 123456);
                assert(await api.read(`numKey-${today}`) === 123456);
            });

            it('should be able to remove', async () => {
                await api.remove(`numKey-${today}`);
                assert(!await api.has(`numKey-${today}`));
            });
        });

        context('should be able to handle object fields', () => {

            it('should be able to create', async () => {
                await api.create(`objKey-${today}`, {a: 'abc'});
            });

            it('should be able to read', async () => {
                await api.read(`objKey-${today}`);
            });

            it('should be able to update', async () => {
                await api.update(`objKey-${today}`, {b: 123});

                assert((await api.read(`objKey-${today}`)).b === 123);
            });

            it('should be able to remove', async () => {
                await api.remove(`objKey-${today}`);
                assert(!await api.has(`objKey-${today}`));
            });

        });

        it('should be able to return key list', async () => {
            await api.keys()
        });

    });
});
