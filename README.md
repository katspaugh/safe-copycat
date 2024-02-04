## Safe Copycat
An app to copy your Safe to the same address on another chain.

## Why is it useful

If you accidentally send funds to your Safe address on the wrong chain, you can create a copy of this Safe on that chain and recover your funds.

## How does it work

It looks up the Safe creation transaction and replays it on another chain.

### Limitations

A prerequisite for this to work is that the master Safe contract (aka Safe Proxy Factory) is deployed at the same address as the original Safe.

Some chains, unfortunately, have the factory contract deployed on a different address. The app will show you if a copy cannot be made.
\
<img width="741" alt="Screenshot" src="https://user-images.githubusercontent.com/381895/160234600-e3491e0d-f83c-4a63-8e51-fcc976c50af1.png">
