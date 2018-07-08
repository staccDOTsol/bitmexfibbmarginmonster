const BitMEXClient = require('bitmex-realtime-api');
var MongoClient = require('mongodb').MongoClient;
var BitMexApi = require('bit_mex_api');
var math = require('mathjs');

var linkid;
const express = require('express');
var startDate = new Date()
var path = require('path')
 var startBtc =  parseFloat(process.env.startBtc);
var app = express()
const tw = require('./trendyways.js');
var request = require('request');
var crypto = require('crypto');

var apiKey = process.env.apikey;
var apiSecret = process.env.apisecret;
const client = new BitMEXClient({
  testnet: true, // set `true` to connect to the testnet site (bitmex.com)
  // Set API Key ID and Secret to subscribe to private streams.
  // See `Available Private Streams` below.
  apiKeyID: process.env.apikey,
  apiKeySecret: process.env.apisecret,
  maxTableLen: 10000  // the maximum number of table elements to keep in memory (FIFO queue)
});
// See 'options' reference below
var lotSizes = []
var symbols = []
var ticks = []
var apiInstance = new BitMexApi.InstrumentApi();
var bestAsk=[]
var bestBid=[]
var tickSizes = []
var initMargins = []
var winners=[]
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);

	for (var v in data){
		symbols.push(data[v].symbol);
		bestAsk[data[v].symbol] = data[v].askPrice;
		bestBid[data[v].symbol] = data[v].bidPrice
		avg = ((parseFloat(data[v]['highPrice']) + parseFloat(data[v]['lowPrice'])) / 2);
		
		if (parseFloat(data[v].lastPrice) <= avg){
			var trend = 'DOWNTREND';
		}else {
			var trend = 'UPTREND';
		}
		var sfibb = [];
		 sfibb.push({
			h: parseFloat(data[v]['highPrice']),
			l: parseFloat(data[v]['lowPrice'])
		})
			var f = fibonacciRetrs(sfibb, trend)[0];
			var lesser = []
			var greater = []
			for (var fibb in f){
					if (f[fibb] <= parseFloat(data[v].lastPrice)){
						lesser.push(f[fibb]);
					}
					else {
						greater.push(f[fibb]);
					}
			}
			//console.log(greater);
			//console.log(lesser);
			var k = data[v].symbol
							winners[k] = {}
							if ((greater.length >= 1 && lesser.length >= 1)){
								
								var collection = dbo.collection(k);
								if (greater[0] != undefined){
									winners[k].sell1 = greater[0]
								}
								if (greater[1] != undefined){
									winners[k].sell2 = greater[1]
									
								}
								if (lesser[0] != undefined){
									winners[k].buy1 = lesser[0]
									winners[k].sl = lesser[0] * 0.01; //0.93
									
								}
								if (lesser[1] != undefined){
									winners[k].buy2 = lesser[1]
									winners[k].sl = lesser[1] * 0.01; //.93
									
								}
								    
								winners[k].bought1 = false;
								winners[k].bought2 = false;
								winners[k].sold1 = false;
								winners[k].sold2 = false;
								winners[k].k = k;
								winners[k].currencyPair = k;
								
								
								winners[k].cancelled = false;
								
															
									
							insert(winners[k], collection);
									
									
									updateStoplimits(winners[k], collection);
									
								
							}
	}
	for (var v in symbols){
		client.addStream(symbols[v], 'quote', function(data, symbol, table) {
			if (bestAsk[symbol] == undefined){
				bestAsk[symbol] = []
			}
			if (bestBid[symbol] == undefined){
				bestBid[symbol] = []
			}
			for (var d in data){
			//console.log(data[d].bidPrice);
	
			bestBid[symbol] = data[d].bidPrice;
			bestAsk[symbol] = data[d].askPrice;	
		}
		//console.log('Update on ' + table + ':' + symbol + '. New data:\n', data, '\n');
		if (!ticks.includes(symbol)){
					  ticks.push(symbol);
		var verb = 'GET',
		  path = '/api/v1/instrument/active',
		  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
		  data = {};
		//console.log(data);
		// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
		// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
		var postBody = JSON.stringify(data);

		var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

		var headers = {
		  'content-type' : 'application/json',
		  'Accept': 'application/json',
		  'X-Requested-With': 'XMLHttpRequest',
		  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
		  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
		  'api-expires': expires,
		  'api-key': apiKey,
		  'api-signature': signature
		};

		var requestOptions = {
		  headers: headers,
		  url:'https://testnet.bitmex.com'+path,
		  method: verb,
		  body: postBody
		};

		request(requestOptions, function(error, response, body) {
		  if (error) { console.log(error); }
		  
		  for (var d in JSON.parse(body)){
			  if (symbol ==(JSON.parse(body)[d].symbol)){
				  lotSizes[symbol] = JSON.parse(body)[d].lotSize
				  tickSizes[symbol] = JSON.parse(body)[d].tickSize
				  initMargins[symbol] = JSON.parse(body)[d].initMargin
				  console.log(JSON.parse(body)[d]);
				  //console.log(tickSizes);
			  }
		  }
		});}
		});
		client.addStream(symbols[v], 'margin', function(data, symbol, table) {
			if (data[0]){
			//console.log(data[0])
			tBal=mBal = data[0].marginBalance;
			mBal = data[0].excessMargin;
			//console.log(data[0]);
			//console.log(mBal);
			}
		//console.log('Update on ' + table + ':' + symbol + '. New data:\n', data, '\n');
		});
	}
	//console.log(data);
	
  }
};
var mBal = 1;
var tBal = 1;
	function updateStoplimits(wp, collection){
		if (wp.k == 'tXMRBTC'){
		console.log(wp);
		}

		collection.find({

                }, {
                    $exists: true
                }).sort({
                    _id: -1

                }).toArray(function(err, doc3) {
                    for (var d in doc3) {
						if (doc3[d].trades){
							doc3[d].trades.buy1 = wp.buy1;
							doc3[d].trades.buy2 = wp.buy2;
							doc3[d].trades.sell1 = wp.sell1;
							doc3[d].trades.sell2 = wp.sell2;
							
	 collection.update({
	},{
                            $set: {
                                'trades': doc3[d].trades
                            }
                        }, {
		
	},
	function(err, result) {
	
		//console.log(result.result);
	});
	}
					}
					});
				}
 function insert(wp, collection){
	//console.log(wp);
	
			collection.find({

                }, {
                }).sort({
                    _id: -1

                }).toArray(function(err, doc3) {
					//console.log(doc3);
					if (doc3.length == 0){
	 console.log('insert');
						collection.insertOne({
				'trades': wp
			}, function(err, res) {
				if (err) console.log(err);
				
			if (wp.currencyPair == "BTC_BCH"){
				////////console.log(wp);
			}
			  //////console.log(res.result);
			}); 
					} else {
					}
				})
			
 }
 var dbs = []
 var collections = []
 var dbo;
 function doCollections(){
	 
linkid = Math.floor(Math.random() * 999999999999999999999);
console.log('linkid: ' + linkid.toString());
	  for (var c in collections) {
                var collection = collections[c];
                collectionDo(collection);



							}
 }
 /*
setInterval(function(){
	doOrders()
}, 60000); */
 function doOrders(){
	 
var verb = 'GET',
		  path = '/api/v1/order',
		  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
		  data = {};
		//console.log(data);
		// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
		// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
		var postBody = JSON.stringify(data);

		var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

		var headers = {
		  'content-type' : 'application/json',
		  'Accept': 'application/json',
		  'X-Requested-With': 'XMLHttpRequest',
		  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
		  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
		  'api-expires': expires,
		  'api-key': apiKey,
		  'api-signature': signature
		};

		var requestOptions = {
		  headers: headers,
		  url:'https://testnet.bitmex.com'+path,
		  method: verb,
		  body: postBody
		};

		request(requestOptions, function(error, response, body) {
		  if (error) { console.log(error); }
		  
		  //console.log((JSON.parse(body)));
		  var json = JSON.parse(body);
		  orders = []
		  for (var o in json){
			  if (json[o].orderQty >= 0.001){
				  orders.push(json[o]);
			  }
		  }
		
		for (var c in collections){
			var collection = collections[c];
                doUpdate(collection, orders);
				
		}
		});
 }
 function doUpdate(collection, orders){
	 var enablemaybe = []
	 collection.find({

                }, {
                    $exists: true
                }).sort({
                    _id: -1

                }).toArray(async function(err, doc3) {
					for (var d in doc3){
						for (var o in orders){
							if (orders[o].symbol == doc3[d].trades.k){
									//console.log(orders[o].ordStatus);
								if (orders[o].ordStatus == "Canceled" || orders[o].ordStatus == "Rejected" || orders[o].ordStatus == "Filled"){
									enablemaybe[doc3[d].trades.k] = true;
								}
							}
						}for (var o in orders){
							if (orders[o].symbol == doc3[d].trades.k){
									//console.log(orders[o].ordStatus);
								if (orders[o].ordStatus == "New"){
									enablemaybe[doc3[d].trades.k] = false;
								}
							}
						}
						if (enablemaybe[doc3[d].trades.k] == true && (doc3[d].trades.bought1 == true && doc3[d].trades.bought2 == true)){
							doc3[d].trades.bought1 = false;
							doc3[d].trades.bought2 = false;
							console.log('set buys true');
						collection.update({
							},{
													$set: {
														'trades': doc3[d].trades
													}
												}, {
								
							},
							function(err, result) {
								if (!err) console.log(result.result);
							});
						} if (enablemaybe[doc3[d].trades.k] == true && (doc3[d].trades.sold1 == true && doc3[d].trades.sold2 == true)){
							//console.log(doc3[d]);
							doc3[d].trades.sold1 = false;
							doc3[d].trades.sold2 = false;
							//console.log(doc3[d]);
							console.log('set solds true');
						collection.update({
							'trades.k': doc3[d].trades.k
							},{
													$set: {
														'trades': doc3[d].trades
													}
												}, {
								
							},
							function(err, result) {
								console.log(err)
								if (!err) console.log(result.result);
							});
						}
					}
				});
 }
 function collectionDo(collection){
	 
 var ds = []
	collection.find({

                }, {
                    $exists: true
                }).sort({
                    _id: -1

                }).toArray(function(err, doc3) {

                    for (var d in doc3) {
							//console.log(tickSizes	);
						if (doc3[d].trades){
							 var d3d = doc3[d];
							 var go = false;
							 for (var d in tickSizes){
								//console.log(d);
							if (d == d3d.trades.k){
							go = true;
							}							
							 }
							if (go == true){
							//console.log(d3d)	
						if (d3d.trades.bought1 == false){
							//console.log(bestAsk)
							//console.log(d3d.trades.k);
							//console.log(bestAsk[d3d.trades.k]);
							//console.log(d3d.trades.buy1);                                                                             
				                        if (parseFloat(bestAsk[d3d.trades.k]) <= d3d.trades.buy1 && parseFloat(bestAsk[d3d.trades.k]) > 0.00000200)	 {
                            //////////console.log(d3d.trades.last);
							//////////console.log(d3d.trades);
							d3d.trades.bought1 = true;
							if (godobuy == true){
								godobuy = false;

							console.log('dobuy:');
							console.log(d3d);
							collection.update({
								}, {
									$set: {
										"trades": d3d.trades
									}
								},
								function(err, result) {
								   
								if (!err) 	console.log(result.result);
														

								});
							buy(d3d.trades.k, bestAsk[d3d.trades.k], d3d.trades.buy1);
							}
                        }
						}
                        if (d3d.trades.buy2) {
                            if (parseFloat(bestAsk[d3d.trades.k])<= d3d.trades.buy2 && d3d.trades.bought2 == false && parseFloat(bestAsk[d3d.trades.k]) > 0.00000200) {
							//////////console.log(d3d.trades.last);
							//////////console.log(d3d.trades);
							d3d.trades.bought2 = true;
														if (godobuy == true){
godobuy = false;
								collection.update({
								}, {
									$set: {
										"trades": d3d.trades
									}
								},
								function(err, result) {
								   
								   console.log(err);
									if (!err) console.log(result.result);
														

								});
							console.log('dobuy2:');
							console.log(d3d);
							buy(d3d.trades.k, bestAsk[d3d.trades.k], d3d.trades.buy1);
                            }
							}
                        }
						if (d3d.trades.sold1 == false){
                        if (parseFloat(bestBid[d3d.trades.k]) >= d3d.trades.sell1 && parseFloat(bestAsk[d3d.trades.k]) > 0.00000200) {
                            //////////console.log(d3d.trades.last);
							//////////console.log(d3d.trades);
							d3d.trades.sold1 = true;
							if (godosell == true){
								godosell = false;

							console.log('dosell');
							console.log(d3d);
							collection.update({
								}, {
									$set: {
										"trades": d3d.trades
									}
								},
								function(err, result) {
								   console.log(err);
								if (!err) 	console.log(result.result);
														

								});
						sell(d3d.trades.k, d3d.trades.sell1, bestBid[d3d.trades.k]);
							}
                        }
						}
                        if (d3d.trades.sell2) {
                            if (parseFloat(bestBid[d3d.trades.k]) >= d3d.trades.sell2 && d3d.trades.sold2 == false && parseFloat(bestAsk[d3d.trades.k]) > 0.00000200 ){
							//////////console.log(d3d.trades.last);
							//////////console.log(d3d.trades);
							d3d.trades.sold2 = true;
														if (godosell == true){
godosell = false;
								collection.update({
								}, {
									$set: {
										"trades": d3d.trades
									}
								},
								function(err, result) {
								   
								   console.log(err);
									if (!err) console.log(result.result);
														

								});
							console.log('dosell2:');
							console.log(d3d);
						sell(d3d.trades.k, d3d.trades.sell2,bestBid[d3d.trades.k]);
                            }
							}
                        }
							}
						}
					}
				})
 }
		function decimalPlaces(num) {
  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
}		
				
 setTimeout(function(){
MongoClient.connect(process.env.mongodb || mongodb, function(err, db) {
	console.log(err);
	//insert(
   dbo = db.db(process.env.thedatabase)
	var count = 0;
    dbo.listCollections().toArray(function(err, collInfos) {
        // collInfos is an array of collection info objects that look like:
        // { name: 'test', options: {} }
        for (col in collInfos) {

            dbs.push(collInfos[col].name);
            collections.push(dbo.collection(collInfos[col].name));
			console.log(dbs);
        }
			doOrders();
        //////////console.log(dbs);
						////////////console.log('settimeout');
						setTimeout(function(){
						doCollections(collections);
						}, 5000);
                setInterval(function() {
	
                    doCollections(collections);
                }, 25500);
				
					apiInstance.instrumentGetActive(callback);
					setInterval(function(){
					//	
					apiInstance.instrumentGetActive(callback);
					}, 180000);
    });
});
}, 100);
 
