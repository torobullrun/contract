const TORO = artifacts.require("TORO");
const BigNumber = require('bignumber.js');
const Reverter = require('./helpers/reverter');
const truffleAssert = require('truffle-assertions');

contract('TORO', async (accounts) => {
    let TORO;

    const OWNER = accounts[0];
    const ACC2 = accounts[1];
    const ACC3 = accounts[2];
    const ACC4 = accounts[3];
    const DECIMAL_FACTOR = BigNumber(1000000000000000000);

    const reverter = new Reverter(web3);

    before('setup', async () => {
        TORO = await TORO.new();
        await reverter.snapshot();
    });

    afterEach('revert', reverter.revert);
    
    describe('Burn tests', async () => {
        it('we should have burned tokens, 5% burn fee', async () => {
            await TORO.setLiquidityFeePercent(0);
            await TORO.setTaxFeePercent(0);
            await TORO.setBurnFeePercent(5);

            var amountToTransfer = BigNumber(1).multipliedBy(DECIMAL_FACTOR);
            var transferWithFeeAmount = BigNumber(0);
            var totalSupplyBefore = BigNumber(await TORO.totalSupply());
            const takeFivePercent = (num) => num.dividedBy(BigNumber(100)).multipliedBy(BigNumber(95));

            assert.equal(
                BigNumber(await TORO.balanceOf(OWNER)).toString(),
                BigNumber(100000000).multipliedBy(DECIMAL_FACTOR).toString(),
                "Owner should have 1e+26 coins"
            );

            await TORO.transfer(ACC2, amountToTransfer);
            assert.equal(
                BigNumber(await TORO.balanceOf(ACC2)).toString(),
                BigNumber(1).multipliedBy(DECIMAL_FACTOR).toString(),
                "We transfer tokens to ACC2 from OWNER"
            );
            assert.equal(
                BigNumber(await TORO.balanceOf(OWNER)).toString(),
                BigNumber(100000000).multipliedBy(DECIMAL_FACTOR).minus(BigNumber(1).multipliedBy(DECIMAL_FACTOR)).toString(),
                "Check if owner has no fees after transaction"
            );

            await TORO.transfer(ACC2, amountToTransfer);
            assert.equal(
                BigNumber(await TORO.balanceOf(ACC2)).toString(),
                BigNumber(2).multipliedBy(DECIMAL_FACTOR).toString(),
                "We transfer tokens to ACC2 from OWNER"
            );
            assert.equal(
                BigNumber(await TORO.balanceOf(OWNER)).toString(),
                BigNumber(100000000).multipliedBy(DECIMAL_FACTOR).minus(BigNumber(2).multipliedBy(DECIMAL_FACTOR)).toString(),
                "Check if owner has no fees after transaction"
            );

            await TORO.transfer(ACC2, amountToTransfer);
            assert.equal(
                BigNumber(await TORO.balanceOf(ACC2)).toString(),
                BigNumber(3).multipliedBy(DECIMAL_FACTOR).toString(),
                "We transfer tokens to ACC2 from OWNER"
            );
            assert.equal(
                BigNumber(await TORO.balanceOf(OWNER)).toString(),
                BigNumber(100000000).multipliedBy(DECIMAL_FACTOR).minus(BigNumber(3).multipliedBy(DECIMAL_FACTOR)).toString(),
                "Check if owner has no fees after transaction"
            );

            let transfer = BigNumber(2000000000000);
            let acc2Amount = BigNumber(3).multipliedBy(DECIMAL_FACTOR);
            let acc3Amount = BigNumber(0);

            for(let i = 0; i < 9; i++) {
                await TORO.transfer(ACC3, transfer, {from: ACC2});
                transferWithFeeAmount = transferWithFeeAmount.plus(transfer);

                acc2Amount = acc2Amount.minus(transfer);
                acc3Amount = acc3Amount.plus(takeFivePercent(transfer));

                assert.equal(
                    BigNumber(await TORO.balanceOf(ACC3)).toString(),
                    acc3Amount.toString(),
                    `Check ACC3 balance - should be ${acc3Amount}`
                );
                assert.equal(
                    BigNumber(await TORO.balanceOf(ACC2)).toString(),
                    acc2Amount.toString(),
                    `Check ACC2 balance - should be ${acc2Amount}`
                );
            }

            acc2Amount = acc2Amount.plus(amountToTransfer);
            await TORO.transfer(ACC2, amountToTransfer);
            assert.equal(
                BigNumber(await TORO.balanceOf(ACC2)).toString(),
                acc2Amount.toString(),
                "We transfer tokens to ACC2 from OWNER"
            );
            assert.equal(
                BigNumber(await TORO.balanceOf(OWNER)).toString(),
                BigNumber(100000000).multipliedBy(DECIMAL_FACTOR).minus(BigNumber(4).multipliedBy(DECIMAL_FACTOR)).toString(),
                "Check if owner has no fees after transaction"
            );

            transfer = BigNumber(150000000000);

            for(let i = 0; i < 7; i++) {
                await TORO.transfer(ACC2, transfer, {from: ACC3});
                transferWithFeeAmount = transferWithFeeAmount.plus(transfer);

                acc3Amount = acc3Amount.minus(transfer);
                acc2Amount = acc2Amount.plus(takeFivePercent(transfer));

                assert.equal(
                    BigNumber(await TORO.balanceOf(ACC2)).toString(),
                    acc2Amount.toString(),
                    `Check ACC3 balance - should be ${acc2Amount}`
                );
                assert.equal(
                    BigNumber(await TORO.balanceOf(ACC3)).toString(),
                    acc3Amount.toString(),
                    `Check ACC2 balance - should be ${acc3Amount}`
                );
            }

            assert.equal(
                BigNumber(await TORO.totalSupply()).toString(), 
                totalSupplyBefore.minus(transferWithFeeAmount.dividedBy(100).multipliedBy(5)).toString(),
                "Expected for tokens to be burned, and equal 95% of transfered amount"    
            );
            assert.equal(
                BigNumber(await TORO.totalBurn()).toString(),
                transferWithFeeAmount.dividedBy(100).multipliedBy(5).toString(),
                "Should be 5e+16"
            )
        })
    })
})