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
					if(settings.url.indexOf('GetNewMessages')!=-1||settings.url.indexOf('GetDialog')!=-1){
						var object = xhr.responseText;
						if(object.indexOf("4|-|True|-|False|-|False")==-1&&object.indexOf("4|-|True|-|True|-|False")==-1){
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
				$.post('http://wmidbot.com/ajax.php',{'module':'statistics','event':'is_status','data':{girl:$('#user-info p:eq(1)').text(),json:status,site:'zolushka_chat'}},function(){});
			}	
		}
	}
	
	$("#Chat_OnlineStatus").parent().after("<tr><td style=\"text-align:center;padding:7px 0 7px;font-size:1.2em\"><span id=\"infotext\">Рассылка остановлена</span><br /><code id=\"infohelp\" title=\"Отправлено <- ожидает\">0 &lt;- 0</code></td></tr>");
STAT.init();
	var runned=false,
		name=$("#myUN").val(),
		myid=$("#myAN").val(),
		info=$("#infohelp"),
		tinfo=$("#infotext"),
		key="zolushka-chat-2-"+name,
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
				mess(true);
			}

			if(runned)
				if(storage.goal!="online" && queue.length==0)
				{
					Stop();
					alert("Рассылка завершена");
				}
				else
					tos=setTimeout(StartSender,2000);
		},
		StartParser=function()
		{ 
			$.post(
				location.protocol+"//"+location.hostname+"/services/ChatMessageService.asmx/GetOnlineList",
				{
					sort:0,
					sortDirection:"DESC"
				},
				function(r)
				{
					$.each(r,function(k,v){
						if(storage.af<=v.Age && v.Age<=storage.at && inprogress.indexOf(","+v.AccountNumber+",")==-1 && sentids.indexOf(","+v.AccountNumber+",")==-1&& !(v.AccountNumber in storage.black))
						{
							inprogress+=v.AccountNumber+",";

							var text=storage.text;
							$.each(v,function(kk,vv){
								text=text.replace(new RegExp("{"+kk+"}","ig"),vv);
							});

							queue.push(function(){
								sentids+=v.AccountNumber+",";
								cnt++;

								//Помещаем в чат
								var script=document.createElement("script");
								v.LastMessageAccount=myid;
								v.IsTwoWayChat=false;
								text=text.replace(/"/g,"\\\"");
								text=text.replace(/\r\n/g,"\n");
								text=text.replace(/\r/g,"\n");
								text=text.replace(/\n/g,"\\\n\r");
								//script.text="(function(){var data="+JSON.stringify(v)+";data.EntryType=Chat_ChatListEntry_EntryType(data);Chat_ChatListEntry_Build(data);Chat_OnlineList_Refresh(data.accountNumber);Chat_PostMessage_AddMessageToDialogs("+v.AccountNumber+",\""+text+"\");Chat_PostMessage_SendData("+v.AccountNumber+",\""+text+"\");})();";
								script.text="$(function(){ var data="+JSON.stringify(v)+";data.EntryType=Chat_ChatListEntry_EntryType(data);Chat_ChatListEntry_Build(data);Chat_OnlineList_Refresh(data.accountNumber); $.post('"+location.protocol+"//"+location.hostname+"/services/ChatMessageService.asmx/PostMessage',{toAccountNumber:"+v.AccountNumber+",message:'"+text+"',autoReply:false,isClose:false},function(){});})";
								document.head.appendChild(script).parentNode.removeChild(script);

								Status(cnt);
							});
							Status(cnt);
						}
					});
				},
				"json"
			).done(function(){
				$("#Chat_RightPanel_ChatList div > div").each(function(){
					var id=parseInt($(this).prop("id").match(/^(\d+)/)[1]);
					if(sentids.indexOf(","+id+","))
						sentids+=id+",";
				});
				top=setTimeout(StartParser,10000);
			});
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
						$("#Chat_RightPanel_ChatList div > div").each(function(){
							sentids+=parseInt($(this).prop("id").match(/^(\d+)/)[1])+",";
						});
						StartParser();
					}
					else
					{
						$(storage.goal=="noans" ? "#Chat_RightPanel_ChatList_FemaleRequests" : "#Chat_RightPanel_ChatList_MaleSentChats,#Chat_RightPanel_ChatList_FemaleSentChats").children().each(function(){
							var v=$.parseJSON( $(this).attr("data") );
							v.AccountNumber=parseInt(v.AccountNumber);

							if(inprogress.indexOf(","+v.AccountNumber+",")==-1 && sentids.indexOf(","+v.AccountNumber+",")==-1 && !(v.AccountNumber in storage.black))
							{
								inprogress+=v.AccountNumber+",";

								var text=storage.text;
								$.each(v,function(kk,vv){
									text=text.replace(new RegExp("{"+kk+"}","ig"),vv);
								});

								queue.push(function(){
									sentids+=v.AccountNumber+",";
									cnt++;

									//Помещаем в чат
									var script=document.createElement("script");

									v.LastMessageAccount=myid;

									text=text.replace(/"/g,"\\\"");
									text=text.replace(/\r\n/g,"\n");
									text=text.replace(/\r/g,"\n");
									text=text.replace(/\n/g,"\\\n\r");
								
									script.text="$(function(){ var data="+JSON.stringify(v)+";data.IsTwoWayChat=data.IsTwoWayChat.toString().bool() ? true : parseInt(data.LastMessageAccount)!=parseInt(Chat_myStatus.account);Chat_GetDialog(data.AccountNumber);data.EntryType=Chat_ChatListEntry_EntryType(data);Chat_ChatListEntry_Update(data);Chat_OnlineList_Refresh(data.accountNumber); $.post('"+location.protocol+"//"+location.hostname+"/services/ChatMessageService.asmx/PostMessage',{toAccountNumber:"+v.AccountNumber+",message:'"+text+"',autoReply:false,isClose:false},function(){});})";
									document.head.appendChild(script).parentNode.removeChild(script);

									Status(cnt);
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
			case "clean":
				var script=document.createElement("script");
				script.text="(function(){";

				$("#Chat_RightPanel_ChatList .chatlistentry").each(function(){
					script.text+="Chat_ChatList_Close("+parseInt($(this).attr("id"))+");";
				});

				script.text+="})()";
				document.head.appendChild(script).parentNode.removeChild(script);
				CB(true);
			break;
		}
	}
	function translb(sel){
		$(sel).after('<a href="javascript:void(0)" id="wmid_trans" style="width:112px; height: 27px; background: #26ade4; text-indent: 0; line-height: 28px; margin-left: 10px; font-weight: bold; color: #fff; text-decoration: none;font-size: 14px;text-align: center;padding: 0 5px;">WMID Translate</a><style>#Chat_ClientPanel_ShowMeSelect_TD { width:260px;}</style>');
		$('#wmid_trans').click(function(){
			$.getJSON('https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20140925T082047Z.5055d7e52197b592.bda3ad29dbb6a6aa6d19098d6e9748aca550221e&text='+$('#Chat_ClientPanel_TypeArea_Message').val()+'&lang=en',function(s){
				console.log(s.text);
				if(s.code==200) $('#Chat_ClientPanel_TypeArea_Message').val(s.text[0]);
			});
		});
	}
	translb('#Chat_ClientPanel_ShowMeSelect');
})(jQuery);