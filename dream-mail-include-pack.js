var status_obj;
var nss = 0;
var interval;
var request_man = [];
var user;
var receiver;
var status = 0;
var blist = [];
var photo = '';
var hist = [];

$.get('//www.dream-marriage.com/members/options.php',function(s){
	var href = $(s).find('.account_options_links li:eq(1) a').attr('href');
	user = href.replace(/[^0-9]+/ig,"");
	$.get('//www.dream-marriage.com/'+user+'.html',function(d){
		receiver = $(d).find('.profile-button-email').parent().attr('onclick').replace(/[^0-9]+/ig,"");
		var name = $(d).find('.profile_name p:eq(0)').text().split(',')[0];
		localStorage.setItem("receiver", receiver);
		localStorage.setItem("user", user);
	});
});

if(window.location.href.indexOf('dream-marriage.com') > 1){
if($.trim($('.menubtn:eq(1)').text())!='Log-In'){
	$('body').prepend('<div id="count_send"></div>');
	if($.cookie('sinc')==null){
		var date = new Date();
		var minutes = 60;
		date.setTime(date.getTime() + (minutes * 60 * 1000));
		
		var ts = Math.round((new Date()).getTime() / 1000);
		var s = 0;
		
		$.getJSON('http://www.dream-marriage.com/chat/ajax.php?ts='+ts+'&pid='+$.cookie('user_id')+'&__tcAction=onlineListRequest',function(d){
			var ret = Math.round(d[0].data.length/15);
			
			//$('body').append('<div id="sincs" style="position: fixed;top: 0;right: 0;left: 0;bottom: 0;background: #fff;opacity: 0.9;font-size: 29px;text-align: center;padding-top: 209px;">Подождите...</div>');
			function sisi(s,request_man){	
			//for(i=0;i<ret;i++){
				i=s;
				$.get('http://www.dream-marriage.com/russian-women-gallery.php?all=men&online_dropdown=1&page='+i+'&ini='+i,function(data){
					
					if(data){
					$(data).find('.dmcontent>table:eq(0)>tbody>tr>td').each(function(){
						var name_men = $(this).find('tr:eq(0) td:eq(1) a').text();
						var age_men = $(this).find('tr:eq(1) td:eq(1)').text();
						var id_men = $(this).find('tr:eq(4) td:eq(1)').text();
						var id_receiver_str = $(this).find('tr:eq(5) td a:eq(1)').attr('href');
						var id_receiver = id_receiver_str.replace(/[^0-9]+/ig,"");
						var obj = {};
						obj.id_men = id_men;
						obj.name_men = name_men;
						obj.age_men = age_men;
						obj.id_receiver = id_receiver;
						request_man.push(obj);
					});
					}
					
					
				}).always(function() {
					s++;
					if(s==ret){
						var date = new Date();
						var minutes = 60;
						date.setTime(date.getTime() + (minutes * 60 * 1000));
						$.cookie('sinc', "true", { expires: date, path: '/' });
						localStorage.setItem("online", JSON.stringify(request_man));
						$('#sincs').remove();
					}else{
						sisi(s,request_man);
					}
				 });
				
			}
			sisi(0,request_man);
			
		});
	}
	if($.cookie('sincfv'+user)==null){
		var date = new Date();
		var minutes = 120;
		date.setTime(date.getTime() + (minutes * 60 * 1000));
		$.cookie('sincfv'+user, "true", { expires: date, path: '/' });
		var ts = Math.round((new Date()).getTime() / 1000);
		var s = 0;
		var ar_fav = [];
		$.get('http://www.dream-marriage.com/members/my_favorites.php?all=1',function(d){
			$(d).find('#favList .groups').each(function(i,v){
				var name = $(v).find('.la').html();
				var age = $(v).find('.lc').html();
				var id = $(v).find('.lc:eq(3)').html();
				var receiver = $(v).find('.details tr:last a:eq(1)').attr('href').replace(/[^0-9]+/ig,"");
				var obj = {};
				obj.id_men = id;
				obj.name_men = name;
				obj.age_men = age;
				obj.id_receiver = receiver;
				ar_fav.push(obj);
				localStorage.setItem("fav"+user, JSON.stringify(ar_fav));
			});
		});
	}
}
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.object){
	var obj = status_obj = request.object;
	if(obj.list){
		obj.list = JSON.parse(obj.list);
	}
	function gogogo(nss){
		
		console.log('statusstatus:',status);
		if(status==1){
		$('#count_send').text('Не покидайте страницу во время рассылки! Отослано: '+nss+' из '+obj.list.length+'');
		if(obj.list[nss]){
			console.log(obj.list[nss]);
			var msgs = JSON.parse(localStorage['msgs'+user]);
			
			if(msgs.length>0){
				var rands = Math.floor(Math.random() * ((msgs.length-1) - 0 + 1)) + 0;
						var msg_o = msgs[rands].msg;
						if(msg_o&&msg_o!=''){
							
						message = msg_o.split('{name}').join(obj.list[nss].name);
						message = message.split('{age}').join(obj.list[nss].age);
						message = message.split('{n}').join('\n');
						
						his = [];
						cou = 0;
						
						
						if(localStorage['history'+user]){
							his = JSON.parse(localStorage['history'+user]);
						}
						for(var x in his){
							if(obj.list[nss].id==his[x].man&&msgs[rands].id == his[x].msg){ cou = 1;}
						}
						if(localStorage['blist'+user]){
							var bl = localStorage['blist'+user].split(',');
						}
						for(var x in bl){
							if(obj.list[nss].id==bl[x]){ cou = 1;}
						}
						if(cou==0){
						if((obj.list[nss].age-0)>=(obj.age_from-0)&&(obj.list[nss].age-0)<=(obj.age_to-0)){
						console.log('message',message);
							if(photo!=''){
								photo = photo.replace(/\n/g,"");
								photo = photo.replace(/\r/g,"");
								var blob = window.dataURLtoBlob && window.dataURLtoBlob(photo); 
							}
							console.log(blob);
							
							var xhr = new XMLHttpRequest();
							var reader = new FileReader();
							xhr.open("POST", "//www.dream-marriage.com/messaging/write.php?receiver="+obj.list[nss].receiver);	 
							var rand = Math.floor((Math.random()*1000000000)+1); 
							var formData = new FormData();
							formData.append("blockGirl", '0');
							formData.append("draftid", rand);
							formData.append("receiver", obj.list[nss].receiver);
							formData.append("sender", receiver);
							formData.append("replyId", '');
							formData.append("which_message", 'advanced_message');
							formData.append("plain_message", '');
							formData.append("message", message);
							if(blob){
								formData.append("attachment", blob, 'kjlksajdasj');
							}
							formData.append("__tcAction[send]", 'Send');
							
							var redir = 'inbox';
							xhr.onreadystatechange = function() {
								if(xhr.readyState == 4){
								if(xhr.responseText){
									ss = xhr.responseText.replace(/<script[^>]*>|<\/script>/g,"");
									 console.log($(ss)[1].innerText);
									 if($(ss)[1].innerText!='Message Inbox'){ redir = 'write';}
									 hist = [];
									 if(localStorage['history'+user]){
									 	hist = JSON.parse(localStorage['history'+user]);
									 }
									 hist.push({"man":obj.list[nss].id,"msg":msgs[rands].id});
									localStorage.setItem('history'+user,JSON.stringify(hist));
									 nss +=1;
									gogogo(nss);
								  }
								}
							}
							console.log(formData);
							xhr.send(formData);
						}else{
							nss +=1;
							gogogo(nss);
						}
						}else{
							nss +=1;
							gogogo(nss);
						}
						}else{
							redir = 'write';
							var msss = '';
							if(msg_o!=null){
								msss = msg_o.id;
							}
							
							nss +=1;
							gogogo(nss);
						}
			}
		}else{
			status = 0;
			$('#count_send').html('Рассылка закончена!');
			console.log('stop');
		}
		}
	}
	}
	switch(request.command){
		case 'hem_his':
			localStorage.removeItem('history'+user);
			sendResponse({status: 'ok'});
		break;
		case 'start_send': 
			status = 1;
			gogogo(0);
		break;
		case 'end_send':
			status = 0;
			$('#count_send').html('Рассылка остановлена!');
			console.log('stop');
		break;
		case 'get_status':
			sendResponse({status: status,statusobj:status_obj});
		break;
		case 'get_online': 
			sendResponse({online:localStorage['online']});
		break;
		case 'get_fav':
			sendResponse({fav:localStorage['fav'+user]});
		break;
		case 'add_blist':
		var bl = [];
		if(localStorage['blist'+user]){
		 	var bl = localStorage['blist'+user].split(',');
		}
 			var man = request.object;
			if(bl.join().search(man) == -1){
				bl.push(man);
				localStorage.setItem('blist'+user,bl);
				sendResponse({d: true});
			}
		break; 
		case 'get_blist':
			var blist = '';
			if(localStorage['blist'+user]){
				blist = localStorage['blist'+user].split(',');
			}
			sendResponse({blist: blist});
		break; 
		case 'rem_blist':
			var man = request.object;
			blist = [];
			blists = localStorage['blist'+user].split(',');
			$.each(blists,function(i,v){
				if(man!=v){
					blist.push(v);
				}
			});
			localStorage.setItem('blist'+user,blist);
			sendResponse({d: true});
		break;  
		case 'add_msg':
			var msg = request.object;
			var ar_ms = new Array();
			if(localStorage["msgs"+user]) ar_ms = JSON.parse(localStorage["msgs"+user]);
			ar_ms.push({'id':Math.floor((Math.random()*1000000000)+1),'msg':msg});
			localStorage.setItem('msgs'+user,JSON.stringify(ar_ms));
			sendResponse({d: true});
		break;  
		case 'edit_msg':
			var msg = request.object.msg;
			var id = request.object.id;
			var ar_ms = JSON.parse(localStorage["msgs"+user]);
			ar_ms[id].msg = msg;
			localStorage.setItem('msgs'+user,JSON.stringify(ar_ms));
			sendResponse({d: true});
		break;  
		case 'get_msg':
			if(localStorage["msgs"+user]){
				sendResponse({msg: localStorage["msgs"+user]});
			}
		break;  
		case 'rem_msg':
			localStorage["msgs"+user] = JSON.stringify(request.object);
		break;
		case 'set_photo':
			photo = request.object;
		break;
		case 'get_photo':
			sendResponse({photo: photo,st:status});
		break;
		case 'get_login': 
			sendResponse({login:'yes'});
		break;
	};
});
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.type=='init'){
		sendResponse({name: $.trim($('body').attr('onload')).replace(/[^0-9]+/ig,"")});
	}
});
}else{
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		switch(request.command){
			case 'get_login': 
				sendResponse({login:'no'});
			break;
		}
	});
}