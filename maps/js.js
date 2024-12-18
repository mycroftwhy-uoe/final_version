function createGlowStyle(strokeColor, glowColor, width, glowWidth) {
  return [
    new ol.style.Style({
      stroke: new ol.style.Stroke({ color: glowColor, width: glowWidth }),
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({ color: strokeColor, width: width }),
    }),
  ];
}

function createVectorLayer(url, strokeColor, glowColor) {
  return new ol.layer.Vector({
    source: new ol.source.Vector({
      url: url,
      format: new ol.format.GeoJSON(),
    }),
    style: createGlowStyle(strokeColor, glowColor, 0, 50),
    visible: false,
  });
}

const baseLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  }),
});

const boundaryLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: '/static/boundary.geojson',
    format: new ol.format.GeoJSON(),
  }),
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({ color: 'green', width: 1 }),
  }),
  visible: true,
});

const roseburnLayer = createVectorLayer('/static/roseburn.geojson', 'rgba(0, 200, 0, 0.5)', 'rgba(0, 255, 0, 0.1)');
const telfordLayer = createVectorLayer('/static/telford.geojson', 'rgba(0, 200, 0, 0.5)', 'rgba(0, 255, 0, 0.1)');
const ferryrdLayer = createVectorLayer('/static/ferryrd.geojson', 'rgba(0, 200, 0, 0.5)', 'rgba(0, 255, 0, 0.1)');
const hawthornLayer = createVectorLayer('/static/hawthorn.geojson', 'rgba(0, 200, 0, 0.5)', 'rgba(0, 255, 0, 0.1)');

const userIconLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      crossOrigin: 'anonymous',
      src: '/static/trash.png',
      scale: 0.08,
    })
  }),
  zIndex: 999
});

const birbIconLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      crossOrigin: 'anonymous',
      src: '/static/birb.png',
      scale: 0.15,
    })
  }),
  zIndex: 1000
});

const animalIconLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      crossOrigin: 'anonymous',
      src: '/static/squirrel.png',
      scale: 0.08,
    })
  }),
  zIndex: 1000
});

const treeIconLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      crossOrigin: 'anonymous',
      src: '/static/tree.png',
      scale: 0.08,
    })
  }),
  zIndex: 1000
});

const map = new ol.Map({
  target: 'map',
  layers: [
    baseLayer,
    boundaryLayer,
    roseburnLayer,
    telfordLayer,
    ferryrdLayer,
    hawthornLayer,
    userIconLayer,
    birbIconLayer,
    animalIconLayer,
    treeIconLayer
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([-3.2283783, 55.928048]),
    zoom: 11.5,
    maxZoom: 16.5,
  }),
});

const view = map.getView();
let addingIcons = false;
let addingBirbs = false;
let addingAnimals = false;
let addingTrees = false;
let popupOpen = false;

const popupElement = document.createElement('div');
popupElement.style.position = 'absolute';
document.body.appendChild(popupElement);

const popupOverlay = new ol.Overlay({
  element: popupElement,
  positioning: 'center-right',
  offset: [-360, -100],
  stopEvent: false,
});

map.addOverlay(popupOverlay);

$('#toggleAddIcon').click(function() {
  addingIcons = !addingIcons;
  addingBirbs = addingAnimals = addingTrees = false;
  $(this).toggleClass('active', addingIcons);
  $('#toggleReportBirb, #toggleReportAnimal, #toggleReportTree').removeClass('active');
});

$('#toggleReportBirb').click(function() {
  addingBirbs = !addingBirbs;
  addingIcons = addingAnimals = addingTrees = false;
  $(this).toggleClass('active', addingBirbs);
  $('#toggleAddIcon, #toggleReportAnimal, #toggleReportTree').removeClass('active');
});

$('#toggleReportAnimal').click(function() {
  addingAnimals = !addingAnimals;
  addingIcons = addingBirbs = addingTrees = false;
  $(this).toggleClass('active', addingAnimals);
  $('#toggleAddIcon, #toggleReportBirb, #toggleReportTree').removeClass('active');
});

$('#toggleReportTree').click(function() {
  addingTrees = !addingTrees;
  addingIcons = addingBirbs = addingAnimals = false;
  $(this).toggleClass('active', addingTrees);
  $('#toggleAddIcon, #toggleReportBirb, #toggleReportAnimal').removeClass('active');
});

