//TODO (contacts):
//players need contacts list field
//need to search by player ID or name (exact match)
//need to hold sent requests in own collection ContactRequests (id, time, sender, receipient)
//will display on both until resolved
//users need to be able to accept or reject messages (determines whether deleted from db)

//use web sockets to enable real-time status between two, optimist UI updates for sender and receipients

//note: messaging is independent from whether someone is added as a contact or not

//200 contact constraint on contact list: cannot accept under this condition
//request

//200 contact constraint on contact list: cannot send under this condition
//request (send contact request)

//decision (reject: deletes the request; accept: accept them to contact list then deletes the request)

//list (for contact requests sent or received) a list of currently added contacts should be handled on login to reduce unnecessary db pings