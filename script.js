// Function to create a visualization
function createVisualization(container, spec, dataFile) {
    // Fetch the data from the JSON file
    fetch(dataFile)
    .then(response => response.json())
    .then(data => {
        // Merge the data with the Vega-Lite specification
        const fullSpec = {...spec, data: { values: data }};
        // Embed the Vega-Lite visualization in the specified container
        vegaEmbed(container, fullSpec);
    })
    .catch(error => console.error('Error:', error));
}

// Vega-Lite specification for the first visualization
const vis1Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": "Interactive Multi-Line series Plot of Chicago Crime Data",
    "width": 800,
    "height": 500,
    "mark": "line",
    "encoding": {
        "x": {
            "field": "Month",
            "type": "ordinal",
            "title": "Month",
            "axis": {"labelAngle": 45, "labelOverlap": true}
        },
        "y": {
            "field": "Crime Count",
            "type": "quantitative",
            "title": "Number of Crimes",
            "scale": {"zero": true}
        },
        "color": {
            "field": "Region",
            "type": "nominal",
            "title": "Region"
        }
    },
    "transform": [
        {
            "calculate": "year(datum.Month)",
            "as": "Year"
        },
        {
            "filter": {"selection": "Year"}
        }
    ],
    "selection": {
        "Year": {
            "type": "single",
            "fields": ["Year"],
            "bind": {"input": "range", "min": 2001, "max": 2022, "step": 1, "name": "Year"}
        }
    },
    "config": {
        "view": {"stroke": "transparent"},
        "axis": {"domainWidth": 1}
    }
};

// Vega-Lite specification for the second visualization
const vis2Spec = {
    "vconcat": [{
        "width": 800,
        "mark": "area",
        "encoding": {
            "x": {
                "field": "Date",
                "type": "temporal",
                "scale": {"domain": {"selection": "brush"}},
                "axis": {"title": ""}
            },
            "y": {"field": "Crime Count", "type": "quantitative"}
        }
    }, {
        "width": 800,
        "height": 100,
        "mark": "area",
        "selection": {
            "brush": {"type": "interval", "encodings": ["x"]}
        },
        "encoding": {
            "x": {
                "field": "Date",
                "type": "temporal"
            },
            "y": {
                "field": "Crime Count",
                "type": "quantitative",
                "axis": {"tickCount": 10}
            }
        }
    }]
};

// Load and create visualizations
createVisualization('#vis1', vis1Spec, 'data/crimes_by_regions.json');
createVisualization('#vis2', vis2Spec, 'data/overview_crimes.json');


// Populate the ward and year dropdowns for vis3
const wardDropdown = document.getElementById('ward-dropdown');
const yearDropdown = document.getElementById('year-dropdown');
const wards = [3, 11, 7, 15, 16, 21, 37, 20, 27, 1, 22, 17, 28, 5, 6, 4, 10, 9, 29, 2, 46, 26, 14, 44, 41, 40, 33, 8, 38, 13, 23, 45, 47, 34, 19, 36, 42, 35, 24, 32, 43, 49, 39, 48, 30, 25, 18, 12, 50, 31]; 
const years = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];  

wards.forEach(ward => {
    let option = document.createElement('option');
    option.value = ward;
    option.text = ward;
    wardDropdown.appendChild(option);
});

years.forEach(year => {
    let option = document.createElement('option');
    option.value = year;
    option.text = year;
    yearDropdown.appendChild(option);
});

// Function to update the linked view visualization
function updateLinkedView(crimeType, selectedWard, selectedYear) {
    const formattedCrimeType = crimeType.replace(/ /g, "_");
    // Fetch data for the selected crime type
    fetch(`data/hourly_crimes_ward_${selectedWard}.0_year_${selectedYear}_${formattedCrimeType}.json`)
    .then(response => response.json())
    .then(data => {
        const linkedVisSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {"values": data},
            "mark": "bar",
            "width": 500,
            "height": 500,
            "encoding": {
            "x": {"field": "Hour", "type": "ordinal", "title": "Hour of Day"},
            "y": {"field": "Count", "type": "quantitative", "title": "Number of Occurrences"},
            "color": {
                "field": "Count",
                "type": "quantitative",
                "scale": { "scheme": "yellowgreen"}
              },
            },
            "tooltip": [{"field": "Crime Type", "type": "nominal"}, {"field":
            "Count", "type": "quantitative"}],
            "title": "Total cases of " +crimeType+ " by Hour of the Day"
        }
        vegaEmbed('#linkedVis', linkedVisSpec);
    })
    .catch(error => console.error('Error:', error));
}

