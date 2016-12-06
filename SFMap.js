// Create the Google Map…
function initMap() {
   

    //------------ initializing the map
    var map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 12,
        center: new google.maps.LatLng(37.76487, -122.41948),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_TOP,
        },
        streetViewControl: false,
    });
    
    var overlay = new google.maps.OverlayView(),
        globalData,
        padding = 10,
        pinColor = "75ABBC",
        searchBoxes = [];


    //--------------- creating pins
    var createPin = function(color) {
        return new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + color,
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34));
    }

    var pinImage = createPin(pinColor) // taking off the # for the hex color


    // ------ FILTER FUNCTIONALITY ----------

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

    //--------------- mapping data
    var updateMarkers = function(data) {

        var marker = d3.select('.incidents').selectAll("svg")
            .data(d3.entries(globalData['data']))
            .each(transformLocations) // update existing markers
            .enter().append("svg")
            .each(transformLocations)
            .attr("class", "marker");

        // Add a circle.
        marker.append("circle")
            .attr("r", 1.5)
            .attr("cx", padding)
            .attr("cy", padding)

        // need to add an event listener layer to the overlay
        marker.on('click', function() {
            alert('clicked-' +this)
        });
    };

    function transformLocations(d) {
        var colorRamp=d3.scale.log().domain([1000000,4600000]).range(["white","red"]);

        var location = d.value[20],
            googleLocation = new google.maps.LatLng(location[1], location[2]),
            mapLocation = overlay.getProjection().fromLatLngToDivPixel(googleLocation)
            color = colorRamp(d.value[18])

        return d3.select(this)
            .style("left", (mapLocation.x - padding) + "px")
            .style("top", (mapLocation.y - padding) + "px")
            .style('fill', color)
    };


    function applyFilters() {
        d3.select('.incidents').selectAll("svg")
            .data(d3.entries(globalData['data']))
            .each(visualizeFilterResults); // update existing markers
        showTotal();
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
    }

    createSearchBoxes();


    //------------ initializing the overlay with data 
    d3.json("data/pedestrian_traffic_at_intersections.json", function(error, data) {
        if (error) throw error;

        globalData = data;

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function() {
            var layer = d3.select(this.getPanes().overlayLayer).append("div")
                .attr("class", "incidents");

            // Draw each marker as a separate SVG element.
            overlay.draw = function() {
                updateMarkers(data)
            };
        };

        // Bind our overlay to the map…
        overlay.setMap(map);
    });

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        for (index in searchBoxes) {
            searchBoxes[index].setBounds(map.getBounds());
        }
    });
}



