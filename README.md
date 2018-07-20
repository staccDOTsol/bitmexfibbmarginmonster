# bitmexfibbmarginmonster
 
 Consider using my Aff link:
 
 https://www.bitmex.com/register/VRBFuQ
 
 
1. Get Heroku (free for one app)
2. Get MongoDB Atlas (free tier)
3. Set the following vars in settings -> reveal config vars on Heroku:
4. Fork this Github repo, connect Heroku to Git and build.
5. Every time you change the code (or on initial setup), press more -> restart all dynos to restart the app.

a. startBtc - how many Sats you start with  
b. apikey - your key  
c. apisecret - your secret  
d. mongodb - your MongoDB connect URL. Remember to set your username/pass and an IP config of 0.0.0.0 - it'll look like this: mongodb+srv://jare:PasSWORD@cluster0-8dygf.mongodb.net/test?retryWrites=true  
e. thedatabase - a unique string for your database on MongoDB. It'll create if not exists. If the App does wonky things, reset this var and restart.  
