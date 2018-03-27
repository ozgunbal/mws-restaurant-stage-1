let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  fetchNeighborhoods();
  fetchCuisines();
  if (!navigator.onLine) updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Renders DOM Element with given properties and attributes
 */
function renderElement({ type, props = {}, attributes = {} }) {
  const element = document.createElement(type);
  Object.keys(props).forEach(key => element[key] = props[key]);
  Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
  return element;
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = renderElement({
      type: 'option',
      props: { 
        innerHTML: neighborhood,
        value: neighborhood
      },
      attributes: { role: 'option' }
    });
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = renderElement({
      type: 'option',
      props: {
        innerHTML: cuisine,
        value: cuisine
      },
      attributes: { role: 'option' }
    });
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = renderElement({ type: 'li' });

  const itemChildren = [
    {
      type: 'img',
      props: {
        className: 'restaurant-img',
        src: DBHelper.imageUrlForRestaurant(restaurant),
        alt: DBHelper.imageAltTextForRestaurant(restaurant)
      }
    },
    {
      type: 'h1',
      props: { innerHTML: restaurant.name },
      attributes: { role: 'heading', tabIndex: 0 }
    },
    {
      type: 'p',
      props: { innerHTML: restaurant.neighborhood }
    },
    {
      type: 'p',
      props: { innerHTML: restaurant.address }
    },
    {
      type: 'a',
      props: {
        innerHTML: 'View Details',
        href: DBHelper.urlForRestaurant(restaurant)
      }
    }
  ];

  itemChildren.forEach(child => {
    li.append(
      renderElement(child)
    )
  });

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/**
 * Register Service Worker
 */

registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
    console.log('Service worker registration succeeded');
  }).catch(function (error) {
    console.log('Service worker registration failed: ' + error);
  })
}

document.addEventListener('keydown', function (event) {
  if (event.keyCode === 9) console.log(document.activeElement);
})