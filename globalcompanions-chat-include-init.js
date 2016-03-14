(function($){
	MessHandle=function(obj,sender,CB)
	{
		switch(obj.type)
		{
			case "init":
				CB({
					name:name,
					runned:false,
					storage:{   }
				});
			break;
			default:
				CB(false);
		}
	}
	
})(jQuery);