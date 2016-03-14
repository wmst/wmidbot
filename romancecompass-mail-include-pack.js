var name=NaMe;//Заплатка обыкновенная.
(function($){
	$("#middle h1:first").before( $("<div>").css({"font-size":"2em"}).width("500px").html("<span id=\"infostatus\">Рассылка</span>: <code id=\"infohelp\" title=\"Отправлено <- ожидает\">неизвестно</code>") );

	var runned=false,
		limit=false,
		key="jump4love-mail-2-"+name,
		storage,
		message,
		file_blob,//Бинарный файл для отправки
		file_url,//Ссылка для картинки
		file_name,//Имя файла картинки
		file_mime,//Mimetype файла
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
		queue=[],//Очередь на отправку
		inprogress=",",//Те, кто уже в очереди
		cnt=0,//Отправлено
		oldgoal,//Прошлая цель
		nextpage=1,//Следующая страница для обработки
		captcha=false,//Флаг наличия капчи
		favourites={},//Перечень фаворитов
		ended=false,//Флаг завершения обработки выборки
		Stop,

		info=$("#infohelp"),
		infostatus=$("#infostatus"),
		Status=function(sent)
		{
			info.text(sent+" <- "+queue.length);
		},

		ReStartSender,
		getBase64Image=function(img)
		{
			var canvas=document.createElement("canvas");
			canvas.width=img.width;
			canvas.height=img.height;

			var ctx = canvas.getContext("2d");
			ctx.drawImage(img,0,0);

			return canvas.toDataURL("image/jpeg").replace(/^data:image\/(png|jpe?g);base64,/, "");
		},
		
		SendCaptcha=function(mess)
		{
			$("<img>").load(function(){
				$.post(
					captcha_path,
					{
						name:name,
						b:getBase64Image(this),
					},
					function(r)
					{
						if(r.id)
						{
							var F=function()
							{
								$.post(
									captcha_path,
									{
										name:name,
										id:r.id
									},
									function(r2)
									{
										if(typeof r2.wait!="undefined")
											setTimeout(F,5000);
										else if(typeof r2.code!="undefined")
										{
											var data=new FormData();
											data.append("msg[subject]",mess.s);
											data.append("msg[text]",mess.t);
											data.append("keystring",r2.code);
											if(file_blob)
												data.append("photo_img",file_blob,file_name);

											$.ajax({
												url:location.protocol+"//"+location.hostname+"/man/"+mess.id+"/write-message/",
												data:data,
												processData:false,
												contentType:false,
												type:"POST",
												success:function(pr)
												{
													if(pr.indexOf("\"error\"")>-1)
														$.post(
															captcha_path,
															{
																name:name,
																bad:r.id
															},
															function(r3)
															{
																SendCaptcha(mess);
															},
															"json"
														);
													else
													{
														if(pr.indexOf("Message successfully sent")>-1)
															mess.F(true);
														else
															mess.F(false);
														ReStartSender();
													}
												}
											})
											.fail(function(){ mess.F(false); ReStartSender(); })
										}
										else
											setTimeout(function(){
												SendCaptcha(mess);
											},5000);
									},
									"json"
								);
							};
							setTimeout(F,10000);
						}
						else
						{
							if(r.error=="LIMIT_EXCEED")
							{
								alert("На сегодня достингнут лимит в "+e.limit+" писем с капчей");
								run.click();
							}
							else if(r.error=="PAYED_EXCEED")
							{
								alert("Вы исчерпали письма с капчей. Пожалуйста, пополните свой счет на \nhttp://wmidbot.com");
								run.click();
							}
							ReStartSender();
						}	
					},
					"json"
				);
				$(this).remove();
			}).prop("src",location.protocol+"//"+location.hostname+"/captcha/?"+Math.round(Math.random()*100000000));
		},

		GetFavourites=function(F,favpage)
		{
			favpage=favpage||1;
			if(favpage==1)
				favourites={};
			$("<div>").load(location.protocol+"//"+location.hostname+"/myprofile/favorites/page"+favpage+" #middle",{page:favpage},function(){  
				console.log('favpage',favpage);
				$(".gallery-item-in",this).each(function(){
					var id=parseInt( $(".user-id",this).text().replace("User ID: ","") );
					favourites[id]=[ $(".name",this).text(),$(".age",this).text() ];
				});
				
				if($("a.next",this).size()>0)
					GetFavourites(F,favpage+1);
				else
					F();
			});
		},

		StartSender=function()
		{
			if(queue.length>0)
			{
				var mess=queue.shift(),
					data=new FormData();
					
				data.append("msg[subject]",mess.s);
				data.append("msg[text]",mess.t);
				if(file_blob)
					data.append("photo_img",file_blob,file_name);

				$.ajax({
					url:location.protocol+"//"+location.hostname+"/man/"+mess.id+"/write-message/",
					data:data,
					processData:false,
					contentType:false,
					type:"POST",
					success:function(r)
					{
						if(r.indexOf("Message successfully sent")>-1)
						{
							mess.F(true);
							ReStartSender();
						}
						else if(r.indexOf("\"captcha\"")!=-1)
							SendCaptcha(mess);
						else
						{
							mess.F(false);
							ReStartSender();
						}
					}
				})
				.fail(function(){ mess.F(false); ReStartSender(); });
			}
			else if(ended)
			{
				Stop();
				alert("Поисковая выдача работана");
			}
			else
				ReStartSender();
		},
		Parse4Send=function(r)
		{
			if(queue.length>0)
			{
				tos=setTimeout(function(){ Parse4Send(r); },1000);
				return;
			}

			var body=r.replace(/<script[^>]*>|<\/script>/g,""),
				ind1=body.indexOf("<body"),
				ind2=body.indexOf(">",ind1+1),
				ind3=body.indexOf("</body>",ind2+1);
			body=body.substring(ind2+1,ind3);
			body=body.replace(/src="[^"]+"/ig,"");
			body=$("<div>").html(body);

			body.find(".gallery-item").each(function(){
				var th=$(this),
					age=parseInt($(".age:first",this).text()),
					mname=$(".name:first",this).text(),
					id=parseInt($(".user-id:first",this).text().replace("User ID: ",""));
					
					if(message.sent.indexOf(","+id+",")==-1 && inprogress.indexOf(","+id+",")==-1 && !(id in storage.black) && !(id in favourites))
					{
						inprogress+=id+",";
						queue.push({
							id:id,
							s:message.title.replace(/{name}/ig,mname).replace(/{age}/ig,age),
							t:message.text.replace(/{name}/ig,mname).replace(/{age}/ig,age),
							F:function(success){
								if(success)
								{
									message.sent+=id+",";
									message.cnt++;
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
				var na=body.find(".pager a.active").next();
				console.log(na.size());
				if(na.size()==0)
					na=body.find(".pager a.number:first");
				if(na.size()>0)
					top=setTimeout(function(){
						nextpage=parseInt(na.text());
						$.get(na.prop("href"),Parse4Send);
					},500);
				else
					ended=true;
			}
			body.remove();
		},
		StartParser=function()
		{
			GetFavourites(function(){
				ended=false;
				var pa=$(".pager a.number");
				console.log(pa.size());
				if(nextpage>1)
					pa=pa.slice(nextpage-1,nextpage);

				if(pa.is(".active"))
					Parse4Send("<body>"+$("body").html()+"</body>");
				else
					$.get(pa.prop("href"),Parse4Send);
			});
		},
		Bin2Blob=function(bin)
		{
			if(bin)
			{
				var ab=new ArrayBuffer(bin.length),
					ia=new Uint8Array(ab),i=0;

				for(;i<bin.length;i++)
					ia[i]=bin.charCodeAt(i);

				file_blob=new Blob([ab],{ type : file_mime });//К сожалению этот объект нельзя передать из формы :-(
			}
		};

	ReStartSender=function()
	{
		if(runned)
			tos=setTimeout(StartSender,10000);
	};

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
		storage={last:1,active:0,black:{},writers:{},goal:"search"};

	oldgoal=storage.goal;
	MessHandle=function(obj,sender,CB)
	{
		switch(obj.type)
		{
			case "init":
				CB({
					name:name,
					limit:limit,
					runned:runned,
					storage:storage,
					file_bin:"",
					file_url:file_url,
					file_name:file_name,
					file_mime:file_mime
				});
			break;
			case "setstatus":
				Status(obj.sent);
			break;
			case "save":
				Bin2Blob(obj.file_bin);

				storage=obj.storage;
				file_url=obj.file_url;
				file_name=obj.file_name;
				file_mime=obj.file_mime;

				SaveStorage();
			break;
			case "start":
				Bin2Blob(obj.file_bin);

				file_url=obj.file_url;
				file_name=obj.file_name;
				file_mime=obj.file_mime;

				if(!runned)
				{
					LoadStorage();
					if(message)
					{
						runned=true;
						if(oldgoal!=storage.goal)
						{
							inpogress=",";
							queue=[];
							cnt=0;
							oldgoal=storage.goal;
							nextpage=1;
						}
						switch(storage.goal)
						{
							case "writers":
								cnt=0;
								$.each(storage.writers,function(id){
									id=parseInt(id);
									if(id>0 && !(id in storage.black) && message.sent.indexOf(","+id+",")==-1 && inprogress.indexOf(","+id+",")==-1)
									{
										inprogress+=id+",";
										$.get(location.protocol+"//"+location.hostname+"/man/"+id+"/",function(r){
											r=r.replace(/<script[^>]*>|<\/script>/g,"");
											var ind1=r.indexOf("<body"),
												ind2=r.indexOf(">",ind1+1),
												ind3=r.indexOf("</body>",ind2+1);
											r=r.substring(ind2+1,ind3);
											r=r.replace(/src="[^"]+"/ig,"");
											r=$("<div>").html(r);
											
											var age=parseInt(r.find(".age:first").text()),
												mname=r.find(".name:first").text();
											if(mname)
											{
												queue.push({
													id:id,
													s:message.title.replace(/{age}/ig,age).replace(/{name}/ig,mname),
													t:message.text.replace(/{age}/ig,age).replace(/{name}/ig,mname),
													F:function(success){
														message.sent+=id+",";
														message.cnt++;

														if(success)
															++cnt;
														Status(cnt);

														if(queue.length==0)
														{
															Stop();
															alert("Рассылка завершена");
														}

														SaveStorage();//Только для учета отправленных
													}
												});
												Status(cnt);
											}
											r.remove();
										});
									}
								});
							break;
							case "favourites":

								GetFavourites(function(){
									$.each(favourites,function(id,data){
										if(id>0 && !(id in storage.black) && message.sent.indexOf(","+id+",")==-1 && inprogress.indexOf(","+id+",")==-1)
										{
											inprogress+=id+",";
											queue.push({
												id:id,
												s:message.title.replace(/{age}/ig,data[1]).replace(/{name}/ig,data[0]),
												t:message.text.replace(/{age}/ig,data[1]).replace(/{name}/ig,data[0]),
												F:function(success){
													message.sent+=id+",";
													message.cnt++;

													if(success)
														++cnt;
													Status(cnt);

													if(queue.length==0)
													{
														Stop();
														alert("Рассылка завершена");
													}
													
													SaveStorage();//Только для учета отправленных
												}
											});
											Status(cnt);
										}
									});
								});
							break;
							default:
								StartParser();
						}
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