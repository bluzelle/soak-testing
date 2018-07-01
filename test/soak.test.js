const api = require('../bluzelle-js/src/api');
const assert = require('assert');

const ARR = [0,1,2,3,4];


describe('soak testing', () => {

    before(() => console.log(`    using uuid: ${process.env.uuid}`));

    beforeEach(() => {
        api.connect(`ws://${process.env.address}:${process.env.port}`, `${process.env.uuid}`);
    });

    it(`create keys`, async () => {

        await Promise.all(
            ARR.map((v, i) =>
                api.create('key' + i, 'abcdef')));

    });

    it('update and read keys', async () => {

        await Promise.all(
            ARR.map((v, i) =>
                api.update('key' + i, 'updated')));

        await Promise.all(ARR.map((v, i) =>
            api.read('key' + i)))
        .then(v =>
            v.map((v,i) => assert(v === 'updated')));

    });
});
