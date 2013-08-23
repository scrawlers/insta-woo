var async = require('async');

module.exports = {
    
    roomList : function(client,fn){
        client.smembers('hc:rooms',function(err, rooms){
            
            if(err){
                fn(err);
            }
            else{
                fn(null,rooms);
            }
        });  
    },
    roomVisitors : function(client,room,fn){
    	client.smembers('hc:room:'+room+':visitor',function(err, visitors){
            if(err){
                fn(err);
            }
            else{
                fn(null,visitors);
            }
        }); 
    },
    roomMembers : function(client,fn){
    	client.smembers('hc:rooms',function(err, rooms){
            if(err){
                fn(err);
            }
            else{
            	var room_map = 1;
            	var ar = new Array();
            	rooms.forEach(function(room){
            		client.smembers('hc:room:'+room+':visitor',function(err, visitors){
                        if(err){
                            fn(err);
                        }
                        else{
                        	ar.push({room:room_map,members:visitors});
                        }
                        if(room_map >= rooms.length){
                        	fn(null,ar);
                        }
                        room_map++;
                    });
            	});
            	
            }
        });  
    	
    },
    accomodateVisitor : function(client,user,fn){
    	
    	async.auto({
    		GetRooms : function(cb){
    			client.sort('hc:rooms',cb);
    		},
    		GetVisitors : ['GetRooms', function(cb,result){
    			var rooms = result.GetRooms;
    			var room_visitors = new Array();
    			if(rooms && rooms.length){
    				var room_ctr = 1;
    				rooms.forEach(function(room){
    					client.smembers('hc:room:'+room+':visitor',function(err,visitors){
    						if(visitors && visitors.length){
    							room_visitors.push({room:room_ctr,members:visitors});
    						}
    						room_ctr++;
    						if(room_ctr > rooms.length){
    							cb(null,room_visitors);
    						}
    					});
    				});
    			}
    			else{
    				cb(null,room_visitors);
    			}
    		}],
    		CheckMe : ['GetVisitors', function(cb,result){
    			var room_visitors = result.GetVisitors;
    			var flag = false;
    			room_visitors.forEach(function(room_visitor){
    				var members = room_visitor.members;
    				members.forEach(function(visitor){
    					visitor = JSON.parse(visitor);
    					if(visitor.username == user.username){
    						flag = true;
    						cb(null,room_visitor);
    					}
    				});
    			});
    			if(!flag){
    				cb(null,-1);
    			}
    			
    			
    		}],
    		AddMe : ['CheckMe', function(cb,result){
    			var me = result.CheckMe;
    			if(me == -1){
    				var room_visitors = result.GetVisitors;
    				var room_ctr =0, flag =false;;
        			room_visitors.forEach(function(room_visitor){
        				var members = room_visitor.members;
        				members.forEach(function(visitor){
        					visitor = JSON.parse(visitor);
        					if(visitor.gender != user.gender && members.length == 1){
        						room_visitor.members.push(JSON.stringify(user));
        						flag = true;
        						cb(null,room_visitor);
        					}
        				});
        				if(members.length == 0){
        					room_visitor.members.push(JSON.stringify(user));
        					flag = true;
        					cb(null,room_visitor);
        				}
        				room_ctr++;
        			});
        			if((room_ctr >= room_visitors.length) && !flag){
        				var room_visitor = {room:0,members: new Array()};
        				room_visitor.members.push(JSON.stringify(user));
        				cb(null,room_visitor);
        			}
        			
    			}
    			else{
    				cb(null,me);
    			}
    			
    		}],
    		RecordToRedis : ['AddMe', function(cb,result){
    			var isExist = result.CheckMe;
    			if(isExist == -1){
    				var room_visitor = result.AddMe;
    				var room = room_visitor.room;
    				var room_visitors = result.GetVisitors;
    				var members = room_visitor.members;
    				if(members.length == 1){
    					if(room == 0){
    						room = Number(room_visitors.length) + 1;
    						client.sadd('hc:rooms',room,function(err,result){
    							if(result){
    								client.sadd('hc:room:'+room+':visitor',JSON.stringify(user),function(err,result){
        								cb(err,room);
        							});
    							}
    							else{
    								cb(err);
    							}
    						});
    					}
    					else{
    						client.sadd('hc:room:'+room+':visitor',JSON.stringify(user),function(err,result){
								cb(err,room);
							});
    					}
    					
    				}
    				else{
    					client.sadd('hc:room:'+room+':visitor',JSON.stringify(user),function(err,result){
							cb(err,room);
						});
    				}
    			}
    			else{
    				cb(null,isExist.room);
    			}
    		}],
    		getRoomMembers : ['RecordToRedis',function(cb,result){
    			var room = result.RecordToRedis;
    			client.smembers('hc:room:'+room+':visitor',cb);
    		}]
    		
    	},function(err,result){
    		if(err) console.log(err);
    		else {

    		}
    		fn(err,result);
    	});
    	
    },
    switchVisitorRoom : function(client,fn){
    	async.auto({
    		GetRooms : function(cb){
    			client.sort('hc:rooms',cb);
    		},
    		GetVisitors : ['GetRooms', function(cb,result){
    			var rooms = result.GetRooms;
    			var room_visitors = new Array();
    			if(rooms && rooms.length){
    				var room_ctr = 1;
    				rooms.forEach(function(room){
    					client.smembers('hc:room:'+room+':visitor',function(err,visitors){
    						if(visitors && visitors.length){
    							room_visitors.push({room:room_ctr,members:visitors});
    						}
    						room_ctr++;
    						if(room_ctr > rooms.length){
    							cb(null,room_visitors);
    						}
    					});
    				});
    			}
    			else{
    				cb(null,room_visitors);
    			}
    		}],
    		separateGenders : ['GetVisitors',function(cb,result){
    			var rooms = result.GetVisitors;
    			var males = new Array();
    			var females = new Array();
    			if(rooms && rooms.length){
    				rooms.forEach(function(room){
    					var members = room.members;
    					if(members && members.length){
    						members.forEach(function(member){
    							member = JSON.parse(member);
    							if(member.gender == 'male'){
    								males.push(member);
    							}
    							if(member.gender == 'female'){
    								females.push(member);
    							}
    						});
    					}
    				});
    			}
    			cb(null,{males:males,females:females})
    		}],
    		switchPartner : ['separateGenders',function(cb,result){
    			var males = result.separateGenders.males;
    			var females = result.separateGenders.females;
    			var counter = (males.length < females.length) ? males.length : females.length;
    			var rooms = new Array();
    			for(var i=0; i< counter; i++){
    				var room = {};
    				room.no = i + 1;
    				room.members = new Array();
    				room.members.push(males[i]);
    				room.members.push(females[counter - i - 1]);
    				rooms.push(room);
    			}
    			cb(null,rooms)
    		}],
    		cleanRoom : ['switchPartner',function(cb,result){
    			client.keys('hc:*', function(err, keys) {
    				if(keys){
    					var key_ctr = 0;
    					keys.forEach(function(key){client.del(key,function(err,result){
    						key_ctr++;
    						if(key_ctr >= keys.length){
    							cb(null,true);
    						}
    					})});
    				}
    				else{
    					cb(null,true);
    				}
    			});
    		}],
    		saveToRedis : ['cleanRoom',function(cb,result){
    			var rooms = result.switchPartner;
    			if(rooms && rooms.length){
    				var room_ctr = 0;
    				rooms.forEach(function(room){
    					client.sadd('hc:rooms',room.no);
    					client.sadd('hc:room:'+room.no+':visitor',JSON.stringify(room.members[0]));
    					client.sadd('hc:room:'+room.no+':visitor',JSON.stringify(room.members[1]));
    					room_ctr++;
    					if(room_ctr >= rooms.length){
    						cb(null,true);
    					}
    				});
    			}
    			else{
    				cb(null,true);
    			}
    			
    		}]
    	},function(err,result){
    		if(err){
    			fn(err);
    		}
    		else{
    			fn(null,result);
    		}
    	});
    },
    addVisitor : function(client,room,visitor){
        var isUserExist = false;
        room.visitor.forEach(function(user){
            if(user.username == visitor.username){
                isUserExist = true;
            }
        });
        if(!isUserExist){
            client.srem('hc:rooms',JSON.stringify(room));
            room.visitor.push(visitor);    
        }
        client.sadd('hc:rooms',JSON.stringify(room));
    },
    cleanRooms : function(client,fn){
    	client.keys('hc:*', function(err, keys) {
			if(keys){
				var key_ctr = 0;
				keys.forEach(function(key){client.del(key,function(err,result){
					key_ctr++;
					if(key_ctr >= keys.length){
						fn(null,true);
					}
				})});
			}
			else{
				fn(null,true);
			}
		});
    }
}