
//not going to do this for now, will get game working first

//TODO:
//list (returns a list of chat partners (including contacts with no messages sent yet)

//getMessagesByUserId (just going to get all of them for now, I'll add proper pagination another time)

//sendMessage

//need to revist how I handle socket events. It made sense to emit from the controller for contact request.
//A message doesn't need to have the same guards against race conditions and an approximate or eventually synced 
//approach might be better, at least from what I've read on it so far.