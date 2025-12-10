// Initialize Google Map
function initMap() {
    // Change these to your real location (Daffodil Smart City, etc.)
    const minionPetCare = {
        lat: 23.8771,   // example latitude
        lng: 90.3215    // example longitude
    };

    // Optional gray style (you can remove 'styles' if you don't want grayscale)
    const grayStyles = [
        {
            featureType: "all",
            stylers: [
                { saturation: -90 },
                { lightness: 50 }
            ]
        },
        {
            elementType: "labels.text.fill",
            stylers: [{ color: "#ccdee9" }]
        }
    ];

    // Create map
    const map = new google.maps.Map(document.getElementById("map"), {
        center: minionPetCare,
        zoom: 15,
        styles: grayStyles,
        scrollwheel: false
    });

    // Add a marker
    new google.maps.Marker({
        position: minionPetCare,
        map: map,
        title: "Minion Pet Care"
    });
}
