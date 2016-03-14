$(function(){
	if(window.location.href.indexOf("cgi-bin/user/")!=-1){
		var bt = $('.gallery_cover_list li .startchatbutton');
		$.each(bt,function(i,v){
			var cl = $(v).attr('onclick').split(',');
			cl = cl[0].replace("popup=window.open('",'').replace("'",'');
			$(v).after('<a href="'+cl+'" target="_blank" class="startchatbutton" style="display: block;text-align: center;">open chat</a>');
			$(v).remove();	
		});
	}
});