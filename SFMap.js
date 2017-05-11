
// ----------- Global Data ------------
var globalData = [], 
    currentClassObj,
    zoomLvl = 12


// Create the Google Map…
function initMap() {
   
    var overlay = new google.maps.OverlayView(),
        padding = 10,
        pinColor = "75ABBC",
        searchBoxes = [],
        getLocation,
        getValue



    var map = function() {

          //------------ initializing the map
        var map = new google.maps.Map(d3.select("#map").node(), {
                zoom: zoomLvl,
                center: new google.maps.LatLng(37.76487, -122.41948),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.LEFT_TOP,
                },
                streetViewControl: false
            })


        // Add the container when the overlay is added to the map.
        overlay.onAdd = function() {
            var layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .attr("class", "data-layer")

            // Remap data on every resize
            overlay.draw = function() {
                zoomLvl = map.getZoom()
                // console.log(zoomLvl)
                drawAllData()
            }
        }

        // Bind our overlay to the map…
        overlay.setMap(map)
        var that = this

            // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
            for (index in searchBoxes) {
                searchBoxes[index].setBounds(map.getBounds());
            }
        })

       
        return map
    }()



    //--------------- creating pins
    var createPin = function(color) {
        return new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + color,
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34));
    }

    var pinImage = createPin(pinColor) // taking off the # for the hex color


    // ------ FILTER FUNCTIONALITY ----------


    // combine datasets into GLOBAL DATA?
    // how to differentiate where the data comes from?

    // or switch which data = globalData 


    // example filter
    var testFilter = function(data) {
        var value = data.value,
            testValue = 1
        if (value === testValue) {
            return true;
        }
        return false;
    };


    var visualizeFilterResults = function(d) {
        if (testFilter(d)) {
            d3.select(this).style('visibility', 'visible');
        } else {
            d3.select(this).style('visibility', 'hidden');
        }
    };



    // // doesnt scale
    // // make data structure that has data, yes/no, type, functions
    // var setDataSets = function() {
    //     var data,
    //         type
    //     if (shouldShowIntersections) {
    //         data = intersectionData['data']
    //         getLocation = Intersection.location
    //         getValue = Intersection.value
    //         type = 'intersections'
    //         drawData(data, type, Intersection)
    //         addColorRange(data, type, Intersection)
    //     } else {
    //         type = 'intersections'
    //         drawData(null, type)
    //     }

    //     if (shouldShowParkingMeters) {
    //         data = parkingMeterData['data']
    //         getLocation = ParkingMeter.location
    //         type = 'parking-meters'
    //         drawData(data, type, ParkingMeter)
    //     } else {
    //         type = 'parking-meters'
    //         drawData(null, type)
    //     } 

    //     if (shouldShowOffStreetParking) {
    //         data = offStreetParkingData['data']
    //         getLocation = OffStreetParking.location
    //         getValue = OffStreetParking.value
    //         type = 'off-street-parking'
    //         drawData(data, type, OffStreetParking)
    //     } else {
    //         type = 'off-street-parking'
    //         drawData(null, type)
    //     } 
    // }



    var drawAllData = function() {
        for(var i=0; i<globalData.length; i++) {
            var dataObj = globalData[i]

            if(dataObj.shouldShow) {
                drawData(dataObj.data, dataObj.type, dataObj.classObj)
                
                if (dataObj.type === 'intersection') {
                    addColorRange(dataObj.data, dataObj.type)
                } else {
                    addColor(dataObj.data, dataObj.type, dataObj.color)
                }
            } else {
                drawData(null, dataObj.type)
            }
        }
    }


    var getRadiusByZoom = function() {
        if (zoomLvl < 12) {
            return .5
        } else if (zoomLvl < 13) {
            return 1
        } else if (zoomLvl < 14) {
            return 3
        } else if (zoomLvl < 15) {
            return 4
        } else if (zoomLvl < 16) {
            return 5
        } else {
            return 6
        }

    }

    // eventually add multiple of overlapping layers of data 
    // how to call class methods 
    //--------------- mapping data
    var drawData = function(data, type, classObj) {
        currentClassObj = classObj
        if(!data) {
            d3.select('.data-layer').selectAll("svg."+type).remove()
            return
        }

        var marker = d3.select('.data-layer').selectAll('.'+type)
            .data(d3.entries(data))
            .each(transformLocations) // update existing markers
            .enter().append("svg")
            .each(transformLocations)
            .attr("class", type);


        // resize
        d3.select('.data-layer').selectAll('.'+type).selectAll('circle')
            .attr("r", getRadiusByZoom())

        // Add a circle.
        marker.append("circle")
            .attr("r", getRadiusByZoom())
            .attr("cx", padding)
            .attr("cy", padding)


        // propagates click events to all markers
        google.maps.event.addDomListener(marker, 'click', function() {
            google.maps.event.trigger(this, 'click');
        });

        getLocation = classObj.location
        getValue = classObj.value
        marker.on('click', function() {
            var classObj = currentClassObj
            var dataElement = d3.select(this).datum()

            // console.log(getLocation(dataElement))
            // console.log(getValue(dataElement))
        });
    };


    var addColorRange = function(data, type) {
         d3.select('.data-layer').selectAll("."+type)
            .data(d3.entries(data))
            .each(colorScale)
    }

    var addColor = function(data, type, color) {
         d3.select('.data-layer').selectAll("."+type)
            .data(d3.entries(data))
            .attr('fill', color)
    }

    var colorScale = function(d) {
        var min = 1000000,
            max = 4600000,
            colorRamp=d3.scale.log().domain([min,max]).range(["white","red"]),
            color = colorRamp(Intersection.value(d))

        d3.select(this).style('fill', color)
    }


    function transformLocations(d) {
        var location = currentClassObj.location(d),
            googleLocation = new google.maps.LatLng(location.lat, location.lng),
            mapLocation = overlay.getProjection().fromLatLngToDivPixel(googleLocation)

        d3.select(this)
            .style("left", (mapLocation.x - padding) + "px")
            .style("top", (mapLocation.y - padding) + "px")
    };





