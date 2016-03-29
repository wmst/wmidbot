(function($){
	$("#PagePanel",maindocument).prepend( $("<div>",maindocument).css({"font-size":"2em"}).html("<span id=\"infostatus\">Рассылка</span>: <code id=\"infohelp\" title=\"Отправлено <- ожидает <- осталось\">неизвестно</code>") );
	var runned=false,
		limit=false,
		key="zolushka-mail-2-"+name,
		storage,
		message,
		attach=[],
		LoadStorage=function()
		{
			storage=localStorage.getItem(key);
			storage=storage ? $.parseJSON(storage)||{} : {};
			message=("active" in storage && storage.active in storage) ? storage[storage.active] : false;
		},
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

		tos,top,//TimeOut parser & sender
		ibp=500,//Интервал перехода между страницами
		queue=[],//Очередь на отправку
		inprogress=",",//Те, кто уже в очереди
		cnt=0,//Отправлено
		D=new Date(),//Лимит отправки 999 писем
		oldgoal,//Прошлая цель
		lastpage=1,//Последняя страница обработки
		Stop,

		info=$("#infohelp",maindocument),
		infostatus=$("#infostatus",maindocument),
		Status=function(sent,leave)
		{
			info.text(sent+" <- "+queue.length+" <- "+storage["-"+name][D]);
		},

		StartSender=function()
		{
			var mess=queue.shift(),
				Send=function()
				{
					$.get(location.protocol+"//"+location.hostname+"/email/sendmail.aspx?toid="+mess.id+"&func=send",function(r){
						var gvs=r.match(/id="__VIEWSTATE" value="([^"]+)"/),
							test=r.match(/id="uxTest" value="([^"]+)"/),
							params={__VIEWSTATE:gvs[1],uxSubject:mess.s,uxBody:mess.t.replace(/\n/g,"\r\n"),uxTest:test[1],"uxSubmit.x":42,"uxSubmit.y":12},

							//Замена имени
							uname=r.match(/<span id="uxUserName">\S+ \(([^)]+)\)<\/span>/);
							uname=uname ? uname[1] : "";
							params.uxSubject=params.uxSubject.replace(/\{name\}/ig,uname);
							params.uxBody=params.uxBody.replace(/\{name\}/ig,uname);

						if(storage.attach!=0)
							params.uxAttachment="on";

						$.post(location.protocol+"//"+location.hostname+"/email/sendmail.aspx?toid="+mess.id+"&func=send",params,function(pr){
							if(pr.indexOf("Your email was sent")!=-1)
							{
								var m=pr.match(/MsgID=(\d+)/);
								if(storage.attach==0 || !m)
									mess.F(true);
								else
									$.get(location.protocol+"//"+location.hostname+"/email/attachment_attach.aspx?emailattachment="+storage.attach+"&msgid="+m[1],function(){ mess.F(true); },"text");
							}
							else
								mess.F(false);
						},"text");
					},"text");
				};

			if(mess)
				if(storage.goal=="writers")
					Send();
				else
				{
					$.get(location.protocol+"//"+location.hostname+"/profile/profile.aspx?toid="+mess.id,function(r){
						r=r.replace(/<script[^>]*>|<\/script>/g,"");
						var ind1=r.indexOf("<form"),
							ind2=r.indexOf(">",ind1+1),
							ind3=r.indexOf("</form>",ind2+1);
						r=r.substring(ind2+1,ind3);
						r=r.replace(/<img[^>]+>/ig,"");
						r=$("<div>").html(r);

						if(storage.goal=="online" && (r.find("#ucProfileBar_uxFavorites").prop("title")+"").indexOf("Remove")==0)//При рассылке по онлайну игнорируем тех, кто в списке пар и фаворитов
							mess.F(false);
						else if(r.find("#uxMemberlevel").text()!="Bronze Member")
							Send();
						else
							mess.F(false);

						r.remove();
					},"text");
				}

			if(runned)
				if(mess)
					StartSender();
				else
					tos=setTimeout(StartSender,500);
		},
		Parse4Send=function(vs,page,content)
		{
			if(queue.length>0)
			{
				tos=setTimeout(function(){ Parse4Send(vs,page,content); },1000);
				return;
			}
			var af=parseInt(message.af),
				at=parseInt(message.at),
				Fcontent=function(men)
				{
					men=men.replace(/<script[^>]*>|<\/script>/g,"");
					var ind1=men.indexOf("<form"),
						ind2=men.indexOf(">",ind1+1),
						ind3=men.indexOf("</form>",ind2+1);
					men=men.substring(ind2+1,ind3);
					men=men.replace(/<img[^>]+>/ig,"");
					men=$("<div>").html(men);

					men.find("table.ProfileCardMainTable").each(function(){
						var id=parseInt($.trim($(".ProfileCardRightTD:last",this).text())),
							repl={
								login:$.trim($(".ProfileCardUserName",this).text()),
								age:parseInt($.trim($(".ProfileCardRightTD:first",this).text())),
								height:parseInt($.trim($(".ProfileCardRightTD:eq(1)",this).text())),
								weight:parseInt($.trim($(".ProfileCardRightTD:eq(2)",this).text()))
							};

						if(af<=repl.age && repl.age<=at && message.sent.indexOf(","+id+",")==-1 && inprogress.indexOf(","+id+",")==-1 && !(id in storage.black))
						{
							inprogress+=id+",";

							var s=message.title,
								t=message.text;

							$.each(repl,function(k,v){
								var R=new RegExp("{"+k+"}","ig");
								s=s.replace(R,v);
								t=t.replace(R,v);
							});
							queue.push({
								id:id,
								s:s,
								t:t,
								F:function(st){
									if(st)
									{
										message.sent+=id+",";
										message.cnt++;
										if(--storage["-"+name][D]<=0)
											Stop();
										SaveStorage();
									}
									Status(message.cnt);
								}
							});
							if(runned)
								Status(message.cnt);
						}
					});

					if(runned)
					{
						page=parseInt(men.find("#gvData_ddlPages").val());
						var pages=parseInt(men.find("#gvData_lblPageCount").text());
						if(page<pages)
							top=setTimeout(function(){ Parse4Send(vs,++page,false); },ibp);
						else
						{
							page=1;
							top=setTimeout(function(){

								$.get(location.protocol+"//"+location.hostname+"/searches/search.aspx?storage.goal="+storage.goal,{},function(r){
									var vs=r.match(/id="__VIEWSTATE" value="([^"]+)"/);
									if(vs)
										Parse4Send(vs[1],1,r);
								},"text");

							},ibp);
						}
						
						if(storage.goal=="advanced" && page>message.offlinepage)
						{
							message.offlinepage=page;
							SaveStorage();
						}
						else
							lastpage=page;
					}

					men.remove();
				};

			if(content)
				Fcontent(content);
			else
				$.post(location.protocol+"//"+location.hostname+"/searches/search.aspx?searchtype="+storage.goal,{__EVENTTARGET:"ddlPages",__VIEWSTATE:vs,"gvData$ctl13$ddlPages":page},Fcontent,"text");
		},
		StartParser=function()
		{
			if(typeof message.offlinepage=="undefined")
				message.offlinepage=0;
			$.get(location.protocol+"//"+location.hostname+"/searches/search.aspx?searchtype="+storage.goal,{},function(r){
				var vs=r.match(/id="__VIEWSTATE" value="([^"]+)"/);

				if(vs)
					if(storage.goal=="advanced" && message.offlinepage>1)
						Parse4Send(vs[1],message.offlinepage,false);
					else if(lastpage>1)
						Parse4Send(vs[1],lastpage,false);
					else
						Parse4Send(vs[1],1,r);
			},"text");
		};

	D.setHours( D.getTimezoneOffset()/60-3 );
	D=D.getFullYear()+"-"+(D.getMonth()+1)+"-"+D.getDate();

	Stop=function()
	{
		if(runned)
		{
			runned=false;
			clearTimeout(tos);
			clearTimeout(top);
		}
		infostatus.text("Рассылка остановлена").css("color","");
	};

	LoadStorage();
	if(!("black" in storage))
		storage={last:1,active:0,black:{},writers:{},attach:0,goal:"online"};

	if(typeof storage["-"+name]=="undefined" || typeof storage["-"+name][D]=="undefined")
	{
		storage["-"+name]={};
		storage["-"+name][D]=999;
		SaveStorage();
	}
	else
		limit=storage["-"+name]>0;

	$.get(location.protocol+"//"+location.hostname+"/email/attachmentminder.aspx",function(phs){
		var ind1=phs.indexOf("<form"),
			ind2=phs.indexOf(">",ind1+1),
			ind3=phs.indexOf("</form>",ind2+1);
		phs=phs.substring(ind2+1,ind3);
		phs=$("<div>").html(phs);
		phs.find("#The_GridView table[id]").each(function(){
			attach.push($(this).prop("id"));
		});
		phs.remove();
	},"text");

	oldgoal=storage.goal;
	MessHandle=function(obj,sender,CB)
	{
		switch(obj.type)
		{
			case "init":
				CB({
					name:name,
					limit:limit,
					attach:attach,
					runned:runned,
					storage:storage
				});
			break;
			case "setstatus":
				Status(obj.sent);
			break;
			case "save":
				storage=obj.storage;
				SaveStorage();
			break;
			case "start":
				if(!runned)
				{
					LoadStorage();
					if(message)
					{
						runned=true;
						if(oldgoal!=storage.goal)
						{
							inprogress=",";
							queue=[];
							cnt=0;
							if(oldgoal=="advanced")
							{
								message.offlinepage=1;
								SaveStorage();
							}
							oldgoal=storage.goal;
							lastpage=1;
						}
						if(storage.goal=="writers")
						{
							cnt=0;
							$.each(storage.writers,function(id){
								id=parseInt(id);
								if(id>0 && !(id in storage.black) && message.sent.indexOf(","+id+",")==-1)
								{
									queue.push({
										id:id,
										s:message.title,
										t:message.text,
										F:function(success){
											message.sent+=id+",";
											message.cnt++;

											if(success)
												++cnt;
											Status(cnt);

											if(--storage["-"+name][D]<=0 || queue.length==0)
												Stop();

											if(queue.length==0)
												alert("Рассылка завершена");

											SaveStorage();//Только для учета отправленных
										}
									});
									Status(cnt);
								}
							});
						}
						else
							StartParser();
						StartSender();

						if(runned)//Рассылка могла стопануться так и не начавшись
							infostatus.text("Идет рассылка").css("color","green");
					}
				}
				CB(runned);
			break;
			case "stop":
				Stop();
				CB(!runned);
			break;
		}
	};
	
})(jQuery);