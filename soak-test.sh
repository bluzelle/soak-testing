#!/usr/bin/env bash

export uuid=`date +%d-%m-%y-%H-%M-%S`
yarn test-daemon

for i in {0..9}
do
    echo uuid set: `date +%d-%m-%y-%H-%M-%S`
    export uuid=`date +%d-%m-%y-%H-%M-%S`

    yarn soak-test
done
