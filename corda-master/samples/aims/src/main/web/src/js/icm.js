$(document).ready(function(){


   $("#createTrade").addClass("displayNone");
  // $("#portfolioSummary").addClass("displayNone");
   
   $('#ps').click(function() {	

	$('#ps').parent().addClass("active");
	$('#ts').parent().removeClass("active");
	$('#validationMenu').parent().removeClass("active");
	
	$("#createTrade").addClass("displayNone");
    $("#portfolioSummary").removeClass("displayNone");
	
  $("#summaryColumns").jsGrid('loadData');
  });
  
    $('#ts').click(function() {	

	$('#ts').parent().addClass("active");
	$('#ps').parent().removeClass("active");
	$('#validationMenu').parent().removeClass("active");
	
	$("#createTrade").removeClass("displayNone");
    $("#portfolioSummary").addClass("displayNone");

  });

  
  $("#client").on('change', function() {
		   $("#summaryColumns").jsGrid('loadData');	
	   });
/*var response = {
 fixedLeg : {
   fixedRatePayer : "Bank B",
   notional : {
     token : "EUR",
     quantity : 1000000.0
   },
   paymentFrequency : "P12M",
   effectiveDate : "2017-01-27",
   terminationDate : "2021-01-27",
   fixedRate : {
     value : 0.015
   },
   paymentRule : "PERIOD_END",
   calendar : [ "TODO" ],
   paymentCalendar : { }
 },
 floatingLeg : {
   floatingRatePayer : "Bank A",
   notional : {
     token: "EUR",
     quantity : 1000000.0
   },
   paymentFrequency : "P6M",
   effectiveDate : "2017-01-27",
   terminationDate : "2021-01-27",
   index : "EUR-EURIBOR-6M",
   paymentRule : "PERIOD_END",
   calendar : [ "TODO" ],
   paymentCalendar : [ "TODO" ],
   fixingCalendar : { }
 },
 common : {
   valuationDate : "2017-01-27",
   hashLegalDocs : "DD7909E92DBD99BB4BEB6EDCA0604B49AF200D373B352016C1AA15781EF6E269",
   interestRate : {
     name : "TODO",
     oracle : "TODO",
     tenor : {
       name : "TODO"
     }
   }
 },
 ref : "407"
};*/

   $.ajax({
      type: "GET",
      url: "/api/simmvaluationdemo/whoami",
      dataType: "json",
      success: function(resultData){

		  console.log(resultData);
		  var clients = resultData['counterparties'];
		  var clientCombo = $("#client");
		  for(var i=0;i< clients.length;i++) {
		     clientCombo.append($('<option>', {
											value: clients[i]['id'],
											text: clients[i]['text']
										}));
		  }
		   $('#client').selectpicker('refresh');
      }
   });
   
   
   $("#tradeConfirm").click(function(){
   
       confirmation(fixedResponse);
   });
   
   
   $("#summaryColumns").jsGrid({
        width: "100%",
        height: "300px",
        sorting: true,
        paging: true,
        fields: [
            { name: "id", type: "text", title: "ID",width:50},
            { name: "product", type: "text",title: "Product" },
            { name: "buySell", type: "text",title: "Type",width:70 },
			{ name: "tradeDate", type: "text", title: "Trade Date"},
            { name: "effectiveDate", type: "text", title: "Effective Date"},
			{ name: "maturityDate", type: "text", title: "Maturity Date"},
			{ name: "currency", type: "text", title: "Currency"},
			{ name: "notional", type: "text", title: "Notional"},
			{ name: "im", type: "text", title: "IM Contribution",width:150},
			{ name: "mtm", type: "text", title: "PV"},
			{ name: "marginedText", type: "text", title: "Included in summary"},            
        ],
		controller: {
                    loadData: function() {
                        var d = $.Deferred();
                    	var clientVal = $('#client option:selected').val();

                    	if(clientVal!==undefined) {
                    		
                    		
                    	    $.ajax({
        	                    url: "/api/simmvaluationdemo/"+clientVal+"/trades",
        	                    dataType: "json",
        	                    contentType: 'application/json',
        	                    method:'GET'
        	                }).done(function(response) {
        	                	
        	                	/*$("#invoicedetailContainer").LoadingOverlay("hide");
        	                	$("#invoicedetailContainer1").LoadingOverlay("hide");*/
								d.resolve(response);
								portfolioSummary(clientVal);
        	                });
        	                

                    	}
                        return d.promise();

                    }
                }
    });
   
   $("#next").click(function(){
   
     var val = $("#client").val();
     var putUrl = "/api/simmvaluationdemo/"+val+"/trades";
	       
     var tradeDate = $("#tradeDate").val();		   
	 var convention = $("#convention").val();
	 var effectiveDate = $("#effectiveDate").val();	

	 var terminationDate = $("#terminationDate").val();	
	 var description = $("#description").val();	
	 var notional = $("#notional").val();	

	 var buySell = $("#buySell").val();	
	 var id =  Math.floor(Math.random()*89999+10000);;	
	 var fixedRate = 0.015;	 
	 
	 var trade = {
	     buySell:buySell,
		 id:id,
		 fixedRate:fixedRate,
		 notional:notional,
		 convention:convention,
		 description:description,
		 endDate:terminationDate,
		 startDate:effectiveDate,
		 tradeDate:tradeDate
	 };
	 
	 console.log(trade);
		 $.ajax({
		  type: "PUT",
		  contentType: "application/json",
		  url: putUrl,
		  data:JSON.stringify(trade),
		  dataType: "json",
		  success: function(resultData){
			fixedLeg(id,putUrl);
		  },
		  failure:function(data) {
		    console.log(data);
		  }
		});
   
     });
});


