// No-Operation: A function which does nothing.
const nop = ()=>{}

const PromiseBin = require('./PromiseBin')

describe('Foo', function() {
    it('bar', function() {
        expect(true).to.equal(true)
    })
})

describe(`PromiseBin`, function() {
    describe(`constructor`, function() {
        [
            'fulfillmentsHandler',
            'rejectionsHandler',
            'nextChangeHandler',
            'zeroPendingHandler'
        ].forEach(item => {
            it(`sets property ${item} to passed value`, function() {
                const opts = {}
                opts[item] = () => 42
                const bin = new PromiseBin(opts)
                expect(bin).to.have.property(item)
                    .to.equal(opts[item])
            })
        })
    })
    describe(`stats`, function() {
        [
            'pending',
            'rejected',
            'fulfilled',
            'total'
        ].forEach(item => {
            it(`property ${item} initializes to zero`, function() {
                const bin = new PromiseBin()
                expect(bin).to.have.property(item).to.equal(0)
            })
        })
        context(`status getter`, function() {
            it(`returns all stats as an object`, function() {
                const bin = new PromiseBin()
                bin._pending = 23
                bin._fulfilled = 48
                bin._rejected = -2
                bin._total = bin.pending + bin.fulfilled + bin.rejected
                expect(bin).to.have.property('status').to.be.an('object')
                expect(bin.status).to.have.property('pending').to.equal(bin._pending)
                expect(bin.status).to.have.property('fulfilled').to.equal(bin._fulfilled)
                expect(bin.status).to.have.property('rejected').to.equal(bin._rejected)
                expect(bin.status).to.have.property('total').to.equal(bin._total)
            })
        })
    })
    describe(`add()`, function() {
        it(`increments stat: pending`, function() {
            const bin = new PromiseBin()
            bin.add(new Promise(nop))
            expect(bin.pending).to.equal(1)
            bin.add(new Promise(nop))
            expect(bin.pending).to.equal(2)
        })
        it(`increments stat: total`, function() {
            const bin = new PromiseBin()
            bin.add(new Promise(nop))
            expect(bin.total).to.equal(1)
            bin.add(new Promise(nop))
            expect(bin.total).to.equal(2)
        })
        context(`promise resolution`, function() {
            before(function() {
                this.binf = new PromiseBin()
                this.binr = new PromiseBin()
                let fulfill, reject
                const fulfiller = (yay, nay) => {
                    fulfill = yay
                }
                const rejector = (yay, nay) => {
                    reject = nay
                }
                this.binf.add(new Promise(fulfiller))
                fulfill()
                this.binr.add(new Promise(rejector))
                reject()
            })
            it(`increments stat: fulfilled upon fulfillment`, function() {
                expect(this.binf.fulfilled).to.equal(1)
            })
            it(`increments stat: rejected upon rejection`, function() {
                expect(this.binr.rejected).to.equal(1)
            })
            it(`decrements stat: pending upon fulfillment`, function() {
                expect(this.binf.pending).to.equal(0)
            })
            it(`decrements stat: pending upon rejection`, function() {
                expect(this.binr.pending).to.equal(0)
            })
            it(`keeps steady stat: total upon resolution`, function() {
                expect(this.binf.total).to.equal(1)
                expect(this.binr.total).to.equal(1)
            })
        })
    })
    describe(`_updatePending()`, function() {
        beforeEach(function() {
            class updatePendingTestClass {
                constructor() {
                    this.zeroPendingHandler = sinon.fake()
                    this.nextChangeHandler = sinon.fake()
                    this._pending = 0
                }

                _updatePending() {
                    PromiseBin.prototype.
                    _updatePending.bind(this).call()
                }
            }
            this.binn = new updatePendingTestClass()
        })
        it(`decrements stat: pending`, function() {
            expect(this.binn._pending).to.equal(0)
            this.binn._updatePending()
            expect(this.binn._pending).to.equal(-1)
        })
        it(`calls nextChangeHandler()`, function() {
            expect(this.binn.nextChangeHandler.calledOnce).to.be.false
            expect(this.binn.zeroPendingHandler.called).to.be.false
            this.binn._updatePending()
            expect(this.binn.nextChangeHandler.calledOnce).to.be.true
            expect(this.binn.zeroPendingHandler.called).to.be.false
        })
        it(`calls zeroPendingHandler() when pending is zero`, function() {
            expect(this.binn.nextChangeHandler.calledOnce).to.be.false
            expect(this.binn.zeroPendingHandler.calledOnce).to.be.false
            expect(this.binn._pending).to.equal(0)
            this.binn._pending ++
            expect(this.binn._pending).to.equal(1)
            this.binn._updatePending()
            expect(this.binn._pending).to.equal(0)
            expect(this.binn.nextChangeHandler.calledOnce).to.be.true
            expect(this.binn.zeroPendingHandler.calledOnce).to.be.true
        })
    })
    describe(`_fulfill(value)`, function() {
        beforeEach(function() {
            class fulfillTestClass {
                constructor() {
                    this._updatePending = sinon.fake()
                    this.fulfillmentsHandler = sinon.fake()
                    this._fulfilled = 0
                }

                _fulfill(value) {
                    const fulfill = PromiseBin.prototype.
                    _fulfill.bind(this)
                    return fulfill(value)
                }
            }
            this.binn = new fulfillTestClass()
        })
        it(`increments stat: fulfilled`, function() {
            expect(this.binn._fulfilled).to.equal(0)
            this.binn._fulfill()
            expect(this.binn._fulfilled).to.equal(1)
            this.binn._fulfill()
            expect(this.binn._fulfilled).to.equal(2)
        })
        it(`passes 'value' arg to fulfillmentsHandler`, function() {
            const inputValue = 0934029
            expect(this.binn.fulfillmentsHandler.called).to.be.false
            this.binn._fulfill(inputValue)
            expect(this.binn.fulfillmentsHandler.calledOnce).to.be.true
            const outputValue = this.binn.fulfillmentsHandler.args[0][0]
            expect(outputValue).to.equal(inputValue)
        })
        it(`calls _updatePending`, function() {
            expect(this.binn._updatePending.called).to.be.false
            this.binn._fulfill()
            expect(this.binn._updatePending.called).to.be.true
        })
    })
    describe(`_reject(err)`, function() {
        beforeEach(function() {
            class rejectTestClass {
                constructor() {
                    this._updatePending = sinon.fake()
                    this.rejectionsHandler = sinon.fake()
                    this._rejected = 0
                }

                _reject(value) {
                    const reject = PromiseBin.prototype.
                    _reject.bind(this)
                    return reject(value)
                }
            }
            this.binn = new rejectTestClass()
        })
        it(`increments stat: rejected`, function() {
            expect(this.binn._rejected).to.equal(0)
            this.binn._reject()
            expect(this.binn._rejected).to.equal(1)
            this.binn._reject()
            expect(this.binn._rejected).to.equal(2)
        })
        it(`passes 'err' arg to rejectionsHandler`, function() {
            const inputValue = 29479835
            expect(this.binn.rejectionsHandler.called).to.be.false
            this.binn._reject(inputValue)
            expect(this.binn.rejectionsHandler.calledOnce).to.be.true
            const outputValue = this.binn.rejectionsHandler.args[0][0]
            expect(outputValue).to.equal(inputValue)
        })
        it(`calls _updatePending`, function() {
            expect(this.binn._updatePending.called).to.be.false
            this.binn._reject()
            expect(this.binn._updatePending.called).to.be.true
        })
    })
    describe(`notification promises`, function() {
        context(`nextChange() returns a promise which`, function() {
            it(`fulfills on next fulfillment`, async function() {
                const bin = new PromiseBin()
                const p1 = marioPromise()
                bin.add(p1)
                const next = bin.nextChange()
                expect(await promiseState(next)).to.equal('pending')
                p1.fulfill()
                await next
                expect(await promiseState(next)).to.equal('fulfilled')
            })
            it(`fulfills on next rejection`, async function() {
                const bin = new PromiseBin()
                const p1 = marioPromise()
                bin.add(p1)
                const next = bin.nextChange()
                expect(await promiseState(next)).to.equal('pending')
                p1.reject()
                await next
                expect(await promiseState(next)).to.equal('fulfilled')
            })
        })
        context(`nextFulfillment() returns a promise which`, function() {
            it(`fulfills on next fulfillment`, async function() {
                const bin = new PromiseBin()
                const p1 = marioPromise()
                bin.add(p1)
                const next = bin.nextFulfillment()
                expect(await promiseState(next)).to.equal('pending')
                p1.fulfill()
                await next
                expect(await promiseState(next)).to.equal('fulfilled')
            })
            it(`does nothing on next rejection`, async function() {
                const bin = new PromiseBin()
                const p1 = marioPromise()
                bin.add(p1)
                const next = bin.nextFulfillment()
                const contra = bin.nextRejection()
                expect(await promiseState(next)).to.equal('pending')
                p1.reject()
                await contra
                expect(await promiseState(next)).to.equal('pending')
                bin.add(Promise.resolve())
                await next
                expect(await promiseState(next)).to.equal('fulfilled')
            })
        })
        context(`nextRejection() reuturns a promise which`, function() {
            it(`fulfills on next rejection`, async function() {
                const bin = new PromiseBin()
                const p1 = marioPromise()
                bin.add(p1)
                const next = bin.nextRejection()
                expect(await promiseState(next)).to.equal('pending')
                p1.reject()
                await next
                expect(await promiseState(next)).to.equal('fulfilled')
            })
            it(`does nothing on next fulfillment`, async function() {
                const bin = new PromiseBin()
                const p1 = marioPromise()
                bin.add(p1)
                const next = bin.nextRejection()
                const contra = bin.nextFulfillment()
                expect(await promiseState(next)).to.equal('pending')
                p1.fulfill()
                await contra
                expect(await promiseState(next)).to.equal('pending')
                bin.add(Promise.reject())
                await next
                expect(await promiseState(next)).to.equal('fulfilled')
            })
        })
    })
    context(`noMorePending() returns a promise which`, function() {
        it(`is fulfilled(true) on (already) nothing pending`, async function() {
            const bin = new PromiseBin()
            const nomore = bin.noMorePending()
            expect(await promiseState(nomore)).to.equal('fulfilled')
        })
        it(`fulfills on pending reaches zero`, async function() {
            const bin = new PromiseBin()
            const p1 = marioPromise()
            const p2 = marioPromise()
            const p3 = marioPromise()
            expect(bin.pending).to.equal(0)
            expect(await promiseState(bin.noMorePending())).to.equal('fulfilled')
            bin.add(p1)
            expect(bin.pending).to.equal(1)
            const nomore = bin.noMorePending()
            expect(await promiseState(nomore)).to.equal('pending')
            bin.add(p2)
            expect(bin.pending).to.equal(2)
            expect(await promiseState(nomore)).to.equal('pending')
            p1.fulfill()
            await bin.nextChange()
            expect(bin.pending).to.equal(1)
            expect(await promiseState(nomore)).to.equal('pending')
            p2.reject()
            await bin.nextChange()
            expect(bin.pending).to.equal(0)
            expect(await promiseState(nomore)).to.equal('fulfilled')
        })
    })
})

// https://stackoverflow.com/a/35820220
async function promiseState(p) {
    const t = {};
    return Promise.race([p, t])
      .then(v => (v === t)? "pending" : "fulfilled", () => "rejected");
}


function marioPromise() { return createMarionettePromise() }
function createMarionettePromise() {
    let fulfill, reject
    const marionettePromise = new Promise((yay, nay) => {
        fulfill = yay
        reject = nay
    })
    marionettePromise.fulfill = fulfill
    marionettePromise.reject = reject
    return marionettePromise
}

class PBin {
    constructor(){}

    get status() {}

    get pending() { return this.pending }
    
    get rejected() { return this.rejected }
    
    get fulfilled() { return this.fulfilled }

    get total() { return this.total }

    add(promise) {}
    _updatePending() {}
    _fulfill(value) {}
    _reject(err) {}
    async nextChange() {}
    async nextFulfillment() {}
    async nextRejection() {}

    async noMorePending() {}
}