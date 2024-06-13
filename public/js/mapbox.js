window.onload = function () {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );

  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2FybG9zZ3Vpc2FvIiwiYSI6ImNseGRoeGEwNTA2cDAyaXB6cjQwMXRwcjQifQ.jrBujBOA_3LzeMoO2WBDCQ';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/carlosguisao/clxdjx94p003z01qkd8c5bf8m', // style URL
    scrollZoom: false,
    // center: [-118.113491, 34.111745], // starting position [lng, lat]
    // zoom: 12, // starting zoom
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';
    //el.style.backgroundImage = `url(${loc.image})`;

    // add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({ offset: 40 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  // Zooms the map right to the bounds to actually our markers
  map.fitBounds(bounds, {
    padding: {
      top: 150,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
