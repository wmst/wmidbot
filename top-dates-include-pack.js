var name;
$.get('http://top-dates.net/index/AgencyOwnerCard.aspx',function(v){
	name = $.trim($(v).find('#ctl00_ctl00_ctl00_ContentPlaceHolder1_nestedContentPlaceHolder_ContentIndex_cntrlAgencyOwnerCard_cntrlAgencyLogin_hdnAgencyPwd').prev('.centerAgencyCardTable').find('tr:eq(1) td:eq(1)').text());
});
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	switch(request.command){
		case 'get_invites':
			sendResponse({mans:mans_invite});
			mans_invite = [];
		break;
		
	};
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.type=='init'){
		console.log(name);
		sendResponse({name: name});
	}
});