$(function() {
	
  var socket = io.connect();

  var room_members;
  var room;
  var me;
  socket.on('error', function (reason){
	console.log(reason);
    console.error('Unable to connect Socket.IO', reason);
  });

  socket.on('connect', function (){
	  console.info('successfully established a working connection');
  });
  socket.on('game_left', function (game_left){
	    
	    console.info(game_left);
		game_left = Number(game_left);
		console.info(game_left);
		var game_min = Math.floor(game_left/60000);
		var game_sec = Math.floor((game_left % 60000)/1000);
		if(!(game_min+'')[1]){
	  		$("#min_1").html(0);
	  		$("#min_2").html((game_min+'')[0]);
		}
  		else {
		    $("#min_1").html((game_min+'')[0]);
		    $("#min_2").html((game_min+'')[1]);
  		}
	    $("#sec_1").html((game_sec+'')[0]);
	    $("#sec_2").html((game_sec+'')[1]);
	    set_by_offset(game_min,game_sec);
  });
  socket.on('rotate_left', function (rotate_left){
	    console.info(rotate_left);
	    rotate_left = Number(rotate_left);
		console.info(rotate_left);
		var game_min = Math.floor(rotate_left/60000);
		var game_sec = Math.floor((rotate_left % 60000)/1000);
		if(!(game_min+'')[1]){
	  		$("#min_11").html(0);
	  		$("#min_12").html((game_min+'')[0]);
		}
		else {
		    $("#min_11").html((game_min+'')[0]);
		    $("#min_12").html((game_min+'')[1]);
		}
	    $("#sec_21").html((game_sec+'')[0]);
	    $("#sec_22").html((game_sec+'')[1]);
	    set_by_offset1(game_min,game_sec);
	    console.log(game_min);
	    console.log(game_sec);
  });
socket.on('switch_room', function (data){
	window.location = '/chat?rotate_time='+data;
});

socket.on('rank_room', function (data){
	var data = JSON.stringify(data);
	$.post( '/ranking', {data:data} ).done(function(data){
		window.location = '/rankings';
	});
});

socket.on('chat_auto',function(data){
	windows.location = '/chat';
});

  socket.on('start_chat', function (data){
	    if(!data){
	    	$("#dialog").dialog({
	    		closeOnEscape: false,
	    		open: function(event, ui) { 
	    			$(this).parent().children().children('.ui-dialog-titlebar-close').hide();
	    		},
	    		modal: true,
	    		close: function( event, ui ) {

	    		}
	    	});
	    	set_by_offset();
	    }
	    else{
	    	$( "#dialog" ).dialog( "close" );
	    }
  });
  
//------------------------------------------
//jemo added topic for each chat per room
socket.on('topic_per_room',function (data){
	var member = data.members;
	var topic = data.topic;
	member.forEach(function(user){
		var user = JSON.parse(user);
		if(user.codename != $("#codename").html()){
			$(" .messagewindow ").html("<p class='topic_per_room'><strong>TOPIC: "+topic+"</strong></p>");
		}
		else{
			me = user;
		}
	});
});

//------------------------------------------
  
  socket.on('members', function (data){
	//  alert(JSON.stringify(data));
	  data.forEach(function(user){
		  var user = JSON.parse(user);
		  //alert($("#codename").html());
		  if(user.codename !=  $("#codename").html()){
			  $(".current-photo").html("<img class='cpimg' src='"+user.photourl+"'></img>");
			  $("#chat-code").html(user.codename);
			  //socket.emit('cp-username',user.codename);
		  }
		  else{
			  me = user;
		  }
	  });
	  
  });
  socket.on('reload', function (data){
	  location.reload(data);
	  
  });
  
  socket.on('rank_start', function (data){
	  
	 // window.location = '/ranking'
  });
  
  socket.on('room_members', function (data){
	  room_members = data.members;
	  room = data.room;
	  var next_room = room + 1;
	  var prev_room = room -1;
	  if(next_room > room_members.length ){
		  next_room = 1;
	  }
	  if(prev_room <= 0 ){
		  prev_room = room_members.length;
	  }
	  room_members.forEach(function(room_visitor){
		  if(room_visitor.room == next_room){
			  var next_room_members = room_visitor.members;
			  next_room_members.forEach(function(user){
				  user = JSON.parse(user);
				  //if(me && (me.gender != user.gender)){
					  //$(".next-photo").html("<img class='npimg' src='"+user.photourl+"'></img>");
				  //}
			  });
			  
		  }
		  if(room_visitor.room == prev_room){
			  var prev_room_members = room_visitor.members;
			  prev_room_members.forEach(function(user){
				  user = JSON.parse(user);
				  if(me && (me.gender != user.gender)){
					  $(".previous-photo").html("<img class='ppimg' src='"+user.photourl+"'></img>");
				  }
			  });
			  
		  }
	  });
	  
  });
  
  

  socket.on('new msg', function(data) {
	  if(data.gender == "male"){
		  $(" .messagewindow ").append("<img class='leftp'></img><img class='imgleft' src='"+data.photourl+"'></img><p class='me-chat'><strong>"+ data.codename + ":</strong> <em>" + data.msg + "</em></p>");
	  }
	  else{
		  $(" .messagewindow ").append("<img class='rightp'></img><img class='imgright' src='"+data.photourl+"'></img><p class='you-chat'><strong>"+ data.codename + ":</strong> <em>" + data.msg + "</em></p>");
	  }
	  $(".messagewindow").prop({ scrollTop: $(".messagewindow").prop("scrollHeight") });
  });

  socket.on('user leave', function(data) {
  });
  $(".ratings_chick").click(function(){
	  var my_rate = $("#codename").html();
	  //alert("--check if user if the chatmate--");
	  //console.log(user);
	  //alert(my_rate);
	  //var sendResult = {};
	  socket.emit('send_rate',my_rate);
  });
  $("#reply").click(function(){

	  var inputText = $("#message").val().trim();
	    if(inputText) {
	      var chunks = inputText.match(/.{1,1024}/g)
	        , len = chunks.length;

	      for(var i = 0; i<len; i++) {
	        socket.emit('my msg', {
	          msg: chunks[i]
	        });
	      }

	      $("#message").val('');

	      return false;
	    }
	    
  });
  $("#message").keypress(function(e) {
    var inputText = $(this).val().trim();
    if(e.which == 13 && inputText) {
      var chunks = inputText.match(/.{1,1024}/g)
        , len = chunks.length;

      for(var i = 0; i<len; i++) {
        socket.emit('my msg', {
          msg: chunks[i]
        });
      }

      $(this).val('');

      return false;
    }
  });
  $("#logout").click(function(){
	  socket.emit('log_out',true);
		window.location = '/logout';
  });

});


// Set by specific date/time
function set_by_date() {
	$('#countdown_dashboard').stopCountDown();
	$('#countdown_dashboard').setCountDown({
		targetDate: {
			'day': 		15,
			'month': 	1,
			'year': 	2011,
			'hour': 	12,
			'min': 		0,
			'sec': 		0
		}
	});
	$('#countdown_dashboard').startCountDown();
}

// Set by date/time offset
function set_by_offset(min,sec) {
	/*** room countdown ***/
	$('#countdown_dashboard').stopCountDown();
	$('#countdown_dashboard').setCountDown({
		targetOffset: {
			'day': 		0,
			'month': 	0,
			'year': 	0,
			'hour': 	0,
			'min': 		Number(min),
			'sec': 		Number(sec)
		}
	});
	$('#countdown_dashboard').startCountDown();
}

//Set by date/time offset
function set_by_offset1(min,sec) {
	/*** room countdown ***/
	$('#left-time').stopCountDown();
	$('#left-time').setCountDown({
		targetOffset: {
			'day': 		0,
			'month': 	0,
			'year': 	0,
			'hour': 	0,
			'min': 		Number(min),
			'sec': 		Number(sec)
		}
	});
	$('#left-time').startCountDown();
}