function fixedLeg(id,url) {
  
  var getUrl = url+"/"+id;
   $.ajax({
      type: "GET",
      url: getUrl,
      dataType: "json",
      success: function(resultData){
		  processOutput(resultData);
		  fixedResponse = resultData['common'];
      }
   });
}

function confirmation(response) {
  
  $("#confirmationPanelBody").empty();
  $("#confirmationPanelBody").append()
  
   var statusRow = "<tr><td>Status</td><td>Confirmed</td></tr>";
    var tradeId = statusRow+"<tr><td>Trade ID</td><td></td></tr>";
	  var valuationD = tradeId+"<tr><td>Valuation Date</td><td>"+response['valuationDate']+"</td></tr>";
    var legalDocs = valuationD+"<tr><td>Legal Document Hash</td><td>"+response['hashLegalDocs']+"</td></tr>";
  
  var obj = $("<table id= 'confirmTable' class='table table-striped'>"+
   "<tbody id='tbodyConfirmation'>"+legalDocs+"</tbody>");
  obj.appendTo("#confirmationPanelBody");
  

}

function processOutput(response){
   
   var fixedLeg = response['fixedLeg'];
   var floatingLeg = response['floatingLeg'];
   var tbody = $("#outputTable").find("tbody");
   tbody.empty();
  $("<tr> <td><center>Payer</td><td><center>"+fixedLeg['fixedRatePayer']+"</td><td><center>"+floatingLeg['floatingRatePayer']+"</td></tr>").appendTo("tbody");
   $("<tr> <td><center>Notional</td><td><center>"+fixedLeg['notional']['quantity']+" "+fixedLeg['notional']['token']+"</td><td><center>"+floatingLeg['notional']['quantity']+" "+floatingLeg['notional']['token']+"</td></tr>").appendTo("tbody");
  $("<tr> <td><center>PaymentFrequency</td><td><center>"+fixedLeg['paymentFrequency']+"</td><td><center>"+floatingLeg['paymentFrequency']+"</td></tr>").appendTo("tbody");
  $("<tr> <td><center>Effective From</td><td><center>"+fixedLeg['effectiveDate']+"</td><td><center>"+floatingLeg['effectiveDate']+"</td></tr>").appendTo("tbody");
  $("<tr> <td><center>Fixed Rate/Index</td><td><center>"+fixedLeg['fixedRate']['value']+"</td><td><center>"+floatingLeg['index']+"</td></tr>").appendTo("tbody");
  $("<tr> <td><center>Terminates</td><td><center>"+fixedLeg['terminationDate']+"</td><td><center>"+floatingLeg['terminationDate']+"</td></tr>").appendTo("tbody");

}

function portfolioSummary(val) {

    var url = "/api/simmvaluationdemo/"+val+"/portfolio/summary";
    $.ajax({
         type: "GET",
         url: url,
         dataType: "json",
         success: function(resultData){
                var notional = resultData['notional'];
                var trades = resultData['trades'];
				$("#noofTrades").text("No of Trades: "+trades);
				$("#notionalAmt").text("Net Amount: "+notional);
         }
      });
	  var aggregateUrl = "/api/simmvaluationdemo/"+val+"/portfolio/aggregated";
	   $.ajax({
         type: "GET",
         url: aggregateUrl,
         dataType: "json",
         success: function(resultData){
                var im = resultData['im'];
                var mtm = resultData['mtm'];
                if(im!==undefined) {
				$("#im").text("IM: "+im);
				}

				if(mtm!=undefined) {
				  $("#mtm").text("MTM: "+mtm);
				}
         }
      });

}