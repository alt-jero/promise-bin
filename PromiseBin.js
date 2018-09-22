/**
 * @author "Jeremy Rumble" <jero.rumble@gmail.com>
 */

// No-Operation: A function which does nothing.
const nop = ()=>{}

/**
 * @class PromiseBin
 * Fire-and-forget promise handler
 */
class PromiseBin {
    /**
     * PromiseBin Constructor
     * @param {Function} fulfillmentsHandler Last-in-line fulfillment handler
     * @param {Function} rejectionsHandler Last-in-line rejection handler
     */
    constructor(fulfillmentsHandler = nop, rejectionsHandler = nop) {
        this._pending = 0

        this._rejected = 0
        this._fulfilled = 0

        this._total = 0

        // Handlers
        this.fulfillmentsHandler = fulfillmentsHandler ? fulfillmentsHandler : nop
        this.rejectionsHandler = rejectionsHandler ? rejectionsHandler : nop

        this.nextChangeHandler = nop
        this.zeroPending = nop
    }

    /**
     * Getter for all stats values
     * - pending
     * - rejected
     * - fulfilled
     * - total
     * @returns {object}
     */
    get status() {
        let {pending, rejected, fulfilled, total} = this
        return {pending, rejected, fulfilled, total}
    }

    /** Get number of pending propmises in bin */
    get pending() { return this.pending }
    
    /** Get number of rejected promises in bin */
    get rejected() { return this.rejected }
    
    /** Get number of fulfilled promises in bin */
    get fulfilled() { return this.fulfilled }

    /** Get total number of promises in bin */
    get total() { return this.total }

    /**
     * Add a Promise to the list of pending promises
     * @param {Promise} promise A promise to await
     */
    add(promise) {

        // Update our stats
        this._pending ++
        this._total ++
        
        // Get references to our handlers
        let yay = this._fulfill.bind(this)
        let nay = this._reject.bind(this)

        // Add our handlers to the promise
        promise.then(yay).catch(nay)

        // Et Voila!
    }

    /**
     * Update stats + Notify
     */
    _updatePending() {
        
        // Update our stats
        this._pending --

        // If we've gotten through all the promises then
        // notify any listeners that that is the case
        if(this._pending === 0) this.zeroPending()

        // And notify that we've had a change in status
        this.nextChangeHandler()

        // Et Voila!
    }

    /**
     * Private
     * This function is called when a promise is fulfilled
     * @param {*} value The return value of the promise
     */
    _fulfill(value) {
        this._fulfilled ++
        this.fulfillmentsHandler(value)
        this._updatePending()
    }

    /**
     * Private
     * This function is called when a promise is rejected
     * @param {*} err The rejection value of the promise
     */
    _reject(err) {
        this._rejected ++
        this.rejectionsHandler(err)
        this._updatePending()
    }

    /**
     * Get a promise which will resolve upon the fulfillment
     * or rejection of the next promise which changes status.
     * @returns {Promise} The onNextChange Promise
     */
    async nextChange() {
        // Already?
        if(this._pending < 1) return true;
        
        // Borrow the handler...
        let nextChangeHandler = this.nextChangeHandler
        // And use a promise...
        return new Promise(function(resolve){
            // To hook in to the communique...
            this.nextChangeHandler = resolve
            // And when we hear back...
        }.bind(this)).then(function(){
            // Remove the splice...
            this.nextChangeHandler = nextChangeHandler
            // And send something nice!
            this.nextChangeHandler()
        }.bind(this))
    }

    /**
     * Get a promise which will resolve upon the fulfillment
     * of the next promise which changes status to fulfilled.
     * @returns {Promise} The onNextFulfillment Promise
     */
    async nextFulfillment() {
        // Nothing else to fulfill?
        if(this._pending < 1) return true;

        // Borrow the handler...
        let fulfillment = this.fulfillmentsHandler
        // And use a promise...
        return new Promise(function(yay,nay) {
            // To insert one of ours.
            this.fulfillmentsHandler = yay
            // And when we hear back...
        }.bind(this)).then(function(info){
            // Remember to replace it...
            this.fulfillmentsHandler = fulfillment
            // And pass on what we've learned.
            return this.fulfillmentsHandler(info)
        }.bind(this))
    }

    /**
     * Get a promise which will resolve upon the rejection
     * of the next promise which changes status to rejected.
     * @returns {Promise} The onNextRejection Promise
     */
    async nextRejection() {
        // Nothing else to fulfill?
        if(this._pending < 1) return true;

        // Borrow the handler...
        let borrowedHandler = this.rejectionsHandler

        let resolver = function(resolve) { this.rejectionsHandler = resolve }.bind(this)
        let returner = function(returns) {
            this.rejectionsHandler = borrowedHandler
            return borrowedHandler(returns)
        }.bind(this)

        // And use a promise...
        return new Promise(resolver).then(returner)
    }

    /**
     * Get a promise which will resolve upon the fultillment
     * or rejection of all the promises - Like Promise.all()
     * @returns {Promise} The onNoMorePending Promise
     */
    async noMorePending() {
        // Already?
        if(this._pending < 1) return true;
        
        // Borrow the handler...
        let zeroPending = this.zeroPending;
        // And use a promise...
        return new Promise(function(resolve){
            // To hook in to the communique...
            this.zeroPending = resolve
            // And when we hear back...
        }.bind(this)).then(function(){
            // Remove the splice...
            this.zeroPending = zeroPending
            // And send something nice!
            this.zeroPending()
        }.bind(this))
    }
}

module.exports = PromiseBin