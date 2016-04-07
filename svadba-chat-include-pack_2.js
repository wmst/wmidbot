
var SWMID = {
	obj_sort_list: {
		online:null,
		online_actual:null,
		contacts:null,
		pisal:null,
		platil:null
	},
	arr_online:[],
	arr_online_actual:[],
	arr_contacts:[],
	arr_pisal:[],
	arr_platil:[],
	arr_bleck:[],
	arr_history_smile:[],
	arr_active_chats:[],
	var_limit_stime:40,
	var_status_obj:null,
	var_interval:null,
	var_status:'stop',
	var_index_send:0,
	var_time_auto:null,
	var_timeout:null,
	var_age_from:0,
	var_age_to:0,
	var_is_vip:false,
	var_is_photo:false,
	var_and_or_vp:0,
	var_type_send:0,
	var_country:0,
	var_transkey: 'trnsl.1.1.20140925T082047Z.5055d7e52197b592.bda3ad29dbb6a6aa6d19098d6e9748aca550221e',
	init: function(){
		SWMID.build_interface();
		SWMID.events();
		SWMID.ajax_complete();
		
	},
	build_interface: function(){
		$('head').append('<style>#chat_act .message {height:11px!important;} #online-opponents { top:72px!important;} #snd_a_man { height:14px; position: absolute; left: 8px; top: 144px; z-index: 999; border: solid 1px #ccc; padding: 8px; background: #fff; width: 244px; overflow: hidden; bottom:auto; height:14px;} #snd_a_man a {font-family: tahoma; color: #5685d5;} #snd_a_man a:hove{ text-decoration: none;} #sending_list, #sending_list li { padding:0; margin:0; list-style: none;} #sending_list { border: solid 1px #ccc; overflow: auto; height:90%; } #sending_list li { padding: 2px 5px; border-bottom: solid 1px #ccc; color:#5685d5;cursor: pointer;} #sending_list li:hover,#sending_list li.act { background:#5685d5;color:#fff;}</style>');
		$('#translate').after('<a href="javascript:void(0)" id="wmid_trans" style="width:112px; height: 27px; background: #26ade4; text-indent: 0; line-height: 28px; margin-right: 20px; font-weight: bold; color: #fff; border-radius: 10px; float:left;text-decoration: none;font-size: 14px;text-align: center;">WMID Translate</a>');
		$('body').prepend('<div id="chat_act"><b>Активные чаты</b><ul><div align="center" style="padding:10px;">Нет чатов</div></ul></div><div id="count_send"></div><div id="snd_a_man"><a href="javascript:void(0)">Отчет приглашений</a><ul id="sending_list"></ul></div>');
	},
	events: function(){
		
		$('#wmid_trans').click(function(){
			$.getJSON('https://translate.yandex.net/api/v1.5/tr.json/translate?key='+SWMID.var_transkey+'&text='+$('#message').val()+'&lang=en',function(s){
				if(s.code==200) $('#message').val(s.text[0]);
			});
		});
		$('#snd_a_man a').click(function(){
			if($('#snd_a_man').css('bottom')!='0px'){
				$('#snd_a_man').css({'bottom':0,'height':'auto'});
			}else{
				$('#snd_a_man').css({'bottom':'auto','height':14});
			}
		});
	},
	sort_list: function(tsort,list){		
		var new_lst = [];
		var list_n = [];
		
		console.log('list',list);
		$.each(list,function(i,v){
			if(v!=null){
				var location = v['location'];
				if(location&&location.indexOf(",")!=-1){
					location = location.split(',');
					location = location[location.length-1]
				}
				location = $.trim(location);
				$.each(tsort,function(n,val){
					if(list_n[i]!=0){
						switch(val){
							case 'age':
								if(v.age&&v.age>=SWMID.var_age_from&&v.age<=SWMID.var_age_to){list_n[i]=1;}else{ list_n[i]=0;}
							break;
							case 'vip_photo':
								if(
									((SWMID.var_is_vip==true&&v['is-vip']==true)&&(SWMID.var_is_photo==true&&(v['photo-uri']!=''||v['photo-uri']!=null))&&SWMID.var_and_or_vp==1)||
									(((SWMID.var_is_vip==true&&v['is-vip']==true)&&SWMID.var_and_or_vp==0)||((SWMID.var_is_photo==true&&(v['photo-uri']!=''&&v['photo-uri']!=null))&&SWMID.var_and_or_vp==0))||
									((SWMID.var_is_vip==true&&v['is-vip']==true)&&(SWMID.var_is_photo==false))||
									((SWMID.var_is_vip==false)&&(SWMID.var_is_photo==true&&(v['photo-uri']!=''&&v['photo-uri']!=null)))||
									((SWMID.var_is_vip==false)&&(SWMID.var_is_photo==false))
								){list_n[i]=1;}else{ list_n[i]=0;}
							break;
							case 'bleck':
								if((SWMID.arr_bleck!=null&&SWMID.arr_bleck.join().search($.trim(v['public-id'])) == -1)){list_n[i]=1;}else{ list_n[i]=0;}
							break;
							case 'pisal':
								if((SWMID.arr_pisal!=null&&SWMID.arr_pisal.join().search($.trim(v['public-id'])) != -1)){ list_n[i]=0; }else{ list_n[i]=1; }
							break;
							case 'contacts':
								if((SWMID.arr_contacts!=null&&SWMID.arr_contacts.join().search($.trim(v['public-id'])) == -1)||SWMID.arr_contacts==null||SWMID.arr_contacts.length==0){list_n[i]=1;}else{ list_n[i]=0;}
							break;
							case 'country':
								if(SWMID.var_country==0||SWMID.var_country==location){list_n[i]=1;}else{list_n[i]=0;}
							break;
							default:
								list_n[i]=1;
							break;
						}
					}
				});
			}
			if(list_n[i]!=0){new_lst.push(list[i]); }
		});
		return new_lst;
	},
	send:function(request){
		if(request&&SWMID.var_status_obj!=null&&(request.object[0].list!=SWMID.var_status_obj.list)){SWMID.var_index_send=0;}
		var obj = SWMID.var_status_obj = (request)?request.object[0]:SWMID.var_status_obj;
		if(SWMID.var_country!=obj.country||
		   SWMID.var_age_from!=obj.age_from||
		   SWMID.var_age_to!=obj.age_to||
		   SWMID.var_is_vip!=obj.vip||
		   SWMID.var_is_photo!=obj.fake||
		   SWMID.var_and_or_vp!=obj.and_or_vp
		   ){
			SWMID.obj_sort_list.online = 
			SWMID.obj_sort_list.platil = 
			SWMID.obj_sort_list.contacts =
			SWMID.obj_sort_list.pisal = null;
		}
		var limit_send=0;
		var send_member = '';
		SWMID.var_age_from=obj.age_from;
		SWMID.var_age_to=obj.age_to;
		SWMID.var_is_vip=obj.vip;
		SWMID.var_is_photo=obj.fake;
		SWMID.var_and_or_vp=obj.and_or_vp;
		SWMID.var_type_send=obj.list;
		SWMID.var_country=obj.country;
		if(obj.speed==0){
			SWMID.var_limit_stime=10;
		}else if(obj.speed==1){
			SWMID.var_limit_stime=40;
		}else if(obj.speed==2){
			SWMID.var_limit_stime=80;
		}
		switch(obj.list){
			case 0: 
				SWMID.obj_sort_list.online = (SWMID.obj_sort_list.online==null)?SWMID.sort_list(['age','vip_photo','bleck','pisal','contacts','country'],SWMID.arr_online):SWMID.obj_sort_list.online;
				send_member = SWMID.obj_sort_list.online[SWMID.var_index_send];
				limit_send = SWMID.obj_sort_list.online.length;
			break;
			case 1: 
				SWMID.obj_sort_list.contacts = (SWMID.obj_sort_list.contacts==null)?SWMID.sort_list(['age','bleck','pisal'],SWMID.arr_contacts):SWMID.obj_sort_list.contacts;
				send_member = SWMID.obj_sort_list.contacts[SWMID.var_index_send];
				limit_send = SWMID.obj_sort_list.contacts.length;
			break;
			case 2: 
				var new_pisal = [];
				$.each(SWMID.arr_online,function(i,v){
					if(SWMID.arr_pisal.indexOf(v['public-id']+"")!=-1){
						new_pisal.push(v);
					}
				});
				if(new_pisal.length>0){
					SWMID.obj_sort_list.pisal = (SWMID.obj_sort_list.pisal==null)?SWMID.sort_list(['age','vip_photo','bleck','contacts'],new_pisal):SWMID.obj_sort_list.pisal;
					send_member = SWMID.obj_sort_list.pisal[SWMID.var_index_send];
					limit_send = SWMID.obj_sort_list.pisal.length;
				}
			break;
			case 3: 
				SWMID.obj_sort_list.platil = (SWMID.obj_sort_list.platil==null)?SWMID.sort_list(['age','vip_photo','bleck','pisal','contacts','country'],SWMID.arr_platil):SWMID.obj_sort_list.platil;
				send_member = SWMID.obj_sort_list.platil[SWMID.var_index_send];
				limit_send = SWMID.obj_sort_list.platil.length;
			break;
			case 4: 
				SWMID.obj_sort_list.online_actual = (SWMID.obj_sort_list.online_actual==null)?SWMID.sort_list(['age','vip_photo','bleck','pisal','contacts','country'],SWMID.arr_online_actual):SWMID.obj_sort_list.online_actual;
				send_member = SWMID.obj_sort_list.online_actual[SWMID.var_index_send];
				limit_send = SWMID.obj_sort_list.online_actual.length;
			break;
		}
		if(limit_send>-1){
			console.log(send_member);
			if(SWMID.var_age_from<=SWMID.var_age_to){
				send_member.name = send_member.name.charAt(0).toUpperCase() + send_member.name.substr(1).toLowerCase();
				var message = obj.message.split('{name}').join(send_member.name).split('{age}').join(send_member.age);
				/*POST*/
				var chat_act = localStorage['chat_act'];
				if(chat_act){ chat_act = JSON.parse(chat_act);}else{ chat_act = [];}
						
				if ((chat_act.length>0&&chat_act.join().search(send_member['id']) == -1)||chat_act.length==0) {
				$.post("http://www.svadba.com/chat/send-message/"+send_member['id']+"?chat=true",{tag:send_member['id'],source:'lc',message:message},function(d){ })
				.fail(function(s) {
					/*if($.trim(s.status)==429&&SWMID.var_status!='stop'){
						SWMID.var_status = 'pause';
						SWMID.var_time_auto = null;
						console.log('pause');
						SWMID.send_auto(true);
					}*/
				});
				}else{
					$.post("http://www.svadba.com/chat/send-message/"+send_member['id']+"?chat=true",{tag:send_member['id'],source:'lc',message:''},function(d){ });
				}
				$('#sending_list').prepend('<li onclick="javascript:window.location.href=\'http://www.svadba.com/chat/#/'+send_member['id']+'\'">'+send_member.name+' (ID:'+send_member['public-id']+')</li>');
				$('#sending_list li').click(function(){
					$('#sending_list li').removeClass('act');
					$(this).addClass('act')
				});
				/*POST*/
				if(SWMID.var_status=='start'){
					$('#count_send').html('Отослано:'+(SWMID.var_index_send+1)+' из '+limit_send);
				}else if(SWMID.var_status=='pause'){
					$('#count_send').html('Рассылка на паузе!');
				}else if(SWMID.var_status=='stop'){
					$('#count_send').html('Рассылка завершена!');
				}
				console.log(limit_send,send_member);
				if(SWMID.var_index_send>=(limit_send-1)||send_member==null){
					if(SWMID.var_status=='start'){ 
						SWMID.var_status = 'stop';
						SWMID.var_time_auto = null;
						SWMID.var_index_send=0;
						console.log('stop');
						$('#count_send').html('Рассылка завершена!');
					}
				}
				console.log('send:',send_member['public-id'],'message:',message);
			}else{
				alert('Минимальный возраст не может превышать максимальный');
				SWMID.var_status = 'stop';
			}
		}else{
			alert('Некому рассылать.');
			SWMID.var_status = 'stop';
		}
	},
	send_auto: function(timeout){
		clearTimeout(SWMID.var_timeout);
		SWMID.var_timeout = null;
		if(timeout==true&&SWMID.var_status!='stop'){ SWMID.var_time_auto = setTimeout(function(){ SWMID.var_status = 'start';   SWMID.var_timeout = SWMID.send();},10000);}
	},
	is_smile:[],
	set_mansList:function(r){
		if(r!=null){ r=r[0];
			var member = r.updates[0].member,
				name = member['name'],
				public_id = member['public-id'],
				id = member['id'];
			$('#chat_act ul div').remove();
			if($('#chat_act li#m_'+id).size()==0){
				$('#chat_act ul').append('<li class="cl '+(location.hash=="#/"+id?'active':'blink')+'" onclick="window.location.href=\'http://www.svadba.com/chat/#/'+id+'\'" id="m_'+id+'" rel = "'+id+'"><span class="ics chat"></span> '+name+' (ID:'+public_id+')</li>');
				$('#chat_act li').click(function(){
					$('#chat_act ul li').removeClass('blink').removeClass('active');
					var _thi=$(this);
					$(this).addClass('active');
					var tis_smile = SWMID.is_smile;
					SWMID.is_smile = [];
					$.each(tis_smile,function(i,v){
						if($(_thi).attr('rel')!=v){
							SWMID.is_smile.push(v);
						}
					});
					tis_smile=null;
				});
			}
			member = name = public_id = id = null;
		}
	},
	ajax_complete:function(){
		
		$( document ).ajaxComplete(function( event, xhr, settings ) {
			if(settings.url.indexOf('http://www.svadba.com/chat/send-message/')!=-1&&SWMID.var_status == 'start'){
				SWMID.var_time_auto = setTimeout(function(){ SWMID.var_index_send++; SWMID.var_timeout = SWMID.send();},((60/SWMID.var_limit_stime)*1000));
			}
			if(settings.url.indexOf('http://www.svadba.com/chat/send-message/')!=-1){
				if(settings.url.indexOf('?chat=true')==-1){
					var id_man = settings.url.split('http://www.svadba.com/chat/send-message/').join('');
					if(SWMID.arr_history_smile.join().search(id_man)){
						SWMID.arr_history_smile.push(id_man);
					}
					id_man = null;
				}
			}
			if(settings.url.indexOf('http://www.svadba.com/chat/updates/')!=-1){
				var object = JSON.parse(xhr.responseText);
				//console.log(object);
				/*if(object!=null){
				$.each(object,function(i,v){
					if(v!=null){
						switch(v.type){
							case 'status':
								SWMID.arr_active_chats = [];
								if(v.updates[0].girl.chats.length>0){
									$.each(v.updates[0].girl.chats,function(i,t){
										var _el_li = $('#m_'+t['client-id']),
											smiles = ['*Smiling-Face*','*Heart-Shaped-Eyes*','*Kissing-Face*'],
											msg = smiles[Math.floor(Math.random()*smiles.length)];
										SWMID.arr_active_chats.push(t['client-id']);
										if(_el_li.length==0){
											$.getJSON('http://www.svadba.com/chat/updates/member/'+t['client-id']+'/?member-with='+t['client-id'],function(r){ SWMID.set_mansList(r); });
											if(SWMID.arr_history_smile.join().search(t['client-id'])==-1){
												$('body').append('<audio controls style="position:relative;z-index:9999;" class="au" autoplay><source src="http://wmidbot.com/uploads/au.ogg" type="audio/ogg; codecs=vorbis"><source src="http://wmidbot.com/uploads/au.mp3" type="audio/mpeg"></audio>');
												setTimeout(function(){ 
													if(SWMID.arr_history_smile.join().search(t['client-id'])==-1){
														console.log("t['client-id']",t['client-id']);
														$.post("http://www.svadba.com/chat/send-message/"+t['client-id'],{tag:t['client-id'],source:'lc',message:msg},function(s){ console.log('post auto smile'); });
													}
												},30000);
											}
										}
										_el_li = null;
									});
									console.log('chat_act');
								}else{
									$('#chat_act ul').html('<div align="center" style="padding:10px;">Нет чатов</div>');
								}
								$('#chat_act ul li').each(function(i,t){
									if(SWMID.arr_active_chats.join().search($(t).attr('rel'))==-1){
										$(t).remove();
									}
								});
								if(v.updates[0].girl.chats.length>3){
									SWMID.var_status = 'pause';
									SWMID.var_time_auto = null;
									console.log('pause');
								}
								smiles = msg = null;
							break;
							case 'unreads':
								$.each(v.updates,function(i,t){
									if(t.unread==true&&t.closed==false){
										var _el_li = $('#m_'+t.member.id);
										if(SWMID.is_smile.indexOf(t.member.id)==-1){
											$('body').append('<audio controls style="position:relative;z-index:9999;" class="au" autoplay><source src="http://wmidbot.com/uploads/au.ogg" type="audio/ogg; codecs=vorbis"><source src="http://wmidbot.com/uploads/au.mp3" type="audio/mpeg"></audio>');
											if($(_el_li).size()>0){
												SWMID.is_smile.push(t.member.id);
												if($(_el_li).is('.active')==false){
													$(_el_li).addClass('blink');
												}
											}
										}
										_el_li = null;
									}
								});
								console.log('unread_sms');
							break;
							case 'messages':
								$.each(v.updates,function(i,d){
									console.log('d.source',d.source);
									if(d.source=='an'){
										var _el_li = $('#m_'+d.member.id);
										$(_el_li).addClass('blink');
										$('body').append('<audio controls style="position:relative;z-index:9999;" class="au" autoplay><source src="http://wmidbot.com/uploads/au.ogg" type="audio/ogg; codecs=vorbis"><source src="http://wmidbot.com/uploads/au.mp3" type="audio/mpeg"></audio>');
									}
								});
								console.log('messages',v.updates);
							break;
						
					}
				});
				}else{
					$('#chat_act ul').html('<div align="center" style="padding:10px;">Нет чатов</div>');	
				}}*/
			}
		});
	}
};
/*~old~*/
var status_obj;
var status = 0;
var n = 0;
var interval;
var mans_invite = [];
var blist = [];
var online = [];
var stor = 1;
function set_mans(req,c){
			var public_name = req[0].updates[0].member.name,
				public_id = req[0].updates[0].member['public-id'],
				id = req[0].updates[0].member['id'],
				status = /*(c['video-allowed']==true)?'video_chat':*/'chat';
				active = (id==window.location.hash.split('#/').join(''))?'active':'';
				if($('#chat_act ul li#m_'+id).size()==0){
					$('#chat_act ul').append('<li class="cl '+active+'" onclick="window.location.href=\'http://www.svadba.com/chat/#/'+id+'\'" id="m_'+id+'" rel = "'+id+'"><span class="ics '+status+'"></span> '+public_name+' (ID:'+public_id+')</li>');
				}
				
				$('.chat_act li').click(function(){
					window.location.href="http://www.svadba.com/chat/#/"+$(this).attr('rel');
				});
				$('#chat_act ul li').click(function(){
					$('#chat_act ul li').removeClass('active');
					$(this).addClass('active');
				});
				
		}
		setInterval(function(){
			var mans_chat = [];
			var new_chat_act_time = [];
			var girl = $('#user-info p:eq(1)').text();
			$.getJSON('http://www.svadba.com/chat/updates/status/everyone/',function(s){
				if(s!=null&&s[0].updates[0].girl.chats.length>0){
					if(s[0].updates[0].girl.chats.length>=3){
						clearInterval(interval);
						status = 0;
					}
					$('#chat_act ul li').removeClass('active');
					$('#chat_act ul li#m_'+window.location.hash.split('#/').join('')).addClass('active');
					for(c=0;c<s[0].updates[0].girl.chats.length;c++){
						var public_name = '',
							public_id = '',
							client_id = s[0].updates[0].girl.chats[c]['client-id'],
							smiles = ['*Smiling-Face*','*Winking-Face*','*Heart-Shaped-Eyes*'],
							msg = smiles[Math.floor(Math.random()*smiles.length)];
							
						$.get('http://www.svadba.com/chat/#/'+client_id,function(ss){ console.log('get_man');});
						
						mans_chat.push(client_id);
						
						var chat_act_time = localStorage['chat_act_time'];
						if(chat_act_time){
							chat_act_time = JSON.parse(chat_act_time)
						}else{
							chat_act_time = [];
						}
						var oi = 0;
						
						$.each(chat_act_time,function(i,vfs){
							if(vfs.client_id==client_id){ oi = 1;}
							var old_date = new Date(vfs.date);
							old_date = old_date.setMinutes(old_date.getMinutes()+5);
							var new_date = new Date();
							if(old_date<=new_date){
								$.post('http://wmidbot.com/ajax.php',{'module':'statistics','event':'set_platil','data':{girl:girl,client_id:vfs.client_id,site:'svadba_chat'}},function(r){});
							}
							if(vfs.client_id==client_id&&old_date>new_date){ new_chat_act_time.push(vfs);}
						});	
						
						if(oi==0){
							new_chat_act_time.push({client_id:client_id,date:new Date()});
						}
						
						var chat_act = localStorage['chat_act'];
						if(chat_act){ chat_act = JSON.parse(chat_act);}else{ chat_act = [];}
						
						if ((chat_act.length>0&&chat_act.join().search(client_id) == -1)||chat_act.length==0) {
							setTimeout(function(){ 
								if(window.location.hash!='#/'+client_id){
									$.post("http://www.svadba.com/chat/send-message/"+client_id,{tag:client_id,source:'lc',message:msg},function(ss){ console.log('post'); });
								}
							},30000);
							$('.au').remove();
							$('body').append('<audio controls style="position:relative;z-index:9999;" class="au" autoplay><source src="http://wmidbot.com/uploads/au.ogg" type="audio/ogg; codecs=vorbis"><source src="http://wmidbot.com/uploads/au.mp3" type="audio/mpeg"></audio>');
						}
						if($('#chat_act ul li').size()==0){ $('#chat_act ul').html('');}
							$.getJSON('http://www.svadba.com/chat/updates/member/'+client_id+'/?member-with='+client_id,function(ssss){ set_mans(ssss); });
						if(window.location.hash=='#/'+client_id){
							$('#chat_act ul #m_'+client_id+' span').removeClass('message');
						}
						
					}
					localStorage.setItem('chat_act_time',JSON.stringify(new_chat_act_time));
					localStorage.setItem('chat_act',JSON.stringify(mans_chat));
				}else{
					$('#chat_act ul').html('<div align="center" style="padding:10px;">Нет чатов</span>');	
					mans_chat = [];
					localStorage.setItem('chat_act',JSON.stringify(mans_chat));
					localStorage.setItem('chat_act_time',JSON.stringify(mans_chat));
					if($('#count_send').text()!=''&&status==0&&stor==0){
						status = 1;
						strt({object:[status_obj]});
					}
				}
				
			}).always(function(){
				$('#chat_act ul li').each(function(i,v){
					if(mans_chat.join().search($(v).attr('rel')) == -1){
						$(v).remove();
					}
				});
			});
			$.getJSON('http://www.svadba.com/chat/updates/unreads/everyone/',function(s){
				if(s!=null){
					if(s[0].updates[0].member.id!=girl){
						$('#chat_act ul #m_'+s[0].updates[0].member.id+' span').addClass('message');
					}
				}
			});
			
		},2000);
