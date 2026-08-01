//TODO 1: Research appropriate rate limiter

//TODO 2: Look into appropriate settings for various routes

//Still haven't done this yet, should be fairly simple though

//should endpoints be set to the same rate limit token costs to avoid providing malicious clients with info on 
//how the system works?


//copying here due to relevance

//upon reconnection, will try to retrieve from server's buffered events. If fails, use call to DB.  
//If there's a higher rate limit for end-points with DB calls over trying to retrieve from the server's event
//buffer (which is comparably cheaper retrieve from). Then this can make it difficult to maliciously or (recklessly)
//occupy server resources. 