function buy(k, rate, rate2){ //rate2 for buy is higher
	console.log('buy buy ! ' + k + ' ' + rate + ' ' + rate2);
	
setTimeout(function(){
var verb = 'POST',
  path = '/api/v1/position/leverage',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,leverage:1/(initMargins[k] * 10)};

// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { gonext = false; console.log('err err err');if (error.toString().indexOf('Executing at order price ')!= -1){gonext = false;}console.log(error); }
  console.log(body);
});
}, 2000);
var ran = Math.random() * 4 + 1

setTimeout(function(){
	

var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
if (stringValue.split('.')[1] != undefined){

console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = ((parseFloat(mBal) / 70000))
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
}else {
		var price = Math.floor(((parseFloat(mBal) / 70000)))

}
console.log(price);
var lot=price;

if (lot == 0){
	//lot=2;
}
var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
	console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = parseFloat(rate)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
}
else{
	var price = Math.floor(parseFloat(rate))
}

console.log(price);


var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,price:price,ordType:"Limit"};

// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};
var gonext = true;
request(requestOptions, function(error, response, body) {
  if (error) {gonext = false; if (error.toString().indexOf('Executing at order price ')!= -1){gonext = false;}console.log(error); }
  if (body.toString().indexOf('Executing at order price ')!= -1){gonext = false;}
if (body.toString().indexOf('error') != -1){gonext = false;}
console.log('gonext: ' + gonext);
if (gonext == true){
setTimeout(function(){
	

var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = -1*((parseFloat(mBal) / 70000)/2)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
} else {
		var price = Math.floor(-1*((parseFloat(mBal) / 70000)/2))

}
console.log(price);
var lot=price;

if (lot == 0){
	//lot=-1;
}

	var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
	console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))
	if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = parseFloat(rate2)
	var offset = (parseFloat(rate) * .01)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	offset = offset * Math.pow(10, length)
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)
		offset = offset / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
	offset = Math.round(offset);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
	offset = offset / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)
		offset = offset * Math.pow(10, lengthabove)


	}} else {
			var price = Math.floor(parseFloat(rate2))
	var offset = Math.floor((parseFloat(rate) * .01))
	}