// Function to update Visualization 3
function updateVis3() {
    const selectedWard = wardDropdown.value;
    const selectedYear = yearDropdown.value;
    fetch(`data/ward_top_crimes_${selectedWard}_${selectedYear}.json`)
    .then(response => response.json())
    .then(data => {
        const vis3Spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "mark": "bar",
            "width": 500,
            "height": 500,
            // Vega-Lite specification for vis3
            "data": {"values": data},
            "encoding": {
                "x": {"field": "Primary Type", "type": "nominal", "sort": "-y"},
                "y": {"field": "Count", "type": "quantitative"},
                "color": {
                    "field": "Count",
                    "type": "quantitative",
                    "scale":{ "scheme": "yelloworangered"}
                  },
                "tooltip": [{"field": "Primary Type", "type": "nominal"}, {"field": "Count", "type": "quantitative"}],
            },
            "config": {"view": {"stroke": ""}},
            "title": "Crime counts of top 10 crime types",
            "selection": {
                "barSelect": {"type": "single", "encodings": ["x"], "on": "click"}
            }
        };
        vegaEmbed('#vis3', vis3Spec).then((res) => {
            res.view.addEventListener('click', function(event, item) {
                if (item && item.datum) {
                    updateLinkedView(item.datum["Primary Type"], selectedWard, selectedYear);
                }
            });
        });
    })
    .catch(error => console.error('Error:', error));
}

wardDropdown.addEventListener('change', updateVis3);
yearDropdown.addEventListener('change', updateVis3);

// Create buttons and update function for vis4
const buttonContainer = document.getElementById('button-container');
years.forEach(year => {
    let button = document.createElement('button');
    button.textContent = year;
    button.onclick = () => updateVis4(year);
    buttonContainer.appendChild(button);
});

function updateVis4(selectedYear) {
    fetch(`data/location_counts_${selectedYear}.json`)
    .then(response => response.json())
    .then(data => {
        const vis4Spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "mark": "bar",
            // Vega-Lite specification for vis4
            "data": {"values": data},
            "width": 800,
            "height": 400,
            "encoding": {
                "x": {"field": "Location Description", "type": "nominal"},
                "y": {"field": "Count", "type": "quantitative"},
                "column": {"field": "Date:O", "title": "Year"},
                "tooltip": [{"field": "Location Description", "type": "nominal"}, {"field": "Count", "type": "quantitative"}],
                "color": {"field": "Location Description", "type": "nominal"},
            },
            "title": "Top 5 Location Descriptions by Count (Grouped Bar Chart)",
            "config": {"view": {"stroke": ""}, "axis": {"labelAngle": 0}},
        };
        vegaEmbed('#vis4', vis4Spec);
    })
    .catch(error => console.error('Error:', error));
}

// Function to create a geospatial visualization
function createGeoVisualization(container, geoJsonFile, dataFile, spec) {
    Promise.all([
        fetch(geoJsonFile).then(response => response.json()),
        fetch(dataFile).then(response => response.json())
    ])
    .then(([geoData, crimeData]) => {
        const fullSpec = {
            ...spec,
            layer: [
                { ...spec.layer[0], data: { values: geoData }},
                { ...spec.layer[1], data: { values: crimeData }}
            ]
        };
        vegaEmbed(container, fullSpec);
    })
    .catch(error => console.error('Error:', error));
}

// Vega-Lite specification for Visualization 5
const vis5Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
    "width": 650,
    "height": 650,
    "title": "Arrests in Chicago",
    "layer": [
        {
            "projection": {"type": "mercator"},
            "mark": {
                "type": "geoshape",
                "fill": "#253342",
                "stroke": "white",
                "strokeWidth": 0.8
            }
        },
        {
            "mark": {
                "type": "circle",
                "size": 3,
                "color": "#CCFF00",
                "opacity": 0.9
            },
            "encoding": {
                "longitude": {"field": "Longitude", "type": "quantitative"},
                "latitude": {"field": "Latitude", "type": "quantitative"},
                "tooltip": [
                    {"field": "Primary Type", "title": "Primary Type"},
                    {"field": "Description", "title": "Description"}
                ]
            }
        }
    ]
};

// Populate the year dropdown for Visualization 5
const yearDropdownGeo = document.getElementById('year-dropdown-geo');
for (let year = 2001; year <= 2023; year++) {  // Adjusted to include 2023
    let option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearDropdownGeo.appendChild(option);
}


// Function to update Visualization 5 based on the selected year
function updateVis5(selectedYear) {
    createGeoVisualization('#vis5', 'data/Boundaries.geojson', `data/crimes_data_${selectedYear}.json`, vis5Spec);
}

// Initial load of Visualization 5
updateVis5(yearDropdownGeo.value);

// Event listener for year dropdown
yearDropdownGeo.addEventListener('change', () => {
    updateVis5(yearDropdownGeo.value);
});
