
// ----------- Global Data ------------
var shouldShowIntersections = false,
    intersectionData,
    shouldShowParkingMeters = false,
    parkingMeterData








// Create the Google Map…
function initMap() {
   

  
    
    var overlay = new google.maps.OverlayView(),
        padding = 10,
        pinColor = "75ABBC",
        searchBoxes = [],
        getLocation



    var map = function() {

          //------------ initializing the map
        var map = new google.maps.Map(d3.select("#map").node(), {
                zoom: 12,
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
                .attr("class", "incidents")

            // Remap data on every resize
            overlay.draw = function() {
                setDataSets()
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


    var setDataSets = function() {
        var data
        if (shouldShowIntersections) {
            data = intersectionData['data']
            getLocation = Intersection.location
            drawData(data)
            addColors(data)
        } else if (shouldShowParkingMeters) {
            data = parkingMeterData['data']
            getLocation = ParkingMeter.location
            drawData(data)
        } else {
            drawData()
        }
    }


    // eventually add multiple of overlapping layers of data 
    //--------------- mapping data
    var drawData = function(data) {
        if(!data) {
            d3.select('.incidents').selectAll("svg").remove()
            return
        }

        var marker = d3.select('.incidents').selectAll("svg")
            .data(d3.entries(data))
            .each(transformLocations) // update existing markers
            .enter().append("svg")
            .each(transformLocations)
            .attr("class", "marker");

        // Add a circle.
        marker.append("circle")
            .attr("r", 1.5)
            .attr("cx", padding)
            .attr("cy", padding)


        // propagates click events to all markers
        google.maps.event.addDomListener(marker, 'click', function() {
            google.maps.event.trigger(this, 'click');
        });


        marker.on('click', function() {
            var dataElement = d3.select(this).datum()

            console.log(getLocation(dataElement))
        });
    };


    var addColors = function(data) {
         d3.select('.incidents').selectAll("svg")
            .data(d3.entries(data))
            .each(colorScale)
    }

    var colorScale = function(d) {
        var min = 1000000,
            max = 4600000,
            colorRamp=d3.scale.log().domain([min,max]).range(["white","red"]),
            color = colorRamp(Intersection.value(d))

        d3.select(this).style('fill', color)
    }


    function transformLocations(d) {
        var location = getLocation(d),
            googleLocation = new google.maps.LatLng(location.lat, location.lng),
            mapLocation = overlay.getProjection().fromLatLngToDivPixel(googleLocation)

        d3.select(this)
            .style("left", (mapLocation.x - padding) + "px")
            .style("top", (mapLocation.y - padding) + "px")
    };

    //--------------- creating searchboxes
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
               
                if (element.id === 'intersections') {
                    shouldShowIntersections = element.checked
                }
                
                if (element.id === 'parking-meters') {
                    shouldShowParkingMeters = element.checked
                }
                // repeat for other datasets

            });
            setDataSets()
        });
    }()


    //------------ initializing the overlay with data 

    var loadPedestrianIntersectionData = function() {
        d3.json("data/pedestrian_traffic_at_intersections.json", function(error, data) {
            if (error) throw error;
            intersectionData = data;
        });
    }()

    var loadParkingMeterData = function() {
        d3.json("data/parking_meters.json", function(error, data) {
            if (error) throw error;
            parkingMeterData = data;
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