console.log(price);


var ran = Math.random() * 4 + 1
var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,ordType:"StopLimit", price: price, pegPriceType:'TrailingStopPeg', pegOffsetValue: offset};

// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
});
}, 2000);
var linkid;
setTimeout(function(){
	


var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();

console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = -1*((parseFloat(mBal) / 70000)/2)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
} else {
		var price = Math.floor(-1*((parseFloat(mBal) / 70000)/2))

}
console.log(price);

var lot=price;

if (lot == 0){
	//lot=-1;
}
var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
	console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = parseFloat(rate2)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
} else {
		var price = Math.floor(parseFloat(rate2))

}
console.log(price);

var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,price:price,ordType:"Limit", clOrdLinkID:linkid.toString(), contingencyType: 'OneCancelsTheOther'};

// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
});
}, 2000);

setTimeout(function(){

var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();

console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = (-1*((parseFloat(mBal) / 70000)/2))
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)
}
} else {
		var price = Math.floor((-1*((parseFloat(mBal) / 70000)/2)))

}
console.log(price);

var lot=price;

if (lot == 0){
	//lot=-1;
}

	var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
		console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = (parseFloat(rate)*0.88)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
}
else {
		var price = Math.floor((parseFloat(rate)*0.93))

}
console.log(price);


var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,price:price,ordType:"Limit", clOrdLinkID:linkid.toString(),  contingencyType: 'OneCancelsTheOther'};

// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
}); 
godobuy = true;
}, 2000);
}else {
	godobuy = true;
}
});
}, 2000);
}
function sell(k, rate, rate2){ //rate2 for sell is lower
console.log('sell sell ! ' + k + ' ' + rate + ' ' + rate2);
var qty = (parseFloat(mBal) / 70000);
setTimeout(function(){
var verb = 'POST',
  path = '/api/v1/position/leverage',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,leverage:1/(initMargins[k] * 10)};

// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
});
}, 2000);
var ran = Math.random() * 4 + 1

setTimeout(function(){
	

var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();

console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = (-1 * (parseFloat(mBal) / 70000))
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
} else {
		var price = Math.floor((-1 * (parseFloat(mBal) / 70000)))

}
console.log(price);
var lot=price;

if (lot == 0){
//	lot=-2;
}
var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
	console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = parseFloat(rate)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
} else {
		var price = Math.floor(parseFloat(rate))

}
console.log(price);



var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,price:price,ordType:"Limit"};
console.log(data);
// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};
var gonext = true;
request(requestOptions, function(error, response, body) {
   if (error) { console.log('err err err');if (error.toString().indexOf('Executing at order price ')!= -1){gonext = false;}console.log(error); }
  if (body.toString().indexOf('Executing at order price ')!= -1){gonext = false;}
if (body.toString().indexOf('error') != -1){gonext = false;}
console.log('gonext: ' + gonext);

if (gonext == true){

setTimeout(function(){

var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();

console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = ((parseFloat(mBal) / 70000)/2)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
} else {
		var price = Math.floor(((parseFloat(mBal) / 70000)/2))

}
console.log(price);
var lot=price;

if (lot == 0){
//	lot=1;
}
	var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
		console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = parseFloat(rate2)
	var offset = (parseFloat(rate) * .01)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	offset = offset * Math.pow(10, length)
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)
		offset = offset / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
	offset = Math.round(offset);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
	offset = offset / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)
		offset = offset * Math.pow(10, lengthabove)


}
} else {
		var price = Math.floor(parseFloat(rate2))
	var offset = Math.floor((parseFloat(rate) * .01))
}
console.log(price);