//--------------- Setting up UI elements: checkboxes, searchboxes, etc -----------------
    var createSearchBoxes = function() {

        $('.searchbox').each(function() {
            var searchBox = new google.maps.places.SearchBox(this),
                markers = [],
                searchBoxId = this.id



            searchBox.addListener('places_changed', function() {
                var places = this.getPlaces();

                if (places.length == 0) {
                    return;
                }

                // Clear out the old markers.
                markers.forEach(function(marker) {
                    marker.setMap(null);
                });
                markers = [];

                // For each place, get the icon, name and location.
                var bounds = new google.maps.LatLngBounds();

                    places.forEach(function(place) {
                        var icon = {
                                url: place.icon,
                                size: new google.maps.Size(71, 71),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(17, 34),
                                scaledSize: new google.maps.Size(25, 25)
                            }, 

                        // Create a marker for each place.
                        marker = new google.maps.Marker({
                            map: map,
                            icon: pinImage,
                            title: place.name,
                            position: place.geometry.location
                        });

                        marker.addListener('click', function() {
                            alert('clicked-' +this)
                        });
                        markers.push(marker);
                    });
                // }
            });
            searchBoxes.push(searchBox);
        });
    }()




    var listenToCheckboxes = function() {
        $("input[type='checkbox']").change(function() {
            $("input[type='checkbox']").each(function(index, element) {
               
                for(var i=0; i<globalData.length; i++) {
                    var dataObj = globalData[i]
                    if (element.id === dataObj.type) {
                        dataObj.shouldShow = element.checked
                    } 
                }

               
                
                // if (element.id === 'parking-meter') {
                //     shouldShowParkingMeters = element.checked
                // }

                // if (element.id === 'off-street-parking') {
                //     shouldShowOffStreetParking = element.checked
                // }
                // repeat for other datasets

            });
            drawAllData()
        });
    }()


//------------ loading all the data 

    var loadPedestrianIntersectionData = function() {
        d3.json("data/pedestrian_traffic_at_intersections.json", function(error, data) {
            if (error) throw error;
            intersectionData = data;


            globalData.push({
                data: data.data,
                type: 'intersection',
                classObj: Intersection,
                shouldShow: false
            })
        });
    }()

    var loadParkingMeterData = function() {
        d3.json("data/parking_meters.json", function(error, data) {
            if (error) throw error;
            parkingMeterData = data;

            globalData.push({
                data: data.data,
                type: 'parking-meter',
                classObj: ParkingMeter,
                shouldShow: false,
                color: 'blue'
            })
        });
    }()
    
    var loadOffStreetParkingData = function() {
        d3.json("data/off_street_parking.json", function(error, data) {
            if (error) throw error;
            offStreetParkingData = data;

            globalData.push({
                data: data.data,
                type: 'off-street-parking',
                classObj: OffStreetParking,
                shouldShow: false,
                color: 'green'
            })
        });
    }()


}

// ---------------------------- Data Access Methods ----------------

function Intersection () {}
Intersection.value = function(d) {
    return d.value[18]
}

Intersection.location = function(d) {
    return {
        lat: d.value[20][1],
        lng: d.value[20][2]
    }
}


function ParkingMeter () {}
ParkingMeter.location = function(d) {
    return {
        lat: d.value[23][1],
        lng: d.value[23][2]
    }
}

function OffStreetParking () {}
OffStreetParking.value = function(d) {
    return d.value[13]
}
OffStreetParking.location = function(d) {
    return {
        lat: d.value[17][1],
        lng: d.value[17][2]
    }
}