map.on('click', function(evt) {
  if ((addingIcons || addingBirbs || addingAnimals || addingTrees) && !popupOpen) {
    const iconFeature = new ol.Feature({
      geometry: new ol.geom.Point(evt.coordinate)
    });

    if (addingIcons) {
      userIconLayer.getSource().addFeature(iconFeature);
    } else if (addingBirbs) {
      birbIconLayer.getSource().addFeature(iconFeature);
    } else if (addingAnimals) {
      animalIconLayer.getSource().addFeature(iconFeature);
    } else if (addingTrees) {
      treeIconLayer.getSource().addFeature(iconFeature);
    }

    const popupContent = addingIcons ? `
      <label for="litterGrade">Litter Grade:</label>
      <select id="litterGrade">
        <option value="">Select Grade</option>
        <option value="A">A - Very Clean</option>
        <option value="B">B - Clean</option>
        <option value="C">C - Littered</option>
        <option value="D">D - Heavily Littered</option>
      </select><br>
      <label for="infoInput">Additional Information:</label>
      <textarea id="infoInput" rows="2" cols="30" placeholder="Enter info..."></textarea><br>
      <label for="photoInput">Upload Photo:</label>
      <input type="file" id="photoInput"><br>` : `
      <label for="speciesInput">Species:</label>
      <input type="text" id="speciesInput" placeholder="Enter species..."><br>
      <label for="photoInput">Upload Photo:</label>
      <input type="file" id="photoInput"><br>`;

    popupElement.innerHTML = `
      <div class="${addingIcons ? 'litter-popup' : addingBirbs ? 'birb-popup' : addingAnimals ? 'animal-popup' : 'tree-popup'} fadeIn">
        <h4>Add ${addingIcons ? "Litter" : addingBirbs ? "Bird" : addingAnimals ? "Animal" : "Tree"} Information</h4>
        ${popupContent}
        <button id="saveInfo">Save</button>
        <button id="cancelInfo">Cancel</button>
      </div>
    `;

    popupOverlay.setPosition(evt.coordinate);
    map.getView().animate({ center: evt.coordinate, duration: 500 });
    popupOpen = true;

    $('#saveInfo').click(function() {
      const photoFile = $('#photoInput')[0].files[0];

      if (addingIcons) {
        const grade = $('#litterGrade').val();
        const additionalInfo = $('#infoInput').val();
        iconFeature.set('grade', grade);
        iconFeature.set('additionalInfo', additionalInfo);
      } else if (addingBirbs || addingAnimals || addingTrees) {
        const species = $('#speciesInput').val();
        iconFeature.set('species', species);
      }

      if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
          iconFeature.set('photo', e.target.result);
        };
        reader.readAsDataURL(photoFile);
      }

      closePopup();
    });

    $('#cancelInfo').click(function() {
      if (addingIcons) {
        userIconLayer.getSource().removeFeature(iconFeature);
      } else if (addingBirbs) {
        birbIconLayer.getSource().removeFeature(iconFeature);
      } else if (addingAnimals) {
        animalIconLayer.getSource().removeFeature(iconFeature);
      } else if (addingTrees) {
        treeIconLayer.getSource().removeFeature(iconFeature);
      }
      closePopup();
    });

  } else {
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      if ([userIconLayer, birbIconLayer, animalIconLayer, treeIconLayer].includes(layer)) {
        const coordinate = feature.getGeometry().getCoordinates();

        popupOverlay.setPosition(coordinate);
        map.getView().animate({ center: coordinate, duration: 500 });

        const grade = feature.get('grade');
        const additionalInfo = feature.get('additionalInfo');
        const species = feature.get('species');
        const photo = feature.get('photo');

        popupElement.innerHTML = `
          <div class="savedPopup fadeIn">
            <button id="closePopup" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
            <h3>${layer === birbIconLayer ? "Bird sighting!" : layer === animalIconLayer ? "Animal sighting!" : layer === treeIconLayer ? "Tree sighting!" : "Litter"}</h3>
            ${grade ? `<p><strong>Grade:</strong> ${grade}</p>` : ''}
            ${additionalInfo ? `<p><strong>Additional Info:</strong> ${additionalInfo}</p>` : ''}
            ${species ? `<p><strong>Species:</strong> ${species}</p>` : ''}
            ${photo ? `<img src="${photo}" alt="Uploaded Photo" style="max-width:100%; height:auto;"><br>` : ''}
            <button id="deleteFeature">Delete</button>
          </div>
        `;

        $('#closePopup').click(function() {
          closePopup();
        });

        $('#deleteFeature').click(function() {
          layer.getSource().removeFeature(feature);
          closePopup();
        });

        return true;
      }
    });
  }
});