var ran = Math.random() * 4 + 1
var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,ordType:"StopLimit", price: price, pegPriceType:'TrailingStopPeg', pegOffsetValue: offset };
console.log(data);
// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
});
}, 2000);
setTimeout(function(){




var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();

console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = ((parseFloat(mBal) / 70000)/2)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
}else {
		var price = Math.floor(((parseFloat(mBal) / 70000)/2))

}
console.log(price);
var lot=price;
if (lot == 0){
//	lot=1;
}
var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();
	console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))

if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = parseFloat(rate2)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
console.log(price);

} else {
		var price = Math.floor(parseFloat(rate2))

}
console.log(price);

var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,price:price,ordType:"Limit", clOrdLinkID:linkid.toString(), contingencyType: 'OneCancelsTheOther'};
console.log(data);
// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
});
}, 2000);

setTimeout(function(){


var stringValue = math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();

console.log(math.format(lotSizes[k],{exponential:{lower:0,upper:Infinity}}));
if (stringValue.split('.')[1] != undefined){
var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = ((parseFloat(mBal) / 70000)/2)
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
} else {
		var price = Math.floor(((parseFloat(mBal) / 70000)/2))

}
console.log(price);
var lot=price;

if (lot == 0){
	//lot=1;
}
var stringValue = math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}).toString();	console.log(math.format(tickSizes[k],{exponential:{lower:0,upper:Infinity}}))
if (stringValue.split('.')[1] != undefined){

var length = stringValue.split('.')[1].length
var lengthabove = stringValue.split('.')[0].length 
	var price = parseFloat(rate)*1.12
	console.log('length: ' + length);
	console.log('lengthabove: ' + lengthabove);
if (length >= lengthabove){
	price = price * Math.pow(10, length)
}else {
		price = price / Math.pow(10, lengthabove)

}
console.log(price);
	price = Math.round(price);
console.log(price);
	
	if (length >= lengthabove){
	price = price / Math.pow(10, length)
}else {
		price = price * Math.pow(10, lengthabove)

}
}else {
		var price = Math.floor(parseFloat(rate)*0.93)

}
console.log(price);

