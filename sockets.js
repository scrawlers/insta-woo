var parent = module.parent.exports
  , server = parent.server
  , client = parent.client
  , pub = parent.pub
  , sub = parent.sub
  , model = require("./client")
  , sessionStore = parent.sessionStore
  , sio = require('socket.io')
  , redis = require("redis")
  , cookieParser = require("connect").utils.parseSignedCookies
  , timer = require("./timer")
  , async = require('async')
  , cookie = require("cookie");
  
var io = sio.listen(server);
io.set('log level', 1);
io.set('authorization', function (hsData, accept) {
  if(hsData.headers.cookie) {
    var cookies = cookieParser(cookie.parse(hsData.headers.cookie), "instawoo")
      , sid = cookies['instawoo'];

    sessionStore.load(sid, function(err, session) {
      if(err || !session) {
        return accept('Error retrieving session!', false);
      }

      hsData.instawoo = {
        user: session.passport.user
      };

      return accept(null, true);
      
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

io.configure(function() {
  io.set('store', new sio.RedisStore({redis: redis, redisPub: pub,redisSub: sub,redisClient: client}));
  io.enable('browser client minification');
  io.enable('browser client gzip');
});

var timer_start = false;
var rotate_ctr = 0;
var chat_lock = false;
var config_game_time = 15000;
var config_rotate_time = 15000;
var start_time = Number(new Date()) + config_game_time;
io.sockets.on('connection', function (socket) {
  
  var hs = socket.handshake.instawoo.user;
  if(hs){
	  var user = {
			  		username: hs.username,
			  		provider: hs.provider, 
			  		codename: hs.codename, 
			  		gender: hs.gender, 
			  		photourl: hs.photourl
	  };
  }
  if(!chat_lock){
	  model.accomodateVisitor(client,user,function(err,result){
		  var room = result.RecordToRedis;
		  var members = result.getRoomMembers;
		  var topic = "MOVIES";
		  socket.join(room);
		  var game_left = Number(start_time) - Number(new Date());
		  if(!timer_start){
			  io.sockets.in(room).emit('game_left',game_left );
			  console.log("game_left: "+game_left);
		  }
		  io.sockets.in(room).emit('members', members);  
		  socket.on('log_out', function(data) {
	          
	          client.srem('hc:room:'+room+':visitor',JSON.stringify(user));
	      });
		  io.sockets.in(room).emit('topic_per_room', {members:members,topic:topic});
		  
		  //--------------newly added code----------------------
		  socket.on('send_rate',function(data){
			  model.roomMembers(client,function(err,roomVisitors){
		    	roomVisitors.forEach(function(room_visitor){
		    		var members = room_visitor.members;
		    		members.forEach(function(visitor){
		    			visitor = JSON.parse(visitor);
		    			console.log("---visitor---");
		    			console.log(visitor);
		    			if(user.gender != visitor.gender){
		    				console.log("visitor.gender and codename");
		    				console.log(visitor.gender);
		    				console.log(visitor.codename);
		    				//client.smembers('hc:like:'+visitor.codename,likes);
		    					
		    				//	if(err){
		    				//		roomVisitors(err);
		    				//	}
		    				//	console.log("--likes.length--");
			    			//	console.log(JSON.parse(likes));
			    			//	if(likes.length == 0){
			    					var like = new Array();
			    					like.push(user.codename);
			    					console.log("--LIKE--");
			    					console.log(like);
			    					client.sadd('hc:like:'+visitor.codename,JSON.stringify(like));
			    			//	}
		    				//});
		    			}
		    		}); 
		    	});
		    });
		  });
		  socket.on('my msg', function(data) {
	        var no_empty = data.msg.replace("\n","");
	        if(no_empty.length > 0) {
	          io.sockets.in(room).emit('new msg', {
	            username: user.username,
	            gender: user.gender,
	            codename: user.codename,
	            provider: user.provider,
	            photourl: user.photourl,
	            msg: data.msg,
	            
	          });        
	        }   
	      });
		  model.roomMembers(client,function(err,roomVisitors){
	    	  roomVisitors.forEach(function(roomVisitor){
	    		  io.sockets.in(roomVisitor.room).emit('room_members', {room: roomVisitor.room, members : roomVisitors});  
	    	  }); 
	    	  
	      });
		  
	  });
  }
});

timer.Timer(function(){
	timer_start = true;
	model.roomList(client,function(err,rooms){
		var rotate_time = Number(new Date()) + config_rotate_time;
		var rotate_left = Number(rotate_time) - Number(new Date());
		console.log("rotate_left: "+rotate_left);
		console.log("rooms:"+rooms);
		if(rooms && rooms.length){
			rooms.forEach(function(room){
				console.log("room:"+room);
				io.sockets.in(room).emit('rotate_left',rotate_left );
			});
		}
	})
	timer.Timer(function(){
		model.switchVisitorRoom(client,function(err,result){
			if(result){
				var rooms = result.switchPartner;
				
				if(rotate_ctr >= (rooms.length - 1)){
					for(var i=0; i < rooms.length; i++){
						io.sockets.in(rooms[i].no).emit('chat_auto', rooms); 
//						client.del('hc:rooms');
//						client.del('hc:room:'+rooms[i].no+':visitor');
						start_time = Number(new Date()) + config_game_time;
//						timer_start = false;
					}
				}
				else{
					for(var j=0; j < rooms.length; j++){
						console.log(rooms.length);
						io.sockets.in(rooms[j].no).emit('switch_room',config_rotate_time );
						console.log("--switch room--")
						console.log(rooms[j].no);
//						io.sockets.in(rooms[j].no).emit('topic_per_room',config_rotate_time );
						
					}
					rotate_ctr++;
				}
				chat_lock = false;
//				timer_start = false; //newly added dor check
//				start_time = Number(new Date()) + config_game_time;
//				rotate_time = Number(new Date()) + config_rotate_time;
//				rotate_left = Number(rotate_time) - Number(new Date());
			}
		});
		
		
	},config_rotate_time);
	rotate_ctr = 0;
},config_game_time);