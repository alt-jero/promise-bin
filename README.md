# The Promise Bin
Need a way to keep track of and handle a lot of similar
promises without iterating over an array to find out which
have resolved?

I wrote this as a way to process the results of running
fstat on many files. I wanted to be able to handle the
results as they came in without keeping a list of promises
to check. I also wanted to know when and how my promises were
resolving so that I could update a status line in the console.

## What is it?
Rather than creating an array or chain of promises, or using 
`Promise.all()`, wouldn't it be cool if promises could just
keep track of themselves?

PromiseBin is basically a bucket. Chuck your promises in there
and leave them be. Register a success handler and an error handler
and all of the results will be piped there, as they come in.

Want to trigger an event or events when the next promise fulfills?
Done.

Want to know how many promises are still pending?
We've got your stats.

## Usage
```
// Instantiate PromiseBin with fulfill and reject handlers
const bin = new PromiseBin(onFulfill, onReject)

// Add some promises
bin.add(aPromise)
bin.add(anotherPromise)
bin.add(morePromises)

// Get the return value of the next promise to be fulfilled
const nextToFulfill = await bin.nextFulfillment()

// Get the error of the next promise to be rejected
const nextToReject = await bin.nextRejection()

// This will wait for the next promise to
// either fulfill or reject before proceeding
await bin.nextChange()

// This will wait until all of the promises have resolved
// before proceeding.
await bin.noMorePending()

// Also you can get stats at any time
bin.fulfilled // => the number of promises already fulfilled
bin.rejected // => the number of promises which have rejected
bin.pending // => how many promises have yet to resolve
bin.total  // => total number processed by this instance

// And this returns an object containing all of the stats
bin.status // => { fulfilled, rejected, pending, total }
```

## How does it work?
The `onFulfill` and `onReject` handlers passed to the constructor are
directly linked to the `.then()` and `.catch()` respectively of any promise
which is `.add()`'ed to the bin. When calling, for example `.nextToFulfill()`,
we break the chain and replace the `onFulfill` with a new promise, which we return.
The new promise, prior to being returned, is `.then()`'ed to replace the original
handler and to call it with the value fulfilled. Any number of handlers can be 
inserted in this way, and then removed again upon the event being triggered.

Essentially, this is a multiply-linked list of promises which cascade upon resolution.
Just think of a digital-quantum-waveform collapsing into a known value.

Honestly I don't know how to explain it better than that... just look at the code.

## TODO
- Testing
- Wrangling this into a proper package
- NPM FTW!

## Author
Jeremy Rumble
https://medium.com/@jmrumble