var verb = 'POST',
  path = '/api/v1/order',
  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
  data = {symbol:k,orderQty:lot,price:price,ordType:"Limit", clOrdLinkID:linkid.toString(),  contingencyType: 'OneCancelsTheOther'};
console.log(data);
// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

var requestOptions = {
  headers: headers,
  url:'https://testnet.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
}); 
godosell = true;
}, 2000);
}else {
	godosell = true;
}

});
}, 2000);
}
var godosell = true;
var godobuy = true;
var stoplimits = []
var gosend = true
var positions = []
var orders = []
function sortFunction3(a,b){  
				var dateA = new Date(a.timestamp).getTime();
				var dateB = new Date(b.timestamp).getTime();
				return dateA < dateB ? 1 : -1;  
			}; 
app.get('/', function (req, res){
	gosend = true				
	stoplimits = []

	var msg = '<head><link rel="icon" href="https://polofibbmonster.herokuapp.com/favicon.ico?v=2" /><meta http-equiv="refresh" content="120"><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script></head><h1>Don\'t Panic! If the data seems off, wait a minute or so.</h1>'
	msg+="Total margin (sats): " + tBal
	msg+="<br>Current excess margin (sats): " + mBal
	var percent = (100 * (-1 * (1 - (tBal / startBtc)))).toFixed(4)
	msg+="<h1>Percent: " + percent + '%</h1>'
	var diff2 = Math.abs(new Date() - startDate);
	var minutes = Math.floor((diff2/1000)/60);
	var hours = ((diff2/1000)/60 / 60).toFixed(8);
	var percentHr = ((percent) / hours).toFixed(4);
	msg+="minutes: " + minutes + ', '
	msg+="hours: " + hours
	msg+="<h1>Percent/hr: " + percentHr + "%</h1>"
	dbo.listCollections().toArray(function(err, collInfos) {
        // collInfos is an array of collection info objects that look like:
        // { name: 'test', options: {} }
        for (col in collInfos) {

            dbs.push(collInfos[col].name);
            collections.push(dbo.collection(collInfos[col].name));
        }
        //////////console.log(dbs);				
		////console.log(tickers);
		var verb = 'GET',
		  path = '/api/v1/position',
		  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
		  data = {filter:{"isOpen":true}};
		//console.log(data);
		// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
		// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
		var postBody = JSON.stringify(data);

		var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

		var headers = {
		  'content-type' : 'application/json',
		  'Accept': 'application/json',
		  'X-Requested-With': 'XMLHttpRequest',
		  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
		  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
		  'api-expires': expires,
		  'api-key': apiKey,
		  'api-signature': signature
		};

		var requestOptions = {
		  headers: headers,
		  url:'https://testnet.bitmex.com'+path,
		  method: verb,
		  body: postBody
		};

		request(requestOptions, function(error, response, body) {
		  if (error) { console.log(error); }
		  
		  //console.log((JSON.parse(body)));
		  var json = JSON.parse(body);
		  positions = []
		  for (var o in json){
			  if (json[o].openOrderBuyQty >= 0.001 || json[o].openOrderSellQty >= 0.001 || json[o].openOrderSellQty <=  -0.001){
				  positions.push(json[o]);
			  }
		  }
		});
var verb = 'GET',
		  path = '/api/v1/order',
		  expires = new Date().getTime() + (60 * 1000), // 1 min in the future
		  data = {filter:{"open":true}};
		//console.log(data);
		// Pre-compute the postBody so we can be sure that we're using *exactly* the same body in the request
		// and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
		var postBody = JSON.stringify(data);

		var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

		var headers = {
		  'content-type' : 'application/json',
		  'Accept': 'application/json',
		  'X-Requested-With': 'XMLHttpRequest',
		  // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
		  // https://testnet.bitmex.com/app/apiKeysUsage for more details.
		  'api-expires': expires,
		  'api-key': apiKey,
		  'api-signature': signature
		};

		var requestOptions = {
		  headers: headers,
		  url:'https://testnet.bitmex.com'+path,
		  method: verb,
		  body: postBody
		};

		request(requestOptions, function(error, response, body) {
		  if (error) { console.log(error); }
		  
		  //console.log((JSON.parse(body)));
		  var json = JSON.parse(body);
		  orders = []
		  for (var o in json){
			  if (json[o].orderQty >= 0.001){
				  orders.push(json[o]);
			  }
		  }
		  orders.sort(sortFunction3);
		  positions.sort(sortFunction3);
		});
		for (var c in collections){
			var collection = collections[c];
                collection.find({

                }, {
                    $exists: true
                }).sort({
                    _id: -1

                }).toArray(async function(err, doc3) {
					for (var d in doc3){
						
					//	////////console.log(doc3[d])
						
						//////////console.log(doc3[d].trades);
						if (doc3[d].trades){
							
						if (doc3[d].trades.bought1 == false){
							var sl = {'direction': 'buy1', 'pair' : doc3[d].trades.k, 'stoplimit': doc3[d].trades.buy1, 'currentAsk': bestAsk[doc3[d].trades.k], 'percent': (parseFloat(bestAsk[doc3[d].trades.k]) / parseFloat(doc3[d].trades.buy1))}
						stoplimits.push(sl);
							
						
						}
						if (doc3[d].trades.bought2 == false){
							if (doc3[d].trades.buy2 != undefined){
							//console.log(bestAsk);
							var sl = {'direction': 'buy2', 'pair' : doc3[d].trades.k, 'stoplimit': doc3[d].trades.buy2, 'currentAsk': bestAsk[doc3[d].trades.k], 'percent': (parseFloat(bestAsk[doc3[d].trades.k]) / parseFloat(doc3[d].trades.buy2))}
							
						stoplimits.push(sl);
							
							}
						} 
						if (doc3[d].trades.sold1 == false){
							var sl = {'direction': 'sell1', 'pair' : doc3[d].trades.k, 'stoplimit': doc3[d].trades.sell1, 'currentBid': bestBid[doc3[d].trades.k], 'percent': (parseFloat(doc3[d].trades.sell1 / parseFloat(bestBid[doc3[d].trades.k])))}
						stoplimits.push(sl);
							
						}
						if (doc3[d].trades.sold2 == false){
							if (doc3[d].trades.sell2 != undefined){

							var sl = {'direction': 'sell2', 'pair' : doc3[d].trades.k, 'stoplimit': doc3[d].trades.sell2, 'currentBid': bestBid[doc3[d].trades.k], 'percent': (parseFloat(doc3[d].trades.sell2) / parseFloat(bestBid[doc3[d].trades.k]))}
							
						stoplimits.push(sl);
							
							}
						} 
						}
						
	
					}
					
				});
	
}setTimeout(function(){
	stoplimits.sort(sortFunction);
						msg+='<div style="display:none;" id="stoplimits">' + JSON.stringify(stoplimits) + '</div>'
						msg+='<br>Stoplimits:<div id="showData"></div>'
						msg+='<br>Positions:<div id="showData3"></div>'
						msg+='<br>Orders:<div id="showData2"></div>'
						msg+= '<div style="display:none;" id="orders">' + JSON.stringify(orders) + '</div>'
						msg+='<div style="display:none;" id="positions">' + JSON.stringify(positions) + '</div>'
						msg+='<script>for(var col=[],i=0;i<JSON.parse($("#stoplimits").text()).length;i++)for(var key in JSON.parse($("#stoplimits").text())[i])-1===col.indexOf(key)&&col.push(key);var table2=document.createElement("table");for(tr=table2.insertRow(-1),i=0;i<col.length;i++){var th=document.createElement("th");th.innerHTML=col[i],tr.appendChild(th)}for(i=0;i<JSON.parse($("#stoplimits").text()).length;i++){tr=table2.insertRow(-1);for(var j=0;j<col.length;j++){var tabCell=tr.insertCell(-1);tabCell.innerHTML=JSON.parse($("#stoplimits").text())[i][col[j]]}}var divContainer2=document.getElementById("showData");divContainer2.innerHTML="",divContainer2.appendChild(table2);</script>'
						msg+='<script>for(var col=[],i=0;i<JSON.parse($("#orders").text()).length;i++)for(var key in JSON.parse($("#orders").text())[i])-1===col.indexOf(key)&&col.push(key);var table2=document.createElement("table");for(tr=table2.insertRow(-1),i=0;i<col.length;i++){var th=document.createElement("th");th.innerHTML=col[i],tr.appendChild(th)}for(i=0;i<JSON.parse($("#orders").text()).length;i++){tr=table2.insertRow(-1);for(var j=0;j<col.length;j++){var tabCell=tr.insertCell(-1);tabCell.innerHTML=JSON.parse($("#orders").text())[i][col[j]]}}var divContainer2=document.getElementById("showData2");divContainer2.innerHTML="",divContainer2.appendChild(table2);</script>'
						msg+='<script>for(var col=[],i=0;i<JSON.parse($("#positions").text()).length;i++)for(var key in JSON.parse($("#positions").text())[i])-1===col.indexOf(key)&&col.push(key);var table2=document.createElement("table");for(tr=table2.insertRow(-1),i=0;i<col.length;i++){var th=document.createElement("th");th.innerHTML=col[i],tr.appendChild(th)}for(i=0;i<JSON.parse($("#positions").text()).length;i++){tr=table2.insertRow(-1);for(var j=0;j<col.length;j++){var tabCell=tr.insertCell(-1);tabCell.innerHTML=JSON.parse($("#positions").text())[i][col[j]]}}var divContainer2=document.getElementById("showData3");divContainer2.innerHTML="",divContainer2.appendChild(table2);</script>'
						if (gosend == true){
			gosend = false;
			res.send(msg);
						}
					}, 2000);
	})
})
function sortFunction(a,b){  
	var dateA = (a.percent);
	var dateB = (b.percent);
	return dateA > dateB ? 1 : -1;  
}; 

            app.listen(process.env.PORT || 8080, function() {});
