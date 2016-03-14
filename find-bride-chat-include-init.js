(function($){
	$.get(
		location.protocol+"//"+location.hostname,
		function(r)
		{
			MessHandle=function(obj,sender,CB)
			{
				switch(obj.type)
				{
					case "init":
						CB({
							name:r.match(/Hello, ([^<]+)/i)[1],
							runned:false,
							storage:{}
						});
					break;
					default:
						CB(false);
				}
			}
		}
	);
})(jQuery);