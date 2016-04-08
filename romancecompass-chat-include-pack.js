(function($) {
	var STAT = {
		init: function(){
			
		STAT.set_complete();
			setInterval(function(){STAT.get_toserver();},5000);
		},
		set_complete: function(){
			/*code in site*/
			var actualCode = '(' + function() {
				$(document).ajaxComplete(function( event, xhr, settings ) { 
					if(settings.url.indexOf('chat')!=-1){
						var object = xhr.responseText;
						if(object.indexOf('"started": 1')!=-1){
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
				$.post('http://wmidbot.com/ajax.php',{'module':'statistics','event':'is_status','data':{girl:name,json:status,site:'romancecompass_chat'}},function(){});
			}	
		}
	}
	STAT.init();
    $("#chat-video-box").after("<div style=\"background-color:white\"><span id=\"infotext\">Рассылка остановлена</span> <code id=\"infohelp\" title=\"Отправлено <- ожидает\">0 &lt;- 0</code></div>");
    var f = false,
        info = $("#infohelp"),
        tinfo = $("#infotext"),
        key = "romancecompass-chat-" + name,
        storage = localStorage.getItem(key),
        queue = [],
        SaveStorage = function() {
            try {
                localStorage.setItem(key, JSON.stringify(storage))
            } catch (e) {
                if (e == QUOTA_EXCEEDED_ERR) alert("Локальное хранилище переполнено")
            }
        },
        Status = function(a) {
            info.text(a + " <- " + queue.length)
        },
        tos, top, sentids = ",",
        inprogress = ",",
        cnt = 0,
        Stop, StartSender = function() {
            if (queue.length > 0) {
                var c = queue.shift();
                $.post(location.protocol + "//" + location.hostname + "/chat/", {
                    ajax: 1,
                    action: "send_message",
                    c_id: c.id,
                    message: c.t
                }, function(a) {
                    if (a.result == "ok") {
                        c.F(true);
                        var b = document.createElement("script");
                        b.text = "if(!(\"" + c.id + "\" in msg_subscribed) || !msg_subscribed[" + c.id + "] || msg_subscribed[" + c.id + "].chat_id<" + a.data.chat_id + ")msg_subscribed[" + c.id + "]={chat_id:" + a.data.chat_id + ",state:1};checkActiveChatBox(" + JSON.stringify(a.data) + "," + c.id + ",true);";
                        document.head.appendChild(b).parentNode.removeChild(b)
                    } else c.F(false)
                }, "json")
            }
            if (f)
                if (storage.goal != "online" && queue.length == 0) {
                    Stop();
                    alert("Рассылка завершена")
                } else tos = setTimeout(StartSender, 1000)
        },
        Parse4Send = function(r, b) {
            if (queue.length > 0) {
                tos = setTimeout(function() {
                    Parse4Send(r, b)
                }, 1000);
                return
            }
            $.each(r.online, function(k, v) {
                if (storage.af <= v.age && v.age <= storage.at && inprogress.indexOf("," + v.id + ",") == -1 && sentids.indexOf("," + v.id + ",") == -1 && !(v.id in storage.black)) {
                    v.country = v.country.split(",");
                    v.country[0] = v.country[0] ? $.trim(v.country[0]) : "";
                    v.country[1] = v.country[1] ? $.trim(v.country[1]) : "";
                    inprogress += v.id + ",";
                    queue.push({
                        id: v.id,
                        t: storage.text.replace(/{name}/ig, v.name).replace(/{age}/ig, v.age).replace(/{city}/ig, v.country[0]).replace(/{country}/ig, v.country[1]),
                        F: function(a) {
                            if (a) {
                                sentids += v.id + ",";
                                ++cnt
                            }
                            Status(cnt)
                        }
                    });
                    if (f) Status(cnt)
                }
            });
            if (f) {
                b = r.pager.pages > b ? b + 1 : 1;
                top = setTimeout(function() {
                    $.post(location.protocol + "//" + location.hostname + "/chat/", {
                        ajax: 1,
                        action: "get_online",
                        page_num: b
                    }, function(r) {
                        Parse4Send(r, b)
                    }, "json")
                }, 1000)
            }
        };
    Stop = function() {
        if (f) {
            f = false;
            clearTimeout(tos);
            clearTimeout(top);
            sentids = ",";
            inprogress = ",";
            queue = []
        }
        Status(cnt);
        tinfo.text("Рассылка остановлена").css("color", "")
    };
    storage = storage ? $.parseJSON(storage) || {} : {};
    if (typeof storage.black == "undefined") storage = {
        black: {},
        goal: "online",
        af: 30,
        at: 100,
        text: ""
    };
    MessHandle = function(c, d, e) {
        switch (c.type) {
            case "init":
                e({
                    name: name,
                    runned: f,
                    storage: storage
                });
                break;
            case "save":
                storage = c.storage;
                SaveStorage();
                break;
            case "start":
                if (!f) {
                    f = true;
                    sentids = ",";
                    inprogress = ",";
                    if (storage.goal == "online") {
                        $("div.chat-contact-list .chat-contact-item-name").each(function() {
                            inprogress += parseInt($("span", this).text().match(/(\d+)$/)[1]) + ","
                        });
                        $.post(location.protocol + "//" + location.hostname + "/chat/", {
                            ajax: 1,
                            action: "get_online",
                            page_num: 1
                        }, function(r) {
                            Parse4Send(r, 1)
                        }, "json")
                    } else {
                        var q = $("div.chat-contact-list .chat-contact-item-name").each(function() {
                            var b = parseInt($("span", this).text().match(/(\d+)$/)[1]);
                            if (b > 0 && inprogress.indexOf("," + b + ",") == -1 && sentids.indexOf("," + b + ",") == -1 && !(b in storage.black)) {
                                inprogress += b + ",";
                                queue.push({
                                    id: b,
                                    t: storage.text.replace(/{name}/ig, $("a", this).text()),
                                    F: function(a) {
                                        if (a) {
                                            sentids += b + ",";
                                            ++cnt
                                        }
                                        Status(cnt)
                                    }
                                });
                                Status(cnt)
                            }
                        }).size();
                        if (q == 0) {
                            alert("Нечего рассылать");
                            f = false;
                            break
                        }
                    }
                    StartSender();
                    if (f) tinfo.text("Идет рассылка").css("color", "green")
                }
                e(true);
                break;
            case "stop":
                Stop();
                e(true);
                break
        }
    }
})(jQuery);