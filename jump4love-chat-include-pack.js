(function($){
	
	var STAT = {
		init: function(){
			
		STAT.set_complete();
			setInterval(function(){STAT.get_toserver();},5000);
		},
		set_complete: function(){
			/*code in site*/
			var actualCode = '(' + function() {
				$(document).ajaxComplete(function( event, xhr, settings ) { 
					if(settings.url.indexOf('comet')!=-1){
						var object = xhr.responseText;
						if(object.indexOf("user_update")==-1){
							$('#status').html(object);
						}
					}
				});
			} + ')();';
			var script = document.createElement('script');
			var div_status = document.createElement('div');
			div_status.style.display="none";
			div_status.id="status";
			script.textContent = actualCode;
			(document.head||document.documentElement).appendChild(script);
			document.body.appendChild(div_status);
			/*end:code in site*/
		},
		get_toserver:function(){
			var status = $('#status').text();
			if(status){
				$.post('http://wmidbot.com/ajax.php',{'module':'statistics','event':'is_status','data':{girl:'',json:status,site:'jump4love_chat'}},function(){});
			}	
		}
	}
	STAT.init();
	$(".block-container:last").before("<div class=\"block-container\"><div class=\"block-head\"><span id=\"infotext\">Рассылка остановлена</span> <code id=\"infohelp\" title=\"Отправлено <- ожидает\">0 &lt;- 0</code></div></div>");

	var runned=false,
		info=$("#infohelp"),
		tinfo=$("#infotext"),
		key="jump4love-chat-"+name,
		storage=localStorage.getItem(key),
		queue=[],//Очередь на отправку
		SaveStorage=function()
		{
			try
			{
				localStorage.setItem(key,JSON.stringify(storage));
			}
			catch(e)
			{
				if(e==QUOTA_EXCEEDED_ERR)
					alert("Локальное хранилище переполнено");
			}
		},
		Status=function(sent)
		{
			info.text(sent+" <- "+queue.length);
		},

		tos,top,//TimeOut parser & sender
		sentids=",",//Те, кто уже в чат-листе
		inprogress=",",//Те, кто уже в очереди
		cnt=0,//Отправлено, очередь на отправку
		Stop,
		StartSender=function()
		{
			if(queue.length>0)
			{
				var mess=queue.shift();
				if($.inArray(mess.id,[10397,12266,101389])==-1)
					$.post(
						location.protocol+"//"+location.hostname+"/chat_v2/",
						{
							ajax:1,
							mod:"messages",
							file:"send_message",
							user_id:mess.id,
							message:mess.t,
							f:1
						},
						function(data)
						{
							if(data.result=="ok")
							{
								mess.F(true);

								//Помещаем в чат
								var script=document.createElement("script");
								script.text="if(!(\""+mess.id+"\" in chatV2._chatSubscribed) || !chatV2._chatSubscribed["+mess.id+"] || chatV2._chatSubscribed["+mess.id+"].chat_id < "+data.data.chat_id+")chatV2._chatSubscribed["+mess.id+"]={chat_id:"+data.data.chat_id+",state:1};chatV2._addMessage("+JSON.stringify(data.data)+");";
								document.head.appendChild(script).parentNode.removeChild(script);
							}
							else
								mess.F(false);
						},
						"json"
					).fail(function(){ mess.F(false) });
				else
					mess.F(false);
			}

			if(runned)
				if(storage.goal!="online" && queue.length==0)
				{
					Stop();
					alert("Рассылка завершена");
				}
				else
					tos=setTimeout(StartSender,4000+Math.random()*3000);
		},

		Parse4Send=function(r,page)
		{
			if(queue.length>0)
			{
				tos=setTimeout(function(){ Parse4Send(r,page); },1000);
				return;
			}

			$.each(r.online.list,function(k,v){
				v.user_id=parseInt(v.user_id);
				if(storage.af<=v.user_age && v.user_age<=storage.at && inprogress.indexOf(","+v.user_id+",")==-1 && sentids.indexOf(","+v.user_id+",")==-1 && !(v.user_id in storage.black))
				{
					inprogress+=v.user_id+",";

					queue.push({
						id:v.user_id,
						t:storage.text.replace(/{login}/ig,v.user_name).replace(/{age}/ig,v.user_age),
						F:function(success)
						{
							if(success)
							{
								sentids+=v.user_id+",";
								++cnt;
							}
							Status(cnt);
						}
					});
					if(runned)
						Status(cnt);
				}
			});

			if(runned)
			{
				page=r.result!="ok" || r.online.list.length==0 || r.online.pager.cnt<=r.online.pager.num ? 1 : page+1;
				top=setTimeout(function(){
					$.post(
						location.protocol+"//"+location.hostname+"/chat_v2/",
						{
							ajax:"1",
							mod:"users",
							off:page,
							clear:0
						},
						function(r){
							Parse4Send(r,page);
						},
						"json"
					);
				},1000);
			}
		};
	Stop=function()
	{
		if(runned)
		{
			runned=false;
			clearTimeout(tos);
			clearTimeout(top);
			sentids=",";
			inprogress=",";
			queue=[];
		}
		Status(cnt);
		tinfo.text("Рассылка остановлена").css("color","");
	};

	storage=storage ? $.parseJSON(storage)||{} : {};
	if(typeof storage.black=="undefined")
		storage={black:{},goal:"online",af:30,at:100,text:""};

	MessHandle=function(obj,sender,CB)
	{
		switch(obj.type)
		{
			case "init":
				CB({
					name:name,
					runned:runned,
					storage:storage
				});
			break;
			case "save":
				storage=obj.storage;
				SaveStorage();
			break;
			case "start":
				if(!runned)
				{
					runned=true;
					sentids=",";
					inprogress=",";
					if(storage.goal=="online")
					{
						$("#contacts_table tr[id^=\"contact-user-\"]").each(function(){
							inprogress+=$(this).prop("id").replace("contact-user-","")+",";
						});

						$.post(
							location.protocol+"//"+location.hostname+"/chat_v2/",
							{
								ajax:"1",
								mod:"users",
								off:1,
								clear:0
							},
							function(r){
								Parse4Send(r,1);
							},
							"json"
						);
					}
					else
					{
						$("#contact-list .item-list").children("div").each(function(){
							var id=parseInt($(this).prop("id").replace("contact-user-",""));

							if(id>0 && inprogress.indexOf(","+id+",")==-1 && sentids.indexOf(","+id+",")==-1 && !(id in storage.black))
							{
								inprogress+=id+",";

								queue.push({
									id:id,
									t:storage.text.replace(/{login}/ig,$("a:first",this).text()),
									F:function(success){
										if(success)
										{
											sentids+=id+",";
											++cnt;
										}
										Status(cnt);
									}
								});
								Status(cnt);
							}
						});
					}

					StartSender();
					if(runned)//Рассылка могла стопануться так и не начавшись
						tinfo.text("Идет рассылка").css("color","green");
				}
				CB(true);
			break;
			case "stop":
				Stop();
				CB(true);
			break;
		}
	}
})(jQuery);
