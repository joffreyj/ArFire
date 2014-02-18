		var map;
		var initialExtent;
		var floatPane;
		var mapinfofp;
		var printinfofp;
		var theStore;
		var countyStore;
		var overviewMap;
		var navToolbar;
		var zVar="";
      require([
        "esri/map", 
        "esri/dijit/OverviewMap",
		"esri/geometry/Extent", 
		"esri/tasks/IdentifyTask", 
		"esri/tasks/IdentifyParameters", 
		"esri/SpatialReference", 
		"esri/InfoTemplate", 
		"esri/dijit/Popup", 
		"esri/symbols/SimpleFillSymbol",
		"esri/symbols/SimpleLineSymbol",
		"dijit/form/Button", 
		"esri/layers/ArcGISDynamicMapServiceLayer", 
		"esri/layers/FeatureLayer",
		"esri/toolbars/navigation",
		
		//"modules/HomeButton",
		"dojox/layout/Dock",
		"dojox/layout/ResizeHandle",
		"dijit/layout/AccordionContainer",
		"dojox/layout/ContentPane",
		"dijit/form/FilteringSelect",
		"dojo/parser",
		"dojox/layout/FloatingPane",
		"esri/dijit/Print",
		"esri/tasks/QueryTask",
		"esri/tasks/query",
		"esri/tasks/FindTask",
		"esri/tasks/FindParameters",
		"dojo/data/ItemFileReadStore",
		"dojo/dom",
		"dojo/dom-class",
		"dojo/mouse",
		"dojo/query",
		"dojo/dom-attr",
		"dijit/form/RadioButton",
		"dojo/fx/Toggler",
		"dojo/on",
		"dojo/_base/declare",
		"dojox/widget/DialogSimple",
		"dojo/domReady!"
      ], function(
        Map, OverviewMap, InitialExtent, IdentifyTask, IdentifyParameters, SpatialReference, InfoTemplate, Popup, SimpleFillSymbol, SimpleLineSymbol, Button, 
        ArcGISDynamicMapServiceLayer, FeatureLayer, Navigation,	
        //HomeButton, 
        Dock, ResizeHandle, AccordionContainer, ContentPane, FilteringSelect, parser, 
        FloatingPane, Print, QueryTask, query, FindTask, FindParameters, ItemFileReadStore, dom, domClass, mouse, djQuery, domAttr, RadioButton, Toggler, on, declare, Dialog
      ) {
        parser.parse();
			
		
		initialExtent = new InitialExtent(172209.475904854, 3601359.1077277837, 985642.8725089643,  4064083.0555859907, new SpatialReference({
                    wkid: 26915  
        }));
		
        map = new Map("mapDiv", { 
            logo:false,
            extent: initialExtent,
            slider: false,
            //basemap: "national-geographic",
            //center: [-92.541, 34.70],
            zoom: 8
        });
        
		var infoTemplate = new InfoTemplate("${NAME10}", "County:  ${NAME10}");
		
		var Ar_Fire_Distrcts = new ArcGISDynamicMapServiceLayer("http://argis.ualr.edu/ieagis/rest/services/Ar_Fire_Distrcts/MapServer", {
			id: 'Ar_Fire_Distrcts',
			outFields: ["*"],
			infoTemplate: infoTemplate,
			opacity: 0.8
		});        
			
		map.on("load", initOperationalLayer);
		map.addLayer(Ar_Fire_Distrcts);
		map.on("click", executeIdentifyTask);
		//s1=dojo.byId('srchTool');
		
        function initOperationalLayer() {
            toggler.hide();
            
			navToolbar = new Navigation(map);
			dojo.connect(navToolbar, "onExtentHistoryChange", extentHistoryChangeHandler);
            extentHistoryChangeHandler();
			/*var zoomInDiv = djQuery(".esriSimpleSliderIncrementButton");
			domAttr.set(zoomInDiv[0],"title","Zoom in");
			var zoomOutDiv = djQuery(".esriSimpleSliderDecrementButton");
			domAttr.set(zoomOutDiv[0],"title","Zoom out");*/
			
			//Create Find Task using Post code layer
			findTask = new FindTask("http://argis.ualr.edu/ieagis/rest/services/Ar_Fire_Distrcts/MapServer");
			//Create the find parameters
			findParams = new FindParameters();
			findParams.returnGeometry = true;
			findParams.outSpatialReference = map.spatialReference;
			
			//floating window for map search
			mapinfofp = new FloatingPane({
                id: 'mapinfofp',
                title: 'Search',
                resizable: false,
                closable: false,
                dockable: false,
                dockTo: dojox.layout.dock,
                style: 'position:absolute;top:90px;left:80px;width:320px;height:135px;visibility:hidden;overflow:hidden;',
                href: 'accord.html',
                preload: true
			},dojo.byId("mapinfofp"));

			
			mapinfofp.on('load', function(){			
                queryDistTask = new QueryTask("http://argis.ualr.edu/ieagis/rest/services/Ar_Fire_Distrcts/MapServer/1");
                //build query filter
                queryDist = new query();
                queryDist.returnGeometry = false;
                queryDist.outFields = ["OBJECTID_1","NAME"];
                runDistQuery();
                
                queryTask = new esri.tasks.QueryTask("http://argis.ualr.edu/ieagis/rest/services/Ar_Fire_Distrcts/MapServer/2");
                //build query filter
				query = new query();
				query.returnGeometry = false;
				query.outFields = ["OBJECTID","NAME10"];					
				runQuery();	

			});		

			mapinfofp.on('show', function () {
				mapinfofp.bringToTop();
			});

			//floating window for print
			printinfofp = new FloatingPane({
                id: 'printinfofp',
                title: 'Print',
                resizable: false,
                closable: false,
                dockable: false,
                dockTo: dojox.layout.dock,
                style: 'position:absolute;top:226px;left:80px;width:320px;height:200px;visibility:hidden;overflow:hidden;',
                href: 'printer.html',
                preload: true
			},dojo.byId("printinfofp"));

			printinfofp.on('show', function () {
                domAttr.set("print","style","background-color:#ccc");
                printinfofp.bringToTop();
			});
			
			printinfofp.on('load', function(){			
				createPrintDijit(dojo.byId('map_name').value);
				printinfofp.bringToTop();
			});	
			
			overviewMap = new OverviewMap({
                map: map,
                attachTo: "bottom-right",
                expandFactor: 3,
                visible: false
            }, dojo.byId("overviewDiv"));
            overviewMap.startup();
        }
        
        var toggler = new Toggler({
            node: "ovWin"
        });
          
        on(dom.byId("expandOV"), "click", function(e){
            toggler.show();
            domAttr.set("expandOV","style","visibility:hidden");
            domAttr.set("collapseOV","style","visibility:visible");
            domClass.add("overviewbtn","active");
        });
        
        on(dom.byId("collapseOV"), "click", function(e){
            toggler.hide();
            domAttr.set("expandOV","style","visibility:visible");
            domAttr.set("collapseOV","style","visibility:hidden");
            domClass.remove("overviewbtn","active");
        });
        
        on (dom.byId("overviewbtn"),"click", function(e){
            if(dojo.style("collapseOV", "visibility") == "visible"){
                domClass.remove("overviewbtn","active");
                collapseOV.click();
            }else{
                domClass.add("overviewbtn","active");
                expandOV.click();
            }  
        });
         
        var srchToggler = new Toggler({
            node: "mapinfofp"
        });
          
        on(dom.byId("mapinfobtn"), "click", function(e){
            if(dojo.style("mapinfofp", "visibility") == "visible"){
                domClass.remove("mapinfobtn","active");
                mapinfofp.hide();
            }else{
                domClass.add("mapinfobtn","active");
                mapinfofp.show();
            }    
        });
          
        var printToggler = new Toggler({
            node: "printinfofp"
        });
          
        on(dom.byId("printbtn"), "click", function(e){
            if(dojo.style("printinfofp", "visibility") == "visible"){
                domClass.remove("printbtn","active");
                printinfofp.hide();
            }else{
                domClass.add("printbtn","active");
                printinfofp.show();
            }    
        });
          
        on(dom.byId("zmout"),"click", function(e){
            disableTools();
            if(zVar!="Zout"){
                domClass.add("zmout","active");
                navToolbar.activate(esri.toolbars.Navigation.ZOOM_OUT);
                zVar="Zout";
            }else{
                zVar="";
            }
        });
          
        on(dom.byId("zminbtn"),"click", function(e){
            disableTools();
            if(zVar!="Zin"){
                domClass.add("zminbtn","active");
                navToolbar.activate(esri.toolbars.Navigation.ZOOM_IN);
                zVar="Zin";
            }else{
                  zVar="";
            }
        });
        
         on(dom.byId("homebtn"),"click", function(e){
            disableTools();
            if(zVar!="Home"){
                map.graphics.clear();
				map.infoWindow.hide();
                map.setExtent(initialExtent);
                zVar="Home";
            }else{
                  zVar="";
            }
        });
        
        var tools=["homebtn","panbtn","zminbtn","zmout","prevbtn","nextbtn","mapinfobtn","printbtn","overviewbtn"];
        dojo.forEach(tools, function(item, index){
            on(dom.byId(item), mouse.enter, function(){
                domClass.add(item, "hover");
            });
            
            on(dom.byId(item), mouse.leave, function(){
                domClass.remove(item, "hover");
            });
        });  

        on(dom.byId("panbtn"),"click", function(e){
            disableTools();
            if(zVar != "pan"){
                domClass.add("panbtn","active");
                navToolbar.activate(esri.toolbars.Navigation.PAN);
                zVar="pan";
            }else{
                  zVar="";
            }
        });

        on(dom.byId("prevbtn"),"click", function(e){
            disableTools();
            navToolbar.zoomToPrevExtent();
            zVar="";
        });
        
        on(dom.byId("nextbtn"),"click", function(e){
            disableTools();
            navToolbar.zoomToNextExtent();
            zVar="";
        });

        function disableTools(){
            navToolbar.deactivate();
            dojo.forEach(tools, function(item, index){
                domClass.remove(item,"active");
            });
        }
        function extentHistoryChangeHandler() {
            if(navToolbar.isFirstExtent()){
                domClass.add("prevbtn","prevbtn_disabled");
                on(dom.byId("prevbtn"), mouse.enter, function(){
                    domClass.remove("prevbtn", "hover");
                });
            }else{
                domClass.remove("prevbtn","prevbtn_disabled");
                on(dom.byId("prevbtn"), mouse.enter, function(){
                    domClass.add("prevbtn", "hover");
                });
            }
            if(navToolbar.isLastExtent()){
                domClass.add("nextbtn","nextbtn_disabled");
                on(dom.byId("nextbtn"), mouse.enter, function(){
                    domClass.remove("nextbtn", "hover");
                });
            }else{
                domClass.remove("nextbtn","nextbtn_disabled");
                on(dom.byId("nextbtn"), mouse.enter, function(){
                    domClass.add("nextbtn", "hover");
                });            
            }
        }
        var dlg = new Dialog({ title:"About Arkansas Fire Districts", href:"info.html" });
        dlg.startup();
            
        /*on(dom.byId("infobtn"), "click", function(e){
            dlg.show();
        });*/
          
		function createPrintDijit(printTitle) {
			var layoutTemplate, templateNames, mapOnlyIndex, templates;
							
			// create an array of objects that will be used to create print templates
			var layouts = [
            { 
				"name": "Letter ANSI A Landscape", 
				"label": "Landscape (PDF)", 
				"format": "pdf", 
				"options": { 
                "legendLayers": [], // empty array means no legend
                "scalebarUnit": "Miles",
                "titleText": printTitle + ", Landscape PDF" 
				}
            }, {
				"name": "Letter ANSI A Portrait", 
				"label": "Portrait (Image)", 
				"format": "jpg", 
				"options":  { 
                "legendLayers": [],
                "scaleBarUnit": "Miles",
                "titleText": printTitle + ", Portrait JPG"
				}
            },{
                label: "Map Only (PNG)",
                format: "PNG32",
                layout: "MAP_ONLY",
                preserveScale: true,
                exportOptions: {
                  width: 1024,
                  height: 768,
                  dpi: 96
                }
              }
			];
			
			// create the print templates, could also use dojo.map
            templates = [];
			dojo.forEach(layouts, function(lo) {
                var t = new esri.tasks.PrintTemplate();
                t.layout = lo.name;
                t.label = lo.label;
                t.format = lo.format;
                t.preserveScale = false;
                t.layoutOptions = lo.options;
                templates.push(t);
			});

			printer = new esri.dijit.Print({
                "map": map,
                "templates": templates,
                "asynch":	false,
                url: "http://argis.ualr.edu/ieagis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
			}, dojo.byId("printButton"));
			printer.startup();			
			dojo.connect(printer, "onPrintStart", function(){
				this.templates[0].layoutOptions.titleText = dojo.byId("map_name").value;
			});
								
		}

		function executeIdentifyTask(evt) {	
			var popup = new Popup({
				fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([255,255,0,0.25]))
			}, dojo.create("div"));			
			
			var identifyTask = new IdentifyTask("http://argis.ualr.edu/ieagis/rest/services/Ar_Fire_Distrcts/MapServer");

			var identifyParams = new IdentifyParameters();
			identifyParams.tolerance = 10;
			identifyParams.returnGeometry = true;
			identifyParams.width = map.width;
			identifyParams.height = map.height;
					
			if(evt.mapPoint){
				identifyParams.geometry = evt.mapPoint;
			}else{
				identifyParams.geometry = evt.geometry;
			}	
			identifyParams.mapExtent = map.extent;
			identifyParams.layerIds=[1,2]; //identifyParams.layerIds = [2]; //	
			var deferred = identifyTask.execute(identifyParams);

			deferred.addCallback(function(response) {     
            // response is an array of identify result objects    
            // Let's return an array of features.
            return dojo.map(response, function(result) {
            var feature = result.feature;
                feature.attributes.layerName = result.layerName;
                var template = new InfoTemplate(); 
                template.setTitle(feature.attributes.layerName);
                //alert(result.layerName);
                switch (result.layerName){
                case 'County':
                    template.setContent(getCountyContent);
                    feature.setInfoTemplate(template);
                    break;
                case 'Fire Districts':
                    template.setContent(getFDContent);
                    feature.setInfoTemplate(template);
                    break;
                case 'Parcels':
                    template.setContent(getParcelContent);
                    feature.setInfoTemplate(template);
                    break;							
                default:
                    return false;
                }					
                return feature;
            });
            });

			// InfoWindow expects an array of features from each deferred
			// object that you pass. If the response from the task execution 
			// above is not an array of features, then you need to add a callback
			// like the one above to post-process the response and return an
			// array of features.
			map.infoWindow.setFeatures([ deferred ]);
			if(evt.mapPoint){
				map.infoWindow.show(evt.mapPoint);
			}else{
				map.infoWindow.show(evt.geometry);
			}	
		}
		
        function runQuery(){
			query.where = "OBJECTID<>0";
			//execute query
			queryTask.execute(query, qryResults);
		}	
		function qryResults(results){
		
            //Populate the dropdown list box with unique values
			values = [];
			testVals = {};
			
			features = results.features;
			dojo.forEach (features, function(feature) {
				curName = feature.attributes.NAME10;
				if (!testVals[curName]) {
					testVals[curName] = true;
					values.push({"OBJECTID":feature.attributes.OBJECTID,"NAME10":feature.attributes.NAME10});
				}
			});
			
			dataItems = {
                identifier: "OBJECTID",
                label: "NAME10",
                items: values
			};
			
			countyStore = new dojo.data.ItemFileReadStore({data:dataItems});

			dijit.byId("countySearch").set("store", countyStore);	
		}
     
		function runDistQuery(){				
			queryDist.where = "OBJECTID_1<>0";
			//execute query
			queryDistTask.execute(queryDist, qryDistResults);
		}
		function qryDistResults(results){		
			//Populate the dropdown list box with unique values
			values = [];
			testVals = {};
			
			features = results.features;
			dojo.forEach (features, function(feature) {
				curName = feature.attributes.NAME;
				if (!testVals[curName]) {
					testVals[curName] = true;
					values.push({"OBJECTID_1":feature.attributes.OBJECTID_1,"NAME":feature.attributes.NAME});
				}
			});
			
			dataItems = {
                identifier: "OBJECTID_1",
                label: "NAME",
                items: values
			};
			
			theStore = new ItemFileReadStore({data:dataItems});

			dijit.byId("distSearch").set("store", theStore);	
		}	 

		function getCountyContent(graphic){
			content = "<table>";
			content += "<tr><td>County:</td><td>"+ graphic.attributes.NAME10+" </td></tr>";				
			content += "<tr><td>FIPS:</td><td>"+graphic.attributes.STATEFP10 + graphic.attributes.COUNTYFP10+" </td></tr>";				
			content += "</table>";
			return content;
		}
		
		function getFDContent(graphic){
			content = "<table>";
			content += "<tr><td>Fire District:</td><td>"+ graphic.attributes.NAME+" </td></tr>";
			content += "<tr><td>County:</td><td>"+ graphic.attributes.COUNTY+" </td></tr>";
			content +="<tr><td>LOPFI Member:</td><td>"+ graphic.attributes.LOPFI_MBR +"</td></tr>";
			content +="<tr><td>Population:</td><td>"+ graphic.attributes.Population  +"</td></tr>";
			content +="<tr><td>Area:</td><td>"+graphic.attributes.Area   +" Square Miles</td></tr>";				
			content += "</table>";
			return content;
		}
		
		function resetMap(){
			dojo.byId('map_name').value = "AR Fire Districts";
			dojo.byId('countySearch').value = "";
			dojo.byId('distSearch').value = "";			
			map.setExtent(initialExtent);
			map.graphics.clear();
			map._layers.Ar_Fire_Distrcts.setVisibleLayers([0,1,2]);
		}
 });			