function closePopup() {
  popupOverlay.setPosition(undefined);
  popupOpen = false;
  addingIcons = addingBirbs = addingAnimals = addingTrees = false;
  $('#toggleAddIcon, #toggleReportBirb, #toggleReportAnimal, #toggleReportTree').removeClass('active');
}

function getGeometryCenter(geometry) {
  if (geometry.getType() === 'Polygon') {
    return geometry.getInteriorPoint().getCoordinates();
  } else if (geometry.getType() === 'LineString') {
    return geometry.getCoordinateAt(0.5);
  }
  return geometry.getFirstCoordinate();
}

function animateLayer(layer) {
  let start = Date.now();
  const duration = 500;

  function animate() {
    const elapsed = Date.now() - start;
    const ratio = Math.min(elapsed / duration, 1);
    const styles = layer.getStyle();

    if (styles && styles[1]) {
      styles[1].getStroke().setWidth(ratio * 10);
      layer.setStyle(styles);
    }

    if (ratio < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

function toggleLayer(layer, button) {
  const isVisible = layer.getVisible();
  layer.setVisible(!isVisible);
  $(button).toggleClass('active');
  if (!isVisible) {
    animateLayer(layer);
  }
}

$('#toggleBoundary').click(function() {
  toggleLayer(boundaryLayer, this);
});

$('#toggleRoseburn').click(function() {
  toggleLayer(roseburnLayer, this);
});

$('#toggleTelford').click(function() {
  toggleLayer(telfordLayer, this);
});

$('#toggleFerryRd').click(function() {
  toggleLayer(ferryrdLayer, this);
});

$('#toggleHawthorn').click(function() {
  toggleLayer(hawthornLayer, this);
});

let allVisible = false;

$('#toggleAllOff').click(function() {
  allVisible = !allVisible;
  [roseburnLayer, telfordLayer, ferryrdLayer, hawthornLayer].forEach(layer => {
    layer.setVisible(allVisible);
    if (allVisible) {
      animateLayer(layer);
    }
  });
  $(this).toggleClass('active', allVisible);
  $('#layer-select-tabs button')
    .not('#toggleAddIcon, #toggleBoundary, #toggleReportBirb, #toggleReportAnimal, #toggleReportTree')
    .toggleClass('active', allVisible);
});

$("#hide-layer-panel span").click(function() {
  $("#layer-select-tabs").hide(500);
  $("#show-layer-panel").show();
  $("#hide-layer-panel").hide();
});

$("#show-layer-panel span").click(function() {
  $("#layer-select-tabs").show(500);
  $("#hide-layer-panel").show();
  $("#show-layer-panel").hide();
});

const highlightedFeatures = new ol.Collection();
const featureOverlay = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: highlightedFeatures,
  }),
  map: map,
  style: function(feature) {
    return pulsingStyle(feature.get('pulseScale') || 1);
  }
});

function pulsingStyle(scale) {
  return new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#355e3b',
      width: 10 * scale
    }),
    zIndex: 1
  });
}

function pulseFeature(feature) {
  let scale = 1;
  let growing = true;

  function animate() {
    scale = growing ? scale + 0.01 : scale - 0.01;

    if (scale >= 1.5) growing = false;
    if (scale <= 1) growing = true;

    feature.set('pulseScale', scale);
    featureOverlay.changed();

    requestAnimationFrame(animate);
  }

  animate();
}

map.on('pointermove', function(evt) {
  let featureFound = false;
  map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
    if ([roseburnLayer, telfordLayer, ferryrdLayer, hawthornLayer].includes(layer)) {
      highlightedFeatures.clear();
      highlightedFeatures.push(feature);
      pulseFeature(feature);
      featureFound = true;
      return true;
    }
  });

  if (!featureFound) {
    highlightedFeatures.clear();
  }
});
