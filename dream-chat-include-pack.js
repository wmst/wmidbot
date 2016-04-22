var status_obj;
var nss = 0;
var interval;
var request_man = [];
var user;
var receiver;
var status = 0;
var blist = [];
var Chat = {};

$.get('//www.dream-marriage.com/members/options.php',function(s){
	var href = $(s).find('.account_options_links li:eq(1) a').attr('href');
	user = href.replace(/[^0-9]+/ig,"");
	$.get('//www.dream-marriage.com/'+user+'.html',function(d){
		receiver = $(d).find('.profile-button-email').parent().attr('onclick').replace(/[^0-9]+/ig,"");
		var name = $(d).find('.profile_name p:eq(0)').text().split(',')[0];
		localStorage.setItem("receiver", receiver);
		localStorage.setItem("user", user);
	});
	if(window.location.href.indexOf('dream-marriage.com/chat') > 1){
	$('head script').each(function(i,v){
		if($(v).text().indexOf('Chat.PAGEHASH')>1){
			var te = $(v).text().split('\n');
			eval($.trim(te[4].split(' ').join('')));
			eval($.trim(te[5].split(' ').join('')));
		}
	});
	}
});

if(window.location.href.indexOf('dream-marriage.com/chat') > 1){
	if($.cookie('sinc')==null){
		var date = new Date();
		var minutes = 60;
		date.setTime(date.getTime() + (minutes * 60 * 1000));
		$.cookie('sinc', "true", { expires: date, path: '/' });
		var ts = Math.round((new Date()).getTime() / 1000);
		var s = 0;
		
		$.getJSON('http://www.dream-marriage.com/chat/ajax.php?ts='+ts+'&pid='+$.cookie('user_id')+'&__tcAction=onlineListRequest',function(d){
			var ret = d[0].data.length;
			for(i=0;i<ret;i++){
				var obj = {};
				obj.id_men = d[0].data[i].id;
				obj.name_men = d[0].data[i].displayname;
				obj.age_men = d[0].data[i].age;
				//obj.id_receiver = id_receiver;
				request_man.push(obj);
				s++;
				if(s==ret){
					var date = new Date();
					var minutes = 60;
					date.setTime(date.getTime() + (minutes * 60 * 1000));
					$.cookie('sinc', "true", { expires: date, path: '/' });
					localStorage.setItem("online", JSON.stringify(request_man));
					console.log(localStorage['online']);
				}
				/*$.get('http://www.dream-marriage.com/russian-women-gallery.php?all=men&online_dropdown=1&page='+i+'&ini='+i,function(data){
					
					
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
					s++;
					if(s==ret){
						var date = new Date();
						var minutes = 60;
						date.setTime(date.getTime() + (minutes * 60 * 1000));
						$.cookie('sinc', "true", { expires: date, path: '/' });
						localStorage.setItem("online", JSON.stringify(request_man));
						console.log(localStorage['online']);
					}
				});*/
				
			}
			
		});
	}
}
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	switch(request.command){
		case 'get_man':
			window.location.href = '#/'+request.object;
		break;
		case 'get_contact':
			$('body').append('<a href="#" onclick="$(\'.get_contacts\').html(JSON.stringify(chat.chatcontacts.contacts));" class="get_contacts" style="display:none;"></a>');
			$('.get_contacts').click();
			sendResponse({contact: $('.get_contacts').html()});
		break;
		case 'get_user': 
			
			
		break;
		case 'start_send': 
			var obj = status_obj = request.object[0];
			if(obj.speed==0){
				var speed = 3000;
			}else if(obj.speed==1){
				var speed = 1000;
			}else if(obj.speed==2){
				var speed = 500;
			}
			interval = setInterval(function(){
				
				if(obj.list[nss]){
					if(obj.list[nss].age>=(obj.age_from-0)&&obj.list[nss].age<=(obj.age_to-0)){
						if(obj.list[nss].id!=6048){
							if(obj.fone==0){
								var el = document.createElement('script');
								el.innerHTML = "chat.clickUser("+obj.list[nss].id+",6);";
								document.head.appendChild(el);
								$('head script:last').remove();	
								if($('.messagebox #name').text()==obj.list[nss].name){
									var message = obj.message.split('{name}').join(obj.list[nss].name).split('{age}').join(obj.list[nss].age);
									$('#message').val(message);	
									var el = document.createElement('script');
									el.innerHTML = "setTimeout(function(){ $('#button-send input').click();},100);";
									document.head.appendChild(el);
									$('head script:last').remove();
								}
							}else{
								var message = obj.message.split('{name}').join(obj.list[nss].name).split('{age}').join(obj.list[nss].age);
								
								$.post('http://www.dream-marriage.com/chat/ajax.php?ts='+new Date().getTime()+'&pid='+user,{
											__tcAction:'sendMessage',
											chatid:'',
											message:message,
											targetid:obj.list[nss].id,
											pagehash:Chat.PAGEHASH,
											idslug:Chat.IDSLUG,
											auto_invite:'off'
								},function(){
									console.log(message);
								});
							}
						}
					}
					$('#count_send').text('Отослано: '+nss+' из '+obj.list.length+'');
					nss +=1;
					status = 1;
				}else{
					clearInterval(interval);
					status = 0;
					nss = 0;
					console.log('stop');
				}
			},speed);
		break;
		case 'end_send': 
			clearInterval(interval);
			status = 0;
			console.log('stop');
		break;
		case 'get_status':
			sendResponse({status: status,statusobj:status_obj});
		break;
		case 'get_online': 
			sendResponse({online:localStorage['online']});
		break;
		case 'add_blist_chat':
			var man = request.object;
			if(blist.join().search(man) == -1){
				blist.push(man);
				localStorage.setItem('blist'+user,blist);
				sendResponse({d: true});
			}
		break; 
		case 'get_blist_chat':
			if(localStorage['blist'+user]){
				blist = localStorage['blist'+user].split(',');
			}
			sendResponse({blist: blist});
		break; 
		case 'rem_blist_chat':
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
	};
});
$('body').prepend('<div id="count_send" style="top: 76px; font-size: 15px;"></div>');
function translb(sel){
	$(sel).after('<a href="javascript:void(0)" id="wmid_trans" style="width:112px; height: 30px; background: #26ade4; text-indent: 0; line-height: 30px; margin-right: 10px; margin-top: 1px; font-weight: bold; color: #fff; float:right;text-decoration: none;font-size: 12px;text-align: center;">WMID Translate</a><style>div.chatbody #buttons {width:250px;}</style>');
	$('#wmid_trans').click(function(){
		console.log($('#message').val());
		//$.getJSON('https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20140925T082047Z.5055d7e52197b592.bda3ad29dbb6a6aa6d19098d6e9748aca550221e&text='+encodeURIComponent(unescape($('#message').val()))+'&lang=en',function(s){
			$.getJSON('https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20150126T184957Z.5fb6344ed3c2ac7e.91869e08ede68d44e7604f7b6f5eaba93238c8dc&text='+encodeURIComponent(unescape($('#message').val()))+'&lang=en',function(s){
			console.log(s.text);
			if(s.code==200){$('#message').val(unescape(encodeURIComponent(s.text[0])));}
		});
	});
}
translb('#button-send');

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.type=='init'){
		var uid = document.cookie.match(new RegExp("(?:^|; )" + 'uid'.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
		sendResponse({name: uid?decodeURIComponent(uid[1]):'undefined'});
	}
});