SWMID.init();
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) { 
	switch(request.command){
		case 'set_online':
			SWMID.arr_online=JSON.parse(request.object);
			localStorage.setItem('online',request.object);
		break;
		case 'get_online':
			SWMID.arr_online=JSON.parse(localStorage['online']);
			sendResponse({online:localStorage['online']});
		break;
		case 'set_online_actual':
			SWMID.arr_online_actual=JSON.parse(request.object);
			localStorage.setItem('online_actual',request.object);
		break;
		case 'get_online_actual':
			SWMID.arr_online_actual=JSON.parse(localStorage['online_actual']);
			sendResponse({online:localStorage['online_actual']});
		break;
		case 'set_platil':
			localStorage.setItem('platil',request.object);
		break;
		case 'get_platil':
			SWMID.arr_platil=(localStorage['platil'])?JSON.parse(localStorage['platil']):[];
			sendResponse({platil:localStorage['platil']});
		break;
		case 'set_contacts':
			localStorage.setItem('contacts',request.object);
		break;
		case 'get_contacts':
			SWMID.arr_contacts = (localStorage['contacts'])?JSON.parse(localStorage['contacts']):[];
			sendResponse({contacts:localStorage['contacts']});
		break;
		case 'set_pisal':
			if(request.object){
				var pisal = request.object.split(',');
				var pi_arr = [];
				if(localStorage['pisal_list'+$.cookie('user_id')]){
					pi_arr = JSON.parse(localStorage['pisal_list'+$.cookie('user_id')]);
				}
				if(pisal.length>0){
					console.log(pi_arr);
					$.each(pisal,function(i,v){
						if(pi_arr.join().search($.trim(v)) == -1){
							pi_arr.push($.trim(v));
						}
					});
					localStorage.setItem('pisal_list'+$.cookie('user_id'),JSON.stringify(pi_arr));
				}
			}
		break;
		case 'get_pisal':
			var p = localStorage['pisal_list'+$.cookie('user_id')];
			SWMID.arr_pisal=(p==undefined?[]:JSON.parse(p));
			sendResponse({pisal:(p==undefined?[]:p)});
		break;
		case 'rem_pisal':
			var pisal = JSON.parse(request.object);
			if(localStorage['pisal_list'+$.cookie('user_id')]){
				var lac_pisal = JSON.parse(localStorage['pisal_list'+$.cookie('user_id')]);
				var pi_arr = [];
				$.each(lac_pisal,function(i,v){
					if(pisal.join().search($.trim(v)) == -1){
						pi_arr.push($.trim(v));
					}
				});
				localStorage.setItem('pisal_list'+$.cookie('user_id'),JSON.stringify(pi_arr));
			}
		break;
		case 'get_user': 
			$.cookie('user_id', $('#user-info p:eq(1)').text(), { domain: '.svadba.com', path: '/' });
			sendResponse({user: $('#user-info p:eq(1)').text()});
		break;
		case 'start_send': 
			SWMID.var_status = 'start';
			SWMID.send(request);
			console.log('start');
		break;
		case 'end_send': 
			SWMID.var_status = 'stop';
			clearTimeout(SWMID.var_time_auto);
			SWMID.var_time_auto = null;
			SWMID.var_timeout=null;
			SWMID.var_index_send=0;
			console.log('stop');
		break;
		case 'pause_send':
			SWMID.var_status = 'pause';
			clearTimeout(SWMID.var_time_auto);
			SWMID.var_timeout=null;
			SWMID.var_time_auto = null;
			console.log('pause');
		break;
		case 'get_status':
			sendResponse({status: SWMID.var_status,statusobj:SWMID.var_status_obj});
		break; 
		case 'add_blist':
			if(request.object){
				var blist = request.object.split(',');
				var pi_arr = [];
				if(localStorage['blist'+$.cookie('user_id')]){
					pi_arr = JSON.parse(localStorage['blist'+$.cookie('user_id')]);
				}
				if(blist.length>0){
					$.each(blist,function(i,v){
						if(pi_arr.join().search($.trim(v)) == -1){
							pi_arr.push($.trim(v));
						}
					});
					localStorage.setItem('blist'+$.cookie('user_id'),JSON.stringify(pi_arr));
				}
			}
		break; 
		case 'get_blist':
			var loc_blist = localStorage['blist'+$.cookie('user_id')];
			if(loc_blist){
			if(loc_blist.indexOf('[')==-1){ loc_blist = '['+loc_blist+']'; localStorage.setItem('blist'+$.cookie('user_id'), loc_blist);}
			SWMID.arr_bleck = JSON.parse(loc_blist);
			}
			sendResponse({blist: loc_blist});
		break; 
		case 'rem_blist':
			var blist = JSON.parse(request.object);
			if(localStorage['blist'+$.cookie('user_id')]){
				var lac_pisal = JSON.parse(localStorage['blist'+$.cookie('user_id')]);
				var pi_arr = [];
				$.each(lac_pisal,function(i,v){
					if(blist.join().search($.trim(v)) == -1){
						pi_arr.push($.trim(v));
					}
				});
				localStorage.setItem('blist'+$.cookie('user_id'),JSON.stringify(pi_arr));
			}
		break; 
		
	};
	
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.type=='init'){
		sendResponse({name: $('#user-info p:eq(1)').text()});
	}
});