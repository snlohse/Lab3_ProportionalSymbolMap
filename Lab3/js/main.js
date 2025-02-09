var map = L.map('mymap').setView([39.8283, -98.5795], 4);  // Centered on the US

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

fetch('data/Major_city.geojson')
.then(response => response.json())
.then(data => {
    // Filter the features to only include those where "CLASS" equals 'city' and "CAPITAL" equals 'State'
    var citiesAndCapitals = data.features.filter(feature => 
        feature.properties.CLASS === 'city' && feature.properties.CAPITAL === 'State'
    );

    // Function to determine circle size based on population ranges
    function getRadius(population) {
        if (population > 1000000) {
            return 20; // Largest circle
        } else if (population >= 500000) {
            return 15;
        } else if (population >= 100000) {
            return 10;
        } else if (population >= 50000) {
            return 7;
        } else {
            return 5; // Smallest circle
        }
    }

    var circleColor = '#0000FF'; // Blue for all circles
    var activePopup = null; // Variable to track the active popup

    // Add the cities and capitals to the map with proportional symbols
    L.geoJSON(citiesAndCapitals, {
        pointToLayer: function (feature, latlng) {
            var population = feature.properties.POPULATION;
            var capitalName = feature.properties.NAME;
            var stateAbbr = feature.properties.ST; // Corrected property name
            var radius = getRadius(population);

            var marker = L.circleMarker(latlng, {
                radius: radius,
                fillColor: circleColor,
                color: circleColor,
                weight: 2,
                opacity: 1,
                fillOpacity: 0.6
            });

            // Bind popup to marker
            marker.on('click', function (e) {
                if (activePopup) {
                    map.closePopup(activePopup); // Close the previously opened popup
                }

                activePopup = L.popup()
                    .setLatLng(e.latlng)
                    .setContent(`<b>${capitalName}, ${stateAbbr}</b><br>Population: ${population.toLocaleString()}`)
                    .openOn(map);
            });

            return marker;
        }
    }).addTo(map);
})
.catch(error => console.error('Error:', error));

// Function to create a legend
var legend = L.control({ position: "bottomleft" });

legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += `
        <h4 style="text-align: center; margin-bottom: 2px; font-size: 14px;">Population Size</h4>
        <small style="display: block; text-align: center; font-size: 10px; margin-bottom: 5px;">(2020 US Census)</small>
    `;

    var populationRanges = [
        { label: "> 1,000,000", size: 20 },
        { label: "500,000 - 999,999", size: 15 },
        { label: "100,000 - 499,999", size: 10 },
        { label: "50,000 - 99,999", size: 7 },
        { label: "< 50,000", size: 5 }
    ];

    populationRanges.forEach(range => {
        let svgSize = range.size * 2.2; // Ensure the circle fits within the viewbox

        div.innerHTML += `
            <div class="legend-item" style="display: flex; align-items: center; font-size: 12px;">
                <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="margin-right: 6px;">
                    <circle cx="${svgSize / 2}" cy="${svgSize / 2}" r="${range.size}" fill="#0000FF" opacity="0.6" stroke="#0000FF" stroke-width="1.5"/>
                </svg>
                <span>${range.label}</span>
            </div>
        `;
    });

    return div;
};

legend.addTo(map);

// Add centered title in a white box
var title = L.DomUtil.create('div', 'title');
title.innerHTML = '<h3>Population of U.S. State Capitals</h3>';
document.getElementById('mymap').appendChild(title);  // Append title to map container
