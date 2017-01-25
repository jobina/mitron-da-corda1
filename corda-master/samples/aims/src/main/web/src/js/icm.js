$(document).ready(function(){


   $("#createTrade").addClass("displayNone");
   $("#validationchanges").addClass("displayNone");
   $("#calculate").hide();
   $("#portfolioSummary").addClass("displayNone");

   $('#ps').click(function() {

		$('#ps').parent().addClass("active");
		$('#ts').parent().removeClass("active");
		$('#validationMenu').parent().removeClass("active");

		$("#createTrade").addClass("displayNone");
		$("#portfolioSummary").removeClass("displayNone");
		$("#validationchanges").addClass("displayNone");
		$("#summaryColumns").jsGrid('loadData');

  });

    $('#ts').click(function() {

			$('#ts').parent().addClass("active");
			$('#ps').parent().removeClass("active");
			$('#validationMenu').parent().removeClass("active");

			$("#createTrade").removeClass("displayNone");
			$("#portfolioSummary").addClass("displayNone");
			$("#validationchanges").addClass("displayNone");


  });

  $('#validationMenu').click(function() {

			$('#validationMenu').parent().addClass("active");
			$('#ps').parent().removeClass("active");
			$('#ts').parent().removeClass("active");


			$("#createTrade").addClass("displayNone");
			$("#portfolioSummary").addClass("displayNone");
			$("#validationchanges").removeClass("displayNone");
			 validatePage();
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
      url: "/api/aims/whoami",
      dataType: "json",
      success: function(resultData){

		  console.log(resultData);
		  var clients = resultData['counterparties'];
		  var clientCombo = $("#client");
		  clientCombo.empty();
		  for(var i=0;i< clients.length;i++) {

		     clientCombo.append($('<option>', {
											value: clients[i]['id'],
											text: clients[i]['text']
										}));
		  }
		   $('#client').selectpicker('refresh');
		   var name = resultData["self"]["text"];
		   $("#userId").text(name);
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
        	                    url: "/api/aims/"+clientVal+"/trades",
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
     var putUrl = "/api/aims/"+val+"/trades";

     var tradeDate = $("#tradeDate").val();
	 var convention = $("#convention").val();
	 var effectiveDate = $("#effectiveDate").val();

	 var terminationDate = $("#terminationDate").val();
	 var description = $("#description").val();
	 var notional = $("#notional1").val();

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

	 //$("#calculate").click();

});

function validatePage(){
	 $("#validationchanges").removeClass("displayNone");

		var val = $("#client").val();
		var url = "/api/aims/"+val+"/portfolio/valuations/calculate";
		var data ={valuationDate:"2016-06-06"};
	   $.ajax({
		  type: "POST",
		  contentType: "application/json",
		  url: url,
		  data:JSON.stringify(data),
		  dataType: "json",
		  success: function(resultData){
			renderPortfolioCalculation(resultData);
            		 renderMarketData(resultData['marketData']);
            		 postData(resultData['initialMargin']);
            		 confirmationId(resultData['confirmation']);
            		 sensivitiesSet(resultData['sensitivities']);
		  },
		  failure:function(data) {
		    console.log(data);
		  }
		});


	 }

function setAgreement(value, img, para) {
   if(value === false) {
      img.attr("src","img/incorrect.jpg");
	  img.attr("height","50");
	  img.attr("width","50");
	  para.text("Disagreed with counterparty");
   } else {
      img.attr("src","img/checkbox.png");
	  img.attr("height","50");
	  img.attr("width","50");
	  para.text("Agreed with counterparty");
    }
}


function renderPortfolioCalculation(response) {

var portfolio = response['portfolio'];
var variables = $("#portfolioCalculation").find("tbody");
variables.empty();
 var table = $(" <tr> <th scope='row'>IR/FX</th> <td>"+portfolio['IRFX']+"</td></tr><tr> <th scope='row'>Commodity</th> <td>"+portfolio['commodity']+"</td></tr><tr> <th scope='row'>Credit</th> <td>"+portfolio['credit']+"</td></tr><tr> <th scope='row'>Equity</th> <td>"+portfolio['equity']+"</td></tr><tr> <th scope='row'>Total</th> <td><b>"+portfolio['total']+"</b></td></tr>");

 table.appendTo(variables);

 var para = $("#portfolioImg").find("p");
 var img = $("#portfolioImg").find("img");
 var value = portfolio['agreed'];

 setAgreement(value,img,para);
}

function renderMarketData(marketData) {

var variables = $("#marketDataTbl").find("tbody");
variables.empty();
var values = marketData['yieldCurves']['values']
var rowStr="";
for(var i=0;i<values.length;i++) {
  rowStr += "<tr><td>"+values[i]['tenor']+"</td><td>"+values[i]['rate']+"</td></tr>"
}
 var table = $(rowStr);
 table.appendTo(variables);

 renderfixingMarketData(marketData['fixings']);

  var para = $("#marketDataImg").find("p");
 var img = $("#marketDataImg").find("img");
 var value = marketData['agreed'];

 setAgreement(value,img,para);
}

function renderfixingMarketData(fixing) {

var variables = $("#marketDataFixing").find("tbody");
variables.empty();
var values = fixing['values']
var rowStr="";
for(var i=0;i<values.length;i++) {
  rowStr += "<tr><td>"+values[i]['tenor']+"</td><td>"+values[i]['rate']+"</td></tr>"
}
 var table = $(rowStr);
 table.appendTo(variables);
}


function sensivitiesSet (sensivities) {

var b1 = sensivities["curves"]["EUR-DSCON-BIMM"];
var b2 = sensivities["curves"]["EUR-EURIBOR3M-BIMM"];
var variables = $("#riskDeltaTb").find("tbody");
variables.empty();
var tableDataStr = $(" <tr><td>3M</td><td>"+b1["3M"]+"</td><td>"+b2["3M"]+"</td></tr>  <tr><td>6M</td><td>"+b1["6M"]+"</td><td>"+b2["6M"]+"</td></tr> <tr><td>1Y</td><td>"+b1["1Y"]+"</td><td>"+b2["1Y"]+"</td></tr> <tr><td>2Y</td><td>"+b1["2Y"]+"</td><td>"+b2["2Y"]+"</td></tr>  <tr><td>3Y</td><td>"+b1["3Y"]+"</td><td>"+b2["3Y"]+"</td></tr>  <tr><td>5Y</td><td>"+b1["5Y"]+"</td><td>"+b2["5Y"]+"</td></tr>  <tr><td>10Y</td><td>"+b1["10Y"]+"</td><td>"+b2["10Y"]+"</td></tr>  <tr><td>15Y</td><td>"+b1["15Y"]+"</td><td>"+b2["15Y"]+"</td></tr>  <tr><td>20Y</td><td>"+b1["20Y"]+"</td><td>"+b2["20Y"]+"</td></tr>  <tr><td>30Y</td><td>"+b1["30Y"]+"</td><td>"+b2["30Y"]+"</td></tr> ");
 tableDataStr.appendTo(variables);


 var para = $("#riskDeltaImg").find("p");
 var img = $("#riskDeltaImg").find("img");
 var value = sensivities['agreed'];

 setAgreement(value,img,para);
}


function postData(initalMargin) {

var post = initalMargin['post'];
var variables = $("#postTable").find("tbody");
variables.empty();
var tableDataStr = $(" <tr> <th scope='row'>IR/FX</th> <td>"+post['IRFX']+"</td></tr><tr> <th scope='row'>Commodity</th> <td>"+post['commodity']+"</td></tr><tr> <th scope='row'>Credit</th> <td>"+post['credit']+"</td></tr><tr> <th scope='row'>Equity</th> <td>"+post['equity']+"</td></tr><tr> <th scope='row'>Total</th> <td><b>"+post['total']+"</b></td></tr>");
 tableDataStr.appendTo(variables);
 callData(initalMargin);

  var para = $("#initialMarginImg").find("p");
 var img = $("#initialMarginImg").find("img");
 var value = initalMargin['agreed'];

 setAgreement(value,img,para);
}

function callData(initalMargin) {

var post = initalMargin['call'];
var variables = $("#callTable").find("tbody");
variables.empty();
var tableDataStr = $(" <tr> <th scope='row'>IR/FX</th> <td>"+post['IRFX']+"</td></tr><tr> <th scope='row'>Commodity</th> <td>"+post['commodity']+"</td></tr><tr> <th scope='row'>Credit</th> <td>"+post['credit']+"</td></tr><tr> <th scope='row'>Equity</th> <td>"+post['equity']+"</td></tr><tr> <th scope='row'>Total</th> <td><b>"+post['total']+"</b></td></tr>");
 tableDataStr.appendTo(variables);

}

function confirmationId(confirm) {



 var para = $("#confirmImg").find("p");
 var img = $("#confirmImg").find("img");
 var value = confirm['agreed'];
 var display = confirm["hash"]
$("#confirmationId").text(display);
 setAgreement(value,img,para);

}

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
  $("<tr> <td><center>Payer</td><td><center>"+fixedLeg['fixedRatePayer']+"</td><td><center>"+floatingLeg['floatingRatePayer']+"</td></tr>").appendTo(tbody);
   $("<tr> <td><center>Notional</td><td><center>"+fixedLeg['notional']['quantity']+" "+fixedLeg['notional']['token']+"</td><td><center>"+floatingLeg['notional']['quantity']+" "+floatingLeg['notional']['token']+"</td></tr>").appendTo(tbody);
  $("<tr> <td><center>PaymentFrequency</td><td><center>"+fixedLeg['paymentFrequency']+"</td><td><center>"+floatingLeg['paymentFrequency']+"</td></tr>").appendTo(tbody);
  $("<tr> <td><center>Effective From</td><td><center>"+fixedLeg['effectiveDate']+"</td><td><center>"+floatingLeg['effectiveDate']+"</td></tr>").appendTo(tbody);
  $("<tr> <td><center>Fixed Rate/Index</td><td><center>"+fixedLeg['fixedRate']['value']+"</td><td><center>"+floatingLeg['index']+"</td></tr>").appendTo(tbody);
  $("<tr> <td><center>Terminates</td><td><center>"+fixedLeg['terminationDate']+"</td><td><center>"+floatingLeg['terminationDate']+"</td></tr>").appendTo(tbody);

}



function portfolioSummary(val) {

    var url = "/api/aims/"+val+"/portfolio/summary";
    $.ajax({
         type: "GET",
         url: url,
         dataType: "json",
         success: function(resultData){
                var notional = resultData['notional'];
                var trades = resultData['trades'];
				$("#noofTrades").text("No of Trades: "+trades);
				$("#notional").text("Net Amount: "+notional);
         }
      });
	  var aggregateUrl = "/api/aims/"+val+"/portfolio/aggregated";
	   $.ajax({
         type: "GET",
         url: aggregateUrl,
         dataType: "json",
         success: function(resultData){
                var im = (resultData['im'] == undefined)?0:resultData['im'];
                var mtm = (resultData['mtm'] == undefined)?0:resultData['mtm'];
				$("#im").text("IM: "+im);
				$("#mtm").text("MTM: "+mtm);
         }
      });

}
