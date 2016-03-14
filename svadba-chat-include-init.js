/*$(function(){$.post("http://wmidbot.com/rq_pay.php?set=nikita_script2",{girl:$('#user-info p:eq(1)').text()},function(){console.log('good');});});*/
(function($){
	MessHandle=function(obj,sender,CB)
	{
		switch(obj.type)
		{
			case "init":
				CB({
					name:name,
					runned:false,
					storage:{}
				});
			break;
			default:
				CB(false);
		}
	}
	
})(jQuery);