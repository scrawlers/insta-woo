var model = require("../client");

/*
 * GET home page.
 */
exports.ranking = function(req, res){
	  res.render('ranking',{user:req.user});
};
exports.index = function(req, res){
  res.render('login');
};
exports.option = function(req, res){
  res.render('option');
};
exports.chat = function(req,res){
	
   req.user.gender = req.query['gender-m'] || req.query['gender-f'] || req.user.gender;
   
   if(!req.query.rotate_time){
	   req.query.rotate_time = {min1:0,min2:0,sec1:0,sec2:0};
   }
   else{
	   rotate_left = Number(req.query.rotate_time);
		var game_min = Math.floor(rotate_left/60000);
		var game_sec = Math.floor((rotate_left % 60000)/1000);
		var game_info = {};
		
		if(!(game_min+'')[1]){
			game_info.min1 = 0;
			game_info.min2 = (game_min+'')[0];
		}
		else {
			game_info.min1 = (game_min+'')[0];
			game_info.min2 = (game_min+'')[1];
		}
		game_info.sec1 = (game_sec+'')[0];
		game_info.sec2 = (game_sec+'')[1]||0;
		req.query.rotate_time = game_info;
   }
   
   if((req.query['gender-m'] || req.query['gender-f']) && req.query.username){
	   req.user.codename = req.query.username || req.user.codename;
	   res.render('chat',{user:req.user,rotate_time:req.query.rotate_time});
   }
   else{
	   req.user.codename = req.query.username || req.user.codename;
	   res.render('chat',{user:req.user,rotate_time:req.query.rotate_time});
   }
   
};